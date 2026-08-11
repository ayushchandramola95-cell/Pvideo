import React from 'react';
import { fetchCategories } from '@/lib/data';
import CategoryCard from '@/components/CategoryCard';
import Pagination from '@/components/Pagination';
import styles from './Home.module.css';

import { Metadata } from 'next';

export const revalidate = 60; // Refresh every 60 seconds

export const metadata: Metadata = {
  title: 'Pornora | Stream Premium Adult Videos & Performers Directory',
  description: 'Watch high-quality adult video releases, browse performer directories, and stream popular categories in Ultra HD on the Pornora portal.',
  alternates: {
    canonical: '/',
  },
};

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const limit = 100; // 20 rows * 5 columns

  const { categories, currentPage, totalPages } = await (async () => {
    const res = await fetchCategories({ page, limit });
    return {
      categories: res.categories,
      currentPage: res.page,
      totalPages: res.totalPages,
    };
  })();

  return (
    <div className={styles.mainWrapper}>
      <div className="container">
        {/* Real Categories 20x5 Grid Section */}
        <section>
          <div className={styles.sectionHeader}>
            <h1 className={styles.sectionTitle}>
              Categories
            </h1>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/" />
        </section>
      </div>
    </div>
  );
}
