import { db } from "@/db";
import {
  projectAwaitingPayment,
  projectDaysOverdue,
  projectOutstanding,
} from "@/db/expressions";

export async function getOutstandingProjects() {
  const query = db
    .selectFrom("projects")
    .where(projectAwaitingPayment)
    .where(projectOutstanding, ">", 0);

  const outstanding = await query
    .select((eb) => [
      eb.fn
        .coalesce(eb.fn.sum<number>(projectOutstanding), eb.lit(0))
        .as("total"),
      eb.fn.coalesce(eb.fn.count<number>("id"), eb.lit(0)).as("count"),
    ])
    .executeTakeFirstOrThrow();

  const overdue = await query
    .where("endDate", "is not", null)
    .select((eb) => [
      eb.fn
        .coalesce(eb.fn.sum<number>(projectOutstanding), eb.lit(0))
        .as("total"),
      eb.fn.coalesce(eb.fn.count<number>("id"), eb.lit(0)).as("count"),
      eb.fn
        .coalesce(eb.fn.avg<number>(projectDaysOverdue), eb.lit(0))
        .as("daysOverdueAverage"),
    ])
    .executeTakeFirstOrThrow();

  const top = await query
    .select((eb) => [
      "id",
      "humanId",
      "client",
      projectOutstanding(eb).as("outstanding"),
      projectDaysOverdue(eb).as("daysOverdue"),
    ])
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
