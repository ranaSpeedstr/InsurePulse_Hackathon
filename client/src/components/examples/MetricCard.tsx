import MetricCard from '../MetricCard';

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard 
        title="Total Clients" 
        value="247" 
        change={12} 
        trend="up" 
        subtitle="vs last month" 
      />
      <MetricCard 
        title="At Risk Clients" 
        value="18" 
        change={-5} 
        trend="down" 
        subtitle="improved this month" 
      />
      <MetricCard 
        title="Avg NPS Score" 
        value="8.2" 
        change={3} 
        trend="up" 
        subtitle="out of 10" 
      />
      <MetricCard 
        title="Churn Rate" 
        value="2.4%" 
        trend="neutral" 
        subtitle="stable" 
      />
    </div>
  );
}