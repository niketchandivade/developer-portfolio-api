import { z } from "zod";

export const projectQuerySchema = z.object({
  technology: z.string().trim().min(1).optional(),
});