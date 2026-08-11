'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BALANCED_DIRECTORY_COLUMNS } from '@/lib/data';
import styles from './CategoryDirectory.module.css';

export default function CategoryDirectory() {
  const pathname = usePathname();

  // Hide A-Z Category Directory on Admin Portal routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          All Categories Directory (A-Z)
        </h2>

        <div className={styles.columnsGrid}>
          {BALANCED_DIRECTORY_COLUMNS.map((columnGroups, colIdx) => (
            <div key={colIdx} className={styles.column}>
              {columnGroups.map((group) => (
                <div key={group.letter} className={styles.group}>
                  <div className={styles.letterHeader}>{group.letter}</div>
                  {group.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/categories/${item.slug}`}
                      className={styles.categoryLink}
                      title={item.name}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
