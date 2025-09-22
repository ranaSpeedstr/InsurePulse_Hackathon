import AtRiskClients from '../AtRiskClients';

export default function AtRiskClientsExample() {
  // TODO: remove mock data when integrating with real backend
  const mockClients = [
    { id: "A", name: "Acme Corp", riskScore: 88, industry: "Technology", healthScore: 3.2 },
    { id: "B", name: "Globex Inc.", riskScore: 76, industry: "Finance", healthScore: 4.1 },
    { id: "C", name: "Initech Solutions", riskScore: 72, industry: "Healthcare", healthScore: 4.8 },
    { id: "D", name: "Cyberdyne Systems", riskScore: 65, industry: "Manufacturing", healthScore: 5.5 },
    { id: "E", name: "Umbrella Corp", riskScore: 58, industry: "Pharmaceuticals", healthScore: 6.2 }
  ];

  return <AtRiskClients clients={mockClients} />;
}