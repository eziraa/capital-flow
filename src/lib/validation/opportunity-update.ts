import { z } from "zod";

export const opportunityUpdateSchema = z.object({
  id: z.string().min(1, "Missing opportunity ID"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  tags: z.array(z.string()).optional(),
  deadline: z.string().optional().nullable(),
});

export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;
