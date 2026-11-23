import { createBrowserClient } from '@supabase/ssr';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookieOptions: {
        maxAge: ONE_YEAR_IN_SECONDS,
        path: '/',
        sameSite: 'lax',
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
