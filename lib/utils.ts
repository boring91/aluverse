import { clsx, type ClassValue } from "clsx";
import { Locale } from "next-intl";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs));
};

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
