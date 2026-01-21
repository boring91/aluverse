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

export const FinancialAccountsListView = () => {
  const t = useTranslations("FinancialAccounts");
  const tc = useTranslations("Common");
  const { confirm } = useConfirm();

  useTitle(tc("financialAccounts"));

  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | undefined>(
    undefined
  );

  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.financialAccounts.list.queryOptions()
  );
  const deleteMutation = useMutation(
    trpc.financialAccounts.delete.mutationOptions({
      onSuccess: (data) => {
        const id = data.id;
        queryClient.invalidateQueries(
          trpc.financialAccounts.list.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.financialAccounts.get.queryOptions({ id })
        );
        setCurrentlyProcessing((set) => {
          set.delete(id);
          return new Set(set);
        });
        toast.success(tc("deletedSuccessfully"));
      },

      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const syncMutation = useMutation(
    trpc.financialAccounts.syncWithBank.mutationOptions({
      onSuccess: (syncedTransactionCount, { id }) => {
        toast.success(
          t("successfullySyncedCountTransactions", {
            count: syncedTransactionCount?.toString() ?? 0,
          })
        );

        queryClient.invalidateQueries(
          trpc.financialAccounts.list.queryOptions()
        );

        queryClient.invalidateQueries(
          trpc.financialAccounts.get.queryOptions({ id })
        );

        setCurrentlyProcessing((set) => {
          set.delete(id);
          return new Set(set);
        });
      },

      onError: (error, { id }) => {
        toast.error(error.message);

        setCurrentlyProcessing((set) => {
          set.delete(id);
          return new Set(set);
        });
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

  const handleSync = async (itemId: string) => {
    setCurrentlyProcessing((set) => {
      set.add(itemId);
      return new Set(set);
    });
    syncMutation.mutate({ id: itemId });
  };

  const handleDelete = async (itemId: string) => {
    confirm({
      title: tc("delete"),
      description: tc("areYouSureYouWantToDeleteThisItem"),
      onConfirm: () => {
        deleteMutation.mutate({ id: itemId });
        setCurrentlyProcessing((set) => {
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
          <h1 className="font-bold text-2xl">{tc("financialAccounts")}</h1>

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
            onClickForUpdate={(itemId) => handleUpdate(itemId)}
            onClickForSync={(itemId) => handleSync(itemId)}
            onClickForDelete={(itemId) => handleDelete(itemId)}
            currentlyProcessing={currentlyProcessing}
          />
        )}
      </PageContainer>
    </>
  );
};
