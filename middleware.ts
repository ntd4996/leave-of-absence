import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const expiry = token.exp as number | undefined;
  if (expiry && expiry * 1000 < Date.now()) {
    if (request.nextUrl.pathname.startsWith('/api')) {
      return new NextResponse('Token expired', { status: 401 });
    }
    
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'SessionExpired');
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/leaves/:path*',
    '/api/users/:path*',
    '/api/me/:path*',
    '/api/auth/signout',
  ],
}; 