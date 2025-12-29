import { z } from "zod";
import { db } from "@/db";
import { updateLoanPayoffSchema } from "../schemas/loan-payoff.schema";

export async function updateLoanPayoff(
    data: z.infer<typeof updateLoanPayoffSchema>
) {
    return await db
        .updateTable("loanPayoffs")
        .set(data)
        .where("id", "=", data.id)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
