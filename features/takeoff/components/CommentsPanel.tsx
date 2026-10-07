'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TakeoffComment } from '@/types/takeoff';

interface CommentsPanelProps {
  comments: TakeoffComment[];
  canEdit: boolean;
  measurementId: string | null;
  onAdd: (body: string, parentId?: string | null) => void;
  onToggleResolved: (commentId: string, isResolved: boolean) => void;
}

export function CommentsPanel({
  comments,
  canEdit,
  measurementId,
  onAdd,
  onToggleResolved,
}: CommentsPanelProps): React.JSX.Element {
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const roots = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) =>
    comments.filter((c) => c.parent_id === id);

  return (
    <div className="border-t">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Comments
        {!measurementId ? (
          <span className="ml-1 font-normal normal-case">
            (select a measurement)
          </span>
        ) : null}
      </p>
      <div className="max-h-40 space-y-2 overflow-y-auto px-3 pb-2">
        {roots.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No comments yet.</p>
        ) : (
          roots.map((c) => (
            <div key={c.id} className="space-y-1">
              <CommentCard
                comment={c}
                canEdit={canEdit}
                onReply={() => setReplyTo(c.id)}
                onToggleResolved={onToggleResolved}
              />
              {repliesOf(c.id).map((r) => (
                <div key={r.id} className="ml-3 border-l pl-2">
                  <CommentCard
                    comment={r}
                    canEdit={canEdit}
                    onToggleResolved={onToggleResolved}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      {canEdit && measurementId ? (
        <div className="space-y-1 border-t px-3 py-2">
          {replyTo ? (
            <p className="text-[10px] text-muted-foreground">
              Replying…
              <button
                type="button"
                className="ml-1 underline"
                onClick={() => setReplyTo(null)}
              >
                cancel
              </button>
            </p>
          ) : null}
          <textarea
            className="min-h-[52px] w-full rounded-md border bg-background px-2 py-1 text-xs"
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            className="h-7 w-full text-xs"
            disabled={!body.trim()}
            onClick={() => {
              onAdd(body.trim(), replyTo);
              setBody('');
              setReplyTo(null);
            }}
          >
            {replyTo ? 'Reply' : 'Comment'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CommentCard({
  comment,
  canEdit,
  onReply,
  onToggleResolved,
}: {
  comment: TakeoffComment;
  canEdit: boolean;
  onReply?: () => void;
  onToggleResolved: (id: string, resolved: boolean) => void;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-md border px-2 py-1.5 text-[11px]',
        comment.is_resolved && 'bg-muted/40 opacity-70'
      )}
    >
      <p className="whitespace-pre-wrap">{comment.body}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {comment.created_by_name ?? 'User'} ·{' '}
        {new Date(comment.created_at).toLocaleString()}
        {comment.is_resolved ? ' · Resolved' : ' · Unresolved'}
      </p>
      {canEdit ? (
        <div className="mt-1 flex gap-2">
          {onReply && !comment.parent_id ? (
            <button
              type="button"
              className="text-[10px] underline"
              onClick={onReply}
            >
              Reply
            </button>
          ) : null}
          <button
            type="button"
            className="text-[10px] underline"
            onClick={() =>
              onToggleResolved(comment.id, !comment.is_resolved)
            }
          >
            {comment.is_resolved ? 'Unresolved' : 'Resolve'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
