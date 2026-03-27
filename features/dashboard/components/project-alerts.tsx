"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/client-utils";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardSection } from "./dashboard-section";
import { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";

type Props = {
  dateRange: DashboardDateRange;
};

const ALERT_TYPE_LABELS = {
  negativeProfit: "Negative profit",
  overduePayment: "Overdue payment",
  budgetOverrun: "Budget overrun",
  none: "None",
} as const;

export const ProjectAlerts = ({ dateRange }: Props) => {
  const trpc = useTRPC();
  const { data: projects, isLoading } = useQuery(
    trpc.dashboard.projectsWithAlerts.queryOptions(dateRange)
  );

  const skeleton = (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      <ProjectAlertsList projects={projects || []} />
    </DashboardSection>
  );
};

const ProjectAlertsList = ({
  projects,
}: {
  projects: inferRouterOutputs<AppRouter>["dashboard"]["projectsWithAlerts"];
}) => {
  const getProjectSeverity = (project: (typeof projects)[number]) => {
    if (project.profit < 0) return "high";
    if (project.daysOverdue) return "high";
    if (project.allocationOverrun) return "medium";
    return "low";
  };

  const getSeverityVariant = (project: (typeof projects)[number]) => {
    const severity = getProjectSeverity(project);
    switch (severity) {
      case "high":
        return "destructive" as const;
      case "medium":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getType = (project: (typeof projects)[number]) => {
    return project.profit < 0
      ? "negativeProfit"
      : !!project.daysOverdue
        ? "overduePayment"
        : !!project.allocationOverrun
          ? "budgetOverrun"
          : "none";
  };

  const getProjectMessage = (project: (typeof projects)[number]) => {
    if (project.profit < 0) {
      return `This project is currently running at a negative profit of ${formatCurrency(project.profit / 100)}.`;
    }

    if (project.daysOverdue) {
      return `Payment is overdue by ${project.daysOverdue} days.`;
    }

    if (project.allocationOverrun) {
      return `Budget is overrun by ${(project.allocationOverrun * 100).toFixed(2)}%.`;
    }

    return "No alerts for this project.";
  };

  if (projects.length === 0) {
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
            {projects.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.map((project, index) => {
          const alertType = getType(project);
          return (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border",
                getProjectSeverity(project) === "high" &&
                  "border-destructive/50 bg-destructive/5",
                getProjectSeverity(project) === "medium" &&
                  "border-yellow-500/50 bg-yellow-500/5"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityVariant(project)}>
                    {ALERT_TYPE_LABELS[alertType]}
                  </Badge>
                  <span className="text-sm font-medium">
                    <Link href={`/projects/${project.id}`}>
                      {project.humanId}
                    </Link>
                  </span>
                </div>
                {getProjectSeverity(project) === "high" && (
                  <AlertTriangleIcon className="h-4 w-4 text-destructive shrink-0" />
                )}
                {getProjectSeverity(project) === "medium" && (
                  <InfoIcon className="h-4 w-4 text-yellow-500 shrink-0" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {project.client}
              </div>
              <div className="text-sm">{getProjectMessage(project)}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
