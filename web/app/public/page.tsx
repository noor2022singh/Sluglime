import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import PostCard from '@/components/PostCard';
import { getSessionUser } from '@/lib/session';

export default async function PublicPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await getSessionUser();
  const page = Math.max(Number(searchParams.page || '1'), 1);

  await connectDB();
  const posts = await Post.find({ isPublic: true })
    .populate('author', 'name role')
    .populate('college', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * 10)
    .limit(10)
    .lean();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Public Feed</h1>
      {posts.map((post) => <PostCard key={post._id.toString()} post={JSON.parse(JSON.stringify(post))} currentUserId={user?._id.toString()} />)}
    </section>
  );
}
