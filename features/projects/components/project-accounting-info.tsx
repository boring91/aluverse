"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/client-utils";
import { useTranslations } from "next-intl";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

export const ProjectAccountingInfo = ({ project }: { project: Project }) => {
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
              {(((project.price - project.cost) / project.price) * 100).toFixed(
                2
              )}
              %
            </p>
            <p
              className={cn("text-xs font-mono text-emerald-500", {
                "text-rose-500": project.price - project.cost < 0,
              })}
            >
              {formatCurrency(project.price - project.cost)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
