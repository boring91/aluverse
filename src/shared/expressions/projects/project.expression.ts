import type { ExpressionBuilder } from "kysely";
import type { DB } from "@/db/types";
import { getCurrentTime } from "@/lib/utils";
import { GST_RATE } from "@/lib/constants";
import { toDateString } from "@/lib/date";

export const projectPaid = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: string,
  to?: string,
) => {
  let exp = eb
    .selectFrom("projectPayments")
    .leftJoin(
      "reconciliations",
      "reconciliations.id",
      "projectPayments.reconciliationId",
    )
    .leftJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId",
    )
    .whereRef("projectPayments.projectId", "=", "projects.id");

  if (from) {
    exp = exp.where("transactions.date", ">=", from);
  }
  if (to) {
    exp = exp.where("transactions.date", "<", to);
  }

  return exp
    .select((sub) =>
      sub.fn
        .coalesce(sub.fn.sum<number>("projectPayments.amount"), sub.lit(0)) // XXX: We're taking the amounts from the project payments as opposed to the reconciliation because some of the payments don't have reconciliations.
        .as("paid"),
    )
    .$asScalar();
};

export const suppliesCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: string,
  to?: string,
) => {
  let exp = eb
    .selectFrom("projectSupplies")
    .innerJoin(
      "reconciliations",
      "reconciliations.id",
      "projectSupplies.reconciliationId",
    )
    .innerJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId",
    )
    .whereRef("projectSupplies.projectId", "=", "projects.id");

  if (from) {
    exp = exp.where("transactions.date", ">=", from);
  }
  if (to) {
    exp = exp.where("transactions.date", "<", to);
  }

  return exp
    .select((sub) =>
      sub.fn
        .coalesce(
          sub.fn.sum<number>(sub("quantity", "*", sub.ref("unitPrice"))),
          sub.lit(0),
        )
        .as("suppliesCost"),
    )
    .$asScalar();
};

export const laborCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: string,
  to?: string,
) => {
  let exp = eb
    .selectFrom("projectLabors")
    .innerJoin(
      "reconciliations",
      "reconciliations.id",
      "projectLabors.reconciliationId",
    )
    .innerJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId",
    )
    .whereRef("projectLabors.projectId", "=", "projects.id");

  if (from) {
    exp = exp.where("transactions.date", ">=", from);
  }
  if (to) {
    exp = exp.where("transactions.date", "<", to);
  }

  return exp
    .select((sub) =>
      sub.fn
        .coalesce(
          sub.fn.sum<number>(sub("hours", "*", sub.ref("rate"))),
          sub.lit(0),
        )
        .as("laborCost"),
    )
    .$asScalar();
};

export const miscCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: string,
  to?: string,
) => {
  let exp = eb
    .selectFrom("projectMisc")
    .innerJoin(
      "reconciliations",
      "reconciliations.id",
      "projectMisc.reconciliationId",
    )
    .innerJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId",
    )
    .whereRef("projectMisc.projectId", "=", "projects.id");

  if (from) {
    exp = exp.where("transactions.date", ">=", from);
  }
  if (to) {
    exp = exp.where("transactions.date", "<", to);
  }

  return exp
    .select((sub) =>
      sub.fn
        .coalesce(sub.fn.sum<number>("projectMisc.amount"), sub.lit(0))
        .as("miscCost"),
    )
    .$asScalar();
};

export const projectOutstanding = (eb: ExpressionBuilder<DB, "projects">) =>
  eb("price", "-", projectPaid);

export const projectBudgetAllocationCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: string,
  to?: string,
) => {
  from ??= "0001-01-01";
  to ??= "9999-12-31";

  return eb
    .case()
    .when(eb.and([eb("startDate", ">=", from), eb("startDate", "<", to)]))
    .then(eb("budgetUnits", "*", eb.ref("budgetUnitValue")))
    .else(0)
    .end()
    .$notNull();
};

export const projectCost = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: string,
  to?: string,
) => {
  from ??= "0001-01-01";
  to ??= "9999-12-31";

  return eb
    .parens(
      eb(
        eb(
          eb(suppliesCost(eb, from, to), "+", laborCost(eb, from, to)),
          "+",
          miscCost(eb, from, to),
        ),
        "-",
        projectBudgetAllocationCost(eb, from, to),
      ),
    )
    .$notNull();
};

export const projectPriceExcGst = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.parens(eb(eb.ref("price"), "/", eb.lit(1 + GST_RATE)));

export const projectProfit = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.parens(eb(projectPriceExcGst, "+", projectCost));

export const projectMarkup = (eb: ExpressionBuilder<DB, "projects">) =>
  eb
    .case()
    .when(eb.fn<number>("abs", [projectCost]), ">", eb.lit(0))
    .then(
      eb(
        eb.parens(eb(projectPriceExcGst, "+", projectCost(eb))),
        "/",
        eb.cast<number>(projectCost(eb), "double precision"),
      ),
    )
    .else(null)
    .end();

