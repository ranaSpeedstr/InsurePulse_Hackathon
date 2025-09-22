import * as chokidar from 'chokidar';
import path from 'path';
import { assetParser, ClientProfile, ClientMetrics, ClientRetention } from './asset-parser';
import EventEmitter from 'events';
import { db } from './db';
import { clients, client_metrics, client_retention } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface AssetData {
  profiles: Record<string, any>;
  feedback: Record<string, any[]>;
  metrics: Record<string, any>;
  retention: Record<string, any>;
}

export class AssetWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private assetsPath = path.join(process.cwd(), 'attached_assets');
  private cachedData: AssetData | null = null;
  private isProcessing = false;

  constructor() {
    super();
  }

  /**
   * Start watching the attached_assets folder for changes
   */
  async start(): Promise<void> {
    console.log('[AssetWatcher] Starting asset file watcher...');
    
    // Initial parse
    await this.parseAndCache();
    
    // Watch for file changes
    this.watcher = chokidar.watch(this.assetsPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true // don't trigger on initial scan
    });

    this.watcher
      .on('add', (filePath: string) => this.handleFileChange('add', filePath))
      .on('change', (filePath: string) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath: string) => this.handleFileChange('unlink', filePath))
      .on('error', (error: unknown) => console.error('[AssetWatcher] Error:', error));

    console.log('[AssetWatcher] File watcher started successfully');
  }

  /**
   * Stop watching files
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('[AssetWatcher] File watcher stopped');
    }
  }

  /**
   * Handle file system changes
   */
  private async handleFileChange(event: string, filePath: string): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent multiple simultaneous processing
    }

    const fileName = path.basename(filePath);
    const isRelevantFile = fileName.endsWith('.xml') || fileName.endsWith('.txt') || fileName.endsWith('.csv');
    
    if (!isRelevantFile) {
      return;
    }

    console.log(`[AssetWatcher] File ${event}: ${fileName}`);
    
    this.isProcessing = true;
    try {
      // Add a small delay to handle rapid file changes
      setTimeout(async () => {
        await this.parseAndCache();
        this.emit('dataUpdated', this.cachedData);
        this.isProcessing = false;
      }, 500);
    } catch (error) {
      console.error('[AssetWatcher] Error processing file change:', error);
      this.isProcessing = false;
    }
  }

  /**
   * Parse all assets and cache the result
   */
  private async parseAndCache(): Promise<void> {
    try {
      const data = await assetParser.parseAllAssets();
      this.cachedData = data;
      console.log('[AssetWatcher] Assets parsed and cached successfully');
      
      // Update database with parsed data
      await this.updateDatabase(data);
      
      // Emit event when database updates complete
      this.emit('databaseUpdated', data);
    } catch (error) {
      console.error('[AssetWatcher] Error parsing assets:', error);
    }
  }

  /**
   * Update database tables with parsed asset data
   */
  private async updateDatabase(data: {
    profiles: Record<string, ClientProfile>;
    feedback: Record<string, any[]>;
    metrics: Record<string, ClientMetrics>;
    retention: Record<string, ClientRetention>;
  }): Promise<void> {
    try {
      console.log('[AssetWatcher] Starting database update...');
      
      // Update clients table with profile data
      await this.upsertClientProfiles(data.profiles);
      
      // Update client_metrics table with metrics data
      await this.upsertClientMetrics(data.metrics);
      
      // Update client_retention table with retention data
      await this.upsertClientRetention(data.retention);
      
      console.log('[AssetWatcher] Database update completed successfully');
    } catch (error) {
      console.error('[AssetWatcher] Error updating database:', error);
      throw error;
    }
  }

  /**
   * Upsert client profile data into clients table
   */
  private async upsertClientProfiles(profiles: Record<string, ClientProfile>): Promise<void> {
    const profileEntries = Object.entries(profiles);
    
    if (profileEntries.length === 0) {
      console.log('[AssetWatcher] No client profiles to update');
      return;
    }
    
    console.log(`[AssetWatcher] Upserting ${profileEntries.length} client profiles...`);
    
    for (const [clientId, profile] of profileEntries) {
      try {
        await db
          .insert(clients)
          .values({
            client_id: profile.id,
            primary_contact: profile.primaryContact,
            region: profile.region,
            industry: profile.industry,
            contract_status: profile.contractStatus,
            annual_spend_usd: profile.annualSpend,
            health_score: profile.healthScore,
            risk_flag: profile.riskFlag,
            client_email: profile.email,
          })
          .onConflictDoUpdate({
            target: clients.client_id,
            set: {
              primary_contact: profile.primaryContact,
              region: profile.region,
              industry: profile.industry,
              contract_status: profile.contractStatus,
              annual_spend_usd: profile.annualSpend,
              health_score: profile.healthScore,
              risk_flag: profile.riskFlag,
              client_email: profile.email,
            },
          });
        
        console.log(`[AssetWatcher] Upserted client profile: ${clientId}`);
      } catch (error) {
        console.error(`[AssetWatcher] Error upserting client profile ${clientId}:`, error);
      }
    }
  }

  /**
   * Upsert client metrics data into client_metrics table
   */
  private async upsertClientMetrics(metrics: Record<string, ClientMetrics>): Promise<void> {
    const metricsEntries = Object.entries(metrics);
    
    if (metricsEntries.length === 0) {
      console.log('[AssetWatcher] No client metrics to update');
      return;
    }
    
    console.log(`[AssetWatcher] Upserting ${metricsEntries.length} client metrics...`);
    
    for (const [clientId, metric] of metricsEntries) {
      try {
        await db
          .insert(client_metrics)
          .values({
            client_id: metric.clientId,
            avg_response_days: metric.avgResponseDays,
            avg_delivery_days: metric.avgDeliveryDays,
            escalations: metric.escalations,
            delivered: metric.delivered,
            backlog: metric.backlog,
            support_score: metric.supportScore,
          })
          .onConflictDoUpdate({
            target: client_metrics.client_id,
            set: {
              avg_response_days: metric.avgResponseDays,
              avg_delivery_days: metric.avgDeliveryDays,
              escalations: metric.escalations,
              delivered: metric.delivered,
              backlog: metric.backlog,
              support_score: metric.supportScore,
            },
          });
        
        console.log(`[AssetWatcher] Upserted client metrics: ${clientId}`);
      } catch (error) {
        console.error(`[AssetWatcher] Error upserting client metrics ${clientId}:`, error);
      }
    }
  }

  /**
   * Upsert client retention data into client_retention table
   */
  private async upsertClientRetention(retention: Record<string, ClientRetention>): Promise<void> {
    const retentionEntries = Object.entries(retention);
    
    if (retentionEntries.length === 0) {
      console.log('[AssetWatcher] No client retention data to update');
      return;
    }
    
    console.log(`[AssetWatcher] Upserting ${retentionEntries.length} client retention records...`);
    
    for (const [clientId, retentionData] of retentionEntries) {
      try {
        await db
          .insert(client_retention)
          .values({
            client_id: retentionData.clientId,
            renewal_rate_percent: retentionData.renewalRatePercent,
            policy_lapse_count: retentionData.policyLapseCount,
            competitor_quotes_requested: retentionData.competitorQuotesRequested,
            risk_score: retentionData.riskScore,
          })
          .onConflictDoUpdate({
            target: client_retention.client_id,
            set: {
              renewal_rate_percent: retentionData.renewalRatePercent,
              policy_lapse_count: retentionData.policyLapseCount,
              competitor_quotes_requested: retentionData.competitorQuotesRequested,
              risk_score: retentionData.riskScore,
            },
          });
        
        console.log(`[AssetWatcher] Upserted client retention: ${clientId}`);
      } catch (error) {
        console.error(`[AssetWatcher] Error upserting client retention ${clientId}:`, error);
      }
    }
  }

  /**
   * Get cached data
   */
  getCachedData(): AssetData | null {
    return this.cachedData;
  }

  /**
   * Force refresh of cached data
   */
  async refresh(): Promise<AssetData | null> {
    await this.parseAndCache();
    return this.cachedData;
  }
}

export const assetWatcher = new AssetWatcher();