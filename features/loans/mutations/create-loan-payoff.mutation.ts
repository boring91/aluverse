import { z } from "zod";
import { db } from "@/db";
import { createLoanPayoffWithLoanIdSchema } from "../schemas/loan-payoffs.shared-schema";

export async function createLoanPayoffMutation(
  data: z.infer<typeof createLoanPayoffWithLoanIdSchema>
) {
  return await db
    .insertInto("loanPayoffs")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
