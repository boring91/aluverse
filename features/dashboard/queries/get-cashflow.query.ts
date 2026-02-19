import { db } from "@/db";
import {
  getMonth,
  getYear,
} from "@/shared/expressions/generic/date.expression";
import { getCurrentTime } from "@/lib/utils";

export async function getCashFlowQuery() {
  const now = getCurrentTime();
  const oneYearAgo = new Date(now.setMonth(now.getMonth() - 12));

  return await db
    .selectFrom("transactions")
    .where("date", ">=", oneYearAgo)
    .groupBy((eb) => [getYear(eb.ref("date")), getMonth(eb.ref("date"))])
    .select((eb) => [
      eb.fn
        .sum<number>(
          eb
            .case()
            .when("amount", ">", eb.lit(0))
            .then(eb.ref("amount"))
            .else(eb.lit(0))
            .end()
        )
        .as("income"),
      eb.fn
        .sum<number>(
          eb
            .case()
            .when("amount", "<", eb.lit(0))
            .then(eb.ref("amount"))
            .else(eb.lit(0))
            .end()
        )
        .as("expense"),
      getMonth(eb.ref("date")).as("month"),
      getYear(eb.ref("date")).as("year"),
    ])
    .orderBy((eb) => getYear(eb.ref("date")), "asc")
    .orderBy((eb) => getMonth(eb.ref("date")), "asc")
    .execute();
}
