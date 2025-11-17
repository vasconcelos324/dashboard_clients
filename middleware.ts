
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  const protectedPaths = new Set([
    '/home',
    '/client',
    '/investiment',
    '/register/client',
    '/register/credit',
    '/register/control',
    '/register/cash',
    '/register/investment'
  ]);

  
  const isProtected = [...protectedPaths].some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return res; 
  }


  const supabase = createMiddlewareClient({ req: request, res });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    
    '/((?!_next/static|_next/image|favicon.ico|api/public).*)',
  ],
};
