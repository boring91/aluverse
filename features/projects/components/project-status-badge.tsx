import { cn } from "@/lib/client-utils";
import { getProjectStatus } from "@/lib/utils";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Props = {
  project: Pick<
    inferRouterOutputs<AppRouter>["projects"]["list"]["items"][number],
    "startDate" | "endDate" | "price" | "paid"
  >;
};

const STATUS_LABELS = {
  planning: "Planning",
  inProgress: "In progress",
  awaitingPayment: "Awaiting payment",
  completed: "Completed",
} as const;

const STATUS_STYLES = {
  planning: {
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
  inProgress: {
    badge: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  awaitingPayment: {
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  completed: {
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
} as const;

export const ProjectStatusBadge = ({ project }: Props) => {
  const status = getProjectStatus(project);
  const styles = STATUS_STYLES[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        styles.badge
      )}
    >
      <span className={cn("size-1.5 rounded-full", styles.dot)} />
      {STATUS_LABELS[status]}
    </div>
  );
};
