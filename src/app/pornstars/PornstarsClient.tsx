'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pornstar } from '@/lib/data';
import styles from './Pornstars.module.css';

const ITEMS_PER_PAGE = 120;

function PornstarCardItem({ ps, index, visibleBatch }: { ps: Pornstar; index: number; visibleBatch: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasPhotoUrl = Boolean(ps.photo_url && ps.photo_url.trim().startsWith('http'));
  const isHighPriority = index < 24;
  const isWaveReady = index < visibleBatch;

  return (
    <Link href={`/pornstars/${ps.slug}`} className={styles.card}>
      <div className={styles.photoWrapper}>
        {hasPhotoUrl && !imgError && isWaveReady ? (
          <>
            {!imgLoaded && (
              <div className={styles.skeletonLoader}>
                <div className={styles.spinner} />
              </div>
            )}
            <img
              src={ps.photo_url}
              alt={ps.name}
              className={`${styles.photo} ${imgLoaded ? styles.photoLoaded : ''}`}
              loading={isHighPriority ? 'eager' : 'lazy'}
              fetchPriority={isHighPriority ? 'high' : 'auto'}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          hasPhotoUrl && !imgError && !isWaveReady ? (
            <div className={styles.skeletonLoader}>
              <div className={styles.spinner} />
            </div>
          ) : (
            <div className={styles.blankBlackCover}>
              <span className={styles.blankIcon}>🌟</span>
            </div>
          )
        )}
      </div>
      <div className={styles.infoBar}>
        <span className={styles.name}>{ps.name}</span>
      </div>
    </Link>
  );
}

export default function PornstarsClient() {
  const [pornstars, setPornstars] = useState<Pornstar[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleBatch, setVisibleBatch] = useState(24);

  useEffect(() => {
    async function fetchPornstars() {
      const cacheKey = `pornstars-page-${currentPage}`;
      
      // Try to load from browser sessionStorage for instant loading
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          const data = JSON.parse(cachedData);
          if (data.pornstars) {
            setPornstars(data.pornstars);
            setTotalCount(data.total || data.pornstars.length);
            setTotalPages(data.totalPages || Math.ceil((data.total || data.pornstars.length) / ITEMS_PER_PAGE) || 1);
            setLoading(false);
            return;
          }
        }
      } catch (cacheErr) {
        console.warn('SessionStorage cache read failed:', cacheErr);
      }

      setLoading(true);
      setVisibleBatch(24);

      try {
        const res = await fetch(`/api/admin/pornstars?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
        const data = await res.json();
        
        if (data.pornstars) {
          setPornstars(data.pornstars);
          setTotalCount(data.total || data.pornstars.length);
          setTotalPages(data.totalPages || Math.ceil((data.total || data.pornstars.length) / ITEMS_PER_PAGE) || 1);
          
          // Cache the data in sessionStorage
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (cacheErr) {
            console.warn('SessionStorage cache write failed:', cacheErr);
          }
        }
      } catch (err) {
        console.error('Failed to load pornstars page:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPornstars();
  }, [currentPage]);

  useEffect(() => {
    if (loading || pornstars.length === 0) return;

    const timer1 = setTimeout(() => setVisibleBatch(48), 150);
    const timer2 = setTimeout(() => setVisibleBatch(72), 300);
    const timer3 = setTimeout(() => setVisibleBatch(96), 450);
    const timer4 = setTimeout(() => setVisibleBatch(120), 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [loading, pornstars]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 7;
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + pornstars.length, totalCount || pornstars.length);

  return (
    <div className={styles.wrapper}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 className={styles.title} style={{ margin: 0 }}>All Performers & Models ({totalCount || pornstars.length})</h1>
          {!loading && pornstars.length > 0 && (
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              Showing {startIndex + 1}–{endIndex} of {totalCount || pornstars.length} Performers (Page {currentPage} of {totalPages})
            </span>
          )}
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className={styles.card} style={{ pointerEvents: 'none' }}>
                <div className={styles.photoWrapper}>
                  <div className={styles.skeletonLoader}>
                    <div className={styles.spinner} />
                  </div>
                </div>
                <div className={styles.infoBar}>
                  <div style={{ height: '14px', width: '70%', margin: '0 auto', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : pornstars.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '4rem 0', textAlign: 'center', background: '#0d131f', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌟</div>
            <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>No Performers Listed Yet</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Add or bulk import performers from your <Link href="/admin/dashboard" style={{ color: '#ef4444' }}>Admin Center</Link>.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {pornstars.map((ps, idx) => (
                <PornstarCardItem key={ps.id || ps.slug} ps={ps} index={idx} visibleBatch={visibleBatch} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <div className={styles.paginationInfo}>
                  Page <strong style={{ color: '#ffffff' }}>{currentPage}</strong> of <strong style={{ color: '#ffffff' }}>{totalPages}</strong> ({totalCount} total performers - 120 cards per page)
                </div>

                <div className={styles.paginationControls}>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.pageBtn}
                  >
                    « Prev
                  </button>

                  {getPageNumbers().map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePageChange(num)}
                      className={`${styles.pageBtn} ${currentPage === num ? styles.pageBtnActive : ''}`}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.pageBtn}
                  >
                    Next »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
