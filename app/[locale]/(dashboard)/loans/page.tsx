"use client";

import { PageContainer } from "@/components/page-container";
import { LoansList } from "@/features/loans/components/loans-list";
import { useTranslations } from "next-intl";
import { useTitle } from "@/hooks/use-title";

const Page = () => {
    const tc = useTranslations("Common");

    useTitle(tc("loans"));

    return (
        <PageContainer>
            <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl">{tc("loans")}</h1>
            </div>

            <LoansList />
        </PageContainer>
    );
};

export default Page;

