import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  pendingGstSchema,
  createGstPaymentSchema,
  updateGstPaymentSchema,
  listGstPaymentSchema,
} from "../schemas/gst.shared-schema";
import { getPendingGstQuery } from "../queries/get-pending-gst.query";
import { listGstPaymentsQuery } from "../queries/list-gst-payments.query";
import { getGstPaymentByIdQuery } from "../queries/get-gst-payment-by-id.query";
import { createGstPaymentMutation } from "../mutations/create-gst-payment.mutation";
import { updateGstPaymentMutation } from "../mutations/update-gst-payment.mutation";
import { deleteGstPaymentMutation } from "../mutations/delete-gst-payment.mutation";

export const gstRouter = createTRPCRouter({
  pendingGst: permissionProcedure("reconciliations.read")
    .input(pendingGstSchema)
    .query(async ({ input }) => {
      return await getPendingGstQuery(input);
    }),

  listPayments: permissionProcedure("gst.read")
    .input(listGstPaymentSchema)
    .query(async ({ input }) => {
      return await listGstPaymentsQuery(input);
    }),

  getPayment: permissionProcedure("gst.read")
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await getGstPaymentByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  createPayment: permissionProcedure("gst.create")
    .input(
      createGstPaymentSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await createGstPaymentMutation(input);
    }),

  updatePayment: permissionProcedure("gst.update")
    .input(
      updateGstPaymentSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await updateGstPaymentMutation(input);
    }),

  deletePayment: permissionProcedure("gst.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteGstPaymentMutation(input.id);
    }),
});
