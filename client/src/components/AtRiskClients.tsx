import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User } from "lucide-react";

interface Client {
  id: string;
  name: string;
  riskScore: number;
  industry: string;
  healthScore: number;
}

interface AtRiskClientsProps {
  clients: Client[];
}

const getRiskLevel = (score: number) => {
  if (score >= 80) return { label: "High", variant: "destructive" as const };
  if (score >= 60) return { label: "Medium", variant: "default" as const };
  return { label: "Low", variant: "secondary" as const };
};

export default function AtRiskClients({ clients }: AtRiskClientsProps) {
  return (
    <Card data-testid="card-at-risk-clients">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          At-Risk Clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client) => {
            const risk = getRiskLevel(client.riskScore);
            return (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate" data-testid={`client-${client.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{client.name}</h4>
                    <p className="text-sm text-muted-foreground">{client.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">Risk Score: {client.riskScore}</div>
                    <div className="text-sm text-muted-foreground">Health: {client.healthScore}/10</div>
                  </div>
                  <Badge variant={risk.variant} data-testid={`risk-${client.id}`}>
                    {risk.label}
                  </Badge>
                  <Button size="sm" variant="outline" data-testid={`action-${client.id}`}>
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}