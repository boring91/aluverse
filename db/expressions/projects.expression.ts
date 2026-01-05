import { ExpressionBuilder } from "kysely";
import { DB } from "../types";
import { getCurrentTime } from "@/lib/utils";

export const projectPaid = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: Date,
  to?: Date
) => {
  let exp = eb
    .selectFrom("projectPayments")
    .whereRef("projectPayments.projectId", "=", "projects.id");

  if (from) {
    exp = exp.where("projectPayments.date", ">=", from);
  }
  if (to) {
    exp = exp.where("projectPayments.date", "<=", to);
  }

  return exp
    .select((sub) =>
      sub.fn
        .coalesce(sub.fn.sum<number>("projectPayments.amount"), sub.lit(0))
        .as("paid")
    )
    .$asScalar();
};

export const suppliesCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: Date,
  to?: Date
) => {
  let exp = eb
    .selectFrom("projectSupplies")
    .whereRef("projectSupplies.projectId", "=", "projects.id");

  if (from) {
    exp = exp.where("projectSupplies.createdAt", ">=", from);
  }
  if (to) {
    exp = exp.where("projectSupplies.createdAt", "<=", to);
  }

  return exp
    .select((sub) =>
      sub.fn
        .coalesce(
          sub.fn.sum<number>(sub("quantity", "*", sub.ref("unitPrice"))),
          sub.lit(0)
        )
        .as("suppliesCost")
    )
    .$asScalar();
};

export const laborCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: Date,
  to?: Date
) => {
  let exp = eb
    .selectFrom("projectLabors")
    .whereRef("projectLabors.projectId", "=", "projects.id");

  if (from) {
    exp = exp.where("projectLabors.createdAt", ">=", from);
  }
  if (to) {
    exp = exp.where("projectLabors.createdAt", "<=", to);
  }

  return exp
    .select((sub) =>
      sub.fn
        .coalesce(
          sub.fn.sum<number>(sub("hours", "*", sub.ref("rate"))),
          sub.lit(0)
        )
        .as("laborCost")
    )
    .$asScalar();
};

export const miscCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: Date,
  to?: Date
) => {
  let exp = eb
    .selectFrom("projectMisc")
    .whereRef("projectMisc.projectId", "=", "projects.id");

  if (from) {
    exp = exp.where("projectMisc.createdAt", ">=", from);
  }
  if (to) {
    exp = exp.where("projectMisc.createdAt", "<=", to);
  }

  return exp
    .select((sub) =>
      sub.fn
        .coalesce(sub.fn.sum<number>("projectMisc.amount"), sub.lit(0))
        .as("miscCost")
    )
    .$asScalar();
};

export const projectOutstanding = (eb: ExpressionBuilder<DB, "projects">) =>
  eb("price", "-", projectPaid);

export const projectCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: Date,
  to?: Date
) =>
  eb
    .parens(
      eb(
        eb(
          eb(suppliesCost(eb, from, to), "+", laborCost(eb, from, to)),
          "+",
          miscCost(eb, from, to)
        ),
        "+",
        eb("budgetUnits", "*", eb.ref("budgetUnitValue"))
      )
    )
    .$notNull();

export const projectMarkup = (eb: ExpressionBuilder<DB, "projects">) =>
  eb
    .case()
    .when(projectCost, ">", 0)
    .then(
      eb(
        eb.parens(eb("price", "-", projectCost(eb))),
        "/",
        eb.cast<number>(projectCost(eb), "double precision")
      )
    )
    .else(null)
    .end();

export const projectMargin = (eb: ExpressionBuilder<DB, "projects">) =>
  // eb.lit(0);
  eb
    .case()
    .when("price", ">", 0)
    .then(
      eb(
        eb.parens(eb("price", "-", projectCost(eb))),
        "/",
        eb.cast<number>(eb.ref("price"), "double precision")
      )
    )
    .else(null)
    .end();

export const unconsolidatedSuppliesCount = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  eb
    .selectFrom("projectSupplies")
    .whereRef("projectSupplies.projectId", "=", "projects.id")
    .where("consolidationId", "is", null)
    .select((sub) =>
      sub.fn.count<number>("id").as("unconsolidatedSuppliesCount")
    )
    .$asScalar();

export const unconsolidatedLaborsCount = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  eb
    .selectFrom("projectLabors")
    .whereRef("projectLabors.projectId", "=", "projects.id")
    .where("consolidationId", "is", null)
    .select((sub) => sub.fn.count<number>("id").as("unconsolidatedLaborsCount"))
    .$asScalar();

export const unconsolidatedMiscCount = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  eb
    .selectFrom("projectMisc")
    .whereRef("projectMisc.projectId", "=", "projects.id")
    .where("consolidationId", "is", null)
    .select((sub) => sub.fn.count<number>("id").as("unconsolidatedMiscCount"))
    .$asScalar();

export const unconsolidatedPaymentsCount = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  eb
    .selectFrom("projectPayments")
    .whereRef("projectPayments.projectId", "=", "projects.id")
    .where("consolidationId", "is", null)
    .select((sub) =>
      sub.fn.count<number>("id").as("unconsolidatedPaymentsCount")
    )
    .$asScalar();

export const unconsolidatedItemsCount = (
  eb: ExpressionBuilder<DB, "projects">
) =>
  eb(
    eb(
      eb(unconsolidatedSuppliesCount, "+", unconsolidatedLaborsCount),
      "+",
      unconsolidatedMiscCount
    ),
    "+",
    unconsolidatedPaymentsCount
  ).$notNull();

export const projectInPlanning = (eb: ExpressionBuilder<DB, "projects">) =>
  eb("startDate", "is", null);

export const projectInProgress = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.and([eb("startDate", "is not", null), eb("endDate", "is", null)]);

export const projectAwaitingPayment = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.and([
    eb("startDate", "is not", null),
    eb(projectPaid, "!=", eb.ref("price")),
  ]);

export const projectCompleted = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.and([
    eb("startDate", "is not", null),
    eb("endDate", "is not", null),
    eb(projectAwaitingPayment, "=", false),
  ]);

export const projectDaysOverdue = (eb: ExpressionBuilder<DB, "projects">) => {
  const now = getCurrentTime();

  return eb(
    eb
      .case()
      .when(projectAwaitingPayment, "=", true)
      .then(eb("endDate", "-", now).$castTo<number>())
      .else(eb.lit(null))
      .end(),
    "*",
    eb.lit(-1)
  );
};
