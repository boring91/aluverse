"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Loan = inferRouterOutputs<AppRouter>["loans"]["get"];

export const LoanBasicInfo = ({ loan }: { loan: Loan }) => {
    const t = useTranslations("Loans");
    const tc = useTranslations("Common");

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Type */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        {t("type")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge variant={loan.type === "lent" ? "default" : "secondary"}>
                        {t(loan.type)}
                    </Badge>
                </CardContent>
            </Card>

            {/* Date */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon size={16} />
                        {tc("date")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-lg font-semibold">
                    {loan.date.toDateString()}
                </CardContent>
            </Card>

            {/* Due Date */}
            {loan.dueDate && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon size={16} />
                            {t("dueDate")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="font-mono text-lg font-semibold">
                        {loan.dueDate.toDateString()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

