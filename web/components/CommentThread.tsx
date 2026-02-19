'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CommentNode = {
  _id: string;
  content: string;
  author?: { name: string };
  createdAt: string;
  replies?: CommentNode[];
};

export default function CommentThread({ comments, postId }: { comments: CommentNode[]; postId: string }) {
  const [value, setValue] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submitComment(content: string, parentCommentId?: string) {
    if (!content.trim()) return;
    setError('');

    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content, parentCommentId })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || 'Failed to post comment');
      return;
    }

    setValue('');
    if (parentCommentId) {
      setReplyDrafts((prev) => ({ ...prev, [parentCommentId]: '' }));
      setActiveReplyId(null);
    }
    router.refresh();
  }

  const renderNode = (comment: CommentNode, depth = 0): JSX.Element => (
    <div key={comment._id} className="space-y-2" style={{ marginLeft: depth * 16 }}>
      <div className="rounded-lg border p-2">
        <p className="text-xs text-slate-500">{comment.author?.name} · {new Date(comment.createdAt).toLocaleString()}</p>
        <p>{comment.content}</p>
        <button className="text-xs text-brand-600" onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}>
          {activeReplyId === comment._id ? 'Cancel' : 'Reply'}
        </button>
        {activeReplyId === comment._id && (
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-lg border p-2 text-sm"
              value={replyDrafts[comment._id] || ''}
              onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [comment._id]: e.target.value }))}
              placeholder="Write a reply"
            />
            <button className="rounded-lg border px-3 text-sm" onClick={() => submitComment(replyDrafts[comment._id] || '', comment._id)}>Send</button>
          </div>
        )}
      </div>
      {comment.replies?.map((reply) => renderNode(reply, depth + 1))}
    </div>
  );

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold">Comments</h2>
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border p-2" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add comment" />
        <button className="rounded-lg border px-3" onClick={() => submitComment(value)}>Send</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-2">{comments.map((comment) => renderNode(comment))}</div>
    </div>
  );
}
