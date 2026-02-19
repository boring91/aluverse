"use client";

import {
  DataTable,
  DataTableFilters,
  StringFilter,
  useDataTable,
  useDataTableFilters,
} from "@/components/data-table";
import { PageLoader } from "@/components/page-loader";
import { PageContainer } from "@/components/page-container";
import { useConfirm } from "@/lib/confirm-context";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { CreateUser } from "../components/create-user";
import { useUsersColumns } from "../hooks/use-users-columns";
import { usersFilterSchema } from "../schemas/users.shared-schema";

export function UsersListView() {
  useTitle("Users");

  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("users.read");
  const canCreate = hasPermission("users.create");
  const canUpdate = hasPermission("users.update");
  const canDelete = hasPermission("users.delete");

  const [itemId, setItemId] = useQueryState("itemId", parseAsString);

  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );

  const handleDelete = (targetItemId: string) => {
    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this user?",
      onConfirm: () => {
        setCurrentlyProcessing((set) => new Set(set.add(targetItemId)));
        deleteMutation.mutate({ id: targetItemId });
      },
    });
  };

  const dataTable = useDataTable();

  const { filter, reset, isActive, raw } =
    useDataTableFilters(usersFilterSchema);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.users.list.queryOptions(
      {
        pagination: dataTable.pagination,
        sorting: dataTable.sorting,
        filters: raw,
      },
      {
        enabled: canRead,
        placeholderData: keepPreviousData,
      }
    )
  );

  const deleteMutation = useMutation(
    trpc.users.delete.mutationOptions({
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(
          trpc.users.list.queryOptions({
            pagination: dataTable.pagination,
            sorting: dataTable.sorting,
          })
        );
        setCurrentlyProcessing((set) => {
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

  const columns = useUsersColumns(
    setItemId,
    handleDelete,
    currentlyProcessing,
    canUpdate,
    canDelete
  );

  if (isPending) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canRead) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to users.
        </p>
      </PageContainer>
    );
  }

  return (
    <>
      <CreateUser
        open={
          (canCreate || canUpdate) && (dataTable.openCreateSheet || !!itemId)
        }
        onOpenChange={(value) => {
          if (value) {
            dataTable.setOpenCreateSheet(true);
            return;
          }

          setItemId(null);
          dataTable.setOpenCreateSheet(false);
        }}
        itemId={itemId}
      />

      <PageContainer>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-2xl">Users</h1>
        </div>

        <DataTable
          columns={columns}
          data={data}
          {...dataTable}
          setOpenCreateSheet={
            canCreate ? dataTable.setOpenCreateSheet : undefined
          }
          filtersSlot={
            <DataTableFilters onReset={reset} hasActiveFilters={isActive}>
              <StringFilter label="Keyword" control={filter.keyword} />
            </DataTableFilters>
          }
        />
      </PageContainer>
    </>
  );
}
