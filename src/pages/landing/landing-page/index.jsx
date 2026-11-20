import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import PublicScroll, { PUBLIC_SHELL } from 'components/ui/PublicScroll';
import { scrollPageToTop } from 'components/ui/appScroll';
import Icon from 'components/AppIcon';
import './styles.scss';

// Same cards as the company Purchase tab, in EUR. Kept in step by hand with the
// packages in backend/prisma/seed.ts; bonus bookmarks last 6 months.
const PLANS = [
  { name: 'Buy 1', credits: 1, price: '€25', perUnlock: '€25.00' },
  { name: 'Starter', credits: 10, price: '€199', perUnlock: '€19.90', save: 20 },
  { name: 'Growth', credits: 30, price: '€569', perUnlock: '€18.97', save: 24, bonus: 5, popular: true },
  { name: 'Scale', credits: 50, price: '€929', perUnlock: '€18.58', save: 25, bonus: 10 },
  { name: 'Agency', credits: 100, price: '€1,829', perUnlock: '€18.29', save: 26, bonus: 20 },
];

// The Hire tracking stages on a Purchased card.
const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' }
];

const SUPPORT_EMAIL = 'talentmon.app@gmail.com';

// The demo card's match ring, drawn like the one on the Search cards.
const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;
const DEMO_MATCH = 94;

// "15 Nov 2026", the date format of the company pages.
const shortDate = (date) => (
  date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
);

const COPIED_MS = 1600;

