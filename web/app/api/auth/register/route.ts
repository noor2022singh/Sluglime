import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import College from '@/models/College';
import { signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password, role, collegeId } = body;

    if (!name || !email || !password || !role || !collegeId) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return NextResponse.json({ message: 'College not found' }, { status: 404 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: passwordHash, role, college: collegeId });

    const token = await signToken({
      userId: user._id.toString(),
      role: user.role,
      collegeId: user.college.toString(),
      email: user.email
    });

    const response = NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.college
      }
    });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch {
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}
