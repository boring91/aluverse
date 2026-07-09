import {
  DataTableColumnHeader,
  DataTableActions,
} from "@/components/data-table";
import { formatCurrency } from "@/lib/utils";
import { formatCalendarDate } from "@/lib/date";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { AppRouter } from "@/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon } from "lucide-react";

type Loan = inferRouterOutputs<AppRouter>["loans"]["list"]["items"][number];

const LOAN_TYPE_LABELS = {
  lent: "Lent",
  borrowed: "Borrowed",
} as const;

export const useLoansColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
) => {
  return useMemo<ColumnDef<Loan>[]>(() => {
    return [
      {
        id: "details",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Details" />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant={loan.type === "lent" ? "default" : "secondary"}>
                  {LOAN_TYPE_LABELS[loan.type]}
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
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex flex-col gap-1">
              <p>{formatCalendarDate(loan.date)}</p>
              {loan.dueDate && (
                <p className="text-muted-foreground text-xs">
                  Due date: {formatCalendarDate(loan.dueDate)}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex flex-col gap-1">
              <p className="font-mono">{formatCurrency(loan.amount)}</p>
              <p className="text-muted-foreground text-xs">
                Paid: {formatCurrency(loan.paid)}
              </p>
            </div>
          );
        },
      },
      {
        id: "remaining",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Remaining" />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return <p className="font-mono">{formatCurrency(loan.remaining)}</p>;
        },
      },
      {
        id: "isReconciled",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Is reconciled"
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex items-center justify-center">
              {loan.isReconciled ? (
                <CheckIcon className="text-emerald-500" />
              ) : (
                <XIcon className="text-rose-500" />
              )}
            </div>
          );
        },
      },
      {
        id: "unreconciledPayoffCount",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Unreconciled payoffs"
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <p className="text-muted-foreground text-xs text-center">
              {loan.unreconciledPayoffCount}
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
  }, [currentlyProcessing, handleDelete, handleUpdate]);
};
