-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  cover_image_key VARCHAR(512),
  cover_image_url TEXT,
  views_count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Videos Table (Supports Self-Hosted & External Links with Multi-Collection External ID)
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  
  -- Multi-Source / Multi-Collection Primary Tracking Fields
  external_source VARCHAR(100) DEFAULT 'redporn',
  external_id VARCHAR(255),
  
  -- Video Hosting Fields
  is_external BOOLEAN NOT NULL DEFAULT false,
  video_key VARCHAR(512),             -- Cloudflare R2 object key (for self-hosted)
  external_url TEXT,                  -- External website link (if is_external = true)
  
  -- Thumbnail Fields
  thumbnail_key VARCHAR(512),         -- R2 object key for uploaded thumbnail
  thumbnail_url TEXT,                 -- External image URL (or fallback)
  
  -- Metadata
  duration_seconds INT NOT NULL DEFAULT 0,
  views_count BIGINT DEFAULT 0,
  likes_count INT DEFAULT 0,
  dislikes_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  performer_name VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Pornstars Table
CREATE TABLE IF NOT EXISTS pornstars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  photo_url TEXT,
  videos_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Multi-Collection Junction Tables (Many-to-Many Relationships)
CREATE TABLE IF NOT EXISTS video_categories (
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, category_id)
);

CREATE TABLE IF NOT EXISTS video_pornstars (
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  pornstar_id UUID REFERENCES pornstars(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, pornstar_id)
);

CREATE TABLE IF NOT EXISTS video_tags (
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, tag_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_external_source_id ON videos(external_source, external_id);
CREATE INDEX IF NOT EXISTS idx_videos_is_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_pornstars_slug ON pornstars(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pornstars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_pornstars ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;
CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on videos" ON videos;
CREATE POLICY "Allow public read access on videos" ON videos FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Allow public read access on pornstars" ON pornstars;
CREATE POLICY "Allow public read access on pornstars" ON pornstars FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on tags" ON tags;
CREATE POLICY "Allow public read access on tags" ON tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on video_categories" ON video_categories;
CREATE POLICY "Allow public read access on video_categories" ON video_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on video_pornstars" ON video_pornstars;
CREATE POLICY "Allow public read access on video_pornstars" ON video_pornstars FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on video_tags" ON video_tags;
CREATE POLICY "Allow public read access on video_tags" ON video_tags FOR SELECT USING (true);

-- Allow service_role full access for admin mutations
DROP POLICY IF EXISTS "Allow service_role full access on categories" ON categories;
CREATE POLICY "Allow service_role full access on categories" ON categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on videos" ON videos;
CREATE POLICY "Allow service_role full access on videos" ON videos FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on pornstars" ON pornstars;
CREATE POLICY "Allow service_role full access on pornstars" ON pornstars FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on tags" ON tags;
CREATE POLICY "Allow service_role full access on tags" ON tags FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on video_categories" ON video_categories;
CREATE POLICY "Allow service_role full access on video_categories" ON video_categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on video_pornstars" ON video_pornstars;
CREATE POLICY "Allow service_role full access on video_pornstars" ON video_pornstars FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on video_tags" ON video_tags;
CREATE POLICY "Allow service_role full access on video_tags" ON video_tags FOR ALL USING (true);
