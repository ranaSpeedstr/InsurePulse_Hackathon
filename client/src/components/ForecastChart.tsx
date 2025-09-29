import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

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
  isLoading?: boolean;
}

const LINE_CONFIGS = {
  sentiment: {
    positive: {
      stroke: "hsl(var(--chart-2))",
      gradient: {
        start: "hsl(var(--chart-gradient-2-start))",
        end: "hsl(var(--chart-gradient-2-end))"
      },
      glow: "hsl(var(--chart-glow-2) / 0.5)"
    },
    neutral: {
      stroke: "hsl(var(--chart-3))",
      gradient: {
        start: "hsl(var(--chart-gradient-3-start))",
        end: "hsl(var(--chart-gradient-3-end))"
      },
      glow: "hsl(var(--chart-glow-3) / 0.5)"
    },
    negative: {
      stroke: "hsl(var(--chart-4))",
      gradient: {
        start: "hsl(var(--chart-gradient-4-start))",
        end: "hsl(var(--chart-gradient-4-end))"
      },
      glow: "hsl(var(--chart-glow-4) / 0.5)"
    }
  },
  churn: {
    churnProbability: {
      stroke: "hsl(var(--chart-4))",
      gradient: {
        start: "hsl(var(--chart-gradient-4-start))",
        end: "hsl(var(--chart-gradient-4-end))"
      },
      glow: "hsl(var(--chart-glow-4) / 0.5)"
    }
  }
};

