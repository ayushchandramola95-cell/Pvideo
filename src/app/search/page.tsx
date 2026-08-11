import React, { Suspense } from 'react';
import { fetchVideos } from '@/lib/data';
import VideoCard from '@/components/VideoCard';
import styles from './Search.module.css';

interface SearchContentProps {
  query: string;
}

async function SearchResults({ query }: SearchContentProps) {
  const videos = await fetchVideos({ searchQuery: query });

  return (
    <div>
      <section className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>
            Search Results for <span className="gradient-text">&quot;{query}&quot;</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Found {videos.length} matching video releases
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          {videos.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No videos found matching your query &quot;{query}&quot;.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  return {
    title: query ? `Search Results for "${query}"` : 'Search Videos',
    description: query ? `Browse matching video releases for "${query}" on Pornora` : 'Search and watch premium videos on Pornora',
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';

  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        Loading search results...
      </div>
    }>
      <SearchResults query={query} />
    </Suspense>
  );
}
