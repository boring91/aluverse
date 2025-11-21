import { useEffect } from "react";
import { useTranslations } from "next-intl";

export const useTitle = (title: string) => {
    const t = useTranslations("Common");

    useEffect(() => {
        document.title = title + " - " + t("appName");
    }, [title, t]);
};
