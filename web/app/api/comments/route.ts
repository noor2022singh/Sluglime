import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import { parsePagination, requireAuth } from '@/lib/api';

function buildCommentTree(comments: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  comments.forEach((comment) => {
    map.set(comment._id.toString(), { ...comment, replies: [] });
  });

  map.forEach((comment) => {
    if (comment.parentCommentId) {
      const parent = map.get(comment.parentCommentId.toString());
      if (parent) parent.replies.push(comment);
      else roots.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const searchParams = new URL(request.url).searchParams;
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ message: 'postId is required' }, { status: 400 });
    }

    const { page, limit, skip } = parsePagination(request.url);

    const [comments, total] = await Promise.all([
      Comment.find({ post: postId })
        .populate('author', 'name role college')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ post: postId })
    ]);

    return NextResponse.json({
      comments: buildCommentTree(comments),
      pagination: { page, limit, total, hasMore: skip + comments.length < total }
    });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const { postId, content, parentCommentId } = await request.json();

    if (!postId || !content) {
      return NextResponse.json({ message: 'postId and content are required' }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const comment = await Comment.create({
      post: postId,
      author: auth.user!.userId,
      content,
      parentCommentId: parentCommentId || null
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Failed to create comment' }, { status: 500 });
  }
}
