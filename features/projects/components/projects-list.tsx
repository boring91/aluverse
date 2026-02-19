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

export const ProjectsList = () => {
  const { confirm } = useConfirm();

  const [itemId, setItemId] = useQueryState("itemId", parseAsString);

  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );

  const handleDelete = (itemId: string) => {
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
    setItemId,
    handleDelete,
    currentlyProcessing
  );

  return (
    <>
      <CreateProject
        open={dataTable.openCreateSheet || !!itemId}
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
      <DataTable
        columns={columns}
        data={data}
        {...dataTable}
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
              label="Consolidated"
              control={filter.isConsolidated}
              trueLabel="Consolidated"
              falseLabel="Not consolidated"
            />
          </DataTableFilters>
        }
      />
    </>
  );
};
