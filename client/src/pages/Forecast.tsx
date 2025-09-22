import ForecastChart from "@/components/ForecastChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Brain } from "lucide-react";

export default function Forecast() {
  // TODO: remove mock data when integrating with real backend
  const sentimentData = [
    { month: "Jan", positive: 65, neutral: 25, negative: 10, churnProbability: 15 },
    { month: "Feb", positive: 68, neutral: 23, negative: 9, churnProbability: 14 },
    { month: "Mar", positive: 70, neutral: 20, negative: 10, churnProbability: 12 }
  ];

  const churnData = [
    { month: "Jan", positive: 0, neutral: 0, negative: 0, churnProbability: 15 },
    { month: "Feb", positive: 0, neutral: 0, negative: 0, churnProbability: 14 },
    { month: "Mar", positive: 0, neutral: 0, negative: 0, churnProbability: 12 }
  ];

  return (
    <div className="space-y-8" data-testid="page-forecast">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sentiment & Churn Forecasting</h1>
        <p className="text-muted-foreground">AI-powered predictions and insights for proactive client management</p>
      </div>

      {/* Forecast Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastChart data={sentimentData} type="sentiment" />
        <ForecastChart data={churnData} type="churn" />
      </div>

      {/* AI Insights Summary */}
      <Card data-testid="card-ai-insights">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights (Forecast Summary)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              The sentiment forecast shows a positive trend, with positive sentiment projected to increase by 5% over the next three months, reaching 70% in March. 
              Neutral sentiment is expected to decrease slightly, while negative sentiment drivers are improving overall client satisfaction.
            </p>
            <p>
              Concurrently, the churn risk probability demonstrates a favorable downward trend, decreasing from 15% in January to 12% in March. 
              This suggests that current strategies are effectively mitigating churn.
            </p>
            <p>
              <strong>Key areas to monitor:</strong> Maintaining high positive sentiment through proactive engagement and addressing any emerging neutral sentiment drivers to further reduce potential churn.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}