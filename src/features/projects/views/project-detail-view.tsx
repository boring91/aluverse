"use client";

import { useParams } from "@tanstack/react-router";
import { PageContainer } from "@/components/page-container";
import { NotFound } from "@/components/NotFound";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { CreateProject } from "@/features/projects/components/create-project";
import { useState } from "react";
import { PageLoader } from "@/components/page-loader";
import { ProjectDetailHeader } from "@/features/projects/components/project-detail-header";
import { ProjectBasicInfo } from "@/features/projects/components/project-basic-info";
import { ProjectAccountingInfo } from "@/features/projects/components/project-accounting-info";
import { ProjectDetailsTabs } from "@/features/projects/components/project-details-tabs";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";

export const ProjectDetailView = () => {
  const params = useParams({ strict: false });
  const projectId = params["projectId"] as string;
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("projects.read");
  const canUpdate = hasPermission("projects.update");

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.projects.get.queryOptions(
      {
        id: projectId,
      },
      {
        enabled: canRead,
      },
    ),
  );

  useTitle(data ? `${data.humanId} - ${data.title}` : "Loading");

  const [openCreateSheet, setOpenCreateSheet] = useState(false);

  if (isPending || isLoading) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canRead) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to projects.
        </p>
      </PageContainer>
    );
  }

  if (!data) {
    return <NotFound />;
  }

  return (
    <>
      {canUpdate ? (
        <CreateProject
          open={canUpdate && openCreateSheet}
          onOpenChange={setOpenCreateSheet}
          itemId={data.id}
        />
      ) : null}
      <PageContainer>
        <div className="flex flex-col gap-6">
          <ProjectDetailHeader
            project={data}
            onEditClick={() => setOpenCreateSheet(true)}
            canEdit={canUpdate}
          />

          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Basic Information
              </h2>
              <ProjectBasicInfo project={data} />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Financial Summary
              </h2>
              <ProjectAccountingInfo project={data} />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Details
              </h2>
              <ProjectDetailsTabs projectId={projectId} />
            </section>
          </div>
        </div>
      </PageContainer>
    </>
  );
};
