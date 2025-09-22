import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { alerts, email_notifications, client_time_series, forecast_predictions, clients } from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { triggerDetectionService } from "./trigger-detection";
import { forecastService } from "./forecast-service";
import { clientInsightsService } from "./client-insights-service";

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
    try {
      const clientId = req.params.id;
      console.log(`[Routes] Generating insights for client ${clientId}`);
      
      const insights = await clientInsightsService.generateClientInsights(clientId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating client insights:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        res.status(404).json({ error: `Client ${req.params.id} not found` });
      } else {
        res.status(500).json({ 
          error: "Failed to generate client insights",
          details: errorMessage
        });
      }
    }
  });

  // Alerts and notifications routes
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

  const httpServer = createServer(app);

  return httpServer;
}
