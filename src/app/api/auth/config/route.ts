import { NextResponse } from 'next/server';
import { getServerSupabaseConfig } from '@/lib/runtimeEnv';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { url, anonKey } = getServerSupabaseConfig();

  return NextResponse.json(
    {
      supabaseUrl: url,
      supabaseAnonKey: anonKey,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    }
  );
}
