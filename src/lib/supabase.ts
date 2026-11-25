import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabaseConfig } from '@/lib/runtimeEnv';

let cachedClient: SupabaseClient | null = null;
let cachedKeySignature = '';

function getRuntimeSupabaseClient(): SupabaseClient {
  const { url, anonKey, serviceRoleKey } = getServerSupabaseConfig();
  const resolvedUrl = url || 'https://placeholder.supabase.co';
  const resolvedKey = serviceRoleKey || anonKey || 'placeholder-anon-key';
  const signature = `${resolvedUrl}::${resolvedKey}`;

  if (!cachedClient || cachedKeySignature !== signature) {
    cachedClient = createClient(resolvedUrl, resolvedKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedKeySignature = signature;
  }

  return cachedClient;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = getRuntimeSupabaseClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
