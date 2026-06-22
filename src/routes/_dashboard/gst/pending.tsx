import { createFileRoute } from "@tanstack/react-router";

import { PendingGstView } from "@/features/gst/views/pending-gst-view";

export const Route = createFileRoute("/_dashboard/gst/pending")({
  component: PendingGstView,
});
