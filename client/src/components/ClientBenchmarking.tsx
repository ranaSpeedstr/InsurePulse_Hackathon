import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface BenchmarkData {
  client: string;
  nps: number;
  retention: number;
  supportScore: number;
}

interface ClientBenchmarkingProps {
  data: BenchmarkData[];
  isLoading?: boolean;
}

const METRIC_CONFIGS = {
  nps: {
    gradient: {
      start: "hsl(var(--chart-gradient-1-start))",
      end: "hsl(var(--chart-gradient-1-end))"
    },
    glow: "hsl(var(--chart-glow-1) / 0.3)",
    color: "hsl(var(--chart-1))"
  },
  retention: {
    gradient: {
      start: "hsl(var(--chart-gradient-2-start))",
      end: "hsl(var(--chart-gradient-2-end))"
    },
    glow: "hsl(var(--chart-glow-2) / 0.3)",
    color: "hsl(var(--chart-2))"
  },
  supportScore: {
    gradient: {
      start: "hsl(var(--chart-gradient-4-start))",
      end: "hsl(var(--chart-gradient-4-end))"
    },
    glow: "hsl(var(--chart-glow-4) / 0.3)",
    color: "hsl(var(--chart-4))"
  }
};

// Loading skeleton for the chart
function ClientBenchmarkingSkeleton() {
  return (
    <Card className="relative overflow-hidden" data-testid="card-client-benchmarking-skeleton">
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["0%", "100%"] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
      <CardHeader>
        <Skeleton className="h-6 w-40 bg-gradient-to-r from-muted to-muted/60" />
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-end justify-center gap-4 px-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div className="flex gap-1">
                <Skeleton className="flex-1 bg-gradient-to-t from-chart-1/30 to-chart-1/60" style={{ height: `${Math.random() * 40 + 40}%` }} />
                <Skeleton className="flex-1 bg-gradient-to-t from-chart-2/30 to-chart-2/60" style={{ height: `${Math.random() * 40 + 40}%` }} />
                <Skeleton className="flex-1 bg-gradient-to-t from-chart-4/30 to-chart-4/60" style={{ height: `${Math.random() * 40 + 40}%` }} />
              </div>
              <Skeleton className="h-3 w-full bg-gradient-to-r from-muted to-muted/60" />
            </div>
          ))}
        </div>
        {/* Legend skeleton */}
        <div className="flex justify-center gap-6 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded bg-gradient-to-r from-muted to-muted/60" />
              <Skeleton className="h-4 w-20 bg-gradient-to-r from-muted to-muted/60" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced legend with animations
function AnimatedLegend({ payload, hoveredMetric, onMetricHover, onMetricLeave }: any) {
  return (
    <motion.div 
      className="flex justify-center gap-6 mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {payload?.map((entry: any, index: number) => {
        const isHovered = hoveredMetric === entry.dataKey;
        const metricConfig = METRIC_CONFIGS[entry.dataKey as keyof typeof METRIC_CONFIGS];
        
        return (
          <motion.div
            key={index}
            className="flex items-center gap-2 cursor-pointer select-none"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => onMetricHover(entry.dataKey)}
            onMouseLeave={onMetricLeave}
            data-testid={`legend-${entry.dataKey}`}
          >
            <motion.div
              className="h-3 w-4 rounded"
              style={{
                background: `linear-gradient(135deg, ${metricConfig?.gradient.start}, ${metricConfig?.gradient.end})`,
                boxShadow: isHovered ? `0 0 8px ${metricConfig?.glow}` : 'none'
              }}
              animate={{
                scale: isHovered ? 1.2 : 1,
                boxShadow: isHovered ? `0 0 12px ${metricConfig?.glow}` : '0 0 0px transparent'
              }}
              transition={{ duration: 0.2 }}
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

// Custom Bar component with gradients
function GradientBar({ dataKey, name, ...props }: any) {
  const metricConfig = METRIC_CONFIGS[dataKey as keyof typeof METRIC_CONFIGS];
  
  return (
    <>
      <defs>
        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={metricConfig?.gradient.end} />
          <stop offset="100%" stopColor={metricConfig?.gradient.start} />
        </linearGradient>
      </defs>
      <Bar
        {...props}
        dataKey={dataKey}
        name={name}
        fill={`url(#gradient-${dataKey})`}
        radius={[4, 4, 0, 0]}
        animationBegin={0}
        animationDuration={800}
        animationEasing="ease-out"
      />
    </>
  );
}

export default function ClientBenchmarking({ data, isLoading = false }: ClientBenchmarkingProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [hoveredClient, setHoveredClient] = useState<string | null>(null);

  if (isLoading) {
    return <ClientBenchmarkingSkeleton />;
  }

  const handleMetricHover = (metric: string) => setHoveredMetric(metric);
  const handleMetricLeave = () => setHoveredMetric(null);
  const handleClientHover = (client: string) => setHoveredClient(client);
  const handleClientLeave = () => setHoveredClient(null);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card 
          className="relative overflow-hidden group hover:shadow-xl transition-all duration-500 ease-out"
          style={{
            background: `linear-gradient(135deg, hsl(var(--chart-container-bg)) 0%, hsl(var(--card)) 100%)`,
            border: `1px solid hsl(var(--chart-container-border))`
          }}
          data-testid="card-client-benchmarking"
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
              transition={{ duration: 0.5 }}
            >
              <CardTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
                Client Benchmarking
              </CardTitle>
            </motion.div>
          </CardHeader>
          
          <CardContent className="relative">
            <motion.div 
              className="h-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  onMouseEnter={(data) => data?.activeLabel && handleClientHover(data.activeLabel)}
                  onMouseLeave={handleClientLeave}
                >
                  {/* Gradient definitions */}
                  <defs>
                    {Object.entries(METRIC_CONFIGS).map(([key, config]) => (
                      <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor={config.gradient.end} />
                        <stop offset="100%" stopColor={config.gradient.start} />
                      </linearGradient>
                    ))}
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border) / 0.3)" 
                    className="animate-pulse"
                  />
                  
                  <XAxis 
                    dataKey="client" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  
                  <YAxis 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
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
                    cursor={{ 
                      fill: "hsl(var(--muted) / 0.2)",
                      radius: 4
                    }}
                  />
                  
                  <Legend 
                    content={(props) => (
                      <AnimatedLegend 
                        {...props}
                        hoveredMetric={hoveredMetric}
                        onMetricHover={handleMetricHover}
                        onMetricLeave={handleMetricLeave}
                      />
                    )}
                  />
                  
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <Bar 
                      dataKey="nps" 
                      fill="url(#gradient-nps)" 
                      name="NPS" 
                      radius={[4, 4, 0, 0]}
                      animationBegin={100}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="retention" 
                      fill="url(#gradient-retention)" 
                      name="Retention" 
                      radius={[4, 4, 0, 0]}
                      animationBegin={200}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="supportScore" 
                      fill="url(#gradient-supportScore)" 
                      name="Support Score" 
                      radius={[4, 4, 0, 0]}
                      animationBegin={300}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </motion.g>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Glow effect overlay for hovered client */}
            {hoveredClient && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div 
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-full h-32"
                  style={{
                    background: `linear-gradient(to top, hsl(var(--primary) / 0.1) 0%, transparent 100%)`,
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