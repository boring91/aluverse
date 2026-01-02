"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { LaborsList } from "@/features/projects/components/labors-list";
import { MiscList } from "@/features/projects/components/misc-list";
import { PaymentsList } from "@/features/projects/components/payments-list";
import { SuppliesList } from "@/features/projects/components/supplies-list";

export const ProjectDetailsTabs = ({ projectId }: { projectId: string }) => {
  const t = useTranslations("Projects");

  return (
    <Tabs defaultValue="supplies" className="mt-2 space-y-4">
      <TabsList>
        <TabsTrigger value="supplies">{t("supplies")}</TabsTrigger>
        <TabsTrigger value="labors">{t("labors")}</TabsTrigger>
        <TabsTrigger value="misc">{t("misc")}</TabsTrigger>
        <TabsTrigger value="payments">{t("payments")}</TabsTrigger>
      </TabsList>

      <TabsContent value="supplies" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("supplies")}</CardTitle>
            <CardDescription>{t("suppliesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SuppliesList projectId={projectId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="labors" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("labors")}</CardTitle>
            <CardDescription>{t("laborsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LaborsList projectId={projectId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="misc" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("misc")}</CardTitle>
            <CardDescription>{t("miscDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MiscList projectId={projectId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("payments")}</CardTitle>
            <CardDescription>{t("paymentsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentsList projectId={projectId} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
