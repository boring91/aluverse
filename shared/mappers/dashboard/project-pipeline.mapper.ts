import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectPipelineStatsMapper = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  [
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
            eb.and([eb("startDate", "is not", null), eb("endDate", "is", null)])
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
  ] satisfies SelectExpression<DB, "projects">[];

export const projectPipelineItemMapper = () =>
  [
    "id",
    "humanId",
    "price",
    "client",
    "visitDate",
    "startDate",
  ] satisfies SelectExpression<DB, "projects">[];
