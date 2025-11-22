"use client";

import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3Icon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CreateFinancialAccount } from "./_components/create-financial-account";
import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data?.map(account => {
                            return (
                                <Card key={account.id}>
                                    <CardHeader className="flex items-center justify-between gap-2">
                                        <CardTitle>{account.name}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground"
                                                onClick={() =>
                                                    handleUpdate(account.id)
                                                }
                                                disabled={currentlyDeleting.has(
                                                    account.id
                                                )}
                                            >
                                                <Edit3Icon />
                                            </Button>
                                            <Button
                                                variant="ghostDestructive"
                                                size="icon-sm"
                                                onClick={() =>
                                                    setDeletingItemId(
                                                        account.id
                                                    )
                                                }
                                                disabled={currentlyDeleting.has(
                                                    account.id
                                                )}
                                            >
                                                <Trash2Icon />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default Page;
