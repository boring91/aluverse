import { db } from "@/db";
import {
  isProjectWithinRange,
  projectPaid,
} from "@/shared/expressions/projects/project.expression";

export async function getPaymentStatusQuery(from?: string, to?: string) {
  const query = db
    .selectFrom("projects")
    .leftJoin("projectPayments", "projectId", "projects.id")
    .where((eb) =>
      eb.and([
        isProjectWithinRange(eb, from, to),
        eb("endDate", "is not", null),
      ]),
    )
    .groupBy(["projects.id"])
    .select((eb) => [
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
            eb.ref("projects.price"),
          ),
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
            eb.ref("projects.startDate"),
          ).$castTo<number>(),
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
            .end(),
        )
        .else("overdue")
        .end()
        .as("status"),
    ])
    .as("tmp");

  return await db
    .selectFrom(query)
    .select((eb) => [
      eb.fn.avg<number>("velocity").as("velocity"),

      eb.fn
        .coalesce(eb.fn.avg<number>("paidInDays"), eb.lit(0))
        .as("averagePaymentInDays"),

      eb(
        eb.fn.sum<number>(
          eb
            .case()
            .when(eb("status", "=", "onTime"))
            .then(1.0)
            .else(0.0)
            .end(),
        ),
        "/",
        eb.cast<number>(eb.fn.count("id"), "double precision"),
      ).as("onTimeRate"),

      eb.fn
        .coalesce(
          eb.fn.sum<number>(
            eb
              .case()
              .when(eb("status", "=", "onTime"))
              .then(1)
              .else(0)
              .end(),
          ),
          eb.lit(0),
        )
        .as("onTimeCount"),

      eb.fn
        .coalesce(
          eb.fn.sum<number>(
            eb
              .case()
              .when(eb("status", "=", "late"))
              .then(1)
              .else(0)
              .end(),
          ),
          eb.lit(0),
        )
        .as("lateCount"),

      eb.fn
        .coalesce(
          eb.fn.sum<number>(
            eb
              .case()
              .when(eb("status", "=", "overdue"))
              .then(1)
              .else(0)
              .end(),
          ),
          eb.lit(0),
        )
        .as("overdueCount"),
    ])
    .executeTakeFirstOrThrow();
}
