import { db } from "@/db";
import { GST_RATE } from "@/lib/constants";
import {
  reconciliationCost,
  reconciliationRevenue,
} from "@/shared/expressions/reconciliations/reconciliation.expression";
import { PendingGstInput } from "../schemas/gst.shared-schema";

function extractGst(inclusiveAmount: number) {
  return (inclusiveAmount * GST_RATE) / (1 + GST_RATE);
}

export async function getPendingGstQuery(input: PendingGstInput) {
  const { from, to } = input;

  const baseQuery = db
    .selectFrom("reconciliations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId"
    )
    .where("date", ">=", from)
    .where("date", "<", to);

  const gstCollected = extractGst(
    (
      await baseQuery
        .where("isGst", "=", true)
        .where(reconciliationRevenue)
        .select((eb) => [
          eb.fn
            .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
            .as("total"),
        ])
        .executeTakeFirstOrThrow()
    ).total
  );

  const gstCredits = extractGst(
    (
      await baseQuery
        .where("isGst", "=", true)
        .where(reconciliationCost)
        .select((eb) => [
          eb.fn
            .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
            .as("total"),
        ])
        .executeTakeFirstOrThrow()
    ).total
  );

  const gstRemitted = (
    await baseQuery
      .where("reconciliationGroup", "=", "tax")
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
  ).total;

  const netGst = gstCollected + gstCredits;
  const pendingGst = netGst + gstRemitted;

  return {
    gstCollected,
    gstCredits,
    netGst,
    gstRemitted,
    pendingGst,
  };
}
