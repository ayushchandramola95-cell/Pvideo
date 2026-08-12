'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import styles from './AdBanner.module.css';

// ---------------------------------------------------------------------------
// 💰 EXOCLICK AD ZONES CONFIGURATION
// ---------------------------------------------------------------------------
// Paste your live ExoClick Zone IDs here. 
// If a zone ID is left blank (""), the ad slot will be completely hidden 
// and will NOT take up any space or show any grey placeholders.
// ---------------------------------------------------------------------------
const EXOCLICK_ZONE_IDS: Record<string, string> = {
  'header-top': '6000940',   // Leaderboard at the top of homepage/category pages
  'above-directory': '6000942',     // Leaderboard just above the A-Z Category Directory
  'above-footer': '6000944',        // Leaderboard just above the footer
  'watch-under-player': '6000952',  // Leaderboard directly below the video player
  'sidebar-square': '6000954',      // Square banner in the related videos sidebar
};

interface AdBannerProps {
  size: 'header-top' | 'above-directory' | 'above-footer' | 'watch-under-player' | 'sidebar-square';
}

export default function AdBanner({ size }: AdBannerProps) {
  const zoneId = EXOCLICK_ZONE_IDS[size];

  useEffect(() => {
    if (!zoneId) return;

    try {
      // Trigger ExoClick's AdProvider script to populate the ins element
      // @ts-ignore
      const AdProvider = window.AdProvider || [];
      AdProvider.push({ serve: {} });
    } catch (err) {
      console.error('Error triggering ExoClick AdProvider:', err);
    }
  }, [zoneId]);

  // If no zone ID is configured, render absolutely nothing!
  if (!zoneId) {
    return null;
  }

  return (
    <div className={styles.container}>
      <span className={styles.label}>Advertisement</span>
      
      {/* Load ExoClick's ad-provider script */}
      <Script 
        src="https://a.magsrv.com/ad-provider.js" 
        strategy="afterInteractive" 
      />

      <div className={styles.adWrapper}>
        <ins 
          className="eas6a97888e2" 
          data-zoneid={zoneId}
        />
      </div>
    </div>
  );
}
