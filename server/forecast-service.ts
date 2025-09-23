import OpenAI from 'openai';
import { db } from './db';
import { client_time_series, forecast_predictions, clients } from '../shared/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface ForecastResult {
  predictions: TimeSeriesPoint[];
  confidence: number;
  insight: string;
}

interface ClientCSVData {
  Client_ID: string;
  Avg_Response_Days: number;
  Avg_Delivery_Days: number;
  Escalations: number;
  Delivered: number;
  Backlog: number;
  Support_Score: number;
  Renewal_Rate: number;
  Policy_Lapse_Count: number;
  Competitor_Quotes_Requested: number;
  Risk_Score: number;
}

interface CSVForecastResult {
  clientId: string;
  current: {
    sentimentTrendIndex: number;
    churnRiskProbability: number;
    renewalRate: number;
    riskScore: number;
    sentimentTrend: string;
  };
  forecast6Months: {
    sentimentTrendIndex: number;
    churnRiskProbability: number;
    renewalRate: number;
    riskScore: number;
    sentimentTrend: string;
  };
  improvements: {
    renewalRateChange: number;
    riskScoreChange: number;
    sentimentImprovement: string;
  };
}

export class ForecastService {
  private clientCSVData: ClientCSVData[] = [];

  constructor() {
    this.loadCSVData();
  }

  /**
   * Load client data from CSV files
   */
  private loadCSVData() {
    try {
      // Load aggregated results
      const aggregatedPath = path.join(process.cwd(), 'attached_assets', 'INSURAI Hackathon- aggregated client results_1758520699335.csv');
      const aggregatedContent = fs.readFileSync(aggregatedPath, 'utf-8');
      
      // Load retention and churn signals
      const retentionPath = path.join(process.cwd(), 'attached_assets', 'INSURAI Hackathon- retention and Churn signals_1758520699334.csv');
      const retentionContent = fs.readFileSync(retentionPath, 'utf-8');
      
      // Parse CSV data
      const aggregatedLines = aggregatedContent.split('\n').slice(1).filter(line => line.trim());
      const retentionLines = retentionContent.split('\n').slice(1).filter(line => line.trim());
      
      // Combine data
      this.clientCSVData = aggregatedLines.map(line => {
        const [clientId, avgResponseDays, avgDeliveryDays, escalations, delivered, backlog, supportScore] = line.split(',').map(val => val.trim());
        
        // Find corresponding retention data
        const retentionLine = retentionLines.find(retLine => retLine.startsWith(clientId + ','));
        if (!retentionLine) return null;
        
        const [, renewalRate, policyLapseCount, competitorQuotes, riskScore] = retentionLine.split(',').map(val => val.trim());
        
        return {
          Client_ID: clientId,
          Avg_Response_Days: parseFloat(avgResponseDays),
          Avg_Delivery_Days: parseFloat(avgDeliveryDays),
          Escalations: parseInt(escalations),
          Delivered: parseInt(delivered),
          Backlog: parseInt(backlog),
          Support_Score: parseInt(supportScore),
          Renewal_Rate: parseInt(renewalRate),
          Policy_Lapse_Count: parseInt(policyLapseCount),
          Competitor_Quotes_Requested: parseInt(competitorQuotes),
          Risk_Score: parseInt(riskScore)
        };
      }).filter(Boolean) as ClientCSVData[];
      
      console.log(`[ForecastService] Loaded ${this.clientCSVData.length} client records from CSV`);
    } catch (error) {
      console.error('[ForecastService] Error loading CSV data:', error);
      this.clientCSVData = [];
    }
  }

  /**
   * Calculate Sentiment Trend Index (STI)
   * STI = (0.4 × Support_Score) - (0.2 × Avg_Response_Days) - (0.2 × Avg_Delivery_Days) - (5 × Escalations) + (3 × Delivered/Backlog_Ratio)
   */
  private calculateSentimentTrendIndex(client: ClientCSVData): number {
    const deliveredBacklogRatio = client.Backlog > 0 ? client.Delivered / client.Backlog : client.Delivered;
    
    const sti = (0.4 * client.Support_Score) 
                - (0.2 * client.Avg_Response_Days) 
                - (0.2 * client.Avg_Delivery_Days) 
                - (5 * client.Escalations) 
                + (3 * deliveredBacklogRatio);
    
    // Normalize to 0-100 scale
    return Math.max(0, Math.min(100, sti));
  }

