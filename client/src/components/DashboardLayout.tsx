import { Link, useLocation } from "wouter";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { BarChart3, Users, TrendingUp, Settings, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/generated_images/Professional_analytics_company_logo_932e6c2c.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { title: "Overview", path: "/", icon: Home },
  { title: "Clients", path: "/clients", icon: Users },
  { title: "Forecast", path: "/forecast", icon: TrendingUp },
  { title: "Simulation", path: "/simulation", icon: BarChart3 },
  { title: "Alerts", path: "/alerts", icon: AlertTriangle },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <div className="p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <img src={logoImage} alt="Logo" className="w-6 h-6" />
                  <span className="font-semibold text-sidebar-foreground">Analytics</span>
                </div>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.path}>
                        <Link href={item.path} data-testid={`nav-${item.title.toLowerCase()}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Button variant="outline" size="sm" data-testid="button-settings">
              <Settings className="w-4 h-4" />
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}