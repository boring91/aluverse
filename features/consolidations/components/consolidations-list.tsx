import { useDataTable } from "@/hooks/use-data-table";
import { useTRPC } from "@/trpc/client";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { useConsolidationsColumns } from "../hooks/use-consolidations-columns";
import { CreateConsolidation } from "./create-consolidation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/lib/confirm-context";

type Props = {
    transactionId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const ConsolidationsList = ({
    transactionId,
    open,
    onOpenChange,
}: Props) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");
    const { confirm } = useConfirm();

    const [itemId, setItemId] = useState<string | null>(null);
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
        trpc.consolidations.list.queryOptions(
            {
                transactionId,
                pagination: dataTable.pagination,
                sorting: dataTable.sorting,
                columnFilters: dataTable.columnFilters,
            },
            {
                placeholderData: keepPreviousData,
            }
        )
    );

    const deleteMutation = useMutation(
        trpc.consolidations.delete.mutationOptions({
            onSuccess: data => {
                const id = data[0].id;
                queryClient.invalidateQueries(
                    trpc.consolidations.list.queryOptions({ transactionId })
                );
                queryClient.invalidateQueries(
                    trpc.consolidations.statistics.queryOptions()
                );
                queryClient.invalidateQueries(
                    trpc.transactions.list.queryOptions({})
                );
                queryClient.invalidateQueries(
                    trpc.consolidations.getDefault.queryOptions({
                        transactionId,
                    })
                );

                setCurrentlyProcessing(set => {
                    set.delete(id);
                    return new Set(set);
                });

                toast(tc("deletedSuccessfully"));
            },

            onError: error => {
                toast.error(error.message);
            },
        })
    );

    const columns = useConsolidationsColumns(
        setItemId,
        handleDelete,
        currentlyProcessing
    );

    return (
        <>
            {(dataTable.openCreateSheet || itemId) && (
                <CreateConsolidation
                    transactionId={transactionId}
                    itemId={itemId}
                    open={dataTable.openCreateSheet || !!itemId}
                    onOpenChange={value => {
                        if (value) {
                            dataTable.setOpenCreateSheet(true);
                            return;
                        }

                        setItemId(null);
                        dataTable.setOpenCreateSheet(false);
                    }}
                />
            )}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>{t("consolidations")}</DialogTitle>
                        <DialogDescription>
                            {t("consolidationsListDetails")}
                        </DialogDescription>
                    </DialogHeader>

                    <DataTable columns={columns} data={data} {...dataTable} />
                </DialogContent>
            </Dialog>
        </>
    );
};
