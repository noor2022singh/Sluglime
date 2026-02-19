import { cookies } from 'next/headers';
import { verifyToken } from './jwt';

export async function getCurrentUserFromCookie() {
  const token = cookies().get('token')?.value;

  if (!token) return null;

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
