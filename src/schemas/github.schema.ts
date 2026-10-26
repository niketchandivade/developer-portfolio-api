import { z } from "zod";

export const githubQuerySchema = z.object({
  language: z.string().trim().min(1).optional(),
  excludeForks: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});