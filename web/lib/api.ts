import { NextResponse } from 'next/server';
import { getCurrentUserFromCookie } from './auth';

export async function requireAuth() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { user };
}

export function parsePagination(url: string) {
  const searchParams = new URL(url).searchParams;
  const page = Math.max(Number(searchParams.get('page') || '1'), 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || '10'), 1), 30);
  return { page, limit, skip: (page - 1) * limit };
}
