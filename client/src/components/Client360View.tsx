import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  SkeletonCard,
  SkeletonTable,
  SkeletonContainer,
  SkeletonMetrics,
  SkeletonPage,
} from "@/components/ui/skeletons";
import {
  User,
  Building,
  DollarSign,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Users,
  Wrench,
  Target,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Mail,
  Phone,
  BarChart2,
  RefreshCw,
  Brain,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { ClientInsights, AIInsightItem, ActionItem } from "@shared/schema";

interface ClientProfile {
  id: string;
  name: string;
  primaryContact: string;
  region: string;
  industry: string;
  contractStatus: string;
  annualSpend: number;
  healthScore: number;
  riskFlag: string;
  email: string;
}

interface FeedbackItem {
  id: string;
  date: string;
  type: "email" | "call";
  sentiment: "positive" | "neutral" | "negative";
  content: string;
}

interface Metric {
  label: string;
  value: number;
  trend: "up" | "down" | "neutral";
}

interface Client360ViewProps {
  profile: ClientProfile;
  feedback: FeedbackItem[];
  metrics: Metric[];
  isLoading?: boolean;
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "text-chart-2";
    case "negative":
      return "text-chart-4";
    default:
      return "text-chart-3";
  }
};

const getSentimentBadge = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "secondary";
    case "negative":
      return "destructive";
    default:
      return "default";
  }
};

const getRiskBadgeVariant = (risk: string) => {
  switch (risk.toLowerCase()) {
    case "high":
      return "destructive" as const;
    case "medium":
      return "default" as const;
    default:
      return "secondary" as const;
  }
};

