import OpenAI from 'openai';
import { db } from './db';
import { client_time_series, forecast_predictions, clients } from '../shared/schema';
import { eq, desc, gte, and } from 'drizzle-orm';

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

export class ForecastService {
  
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