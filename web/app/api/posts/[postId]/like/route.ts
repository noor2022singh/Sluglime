import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/api';
import { connectDB } from '@/lib/db';
import Post from '@/models/Post';

export async function PATCH(_: Request, { params }: { params: { postId: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(auth.user!.userId);
    const post = await Post.findById(params.postId);

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const liked = post.likes.some((id) => id.toString() === auth.user!.userId);
    if (liked) {
      post.likes = post.likes.filter((id) => id.toString() !== auth.user!.userId);
    } else {
      post.likes.push(userObjectId);
    }

    await post.save();

    return NextResponse.json({ liked: !liked, likesCount: post.likes.length });
  } catch {
    return NextResponse.json({ message: 'Failed to update like' }, { status: 500 });
  }
}
