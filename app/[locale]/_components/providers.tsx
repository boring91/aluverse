"use client";

import { ConfirmDialogProvider } from "@/lib/confirm-context";
import { getDir } from "@/lib/utils";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useLocale } from "next-intl";

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const locale = useLocale();
    const dir = getDir(locale);

    return (
        <DirectionProvider dir={dir}>
            <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </DirectionProvider>
    );
};
