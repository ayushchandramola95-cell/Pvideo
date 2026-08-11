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
      <div className="container">
        <div className={styles.grid}>
          {/* Column 1: Brand & Parental Guidance Box */}
          <div className={styles.leftColumn}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span>P<span className="gradient-text">Video</span></span>
            </div>

            <p className={styles.brandDescription}>
              <strong>PVIDEO.COM is your #1 source for high quality video streaming.</strong> Millions of videos aggregated and self-hosted, closely monitored to give you a safe and pleasurable experience!
            </p>

            <div className={styles.parentsBox}>
              <div className={styles.parentsHeader}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Parents
              </div>
              <p className={styles.parentsText}>
                Pvideo.com uses the &quot;Restricted To Adults&quot; (RTA) website label to better enable parental filtering. Protect your children from adult content and block access to this site by using parental controls.
              </p>
            </div>

            <p className={styles.copyright}>
              &copy; {new Date().getFullYear()} Pvideo.com. All rights reserved.
            </p>
          </div>

          {/* Column 2: Support & Advertisers */}
          <div className={styles.columnGroup}>
            <div>
              <h4 className={styles.columnTitle}>Support</h4>
              <ul className={styles.linkList}>
                <li><Link href="/search">FAQ</Link></li>
                <li><Link href="/search">Help Us Improve</Link></li>
                <li><Link href="/search">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={styles.columnTitle}>Advertisers</h4>
              <ul className={styles.linkList}>
                <li><Link href="/search">Buy Traffic / Get Listed</Link></li>
              </ul>
            </div>
          </div>

          {/* Column 3: Legal & Admin */}
          <div className={styles.columnGroup}>
            <h4 className={styles.columnTitle}>Legal</h4>
            <ul className={styles.linkList}>
              <li><Link href="/search">Terms of Service</Link></li>
              <li><Link href="/search">Privacy Statement</Link></li>
              <li><Link href="/search">Statement of Responsibility</Link></li>
              <li><Link href="/search">Notice and Action Policy (Link Removal)</Link></li>
              <li><Link href="/search">DMCA / Copyright</Link></li>
              <li><Link href="/search">Acceptable Content Policy</Link></li>
              <li><Link href="/search">Digital Services Act</Link></li>
              <li><Link href="/search">2257</Link></li>
              <li><Link href="/admin">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Column 4: Compliance Badges */}
          <div className={styles.badgeColumn}>
            <div className={styles.rtaBadge} title="Restricted To Adults">
              RTA
            </div>

            <div className={styles.asacpBadge}>
              ASACP
              <span className={styles.asacpSub}>APPROVED MEMBER</span>
            </div>

            <div className={styles.pineappleBadge}>
              pineapple
              <span>support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scroll-to-Top Button */}
      <button onClick={scrollToTop} className={styles.scrollTopBtn} title="Scroll to top">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M5 15l7-7 7 7" />
          <path d="M5 19h14" />
        </svg>
      </button>
    </footer>
  );
}
