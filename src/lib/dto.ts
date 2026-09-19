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

export type OpportunityDTO = {
  id: string;
  companyName: string;
  requestedAmount: number;
  currency: Currency;
  submissionDate: Date;
  stage: Stage;
  description: string;
  reviewer: UserRef | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  tags: string[];
  deadline: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OpportunityListItem = {
  id: string;
  companyName: string;
  requestedAmount: number;
  currency: Currency;
  stage: Stage;
  submissionDate: Date;
  priority: "LOW" | "MEDIUM" | "HIGH";
  tags: string[];
  deadline: Date | null;
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
  isEdited: boolean;
  deletedAt: Date | null;
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
  rationale: string | null;
};

function toUserRef(user: User): UserRef {
  return { id: user.id, name: user.name };
}

export function toOpportunityDTO(
  model: Opportunity & { reviewer: User | null },
): OpportunityDTO {
  return {
    id: model.id,
    companyName: model.companyName,
    requestedAmount: model.requestedAmount.toNumber(),
    currency: model.currency,
    submissionDate: model.submissionDate,
    stage: model.stage,
    description: model.description,
    reviewer: model.reviewer ? toUserRef(model.reviewer) : null,
    priority: model.priority,
    tags: model.tags,
    deadline: model.deadline,
    archivedAt: model.archivedAt,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
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
    priority: opportunity.priority,
    tags: opportunity.tags,
    deadline: opportunity.deadline,
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

export function toCommentDTO(model: Comment & { author: User }): CommentDTO {
  return {
    id: model.id,
    body: model.body,
    createdAt: model.createdAt,
    author: toUserRef(model.author),
    isEdited: model.isEdited,
    deletedAt: model.deletedAt,
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
    rationale: activity.rationale ?? null,
  };
}
