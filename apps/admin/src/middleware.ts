import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/api/health' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  const user = process.env.ADMIN_BASIC_USER;
  const password = process.env.ADMIN_BASIC_PASSWORD;

  if (!user || !password) {
    return new NextResponse(
      'Admin auth is not configured. Set ADMIN_BASIC_USER and ADMIN_BASIC_PASSWORD.',
      { status: 500 },
    );
  }

  const header = request.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(':');
    const providedUser = decoded.slice(0, separator);
    const providedPassword = decoded.slice(separator + 1);
    if (providedUser === user && providedPassword === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="AskAlert Admin"',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|brand/).*)'],
};
