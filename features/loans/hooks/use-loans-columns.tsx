import {
  DataTableColumnHeader,
  DataTableActions,
} from "@/components/data-table";
import { formatCurrency } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon } from "lucide-react";

type Loan = inferRouterOutputs<AppRouter>["loans"]["list"]["items"][number];

export const useLoansColumns = (
  handleUpdate: (itemId: string) => void,
  handleDelete: (itemId: string) => void,
  currentlyProcessing: Set<string>
) => {
  const t = useTranslations("Loans");
  const tc = useTranslations("Common");

  return useMemo<ColumnDef<Loan>[]>(() => {
    return [
      {
        id: "details",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("details")} />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant={loan.type === "lent" ? "default" : "secondary"}>
                  {t(loan.type)}
                </Badge>
                <p className="font-medium">{loan.partyName}</p>
              </div>
              {loan.notes && (
                <p className="text-muted-foreground text-xs">{loan.notes}</p>
              )}
            </div>
          );
        },
      },

      {
        id: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("date")} />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex flex-col gap-1">
              <p>{loan.date.toDateString()}</p>
              {loan.dueDate && (
                <p className="text-muted-foreground text-xs">
                  {t("dueDate")}: {loan.dueDate.toDateString()}
                </p>
              )}
            </div>
          );
        },
      },

      {
        id: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("amount")} />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex flex-col gap-1">
              <p className="font-mono">{formatCurrency(loan.amount)}</p>
              <p className="text-muted-foreground text-xs">
                {t("paid")}: {formatCurrency(loan.paid)}
              </p>
            </div>
          );
        },
      },

      {
        id: "remaining",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("remaining")} />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return <p className="font-mono">{formatCurrency(loan.remaining)}</p>;
        },
      },

      {
        id: "isConsolidated",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("isConsolidated")}
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex items-center justify-center">
              {loan.isConsolidated ? (
                <CheckIcon className="text-emerald-500" />
              ) : (
                <XIcon className="text-rose-500" />
              )}
            </div>
          );
        },
      },

      {
        id: "unconsolidatedPayoffCount",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("unconsolidatedPayoffs")}
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <p className="text-muted-foreground text-xs text-center">
              {loan.unconsolidatedPayoffCount}
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
              detailsLink={`/loans/${item.id}`}
            />
          );
        },
      },
    ];
  }, [t, tc, currentlyProcessing, handleDelete, handleUpdate]);
};
