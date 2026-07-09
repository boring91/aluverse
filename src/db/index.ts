import "dotenv/config";
import type { DB } from "./types";
import pg, { Pool } from "pg";
import { Kysely, PostgresDialect, CamelCasePlugin } from "kysely";

pg.types.setTypeParser(20, (val) => parseInt(val, 10));
pg.types.setTypeParser(1700, (val) => parseFloat(val));

// Calendar dates (Postgres `date`, type id 1082) are represented as plain
// `YYYY-MM-DD` strings throughout the app — never Date objects — so they carry
// no timezone and cannot shift a day. Return the raw string as-is instead of
// letting node-pg parse it into a local-midnight Date.
pg.types.setTypeParser(1082, (val) => val);

/**
 * JSON reviver that converts ISO date-TIME strings back to Date objects.
 * This fixes instants (time-zone-aware) inside jsonObjectFrom/jsonArrayFrom results
 * which PostgreSQL serializes as strings.
 *
 * Bare `YYYY-MM-DD` calendar dates are intentionally left as strings so they
 * keep their timezone-free semantics.
 */
const jsonDateReviver = (_key: string, value: unknown): unknown => {
  if (typeof value === "string") {
    // ISO 8601 date-TIME pattern only (a time component is required): revive
    // instants but leave bare `YYYY-MM-DD` calendar dates as strings.
    const isoDateTimePattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})?$/;
    if (isoDateTimePattern.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return value;
};

// Parse JSON and JSONB types with date revival
pg.types.setTypeParser(114, (val) => JSON.parse(val, jsonDateReviver)); // json
pg.types.setTypeParser(3802, (val) => JSON.parse(val, jsonDateReviver)); // jsonb

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});

export const db = new Kysely<DB>({
  dialect,
  plugins: [new CamelCasePlugin()],
});
