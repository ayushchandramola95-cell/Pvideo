import React from 'react';
import Link from 'next/link';
import { Category, getCategoryCoverUrl } from '@/lib/data';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  category: Category;
}

function formatCount(n?: number | null): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K views`;
  return `${n} views`;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const coverUrl = getCategoryCoverUrl(category);
  const countLabel = formatCount(category.views_count);

  return (
    <Link href={`/categories/${category.slug}`} className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        <img
          src={coverUrl}
          alt={category.name}
          className={styles.coverImage}
          loading="lazy"
        />
        {/* Dark gradient overlay */}
        <div className={styles.overlay} />

        {/* Title bar overlaid on image */}
        <div className={styles.titleBar}>
          <span className={styles.title} title={category.name}>
            {category.name}
          </span>
          {countLabel && (
            <span className={styles.countBadge}>{countLabel}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
