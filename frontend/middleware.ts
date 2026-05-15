import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_PATHS: Record<string, string[]> = {
  student:           ['/student'],
  teacher:           ['/teacher'],
  institution_admin: ['/admin'],
  ngo_admin:         ['/admin'],
  super_admin:       ['/super-admin', '/admin', '/teacher', '/student'],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Gracefully handle stale/invalid refresh tokens — do NOT call signOut() here,
  // that makes an API call on every request and will trigger 429 rate limiting.
  // Simply treat the session as null; the redirect to /login below handles cleanup.
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch {
    session = null;
  }

  const path = req.nextUrl.pathname;
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register');
  const isDashboard = path.startsWith('/student') || path.startsWith('/teacher') ||
                      path.startsWith('/admin') || path.startsWith('/super-admin');

  // Not logged in → redirect to login
  if (!session && isDashboard) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Already logged in → redirect away from auth pages
  if (session && isAuthPage) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', session?.user?.id).single();
    
    // Default to student if something fails
    const role = (profile as any)?.role || 'student';
    const redirectMap: Record<string, string> = {
      student: '/student', teacher: '/teacher',
      institution_admin: '/admin', ngo_admin: '/admin', super_admin: '/super-admin',
    };
    return NextResponse.redirect(new URL(redirectMap[role], req.url));
  }

  // Role mismatch → redirect to correct dashboard
  if (session && isDashboard) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', session?.user?.id).single();
      
    const role = (profile as any)?.role || 'student';
    const allowedPaths = ROLE_PATHS[role] || ['/student'];
    const hasAccess = allowedPaths.some(p => path.startsWith(p));
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL(allowedPaths[0], req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