  /**
   * Calculate Churn Risk Probability (CRP)
   * CRP = Base_Risk + (0.5 × Policy_Lapse_Rate) + (0.3 × Competitor_Quotes_Rate) - (0.4 × Renewal_Rate_Improvement)
   */
  private calculateChurnRiskProbability(client: ClientCSVData, renewalRateImprovement: number = 0): number {
    const baseRisk = client.Risk_Score / 100;
    const policyLapseRate = client.Policy_Lapse_Count / 100;
    const competitorQuotesRate = client.Competitor_Quotes_Requested / 100;
    
    const crp = baseRisk 
                + (0.5 * policyLapseRate) 
                + (0.3 * competitorQuotesRate) 
                - (0.4 * renewalRateImprovement / 100);
    
    return Math.max(0, Math.min(1, crp)) * 100;
  }

  /**
   * Determine sentiment trend based on STI score
   */
  private getSentimentTrend(sti: number): string {
    if (sti >= 80) return 'Strong Positive';
    if (sti >= 65) return 'Positive';
    if (sti >= 50) return 'Balanced Positive';
    if (sti >= 35) return 'Neutral';
    if (sti >= 20) return 'Cautiously Positive';
    return 'Negative';
  }

  /**
   * Calculate 6-month forecast for a client
   */
  private calculate6MonthForecast(client: ClientCSVData): CSVForecastResult {
    // Current metrics
    const currentSTI = this.calculateSentimentTrendIndex(client);
    const currentCRP = this.calculateChurnRiskProbability(client);
    
    // 6-month improvements based on assumptions
    const responseImprovement = client.Avg_Response_Days * 0.15; // 2-3% monthly * 6 months ≈ 15%
    const deliveryImprovement = client.Avg_Delivery_Days * 0.15;
    const supportScoreImprovement = client.Escalations > 0 ? 6 : 3; // 1-2 pts/month * 6 months
    const escalationReduction = Math.max(0, client.Escalations - 1);
    const backlogReduction = Math.max(1, client.Backlog * 0.7); // 30% backlog reduction
    const renewalRateImprovement = client.Renewal_Rate < 70 ? 12 : 8; // Higher improvement for lower performers
    const riskScoreReduction = 15; // 2-3 pts/month * 6 months
    
    // Create forecasted client data
    const forecastedClient: ClientCSVData = {
      ...client,
      Avg_Response_Days: client.Avg_Response_Days - responseImprovement,
      Avg_Delivery_Days: client.Avg_Delivery_Days - deliveryImprovement,
      Support_Score: Math.min(100, client.Support_Score + supportScoreImprovement),
      Escalations: escalationReduction,
      Backlog: backlogReduction,
      Renewal_Rate: Math.min(95, client.Renewal_Rate + renewalRateImprovement),
      Risk_Score: Math.max(30, client.Risk_Score - riskScoreReduction)
    };
    
    // Calculate forecasted metrics
    const forecastedSTI = this.calculateSentimentTrendIndex(forecastedClient);
    const forecastedCRP = this.calculateChurnRiskProbability(forecastedClient, renewalRateImprovement);
    
    return {
      clientId: client.Client_ID,
      current: {
        sentimentTrendIndex: currentSTI,
        churnRiskProbability: currentCRP,
        renewalRate: client.Renewal_Rate,
        riskScore: client.Risk_Score,
        sentimentTrend: this.getSentimentTrend(currentSTI)
      },
      forecast6Months: {
        sentimentTrendIndex: forecastedSTI,
        churnRiskProbability: forecastedCRP,
        renewalRate: forecastedClient.Renewal_Rate,
        riskScore: forecastedClient.Risk_Score,
        sentimentTrend: this.getSentimentTrend(forecastedSTI)
      },
      improvements: {
        renewalRateChange: renewalRateImprovement,
        riskScoreChange: riskScoreReduction,
        sentimentImprovement: `${this.getSentimentTrend(currentSTI)} → ${this.getSentimentTrend(forecastedSTI)}`
      }
    };
  }

  /**
   * Get CSV-based forecast for all clients
   */
  public getCSVClientForecasts(): CSVForecastResult[] {
    return this.clientCSVData.map(client => this.calculate6MonthForecast(client));
  }

  /**
   * Get CSV-based forecast for a specific client
   */
  public getCSVClientForecast(clientId: string): CSVForecastResult | null {
    const client = this.clientCSVData.find(c => c.Client_ID === clientId);
    if (!client) return null;
    
    return this.calculate6MonthForecast(client);
  }

