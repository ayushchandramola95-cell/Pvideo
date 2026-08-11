'use client';

import React from 'react';
import Link from 'next/link';
import { Video, formatDuration, getThumbnailUrl } from '@/lib/data';
import styles from './VideoCard.module.css';

interface VideoCardProps {
  video: Video;
}

function formatViews(n?: number | null): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K views`;
  return `${n} views`;
}

export default function VideoCard({ video }: VideoCardProps) {
  const thumbnailUrl = getThumbnailUrl(video);
  const tagLabel = video.performer_name || video.source_name || video.category?.name || 'Popular';
  const viewsLabel = formatViews(video.views_count);

  return (
    <Link href={`/watch/${video.slug}`} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
      <article className={styles.card}>
        <div className={styles.thumbnailWrapper}>
          <img
            src={thumbnailUrl}
            alt={video.title}
            className={styles.thumbnail}
            loading="lazy"
          />

          {/* Play button overlay */}
          <div className={styles.playOverlay}>
            <div className={styles.playBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Duration badge */}
          {video.duration_seconds > 0 && (
            <span className={styles.durationBadge}>
              {formatDuration(video.duration_seconds)}
            </span>
          )}

          {/* HD badge */}
          <span className={styles.hdBadge}>HD</span>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title} title={video.title}>
            {video.title}
          </h3>

          <div className={styles.metaRow}>
            {/* Performer / Channel Tag Pill */}
            <div className={styles.tagPill}>
              <span className={styles.starIcon}>★</span>
              <span>{tagLabel}</span>
            </div>

            {/* Views */}
            {viewsLabel && (
              <span className={styles.viewCount}>{viewsLabel}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
