import { listSchema } from "@/shared/lib/schemas/util-schemas";
import { z } from "zod";

export const listProjectItemSchema = listSchema.safeExtend({
  projectId: z.uuid(),
});

export const createProjectSupplySchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(1),
});

export const createProjectSupplyWithProjectIdSchema =
  createProjectSupplySchema.safeExtend({
    projectId: z.uuid(),
  });

export const createProjectLaborSchema = z.object({
  name: z.string().min(1),
  hours: z.number().min(1),
  rate: z.number().min(1),
});

export const createProjectLaborWithProjectIdSchema =
  createProjectLaborSchema.safeExtend({
    projectId: z.uuid(),
  });

export const createProjectMiscSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(1),
});

export const createProjectMiscWithProjectIdSchema =
  createProjectMiscSchema.safeExtend({
    projectId: z.uuid(),
  });

export const createProjectPaymentSchema = z.object({
  date: z.date(),
  amount: z.number(),
});

export const createProjectPaymentWithProjectIdSchema =
  createProjectPaymentSchema.safeExtend({
    projectId: z.uuid(),
  });

export const updateProjectSupplySchema = createProjectSupplySchema.safeExtend({
  id: z.uuid(),
});

export const updateProjectLaborSchema = createProjectLaborSchema.safeExtend({
  id: z.uuid(),
});

export const updateProjectMiscSchema = createProjectMiscSchema.safeExtend({
  id: z.uuid(),
});

export const updateProjectPaymentSchema = createProjectPaymentSchema.safeExtend(
  {
    id: z.uuid(),
  }
);
