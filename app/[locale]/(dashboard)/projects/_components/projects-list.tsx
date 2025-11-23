"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
    DataTable,
    DataTableActions,
    DataTableColumnHeader,
} from "@/components/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { useRowActionState } from "@/hooks/use-row-action-state";
import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import {
    useQueryClient,
    useQuery,
    keepPreviousData,
    useMutation,
} from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { CreateProject } from "./create-project";
import { formatCurrency, getProjectStatus } from "@/lib/utils";
import { cn } from "@/lib/client-utils";
import { ProjectStatusBadge } from "./project-status-badge";

type Project =
    inferRouterOutputs<AppRouter>["projects"]["list"]["items"][number];

type Props = {
    openCreateSheet: boolean;
    onOpenCreateSheetChange: (open: boolean) => void;
};

export const ProjectsList = ({
    openCreateSheet,
    onOpenCreateSheetChange,
}: Props) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    const {
        currentlyUpdatingItemId,
        setCurrentlyUpdatingItemId,
        currentlyDeletingItemId,
        setCurrentlyDeletingItemId,
        currentlyProcessing,
        setCurrentlyProcessing,
    } = useRowActionState();

    const dataTable = useDataTable({
        pageSize: 100,
    });

    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const { data } = useQuery(
        trpc.projects.list.queryOptions(
            {
                pagination: dataTable.pagination,
                sorting: dataTable.sorting,
                columnFilters: dataTable.columnFilters,
            },
            {
                placeholderData: keepPreviousData,
            }
        )
    );

    const deleteMutation = useMutation(
        trpc.projects.delete.mutationOptions({
            onSuccess: data => {
                const id = data[0].id;
                queryClient.invalidateQueries(
                    trpc.projects.list.queryOptions({
                        pagination: dataTable.pagination,
                        sorting: dataTable.sorting,
                        columnFilters: dataTable.columnFilters,
                    })
                );
                setCurrentlyProcessing(set => {
                    set.delete(id);
                    return new Set(set);
                });
                toast.success(tc("deletedSuccessfully"));
            },

            onError: error => {
                toast.error(error.message);
            },
        })
    );

    const handleUpdate = useCallback(
        (itemId: string) => {
            setCurrentlyUpdatingItemId(itemId);
            onOpenCreateSheetChange(true);
        },
        [onOpenCreateSheetChange, setCurrentlyUpdatingItemId]
    );

    const handleDelete = () => {
        if (!currentlyDeletingItemId) return;
        deleteMutation.mutate({ id: currentlyDeletingItemId });
        setCurrentlyDeletingItemId(undefined);
    };

    const columns = useMemo<ColumnDef<Project>[]>(() => {
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
                            <p className="items-center flex gap-1 text-emerald-500">
                                {/* Cash */}
                                <span className="font-mono">
                                    {formatCurrency(
                                        project.price - project.cost
                                    )}
                                </span>
                                {/* Percentage */}
                                <span className="text-xs text-emerald-500/70">
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
                            setCurrentlyDeletingItemId={
                                setCurrentlyDeletingItemId
                            }
                            currentlyProcessing={currentlyProcessing}
                            detailsLink={`/projects/${item.id}`}
                        />
                    );
                },
            },
        ];
    }, [t, tc, currentlyProcessing, setCurrentlyDeletingItemId, handleUpdate]);

    return (
        <>
            <ConfirmDialog
                title={tc("delete")}
                description={tc("areYouSureYouWantToDeleteThisItem")}
                open={!!currentlyDeletingItemId}
                onOpenChange={() => setCurrentlyDeletingItemId(undefined)}
                onConfirm={handleDelete}
            />
            <CreateProject
                open={openCreateSheet}
                onOpenChange={value => {
                    if (value) {
                        onOpenCreateSheetChange(true);
                        return;
                    }

                    setCurrentlyUpdatingItemId(undefined);
                    onOpenCreateSheetChange(false);
                }}
                itemId={currentlyUpdatingItemId}
            />
            <DataTable
                columns={columns}
                data={data}
                searchKey="title"
                {...dataTable}
            />
        </>
    );
};
