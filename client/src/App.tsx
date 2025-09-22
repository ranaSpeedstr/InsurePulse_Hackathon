import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWebSocket } from "@/hooks/useWebSocket";
import DashboardLayout from "@/components/DashboardLayout";
import Overview from "@/pages/Overview";
import Clients from "@/pages/Clients";
import Forecast from "@/pages/Forecast";
import Simulation from "@/pages/Simulation";
import Alerts from "@/pages/Alerts";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/clients" component={Clients} />
        <Route path="/forecast" component={Forecast} />
        <Route path="/simulation" component={Simulation} />
        <Route path="/alerts" component={Alerts} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

// WebSocket wrapper component to handle connection at the app level
function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { connectionState, clientId } = useWebSocket({
    autoConnect: true,
    reconnectAttempts: 5,
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    backoffMultiplier: 2,
  });

  // Optional: Log connection state changes for development
  console.log('[WebSocket] Connection state:', connectionState, clientId ? `(Client ID: ${clientId})` : '');

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WebSocketProvider>
          <Toaster />
          <Router />
        </WebSocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
