import { db } from "@/db";
import {
  consolidationCost,
  consolidationRevenue,
} from "@/db/expressions/consolidations.expression";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { generalStatsTotalMapper } from "@/shared/mappers/dashboard/general-stats.mapper";

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
      .select(generalStatsTotalMapper)
      .executeTakeFirstOrThrow()
  ).total;

  const cost = (
    await query
      .where(consolidationCost)
      .select(generalStatsTotalMapper)
      .executeTakeFirstOrThrow()
  ).total;

  const taxes = (
    await query
      .where("consolidationGroup", "=", "tax")
      .select(generalStatsTotalMapper)
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
