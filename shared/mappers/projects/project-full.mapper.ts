import { DB } from "@/db/types";
import {
  projectAllocation,
  projectAllocationOverrun,
  projectCost,
  projectDaysOverdue,
  projectMargin,
  projectMarkup,
  projectPaid,
  unconsolidatedItemsCount,
} from "@/db/expressions";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectFullMapper = (eb: ExpressionBuilder<DB, "projects">) =>
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
    projectDaysOverdue(eb).as("daysOverdue"),
    projectCost(eb).as("cost"),
    projectPaid(eb).as("paid"),
    projectMarkup(eb).as("effectiveMarkup"),
    projectMargin(eb).as("effectiveMargin"),
    projectAllocation(eb).as("allocation"),
    projectAllocationOverrun(eb).as("allocationOverrun"),
    unconsolidatedItemsCount(eb).as("unconsolidatedItemsCount"),
  ] satisfies SelectExpression<DB, "projects">[];
