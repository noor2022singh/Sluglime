'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getServerBaseUrl } from '@/lib/server-url';

type ActionState = { error?: string; success?: boolean };

export async function createPostAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const token = cookies().get('token')?.value;
  if (!token) {
    return { error: 'Unauthorized' };
  }

  try {
    const response = await fetch(`${getServerBaseUrl()}/api/posts`, {
      method: 'POST',
      headers: { Cookie: `token=${token}` },
      body: formData,
      cache: 'no-store'
    });

    if (!response.ok) {
      const data = await response.json();
      return { error: data.message || 'Failed to create post' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/public');
    return { success: true };
  } catch {
    return { error: 'Failed to create post' };
  }
}

export async function addCommentAction(payload: { postId: string; content: string; parentCommentId?: string }) {
  const token = cookies().get('token')?.value;
  if (!token) return { error: 'Unauthorized' };

  const response = await fetch(`${getServerBaseUrl()}/api/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `token=${token}`
    },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  if (!response.ok) {
    const data = await response.json();
    return { error: data.message || 'Failed to comment' };
  }

  revalidatePath(`/post/${payload.postId}`);
  return { success: true };
}
