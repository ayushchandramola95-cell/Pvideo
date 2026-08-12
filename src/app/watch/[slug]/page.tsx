import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchVideoBySlug, fetchVideos, formatViews, formatDuration, getThumbnailUrl } from '@/lib/data';
import { getPublicMediaUrl } from '@/lib/r2';
import VideoCard from '@/components/VideoCard';
import AdBanner from '@/components/AdBanner';
import styles from './Watch.module.css';

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WatchPageProps) {
  const { slug } = await params;
  const video = await fetchVideoBySlug(slug);
  if (!video) return { title: 'Video Not Found' };

  const title = `${video.title} - Video Details & Release`;
  const performer = video.performer_name || 'top performers';
  const description = `Explore ${video.title}, featuring ${performer}. View the release details, duration, categories and related releases on Pornora.`;
  const thumbnailUrl = getThumbnailUrl(video);

  return {
    title,
    description,
    alternates: {
      canonical: `/watch/${slug}`,
    },
    openGraph: {
      title,
      description: video.description || description,
      images: [thumbnailUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: video.description || description,
      images: [thumbnailUrl],
    },
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  const video = await fetchVideoBySlug(slug);

  if (!video) {
    notFound();
  }

  const related = await fetchVideos({ categorySlug: video.category?.slug, limit: 12 });
  const filteredRelated = related.filter((v) => v.slug !== video.slug).slice(0, 10);

  const videoUrl = video.video_key ? getPublicMediaUrl(video.video_key) : '';
  const thumbnailUrl = getThumbnailUrl(video);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pornora.site';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description || `Watch ${video.title} on Pornora.`,
    thumbnailUrl: thumbnailUrl,
    uploadDate: video.created_at,
    contentUrl: video.is_external ? video.external_url : videoUrl,
    embedUrl: video.is_external ? video.external_url : undefined,
  };

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
        name: video.category?.name || 'Category',
        item: `${baseUrl}/categories/${video.category?.slug || ''}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: video.title,
        item: `${baseUrl}/watch/${video.slug}`,
      },
    ],
  };

  return (
    <div className={styles.wrapper}>
      {/* SEO JSON-LD Structured Data */}
      {!video.is_external && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className={`container ${styles.layout}`}>
        {/* Main Watch Column */}
        <div>
          {video.is_external || !video.video_key ? (
            <div className={styles.externalBanner}>
              <div className={styles.externalIcon}>
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <h3 className={styles.externalTitle}>Third-Party Video Release</h3>
              <p className={styles.externalText}>
                This premium video release is hosted externally. Click below to open and watch on the destination website.
              </p>
              {video.external_url && (
                <a
                  href={video.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalBtn}
                >
                  <span>Watch Now</span>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <div className={styles.playerContainer}>
              <video
                src={videoUrl}
                controls
                autoPlay
                className={styles.videoPlayer}
                poster={thumbnailUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Ad Banner under the video player */}
          <AdBanner size="watch-under-player" />

          <div className={styles.details}>
            <h1 className={styles.title}>{video.title}</h1>

            <div className={styles.metaRow}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {video.category ? (
                  <Link href={`/categories/${video.category.slug}`} className={styles.categoryTag} style={{ textDecoration: 'none' }}>
                    {video.category.name}
                  </Link>
                ) : (
                  <span className={styles.categoryTag}>General</span>
                )}
                <span style={{ color: '#334155' }}>&bull;</span>
                <span>{formatViews(video.views_count)} views</span>
                {video.duration_seconds > 0 && (
                  <>
                    <span style={{ color: '#334155' }}>&bull;</span>
                    <span>{formatDuration(video.duration_seconds)}</span>
                  </>
                )}
              </div>
              <div style={{ color: '#4a5568', fontSize: '0.82rem' }}>
                Added {new Date(video.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* Action Row */}
            <div className={styles.actionRow}>
              <button className={`${styles.actionBtn} ${styles.actionBtnLike}`} type="button">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {video.likes_count > 0 ? formatViews(video.likes_count) : 'Like'}
              </button>
              <button className={styles.actionBtn} type="button">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
                Share
              </button>
              {!video.is_external && video.video_key && (
                <a href={videoUrl} download className={styles.actionBtn}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  Download
                </a>
              )}
            </div>

            {video.performer_name && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.88rem' }}>Performers:</span>
                <Link href={`/search?q=${encodeURIComponent(video.performer_name)}`} style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
                  {video.performer_name}
                </Link>
              </div>
            )}

            {video.description && (
              <div className={styles.descriptionBox}>
                <p>{video.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Shelf */}
        <aside>
          {/* Sidebar Ad Banner */}
          <AdBanner size="sidebar-square" />

          <h3 className={styles.sidebarTitle}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Related Videos
          </h3>
          <div className={styles.sidebarList}>
            {filteredRelated.map((rel) => (
              <VideoCard key={rel.id} video={rel} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
