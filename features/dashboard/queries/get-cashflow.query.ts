import { db } from "@/db";
import { getMonth, getYear } from "@/db/expressions/generic";
import { getCurrentTime } from "@/lib/utils";
import { cashFlowMapper } from "@/shared/mappers/dashboard/cash-flow.mapper";

export async function getCashFlowQuery() {
  const now = getCurrentTime();
  const oneYearAgo = new Date(now.setMonth(now.getMonth() - 12));

  return await db
    .selectFrom("transactions")
    .where("date", ">=", oneYearAgo)
    .groupBy((eb) => [getYear(eb.ref("date")), getMonth(eb.ref("date"))])
    .select(cashFlowMapper)
    .orderBy((eb) => getYear(eb.ref("date")), "asc")
    .orderBy((eb) => getMonth(eb.ref("date")), "asc")
    .execute();
}
