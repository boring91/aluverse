import { z } from "zod";
import { updateLoanSchema } from "../schemas/loan.schemas";
import { db } from "@/db";

export async function updateLoan(data: z.infer<typeof updateLoanSchema>) {
  return await db
    .updateTable("loans")
    .set(data)
    .where("id", "=", data.id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
