import { projectCompleted, projectCost, projectPaid } from "@/db/expressions";
import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const efficiencyMetricsMapper = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  [
    eb.fn
      .coalesce(eb.fn.avg<number>(projectPaid(eb)), eb.lit(0))
      .as("revenuePerProject"),
    eb.fn
      .coalesce(eb.fn.avg<number>(projectCost(eb)), eb.lit(0))
      .as("costPerProject"),
    eb.fn.coalesce(eb.fn.avg<number>("price"), eb.lit(0)).as("valuePerProject"),
    eb.fn
      .coalesce(
        eb.fn.sum<number>(
          eb.case().when(projectCompleted(eb)).then(1).else(0).end()
        ),
        eb.lit(0)
      )
      .as("completedCount"),
    eb.fn.count<number>("id").as("projectCount"),
  ] satisfies SelectExpression<DB, "projects">[];
