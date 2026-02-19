import { redirect } from 'next/navigation';
import CreatePostForm from './CreatePostForm';
import { getSessionUser } from '@/lib/session';

export default async function CreatePostPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return <CreatePostForm />;
}
