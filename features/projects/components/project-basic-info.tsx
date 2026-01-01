"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { CalendarIcon, DollarSignIcon, RulerIcon } from "lucide-react";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

export const ProjectBasicInfo = ({ project }: { project: Project }) => {
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
