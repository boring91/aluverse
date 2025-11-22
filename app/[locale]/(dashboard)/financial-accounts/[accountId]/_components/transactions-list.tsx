import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { MoreVerticalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { CreateTransaction } from "./create-transaction";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

type Transaction =
    inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

type Props = {
    accountId: string;
    openCreateSheet: boolean;
    onOpenCreateSheetChange: (open: boolean) => void;
};

export const TransactionsList = ({
    accountId,
    openCreateSheet,
    onOpenCreateSheetChange,
}: Props) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    const [currentlyUpdatingItemId, setCurrentlyUpdatingItemId] = useState<
        string | undefined
    >(undefined);
    const [currentlyDeletingItemId, setCurrentlyDeletingItemId] = useState<
        string | undefined
    >(undefined);
    const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
        new Set()
    );
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 100,
    });

    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const { data } = useQuery(
        trpc.transactions.list.queryOptions(
            {
                accountId,
                ...pagination,
            },
            {
                placeholderData: keepPreviousData,
            }
        )
    );

    const deleteMutation = useMutation(
        trpc.transactions.delete.mutationOptions({
            onSuccess: data => {
                const id = data[0].id;
                queryClient.invalidateQueries(
                    trpc.transactions.list.queryOptions({ accountId })
                );
                queryClient.invalidateQueries(
                    trpc.transactions.get.queryOptions({ id })
                );
                queryClient.invalidateQueries(
                    trpc.financialAccounts.list.queryOptions()
                );
                queryClient.invalidateQueries(
                    trpc.financialAccounts.get.queryOptions({ id: accountId })
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
        [onOpenCreateSheetChange]
    );

    const handleDelete = () => {
        if (!currentlyDeletingItemId) return;
        deleteMutation.mutate({ id: currentlyDeletingItemId });
        setCurrentlyDeletingItemId(undefined);
    };

    const columns = useMemo<ColumnDef<Transaction>[]>(() => {
        return [
            {
                header: tc("date"),
                accessorFn: item => item.date.toDateString(),
            },

            {
                header: tc("description"),
                accessorKey: "description",
            },

            {
                header: t("amount"),
                cell: ({ row }) => {
                    const isExpense = row.original.type === "expense";
                    return (
                        <p
                            className={cn(
                                "font-mono",
                                isExpense ? "text-rose-500" : "text-emerald-500"
                            )}
                        >
                            {isExpense
                                ? `(${formatCurrency(row.original.amount)})`
                                : formatCurrency(row.original.amount)}
                        </p>
                    );
                },
            },

            {
                header: tc("actions"),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVerticalIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    disabled={currentlyProcessing.has(item.id)}
                                    onClick={() => handleUpdate(item.id)}
                                >
                                    {tc("edit")}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    variant="destructive"
                                    disabled={currentlyProcessing.has(item.id)}
                                    onClick={() =>
                                        setCurrentlyDeletingItemId(item.id)
                                    }
                                >
                                    {tc("delete")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
            <CreateTransaction
                accountId={accountId}
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
                pagination={pagination}
                setPagination={setPagination}
            />
        </>
    );
};
