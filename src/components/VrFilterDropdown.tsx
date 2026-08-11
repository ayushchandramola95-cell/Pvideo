'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './VrFilterDropdown.module.css';

export default function VrFilterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'all' | 'vr'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.triggerBtn}
      >
        <span>VR</span>
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
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownBox}>
          <div
            className={`${styles.radioOption} ${selectedOption === 'all' ? styles.activeOption : ''}`}
            onClick={() => {
              setSelectedOption('all');
              setIsOpen(false);
            }}
          >
            <div className={`${styles.radioDot} ${selectedOption === 'all' ? styles.activeDot : ''}`}>
              {selectedOption === 'all' && <div className={styles.activeInnerDot} />}
            </div>
            <span>All</span>
          </div>

          <div
            className={`${styles.radioOption} ${selectedOption === 'vr' ? styles.activeOption : ''}`}
            onClick={() => {
              setSelectedOption('vr');
              setIsOpen(false);
            }}
          >
            <div className={`${styles.radioDot} ${selectedOption === 'vr' ? styles.activeDot : ''}`}>
              {selectedOption === 'vr' && <div className={styles.activeInnerDot} />}
            </div>
            <span>VR</span>
          </div>
        </div>
      )}
    </div>
  );
}
