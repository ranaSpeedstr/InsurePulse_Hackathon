import * as chokidar from 'chokidar';
import path from 'path';
import { assetParser } from './asset-parser';
import EventEmitter from 'events';

export interface AssetData {
  profiles: Record<string, any>;
  feedback: Record<string, any[]>;
  metrics: Record<string, any>;
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
    } catch (error) {
      console.error('[AssetWatcher] Error parsing assets:', error);
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
    this.emit('dataUpdated', this.cachedData);
    return this.cachedData;
  }
}

export const assetWatcher = new AssetWatcher();