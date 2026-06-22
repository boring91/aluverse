import { createFileRoute } from "@tanstack/react-router";

import { GstPaymentsListView } from "@/features/gst/views/gst-payments-list-view";

export const Route = createFileRoute("/_dashboard/gst/payments")({
  component: GstPaymentsListView,
});
