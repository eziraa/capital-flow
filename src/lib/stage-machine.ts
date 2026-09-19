import { Stage } from "@prisma/client";

/**
 * The only stage transitions the server will ever accept. This is the single
 * source of truth for the workflow — it is never exposed to the client as an
 * authority, only used to render which actions currently make sense.
 */
const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
  DRAFT: [Stage.UNDER_REVIEW],
  UNDER_REVIEW: [Stage.APPROVED, Stage.REJECTED],
  APPROVED: [],
  REJECTED: [],
};

export function canTransition(from: Stage, to: Stage): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function allowedNextStages(from: Stage): Stage[] {
  return ALLOWED_TRANSITIONS[from];
}
