"use client";

import { PageContainer } from "@/components/page-container";
import { useTitle } from "@/hooks/use-title";
import { TransactionsList } from "@/features/financial-accounts/components/transactions-list";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const ConsolidationsView = () => {
  useTitle("Consolidations");
  const { hasPermission, isPending } = useRbacAccess();

  const canReadConsolidations = hasPermission("consolidations.read");
  const canReadTransactions = hasPermission("transactions.read");
  const canRead = canReadConsolidations && canReadTransactions;

  const trpc = useTRPC();
  const { data: statistics } = useQuery(
    trpc.consolidations.statistics.queryOptions(undefined, {
      enabled: canReadConsolidations,
    })
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
          You do not have access to consolidations.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="font-bold text-2xl">Consolidations</h1>

      {!!statistics?.pendingConsolidationCount && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Pending consolidations</AlertTitle>
          <AlertDescription>
            {`You have ${statistics.pendingConsolidationCount} pending consolidations`}
          </AlertDescription>
        </Alert>
      )}

      <TransactionsList mode="consolidation" />
    </PageContainer>
  );
};
