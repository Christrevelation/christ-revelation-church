import { NextResponse, type NextRequest } from 'next/server';
import { getServerSupabaseConfig } from '@/lib/runtimeEnv';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (!Array.isArray(path) || path.length === 0 || path.some((seg) => seg === '..' || seg === '.')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { url: supabaseUrl } = getServerSupabaseConfig();
  const effectiveSupabaseUrl =
    supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')
      ? supabaseUrl
      : 'https://psxdxygtenkaurdbxgvq.supabase.co';

  const safePath = path.map((seg) => encodeURIComponent(seg)).join('/');
  const storageUrl = `${effectiveSupabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/gallery/wp-content/uploads/${safePath}`;

  try {
    const upstream = await fetch(storageUrl, {
      headers: { Accept: 'image/*,*/*;q=0.8' },
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse('Image Not Found', { status: upstream.status || 404 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Error fetching image', { status: 502 });
  }
}
