import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { SkeletonList } from "@/components/ui/skeletons";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { AlertTriangle, User, Mail, Phone, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  riskScore: number;
  industry: string;
  healthScore: number;
  email?: string;
  phone?: string;
  lastContact?: string;
  trend?: 'up' | 'down' | 'stable';
  premiumValue?: number;
}

interface AtRiskClientsProps {
  clients: Client[];
  isLoading?: boolean;
  onClientAction?: (clientId: string, action: 'email' | 'phone' | 'view') => void;
}

const getRiskLevel = (score: number) => {
  if (score >= 80) return { 
    label: "High", 
    variant: "destructive" as const,
    gradient: "from-red-500/20 to-red-600/30",
    borderColor: "border-red-500/50",
    glowColor: "shadow-red-500/20",
    progressColor: "bg-red-500"
  };
  if (score >= 60) return { 
    label: "Medium", 
    variant: "default" as const,
    gradient: "from-yellow-500/20 to-orange-500/30",
    borderColor: "border-yellow-500/50",
    glowColor: "shadow-yellow-500/20",
    progressColor: "bg-yellow-500"
  };
  return { 
    label: "Low", 
    variant: "secondary" as const,
    gradient: "from-green-500/20 to-emerald-500/30",
    borderColor: "border-green-500/50",
    glowColor: "shadow-green-500/20",
    progressColor: "bg-green-500"
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function AtRiskClients({ clients, isLoading = false, onClientAction }: AtRiskClientsProps) {
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return (
      <Card data-testid="card-at-risk-clients">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            At-Risk Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SkeletonList items={6} showAvatars={true} showActions={true} />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.5 }}
      >
        <Card data-testid="card-at-risk-clients" className="overflow-hidden">
          <CardHeader>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.6, delay: prefersReducedMotion ? 0 : 0.2 }}
            >
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { rotate: [0, 5, -5, 0] }}
                  transition={prefersReducedMotion ? {} : { duration: 0.6, ease: "easeInOut" }}
                >
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </motion.div>
                At-Risk Clients
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
              <motion.div
                variants={prefersReducedMotion ? {} : containerVariants}
                initial={prefersReducedMotion ? {} : "hidden"}
                animate={prefersReducedMotion ? {} : "visible"}
                className="space-y-4"
              >
                {clients.map((client, index) => {
                  const risk = getRiskLevel(client.riskScore);
                  const isHighRisk = client.riskScore >= 80;
                  
                  return (
                    <motion.div
                      key={client.id}
                      variants={prefersReducedMotion ? {} : cardVariants}
                      animate={isHighRisk && !prefersReducedMotion ? "pulse" : ""}
                      whileHover={prefersReducedMotion ? {} : {
                        scale: 1.02,
                        y: -2,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={prefersReducedMotion ? {} : {
                        scale: 0.98,
                        transition: { duration: 0.1 }
                      }}
                      className={cn(
                        "relative group cursor-pointer",
                        "bg-gradient-to-r", risk.gradient,
                        "border-2 border-transparent hover:border-opacity-100",
                        risk.borderColor,
                        "rounded-lg p-4 backdrop-blur-sm",
                        "transition-all duration-300 ease-out",
                        isHighRisk ? "hover:shadow-lg" : "hover:shadow-md",
                        isHighRisk ? risk.glowColor : ""
                      )}
                      data-testid={`client-${client.id}`}
                    >
                      {/* Pulsing overlay for high-risk clients */}
                      {isHighRisk && !prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-0 bg-red-500/5 rounded-lg"
                          variants={pulseVariants}
                          animate="pulse"
                        />
                      )}
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div
                                whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                                className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center relative overflow-hidden"
                              >
                                <User className="w-6 h-6 text-primary z-10" />
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                                  whileHover={prefersReducedMotion ? {} : {
                                    x: ["-100%", "100%"]
                                  }}
                                  transition={prefersReducedMotion ? {} : {
                                    duration: 1.5,
                                    ease: "easeInOut"
                                  }}
                                />
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-medium">{client.name}</p>
                                <p>Premium: ${client.premiumValue?.toLocaleString() || 'N/A'}</p>
                                <p>Last Contact: {client.lastContact || 'No recent contact'}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{client.name}</h4>
                              {client.trend && (
                                <motion.div
                                  animate={prefersReducedMotion ? {} : { y: [-1, 1, -1] }}
                                  transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity }}
                                >
                                  {client.trend === 'up' ? (
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                  ) : client.trend === 'down' ? (
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                  ) : null}
                                </motion.div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{client.industry}</p>
                            
                            {/* Animated Risk Score Progress Bar */}
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Risk Score</span>
                                <span>{client.riskScore}</span>
                              </div>
                              <div className="relative">
                                <Progress 
                                  value={client.riskScore} 
                                  className="h-2 bg-muted/30" 
                                  aria-label={`Risk score: ${client.riskScore}%`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right space-y-1">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <span>Health Score:</span>
                              <Badge variant="outline" className="text-xs">
                                {client.healthScore}/10
                              </Badge>
                            </div>
                          </div>
                          
                          <Badge 
                            variant={risk.variant} 
                            className={cn(
                              "transition-all duration-300",
                              "group-hover:scale-105"
                            )}
                            data-testid={`risk-${client.id}`}
                          >
                            {risk.label}
                          </Badge>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 opacity-70 hover:opacity-100 transition-opacity"
                                    onClick={() => onClientAction?.(client.id, 'email')}
                                    data-testid={`email-${client.id}`}
                                    aria-label="Send email"
                                  >
                                    <motion.div
                                      whileHover={prefersReducedMotion ? {} : { scale: 1.2, rotate: 10 }}
                                    >
                                      <Mail className="w-4 h-4" />
                                    </motion.div>
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Send Email</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 opacity-70 hover:opacity-100 transition-opacity"
                                    onClick={() => onClientAction?.(client.id, 'phone')}
                                    data-testid={`phone-${client.id}`}
                                    aria-label="Call client"
                                  >
                                    <motion.div
                                      whileHover={prefersReducedMotion ? {} : { scale: 1.2, rotate: -10 }}
                                    >
                                      <Phone className="w-4 h-4" />
                                    </motion.div>
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Call Client</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="transition-all duration-200 hover:shadow-md"
                                    onClick={() => onClientAction?.(client.id, 'view')}
                                    data-testid={`action-${client.id}`}
                                  >
                                    <motion.div
                                      className="flex items-center gap-1"
                                      whileHover={prefersReducedMotion ? {} : { x: 2 }}
                                    >
                                      <Eye className="w-4 h-4" />
                                      <span>View</span>
                                    </motion.div>
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Client Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}