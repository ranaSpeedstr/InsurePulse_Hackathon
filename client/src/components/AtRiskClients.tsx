import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeletons";
import { AlertTriangle, Eye } from "lucide-react";

interface Client {
  id: string;
  name: string;
  riskScore: number;
  healthScore: number;
}

interface AtRiskClientsProps {
  clients: Client[];
  isLoading?: boolean;
  onClientAction?: (clientId: string, action: 'view') => void;
}

const getRiskLevel = (score: number) => {
  if (score >= 80) return { 
    label: "High", 
    className: "bg-[hsl(var(--risk-high))] text-[hsl(var(--risk-high-foreground))] hover-elevate"
  };
  if (score >= 60) return { 
    label: "Medium", 
    className: "bg-[hsl(var(--risk-medium))] text-[hsl(var(--risk-medium-foreground))] hover-elevate"
  };
  return { 
    label: "Low", 
    className: "bg-[hsl(var(--risk-low))] text-[hsl(var(--risk-low-foreground))] hover-elevate"
  };
};


export default function AtRiskClients({ clients, isLoading = false, onClientAction }: AtRiskClientsProps) {
  if (isLoading) {
    return (
      <Card data-testid="card-at-risk-clients">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            At-Risk Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SkeletonList items={6} showAvatars={true} showActions={true} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-at-risk-clients">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          At-Risk Clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clients.map((client) => {
            const risk = getRiskLevel(client.riskScore);
            
            return (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                data-testid={`client-${client.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                    {client.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">{client.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Risk Score: <span className="font-medium text-foreground">{client.riskScore}</span></span>
                      <span>Health Score: <span className="font-medium text-foreground">{client.healthScore}/10</span></span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${risk.className}`}
                    data-testid={`risk-${client.id}`}
                  >
                    {risk.label}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onClientAction?.(client.id, 'view')}
                    data-testid={`action-${client.id}`}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
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