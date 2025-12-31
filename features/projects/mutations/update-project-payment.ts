import { z } from "zod";
import { db } from "@/db";
import { updateProjectPaymentSchema } from "../schemas/project-items.schema";

export async function updateProjectPayment(
    data: z.infer<typeof updateProjectPaymentSchema>
) {
    return await db
        .updateTable("projectPayments")
        .set(data)
        .where("id", "=", data.id)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
