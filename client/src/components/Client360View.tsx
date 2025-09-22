import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { User, Building, DollarSign, TrendingUp, MessageSquare } from "lucide-react";

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

export default function Client360View({ profile, feedback, metrics }: Client360ViewProps) {
  return (
    <div className="space-y-6" data-testid="client-360-view">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.primaryContact}</p>
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
              <p className="text-sm font-medium text-muted-foreground">Region</p>
              <p className="text-lg font-semibold">{profile.region}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Industry</p>
              <p className="text-lg font-semibold">{profile.industry}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contract Status</p>
              <p className="text-lg font-semibold">{profile.contractStatus}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Health Score</p>
              <div className="flex items-center gap-2">
                <Progress value={profile.healthScore * 10} className="w-16" />
                <span className="text-lg font-semibold">{profile.healthScore}/10</span>
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
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <TrendingUp className={`w-4 h-4 ${metric.trend === 'up' ? 'text-chart-2' : metric.trend === 'down' ? 'text-chart-4' : 'text-muted-foreground'}`} />
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
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
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
                        <Badge variant={getSentimentBadge(item.sentiment) as any}>
                          {item.sentiment}
                        </Badge>
                        <Badge variant="outline">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-chart-2/10 border border-chart-2/20 rounded-lg">
                  <h4 className="font-medium text-chart-2 mb-2">Root Causes</h4>
                  <p className="text-sm">Consistent communication and high-quality deliverables are driving strong client satisfaction. Proactive issue resolution prevents escalation.</p>
                </div>
                <div className="p-4 bg-chart-1/10 border border-chart-1/20 rounded-lg">
                  <h4 className="font-medium text-chart-1 mb-2">Recommendations</h4>
                  <p className="text-sm">Continue regular check-ins and scope alignment meetings. Explore opportunities for upselling new services based on demonstrated value.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}