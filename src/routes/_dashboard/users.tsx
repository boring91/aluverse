import { createFileRoute } from "@tanstack/react-router";

import { UsersListView } from "@/features/users/views/users-list-view";

export const Route = createFileRoute("/_dashboard/users")({
  component: UsersListView,
});
