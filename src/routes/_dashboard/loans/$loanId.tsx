import { createFileRoute } from "@tanstack/react-router";

import { LoanDetailView } from "@/features/loans/views/loan-detail-view";

export const Route = createFileRoute("/_dashboard/loans/$loanId")({
  component: LoanDetailView,
});
