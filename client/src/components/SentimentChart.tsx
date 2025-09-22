import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface SentimentData {
  name: string;
  value: number;
  color: string;
}

interface SentimentChartProps {
  data: SentimentData[];
  isLoading?: boolean;
}

const COLORS = {
  Positive: "hsl(var(--chart-2))",
  Neutral: "hsl(var(--chart-3))",
  Negative: "hsl(var(--chart-4))",
};

const GRADIENT_COLORS = {
  Positive: {
    start: "hsl(var(--chart-gradient-2-start))",
    end: "hsl(var(--chart-gradient-2-end))",
    glow: "hsl(var(--chart-glow-2) / 0.3)"
  },
  Neutral: {
    start: "hsl(var(--chart-gradient-3-start))",
    end: "hsl(var(--chart-gradient-3-end))",
    glow: "hsl(var(--chart-glow-3) / 0.3)"
  },
  Negative: {
    start: "hsl(var(--chart-gradient-4-start))",
    end: "hsl(var(--chart-gradient-4-end))",
    glow: "hsl(var(--chart-glow-4) / 0.3)"
  }
};

// Loading skeleton for the chart
function SentimentChartSkeleton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <Card className="relative overflow-hidden" data-testid="card-sentiment-chart-skeleton">
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={prefersReducedMotion ? {} : { x: ["0%", "100%"] }}
        transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
      <CardHeader>
        <Skeleton className="h-6 w-48 bg-gradient-to-r from-muted to-muted/60" />
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-center justify-center">
          <div className="relative">
            <Skeleton className="h-60 w-60 rounded-full bg-gradient-to-r from-muted to-muted/60" />
            <Skeleton className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-background" />
          </div>
        </div>
        {/* Legend skeleton */}
        <div className="flex justify-center gap-6 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full bg-gradient-to-r from-muted to-muted/60" />
              <Skeleton className="h-4 w-16 bg-gradient-to-r from-muted to-muted/60" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Custom Cell component with hover effects
function AnimatedCell({ fill, name, isActive, onHover, onLeave, instanceId, prefersReducedMotion, ...props }: any) {
  const gradientColors = GRADIENT_COLORS[name as keyof typeof GRADIENT_COLORS];
  
  return (
    <g>
      <defs>
        <radialGradient id={`gradient-${name}-${instanceId}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor={gradientColors?.start || fill} />
          <stop offset="100%" stopColor={gradientColors?.end || fill} />
        </radialGradient>
        <filter id={`glow-${name}-${instanceId}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <motion.path
        {...props}
        fill={`url(#gradient-${name}-${instanceId})`}
        filter={isActive ? `url(#glow-${name}-${instanceId})` : undefined}
        style={{
          filter: isActive ? `drop-shadow(0 0 8px ${gradientColors?.glow})` : undefined,
          transformOrigin: "center",
          cursor: "pointer"
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isActive ? 1.05 : 1, 
          opacity: 1 
        }}
        transition={{ 
          scale: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: "easeOut" },
          opacity: { duration: prefersReducedMotion ? 0.01 : 0.6, delay: prefersReducedMotion ? 0 : Math.random() * 0.3 }
        }}
        whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
        onMouseEnter={() => onHover(name)}
        onMouseLeave={onLeave}
      />
    </g>
  );
}

// Enhanced legend with animations
function AnimatedLegend({ payload, hoveredSegment, onSegmentHover, onSegmentLeave, prefersReducedMotion }: any) {
  return (
    <motion.div 
      className="flex justify-center gap-6 mt-4"
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, delay: prefersReducedMotion ? 0 : 0.3 }}
      role="list"
      aria-label="Chart legend"
    >
      {payload?.map((entry: any, index: number) => {
        const isHovered = hoveredSegment === entry.value;
        const gradientColors = GRADIENT_COLORS[entry.value as keyof typeof GRADIENT_COLORS];
        
        return (
          <motion.div
            key={index}
            className="flex items-center gap-2 cursor-pointer select-none"
            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            role="listitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSegmentHover(entry.value);
              }
            }}
            onMouseEnter={() => onSegmentHover(entry.value)}
            onMouseLeave={onSegmentLeave}
            data-testid={`legend-${entry.value.toLowerCase()}`}
          >
            <motion.div
              className="h-3 w-3 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${gradientColors?.start}, ${gradientColors?.end})`,
                boxShadow: isHovered ? `0 0 8px ${gradientColors?.glow}` : 'none'
              }}
              animate={{
                scale: isHovered ? 1.2 : 1,
                boxShadow: isHovered ? `0 0 12px ${gradientColors?.glow}` : '0 0 0px transparent'
              }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
            />
            <motion.span
              className={`text-sm font-medium transition-colors duration-200 ${
                isHovered ? 'text-foreground' : 'text-muted-foreground'
              }`}
              animate={{ 
                fontWeight: isHovered ? 600 : 500
              }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
            >
              {entry.value}
            </motion.span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function SentimentChart({ data, isLoading = false }: SentimentChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'loaded'>('initial');
  const prefersReducedMotion = useReducedMotion();
  const instanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  useEffect(() => {
    if (!isLoading && data.length > 0) {
      const timer = setTimeout(() => setAnimationPhase('loaded'), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data]);

  if (isLoading) {
    return <SentimentChartSkeleton />;
  }

  const handleSegmentHover = (name: string) => setHoveredSegment(name);
  const handleSegmentLeave = () => setHoveredSegment(null);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, ease: "easeOut" }}
      >
        <Card 
          className="relative overflow-hidden group hover:shadow-xl transition-all duration-500 ease-out"
          style={{
            background: `linear-gradient(135deg, hsl(var(--chart-container-bg)) 0%, hsl(var(--card)) 100%)`,
            border: `1px solid hsl(var(--chart-container-border))`
          }}
          data-testid="card-sentiment-chart"
        >
          {/* Subtle glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            initial={false}
          />
          
          <CardHeader className="relative">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.5 }}
            >
              <CardTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
                Sentiment Distribution
              </CardTitle>
            </motion.div>
          </CardHeader>
          
          <CardContent className="relative">
            <motion.div 
              className="h-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart role="img" aria-label={`Sentiment distribution chart showing ${data.length} categories`}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={125}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={prefersReducedMotion ? 0 : 1200}
                    animationEasing="ease-out"
                    role="presentation"
                    aria-label="Sentiment data segments"
                  >
                    {data.map((entry, index) => (
                      <AnimatedCell
                        key={`cell-${index}`}
                        name={entry.name}
                        isActive={hoveredSegment === entry.name}
                        onHover={handleSegmentHover}
                        onLeave={handleSegmentLeave}
                        instanceId={instanceId}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    ))}
                  </Pie>
                  
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover) / 0.95)",
                      border: "1px solid hsl(var(--border) / 0.5)",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--popover-foreground))",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      backdropFilter: "blur(16px)",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                    labelStyle={{
                      color: "hsl(var(--foreground))",
                      fontWeight: "600"
                    }}
                    cursor={false}
                  />
                  
                  <Legend 
                    content={(props) => (
                      <AnimatedLegend 
                        {...props} 
                        hoveredSegment={hoveredSegment}
                        onSegmentHover={handleSegmentHover}
                        onSegmentLeave={handleSegmentLeave}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pulse effect overlay for active segment */}
            {hoveredSegment && !prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${GRADIENT_COLORS[hoveredSegment as keyof typeof GRADIENT_COLORS]?.glow} 0%, transparent 70%)`,
                    animation: "pulse 2s ease-in-out infinite"
                  }}
                />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}