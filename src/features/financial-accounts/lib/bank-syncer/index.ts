import type { Insertable } from "kysely";
import { getWestpacTransactions } from "./bank-fetchers";
import { db } from "@/db";
import type { DB } from "@/db/types";
import { parseDateString } from "@/lib/date";
import type { banks } from "./constants";

const transactionFetchers = {
  westpac: getWestpacTransactions,
} satisfies Record<
  (typeof banks)[number],
  (
    accountId: string,
    options: { since?: Date; until?: Date },
  ) => Promise<Insertable<DB["transactions"]>[]>
>;

export async function syncWithBank(
  bank: (typeof banks)[number],
  accountId: string,
  since?: Date,
  until?: Date,
) {
  if (!since && !until) {
    // Get last existing transaction
    const lastTransaction = await db
      .selectFrom("transactions")
      .where("accountId", "=", accountId)
      .select("date")
      .orderBy("date", "desc")
      .limit(1)
      .executeTakeFirst();

    // `date` is a bare `YYYY-MM-DD` calendar date with no time or timezone.
    // Start the incremental fetch a full day before it: our local-midnight
    // parse can land mid-morning in the bank's timezone, so backing off a day
    // guarantees we never skip a same-day transaction regardless of server
    // timezone. Re-fetched rows are deduped by the `onConflict` below.
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    since = lastTransaction?.date
      ? new Date(parseDateString(lastTransaction.date).getTime() - ONE_DAY_MS)
      : undefined;
  }

  console.log({ since, until });
  const transactions = await transactionFetchers[bank](accountId, {
    since,
    until,
  });

  if (!transactions.length) return 0;

  const result = await db
    .insertInto("transactions")
    .values(transactions)
    .onConflict((x) => x.column("id").doNothing())
    .execute();

  return result[0].numInsertedOrUpdatedRows;
}
