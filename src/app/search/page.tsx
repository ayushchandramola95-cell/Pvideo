import React, { Suspense } from 'react';
import { fetchVideos } from '@/lib/data';
import VideoCard from '@/components/VideoCard';
import Pagination from '@/components/Pagination';
import NativeGridAd from '@/components/NativeGridAd';
import styles from './Search.module.css';

interface SearchContentProps {
  query: string;
  page: number;
}

async function SearchResults({ query, page }: SearchContentProps) {
  const limit = 80;
  const videos = await fetchVideos({ searchQuery: query });
  
  const totalVideos = videos.length;
  const totalPages = Math.ceil(totalVideos / limit) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalVideos);
  const paginatedVideos = videos.slice(startIndex, endIndex);

  return (
    <div>
      <section className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>
            Search Results for <span className="gradient-text">&quot;{query}&quot;</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.88rem' }}>
            Showing {totalVideos > 0 ? startIndex + 1 : 0}–{endIndex} of {totalVideos} matching video releases
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          {paginatedVideos.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No videos found matching your query &quot;{query}&quot;.</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {paginatedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
              
              {/* Native ad row below the grid */}
              <NativeGridAd />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl={`/search?q=${encodeURIComponent(query)}`}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
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
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const page = parseInt(resolvedParams.page || '1', 10) || 1;

  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        Loading search results...
      </div>
    }>
      <SearchResults query={query} page={page} />
    </Suspense>
  );
}
