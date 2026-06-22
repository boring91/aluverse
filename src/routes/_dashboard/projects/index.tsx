import { createFileRoute } from "@tanstack/react-router";

import { ProjectsListView } from "@/features/projects/views/projects-list-view";

export const Route = createFileRoute("/_dashboard/projects/")({
  component: ProjectsListView,
});
