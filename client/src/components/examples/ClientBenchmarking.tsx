import ClientBenchmarking from '../ClientBenchmarking';

export default function ClientBenchmarkingExample() {
  // TODO: remove mock data when integrating with real backend
  const mockData = [
    { client: "Client A", nps: 45, retention: 80, supportScore: 75 },
    { client: "Client B", nps: 40, retention: 75, supportScore: 70 },
    { client: "Client C", nps: 55, retention: 85, supportScore: 80 },
    { client: "Client D", nps: 35, retention: 70, supportScore: 65 },
    { client: "Client E", nps: 65, retention: 90, supportScore: 85 }
  ];

  return <ClientBenchmarking data={mockData} />;
}