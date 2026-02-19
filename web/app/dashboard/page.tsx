import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import College from '@/models/College';
import Post from '@/models/Post';
import PostCard from '@/components/PostCard';

export default async function DashboardPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  await connectDB();
  const colleges = await College.find().sort({ name: 1 }).lean();

  const page = Math.max(Number(searchParams.page || '1'), 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const posts = await Post.find({ college: user.college._id })
    .populate('author', 'name role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="card h-fit">
        <h2 className="mb-2 font-semibold">Your College</h2>
        <p>{user.college.name}</p>
        <h3 className="mt-4 font-semibold">All communities</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {colleges.map((college) => (
            <li key={college._id.toString()}>
              <a href={`/community/${college._id}`}>{college.name}</a>
            </li>
          ))}
        </ul>
      </aside>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">College Feed</h1>
        {posts.map((post) => <PostCard key={post._id.toString()} post={JSON.parse(JSON.stringify(post))} currentUserId={user._id.toString()} />)}
        <div className="flex gap-2">
          {page > 1 && <a className="rounded border px-3 py-1" href={`/dashboard?page=${page - 1}`}>Previous</a>}
          <a className="rounded border px-3 py-1" href={`/dashboard?page=${page + 1}`}>Next</a>
        </div>
      </section>
    </div>
  );
}
