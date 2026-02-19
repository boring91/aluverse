import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { AppRouter } from "@/trpc/routers/_app";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";

type User = inferRouterOutputs<AppRouter>["users"]["list"]["items"][number];

export function useUsersColumns(
  handleUpdate: (itemId: string) => void,
  handleDelete: (itemId: string) => void,
  currentlyProcessing: Set<string>,
  canUpdate: boolean,
  canDelete: boolean
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
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        );
      },
    },
  ] satisfies ColumnDef<User>[];
}
