import AlertsTable from '../AlertsTable';

export default function AlertsTableExample() {
  // TODO: remove mock data when integrating with real backend
  const mockAlerts = [
    { id: "1", client: "Acme Corp", trigger: "NPS Score Drop (15%)", date: "2024-03-10", status: "pending" as const },
    { id: "2", client: "Globex Inc.", trigger: "Increased Negative Feedback", date: "2024-03-09", status: "pending" as const },
    { id: "3", client: "Initech Solutions", trigger: "High Churn Probability (75%)", date: "2024-03-08", status: "resolved" as const },
    { id: "4", client: "Cyberdyne Systems", trigger: "No Activity for 30 Days", date: "2024-03-07", status: "pending" as const },
    { id: "5", client: "Umbrella Corp", trigger: "Escalation Rate Increase", date: "2024-03-06", status: "resolved" as const }
  ];

  return <AlertsTable alerts={mockAlerts} />;
}