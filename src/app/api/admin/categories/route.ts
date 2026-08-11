import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { RAW_DIRECTORY_DATA } from '@/lib/data';

export async function GET() {
  try {
    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin.from('categories').select('*').order('name');
    
    if (error || !data) {
      return NextResponse.json({ categories: [] });
    }
    
    return NextResponse.json({ categories: data });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabaseAdmin = getAdminSupabase();

    // Bulk array upsert or sync all directory
    if (Array.isArray(payload.items) || payload.sync_all_directory === true) {
      let itemsToUpsert = payload.items;

      if (!Array.isArray(itemsToUpsert) || itemsToUpsert.length === 0) {
        // Sync all directory categories from RAW_DIRECTORY_DATA
        const map = new Map<string, any>();
        for (const group of RAW_DIRECTORY_DATA) {
          for (const item of group.items) {
            const itemSlug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (!map.has(itemSlug)) {
              map.set(itemSlug, {
                name: item,
                slug: itemSlug,
                description: `Browse all releases and video collections tagged under ${item}.`,
                cover_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
              });
            }
          }
        }
        itemsToUpsert = Array.from(map.values());
      }

      const { data, error } = await supabaseAdmin
        .from('categories')
        .upsert(itemsToUpsert, { onConflict: 'slug' })
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, count: data ? data.length : itemsToUpsert.length, categories: data });
    }

    const { name, slug, description, cover_image_key, cover_image_url } = payload;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .upsert({
        name,
        slug,
        description: description || null,
        cover_image_key: cover_image_key || null,
        cover_image_url: cover_image_url || null,
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ category: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminSupabase();
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
