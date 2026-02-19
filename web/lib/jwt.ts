import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing');
}

const secret = new TextEncoder().encode(JWT_SECRET);

export type TokenPayload = {
  userId: string;
  role: 'student' | 'teacher';
  collegeId: string;
  email: string;
};

export async function signToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return {
    userId: payload.userId as string,
    role: payload.role as 'student' | 'teacher',
    collegeId: payload.collegeId as string,
    email: payload.email as string
  };
}
