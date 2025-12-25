"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useTitle } from "@/hooks/use-title";
import { useTranslations } from "next-intl";
import { TransactionsList } from "@/features/financial-accounts/components/transactions-list";
import { formatCurrency } from "@/lib/utils";
import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";

const Page = () => {
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
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/financial-accounts">
                        <ArrowLeft className="rtl:-scale-x-100" />
                    </Link>
                </Button>
                <div className="font-bold grow flex flex-col gap-1">
                    <h1 className="text-2xl">{data.name}</h1>
                    <span className="font-mono text-muted-foreground">
                        {formatCurrency(data.balance)}
                    </span>
                </div>
            </div>

            {/* Transactions */}
            <TransactionsList accountId={accountId} mode="account" />
        </PageContainer>
    );
};

export default Page;
