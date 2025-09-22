import WhatIfSimulation from "@/components/WhatIfSimulation";
import { useCallback } from "react";

export default function Simulation() {
  const handleSimulate = useCallback((params: any) => {
    console.log('Running simulation with parameters:', params);
    // Real-time simulation - no loading state needed for instant calculations
  }, []);

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