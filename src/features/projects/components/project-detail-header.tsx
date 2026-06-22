"use client";

import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";

import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge";
import type { AppRouter } from "@/trpc/router";
import { ArrowLeft, Edit3Icon } from "lucide-react";

type Project = inferRouterOutputs<AppRouter>["projects"]["get"];

export const ProjectDetailHeader = ({
  project,
  onEditClick,
  canEdit,
}: {
  project: Project;
  onEditClick: () => void;
  canEdit: boolean;
}) => {
  return (
    <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/projects">
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

      {canEdit ? (
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onEditClick}>
            <Edit3Icon className="mr-2 size-4" />
            Edit
          </Button>
        </div>
      ) : null}
    </div>
  );
};
