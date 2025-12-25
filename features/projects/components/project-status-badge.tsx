import { cn } from "@/lib/client-utils";
import { getProjectStatus } from "@/lib/utils";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";

type Props = {
    project: Pick<
        inferRouterOutputs<AppRouter>["projects"]["list"]["items"][number],
        "startDate" | "endDate" | "price" | "paid"
    >;
};

export const ProjectStatusBadge = ({ project }: Props) => {
    const t = useTranslations("Projects");

    return (
        <div
            className={cn(
                "rounded-xl inline-flex px-4 py-1 items-center justify-center text-white text-xs font-bold",
                {
                    "bg-sky-400": getProjectStatus(project) === "planning",
                    "bg-amber-400": getProjectStatus(project) === "inProgress",
                    "bg-rose-400":
                        getProjectStatus(project) === "awaitingPayment",
                    "bg-emerald-400": getProjectStatus(project) === "completed",
                }
            )}
        >
            {t(getProjectStatus(project))}
        </div>
    );
};
