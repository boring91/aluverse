import { cn } from "@/lib/client-utils";
import { transactionReconciliationGroups } from "@/lib/constants";

const GROUP_LABELS: Record<
  (typeof transactionReconciliationGroups)[number],
  string
> = {
  budget: "Budget",
  project: "Project",
  loan: "Loan",
  gst_payable: "GST Payable",
  tax: "Tax",
  refund: "Refund",
  refunded: "Refunded",
  unclassified: "Unclassified",
};

export const ReconciliationGroupBadge = ({
  group,
}: {
  group: (typeof transactionReconciliationGroups)[number];
}) => {
  return (
    <div
      className={cn(
        "rounded-xl inline-flex px-2 py-0.5 items-center justify-center text-white text-xs font-bold",
        {
          "bg-sky-400": group === "budget",
          "bg-rose-400": group === "unclassified",
          "bg-emerald-400": group === "project",
          "bg-cyan-500": group === "gst_payable",
          "bg-foreground text-background": group === "tax",
          "bg-fuchsia-400": group === "refund",
          "bg-lime-400": group === "refunded",
          "bg-amber-400 dark:bg-amber-600": group === "loan",
        }
      )}
    >
      {GROUP_LABELS[group]}
    </div>
  );
};
