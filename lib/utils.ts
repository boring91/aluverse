import { clsx, type ClassValue } from "clsx";
import { Locale } from "next-intl";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
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

export const fillForm = <T extends FieldValues>(
    form: UseFormReturn<T>,
    data: T
) => {
    const values = form.getValues();
    Object.keys(values).forEach(tmp => {
        const key = tmp as Path<T>;
        form.setValue(key, data[key]);
    });
};
