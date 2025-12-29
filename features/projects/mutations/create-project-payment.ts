import { z } from "zod";
import { db } from "@/db";
import { createProjectPaymentWithProjectIdSchema } from "../schemas/project-item.schema";

export async function createProjectPayment(
    data: z.infer<typeof createProjectPaymentWithProjectIdSchema>
) {
    return await db
        .insertInto("projectPayments")
        .values(data)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
