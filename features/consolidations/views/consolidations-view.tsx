"use client";

import { PageContainer } from "@/components/page-container";
import { useTitle } from "@/hooks/use-title";
import { TransactionsList } from "@/features/financial-accounts/components/transactions-list";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

export const ConsolidationsView = () => {
  useTitle("Consolidations");

  const trpc = useTRPC();
  const { data: statistics } = useQuery(
    trpc.consolidations.statistics.queryOptions()
  );

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
