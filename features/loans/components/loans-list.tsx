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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CreateLoan } from "./create-loan";
import { useConfirm } from "@/lib/confirm-context";
import { useQueryState, parseAsString } from "nuqs";
import { useLoansColumns } from "../hooks/use-loans-columns";
import { loanFiltersSchema } from "../schemas/loan.schemas";

export const LoansList = () => {
  const tc = useTranslations("Common");
  const t = useTranslations("Loans");

  const { confirm } = useConfirm();

  const [itemId, setItemId] = useQueryState("itemId", parseAsString);

  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );

  const handleDelete = (itemId: string) => {
    confirm({
      title: tc("delete"),
      description: tc("areYouSureYouWantToDeleteThisItem"),
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

        toast.success(tc("deletedSuccessfully"));
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
            <StringFilter label={tc("keyword")} control={filter.keyword} />

            <EnumFilter
              label={t("type")}
              control={filter.type}
              options={[
                { value: "lent", label: t("lent") },
                { value: "borrowed", label: t("borrowed") },
              ]}
            />

            <BooleanFilter
              label="Paid off"
              control={filter.isPaidOff}
              trueLabel={tc("yes")}
              falseLabel={tc("no")}
            />

            <DateFilter label={tc("fromDate")} control={filter.from} />

            <DateFilter label={tc("toDate")} control={filter.to} />
          </DataTableFilters>
        }
      />
    </>
  );
};
