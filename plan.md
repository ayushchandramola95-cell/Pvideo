# PVideo Project Implementation Plan

This document serves as the master checklist and architecture specification for building the **PVideo** video streaming portal inside `C:\new website creation\pvideo`.

---

## 🚀 Phase 0: Project Initialization & Port Configuration (Localhost:3008) [COMPLETED]

### Step 1: Directory Setup & Next.js Creation
1. [x] Initialize the new project directory structure.
2. [x] Run the Next.js boilerplate script:
   ```bash
   npx -y create-next-app@latest . --typescript --eslint --src-dir --app --import-alias "@/*" --use-npm --no-tailwind --disable-git
   ```
3. [x] Use scoped Vanilla CSS Modules.

### Step 2: Port Configuration
1. [x] Modify `package.json` to change the default development port to **`3008`**:
   ```json
   "scripts": {
     "dev": "next dev -p 3008",
     "build": "next build",
     "start": "next start -p 3008",
     "lint": "eslint"
   }
   ```

### Step 3: First Run Verification
1. [x] Start the development server (`npm run dev`).
2. [x] Open `http://localhost:3008` to confirm the boilerplate runs successfully.

---

## 🗄️ Phase 1: Database Setup & Infrastructure Integration [COMPLETED]

### Step 1: Dependencies & Environment Setup
1. [x] Install required client libraries (`@supabase/supabase-js`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).
2. [x] Create `.env.local` template with required keys.

### Step 2: Supabase PostgreSQL Schema (Categories & Dual-Type Videos)
1. [x] Save database schema script to [supabase/schema.sql](file:///c:/new%20website%20creation/pvideo/supabase/schema.sql) for execution in Supabase SQL Editor:

```sql
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

-- Videos Table (Supports Self-Hosted & External Links)
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_is_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
```

### Step 3: Supabase & Cloudflare R2 Client Setup
1. [x] Create [src/lib/supabase.ts](file:///c:/new%20website%20creation/pvideo/src/lib/supabase.ts) for browser & server Supabase clients using `@supabase/supabase-js`.
2. [x] Create [src/lib/r2.ts](file:///c:/new%20website%20creation/pvideo/src/lib/r2.ts) for Cloudflare R2 S3 SDK integration & pre-signed URL generation (`@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`).

---

## 📂 Phase 2: Public UI Components & Page Routes [COMPLETED]

### Step 1: Navigation & Global Layout
* [x] **Header**: Logo, Search bar, Category navigation links, Admin login entry point ([src/components/Header.tsx](file:///c:/new%20website%20creation/pvideo/src/components/Header.tsx)).
* [x] **Footer**: Category list, Copyright, and disclaimers ([src/components/Footer.tsx](file:///c:/new%20website%20creation/pvideo/src/components/Footer.tsx)).

### Step 2: Dynamic Video Card Component
* [x] **Hybrid Behavior**:
  - **Self-Hosted Video (`is_external: false`)**: Clicking the card navigates internally to `/watch/[slug]`.
  - **External Video (`is_external: true`)**: Clicking the card opens `external_url` in a new tab (`target="_blank" rel="noopener noreferrer"`) while tracking view count via API.
* [x] Visual indicators (external link badge vs watch here badge).

### Step 3: Pages Layout Design
* [x] **`/` (Home)**: Hero section, Category Grid, Featured/Latest Videos shelf ([src/app/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/page.tsx)).
* [x] **`/categories/[slug]` (Category Detail)**: Filterable list of videos under the selected category ([src/app/categories/[slug]/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/categories/[slug]/page.tsx)).
* [x] **`/watch/[slug]` (Video Watch Page)**: Custom video player for self-hosted videos + view counter increment API + related videos sidebar ([src/app/watch/[slug]/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/watch/[slug]/page.tsx)).
* [x] **`/search`**: Real-time / server-rendered video search results with Suspense boundary ([src/app/search/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/search/page.tsx)).

---

## 🛡️ Phase 3: Secure Admin Portal & Dual-Mode Media Uploads [COMPLETED]

### Step 1: Admin Auth & Route Guards
* [x] Master passkey authentication page ([src/app/admin/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/admin/page.tsx)).
* [x] Next.js Middleware guarding `/admin/dashboard/*` routes ([src/middleware.ts](file:///c:/new%20website%20creation/pvideo/src/middleware.ts)).

### Step 2: Content Uploader & Management
* [x] **Category Manager**: Add/edit categories with cover images ([src/app/admin/dashboard/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/admin/dashboard/page.tsx)).
* [x] **Dual-Mode Video Uploader**:
  - Toggle between **Self-Hosted Video** (Direct browser-to-R2 upload via pre-signed URL + progress bar) and **External Link** (Paste external URL + thumbnail).
  - Presigned R2 URL generator ([src/app/api/admin/presign/route.ts](file:///c:/new%20website%20creation/pvideo/src/app/api/admin/presign/route.ts)).
  - Save video records to Supabase ([src/app/api/admin/videos/route.ts](file:///c:/new%20website%20creation/pvideo/src/app/api/admin/videos/route.ts)).
* [x] **Video Management Table**: View, delete, and manage published video releases.

---

## 📈 Phase 4: Advanced SEO & Production Deployment [COMPLETED]

### Step 1: Metadata & Canonicalization
* [x] Dynamic `generateMetadata()` with OpenGraph and Twitter card tags on Category and Watch pages ([src/app/watch/[slug]/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/watch/[slug]/page.tsx)).
* [x] JSON-LD Structured Data: `BreadcrumbList` and `VideoObject` schemas ([src/app/watch/[slug]/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/watch/[slug]/page.tsx)).
* [x] Dynamic [sitemap.ts](file:///c:/new%20website%20creation/pvideo/src/app/sitemap.ts) and [robots.ts](file:///c:/new%20website%20creation/pvideo/src/app/robots.ts).

### Step 2: Production Build & Verification
* [x] Standardize client components with `<Suspense>` boundaries ([src/app/search/page.tsx](file:///c:/new%20website%20creation/pvideo/src/app/search/page.tsx)).
* [x] Executed `npm run build` with zero compilation or type errors.
