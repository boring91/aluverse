"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/client-utils";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

export const ProjectAccountingInfo = ({ project }: { project: Project }) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* Amount paid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            Budget allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-xl font-semibold text-sky-500 flex flex-col gap-2">
          <p>x{project.budgetUnits.toPrecision(2)}</p>
          <p className="text-sm">{formatCurrency(project.budgetUnitValue)}</p>
        </CardContent>
      </Card>

      {/* Cost so far */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            Cost
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-xl font-semibold text-rose-500">
          {formatCurrency(project.cost)}
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            Overdue
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-xl font-semibold text-amber-500">
          {formatCurrency(project.price - project.paid)}
        </CardContent>
      </Card>

      {/* Profit margin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            Profit margin
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cn("text-xl font-semibold text-emerald-500", {
            "text-rose-500": (project.effectiveMargin ?? 0) < 0,
          })}
        >
          <div className="flex flex-col gap-2">
            <p>
              {project.effectiveMargin === null
                ? "-"
                : (project.effectiveMargin * 100).toFixed(2)}
              %
            </p>
            <p
              className={cn("text-xs font-mono text-emerald-500", {
                "text-rose-500": project.profit < 0,
              })}
            >
              {formatCurrency(project.profit)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
