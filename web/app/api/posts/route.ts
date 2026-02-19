import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import { parsePagination, requireAuth } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { page, limit, skip } = parsePagination(request.url);
    const searchParams = new URL(request.url).searchParams;
    const collegeId = searchParams.get('collegeId');
    const isPublicOnly = searchParams.get('isPublic') === 'true';

    const query: Record<string, unknown> = {};
    if (collegeId) query.college = collegeId;
    if (isPublicOnly) query.isPublic = true;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name role college')
        .populate('college', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query)
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + posts.length < total
      }
    });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const formData = await request.formData();
    const content = String(formData.get('content') || '').trim();
    const isPublic = formData.get('isPublic') === 'true';
    const files = formData.getAll('files') as File[];

    if (!content) {
      return NextResponse.json({ message: 'Post content is required' }, { status: 400 });
    }

    const user = await User.findById(auth.user!.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (auth.user!.collegeId !== user.college.toString()) {
      return NextResponse.json({ message: 'Invalid user college mapping' }, { status: 403 });
    }

    const uploadedFiles = [];
    for (const file of files) {
      if (!file || file.size === 0) continue;
      if (!['image/', 'application/pdf'].some((prefix) => file.type.startsWith(prefix))) continue;

      const resourceType = file.type.startsWith('image/') ? 'image' : 'raw';
      const result = await uploadToCloudinary(file, resourceType);

      uploadedFiles.push({
        url: result.url,
        publicId: result.publicId,
        fileName: file.name,
        fileType: resourceType === 'image' ? 'image' : 'pdf'
      });
    }

    const post = await Post.create({
      author: auth.user!.userId,
      college: auth.user!.collegeId,
      content,
      files: uploadedFiles,
      isPublic
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Failed to create post' }, { status: 500 });
  }
}
