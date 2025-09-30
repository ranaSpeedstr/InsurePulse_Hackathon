import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  className?: string;
  isLoading?: boolean;
}

// Simple animated value component
function AnimatedValue({ value, isLoading }: { value: string | number; isLoading?: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-8 w-20 bg-gradient-to-r from-muted to-muted/60" />;
  }

  // Ensure value is properly converted to string for rendering
  const displayValue = typeof value === 'object' ? String(value) : value;

  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {displayValue}
    </motion.span>
  );
}

// Loading skeleton component
function MetricCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ["0%", "100%"]
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear"
        }}
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-3">
          <Skeleton className="h-4 w-24 bg-gradient-to-r from-muted to-muted/60" />
          <Skeleton className="h-4 w-4 rounded-full bg-gradient-to-r from-muted to-muted/60" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-16 bg-gradient-to-r from-muted to-muted/60" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12 bg-gradient-to-r from-muted to-muted/60" />
            <Skeleton className="h-3 w-20 bg-gradient-to-r from-muted to-muted/60" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  subtitle, 
  className, 
  isLoading = false 
}: MetricCardProps) {
  const controls = useAnimationControls();

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

  const getGradientStyle = () => {
    const baseGradient = "linear-gradient(135deg, hsl(var(--metric-gradient-start)) 0%, hsl(var(--metric-gradient-end)) 100%)";
    
    if (!trend || trend === "neutral") {
      return {
        background: baseGradient
      };
    }
    
    const trendGradient = trend === "up" 
      ? "linear-gradient(135deg, hsl(var(--metric-gradient-start)) 0%, hsl(var(--metric-gradient-positive) / 0.03) 100%)"
      : "linear-gradient(135deg, hsl(var(--metric-gradient-start)) 0%, hsl(var(--metric-gradient-negative) / 0.03) 100%)";
    
    return {
      background: trendGradient
    };
  };

  useEffect(() => {
    if (!isLoading) {
      controls.start({
        scale: 1,
        opacity: 1,
        transition: { duration: 0.5, ease: "easeOut" }
      });
    }
  }, [isLoading, controls]);

  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={controls}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className={cn("group cursor-default", className)}
      data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Card 
        className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
        style={getGradientStyle()}
      >
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
        
        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          initial={false}
        />

        <CardContent className="relative p-6 space-y-3">
          <div className="flex items-center justify-between">
            <motion.h3 
              className="text-sm font-semibold text-muted-foreground tracking-wide uppercase"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h3>
            <motion.div
              whileHover={{ rotate: trend === "up" ? 15 : trend === "down" ? -15 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {trend && getTrendIcon()}
            </motion.div>
          </div>
          
          <div className="space-y-2">
            <motion.div 
              className="text-3xl font-bold text-foreground leading-none tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <AnimatedValue value={value} isLoading={isLoading} />
            </motion.div>
            
            {(change !== undefined || subtitle) && (
              <motion.div 
                className="flex items-center gap-3 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {change !== undefined && (
                  <motion.span 
                    className={cn("font-semibold flex items-center gap-1", getTrendColor())}
                    whileHover={{ scale: 1.05 }}
                  >
                    {change > 0 ? "+" : ""}{change}%
                  </motion.span>
                )}
                {subtitle && (
                  <span className="text-muted-foreground font-medium">
                    {subtitle}
                  </span>
                )}
              </motion.div>
            )}
          </div>

          {/* Trend-based accent line */}
          {trend && trend !== "neutral" && (
            <motion.div
              className={cn(
                "absolute bottom-0 left-0 h-1 w-full",
                trend === "up" ? "bg-gradient-to-r from-chart-2/60 to-chart-2" :
                trend === "down" ? "bg-gradient-to-r from-chart-4/60 to-chart-4" :
                "bg-gradient-to-r from-muted to-muted"
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}