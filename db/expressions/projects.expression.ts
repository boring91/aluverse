import { ExpressionBuilder } from "kysely";
import { DB } from "../types";

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

export const cost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: Date,
  to?: Date
) =>
  eb(
    eb(suppliesCost(eb, from, to), "+", laborCost(eb, from, to)),
    "+",
    miscCost(eb, from, to)
  ).$notNull();

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
