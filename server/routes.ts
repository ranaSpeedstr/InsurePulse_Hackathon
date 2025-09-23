import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { alerts, email_notifications, client_time_series, forecast_predictions, clients, sentiment_analysis, conversations, emails } from "../shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { triggerDetectionService } from "./trigger-detection";
import { forecastService } from "./forecast-service";
import { clientInsightsService } from "./client-insights-service";
import { assetWatcher } from "./asset-watcher";
import { alertAnalysisService } from "./alert-analysis-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard Analytics Routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/at-risk-clients", async (req, res) => {
    try {
      const atRiskClients = await storage.getAtRiskClientsList();
      res.json(atRiskClients);
    } catch (error) {
      console.error("Error fetching at-risk clients:", error);
      res.status(500).json({ error: "Failed to fetch at-risk clients" });
    }
  });

  app.get("/api/dashboard/benchmarking", async (req, res) => {
    try {
      const benchmarkingData = await storage.getClientBenchmarkingData();
      res.json(benchmarkingData);
    } catch (error) {
      console.error("Error fetching benchmarking data:", error);
      res.status(500).json({ error: "Failed to fetch benchmarking data" });
    }
  });

  app.get("/api/dashboard/sentiment-distribution", async (req, res) => {
    try {
      // Get basic sentiment distribution first, then enhance with client data
      const sentimentCounts = await db
        .select({
          label: sentiment_analysis.sentiment_label,
          count: count(sentiment_analysis.id),
        })
        .from(sentiment_analysis)
        .groupBy(sentiment_analysis.sentiment_label);

      // Get detailed sentiment with client context (separate query to avoid complex joins)
      const sentimentWithClients = await db
        .select({
          label: sentiment_analysis.sentiment_label,
          contentType: sentiment_analysis.content_type,
          analysisMethod: sentiment_analysis.analysis_method,
          confidence: sentiment_analysis.confidence,
          createdAt: sentiment_analysis.created_at,
          contentId: sentiment_analysis.content_id,
        })
        .from(sentiment_analysis);

      // Enrich with client data by looking up conversations and emails separately
      const enrichedSentimentData = [];
      for (const item of sentimentWithClients) {
        let clientId = null;
        let clientName = 'Unknown Client';

        if (item.contentType === 'conversation') {
          const conv = await db.select({ client_id: conversations.client_id })
            .from(conversations)
            .where(eq(conversations.id, item.contentId))
            .limit(1);
          if (conv.length > 0) {
            clientId = conv[0].client_id;
            
            // Get client name
            const client = await db.select({ primary_contact: clients.primary_contact })
              .from(clients)
              .where(eq(clients.client_id, clientId))
              .limit(1);
            if (client.length > 0) {
              clientName = client[0].primary_contact;
            }
          }
        } else if (item.contentType === 'email') {
          const email = await db.select({ client_id: emails.client_id })
            .from(emails)
            .where(eq(emails.id, item.contentId))
            .limit(1);
          if (email.length > 0 && email[0].client_id) {
            clientId = email[0].client_id;
            
            // Get client name
            const client = await db.select({ primary_contact: clients.primary_contact })
              .from(clients)
              .where(eq(clients.client_id, clientId))
              .limit(1);
            if (client.length > 0) {
              clientName = client[0].primary_contact;
            }
          }
        }

        enrichedSentimentData.push({
          ...item,
          clientId,
          clientName
        });
      }

      // Calculate totals and percentages
      const totalAnalyzed = sentimentCounts.reduce((sum, item) => sum + item.count, 0);

      if (totalAnalyzed === 0) {
        // Return consistent object structure even when no data
        const defaultData = [
          { name: "Positive", value: 0, color: "#22c55e", count: 0 },
          { name: "Neutral", value: 0, color: "hsl(var(--chart-3))", count: 0 },
          { name: "Negative", value: 0, color: "#ef4444", count: 0 }
        ];
        
        const responseData = {
          data: defaultData,
          metadata: {
            totalAnalyzed: 0,
            lastUpdated: new Date().toISOString(),
            analysisTypes: [],
            // Client-specific metadata for no data case
            clientBreakdown: [],
            totalClients: 0,
            recentActivity: 0,
            sources: { conversations: 0, emails: 0 },
            averageConfidence: 0
          }
        };
        
        return res.json(responseData);
      }

      // Map database labels to display format and calculate percentages
      const sentimentMap = {
        positive: { name: "Positive", color: "#22c55e" },
        neutral: { name: "Neutral", color: "hsl(var(--chart-3))" }, 
        negative: { name: "Negative", color: "#ef4444" }
      };

      // Initialize result with all sentiment types
      const result = Object.entries(sentimentMap).map(([key, config]) => ({
        name: config.name,
        value: 0,
        color: config.color,
        count: 0
      }));

      // Fill in actual data
      sentimentCounts.forEach(item => {
        const key = item.label.toLowerCase() as keyof typeof sentimentMap;
        if (sentimentMap[key]) {
          const sentimentIndex = result.findIndex(r => r.name === sentimentMap[key].name);
          if (sentimentIndex >= 0) {
            result[sentimentIndex].count = item.count;
            result[sentimentIndex].value = Math.round((item.count / totalAnalyzed) * 100);
          }
        }
      });

      // Create client breakdown for metadata
      const clientBreakdown = sentimentWithClients.reduce((acc, item) => {
        if (!item.clientId) return acc;
        
        if (!acc[item.clientId]) {
          acc[item.clientId] = {
            clientId: item.clientId,
            clientName: item.clientName,
            conversations: 0,
            emails: 0,
            totalItems: 0,
            sentiments: { positive: 0, neutral: 0, negative: 0 }
          };
        }
        
        acc[item.clientId].totalItems++;
        acc[item.clientId][item.contentType === 'conversation' ? 'conversations' : 'emails']++;
        acc[item.clientId].sentiments[item.label.toLowerCase() as keyof typeof acc[typeof item.clientId]['sentiments']]++;
        
        return acc;
      }, {} as Record<string, any>);

      // Get recent activity (last 24 hours)
      const recentActivity = sentimentWithClients.filter(item => 
        item.createdAt && new Date(item.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length;

      // Add metadata for frontend use with client-specific information
      const responseData = {
        data: result,
        metadata: {
          totalAnalyzed,
          lastUpdated: new Date().toISOString(),
          analysisTypes: sentimentCounts.map(item => ({
            label: item.label,
            count: item.count,
            percentage: Math.round((item.count / totalAnalyzed) * 100)
          })),
          // Client-specific metadata
          clientBreakdown: Object.values(clientBreakdown),
          totalClients: Object.keys(clientBreakdown).length,
          recentActivity,
          sources: {
            conversations: sentimentWithClients.filter(s => s.contentType === 'conversation').length,
            emails: sentimentWithClients.filter(s => s.contentType === 'email').length
          },
          averageConfidence: Math.round(
            sentimentWithClients.reduce((sum, item) => sum + (item.confidence || 0), 0) / 
            sentimentWithClients.length * 100
          ) / 100 || 0
        }
      };

      console.log(`[Routes] Client-based sentiment distribution: ${totalAnalyzed} total analyzed from ${Object.keys(clientBreakdown).length} clients`);
      res.json(responseData);
    } catch (error) {
      console.error("Error fetching sentiment distribution:", error);
      res.status(500).json({ error: "Failed to fetch sentiment distribution" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.get("/api/clients/:id/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversationsByClient(req.params.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/clients/:id/insights", async (req, res) => {
    const clientId = req.params.id;
    const forceRefresh = req.query.forceRefresh === 'true';
    
    try {
      console.log(`[Routes] Generating insights for client ${clientId}${forceRefresh ? ' (force refresh)' : ''}`);
      
      // Set a timeout for the entire request (30 seconds) with proper cleanup
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout - insights generation took too long')), 30000);
      });
      
      // Race between the actual insights generation and timeout
      const insightsPromise = clientInsightsService.generateClientInsights(clientId, forceRefresh);
      
      try {
        const insights = await Promise.race([insightsPromise, timeoutPromise]);
        clearTimeout(timeoutId); // Clean up timeout on success
        res.json(insights);
      } catch (error) {
        clearTimeout(timeoutId); // Clean up timeout on failure
        throw error;
      }
    } catch (error) {
      console.error(`[Routes] Error generating client insights for ${clientId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        res.status(404).json({ error: `Client ${clientId} not found` });
      } else if (errorMessage.includes('timeout')) {
        res.status(408).json({ 
          error: "Request timeout",
          message: "Insights generation is taking longer than expected. Please try again in a few minutes or check if OpenAI service is available.",
          clientId
        });
      } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        res.status(429).json({ 
          error: "API quota exceeded",
          message: "OpenAI API quota has been exceeded. Please check your OpenAI account billing or try again later.",
          clientId
        });
      } else {
        res.status(500).json({ 
          error: "Failed to generate client insights",
          details: errorMessage,
          clientId
        });
      }
    }
  });

  // Asset-based data routes (from attached_assets folder)
  app.get("/api/assets/profiles", async (req, res) => {
    try {
      const cachedData = assetWatcher.getCachedData();
      if (cachedData) {
        res.json(cachedData.profiles);
      } else {
        // If no cached data, try to refresh
        const refreshedData = await assetWatcher.refresh();
        res.json(refreshedData?.profiles || {});
      }
    } catch (error) {
      console.error("Error fetching asset profiles:", error);
      res.status(500).json({ error: "Failed to fetch client profiles from assets" });
    }
  });

  app.get("/api/assets/feedback", async (req, res) => {
    try {
      const cachedData = assetWatcher.getCachedData();
      if (cachedData) {
        res.json(cachedData.feedback);
      } else {
        // If no cached data, try to refresh
        const refreshedData = await assetWatcher.refresh();
        res.json(refreshedData?.feedback || {});
      }
    } catch (error) {
      console.error("Error fetching asset feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback data from assets" });
    }
  });

  app.get("/api/assets/metrics", async (req, res) => {
    try {
      const cachedData = assetWatcher.getCachedData();
      if (cachedData) {
        res.json(cachedData.metrics);
      } else {
        // If no cached data, try to refresh
        const refreshedData = await assetWatcher.refresh();
        res.json(refreshedData?.metrics || {});
      }
    } catch (error) {
      console.error("Error fetching asset metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics data from assets" });
    }
  });

  app.post("/api/assets/refresh", async (req, res) => {
    try {
      console.log("[Routes] Manual refresh of asset data requested");
      const refreshedData = await assetWatcher.refresh();
      res.json({
        success: true,
        message: "Asset data refreshed successfully",
        data: refreshedData
      });
    } catch (error) {
      console.error("Error refreshing asset data:", error);
      res.status(500).json({ error: "Failed to refresh asset data" });
    }
  });

  // Alerts and notifications routes
  
  // Alert Analysis Routes (must come BEFORE /api/alerts/:id to avoid route conflicts)
  app.post("/api/alerts/analyze", async (req, res) => {
    try {
      console.log("[Routes] Triggering manual alert analysis...");
      const alertsGenerated = await alertAnalysisService.analyzeClientMetrics();
      const stats = await alertAnalysisService.getAlertStats();
      
      res.json({ 
        message: "Alert analysis completed successfully",
        alertsGenerated,
        currentStats: stats
      });
    } catch (error) {
      console.error("Error during alert analysis:", error);
      res.status(500).json({ error: "Failed to analyze alerts" });
    }
  });

  app.get("/api/alerts/stats", async (req, res) => {
    try {
      const stats = await alertAnalysisService.getAlertStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching alert stats:", error);
      res.status(500).json({ error: "Failed to fetch alert stats" });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const alertsList = await db.select().from(alerts).orderBy(desc(alerts.detected_at));
      res.json(alertsList);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/:id", async (req, res) => {
    try {
      const [alert] = await db.select().from(alerts).where(eq(alerts.id, req.params.id));
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error fetching alert:", error);
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  app.post("/api/alerts/:id/acknowledge", async (req, res) => {
    try {
      const { action } = req.body;
      if (!action || !['Acknowledged', 'Resolved'].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'Acknowledged' or 'Resolved'" });
      }

      const success = await triggerDetectionService.acknowledgeAlert(req.params.id, action);
      if (success) {
        res.json({ message: `Alert ${action.toLowerCase()} successfully` });
      } else {
        res.status(404).json({ error: "Alert not found or failed to update" });
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  app.get("/api/email-notifications", async (req, res) => {
    try {
      const notifications = await db.select()
        .from(email_notifications)
        .orderBy(desc(email_notifications.sent_at));
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching email notifications:", error);
      res.status(500).json({ error: "Failed to fetch email notifications" });
    }
  });

  // Forecast routes
  app.get("/api/forecast/clients", async (req, res) => {
    try {
      const clientsList = await db.select({
        client_id: clients.client_id,
        primary_contact: clients.primary_contact,
        region: clients.region,
        industry: clients.industry
      }).from(clients).orderBy(clients.client_id);
      res.json(clientsList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/forecast/:clientId/historical", async (req, res) => {
    try {
      const { clientId } = req.params;
      const historicalData = await db.select()
        .from(client_time_series)
        .where(eq(client_time_series.client_id, clientId))
        .orderBy(client_time_series.date);
      
      res.json(historicalData.map(d => ({
        date: d.date.toISOString().split('T')[0],
        sentiment_score: d.sentiment_score,
        churn_probability: d.churn_probability,
        satisfaction_score: d.satisfaction_score,
        issue_count: d.issue_count,
        escalation_count: d.escalation_count
      })));
    } catch (error) {
      console.error("Error fetching historical data:", error);
      res.status(500).json({ error: "Failed to fetch historical data" });
    }
  });

  app.post("/api/forecast/:clientId/generate", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { type, periods } = req.body;
      
      if (!type || !['sentiment', 'churn'].includes(type)) {
        return res.status(400).json({ error: "Invalid forecast type. Must be 'sentiment' or 'churn'" });
      }

      let forecast;
      if (type === 'sentiment') {
        forecast = await forecastService.generateSentimentForecast(clientId, periods || 6);
      } else {
        forecast = await forecastService.generateChurnForecast(clientId, periods || 2);
      }

      res.json(forecast);
    } catch (error) {
      console.error("Error generating forecast:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: "Failed to generate forecast: " + errorMessage });
    }
  });

  app.get("/api/forecast/:clientId/predictions", async (req, res) => {
    try {
      const { clientId } = req.params;
      let { type } = req.query;
      
      // Handle aliases and provide default
      if (type === 'churn') {
        type = 'churn_risk';
      } else if (!type) {
        type = 'sentiment'; // default
      }
      
      if (!['sentiment', 'churn_risk'].includes(type as string)) {
        return res.status(400).json({ error: "Invalid forecast type. Must be 'sentiment', 'churn', or 'churn_risk'" });
      }

      const predictions = await forecastService.getStoredForecasts(clientId, type as 'sentiment' | 'churn_risk');
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  app.post("/api/forecast/sample-data", async (req, res) => {
    try {
      await forecastService.generateSampleData();
      res.json({ message: "Sample data generated successfully" });
    } catch (error) {
      console.error("Error generating sample data:", error);
      res.status(500).json({ error: "Failed to generate sample data" });
    }
  });

  // CSV-based forecast routes
  app.get("/api/forecast-csv/all", async (req, res) => {
    try {
      const forecasts = forecastService.getCSVClientForecasts();
      res.json(forecasts);
    } catch (error) {
      console.error("Error fetching CSV forecasts:", error);
      res.status(500).json({ error: "Failed to fetch CSV forecasts" });
    }
  });

  app.get("/api/forecast-csv/summary", async (req, res) => {
    try {
      const summary = forecastService.getCSVForecastSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching CSV forecast summary:", error);
      res.status(500).json({ error: "Failed to fetch CSV forecast summary" });
    }
  });

  app.get("/api/forecast-csv/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const forecast = forecastService.getCSVClientForecast(clientId);
      
      if (!forecast) {
        return res.status(404).json({ error: "Client not found in CSV data" });
      }
      
      res.json(forecast);
    } catch (error) {
      console.error("Error fetching CSV forecast for client:", error);
      res.status(500).json({ error: "Failed to fetch CSV forecast for client" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
