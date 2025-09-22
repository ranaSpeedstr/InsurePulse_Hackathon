import Client360View from '../Client360View';

export default function Client360ViewExample() {
  // TODO: remove mock data when integrating with real backend
  const mockProfile = {
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
  };

  const mockFeedback = [
    {
      id: "1",
      date: "2024-03-15",
      type: "email" as const,
      sentiment: "positive" as const,
      content: "Great progress on Project Alpha. Team is very responsive and delivers high-quality work."
    },
    {
      id: "2", 
      date: "2024-02-28",
      type: "call" as const,
      sentiment: "neutral" as const,
      content: "Discussed upcoming feature requests and resource allocation. No major concerns."
    },
    {
      id: "3",
      date: "2024-02-01", 
      type: "email" as const,
      sentiment: "positive" as const,
      content: "Appreciate the proactive communication regarding potential delays. Very professional."
    }
  ];

  const mockMetrics = [
    { label: "Delivered Projects", value: 12, trend: "up" as const },
    { label: "Backlog Items", value: 5, trend: "down" as const },
    { label: "Escalations", value: 0, trend: "neutral" as const },
    { label: "NPS Score", value: 9.2, trend: "up" as const }
  ];

  return (
    <Client360View 
      profile={mockProfile}
      feedback={mockFeedback}
      metrics={mockMetrics}
    />
  );
}