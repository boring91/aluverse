"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/client-utils";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";

type ProjectAlert = {
  type: "negativeProfit" | "overduePayment" | "delayed" | "budgetOverrun";
  severity: "high" | "medium" | "low";
  project: string;
  client: string;
  message: string;
};

type ProjectAlertsProps = {
  alerts: ProjectAlert[];
};

export const ProjectAlerts = ({ alerts }: ProjectAlertsProps) => {
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "negativeProfit":
        return "Negative Profit";
      case "overduePayment":
        return "Overdue Payment";
      case "delayed":
        return "Delayed";
      case "budgetOverrun":
        return "Budget Overrun";
      default:
        return type;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Health Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No alerts at this time
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Project Health Alerts
          <Badge variant="destructive" className="gap-1">
            <AlertTriangleIcon className="h-3 w-3" />
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border",
              alert.severity === "high" &&
                "border-destructive/50 bg-destructive/5",
              alert.severity === "medium" &&
                "border-yellow-500/50 bg-yellow-500/5"
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Badge variant={getSeverityVariant(alert.severity)}>
                  {getTypeLabel(alert.type)}
                </Badge>
                <span className="text-sm font-medium">{alert.project}</span>
              </div>
              {alert.severity === "high" && (
                <AlertTriangleIcon className="h-4 w-4 text-destructive shrink-0" />
              )}
              {alert.severity === "medium" && (
                <InfoIcon className="h-4 w-4 text-yellow-500 shrink-0" />
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              {alert.client}
            </div>
            <div className="text-sm">{alert.message}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
