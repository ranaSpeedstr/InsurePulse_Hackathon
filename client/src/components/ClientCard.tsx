import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface ClientCardProps {
  clientId: string;
  primaryContact: string;
  conversationCount?: number;
  riskFlag: string;
  healthScore: number;
  sentimentTrend?: "up" | "down" | "neutral";
  className?: string;
}

export default function ClientCard({
  clientId,
  primaryContact,
  conversationCount = 0,
  riskFlag,
  healthScore,
  sentimentTrend = "neutral",
  className
}: ClientCardProps) {
  const getRiskBadgeVariant = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high":
        return "destructive" as const;
      case "medium":
        return "secondary" as const;
      case "low":
        return "default" as const;
      default:
        return "outline" as const;
    }
  };

  const getTrendIcon = () => {
    switch (sentimentTrend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-chart-2" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-chart-4" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getGradientBackground = () => {
    switch (riskFlag.toLowerCase()) {
      case "high":
        return "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--chart-gradient-4-start) / 0.02) 100%)";
      case "medium":
        return "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--chart-gradient-3-start) / 0.02) 100%)";
      case "low":
        return "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--chart-gradient-2-start) / 0.02) 100%)";
      default:
        return "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.02) 100%)";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 }
      }}
      className={className}
      data-testid={`client-card-${clientId.toLowerCase()}`}
    >
      <Card 
        className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
        style={{ background: getGradientBackground() }}
      >
        {/* Subtle border glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 
                className="text-lg font-bold text-foreground"
                data-testid={`text-client-name-${clientId.toLowerCase()}`}
              >
                Client {clientId.toUpperCase()}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <User className="w-3 h-3 text-muted-foreground" data-testid={`icon-contact-${clientId.toLowerCase()}`} />
                <p 
                  className="text-xs text-muted-foreground"
                  data-testid={`text-primary-contact-${clientId.toLowerCase()}`}
                >
                  {primaryContact}
                </p>
              </div>
            </div>
            <Badge 
              variant={getRiskBadgeVariant(riskFlag)}
              className="text-xs"
              data-testid={`badge-risk-${clientId.toLowerCase()}`}
            >
              {riskFlag}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Health Score</p>
              <div className="flex items-center gap-1">
                <span 
                  className="font-semibold text-foreground"
                  data-testid={`text-health-score-${clientId.toLowerCase()}`}
                >
                  {healthScore}/10
                </span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Conversations</p>
              <div className="flex items-center gap-1">
                <span 
                  className="font-semibold text-foreground"
                  data-testid={`text-conversation-count-${clientId.toLowerCase()}`}
                >
                  {conversationCount}
                </span>
                {getTrendIcon()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}