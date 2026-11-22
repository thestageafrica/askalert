import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Hide the internal design-system catalogue on production hosts. */
export function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    request.nextUrl.pathname.startsWith('/design-system')
  ) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/design-system', '/design-system/:path*'],
};
