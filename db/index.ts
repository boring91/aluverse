import "dotenv/config";
import { DB } from "./types";
import pg, { Pool } from "pg";
import { Kysely, PostgresDialect, CamelCasePlugin } from "kysely";

pg.types.setTypeParser(20, (val) => parseInt(val, 10));
pg.types.setTypeParser(1700, (val) => parseFloat(val));

/**
 * JSON reviver that converts ISO date strings back to Date objects.
 * This fixes dates inside jsonObjectFrom/jsonArrayFrom results which
 * PostgreSQL serializes as strings.
 */
const jsonDateReviver = (_key: string, value: unknown): unknown => {
  if (typeof value === "string") {
    // ISO 8601 date pattern: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss with optional ms and timezone
    const isoDatePattern =
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (isoDatePattern.test(value)) {
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
    connectionString: process.env.DATABASE_URL!,
  }),
});

export const db = new Kysely<DB>({
  dialect,
  plugins: [new CamelCasePlugin()],
});
