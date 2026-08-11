'use client';

import React, { useState } from 'react';
import styles from './Admin.module.css';

export default function AdminLoginPage() {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError('Please enter admin passkey');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkey.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid passkey. Access denied.');
        setLoading(false);
        return;
      }

      // Also set client cookie for maximum resilience
      document.cookie = `pvideo_admin_token=admin_authenticated_secret_session; path=/; max-age=${60 * 60 * 24 * 7}`;

      // Hard redirect to ensure browser carries cookie to /admin/dashboard
      window.location.href = '/admin/dashboard';
    } catch {
      setError('An error occurred during authentication.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className={styles.title}>Admin Portal</h1>
          <p className={styles.subtitle}>Enter master passkey to access media uploader</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Admin Passkey</label>
            <input
              type="password"
              placeholder="Enter admin passkey..."
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className={styles.input}
              autoFocus
              disabled={loading}
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Unlocking...' : 'Unlock Portal →'}
          </button>
        </form>
      </div>
    </div>
  );
}
