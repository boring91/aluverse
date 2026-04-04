import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import { pendingGstSchema } from "../schemas/gst.shared-schema";
import { getPendingGstQuery } from "../queries/get-pending-gst.query";

export const gstRouter = createTRPCRouter({
  pendingGst: permissionProcedure("reconciliations.read")
    .input(pendingGstSchema)
    .query(async ({ input }) => {
      return await getPendingGstQuery(input);
    }),
});
