import { NextResponse } from 'next/server';
import { supabase, getAdminSupabase } from '@/lib/supabase';
import { MOCK_PORNSTARS, Pornstar } from '@/lib/data';

function isRealSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return Boolean(url && !url.includes('your-supabase-project.supabase.co'));
}

function getSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (serviceKey && !serviceKey.includes('your-service-role-key')) {
    return getAdminSupabase();
  }
  return supabase;
}

function isDirectImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) return false;

  // Direct image extension match
  if (/\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(lower)) return true;

  // Known image CDNs or image keywords
  if (
    lower.includes('unsplash.com') ||
    lower.includes('r2.dev') ||
    lower.includes('imgur.com') ||
    lower.includes('cdn') ||
    lower.includes('image') ||
    lower.includes('photo') ||
    lower.includes('thumb') ||
    lower.includes('media') ||
    lower.includes('avatar')
  ) {
    return true;
  }

  // Webpage profile links like https://redporn.porn/pornstars/adria-rae are NOT direct images
  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    if (!isRealSupabaseConfigured()) {
      return NextResponse.json({ pornstars: MOCK_PORNSTARS });
    }

    const client = getSupabaseClient();

    // Server-Side Range Pagination for Ultra-Fast Page Loading on Public /pornstars Page
    if (pageParam && limitParam) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const limit = Math.max(1, parseInt(limitParam, 10) || 120);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await client
        .from('pornstars')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);

      if (error || !data) {
        console.warn('Supabase GET range error:', error);
        return NextResponse.json({ pornstars: [], total: 0 });
      }

      const sanitizedData = data.map((ps: any) => ({
        ...ps,
        photo_url: isDirectImageUrl(ps.photo_url) ? ps.photo_url.trim() : null,
      }));

      return NextResponse.json({
        pornstars: sanitizedData as Pornstar[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    // Full fetch for Admin Panel - loop in 1,000 item ranges to bypass Supabase PostgREST default 1,000 row cap
    let allPornstars: any[] = [];
    let from = 0;
    const CHUNK_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from('pornstars')
        .select('*')
        .order('name', { ascending: true })
        .range(from, from + CHUNK_SIZE - 1);

      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        allPornstars = allPornstars.concat(data);
        if (data.length < CHUNK_SIZE) {
          hasMore = false;
        } else {
          from += CHUNK_SIZE;
        }
      }
    }

    if (allPornstars.length === 0) {
      return NextResponse.json({ pornstars: MOCK_PORNSTARS });
    }

    const sanitizedData = allPornstars.map((ps: any) => ({
      ...ps,
      photo_url: isDirectImageUrl(ps.photo_url) ? ps.photo_url.trim() : null,
    }));

    return NextResponse.json({ pornstars: sanitizedData as Pornstar[] });
  } catch (err: any) {
    return NextResponse.json({ pornstars: MOCK_PORNSTARS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const isConfigured = isRealSupabaseConfigured();
    const client = getSupabaseClient();

    // Check if bulk insert payload
    if (Array.isArray(body.items)) {
      const seenSlugs = new Set<string>();

      const itemsToInsert = body.items
        .map((item: any, idx: number) => {
          const cleanName = (item.name || '').trim();
          let baseSlug = item.slug
            ? item.slug.trim()
            : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          if (!baseSlug) baseSlug = `performer-${Date.now()}-${idx}`;

          // Guarantee slug uniqueness within batch
          let cleanSlug = baseSlug;
          let counter = 1;
          while (seenSlugs.has(cleanSlug)) {
            cleanSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          seenSlugs.add(cleanSlug);

          const cleanPhoto = isDirectImageUrl(item.photo_url) ? item.photo_url.trim() : null;

          return {
            name: cleanName,
            slug: cleanSlug,
            photo_url: cleanPhoto,
            videos_count: parseInt(item.videos_count, 10) || 50,
          };
        })
        .filter((item: any) => Boolean(item.name));

      if (itemsToInsert.length === 0) {
        return NextResponse.json({ error: 'No valid pornstar names found in list' }, { status: 400 });
      }

      if (isConfigured) {
        // First try upsert on name
        const { data, error } = await client.from('pornstars').upsert(itemsToInsert, { onConflict: 'name' }).select();
        if (error) {
          console.warn('Supabase bulk upsert on name failed, trying fallback with ignoreDuplicates:', error.message);
          const { error: err2 } = await client.from('pornstars').upsert(itemsToInsert, { ignoreDuplicates: true });
          if (err2) {
            console.error('Supabase fallback upsert error:', err2);
            return NextResponse.json({ error: `Supabase Error: ${err2.message}` }, { status: 500 });
          }
        }
        return NextResponse.json({ success: true, count: data ? data.length : itemsToInsert.length });
      } else {
        // Fallback for demo when Supabase credentials are not in .env.local
        for (const item of itemsToInsert) {
          if (!MOCK_PORNSTARS.some((p) => p.name.toLowerCase() === item.name.toLowerCase())) {
            MOCK_PORNSTARS.unshift({
              id: `ps-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              ...item,
            });
          }
        }
        return NextResponse.json({
          success: true,
          count: itemsToInsert.length,
          warning: 'Please add your real NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to save to your live Supabase database!',
        });
      }
    }

    // Single item insert or update
    const { id, name, slug, photo_url, videos_count } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      photo_url: isDirectImageUrl(photo_url) ? photo_url.trim() : null,
      videos_count: parseInt(videos_count, 10) || 50,
    };

    if (isConfigured) {
      if (id) {
        const { data, error } = await client.from('pornstars').update(payload).eq('id', id).select().single();
        if (error) {
          console.error('Supabase update error:', error);
          return NextResponse.json({ error: `Supabase Error: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ success: true, pornstar: data });
      } else {
        const { data, error } = await client.from('pornstars').upsert(payload, { onConflict: 'name' }).select().single();
        if (error) {
          console.error('Supabase upsert error:', error);
          return NextResponse.json({ error: `Supabase Error: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ success: true, pornstar: data });
      }
    }

    if (id) {
      const idx = MOCK_PORNSTARS.findIndex((p) => p.id === id);
      if (idx !== -1) {
        MOCK_PORNSTARS[idx] = { ...MOCK_PORNSTARS[idx], ...payload };
        return NextResponse.json({ success: true, pornstar: MOCK_PORNSTARS[idx] });
      }
    }

    const mockItem: Pornstar = { id: `ps-${Date.now()}`, ...payload };
    MOCK_PORNSTARS.unshift(mockItem);
    return NextResponse.json({ success: true, pornstar: mockItem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create pornstar' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const purgeAll = searchParams.get('purge_all');

    let bodyIds: string[] = [];
    try {
      const body = await request.json();
      if (Array.isArray(body?.ids)) bodyIds = body.ids;
    } catch {
      // JSON body optional
    }

    const isConfigured = isRealSupabaseConfigured();
    const client = getSupabaseClient();

    // 1. Purge ALL Pornstars
    if (purgeAll === 'true') {
      if (isConfigured) {
        const { error } = await client.from('pornstars').delete().neq('name', '___NONE_EXISTING___');
        if (error) {
          console.error('Supabase purge error:', error);
          return NextResponse.json({ error: `Supabase Error: ${error.message}` }, { status: 500 });
        }
      }
      MOCK_PORNSTARS.length = 0;
      return NextResponse.json({ success: true, message: 'All performers purged successfully' });
    }

    // 2. Bulk Delete Selected IDs Array
    if (bodyIds.length > 0) {
      if (isConfigured) {
        const { error } = await client.from('pornstars').delete().in('id', bodyIds);
        if (error) {
          console.error('Supabase bulk delete error:', error);
          return NextResponse.json({ error: `Supabase Error: ${error.message}` }, { status: 500 });
        }
      }
      for (const bId of bodyIds) {
        const idx = MOCK_PORNSTARS.findIndex((p) => p.id === bId);
        if (idx !== -1) MOCK_PORNSTARS.splice(idx, 1);
      }
      return NextResponse.json({ success: true, count: bodyIds.length });
    }

    // 3. Single Item Delete
    if (!id) {
      return NextResponse.json({ error: 'Pornstar ID or payload is required' }, { status: 400 });
    }

    const index = MOCK_PORNSTARS.findIndex((p) => p.id === id);
    if (index !== -1) {
      MOCK_PORNSTARS.splice(index, 1);
    }

    if (isConfigured) {
      await client.from('pornstars').delete().eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete pornstar' }, { status: 500 });
  }
}
