import { Link, useLocation } from "wouter";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { BarChart3, Users, TrendingUp, Settings, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import logoImage from "@assets/InsurePluselogo_1758565060236.png";

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
  const [isScrolled, setIsScrolled] = useState(false);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Handle scroll detection for header shadow
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    const mainElement = document.querySelector('[data-testid="main-content"]');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      x: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      x: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      x: -20,
      scale: 0.98
    }
  };

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar className="bg-sidebar-gradient border-r border-sidebar-border/50">
          <SidebarContent>
            <SidebarGroup>
              <motion.div 
                className="p-4 border-b border-sidebar-border/30 bg-sidebar-gradient relative overflow-hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {/* Subtle gradient overlay for logo area */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                
                <motion.div 
                  className="flex items-center gap-3 relative z-10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    className="relative p-1 rounded-md bg-logo-gradient"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <img src={logoImage} alt="InsurePulse logo" className="w-5 h-5 relative z-10" />
                  </motion.div>
                  <span className="font-semibold text-sidebar-foreground tracking-wide">InsurePulse</span>
                </motion.div>
              </motion.div>
              <SidebarGroupContent className="px-2 py-2">
                <SidebarMenu className="space-y-1">
                  {navigation.map((item, index) => {
                    const isActive = location === item.path;
                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link 
                              href={item.path} 
                              data-testid={`nav-${item.title.toLowerCase()}`}
                              className={`group relative overflow-hidden transition-all duration-200 hover:bg-sidebar-accent/50 ${
                                isActive ? 'bg-sidebar-accent shadow-sm' : ''
                              }`}
                            >
                              {/* Subtle gradient background for active state */}
                              {isActive && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10"
                                  layoutId="activeNav"
                                  initial={false}
                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                              )}
                              
                              <motion.div
                                className="icon-hover-scale relative z-10"
                                whileHover={{ rotate: 5, scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              >
                                <item.icon className="w-4 h-4" />
                              </motion.div>
                              
                              <span className="relative z-10 font-medium">{item.title}</span>
                              
                              {/* Hover indicator */}
                              <motion.div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full"
                                animate={{ height: isActive ? '60%' : '0%' }}
                                transition={{ duration: 0.2 }}
                              />
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <motion.header 
            className={`sticky top-0 z-20 flex items-center justify-between p-4 border-b border-border/50 bg-header-gradient backdrop-blur-md transition-all duration-300 scroll-shadow`}
            data-scrolled={isScrolled}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="relative z-10"
            >
              <SidebarTrigger 
                data-testid="button-sidebar-toggle" 
                className="hover-elevate active-elevate-2 transition-all duration-200"
              />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="relative z-10"
            >
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-settings"
                className="hover-elevate active-elevate-2 backdrop-blur-sm bg-background/50 border-border/50 transition-all duration-200"
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Settings className="w-4 h-4" />
                </motion.div>
              </Button>
            </motion.div>
          </motion.header>
          <main 
            className="flex-1 overflow-auto bg-main-gradient relative"
            data-testid="main-content"
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            </div>
            
            <div className="relative z-10 p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}