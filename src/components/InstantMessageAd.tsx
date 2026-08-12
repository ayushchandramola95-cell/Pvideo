'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

export default function InstantMessageAd() {
  useEffect(() => {
    try {
      // Trigger ExoClick's AdProvider script to populate the chat widget
      // @ts-ignore
      const AdProvider = window.AdProvider || [];
      AdProvider.push({ serve: {} });
    } catch (err) {
      console.error('Error triggering ExoClick Instant Message:', err);
    }
  }, []);

  return (
    <>
      {/* Load ExoClick's ad-provider script */}
      <Script 
        src="https://a.magsrv.com/ad-provider.js" 
        strategy="afterInteractive" 
      />

      {/* Floating Instant Message (Chat) Widget Slot */}
      <ins 
        className="eas6a97888e6" 
        data-zoneid="6000962" 
      />
    </>
  );
}
