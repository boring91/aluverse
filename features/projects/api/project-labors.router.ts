import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createProjectLaborWithProjectIdSchema,
  listProjectItemSchema,
  updateProjectLaborSchema,
} from "../schemas/project-items.shared-schema";
import { listProjectLaborsQuery } from "../queries/list-project-labors.query";
import { getProjectLaborByIdQuery } from "../queries/get-project-labor-by-id.query";
import { createProjectLaborMutation } from "../mutations/create-project-labor.mutation";
import { updateProjectLaborMutation } from "../mutations/update-project-labor.mutation";
import { deleteProjectLaborMutation } from "../mutations/delete-project-labor.mutation";

export const projectLaborsRouter = createTRPCRouter({
  list: permissionProcedure("projectItems.read")
    .input(listProjectItemSchema)
    .query(async ({ input }) => {
      return await listProjectLaborsQuery(input);
    }),

  get: permissionProcedure("projectItems.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getProjectLaborByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("projectItems.create")
    .input(
      createProjectLaborWithProjectIdSchema.transform((v) => ({
        ...v,
        rate: Math.round(v.rate * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await createProjectLaborMutation(input);
    }),

  update: permissionProcedure("projectItems.update")
    .input(
      updateProjectLaborSchema.transform((v) => ({
        ...v,
        rate: Math.round(v.rate * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await updateProjectLaborMutation(input);
    }),

  delete: permissionProcedure("projectItems.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectLaborMutation(input.id);
    }),
});
