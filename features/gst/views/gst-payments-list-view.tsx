"use client";

import { PageContainer } from "@/components/page-container";
import { GstPaymentsList } from "@/features/gst/components/gst-payments-list";
import { useTitle } from "@/hooks/use-title";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const GstPaymentsListView = () => {
  useTitle("GST Payments");
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("gst.read");

  if (isPending) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canRead) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to GST payments.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">GST Payments</h1>
      </div>

      <GstPaymentsList />
    </PageContainer>
  );
};
