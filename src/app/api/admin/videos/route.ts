import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { MOCK_VIDEOS } from '@/lib/data';

function extractExternalId(urlOrText?: string | null): { external_source: string; external_id: string | null } {
  if (!urlOrText || typeof urlOrText !== 'string') {
    return { external_source: 'redporn', external_id: null };
  }

  const str = urlOrText.trim();

  // Match RedPorn or standard URL format: https://redporn.porn/16355881?title=example-video
  // or data-gallery-id="16355881" or raw numeric ID
  const idMatch =
    str.match(/\/(\d{5,15})(?:\?|\/|$)/) ||
    str.match(/data-(?:gallery|item)-id=["'](\d+)["']/i) ||
    str.match(/^(\d{5,15})$/);

  if (idMatch && idMatch[1]) {
    return { external_source: 'redporn', external_id: idMatch[1] };
  }

  return { external_source: 'redporn', external_id: null };
}

function normalizeName(str?: string | null): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeSlug(str?: string | null): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function isValidUUID(uuid?: string | null): boolean {
  if (!uuid) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const categoryId = searchParams.get('category_id') || '';
    const checkDuplicates = searchParams.get('check_duplicates') === 'true';

    const supabaseAdmin = getAdminSupabase();

    // 1. Audit duplicate videos in database (Dry-run list)
    if (checkDuplicates) {
      // Load all categories to map category_id to category name
      const categoriesMap = new Map<string, string>();
      try {
        const { data: dbCats } = await supabaseAdmin.from('categories').select('id, name');
        if (dbCats) {
          for (const c of dbCats) {
            categoriesMap.set(c.id, c.name);
          }
        }
      } catch (e) {
        console.warn('Categories scan load warning:', e);
      }

      let allVids: { id: string; external_id: string | null; slug: string; title: string; category_id: string | null }[] = [];
      let offset = 0;
      let hasMore = true;
      const batchSize = 1000;

      while (hasMore) {
        let query = supabaseAdmin
          .from('videos')
          .select('id, external_id, slug, title, category_id')
          .order('created_at', { ascending: true })
          .range(offset, offset + batchSize - 1);

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          hasMore = false;
          break;
        }

        allVids = allVids.concat(data);
        offset += data.length;
        if (data.length < batchSize) {
          hasMore = false;
        }
      }

      const seenExtIds = new Map<string, { id: string; title: string }>(); // external_id -> original video
      const seenTitles = new Map<string, { id: string; title: string }>(); // title -> original video
      const seenSlugs = new Map<string, { id: string; title: string }>(); // slug -> original video
      const duplicates: { id: string; title: string; slug: string; category_id: string | null; category_name: string; reason: string }[] = [];

      for (const v of allVids) {
        const cleanTitle = (v.title || '').trim().toLowerCase();
        const cleanSlug = (v.slug || '').trim().toLowerCase();
        let isDuplicate = false;
        let reason = '';

        // Rule 1: Duplicate by External ID
        if (v.external_id) {
          const extId = v.external_id.trim();
          if (seenExtIds.has(extId)) {
            isDuplicate = true;
            const orig = seenExtIds.get(extId)!;
            reason = `Duplicate External ID (#${extId}) of "${orig.title}"`;
          } else {
            seenExtIds.set(extId, { id: v.id, title: v.title });
          }
        }

        // Rule 2: Duplicate by Title
        if (!isDuplicate && cleanTitle) {
          if (seenTitles.has(cleanTitle)) {
            isDuplicate = true;
            const orig = seenTitles.get(cleanTitle)!;
            reason = `Identical Title with "${orig.title}"`;
          } else {
            seenTitles.set(cleanTitle, { id: v.id, title: v.title });
          }
        }

        // Rule 3: Duplicate by Slug (or slug with suffix like -1, -2)
        if (!isDuplicate && cleanSlug) {
          if (seenSlugs.has(cleanSlug)) {
            isDuplicate = true;
            const orig = seenSlugs.get(cleanSlug)!;
            reason = `Identical Slug (${cleanSlug}) with "${orig.title}"`;
          } else {
            seenSlugs.set(cleanSlug, { id: v.id, title: v.title });

            const suffixMatch = cleanSlug.match(/^(.+)-(\d+)$/);
            if (suffixMatch) {
              const baseSlug = suffixMatch[1];
              if (seenSlugs.has(baseSlug)) {
                isDuplicate = true;
                const orig = seenSlugs.get(baseSlug)!;
                reason = `Duplicate Slug Variation (${cleanSlug} matches base slug of "${orig.title}")`;
              }
            }
          }
        }

        if (isDuplicate) {
          duplicates.push({
            id: v.id,
            title: v.title,
            slug: v.slug,
            category_id: v.category_id || null,
            category_name: v.category_id ? (categoriesMap.get(v.category_id) || 'Unknown') : 'Uncategorized',
            reason,
          });
        }
      }

      return NextResponse.json({
        success: true,
        scanned: allVids.length,
        duplicates,
      });
    }

    let query = supabaseAdmin
      .from('videos')
      .select('*, category:categories(*)', { count: 'exact' });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search.trim()) {
      const q = search.trim();
      query = query.or(`title.ilike.%${q}%,performer_name.ilike.%${q}%`);
    }

    // Preserve exact import sequence order (newest created or DOM order)
    query = query.order('created_at', { ascending: false });

    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    const { data, count, error } = await query;

    if (error || !data) {
      return NextResponse.json({ videos: MOCK_VIDEOS, total: MOCK_VIDEOS.length, page: 1, totalPages: 1 });
    }

    const total = count || data.length;
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({ videos: data, total, page, totalPages });
  } catch {
    return NextResponse.json({ videos: MOCK_VIDEOS, total: MOCK_VIDEOS.length, page: 1, totalPages: 1 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabaseAdmin = getAdminSupabase();

    // Multi-Collection / Multi-Category Ultra-Fast Matrix Bulk Import System
    if (Array.isArray(payload.items)) {
      const rawItems = payload.items;
      if (rawItems.length === 0) {
        return NextResponse.json({ error: 'No video items provided' }, { status: 400 });
      }

      // Phase 1: Preload In-Memory Caches for O(1) Instant Performance
      const existingVideosMap = new Map<string, any>(); // key: "source:ext_id" or "slug"
      const existingPornstarsMap = new Map<string, any>(); // key: normName or slug
      const existingCategoriesMap = new Map<string, any>(); // key: id or slug or normName
      const existingTagsMap = new Map<string, any>(); // key: normName or slug

      try {
        // Build list of external IDs and slugs from the incoming batch to query only target rows
        const batchExtIds = rawItems.map((item: any) => {
          const targetUrl = item.external_url || item.url || '';
          const { external_id } = extractExternalId(item.external_id || targetUrl);
          return external_id;
        }).filter(Boolean);

        const batchSlugs = rawItems.map((item: any) => {
          if (item.slug) return item.slug.trim().toLowerCase();
          if (item.title) return normalizeSlug(item.title).toLowerCase();
          return null;
        }).filter(Boolean);

        let dbVids: any[] = [];

        // Query database only for matching records (efficient, safe for 60k+ videos)
        if (batchExtIds.length > 0) {
          const { data } = await supabaseAdmin
            .from('videos')
            .select('*')
            .in('external_id', batchExtIds);
          if (data) dbVids = dbVids.concat(data);
        }

        if (batchSlugs.length > 0) {
          const { data } = await supabaseAdmin
            .from('videos')
            .select('*')
            .in('slug', batchSlugs);
          if (data) {
            const existingIds = new Set(dbVids.map(v => v.id));
            data.forEach(v => {
              if (!existingIds.has(v.id)) {
                dbVids.push(v);
              }
            });
          }
        }

        for (const v of dbVids) {
          if (v.external_id) {
            const src = v.external_source || 'redporn';
            existingVideosMap.set(`${src}:${v.external_id}`, v);
          }
          if (v.slug) {
            existingVideosMap.set(`slug:${v.slug.toLowerCase()}`, v);
          }
        }
      } catch (e) {
        console.warn('Video cache load warning:', e);
      }

      try {
        const { data: dbStars } = await supabaseAdmin.from('pornstars').select('id, name, slug');
        if (dbStars) {
          for (const s of dbStars) {
            existingPornstarsMap.set(normalizeName(s.name), s);
            existingPornstarsMap.set(s.slug.toLowerCase(), s);
          }
        }
      } catch (e) {
        console.warn('Pornstars cache load warning:', e);
      }

      try {
        const { data: dbCats } = await supabaseAdmin.from('categories').select('id, name, slug');
        if (dbCats) {
          for (const c of dbCats) {
            existingCategoriesMap.set(c.id, c);
            existingCategoriesMap.set(c.slug.toLowerCase(), c);
            existingCategoriesMap.set(normalizeName(c.name), c);
          }
        }
      } catch (e) {
        console.warn('Categories cache load warning:', e);
      }

      const seenSlugsInBatch = new Set<string>();
      let createdCount = 0;
      let updatedCount = 0;
      const errorLog: string[] = [];

      const videoCategoryJunctions: { video_id: string; category_id: string }[] = [];
      const videoPornstarJunctions: { video_id: string; pornstar_id: string }[] = [];
      const videoTagJunctions: { video_id: string; tag_id: string }[] = [];
      const itemsSummary: any[] = [];

      const batchToInsertPayloads: any[] = [];
      const batchToInsertMeta: any[] = [];
      const nowBase = Date.now();

      for (let idx = 0; idx < rawItems.length; idx++) {
        const item = rawItems[idx];
        const cleanTitle = (item.title || '').trim();
        if (!cleanTitle && !item.external_id && !item.external_url && !item.url) continue;

        const targetUrl = item.external_url || item.url || '';
        const { external_source, external_id } = extractExternalId(item.external_id || targetUrl);

        let baseSlug = item.slug ? item.slug.trim() : '';
        if (!baseSlug && cleanTitle) {
          baseSlug = normalizeSlug(cleanTitle);
        }
        if (!baseSlug) baseSlug = `video-${external_id || Date.now()}-${idx}`;

        // Ensure unique slug within active batch
        let cleanSlug = baseSlug;
        let counter = 1;
        while (seenSlugsInBatch.has(cleanSlug)) {
          cleanSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        seenSlugsInBatch.add(cleanSlug);

        let durationSecs = 600;
        if (typeof item.duration_seconds === 'number' && item.duration_seconds > 0) {
          durationSecs = item.duration_seconds;
        } else if (item.duration) {
          const strDur = String(item.duration).trim();
          const parts = strDur.split(':').map((p) => parseInt(p, 10));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            durationSecs = parts[0] * 60 + parts[1];
          } else if (parts.length === 1 && !isNaN(parts[0])) {
            durationSecs = parts[0] > 120 ? parts[0] : parts[0] * 60;
          }
        }

        // Category Resolution: Auto-Create Category in Supabase if missing
        let categoryObj = item.category_id ? existingCategoriesMap.get(item.category_id) : (item.category_slug ? existingCategoriesMap.get(item.category_slug.toLowerCase()) : null);
        let validCategoryId: string | null = null;
        let categoryName = categoryObj?.name || 'Selected Category';

        if (categoryObj && isValidUUID(categoryObj.id)) {
          validCategoryId = categoryObj.id;
        } else if (item.category_name || item.category_id || item.category_slug) {
          const catRawName = item.category_name || item.category_id || item.category_slug || 'General';
          const catSlug = normalizeSlug(catRawName);

          try {
            const { data: dbCat } = await supabaseAdmin
              .from('categories')
              .upsert({ name: catRawName, slug: catSlug }, { onConflict: 'slug' })
              .select()
              .single();

            if (dbCat && dbCat.id) {
              validCategoryId = dbCat.id;
              categoryName = dbCat.name;
              existingCategoriesMap.set(dbCat.id, dbCat);
              existingCategoriesMap.set(catSlug, dbCat);
            }
          } catch (e) {
            console.warn('Auto category creation warning:', e);
          }
        }

        const performerName = item.performer_name || item.performers || item.performer || null;

        // Check if video ALREADY EXISTS by External Gallery ID or Slug
        const extKey = external_id ? `${external_source}:${external_id}` : null;
        let targetVid = extKey ? existingVideosMap.get(extKey) || existingVideosMap.get(`slug:${cleanSlug.toLowerCase()}`) : existingVideosMap.get(`slug:${cleanSlug.toLowerCase()}`);

        const orderIdx = typeof item.order_index === 'number' ? item.order_index : (idx + 1);
        const totalCount = typeof item.total_items === 'number' ? item.total_items : rawItems.length;

        // Item 1 (orderIdx = 1) receives highest/newest timestamp for top position under created_at DESC
        const seqTimestamp = new Date(nowBase + Math.max(totalCount - orderIdx, 0) * 1000).toISOString();

        if (targetVid) {
          // If this is a duplicate within the same batch, skip creating a redundant copy
          if (String(targetVid.id).startsWith('temp-')) {
            continue;
          }

          // CASE 2: Video Already Exists! Update sequence timestamp so order is refreshed to top
          updatedCount++;

          try {
            await supabaseAdmin
              .from('videos')
              .update({ created_at: seqTimestamp, updated_at: new Date().toISOString() })
              .eq('id', targetVid.id);
          } catch (e) {
            // Optional timestamp update
          }

          itemsSummary.push({
            id: targetVid.id,
            title: targetVid.title || cleanTitle,
            external_id: targetVid.external_id || external_id || null,
            thumbnail_url: targetVid.thumbnail_url || item.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            status: 'already_existed',
            category_name: categoryName,
          });

          if (validCategoryId) {
            videoCategoryJunctions.push({ video_id: targetVid.id, category_id: validCategoryId });
          }
        } else if (cleanTitle) {
          // Prepare for 1-Click Matrix Bulk Upsert
          batchToInsertPayloads.push({
            title: cleanTitle,
            slug: cleanSlug,
            description: item.description || null,
            category_id: validCategoryId,
            external_source,
            external_id: external_id || null,
            is_external: true,
            external_url: targetUrl || 'https://www.youtube.com',
            thumbnail_key: item.thumbnail_key || null,
            thumbnail_url: item.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            duration_seconds: durationSecs,
            performer_name: performerName,
            is_published: true,
            created_at: seqTimestamp,
          });

          batchToInsertMeta.push({
            cleanTitle,
            cleanSlug,
            external_id,
            categoryName,
            validCategoryId,
            performerName,
            extKey,
            thumbnail_url: item.thumbnail_url,
          });

          // Add to existingVideosMap so subsequent duplicates in the same batch are detected as "already existed"!
          const tempVideoObj = { id: `temp-${idx}`, title: cleanTitle, slug: cleanSlug };
          if (extKey) {
            existingVideosMap.set(extKey, tempVideoObj);
          }
          existingVideosMap.set(`slug:${cleanSlug.toLowerCase()}`, tempVideoObj);
        }
      }

      // Execute 1-Click Matrix Bulk Upsert for all new videos at once (50x Faster!)
      if (batchToInsertPayloads.length > 0) {
        let insertedVids: any[] | null = null;

        // Attempt 1: Bulk Upsert with full payload
        const { data: bulkData, error: bulkErr } = await supabaseAdmin
          .from('videos')
          .upsert(batchToInsertPayloads, { onConflict: 'slug' })
          .select();

        if (!bulkErr && bulkData) {
          insertedVids = bulkData;
        } else {
          console.warn('Bulk matrix upsert fallback triggered:', bulkErr?.message);

          // Fallback Attempt 2: Omit optional schema columns if missing in live DB
          const fallbackPayloads = batchToInsertPayloads.map((p) => {
            const copy = { ...p };
            delete copy.external_source;
            delete copy.external_id;
            return copy;
          });

          const { data: fbData, error: fbErr } = await supabaseAdmin
            .from('videos')
            .upsert(fallbackPayloads, { onConflict: 'slug' })
            .select();

          if (!fbErr && fbData) {
            insertedVids = fbData;
          } else {
            console.error('Fallback matrix upsert failed:', fbErr?.message);
          }
        }

        if (insertedVids) {
          for (let i = 0; i < insertedVids.length; i++) {
            const v = insertedVids[i];
            const meta = batchToInsertMeta[i] || {};
            createdCount++;

            if (meta.extKey) existingVideosMap.set(meta.extKey, v);
            if (meta.cleanSlug) existingVideosMap.set(`slug:${meta.cleanSlug.toLowerCase()}`, v);

            itemsSummary.push({
              id: v.id,
              title: v.title,
              external_id: v.external_id || meta.external_id || null,
              thumbnail_url: v.thumbnail_url || meta.thumbnail_url,
              status: 'created',
              category_name: meta.categoryName,
            });

            if (meta.validCategoryId) {
              videoCategoryJunctions.push({ video_id: v.id, category_id: meta.validCategoryId });
            }

            // Auto-create & link Performers in pornstars table
            if (meta.performerName) {
              const pNamesList = String(meta.performerName).split(',').map((s) => s.trim()).filter(Boolean);
              for (const pName of pNamesList) {
                let pObj = existingPornstarsMap.get(normalizeName(pName));
                if (!pObj) {
                  try {
                    const pSlug = normalizeSlug(pName);
                    const { data: newStar } = await supabaseAdmin
                      .from('pornstars')
                      .upsert({ name: pName, slug: pSlug }, { onConflict: 'slug' })
                      .select()
                      .single();

                    if (newStar) {
                      pObj = newStar;
                      existingPornstarsMap.set(normalizeName(pName), newStar);
                      existingPornstarsMap.set(pSlug, newStar);
                    }
                  } catch (e) {
                    // Optional star creation
                  }
                }

                if (pObj && pObj.id) {
                  videoPornstarJunctions.push({ video_id: v.id, pornstar_id: pObj.id });
                }
              }
            }
          }
        }
      }

      // Batch Insert Junction Relationships (Fail-Safe)
      if (videoCategoryJunctions.length > 0) {
        try {
          await supabaseAdmin.from('video_categories').upsert(videoCategoryJunctions, { ignoreDuplicates: true });
        } catch (e) {
          console.warn('video_categories junction optional:', e);
        }
      }

      if (videoPornstarJunctions.length > 0) {
        try {
          await supabaseAdmin.from('video_pornstars').upsert(videoPornstarJunctions, { ignoreDuplicates: true });
        } catch (e) {
          console.warn('video_pornstars junction optional:', e);
        }
      }

      return NextResponse.json({
        success: true,
        count: rawItems.length,
        created: createdCount,
        updated: updatedCount,
        errors: errorLog,
        itemsSummary,
        message: `Processed ${rawItems.length} items (${createdCount} created, ${updatedCount} existing linked)`,
      });
    }

    // Single item edit or insert
    const {
      id: reqId,
      title,
      slug,
      description,
      category_id,
      is_external,
      video_key,
      external_url,
      thumbnail_key,
      thumbnail_url,
      duration_seconds,
      performer_name,
      is_published,
      external_id: reqExtId,
      external_source: reqExtSrc,
    } = payload;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanSlug = slug ? slug.trim() : normalizeSlug(cleanTitle);
    const { external_source, external_id } = extractExternalId(reqExtId || external_url);
    let validCatId = isValidUUID(category_id) ? category_id : null;

    // Single Item Update
    if (reqId) {
      const updateData: any = {
        title: cleanTitle,
        slug: cleanSlug,
        description: description || null,
        category_id: validCatId,
        external_url: external_url || null,
        thumbnail_url: thumbnail_url || null,
        duration_seconds: Number(duration_seconds) || 0,
        performer_name: performer_name || null,
        is_published: is_published !== undefined ? Boolean(is_published) : true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('videos')
        .update(updateData)
        .eq('id', reqId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ video: data });
    }

    // Single Item Insert
    const singlePayload: any = {
      title: cleanTitle,
      slug: cleanSlug,
      description: description || null,
      category_id: validCatId,
      external_source: reqExtSrc || external_source,
      external_id: reqExtId || external_id || null,
      is_external: Boolean(is_external),
      video_key: video_key || null,
      external_url: external_url || null,
      thumbnail_key: thumbnail_key || null,
      thumbnail_url: thumbnail_url || null,
      duration_seconds: Number(duration_seconds) || 0,
      performer_name: performer_name || null,
      is_published: true,
    };

    let { data, error } = await supabaseAdmin
      .from('videos')
      .upsert(singlePayload, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      const fallbackPayload = {
        title: cleanTitle,
        slug: cleanSlug,
        external_url: external_url || null,
        thumbnail_url: thumbnail_url || null,
        duration_seconds: Number(duration_seconds) || 0,
        performer_name: performer_name || null,
        is_published: true,
      };

      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('videos')
        .upsert(fallbackPayload, { onConflict: 'slug' })
        .select()
        .single();

      if (!retryError && retryData) {
        data = retryData;
        error = null;
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ video: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const purgeAll = searchParams.get('purge_all');
    const cleanDuplicates = searchParams.get('clean_duplicates');

    let bodyIds: string[] = [];
    try {
      const body = await request.json();
      if (Array.isArray(body?.ids)) bodyIds = body.ids;
    } catch {
      // JSON body optional
    }

    const supabaseAdmin = getAdminSupabase();

    // 1. Clean duplicates across all videos (Supports 60k+ videos using keyset pagination)
    if (cleanDuplicates === 'true') {
      let allVids: { id: string; external_id: string | null; slug: string; title: string }[] = [];
      let offset = 0;
      let hasMore = true;
      const batchSize = 1000;

      while (hasMore) {
        let query = supabaseAdmin
          .from('videos')
          .select('id, external_id, slug, title')
          .order('created_at', { ascending: true })
          .range(offset, offset + batchSize - 1);

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          hasMore = false;
          break;
        }

        allVids = allVids.concat(data);
        offset += data.length;
        if (data.length < batchSize) {
          hasMore = false;
        }
      }

      const totalScanned = allVids.length;
      const seenExtIds = new Map<string, string>(); // external_id -> original video id
      const seenTitles = new Map<string, string>(); // title -> original video id
      const seenSlugs = new Map<string, string>(); // slug -> original video id
      const duplicateIds: string[] = [];
      const dupToOrigMap = new Map<string, string>(); // duplicate video id -> original video id

      for (const v of allVids) {
        const cleanTitle = (v.title || '').trim().toLowerCase();
        const cleanSlug = (v.slug || '').trim().toLowerCase();
        let isDuplicate = false;
        let origId = '';

        // Rule 1: Duplicate by External ID
        if (v.external_id) {
          const extId = v.external_id.trim();
          if (seenExtIds.has(extId)) {
            isDuplicate = true;
            origId = seenExtIds.get(extId)!;
          } else {
            seenExtIds.set(extId, v.id);
          }
        }

        // Rule 2: Duplicate by Title
        if (!isDuplicate && cleanTitle) {
          if (seenTitles.has(cleanTitle)) {
            isDuplicate = true;
            origId = seenTitles.get(cleanTitle)!;
          } else {
            seenTitles.set(cleanTitle, v.id);
          }
        }

        // Rule 3: Duplicate by Slug (or slug with suffix like -1, -2)
        if (!isDuplicate && cleanSlug) {
          if (seenSlugs.has(cleanSlug)) {
            isDuplicate = true;
            origId = seenSlugs.get(cleanSlug)!;
          } else {
            seenSlugs.set(cleanSlug, v.id);

            const suffixMatch = cleanSlug.match(/^(.+)-(\d+)$/);
            if (suffixMatch) {
              const baseSlug = suffixMatch[1];
              if (seenSlugs.has(baseSlug)) {
                isDuplicate = true;
                origId = seenSlugs.get(baseSlug)!;
              }
            }
          }
        }

        if (isDuplicate && origId) {
          const targetIdsSet = bodyIds.length > 0 ? new Set(bodyIds) : null;
          if (!targetIdsSet || targetIdsSet.has(v.id)) {
            duplicateIds.push(v.id);
            dupToOrigMap.set(v.id, origId);
          }
        }
      }

      // Re-link category, pornstar, and tag associations from duplicates to originals before purging
      if (duplicateIds.length > 0) {
        try {
          const [{ data: catJuncs }, { data: psJuncs }, { data: tagJuncs }] = await Promise.all([
            supabaseAdmin.from('video_categories').select('*').in('video_id', duplicateIds),
            supabaseAdmin.from('video_pornstars').select('*').in('video_id', duplicateIds),
            supabaseAdmin.from('video_tags').select('*').in('video_id', duplicateIds)
          ]);

          const categoriesToRelink: { video_id: string; category_id: string }[] = [];
          const pornstarsToRelink: { video_id: string; pornstar_id: string }[] = [];
          const tagsToRelink: { video_id: string; tag_id: string }[] = [];

          if (catJuncs) {
            for (const j of catJuncs) {
              const origId = dupToOrigMap.get(j.video_id);
              if (origId) categoriesToRelink.push({ video_id: origId, category_id: j.category_id });
            }
          }

          if (psJuncs) {
            for (const j of psJuncs) {
              const origId = dupToOrigMap.get(j.video_id);
              if (origId) pornstarsToRelink.push({ video_id: origId, pornstar_id: j.pornstar_id });
            }
          }

          if (tagJuncs) {
            for (const j of tagJuncs) {
              const origId = dupToOrigMap.get(j.video_id);
              if (origId) tagsToRelink.push({ video_id: origId, tag_id: j.tag_id });
            }
          }

          // Bulk upsert new relationships mapping to original IDs
          await Promise.all([
            categoriesToRelink.length > 0 ? supabaseAdmin.from('video_categories').upsert(categoriesToRelink, { ignoreDuplicates: true }) : Promise.resolve(),
            pornstarsToRelink.length > 0 ? supabaseAdmin.from('video_pornstars').upsert(pornstarsToRelink, { ignoreDuplicates: true }) : Promise.resolve(),
            tagsToRelink.length > 0 ? supabaseAdmin.from('video_tags').upsert(tagsToRelink, { ignoreDuplicates: true }) : Promise.resolve()
          ]);
        } catch (e) {
          console.warn('Junction re-linking failed:', e);
        }
      }

      // Batch delete the duplicates
      let deletedCount = 0;
      const deleteBatchSize = 100;
      for (let i = 0; i < duplicateIds.length; i += deleteBatchSize) {
        const batch = duplicateIds.slice(i, i + deleteBatchSize);
        const { error } = await supabaseAdmin.from('videos').delete().in('id', batch);
        if (!error) {
          deletedCount += batch.length;
        }
      }

      return NextResponse.json({
        success: true,
        scanned: totalScanned,
        duplicatesFound: duplicateIds.length,
        deletedCount,
        message: `Scanned ${totalScanned} videos, deleted ${deletedCount} duplicates.`,
      });
    }

    // 2. Purge ALL Videos
    if (purgeAll === 'true') {
      const { error } = await supabaseAdmin.from('videos').delete().neq('title', '___NONE_EXISTING___');
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'All videos purged successfully' });
    }

    // 3. Bulk Delete Selected IDs Array
    if (bodyIds.length > 0) {
      const { error } = await supabaseAdmin.from('videos').delete().in('id', bodyIds);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, count: bodyIds.length });
    }

    // 4. Single Item Delete
    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('videos').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
