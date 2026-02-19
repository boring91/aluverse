import { projectCost } from "@/shared/expressions/projects/project.expression";
import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectProfitStatsMapper = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  [
    "humanId",
    "title",
    "price",
    projectCost(eb).as("projectCost"),
    eb
      .case()
      .when("price", ">", eb.lit(0))
      .then(
        eb(
          eb.parens(eb("price", "-", projectCost(eb))),
          "/",
          eb.cast<number>(eb.ref("price"), "double precision")
        )
      )
      .else(eb.lit(0))
      .end()
      .as("profitMargin"),
  ] satisfies SelectExpression<DB, "projects">[];
