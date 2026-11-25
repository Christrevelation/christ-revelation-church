import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Dynamically reads an environment variable at runtime on Cloudflare Workers or Node.js.
 * Uses bracket notation on `process.env` so Next.js's bundler never inlines `undefined`
 * over `NEXT_PUBLIC_*` variables when CI build-time variables are empty.
 */
export function getRuntimeEnv(key: string): string | undefined {
  try {
    const cf = getCloudflareContext();
    const cfEnv = cf?.env as Record<string, unknown> | undefined;
    if (cfEnv && typeof cfEnv[key] === 'string' && cfEnv[key]) {
      return (cfEnv[key] as string).trim();
    }
  } catch {
    // Not inside a Cloudflare request context (e.g. local Node.js build/dev)
  }

  if (typeof process !== 'undefined' && process.env) {
    const envRecord = process.env as Record<string, string | undefined>;
    const val = envRecord[key];
    if (typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }

  return undefined;
}

export function getServerSupabaseConfig() {
  const url =
    getRuntimeEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    getRuntimeEnv('SUPABASE_URL') ||
    '';
  const anonKey =
    getRuntimeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getRuntimeEnv('SUPABASE_ANON_KEY') ||
    '';
  const serviceRoleKey = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY') || '';

  return { url, anonKey, serviceRoleKey };
}

export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = (forwardedHost || request.headers.get('host') || '').split(',')[0].trim();
  const forwardedProto = (request.headers.get('x-forwarded-proto') || '').split(',')[0].trim();

  if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    const proto = forwardedProto || url.protocol.replace(':', '') || 'https';
    return `${proto}://${host}`;
  }

  return url.origin;
}
