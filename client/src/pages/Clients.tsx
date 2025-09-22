import { useState } from "react";
import Client360View from "@/components/Client360View";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Clients() {
  const [selectedClient, setSelectedClient] = useState("A");
  
  // TODO: remove mock data when integrating with real backend
  const clients = [
    { id: "A", name: "Global Innovations Inc." },
    { id: "B", name: "Tech Solutions Ltd." },
    { id: "C", name: "Digital Dynamics Corp." },
    { id: "D", name: "Future Systems Inc." },
    { id: "E", name: "Innovation Hub LLC" }
  ];

  const clientProfiles = {
    A: {
      id: "A",
      name: "Global Innovations Inc.",
      primaryContact: "Sarah Chen", 
      region: "North America",
      industry: "Technology",
      contractStatus: "Active",
      annualSpend: 250000,
      healthScore: 9.2,
      riskFlag: "Low",
      email: "sarah.chen@globalinnovations.com"
    },
    B: {
      id: "B",
      name: "Tech Solutions Ltd.",
      primaryContact: "Michael Johnson",
      region: "Europe", 
      industry: "Software",
      contractStatus: "Ending Soon",
      annualSpend: 180000,
      healthScore: 4.5,
      riskFlag: "High",
      email: "m.johnson@techsolutions.com"
    },
    C: {
      id: "C",
      name: "Digital Dynamics Corp.",
      primaryContact: "Emily Rodriguez",
      region: "South America",
      industry: "Healthcare",
      contractStatus: "Active",
      annualSpend: 320000,
      healthScore: 7.8,
      riskFlag: "Medium", 
      email: "e.rodriguez@digitaldynamics.com"
    },
    D: {
      id: "D",
      name: "Future Systems Inc.",
      primaryContact: "David Kim",
      region: "Asia Pacific",
      industry: "Manufacturing",
      contractStatus: "Renewed",
      annualSpend: 150000,
      healthScore: 8.9,
      riskFlag: "Low",
      email: "d.kim@futuresystems.com"
    },
    E: {
      id: "E",
      name: "Innovation Hub LLC",
      primaryContact: "Lisa Thompson",
      region: "North America",
      industry: "Consulting",
      contractStatus: "Active",
      annualSpend: 280000,
      healthScore: 6.2,
      riskFlag: "Medium",
      email: "l.thompson@innovationhub.com"
    }
  };

  const feedbackData = {
    A: [
      { id: "1", date: "2024-03-15", type: "email" as const, sentiment: "positive" as const, content: "Great progress on Project Alpha. Team is very responsive and delivers high-quality work." },
      { id: "2", date: "2024-02-28", type: "call" as const, sentiment: "neutral" as const, content: "Discussed upcoming feature requests and resource allocation. No major concerns." },
      { id: "3", date: "2024-02-01", type: "email" as const, sentiment: "positive" as const, content: "Appreciate the proactive communication regarding potential delays. Very professional." }
    ],
    B: [
      { id: "1", date: "2024-03-12", type: "call" as const, sentiment: "negative" as const, content: "Frustrated with recent bugs in production. This is affecting our operations significantly." },
      { id: "2", date: "2024-03-05", type: "email" as const, sentiment: "negative" as const, content: "Still waiting for resolution on three escalated issues. Management is considering alternatives." }
    ],
    C: [
      { id: "1", date: "2024-03-14", type: "email" as const, sentiment: "positive" as const, content: "Thanks for the smooth rollout. Operations team is pleased with the results." },
      { id: "2", date: "2024-03-08", type: "call" as const, sentiment: "neutral" as const, content: "Response times during peak hours need improvement, but overall satisfied." }
    ],
    D: [
      { id: "1", date: "2024-03-13", type: "email" as const, sentiment: "positive" as const, content: "Excellent work on the reporting module. Analytics have improved significantly." },
      { id: "2", date: "2024-03-06", type: "call" as const, sentiment: "positive" as const, content: "Leadership is impressed with proactive communication from your team." }
    ],
    E: [
      { id: "1", date: "2024-03-11", type: "call" as const, sentiment: "neutral" as const, content: "Backlog of enhancement requests is concerning. Need clearer roadmap." },
      { id: "2", date: "2024-03-04", type: "email" as const, sentiment: "positive" as const, content: "Bug fix turnaround time was impressive last week. Well done." }
    ]
  };

  const metricsData = {
    A: [
      { label: "Delivered Projects", value: 12, trend: "up" as const },
      { label: "Backlog Items", value: 5, trend: "down" as const },
      { label: "Escalations", value: 0, trend: "neutral" as const },
      { label: "NPS Score", value: 9.2, trend: "up" as const }
    ],
    B: [
      { label: "Delivered Projects", value: 8, trend: "down" as const },
      { label: "Backlog Items", value: 12, trend: "up" as const },
      { label: "Escalations", value: 5, trend: "up" as const },
      { label: "NPS Score", value: 4.5, trend: "down" as const }
    ],
    C: [
      { label: "Delivered Projects", value: 10, trend: "up" as const },
      { label: "Backlog Items", value: 7, trend: "neutral" as const },
      { label: "Escalations", value: 1, trend: "down" as const },
      { label: "NPS Score", value: 7.8, trend: "up" as const }
    ],
    D: [
      { label: "Delivered Projects", value: 15, trend: "up" as const },
      { label: "Backlog Items", value: 3, trend: "down" as const },
      { label: "Escalations", value: 0, trend: "neutral" as const },
      { label: "NPS Score", value: 8.9, trend: "up" as const }
    ],
    E: [
      { label: "Delivered Projects", value: 9, trend: "neutral" as const },
      { label: "Backlog Items", value: 8, trend: "up" as const },
      { label: "Escalations", value: 2, trend: "neutral" as const },
      { label: "NPS Score", value: 6.2, trend: "down" as const }
    ]
  };

  const currentProfile = clientProfiles[selectedClient as keyof typeof clientProfiles];
  const currentFeedback = feedbackData[selectedClient as keyof typeof feedbackData];
  const currentMetrics = metricsData[selectedClient as keyof typeof metricsData];

  return (
    <div className="space-y-8" data-testid="page-clients">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client 360° View</h1>
          <p className="text-muted-foreground">Comprehensive client insights combining all data sources</p>
        </div>
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Client:</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger data-testid="select-client">
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    Client {client.id} - {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Client360View 
        profile={currentProfile}
        feedback={currentFeedback}
        metrics={currentMetrics}
      />
    </div>
  );
}