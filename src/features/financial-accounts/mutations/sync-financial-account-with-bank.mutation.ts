import { db } from "@/db";
import type { DB } from "@/db/types";
import { parseDateString } from "@/lib/date";
import { toUuid } from "@/lib/utils";
import type { Insertable } from "kysely";
import { fetchFrolloTransactions } from "../lib/frollo";

export async function syncFinancialAccountWithBankMutation(id: string) {
  const account = await db
    .selectFrom("financialAccounts")
    .where("id", "=", id)
    .select(["frolloAccountId"])
    .executeTakeFirst();

  if (!account?.frolloAccountId) {
    return 0;
  }

  // Get last existing transaction
  const lastTransaction = await db
    .selectFrom("transactions")
    .where("accountId", "=", id)
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
  const since = lastTransaction?.date
    ? new Date(parseDateString(lastTransaction.date).getTime() - ONE_DAY_MS)
    : undefined;

  console.log({ since });
  const frolloTransactions = await fetchFrolloTransactions(
    account.frolloAccountId,
    { since },
  );

  const transactions = frolloTransactions.map((transaction) => ({
    id: toUuid(transaction.id),
    accountId: id,
    // `post_date` is already a calendar date — keep the `YYYY-MM-DD` portion
    // as-is. Round-tripping through `new Date()` would parse it as UTC
    // midnight and shift the day on servers west of UTC.
    date: transaction.post_date.slice(0, 10),
    description: transaction.description.original,
    amount: Math.round(transaction.amount.amount * 100),
  })) satisfies Insertable<DB["transactions"]>[];

  if (!transactions.length) return 0;

  const result = await db
    .insertInto("transactions")
    .values(transactions)
    .onConflict((x) => x.column("id").doNothing())
    .execute();

  return result[0].numInsertedOrUpdatedRows;
}
