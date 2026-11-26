'use client';

import { useEffect } from 'react';
import {
  createClient,
  ensureBrowserSupabaseConfig,
} from '@/lib/supabase/client';
import {
  ADMIN_PENDING_EMAIL_KEY,
  ADMIN_SESSION_STORAGE_KEY,
  getPersistedAdminSession,
  savePersistedAdminSession,
} from '@/components/admin/shared/AdminAuthProvider';

function hasLoginIntentCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .some((c) => c.trim().startsWith('crc_oauth_pending=1'));
}

function clearLoginIntentCookie() {
  if (typeof document === 'undefined') return;
  document.cookie =
    'crc_oauth_pending=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export default function RuntimeSupabaseConfig() {
  useEffect(() => {
    let cancelled = false;
    let redirecting = false;
    let authSub: { unsubscribe: () => void } | null = null;

    const verifyAndRedirectToAdmin = async (
      sessionUser: any,
      supabaseClient: ReturnType<typeof createClient>
    ) => {
      if (redirecting || cancelled) return;
      const sessionEmail = sessionUser?.email?.trim()?.toLowerCase();
      if (!sessionEmail) return;

      redirecting = true;
      clearLoginIntentCookie();

      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sessionEmail }),
        });

        if (res.status === 403) {
          window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
          window.localStorage.removeItem(ADMIN_PENDING_EMAIL_KEY);
          await supabaseClient.auth.signOut();
          window.location.replace('/?error=unauthorized');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data?.success) {
            savePersistedAdminSession({
              email: sessionEmail,
              role: data.role,
              permissions: data.permissions || ['all'],
              subadminId: data.id || null,
              user: sessionUser,
              loggedInAt: new Date().toISOString(),
            });
            window.location.replace('/admin');
            return;
          }
        }
      } catch {
        // allow retry on next navigation if network hiccupped
      }
      redirecting = false;
    };

    const handleRuntimeAndAuthRedirect = async () => {
      if (typeof window === 'undefined') return;

      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const initialHash = window.location.hash || '';
      const hasHashToken = initialHash.includes('access_token=');

      // 1. If Supabase redirected ?code=... to "/" (Site URL) instead of "/auth/callback",
      // forward directly to /auth/callback so the server exchanges the PKCE code and redirects to /admin.
      if (
        code &&
        !pathname.startsWith('/auth/callback') &&
        !pathname.startsWith('/admin')
      ) {
        window.location.replace(
          `/auth/callback?code=${encodeURIComponent(code)}`
        );
        return;
      }

      // 2. Always preload runtime Supabase URL & Anon Key from Cloudflare Worker bindings
      await ensureBrowserSupabaseConfig();
      if (cancelled) return;

      if (pathname.startsWith('/admin')) return;

      const pendingEmail = window.localStorage
        .getItem(ADMIN_PENDING_EMAIL_KEY)
        ?.trim()
        .toLowerCase();
      const loginIntent = hasLoginIntentCookie();
      const alreadyPersisted = Boolean(getPersistedAdminSession());

      const supabase = createClient();

      // Parse implicit-flow #access_token=... if Supabase redirected back to Site URL "/"
      if (hasHashToken) {
        const hashParams = new URLSearchParams(initialHash.replace(/^#/, ''));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth
            .setSession({ access_token, refresh_token })
            .catch(() => {});
        }
      }

      // Listen for SIGNED_IN firing asynchronously from URL token detection
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          event === 'SIGNED_IN' &&
          session?.user &&
          (hasHashToken || Boolean(pendingEmail) || loginIntent || !alreadyPersisted)
        ) {
          void verifyAndRedirectToAdmin(session.user, supabase);
        }
      });
      authSub = subscription;

      // 3. Check current Supabase session immediately:
      // Redirect directly to /admin whenever OAuth just completed OR an unpersisted Supabase login exists
      if (hasHashToken || Boolean(pendingEmail) || loginIntent || !alreadyPersisted) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await verifyAndRedirectToAdmin(session.user, supabase);
        }
      }
    };

    void handleRuntimeAndAuthRedirect();

    return () => {
      cancelled = true;
      authSub?.unsubscribe();
    };
  }, []);

  return null;
}