export const projectMargin = (eb: ExpressionBuilder<DB, "projects">) =>
  eb
    .case()
    .when(projectPriceExcGst, ">", 0)
    .then(
      eb(
        eb.parens(eb(projectPriceExcGst, "+", projectCost(eb))),
        "/",
        eb.cast<number>(projectPriceExcGst, "double precision"),
      ),
    )
    .else(null)
    .end();

export const unreconciledSuppliesCount = (
  eb: ExpressionBuilder<DB, "projects">,
) =>
  eb
    .selectFrom("projectSupplies")
    .whereRef("projectSupplies.projectId", "=", "projects.id")
    .where("reconciliationId", "is", null)
    .select((sub) => sub.fn.count<number>("id").as("unreconciledSuppliesCount"))
    .$asScalar();

export const unreconciledLaborsCount = (
  eb: ExpressionBuilder<DB, "projects">,
) =>
  eb
    .selectFrom("projectLabors")
    .whereRef("projectLabors.projectId", "=", "projects.id")
    .where("reconciliationId", "is", null)
    .select((sub) => sub.fn.count<number>("id").as("unreconciledLaborsCount"))
    .$asScalar();

export const unreconciledMiscCount = (eb: ExpressionBuilder<DB, "projects">) =>
  eb
    .selectFrom("projectMisc")
    .whereRef("projectMisc.projectId", "=", "projects.id")
    .where("reconciliationId", "is", null)
    .select((sub) => sub.fn.count<number>("id").as("unreconciledMiscCount"))
    .$asScalar();

export const unreconciledPaymentsCount = (
  eb: ExpressionBuilder<DB, "projects">,
) =>
  eb
    .selectFrom("projectPayments")
    .whereRef("projectPayments.projectId", "=", "projects.id")
    .where("reconciliationId", "is", null)
    .select((sub) => sub.fn.count<number>("id").as("unreconciledPaymentsCount"))
    .$asScalar();

export const unreconciledItemsCount = (eb: ExpressionBuilder<DB, "projects">) =>
  eb(
    eb(
      eb(unreconciledSuppliesCount, "+", unreconciledLaborsCount),
      "+",
      unreconciledMiscCount,
    ),
    "+",
    unreconciledPaymentsCount,
  ).$notNull();

export const projectInPlanning = (eb: ExpressionBuilder<DB, "projects">) =>
  eb("startDate", "is", null);

export const projectInProgress = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.and([eb("startDate", "is not", null), eb("endDate", "is", null)]);

export const projectAwaitingPayment = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.and([
    eb("startDate", "is not", null),
    eb("endDate", "is not", null),
    eb(projectPaid, "!=", eb.ref("price")),
  ]);

export const projectCompleted = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.and([
    eb("startDate", "is not", null),
    eb("endDate", "is not", null),
    eb(projectAwaitingPayment, "=", false),
  ]);

export const projectDaysOverdue = (eb: ExpressionBuilder<DB, "projects">) => {
  const now = toDateString(getCurrentTime());

  return eb(
    eb
      .case()
      .when(projectAwaitingPayment, "=", true)
      .then(eb("endDate", "-", now).$castTo<number>())
      .else(eb.lit(null))
      .end(),
    "*",
    eb.lit(-1),
  );
};

export const projectAllocation = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.parens(
    eb.parens(eb.val(1), "-", eb.ref("margin")),
    "*",
    projectPriceExcGst,
  );

export const projectUsedAllocation = (eb: ExpressionBuilder<DB, "projects">) =>
  eb.parens(
    eb
      .case()
      .when(projectAllocation, "!=", eb.lit(0))
      .then(eb(eb.fn<number>("abs", [projectCost]), "/", projectAllocation))
      .else(eb.lit(null))
      .end(),
  );

export const projectAllocationOverrun = (
  eb: ExpressionBuilder<DB, "projects">,
) =>
  eb
    .case()
    .when(
      eb.and([
        eb(eb.fn<number>("abs", [projectCost]), ">", projectAllocation),
        eb("price", ">", 0),
      ]),
    )
    .then(
      eb(
        eb.parens(eb.fn<number>("abs", [projectCost]), "-", projectAllocation),
        "/",
        projectAllocation,
      ),
    )
    .else(null)
    .end();

export const isProjectWithinRange = (
  eb: ExpressionBuilder<DB, "projects">,
  from?: string,
  to?: string,
) => {
  if (!from && !to) {
    return eb.lit(true);
  }

  if (from && to) {
    return eb.and([eb("startDate", ">=", from), eb("startDate", "<", to)]);
  }

  if (from) {
    return eb("startDate", ">=", from);
  }

  if (to) {
    return eb("startDate", "<", to);
  }

  return eb.lit(false);
};
