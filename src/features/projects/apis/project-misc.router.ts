import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createProjectMiscWithProjectIdSchema,
  listProjectItemSchema,
  updateProjectMiscSchema,
} from "../schemas/project-items.shared-schema";
import { listProjectMiscQuery } from "../queries/list-project-misc.query";
import { getProjectMiscByIdQuery } from "../queries/get-project-misc-by-id.query";
import { createProjectMiscMutation } from "../mutations/create-project-misc.mutation";
import { updateProjectMiscMutation } from "../mutations/update-project-misc.mutation";
import { deleteProjectMiscMutation } from "../mutations/delete-project-misc.mutation";

export const projectMiscRouter = createTRPCRouter({
  list: permissionProcedure("projectItems.read")
    .input(listProjectItemSchema)
    .query(async ({ input }) => {
      return await listProjectMiscQuery(input);
    }),

  get: permissionProcedure("projectItems.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getProjectMiscByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("projectItems.create")
    .input(
      createProjectMiscWithProjectIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await createProjectMiscMutation(input);
    }),

  update: permissionProcedure("projectItems.update")
    .input(
      updateProjectMiscSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await updateProjectMiscMutation(input);
    }),

  delete: permissionProcedure("projectItems.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectMiscMutation(input.id);
    }),
});
