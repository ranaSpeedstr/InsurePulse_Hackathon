import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import MetricCard from "@/components/MetricCard";
import SentimentChart from "@/components/SentimentChart";
import AtRiskClients from "@/components/AtRiskClients";
import ClientBenchmarking from "@/components/ClientBenchmarking";

interface DashboardMetrics {
  totalClients: number;
  atRiskClients: number;
  avgRiskScore: number;
  churnRate: number;
}

interface AtRiskClient {
  id: string;
  name: string;
  riskScore: number;
  industry: string;
  healthScore: number;
}

interface BenchmarkData {
  client: string;
  nps: number;
  retention: number;
  supportScore: number;
}

export default function Overview() {
  const [, setLocation] = useLocation();

  const handleClientAction = (clientId: string, action: 'view') => {
    if (action === 'view') {
      setLocation(`/clients?selected=${clientId}`);
    }
  };
  // Fetch dashboard metrics from API
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  // Fetch at-risk clients from API
  const { data: atRiskClientsData, isLoading: clientsLoading } = useQuery<AtRiskClient[]>({
    queryKey: ['/api/dashboard/at-risk-clients'],
  });

  // Fetch benchmarking data from API
  const { data: benchmarkingData, isLoading: benchmarkingLoading } = useQuery<BenchmarkData[]>({
    queryKey: ['/api/dashboard/benchmarking'],
  });

  // Fetch real-time sentiment distribution from API
  const { data: sentimentResponse, isLoading: sentimentLoading } = useQuery<{
    data: Array<{ name: string; value: number; color: string; count: number }>;
    metadata: {
      totalAnalyzed: number;
      lastUpdated: string;
      analysisTypes: Array<{ label: string; count: number; percentage: number }>;
    };
  }>({
    queryKey: ['/api/dashboard/sentiment-distribution'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Chart loading states
  const chartsLoading = sentimentLoading;
  const benchmarkingChartsLoading = benchmarkingLoading;

  // Extract sentiment data from response (fallback to empty array if no data)
  const sentimentData = sentimentResponse?.data || [];

  return (
    <motion.div 
      className="space-y-8" 
      data-testid="page-overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor client sentiment and churn risk across your portfolio</p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <MetricCard 
          title="Total Clients" 
          value={metrics?.totalClients || 0}
          change={5} 
          trend="up" 
          subtitle="current total"
          isLoading={metricsLoading}
        />
        <MetricCard 
          title="At Risk Clients" 
          value={metrics?.atRiskClients || 0}
          change={-12}
          trend={metrics?.atRiskClients && metrics.atRiskClients > 3 ? "up" : "down"} 
          subtitle="need attention"
          isLoading={metricsLoading}
        />
        <MetricCard 
          title="Avg Risk Score" 
          value={metrics?.avgRiskScore || 0}
          change={-8}
          trend={metrics?.avgRiskScore && metrics.avgRiskScore > 75 ? "up" : "down"} 
          subtitle="risk assessment"
          isLoading={metricsLoading}
        />
        <MetricCard 
          title="Churn Rate" 
          value={`${metrics?.churnRate || 0}%`}
          change={3}
          trend={metrics?.churnRate && metrics.churnRate > 20 ? "up" : "down"} 
          subtitle="retention metric"
          isLoading={metricsLoading}
        />
      </motion.div>

      {/* Charts and Analysis */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SentimentChart 
            data={sentimentData} 
            metadata={sentimentResponse?.metadata}
            isLoading={chartsLoading} 
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <ClientBenchmarking data={benchmarkingData || []} isLoading={benchmarkingChartsLoading} />
        </motion.div>
      </motion.div>

      {/* At-Risk Clients */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <AtRiskClients 
          clients={atRiskClientsData || []} 
          onClientAction={handleClientAction}
        />
      </motion.div>
    </motion.div>
  );
}