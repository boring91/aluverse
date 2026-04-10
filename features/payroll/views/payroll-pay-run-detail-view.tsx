"use client";

import { PageContainer } from "@/components/page-container";
import { useTitle } from "@/hooks/use-title";
import { useParams } from "next/navigation";

export function PayrollPayRunDetailView() {
  const params = useParams<{ id: string }>();

  useTitle("Payroll Pay Run Detail");

  return (
    <PageContainer>
      <h1 className="font-bold text-2xl">Pay run {params.id}</h1>
      <p className="text-muted-foreground">
        Detailed review lands in step 6. This placeholder keeps the step 5
        review action wired without a broken route.
      </p>
    </PageContainer>
  );
}
