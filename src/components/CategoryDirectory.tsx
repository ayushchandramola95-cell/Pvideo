'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATEGORY_DIRECTORY_GROUPS } from '@/lib/data';
import styles from './CategoryDirectory.module.css';

export default function CategoryDirectory() {
  const pathname = usePathname();

  // Hide A-Z Category Directory on Admin Portal routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Contiguously partition the letter groups into 7 balanced columns
  const numColumns = 7;
  const columns: typeof CATEGORY_DIRECTORY_GROUPS[] = Array.from({ length: numColumns }, () => []);

  // Calculate weights: items count + 2 for the header block
  const groupsWithWeight = CATEGORY_DIRECTORY_GROUPS.map(g => ({
    ...g,
    weight: g.items.length + 2
  }));

  const totalWeight = groupsWithWeight.reduce((sum, g) => sum + g.weight, 0);
  const targetWeightPerColumn = totalWeight / numColumns;

  let currentColumnIdx = 0;
  let currentColumnWeight = 0;

  groupsWithWeight.forEach((g) => {
    const weightWithGroup = currentColumnWeight + g.weight;
    const currentDiff = Math.abs(currentColumnWeight - targetWeightPerColumn);
    const nextDiff = Math.abs(weightWithGroup - targetWeightPerColumn);

    // Roll over to next column if it achieves a closer weight to target
    if (currentColumnWeight > 0 && nextDiff > currentDiff && currentColumnIdx < numColumns - 1) {
      currentColumnIdx++;
      currentColumnWeight = 0;
    }

    columns[currentColumnIdx].push(g);
    currentColumnWeight += g.weight;
  });

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          All Categories Directory (A-Z)
        </h2>

        <div className={styles.columnsGrid}>
          {columns.map((columnGroups, colIdx) => (
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
