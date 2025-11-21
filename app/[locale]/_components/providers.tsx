"use client";

import { getDir } from "@/lib/utils";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useLocale } from "next-intl";

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const locale = useLocale();
    const dir = getDir(locale);

    return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
};
