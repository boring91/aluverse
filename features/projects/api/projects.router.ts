import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createProjectSchema,
  listProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.shared-schema";
import { listProjectsQuery } from "../queries/list-projects.query";
import { getProjectByIdQuery } from "../queries/get-project-by-id.query";
import { createProjectMutation } from "../mutations/create-project.mutation";
import { updateProjectMutation } from "../mutations/update-project.mutation";
import { deleteProjectMutation } from "../mutations/delete-project.mutation";
import { getBudgetUnitValueQuery } from "../queries/get-budget-unit-value.query";

export const projectsRouter = createTRPCRouter({
  getBudgetUnitValue: permissionProcedure("projects.read").query(async () => {
    return await getBudgetUnitValueQuery();
  }),

  list: permissionProcedure("projects.read")
    .input(listProjectSchema)
    .query(async ({ input }) => {
      return await listProjectsQuery(input);
    }),

  get: permissionProcedure("projects.read")
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await getProjectByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("projects.create")
    .input(
      createProjectSchema.transform((v) => ({
        ...v,
        price: Math.round(v.price * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await createProjectMutation(input);
    }),

  update: permissionProcedure("projects.update")
    .input(
      updateProjectSchema.transform((v) => ({
        ...v,
        price: Math.round(v.price * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await updateProjectMutation(input);
    }),

  delete: permissionProcedure("projects.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectMutation(input.id);
    }),
});
