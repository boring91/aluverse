import { z } from "zod";
import { db } from "@/db";
import { createLoanPayoffWithLoanIdSchema } from "../schemas/loan-payoff.schema";

export async function createLoanPayoff(
    data: z.infer<typeof createLoanPayoffWithLoanIdSchema>
) {
    return await db
        .insertInto("loanPayoffs")
        .values(data)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
