import {
    DataTableColumnHeader,
    DataTableActions,
} from "@/components/data-table";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { ProjectStatusBadge } from "../components/project-status-badge";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";

type Project =
    inferRouterOutputs<AppRouter>["projects"]["list"]["items"][number];

export const useProjectsColumns = (
    handleUpdate: (itemId: string) => void,
    handleDelete: (itemId: string) => void,
    currentlyProcessing: Set<string>
) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    return useMemo<ColumnDef<Project>[]>(() => {
        return [
            {
                id: "details",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={tc("details")}
                    />
                ),
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="flex flex-col gap-1">
                            <p>
                                <span className="font-mono">
                                    {project.humanId}
                                </span>
                                <span> - {project.title}</span>
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {project.client}
                            </p>
                        </div>
                    );
                },
            },

            {
                id: "dates",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={tc("dates")}
                    />
                ),
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="flex flex-col gap-1">
                            <p>{project.visitDate?.toDateString()}</p>
                            <p className="text-muted-foreground text-xs">
                                {project.startDate?.toDateString()} -{" "}
                                {project.endDate?.toDateString()}
                            </p>
                        </div>
                    );
                },
            },

            {
                id: "price",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t("price")} />
                ),
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="flex flex-col gap-1">
                            {/* Total price */}
                            <p className="font-mono">
                                {formatCurrency(project.price)}
                            </p>

                            {/* Paid */}
                            <p className="text-muted-foreground text-xs">
                                <span>{t("paid")}: </span>
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
                    <DataTableColumnHeader
                        column={column}
                        title={t("profitAndCost")}
                    />
                ),
                cell: ({ row }) => {
                    const project = row.original;
                    return (
                        <div className="flex flex-col gap-1">
                            {/* Profit */}
                            <p
                                className={cn(
                                    "items-center flex gap-1 text-emerald-500",
                                    {
                                        "text-rose-500":
                                            project.price - project.cost < 0,
                                    }
                                )}
                            >
                                {/* Cash */}
                                <span className="font-mono">
                                    {formatCurrency(
                                        project.price - project.cost
                                    )}
                                </span>
                                {/* Percentage */}
                                <span
                                    className={cn(
                                        "text-xs text-emerald-500/70",
                                        {
                                            "text-rose-500/70":
                                                project.price - project.cost <
                                                0,
                                        }
                                    )}
                                >
                                    (
                                    {Math.round(
                                        ((project.price - project.cost) /
                                            project.price) *
                                            100
                                    )}
                                    %)
                                </span>
                            </p>

                            {/* Cost */}
                            <p className="font-mono text-rose-500">
                                <span>{formatCurrency(project.cost)}</span>
                            </p>
                        </div>
                    );
                },
            },

            {
                id: "status",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t("status")}
                    />
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
    }, [t, tc, currentlyProcessing, handleDelete, handleUpdate]);
};
