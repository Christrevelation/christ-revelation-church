import { createBrowserClient } from '@supabase/ssr';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const PUBLIC_CONFIG_STORAGE_KEY = 'crc_supabase_public_config';

export interface PublicSupabaseConfig {
  url: string;
  anonKey: string;
}

declare global {
  interface Window {
    __CRC_SUPABASE_CONFIG__?: PublicSupabaseConfig;
  }
}

let inflightConfigPromise: Promise<PublicSupabaseConfig | null> | null = null;

function isRealConfig(url?: string, anonKey?: string): boolean {
  return Boolean(
    url &&
      anonKey &&
      !url.includes('placeholder.supabase.co') &&
      anonKey !== 'placeholder-anon-key'
  );
}

export function getBrowserSupabaseConfig(): PublicSupabaseConfig {
  const buildUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const buildKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (isRealConfig(buildUrl, buildKey)) {
    return { url: buildUrl!, anonKey: buildKey! };
  }

  if (typeof window !== 'undefined') {
    if (
      window.__CRC_SUPABASE_CONFIG__ &&
      isRealConfig(window.__CRC_SUPABASE_CONFIG__.url, window.__CRC_SUPABASE_CONFIG__.anonKey)
    ) {
      return window.__CRC_SUPABASE_CONFIG__;
    }

    try {
      const cached = window.localStorage.getItem(PUBLIC_CONFIG_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as PublicSupabaseConfig;
        if (isRealConfig(parsed?.url, parsed?.anonKey)) {
          window.__CRC_SUPABASE_CONFIG__ = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  return {
    url: buildUrl || 'https://placeholder.supabase.co',
    anonKey: buildKey || 'placeholder-anon-key',
  };
}

export async function ensureBrowserSupabaseConfig(): Promise<PublicSupabaseConfig> {
  const existing = getBrowserSupabaseConfig();
  if (isRealConfig(existing.url, existing.anonKey) || typeof window === 'undefined') {
    return existing;
  }

  if (!inflightConfigPromise) {
    inflightConfigPromise = fetch('/api/auth/config', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (isRealConfig(data?.supabaseUrl, data?.supabaseAnonKey)) {
          const cfg: PublicSupabaseConfig = {
            url: data.supabaseUrl,
            anonKey: data.supabaseAnonKey,
          };
          window.__CRC_SUPABASE_CONFIG__ = cfg;
          try {
            window.localStorage.setItem(PUBLIC_CONFIG_STORAGE_KEY, JSON.stringify(cfg));
          } catch {
            // ignore storage errors
          }
          return cfg;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        inflightConfigPromise = null;
      });
  }

  const fetched = await inflightConfigPromise;
  return fetched || existing;
}

export function createClient() {
  const { url, anonKey } = getBrowserSupabaseConfig();

  return createBrowserClient(url, anonKey, {
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
  });
}
