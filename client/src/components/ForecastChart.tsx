import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ForecastData {
  month: string;
  positive: number;
  neutral: number;
  negative: number;
  churnProbability: number;
}

interface ForecastChartProps {
  data: ForecastData[];
  type: "sentiment" | "churn";
}

export default function ForecastChart({ data, type }: ForecastChartProps) {
  const title = type === "sentiment" ? "Sentiment Forecast" : "Churn Risk Probability Trend";
  
  return (
    <Card data-testid={`card-forecast-${type}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                domain={type === "churn" ? [0, 20] : [0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))"
                }}
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Legend />
              
              {type === "sentiment" ? (
                <>
                  <Line type="monotone" dataKey="positive" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Positive" />
                  <Line type="monotone" dataKey="neutral" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Neutral" />
                  <Line type="monotone" dataKey="negative" stroke="hsl(var(--chart-4))" strokeWidth={2} name="Negative" />
                </>
              ) : (
                <Line type="monotone" dataKey="churnProbability" stroke="hsl(var(--chart-4))" strokeWidth={3} name="Churn Probability" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}