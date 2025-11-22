"use client";

import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CreateFinancialAccount } from "./_components/create-financial-account";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { FinancialAccountsGrid } from "./_components/financial-accounts-grid";

const Page = () => {
    const tc = useTranslations("Common");
    useTitle(tc("financialAccounts"));

    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<string | undefined>(
        undefined
    );
    const [deletingItemId, setDeletingItemId] = useState<string | undefined>(
        undefined
    );
    const [currentlyDeleting, setCurrentlyDeleting] = useState<Set<string>>(
        new Set()
    );

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery(
        trpc.financialAccounts.list.queryOptions()
    );
    const deleteMutation = useMutation(
        trpc.financialAccounts.delete.mutationOptions({
            onSuccess: data => {
                const id = data[0].id;
                queryClient.invalidateQueries(
                    trpc.financialAccounts.list.queryOptions()
                );
                queryClient.invalidateQueries(
                    trpc.financialAccounts.get.queryOptions({ id })
                );
                setCurrentlyDeleting(set => {
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

    const handleCreate = () => {
        setUpdatingItemId(undefined);
        setIsCreateSheetOpen(true);
    };

    const handleUpdate = (itemId: string) => {
        setUpdatingItemId(itemId);
        setIsCreateSheetOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingItemId) return;
        deleteMutation.mutate({ id: deletingItemId });
        setCurrentlyDeleting(set => {
            set.add(deletingItemId);
            return new Set(set);
        });
        setDeletingItemId(undefined);
    };

    return (
        <>
            <ConfirmDialog
                title={tc("delete")}
                description={tc("areYouSureYouWantToDeleteThisItem")}
                onConfirm={handleDelete}
                open={!!deletingItemId}
                onOpenChange={() => setDeletingItemId(undefined)}
            />
            <CreateFinancialAccount
                open={isCreateSheetOpen}
                onOpenChange={setIsCreateSheetOpen}
                itemId={updatingItemId}
            />
            <div className="p-8 flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="font-bold text-2xl">
                        {tc("financialAccounts")}
                    </h1>

                    <Button onClick={handleCreate}>
                        <PlusIcon />
                        {tc("createNew")}
                    </Button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <Loader2Icon className="animate-spin" />
                ) : (
                    <FinancialAccountsGrid
                        items={data!}
                        onClickForUpdate={itemId => handleUpdate(itemId)}
                        onClickForDelete={itemId => setDeletingItemId(itemId)}
                        currentlyProcessing={currentlyDeleting}
                    />
                )}
            </div>
        </>
    );
};

export default Page;
