import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { AppRouter } from "@/trpc/router";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";

type Role = inferRouterOutputs<AppRouter>["rbac"]["listRoles"]["items"][number];

export function useRolesColumns(
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
            handleUpdate={item.isBuiltIn ? undefined : handleUpdate}
            handleDelete={item.isBuiltIn ? undefined : handleDelete}
            currentlyProcessing={currentlyProcessing}
          />
        );
      },
    },
  ] satisfies ColumnDef<Role>[];
}
