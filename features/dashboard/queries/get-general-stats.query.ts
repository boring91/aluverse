import { db } from "@/db";
import {
  reconciliationCost,
  reconciliationRevenue,
} from "@/shared/expressions/reconciliations/reconciliation.expression";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";

export async function getGeneralStatsQuery(input: DashboardDateRange) {
  const { from, to } = input;

  let query = db
    .selectFrom("reconciliations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId"
    );

  if (from) {
    query = query.where("date", ">=", from);
  }

  if (to) {
    query = query.where("date", "<", to);
  }

  const revenue = (
    await query
      .where(reconciliationRevenue)
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
  ).total;

  const cost = (
    await query
      .where(reconciliationCost)
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
  ).total;

  const taxes = (
    await query
      .where("reconciliationGroup", "=", "tax")
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
  ).total;

  return {
    revenue,
    cost,
    operatingProfit: revenue + cost,
    taxes,
    netProfit: revenue + cost + taxes,
  };
}
