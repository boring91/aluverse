import { z } from "zod";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.schema";
import {
  updateProjectSupplySchema,
  updateProjectLaborSchema,
  updateProjectMiscSchema,
  updateProjectPaymentSchema,
  listProjectItemSchema,
  createProjectSupplyWithProjectIdSchema,
  createProjectLaborWithProjectIdSchema,
  createProjectMiscWithProjectIdSchema,
  createProjectPaymentWithProjectIdSchema,
} from "../schemas/project-items.schema";
import { listProjectSchema } from "../schemas/projects.schema";
import { listProjects } from "../queries/list-projects";
import { getProjectById } from "../queries/get-project-by-id";
import { listProjectSupplies } from "../queries/list-project-supplies";
import { getProjectSupplyById } from "../queries/get-project-supply-by-id";
import { createProject } from "../mutations/create-project";
import { updateProject } from "../mutations/update-project";
import { deleteProject } from "../mutations/delete-project";
import { createProjectSupply } from "../mutations/create-project-supply";
import { updateProjectSupply } from "../mutations/update-project-supply";
import { deleteProjectSupply } from "../mutations/delete-project-supply";
import { listProjectLabors } from "../queries/list-project-labors";
import { getProjectLaborById } from "../queries/get-project-labor-by-id";
import { createProjectLabor } from "../mutations/create-project-labor";
import { createProjectMisc } from "../mutations/create-project-misc";
import { createProjectPayment } from "../mutations/create-project-payment";
import { deleteProjectLabor } from "../mutations/delete-project-labor";
import { deleteProjectMisc } from "../mutations/delete-project-misc";
import { deleteProjectPayment } from "../mutations/delete-project-payment";
import { updateProjectLabor } from "../mutations/update-project-labor";
import { updateProjectMisc } from "../mutations/update-project-misc";
import { updateProjectPayment } from "../mutations/update-project-payment";
import { listProjectMisc } from "../queries/list-project-misc";
import { listProjectPayments } from "../queries/list-project-payments";
import { getProjectMiscById } from "../queries/get-project-misc-by-id";
import { getProjectPaymentById } from "../queries/get-project-payment-by-id";
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
  list: permissionProcedure("projects.read")
    .input(listProjectSchema)
    .query(async ({ input }) => {
      return await listProjects(input);
    }),

  get: permissionProcedure("projects.read")
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await getProjectById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return item;
    }),

  create: permissionProcedure("projects.create")
    .input(
      createProjectSchema.transform((v) => ({
        ...v,
        price: Math.round(v.price * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createProject(input);
    }),

  update: permissionProcedure("projects.update")
    .input(
      updateProjectSchema.transform((v) => ({
        ...v,
        price: Math.round(v.price * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateProject(input);
    }),

  delete: permissionProcedure("projects.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProject(input.id);
    }),
});

export const projectSuppliesRouter = createTRPCRouter({
  list: permissionProcedure("projectItems.read")
    .input(listProjectItemSchema)
    .query(async ({ input }) => {
      return await listProjectSupplies(input);
    }),

  get: permissionProcedure("projectItems.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getProjectSupplyById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return item;
    }),

  create: permissionProcedure("projectItems.create")
    .input(
      createProjectSupplyWithProjectIdSchema.transform((v) => ({
        ...v,
        unitPrice: Math.round(v.unitPrice * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createProjectSupply(input);
    }),

  update: permissionProcedure("projectItems.update")
    .input(
      updateProjectSupplySchema.transform((v) => ({
        ...v,
        unitPrice: Math.round(v.unitPrice * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateProjectSupply(input);
    }),

  delete: permissionProcedure("projectItems.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectSupply(input.id);
    }),
});

export const projectLaborsRouter = createTRPCRouter({
  list: permissionProcedure("projectItems.read")
    .input(listProjectItemSchema)
    .query(async ({ input }) => {
      return await listProjectLabors(input);
    }),

  get: permissionProcedure("projectItems.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getProjectLaborById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return item;
    }),

  create: permissionProcedure("projectItems.create")
    .input(
      createProjectLaborWithProjectIdSchema.transform((v) => ({
        ...v,
        rate: Math.round(v.rate * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createProjectLabor(input);
    }),

  update: permissionProcedure("projectItems.update")
    .input(
      updateProjectLaborSchema.transform((v) => ({
        ...v,
        rate: Math.round(v.rate * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateProjectLabor(input);
    }),

  delete: permissionProcedure("projectItems.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectLabor(input.id);
    }),
});

export const projectMiscRouter = createTRPCRouter({
  list: permissionProcedure("projectItems.read")
    .input(listProjectItemSchema)
    .query(async ({ input }) => {
      return await listProjectMisc(input);
    }),

  get: permissionProcedure("projectItems.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getProjectMiscById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return item;
    }),

  create: permissionProcedure("projectItems.create")
    .input(
      createProjectMiscWithProjectIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createProjectMisc(input);
    }),

  update: permissionProcedure("projectItems.update")
    .input(
      updateProjectMiscSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateProjectMisc(input);
    }),

  delete: permissionProcedure("projectItems.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectMisc(input.id);
    }),
});

export const projectPaymentsRouter = createTRPCRouter({
  list: permissionProcedure("projectItems.read")
    .input(listProjectItemSchema)
    .query(async ({ input }) => {
      return await listProjectPayments(input);
    }),

  get: permissionProcedure("projectItems.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getProjectPaymentById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return item;
    }),

  create: permissionProcedure("projectItems.create")
    .input(
      createProjectPaymentWithProjectIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createProjectPayment(input);
    }),

  update: permissionProcedure("projectItems.update")
    .input(
      updateProjectPaymentSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateProjectPayment(input);
    }),

  delete: permissionProcedure("projectItems.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteProjectPayment(input.id);
    }),
});
