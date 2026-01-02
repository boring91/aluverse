"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Edit3Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

export const ProjectDetailHeader = ({
  project,
  onEditClick,
}: {
  project: Project;
  onEditClick: () => void;
}) => {
  const tc = useTranslations("Common");

  return (
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
              {project.title}
            </h1>
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-mono font-medium text-background">
              {project.humanId}
            </span>
            <ProjectStatusBadge project={project} />
          </div>
          <p className="text-sm text-muted-foreground">
            {project.client} &mdash; {project.address}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onEditClick}>
          <Edit3Icon className="mr-2 size-4" />
          {tc("edit")}
        </Button>
      </div>
    </div>
  );
};
