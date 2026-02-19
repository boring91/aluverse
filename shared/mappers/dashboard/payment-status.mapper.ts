import { projectPaid } from "@/shared/expressions/projects/project.expression";
import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression, sql } from "kysely";

export const projectPaymentStatusRowMapper = (
  eb: ExpressionBuilder<DB, "projects" | "projectPayments">
) =>
  [
    "projects.id",
    "projects.price",
    eb
      .case()
      .when("price", ">", 0)
      .then(
        eb(
          eb
            .case()
            .when(projectPaid(eb), ">", eb.ref("projects.price"))
            .then(eb.ref("projects.price"))
            .else(projectPaid(eb))
            .end(),
          "/",
          eb.ref("projects.price")
        )
      )
      .else(null)
      .end()
      .as("velocity"),
    projectPaid(eb).as("paid"),
    eb
      .case()
      .when(eb(projectPaid, "=", eb.ref("price")))
      .then(
        eb(
          eb.fn.max("projectPayments.date"),
          "-",
          eb.ref("projects.startDate")
        ).$castTo<number>()
      )
      .else(null)
      .end()
      .as("paidInDays"),
    eb
      .case()
      .when(eb(projectPaid, "=", eb.ref("price")))
      .then(
        eb
          .case()
          .when(eb("endDate", ">=", eb.fn.max("projectPayments.date")))
          .then("onTime")
          .else("late")
          .end()
      )
      .else("overdue")
      .end()
      .as("status"),
  ] satisfies SelectExpression<DB, "projects" | "projectPayments">[];

export const paymentStatusSummaryMapper = () => [
  sql<number>`coalesce(avg(velocity), 0)`.as("velocity"),
  sql<number>`coalesce(avg("paidInDays"), 0)`.as("averagePaymentInDays"),
  sql<number>`
      sum(case when status = 'onTime' then 1.0 else 0.0 end)
      / cast(count(id) as double precision)
    `.as("onTimeRate"),
  sql<number>`
      coalesce(sum(case when status = 'onTime' then 1 else 0 end), 0)
    `.as("onTimeCount"),
  sql<number>`
      coalesce(sum(case when status = 'late' then 1 else 0 end), 0)
    `.as("lateCount"),
  sql<number>`
      coalesce(sum(case when status = 'overdue' then 1 else 0 end), 0)
    `.as("overdueCount"),
];
