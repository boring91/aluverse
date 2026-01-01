"use client";

import { PageContainer } from "@/components/page-container";
import { useTitle } from "@/hooks/use-title";
import { useTranslations } from "next-intl";
import { TransactionsList } from "@/features/financial-accounts/components/transactions-list";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

export const ConsolidationsView = () => {
    const tc = useTranslations("Common");
    const t = useTranslations("FinancialAccounts");

    useTitle(tc("consolidations"));

    const trpc = useTRPC();
    const { data: statistics } = useQuery(
        trpc.consolidations.statistics.queryOptions()
    );

    return (
        <PageContainer>
            <h1 className="font-bold text-2xl">{tc("consolidations")}</h1>

            {!!statistics?.pendingConsolidationCount && (
                <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>{t("pendingConsolidations")}</AlertTitle>
                    <AlertDescription>
                        {t("youHaveCountPendingConsolidations", {
                            count: statistics.pendingConsolidationCount,
                        })}
                    </AlertDescription>
                </Alert>
            )}

            <TransactionsList mode="consolidation" />
        </PageContainer>
    );
};

