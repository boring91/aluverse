import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createProjectPaymentWithProjectIdSchema,
  listProjectItemSchema,
  updateProjectPaymentSchema,
} from "../schemas/project-items.shared-schema";
import { listProjectPaymentsQuery } from "../queries/list-project-payments.query";
import { getProjectPaymentByIdQuery } from "../queries/get-project-payment-by-id.query";
import { createProjectPaymentMutation } from "../mutations/create-project-payment.mutation";
import { updateProjectPaymentMutation } from "../mutations/update-project-payment.mutation";
import { deleteProjectPaymentMutation } from "../mutations/delete-project-payment.mutation";

export const projectPaymentsRouter = createTRPCRouter({
  list: permissionProcedure("projectItems.read")
    .input(listProjectItemSchema)
    .query(async ({ input }) => {
      return await listProjectPaymentsQuery(input);
    }),

  get: permissionProcedure("projectItems.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getProjectPaymentByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("projectItems.create")
    .input(
      createProjectPaymentWithProjectIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await createProjectPaymentMutation(input);
    }),

  update: permissionProcedure("projectItems.update")
    .input(
      updateProjectPaymentSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await updateProjectPaymentMutation(input);
    }),

  delete: permissionProcedure("projectItems.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectPaymentMutation(input.id);
    }),
});
