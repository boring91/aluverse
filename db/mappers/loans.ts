import { ExpressionBuilder, SelectExpression } from "kysely";
import { loanPaid, loanRemaining } from "../expressions";
import { DB } from "../types";

export const loanMapper = (eb: ExpressionBuilder<DB, "loans">) =>
    [
        "id",
        "type",
        "partyName",
        "amount",
        "date",
        "dueDate",
        "notes",
        loanPaid(eb).as("paid"),
        loanRemaining(eb).as("remaining"),
    ] satisfies SelectExpression<DB, "loans">[];

export const loanPayoffMapper = () =>
    ["id", "date", "amount", "notes"] satisfies SelectExpression<
        DB,
        "loanPayoffs"
    >[];
