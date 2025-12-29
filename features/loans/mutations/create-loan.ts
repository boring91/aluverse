import { z } from "zod";
import { createLoanSchema } from "../schemas/loan.schema";
import { db } from "@/db";

export async function createLoan(data: z.infer<typeof createLoanSchema>) {
    return await db
        .insertInto("loans")
        .values(data)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
