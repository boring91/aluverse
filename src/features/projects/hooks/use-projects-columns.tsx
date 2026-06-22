import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { useMemo } from "react";

import {
  DataTableColumnHeader,
  DataTableActions,
} from "@/components/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/client-utils";
import type { AppRouter } from "@/trpc/router";
import { formatCurrency } from "@/lib/utils";

import { ProjectStatusBadge } from "../components/project-status-badge";

type Project =
  inferRouterOutputs<AppRouter>["projects"]["list"]["items"][number];

export const useProjectsColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
) => {
  return useMemo<ColumnDef<Project>[]>(() => {
    return [
      {
        id: "details",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Details" />
        ),
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex flex-col gap-1">
              <Link
                params={{ projectId: project.id }}
                to="/projects/$projectId"
              >
                <p>
                  <span className="font-mono">{project.humanId}</span>
                  <span> - {project.title}</span>
                </p>
              </Link>
              <p className="text-muted-foreground text-xs">{project.client}</p>
            </div>
          );
        },
      },

      {
        id: "dates",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Dates" />
        ),
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex flex-col gap-1">
              {project.visitDate && <p>{project.visitDate?.toDateString()}</p>}
              {project.startDate && (
                <p className="text-muted-foreground text-xs">
                  {`${project.startDate.toDateString()} - ${project.endDate?.toDateString() ?? "N/A"}`}
                </p>
              )}
            </div>
          );
        },
      },

      {
        id: "price",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Price" />
        ),
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex flex-col gap-1">
              {/* Total price */}
              <p className="font-mono">{formatCurrency(project.price)}</p>

              {/* Paid */}
              <p className="text-muted-foreground text-xs">
                <span>Paid: </span>
                <span className="font-mono">
                  {formatCurrency(project.paid)}
                </span>
              </p>
            </div>
          );
        },
      },

      {
        id: "cost",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Profit & cost" />
        ),
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex flex-col gap-1">
              {/* Profit */}
              <p
                className={cn("items-center flex gap-1 text-emerald-500", {
                  "text-rose-500": project.profit < 0,
                })}
              >
                {/* Cash */}
                <span className="font-mono">
                  {formatCurrency(project.profit)}
                </span>
                {/* Percentage */}
                <span
                  className={cn("text-xs text-emerald-500/70", {
                    "text-rose-500/70": project.profit < 0,
                  })}
                >
                  (
                  {project.effectiveMargin === null
                    ? "-"
                    : Math.round(project.effectiveMargin * 100)}
                  %)
                </span>
              </p>

              {/* Cost & unreconciled items */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-rose-500">
                  {formatCurrency(project.cost)}
                </span>
                {project.unreconciledItemsCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs rounded-full bg-amber-100 dark:bg-amber-900 px-2 text-amber-600 dark:text-amber-200">
                        {project.unreconciledItemsCount}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Total pending reconciliation items
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        },
      },

      {
        id: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const project = row.original;
          return <ProjectStatusBadge project={project} />;
        },
      },

      {
        id: "actions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <DataTableActions
              itemId={item.id}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
              currentlyProcessing={currentlyProcessing}
              detailsLink={`/projects/${item.id}`}
            />
          );
        },
      },
    ];
  }, [currentlyProcessing, handleDelete, handleUpdate]);
};
