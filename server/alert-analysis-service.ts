import { OpenAI } from 'openai';
import { db } from './db';
import { clients, client_metrics, alerts, type Client, type ClientMetrics, type InsertAlert } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ClientWithMetrics extends Client {
  metrics: ClientMetrics | null;
}

interface AlertAnalysis {
  shouldAlert: boolean;
  triggerType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  analysis: string;
  businessImpact: string;
  recommendedActions: string[];
}

export class AlertAnalysisService {
  private isAnalyzing = false;
  private lastAnalysisTime = 0;
  private readonly minAnalysisInterval = 60000; // 1 minute minimum between analyses

  constructor() {
    console.log('[AlertAnalysisService] Initialized alert analysis service');
  }

  /**
   * Main method to analyze client metrics and generate alerts
   */
  async analyzeClientMetrics(): Promise<number> {
    // Prevent multiple simultaneous analyses
    if (this.isAnalyzing) {
      console.log('[AlertAnalysisService] Analysis already in progress, skipping');
      return 0;
    }

    // Rate limiting - don't analyze too frequently
    const now = Date.now();
    if (now - this.lastAnalysisTime < this.minAnalysisInterval) {
      console.log('[AlertAnalysisService] Analysis rate limited, skipping');
      return 0;
    }

    this.isAnalyzing = true;
    this.lastAnalysisTime = now;
    
    try {
      console.log('[AlertAnalysisService] Starting client metrics analysis...');
      
      // Get all clients with their metrics
      const clientsWithMetrics = await this.getAllClientsWithMetrics();
      console.log(`[AlertAnalysisService] Analyzing ${clientsWithMetrics.length} clients`);
      
      let alertsGenerated = 0;
      
      // Analyze each client for concerning patterns
      for (const client of clientsWithMetrics) {
        try {
          const alertGenerated = await this.analyzeClientForAlerts(client);
          if (alertGenerated) {
            alertsGenerated++;
          }
        } catch (error) {
          console.error(`[AlertAnalysisService] Error analyzing client ${client.client_id}:`, error);
        }
      }
      
      console.log(`[AlertAnalysisService] Analysis complete. Generated ${alertsGenerated} new alerts`);
      return alertsGenerated;
      
    } catch (error) {
      console.error('[AlertAnalysisService] Error during metrics analysis:', error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Get all clients with their metrics data joined
   */
  private async getAllClientsWithMetrics(): Promise<ClientWithMetrics[]> {
    const result = await db
      .select({
        // Client fields
        id: clients.id,
        client_id: clients.client_id,
        primary_contact: clients.primary_contact,
        region: clients.region,
        industry: clients.industry,
        contract_status: clients.contract_status,
        annual_spend_usd: clients.annual_spend_usd,
        health_score: clients.health_score,
        risk_flag: clients.risk_flag,
        client_email: clients.client_email,
        created_at: clients.created_at,
        // Metrics fields (may be null if no metrics exist)
        metrics_id: client_metrics.id,
        avg_response_days: client_metrics.avg_response_days,
        avg_delivery_days: client_metrics.avg_delivery_days,
        escalations: client_metrics.escalations,
        delivered: client_metrics.delivered,
        backlog: client_metrics.backlog,
        support_score: client_metrics.support_score,
        metrics_created_at: client_metrics.created_at,
      })
      .from(clients)
      .leftJoin(client_metrics, eq(clients.client_id, client_metrics.client_id));

    // Transform the joined data into the expected structure
    return result.map(row => ({
      id: row.id,
      client_id: row.client_id,
      primary_contact: row.primary_contact,
      region: row.region,
      industry: row.industry,
      contract_status: row.contract_status,
      annual_spend_usd: row.annual_spend_usd,
      health_score: row.health_score,
      risk_flag: row.risk_flag,
      client_email: row.client_email,
      created_at: row.created_at,
      metrics: row.metrics_id ? {
        id: row.metrics_id,
        client_id: row.client_id,
        avg_response_days: row.avg_response_days!,
        avg_delivery_days: row.avg_delivery_days!,
        escalations: row.escalations!,
        delivered: row.delivered!,
        backlog: row.backlog!,
        support_score: row.support_score!,
        created_at: row.metrics_created_at!,
      } : null,
    }));
  }

  /**
   * Analyze a single client for concerning patterns and generate alerts if needed
   */
  private async analyzeClientForAlerts(client: ClientWithMetrics): Promise<boolean> {
    // Skip if no metrics data available
    if (!client.metrics) {
      console.log(`[AlertAnalysisService] No metrics data for client ${client.client_id}, skipping`);
      return false;
    }

    // Pre-filter: Check if we have too many recent alerts for this client (rate limiting)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAlertsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(and(
        eq(alerts.client_id, client.client_id),
        sql`detected_at > ${oneHourAgo}`
      ));

    // If client has 3+ alerts in the last hour, skip to prevent spam
    if (recentAlertsCount[0]?.count >= 3) {
      console.log(`[AlertAnalysisService] Client ${client.client_id} has ${recentAlertsCount[0].count} recent alerts, rate limiting applied`);
      return false;
    }

    try {
      // Use OpenAI to analyze the client data for concerning patterns
      const analysis = await this.analyzeWithOpenAI(client);
      
      if (analysis.shouldAlert) {
        // Enhanced idempotency check: verify no duplicate alert for this client + trigger type combination
        const isDuplicate = await this.checkForDuplicateAlert(client.client_id, analysis.triggerType);
        
        if (isDuplicate) {
          console.log(`[AlertAnalysisService] Duplicate alert prevented for client ${client.client_id}, trigger: ${analysis.triggerType}`);
          return false;
        }

        // Generate the alert record
        await this.createAlert(client, analysis);
        console.log(`[AlertAnalysisService] Generated ${analysis.severity} alert for client ${client.client_id}: ${analysis.triggerType}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`[AlertAnalysisService] OpenAI analysis failed for client ${client.client_id}:`, error);
      return false;
    }
  }

  /**
   * Check for duplicate alerts using client_id + trigger_type fingerprint within time window
   */
  private async checkForDuplicateAlert(clientId: string, triggerType: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const duplicateAlerts = await db
      .select()
      .from(alerts)
      .where(and(
        eq(alerts.client_id, clientId),
        eq(alerts.trigger_type, triggerType),
        sql`detected_at > ${oneHourAgo}`
      ))
      .limit(1);

    return duplicateAlerts.length > 0;
  }

  /**
   * Use OpenAI to analyze client data and determine if an alert should be generated
   */
  private async analyzeWithOpenAI(client: ClientWithMetrics): Promise<AlertAnalysis> {
    const prompt = `As an AI-powered Client Success Alert System, analyze this client's data to identify concerning patterns that require immediate attention. Focus on business-critical issues that could lead to churn, relationship deterioration, or revenue loss.

CLIENT DATA FOR ANALYSIS:
=========================

Client Profile:
- Client ID: ${client.client_id}
- Primary Contact: ${client.primary_contact}
- Region: ${client.region}
- Industry: ${client.industry}
- Contract Status: ${client.contract_status}
- Annual Spend: $${client.annual_spend_usd.toLocaleString()}
- Health Score: ${client.health_score}/10
- Risk Flag: ${client.risk_flag}

Performance Metrics:
- Average Response Time: ${client.metrics!.avg_response_days} days
- Average Delivery Time: ${client.metrics!.avg_delivery_days} days
- Escalations: ${client.metrics!.escalations}
- Delivered Items: ${client.metrics!.delivered}
- Backlog Items: ${client.metrics!.backlog}
- Support Score: ${client.metrics!.support_score}/100

CRITICAL ALERT CRITERIA:
========================

Generate alerts ONLY for genuinely concerning patterns:

1. **LOW_SUPPORT_SCORE**: Support score < 70 (concerning client satisfaction)
2. **HIGH_ESCALATIONS**: Escalations > 3 (problematic service delivery)
3. **POOR_PERFORMANCE**: High backlog (>15) + low delivered (<5) + slow response (>5 days)
4. **HIGH_RISK_CLIENT**: High annual spend + low health score + high risk flag
5. **DELIVERY_ISSUES**: Slow delivery (>10 days) + growing backlog pattern

SEVERITY LEVELS:
===============
- **Critical**: Immediate churn risk, major revenue at stake, emergency intervention needed
- **High**: Significant relationship risk, prompt action required within 24-48 hours
- **Medium**: Concerning pattern, action needed within 1 week
- **Low**: Minor concern, monitor and address proactively

RESPONSE FORMAT:
===============

Respond with a valid JSON object matching this structure:

{
  "shouldAlert": boolean,
  "triggerType": "LOW_SUPPORT_SCORE|HIGH_ESCALATIONS|POOR_PERFORMANCE|HIGH_RISK_CLIENT|DELIVERY_ISSUES",
  "severity": "Low|Medium|High|Critical",
  "description": "Brief description of the concerning pattern",
  "analysis": "Detailed analysis of the issue and its business impact",
  "businessImpact": "Specific business risks and potential revenue impact",
  "recommendedActions": ["Action 1", "Action 2", "Action 3"]
}

IMPORTANT: Only set shouldAlert to true for genuinely concerning patterns that require action. Normal variations or minor issues should not trigger alerts. Focus on patterns that indicate real business risk.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4", // Using gpt-4 for consistent complex analysis like other services
      messages: [
        {
          role: "system",
          content: "You are an expert Customer Success AI that identifies critical client risk patterns requiring immediate attention. You are conservative and only generate alerts for genuine business-critical concerns."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, conservative analysis
      max_tokens: 1000,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate the response structure
      if (typeof result.shouldAlert !== 'boolean') {
        throw new Error('Invalid shouldAlert value');
      }
      
      return result as AlertAnalysis;
    } catch (parseError) {
      console.error('[AlertAnalysisService] Error parsing OpenAI response:', parseError);
      
      // Return safe default (no alert) if parsing fails
      return {
        shouldAlert: false,
        triggerType: 'UNKNOWN',
        severity: 'Low',
        description: 'Analysis failed',
        analysis: 'Unable to analyze client data due to parsing error',
        businessImpact: 'Unknown',
        recommendedActions: []
      };
    }
  }

  /**
   * Create an alert record in the database
   */
  private async createAlert(client: ClientWithMetrics, analysis: AlertAnalysis): Promise<void> {
    // Create CSV snapshot of current metrics for historical reference
    const csvSnapshot = this.createMetricsSnapshot(client);
    
    const alertData: InsertAlert = {
      client_id: client.client_id,
      client_name: client.primary_contact,
      client_email: client.client_email,
      trigger_type: analysis.triggerType,
      trigger_description: analysis.description,
      severity: analysis.severity,
      status: 'Pending',
      openai_analysis: JSON.stringify({
        analysis: analysis.analysis,
        businessImpact: analysis.businessImpact,
        recommendedActions: analysis.recommendedActions,
        generatedAt: new Date().toISOString(),
        clientHealthScore: client.health_score,
        riskFlag: client.risk_flag,
        annualSpend: client.annual_spend_usd
      }),
      csv_data_snapshot: csvSnapshot,
    };

    await db.insert(alerts).values(alertData);
  }

  /**
   * Create a CSV-formatted snapshot of client metrics for historical reference
   */
  private createMetricsSnapshot(client: ClientWithMetrics): string {
    if (!client.metrics) return '';
    
    const headers = [
      'Client ID',
      'Primary Contact',
      'Health Score',
      'Risk Flag',
      'Annual Spend',
      'Avg Response Days',
      'Avg Delivery Days',
      'Escalations',
      'Delivered',
      'Backlog',
      'Support Score',
      'Snapshot Date'
    ];
    
    const values = [
      client.client_id,
      client.primary_contact,
      client.health_score.toString(),
      client.risk_flag,
      client.annual_spend_usd.toString(),
      client.metrics.avg_response_days.toString(),
      client.metrics.avg_delivery_days.toString(),
      client.metrics.escalations.toString(),
      client.metrics.delivered.toString(),
      client.metrics.backlog.toString(),
      client.metrics.support_score.toString(),
      new Date().toISOString()
    ];
    
    return headers.join(',') + '\n' + values.join(',');
  }

  /**
   * Get alert statistics for monitoring
   */
  async getAlertStats(): Promise<{
    totalAlerts: number;
    pendingAlerts: number;
    criticalAlerts: number;
    recentAlerts: number;
  }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(alerts);
    const [pendingResult] = await db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.status, 'Pending'));
    const [criticalResult] = await db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.severity, 'Critical'));
    const [recentResult] = await db.select({ count: sql<number>`count(*)` }).from(alerts).where(sql`detected_at > ${oneDayAgo}`);
    
    return {
      totalAlerts: totalResult?.count || 0,
      pendingAlerts: pendingResult?.count || 0,
      criticalAlerts: criticalResult?.count || 0,
      recentAlerts: recentResult?.count || 0,
    };
  }
}

export const alertAnalysisService = new AlertAnalysisService();