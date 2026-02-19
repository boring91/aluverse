"use client";

import { BooleanFilter, DataTable } from "@/components/data-table";
import {
  useDataTable,
  useDataTableFilters,
  DataTableFilters,
  StringFilter,
  DateFilter,
  EnumFilter,
} from "@/components/data-table";
import { useTRPC } from "@/trpc/client";
import {
  useQueryClient,
  useQuery,
  keepPreviousData,
  useMutation,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreateProject } from "./create-project";
import { useConfirm } from "@/lib/confirm-context";
import { useQueryState, parseAsString } from "nuqs";
import { useProjectsColumns } from "../hooks/use-projects-columns";
import { projectFiltersSchema } from "../schemas/projects.shared-schema";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const ProjectsList = () => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("projects.read");
  const canCreate = hasPermission("projects.create");
  const canUpdate = hasPermission("projects.update");
  const canDelete = hasPermission("projects.delete");

  const [itemId, setItemId] = useQueryState("itemId", parseAsString);

  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );

  const handleDelete = (itemId: string) => {
    if (!canDelete) {
      return;
    }

    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this item?",
      onConfirm: () => {
        setCurrentlyProcessing((set) => new Set(set.add(itemId)));
        deleteMutation.mutate({ id: itemId });
      },
    });
  };

  const dataTable = useDataTable({
    pageSize: 100,
  });

  const { filter, reset, isActive, raw } =
    useDataTableFilters(projectFiltersSchema);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.projects.list.queryOptions(
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
    trpc.projects.delete.mutationOptions({
      onSuccess: (data) => {
        const id = data.id;
        queryClient.invalidateQueries(
          trpc.projects.list.queryOptions({
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

  const columns = useProjectsColumns(
    canUpdate ? setItemId : undefined,
    canDelete ? handleDelete : undefined,
    currentlyProcessing
  );

  if (isPending) {
    return <PageLoader variant="inline" />;
  }

  if (!canRead) {
    return (
      <p className="text-muted-foreground">
        You do not have access to projects.
      </p>
    );
  }

  return (
    <>
      {canCreate || canUpdate ? (
        <CreateProject
          open={
            (canCreate && dataTable.openCreateSheet && !itemId) ||
            (canUpdate && !!itemId)
          }
          onOpenChange={(value) => {
            if (value) {
              if (!itemId && !canCreate) {
                return;
              }
              if (itemId && !canUpdate) {
                return;
              }
              dataTable.setOpenCreateSheet(true);
              return;
            }

            setItemId(null);
            dataTable.setOpenCreateSheet(false);
          }}
          itemId={itemId}
        />
      ) : null}
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

            <EnumFilter
              label="Status"
              control={filter.status}
              options={[
                { value: "planning", label: "Planning" },
                { value: "inProgress", label: "In progress" },
                {
                  value: "awaitingPayment",
                  label: "Awaiting payment",
                },
                { value: "completed", label: "Completed" },
              ]}
            />

            <DateFilter label="From date" control={filter.from} />

            <DateFilter label="To date" control={filter.to} />

            <BooleanFilter
              label="Reconciled"
              control={filter.isReconciled}
              trueLabel="Reconciled"
              falseLabel="Not reconciled"
            />
          </DataTableFilters>
        }
      />
    </>
  );
};
