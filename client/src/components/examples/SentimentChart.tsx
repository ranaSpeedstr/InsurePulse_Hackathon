import SentimentChart from '../SentimentChart';

export default function SentimentChartExample() {
  // TODO: remove mock data when integrating with real backend
  const mockData = [
    { name: "Positive", value: 55, color: "hsl(var(--chart-2))" },
    { name: "Neutral", value: 30, color: "hsl(var(--chart-3))" },
    { name: "Negative", value: 15, color: "hsl(var(--chart-4))" }
  ];

  return <SentimentChart data={mockData} />;
}