import type { Insertable } from "kysely";
import { getWestpacTransactions } from "./bank-fetchers";
import { db } from "@/db";
import type { DB } from "@/db/types";
import type { banks } from "./constants";

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

  let transactions: Insertable<DB["transactions"]>[] = [];

  switch (bank) {
    case "westpac":
      console.log({ since, until });
      transactions = await getWestpacTransactions(accountId, { since, until });
      break;
  }

  if (!transactions.length) return 0;

  const result = await db
    .insertInto("transactions")
    .values(transactions)
    .onConflict((x) => x.column("id").doNothing())
    .execute();

  return result[0].numInsertedOrUpdatedRows;
}
