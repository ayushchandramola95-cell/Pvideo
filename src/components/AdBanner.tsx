'use client';

import React from 'react';
import Link from 'next/link';
import styles from './AdBanner.module.css';

interface AdBannerProps {
  size: 'top-leaderboard' | 'watch-under-player' | 'sidebar-square';
}

export default function AdBanner({ size }: AdBannerProps) {
  // If the user has live banner script/image keys, they can put them here.
  // For now, we render a beautiful monetization placeholder that drives traffic to their advertising page!
  return (
    <div className={styles.container}>
      <span className={styles.label}>Advertisement</span>
      <Link href="/info/advertise" className={`${styles.bannerSlot} ${styles[`size_${size}`]}`}>
        <div>
          <h4 className={styles.bannerSlotTitle}>YOUR AD BANNER HERE</h4>
          <span className={styles.bannerSlotLink}>Buy Traffic &raquo;</span>
        </div>
      </Link>
    </div>
  );
}
