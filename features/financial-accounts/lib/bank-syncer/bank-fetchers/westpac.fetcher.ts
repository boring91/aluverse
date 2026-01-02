import { DB } from "@/db/types";
import { Insertable } from "kysely";
import { WestpacTransaction } from "../types/westpac-transaction";

type Transaction = Insertable<DB["transactions"]>;

const baseUrl = "https://au-api.basiq.io";

async function getAccessToken() {
  const res = await fetch(`${baseUrl}/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "basiq-version": "3.0",
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${process.env.BASIQ_KEY}`,
    },
  });

  const data: { access_token: string } = await res.json();

  return data.access_token;
}

export async function getWestpacTransactions(
  accountId: string,
  since?: Date,
  until?: Date
) {
  const accessToken = await getAccessToken();

  async function load(next: string | undefined) {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
      },
    };

    const params: Record<string, string> = {
      limit: "500",
      filter: "transaction.status.eq('posted')",
    };

    if (since) {
      params.filter += `,transaction.postDate.gteq('${
        since.toISOString().split(".")[0] + "Z"
      }')`;
    }

    if (until) {
      params.filter += `,transaction.postDate.lt('${
        until.toISOString().split(".")[0] + "Z"
      }')`;
    }

    if (next) {
      params["next"] = next;
    }

    const query = new URLSearchParams(params);

    const url = `${baseUrl}/users/${
      process.env.BASIQ_USER_ID
    }/transactions?${query.toString()}`;

    const res = await fetch(url, options);

    const content: {
      data: WestpacTransaction[];
      links: { next?: string };
    } = await res.json();

    return content;
  }

  let next = undefined;
  const westpacTransactions: WestpacTransaction[] = [];

  do {
    const content = await load(next);
    westpacTransactions.push(...content.data);
    next = content.links.next
      ? (new URL(content.links.next).searchParams.get("next") ?? undefined)
      : undefined;
  } while (next);

  let tmpTransactions = westpacTransactions.map((x) => ({
    ...x,
    amount: Math.round(Number(x.amount)) * 100,
    balance: x.balance ? Math.round(Number(x.balance) * 100) : null,
    transactionDate: new Date(x.transactionDate),
    postDate: x.postDate ? new Date(x.postDate) : null,
  }));

  tmpTransactions = tmpTransactions.filter((x) => {
    if (!x.postDate) return false;
    return x.postDate < new Date("2025-11-01") && x.status === "posted";
  });

  return tmpTransactions.map((t) => {
    return {
      id: t.id,
      accountId,
      date: t.transactionDate,
      description: t.description,
      amount: Math.abs(t.amount),
      type: t.amount > 0 ? "income" : "expense",
    };
  }) satisfies Transaction[];
}
