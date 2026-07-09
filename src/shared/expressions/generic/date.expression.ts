import type { ExpressionWrapper } from "kysely";
import { sql } from "kysely";

export const getMonth = <TDatabase, TTable extends keyof TDatabase>(
  eb: ExpressionWrapper<TDatabase, TTable, Date | string>,
) => sql<number>`EXTRACT(MONTH FROM ${eb})`;

export const getYear = <TDatabase, TTable extends keyof TDatabase>(
  eb: ExpressionWrapper<TDatabase, TTable, Date | string>,
) => sql<number>`EXTRACT(YEAR FROM ${eb})`;
