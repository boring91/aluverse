import { ExpressionBuilder } from "kysely";
import { DB } from "../types";

export const projectPaid = (eb: ExpressionBuilder<DB, "projects">) =>
  eb
    .selectFrom("projectPayments")
    .whereRef("projectPayments.projectId", "=", "projects.id")
    .select((sub) =>
      sub.fn
        .coalesce(sub.fn.sum<number>("projectPayments.amount"), sub.lit(0))
        .as("paid")
    )
    .$asScalar();

export const suppliesCost = (eb: ExpressionBuilder<DB, "projects">) =>
  eb
    .selectFrom("projectSupplies")
    .whereRef("projectSupplies.projectId", "=", "projects.id")
    .select((sub) =>
      sub.fn
        .coalesce(
          sub.fn.sum<number>(sub("quantity", "*", sub.ref("unitPrice"))),
          sub.lit(0)
        )
        .as("suppliesCost")
    );

export const laborCost = (eb: ExpressionBuilder<DB, "projects">) =>
  eb
    .selectFrom("projectLabors")
    .whereRef("projectLabors.projectId", "=", "projects.id")
    .select((sub) =>
      sub.fn
        .coalesce(
          sub.fn.sum<number>(sub("rate", "*", sub.ref("hours"))),
          sub.lit(0)
        )
        .as("laborCost")
    );

export const miscCost = (eb: ExpressionBuilder<DB, "projects">) =>
  eb
    .selectFrom("projectMisc")
    .whereRef("projectMisc.projectId", "=", "projects.id")
    .select((sub) =>
      sub.fn
        .coalesce(sub.fn.sum<number>("projectMisc.amount"), sub.lit(0))
        .as("miscCost")
    );

export const cost = (eb: ExpressionBuilder<DB, "projects">) =>
  eb(eb(suppliesCost, "+", laborCost), "+", miscCost).$notNull();

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
