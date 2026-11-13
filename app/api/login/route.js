import { NextResponse } from 'next/server';
import { COOKIE, MAX_AGE, authConfigured, passwordOk, makeToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!authConfigured()) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD is not set. Add it to .env.local (or the Vercel environment variables).' }, { status: 500 });
  }
  const { password } = await req.json().catch(() => ({}));
  if (!(await passwordOk(password ?? ''))) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await makeToken(), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE,
  });
  return res;
}
