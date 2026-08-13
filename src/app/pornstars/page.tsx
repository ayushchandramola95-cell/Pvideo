import React from 'react';
import { Metadata } from 'next';
import PornstarsClient from './PornstarsClient';

const title = 'Top Pornstars & Adult Performers Directory - Free Sex Videos';
const description = 'Browse the ultimate directory of adult performers, pornstars bios, and free sex videos. Search popular models and watch their HD video releases.';

export const revalidate = 600; // Cache compiled pornstars page container for 10 minutes

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/pornstars',
  },
  openGraph: {
    title,
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function PornstarsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Pornstars',
        item: `${baseUrl}/pornstars`,
      },
    ],
  };

  return (
    <>
      {/* SEO Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PornstarsClient />
    </>
  );
}
