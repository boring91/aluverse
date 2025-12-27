"use client";

import { DataTable } from "@/components/data-table";
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
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

export const LoansList = () => {
    const tc = useTranslations("Common");

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
                setCurrentlyProcessing(set => new Set(set.add(itemId)));
                deleteMutation.mutate({ id: itemId });
            },
        });
    };

    const dataTable = useDataTable({
        pageSize: 100,
    });

    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const { data } = useQuery(
        trpc.loans.list.queryOptions(
            {
                pagination: dataTable.pagination,
                sorting: dataTable.sorting,
            },
            {
                placeholderData: keepPreviousData,
            }
        )
    );

    const deleteMutation = useMutation(
        trpc.loans.delete.mutationOptions({
            onSuccess: data => {
                const id = data[0].id;
                queryClient.invalidateQueries(
                    trpc.loans.list.queryOptions({
                        pagination: dataTable.pagination,
                        sorting: dataTable.sorting,
                    })
                );
                setCurrentlyProcessing(set => {
                    set.delete(id);
                    return new Set(set);
                });
                toast.success(tc("deletedSuccessfully"));
            },

            onError: error => {
                toast.error(error.message);
            },
        })
    );

    const columns = useLoansColumns(
        setItemId,
        handleDelete,
        currentlyProcessing
    );

    return (
        <>
            <CreateLoan
                open={dataTable.openCreateSheet || !!itemId}
                onOpenChange={value => {
                    if (value) {
                        dataTable.setOpenCreateSheet(true);
                        return;
                    }

                    setItemId(null);
                    dataTable.setOpenCreateSheet(false);
                }}
                itemId={itemId}
            />
            <DataTable columns={columns} data={data} {...dataTable} />
        </>
    );
};

