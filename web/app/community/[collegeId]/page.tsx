import { connectDB } from '@/lib/db';
import College from '@/models/College';
import Post from '@/models/Post';
import { getSessionUser } from '@/lib/session';
import PostCard from '@/components/PostCard';

export default async function CommunityPage({ params, searchParams }: { params: { collegeId: string }; searchParams: { page?: string } }) {
  const user = await getSessionUser();
  const page = Math.max(Number(searchParams.page || '1'), 1);

  await connectDB();
  const college = await College.findById(params.collegeId).lean();
  if (!college) return <div className="card">College not found</div>;

  const posts = await Post.find({ college: params.collegeId })
    .populate('author', 'name role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * 10)
    .limit(10)
    .lean();

  return (
    <section className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-semibold">{college.name} Community</h1>
        {user?.college?._id.toString() === params.collegeId ? (
          <p className="text-green-700">You can create posts in this college.</p>
        ) : (
          <p className="text-slate-600">Read-only for posting. You can still comment and download files.</p>
        )}
      </div>
      {posts.map((post) => <PostCard key={post._id.toString()} post={JSON.parse(JSON.stringify(post))} currentUserId={user?._id.toString()} />)}
    </section>
  );
}
