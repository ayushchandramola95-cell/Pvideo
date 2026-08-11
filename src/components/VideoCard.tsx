'use client';

import React from 'react';
import Link from 'next/link';
import { Video, formatDuration, getThumbnailUrl } from '@/lib/data';
import styles from './VideoCard.module.css';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const thumbnailUrl = getThumbnailUrl(video);

  const handleExternalClick = () => {
    try {
      fetch(`/api/views/${video.id}`, { method: 'POST' }).catch(() => {});
    } catch {
      // Ignore background errors
    }
  };

  const tagLabel = video.performer_name || video.source_name || video.category?.name || 'Popular';

  const CardInner = (
    <article className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        <img
          src={thumbnailUrl}
          alt={video.title}
          className={styles.thumbnail}
          loading="lazy"
        />

        {/* Top Right Duration Badge */}
        {video.duration_seconds > 0 && (
          <span className={styles.durationBadge}>
            {formatDuration(video.duration_seconds)}
          </span>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title} title={video.title}>
          {video.title}
        </h3>

        {/* Performer / Channel Tag Pill */}
        <div className={styles.tagPill}>
          <span className={styles.starIcon}>★</span>
          <span>{tagLabel}</span>
        </div>
      </div>
    </article>
  );

  return (
    <Link href={`/watch/${video.slug}`} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
      {CardInner}
    </Link>
  );
}
