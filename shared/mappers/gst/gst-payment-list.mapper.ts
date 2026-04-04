import { DB } from "@/db/types";
import { SelectExpression } from "kysely";

export const gstPaymentListMapper = () =>
  [
    "id",
    "periodFrom",
    "periodTo",
    "rate",
    "amount",
    "createdAt",
  ] satisfies SelectExpression<DB, "gstPayments">[];
