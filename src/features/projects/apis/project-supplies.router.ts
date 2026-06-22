import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createProjectSupplyWithProjectIdSchema,
  listProjectItemSchema,
  updateProjectSupplySchema,
} from "../schemas/project-items.shared-schema";
import { listProjectSuppliesQuery } from "../queries/list-project-supplies.query";
import { getProjectSupplyByIdQuery } from "../queries/get-project-supply-by-id.query";
import { createProjectSupplyMutation } from "../mutations/create-project-supply.mutation";
import { updateProjectSupplyMutation } from "../mutations/update-project-supply.mutation";
import { deleteProjectSupplyMutation } from "../mutations/delete-project-supply.mutation";

export const projectSuppliesRouter = createTRPCRouter({
  list: permissionProcedure("projectItems.read")
    .input(listProjectItemSchema)
    .query(async ({ input }) => {
      return await listProjectSuppliesQuery(input);
    }),

  get: permissionProcedure("projectItems.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getProjectSupplyByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("projectItems.create")
    .input(
      createProjectSupplyWithProjectIdSchema.transform((v) => ({
        ...v,
        unitPrice: Math.round(v.unitPrice * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await createProjectSupplyMutation(input);
    }),

  update: permissionProcedure("projectItems.update")
    .input(
      updateProjectSupplySchema.transform((v) => ({
        ...v,
        unitPrice: Math.round(v.unitPrice * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await updateProjectSupplyMutation(input);
    }),

  delete: permissionProcedure("projectItems.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectSupplyMutation(input.id);
    }),
});
