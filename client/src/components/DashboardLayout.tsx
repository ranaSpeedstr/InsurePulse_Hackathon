import { Link, useLocation } from "wouter";
import { BarChart3, Users, TrendingUp, Settings, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
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
        className={`sticky top-0 z-20 flex items-center justify-between p-4 border-b border-border/50 bg-header-gradient backdrop-blur-md transition-all duration-300 scroll-shadow`}
        data-scrolled={isScrolled}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        {/* Logo Section */}
        <motion.div 
          className="flex items-center gap-3 relative z-10"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="relative p-1 rounded-md bg-logo-gradient"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <img src={logoImage} alt="InsurePulse logo" className="w-6 h-6 relative z-10" />
          </motion.div>
          <span className="font-semibold text-foreground tracking-wide text-lg">InsurePulse</span>
        </motion.div>
        
        {/* Settings Button */}
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

      {/* Tabs Navigation */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="flex flex-col flex-1">
        <motion.div 
          className="px-6 pt-4 border-b border-border/30 bg-background/50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 backdrop-blur-sm border border-border/50 shadow-sm">
            {navigation.map((item, index) => (
              <motion.div
                key={item.value}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
              >
                <TabsTrigger 
                  value={item.value}
                  data-testid={`tab-${item.title.toLowerCase()}`}
                  className="group relative flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 hover:text-foreground data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <motion.div
                    className="relative z-10"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <item.icon className="w-4 h-4" />
                  </motion.div>
                  <span className="relative z-10 hidden sm:inline-block">{item.title}</span>
                  
                  {/* Active indicator */}
                  {currentTab === item.value && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                      layoutId="activeTab"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </TabsTrigger>
              </motion.div>
            ))}
          </TabsList>
        </motion.div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {navigation.map((item) => (
            <TabsContent 
              key={item.value} 
              value={item.value} 
              className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
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
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}