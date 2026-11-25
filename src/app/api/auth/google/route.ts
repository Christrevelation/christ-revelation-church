import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { getRequestOrigin, getServerSupabaseConfig } from '@/lib/runtimeEnv';

export const dynamic = 'force-dynamic';

const ONE_HOUR_IN_SECONDS = 60 * 60;

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase() || '';
  const { url, anonKey } = getServerSupabaseConfig();

  if (!url || !anonKey || url.includes('placeholder.supabase.co')) {
    return NextResponse.redirect(
      `${origin}/?error=oauth_error&message=${encodeURIComponent(
        'Supabase URL and Anon Key are missing in Cloudflare Worker Variables.'
      )}`
    );
  }

  const cookiesToForward: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookiesToForward.push({ name, value, options });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
      queryParams: email
        ? { login_hint: email }
        : { prompt: 'select_account' },
    },
  });

  if (error || !data?.url) {
    console.error('Server Google OAuth initiation error:', error?.message);
    return NextResponse.redirect(
      `${origin}/?error=oauth_error&message=${encodeURIComponent(
        error?.message || 'Failed to initiate Google sign-in.'
      )}`
    );
  }

  const response = NextResponse.redirect(data.url);
  cookiesToForward.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...(options as Record<string, unknown>),
      maxAge: (options?.maxAge as number | undefined) ?? ONE_HOUR_IN_SECONDS,
      path: (options?.path as string | undefined) ?? '/',
      sameSite: ((options?.sameSite as 'lax' | 'strict' | 'none' | undefined) ?? 'lax'),
    });
  });

  return response;
}
