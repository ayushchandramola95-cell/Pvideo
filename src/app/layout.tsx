import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryDirectory from '@/components/CategoryDirectory';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pornora.site'),
  title: {
    default: 'Pornora - Stream Premium Sex Videos & Performers Directory',
    template: '%s | Pornora',
  },
  description: 'Stream and watch premium adult videos, models, pornstars scenes, and categories in ultra high quality on Pornora.',
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'lUMmMI3enr0WA1BJKo50Ndp57LW-5x1M2OllPx4Ftqc',
    other: {
      '6a97888e-site-verification': '0903022b94f04443cad9936e64122645',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Pornora',
    title: 'Pornora - Stream Premium Sex Videos & Performers Directory',
    description: 'Stream and watch premium adult videos, models, pornstars scenes, and categories in ultra high quality on Pornora.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pornora - Stream Premium Sex Videos & Performers Directory',
    description: 'Stream and watch premium adult videos, models, pornstars scenes, and categories in ultra high quality on Pornora.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pornora.site';
  
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pornora',
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
    name: 'Pornora',
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
        <div className="container" style={{ margin: '1rem auto' }}>
          <AdBanner size="above-directory" />
        </div>
        <CategoryDirectory />
        <div className="container" style={{ margin: '1rem auto' }}>
          <AdBanner size="above-footer" />
        </div>
        <Footer />
      </body>
    </html>
  );
}
