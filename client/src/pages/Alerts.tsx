import AlertsTable from "@/components/AlertsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock } from "lucide-react";

export default function Alerts() {
  // TODO: remove mock data when integrating with real backend
  const alerts = [
    { id: "1", client: "Acme Corp", trigger: "NPS Score Drop (15%)", date: "2024-03-10", status: "pending" as const },
    { id: "2", client: "Globex Inc.", trigger: "Increased Negative Feedback", date: "2024-03-09", status: "pending" as const },
    { id: "3", client: "Initech Solutions", trigger: "High Churn Probability (75%)", date: "2024-03-08", status: "resolved" as const },
    { id: "4", client: "Cyberdyne Systems", trigger: "No Activity for 30 Days", date: "2024-03-07", status: "pending" as const },
    { id: "5", client: "Umbrella Corp", trigger: "Escalation Rate Increase", date: "2024-03-06", status: "resolved" as const },
    { id: "6", client: "Stark Industries", trigger: "Unresolved Support Tickets", date: "2024-03-05", status: "pending" as const }
  ];

  const emailNotifications = [
    { id: "1", subject: "NPS Drop Alert: Acme Corp", recipient: "john.doe@acmecorp.com", time: "2024-03-10, 10:30 AM" },
    { id: "2", subject: "Negative Feedback Alert: Globex Inc.", recipient: "jane.smith@globexinc.com", time: "2024-03-09, 08:15 AM" },
    { id: "3", subject: "Churn Probability Resolved: Initech Solutions", recipient: "admin@initech.com", time: "2024-03-08, 04:00 PM" },
    { id: "4", subject: "Inactivity Alert: Cyberdyne Systems", recipient: "sarah.connor@cyberdyne.net", time: "2024-03-07, 11:00 AM" }
  ];

  return (
    <div className="space-y-8" data-testid="page-alerts">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alert Management</h1>
        <p className="text-muted-foreground">Monitor and respond to client risk alerts and notifications</p>
      </div>

      {/* Active Alerts */}
      <AlertsTable alerts={alerts} />

      {/* Email Notification Log */}
      <Card data-testid="card-email-notifications">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notification Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailNotifications.map((notification) => (
              <div key={notification.id} className="flex items-center gap-4 p-4 border rounded-lg hover-elevate" data-testid={`notification-${notification.id}`}>
                <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-chart-1" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{notification.subject}</h4>
                  <p className="text-sm text-muted-foreground">To: {notification.recipient}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {notification.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}