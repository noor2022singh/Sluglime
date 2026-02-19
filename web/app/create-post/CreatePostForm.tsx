'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createPostAction } from '@/app/actions/postActions';

const initialState: { error?: string; success?: boolean } = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-lg bg-brand-600 px-4 py-2 text-white">{pending ? 'Posting...' : 'Publish'}</button>;
}

export default function CreatePostForm() {
  const [state, formAction] = useFormState(createPostAction as any, initialState);

  return (
    <form action={formAction} className="card space-y-3" encType="multipart/form-data">
      <h1 className="text-2xl font-semibold">Create Post</h1>
      <textarea name="content" required className="min-h-28 w-full rounded-lg border p-2" placeholder="Share update with your college community" />
      <label className="block text-sm">Attach images/PDFs
        <input type="file" name="files" multiple accept="image/*,.pdf" className="mt-1 w-full" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublic" value="true" /> Mark as public
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">Posted successfully.</p>}
      <SubmitButton />
    </form>
  );
}
