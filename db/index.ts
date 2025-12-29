import "dotenv/config";
import { DB } from "./types";
import pg, { Pool } from "pg";
import { Kysely, PostgresDialect, CamelCasePlugin } from "kysely";

pg.types.setTypeParser(20, val => parseInt(val, 10));
pg.types.setTypeParser(1700, val => parseFloat(val));

const dialect = new PostgresDialect({
    pool: new Pool({
        connectionString: process.env.DATABASE_URL!,
    }),
});

export const db = new Kysely<DB>({
    dialect,
    plugins: [new CamelCasePlugin()],
});
