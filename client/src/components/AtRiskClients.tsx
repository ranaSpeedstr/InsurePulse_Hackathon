import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeletons";
import { AlertTriangle, Eye, TrendingDown, Users, Shield, Activity } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface Client {
  id: string;
  name: string;
  riskScore: number;
  healthScore: number;
}

interface AtRiskClientsProps {
  clients: Client[];
  isLoading?: boolean;
  onClientAction?: (clientId: string, action: 'view') => void;
}

const getRiskLevel = (score: number) => {
  if (score >= 80) return { 
    label: "High", 
    variant: "destructive" as const,
    bgClass: "bg-gradient-to-r from-red-500 to-pink-500",
    iconColor: "text-red-500",
    textColor: "text-white"
  };
  if (score >= 60) return { 
    label: "Medium", 
    variant: "default" as const,
    bgClass: "bg-gradient-to-r from-orange-400 to-amber-400",
    iconColor: "text-orange-500",
    textColor: "text-white"
  };
  return { 
    label: "Low", 
    variant: "secondary" as const,
    bgClass: "bg-gradient-to-r from-green-400 to-emerald-400",
    iconColor: "text-green-500",
    textColor: "text-white"
  };
};


export default function AtRiskClients({ clients, isLoading = false, onClientAction }: AtRiskClientsProps) {
  const shouldReduceMotion = useReducedMotion();

  if (isLoading) {
    return (
      <Card data-testid="card-at-risk-clients" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
              At-Risk Clients
            </span>
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
              {clients.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SkeletonList items={6} showAvatars={true} showActions={true} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-at-risk-clients" className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 border-b">
        <CardTitle className="flex items-center gap-3 text-xl">
          <motion.div 
            className="p-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 shadow-lg"
            animate={shouldReduceMotion ? {} : { rotate: [0, 5, -5, 0] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <AlertTriangle className="w-5 h-5 text-white" />
          </motion.div>
          <span className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
            At-Risk Clients
          </span>
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg">
            {clients.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Colorful Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div 
            className="text-center p-4 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg"
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Users className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{clients.filter(c => c.riskScore >= 80).length}</div>
            <div className="text-sm opacity-90">High Risk</div>
          </motion.div>
          <motion.div 
            className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-lg"
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <TrendingDown className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{clients.filter(c => c.riskScore >= 60 && c.riskScore < 80).length}</div>
            <div className="text-sm opacity-90">Medium Risk</div>
          </motion.div>
          <motion.div 
            className="text-center p-4 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 text-white shadow-lg"
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Shield className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{clients.filter(c => c.riskScore < 60).length}</div>
            <div className="text-sm opacity-90">Low Risk</div>
          </motion.div>
        </div>

        <div className="space-y-4">
          {clients.map((client, index) => {
            const risk = getRiskLevel(client.riskScore);
            
            return (
              <motion.div
                key={client.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-200/20 via-orange-200/20 to-yellow-200/20 dark:from-red-900/10 dark:via-orange-900/10 dark:to-yellow-900/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div
                  className="relative flex items-center justify-between p-5 rounded-xl border-2 border-transparent bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-md hover:shadow-xl hover:ring-2 hover:ring-orange-200 hover:ring-offset-2 transition-all duration-300"
                  data-testid={`client-${client.id}`}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`w-12 h-12 ${risk.bgClass} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg relative overflow-hidden`}
                      whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-white/20"
                        animate={shouldReduceMotion ? {} : { opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <span className="relative z-10">{client.name.charAt(0)}</span>
                    </motion.div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg text-foreground">{client.name}</h4>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingDown className={`w-4 h-4 ${risk.iconColor}`} />
                          <span className="text-muted-foreground">Risk: </span>
                          <span className={`font-bold ${risk.iconColor}`}>{client.riskScore}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <span className="text-muted-foreground">Health: </span>
                          <span className="font-bold text-blue-600">{client.healthScore}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge 
                      className={`${risk.bgClass} ${risk.textColor} border-0 shadow-lg px-3 py-1 font-semibold text-sm`}
                      data-testid={`risk-${client.id}`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {risk.label} Risk
                    </Badge>
                    
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg"
                      onClick={() => onClientAction?.(client.id, 'view')}
                      data-testid={`action-${client.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}