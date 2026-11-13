import { NextResponse } from 'next/server';
import { COOKIE, tokenOk } from '@/lib/auth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname === '/login' || pathname === '/api/login') return NextResponse.next();
  if (await tokenOk(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|icon.png|apple-icon.png).*)'] };
