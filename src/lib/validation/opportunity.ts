import { Currency } from "@prisma/client";
import { z } from "zod";

const companyName = z
  .string()
  .trim()
  .min(1, "Company name is required")
  .max(200, "Company name must be 200 characters or fewer");

const requestedAmount = z.coerce
  .number({ error: "Requested amount must be a number" })
  .positive("Requested amount must be greater than zero")
  .finite("Requested amount must be a valid number");

const currency = z.enum(Currency, { error: "Select a supported currency" });

const description = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(500, "Description must be 500 characters or fewer");

const submissionDate = z.coerce.date({ error: "Submission date must be a valid date" });

export const createOpportunitySchema = z.object({
  companyName,
  requestedAmount,
  currency,
  description,
  submissionDate,
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export const updateOpportunitySchema = createOpportunitySchema.extend({
  id: z.string().min(1, "Missing opportunity id"),
});

export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;

export const assignReviewerSchema = z.object({
  opportunityId: z.string().min(1, "Missing opportunity id"),
  reviewerId: z.union([z.string().min(1), z.null()]),
});

export type AssignReviewerInput = z.infer<typeof assignReviewerSchema>;

export const changeStageSchema = z.object({
  opportunityId: z.string().min(1, "Missing opportunity id"),
  stage: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED"], {
    error: "Select a valid stage",
  }),
});

export type ChangeStageInput = z.infer<typeof changeStageSchema>;

export const archiveOpportunitySchema = z.object({
  opportunityId: z.string().min(1, "Missing opportunity id"),
});

export type ArchiveOpportunityInput = z.infer<typeof archiveOpportunitySchema>;