const LandingPage = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [balance, setBalance] = useState(8);
  const [balanceBump, setBalanceBump] = useState(false);
  const balanceBumpTimeoutRef = useRef(null);
  const [unlockedDate, setUnlockedDate] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkedDate, setBookmarkedDate] = useState(null);
  const [bookmarkMsg, setBookmarkMsg] = useState('');
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  // Notes like the company pages keep them: a list, each "You, just now".
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [recruitmentStatus, setRecruitmentStatus] = useState('new');
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const rootRef = useRef(null);
  const bookmarkMsgTimeoutRef = useRef(null);
  const copiedTimeoutRef = useRef(null);

  useEffect(() => {
    const nodes = rootRef.current?.querySelectorAll('.fx') || [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const handleUnlock = () => {
    if (revealed) return;
    setRevealed(true);
    setIsNotesOpen(false);
    setFlashing(true);
    setBalance((b) => Math.max(b - 1, 0));
    setUnlockedDate(new Date());
    setTimeout(() => setFlashing(false), 800);
  };

  // "#" only scrolls the window, and on a computer the page scrolls in an area of its own (PublicScroll).
  const scrollToTop = (e) => {
    e.preventDefault();
    scrollPageToTop();
  };

  const scrollToReveal = () => {
    document.getElementById('reveal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBuyCredits = (credits) => {
    setBalance((b) => b + credits);
    setBalanceBump(true);
    document.getElementById('heroBalance')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (balanceBumpTimeoutRef.current) clearTimeout(balanceBumpTimeoutRef.current);
    balanceBumpTimeoutRef.current = setTimeout(() => setBalanceBump(false), 500);
  };

  const showBookmarkMsg = (text) => {
    setBookmarkMsg(text);
    if (bookmarkMsgTimeoutRef.current) clearTimeout(bookmarkMsgTimeoutRef.current);
    bookmarkMsgTimeoutRef.current = setTimeout(() => setBookmarkMsg(''), 5000);
  };

  useEffect(() => () => {
    if (bookmarkMsgTimeoutRef.current) clearTimeout(bookmarkMsgTimeoutRef.current);
    if (balanceBumpTimeoutRef.current) clearTimeout(balanceBumpTimeoutRef.current);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
  }, []);

  // Once saved, the bookmark button becomes the notes pencil (notesButton).
  const handleBookmark = () => {
    setBookmarked(true);
    setBookmarkedDate(new Date());
    showBookmarkMsg('Saved to Bookmarked');
  };

  const handleRemoveBookmark = () => {
    setBookmarked(false);
    setBookmarkedDate(null);
    setIsNotesOpen(false);
    showBookmarkMsg('Removed from Bookmarked');
  };

  const handleSaveNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    if (editingNoteId) {
      setNotes((list) => list.map((note) => (note.id === editingNoteId ? { ...note, text, edited: true } : note)));
    } else {
      setNotes((list) => [...list, { id: Date.now(), text }]);
    }
    setNoteDraft('');
    setEditingNoteId(null);
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setNoteDraft(note.text);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteDraft('');
  };

  const handleDeleteNote = (id) => {
    setNotes((list) => list.filter((note) => note.id !== id));
    if (editingNoteId === id) handleCancelEdit();
  };

  const handleCopy = (key, value) => {
    navigator.clipboard?.writeText(value)?.catch(() => {});
    setCopied(key);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(null), COPIED_MS);
  };

  const currentStage = STATUS_OPTIONS.find((opt) => opt.value === recruitmentStatus);

  const notesButton = (className) => (
    <button
      type="button"
      className={`${className}${notes.length ? ' on' : ''}${isNotesOpen ? ' open' : ''}`}
      onClick={() => setIsNotesOpen((v) => !v)}
      aria-label={isNotesOpen ? 'Close notes' : 'Notes'}
      aria-expanded={isNotesOpen}
    >
      <Icon name="Pencil" size={17} />
      {notes.length > 0 && <span className="tc-count">{notes.length}</span>}
    </button>
  );

  const notesPanel = (
    <div className={`tc-notes-wrap${isNotesOpen ? ' open' : ''}`}>
      <div className="tc-notes-inner">
        <div className="tc-notes">
          {notes.length > 0 && (
            <ul className="tc-note-list" aria-label="Notes">
              {notes.map((note) => (
                <li key={note.id} className="tc-note">
                  <p className="tc-note-text">{note.text}</p>
                  <div className="tc-note-foot">
                    <span>You, just now{note.edited ? ' · edited' : ''}</span>
                    <span className="tc-note-btns">
                      <button type="button" onClick={() => handleEditNote(note)} aria-label="Edit note">
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button type="button" onClick={() => handleDeleteNote(note.id)} aria-label="Delete note">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <label className="tc-note-label" htmlFor="lpNote">{editingNoteId ? 'Edit note' : 'Note'}</label>
          <textarea
            id="lpNote"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note about this candidate..."
            className="tc-notes-textarea"
            rows={3}
          />
          <div className="tc-note-actions">
            {editingNoteId && (
              <button type="button" className="tc-note-cancel" onClick={handleCancelEdit}>Cancel</button>
            )}
            <button type="button" className="tc-notes-save" onClick={handleSaveNote} disabled={!noteDraft.trim()}>
              <Icon name="Check" size={14} />
              Save note
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const contactRows = [
    { key: 'email', icon: 'Mail', label: 'Email', value: 'michael.carter@proton.me' },
    { key: 'phone', icon: 'Phone', label: 'Phone', value: '+1 415 555 0142' },
    { key: 'linkedin', icon: 'Linkedin', label: 'LinkedIn', value: 'linkedin.com/in/michaelcarter-dev', link: 'https://linkedin.com/in/michaelcarter-dev' },
  ];

  return (
    <div className={`lp ${PUBLIC_SHELL}`} ref={rootRef}>
      <Helmet>
        <title>Talentmon — Find top talent without posting a job</title>
        <meta name="description" content="Browse a pool of vetted candidates anonymously. Spend a credit only when unlocking the contact details of someone genuinely worth reaching out to." />
      </Helmet>

      {/* ===================== NAV ===================== */}
      <nav className="nav">
        <div className="wrap nav-in">
          <a href="#" className="brand" onClick={scrollToTop}>
            <span className="mark">
              <img src="/assets/images/talentmon.png" alt="Talentmon" />
            </span>
            <span>Talent<b>mon</b></span>
          </a>
          <div className="modes">
            <div className="mode-item">
              <span className="mode active">
                For companies
                <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </span>
              <div className="mode-dd">
                <a href="#how"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>How it works</a>
                <a href="#reveal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></svg>What you get</a>
                <a href="#pricing"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="5" /><path d="M16 8a5 5 0 1 1 0 8 5 5 0 0 1-3-1" /></svg>Pricing</a>
              </div>
            </div>
            <a href="/landing-page-candidates" className="mode">For candidates</a>
          </div>
          <div className="nav-cta">
            <a href="/login" className="btn btn-gold">Log in</a>
          </div>
          <button className="nav-toggle" aria-label="Menu" onClick={() => setNavOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <PublicScroll>
        {/* ===================== HERO ===================== */}
        <header className="hero dark">
          <div className="wrap hero-grid">
            <div className="hero-copy fx">
              <span className="eyebrow">Pre-screened talent · Pay per unlock</span>
              <h1>Find top talent <span className="u">without</span> posting a job.</h1>
              <p className="hero-tagline">See enough to choose. Pay to connect.</p>
              <p className="hero-sub">Browse a pool of vetted candidates anonymously. Spend a credit only when unlocking the contact details of someone genuinely worth reaching out to.</p>
              <div className="hero-actions">
                <a href="#pricing" className="btn btn-gold btn-lg">
                  Start hiring
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              </div>
              <ul className="hero-points">
                <li><span className="dot" />No job-posting fees</li>
                <li><span className="dot" />Bookmark potential candidates</li>
                <li><span className="dot" />Pay only on a match</li>
              </ul>
            </div>

            {/* SIGNATURE: interactive unlock card */}
            <div className="card-stage fx">
              <div className="balance" id="heroBalance"><span className="coin" />Credits <span id="balNum" className={balanceBump ? 'bump' : ''}>{balance}</span></div>
              {/* The Search card, then the Bookmarked card once saved, then the Purchased card once unlocked. */}
              <div className={`talent-card${revealed ? ' revealed' : ''}${flashing ? ' flashing' : ''}`} id="heroCard">
                <span className="flash" />

                {revealed ? (
                  <div className="tc-top">
                    <span className="tc-top-note"><Icon name="Unlock" size={14} className="tc-top-unlock" />Unlocked on {shortDate(unlockedDate)}</span>
                  </div>
                ) : bookmarked && (
                  <div className="tc-top">
                    <span className="tc-top-note"><Icon name="Bookmark" size={14} className="tc-top-saved" />Saved on {shortDate(bookmarkedDate)}</span>
                    <button
                      type="button"
                      className="tc-bookmark-remove"
                      onClick={handleRemoveBookmark}
                      title="Remove from Bookmarked"
                      aria-label="Remove from Bookmarked"
                    >
                      <Icon name="X" size={18} />
                    </button>
                  </div>
                )}

                <div className="tc-head">
                  <div className="tc-avatar">
                    {revealed ? (
                      <span className="mono">MC</span>
                    ) : (
                      <>
                        <Icon name="User" size={30} strokeWidth={1.6} />
                        <span className="tc-lock"><Icon name="Lock" size={11} strokeWidth={2.6} /></span>
                      </>
                    )}
                  </div>

                  <div className="tc-info">
                    {revealed ? (
                      <span className="tc-name">Michael Carter</span>
                    ) : (
                      <span className="tc-pills" aria-hidden="true"><i /><i /></span>
                    )}
                    <h3 className="tc-title">Senior React Engineer</h3>
                    <div className="tc-meta">
                      <span><Icon name="MapPin" size={14} />San Francisco</span>
                      <span><Icon name="Laptop" size={14} />Remote</span>
                    </div>
                    <span className="tc-badge"><span className="pulse" />Actively searching</span>
                  </div>

                  {revealed ? notesButton('tc-icon-btn tc-head-notes') : (
                    <div className="tc-ring">
                      <div className="tc-ring-dial">
                        <svg viewBox="0 0 58 58" aria-hidden="true">
                          <circle cx="29" cy="29" r={RING_R} className="tc-ring-track" />
                          <circle
                            cx="29"
                            cy="29"
                            r={RING_R}
                            className="tc-ring-fill"
                            strokeDasharray={RING_C}
                            strokeDashoffset={RING_C * (1 - DEMO_MATCH / 100)}
                          />
                        </svg>
                        <span className="tc-ring-value">{DEMO_MATCH}%</span>
                      </div>
                      <span className="tc-ring-label">Match</span>
                    </div>
                  )}
                </div>

                {revealed && notesPanel}

                <div className="tc-stats">
                  <div className="tc-stat"><span className="k">Salary minimum</span><span className="v">$150,000</span></div>
                  <div className="tc-stat"><span className="k">Experience</span><span className="v">7 years</span></div>
                  <div className="tc-stat"><span className="k">Notice period</span><span className="v">2 weeks</span></div>
                </div>

                <div className="tc-skills">
                  <span>React</span><span>TypeScript</span><span>Node.js</span><span>GraphQL</span>
                  <span className="tc-more">+2 more</span>
                </div>

                <p className="tc-desc">Senior engineer with seven years building and scaling React/TypeScript front ends, most of it owning a shared component library end to end. Comfortable pairing with design and shipping across the stack when the team needs it.</p>

                {revealed ? (
                  <>
                    <div className="tc-contact">
                      <h4 className="tc-contact-title">Contact</h4>
                      <ul className="tc-contact-list">
                        {contactRows.map((row) => (
                          <li key={row.key} className="tc-crow">
                            <span className="tc-crow-ic"><Icon name={row.icon} size={16} /></span>
                            <span className="tc-crow-info">
                              <span className="tc-crow-label">{row.label}</span>
                              <span className="tc-crow-value">{row.value}</span>
                            </span>
                            {row.link ? (
                              <button type="button" className="tc-copy" onClick={() => window.open(row.link, '_blank', 'noopener')} aria-label="Open LinkedIn profile in a new tab">
                                <Icon name="ExternalLink" size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`tc-copy${copied === row.key ? ' copied' : ''}`}
                                onClick={() => handleCopy(row.key, row.value)}
                                aria-label={copied === row.key ? `${row.label} copied` : `Copy ${row.label.toLowerCase()}`}
                              >
                                <Icon name={copied === row.key ? 'Check' : 'Copy'} size={16} />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="tc-actions-row tc-cv-row">
                      <button type="button" className="tc-unlock" onClick={scrollToReveal}>
                        <Icon name="FileText" size={18} />
                        Open CV
                      </button>
                      <button type="button" className="tc-icon-btn" aria-label="Download CV" title="Download CV">
                        <Icon name="Download" size={18} />
                      </button>
                    </div>

                    {/* Hire tracking: a bar across the card's bottom; the pills set the stage. */}
                    <div className="tc-track">
                      <button
                        type="button"
                        className="tc-track-toggle"
                        onClick={() => setIsTrackingOpen((v) => !v)}
                        aria-expanded={isTrackingOpen}
                        aria-controls="lpHireStages"
                      >
                        <Icon name="Route" size={16} className="tc-track-icon" />
                        <span className="tc-track-label">Hire tracking</span>
                        {!isTrackingOpen && <span className={`tc-stage s-${currentStage.value}`}>{currentStage.label}</span>}
                        <Icon name="ChevronDown" size={16} strokeWidth={2.2} className={`tc-track-chevron${isTrackingOpen ? ' up' : ''}`} />
                      </button>
                      <div className={`tc-expand${isTrackingOpen ? ' open' : ''}`}>
                        <div className="tc-expand-inner">
                          <div id="lpHireStages" className="tc-stages" role="group" aria-label="Hire stage">
                            {STATUS_OPTIONS.map((stage, index) => {
                              const isCurrent = stage.value === recruitmentStatus;
                              return (
                                <React.Fragment key={stage.value}>
                                  {index > 0 && index < 4 && <Icon name="ChevronRight" size={12} strokeWidth={2.6} className="tc-stage-arrow" />}
                                  {index === 4 && <span className="tc-stage-or" aria-hidden="true">or</span>}
                                  <button
                                    type="button"
                                    className={`tc-stage s-${stage.value}${isCurrent ? ' on' : ''}`}
                                    onClick={() => setRecruitmentStatus(stage.value)}
                                    aria-pressed={isCurrent}
                                  >
                                    {stage.label}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="tc-actions">
                    <div className="tc-actions-row">
                      <button className="tc-unlock" onClick={handleUnlock}>
                        <Icon name="Unlock" size={18} />
                        Unlock profile
                      </button>
                      <button type="button" className="tc-icon-btn tc-preview" aria-label="Preview CV" title="Preview CV" onClick={scrollToReveal}>
                        <Icon name="Eye" size={18} />
                      </button>
                      {bookmarked ? notesButton('tc-icon-btn tc-bookmark') : (
                        <button type="button" className="tc-icon-btn tc-bookmark" onClick={handleBookmark} aria-label="Bookmark candidate" title="Bookmark candidate">
                          <Icon name="Bookmark" size={18} />
                        </button>
                      )}
                    </div>
                    {bookmarkMsg && <p className="tc-bookmark-msg">{bookmarkMsg}</p>}
                    {bookmarked && notesPanel}
                  </div>
                )}
              </div>
              <p className="tc-hint">{revealed ? 'See enough to choose. Pay to connect.' : 'This is a live demo — try unlocking the card, bookmarking it, or previewing the anonymous CV'}</p>
            </div>
          </div>
        </header>

        {/* ===================== HOW IT WORKS ===================== */}
        <section className="section" id="how">
          <div className="wrap">
            <div className="sec-head fx">
              <span className="eyebrow">How it works</span>
              <h2>Four steps from search to signed.</h2>
              <p>No job posts, no applications to wade through, no feed to scroll. You go straight to the talent and only pay when you find someone real.</p>
            </div>
            <div className="steps">
              <div className="step fx">
                <div className="step-head">
                  <div className="step-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></div>
                  <h3>Search</h3>
                  <span className="step-num">01</span>
                </div>
                <p>Filter the pool by skills, experience, salary minimum (net or gross), location, work mode and availability — instantly.</p>
              </div>
              <div className="step fx">
                <div className="step-head">
                  <div className="step-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" /></svg></div>
                  <h3>Shortlist</h3>
                  <span className="step-num">02</span>
                </div>
                <p>Bookmark promising candidates — 10 on your company list, plus 5 personal slots per teammate — and leave notes your whole team sees before you commit a credit.</p>
              </div>
              <div className="step fx">
                <div className="step-head">
                  <div className="step-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></svg></div>
                  <h3>Unlock</h3>
                  <span className="step-num">03</span>
                </div>
                <p>Spend one credit to reveal name, email, phone, LinkedIn, past employers and the full CV. By unlocking, you agree to offer at least the salary minimum they stated.</p>
              </div>
              <div className="step fx">
                <div className="step-head">
                  <div className="step-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h5v14H4zM10 5h4v9h-4zM15 5h5v6h-5z" /></svg></div>
                  <h3>Track</h3>
                  <span className="step-num">04</span>
                </div>
                <p>Move each candidate through your pipeline — new, contacted, interviewed, hired — and see your hire rate and cost per hire.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== MATCH SCORE ===================== */}
        <section className="section match-sec" id="match">
          <div className="wrap">
            <div className="sec-head center fx">
              <span className="eyebrow">Smart match</span>
              <h2>Tell us what you need. We rank who fits.</h2>
              <p>Set your filters and every candidate gets a live match score — a transparent percentage, not a black box. The closest fits rise to the top, so you spend your credits on the right people first.</p>
            </div>
            <div className="match-grid fx">
              <div className="match-filters">
                <div className="mf-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>Your criteria</div>
                <div className="mf-group"><span className="mf-lab">Skills</span><div className="mf-chips"><span>React</span><span>TypeScript</span><span>Next.js</span></div></div>
                <div className="mf-group"><span className="mf-lab">Location</span><div className="mf-chips"><span>London</span></div></div>
                <div className="mf-group"><span className="mf-lab">Experience</span><div className="mf-chips"><span>3+ years</span></div></div>
                <div className="mf-group"><span className="mf-lab">Work mode</span><div className="mf-chips"><span>Remote</span></div></div>
                <div className="mf-group"><span className="mf-lab">Status</span><div className="mf-chips"><span>Open to offers</span></div></div>
              </div>
              <div className="match-results">
                <div className="mr-row top">
                  <div className="mr-score" style={{ '--pct': 96 }}><b>96%</b></div>
                  <div className="mr-info">
                    <div className="mr-name"><span className="mr-redact" />Frontend Developer</div>
                    <div className="mr-meta">London · 5 yrs · <b>React, TypeScript, Next.js, Remote</b> all match</div>
                  </div>
                </div>
                <div className="mr-row">
                  <div className="mr-score" style={{ '--pct': 88 }}><b>88%</b></div>
                  <div className="mr-info">
                    <div className="mr-name"><span className="mr-redact" />Frontend Developer</div>
                    <div className="mr-meta">London · 4 yrs · React, TypeScript match · <b>Next.js missing</b></div>
                  </div>
                </div>
                <div className="mr-row">
                  <div className="mr-score" style={{ '--pct': 71 }}><b>71%</b></div>
                  <div className="mr-info">
                    <div className="mr-name"><span className="mr-redact" />Fullstack Developer</div>
                    <div className="mr-meta">Manchester · 6 yrs · React match · <b>location &amp; Next.js off</b></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="match-note">A precise scoring algorithm that weighs how many of your criteria each candidate meets.</p>
          </div>
        </section>

        {/* ===================== BEFORE / AFTER REVEAL ===================== */}
        <section className="section reveal-sec dark" id="reveal">
          <div className="wrap">
            <div className="sec-head center fx">
              <span className="eyebrow">What a credit unlocks</span>
              <h2>See enough to choose. Pay to connect.</h2>
              <p>Every profile is useful before you spend a thing. A credit simply turns an anonymous match into someone you can email today.</p>
            </div>
            <div className="ba">
              {/* ============ ANONYMOUS ============ */}
              <div className="ba-card before fx">
                <div className="ba-head">
                  <div>
                    <div className="ba-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>Anonymous profile</div>
                  </div>
                  <span className="ba-price">Free</span>
                </div>

                <div className="ba-body">
                  <div className="an-id">
                    <div className="an-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></div>
                    <div>
                      <span className="an-name" />
                      <div className="an-role">Senior React Engineer <em>·</em> 7 years</div>
                    </div>
                  </div>

                  <div className="an-facts">
                    <div><span className="k">Location</span><span className="v">San Francisco, USA</span></div>
                    <div><span className="k">Work mode</span><span className="v">Remote</span></div>
                    <div><span className="k">Type</span><span className="v">Full-time</span></div>
                    <div><span className="k">Salary minimum (gross)</span><span className="v gold">$150,000 / year</span><span className="v-sub">$8,300 net / month</span></div>
                    <div><span className="k">Availability</span><span className="v">2 weeks</span></div>
                    <div><span className="k">Status</span><span className="v">Actively searching</span></div>
                  </div>

                  <div className="an-block">
                    <div className="an-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>Summary</div>
                    <p className="an-p">Senior engineer with seven years building and scaling React/TypeScript front ends, most of it owning a shared component library end to end. Comfortable pairing with design and shipping across the stack when the team needs it.</p>
                  </div>

                  <div className="an-block">
                    <div className="an-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>Experience</div>
                    <ul className="xp">
                      <li>
                        <div className="xp-top"><span className="xp-title">Senior React Engineer</span><span className="xp-when">2021–Present · San Francisco</span></div>
                        <p className="xp-desc">Owns the component library and the core dashboard. Leads a team of four on migrating the app to TypeScript.</p>
                        <div className="tags"><span>React</span><span>TypeScript</span><span>Node.js</span><span>GraphQL</span></div>
                      </li>
                      <li>
                        <div className="xp-top"><span className="xp-title">Frontend Engineer</span><span className="xp-when">2019–2021 · San Francisco</span></div>
                        <p className="xp-desc">Rebuilt the checkout flow for an e-commerce platform and cut bundle size by 40%.</p>
                        <div className="tags"><span>React</span><span>Redux</span><span>Webpack</span></div>
                      </li>
                      <li>
                        <div className="xp-top"><span className="xp-title">Junior Developer</span><span className="xp-when">2018–2019 · Sacramento</span></div>
                        <p className="xp-desc">Built internal tools and marketing sites for clients at a small agency.</p>
                        <div className="tags"><span>JavaScript</span><span>CSS</span></div>
                      </li>
                    </ul>
                  </div>

                  <div className="an-block">
                    <div className="an-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M3 9l9-4 9 4-9 4-9-4z" /><path d="M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5" /></svg>Education</div>
                    <div className="an-line"><span className="t">BSc, Computer Science</span><span className="d">2014–2018</span></div>
                    <div className="an-sub">University of California, Berkeley</div>
                  </div>

                  <div className="an-block">
                    <div className="an-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12" /></svg>Skills</div>
                    <div className="tags gold"><span>React</span><span>TypeScript</span><span>Node.js</span><span>GraphQL</span><span>Redux</span><span>Webpack</span></div>
                  </div>

                  <div className="an-block">
                    <div className="an-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>Languages</div>
                    <div className="langs">
                      <div className="lang"><span className="ln">English</span><span className="lv">C1 · Advanced</span></div>
                      <div className="lang"><span className="ln">German</span><span className="lv">A2 · Basic</span></div>
                    </div>
                  </div>

                  <div className="an-block">
                    <div className="an-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><circle cx="12" cy="9" r="5" /><path d="m8.5 13.5-1 7.5 4.5-2.5 4.5 2.5-1-7.5" /></svg>Certifications</div>
                    <div className="certs">
                      <div className="cert">
                        <div className="an-line"><span className="t">AWS Certified Developer</span><span className="d">Jun 2023 – Jun 2026</span></div>
                        <div className="an-sub">Amazon Web Services · ID AWS-2023-9931</div>
                      </div>
                    </div>
                  </div>

                  <div className="an-block">
                    <div className="an-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>Anything else on the CV</div>
                    <p className="an-p">Whatever the candidate adds themselves — side projects, talks, open source, awards. It shows up here exactly as they wrote it.</p>
                    <div className="tags" style={{ marginTop: '11px' }}><span>3 open-source repos</span><span>Speaker, React Bay Area</span></div>
                  </div>

                  <div className="an-locked">
                    <div className="lh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Locked until you spend a credit</div>
                    <div className="lk-row"><span className="lab">Name</span><span className="bar" /><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span></div>
                    <div className="lk-row"><span className="lab">Email</span><span className="bar" /><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span></div>
                    <div className="lk-row"><span className="lab">Phone</span><span className="bar" /><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span></div>
                    <div className="lk-row"><span className="lab">LinkedIn</span><span className="bar" /><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span></div>
                    <div className="lk-row"><span className="lab">Past employers</span><span className="bar" /><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span></div>
                  </div>
                </div>
              </div>

              {/* ============ ARROW ============ */}
              <div className="ba-mid fx">
                <div className="ba-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
                <div className="ba-cost">– 1 credit</div>
              </div>

              {/* ============ UNLOCKED ============ */}
              <div className="ba-card after fx">
                <div className="ba-head">
                  <div>
                    <div className="ba-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Unlocked profile</div>
                    <h3>What you get</h3>
                  </div>
                  <span className="ba-price">1 credit</span>
                </div>

                <div className="ba-body">
                  <div className="ul-list">
                    <div className="ul-row">
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg></span>
                      <span><span className="lab">Name</span><span className="val gold">Michael Carter</span></span>
                    </div>
                    <div className="ul-row">
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg></span>
                      <span><span className="lab">Email</span><span className="val">michael.carter@proton.me</span></span>
                    </div>
                    <div className="ul-row">
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" /></svg></span>
                      <span><span className="lab">Phone</span><span className="val">+1 415 555 0142</span></span>
                    </div>
                    <div className="ul-row">
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="3" /><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4" strokeLinecap="round" /></svg></span>
                      <span><span className="lab">LinkedIn</span><span className="val">/in/michaelcarter-dev</span></span>
                    </div>
                    <div className="ul-row">
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="7" rx="2" /><path d="M8 16h8v5H8z" /></svg></span>
                      <span><span className="lab">Full CV</span><span className="val">Print or save as PDF</span><span className="ul-note">Open the complete profile, print it, or save it as a PDF.</span></span>
                    </div>
                    <div className="ul-row">
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></span>
                      <span><span className="lab">Named in full</span><span className="val">Past employers</span><span className="ul-note">See every employer from the experience timeline by name.</span></span>
                    </div>
                  </div>

                  <div className="ul-track">
                    <div className="th">Track</div>
                    <p className="ul-note">Move the candidate through your pipeline in one view.</p>
                    <div className="pipe">
                      <span>New</span><span className="arw">›</span>
                      <span className="on">Contacted</span><span className="arw">›</span>
                      <span>Interviewed</span><span className="arw">›</span>
                      <span>Hired</span>
                    </div>
                  </div>
                </div>

                <div className="ba-foot">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3v6h-6" /><path d="M14 10 21 3" /><circle cx="8.5" cy="15.5" r="5.5" /></svg>
                  Unlocked once — yours forever
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== COMPARISON ===================== */}
        <section className="section compare-sec" id="compare">
          <div className="wrap">
            <div className="sec-head center fx">
              <span className="eyebrow">The math</span>
              <h2>Same 10 candidates. A fraction of the cost.</h2>
              <p>A job ad buys you a pile of applications to sift. A credit buys you ten people you already chose — and you only pay for the ones worth contacting. You're paying for the time saved, not the contact line.</p>
            </div>
            <div className="cmp fx">
              <div className="cmp-row best">
                <div className="cmp-name">Talentmon<span>10 candidates you hand-pick</span></div>
                <div className="cmp-bar"><i style={{ width: '11%' }} /></div>
                <div className="cmp-cost">€199</div>
              </div>
              <div className="cmp-row">
                <div className="cmp-name">Job board ad<span>One listing, then sift every applicant</span></div>
                <div className="cmp-bar"><i style={{ width: '33%' }} /></div>
                <div className="cmp-cost">from €590</div>
              </div>
              <div className="cmp-row">
                <div className="cmp-name">LinkedIn campaign<span>You pay per click, not per hire</span></div>
                <div className="cmp-bar"><i style={{ width: '100%' }} /></div>
                <div className="cmp-cost">€700–3,000</div>
              </div>
            </div>
            <div className="cmp-points fx">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>Pay only for matches</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>You choose who, not an algorithm</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>No ad, no waiting for applications</span>
            </div>
            <p className="price-note">Competitor prices are indicative and vary by plan, region, and campaign.</p>
          </div>
        </section>

        {/* ===================== PRICING ===================== */}
        <section className="section price-sec" id="pricing">
          <div className="wrap">
            <div className="sec-head center fx">
              <span className="eyebrow">Credit packages</span>
              <h2>One credit. One unlock. No subscription.</h2>
              <p>Buy credits up front and spend them only on the candidates you choose. The more you buy, the less each unlock costs.</p>
            </div>
            <div className="tokmodel fx">
              <span className="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>1 credit = 1 unlock</span>
              <span className="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>No subscription required</span>
              <span className="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>Credits never expire</span>
            </div>
            <div className="plans">
              {PLANS.map((plan) => (
                <div key={plan.name} className={`plan fx${plan.popular ? ' pop' : ''}`}>
                  <div className="plan-head">
                    <span className="plan-name">{plan.name}</span>
                    {plan.save && <span className="plan-save-badge">Save {plan.save}%</span>}
                  </div>
                  <div className="plan-credits">
                    <b>{plan.credits}</b>
                    <span>{plan.credits === 1 ? 'Credit' : 'Credits'}</span>
                  </div>
                  <div className="plan-box">
                    <div className="plan-price">{plan.price}</div>
                    <div className="plan-unlocks">{plan.perUnlock} per unlock</div>
                  </div>
                  {/* Kept even when empty so every card's bonus and button line up. */}
                  <div className={`plan-save${plan.save ? '' : ' plan-save-empty'}`}>
                    {plan.save ? (
                      <>
                        <Icon name="Check" size={16} />
                        Save {plan.save}% vs Buy 1
                      </>
                    ) : ' '}
                  </div>
                  {plan.bonus && (
                    <div className="plan-bonus">
                      <Icon name="Bookmark" size={20} />
                      <span>
                        <span>+{plan.bonus} bonus bookmarks</span>
                        {/* An invisible "+" so this line starts under the number, not the sign. */}
                        <span><span className="plan-bonus-indent" aria-hidden="true">+</span>for 6 months</span>
                      </span>
                    </div>
                  )}
                  <a
                    href="#heroBalance"
                    onClick={(e) => { e.preventDefault(); handleBuyCredits(plan.credits); }}
                    className={`btn ${plan.popular ? 'btn-gold' : 'btn-ghost'}`}
                  >
                    <Icon name="ShoppingCart" size={16} />Buy now
                  </a>
                </div>
              ))}
            </div>
            <div className="price-incl fx">
              <span>Every package includes</span>
              <em><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>Full candidate search</em>
              <em><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>Shortlist &amp; pipeline</em>
              <em><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>Print-ready CV on unlock</em>
              <em><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>Team accounts</em>
            </div>
            <p className="price-note">Prices in EUR, VAT included · Pay in your own currency at checkout</p>
          </div>
        </section>

        {/* ===================== FINAL CTA ===================== */}
        <section className="cta dark">
          <div className="wrap cta-in">
            <span className="eyebrow">Ready when you are</span>
            <h2>Stop posting jobs. Start unlocking talent.</h2>
            <p className="cta-desc">Create a free account, browse the full pool, and spend a credit only when you find someone worth a conversation.</p>
            <div className="cta-actions">
              <a href="/login?tab=hr" className="btn btn-gold btn-lg">
                Browse the talent pool
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <a href="/landing-page-candidates" className="btn btn-ghost btn-lg">Join as a candidate</a>
            </div>
            <p className="cta-fine">Free to browse · No card to sign up · Credits never expire</p>
          </div>
        </section>

        {/* ===================== FOOTER ===================== */}
        <footer className="foot">
          <div className="wrap">
            <div className="foot-grid">
              <div>
                <a href="#" className="brand" onClick={scrollToTop}>
                  <span className="mark">
                    <img src="/assets/images/talentmon.png" alt="Talentmon" />
                  </span>
                  <span>Talent<b>mon</b></span>
                </a>
                <p className="foot-tag">A pre-screened talent pool you browse anonymously and pay for only when you find a real match.</p>
              </div>
              <div className="foot-col">
                <h4>Product</h4>
                <a href="#how">How it works</a>
                <a href="#reveal">What you get</a>
                <a href="#pricing">Pricing</a>
                <a href="#compare">Compare</a>
              </div>
              <div className="foot-col">
                <h4>Company</h4>
                <a href="/landing-page-candidates">For candidates</a>
                <a href="/about">About</a>
                <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
              </div>
              <div className="foot-col">
                <h4>Legal</h4>
                <a href="/privacy-policy">Privacy policy</a>
                <a href="/terms-of-service">Terms of service</a>
                <a href="/refund-policy">Refund policy</a>
              </div>
            </div>
            <div className="foot-bottom">
              <span>© 2026 Talentmon. All rights reserved.</span>
              <div className="fb-right">
                <a href="#">Twitter</a>
                <a href="#">LinkedIn</a>
              </div>
            </div>
          </div>
        </footer>

        {/* mobile nav (simple slide list under sticky nav) */}
        {navOpen && (
          <div className="wrap" style={{ background: 'var(--lp-ink-2)', padding: '16px 24px', display: 'grid', gap: '12px' }}>
            <a href="#how" onClick={() => setNavOpen(false)} style={{ color: 'var(--lp-text-light)' }}>How it works</a>
            <a href="#reveal" onClick={() => setNavOpen(false)} style={{ color: 'var(--lp-text-light)' }}>What you get</a>
            <a href="#pricing" onClick={() => setNavOpen(false)} style={{ color: 'var(--lp-text-light)' }}>Pricing</a>
            <a href="/landing-page-candidates" style={{ color: 'var(--lp-text-light)' }}>For candidates</a>
            <a href="/login" style={{ color: 'var(--lp-gold)', fontWeight: 600 }}>Log in</a>
          </div>
        )}
      </PublicScroll>
    </div>
  );
};

export default LandingPage;
