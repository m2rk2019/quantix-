import { type NextRequest, NextResponse } from 'next/server';

import { fetchResolvedProfile } from '@/lib/auth/resolve-profile';
import { canAccessRoute } from '@/lib/auth/permissions';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { ROUTES } from '@/lib/constants/routes';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

const PUBLIC_PATHS = [ROUTES.login] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  try {
    const { url, anonKey } = getSupabaseEnv();

    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (isPublicPath(pathname)) {
        return response;
      }

      const loginUrl = new URL(ROUTES.login, request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('next', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    if (pathname === ROUTES.login) {
      return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
    }

    if (pathname === ROUTES.unauthorized) {
      return response;
    }

    const profileRow = await fetchResolvedProfile(supabase, user);

    if (!profileRow || profileRow.deleted_at) {
      await supabase.auth.signOut();
      const loginUrl = new URL(ROUTES.login, request.url);
      loginUrl.searchParams.set('error', 'account_inactive');
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessRoute(profileRow.role, pathname)) {
      return NextResponse.redirect(new URL(ROUTES.unauthorized, request.url));
    }

    return response;
  } catch {
    if (isPublicPath(pathname)) {
      return NextResponse.next({ request });
    }

    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
