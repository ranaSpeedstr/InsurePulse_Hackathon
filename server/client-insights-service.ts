import OpenAI from 'openai';
import { db } from './db';
import { 
  clients, 
  client_metrics, 
  client_retention, 
  sentiment_analysis, 
  alerts, 
  forecast_predictions,
  conversations,
  emails 
} from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { ClientInsights, AIInsightItem, ActionItem } from '../shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ClientDataSnapshot {
  profile: any;
  metrics: any;
  retention: any;
  sentimentAnalysis: any[];
  recentAlerts: any[];
  forecasts: any[];
  conversations: any[];
  recentEmails: any[];
}

export class ClientInsightsService {

  /**
   * Generate comprehensive AI insights for a specific client
   */
  public async generateClientInsights(clientId: string): Promise<ClientInsights> {
    try {
      // Aggregate all available client data
      const clientData = await this.aggregateClientData(clientId);
      
      if (!clientData.profile) {
        throw new Error(`Client ${clientId} not found`);
      }

      // Generate insights using OpenAI GPT-4
      const aiInsights = await this.analyzeWithOpenAI(clientId, clientData);
      
      return aiInsights;
    } catch (error) {
      console.error(`[ClientInsights] Error generating insights for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Aggregate all available data for a client from multiple tables
   */
  private async aggregateClientData(clientId: string): Promise<ClientDataSnapshot> {
    try {
      // Get client profile
      const [clientProfile] = await db
        .select()
        .from(clients)
        .where(eq(clients.client_id, clientId));

      // Get client metrics (performance data)
      const [clientMetrics] = await db
        .select()
        .from(client_metrics)
        .where(eq(client_metrics.client_id, clientId));

      // Get client retention data
      const [clientRetention] = await db
        .select()
        .from(client_retention)
        .where(eq(client_retention.client_id, clientId));

      // Get recent sentiment analysis
      const recentSentiment = await db
        .select()
        .from(sentiment_analysis)
        .where(eq(sentiment_analysis.content_id, clientId))
        .orderBy(desc(sentiment_analysis.created_at))
        .limit(10);

      // Get recent alerts for this client
      const recentAlerts = await db
        .select()
        .from(alerts)
        .where(eq(alerts.client_id, clientId))
        .orderBy(desc(alerts.detected_at))
        .limit(5);

      // Get recent forecast predictions
      const recentForecasts = await db
        .select()
        .from(forecast_predictions)
        .where(eq(forecast_predictions.client_id, clientId))
        .orderBy(desc(forecast_predictions.created_at))
        .limit(10);

      // Get recent conversations
      const recentConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.client_id, clientId))
        .orderBy(desc(conversations.created_at))
        .limit(5);

      // Get recent emails
      const recentEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.client_id, clientId))
        .orderBy(desc(emails.email_date))
        .limit(5);

      return {
        profile: clientProfile,
        metrics: clientMetrics,
        retention: clientRetention,
        sentimentAnalysis: recentSentiment,
        recentAlerts: recentAlerts,
        forecasts: recentForecasts,
        conversations: recentConversations,
        recentEmails: recentEmails
      };
    } catch (error) {
      console.error(`[ClientInsights] Error aggregating data for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Use OpenAI GPT-4 to analyze client data and generate actionable insights
   */
  private async analyzeWithOpenAI(clientId: string, data: ClientDataSnapshot): Promise<ClientInsights> {
    const prompt = `As a CSD (Customer Success Director) AI assistant, analyze this comprehensive client data and provide detailed, actionable insights for client relationship management and churn prevention.

CLIENT DATA FOR ANALYSIS:
=========================

Client Profile:
${JSON.stringify(data.profile, null, 2)}

Performance Metrics:
${JSON.stringify(data.metrics, null, 2)}

Retention Data:
${JSON.stringify(data.retention, null, 2)}

Recent Sentiment Analysis (${data.sentimentAnalysis.length} records):
${JSON.stringify(data.sentimentAnalysis.slice(0, 5), null, 2)}

Recent Alerts (${data.recentAlerts.length} alerts):
${JSON.stringify(data.recentAlerts, null, 2)}

Recent Forecasts (${data.forecasts.length} predictions):
${JSON.stringify(data.forecasts.slice(0, 3), null, 2)}

Recent Conversations (${data.conversations.length} conversations):
${JSON.stringify(data.conversations.slice(0, 3), null, 2)}

Recent Emails (${data.recentEmails.length} emails):
${JSON.stringify(data.recentEmails.slice(0, 2), null, 2)}

ANALYSIS INSTRUCTIONS:
=====================

Please provide a comprehensive analysis focusing on:

1. **Overall Health Assessment**: Calculate a health score (0-100) based on all available data
2. **Risk Factors**: Identify specific concerns that could lead to churn or relationship deterioration
3. **Opportunities**: Identify areas for growth, improvement, or strengthening the relationship
4. **Action Items**: Provide specific, prioritized recommendations with clear timelines and assignees
5. **Trend Analysis**: Identify patterns in behavior, sentiment, and performance over time

Consider these key indicators:
- Health score, risk flags, and annual spend from profile
- Response times, escalations, support scores from metrics
- Renewal rates, policy lapses, competitor quotes from retention
- Sentiment trends and confidence levels from sentiment analysis
- Alert patterns and severity levels from recent alerts
- Forecast trends for sentiment and churn risk

RESPONSE FORMAT:
===============

Respond with a valid JSON object matching this exact structure:

{
  "clientId": "${clientId}",
  "generatedAt": "${new Date().toISOString()}",
  "overallHealthScore": number, // 0-100 based on comprehensive analysis
  "healthAssessment": "string", // 2-3 sentence summary of overall client health
  "riskFactors": [
    {
      "title": "string",
      "description": "string",
      "severity": "Low|Medium|High|Critical",
      "category": "risk|opportunity|performance|retention",
      "confidence": number // 0-100
    }
  ],
  "opportunities": [
    {
      "title": "string", 
      "description": "string",
      "severity": "Low|Medium|High|Critical",
      "category": "risk|opportunity|performance|retention",
      "confidence": number // 0-100
    }
  ],
  "actionItems": [
    {
      "title": "string",
      "description": "string", 
      "priority": "Low|Medium|High|Urgent",
      "assignee": "string", // e.g., "Account Manager", "Customer Success", "Technical Support"
      "timeline": "string", // e.g., "This week", "Within 30 days", "Next quarter"
      "expectedImpact": "string" // Brief description of expected positive outcome
    }
  ],
  "trendAnalysis": "string", // 2-3 sentences about patterns and trends observed
  "dataSourcesAnalyzed": ["string"], // List of data sources that were analyzed
  "confidenceScore": number, // 0-100 overall confidence in the analysis
  "nextReviewDate": "string" // ISO date string for when insights should be refreshed
}

Ensure all insights are specific, actionable, and directly related to the client data provided. Focus on practical recommendations that a Customer Success Director can immediately implement.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert Customer Success Director AI assistant specialized in analyzing client relationship data and providing actionable insights for churn prevention and relationship strengthening. Always respond with valid JSON only that matches the requested structure exactly.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      const insightsJson = response.choices[0].message.content;
      if (!insightsJson) {
        throw new Error('No response from OpenAI');
      }

      const insights: ClientInsights = JSON.parse(insightsJson);
      
      // Validate required fields
      this.validateInsights(insights);
      
      console.log(`[ClientInsights] Successfully generated insights for client ${clientId}`);
      return insights;

    } catch (error) {
      console.error('[ClientInsights] OpenAI analysis error:', error);
      
      // Return fallback insights if OpenAI fails
      return this.generateFallbackInsights(clientId, data);
    }
  }

  /**
   * Validate that the insights object contains required fields
   */
  private validateInsights(insights: ClientInsights): void {
    const required = ['clientId', 'generatedAt', 'overallHealthScore', 'healthAssessment'];
    for (const field of required) {
      if (!insights[field as keyof ClientInsights]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (insights.overallHealthScore < 0 || insights.overallHealthScore > 100) {
      throw new Error('Overall health score must be between 0 and 100');
    }
  }

  /**
   * Generate fallback insights when OpenAI is unavailable
   */
  private generateFallbackInsights(clientId: string, data: ClientDataSnapshot): ClientInsights {
    const profile = data.profile;
    const metrics = data.metrics;
    const retention = data.retention;
    
    // Calculate basic health score from available data
    let healthScore = 50; // Start with neutral
    
    if (profile) {
      healthScore += (profile.health_score - 5) * 10; // Normalize 0-10 to affect score
      if (profile.risk_flag === 'Low') healthScore += 10;
      if (profile.risk_flag === 'High') healthScore -= 20;
    }
    
    if (retention) {
      healthScore += (retention.renewal_rate_percent - 80) / 2; // Bonus for >80% renewal
      healthScore -= retention.policy_lapse_count * 5; // Penalty for lapses
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));

    const fallbackInsights: ClientInsights = {
      clientId: clientId,
      generatedAt: new Date().toISOString(),
      overallHealthScore: Math.round(healthScore),
      healthAssessment: `Client analysis completed with limited AI processing. Health score calculated based on available profile and retention data.`,
      riskFactors: [
        {
          title: "AI Analysis Unavailable",
          description: "Advanced AI insights are temporarily unavailable. Basic analysis provided based on core metrics.",
          severity: "Medium",
          category: "performance",
          confidence: 60
        }
      ],
      opportunities: [
        {
          title: "Data Review Recommended", 
          description: "Comprehensive analysis should be performed when AI services are restored.",
          severity: "Low",
          category: "opportunity", 
          confidence: 70
        }
      ],
      actionItems: [
        {
          title: "Schedule Client Review",
          description: "Manually review client data and consider reaching out to assess current satisfaction levels.",
          priority: "Medium",
          assignee: "Account Manager",
          timeline: "Within 7 days",
          expectedImpact: "Maintain relationship visibility during system limitations"
        }
      ],
      trendAnalysis: "Trend analysis requires AI processing which is currently unavailable. Manual review recommended.",
      dataSourcesAnalyzed: ["Client Profile", "Basic Metrics"],
      confidenceScore: 60,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    return fallbackInsights;
  }
}

export const clientInsightsService = new ClientInsightsService();