export default function Client360View({
  profile,
  feedback,
  metrics,
  isLoading = false,
}: Client360ViewProps) {
  // Fetch AI insights for this client
  const {
    data: insights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useQuery<ClientInsights>({
    queryKey: ["/api/clients", profile?.id, "insights"],
    enabled: !!profile?.id && !isLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes - avoid excessive API calls
    refetchInterval: false, // Don't auto-refetch, only manual refresh
  });

  if (isLoading) {
    return (
      <SkeletonContainer
        className="space-y-6"
        data-testid="client-360-view-loading"
      >
        {/* Profile Header Skeleton */}
        <SkeletonCard showHeader={false} contentHeight={32} />

        {/* Tabs Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-1 border-b mb-6">
              <div className="h-10 w-32 bg-muted animate-pulse rounded-t" />
              <div className="h-10 w-36 bg-muted/60 animate-pulse rounded-t" />
              <div className="h-10 w-28 bg-muted/60 animate-pulse rounded-t" />
            </div>
            <SkeletonMetrics count={4} columns={4} />
          </CardContent>
        </Card>
      </SkeletonContainer>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
      data-testid="client-360-view"
    >
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.id}</h2>
                <p className="text-muted-foreground">
                  {profile.primaryContact}
                </p>
              </div>
            </CardTitle>
            <Badge variant={getRiskBadgeVariant(profile.riskFlag)}>
              Risk: {profile.riskFlag}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Region
              </p>
              <p className="text-lg font-semibold">{profile.region}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Industry
              </p>
              <p className="text-lg font-semibold">{profile.industry}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Contract Status
              </p>
              <p className="text-lg font-semibold">{profile.contractStatus}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Health Score
              </p>
              <div className="flex items-center gap-2">
                <Progress value={profile.healthScore * 10} className="w-16" />
                <span className="text-lg font-semibold">
                  {profile.healthScore}/10
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Timeline</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <TrendingUp
                      className={`w-4 h-4 ${metric.trend === "up" ? "text-chart-2" : metric.trend === "down" ? "text-chart-4" : "text-muted-foreground"}`}
                    />
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      {item.type === "email" ? (
                        <MessageSquare className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{item.date}</span>
                        <Badge
                          variant={getSentimentBadge(item.sentiment) as any}
                        >
                          {item.sentiment}
                        </Badge>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* AI Insights Header with Refresh */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6" />
                <h2 className="text-xl font-bold">
                  AI-Powered Client Insights
                </h2>
              </div>
              <Button
                onClick={() => refetchInsights()}
                disabled={insightsLoading}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                data-testid="button-refresh-insights"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${insightsLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            <p className="text-blue-100">
              {insights
                ? `Generated comprehensive analysis with ${insights.confidenceScore}% confidence`
                : "Loading comprehensive analysis of client data sources with actionable insights"}
            </p>
            {insights && (
              <div className="flex items-center gap-4 mt-3 text-sm text-blue-100">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Generated: {new Date(insights.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  <span>
                    {insights.dataSourcesAnalyzed.length} data sources
                  </span>
                </div>
              </div>
            )}
          </div>

          {insightsLoading ? (
            <div className="space-y-4" data-testid="insights-loading">
              <SkeletonCard showHeader={true} />
              <SkeletonCard showHeader={true} />
              <SkeletonCard showHeader={true} />
            </div>
          ) : insightsError ? (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-destructive mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-semibold">
                    Unable to Generate AI Insights
                  </h3>
                </div>
                <p className="text-muted-foreground mb-3">
                  {insightsError.message ||
                    "Failed to fetch AI-powered insights. This could be due to API limitations or temporary service issues."}
                </p>
                <Button
                  onClick={() => refetchInsights()}
                  variant="outline"
                  size="sm"
                  data-testid="button-retry-insights"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : insights ? (
            <>
              {/* Health Assessment Card */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Target className="w-5 h-5" />
                      Overall Health Assessment
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {insights.overallHealthScore}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <Progress
                      value={insights.overallHealthScore}
                      className="w-full mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {insights.healthAssessment}
                    </p>
                  </div>
                  {insights.trendAnalysis && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Trend Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        {insights.trendAnalysis}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="bg-green-50 dark:bg-green-900/20">
                  <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                    <Database className="w-5 h-5" />
                    Data Sources Analyzed by AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {insights.dataSourcesAnalyzed.map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">{source}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              {insights.riskFactors && insights.riskFactors.length > 0 && (
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="bg-red-50 dark:bg-red-900/20">
                    <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
                      <AlertTriangle className="w-5 h-5" />
                      Risk Factors ({insights.riskFactors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {insights.riskFactors.map((risk, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{risk.title}</h4>
                            <div className="flex gap-2">
                              <Badge
                                variant={
                                  risk.severity === "Critical"
                                    ? "destructive"
                                    : risk.severity === "High"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {risk.severity}
                              </Badge>
                              <Badge variant="outline">
                                {risk.confidence}% confidence
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {risk.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Opportunities */}
              {insights.opportunities && insights.opportunities.length > 0 && (
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="bg-green-50 dark:bg-green-900/20">
                    <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                      <TrendingUp className="w-5 h-5" />
                      Growth Opportunities ({insights.opportunities.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {insights.opportunities.map((opportunity, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-green-800 dark:text-green-200">
                              {opportunity.title}
                            </h4>
                            <div className="flex gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                {opportunity.severity} Impact
                              </Badge>
                              <Badge variant="outline">
                                {opportunity.confidence}% confidence
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {opportunity.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Items */}
              {insights.actionItems && insights.actionItems.length > 0 && (
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
                    <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                      <Wrench className="w-5 h-5" />
                      Recommended Actions ({insights.actionItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                          <TableHead>Action</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Assignee</TableHead>
                          <TableHead>Timeline</TableHead>
                          <TableHead>Expected Impact</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.actionItems.map((action, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {action.title}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {action.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  action.priority === "Urgent"
                                    ? "destructive"
                                    : action.priority === "High"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {action.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-800 border-blue-200"
                              >
                                {action.assignee}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {action.timeline}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {action.expectedImpact}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Next Review */}
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      Next insights review recommended:{" "}
                      {new Date(insights.nextReviewDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-2">No insights available</h3>
                <p className="text-muted-foreground mb-3">
                  Click refresh to generate AI-powered insights for this client.
                </p>
                <Button
                  onClick={() => refetchInsights()}
                  data-testid="button-generate-insights"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Insights
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
