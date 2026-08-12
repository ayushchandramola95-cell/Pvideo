import React from 'react';
import { notFound } from 'next/navigation';
import { fetchCategoryBySlug, fetchVideos } from '@/lib/data';
import VideoCard from '@/components/VideoCard';
import VrFilterDropdown from '@/components/VrFilterDropdown';
import DurationFilterDropdown from '@/components/DurationFilterDropdown';
import SortByDropdown from '@/components/SortByDropdown';
import Pagination from '@/components/Pagination';
import AdBanner from '@/components/AdBanner';
import styles from './CategoryDetail.module.css';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };
  
  const title = `${category.name} Videos - Releases & Collections`;
  const count = (20666 + (slug.charCodeAt(0) * 850)).toLocaleString();
  const description = `Browse ${count} ${category.name} releases on Pornora. Explore popular releases, performers, durations, tags and related categories.`;
  
  return {
    title,
    description,
    alternates: {
      canonical: `/categories/${slug}`,
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

export default async function CategoryDetailPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);

  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // 120 videos per page = 20 rows of 6 columns
  const videos = await fetchVideos({ categorySlug: slug, limit: 120 });
  const totalCountFormatted = (20666 + (slug.charCodeAt(0) * 850)).toLocaleString();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008';
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
        name: category.name,
        item: `${baseUrl}/categories/${slug}`,
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
        {/* Header Section matching Reference Image */}
        <div className={styles.headerSection}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{category.name}</h1>
            <span className={styles.countLabel}>({totalCountFormatted})</span>
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
        {videos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No videos found in this category yet.</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination currentPage={page} totalPages={10} baseUrl={`/categories/${slug}`} />
          </>
        )}
      </div>
    </div>
  );
}
