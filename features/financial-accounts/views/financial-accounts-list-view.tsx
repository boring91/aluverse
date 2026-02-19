"use client";

import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { CreateFinancialAccount } from "@/features/financial-accounts/components/create-financial-account";
import { useState } from "react";
import { toast } from "sonner";
import { FinancialAccountsGrid } from "@/features/financial-accounts/components/financial-accounts-grid";
import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { useConfirm } from "@/lib/confirm-context";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";

export const FinancialAccountsListView = () => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  useTitle("Financial accounts");

  const canRead = hasPermission("financialAccounts.read");
  const canCreate = hasPermission("financialAccounts.create");
  const canUpdate = hasPermission("financialAccounts.update");
  const canDelete = hasPermission("financialAccounts.delete");

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
    trpc.financialAccounts.list.queryOptions(undefined, {
      enabled: canRead,
    })
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
        toast.success("Deleted successfully");
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
          `Successfully synced ${syncedTransactionCount?.toString() ?? 0} transactions`
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
    if (!canCreate) {
      return;
    }
    setUpdatingItemId(undefined);
    setIsCreateSheetOpen(true);
  };

  const handleUpdate = (itemId: string) => {
    if (!canUpdate) {
      return;
    }
    setUpdatingItemId(itemId);
    setIsCreateSheetOpen(true);
  };

  const handleSync = async (itemId: string) => {
    if (!canUpdate) {
      return;
    }
    setCurrentlyProcessing((set) => {
      set.add(itemId);
      return new Set(set);
    });
    syncMutation.mutate({ id: itemId });
  };

  const handleDelete = async (itemId: string) => {
    if (!canDelete) {
      return;
    }
    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this item?",
      onConfirm: () => {
        deleteMutation.mutate({ id: itemId });
        setCurrentlyProcessing((set) => {
          set.add(itemId);
          return new Set(set);
        });
      },
    });
  };

  if (isPending) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canRead) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to financial accounts.
        </p>
      </PageContainer>
    );
  }

  return (
    <>
      {canCreate || canUpdate ? (
        <CreateFinancialAccount
          open={
            (canCreate && isCreateSheetOpen && !updatingItemId) ||
            (canUpdate && !!updatingItemId && isCreateSheetOpen)
          }
          onOpenChange={(value) => {
            if (value) {
              if (!updatingItemId && !canCreate) {
                return;
              }
              if (updatingItemId && !canUpdate) {
                return;
              }
              setIsCreateSheetOpen(true);
              return;
            }

            setUpdatingItemId(undefined);
            setIsCreateSheetOpen(false);
          }}
          itemId={updatingItemId}
        />
      ) : null}
      <PageContainer>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-2xl">Financial accounts</h1>

          {canCreate ? (
            <Button onClick={handleCreate}>
              <PlusIcon />
              Create new
            </Button>
          ) : null}
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
            canUpdate={canUpdate}
            canSync={canUpdate}
            canDelete={canDelete}
          />
        )}
      </PageContainer>
    </>
  );
};
