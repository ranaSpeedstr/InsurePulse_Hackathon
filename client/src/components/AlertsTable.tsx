import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface Alert {
  id: string;
  client: string;
  trigger: string;
  date: string;
  status: "pending" | "resolved";
}

interface AlertsTableProps {
  alerts: Alert[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "resolved":
      return <CheckCircle className="w-4 h-4 text-chart-2" />;
    case "pending":
      return <Clock className="w-4 h-4 text-chart-3" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-chart-4" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "resolved":
      return "secondary" as const;
    case "pending":
      return "default" as const;
    default:
      return "destructive" as const;
  }
};

export default function AlertsTable({ alerts }: AlertsTableProps) {
  return (
    <Card data-testid="card-alerts-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Active Client Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
            <div>Client</div>
            <div>Trigger</div>
            <div>Date</div>
            <div>Status</div>
            <div>Action</div>
          </div>
          {alerts.map((alert) => (
            <div key={alert.id} className="grid grid-cols-5 gap-4 items-center py-2 hover-elevate rounded-lg p-2" data-testid={`alert-${alert.id}`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs">
                  {alert.client.charAt(0)}
                </div>
                <span className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">{alert.client}</span>
              </div>
              <div className="text-sm text-muted-foreground">{alert.trigger}</div>
              <div className="text-sm text-muted-foreground">{alert.date}</div>
              <div>
                <Badge variant={getStatusVariant(alert.status)} className="flex items-center gap-1 w-fit">
                  {getStatusIcon(alert.status)}
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </Badge>
              </div>
              <div>
                <Button size="sm" variant="outline" data-testid={`action-${alert.id}`}>
                  Acknowledge / Resolve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}