import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Brain, RefreshCw, Lightbulb, Database, FileText, BarChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonCard, SkeletonChart, SkeletonContainer, SkeletonPage, SkeletonWithShimmer } from '@/components/ui/skeletons';
import { useToast } from '@/hooks/use-toast';

interface Client {
  client_id: string;
  primary_contact: string;
  region: string;
  industry: string;
}

interface HistoricalData {
  date: string;
  sentiment_score: number;
  churn_probability: number;
  satisfaction_score: number;
  issue_count: number;
  escalation_count: number;
}

interface ForecastPrediction {
  date: string;
  value: number;
  confidence?: number;
  insight?: string;
}

interface ForecastResult {
  predictions: ForecastPrediction[];
  confidence: number;
  insight: string;
}

export default function Forecast() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [forecastLoading, setForecastLoading] = useState<{ sentiment: boolean; churn: boolean }>({
    sentiment: false,
    churn: false
  });

  // Fetch clients list
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/forecast/clients'],
  });

  // Fetch historical data for selected client
  const { data: historicalData = [], isLoading: historicalLoading, refetch: refetchHistorical } = useQuery<HistoricalData[]>({
    queryKey: ['/api/forecast', selectedClient, 'historical'],
    queryFn: async () => {
      const response = await fetch(`/api/forecast/${selectedClient}/historical`);
      if (!response.ok) throw new Error('Failed to fetch historical data');
      return response.json();
    },
    enabled: !!selectedClient,
  });

  // Fetch sentiment predictions
  const { data: sentimentPredictions = [], refetch: refetchSentiment } = useQuery<ForecastPrediction[]>({
    queryKey: ['/api/forecast', selectedClient, 'predictions'],
    queryFn: async () => {
      const response = await fetch(`/api/forecast/${selectedClient}/predictions?type=sentiment`);
      if (!response.ok) throw new Error('Failed to fetch sentiment predictions');
      return response.json();
    },
    enabled: !!selectedClient,
  });

  // Fetch churn risk predictions
  const { data: churnPredictions = [], refetch: refetchChurn } = useQuery<ForecastPrediction[]>({
    queryKey: ['/api/forecast', selectedClient, 'churn_predictions'],
    queryFn: async () => {
      const response = await fetch(`/api/forecast/${selectedClient}/predictions?type=churn_risk`);
      if (!response.ok) throw new Error('Failed to fetch churn predictions');
      return response.json();
    },
    enabled: !!selectedClient,
  });

  // Generate sample data mutation
  const generateSampleDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/forecast/sample-data', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate sample data');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Sample time-series data generated successfully',
      });
      // Invalidate all forecast-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/forecast'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forecast/clients'] });
      if (selectedClient) {
        queryClient.invalidateQueries({ queryKey: ['/api/forecast', selectedClient] });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate sample data',
        variant: 'destructive',
      });
    },
  });

  // Generate forecast mutation
  const generateForecastMutation = useMutation({
    mutationFn: async ({ type, periods }: { type: 'sentiment' | 'churn'; periods: number }) => {
      const response = await fetch(`/api/forecast/${selectedClient}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, periods }),
      });
      if (!response.ok) throw new Error('Failed to generate forecast');
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Forecast Generated',
        description: `${variables.type === 'sentiment' ? 'Sentiment' : 'Churn risk'} forecast completed with ${(data.confidence * 100).toFixed(0)}% confidence`,
      });
      
      // Refresh the predictions
      if (variables.type === 'sentiment') {
        refetchSentiment();
      } else {
        refetchChurn();
      }
      setForecastLoading(prev => ({ ...prev, [variables.type]: false }));
    },
    onError: (error, variables) => {
      toast({
        title: 'Forecast Failed',
        description: `Failed to generate ${variables.type} forecast`,
        variant: 'destructive',
      });
      setForecastLoading(prev => ({ ...prev, [variables.type]: false }));
    },
  });

  const handleGenerateForecast = (type: 'sentiment' | 'churn') => {
    if (!selectedClient) return;
    
    setForecastLoading(prev => ({ ...prev, [type]: true }));
    const periods = type === 'sentiment' ? 6 : 2; // 6 months for sentiment, 2 quarters for churn
    generateForecastMutation.mutate({ type, periods });
  };

  // Prepare chart data emphasizing future predictions over historical context
  const prepareSentimentChartData = () => {
    // Only show recent historical data for context (last 4 weeks)
    const recentHistorical = historicalData
      .slice(-4) // Last 4 data points only
      .map(d => ({
        date: d.date,
        historical_context: d.sentiment_score,
        type: 'historical' as const
      }));

    // Emphasize future predictions
    const futurePredictions = sentimentPredictions.map(p => ({
      date: p.date,
      future_trend: p.value,
      confidence: p.confidence,
      type: 'forecast' as const
    }));

    return [...recentHistorical, ...futurePredictions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const prepareChurnChartData = () => {
    // Only show recent historical data for context (last 4 weeks)
    const recentHistorical = historicalData
      .slice(-4) // Last 4 data points only
      .map(d => ({
        date: d.date,
        historical_context: d.churn_probability * 100, // Convert to percentage
        type: 'historical' as const
      }));

    // Emphasize future predictions
    const futurePredictions = churnPredictions.map(p => ({
      date: p.date,
      future_trend: p.value * 100, // Convert to percentage
      confidence: p.confidence,
      type: 'forecast' as const
    }));

    return [...recentHistorical, ...futurePredictions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get latest insights
  const getLatestInsight = (predictions: ForecastPrediction[]) => {
    return predictions.length > 0 ? predictions[0].insight : null;
  };

  const sentimentChartData = prepareSentimentChartData();
  const churnChartData = prepareChurnChartData();
  const sentimentInsight = getLatestInsight(sentimentPredictions);
  const churnInsight = getLatestInsight(churnPredictions);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-forecast">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Client Forecast Analytics</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered sentiment and churn risk predictions using historical client data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => generateSampleDataMutation.mutate()}
            disabled={generateSampleDataMutation.isPending}
            data-testid="button-generate-sample-data"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Sample Data
          </Button>
        </div>
      </div>

      {/* Client Selection */}
      {clientsLoading ? (
        <SkeletonCard showHeader={true} headerHeight={6} contentLines={2} className="w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select Client</CardTitle>
            <CardDescription>Choose a client to view their forecast analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedClient} onValueChange={setSelectedClient} data-testid="select-client">
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Select a client to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    Client {client.client_id} - {client.primary_contact} ({client.region})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Loading State for Forecast Data */}
            {historicalLoading ? (
              <SkeletonContainer className="space-y-6">
                {/* Tabs Skeleton */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex gap-1 border-b mb-6">
                      <SkeletonWithShimmer className="h-10 w-32 rounded-t" />
                      <SkeletonWithShimmer className="h-10 w-36 rounded-t" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chart Skeletons */}
                <SkeletonChart height={80} showLegend={true} />
                <SkeletonChart height={80} showLegend={true} />
                
                {/* AI Insights Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SkeletonCard showHeader={true} contentLines={4} />
                  <SkeletonCard showHeader={true} contentLines={4} />
                </div>
              </SkeletonContainer>
            ) : (
              <>
                {/* Forecast Charts */}
                <Tabs defaultValue="sentiment" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sentiment" data-testid="tab-sentiment">
                      Sentiment Forecast
                    </TabsTrigger>
                    <TabsTrigger value="churn" data-testid="tab-churn">
                      Churn Risk Forecast
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sentiment" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Sentiment Trend Analysis
                      </CardTitle>
                      <CardDescription>
                        AI-powered 6-month future sentiment trend predictions using GPT-4 Turbo
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {sentimentPredictions.length > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          {(sentimentPredictions[0]?.confidence || 0) * 100}% Confidence
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleGenerateForecast('sentiment')}
                        disabled={forecastLoading.sentiment || !historicalData.length}
                        data-testid="button-generate-sentiment-forecast"
                      >
                        {forecastLoading.sentiment ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <TrendingUp className="w-4 h-4 mr-2" />
                        )}
                        Generate Forecast
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {historicalLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : sentimentChartData.length === 0 ? (
                      <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mb-4" />
                        <p>No data available. Generate sample data to get started.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={sentimentChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            domain={[-1, 1]}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.toFixed(1)}
                          />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value: any, name) => [
                              typeof value === 'number' ? value.toFixed(3) : value,
                              name === 'historical_context' ? 'Historical Context' : 'Future Trend'
                            ]}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="historical_context" 
                            stroke="#94a3b8" 
                            strokeWidth={1}
                            strokeOpacity={0.6}
                            dot={{ fill: '#94a3b8', strokeWidth: 1, r: 2 }}
                            name="Historical Context"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="future_trend" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            strokeDasharray="5 5"
                            dot={{ fill: '#3b82f6', strokeWidth: 3, r: 6 }}
                            name="AI Future Trend"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="churn" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        Churn Risk Probability
                      </CardTitle>
                      <CardDescription>
                        AI-powered 2-quarter future churn risk predictions using GPT-4 Turbo
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {churnPredictions.length > 0 && (
                        <Badge variant="outline" className="text-red-600">
                          {(churnPredictions[0]?.confidence || 0) * 100}% Confidence
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleGenerateForecast('churn')}
                        disabled={forecastLoading.churn || !historicalData.length}
                        data-testid="button-generate-churn-forecast"
                      >
                        {forecastLoading.churn ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mr-2" />
                        )}
                        Generate Forecast
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {historicalLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : churnChartData.length === 0 ? (
                      <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mb-4" />
                        <p>No data available. Generate sample data to get started.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={churnChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value: any, name) => [
                              typeof value === 'number' ? `${value.toFixed(1)}%` : value,
                              name === 'historical_context' ? 'Historical Context' : 'Future Trend'
                            ]}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="historical_context" 
                            stroke="#94a3b8" 
                            strokeWidth={1}
                            strokeOpacity={0.6}
                            dot={{ fill: '#94a3b8', strokeWidth: 1, r: 2 }}
                            name="Historical Context"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="future_trend" 
                            stroke="#f97316" 
                            strokeWidth={4}
                            strokeDasharray="5 5"
                            dot={{ fill: '#f97316', strokeWidth: 3, r: 6 }}
                            name="AI Future Trend"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* AI Insights */}
            {(sentimentInsight || churnInsight) && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-500" />
                    AI Insights for Client {selectedClient}
                  </CardTitle>
                  <CardDescription>
                    OpenAI GPT-4 analysis based on {historicalData.length} data points from {historicalData.length > 0 ? `${historicalData[0]?.date} to ${historicalData[historicalData.length - 1]?.date}` : 'available historical data'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Data Sources Section */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border">
                    <div className="flex items-start gap-2 mb-3">
                      <Database className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Data Sources Used for Analysis</h4>
                        <div className="space-y-4">
                          {/* Sentiment Data Details */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <div className="flex items-start gap-2 mb-2">
                              <BarChart className="w-4 h-4 text-blue-500 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Historical Sentiment Scores</h5>
                                {(() => {
                                  const sentimentData = historicalData.filter(d => typeof d.sentiment_score === 'number');
                                  if (sentimentData.length === 0) return <p className="text-xs text-blue-700 dark:text-blue-300">No sentiment data available</p>;
                                  
                                  const values = sentimentData.map(d => d.sentiment_score);
                                  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3);
                                  const min = Math.min(...values).toFixed(3);
                                  const max = Math.max(...values).toFixed(3);
                                  const latest = sentimentData[sentimentData.length - 1]?.sentiment_score.toFixed(3);
                                  
                                  return (
                                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                      <p><strong>Records:</strong> {sentimentData.length} data points</p>
                                      <p><strong>Range:</strong> {min} to {max} • <strong>Average:</strong> {avg}</p>
                                      <p><strong>Latest Value:</strong> {latest} • <strong>Trend:</strong> {Number(latest) > Number(avg) ? 'Above Average ↗' : 'Below Average ↘'}</p>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Churn Risk Data Details */}
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-medium text-orange-900 dark:text-orange-100 text-sm">Churn Probability Trends</h5>
                                {(() => {
                                  const churnData = historicalData.filter(d => typeof d.churn_probability === 'number');
                                  if (churnData.length === 0) return <p className="text-xs text-orange-700 dark:text-orange-300">No churn data available</p>;
                                  
                                  const values = churnData.map(d => d.churn_probability);
                                  const avg = (values.reduce((a, b) => a + b, 0) / values.length * 100).toFixed(1);
                                  const min = (Math.min(...values) * 100).toFixed(1);
                                  const max = (Math.max(...values) * 100).toFixed(1);
                                  const latest = (churnData[churnData.length - 1]?.churn_probability * 100).toFixed(1);
                                  
                                  return (
                                    <div className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                                      <p><strong>Records:</strong> {churnData.length} data points</p>
                                      <p><strong>Range:</strong> {min}% to {max}% • <strong>Average:</strong> {avg}%</p>
                                      <p><strong>Latest Risk:</strong> {latest}% • <strong>Status:</strong> {Number(latest) > Number(avg) ? 'High Risk ⚠️' : 'Stable ✓'}</p>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Supporting Metrics */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <div className="flex items-center gap-1 mb-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                <span className="font-medium text-green-900 dark:text-green-100">Satisfaction</span>
                              </div>
                              {(() => {
                                const satisfactionData = historicalData.filter(d => typeof d.satisfaction_score === 'number');
                                if (satisfactionData.length === 0) return <p className="text-green-700 dark:text-green-300">No data</p>;
                                const avg = (satisfactionData.reduce((a, b) => a + b.satisfaction_score, 0) / satisfactionData.length).toFixed(1);
                                return <p className="text-green-700 dark:text-green-300">Avg: {avg}/10</p>;
                              })()}
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                              <div className="flex items-center gap-1 mb-1">
                                <FileText className="w-3 h-3 text-red-500" />
                                <span className="font-medium text-red-900 dark:text-red-100">Issues</span>
                              </div>
                              {(() => {
                                const issueData = historicalData.filter(d => typeof d.issue_count === 'number');
                                if (issueData.length === 0) return <p className="text-red-700 dark:text-red-300">No data</p>;
                                const total = issueData.reduce((a, b) => a + b.issue_count, 0);
                                return <p className="text-red-700 dark:text-red-300">Total: {total}</p>;
                              })()}
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                              <div className="flex items-center gap-1 mb-1">
                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                <span className="font-medium text-yellow-900 dark:text-yellow-100">Escalations</span>
                              </div>
                              {(() => {
                                const escalationData = historicalData.filter(d => typeof d.escalation_count === 'number');
                                if (escalationData.length === 0) return <p className="text-yellow-700 dark:text-yellow-300">No data</p>;
                                const total = escalationData.reduce((a, b) => a + b.escalation_count, 0);
                                return <p className="text-yellow-700 dark:text-yellow-300">Total: {total}</p>;
                              })()}
                            </div>
                          </div>
                        </div>
                        {historicalData.length > 0 && (() => {
                          const sortedData = [...historicalData].sort((a, b) => a.date.localeCompare(b.date));
                          const startDate = sortedData[0]?.date;
                          const endDate = sortedData[sortedData.length - 1]?.date;
                          
                          return (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                              <strong>Analysis Period:</strong> {startDate} to {endDate}
                              <span className="ml-2">• <strong>AI Model:</strong> OpenAI GPT-4</span>
                              {(sentimentPredictions.length > 0 || churnPredictions.length > 0) && (
                                <span className="ml-2">• <strong>Confidence:</strong> 
                                  {sentimentPredictions.length > 0 && ` Sentiment: ${((sentimentPredictions[sentimentPredictions.length - 1]?.confidence ?? 0) * 100).toFixed(0)}%`}
                                  {churnPredictions.length > 0 && ` Churn: ${((churnPredictions[churnPredictions.length - 1]?.confidence ?? 0) * 100).toFixed(0)}%`}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {sentimentInsight && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Sentiment Forecast</h4>
                          <p className="text-blue-800 dark:text-blue-200 text-sm">{sentimentInsight}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {churnInsight && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Churn Risk Analysis</h4>
                          <p className="text-orange-800 dark:text-orange-200 text-sm">{churnInsight}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </>
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}