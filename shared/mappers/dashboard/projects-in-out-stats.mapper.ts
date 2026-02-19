import {
  projectCost,
  projectPaid,
} from "@/shared/expressions/projects/project.expression";
import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectsInOutStatsMapper =
  (from?: Date, to?: Date) => (eb: ExpressionBuilder<DB, "projects">) =>
    [
      eb.fn.sum<number>(projectPaid(eb, from, to)).as("in"),
      eb.fn.sum<number>(projectCost(eb, from, to)).as("out"),
    ] satisfies SelectExpression<DB, "projects">[];
