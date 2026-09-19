import { Stage } from "@prisma/client";
import { z } from "zod";

export const PAGE_SIZE = 10;

export const STAGE_FILTER_VALUES = ["ALL", ...Object.values(Stage)] as const;
export const ARCHIVED_FILTER_VALUES = ["ACTIVE", "ARCHIVED", "ALL"] as const;
export const SORT_FIELD_VALUES = ["submissionDate", "requestedAmount"] as const;
export const SORT_DIR_VALUES = ["asc", "desc"] as const;

/**
 * The opportunities list's server-side query state. This is the validated
 * shape produced from URL search params — never trust them directly in a
 * Prisma query. Unrecognized or malformed values fall back to sane defaults
 * instead of erroring, since a stale or hand-edited URL should still render
 * a usable page.
 */
export const opportunityListQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .catch(undefined)
    .transform((v) => v ?? ""),
  stage: z.enum(STAGE_FILTER_VALUES).catch("ALL"),
  archived: z.enum(ARCHIVED_FILTER_VALUES).catch("ACTIVE"),
  sort: z.enum(SORT_FIELD_VALUES).catch("submissionDate"),
  dir: z.enum(SORT_DIR_VALUES).catch("desc"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type OpportunityListQuery = z.infer<typeof opportunityListQuerySchema>;

/** Parses raw `URLSearchParams`-like input into a validated list query. */
export function parseOpportunityListQuery(
  raw: Record<string, string | string[] | undefined>,
): OpportunityListQuery {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }

  return opportunityListQuerySchema.parse(flat);
}
