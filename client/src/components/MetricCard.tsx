import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  className?: string;
}

export default function MetricCard({ title, value, change, trend, subtitle, className }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-chart-2" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-chart-4" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-chart-2";
      case "down":
        return "text-chart-4";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("hover-elevate", className)} data-testid={`metric-${title.toLowerCase().replace(/\\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {trend && getTrendIcon()}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {(change !== undefined || subtitle) && (
            <div className="flex items-center gap-2 text-xs">
              {change !== undefined && (
                <span className={cn("font-medium", getTrendColor())}>
                  {change > 0 ? "+" : ""}{change}%
                </span>
              )}
              {subtitle && (
                <span className="text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}