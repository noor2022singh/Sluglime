'use client';

import Link from 'next/link';
import { useState } from 'react';

type Props = {
  post: any;
  currentUserId?: string;
};

export default function PostCard({ post, currentUserId }: Props) {
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(post.likes?.some((id: string) => id === currentUserId));

  async function toggleLike() {
    const response = await fetch(`/api/posts/${post._id}/like`, { method: 'PATCH' });
    if (!response.ok) return;
    const data = await response.json();
    setLiked(data.liked);
    setLikesCount(data.likesCount);
  }

  return (
    <article className="card space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{post.author?.name} · {post.author?.role}</span>
        <span>{new Date(post.createdAt).toLocaleString()}</span>
      </div>
      <p className="whitespace-pre-wrap">{post.content}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {post.files?.map((file: any) => (
          <a key={file.publicId} href={file.url} target="_blank" className="rounded-xl border p-3 text-sm hover:bg-slate-50">
            {file.fileType === 'image' ? '🖼️' : '📄'} {file.fileName}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm">
        <button onClick={toggleLike} className="rounded-lg border px-3 py-1.5">{liked ? 'Unlike' : 'Like'} ({likesCount})</button>
        <Link href={`/post/${post._id}`} className="text-brand-600">View thread</Link>
      </div>
    </article>
  );
}
