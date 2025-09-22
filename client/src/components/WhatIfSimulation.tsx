import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";

interface SimulationResult {
  churnRisk: number;
  retentionRate: number;
  healthScore: number;
  satisfactionScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface WhatIfSimulationProps {
  onSimulate?: (params: SimulationParams) => void;
}

interface SimulationParams {
  responseTime: number;
  supportScore: number;
  escalationRate: number;
  communicationFreq: number;
  issueResolution: number;
}

export default function WhatIfSimulation({ onSimulate }: WhatIfSimulationProps) {
  // Simulation parameters - realistic ranges based on business metrics
  const [responseTime, setResponseTime] = useState([24]); // hours
  const [supportScore, setSupportScore] = useState([75]); // 0-100
  const [escalationRate, setEscalationRate] = useState([15]); // percentage
  const [communicationFreq, setCommunicationFreq] = useState([2]); // times per week
  const [issueResolution, setIssueResolution] = useState([85]); // percentage
  
  const [results, setResults] = useState<SimulationResult>({
    churnRisk: 25,
    retentionRate: 88,
    healthScore: 72,
    satisfactionScore: 75,
    riskLevel: 'Medium'
  });

  // Real-time calculation function
  const calculateMetrics = (params: SimulationParams) => {
    // Sophisticated simulation algorithm based on real business factors
    
    // Base scores - starting point for calculations
    let baseChurnRisk = 30;
    let baseRetention = 85;
    let baseHealth = 70;
    let baseSatisfaction = 70;
    
    // Response time impact (lower is better)
    const responseImpact = Math.max(0, (48 - params.responseTime) / 48);
    baseChurnRisk -= responseImpact * 15; // Faster response reduces churn risk
    baseRetention += responseImpact * 10;
    baseHealth += responseImpact * 15;
    baseSatisfaction += responseImpact * 12;
    
    // Support score impact
    const supportImpact = (params.supportScore - 50) / 50;
    baseChurnRisk -= supportImpact * 20;
    baseRetention += supportImpact * 12;
    baseHealth += supportImpact * 20;
    baseSatisfaction += supportImpact * 15;
    
    // Escalation rate impact (lower is better)
    const escalationImpact = Math.max(0, (30 - params.escalationRate) / 30);
    baseChurnRisk -= escalationImpact * 10;
    baseRetention += escalationImpact * 8;
    baseHealth += escalationImpact * 12;
    baseSatisfaction += escalationImpact * 10;
    
    // Communication frequency impact
    const commImpact = Math.min(1, params.communicationFreq / 3);
    baseChurnRisk -= commImpact * 8;
    baseRetention += commImpact * 6;
    baseHealth += commImpact * 10;
    baseSatisfaction += commImpact * 8;
    
    // Issue resolution impact
    const resolutionImpact = (params.issueResolution - 50) / 50;
    baseChurnRisk -= resolutionImpact * 25;
    baseRetention += resolutionImpact * 15;
    baseHealth += resolutionImpact * 25;
    baseSatisfaction += resolutionImpact * 20;
    
    // Apply bounds and calculate final metrics
    const churnRisk = Math.max(5, Math.min(95, baseChurnRisk));
    const retentionRate = Math.max(60, Math.min(98, baseRetention));
    const healthScore = Math.max(30, Math.min(100, baseHealth));
    const satisfactionScore = Math.max(40, Math.min(100, baseSatisfaction));
    
    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    if (churnRisk >= 70) riskLevel = 'Critical';
    else if (churnRisk >= 50) riskLevel = 'High';
    else if (churnRisk >= 25) riskLevel = 'Medium';
    else riskLevel = 'Low';
    
    return {
      churnRisk: Number(churnRisk.toFixed(1)),
      retentionRate: Number(retentionRate.toFixed(1)),
      healthScore: Number(healthScore.toFixed(1)),
      satisfactionScore: Number(satisfactionScore.toFixed(1)),
      riskLevel
    };
  };

  // Real-time updates when any parameter changes
  useEffect(() => {
    const params = {
      responseTime: responseTime[0],
      supportScore: supportScore[0],
      escalationRate: escalationRate[0],
      communicationFreq: communicationFreq[0],
      issueResolution: issueResolution[0]
    };
    
    const newResults = calculateMetrics(params);
    setResults(newResults);
    
    // Only call onSimulate if it exists, without adding it to dependencies
    if (onSimulate) {
      onSimulate(params);
    }
  }, [responseTime[0], supportScore[0], escalationRate[0], communicationFreq[0], issueResolution[0]]);

  // Create chart data for visualizations
  const comparisonData = [
    { name: 'Current', churnRisk: 35, retention: 80 },
    { name: 'Simulated', churnRisk: results.churnRisk, retention: results.retentionRate }
  ];

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-orange-600';
      case 'Critical': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'Medium': return <BarChart3 className="w-5 h-5 text-yellow-600" />;
      case 'High': return <TrendingDown className="w-5 h-5 text-orange-600" />;
      case 'Critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="what-if-simulation">
      {/* Parameters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Real-Time Simulation Parameters
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust the sliders below to see immediate impacts on churn risk and retention rates
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Response Time */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="response-slider">Average Response Time</Label>
                <span className="text-sm font-medium text-primary">{responseTime[0]} hours</span>
              </div>
              <Slider
                id="response-slider"
                min={1}
                max={72}
                step={1}
                value={responseTime}
                onValueChange={setResponseTime}
                data-testid="slider-response-time"
              />
              <p className="text-xs text-muted-foreground">Lower response times improve client satisfaction</p>
            </div>

            {/* Support Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="support-slider">Support Quality Score</Label>
                <span className="text-sm font-medium text-primary">{supportScore[0]}/100</span>
              </div>
              <Slider
                id="support-slider"
                min={40}
                max={100}
                step={5}
                value={supportScore}
                onValueChange={setSupportScore}
                data-testid="slider-support-score"
              />
              <p className="text-xs text-muted-foreground">Higher support scores reduce churn risk</p>
            </div>

            {/* Escalation Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="escalation-slider">Escalation Rate</Label>
                <span className="text-sm font-medium text-primary">{escalationRate[0]}%</span>
              </div>
              <Slider
                id="escalation-slider"
                min={0}
                max={50}
                step={1}
                value={escalationRate}
                onValueChange={setEscalationRate}
                data-testid="slider-escalation-rate"
              />
              <p className="text-xs text-muted-foreground">Lower escalation rates indicate better first-line support</p>
            </div>

            {/* Communication Frequency */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="communication-slider">Communication Frequency</Label>
                <span className="text-sm font-medium text-primary">{communicationFreq[0]}x/week</span>
              </div>
              <Slider
                id="communication-slider"
                min={0.5}
                max={5}
                step={0.5}
                value={communicationFreq}
                onValueChange={setCommunicationFreq}
                data-testid="slider-communication-freq"
              />
              <p className="text-xs text-muted-foreground">Regular communication strengthens client relationships</p>
            </div>

            {/* Issue Resolution */}
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="resolution-slider">Issue Resolution Rate</Label>
                <span className="text-sm font-medium text-primary">{issueResolution[0]}%</span>
              </div>
              <Slider
                id="resolution-slider"
                min={50}
                max={100}
                step={1}
                value={issueResolution}
                onValueChange={setIssueResolution}
                data-testid="slider-resolution-rate"
              />
              <p className="text-xs text-muted-foreground">Higher resolution rates directly correlate with client retention</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getRiskIcon(results.riskLevel)}
              Simulated Client Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Churn Risk</h4>
                <div className="text-2xl font-bold text-red-600" data-testid="result-churn-risk">
                  {results.churnRisk}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Retention Rate</h4>
                <div className="text-2xl font-bold text-green-600" data-testid="result-retention-rate">
                  {results.retentionRate}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Health Score</h4>
                <div className="text-2xl font-bold text-blue-600" data-testid="result-health-score">
                  {results.healthScore}
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Satisfaction</h4>
                <div className="text-2xl font-bold text-purple-600" data-testid="result-satisfaction">
                  {results.satisfactionScore}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Risk Level:</span>
                <span className={`text-sm font-semibold ${getRiskColor(results.riskLevel)}`}>
                  {results.riskLevel}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Risk vs Retention Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="churnRisk" fill="hsl(var(--chart-1))" name="Churn Risk %" />
                <Bar dataKey="retention" fill="hsl(var(--chart-2))" name="Retention %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}