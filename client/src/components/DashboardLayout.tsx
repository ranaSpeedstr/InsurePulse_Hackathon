import { Link, useLocation } from "wouter";
import { BarChart3, Users, TrendingUp, Settings, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import logoImage from "@assets/InsurePluselogo_1758565060236.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Updated navigation order: Forecast moved after Alerts
const navigation = [
  { title: "Overview", path: "/", icon: Home, value: "overview" },
  { title: "Clients", path: "/clients", icon: Users, value: "clients" },
  { title: "Simulation", path: "/simulation", icon: BarChart3, value: "simulation" },
  { title: "Alerts", path: "/alerts", icon: AlertTriangle, value: "alerts" },
  { title: "Forecast", path: "/forecast", icon: TrendingUp, value: "forecast" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Find current active tab based on location
  const currentTab = navigation.find(nav => nav.path === location)?.value || "overview";

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

  // Handle tab change
  const handleTabChange = (value: string) => {
    const navItem = navigation.find(nav => nav.value === value);
    if (navItem) {
      navigate(navItem.path);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header with Logo and Settings */}
      <motion.header 
        className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur-lg transition-all duration-300 ${
          isScrolled ? 'shadow-lg' : ''
        }`}
        initial={!prefersReducedMotion ? { opacity: 0, y: -10 } : {}}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={!prefersReducedMotion ? { delay: 0.1, duration: 0.3 } : {}}
      >
        {/* Logo Section */}
        <motion.div 
          className="flex items-center gap-3"
          initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : {}}
          animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
          transition={!prefersReducedMotion ? { delay: 0.2, duration: 0.3 } : {}}
          {...(!prefersReducedMotion && { whileHover: { scale: 1.02 } })}
        >
          <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-border/20">
            <img src={logoImage} alt="InsurePulse logo" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-xl tracking-tight">InsurePulse</h1>
            <p className="text-xs text-muted-foreground">Client Analytics Dashboard</p>
          </div>
        </motion.div>
        
        {/* Settings Button */}
        <motion.div
          {...(!prefersReducedMotion && {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 }
          })}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            data-testid="button-settings"
            className="hover-elevate relative"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.header>

      {/* Tabs Navigation */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="flex flex-col flex-1">
        {/* Sticky Tabs Container */}
        <motion.div 
          className="sticky top-[73px] z-20 bg-background/95 backdrop-blur-lg border-b border-border/30 shadow-sm"
          initial={!prefersReducedMotion ? { opacity: 0, y: -10 } : {}}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={!prefersReducedMotion ? { delay: 0.3, duration: 0.3 } : {}}
        >
          {/* Scrollable tabs container with fade edges */}
          <div className="relative max-w-6xl mx-auto">
            {/* Fade edge left */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/95 to-transparent z-10 pointer-events-none" />
            {/* Fade edge right */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/95 to-transparent z-10 pointer-events-none" />
            
            <TabsList 
              className="w-full bg-transparent border-0 p-0 h-auto overflow-x-auto snap-x snap-mandatory scrollbar-hide flex justify-start md:justify-center"
              aria-label="Primary navigation"
            >
              <div className="flex min-w-max px-8">
                {navigation.map((item, index) => {
                  const isActive = currentTab === item.value;
                  return (
                    <motion.div
                      key={item.value}
                      initial={!prefersReducedMotion ? { opacity: 0, y: -10 } : {}}
                      animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                      transition={!prefersReducedMotion ? { delay: 0.4 + index * 0.1, duration: 0.3 } : {}}
                      className="snap-center"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            {...(!prefersReducedMotion && {
                              whileHover: { scale: 1.02 },
                              whileTap: { scale: 0.98 }
                            })}
                          >
                            <TabsTrigger 
                              value={item.value}
                              data-testid={`tab-${item.title.toLowerCase()}`}
                              aria-current={isActive ? "page" : undefined}
                              className={`
                                group relative flex items-center gap-3 px-6 py-4 mx-1 font-medium transition-all duration-300 border-0 
                                text-muted-foreground hover:text-foreground
                                data-[state=active]:text-foreground data-[state=active]:bg-accent/50 
                                data-[state=active]:shadow-sm rounded-lg
                                ${isActive ? 'font-semibold' : 'font-medium'}
                              `}
                            >
                              <div className="relative">
                                <item.icon className="w-5 h-5" />
                              </div>
                              <span className="hidden sm:inline-block whitespace-nowrap">{item.title}</span>
                              
                              {/* Enhanced active indicator */}
                              {isActive && (
                                <motion.div
                                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                                  layoutId="activeTabIndicator"
                                  initial={false}
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                            </TabsTrigger>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="bottom" 
                          className="sm:hidden"
                        >
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  );
                })}
              </div>
            </TabsList>
          </div>
        </motion.div>

        {/* Main Content - Render once outside TabsContent for performance */}
        <div className="flex-1 overflow-hidden">
          <main 
            className="h-full overflow-auto bg-gradient-to-br from-background via-background/50 to-muted/20 relative"
            data-testid="main-content"
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(15,23,42,0.15)_1px,_transparent_0)] [background-size:20px_20px]" />
            </div>
            
            <div className="relative z-10 container mx-auto max-w-7xl px-6 py-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location}
                  initial={!prefersReducedMotion ? "initial" : {}}
                  animate={!prefersReducedMotion ? "in" : {}}
                  exit={!prefersReducedMotion ? "out" : {}}
                  variants={!prefersReducedMotion ? pageVariants : {}}
                  transition={!prefersReducedMotion ? pageTransition : {}}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </Tabs>
    </div>
  );
}