  /**
   * Get CSV forecast summary statistics
   */
  public getCSVForecastSummary() {
    const forecasts = this.getCSVClientForecasts();
    
    const currentAvgRenewal = forecasts.reduce((sum, f) => sum + f.current.renewalRate, 0) / forecasts.length;
    const forecastedAvgRenewal = forecasts.reduce((sum, f) => sum + f.forecast6Months.renewalRate, 0) / forecasts.length;
    
    const currentAvgRisk = forecasts.reduce((sum, f) => sum + f.current.riskScore, 0) / forecasts.length;
    const forecastedAvgRisk = forecasts.reduce((sum, f) => sum + f.forecast6Months.riskScore, 0) / forecasts.length;
    
    const highRiskClients = forecasts.filter(f => f.current.riskScore >= 80).length;
    const improvedClients = forecasts.filter(f => f.forecast6Months.renewalRate > f.current.renewalRate).length;
    
    return {
      totalClients: forecasts.length,
      currentMetrics: {
        averageRenewalRate: Math.round(currentAvgRenewal),
        averageRiskScore: Math.round(currentAvgRisk),
        highRiskClients
      },
      forecastedMetrics: {
        averageRenewalRate: Math.round(forecastedAvgRenewal),
        averageRiskScore: Math.round(forecastedAvgRisk),
        clientsWithImprovement: improvedClients
      },
      improvements: {
        renewalRateImprovement: Math.round(forecastedAvgRenewal - currentAvgRenewal),
        riskScoreReduction: Math.round(currentAvgRisk - forecastedAvgRisk),
        percentageImproved: Math.round((improvedClients / forecasts.length) * 100)
      }
    };
  }

  /**
   * Generate sentiment forecast for a client using OpenAI
   */
  async generateSentimentForecast(clientId: string, monthsAhead: number = 6): Promise<ForecastResult> {
    try {
      // Get historical sentiment data
      const historicalData = await this.getHistoricalSentiment(clientId, 180); // Last 6 months
      
      if (historicalData.length < 4) {
        throw new Error('Insufficient historical data for forecasting');
      }

      const forecast = await this.callOpenAIForForecast(
        historicalData,
        'sentiment_score',
        monthsAhead,
        'sentiment analysis'
      );

      // Store predictions in database
      await this.storeForecastPredictions(clientId, 'sentiment', forecast.predictions, forecast.confidence, forecast.insight);

      return forecast;
    } catch (error) {
      console.error('Error generating sentiment forecast:', error);
      throw error;
    }
  }

  /**
   * Generate churn risk forecast for a client using OpenAI
   */
  async generateChurnForecast(clientId: string, quartersAhead: number = 2): Promise<ForecastResult> {
    try {
      // Get historical churn probability data
      const historicalData = await this.getHistoricalChurnRisk(clientId, 120); // Last 4 months
      
      if (historicalData.length < 3) {
        throw new Error('Insufficient historical data for forecasting');
      }

      const forecast = await this.callOpenAIForForecast(
        historicalData,
        'churn_probability',
        quartersAhead * 3, // Convert quarters to months
        'churn risk probability'
      );

      // Store predictions in database
      await this.storeForecastPredictions(clientId, 'churn_risk', forecast.predictions, forecast.confidence, forecast.insight);

      return forecast;
    } catch (error) {
      console.error('Error generating churn forecast:', error);
      throw error;
    }
  }

  /**
   * Get historical sentiment data for a client
   */
  private async getHistoricalSentiment(clientId: string, daysBack: number): Promise<TimeSeriesPoint[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const data = await db.select({
      date: client_time_series.date,
      value: client_time_series.sentiment_score
    })
    .from(client_time_series)
    .where(
      and(
        eq(client_time_series.client_id, clientId),
        gte(client_time_series.date, cutoffDate)
      )
    )
    .orderBy(client_time_series.date);

    return data
      .filter(d => d.value !== null)
      .map(d => ({
        date: d.date.toISOString().split('T')[0],
        value: d.value!
      }));
  }

  /**
   * Get historical churn risk data for a client
   */
  private async getHistoricalChurnRisk(clientId: string, daysBack: number): Promise<TimeSeriesPoint[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const data = await db.select({
      date: client_time_series.date,
      value: client_time_series.churn_probability
    })
    .from(client_time_series)
    .where(
      and(
        eq(client_time_series.client_id, clientId),
        gte(client_time_series.date, cutoffDate)
      )
    )
    .orderBy(client_time_series.date);

    return data
      .filter(d => d.value !== null)
      .map(d => ({
        date: d.date.toISOString().split('T')[0],
        value: d.value!
      }));
  }

