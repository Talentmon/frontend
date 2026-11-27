import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import Icon from 'components/AppIcon';
import PublicScroll, { PUBLIC_SHELL } from 'components/ui/PublicScroll';
import { COMPANY_LINE, LEGAL_DOCS as DOCS, SiteFooter, SiteNav, SUPPORT_EMAIL } from './SiteChrome';
import styles from './legal.module.scss';

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// "3. Payment processing" -> { num: '3', label: 'Payment processing' }
const splitHeading = (text) => {
  const match = text.match(/^(\d+)\.\s*(.*)$/);
  return match ? { num: match[1], label: match[2] } : { num: null, label: text };
};

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Phones show this many key points until "Show all" (the rest hide in CSS).
const KEY_POINTS_ON_PHONE = 4;

const Toc = ({ sections, activeId }) => (
  <ul className={styles.tocList}>
    {sections.map((section) => (
      <li key={section.id}>
        <button
          type="button"
          className={activeId === section.id ? styles.tocOn : ''}
          onClick={() => scrollToId(section.id)}
        >
          {section.num && <span className={styles.tocNum}>{section.num}</span>}
          <span>{section.label}</span>
        </button>
      </li>
    ))}
  </ul>
);

// Shared shell for the public legal pages: site nav and footer, document tabs,
// a table of contents built from the document's own <h2>s, a plain-language
// summary and a contact card. The legal text itself is passed as children.
const LegalLayout = ({ title, subtitle, updated, keyPoints = [], children }) => {
  const location = useLocation();
  const bodyRef = useRef(null);
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [allPoints, setAllPoints] = useState(false);
  const morePoints = keyPoints.length - KEY_POINTS_ON_PHONE;

  useEffect(() => setAllPoints(false), [location.pathname]);

  // Give every section heading an anchor and list them for the table of contents.
  useEffect(() => {
    const headings = [...(bodyRef.current?.querySelectorAll('h2') || [])];
    const list = headings.map((heading) => {
      const parts = splitHeading(heading.textContent.trim());
      // Anchors from the title alone, e.g. /privacy-policy#cookies.
      heading.id = heading.id || slugify(parts.label);
      return { id: heading.id, ...parts };
    });
    setSections([...list, { id: 'contact', num: null, label: 'Contact' }]);
    setActiveId(list[0]?.id || null);
  }, [location.pathname]);

  useEffect(() => {
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  // Deep links like /privacy-policy#8-cookies, once the anchors exist.
  useEffect(() => {
    const id = location.hash?.slice(1);
    if (id && sections.length) setTimeout(() => scrollToId(id), 80);
  }, [location.hash, sections]);

  return (
    <div className={`${styles.page} ${PUBLIC_SHELL}`}>
      <Helmet>
        <title>{title} - Talentmon</title>
      </Helmet>

      <SiteNav />

      <PublicScroll>
        {/* ===== Title band ===== */}
        <header className={styles.hero}>
          <div className={styles.wrap}>
            <div className={styles.heroText}>
              <span className={styles.eyebrow}>Legal</span>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
              <div className={styles.meta}>
                {updated && (
                  <span className={styles.metaPill}>
                    <Icon name="CalendarDays" size={14} />
                    Last updated {updated}
                  </span>
                )}
                <button type="button" className={styles.metaBtn} onClick={() => window.print()}>
                  <Icon name="Printer" size={14} />
                  Print
                </button>
              </div>
            </div>
            <div className={styles.tabs} role="tablist" aria-label="Legal documents">
              {DOCS.map((doc) => {
                const active = location.pathname === doc.path;
                return (
                  <Link
                    key={doc.path}
                    to={doc.path}
                    role="tab"
                    aria-selected={active}
                    className={`${styles.tab} ${active ? styles.tabOn : ''}`}
                  >
                    <Icon name={doc.icon} size={15} />
                    <span className={styles.tabLong}>{doc.label}</span>
                    <span className={styles.tabShort}>{doc.short}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {/* ===== Document ===== */}
        <div className={`${styles.wrap} ${styles.layout}`}>
          <aside className={styles.side}>
            <div className={styles.sideTitle}>On this page</div>
            <Toc sections={sections} activeId={activeId} />
          </aside>

          <article className={styles.doc}>
            <details className={styles.tocMobile}>
              <summary>
                <Icon name="List" size={16} />
                On this page
                <Icon name="ChevronDown" size={16} className={styles.tocCaret} />
              </summary>
              <Toc sections={sections} activeId={activeId} />
            </details>

            {keyPoints.length > 0 && (
              <section className={styles.keyPoints} aria-labelledby="key-points-title">
                <div className={styles.keyHead}>
                  <span className={styles.keyIcon}><Icon name="Sparkles" size={16} /></span>
                  <h2 id="key-points-title" className={styles.keyTitle}>Key points</h2>
                </div>
                <ul>
                  {keyPoints.map((point, index) => (
                    <li key={index} className={!allPoints && index >= KEY_POINTS_ON_PHONE ? styles.keyExtra : undefined}>
                      <Icon name="Check" size={16} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {morePoints > 0 && (
                  <button type="button" className={styles.keyMore} onClick={() => setAllPoints((v) => !v)} aria-expanded={allPoints}>
                    {allPoints ? 'Show fewer' : `Show all ${keyPoints.length} key points`}
                    <Icon name={allPoints ? 'ChevronUp' : 'ChevronDown'} size={16} />
                  </button>
                )}
                <p className={styles.keyNote}>
                  A plain-language summary to help you find your way. It doesn't replace the full text below.
                </p>
              </section>
            )}

            <div className={styles.body} ref={bodyRef}>{children}</div>

            <section id="contact" className={styles.contact}>
              <span className={styles.contactIcon}><Icon name="Mail" size={22} /></span>
              <div className={styles.contactText}>
                <h3>Questions about this policy?</h3>
                <p>{COMPANY_LINE}</p>
              </div>
              <a className={styles.contactBtn} href={`mailto:${SUPPORT_EMAIL}`}>
                <Icon name="Send" size={15} />
                {SUPPORT_EMAIL}
              </a>
            </section>
          </article>
        </div>

        <SiteFooter />
      </PublicScroll>
    </div>
  );
};

export default LegalLayout;
