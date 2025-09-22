import WhatIfSimulation from "@/components/WhatIfSimulation";

export default function Simulation() {
  const handleSimulate = (params: any) => {
    console.log('Running simulation with parameters:', params);
    // TODO: remove mock functionality when integrating with real backend
  };

  return (
    <div className="space-y-8" data-testid="page-simulation">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">What-if Simulation</h1>
        <p className="text-muted-foreground">Predict the impact of operational improvements on client satisfaction and churn</p>
      </div>

      <WhatIfSimulation onSimulate={handleSimulate} />
    </div>
  );
}