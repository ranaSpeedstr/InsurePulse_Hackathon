import WhatIfSimulation from "@/components/WhatIfSimulation";
import { SkeletonCard, SkeletonContainer } from "@/components/ui/skeletons";
import { useState } from "react";

export default function Simulation() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSimulate = (params: any) => {
    setIsLoading(true);
    console.log('Running simulation with parameters:', params);
    // TODO: remove mock functionality when integrating with real backend
    setTimeout(() => setIsLoading(false), 2000); // Simulate loading
  };

  if (isLoading) {
    return (
      <SkeletonContainer className="space-y-8" data-testid="page-simulation-loading">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        
        {/* Simulation Components Skeleton */}
        <div className="space-y-6">
          <SkeletonCard showHeader={true} contentLines={5} />
          <SkeletonCard showHeader={true} contentLines={3} />
        </div>
      </SkeletonContainer>
    );
  }

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