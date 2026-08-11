'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { INFO_PAGES } from '@/lib/infoData';
import styles from './Info.module.css';

export default function InfoPage() {
  const params = useParams();
  const slug = (params.slug as string) || '';

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('support');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load static content for the current slug
  const pageContent = INFO_PAGES[slug];
  if (!pageContent && slug !== 'contact') {
    notFound();
  }

  // Handle contact form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setIsSubmitted(true);
  };

  // Safe header info for Contact page
  const title = slug === 'contact' ? 'Contact Us & Feedback' : pageContent.title;
  const subtitle = slug === 'contact' ? 'Have questions or feedback? Our team is here to help.' : pageContent.subtitle;
  const content = slug === 'contact' ? 'Please fill out the form below, and we will get back to you within 24-48 hours.' : pageContent.content;

  return (
    <div className={styles.wrapper}>
      <div className={`container ${styles.layout}`}>
        {/* ── Left Sidebar Navigation ── */}
        <aside className={styles.sidebar}>
          <div>
            <h3 className={styles.sidebarTitle}>Support</h3>
            <ul className={styles.sidebarMenu}>
              <li>
                <Link
                  href="/info/faq"
                  className={`${styles.sidebarLink} ${slug === 'faq' ? styles.sidebarLinkActive : ''}`}
                >
                  FAQ &amp; Help
                </Link>
              </li>
              <li>
                <Link
                  href="/info/contact"
                  className={`${styles.sidebarLink} ${slug === 'contact' ? styles.sidebarLinkActive : ''}`}
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  href="/info/advertise"
                  className={`${styles.sidebarLink} ${slug === 'advertise' ? styles.sidebarLinkActive : ''}`}
                >
                  Advertise
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={styles.sidebarTitle}>Legal &amp; Safety</h3>
            <ul className={styles.sidebarMenu}>
              <li>
                <Link
                  href="/info/terms"
                  className={`${styles.sidebarLink} ${slug === 'terms' ? styles.sidebarLinkActive : ''}`}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/info/privacy"
                  className={`${styles.sidebarLink} ${slug === 'privacy' ? styles.sidebarLinkActive : ''}`}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/info/responsibility"
                  className={`${styles.sidebarLink} ${slug === 'responsibility' ? styles.sidebarLinkActive : ''}`}
                >
                  Responsibility
                </Link>
              </li>
              <li>
                <Link
                  href="/info/notice-action"
                  className={`${styles.sidebarLink} ${slug === 'notice-action' ? styles.sidebarLinkActive : ''}`}
                >
                  Notice &amp; Action
                </Link>
              </li>
              <li>
                <Link
                  href="/info/dmca"
                  className={`${styles.sidebarLink} ${slug === 'dmca' ? styles.sidebarLinkActive : ''}`}
                >
                  DMCA Compliance
                </Link>
              </li>
              <li>
                <Link
                  href="/info/acceptable-content"
                  className={`${styles.sidebarLink} ${slug === 'acceptable-content' ? styles.sidebarLinkActive : ''}`}
                >
                  Acceptable Content
                </Link>
              </li>
              <li>
                <Link
                  href="/info/dsa"
                  className={`${styles.sidebarLink} ${slug === 'dsa' ? styles.sidebarLinkActive : ''}`}
                >
                  EU DSA Compliance
                </Link>
              </li>
              <li>
                <Link
                  href="/info/2257"
                  className={`${styles.sidebarLink} ${slug === '2257' ? styles.sidebarLinkActive : ''}`}
                >
                  U.S.C. 2257 Statement
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className={styles.contentArea}>
          <div className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          <p className={styles.intro}>{content}</p>

          {/* Render dynamic sections if present */}
          {pageContent?.sections && (
            <div>
              {pageContent.sections.map((sec, idx) => (
                <div key={idx} className={styles.section}>
                  <h3 className={styles.sectionHeading}>{sec.heading}</h3>
                  <p className={styles.sectionBody}>{sec.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Render interactive form if slug is 'contact' */}
          {slug === 'contact' && (
            <div>
              {isSubmitted ? (
                <div className={styles.successMessage}>
                  <h4>Message Sent Successfully!</h4>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#a7f3d0' }}>
                    Thank you for contacting Pornora support. A ticket has been created, and our agents will respond via email shortly.
                  </p>
                </div>
              ) : (
                <form className={styles.contactForm} onSubmit={handleSubmit}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name" className={styles.label}>Your Name</label>
                      <input
                        id="name"
                        type="text"
                        required
                        className={styles.input}
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>Email Address</label>
                      <input
                        id="email"
                        type="email"
                        required
                        className={styles.input}
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="subject" className={styles.label}>Inquiry Type</label>
                    <select
                      id="subject"
                      className={styles.select}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      <option value="support">Technical Support / Player issue</option>
                      <option value="advertise">Advertising Opportunities</option>
                      <option value="content">Content Removal / Notice &amp; Action</option>
                      <option value="feedback">General Feedback &amp; Suggestions</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.label}>Message Details</label>
                    <textarea
                      id="message"
                      required
                      className={styles.textarea}
                      placeholder="Please describe your request in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <button type="submit" className={styles.submitBtn}>
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
