import { ExpressionBuilder, SelectExpression } from "kysely";
import { DB } from "../types";
import {
  projectCost,
  projectMargin,
  projectMarkup,
  projectPaid,
  unconsolidatedItemsCount,
} from "../expressions";

export const projectMapper = (eb: ExpressionBuilder<DB, "projects">) =>
  [
    "id",
    "humanId",
    "client",
    "title",
    "visitDate",
    "startDate",
    "endDate",
    "address",
    "meters",
    "price",
    "margin",
    "budgetUnits",
    "budgetUnitValue",
    projectCost(eb).as("cost"),
    projectPaid(eb).as("paid"),
    projectMarkup(eb).as("effectiveMarkup"),
    projectMargin(eb).as("effectiveMargin"),
    unconsolidatedItemsCount(eb).as("unconsolidatedItemsCount"),
  ] satisfies SelectExpression<DB, "projects">[];

export const projectSupplyMapper = (
  eb: ExpressionBuilder<DB, "projectSupplies">
) =>
  [
    "id",
    "name",
    "quantity",
    "unitPrice",
    eb("consolidationId", "is not", null).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "projectSupplies">[];

export const projectLaborMapper = (
  eb: ExpressionBuilder<DB, "projectLabors">
) =>
  [
    "id",
    "name",
    "hours",
    "rate",
    eb("consolidationId", "is not", null).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "projectLabors">[];

export const projectMiscMapper = (eb: ExpressionBuilder<DB, "projectMisc">) =>
  [
    "id",
    "name",
    "amount",
    eb("consolidationId", "is not", null).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "projectMisc">[];

export const projectPaymentMapper = (
  eb: ExpressionBuilder<DB, "projectPayments">
) =>
  [
    "id",
    "date",
    "amount",
    eb("consolidationId", "is not", null).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "projectPayments">[];
