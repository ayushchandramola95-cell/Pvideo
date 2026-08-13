import React from 'react';
import { notFound } from 'next/navigation';
import { fetchPornstarBySlug, fetchPornstarVideos } from '@/lib/data';
import VideoCard from '@/components/VideoCard';
import VrFilterDropdown from '@/components/VrFilterDropdown';
import DurationFilterDropdown from '@/components/DurationFilterDropdown';
import SortByDropdown from '@/components/SortByDropdown';
import Pagination from '@/components/Pagination';
import AdBanner from '@/components/AdBanner';
import NativeGridAd from '@/components/NativeGridAd';
import styles from '@/app/categories/[slug]/CategoryDetail.module.css'; // Reuse CategoryDetail styles for layout consistency

interface PerformerPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; sort?: string; page?: string }>;
}

export const revalidate = 600; // Cache compiled performer details pages for 10 minutes

export async function generateMetadata({ params }: PerformerPageProps) {
  const { slug } = await params;
  const pornstar = await fetchPornstarBySlug(slug);
  if (!pornstar) return { title: 'Performer Not Found' };
  
  const title = `Watch ${pornstar.name} Porn Videos & Sex Scenes - Free HD Clips`;
  const description = `Watch free ${pornstar.name} porn videos, HD sex clips, and full length releases on Pornora. Explore popular ${pornstar.name} scenes, performers directory and bios.`;
  
  return {
    title,
    description,
    alternates: {
      canonical: `/pornstars/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PerformerDetailPage({ params, searchParams }: PerformerPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);

  const pornstar = await fetchPornstarBySlug(slug);

  if (!pornstar) {
    notFound();
  }

  // Fetch videos featuring this performer
  const videos = await fetchPornstarVideos(pornstar.name);
  const totalCount = videos.length;
  
  // Client-side pagination (limit to 120 videos per page)
  const limit = 120;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalCount);
  const paginatedVideos = videos.slice(startIndex, endIndex);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pornora.site';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Pornstars',
        item: `${baseUrl}/pornstars`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: pornstar.name,
        item: `${baseUrl}/pornstars/${slug}`,
      },
    ],
  };

  return (
    <div className={styles.wrapper}>
      {/* SEO Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container">
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{pornstar.name}</h1>
            <span className={styles.countLabel}>({totalCount.toLocaleString()} Videos)</span>
          </div>

          {/* Top Header Ad Banner */}
          <AdBanner size="header-top" />

          <div className={styles.controlsRow}>
            {/* Left Filter Buttons & Custom Dropdowns */}
            <div className={styles.filterGroup}>
              <button className={styles.btnNew}>New Videos</button>
              <button className={styles.btnBest}>Best Videos</button>

              {/* Custom Duration Dropdown Popup */}
              <DurationFilterDropdown />

              {/* Custom VR Dropdown Popup */}
              <VrFilterDropdown />
            </div>

            {/* Right Sort By Custom Dropdown */}
            <SortByDropdown />
          </div>
        </div>

        {/* Video Grid Section */}
        {paginatedVideos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No videos found featuring {pornstar.name} yet.</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {paginatedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Native ad row below the grid */}
            <NativeGridAd />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/pornstars/${slug}`} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
