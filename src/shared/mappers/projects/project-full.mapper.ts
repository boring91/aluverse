import type { DB } from "@/db/types";
import {
  projectAllocation,
  projectAllocationOverrun,
  projectCost,
  projectDaysOverdue,
  projectMargin,
  projectMarkup,
  projectPaid,
  projectPriceExcGst,
  projectProfit,
  projectUsedAllocation,
  unreconciledItemsCount,
} from "@/shared/expressions/projects/project.expression";
import type { ExpressionBuilder, SelectExpression } from "kysely";

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
    projectPriceExcGst(eb).as("priceExcGst"),
    projectDaysOverdue(eb).as("daysOverdue"),
    projectProfit(eb).as("profit"),
    projectCost(eb).as("cost"),
    projectPaid(eb).as("paid"),
    projectMarkup(eb).as("effectiveMarkup"),
    projectMargin(eb).as("effectiveMargin"),
    projectAllocation(eb).as("allocation"),
    projectUsedAllocation(eb).as("usedAllocation"),
    projectAllocationOverrun(eb).as("allocationOverrun"),
    unreconciledItemsCount(eb).as("unreconciledItemsCount"),
  ] satisfies SelectExpression<DB, "projects">[];
