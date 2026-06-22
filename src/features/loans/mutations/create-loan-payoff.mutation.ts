import type { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import type { createLoanPayoffWithLoanIdSchema } from "../schemas/loan-payoffs.shared-schema";
import { getLoanPayoffAmountSignError } from "../lib/loan-payoff-sign";

export async function createLoanPayoffMutation(
  data: z.infer<typeof createLoanPayoffWithLoanIdSchema>,
) {
  return await db.transaction().execute(async (tx) => {
    const loan = await tx
      .selectFrom("loans")
      .select("type")
      .where("id", "=", data.loanId)
      .executeTakeFirstOrThrow();

    const signError = getLoanPayoffAmountSignError(loan.type, data.amount);
    if (signError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: signError });
    }

    return await tx
      .insertInto("loanPayoffs")
      .values(data)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
