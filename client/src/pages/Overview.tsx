import { useQuery } from "@tanstack/react-query";
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

export default function Overview() {
  // Fetch dashboard metrics from API
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  // Fetch at-risk clients from API
  const { data: atRiskClientsData, isLoading: clientsLoading } = useQuery<AtRiskClient[]>({
    queryKey: ['/api/dashboard/at-risk-clients'],
  });

  // Mock data for charts (TODO: implement API endpoints for these)
  const sentimentData = [
    { name: "Positive", value: 55, color: "hsl(var(--chart-2))" },
    { name: "Neutral", value: 30, color: "hsl(var(--chart-3))" },
    { name: "Negative", value: 15, color: "hsl(var(--chart-4))" }
  ];

  const benchmarkingData = [
    { client: "Client A", nps: 45, retention: 80, supportScore: 75 },
    { client: "Client B", nps: 40, retention: 75, supportScore: 70 },
    { client: "Client C", nps: 55, retention: 85, supportScore: 80 },
    { client: "Client D", nps: 35, retention: 70, supportScore: 65 },
    { client: "Client E", nps: 65, retention: 90, supportScore: 85 }
  ];

  return (
    <div className="space-y-8" data-testid="page-overview">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor client sentiment and churn risk across your portfolio</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Clients" 
          value={metricsLoading ? "..." : metrics?.totalClients.toString() || "0"} 
          change={0} 
          trend="neutral" 
          subtitle="current total" 
        />
        <MetricCard 
          title="At Risk Clients" 
          value={metricsLoading ? "..." : metrics?.atRiskClients.toString() || "0"} 
          change={0} 
          trend={metrics?.atRiskClients && metrics.atRiskClients > 3 ? "up" : "down"} 
          subtitle="need attention" 
        />
        <MetricCard 
          title="Avg Risk Score" 
          value={metricsLoading ? "..." : metrics?.avgRiskScore.toString() || "0"} 
          change={0} 
          trend={metrics?.avgRiskScore && metrics.avgRiskScore > 75 ? "up" : "down"} 
          subtitle="risk assessment" 
        />
        <MetricCard 
          title="Churn Rate" 
          value={metricsLoading ? "..." : `${metrics?.churnRate || 0}%`} 
          trend={metrics?.churnRate && metrics.churnRate > 20 ? "up" : "down"} 
          subtitle="retention metric" 
        />
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentChart data={sentimentData} />
        <ClientBenchmarking data={benchmarkingData} />
      </div>

      {/* At-Risk Clients */}
      <AtRiskClients clients={atRiskClientsData || []} />
    </div>
  );
}