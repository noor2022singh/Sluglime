import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/models/Post';

export async function GET(_: Request, { params }: { params: { postId: string } }) {
  try {
    await connectDB();
    const post = await Post.findById(params.postId)
      .populate('author', 'name role')
      .populate('college', 'name code')
      .lean();

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch post' }, { status: 500 });
  }
}
