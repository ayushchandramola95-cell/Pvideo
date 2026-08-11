import React from 'react';
import Link from 'next/link';
import { Category, getCategoryCoverUrl } from '@/lib/data';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const coverUrl = getCategoryCoverUrl(category);

  return (
    <Link href={`/categories/${category.slug}`} className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        <img
          src={coverUrl}
          alt={category.name}
          className={styles.coverImage}
          loading="lazy"
        />
      </div>

      <div className={styles.titleBar}>
        <span className={styles.title} title={category.name}>
          {category.name}
        </span>
      </div>
    </Link>
  );
}
