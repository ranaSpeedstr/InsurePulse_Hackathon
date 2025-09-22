import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// Enhanced base skeleton with shimmer effect
function SkeletonWithShimmer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <Skeleton className={cn("w-full h-full", className)} />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -translate-x-full"
        animate={prefersReducedMotion ? {} : {
          x: ["0%", "100%"]
        }}
        transition={prefersReducedMotion ? {} : {
          repeat: Infinity,
          duration: 1.5,
          ease: "linear"
        }}
      />
    </div>
  );
}

// Staggered container for multiple skeleton items
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

interface SkeletonContainerProps {
  children: React.ReactNode;
  className?: string;
}

function SkeletonContainer({ children, className }: SkeletonContainerProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card skeleton component
interface SkeletonCardProps {
  showHeader?: boolean;
  headerHeight?: number;
  contentLines?: number;
  contentHeight?: number;
  className?: string;
  actions?: boolean;
}

function SkeletonCard({
  showHeader = true,
  headerHeight = 6,
  contentLines = 3,
  contentHeight,
  className,
  actions = false
}: SkeletonCardProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div variants={itemVariants} className={className}>
      <Card className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full"
          animate={prefersReducedMotion ? {} : {
            x: ["0%", "100%"]
          }}
          transition={prefersReducedMotion ? {} : {
            repeat: Infinity,
            duration: 2,
            ease: "linear"
          }}
        />
        {showHeader && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <SkeletonWithShimmer className="w-3/4 rounded" style={{ height: `${headerHeight * 0.25}rem` }} />
              <SkeletonWithShimmer className="h-4 w-4 rounded-full" />
            </div>
          </CardHeader>
        )}
        <CardContent className={showHeader ? "pt-0" : "pt-6"}>
          <div className="space-y-3">
            {contentHeight ? (
              <SkeletonWithShimmer className="w-full rounded" style={{ height: `${contentHeight * 0.25}rem` }} />
            ) : (
              Array.from({ length: contentLines }).map((_, i) => (
                <SkeletonWithShimmer
                  key={i}
                  className={`h-4 rounded ${
                    i === contentLines - 1 ? 'w-2/3' : 'w-full'
                  }`}
                />
              ))
            )}
            {actions && (
              <div className="flex gap-2 pt-2">
                <SkeletonWithShimmer className="h-8 w-20 rounded" />
                <SkeletonWithShimmer className="h-8 w-16 rounded" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Table skeleton component
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}: SkeletonTableProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div variants={itemVariants} className={className}>
      <Card className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full"
          animate={prefersReducedMotion ? {} : {
            x: ["0%", "100%"]
          }}
          transition={prefersReducedMotion ? {} : {
            repeat: Infinity,
            duration: 2.5,
            ease: "linear"
          }}
        />
        <CardContent className="p-0">
          <div className="overflow-hidden">
            {showHeader && (
              <div className="bg-muted/50 p-4 border-b">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                  {Array.from({ length: columns }).map((_, i) => (
                    <SkeletonWithShimmer key={i} className="h-4 w-3/4 rounded" />
                  ))}
                </div>
              </div>
            )}
            <div className="divide-y">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <motion.div
                  key={rowIndex}
                  variants={itemVariants}
                  className="p-4"
                >
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                      <SkeletonWithShimmer
                        key={colIndex}
                        className={`h-4 rounded ${
                          colIndex === 0 ? 'w-full' : 
                          colIndex === columns - 1 ? 'w-2/3' : 'w-4/5'
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// List skeleton component
interface SkeletonListProps {
  items?: number;
  showAvatars?: boolean;
  showActions?: boolean;
  className?: string;
}

function SkeletonList({
  items = 6,
  showAvatars = true,
  showActions = true,
  className
}: SkeletonListProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div variants={itemVariants} className={className}>
      <Card className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full"
          animate={prefersReducedMotion ? {} : {
            x: ["0%", "100%"]
          }}
          transition={prefersReducedMotion ? {} : {
            repeat: Infinity,
            duration: 1.8,
            ease: "linear"
          }}
        />
        <CardContent className="p-0">
          <div className="divide-y">
            {Array.from({ length: items }).map((_, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  {showAvatars && (
                    <SkeletonWithShimmer className="w-10 h-10 rounded-full flex-shrink-0" />
                  )}
                  <div className="space-y-2 flex-1">
                    <SkeletonWithShimmer className="h-4 w-3/4 rounded" />
                    <SkeletonWithShimmer className="h-3 w-1/2 rounded" />
                  </div>
                </div>
                {showActions && (
                  <div className="flex items-center gap-2">
                    <SkeletonWithShimmer className="h-6 w-16 rounded" />
                    <SkeletonWithShimmer className="h-8 w-20 rounded" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Chart skeleton component
interface SkeletonChartProps {
  height?: number;
  showLegend?: boolean;
  className?: string;
}

function SkeletonChart({
  height = 64,
  showLegend = true,
  className
}: SkeletonChartProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div variants={itemVariants} className={className}>
      <Card className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full"
          animate={prefersReducedMotion ? {} : {
            x: ["0%", "100%"]
          }}
          transition={prefersReducedMotion ? {} : {
            repeat: Infinity,
            duration: 2.2,
            ease: "linear"
          }}
        />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SkeletonWithShimmer className="h-6 w-1/3 rounded" />
            {showLegend && (
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <SkeletonWithShimmer className="w-3 h-3 rounded-full" />
                  <SkeletonWithShimmer className="h-3 w-16 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonWithShimmer className="w-3 h-3 rounded-full" />
                  <SkeletonWithShimmer className="h-3 w-16 rounded" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <SkeletonWithShimmer className="w-full rounded" style={{ height: `${height * 0.25}rem` }} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Alert skeleton component
interface SkeletonAlertProps {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  showActions?: boolean;
  className?: string;
}

function SkeletonAlert({
  severity = 'medium',
  showActions = true,
  className
}: SkeletonAlertProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      <Card className={`border-l-4 ${getSeverityColor(severity)} relative overflow-hidden`}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full"
          animate={prefersReducedMotion ? {} : {
            x: ["0%", "100%"]
          }}
          transition={prefersReducedMotion ? {} : {
            repeat: Infinity,
            duration: 1.7,
            ease: "linear"
          }}
        />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <SkeletonWithShimmer className="w-5 h-5 rounded flex-shrink-0 mt-1" />
              <div className="space-y-2 flex-1">
                <SkeletonWithShimmer className="h-5 w-3/4 rounded" />
                <SkeletonWithShimmer className="h-4 w-1/2 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkeletonWithShimmer className="h-6 w-16 rounded" />
              <SkeletonWithShimmer className="h-6 w-20 rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <SkeletonWithShimmer className="h-4 w-full rounded" />
            <SkeletonWithShimmer className="h-4 w-4/5 rounded" />
            {showActions && (
              <div className="flex gap-2 pt-3">
                <SkeletonWithShimmer className="h-8 w-24 rounded" />
                <SkeletonWithShimmer className="h-8 w-20 rounded" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Metric cards grid skeleton
interface SkeletonMetricsProps {
  count?: number;
  columns?: number;
  className?: string;
}

function SkeletonMetrics({
  count = 4,
  columns = 4,
  className
}: SkeletonMetricsProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <SkeletonContainer className={cn(`grid gap-4`, className)} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div key={index} variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full"
              animate={prefersReducedMotion ? {} : {
                x: ["0%", "100%"]
              }}
              transition={prefersReducedMotion ? {} : {
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
                delay: index * 0.1
              }}
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-3">
                <SkeletonWithShimmer className="h-4 w-24 rounded" />
                <SkeletonWithShimmer className="h-4 w-4 rounded" />
              </div>
              <div className="space-y-2">
                <SkeletonWithShimmer className="h-8 w-16 rounded" />
                <div className="flex items-center gap-2">
                  <SkeletonWithShimmer className="h-3 w-12 rounded" />
                  <SkeletonWithShimmer className="h-3 w-20 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </SkeletonContainer>
  );
}

// Page content skeleton
interface SkeletonPageProps {
  showHeader?: boolean;
  headerTitle?: boolean;
  headerActions?: boolean;
  children?: React.ReactNode;
  className?: string;
}

function SkeletonPage({
  showHeader = true,
  headerTitle = true,
  headerActions = false,
  children,
  className
}: SkeletonPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn("space-y-6", className)}
    >
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {headerTitle && <SkeletonWithShimmer className="h-8 w-64 rounded" />}
            <SkeletonWithShimmer className="h-4 w-96 rounded" />
          </div>
          {headerActions && (
            <div className="flex items-center gap-4">
              <SkeletonWithShimmer className="h-6 w-20 rounded" />
              <SkeletonWithShimmer className="h-10 w-32 rounded" />
            </div>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}

export {
  SkeletonWithShimmer,
  SkeletonContainer,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonChart,
  SkeletonAlert,
  SkeletonMetrics,
  SkeletonPage,
  containerVariants,
  itemVariants
};