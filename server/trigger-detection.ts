import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import OpenAI from 'openai';
import { db } from './db';
import { alerts, clients, client_metrics, client_retention, email_notifications } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { parseClientMetricsCSV, parseClientRetentionCSV } from './data-import';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TriggerAnalysis {
  hasConcerningTriggers: boolean;
  triggers: Array<{
    clientId: string;
    clientName: string;
    clientEmail: string;
    triggerType: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    reasoning: string;
  }>;
  analysis: string;
}

export class TriggerDetectionService {
  private readonly watchedFiles = new Map<string, string>(); // file path -> hash

  constructor() {
    this.initializeFileHashes();
  }

  private async initializeFileHashes() {
    const csvFiles = [
      'data/client_metrics.csv',
      'data/client_retention.csv'
    ];

    for (const filePath of csvFiles) {
      try {
        if (await this.fileExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf-8');
          const hash = crypto.createHash('md5').update(content).digest('hex');
          this.watchedFiles.set(filePath, hash);
          console.log(`[TriggerDetection] Initialized watch for ${filePath}`);
        }
      } catch (error) {
        console.log(`[TriggerDetection] Could not initialize ${filePath}: File not found`);
      }
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  public async checkForChanges(): Promise<string[]> {
    const changedFiles: string[] = [];

    for (const [filePath, storedHash] of Array.from(this.watchedFiles.entries())) {
      try {
        if (await this.fileExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf-8');
          const currentHash = crypto.createHash('md5').update(content).digest('hex');
          
          if (currentHash !== storedHash) {
            console.log(`[TriggerDetection] File changed: ${filePath}`);
            this.watchedFiles.set(filePath, currentHash);
            changedFiles.push(filePath);
          }
        }
      } catch (error) {
        console.error(`[TriggerDetection] Error checking ${filePath}:`, error);
      }
    }

    return changedFiles;
  }

  public async processChangedFile(filePath: string): Promise<void> {
    console.log(`[TriggerDetection] Processing changed file: ${filePath}`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const analysis = await this.analyzeCSVWithOpenAI(filePath, content);
      
      if (analysis.hasConcerningTriggers) {
        await this.createAlertsFromAnalysis(analysis);
      }
    } catch (error) {
      console.error(`[TriggerDetection] Error processing ${filePath}:`, error);
    }
  }

  private async analyzeCSVWithOpenAI(filePath: string, csvContent: string): Promise<TriggerAnalysis> {
    const fileName = path.basename(filePath);
    let parsedData: any[] = [];
    let clientData: any[] = [];

    // Parse CSV data
    try {
      if (fileName.includes('metrics')) {
        parsedData = parseClientMetricsCSV(csvContent);
      } else if (fileName.includes('retention')) {
        parsedData = parseClientRetentionCSV(csvContent);
      }

      // Get client information for context
      clientData = await db.select().from(clients);
    } catch (error) {
      console.error('[TriggerDetection] Error parsing CSV:', error);
      return { hasConcerningTriggers: false, triggers: [], analysis: '' };
    }

    const prompt = `As a CSD (Customer Success Director) AI assistant, analyze this client data for concerning triggers that require immediate attention.

File: ${fileName}
Data: ${JSON.stringify(parsedData, null, 2)}
Client Information: ${JSON.stringify(clientData, null, 2)}

Analyze each client for concerning patterns and determine if any triggers warrant immediate action. Focus on:

For client_metrics.csv:
- High escalations (>5)
- Poor support scores (<7)
- Long response/delivery times (>3 days)
- High backlog (>10)

For client_retention.csv:
- Low renewal rates (<80%)
- High policy lapses (>2)
- Multiple competitor quotes (>3)
- High risk scores (>70)

For each concerning client, provide:
1. Client ID and details
2. Trigger type (NPS_DROP, HIGH_CHURN_RISK, POOR_PERFORMANCE, NEGATIVE_FEEDBACK, etc.)
3. Specific description of the issue
4. Severity level (Low/Medium/High/Critical)
5. Clear reasoning

Respond in this exact JSON format:
{
  "hasConcerningTriggers": boolean,
  "triggers": [
    {
      "clientId": "string",
      "clientName": "string", 
      "clientEmail": "string",
      "triggerType": "string",
      "description": "string",
      "severity": "Low|Medium|High|Critical",
      "reasoning": "string"
    }
  ],
  "analysis": "string"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a CSD AI assistant specialized in analyzing client data for churn risk and performance issues. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}') as TriggerAnalysis;
      console.log(`[TriggerDetection] OpenAI analysis completed for ${fileName}`);
      return analysis;
    } catch (error) {
      console.error('[TriggerDetection] OpenAI analysis error:', error);
      return { hasConcerningTriggers: false, triggers: [], analysis: 'Failed to analyze data' };
    }
  }

  private async createAlertsFromAnalysis(analysis: TriggerAnalysis): Promise<void> {
    console.log(`[TriggerDetection] Creating ${analysis.triggers.length} alerts`);

    for (const trigger of analysis.triggers) {
      try {
        // Check if alert already exists for this client and trigger type
        const existingAlert = await db.select()
          .from(alerts)
          .where(
            and(
              eq(alerts.client_id, trigger.clientId),
              eq(alerts.trigger_type, trigger.triggerType),
              eq(alerts.status, 'Pending')
            )
          );

        if (existingAlert.length === 0) {
          await db.insert(alerts).values({
            client_id: trigger.clientId,
            client_name: trigger.clientName,
            client_email: trigger.clientEmail,
            trigger_type: trigger.triggerType,
            trigger_description: trigger.description,
            severity: trigger.severity,
            status: 'Pending',
            openai_analysis: JSON.stringify(analysis),
            csv_data_snapshot: JSON.stringify(trigger)
          });

          console.log(`[TriggerDetection] Created alert for ${trigger.clientName}: ${trigger.description}`);
        } else {
          console.log(`[TriggerDetection] Alert already exists for ${trigger.clientName}: ${trigger.triggerType}`);
        }
      } catch (error) {
        console.error('[TriggerDetection] Error creating alert:', error);
      }
    }
  }

  public async acknowledgeAlert(alertId: string, action: 'Acknowledged' | 'Resolved'): Promise<boolean> {
    try {
      // Get alert details
      const [alert] = await db.select()
        .from(alerts)
        .where(eq(alerts.id, alertId));

      if (!alert) {
        console.error('[TriggerDetection] Alert not found:', alertId);
        return false;
      }

      // Update alert status
      await db.update(alerts)
        .set({ 
          status: action,
          resolved_at: action === 'Resolved' ? new Date() : null
        })
        .where(eq(alerts.id, alertId));

      // Send email notification
      await this.sendEmailNotification(alert, action);

      console.log(`[TriggerDetection] Alert ${action.toLowerCase()}: ${alert.client_name}`);
      return true;
    } catch (error) {
      console.error('[TriggerDetection] Error acknowledging alert:', error);
      return false;
    }
  }

  private async sendEmailNotification(alert: any, action: string): Promise<void> {
    const subject = `${action}: ${alert.trigger_description} - ${alert.client_name}`;
    const emailBody = `Dear ${alert.client_name},

We wanted to follow up on the recent alert regarding ${alert.trigger_description}.

Our team has ${action.toLowerCase()} this issue and we're committed to ensuring your continued satisfaction with our services.

If you have any questions or concerns, please don't hesitate to reach out to us.

Best regards,
CSD Team`;

    try {
      await db.insert(email_notifications).values({
        alert_id: alert.id,
        subject: subject,
        recipient_email: alert.client_email,
        sender_email: 'csdinsure@gmail.com',
        email_body: emailBody,
        status: 'Sent'
      });

      console.log(`[TriggerDetection] Email notification logged for ${alert.client_email}`);
    } catch (error) {
      console.error('[TriggerDetection] Error logging email notification:', error);
    }
  }
}

export const triggerDetectionService = new TriggerDetectionService();