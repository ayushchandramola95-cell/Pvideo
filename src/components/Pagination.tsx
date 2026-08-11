import React from 'react';
import Link from 'next/link';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl = '/' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const createPageUrl = (page: number) => {
    const connector = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${connector}page=${page}`;
  };

  return (
    <div className={styles.container}>
      {/* Prev Button */}
      {currentPage > 1 && (
        <Link href={createPageUrl(currentPage - 1)} className={styles.pageBtn}>
          &laquo; Prev
        </Link>
      )}

      {/* Page Numbers */}
      {pages.map((p) => (
        <Link
          key={p}
          href={createPageUrl(p)}
          className={`${styles.pageBtn} ${p === currentPage ? styles.active : ''}`}
        >
          {p}
        </Link>
      ))}

      {/* Next Button */}
      {currentPage < totalPages && (
        <Link href={createPageUrl(currentPage + 1)} className={styles.pageBtn}>
          Next &raquo;
        </Link>
      )}
    </div>
  );
}
