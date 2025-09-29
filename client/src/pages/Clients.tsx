import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Client360View from "@/components/Client360View";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const [selectedClient, setSelectedClient] = useState("");
  const [location] = useLocation();
  const { toast } = useToast();

  // Fetch client profiles from assets
  const { data: clientProfiles = {}, isLoading: profilesLoading, refetch: refetchProfiles } = useQuery({
    queryKey: ['/api/assets/profiles'],
    staleTime: 30000, // Cache for 30 seconds - shorter cache for real-time updates
  });

  // Fetch feedback data from assets
  const { data: feedbackData = {}, isLoading: feedbackLoading, refetch: refetchFeedback } = useQuery({
    queryKey: ['/api/assets/feedback'],
    staleTime: 30000,
  });

  // Fetch metrics data from assets
  const { data: metricsData = {}, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/assets/metrics'],
    staleTime: 30000,
  });

  // Extract client list from profiles
  const clients = Object.values(clientProfiles as Record<string, any>).map((profile: any) => ({
    id: profile.id,
    name: profile.name || `${profile.primaryContact} Company`
  }));

  // Handle client selection: URL parameter takes priority, then default to first client
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const selectedFromUrl = params.get('selected');
    
    if (selectedFromUrl && clients.find(c => c.id === selectedFromUrl)) {
      // URL parameter takes priority and client exists
      setSelectedClient(selectedFromUrl);
    } else if (clients.length > 0 && !selectedClient) {
      // Only set default if no client is selected and no URL parameter
      setSelectedClient(clients[0].id);
    }
  }, [clients, location, selectedClient]);

  // Transform metrics data to match component expectations
  const transformMetricsData = (rawMetrics: any) => {
    if (!rawMetrics) return [];
    
    return [
      { 
        label: "Delivered Projects", 
        value: rawMetrics.delivered || 0, 
        trend: rawMetrics.delivered > 10 ? "up" as const : rawMetrics.delivered < 5 ? "down" as const : "neutral" as const 
      },
      { 
        label: "Backlog Items", 
        value: rawMetrics.backlog || 0, 
        trend: rawMetrics.backlog < 5 ? "up" as const : rawMetrics.backlog > 10 ? "down" as const : "neutral" as const 
      },
      { 
        label: "Escalations", 
        value: rawMetrics.escalations || 0, 
        trend: rawMetrics.escalations === 0 ? "neutral" as const : rawMetrics.escalations > 2 ? "down" as const : "neutral" as const 
      },
      { 
        label: "Support Score", 
        value: rawMetrics.supportScore || 0, 
        trend: rawMetrics.supportScore > 80 ? "up" as const : rawMetrics.supportScore < 70 ? "down" as const : "neutral" as const 
      }
    ];
  };

  // Manual refresh function
  const handleRefresh = async () => {
    try {
      const response = await fetch('/api/assets/refresh', { method: 'POST' });
      if (response.ok) {
        // Refetch all data
        await Promise.all([refetchProfiles(), refetchFeedback(), refetchMetrics()]);
        toast({
          title: "Data Refreshed",
          description: "Asset data has been updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh asset data",
        variant: "destructive",
      });
    }
  };

  const currentProfile = selectedClient ? (clientProfiles as any)[selectedClient] : null;
  const currentFeedback = selectedClient ? (feedbackData as any)[selectedClient] || [] : [];
  const currentMetrics = selectedClient ? transformMetricsData((metricsData as any)[selectedClient]) : [];

  const isLoading = profilesLoading || feedbackLoading || metricsLoading;

  return (
    <div className="space-y-8" data-testid="page-clients">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client 360° View</h1>
          <p className="text-muted-foreground">Real-time data from XML, TXT, and CSV files in attached_assets</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="button-refresh-assets"
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
              <SelectTrigger data-testid="select-client">
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
            <p className="text-muted-foreground">Loading client data from assets...</p>
          </div>
        </div>
      ) : currentProfile ? (
        <Client360View 
          profile={currentProfile}
          feedback={currentFeedback}
          metrics={currentMetrics}
        />
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No client data available. Please check your attached assets.</p>
        </div>
      )}
    </div>
  );
}