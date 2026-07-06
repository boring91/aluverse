import { PageContainer } from "@/components/page-container";
import { ProjectsList } from "@/features/projects/components/projects-list";
import { useTitle } from "@/hooks/use-title";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const ProjectsListView = () => {
  useTitle("Projects");
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("projects.read");

  if (isPending) {
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

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Projects</h1>
      </div>

      <ProjectsList />
    </PageContainer>
  );
};
