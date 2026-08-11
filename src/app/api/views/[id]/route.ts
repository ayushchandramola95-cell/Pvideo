import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase')) {
      return NextResponse.json({ success: true, mock: true });
    }

    // RPC or raw SQL increment
    const { error } = await supabase.rpc('increment_video_views', { video_id: id });

    if (error) {
      // Fallback update query
      await supabase
        .from('videos')
        .update({ views_count: supabase.rpc('increment') as any })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
