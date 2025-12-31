import { type AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { Locale } from "next-intl";

export const getDir = (locale: Locale) => {
    return locale === "ar" ? "rtl" : "ltr";
};

export const isPromise = (obj: unknown): obj is Promise<unknown> =>
    !!obj &&
    typeof (obj as Record<string, unknown>).then === "function" &&
    typeof (obj as Record<string, unknown>).catch === "function";

export const formatCurrency = (amountInCents: number): string => {
    const absAmount = Math.abs(amountInCents) / 100;
    const parts = new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(absAmount);

    if (amountInCents < 0) {
        return `$ (${parts})`;
    }
    return `$ ${parts}`;
};

export const getProjectStatus = (
    project: Pick<
        inferRouterOutputs<AppRouter>["projects"]["list"]["items"][number],
        "startDate" | "endDate" | "price" | "paid"
    >
) => {
    if (!project.startDate) return "planning";
    if (!project.endDate) return "inProgress";
    if (project.paid < project.price) return "awaitingPayment";
    return "completed";
};

export const getCurrentTime = () => new Date();
