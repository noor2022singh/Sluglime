import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import PostCard from '@/components/PostCard';
import { getSessionUser } from '@/lib/session';
import CommentThread from '@/components/CommentThread';

function buildCommentTree(comments: any[]) {
  const map = new Map();
  const roots: any[] = [];
  comments.forEach((comment) => map.set(comment._id.toString(), { ...comment, replies: [] }));
  map.forEach((comment: any) => {
    if (comment.parentCommentId) {
      const parent = map.get(comment.parentCommentId.toString());
      if (parent) parent.replies.push(comment);
      else roots.push(comment);
    } else roots.push(comment);
  });
  return roots;
}

export default async function PostPage({ params }: { params: { postId: string } }) {
  const user = await getSessionUser();
  await connectDB();

  const post = await Post.findById(params.postId).populate('author', 'name role').populate('college', 'name').lean();
  if (!post) return <div className="card">Post not found</div>;

  const comments = await Comment.find({ post: params.postId }).populate('author', 'name').sort({ createdAt: 1 }).lean();

  return (
    <div className="space-y-4">
      <PostCard post={JSON.parse(JSON.stringify(post))} currentUserId={user?._id.toString()} />
      <CommentThread comments={JSON.parse(JSON.stringify(buildCommentTree(comments)))} postId={params.postId} />
    </div>
  );
}
