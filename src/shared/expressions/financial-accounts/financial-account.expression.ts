import type { ExpressionBuilder } from "kysely";
import type { DB } from "@/db/types";

export const balance = (eb: ExpressionBuilder<DB, "financialAccounts">) => {
  return eb
    .selectFrom("transactions")
    .whereRef("transactions.accountId", "=", "financialAccounts.id")
    .select((sub) =>
      sub.fn.coalesce(sub.fn.sum<number>("amount"), sub.lit(0)).as("balance"),
    )
    .$asScalar();
};