// Loading skeleton for the chart
function ForecastChartSkeleton({ type }: { type: "sentiment" | "churn" }) {
  const title = type === "sentiment" ? "Sentiment Forecast" : "Churn Risk Probability Trend";
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <Card className="relative overflow-hidden" data-testid={`card-forecast-${type}-skeleton`}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={prefersReducedMotion ? {} : { x: ["0%", "100%"] }}
        transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
      <CardHeader>
        <Skeleton className="h-6 w-48 bg-gradient-to-r from-muted to-muted/60" />
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-center justify-center relative">
          {/* Animated line skeleton */}
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {type === "sentiment" ? (
              <>
                <motion.path
                  d="M 20 180 Q 100 140 200 120 T 380 100"
                  stroke="hsl(var(--chart-2) / 0.3)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.path
                  d="M 20 160 Q 100 140 200 130 T 380 120"
                  stroke="hsl(var(--chart-3) / 0.3)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.path
                  d="M 20 140 Q 100 160 200 150 T 380 140"
                  stroke="hsl(var(--chart-4) / 0.3)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            ) : (
              <motion.path
                d="M 20 160 Q 100 140 200 130 T 380 120"
                stroke="hsl(var(--chart-4) / 0.4)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </svg>
        </div>
        {/* Legend skeleton */}
        <div className="flex justify-center gap-6 mt-4">
          {(type === "sentiment" ? [1, 2, 3] : [1]).map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full bg-gradient-to-r from-muted to-muted/60" />
              <Skeleton className="h-4 w-16 bg-gradient-to-r from-muted to-muted/60" />
            </div>
          ))
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced legend with animations
function AnimatedLegend({ payload, hoveredLine, onLineHover, onLineLeave, prefersReducedMotion }: any) {
  return (
    <motion.div 
      className="flex justify-center gap-6 mt-4"
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, delay: prefersReducedMotion ? 0 : 0.5 }}
      role="list"
      aria-label="Chart legend"
    >
      {payload?.map((entry: any, index: number) => {
        const isHovered = hoveredLine === entry.dataKey;
        
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
                onLineHover(entry.dataKey);
              }
            }}
            onMouseEnter={() => onLineHover(entry.dataKey)}
            onMouseLeave={onLineLeave}
            data-testid={`legend-${entry.dataKey}`}
          >
            <motion.div
              className="h-0.5 w-4 rounded-full"
              style={{
                backgroundColor: entry.color,
                boxShadow: isHovered ? `0 0 8px ${entry.color}80` : 'none'
              }}
              animate={{
                scale: isHovered ? 1.2 : 1,
                height: isHovered ? 6 : 2
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
            >
              {entry.value}
            </motion.span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function ForecastChart({ data, type, isLoading = false }: ForecastChartProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const title = type === "sentiment" ? "Sentiment Forecast" : "Churn Risk Probability Trend";
  const prefersReducedMotion = useReducedMotion();
  const instanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  if (isLoading) {
    return <ForecastChartSkeleton type={type} />;
  }

  const handleLineHover = (line: string) => setHoveredLine(line);
  const handleLineLeave = () => setHoveredLine(null);

  const lineConfigs = LINE_CONFIGS[type];

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
          data-testid={`card-forecast-${type}`}
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
                {title}
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
                <LineChart 
                  data={data} 
                  margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                  role="img"
                  aria-label={`${title} showing ${data.length} data points over time`}
                >
                  {/* Gradient definitions */}
                  <defs>
                    {Object.entries(lineConfigs).map(([key, config]) => (
                      <linearGradient key={key} id={`gradient-${key}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={config.gradient.start} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={config.gradient.end} stopOpacity={0.1} />
                      </linearGradient>
                    ))}
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border) / 0.3)" 
                    className="animate-pulse"
                  />
                  
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  
                  <YAxis 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    domain={type === "churn" ? [0, 20] : [0, 100]}
                    label={{ 
                      value: type === "churn" ? "Probability (%)" : "Sentiment Score (%)", 
                      angle: -90, 
                      position: "insideLeft",
                      style: { textAnchor: "middle", fill: "hsl(var(--muted-foreground))", fontSize: "12px" }
                    }}
                  />
                  
                  <Tooltip 
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
                      fontWeight: "600",
                      marginBottom: "8px"
                    }}
                    formatter={(value, name) => [`${value}%`, name]}
                    cursor={{ 
                      stroke: "hsl(var(--muted) / 0.5)",
                      strokeWidth: 1,
                      strokeDasharray: "5,5"
                    }}
                  />
                  
                  <Legend 
                    content={(props) => (
                      <AnimatedLegend 
                        {...props}
                        hoveredLine={hoveredLine}
                        onLineHover={handleLineHover}
                        onLineLeave={handleLineLeave}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    )}
                  />
                  
                  {type === "sentiment" ? (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: prefersReducedMotion ? 0.01 : 0.8, delay: prefersReducedMotion ? 0 : 0.3 }}
                    >
                      <Line 
                        type="monotone" 
                        dataKey="positive" 
                        stroke={(lineConfigs as any).positive?.stroke || "#22c55e"}
                        strokeWidth={hoveredLine === "positive" ? 4 : 3}
                        name="Positive"
                        dot={{ 
                          fill: (lineConfigs as any).positive?.stroke || "#22c55e", 
                          strokeWidth: 2, 
                          r: hoveredLine === "positive" ? 6 : 4,
                          filter: hoveredLine === "positive" ? `drop-shadow(0 0 6px ${(lineConfigs as any).positive?.glow || "#22c55e80"})` : undefined
                        }}
                        activeDot={{ 
                          r: 6, 
                          fill: (lineConfigs as any).positive?.stroke || "#22c55e",
                          stroke: "hsl(var(--background))",
                          strokeWidth: 2,
                          filter: `drop-shadow(0 0 8px ${(lineConfigs as any).positive?.glow || "#22c55e80"})`
                        }}
                        animationBegin={prefersReducedMotion ? 0 : 0}
                        animationDuration={prefersReducedMotion ? 0 : 1500}
                        animationEasing="ease-out"
                        onMouseEnter={() => handleLineHover("positive")}
                        onMouseLeave={handleLineLeave}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="neutral" 
                        stroke={(lineConfigs as any).neutral?.stroke || "#a3a3a3"}
                        strokeWidth={hoveredLine === "neutral" ? 4 : 3}
                        name="Neutral"
                        dot={{ 
                          fill: (lineConfigs as any).neutral?.stroke || "#a3a3a3", 
                          strokeWidth: 2, 
                          r: hoveredLine === "neutral" ? 6 : 4,
                          filter: hoveredLine === "neutral" ? `drop-shadow(0 0 6px ${(lineConfigs as any).neutral?.glow || "#a3a3a380"})` : undefined
                        }}
                        activeDot={{ 
                          r: 6, 
                          fill: (lineConfigs as any).neutral?.stroke || "#a3a3a3",
                          stroke: "hsl(var(--background))",
                          strokeWidth: 2,
                          filter: `drop-shadow(0 0 8px ${(lineConfigs as any).neutral?.glow || "#a3a3a380"})`
                        }}
                        animationBegin={200}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        onMouseEnter={() => handleLineHover("neutral")}
                        onMouseLeave={handleLineLeave}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="negative" 
                        stroke={(lineConfigs as any).negative?.stroke || "#ef4444"}
                        strokeWidth={hoveredLine === "negative" ? 4 : 3}
                        name="Negative"
                        dot={{ 
                          fill: (lineConfigs as any).negative?.stroke || "#ef4444", 
                          strokeWidth: 2, 
                          r: hoveredLine === "negative" ? 6 : 4,
                          filter: hoveredLine === "negative" ? `drop-shadow(0 0 6px ${(lineConfigs as any).negative?.glow || "#ef444480"})` : undefined
                        }}
                        activeDot={{ 
                          r: 6, 
                          fill: (lineConfigs as any).negative?.stroke || "#ef4444",
                          stroke: "hsl(var(--background))",
                          strokeWidth: 2,
                          filter: `drop-shadow(0 0 8px ${(lineConfigs as any).negative?.glow || "#ef444480"})`
                        }}
                        animationBegin={400}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        onMouseEnter={() => handleLineHover("negative")}
                        onMouseLeave={handleLineLeave}
                      />
                    </motion.g>
                  ) : (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: prefersReducedMotion ? 0.01 : 0.8, delay: prefersReducedMotion ? 0 : 0.3 }}
                    >
                      <Line 
                        type="monotone" 
                        dataKey="churnProbability" 
                        stroke={(lineConfigs as any).churnProbability?.stroke || "#ef4444"}
                        strokeWidth={hoveredLine === "churnProbability" ? 5 : 4}
                        name="Churn Probability"
                        dot={{ 
                          fill: (lineConfigs as any).churnProbability?.stroke || "#ef4444", 
                          strokeWidth: 2, 
                          r: hoveredLine === "churnProbability" ? 7 : 5,
                          filter: hoveredLine === "churnProbability" ? `drop-shadow(0 0 8px ${(lineConfigs as any).churnProbability?.glow || "#ef444480"})` : undefined
                        }}
                        activeDot={{ 
                          r: 8, 
                          fill: (lineConfigs as any).churnProbability?.stroke || "#ef4444",
                          stroke: "hsl(var(--background))",
                          strokeWidth: 3,
                          filter: `drop-shadow(0 0 10px ${(lineConfigs as any).churnProbability?.glow || "#ef444480"})`
                        }}
                        animationBegin={prefersReducedMotion ? 0 : 0}
                        animationDuration={prefersReducedMotion ? 0 : 1500}
                        animationEasing="ease-out"
                        onMouseEnter={() => handleLineHover("churnProbability")}
                        onMouseLeave={handleLineLeave}
                      />
                    </motion.g>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Glow effect overlay for hovered line */}
            {hoveredLine && !prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at center, ${(lineConfigs as any)[hoveredLine]?.glow || "#ef444480"} 0%, transparent 70%)`,
                    filter: "blur(20px)"
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