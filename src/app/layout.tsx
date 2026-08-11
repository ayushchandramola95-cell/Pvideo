import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryDirectory from '@/components/CategoryDirectory';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008'),
  title: {
    default: 'PVideo - Premium Video Streaming & Directory Portal',
    template: '%s | PVideo',
  },
  description: 'Stream and watch premium adult videos, models, pornstars scenes, and categories in ultra high quality on PVideo.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'PVideo',
    title: 'PVideo - Premium Video Streaming & Directory Portal',
    description: 'Stream and watch premium adult videos, models, pornstars scenes, and categories in ultra high quality on PVideo.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PVideo - Premium Video Streaming & Directory Portal',
    description: 'Stream and watch premium adult videos, models, pornstars scenes, and categories in ultra high quality on PVideo.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008';
  
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PVideo',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PVideo',
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <CategoryDirectory />
        <Footer />
      </body>
    </html>
  );
}
