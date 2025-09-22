import MetricCard from "@/components/MetricCard";
import SentimentChart from "@/components/SentimentChart";
import AtRiskClients from "@/components/AtRiskClients";
import ClientBenchmarking from "@/components/ClientBenchmarking";

export default function Overview() {
  // TODO: remove mock data when integrating with real backend
  const sentimentData = [
    { name: "Positive", value: 55, color: "hsl(var(--chart-2))" },
    { name: "Neutral", value: 30, color: "hsl(var(--chart-3))" },
    { name: "Negative", value: 15, color: "hsl(var(--chart-4))" }
  ];

  const atRiskClients = [
    { id: "A", name: "Acme Corp", riskScore: 88, industry: "Technology", healthScore: 3.2 },
    { id: "B", name: "Globex Inc.", riskScore: 76, industry: "Finance", healthScore: 4.1 },
    { id: "C", name: "Initech Solutions", riskScore: 72, industry: "Healthcare", healthScore: 4.8 },
    { id: "D", name: "Cyberdyne Systems", riskScore: 65, industry: "Manufacturing", healthScore: 5.5 }
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
          value="247" 
          change={12} 
          trend="up" 
          subtitle="vs last month" 
        />
        <MetricCard 
          title="At Risk Clients" 
          value="18" 
          change={-5} 
          trend="down" 
          subtitle="improved this month" 
        />
        <MetricCard 
          title="Avg NPS Score" 
          value="8.2" 
          change={3} 
          trend="up" 
          subtitle="out of 10" 
        />
        <MetricCard 
          title="Churn Rate" 
          value="2.4%" 
          trend="neutral" 
          subtitle="stable" 
        />
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentChart data={sentimentData} />
        <ClientBenchmarking data={benchmarkingData} />
      </div>

      {/* At-Risk Clients */}
      <AtRiskClients clients={atRiskClients} />
    </div>
  );
}