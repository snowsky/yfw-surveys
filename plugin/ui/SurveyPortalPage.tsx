/**
 * SurveyPortalPage
 *
 * Public landing page for the Surveys plugin, accessible at /p/surveys/.
 * No login is required when the tenant sets require_login: false.
 *
 * Calls the existing no-auth API (/api/v1/surveys/public/{slug}) —
 * no new backend endpoints are needed.
 */
import React, { useState } from 'react';

export default function SurveyPortalPage() {
  const [loading] = useState(false);
  const [error] = useState('');

  const handleOpen = (slug: string) => {
    window.location.href = `/surveys/${slug}`;
  };

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '40px 24px',
        maxWidth: 640,
        margin: '0 auto',
        color: '#111827',
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Survey Portal</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        Enter a survey link or slug below to open a survey.
      </p>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : error ? (
        <p style={{ color: '#dc2626' }}>{error}</p>
      ) : (
        <SlugForm onOpen={handleOpen} />
      )}
    </div>
  );
}

function SlugForm({ onOpen }: { onOpen: (slug: string) => void }) {
  const [slug, setSlug] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = slug.trim();
    if (trimmed) onOpen(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="Enter survey slug or URL…"
        style={{
          flex: 1,
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          fontSize: 14,
        }}
      />
      <button
        type="submit"
        disabled={!slug.trim()}
        style={{
          padding: '8px 20px',
          borderRadius: 6,
          border: 'none',
          background: '#2563eb',
          color: '#fff',
          fontSize: 14,
          fontWeight: 500,
          cursor: slug.trim() ? 'pointer' : 'not-allowed',
          opacity: slug.trim() ? 1 : 0.6,
        }}
      >
        Open Survey
      </button>
    </form>
  );
}
