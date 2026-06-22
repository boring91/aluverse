import type { z } from "zod";
import type { createLoanSchema } from "../schemas/loans.shared-schema";
import { db } from "@/db";

export async function createLoanMutation(
  data: z.infer<typeof createLoanSchema>,
) {
  return await db
    .insertInto("loans")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
