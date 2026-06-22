"use client";

import { useParams } from "@tanstack/react-router";
import { PageContainer } from "@/components/page-container";
import { NotFound } from "@/components/NotFound";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { TransactionsList } from "@/features/financial-accounts/components/transactions-list";
import { PageLoader } from "@/components/page-loader";
import { FinancialAccountDetailHeader } from "@/features/financial-accounts/components/financial-account-detail-header";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";

export const FinancialAccountDetailView = () => {
  const params = useParams({ strict: false });
  const accountId = params["accountId"] as string;
  const { hasPermission, isPending } = useRbacAccess();
  const canRead = hasPermission("financialAccounts.read");
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.financialAccounts.get.queryOptions(
      {
        id: accountId,
      },
      {
        enabled: canRead,
      },
    ),
  );
  useTitle(data ? data.name : "Loading");

  if (isPending || isLoading) {
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

  if (!data) {
    return <NotFound />;
  }

  return (
    <PageContainer>
      <FinancialAccountDetailHeader account={data} />

      {/* Transactions */}
      <TransactionsList accountId={accountId} mode="account" />
    </PageContainer>
  );
};
