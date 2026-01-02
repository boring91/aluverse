import { ExpressionWrapper, sql } from "kysely";

export const getMonth = <DB, TB extends keyof DB>(
  eb: ExpressionWrapper<DB, TB, Date>
) => sql<number>`EXTRACT(MONTH FROM ${eb})`;

export const getYear = <DB, TB extends keyof DB>(
  eb: ExpressionWrapper<DB, TB, Date>
) => sql<number>`EXTRACT(YEAR FROM ${eb})`;
