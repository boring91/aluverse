"use client";

import { useTitle } from "@/hooks/use-title";
import { useTranslations } from "next-intl";

export const DashboardView = () => {
  const t = useTranslations("Common");

  useTitle(t("dashboard"));

  return <p>Hey</p>;
};
