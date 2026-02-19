import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { AppRouter } from "@/trpc/routers/_app";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";

type Role = inferRouterOutputs<AppRouter>["rbac"]["listRoles"]["items"][number];

export function useRolesColumns(
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
      id: "humanId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Human ID" />
      ),
      cell: ({ row }) => (
        <p className="font-mono text-muted-foreground">
          {row.original.humanId ?? "-"}
        </p>
      ),
    },
    {
      id: "isBuiltIn",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.isBuiltIn ? "secondary" : "outline"}>
          {row.original.isBuiltIn ? "Built-in" : "Custom"}
        </Badge>
      ),
    },
    {
      id: "permissionsCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Permissions" />
      ),
      cell: ({ row }) => <p>{row.original.permissions.length}</p>,
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
            canUpdate={canUpdate && !item.isBuiltIn}
            canDelete={canDelete && !item.isBuiltIn}
          />
        );
      },
    },
  ] satisfies ColumnDef<Role>[];
}
