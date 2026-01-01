"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/client-utils";
import { useTranslations } from "next-intl";
import { DollarSignIcon } from "lucide-react";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Loan = inferRouterOutputs<AppRouter>["loans"]["get"];

export const LoanFinancialInfo = ({ loan }: { loan: Loan }) => {
    const t = useTranslations("Loans");

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Principal Amount */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSignIcon size={16} />
                        {t("principal")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold">
                    {formatCurrency(loan.amount)}
                </CardContent>
            </Card>

            {/* Paid */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        {t("paid")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold text-sky-500">
                    {formatCurrency(loan.paid)}
                </CardContent>
            </Card>

            {/* Remaining */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        {t("remaining")}
                    </CardTitle>
                </CardHeader>
                <CardContent
                    className={cn("font-mono text-xl font-semibold", {
                        "text-emerald-500": loan.remaining > 0,
                        "text-rose-500": loan.remaining < 0,
                        "text-muted-foreground": loan.remaining === 0,
                    })}
                >
                    {formatCurrency(loan.remaining)}
                </CardContent>
            </Card>
        </div>
    );
};

