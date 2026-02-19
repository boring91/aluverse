import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  check,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  transactionConsolidationGroups,
  projectStreams,
} from "@/lib/constants";
import { transactions } from "./transactions.schema";
import { projects } from "./projects.schema";
import { loans, loanPayoffs } from "./loans.schema";
import { budgetCategories } from "./budget.schema";
import { auditColumns } from "../utils";

export const transactionConsolidatedGroup = pgEnum(
  "consolidation_group",
  transactionConsolidationGroups
);
export const projectStream = pgEnum(
  "consolidation_project_stream",
  projectStreams
);

export const consolidations = pgTable(
  "consolidations",
  {
    id: uuid().primaryKey().defaultRandom(),
    transactionId: uuid()
      .references(() => transactions.id, { onDelete: "cascade" })
      .notNull(),
    description: varchar({ length: 1024 }),
    amount: integer().notNull(),
    isGst: boolean().notNull(),
    consolidationGroup: transactionConsolidatedGroup().notNull(),
    budgetCategoryId: uuid().references(() => budgetCategories.id, {
      onDelete: "restrict",
    }),
    projectId: uuid().references(() => projects.id, {
      onDelete: "set null",
    }),
    projectStream: projectStream(),
    projectItemId: uuid(),
    loanId: uuid().references(() => loans.id, {
      onDelete: "set null",
    }),
    isPayoff: boolean(),
    loanPayoffId: uuid().references(() => loanPayoffs.id, {
      onDelete: "set null",
    }),
    ...auditColumns,
  },
  (table) => {
    return [
      // ensure budget category is only set if consolidation group is budget
      check(
        "budget_category_check_constraint",
        sql`${table.consolidationGroup} <> 'budget' OR ${table.budgetCategoryId} IS NOT NULL`
      ),

      // ensure project id is only set if consolidation group is project
      check(
        "project_id_check_constraint",
        sql`${table.consolidationGroup} <> 'project' OR ${table.projectId} IS NOT NULL`
      ),

      // ensure loan id is only set if consolidation group is loan
      check(
        "loan_id_check_constraint",
        sql`${table.consolidationGroup} <> 'loan' OR ${table.loanId} IS NOT NULL`
      ),

      // ensure loan payoff id is only set if isPayoff is true
      check(
        "loan_payoff_check_constraint",
        sql`${table.isPayoff} IS NOT TRUE OR ${table.loanPayoffId} IS NOT NULL`
      ),
    ];
  }
);
