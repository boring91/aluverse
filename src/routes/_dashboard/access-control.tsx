import { createFileRoute } from "@tanstack/react-router";

import { AccessControlView } from "@/features/rbac/views/access-control-view";

export const Route = createFileRoute("/_dashboard/access-control")({
  component: AccessControlView,
});
