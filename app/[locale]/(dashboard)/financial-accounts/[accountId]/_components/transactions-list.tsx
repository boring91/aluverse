import { DataTable } from "@/components/data-table";
import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type Transaction =
    inferRouterOutputs<AppRouter>["transactions"]["list"][number];

type Props = {
    accountId: string;
};

export const TransactionsList = ({ accountId }: Props) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    const columns = useMemo<ColumnDef<Transaction>[]>(() => {
        return [
            {
                header: tc("date"),
                accessorKey: "date",
            },

            {
                header: tc("description"),
                accessorKey: "description",
            },

            {
                header: t("amount"),
                accessorFn: data => {
                    return <p>Hey</p>;
                },
            },

            {
                header: tc("actions"),
                cell: () => {
                    return <p>Wait</p>;
                },
            },
        ];
    }, [t, tc]);

    const trpc = useTRPC();
    const { data: transactions } = useQuery(
        trpc.transactions.list.queryOptions({
            accountId,
        })
    );

    return <DataTable columns={columns} data={transactions ?? []} />;
};
