"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/client-utils";
import type { AppRouter } from "@/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Progress } from "@/components/ui/progress";

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
        <CardContent className=" text-xl font-semibold text-rose-500 flex flex-col gap-4">
          <p className="font-mono">{formatCurrency(project.cost)}</p>
          {project.usedAllocation !== null && !project.allocationOverrun && (
            <div className="flex flex-col gap-1 text-primary">
              <p className="text-sm">Allocation usage</p>

              {/* Allocation usage progress */}
              <div className="flex gap-2 items-center">
                <Progress
                  className="grow"
                  value={project.usedAllocation * 100}
                />
                <p className="text-xs shrink-0">
                  {formatPercent(project.usedAllocation)}
                </p>
              </div>

              {/* Remaining allocation */}
              <p className="text-xs">
                Remaining:{" "}
                <span className="font-mono">
                  {formatCurrency(
                    (1 - project.usedAllocation) * project.allocation,
                  )}
                </span>
              </p>
            </div>
          )}

          {project.allocationOverrun && (
            <p className="text-sm">
              Overrun: {formatPercent(project.allocationOverrun)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            Overdue
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-xl font-semibold text-amber-500 flex flex-col gap-2">
          <p>{formatCurrency(project.price - project.paid)}</p>
          <p className="text-sm">Paid: {formatCurrency(project.paid)}</p>
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
