import { db } from "@/db";

export async function getProjectPipelineQuery() {
  const stats = await db
    .selectFrom("projects")
    .select((eb) => [
      eb.fn
        .sum<number>(
          eb.case().when("startDate", "is", null).then(1).else(0).end()
        )
        .as("planningCount"),
      eb.fn
        .sum<number>(
          eb
            .case()
            .when(
              eb.and([
                eb("startDate", "is not", null),
                eb("endDate", "is", null),
              ])
            )
            .then(1)
            .else(0)
            .end()
        )
        .as("inProgressCount"),
      eb.fn
        .sum<number>(
          eb
            .case()
            .when(
              eb.or([
                eb("startDate", "is", null),
                eb.and([
                  eb("startDate", "is not", null),
                  eb("endDate", "is", null),
                ]),
              ])
            )
            .then(eb.ref("price"))
            .else(0)
            .end()
        )
        .as("totalValue"),
    ])
    .executeTakeFirstOrThrow();

  const pipeline = await db
    .selectFrom("projects")
    .where((eb) =>
      eb.or([
        eb("startDate", "is", null),
        eb.and([eb("startDate", "is not", null), eb("endDate", "is", null)]),
      ])
    )
    .select(["id", "humanId", "price", "client", "visitDate", "startDate"])
    .execute();

  return { stats, pipeline };
}
