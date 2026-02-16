"use client";

import { PageContainer } from "@/components/page-container";
import { ProjectsList } from "@/features/projects/components/projects-list";
import { useTitle } from "@/hooks/use-title";

export const ProjectsListView = () => {
  useTitle("Projects");

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Projects</h1>
      </div>

      <ProjectsList />
    </PageContainer>
  );
};
