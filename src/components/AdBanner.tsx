'use client';

import React, { useEffect, useRef } from 'react';
import styles from './AdBanner.module.css';

// ---------------------------------------------------------------------------
// 💰 EXOCLICK AD ZONES CONFIGURATION
// ---------------------------------------------------------------------------
// Paste your live ExoClick Zone IDs here. 
// If a zone ID is left blank (""), the ad slot will be completely hidden 
// and will NOT take up any space or show any grey placeholders.
// ---------------------------------------------------------------------------
const EXOCLICK_ZONE_IDS: Record<string, string> = {
  'header-top': '',          // Leaderboard at the top of homepage/category pages
  'above-directory': '',     // Leaderboard just above the A-Z Category Directory
  'above-footer': '',        // Leaderboard just above the footer
  'watch-under-player': '',  // Leaderboard directly below the video player
  'sidebar-square': '',      // Square banner in the related videos sidebar
};

// Default dimension mapping for different slots (used to configure the iframe height/width)
const AD_DIMENSIONS: Record<string, { width: string; height: string }> = {
  'header-top': { width: '728', height: '90' },
  'above-directory': { width: '728', height: '90' },
  'above-footer': { width: '728', height: '90' },
  'watch-under-player': { width: '728', height: '90' },
  'sidebar-square': { width: '300', height: '250' },
};

interface AdBannerProps {
  size: 'header-top' | 'above-directory' | 'above-footer' | 'watch-under-player' | 'sidebar-square';
}

export default function AdBanner({ size }: AdBannerProps) {
  const zoneId = EXOCLICK_ZONE_IDS[size];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!zoneId || !containerRef.current) return;

    // Clear the container to prevent double rendering or script duplication
    containerRef.current.innerHTML = '';

    const dims = AD_DIMENSIONS[size] || { width: '300', height: '250' };

    // To prevent global variables (like ad_idzone, ad_width, ad_height) from colliding 
    // when multiple ad zones are rendered on the same page, we load each ad inside an isolated iframe.
    const iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.maxWidth = size === 'sidebar-square' ? '300px' : `${dims.width}px`;
    iframe.style.height = `${dims.height}px`;
    iframe.style.overflow = 'hidden';
    iframe.style.margin = '0 auto';
    iframe.style.display = 'block';
    iframe.scrolling = 'no';

    const iframeContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              background: transparent; 
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <script type="text/javascript">
            var ad_idzone = "${zoneId}",
                ad_width = "${dims.width}",
                ad_height = "${dims.height}";
          </script>
          <script type="text/javascript" src="https://ads.exoclick.com/ads.js"></script>
        </body>
      </html>
    `;

    iframe.srcdoc = iframeContent;
    containerRef.current.appendChild(iframe);
  }, [zoneId, size]);

  // If no zone ID is configured, render absolutely nothing!
  if (!zoneId) {
    return null;
  }

  return (
    <div className={styles.container}>
      <span className={styles.label}>Advertisement</span>
      <div ref={containerRef} className={styles.adWrapper} />
    </div>
  );
}
