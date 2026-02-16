"use client";

import { PageContainer } from "@/components/page-container";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import { CreateProject } from "@/features/projects/components/create-project";
import { useState } from "react";
import { PageLoader } from "@/components/page-loader";
import { ProjectDetailHeader } from "@/features/projects/components/project-detail-header";
import { ProjectBasicInfo } from "@/features/projects/components/project-basic-info";
import { ProjectAccountingInfo } from "@/features/projects/components/project-accounting-info";
import { ProjectDetailsTabs } from "@/features/projects/components/project-details-tabs";

export const ProjectDetailView = () => {
  const params = useParams();
  const projectId = params["projectId"] as string;

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.projects.get.queryOptions({
      id: projectId,
    })
  );

  useTitle(data ? `${data.humanId} - ${data.title}` : "Loading");

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
          <ProjectDetailHeader
            project={data}
            onEditClick={() => setOpenCreateSheet(true)}
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
