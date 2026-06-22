import { db } from "@/db";
import { GST_RATE } from "@/lib/constants";
import {
  reconciliationCost,
  reconciliationRevenue,
} from "@/shared/expressions/reconciliations/reconciliation.expression";
import type { PendingGstInput } from "../schemas/gst.shared-schema";

const DAY_MS = 24 * 60 * 60 * 1000;

function extractGst(inclusiveAmount: number) {
  return (inclusiveAmount * GST_RATE) / (1 + GST_RATE);
}

const startOfDay = (date: Date) =>
  new Date(Math.floor(date.getTime() / DAY_MS) * DAY_MS);

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / DAY_MS);

async function listReconciledGstPaymentsQuery(from: Date, to: Date) {
  return await db
    .selectFrom("gstPayments")
    .where("reconciliationId", "is not", null)
    .where("periodFrom", "<", to)
    .where("periodTo", ">", from)
    .select(["amount", "periodFrom", "periodTo"])
    .execute();
}

function calculateRemittedAmount(
  payments: Awaited<ReturnType<typeof listReconciledGstPaymentsQuery>>,
  from: Date,
  to: Date,
) {
  let remitted = 0;

  for (const payment of payments) {
    const periodFrom = startOfDay(payment.periodFrom);
    const periodTo = startOfDay(payment.periodTo);

    if (periodFrom >= periodTo) {
      continue;
    }

    const overlapFrom = periodFrom > from ? periodFrom : from;
    const overlapTo = periodTo < to ? periodTo : to;

    if (overlapFrom >= overlapTo) {
      continue;
    }

    // Pro-rate the payment by the overlap between its assigned BAS period
    // and the range requested by the pending GST query.
    const overlapRatio =
      daysBetween(overlapFrom, overlapTo) / daysBetween(periodFrom, periodTo);

    remitted += overlapRatio * payment.amount;
  }

  return Math.round(remitted);
}

export async function getPendingGstQuery(input: PendingGstInput) {
  const from = startOfDay(input.from);
  const to = startOfDay(input.to);

  if (from >= to) {
    return {
      gstCollected: 0,
      gstCredits: 0,
      netGst: 0,
      gstRemitted: 0,
      pendingGst: 0,
    };
  }

  const baseQuery = db
    .selectFrom("reconciliations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId",
    )
    .where("date", ">=", from)
    .where("date", "<", to);

  const [gstCollectedTotal, gstCreditsTotal, gstPayments] = await Promise.all([
    baseQuery
      .where("isGst", "=", true)
      .where(reconciliationRevenue)
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
      .then((result) => result.total),
    baseQuery
      .where("isGst", "=", true)
      .where(reconciliationCost)
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
      .then((result) => result.total),
    listReconciledGstPaymentsQuery(from, to),
  ]);

  const gstCollected = extractGst(gstCollectedTotal);
  const gstCredits = extractGst(gstCreditsTotal);
  const gstRemitted = calculateRemittedAmount(gstPayments, from, to);

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
