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
    Loader2Icon,
    RulerIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { notFound, useParams } from "next/navigation";
import { ProjectStatusBadge } from "../_components/project-status-badge";
import { CreateProject } from "../_components/create-project";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { formatCurrency } from "@/lib/utils";
import { SuppliesList } from "./_components/supplies-list";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

const BasicInfo = ({ project }: { project: Project }) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Visit date */}
            <Card className="bg-background gap-1">
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <CalendarIcon size={16} />
                        {t("visitDate")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-bold">
                    {project.visitDate?.toDateString() ?? "-"}
                </CardContent>
            </Card>

            {/* Start - End dates */}
            <Card className="bg-background gap-1">
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <CalendarIcon size={16} />
                        {tc("dates")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-bold">
                    {project.startDate?.toDateString()} &mdash;{" "}
                    {project.endDate?.toDateString()}
                </CardContent>
            </Card>

            {/* Meters */}
            <Card className="bg-background gap-1">
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <RulerIcon size={16} />
                        {t("meters")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-bold">
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
            <Card className="bg-background gap-1">
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <DollarSignIcon size={16} />
                        {t("price")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-bold font-mono">
                    {formatCurrency(project.price)}
                </CardContent>
            </Card>
        </div>
    );
};

const AccountingInfo = ({ project }: { project: Project }) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Amount paid */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        {t("paid")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xl text-sky-500 font-bold font-mono">
                    {formatCurrency(project.paid)}
                </CardContent>
            </Card>

            {/* Cost so far */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        {t("cost")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xl text-rose-500 font-bold font-mono">
                    {formatCurrency(project.cost)}
                </CardContent>
            </Card>

            {/* Remaining */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        {t("remaining")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xl text-amber-500 font-bold font-mono">
                    {formatCurrency(project.price - project.paid)}
                </CardContent>
            </Card>

            {/* Profit margin */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        {t("profitMargin")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xl text-emerald-500 font-bold">
                    <div className="flex flex-col gap-2">
                        <p>
                            {Math.round(
                                ((project.price - project.cost) /
                                    project.price) *
                                    100
                            ).toFixed(2)}
                            %
                        </p>
                        <p className="text-xs text-emerald-500 font-mono">
                            {formatCurrency(project.price - project.cost)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const Page = () => {
    const params = useParams();
    const projectId = params["projectId"] as string;

    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

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
                <Loader2Icon className="animate-spin" />
            </PageContainer>
        );
    }

    if (!data) {
        notFound();
        return null;
    }

    return (
        <>
            <CreateProject
                open={openCreateSheet}
                onOpenChange={setOpenCreateSheet}
                itemId={openCreateSheet ? data.id : undefined}
            />
            <PageContainer>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/projects">
                            <ArrowLeft className="rtl:-scale-x-100" />
                        </Link>
                    </Button>
                    <div className="grow flex flex-col gap-2">
                        <div className="flex items-center gap-4 font-bold ">
                            <h1 className="text-2xl">{data.title}</h1>
                            <span className="font-mono align-middle bg-foreground text-background rounded-xl px-4 text-sm">
                                {data.humanId}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                {data.client} &mdash; {data.address}
                            </span>

                            <ProjectStatusBadge project={data} />
                        </div>
                    </div>

                    <Button onClick={() => setOpenCreateSheet(true)}>
                        <Edit3Icon />
                        {tc("edit")}
                    </Button>
                </div>

                <BasicInfo project={data} />

                <AccountingInfo project={data} />

                <SuppliesList projectId={data.id} />
            </PageContainer>
        </>
    );
};

export default Page;
