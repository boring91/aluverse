"use client";

import { useTitle } from "@/hooks/use-title";
import { useTranslations } from "next-intl";

const Page = () => {
    const t = useTranslations("Common");

    useTitle(t("dashboard"));

    return <p>Hey</p>;
};

export default Page;
