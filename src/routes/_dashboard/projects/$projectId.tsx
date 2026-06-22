import { createFileRoute } from "@tanstack/react-router";

import { ProjectDetailView } from "@/features/projects/views/project-detail-view";

export const Route = createFileRoute("/_dashboard/projects/$projectId")({
  component: ProjectDetailView,
});
