import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  User,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SkeletonAlert,
  SkeletonTable,
  SkeletonContainer,
  SkeletonPage,
} from "@/components/ui/skeletons";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  trigger_type: string;
  trigger_description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "Acknowledged" | "Resolved";
  detected_at: string;
  resolved_at?: string;
  openai_analysis?: string;
  csv_data_snapshot?: string;
}

interface EmailNotification {
  id: string;
  alert_id: string;
  subject: string;
  recipient_email: string;
  sender_email: string;
  email_body: string;
  status: string;
  sent_at: string;
}

export default function Alerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: alerts = [],
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: notifications = [], isLoading: notificationsLoading } =
    useQuery<EmailNotification[]>({
      queryKey: ["/api/email-notifications"],
    });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({
      alertId,
      action,
    }: {
      alertId: string;
      action: "Acknowledged" | "Resolved";
    }) => {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error("Failed to acknowledge alert");
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Alert ${variables.action.toLowerCase()} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-notifications"] });
      refetchAlerts();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500";
      case "High":
        return "bg-orange-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-500";
      case "Acknowledged":
        return "bg-blue-500";
      case "Pending":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case "NPS_DROP":
        return <TrendingDown className="w-5 h-5" />;
      case "HIGH_CHURN_RISK":
        return <AlertTriangle className="w-5 h-5" />;
      case "NEGATIVE_FEEDBACK":
        return <TrendingDown className="w-5 h-5" />;
      case "POOR_PERFORMANCE":
        return <Activity className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const handleAcknowledge = (
    alertId: string,
    action: "Acknowledged" | "Resolved",
  ) => {
    acknowledgeMutation.mutate({ alertId, action });
  };

  const pendingAlerts = alerts.filter((alert) => alert.status === "Pending");
  const resolvedAlerts = alerts.filter((alert) => alert.status !== "Pending");

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-alerts">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            data-testid="text-page-title"
          >
            Client Alert Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and respond to concerning client triggers detected by AI
            analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {pendingAlerts.length} Pending
          </Badge>
          <Badge variant="outline" className="text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            {resolvedAlerts.length} Resolved
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="active-alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active-alerts" data-testid="tab-active-alerts">
            Active Alerts ({pendingAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            Email Notifications ({notifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active-alerts" className="space-y-6">
          {alertsLoading ? (
            <SkeletonContainer className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonAlert
                  key={index}
                  severity={
                    index === 0
                      ? "critical"
                      : index === 1
                        ? "high"
                        : index === 2
                          ? "medium"
                          : "low"
                  }
                  showActions={true}
                />
              ))}
            </SkeletonContainer>
          ) : pendingAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">No Active Alerts</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  All client triggers have been resolved. The system is
                  continuously monitoring for new issues.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {pendingAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className="border-l-4"
                      style={{
                        borderLeftColor: getSeverityColor(
                          alert.severity,
                        ).replace("bg-", "#"),
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getTriggerIcon(alert.trigger_type)}
                            </div>
                            <div>
                              <CardTitle
                                className="text-lg"
                                data-testid={`text-alert-title-${alert.id}`}
                              >
                                {alert.trigger_description}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <User className="w-4 h-4" />
                                {alert.client_id} - {alert.client_name} (
                                {alert.client_email})
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getSeverityColor(alert.severity)}
                              data-testid={`badge-severity-${alert.id}`}
                            >
                              {alert.severity}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getStatusColor(alert.status)}
                            >
                              {alert.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            Detected{" "}
                            {format(
                              new Date(alert.detected_at),
                              "MMM dd, yyyy at h:mm a",
                            )}
                          </div>
                          <div className="flex gap-2">
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAcknowledge(alert.id, "Acknowledged")
                                }
                                disabled={acknowledgeMutation.isPending}
                                data-testid={`button-acknowledge-${alert.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Acknowledge
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAcknowledge(alert.id, "Resolved")
                                }
                                disabled={acknowledgeMutation.isPending}
                                data-testid={`button-resolve-${alert.id}`}
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notification Log
              </CardTitle>
              <CardDescription>
                History of all email notifications sent to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    No Email Notifications
                  </h3>
                  <p className="text-muted-foreground">
                    Email notifications will appear here when alerts are
                    acknowledged or resolved.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border rounded-lg p-4 hover-elevate"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4
                            className="font-medium"
                            data-testid={`text-notification-subject-${notification.id}`}
                          >
                            {notification.subject}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">To:</span>{" "}
                            {notification.recipient_email}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            {notification.status}
                          </Badge>
                          <p
                            className="text-sm text-muted-foreground"
                            data-testid={`text-notification-timestamp-${notification.id}`}
                          >
                            {format(
                              new Date(notification.sent_at),
                              "MMM dd, yyyy h:mm a",
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
