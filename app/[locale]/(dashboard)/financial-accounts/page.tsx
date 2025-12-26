"use client";

import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CreateFinancialAccount } from "@/features/financial-accounts/components/create-financial-account";
import { useState } from "react";
import { toast } from "sonner";
import { FinancialAccountsGrid } from "@/features/financial-accounts/components/financial-accounts-grid";
import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { useConfirm } from "@/lib/confirm-context";

const Page = () => {
    const tc = useTranslations("Common");
    const { confirm } = useConfirm();

    useTitle(tc("financialAccounts"));

    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<string | undefined>(
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

    const handleDelete = async (itemId: string) => {
        confirm({
            title: tc("delete"),
            description: tc("areYouSureYouWantToDeleteThisItem"),
            onConfirm: () => {
                deleteMutation.mutate({ id: itemId });
                setCurrentlyDeleting(set => {
                    set.add(itemId);
                    return new Set(set);
                });
            },
        });
    };

    return (
        <>
            <CreateFinancialAccount
                open={isCreateSheetOpen}
                onOpenChange={setIsCreateSheetOpen}
                itemId={updatingItemId}
            />
            <PageContainer>
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
                    <PageLoader />
                ) : (
                    <FinancialAccountsGrid
                        items={data!}
                        onClickForUpdate={itemId => handleUpdate(itemId)}
                        onClickForDelete={itemId => handleDelete(itemId)}
                        currentlyProcessing={currentlyDeleting}
                    />
                )}
            </PageContainer>
        </>
    );
};

export default Page;
