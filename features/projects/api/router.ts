import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { ProjectService } from "../services/project.service";
import { ProjectItemService } from "../services/project-item.service";
import {
    createProjectSchema,
    updateProjectSchema,
} from "../schemas/project.schema";
import {
    updateProjectSupplySchema,
    updateProjectLaborSchema,
    updateProjectMiscSchema,
    updateProjectPaymentSchema,
    listProjectItemSchema,
    createProjectSupplySchemaWithProjectId,
    createProjectLaborSchemaWithProjectId,
    createProjectMiscSchemaWithProjectId,
    createProjectPaymentSchemaWithProjectId,
} from "../schemas/project-item.schema";
import { listSchema } from "@/shared/lib/schemas/util-schemas";

const projectService = new ProjectService();
const projectItemService = new ProjectItemService();

export const projectsRouter = createTRPCRouter({
    list: protectedProcedure.input(listSchema).query(async ({ input }) => {
        return await projectService.list(input);
    }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return await projectService.get(input.id);
        }),

    create: protectedProcedure
        .input(
            createProjectSchema.transform(v => ({
                ...v,
                price: v.price * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectService.create(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectSchema.transform(v => ({
                ...v,
                price: v.price * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectService.update(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await projectService.delete(input.id);
        }),
});

export const projectSuppliesRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listProjectItemSchema)
        .query(async ({ input }) => {
            return await projectItemService.listSupplies(input);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            return await projectItemService.getSupply(input.id);
        }),

    create: protectedProcedure
        .input(
            createProjectSupplySchemaWithProjectId.transform(v => ({
                ...v,
                unitPrice: v.unitPrice * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectItemService.createSupply(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectSupplySchema.transform(v => ({
                ...v,
                unitPrice: v.unitPrice * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectItemService.updateSupply(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await projectItemService.deleteSupply(input.id);
        }),
});

export const projectLaborsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listProjectItemSchema)
        .query(async ({ input }) => {
            return await projectItemService.listLabors(input);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            return await projectItemService.getLabor(input.id);
        }),

    create: protectedProcedure
        .input(
            createProjectLaborSchemaWithProjectId.transform(v => ({
                ...v,
                rate: v.rate * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectItemService.createLabor(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectLaborSchema.transform(v => ({
                ...v,
                rate: v.rate * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectItemService.updateLabor(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await projectItemService.deleteLabor(input.id);
        }),
});

export const projectMiscRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listProjectItemSchema)
        .query(async ({ input }) => {
            return await projectItemService.listMisc(input);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            return await projectItemService.getMisc(input.id);
        }),

    create: protectedProcedure
        .input(
            createProjectMiscSchemaWithProjectId.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectItemService.createMisc(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectMiscSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectItemService.updateMisc(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await projectItemService.deleteMisc(input.id);
        }),
});

export const projectPaymentsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listProjectItemSchema)
        .query(async ({ input }) => {
            return await projectItemService.listPayments(input);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            return await projectItemService.getPayment(input.id);
        }),

    create: protectedProcedure
        .input(
            createProjectPaymentSchemaWithProjectId.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectItemService.createPayment(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectPaymentSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await projectItemService.updatePayment(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await projectItemService.deletePayment(input.id);
        }),
});