  /**
   * Call OpenAI to generate time-series forecast
   */
  private async callOpenAIForForecast(
    historicalData: TimeSeriesPoint[],
    metricType: string,
    periodsAhead: number,
    metricName: string
  ): Promise<ForecastResult> {
    const prompt = `You are an expert AI forecasting specialist with advanced expertise in predictive client relationship analytics and future trend modeling.

HISTORICAL DATA ANALYSIS for ${metricName}:
${historicalData.map(d => `${d.date}: ${d.value.toFixed(3)}`).join('\n')}

ADVANCED FORECASTING MISSION: Generate sophisticated ${periodsAhead}-period FUTURE TREND predictions for ${metricName} using cutting-edge predictive modeling techniques.

PREDICTIVE ANALYSIS REQUIREMENTS:
1. FUTURE-FOCUSED PREDICTION: Analyze historical patterns, momentum, cyclical behaviors, and emerging trends to project future trajectory
2. ADVANCED TREND DETECTION: Identify micro-trends, acceleration/deceleration patterns, volatility patterns, and relationship lifecycle stages  
3. PREDICTIVE CONFIDENCE SCORING: Provide granular confidence assessment based on data quality, pattern stability, and forecast horizon
4. STRATEGIC BUSINESS INTELLIGENCE: Generate forward-looking actionable insights for proactive client relationship management

ENHANCED FORECASTING CONSIDERATIONS:
- Client relationship lifecycle patterns (honeymoon → maturity → potential decline → renewal cycles)
- Seasonal business cycles and market dynamics
- Leading indicators and early warning signals
- Momentum analysis and trajectory prediction
- Risk escalation patterns and intervention opportunities
- Competitive landscape impact on client sentiment

RESPONSE FORMAT (JSON):
{
  "predictions": [
    {"date": "YYYY-MM-DD", "value": number},
    ...
  ],
  "confidence": number (0-1),
  "insight": "FUTURE-FOCUSED analysis providing: 1) Predicted trend direction and magnitude, 2) Key inflection points and risk periods, 3) Proactive intervention recommendations, 4) Strategic opportunities to capitalize on, 5) Early warning indicators to monitor. Focus on what WILL happen and actionable steps to influence positive outcomes."
}

PREDICTION CONTEXT:
- Sentiment scores: -1 (very negative) to +1 (very positive) - predict emotional trajectory and relationship health evolution
- Churn probability: 0% to 100% - forecast client retention risk and identify intervention windows
- Focus on FUTURE TRENDS, not just historical pattern continuation
- Emphasize predictive intelligence over descriptive analytics`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert data scientist and business analyst specializing in predictive client relationship analytics. You excel at identifying subtle patterns, seasonal trends, and early warning signals in time-series data. Your forecasts are renowned for their accuracy and actionable business insights. Always return valid JSON with sophisticated trend analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const forecast = JSON.parse(content);
      
      // Validate response structure
      if (!forecast.predictions || !Array.isArray(forecast.predictions)) {
        throw new Error('Invalid forecast format: missing predictions array');
      }
      
      if (typeof forecast.confidence !== 'number' || forecast.confidence < 0 || forecast.confidence > 1) {
        forecast.confidence = 0.7; // Default confidence
      }
      
      if (!forecast.insight || typeof forecast.insight !== 'string') {
        forecast.insight = 'Forecast generated based on historical trends.';
      }

      // Generate future dates for predictions
      const lastDate = new Date(historicalData[historicalData.length - 1].date);
      forecast.predictions = forecast.predictions.map((pred: any, index: number) => {
        const futureDate = new Date(lastDate);
        futureDate.setMonth(futureDate.getMonth() + index + 1);
        return {
          date: futureDate.toISOString().split('T')[0],
          value: typeof pred.value === 'number' ? pred.value : pred
        };
      });

      return forecast;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Fallback to simple trend-based forecast
      return this.generateSimpleForecast(historicalData, periodsAhead, metricType);
    }
  }

  /**
   * Fallback simple trend-based forecast
   */
  private generateSimpleForecast(historicalData: TimeSeriesPoint[], periodsAhead: number, metricType?: string): ForecastResult {
    const values = historicalData.map(d => d.value);
    const lastValue = values[values.length - 1];
    const trend = values.length > 1 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
    
    const predictions: TimeSeriesPoint[] = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    
    // Determine valid range based on metric type
    const getValidRange = (value: number) => {
      if (metricType === 'sentiment_score') {
        // Sentiment scores range from -1 to +1
        return Math.max(-1, Math.min(1, value));
      } else {
        // Churn probability and other metrics range from 0 to 1
        return Math.max(0, Math.min(1, value));
      }
    };
    
    for (let i = 1; i <= periodsAhead; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      
      const predictedValue = getValidRange(lastValue + (trend * i));
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: predictedValue
      });
    }
    
    return {
      predictions,
      confidence: 0.6,
      insight: `Based on historical trend analysis, the ${trend > 0 ? 'positive' : 'negative'} trend is expected to continue.`
    };
  }

  /**
   * Store forecast predictions in database with upsert logic
   */
  private async storeForecastPredictions(
    clientId: string,
    forecastType: 'sentiment' | 'churn_risk',
    predictions: TimeSeriesPoint[],
    confidence: number,
    insight: string
  ): Promise<void> {
    for (const prediction of predictions) {
      try {
        // First try to delete existing prediction for this client/type/date to ensure clean upsert
        await db.delete(forecast_predictions)
          .where(
            and(
              eq(forecast_predictions.client_id, clientId),
              eq(forecast_predictions.forecast_type, forecastType),
              eq(forecast_predictions.forecast_date, new Date(prediction.date))
            )
          );

        // Then insert the new prediction
        await db.insert(forecast_predictions).values({
          client_id: clientId,
          forecast_type: forecastType,
          forecast_date: new Date(prediction.date),
          predicted_value: prediction.value,
          confidence_score: confidence,
          openai_analysis: insight,
          data_points_used: predictions.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error storing forecast prediction:', errorMessage);
      }
    }
  }

  /**
   * Get stored forecasts for a client
   */
  async getStoredForecasts(clientId: string, forecastType: 'sentiment' | 'churn_risk'): Promise<any[]> {
    const forecasts = await db.select()
      .from(forecast_predictions)
      .where(
        and(
          eq(forecast_predictions.client_id, clientId),
          eq(forecast_predictions.forecast_type, forecastType)
        )
      )
      .orderBy(forecast_predictions.forecast_date);

    return forecasts.map(f => ({
      date: f.forecast_date.toISOString().split('T')[0],
      value: f.predicted_value,
      confidence: f.confidence_score,
      insight: f.openai_analysis
    }));
  }

  /**
   * Generate sample time-series data for demonstration
   */
  async generateSampleData(): Promise<void> {
    const clientIds = ['A', 'B', 'C', 'D', 'E'];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // 6 months ago

    for (const clientId of clientIds) {
      // Generate 6 months of weekly data (approximately 26 data points)
      for (let week = 0; week < 26; week++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (week * 7));

        // Generate realistic sentiment and churn data with some patterns
        const baselineChurn = clientId === 'A' ? 0.15 : clientId === 'B' ? 0.25 : 0.10;
        const baselineSentiment = clientId === 'A' ? 0.3 : clientId === 'B' ? -0.1 : 0.6;
        
        // Add some seasonal and random variation
        const seasonalFactor = Math.sin((week / 26) * 2 * Math.PI) * 0.1;
        const randomFactor = (Math.random() - 0.5) * 0.2;
        
        const sentimentScore = Math.max(-1, Math.min(1, baselineSentiment + seasonalFactor + randomFactor));
        const churnProbability = Math.max(0, Math.min(1, baselineChurn + (seasonalFactor * 0.5) + (randomFactor * 0.5)));

        try {
          await db.insert(client_time_series).values({
            client_id: clientId,
            date: date,
            sentiment_score: sentimentScore,
            churn_probability: churnProbability,
            satisfaction_score: (sentimentScore + 1) / 2, // Convert to 0-1 scale
            issue_count: Math.floor(Math.random() * 5),
            escalation_count: Math.floor(Math.random() * 2),
            response_time_hours: 2 + Math.random() * 10,
          });
        } catch (error) {
          // Ignore duplicates
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('duplicate key')) {
            console.error('Error inserting sample data:', error);
          }
        }
      }
    }
    
    console.log('[ForecastService] Sample time-series data generated successfully');
  }
}

export const forecastService = new ForecastService();