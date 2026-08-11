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

  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

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

      {/* First Page Link + Ellipsis */}
      {startPage > 1 && (
        <>
          <Link href={createPageUrl(1)} className={styles.pageBtn}>
            1
          </Link>
          {startPage > 2 && <span className={styles.ellipsis}>...</span>}
        </>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((p) => (
        <Link
          key={p}
          href={createPageUrl(p)}
          className={`${styles.pageBtn} ${p === currentPage ? styles.active : ''}`}
        >
          {p}
        </Link>
      ))}

      {/* Last Page Link + Ellipsis */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
          <Link href={createPageUrl(totalPages)} className={styles.pageBtn}>
            {totalPages}
          </Link>
        </>
      )}

      {/* Next Button */}
      {currentPage < totalPages && (
        <Link href={createPageUrl(currentPage + 1)} className={styles.pageBtn}>
          Next &raquo;
        </Link>
      )}
    </div>
  );
}
