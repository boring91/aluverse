"use client";

import { DataTable } from "@/components/data-table";
import {
  useDataTable,
  useDataTableFilters,
  DataTableFilters,
  StringFilter,
  DateFilter,
  EnumFilter,
  BooleanFilter,
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
import { CreateLoan } from "./create-loan";
import { useConfirm } from "@/lib/confirm-context";
import { useQueryState, parseAsString } from "nuqs";
import { useLoansColumns } from "../hooks/use-loans-columns";
import { loanFiltersSchema } from "../schemas/loans.shared-schema";

export const LoansList = () => {
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
    useDataTableFilters(loanFiltersSchema);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.loans.list.queryOptions(
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
    trpc.loans.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.loans.list.queryOptions({
            pagination: dataTable.pagination,
            sorting: dataTable.sorting,
          })
        );

        toast.success("Deleted successfully");
      },

      onError: (error) => {
        toast.error(error.message);
      },

      onSettled: (_, __, { id }) => {
        setCurrentlyProcessing((set) => {
          set.delete(id);
          return new Set(set);
        });
      },
    })
  );

  const columns = useLoansColumns(setItemId, handleDelete, currentlyProcessing);

  return (
    <>
      <CreateLoan
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
              label="Type"
              control={filter.type}
              options={[
                { value: "lent", label: "Lent" },
                { value: "borrowed", label: "Borrowed" },
              ]}
            />

            <BooleanFilter
              label="Paid off"
              control={filter.isPaidOff}
              trueLabel="Yes"
              falseLabel="No"
            />

            <DateFilter label="From date" control={filter.from} />

            <DateFilter label="To date" control={filter.to} />
          </DataTableFilters>
        }
      />
    </>
  );
};
