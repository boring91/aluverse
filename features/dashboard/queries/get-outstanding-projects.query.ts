import { db } from "@/db";
import {
  projectAwaitingPayment,
  projectDaysOverdue,
  projectOutstanding,
} from "@/shared/expressions/projects/project.expression";
import {
  outstandingProjectTopMapper,
  outstandingProjectsSummaryMapper,
  overdueProjectsSummaryMapper,
} from "@/shared/mappers/dashboard/outstanding-projects.mapper";

export async function getOutstandingProjectsQuery() {
  const query = db
    .selectFrom("projects")
    .where(projectAwaitingPayment)
    .where(projectOutstanding, ">", 0);

  const outstanding = await query
    .select(outstandingProjectsSummaryMapper)
    .executeTakeFirstOrThrow();

  const overdue = await query
    .where("endDate", "is not", null)
    .select(overdueProjectsSummaryMapper)
    .executeTakeFirstOrThrow();

  const top = await query
    .select(outstandingProjectTopMapper)
    .orderBy(
      (eb) =>
        eb
          .case()
          .when(projectDaysOverdue, "is", null)
          .then(eb.lit(0))
          .else(projectDaysOverdue)
          .end(),
      "desc"
    )
    .orderBy(projectOutstanding, "desc")
    // .limit(5)
    .execute();

  return {
    outstanding,
    overdue,
    top,
  };
}
