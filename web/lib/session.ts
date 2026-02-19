import { getCurrentUserFromCookie } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function getSessionUser() {
  const tokenUser = await getCurrentUserFromCookie();
  if (!tokenUser) return null;

  await connectDB();
  const user = await User.findById(tokenUser.userId).populate('college', 'name code').lean();
  return user;
}
