import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import College from '@/models/College';

export async function GET() {
  try {
    await connectDB();
    const colleges = await College.find().sort({ name: 1 });
    return NextResponse.json({ colleges });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch colleges' }, { status: 500 });
  }
}
