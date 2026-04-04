import { z } from "zod";

export const pendingGstSchema = z.object({
  from: z.date(),
  to: z.date(),
});

export type PendingGstInput = z.infer<typeof pendingGstSchema>;
