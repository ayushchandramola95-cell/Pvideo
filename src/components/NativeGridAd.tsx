'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

export default function NativeGridAd() {
  useEffect(() => {
    try {
      // Trigger ExoClick's AdProvider script to populate the recommendation grid
      // @ts-ignore
      const AdProvider = window.AdProvider || [];
      AdProvider.push({ serve: {} });
    } catch (err) {
      console.error('Error triggering ExoClick Native Grid Ad:', err);
    }
  }, []);

  return (
    <div style={{ width: '100%', marginTop: '1.5rem', clear: 'both' }}>
      {/* Load ExoClick's ad-provider script */}
      <Script 
        src="https://a.magsrv.com/ad-provider.js" 
        strategy="afterInteractive" 
      />

      {/* Native Ad Grid Row (class eas6a97888e20 matches your Zone HTML tag) */}
      <ins 
        className="eas6a97888e20" 
        data-zoneid="6000964" 
      />
    </div>
  );
}
