import React from 'react';
import { Helmet } from 'react-helmet';

const LegalLayout = ({ title, updated, children }) => {
  return (
    <>
      <Helmet>
        <title>{title} - Talentmon</title>
      </Helmet>
      <div style={{ minHeight: '100vh', background: '#fff', color: '#1a2433' }}>
        <header style={{ borderBottom: '1px solid #e6e9ee', padding: '18px 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1a2433' }}>
              <img src="/assets/images/talentmon.png" alt="Talentmon" style={{ width: 28, height: 28, borderRadius: 6 }} />
              <span style={{ fontWeight: 800, letterSpacing: '-.01em' }}>Talentmon</span>
            </a>
          </div>
        </header>

        <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 6 }}>{title}</h1>
          {updated && <p style={{ color: '#6b7684', fontSize: '.9rem', marginBottom: 32 }}>Last updated: {updated}</p>}
          <div className="legal-body" style={{ fontSize: '.98rem', lineHeight: 1.7, color: '#2c3542' }}>{children}</div>
        </main>

        <style>{`
          .legal-body h2 { font-size: 1.2rem; font-weight: 700; margin: 32px 0 10px; color: #1a2433; }
          .legal-body p { margin: 0 0 14px; }
          .legal-body ul { margin: 0 0 14px; padding-left: 22px; }
          .legal-body li { margin-bottom: 6px; }
          .legal-body a { color: #b0791f; }
        `}</style>
      </div>
    </>
  );
};

export default LegalLayout;
