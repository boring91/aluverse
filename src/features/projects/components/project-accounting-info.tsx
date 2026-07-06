"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/client-utils";
import type { AppRouter } from "@/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Progress } from "@/components/ui/progress";
import { InfoIcon } from "lucide-react";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

const CostBreakdown = ({ project }: { project: Project }) => {
  const rows = [
    { label: "Supplies", value: project.suppliesCost, dot: "bg-violet-500" },
    { label: "Labor", value: project.laborCost, dot: "bg-amber-500" },
    { label: "Miscellaneous", value: project.miscCost, dot: "bg-teal-500" },
    {
      label: "Budget allocation",
      value: -project.budgetAllocationCost,
      dot: "bg-sky-500",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Cost breakdown"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-foreground/20 -m-1 rounded-none p-1 transition-colors outline-none focus-visible:ring-2"
      >
        <InfoIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0 p-0">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium">Cost breakdown</p>
          <p className="text-muted-foreground text-xs">
            Reconciled expenses so far
          </p>
        </div>
        <div className="flex flex-col gap-2 px-3 py-2.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", row.dot)} />
                {row.label}
              </span>
              <span
                className={cn("font-mono tabular-nums", {
                  "text-rose-500": row.value < 0,
                })}
              >
                {formatCurrency(row.value)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2 font-medium">
          <span>Total</span>
          <span className="font-mono tabular-nums text-rose-500">
            {formatCurrency(project.cost)}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const ProjectAccountingInfo = ({ project }: { project: Project }) => {
  const remainingAllocation =
    project.usedAllocation === null
      ? null
      : (1 - project.usedAllocation) * project.allocation;
  const allocationOverrunAmount = Math.max(
    0,
    Math.abs(project.cost) - project.allocation,
  );

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
          <CardAction>
            <CostBreakdown project={project} />
          </CardAction>
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
                  {formatCurrency(remainingAllocation ?? 0)}
                </span>
                <span className="text-muted-foreground"> / </span>
                <span className="font-mono text-muted-foreground">
                  {formatCurrency(project.allocation)}
                </span>
              </p>
            </div>
          )}

          {project.allocationOverrun && (
            <div className="flex flex-col gap-1">
              <p className="text-sm">
                Overrun: {formatPercent(project.allocationOverrun)}{" "}
                <span className="font-mono">
                  ({formatCurrency(allocationOverrunAmount)})
                </span>
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Total allocation:{" "}
                <span className="font-mono">
                  {formatCurrency(project.allocation)}
                </span>
              </p>
            </div>
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
