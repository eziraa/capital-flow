"use client";

import { useRef } from "react";

import { addCommentFormAction } from "@/actions/comments";
import { Field, inputClassName } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatDateTime } from "@/lib/format";
import { fieldError, useActionFeedback } from "@/lib/use-action-feedback";
import type { CommentDTO } from "@/lib/dto";

const COMMENT_MAX = 1000;

export function CommentsSection({
  opportunityId,
  comments,
  canAddComment,
  disabled,
  onCommentAdded,
}: {
  opportunityId: string;
  comments: CommentDTO[];
  canAddComment: boolean;
  disabled: boolean;
  onCommentAdded: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, formAction } = useActionFeedback(addCommentFormAction, {
    successMessage: "Comment added.",
    onSuccess: () => {
      formRef.current?.reset();
      onCommentAdded();
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-md border border-border bg-bg p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-fg">{comment.author.name}</span>
                <span className="text-xs text-muted">{formatDateTime(comment.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-fg">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {canAddComment && !disabled ? (
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="opportunityId" value={opportunityId} />
          <Field id="body" label="Add a comment" error={fieldError(state, "body")}>
            <textarea
              id="body"
              name="body"
              rows={3}
              maxLength={COMMENT_MAX}
              required
              className={inputClassName(!!fieldError(state, "body"))}
            />
          </Field>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Posting…">Post comment</SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
