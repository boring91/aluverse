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
    RulerIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { notFound, useParams } from "next/navigation";
import { ProjectStatusBadge } from "../_components/project-status-badge";
import { CreateProject } from "../_components/create-project";
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
import { SuppliesList } from "./_components/supplies-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LaborsList } from "./_components/labors-list";
import { MiscList } from "./_components/misc-list";
import { PaymentsList } from "./_components/payments-list";
import { cn } from "@/lib/client-utils";
import { PageLoader } from "@/components/page-loader";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

const BasicInfo = ({ project }: { project: Project }) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {/* Visit date */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon size={16} />
                        {t("visitDate")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-lg font-semibold">
                    {project.visitDate?.toDateString() ?? "-"}
                </CardContent>
            </Card>

            {/* Start - End dates */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon size={16} />
                        {tc("dates")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-lg font-semibold">
                    {project.startDate?.toDateString()} &mdash;{" "}
                    {project.endDate?.toDateString()}
                </CardContent>
            </Card>

            {/* Meters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RulerIcon size={16} />
                        {t("meters")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-semibold">
                    {project.meters ? (
                        <span>
                            {project.meters.toFixed(2)}m<sup>2</sup>
                        </span>
                    ) : (
                        "-"
                    )}
                </CardContent>
            </Card>

            {/* Price */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSignIcon size={16} />
                        {t("price")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-lg font-semibold">
                    {formatCurrency(project.price)}
                </CardContent>
            </Card>
        </div>
    );
};

const AccountingInfo = ({ project }: { project: Project }) => {
    const t = useTranslations("Projects");

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {/* Amount paid */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        {t("paid")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold text-sky-500">
                    {formatCurrency(project.paid)}
                </CardContent>
            </Card>

            {/* Cost so far */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        {t("cost")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold text-rose-500">
                    {formatCurrency(project.cost)}
                </CardContent>
            </Card>

            {/* Remaining */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        {t("remaining")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold text-amber-500">
                    {formatCurrency(project.price - project.paid)}
                </CardContent>
            </Card>

            {/* Profit margin */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                        {t("profitMargin")}
                    </CardTitle>
                </CardHeader>
                <CardContent
                    className={cn("text-xl font-semibold text-emerald-500", {
                        "text-rose-500": project.price - project.cost < 0,
                    })}
                >
                    <div className="flex flex-col gap-2">
                        <p>
                            {(
                                ((project.price - project.cost) /
                                    project.price) *
                                100
                            ).toFixed(2)}
                            %
                        </p>
                        <p
                            className={cn(
                                "text-xs font-mono text-emerald-500",
                                {
                                    "text-rose-500":
                                        project.price - project.cost < 0,
                                }
                            )}
                        >
                            {formatCurrency(project.price - project.cost)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const ProjectDetails = ({ projectId }: { projectId: string }) => {
    const t = useTranslations("Projects");

    return (
        <Tabs defaultValue="supplies" className="mt-2 space-y-4">
            <TabsList>
                <TabsTrigger value="supplies">{t("supplies")}</TabsTrigger>
                <TabsTrigger value="labors">{t("labors")}</TabsTrigger>
                <TabsTrigger value="misc">{t("misc")}</TabsTrigger>
                <TabsTrigger value="payments">{t("payments")}</TabsTrigger>
            </TabsList>

            <TabsContent value="supplies" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("supplies")}</CardTitle>
                        <CardDescription>
                            {t("suppliesDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SuppliesList projectId={projectId} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="labors" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("labors")}</CardTitle>
                        <CardDescription>
                            {t("laborsDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LaborsList projectId={projectId} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="misc" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("misc")}</CardTitle>
                        <CardDescription>
                            {t("miscDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MiscList projectId={projectId} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("payments")}</CardTitle>
                        <CardDescription>
                            {t("paymentsDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PaymentsList projectId={projectId} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

const Page = () => {
    const params = useParams();
    const projectId = params["projectId"] as string;

    const tc = useTranslations("Common");
    const t = useTranslations("Projects");

    const trpc = useTRPC();
    const { data, isLoading } = useQuery(
        trpc.projects.get.queryOptions({
            id: projectId,
        })
    );

    useTitle(data ? `${data.humanId} - ${data.title}` : tc("loading"));

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
                <CreateProject
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
                                <Link href="/projects">
                                    <ArrowLeft className="rtl:-scale-x-100" />
                                </Link>
                            </Button>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-semibold leading-tight">
                                        {data.title}
                                    </h1>
                                    <span className="rounded-full bg-foreground px-3 py-1 text-xs font-mono font-medium text-background">
                                        {data.humanId}
                                    </span>
                                    <ProjectStatusBadge project={data} />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {data.client} &mdash; {data.address}
                                </p>
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
                                {t("basicInformation")}
                            </h2>
                            <BasicInfo project={data} />
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                {t("financialSummary")}
                            </h2>
                            <AccountingInfo project={data} />
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                {tc("details")}
                            </h2>
                            <ProjectDetails projectId={projectId} />
                        </section>
                    </div>
                </div>
            </PageContainer>
        </>
    );
};

export default Page;
