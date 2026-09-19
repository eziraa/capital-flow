import type {
  Activity,
  ActivityType,
  Comment,
  Currency,
  Opportunity,
  Stage,
  User,
} from "@prisma/client";

type UserRef = { id: string; name: string };

export type OpportunityListItem = {
  id: string;
  companyName: string;
  requestedAmount: number;
  currency: Currency;
  stage: Stage;
  submissionDate: Date;
  archivedAt: Date | null;
  reviewer: UserRef | null;
};

export type OpportunityDetail = OpportunityListItem & {
  description: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserRef;
};

export type CommentDTO = {
  id: string;
  body: string;
  createdAt: Date;
  author: UserRef;
};

export type ActivityDTO = {
  id: string;
  type: ActivityType;
  createdAt: Date;
  actor: UserRef;
  previousStage: Stage | null;
  newStage: Stage | null;
  previousReviewer: UserRef | null;
  newReviewer: UserRef | null;
  comment: { id: string; body: string } | null;
};

function toUserRef(user: User): UserRef {
  return { id: user.id, name: user.name };
}

export function toOpportunityListItem(
  opportunity: Opportunity & { reviewer: User | null },
): OpportunityListItem {
  return {
    id: opportunity.id,
    companyName: opportunity.companyName,
    requestedAmount: opportunity.requestedAmount.toNumber(),
    currency: opportunity.currency,
    stage: opportunity.stage,
    submissionDate: opportunity.submissionDate,
    archivedAt: opportunity.archivedAt,
    reviewer: opportunity.reviewer ? toUserRef(opportunity.reviewer) : null,
  };
}

export function toOpportunityDetail(
  opportunity: Opportunity & { reviewer: User | null; createdBy: User },
): OpportunityDetail {
  return {
    ...toOpportunityListItem(opportunity),
    description: opportunity.description,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
    createdBy: toUserRef(opportunity.createdBy),
  };
}

export function toCommentDTO(comment: Comment & { author: User }): CommentDTO {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    author: toUserRef(comment.author),
  };
}

export function toActivityDTO(
  activity: Activity & {
    actor: User;
    previousReviewer: User | null;
    newReviewer: User | null;
    comment: Comment | null;
  },
): ActivityDTO {
  return {
    id: activity.id,
    type: activity.type,
    createdAt: activity.createdAt,
    actor: toUserRef(activity.actor),
    previousStage: activity.previousStage,
    newStage: activity.newStage,
    previousReviewer: activity.previousReviewer ? toUserRef(activity.previousReviewer) : null,
    newReviewer: activity.newReviewer ? toUserRef(activity.newReviewer) : null,
    comment: activity.comment ? { id: activity.comment.id, body: activity.comment.body } : null,
  };
}
