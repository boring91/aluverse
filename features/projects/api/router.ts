import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
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
    createProjectSupplyWithProjectIdSchema,
    createProjectLaborWithProjectIdSchema,
    createProjectMiscWithProjectIdSchema,
    createProjectPaymentWithProjectIdSchema,
} from "../schemas/project-item.schema";
import { listProjectSchema } from "../schemas/project.schema";
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
    list: protectedProcedure
        .input(listProjectSchema)
        .query(async ({ input }) => {
            return await listProjects(input);
        }),

    get: protectedProcedure
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

    create: protectedProcedure
        .input(
            createProjectSchema.transform(v => ({
                ...v,
                price: v.price * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await createProject(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectSchema.transform(v => ({
                ...v,
                price: v.price * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await updateProject(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await deleteProject(input.id);
        }),
});

export const projectSuppliesRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listProjectItemSchema)
        .query(async ({ input }) => {
            return await listProjectSupplies(input);
        }),

    get: protectedProcedure
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

    create: protectedProcedure
        .input(
            createProjectSupplyWithProjectIdSchema.transform(v => ({
                ...v,
                unitPrice: v.unitPrice * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await createProjectSupply(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectSupplySchema.transform(v => ({
                ...v,
                unitPrice: v.unitPrice * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await updateProjectSupply(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await deleteProjectSupply(input.id);
        }),
});

export const projectLaborsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listProjectItemSchema)
        .query(async ({ input }) => {
            return await listProjectLabors(input);
        }),

    get: protectedProcedure
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

    create: protectedProcedure
        .input(
            createProjectLaborWithProjectIdSchema.transform(v => ({
                ...v,
                rate: v.rate * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await createProjectLabor(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectLaborSchema.transform(v => ({
                ...v,
                rate: v.rate * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await updateProjectLabor(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await deleteProjectLabor(input.id);
        }),
});

export const projectMiscRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listProjectItemSchema)
        .query(async ({ input }) => {
            return await listProjectMisc(input);
        }),

    get: protectedProcedure
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

    create: protectedProcedure
        .input(
            createProjectMiscWithProjectIdSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await createProjectMisc(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectMiscSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await updateProjectMisc(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await deleteProjectMisc(input.id);
        }),
});

export const projectPaymentsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listProjectItemSchema)
        .query(async ({ input }) => {
            return await listProjectPayments(input);
        }),

    get: protectedProcedure
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

    create: protectedProcedure
        .input(
            createProjectPaymentWithProjectIdSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await createProjectPayment(input);
        }),

    update: protectedProcedure
        .input(
            updateProjectPaymentSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await updateProjectPayment(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await deleteProjectPayment(input.id);
        }),
});
