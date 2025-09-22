import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify(parseString);

export interface ClientProfile {
  id: string;
  name: string;
  primaryContact: string;
  region: string;
  industry: string;
  contractStatus: string;
  annualSpend: number;
  healthScore: number;
  riskFlag: string;
  email: string;
}

export interface FeedbackEntry {
  id: string;
  date: string;
  type: 'email' | 'call';
  sentiment: 'positive' | 'neutral' | 'negative';
  content: string;
}

export interface ClientMetrics {
  clientId: string;
  avgResponseDays: number;
  avgDeliveryDays: number;
  escalations: number;
  delivered: number;
  backlog: number;
  supportScore: number;
}

export interface ClientRetention {
  clientId: string;
  renewalRatePercent: number;
  policyLapseCount: number;
  competitorQuotesRequested: number;
  riskScore: number;
}

export class AssetParser {
  private assetsPath = path.join(process.cwd(), 'attached_assets');

  /**
   * Parse XML client profile files
   */
  async parseClientProfiles(): Promise<Record<string, ClientProfile>> {
    const profiles: Record<string, ClientProfile> = {};
    
    try {
      const files = fs.readdirSync(this.assetsPath);
      const xmlFiles = files.filter(file => file.endsWith('.xml') && file.includes('client_'));
      
      for (const file of xmlFiles) {
        try {
          const filePath = path.join(this.assetsPath, file);
          const xmlContent = fs.readFileSync(filePath, 'utf-8');
          const result = await parseXml(xmlContent);
          
          if (result && typeof result === 'object' && 'ClientProfile' in result) {
            const profile = (result as any).ClientProfile;
            const clientId = profile.Client[0];
            
            profiles[clientId] = {
              id: clientId,
              name: `${profile.Primary_Contact[0]} Company`, // Use contact name as company
              primaryContact: profile.Primary_Contact[0],
              region: profile.Region[0],
              industry: profile.Industry[0],
              contractStatus: profile.Contract_Status[0],
              annualSpend: parseInt(profile.Annual_Spend_USD[0]),
              healthScore: parseFloat(profile.Health_Score[0]),
              riskFlag: profile.Risk_Flag[0],
              email: profile.Client_email[0]
            };
          }
        } catch (error) {
          console.error(`Error parsing XML file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error reading XML files:', error);
    }
    
    return profiles;
  }

  /**
   * Parse TXT feedback/call files
   */
  async parseFeedbackData(): Promise<Record<string, FeedbackEntry[]>> {
    const feedbackData: Record<string, FeedbackEntry[]> = {};
    
    try {
      const files = fs.readdirSync(this.assetsPath);
      const txtFiles = files.filter(file => file.endsWith('.txt') && file.includes('client_'));
      
      for (const file of txtFiles) {
        try {
          const filePath = path.join(this.assetsPath, file);
          const txtContent = fs.readFileSync(filePath, 'utf-8');
          
          // Extract client ID from filename
          const clientIdMatch = file.match(/client_([A-E])/);
          if (!clientIdMatch) continue;
          
          const clientId = clientIdMatch[1];
          const conversations = this.parseConversations(txtContent);
          feedbackData[clientId] = conversations;
          
        } catch (error) {
          console.error(`Error parsing TXT file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error reading TXT files:', error);
    }
    
    return feedbackData;
  }

  /**
   * Parse individual conversation from TXT content
   */
  private parseConversations(content: string): FeedbackEntry[] {
    const conversations: FeedbackEntry[] = [];
    const scenarios = content.split('--- SCENARIO END ---');
    
    scenarios.forEach((scenario, index) => {
      if (scenario.trim()) {
        const lines = scenario.trim().split('\n');
        let conversationText = '';
        let hasPositiveKeywords = false;
        let hasNegativeKeywords = false;
        
        lines.forEach(line => {
          if (line.trim()) {
            conversationText += line.trim() + ' ';
            
            // Simple sentiment analysis based on keywords
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('thank') || lowerLine.includes('love') || 
                lowerLine.includes('excellent') || lowerLine.includes('great') ||
                lowerLine.includes('perfect') || lowerLine.includes('appreciate')) {
              hasPositiveKeywords = true;
            }
            if (lowerLine.includes('issue') || lowerLine.includes('problem') || 
                lowerLine.includes('slow') || lowerLine.includes('timeout') ||
                lowerLine.includes('frustrated') || lowerLine.includes('bug')) {
              hasNegativeKeywords = true;
            }
          }
        });
        
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        if (hasPositiveKeywords && !hasNegativeKeywords) {
          sentiment = 'positive';
        } else if (hasNegativeKeywords) {
          sentiment = 'negative';
        }
        
        conversations.push({
          id: (index + 1).toString(),
          date: new Date().toISOString().split('T')[0], // Use current date
          type: Math.random() > 0.5 ? 'call' : 'email', // Random type
          sentiment: sentiment,
          content: conversationText.trim()
        });
      }
    });
    
    return conversations;
  }

  /**
   * Parse CSV metrics files
   */
  async parseMetricsData(): Promise<Record<string, ClientMetrics>> {
    const metricsData: Record<string, ClientMetrics> = {};
    
    try {
      const files = fs.readdirSync(this.assetsPath);
      const csvFiles = files.filter(file => file.endsWith('.csv') && file.includes('aggregated'));
      
      for (const file of csvFiles) {
        try {
          const filePath = path.join(this.assetsPath, file);
          const csvContent = fs.readFileSync(filePath, 'utf-8');
          const lines = csvContent.split('\n');
          
          if (lines.length < 2) continue;
          
          // Parse header
          const headers = lines[0].split(',').map(h => h.trim().replace(/\uFEFF/g, '')); // Remove BOM
          
          // Parse data rows
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (!row) continue;
            
            const values = row.split(',').map(v => v.trim());
            if (values.length < headers.length) continue;
            
            const clientId = values[0];
            if (clientId) {
              metricsData[clientId] = {
                clientId: clientId,
                avgResponseDays: parseFloat(values[1]) || 0,
                avgDeliveryDays: parseFloat(values[2]) || 0,
                escalations: parseInt(values[3]) || 0,
                delivered: parseInt(values[4]) || 0,
                backlog: parseInt(values[5]) || 0,
                supportScore: parseInt(values[6]) || 0
              };
            }
          }
        } catch (error) {
          console.error(`Error parsing CSV file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error reading CSV files:', error);
    }
    
    return metricsData;
  }

  /**
   * Parse CSV retention files
   */
  async parseClientRetention(): Promise<Record<string, ClientRetention>> {
    const retentionData: Record<string, ClientRetention> = {};
    
    try {
      const files = fs.readdirSync(this.assetsPath);
      const csvFiles = files.filter(file => file.endsWith('.csv') && file.includes('retention'));
      
      for (const file of csvFiles) {
        try {
          const filePath = path.join(this.assetsPath, file);
          const csvContent = fs.readFileSync(filePath, 'utf-8');
          const lines = csvContent.split('\n');
          
          if (lines.length < 2) continue;
          
          // Parse header - expected: Client_ID,Renewal Rate (%),Policy Lapse Count,Competitor Quotes Requested,Risk Score
          const headers = lines[0].split(',').map(h => h.trim().replace(/\uFEFF/g, '')); // Remove BOM
          
          // Parse data rows
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (!row) continue;
            
            const values = row.split(',').map(v => v.trim());
            if (values.length < headers.length) continue;
            
            const clientId = values[0];
            if (clientId) {
              retentionData[clientId] = {
                clientId: clientId,
                renewalRatePercent: parseInt(values[1]) || 0,
                policyLapseCount: parseInt(values[2]) || 0,
                competitorQuotesRequested: parseInt(values[3]) || 0,
                riskScore: parseInt(values[4]) || 0
              };
            }
          }
        } catch (error) {
          console.error(`Error parsing retention CSV file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error reading retention CSV files:', error);
    }
    
    return retentionData;
  }

  /**
   * Parse all asset files and return combined data
   */
  async parseAllAssets(): Promise<{
    profiles: Record<string, ClientProfile>;
    feedback: Record<string, FeedbackEntry[]>;
    metrics: Record<string, ClientMetrics>;
    retention: Record<string, ClientRetention>;
  }> {
    const [profiles, feedback, metrics, retention] = await Promise.all([
      this.parseClientProfiles(),
      this.parseFeedbackData(),
      this.parseMetricsData(),
      this.parseClientRetention()
    ]);

    console.log('[AssetParser] Parsed data summary:');
    console.log(`- Profiles: ${Object.keys(profiles).length} clients`);
    console.log(`- Feedback: ${Object.keys(feedback).length} clients`);
    console.log(`- Metrics: ${Object.keys(metrics).length} clients`);
    console.log(`- Retention: ${Object.keys(retention).length} clients`);

    return { profiles, feedback, metrics, retention };
  }
}

export const assetParser = new AssetParser();