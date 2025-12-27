"use client";

import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { Link } from "@/i18n/navigation";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    CalendarIcon,
    DollarSignIcon,
    Edit3Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { notFound, useParams } from "next/navigation";
import { CreateLoan } from "@/features/loans/components/create-loan";
import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { formatCurrency } from "@/lib/utils";
import { PageLoader } from "@/components/page-loader";
import { PayoffsList } from "@/features/loans/components/payoffs-list";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/client-utils";

type Loan = inferRouterOutputs<AppRouter>["loans"]["get"];

const BasicInfo = ({ loan }: { loan: Loan }) => {
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

const FinancialInfo = ({ loan }: { loan: Loan }) => {
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

const LoanDetails = ({ loanId }: { loanId: string }) => {
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

const Page = () => {
    const params = useParams();
    const loanId = params["loanId"] as string;

    const tc = useTranslations("Common");
    const t = useTranslations("Loans");

    const trpc = useTRPC();
    const { data, isLoading } = useQuery(
        trpc.loans.get.queryOptions({
            id: loanId,
        })
    );

    useTitle(data ? `${data.partyName} - ${t(data.type)}` : tc("loading"));

    const [openCreateSheet, setOpenCreateSheet] = useState(false);

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
        <>
            {openCreateSheet && (
                <CreateLoan
                    open={openCreateSheet}
                    onOpenChange={setOpenCreateSheet}
                    itemId={data.id}
                />
            )}
            <PageContainer>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <Button variant="outline" size="icon" asChild>
                                <Link href="/loans">
                                    <ArrowLeft className="rtl:-scale-x-100" />
                                </Link>
                            </Button>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-semibold leading-tight">
                                        {data.partyName}
                                    </h1>
                                    <Badge variant={data.type === "lent" ? "default" : "secondary"}>
                                        {t(data.type)}
                                    </Badge>
                                </div>
                                {data.notes && (
                                    <p className="text-sm text-muted-foreground">
                                        {data.notes}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setOpenCreateSheet(true)}
                            >
                                <Edit3Icon className="mr-2 size-4" />
                                {tc("edit")}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="space-y-3">
                            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                {tc("details")}
                            </h2>
                            <BasicInfo loan={data} />
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                {t("financialSummary")}
                            </h2>
                            <FinancialInfo loan={data} />
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                {t("payoffs")}
                            </h2>
                            <LoanDetails loanId={loanId} />
                        </section>
                    </div>
                </div>
            </PageContainer>
        </>
    );
};

export default Page;

