import React from 'react';
import { Link } from 'react-router-dom';
import { homePathFor, useCurrentUser } from 'lib/CurrentUserContext';
import styles from './legal.module.scss';

// Site nav and footer shared by the public pages that aren't landings:
// About and the legal documents.

export const SUPPORT_EMAIL = 'talentmon.app@gmail.com';
export const COMPANY_LINE = 'Talentmon LTD (Talentmon d.o.o.), Republic of Serbia';

export const LEGAL_DOCS = [
  { path: '/terms-of-service', label: 'Terms of Service', short: 'Terms', icon: 'FileText' },
  { path: '/privacy-policy', label: 'Privacy Policy', short: 'Privacy', icon: 'ShieldCheck' },
  { path: '/refund-policy', label: 'Refund Policy', short: 'Refunds', icon: 'RotateCcw' },
];

const Brand = () => (
  <Link to="/" className={styles.brand}>
    <span className={styles.mark}><img src="/assets/images/talentmon.png" alt="" /></span>
    <span>Talent<b>mon</b></span>
  </Link>
);

export const SiteNav = () => {
  const { role, company } = useCurrentUser();
  const appPath = role ? homePathFor(role, company) : null;

  return (
    <nav className={styles.nav}>
      <div className={styles.wrap}>
        <Brand />
        <div className={styles.navLinks}>
          <Link to="/">For companies</Link>
          <Link to="/landing-page-candidates">For candidates</Link>
        </div>
        <Link to={appPath || '/login'} className={styles.navBtn}>
          {appPath ? 'Open Talentmon' : 'Log in'}
        </Link>
      </div>
    </nav>
  );
};

export const SiteFooter = () => (
  <footer className={styles.foot}>
    <div className={styles.wrap}>
      <div className={styles.footGrid}>
        <div>
          <Brand />
          <p className={styles.footTag}>
            A pre-screened talent pool you browse anonymously and pay for only when you find a real match.
          </p>
        </div>
        <div className={styles.footCol}>
          <h4>Product</h4>
          <Link to="/">For companies</Link>
          <Link to="/landing-page-candidates">For candidates</Link>
          <a href="/#pricing">Pricing</a>
          <Link to="/about">About</Link>
        </div>
        <div className={styles.footCol}>
          <h4>Legal</h4>
          {LEGAL_DOCS.map((doc) => (
            <Link key={doc.path} to={doc.path}>{doc.label}</Link>
          ))}
        </div>
        <div className={styles.footCol}>
          <h4>Contact</h4>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </div>
      </div>
      <div className={styles.footBottom}>
        <span>© {new Date().getFullYear()} Talentmon LTD. All rights reserved.</span>
        <span>Payments are processed by Paddle, our Merchant of Record.</span>
      </div>
    </div>
  </footer>
);
