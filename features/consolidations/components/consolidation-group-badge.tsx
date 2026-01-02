import { cn } from "@/lib/client-utils";
import { transactionConsolidationGroups } from "@/lib/constants";
import { useTranslations } from "next-intl";

export const ConsolidationGroupBadge = ({
  group,
}: {
  group: (typeof transactionConsolidationGroups)[number];
}) => {
  const t = useTranslations("FinancialAccounts");

  return (
    <div
      className={cn(
        "rounded-xl inline-flex px-2 py-0.5 items-center justify-center text-white text-xs font-bold",
        {
          "bg-sky-400": group === "budget",
          "bg-rose-400": group === "unclassified",
          "bg-emerald-400": group === "project",
          "bg-foreground text-background": group === "tax",
          "bg-fuchsia-400": group === "refund",
          "bg-lime-400": group === "refunded",
          "bg-amber-400 dark:bg-amber-600": group === "loan",
        }
      )}
    >
      {t(group)}
    </div>
  );
};
