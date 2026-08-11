'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      {/* Top glow bar */}
      <div className={styles.topBar} />

      <div className="container">
        <div className={styles.grid}>

          {/* ── Brand Column ───────────────────────── */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className={styles.logoText}>
                Porn<span className={styles.logoAccent}>ora</span>
              </span>
            </Link>

            <p className={styles.tagline}>
              Your <strong>#1 source</strong> for premium adult streaming. Millions of high-quality
              releases, self-hosted and monitored — delivering a safe, seamless experience.
            </p>

            {/* Stats row */}
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statNum}>62K+</span>
                <span className={styles.statLabel}>Videos</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNum}>HD</span>
                <span className={styles.statLabel}>Quality</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNum}>Free</span>
                <span className={styles.statLabel}>Forever</span>
              </div>
            </div>

            {/* Parents notice */}
            <div className={styles.parentsBox}>
              <div className={styles.parentsHeader}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Parental Controls
              </div>
              <p className={styles.parentsText}>
                Pornora.site uses the &quot;Restricted To Adults&quot; (RTA) label for parental filtering.
                Protect children from adult content using parental controls.
              </p>
            </div>
          </div>

          {/* ── Support Column ─────────────────────── */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>
              <span className={styles.colTitleBar} />
              Support
            </h4>
            <ul className={styles.linkList}>
              <li><Link href="/info/faq">FAQ</Link></li>
              <li><Link href="/info/contact">Help Us Improve</Link></li>
              <li><Link href="/info/contact">Contact Us</Link></li>
            </ul>

            <h4 className={styles.colTitle} style={{ marginTop: '1.5rem' }}>
              <span className={styles.colTitleBar} />
              Advertisers
            </h4>
            <ul className={styles.linkList}>
              <li><Link href="/info/advertise">Buy Traffic</Link></li>
              <li><Link href="/info/advertise">Get Listed</Link></li>
            </ul>
          </div>

          {/* ── Legal Column ───────────────────────── */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>
              <span className={styles.colTitleBar} />
              Legal
            </h4>
            <ul className={styles.linkList}>
              <li><Link href="/info/terms">Terms of Service</Link></li>
              <li><Link href="/info/privacy">Privacy Statement</Link></li>
              <li><Link href="/info/responsibility">Statement of Responsibility</Link></li>
              <li><Link href="/info/dmca">DMCA / Copyright</Link></li>
              <li><Link href="/info/notice-action">Notice &amp; Link Removal</Link></li>
              <li><Link href="/info/acceptable-content">Acceptable Content Policy</Link></li>
              <li><Link href="/info/dsa">Digital Services Act</Link></li>
              <li><Link href="/info/2257">2257</Link></li>
              <li><Link href="/admin">Admin Portal</Link></li>
            </ul>
          </div>

          {/* ── Compliance Column ──────────────────── */}
          <div className={styles.badgesCol}>
            <h4 className={styles.colTitle}>
              <span className={styles.colTitleBar} />
              Compliance
            </h4>

            <div className={styles.badgeCard}>
              <div className={styles.rtaBadge}>RTA</div>
              <div className={styles.badgeInfo}>
                <span className={styles.badgeName}>Restricted To Adults</span>
                <span className={styles.badgeDesc}>Content labelled for parental tools</span>
              </div>
            </div>

            <div className={styles.badgeCard}>
              <div className={styles.asacpBadge}>
                <span className={styles.asacpMain}>ASACP</span>
              </div>
              <div className={styles.badgeInfo}>
                <span className={styles.badgeName}>ASACP Member</span>
                <span className={styles.badgeDesc}>Approved child safety member</span>
              </div>
            </div>

            <div className={styles.badgeCard}>
              <div className={styles.pineappleBadge}>🍍</div>
              <div className={styles.badgeInfo}>
                <span className={styles.badgeName}>Pineapple Support</span>
                <span className={styles.badgeDesc}>Mental health support partner</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────── */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Pornora.site — All rights reserved. For adults 18+ only.
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/search">Privacy</Link>
            <Link href="/search">Terms</Link>
            <Link href="/search">DMCA</Link>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      <button onClick={scrollToTop} className={styles.scrollTopBtn} title="Scroll to top" type="button">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </footer>
  );
}
