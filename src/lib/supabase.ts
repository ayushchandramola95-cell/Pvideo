import { createClient } from '@supabase/supabase-js';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_key: string | null;
  cover_image_url: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  is_external: boolean;
  video_key: string | null;
  external_url: string | null;
  thumbnail_key: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  views_count: number;
  likes_count: number;
  dislikes_count: number;
  is_published: boolean;
  performer_name?: string;
  source_name?: string;
  external_source?: string | null;
  external_id?: string | null;
  rating_percent?: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getAdminSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
