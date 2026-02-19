"use client";

import {
  DataTable,
  DataTableFilters,
  StringFilter,
  useDataTable,
  useDataTableFilters,
} from "@/components/data-table";
import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirm } from "@/lib/confirm-context";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserRolesDialog } from "../components/user-roles-dialog";
import { RoleDialog } from "../components/role-dialog";
import { useRbacAccess } from "../hooks/use-rbac-access";
import { useRolesColumns } from "../hooks/use-roles-columns";
import { useUsersAccessColumns } from "../hooks/use-users-access-columns";
import {
  rolesFilterSchema,
  usersAccessFilterSchema,
} from "../schemas/rbac.shared-schema";

export function AccessControlView() {
  useTitle("Access Control");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canReadRoles = hasPermission("rbac.roles.read");
  const canManageRoles = hasPermission("rbac.roles.manage");
  const canManageAssignments = hasPermission("rbac.assignments.manage");

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentlyProcessingRoles, setCurrentlyProcessingRoles] = useState<
    Set<string>
  >(new Set());
  const [currentlyProcessingUsers] = useState<Set<string>>(new Set());

  const rolesTable = useDataTable({ disableUrlKeys: true });
  const usersTable = useDataTable({ disableUrlKeys: true });

  const {
    filter: rolesFilter,
    reset: rolesReset,
    isActive: rolesHasActiveFilters,
    raw: rolesRawFilters,
  } = useDataTableFilters(rolesFilterSchema, { disableUrlKeys: true });

  const {
    filter: usersFilter,
    reset: usersReset,
    isActive: usersHasActiveFilters,
    raw: usersRawFilters,
  } = useDataTableFilters(usersAccessFilterSchema, { disableUrlKeys: true });

  const { data: rolesData } = useQuery(
    trpc.rbac.listRoles.queryOptions(
      {
        pagination: rolesTable.pagination,
        sorting: rolesTable.sorting,
        filters: rolesRawFilters,
      },
      {
        enabled: canReadRoles || canManageAssignments,
        placeholderData: keepPreviousData,
      }
    )
  );

  const { data: usersData } = useQuery(
    trpc.rbac.listUsersAccess.queryOptions(
      {
        pagination: usersTable.pagination,
        sorting: usersTable.sorting,
        filters: usersRawFilters,
      },
      {
        enabled: canManageAssignments,
        placeholderData: keepPreviousData,
      }
    )
  );

  const selectedRole = useMemo(
    () => rolesData?.items.find((item) => item.id === selectedRoleId) ?? null,
    [rolesData?.items, selectedRoleId]
  );

  const selectedUser = useMemo(
    () => usersData?.items.find((item) => item.id === selectedUserId) ?? null,
    [usersData?.items, selectedUserId]
  );

  const deleteRoleMutation = useMutation(
    trpc.rbac.deleteRole.mutationOptions({
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(
          trpc.rbac.listRoles.queryOptions({
            pagination: rolesTable.pagination,
            sorting: rolesTable.sorting,
            filters: rolesRawFilters,
          })
        );
        queryClient.invalidateQueries(
          trpc.rbac.listUsersAccess.queryOptions({
            pagination: usersTable.pagination,
            sorting: usersTable.sorting,
            filters: usersRawFilters,
          })
        );
        queryClient.invalidateQueries(trpc.rbac.myAccess.queryOptions());

        setCurrentlyProcessingRoles((set) => {
          set.delete(id);
          return new Set(set);
        });

        toast.success("Deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleDeleteRole = (itemId: string) => {
    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this role?",
      onConfirm: () => {
        setCurrentlyProcessingRoles((set) => new Set(set.add(itemId)));
        deleteRoleMutation.mutate({ id: itemId });
      },
    });
  };

  const rolesColumns = useRolesColumns(
    canManageRoles ? setSelectedRoleId : undefined,
    canManageRoles ? handleDeleteRole : undefined,
    currentlyProcessingRoles
  );

  const usersColumns = useUsersAccessColumns(
    canManageAssignments ? setSelectedUserId : undefined,
    currentlyProcessingUsers
  );

  const canSeeRolesTab = canReadRoles;
  const canSeeUsersTab = canManageAssignments;

  if (isPending) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canSeeRolesTab && !canSeeUsersTab) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to access-control settings.
        </p>
      </PageContainer>
    );
  }

  return (
    <>
      <RoleDialog
        key={`${selectedRoleId ?? "new"}-${rolesTable.openCreateSheet ? "open" : "closed"}`}
        open={rolesTable.openCreateSheet || !!selectedRoleId}
        onOpenChange={(value) => {
          if (value) {
            rolesTable.setOpenCreateSheet(true);
            return;
          }

          setSelectedRoleId(null);
          rolesTable.setOpenCreateSheet(false);
        }}
        role={selectedRole}
      />

      <UserRolesDialog
        key={selectedUserId ?? "none"}
        open={!!selectedUserId}
        onOpenChange={(value) => {
          if (!value) {
            setSelectedUserId(null);
          }
        }}
        user={selectedUser}
        roles={rolesData?.items ?? []}
      />

      <PageContainer>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-2xl">Access Control</h1>
        </div>

        <Tabs defaultValue={canSeeRolesTab ? "roles" : "users"}>
          <TabsList>
            {canSeeRolesTab ? (
              <TabsTrigger value="roles">Roles</TabsTrigger>
            ) : null}
            {canSeeUsersTab ? (
              <TabsTrigger value="users">User Assignments</TabsTrigger>
            ) : null}
          </TabsList>

          {canSeeRolesTab ? (
            <TabsContent value="roles">
              <DataTable
                columns={rolesColumns}
                data={rolesData}
                {...rolesTable}
                setOpenCreateSheet={
                  canManageRoles ? rolesTable.setOpenCreateSheet : undefined
                }
                filtersSlot={
                  <DataTableFilters
                    onReset={rolesReset}
                    hasActiveFilters={rolesHasActiveFilters}
                  >
                    <StringFilter
                      label="Keyword"
                      control={rolesFilter.keyword}
                    />
                  </DataTableFilters>
                }
              />
            </TabsContent>
          ) : null}

          {canSeeUsersTab ? (
            <TabsContent value="users">
              <DataTable
                columns={usersColumns}
                data={usersData}
                {...usersTable}
                filtersSlot={
                  <DataTableFilters
                    onReset={usersReset}
                    hasActiveFilters={usersHasActiveFilters}
                  >
                    <StringFilter
                      label="Keyword"
                      control={usersFilter.keyword}
                    />
                  </DataTableFilters>
                }
              />
            </TabsContent>
          ) : null}
        </Tabs>
      </PageContainer>
    </>
  );
}
