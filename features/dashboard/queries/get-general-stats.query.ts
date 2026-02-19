import { db } from "@/db";
import {
  consolidationCost,
  consolidationRevenue,
} from "@/shared/expressions/consolidations/consolidation.expression";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";

export async function getGeneralStatsQuery(input: DashboardDateRange) {
  const { from, to } = input;

  let query = db
    .selectFrom("consolidations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "consolidations.transactionId"
    );

  if (from) {
    query = query.where("date", ">=", from);
  }

  if (to) {
    query = query.where("date", "<", to);
  }

  const revenue = (
    await query
      .where(consolidationRevenue)
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("consolidations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
  ).total;

  const cost = (
    await query
      .where(consolidationCost)
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("consolidations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
  ).total;

  const taxes = (
    await query
      .where("consolidationGroup", "=", "tax")
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("consolidations.amount"), eb.lit(0))
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
