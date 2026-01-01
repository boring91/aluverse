"use client";

import { PageContainer } from "@/components/page-container";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { notFound, useParams } from "next/navigation";
import { TransactionsList } from "@/features/financial-accounts/components/transactions-list";
import { PageLoader } from "@/components/page-loader";
import { FinancialAccountDetailHeader } from "@/features/financial-accounts/components/financial-account-detail-header";

export const FinancialAccountDetailView = () => {
    const params = useParams();
    const accountId = params["accountId"] as string;

    const tc = useTranslations("Common");

    const trpc = useTRPC();
    const { data, isLoading } = useQuery(
        trpc.financialAccounts.get.queryOptions({
            id: accountId,
        })
    );
    useTitle(data ? data.name : tc("loading"));

    if (isLoading) {
        return (
            <PageContainer>
                <PageLoader />
            </PageContainer>
        );
    }

    if (!data) {
        notFound();
        return null;
    }

    return (
        <PageContainer>
            <FinancialAccountDetailHeader account={data} />

            {/* Transactions */}
            <TransactionsList accountId={accountId} mode="account" />
        </PageContainer>
    );
};

