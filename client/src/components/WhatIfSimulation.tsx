import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp } from "lucide-react";

interface SimulationResult {
  churnReduction: number;
  satisfactionScore: number;
}

interface WhatIfSimulationProps {
  onSimulate?: (params: SimulationParams) => void;
}

interface SimulationParams {
  turnaroundTime: number;
  escalationHandling: number;
  npsScore: number;
}

export default function WhatIfSimulation({ onSimulate }: WhatIfSimulationProps) {
  const [turnaroundTime, setTurnaroundTime] = useState([20]);
  const [escalationHandling, setEscalationHandling] = useState([15]);
  const [npsScore, setNpsScore] = useState([10]);
  const [results, setResults] = useState<SimulationResult>({
    churnReduction: 3,
    satisfactionScore: 74.5
  });

  const handleSimulate = () => {
    // Mock simulation calculation
    const params = {
      turnaroundTime: turnaroundTime[0],
      escalationHandling: escalationHandling[0],
      npsScore: npsScore[0]
    };
    
    const mockChurnReduction = Math.max(1, 5 - (params.turnaroundTime / 10) + (params.escalationHandling / 10) + (params.npsScore / 5));
    const mockSatisfactionScore = Math.min(90, 70 + params.turnaroundTime * 0.3 + params.escalationHandling * 0.2 + params.npsScore * 0.8);
    
    setResults({
      churnReduction: Number(mockChurnReduction.toFixed(1)),
      satisfactionScore: Number(mockSatisfactionScore.toFixed(1))
    });

    onSimulate?.(params);
    console.log('Simulation triggered with params:', params);
  };

  return (
    <div className="space-y-6" data-testid="what-if-simulation">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            What-if Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Adjust Operational Metrics</h3>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="turnaround-slider">Reduce Turnaround Time</Label>
                  <span className="text-sm font-medium text-primary">{turnaroundTime[0]}%</span>
                </div>
                <Slider
                  id="turnaround-slider"
                  min={0}
                  max={50}
                  step={5}
                  value={turnaroundTime}
                  onValueChange={setTurnaroundTime}
                  data-testid="slider-turnaround"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="escalation-slider">Increase Escalation Handling</Label>
                  <span className="text-sm font-medium text-primary">{escalationHandling[0]}%</span>
                </div>
                <Slider
                  id="escalation-slider"
                  min={0}
                  max={30}
                  step={5}
                  value={escalationHandling}
                  onValueChange={setEscalationHandling}
                  data-testid="slider-escalation"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nps-slider">Improve NPS Score</Label>
                  <span className="text-sm font-medium text-primary">{npsScore[0]} points</span>
                </div>
                <Slider
                  id="nps-slider"
                  min={0}
                  max={20}
                  step={2}
                  value={npsScore}
                  onValueChange={setNpsScore}
                  data-testid="slider-nps"
                />
              </div>
            </div>

            <Button onClick={handleSimulate} className="w-full" data-testid="button-simulate">
              <TrendingUp className="w-4 h-4 mr-2" />
              Run Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projected Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-chart-2/10 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Simulated Churn Risk Reduction</h4>
              <div className="text-3xl font-bold text-chart-2" data-testid="result-churn-reduction">
                {results.churnReduction}%
              </div>
            </div>
            <div className="text-center p-6 bg-chart-1/10 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Projected Client Satisfaction Score</h4>
              <div className="text-3xl font-bold text-chart-1" data-testid="result-satisfaction-score">
                {results.satisfactionScore}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}