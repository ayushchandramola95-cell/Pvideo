'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MOCK_PORNSTARS } from '@/lib/data';
import styles from './Header.module.css';

const FEATURED_NAV_CATEGORIES = [
  { name: 'Amateur', slug: 'amateur' },
  { name: 'Anal', slug: 'anal' },
  { name: 'Asian', slug: 'asian' },
  { name: 'BBW', slug: 'bbw' },
  { name: 'Blonde', slug: 'blonde' },
  { name: 'Blowjob', slug: 'blowjob' },
  { name: 'Brunette', slug: 'brunette' },
  { name: 'Creampie', slug: 'creampie' },
  { name: 'MILF', slug: 'milf' },
  { name: 'POV', slug: 'pov' },
];

export default function Header() {
  const [query, setQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'videos' | 'categories' | 'pornstars' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  const [headerPornstars, setHeaderPornstars] = useState<any[]>([]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadHeaderPornstars() {
      try {
        const res = await fetch('/api/admin/pornstars');
        const data = await res.json();
        if (data.pornstars) {
          setHeaderPornstars(data.pornstars.slice(0, 15));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadHeaderPornstars();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (name: 'videos' | 'categories' | 'pornstars') => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  return (
    <>
      <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Left Section: Brand Logo + Nav Menu */}
        <div className={styles.leftGroup}>
          <Link href="/" className={styles.logo} onClick={closeDropdown}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span>Porn<span className="gradient-text">ora</span></span>
          </Link>

          <nav className={styles.nav} ref={navRef}>
            <Link href="/" className={styles.navLink} onClick={closeDropdown}>
              Home
            </Link>

            {/* Videos Dropdown */}
            <div className={styles.navItem}>
              <button
                type="button"
                className={`${styles.navLink} ${activeDropdown === 'videos' ? styles.activeNavLink : ''}`}
                onClick={() => toggleDropdown('videos')}
              >
                Videos
                <svg
                  className={`${styles.chevronIcon} ${activeDropdown === 'videos' ? styles.openChevronIcon : ''}`}
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`${styles.dropdownMenu} ${activeDropdown === 'videos' ? styles.dropdownOpen : ''}`}>
                <Link href="/search?sort=popular" className={styles.dropdownItem} onClick={closeDropdown}>
                  🔥 Popular Videos
                </Link>
                <Link href="/search?sort=newest" className={styles.dropdownItem} onClick={closeDropdown}>
                  ✨ New Videos
                </Link>
                <Link href="/search?sort=top_rated" className={styles.dropdownItem} onClick={closeDropdown}>
                  ⭐ Top Rated Videos
                </Link>
              </div>
            </div>

            {/* Categories Dropdown */}
            <div className={styles.navItem}>
              <button
                type="button"
                className={`${styles.navLink} ${activeDropdown === 'categories' ? styles.activeNavLink : ''}`}
                onClick={() => toggleDropdown('categories')}
              >
                Categories
                <svg
                  className={`${styles.chevronIcon} ${activeDropdown === 'categories' ? styles.openChevronIcon : ''}`}
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`${styles.dropdownMenu} ${activeDropdown === 'categories' ? styles.dropdownOpen : ''}`}>
                {FEATURED_NAV_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className={styles.dropdownItem}
                    onClick={closeDropdown}
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className={styles.dropdownDivider} />
                <Link href="/#categories" className={styles.dropdownItemAll} onClick={closeDropdown}>
                  All Categories &raquo;
                </Link>
              </div>
            </div>

            {/* Pornstars Dropdown */}
            <div className={styles.navItem}>
              <button
                type="button"
                className={`${styles.navLink} ${activeDropdown === 'pornstars' ? styles.activeNavLink : ''}`}
                onClick={() => toggleDropdown('pornstars')}
              >
                Pornstars
                <svg
                  className={`${styles.chevronIcon} ${activeDropdown === 'pornstars' ? styles.openChevronIcon : ''}`}
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`${styles.dropdownMenu} ${activeDropdown === 'pornstars' ? styles.dropdownOpen : ''}`}>
                {headerPornstars.map((ps) => (
                  <Link
                    key={ps.id || ps.slug}
                    href={`/search?q=${encodeURIComponent(ps.name)}`}
                    className={styles.dropdownItem}
                    onClick={closeDropdown}
                  >
                    {ps.name}
                  </Link>
                ))}
                <div className={styles.dropdownDivider} />
                <Link href="/pornstars" className={styles.dropdownItemAll} onClick={closeDropdown}>
                  All Pornstars &raquo;
                </Link>
              </div>
            </div>

            {/* Live Sex Button */}
            <Link
              href="https://cams.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.navLink} ${styles.liveSexLink}`}
              onClick={closeDropdown}
            >
              <span className={styles.liveDot} />
              <span>Live Sex</span>
            </Link>

            {/* AI Jerk Off Button */}
            <Link
              href="/search?q=AI"
              className={styles.navLink}
              onClick={closeDropdown}
            >
              <span>AI Jerk Off</span>
              <span className={styles.aiBadge}>PRO</span>
            </Link>
          </nav>
        </div>

        {/* Right Section: Search Bar */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <svg className={styles.searchIcon} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search videos, topics, or categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </form>
        
        {/* Mobile Navigation Trigger Button (Placed outside leftGroup to allow centering search box on iPad!) */}
        <button 
          type="button" 
          className={styles.hamburgerBtn}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Toggle Navigation Menu"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>

    {/* Mobile Menu Slide-out Drawer (Rendered OUTSIDE header to prevent backdrop-filter transparency leaks!) */}
    {mobileMenuOpen && (
      <>
        <div className={styles.mobileDrawerOverlay} onClick={() => setMobileMenuOpen(false)} />
        <div 
          className={styles.mobileDrawer} 
          style={{ 
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '280px',
            backgroundColor: '#0d131f',
            opacity: 1,
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            boxShadow: '-20px 0 50px rgba(0,0,0,0.95)',
            zIndex: 999999,
          }}
        >
          <div className={styles.mobileDrawerHeader}>
            <Link href="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
              <div className={styles.logoIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span>Porn<span className="gradient-text">ora</span></span>
            </Link>
            <button type="button" className={styles.mobileDrawerClose} onClick={() => setMobileMenuOpen(false)}>
              ✕
            </button>
          </div>

          <nav className={styles.mobileDrawerNav}>
            <Link href="/" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              🏠 Home
            </Link>
            <Link href="/search?sort=popular" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              🔥 Popular Videos
            </Link>
            <Link href="/search?sort=newest" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              ✨ New Videos
            </Link>
            <Link href="/#categories" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              📁 All Categories
            </Link>
            <Link href="/pornstars" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              ⭐ All Pornstars
            </Link>
            <Link
              href="https://cams.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.mobileNavLink} ${styles.mobileLiveLink}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              🔴 Live Sex
            </Link>
            <Link href="/search?q=AI" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              🤖 AI Jerk Off <span className={styles.aiBadge} style={{ marginLeft: '4px' }}>PRO</span>
            </Link>
          </nav>
        </div>
      </>
    )}
  </>
);
}
