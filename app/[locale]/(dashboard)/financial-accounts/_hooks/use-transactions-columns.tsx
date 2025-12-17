import {
    DataTableColumnHeader,
    DataTableActions,
} from "@/components/data-table";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import { AppRouter } from "@/trpc/routers/_app";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type Transaction =
    inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

export const useTransactionsColumns = (
    handleUpdate: (itemId: string) => void,
    handleDelete: (itemId: string) => void,
    currentlyProcessing: Set<string>
) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    return useMemo<ColumnDef<Transaction>[]>(() => {
        return [
            {
                accessorKey: "date",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={tc("date")} />
                ),
                cell: ({ row }) => row.original.date.toDateString(),
            },

            {
                accessorKey: "description",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={tc("description")}
                    />
                ),
            },

            {
                accessorKey: "amount",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t("amount")}
                    />
                ),
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
                id: "actions",
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <DataTableActions
                            itemId={item.id}
                            handleUpdate={handleUpdate}
                            handleDelete={handleDelete}
                            currentlyProcessing={currentlyProcessing}
                        />
                    );
                },
            },
        ];
    }, [t, tc, currentlyProcessing, handleDelete, handleUpdate]);
};
