import chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import imaps from 'imap-simple';
import { pipeline } from '@xenova/transformers';
import natural from 'natural';
// Import will be done dynamically to handle default export
import OpenAI from 'openai';

import { db } from './db';
import { emails, sentiment_analysis, file_processing, conversations } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { importAllData } from './data-import';
import { triggerDetectionService } from './trigger-detection';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class BackgroundJobProcessor {
  private sentimentClassifier: any = null;
  private isInitialized = false;
  private fileWatcher: any = null;
  private emailInterval: any = null;
  private clusteringInterval: any = null;
  private triggerInterval: any = null;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('[BackgroundJobs] Initializing background job processor...');
    
    try {
      // Initialize HuggingFace sentiment analysis model
      console.log('[BackgroundJobs] Loading HuggingFace sentiment analysis model...');
      this.sentimentClassifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
      
      // Start file watching
      this.startFileWatching();
      
      // Start email fetching (every 5 minutes)
      this.startEmailFetching();
      
      // Start clustering analysis (every 30 minutes)
      this.startClustering();
      
      // Start trigger detection for CSV changes (every 2 minutes)
      this.startTriggerDetection();
      
      this.isInitialized = true;
      console.log('[BackgroundJobs] Background job processor initialized successfully');
    } catch (error) {
      console.error('[BackgroundJobs] Failed to initialize:', error);
    }
  }

  private startFileWatching() {
    const watchPaths = ['data/calls', 'data/excel', 'data/xml', 'data'];
    
    console.log('[BackgroundJobs] Starting file watcher for:', watchPaths);
    
    this.fileWatcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true, // Don't trigger for existing files
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.fileWatcher
      .on('add', (filePath: string) => this.processNewFile(filePath))
      .on('change', (filePath: string) => this.processNewFile(filePath))
      .on('error', (error: Error) => console.error('[BackgroundJobs] File watcher error:', error));
  }

  private async processNewFile(filePath: string) {
    console.log(`[BackgroundJobs] Processing new/changed file: ${filePath}`);
    
    // Check if it's a CSV file that needs trigger detection
    if (filePath.endsWith('.csv') && (filePath.includes('client_metrics') || filePath.includes('client_retention'))) {
      console.log('[BackgroundJobs] CSV file detected, triggering analysis...');
      await triggerDetectionService.processChangedFile(filePath);
    }
    
    try {
      // Check if file was already processed
      const fileHash = await this.getFileHash(filePath);
      const existingRecord = await db.select()
        .from(file_processing)
        .where(eq(file_processing.file_path, filePath))
        .limit(1);

      if (existingRecord.length > 0 && existingRecord[0].file_hash === fileHash) {
        console.log(`[BackgroundJobs] File ${filePath} already processed with same hash`);
        return;
      }

      // Update file processing record
      await this.updateFileProcessingRecord(filePath, fileHash, 'processing');

      // Import the data
      const ext = path.extname(filePath).toLowerCase();
      let recordsProcessed = 0;

      if (ext === '.txt' && filePath.includes('calls')) {
        await importAllData();
        recordsProcessed = 1;
      } else if (ext === '.csv' || ext === '.xlsx') {
        await importAllData();
        recordsProcessed = 1;
      } else if (ext === '.xml') {
        await importAllData();
        recordsProcessed = 1;
      }

      // Process sentiment analysis for new conversations
      await this.processSentimentForNewData();

      // Update processing record as completed
      await this.updateFileProcessingRecord(filePath, fileHash, 'completed', undefined, recordsProcessed);
      
      console.log(`[BackgroundJobs] Successfully processed ${filePath}, ${recordsProcessed} records`);
    } catch (error) {
      console.error(`[BackgroundJobs] Error processing file ${filePath}:`, error);
      await this.updateFileProcessingRecord(filePath, '', 'error', error instanceof Error ? error.message : String(error));
    }
  }

  private async getFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.promises.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private async updateFileProcessingRecord(
    filePath: string, 
    fileHash: string, 
    status: string, 
    errorMessage?: string, 
    recordsProcessed?: number
  ) {
    const fileType = path.extname(filePath).substring(1);
    
    const existingRecord = await db.select()
      .from(file_processing)
      .where(eq(file_processing.file_path, filePath))
      .limit(1);

    if (existingRecord.length > 0) {
      await db.update(file_processing)
        .set({
          file_hash: fileHash,
          status,
          error_message: errorMessage,
          records_processed: recordsProcessed || existingRecord[0].records_processed,
          processed_at: new Date()
        })
        .where(eq(file_processing.file_path, filePath));
    } else {
      await db.insert(file_processing).values({
        file_path: filePath,
        file_hash: fileHash,
        file_type: fileType,
        status,
        error_message: errorMessage,
        records_processed: recordsProcessed || 0
      });
    }
  }

  private startEmailFetching() {
    console.log('[BackgroundJobs] Starting email fetching (every 5 minutes)');
    
    // Fetch emails immediately, then every 5 minutes
    this.fetchEmails();
    this.emailInterval = setInterval(() => this.fetchEmails(), 5 * 60 * 1000);
  }

  private startClustering() {
    console.log('[BackgroundJobs] Starting clustering analysis (every 30 minutes)');
    
    // Run clustering immediately, then every 30 minutes
    this.performClustering();
    this.clusteringInterval = setInterval(() => this.performClustering(), 30 * 60 * 1000);
  }

  private async fetchEmails() {
    const emailAccounts = [
      { email: 'csdinsure@gmail.com', password: process.env.GMAIL_APP_PASSWORD },
      { email: 'a.clientinsure@gmail.com', password: process.env.GMAIL_APP_PASSWORD_A || process.env.GMAIL_APP_PASSWORD },
      { email: 'b.clientinsure@gmail.com', password: process.env.GMAIL_APP_PASSWORD_B || process.env.GMAIL_APP_PASSWORD }
    ];

    for (const account of emailAccounts) {
      if (!account.password) {
        console.warn(`[BackgroundJobs] No password configured for ${account.email}, skipping`);
        continue;
      }
      
      try {
        await this.fetchEmailsFromAccount(account.email, account.password);
      } catch (error) {
        console.error(`[BackgroundJobs] Error fetching emails from ${account.email}:`, error);
      }
    }
  }

  private async fetchEmailsFromAccount(emailAddress: string, password: string) {
    console.log(`[BackgroundJobs] Fetching emails from ${emailAddress}`);
    
    try {
      // First try with strict certificate validation
      let connection: any;
      try {
        connection = await imaps.connect({
          imap: {
            user: emailAddress,
            password: password,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: {
              rejectUnauthorized: true,
              servername: 'imap.gmail.com'
            },
            authTimeout: 15000,
            connTimeout: 15000
          }
        });
      } catch (certError) {
        console.warn(`[BackgroundJobs] Certificate validation failed for ${emailAddress}, trying with relaxed settings:`, certError.message);
        
        // Fallback with relaxed certificate validation for development
        connection = await imaps.connect({
          imap: {
            user: emailAddress,
            password: password,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: {
              rejectUnauthorized: false
            },
            authTimeout: 15000,
            connTimeout: 15000
          }
        });
      }

      await connection.openBox('INBOX');
      
      // Search for emails from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Format date for IMAP search (DD-MMM-YYYY format)
      const formattedDate = yesterday.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/\s/g, '-');
      
      const searchCriteria = ['SINCE', formattedDate];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: false
      };

      const messages = await connection.search(searchCriteria, fetchOptions);
      console.log(`[BackgroundJobs] Found ${messages.length} recent emails from ${emailAddress}`);

      for (const message of messages) {
        try {
          await this.processEmail(message, emailAddress);
        } catch (error) {
          console.error('[BackgroundJobs] Error processing individual email:', error);
        }
      }

      connection.end();
    } catch (error) {
      console.error(`[BackgroundJobs] IMAP connection error for ${emailAddress}:`, error);
    }
  }

  private async processEmail(message: any, accountEmail: string) {
    const header = message.parts.find((part: any) => part.which === 'HEADER')?.body;
    const textBody = message.parts.find((part: any) => part.which === 'TEXT')?.body;

    if (!header) return;

    const messageId = header['message-id']?.[0];
    const subject = header.subject?.[0] || '';
    const from = header.from?.[0] || '';
    const to = header.to?.[0] || '';
    const dateStr = header.date?.[0];

    if (!messageId) return;

    // Check if email already exists
    const existingEmail = await db.select()
      .from(emails)
      .where(eq(emails.message_id, messageId))
      .limit(1);

    if (existingEmail.length > 0) {
      return; // Email already processed
    }

    // Try to match email to client
    const clientMatch = await this.findClientByEmail(from);

    const emailDate = dateStr ? new Date(dateStr) : new Date();
    const body = typeof textBody === 'string' ? textBody : JSON.stringify(textBody || {});

    // Insert email record
    const [insertedEmail] = await db.insert(emails).values({
      client_id: clientMatch?.client_id || null,
      email_address: accountEmail,
      subject,
      body,
      sender: from,
      recipient: to,
      email_date: emailDate,
      message_id: messageId,
      processed: 0
    }).returning();

    console.log(`[BackgroundJobs] Stored new email: ${subject} from ${from}`);

    // Process sentiment analysis for the email
    if (insertedEmail) {
      await this.analyzeSentiment(insertedEmail.id, 'email', body);
    }
  }

  private async findClientByEmail(emailAddress: string) {
    const { clients } = await import('../shared/schema');
    const clientRecords = await db.select().from(clients);
    
    return clientRecords.find(client => 
      client.client_email.toLowerCase() === emailAddress.toLowerCase() ||
      emailAddress.toLowerCase().includes(client.primary_contact.toLowerCase().split(' ')[0])
    );
  }

  private async processSentimentForNewData() {
    // Process sentiment for unanalyzed conversations
    const unanalyzedConversations = await db.select()
      .from(conversations)
      .limit(50); // Process in batches

    for (const conv of unanalyzedConversations) {
      await this.analyzeSentiment(conv.id, 'conversation', conv.message);
    }

    // Process sentiment for unprocessed emails
    const unprocessedEmails = await db.select()
      .from(emails)
      .where(eq(emails.processed, 0))
      .limit(20);

    for (const email of unprocessedEmails) {
      const emailContent = `${email.subject} ${email.body || ''}`; 
      await this.analyzeSentiment(email.id, 'email', emailContent);
      
      // Mark email as processed
      await db.update(emails)
        .set({ processed: 1 })
        .where(eq(emails.id, email.id));
    }
  }

  private async analyzeSentiment(contentId: string, contentType: string, text: string) {
    try {
      // Skip if already analyzed
      const existing = await db.select()
        .from(sentiment_analysis)
        .where(eq(sentiment_analysis.content_id, contentId))
        .limit(1);

      if (existing.length > 0) return;

      let result;
      let analysisMethod = 'huggingface';

      // Try HuggingFace first
      if (this.sentimentClassifier) {
        try {
          const hfResult = await this.sentimentClassifier(text.substring(0, 512)); // Limit text length
          const sentiment = hfResult[0];
          
          result = {
            sentiment_score: sentiment.label === 'POSITIVE' ? sentiment.score : -sentiment.score,
            sentiment_label: sentiment.label.toLowerCase(),
            confidence: sentiment.score,
            raw_response: JSON.stringify(hfResult)
          };
        } catch (hfError) {
          console.warn('[BackgroundJobs] HuggingFace sentiment analysis failed, trying OpenAI:', hfError);
          // Fallback to OpenAI
          result = await this.analyzeWithOpenAI(text);
          analysisMethod = 'openai';
        }
      } else {
        // Use OpenAI if HuggingFace not available
        result = await this.analyzeWithOpenAI(text);
        analysisMethod = 'openai';
      }

      // Extract key phrases using TF-IDF
      const keyPhrases = this.extractKeyPhrases(text);

      // Store sentiment analysis result
      await db.insert(sentiment_analysis).values({
        content_id: contentId,
        content_type: contentType,
        sentiment_score: result.sentiment_score,
        sentiment_label: result.sentiment_label,
        confidence: result.confidence,
        analysis_method: analysisMethod,
        raw_response: result.raw_response,
        key_phrases: keyPhrases
      });

      console.log(`[BackgroundJobs] Analyzed sentiment for ${contentType} ${contentId}: ${result.sentiment_label} (${result.confidence})`);
    } catch (error) {
      console.error(`[BackgroundJobs] Sentiment analysis error for ${contentType} ${contentId}:`, error);
    }
  }

  private async analyzeWithOpenAI(text: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Analyze sentiment and provide score (-1 to 1), label (positive/negative/neutral), and confidence (0-1). Respond with JSON: {\"sentiment_score\": number, \"sentiment_label\": string, \"confidence\": number}"
        },
        {
          role: "user",
          content: text.substring(0, 1000) // Limit text length for API
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      sentiment_score: result.sentiment_score,
      sentiment_label: result.sentiment_label,
      confidence: result.confidence,
      raw_response: response.choices[0].message.content
    };
  }

  private extractKeyPhrases(text: string): string[] {
    try {
      // Tokenize and remove stop words
      const tokenizer = new natural.WordTokenizer();
      const tokens = tokenizer.tokenize(text.toLowerCase());
      const filteredTokens = tokens.filter(token => 
        token.length > 3 && 
        !natural.stopwords.includes(token) &&
        /^[a-zA-Z]+$/.test(token)
      );

      // Calculate TF-IDF scores (simplified)
      const tokenFreq: { [key: string]: number } = {};
      filteredTokens.forEach(token => {
        tokenFreq[token] = (tokenFreq[token] || 0) + 1;
      });

      // Get top 5 most frequent meaningful tokens
      const sortedTokens = Object.entries(tokenFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([token]) => token);

      return sortedTokens;
    } catch (error) {
      console.error('[BackgroundJobs] Key phrase extraction error:', error);
      return [];
    }
  }

  async performClustering() {
    console.log('[BackgroundJobs] Performing clustering analysis...');
    
    try {
      // Get all sentiment analysis records with key phrases
      const sentimentData = await db.select().from(sentiment_analysis);
      
      if (sentimentData.length < 3) {
        console.log('[BackgroundJobs] Not enough data for clustering');
        return;
      }

      // Prepare documents for clustering with index mapping
      const docMappings: Array<{ doc: string, originalIndex: number }> = [];
      sentimentData.forEach((record, index) => {
        const doc = record.key_phrases?.join(' ') || '';
        if (doc.length > 0) {
          docMappings.push({ doc, originalIndex: index });
        }
      });

      if (docMappings.length < 3) {
        console.log('[BackgroundJobs] Not enough meaningful documents for clustering');
        return;
      }

      // Build global vocabulary from all documents
      const tfidf = new natural.TfIdf();
      docMappings.forEach(mapping => tfidf.addDocument(mapping.doc));

      // Get all unique terms across documents
      const vocabulary: string[] = [];
      const termSet = new Set<string>();
      
      docMappings.forEach((_, docIndex) => {
        tfidf.listTerms(docIndex).forEach(termObj => {
          if (!termSet.has(termObj.term)) {
            termSet.add(termObj.term);
            vocabulary.push(termObj.term);
          }
        });
      });

      // Create fixed-length vectors using global vocabulary
      const vectors: number[][] = [];
      docMappings.forEach((_, docIndex) => {
        const vector = new Array(vocabulary.length).fill(0);
        const docTerms = tfidf.listTerms(docIndex);
        
        docTerms.forEach(termObj => {
          const termIndex = vocabulary.indexOf(termObj.term);
          if (termIndex !== -1) {
            vector[termIndex] = termObj.tfidf;
          }
        });
        
        vectors.push(vector);
      });

      // Perform K-means clustering (import default function)
      const numClusters = Math.min(3, vectors.length);
      const kmeansModule = await import('ml-kmeans');
      const kmeansFunc = kmeansModule.default || kmeansModule;
      const clusters = kmeansFunc(vectors, numClusters, { initialization: 'random' });

      // Update sentiment analysis records with cluster IDs using correct mapping
      for (let i = 0; i < docMappings.length; i++) {
        if (clusters.clusters[i] !== undefined) {
          const originalIndex = docMappings[i].originalIndex;
          await db.update(sentiment_analysis)
            .set({ cluster_id: clusters.clusters[i] })
            .where(eq(sentiment_analysis.id, sentimentData[originalIndex].id));
        }
      }

      console.log(`[BackgroundJobs] Clustering completed with ${numClusters} clusters for ${vectors.length} documents`);
    } catch (error) {
      console.error('[BackgroundJobs] Clustering error:', error);
    }
  }

  private startTriggerDetection() {
    console.log('[BackgroundJobs] Starting trigger detection (every 2 minutes)');
    
    // Run immediately once
    setTimeout(() => this.checkForTriggers(), 5000);
    
    // Then run every 2 minutes
    this.triggerInterval = setInterval(async () => {
      await this.checkForTriggers();
    }, 2 * 60 * 1000); // 2 minutes
  }

  private async checkForTriggers() {
    try {
      console.log('[BackgroundJobs] Checking for CSV file changes...');
      const changedFiles = await triggerDetectionService.checkForChanges();
      
      for (const filePath of changedFiles) {
        await triggerDetectionService.processChangedFile(filePath);
      }
    } catch (error) {
      console.error('[BackgroundJobs] Trigger detection error:', error);
    }
  }

  async shutdown() {
    console.log('[BackgroundJobs] Shutting down background job processor...');
    
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }
    
    if (this.emailInterval) {
      clearInterval(this.emailInterval);
    }
    
    if (this.clusteringInterval) {
      clearInterval(this.clusteringInterval);
    }
    
    if (this.triggerInterval) {
      clearInterval(this.triggerInterval);
    }
    
    this.isInitialized = false;
  }
}

export const backgroundJobProcessor = new BackgroundJobProcessor();