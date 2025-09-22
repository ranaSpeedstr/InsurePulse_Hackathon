import ForecastChart from '../ForecastChart';

export default function ForecastChartExample() {
  // TODO: remove mock data when integrating with real backend
  const mockSentimentData = [
    { month: "Jan", positive: 65, neutral: 25, negative: 10, churnProbability: 15 },
    { month: "Feb", positive: 68, neutral: 23, negative: 9, churnProbability: 14 },
    { month: "Mar", positive: 70, neutral: 20, negative: 10, churnProbability: 12 }
  ];

  const mockChurnData = [
    { month: "Jan", positive: 0, neutral: 0, negative: 0, churnProbability: 15 },
    { month: "Feb", positive: 0, neutral: 0, negative: 0, churnProbability: 14 },
    { month: "Mar", positive: 0, neutral: 0, negative: 0, churnProbability: 12 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ForecastChart data={mockSentimentData} type="sentiment" />
      <ForecastChart data={mockChurnData} type="churn" />
    </div>
  );
}