import { readFileSync } from 'fs';
import { storage } from './storage';
import type { InsertClient, InsertConversation, InsertClientMetrics, InsertClientRetention } from '@shared/schema';

// XML parsing function for client profiles
export function parseClientXML(xmlContent: string): InsertClient {
  const clientMatch = xmlContent.match(/<Client>([^<]+)<\/Client>/);
  const contactMatch = xmlContent.match(/<Primary_Contact>([^<]+)<\/Primary_Contact>/);
  const regionMatch = xmlContent.match(/<Region>([^<]+)<\/Region>/);
  const industryMatch = xmlContent.match(/<Industry>([^<]+)<\/Industry>/);
  const statusMatch = xmlContent.match(/<Contract_Status>([^<]+)<\/Contract_Status>/);
  const spendMatch = xmlContent.match(/<Annual_Spend_USD>([^<]+)<\/Annual_Spend_USD>/);
  const healthMatch = xmlContent.match(/<Health_Score>([^<]+)<\/Health_Score>/);
  const riskMatch = xmlContent.match(/<Risk_Flag>([^<]+)<\/Risk_Flag>/);
  const emailMatch = xmlContent.match(/<Client_email>([^<]*)<\/Client_email>/);

  if (!clientMatch || !contactMatch || !regionMatch || !industryMatch || 
      !statusMatch || !spendMatch || !healthMatch || !riskMatch || !emailMatch) {
    throw new Error('Invalid XML format - missing required fields');
  }

  // Handle empty email by generating a default one
  const email = emailMatch[1].trim() || `${clientMatch[1].toLowerCase()}.clientinsure@gmail.com`;

  return {
    client_id: clientMatch[1],
    primary_contact: contactMatch[1],
    region: regionMatch[1],
    industry: industryMatch[1],
    contract_status: statusMatch[1],
    annual_spend_usd: parseInt(spendMatch[1]),
    health_score: parseFloat(healthMatch[1]),
    risk_flag: riskMatch[1],
    client_email: email
  };
}

// TXT parsing function for conversations
export function parseConversationTXT(txtContent: string, clientId: string): InsertConversation[] {
  const conversations: InsertConversation[] = [];
  const scenarios = txtContent.split('--- SCENARIO END ---');
  
  scenarios.forEach((scenario, scenarioIndex) => {
    const lines = scenario.trim().split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Parse "Speaker: Message" format
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return;
      
      const speaker = trimmed.substring(0, colonIndex).trim();
      const message = trimmed.substring(colonIndex + 1).trim();
      
      if (speaker && message) {
        conversations.push({
          client_id: clientId,
          speaker: speaker.replace('Client ', 'Client'),
          message: message,
          scenario_number: scenarioIndex + 1
        });
      }
    });
  });
  
  return conversations;
}

// CSV parsing function for client metrics
export function parseClientMetricsCSV(csvContent: string): InsertClientMetrics[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^﻿/, '')); // Remove BOM if present
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    
    return {
      client_id: values[0],
      avg_response_days: parseFloat(values[1]),
      avg_delivery_days: parseFloat(values[2]),
      escalations: parseInt(values[3]),
      delivered: parseInt(values[4]),
      backlog: parseInt(values[5]),
      support_score: parseInt(values[6])
    };
  });
}

// CSV parsing function for client retention
export function parseClientRetentionCSV(csvContent: string): InsertClientRetention[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^﻿/, '')); // Remove BOM if present
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    
    return {
      client_id: values[0],
      renewal_rate_percent: parseInt(values[1]),
      policy_lapse_count: parseInt(values[2]),
      competitor_quotes_requested: parseInt(values[3]),
      risk_score: parseInt(values[4])
    };
  });
}

// Main import function
export async function importAllData() {
  console.log('Starting data import...');
  
  try {
    // 1. Import client profiles from XML files
    const clientFiles = ['A', 'B', 'C', 'D', 'E'];
    const clients: InsertClient[] = [];
    
    // Handle different file naming patterns for XML files
    const xmlFilePatterns: { [key: string]: string } = {
      'A': '../attached_assets/client_A_1758520484301.xml',
      'B': '../attached_assets/client_B_1758520484301.xml', 
      'C': '../attached_assets/client_C_1758520484301.xml',
      'D': '../attached_assets/client_D_1758520484300.xml',
      'E': '../attached_assets/client_E_1758520484300.xml'
    };

    for (const clientId of clientFiles) {
      const xmlPath = xmlFilePatterns[clientId];
      try {
        const xmlContent = readFileSync(xmlPath, 'utf-8');
        const clientData = parseClientXML(xmlContent);
        clients.push(clientData);
        await storage.createClient(clientData);
        console.log(`✓ Imported client ${clientId} profile`);
      } catch (error) {
        console.error(`Error importing client ${clientId}:`, error);
      }
    }
    
    // 2. Import conversations from TXT files
    // Handle different file naming patterns for TXT files
    const txtFilePatterns: { [key: string]: string } = {
      'A': '../attached_assets/client_A_1758520475651.txt',
      'B': '../attached_assets/client_B_1758520475651.txt',
      'C': '../attached_assets/client_C_1758520475652.txt',
      'D': '../attached_assets/client_D_1758520475652.txt',
      'E': '../attached_assets/client_E_1758520475653.txt'
    };

    for (const clientId of clientFiles) {
      const txtPath = txtFilePatterns[clientId];
      try {
        const txtContent = readFileSync(txtPath, 'utf-8');
        const conversations = parseConversationTXT(txtContent, clientId);
        
        for (const conversation of conversations) {
          await storage.createConversation(conversation);
        }
        console.log(`✓ Imported ${conversations.length} conversations for client ${clientId}`);
      } catch (error) {
        console.error(`Error importing conversations for client ${clientId}:`, error);
      }
    }
    
    // 3. Import client metrics from CSV
    try {
      const metricsPath = '../attached_assets/INSURAI Hackathon- aggregated client results_1758520699335.csv';
      const metricsContent = readFileSync(metricsPath, 'utf-8');
      const metricsData = parseClientMetricsCSV(metricsContent);
      
      for (const metrics of metricsData) {
        await storage.createClientMetrics(metrics);
      }
      console.log(`✓ Imported metrics for ${metricsData.length} clients`);
    } catch (error) {
      console.error('Error importing client metrics:', error);
    }
    
    // 4. Import client retention from CSV
    try {
      const retentionPath = '../attached_assets/INSURAI Hackathon- retention and Churn signals_1758520699334.csv';
      const retentionContent = readFileSync(retentionPath, 'utf-8');
      const retentionData = parseClientRetentionCSV(retentionContent);
      
      for (const retention of retentionData) {
        await storage.createClientRetention(retention);
      }
      console.log(`✓ Imported retention data for ${retentionData.length} clients`);
    } catch (error) {
      console.error('Error importing client retention:', error);
    }
    
    console.log('Data import completed successfully!');
    
  } catch (error) {
    console.error('Error during data import:', error);
    throw error;
  }
}