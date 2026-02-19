'use client';

import { useState } from 'react';

type CommentNode = {
  _id: string;
  content: string;
  author?: { name: string };
  createdAt: string;
  replies?: CommentNode[];
};

export default function CommentThread({ comments, postId }: { comments: CommentNode[]; postId: string }) {
  const [value, setValue] = useState('');

  async function submitComment(parentCommentId?: string) {
    const content = parentCommentId ? prompt('Reply') : value;
    if (!content) return;

    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content, parentCommentId })
    });

    if (response.ok) window.location.reload();
  }

  const renderNode = (comment: CommentNode, depth = 0): JSX.Element => (
    <div key={comment._id} className="space-y-2" style={{ marginLeft: depth * 16 }}>
      <div className="rounded-lg border p-2">
        <p className="text-xs text-slate-500">{comment.author?.name} · {new Date(comment.createdAt).toLocaleString()}</p>
        <p>{comment.content}</p>
        <button className="text-xs text-brand-600" onClick={() => submitComment(comment._id)}>Reply</button>
      </div>
      {comment.replies?.map((reply) => renderNode(reply, depth + 1))}
    </div>
  );

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold">Comments</h2>
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border p-2" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add comment" />
        <button className="rounded-lg border px-3" onClick={() => submitComment()}>Send</button>
      </div>
      <div className="space-y-2">{comments.map((comment) => renderNode(comment))}</div>
    </div>
  );
}
