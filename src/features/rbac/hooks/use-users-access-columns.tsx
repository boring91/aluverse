import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { AppRouter } from "@/trpc/router";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";

type UserAccess =
  inferRouterOutputs<AppRouter>["rbac"]["listUsersAccess"]["items"][number];

export function useUsersAccessColumns(
  handleUpdate: ((itemId: string) => void) | undefined,
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
      id: "roles",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roles" />
      ),
      cell: ({ row }) => {
        const roles = row.original.roles;

        if (!roles.length) {
          return <p className="text-muted-foreground">No roles</p>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role.id} variant="outline">
                {role.name}
              </Badge>
            ))}
          </div>
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
            currentlyProcessing={currentlyProcessing}
          />
        );
      },
    },
  ] satisfies ColumnDef<UserAccess>[];
}
