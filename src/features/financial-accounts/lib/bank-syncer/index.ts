import type { Insertable } from "kysely";
import { getWestpacTransactions } from "./bank-fetchers";
import { db } from "@/db";
import type { DB } from "@/db/types";
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

    since = lastTransaction?.date
      ? new Date(new Date(lastTransaction.date).getTime() + 1000)
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
