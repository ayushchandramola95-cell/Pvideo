'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './SortByDropdown.module.css';

interface SortByDropdownProps {
  initialSort?: string;
}

export default function SortByDropdown({ initialSort = 'Popularity' }: SortByDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = ['Popularity', 'Date Added', 'Most Viewed', 'Top Rated'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <span className={styles.sortLabel}>Sort by :</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.triggerBtn}
      >
        <span>{selectedSort}</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.openChevron : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownBox}>
          {options.map((option) => (
            <div
              key={option}
              className={`${styles.optionItem} ${selectedSort === option ? styles.activeItem : ''}`}
              onClick={() => {
                setSelectedSort(option);
                setIsOpen(false);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
