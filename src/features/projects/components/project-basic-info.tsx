"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CalendarIcon, DollarSignIcon, RulerIcon } from "lucide-react";
import type { AppRouter } from "@/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

export const ProjectBasicInfo = ({ project }: { project: Project }) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* Visit date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon size={16} />
            Visit date
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
            Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-lg font-semibold">
          {project.startDate && (
            <p>
              {`${project.startDate?.toDateString()} - ${project.endDate?.toDateString() ?? "N/A"}`}
            </p>
          )}
          {!project.startDate && <p>Not started yet</p>}
        </CardContent>
      </Card>

      {/* Meters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <RulerIcon size={16} />
            Meters
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

      {/* Price & margin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSignIcon size={16} />
            Price & margin
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-lg font-semibold flex flex-col gap-2">
          <p>
            {formatCurrency(project.price)} ({(project.margin * 100).toFixed(2)}
            %)
          </p>
          <p className="text-sm">
            {formatCurrency(project.priceExcGst)} (exc. GST)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
