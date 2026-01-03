import { db } from "@/db";
import { getMonth, getYear } from "@/db/expressions/generic";
import { getCurrentTime } from "@/lib/utils";

export async function getCashFlow() {
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
            .case("type")
            .when("income")
            .then(eb.ref("amount"))
            .else(eb.lit(0))
            .end()
        )
        .as("income"),
      eb(
        eb.fn.sum<number>(
          eb
            .case("type")
            .when("expense")
            .then(eb.ref("amount"))
            .else(eb.lit(0))
            .end()
        ),
        "*",
        eb.lit(-1)
      ).as("expense"),
      getMonth(eb.ref("date")).as("month"),
      getYear(eb.ref("date")).as("year"),
    ])
    .orderBy((eb) => getYear(eb.ref("date")), "asc")
    .orderBy((eb) => getMonth(eb.ref("date")), "asc")
    .execute();
}
