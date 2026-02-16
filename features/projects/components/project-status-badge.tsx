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

export const ProjectStatusBadge = ({ project }: Props) => {
  const status = getProjectStatus(project);

  return (
    <div
      className={cn(
        "rounded-xl inline-flex px-4 py-1 items-center justify-center text-white text-xs font-bold",
        {
          "bg-sky-400": status === "planning",
          "bg-amber-400": status === "inProgress",
          "bg-rose-400": status === "awaitingPayment",
          "bg-emerald-400": status === "completed",
        }
      )}
    >
      {STATUS_LABELS[status]}
    </div>
  );
};
