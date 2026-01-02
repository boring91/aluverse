import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { dashboardDateRangeSchema } from "../schemas/dashboard.schema";
import { getGeneralOverview } from "../queries/get-general-overview";

export const dashboardRouter = createTRPCRouter({
  generalOverview: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getGeneralOverview(input);
    }),
});
