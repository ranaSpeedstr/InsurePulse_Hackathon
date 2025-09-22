import WhatIfSimulation from '../WhatIfSimulation';

export default function WhatIfSimulationExample() {
  const handleSimulate = (params: any) => {
    console.log('Simulation parameters:', params);
    // TODO: remove mock functionality when integrating with real backend
  };

  return <WhatIfSimulation onSimulate={handleSimulate} />;
}