"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { PayoffsList } from "@/features/loans/components/payoffs-list";

export const LoanDetailsCard = ({ loanId }: { loanId: string }) => {
    const t = useTranslations("Loans");

    return (
        <Card className="mt-2">
            <CardHeader>
                <CardTitle>{t("payoffs")}</CardTitle>
                <CardDescription>
                    {t("payoffsDescription")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PayoffsList loanId={loanId} />
            </CardContent>
        </Card>
    );
};

