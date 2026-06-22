"use client";

import { PageContainer } from "@/components/page-container";
import { useTitle } from "@/hooks/use-title";
import { TransactionsList } from "@/features/financial-accounts/components/transactions-list";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const ReconciliationsView = () => {
  useTitle("Reconciliations");
  const { hasPermission, isPending } = useRbacAccess();

  const canReadReconciliations = hasPermission("reconciliations.read");
  const canReadTransactions = hasPermission("transactions.read");
  const canRead = canReadReconciliations && canReadTransactions;

  const trpc = useTRPC();
  const { data: statistics } = useQuery(
    trpc.reconciliations.statistics.queryOptions(undefined, {
      enabled: canReadReconciliations,
    }),
  );

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
          You do not have access to reconciliations.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="font-bold text-2xl">Reconciliations</h1>

      {!!statistics?.pendingReconciliationCount && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Pending reconciliations</AlertTitle>
          <AlertDescription>
            {`You have ${statistics.pendingReconciliationCount} pending reconciliations`}
          </AlertDescription>
        </Alert>
      )}

      <TransactionsList mode="reconciliation" />
    </PageContainer>
  );
};
