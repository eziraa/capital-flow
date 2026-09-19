"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { addCommentFormAction, editCommentFormAction, deleteCommentFormAction } from "@/actions/comments";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { fieldError, useActionFeedback } from "@/lib/use-action-feedback";
import type { CommentDTO } from "@/lib/dto";

const COMMENT_MAX = 1000;

function CommentItem({
  comment,
  canEdit,
  disabled,
  onCommentChanged,
}: {
  comment: CommentDTO;
  canEdit: boolean;
  disabled: boolean;
  onCommentChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const editFeedback = useActionFeedback(editCommentFormAction, {
    successMessage: "Comment updated.",
    onSuccess: () => {
      setEditing(false);
      onCommentChanged();
    },
  });

  const deleteFeedback = useActionFeedback(deleteCommentFormAction, {
    successMessage: "Comment deleted.",
    onSuccess: onCommentChanged,
  });

  if (editing) {
    return (
      <li className="rounded-lg bg-muted p-3">
        <form action={editFeedback.formAction} className="flex flex-col gap-3">
          <input type="hidden" name="commentId" value={comment.id} />
          <FormField id={`edit-${comment.id}`} label="Edit comment" error={fieldError(editFeedback.state, "body")}>
            <Textarea
              id={`edit-${comment.id}`}
              name="body"
              rows={3}
              defaultValue={comment.body}
              maxLength={COMMENT_MAX}
              required
              aria-invalid={!!fieldError(editFeedback.state, "body")}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-lg bg-muted p-3 group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {comment.author.name} {comment.isEdited && !comment.deletedAt && <span className="text-xs text-muted-foreground font-normal">(edited)</span>}
        </span>
        <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
      </div>
      <p className={`mt-1 whitespace-pre-wrap text-sm ${comment.deletedAt ? 'italic text-muted-foreground' : 'text-foreground'}`}>
        {comment.body}
      </p>
      {canEdit && !disabled && !comment.deletedAt && (
        <div className="mt-2 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground hover:text-primary"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <form action={deleteFeedback.formAction}>
            <input type="hidden" name="commentId" value={comment.id} />
            <button type="submit" className="text-xs font-medium text-destructive hover:underline">
              Delete
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

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
  const { data: session } = useSession();
  
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
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => {
            const canEditComment = session?.user?.role === "ADMIN" || session?.user?.id === comment.author.id;
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                canEdit={canEditComment}
                disabled={disabled}
                onCommentChanged={onCommentAdded}
              />
            );
          })}
        </ul>
      )}

      {canAddComment && !disabled ? (
        <form ref={formRef} action={formAction} className="flex flex-col gap-3 mt-2">
          <input type="hidden" name="opportunityId" value={opportunityId} />
          <FormField id="body" label="Add a comment" error={fieldError(state, "body")}>
            <Textarea
              id="body"
              name="body"
              rows={3}
              maxLength={COMMENT_MAX}
              required
              aria-invalid={!!fieldError(state, "body")}
            />
          </FormField>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Posting…">Post comment</SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
