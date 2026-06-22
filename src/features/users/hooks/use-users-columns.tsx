import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { AppRouter } from "@/trpc/router";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";

type User = inferRouterOutputs<AppRouter>["users"]["list"]["items"][number];

export function useUsersColumns(
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
) {
  return [
    {
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => <p>{row.original.name}</p>,
    },
    {
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <p className="text-muted-foreground">{row.original.email}</p>
      ),
    },
    {
      id: "emailVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.emailVerified ? "default" : "secondary"}>
          {row.original.emailVerified ? "Verified" : "Unverified"}
        </Badge>
      ),
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
  ] satisfies ColumnDef<User>[];
}
