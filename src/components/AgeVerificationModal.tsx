'use client';

import React, { useState, useEffect } from 'react';
import styles from './AgeVerificationModal.module.css';

export default function AgeVerificationModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Run browser-only checks to avoid hydration mismatches
    const isVerified = localStorage.getItem('age-verified') === 'true';
    if (!isVerified) {
      setShowModal(true);
      // Disable scrolling when modal is active
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem('age-verified', 'true');
    setShowModal(false);
    // Restore scrolling
    document.body.style.overflow = '';
  };

  const handleLeave = () => {
    window.location.href = 'https://google.com';
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        <div className={styles.warningIcon}>18+</div>
        <h2 className={styles.title}>Warning: Adult Content</h2>
        <p className={styles.message}>
          This website contains explicit adult materials, including pictures and videos of adult sexual performers. 
          You must be 18 years of age or older, or the age of majority in your jurisdiction, to view this content.
        </p>
        <p className={styles.question}>
          Are you 18 years of age or older and consent to view adult content?
        </p>

        <div className={styles.btnRow}>
          <button onClick={handleEnter} className={styles.btnEnter}>
            I am 18 or older - Enter
          </button>
          <button onClick={handleLeave} className={styles.btnLeave}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
