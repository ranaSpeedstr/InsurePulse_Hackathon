import WhatIfSimulation from "@/components/WhatIfSimulation";
import { useCallback, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Simulation() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  
  // Fetch client profiles
  const { data: clientProfiles = {}, isLoading: profilesLoading, refetch: refetchProfiles } = useQuery({
    queryKey: ['/api/assets/profiles'],
    staleTime: 30000,
  });

  // Fetch client metrics
  const { data: metricsData = {}, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/assets/metrics'],
    staleTime: 30000,
  });

  // Extract client list from profiles
  const clients = Object.values(clientProfiles as Record<string, any>).map((profile: any) => ({
    id: profile.id,
    name: profile.name || `${profile.primaryContact} Company`
  }));

  // Get current client data
  const currentProfile = (clientProfiles as Record<string, any>)[selectedClient];
  const currentMetrics = (metricsData as Record<string, any>)[selectedClient];

  // Set default client selection
  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0].id);
    }
  }, [clients, selectedClient]);

  const handleSimulate = useCallback((params: any) => {
    console.log('Running simulation with parameters for client:', selectedClient, params);
  }, [selectedClient]);

  const handleRefresh = () => {
    refetchProfiles();
    refetchMetrics();
  };

  const isLoading = profilesLoading || metricsLoading;

  return (
    <div className="space-y-8" data-testid="page-simulation">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">What-if Simulation</h1>
          <p className="text-muted-foreground">Predict the impact of operational improvements on client satisfaction and churn</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="button-refresh-simulation"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Card className="w-80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Client:</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedClient} onValueChange={setSelectedClient} disabled={isLoading}>
                <SelectTrigger data-testid="select-simulation-client">
                  <SelectValue placeholder={isLoading ? "Loading clients..." : "Choose a client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      Client {client.id} - {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading client data...</p>
          </div>
        </div>
      ) : selectedClient && currentProfile ? (
        <WhatIfSimulation 
          onSimulate={handleSimulate} 
          selectedClientId={selectedClient}
          clientProfile={currentProfile}
          clientMetrics={currentMetrics}
        />
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Please select a client to start simulation</p>
        </div>
      )}
    </div>
  );
}