import {
  projectDaysOverdue,
  projectOutstanding,
} from "@/shared/expressions/projects/project.expression";
import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const outstandingProjectsSummaryMapper = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  [
    eb.fn
      .coalesce(eb.fn.sum<number>(projectOutstanding), eb.lit(0))
      .as("total"),
    eb.fn.coalesce(eb.fn.count<number>("id"), eb.lit(0)).as("count"),
  ] satisfies SelectExpression<DB, "projects">[];

export const overdueProjectsSummaryMapper = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  [
    eb.fn
      .coalesce(eb.fn.sum<number>(projectOutstanding), eb.lit(0))
      .as("total"),
    eb.fn.coalesce(eb.fn.count<number>("id"), eb.lit(0)).as("count"),
    eb.fn
      .coalesce(eb.fn.avg<number>(projectDaysOverdue), eb.lit(0))
      .as("daysOverdueAverage"),
  ] satisfies SelectExpression<DB, "projects">[];

export const outstandingProjectTopMapper = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  [
    "id",
    "humanId",
    "client",
    projectOutstanding(eb).as("outstanding"),
    projectDaysOverdue(eb).as("daysOverdue"),
  ] satisfies SelectExpression<DB, "projects">[];
