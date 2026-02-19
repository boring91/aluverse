import { db } from "@/db";
import { isProjectWithinRange } from "@/db/expressions";
import {
  paymentStatusSummaryMapper,
  projectPaymentStatusRowMapper,
} from "@/shared/mappers/dashboard/payment-status.mapper";

export async function getPaymentStatusQuery(from?: Date, to?: Date) {
  const query = db
    .selectFrom("projects")
    .leftJoin("projectPayments", "projectId", "projects.id")
    .where((eb) =>
      eb.and([
        isProjectWithinRange(eb, from, to),
        eb("endDate", "is not", null),
      ])
    )
    .groupBy(["projects.id"])
    .select(projectPaymentStatusRowMapper)
    .as("tmp");

  return await db
    .selectFrom(query)
    .select(paymentStatusSummaryMapper())
    .executeTakeFirstOrThrow();
}
