import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import './styles.scss';

const RATE_CATEGORIES = [
  { key: 'hiring', label: 'Hiring process', hint: 'Speed, clarity, fairness' },
  { key: 'comm', label: 'Communication', hint: 'Feedback and tone' },
  { key: 'culture', label: 'Work culture', hint: 'Team, values, atmosphere' },
  { key: 'benefits', label: 'Benefits', hint: 'Health coverage, days off, equipment' },
];

const STAR_POLYGON = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26';

const renderPartialStars = (value) => {
  const full = Math.floor(value);
  const remainder = value - full;
  return Array.from({ length: 5 }).map((_, i) => {
    if (i < full) return <svg key={i} viewBox="0 0 24 24" fill="currentColor"><polygon points={STAR_POLYGON} /></svg>;
    if (i === full && remainder > 0) {
      return (
        <span key={i} className="star-partial">
          <svg className="empty" viewBox="0 0 24 24" fill="currentColor"><polygon points={STAR_POLYGON} /></svg>
          <span className="star-partial-fill" style={{ width: `${remainder * 100}%` }}><svg viewBox="0 0 24 24" fill="currentColor"><polygon points={STAR_POLYGON} /></svg></span>
        </span>
      );
    }
    return <svg key={i} className="empty" viewBox="0 0 24 24" fill="currentColor"><polygon points={STAR_POLYGON} /></svg>;
  });
};

const ForCandidates = () => {
  const rootRef = useRef(null);
  const [ratings, setRatings] = useState({ hiring: 5, comm: 5, culture: 5, benefits: 5 });
  const [honored, setHonored] = useState('no');
  const [rec, setRec] = useState(null);

  const { overall, overallValue, capped } = useMemo(() => {
    const vals = Object.values(ratings).filter((v) => v > 0);
    if (!vals.length) return { overall: null, overallValue: 0, capped: false };
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const isCapped = honored === 'no' && avg > 3;
    const value = isCapped ? 3 : avg;
    return { overall: value.toFixed(1), overallValue: value, capped: isCapped };
  }, [ratings, honored]);

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

  return (
    <div className="fc" ref={rootRef}>
      <Helmet>
        <title>For candidates — Talentmon</title>
        <meta name="description" content="Build one profile, name the salary you want, and let pre-screened companies reach out. No job boards, no endless applying." />
      </Helmet>

      {/* ===================== NAV ===================== */}
      <nav className="nav">
        <div className="wrap nav-in">
          <a href="/landing-page" className="brand">
            <span className="mark">
              <img src="/assets/images/talentmon.png" alt="Talentmon" />
            </span>
            <span>Talent<b>mon</b></span>
          </a>
          <div className="modes">
            <a href="/landing-page" className="mode">For companies</a>
            <div className="mode-item">
              <span className="mode active">
                For candidates
                <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </span>
              <div className="mode-dd">
                <a href="#how"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>How it works</a>
                <a href="#salary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>Salary clause</a>
                <a href="#cv"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3M9 3h6M8 12h8M8 16h5" /></svg>Your CV</a>
                <a href="#companies"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M6 21V8l6-4 6 4v13" /><path d="M10 12h.01M14 12h.01M10 16h.01M14 16h.01" /></svg>Companies</a>
                <a href="#get"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg>What you get</a>
              </div>
            </div>
          </div>
          <div className="nav-cta">
            <a href="/login?tab=candidate" className="btn btn-gold">Log in</a>
          </div>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy fx">
            <span className="eyebrow">For candidates · Free forever</span>
            <h1>Let the right companies <span className="u">find you</span>.</h1>
            <p className="hero-sub">Build one profile, name the salary you want, and let pre-screened companies reach out. No job boards, no endless applying — the number you set becomes the floor any company must accept to contact you.</p>
            <div className="hero-actions">
              <a href="/login?tab=candidate" className="btn btn-gold btn-lg">
                Create your free profile
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <a href="#how" className="btn btn-ghost btn-lg">See how it works</a>
            </div>
            <ul className="hero-points">
              <li><span className="dot" />Free to join</li>
              <li><span className="dot" />Your salary sets the floor</li>
              <li><span className="dot" />Hidden from your current employer</li>
            </ul>
          </div>

          <div className="card-stage fx">
            <div className="profile-card">
              <div className="pc-top">
                <div className="pc-av">EB</div>
                <div>
                  <div className="pc-name">Emily Bennett</div>
                  <div className="pc-role">Product Designer · 5 yrs</div>
                </div>
              </div>
              <span className="pc-status"><span className="pdot" />Open to offers</span>
              <div className="pc-barlab">Profile strength · 88%</div>
              <div className="pc-bar"><i style={{ width: '88%' }} /></div>
              <div className="pc-stats">
                <div className="pc-stat"><span className="n">38</span><span className="l">Views</span></div>
                <div className="pc-stat"><span className="n">5</span><span className="l">Unlocks</span></div>
                <div className="pc-stat"><span className="n">12</span><span className="l">Saved</span></div>
              </div>
              <div className="pc-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>View company profile and rating anytime</div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="sec-head center fx">
            <span className="eyebrow">How it works</span>
            <h2>Four steps to being discovered</h2>
            <p>You build your profile once. After that, companies do the searching — and pay to reach you.</p>
          </div>
          <div className="steps">
            <div className="step fx">
              <span className="step-num">01</span>
              <div className="step-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg></div>
              <h3>Build your profile</h3>
              <p>Fill in your experience, skills, preferences and the salary you want — once. We turn it into a clean, standardized CV instantly.</p>
            </div>
            <div className="step fx">
              <span className="step-num">02</span>
              <div className="step-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></svg></div>
              <h3>Set your status</h3>
              <ul className="step-status">
                <li><span className="dot dot-green" /><div><b>Actively looking</b><span className="d">Open to all companies</span></div></li>
                <li><span className="dot dot-gold" /><div><b>Open to offers</b><span className="d">Employed, but listening</span></div></li>
                <li><span className="dot dot-grey" /><div><b>Not interested</b><span className="d">Hidden from search</span></div></li>
              </ul>
            </div>
            <div className="step fx">
              <span className="step-num">03</span>
              <div className="step-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></div>
              <h3>Companies unlock you</h3>
              <p>Recruiters find you by skills and experience. To reach you they spend a credit — and accept your salary as the floor.</p>
            </div>
            <div className="step fx">
              <span className="step-num">04</span>
              <div className="step-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div>
              <h3>Get contacted directly</h3>
              <p>You're notified the moment someone unlocks you — so every message is real, relevant, and above your minimum.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TIRED OF APPLYING ===================== */}
      <section className="section tired-sec" id="tired">
        <div className="wrap">
          <div className="sec-head center fx">
            <span className="eyebrow">A better way</span>
            <h2>Tired of applying to a hundred ads?</h2>
            <p>Job hunting shouldn't be a second job. Stop chasing openings one by one — build your profile once and let the offers come to you. Simpler for you, better for everyone.</p>
          </div>
          <div className="compare fx">
            <div className="cmp-card cmp-old">
              <div className="cmp-label">The old way</div>
              <h3>Apply, wait, repeat</h3>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>Rewrite your CV for every single opening</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>Fire off dozens of applications into the void</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>Get ghosted — or never hear back at all</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>Compete on who has the prettiest template</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>Hope your current boss doesn't spot you looking</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>Sit through interviews only to be lowballed</div>
            </div>
            <div className="cmp-card cmp-new">
              <div className="cmp-label">With Talentmon</div>
              <h3>Get found instead</h3>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>One profile, one standardized CV — built once</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>Pre-screened companies pay to reach you</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>Get notified the instant someone unlocks you</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>Judged on skills and experience, not design</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>Invisible to your current employer, always</div>
              <div className="cmp-li"><span className="cmp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>Your salary is locked as the floor before they talk</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== YOUR CV ===================== */}
      <section className="section cv-sec" id="cv">
        <div className="wrap">
          <div className="sec-head center fx">
            <span className="eyebrow" style={{ color: 'var(--lp-gold-2)' }}>Your CV</span>
            <h2>One profile. One clean CV.</h2>
            <p>Fill it once and we generate a standardized CV. Everyone's in the same format — so you're judged on substance, not on who has the prettiest template.</p>
          </div>
          <div className="cv-grid">
            <div className="cv-points fx">
              <div className="cv-point">
                <span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg></span>
                <div><b>Instant, downloadable PDF</b><span>Export a polished CV anytime — ready to send anywhere, always up to date.</span></div>
              </div>
              <div className="cv-point">
                <span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg></span>
                <div><b>Standardized = fair</b><span>Same structure for everyone means companies compare skills and experience, not design tricks.</span></div>
              </div>
              <div className="cv-point">
                <span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span>
                <div><b>Anonymous until unlocked</b><span>Companies see your skills and experience, but your name, photo and contact stay hidden until they spend a credit.</span></div>
              </div>
              <div className="cv-point">
                <span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg></span>
                <div><b>Preview both views</b><span>See exactly what companies see before anyone reaches you — full view and the anonymized one, side by side.</span></div>
              </div>
            </div>
            <div className="cv-doc fx">
              <span className="cv-doc-tag">Standardized CV</span>
              <div className="cv-doc-scroll">
                <div className="cv-head cv-head-self">
                  <div className="cv-photo"><span className="ph">EB</span></div>
                  <div>
                    <div className="cv-name">Emily Bennett</div>
                    <div className="cv-role">Product Designer · 5 years</div>
                    <div className="cv-loc">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                      London, United Kingdom
                    </div>
                  </div>
                </div>

                <div className="cv-contact-strip">
                  <span className="cv-c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>emily.bennett@gmail.com</span>
                  <span className="cv-c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.6 3 .2 2 .7 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" /></svg>+1 415 555 0198</span>
                  <span className="cv-c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="3" /><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4" /></svg>/in/emilybennett</span>
                </div>

                <div className="cv-block">
                  <div className="prefs">
                    <div className="pref"><span className="pl">Work mode</span><span className="pv">On-site</span></div>
                    <div className="pref"><span className="pl">Type</span><span className="pv">Full-time</span></div>
                    <div className="pref"><span className="pl">Expected salary (net)</span><span className="pv">2.000 EUR / week</span></div>
                    <div className="pref"><span className="pl">Availability</span><span className="pv">2 weeks</span></div>
                  </div>
                </div>

                <div className="cv-block">
                  <div className="cv-h"><b>Summary</b></div>
                  <div className="cv-about">Product designer with 5 years of experience crafting clean, usable interfaces for fintech and SaaS teams. I love design systems, fast iteration, and decisions backed by user research.</div>
                </div>

                <div className="cv-block">
                  <div className="cv-h"><b>Experience</b></div>
                  <div className="xp">
                    <div className="xp-role">Product Designer</div>
                    <div className="xp-date">2022 — Present</div>
                    <div className="xp-co"><span className="co">Nordwave</span> · London, United Kingdom</div>
                    <div className="xp-desc">Lead designer on the core dashboard. Built and maintained the design system, led usability testing, and cut new-feature design time by ~40%.</div>
                    <div className="xp-tags">
                      <span className="tag">Figma</span>
                      <span className="tag">Design Systems</span>
                      <span className="tag">User Research</span>
                      <span className="tag">Prototyping</span>
                    </div>
                  </div>
                  <div className="xp">
                    <div className="xp-role">UX Designer</div>
                    <div className="xp-date">2020 — 2022</div>
                    <div className="xp-co"><span className="co">Beacon</span> · London, United Kingdom</div>
                    <div className="xp-desc">Owned end-to-end flows for the mobile app, from research to handoff. Launched an onboarding redesign that lifted activation by 18%.</div>
                    <div className="xp-tags">
                      <span className="tag">Figma</span>
                      <span className="tag">Wireframing</span>
                      <span className="tag">Mobile UX</span>
                    </div>
                  </div>
                  <div className="xp">
                    <div className="xp-role">Junior Designer</div>
                    <div className="xp-date">2019 — 2020</div>
                    <div className="xp-co"><span className="co">Forge Labs</span> · London, United Kingdom</div>
                    <div className="xp-desc">Supported brand and UI work across web projects. First hands-on experience with component-based design.</div>
                    <div className="xp-tags">
                      <span className="tag">UI Design</span>
                      <span className="tag">Webflow</span>
                    </div>
                  </div>
                </div>

                <div className="cv-block">
                  <div className="cv-h"><b>Education</b></div>
                  <div className="edu">
                    <div>
                      <div className="edu-name">BFA, Graphic Design</div>
                      <div className="edu-sub">University of Oxford · Oxford</div>
                      <div className="edu-desc">Visual Communications</div>
                    </div>
                    <div className="edu-date">2015 — 2019</div>
                  </div>
                </div>

                <div className="cv-block">
                  <div className="cv-h"><b>Skills</b></div>
                  <div className="skills-wrap">
                    <span className="tag">CSS</span>
                    <span className="tag">HTML</span>
                    <span className="tag">Vite</span>
                  </div>
                </div>

                <div className="cv-block">
                  <div className="cv-h"><b>Languages</b></div>
                  <div className="langs">
                    <div className="lang">
                      <span className="ln">English</span>
                      <span className="lvwrap"><span className="lv">C1</span><span className="lnote"><span className="dot">·</span>Advanced</span></span>
                    </div>
                    <div className="lang">
                      <span className="ln">German</span>
                      <span className="lvwrap"><span className="lv">B1</span><span className="lnote"><span className="dot">·</span>Intermediate</span></span>
                    </div>
                  </div>
                </div>

                <div className="cv-block">
                  <div className="cv-h"><b>Certifications</b></div>
                  <div className="certs">
                    <div className="cert">
                      <span className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M9 8.2 11 10.2 15 6.2" /><path d="M8.3 13.5 7 21l5-3 5 3-1.3-7.5" /></svg></span>
                      <div className="cert-body">
                        <div className="cert-row"><b>UX Certification</b><span><span className="dot">·</span>AAMA</span><span><span className="dot">·</span>Issued 12/2024</span><span><span className="dot">·</span>Expires 12/2026</span></div>
                        <div className="cert-row cert-id-row"><span>ID: dasdad</span></div>
                      </div>
                    </div>
                    <div className="cert">
                      <span className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M9 8.2 11 10.2 15 6.2" /><path d="M8.3 13.5 7 21l5-3 5 3-1.3-7.5" /></svg></span>
                      <div className="cert-body">
                        <div className="cert-row"><b>Google UX Design</b><span><span className="dot">·</span>Coursera</span><span><span className="dot">·</span>Issued 2026</span><span><span className="dot">·</span>No expiration</span></div>
                        <div className="cert-row cert-id-row"><span>ID: daskldja343k2j4kl3j4lk3j224</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SALARY CLAUSE ===================== */}
      <section className="section" id="salary">
        <div className="wrap">
          <div className="sec-head center fx">
            <span className="eyebrow">The salary clause</span>
            <h2>Your salary is a floor — not a wish</h2>
            <p>This is what makes Talentmon different. You set the number you want. The moment a company unlocks you, they accept it — in writing — as the minimum they can offer you.</p>
          </div>
          <div className="salary-grid">
            <div className="sal-points fx">
              <div className="sal-point">
                <span className="sk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7" /><path d="M14 7h7v7" /></svg></span>
                <div><b>You set your number</b><span>Add the salary you want to your profile. Companies can see you have a firm floor before they ever spend a credit.</span></div>
              </div>
              <div className="sal-point">
                <span className="sk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span>
                <div><b>Unlocking means accepting it</b><span>To reveal your details, a company must accept the clause: your stated salary is the minimum they'll offer you. No exceptions.</span></div>
              </div>
              <div className="sal-point">
                <span className="sk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg></span>
                <div><b>No lowball offers, ever</b><span>No more sitting through interviews only to be offered less than you asked. The floor is agreed before the first message.</span></div>
              </div>
              <div className="sal-point">
                <span className="sk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></span>
                <div><b>You only negotiate up</b><span>Your number is the starting point, not the ceiling. Every conversation begins at your floor — or above it.</span></div>
              </div>
            </div>
            <div className="clause-modal fx">
              <div className="clm-head">
                <span className="clm-lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0" /></svg></span>
                <div>
                  <div className="clm-eyebrow">Unlocking profile</div>
                  <div className="clm-title">Unlock this candidate?</div>
                </div>
                <span className="clm-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>
              </div>
              <p className="clm-sub">You'll reveal the full name, contact info, and profile details.</p>
              <div className="clm-rows">
                <div className="clm-row"><span>Candidate</span><b>UX/UI Designer</b></div>
                <div className="clm-row"><span>Price</span><span className="gold">1 Credit</span></div>
                <div className="clm-row"><span>Balance after</span><b>124 Credits</b></div>
              </div>
              <div className="clm-clause">
                <span className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg></span>
                <p>By unlocking, I accept the salary clause: <b>the salary stated by the candidate is the minimum salary that will be offered to them.</b></p>
              </div>
              <div className="clm-btns">
                <button className="clm-confirm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0" /></svg>Confirm unlock</button>
                <button className="clm-cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== AFTER THE UNLOCK ===================== */}
      <section className="section after-sec" id="after">
        <div className="wrap">
          <div className="sec-head center fx">
            <span className="eyebrow" style={{ color: 'var(--lp-gold-2)' }}>After the unlock</span>
            <h2>You're always in the loop — and in control</h2>
          </div>
          <div className="after-grid">
            <div className="after-left fx">
              <p className="after-intro">The moment a company unlocks your profile, everything becomes transparent. You see who they are, and you get to hold them accountable.</p>
              <div className="after-card">
                <div className="after-card-head">
                  <span className="after-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></span>
                  <h3>Know the instant you're unlocked</h3>
                </div>
                <p>No more black holes. When a company unlocks you, you're notified right away — with the role and the exact salary floor they just committed to.</p>
                <div className="mock-notif">
                  <span className="mn-av">M</span>
                  <div>
                    <div className="mn-t"><span className="pip" />Meridian unlocked your profile</div>
                    <div className="mn-d">Senior Product Designer · <span className="mn-floor">€4,500 / month</span></div>
                  </div>
                </div>
              </div>
              <div className="after-card">
                <div className="after-card-head">
                  <span className="after-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></span>
                  <h3>Rate them back — anonymously</h3>
                </div>
                <p>After they reach out, score their hiring process, communication, culture and benefits. Then the question that carries real weight:</p>
                <div className="after-pt">
                  <span className="ap-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg></span>
                  <div><b>The salary rule has teeth</b><span>Was the minimum from your profile honored? If not, the overall rating is capped at 3 — no matter how perfect everything else was.</span></div>
                </div>
                <div className="after-pt">
                  <span className="ap-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span>
                  <div><b>Completely anonymous</b><span>Companies see the score and comment, never who left it.<br />Rate honestly, with zero risk to you.</span></div>
                </div>
              </div>
            </div>

            <div className="rate-modal fx">
              <div className="rm-head">
                <span className="rm-av">M</span>
                <div><div className="rm-title">Rate · Meridian</div><div className="rm-sub">Health Tech · Belgrade · Product Designer</div></div>
                <span className="rm-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>
              </div>

              {RATE_CATEGORIES.map((cat) => (
                <div className="rm-cat" key={cat.key}>
                  <div className="rm-cat-l"><b>{cat.label}</b><span>{cat.hint}</span></div>
                  <div className="rm-stars">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`rm-star${v <= ratings[cat.key] ? ' on' : ''}`}
                        aria-label={`${v} star${v > 1 ? 's' : ''}`}
                        onClick={() => setRatings((prev) => ({ ...prev, [cat.key]: v }))}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" /></svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rm-salary">
                <div className="rs-q"><b>Was the minimum salary from your profile honored?</b><span>If not, the overall rating cannot exceed 3.</span></div>
                <div className="rm-ynwrap">
                  <button type="button" className={`rm-ynb${honored === 'yes' ? ' sel-yes' : ''}`} onClick={() => setHonored('yes')}>Yes</button>
                  <button type="button" className={`rm-ynb${honored === 'no' ? ' sel-no' : ''}`} onClick={() => setHonored('no')}>No</button>
                </div>
              </div>

              <div className="rm-overall">
                Overall rating: <b>{overall ?? '—'}</b>
                {overall && <span className="rm-overall-stars">{renderPartialStars(overallValue)}</span>}
                {capped && <span className="rm-cap">Capped at 3 · minimum not honored</span>}
              </div>

              <label className="rm-clab" htmlFor="rmComment">Your comment</label>
              <textarea className="rm-comment" id="rmComment" placeholder="What was the process, communication, culture like…" />

              <div className="rm-rec">
                <button type="button" className={`rm-recb${rec === 'up' ? ' sel-up' : ''}`} onClick={() => setRec('up')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11M2 13v6a2 2 0 0 0 2 2h13.5a2 2 0 0 0 2-1.7l1.1-7A2 2 0 0 0 19.6 10H14V5a2 2 0 0 0-2-2l-3 7" /></svg>
                  Recommend
                </button>
                <button type="button" className={`rm-recb${rec === 'down' ? ' sel-down' : ''}`} onClick={() => setRec('down')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V3M22 11V5a2 2 0 0 0-2-2H6.5a2 2 0 0 0-2 1.7l-1.1 7A2 2 0 0 0 5.4 14H11v5a2 2 0 0 0 2 2l3-7" /></svg>
                  Don't recommend
                </button>
              </div>
              <p className="rm-note">Optional — you can leave it neutral.</p>

              <div className="rm-foot">
                <div className="rm-anon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Your review is submitted anonymously</div>
                <button type="button" className="rm-cancel">Cancel</button>
                <button type="button" className="rm-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Save rating</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== COMPANIES ===================== */}
      <section className="section companies-sec" id="companies">
        <div className="wrap">
          <div className="sec-head center fx">
            <span className="eyebrow">Companies on Talentmon</span>
            <h2>Vet every company before they vet you</h2>
            <p>Every employer sourcing here has an open profile — ratings, reviews, and whether they actually pay what they promise. It's always available to you, so you never walk in blind.</p>
          </div>
          <div className="co-grid">
            <div className="sal-points fx">
              <div className="sal-point">
                <span className="sk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg></span>
                <div><b>Browse the whole directory</b><span>See every company sourcing on the platform, searchable by name, location, industry, size and rating.</span></div>
              </div>
              <div className="sal-point">
                <span className="sk"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" /></svg></span>
                <div><b>Ratings &amp; reviews up front</b><span>Read what other candidates said about a company's hiring process and culture before anyone ever contacts you.</span></div>
              </div>
              <div className="sal-point">
                <span className="sk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg></span>
                <div><b>Minimum-wage accountability</b><span>Reviews flag whether a company respected the salary they agreed to — so your floor stays a promise, not just words.</span></div>
              </div>
              <div className="sal-point">
                <span className="sk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 4.24A9.4 9.4 0 0 1 12 4c7 0 10 8 10 8a13.3 13.3 0 0 1-1.9 2.94M6.5 6.5A13.4 13.4 0 0 0 2 12s3 8 10 8a9.5 9.5 0 0 0 5-1.4" /><path d="M2 2l20 20" /></svg></span>
                <div><b>Your employer can't see you</b><span>They're in the list too — but the one company you work for is the only one that can never discover you.</span></div>
              </div>
            </div>

            <div className="co-dir fx">
              <div className="co-bar">
                <div className="co-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>Search companies by name…</div>
                <div className="co-filter">Any rating<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></div>
                <div className="co-count">8 of 8</div>
              </div>
              <div className="co-cards">
                <div className="co-card you">
                  <span className="coc-badge">YOUR EMPLOYER</span>
                  <span className="coc-av" style={{ background: 'linear-gradient(140deg,#3f597a,#1f3550)' }}>N</span>
                  <div className="coc-name">Nordwave</div>
                  <div className="coc-meta">Software · Belgrade</div>
                  <div className="coc-pills"><span className="coc-pill">51–200 employees</span><span className="coc-pill"><span className="st">★</span>4.6</span></div>
                  <div className="coc-honor">Candidate salary: honored 88%</div>
                  <div className="coc-lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Can't see you</div>
                </div>
                <div className="co-card">
                  <span className="coc-av" style={{ background: 'linear-gradient(140deg,#e0a63f,#c98a1f)' }}>A</span>
                  <div className="coc-name">Atlas &amp; Co</div>
                  <div className="coc-meta">Consulting · Novi Sad</div>
                  <div className="coc-pills"><span className="coc-pill">1–50 employees</span><span className="coc-pill"><span className="st">★</span>4.2</span></div>
                  <div className="coc-honor">Candidate salary: honored 96%</div>
                  <div className="coc-hiring"><span className="gd" />Actively hiring</div>
                </div>
                <div className="co-card">
                  <span className="coc-av" style={{ background: 'linear-gradient(140deg,#a24b4b,#7d3535)' }}>Q</span>
                  <div className="coc-name">Quantum</div>
                  <div className="coc-meta">AI / ML · Remote</div>
                  <div className="coc-pills"><span className="coc-pill">201–1000 employees</span><span className="coc-pill"><span className="st">★</span>4.4</span></div>
                  <div className="coc-honor">Candidate salary: honored 97%</div>
                  <div className="coc-hiring"><span className="gd" />Actively hiring</div>
                </div>
                <div className="co-card">
                  <span className="coc-av" style={{ background: 'linear-gradient(140deg,#4f7d9e,#33566f)' }}>M</span>
                  <div className="coc-name">Meridian</div>
                  <div className="coc-meta">Health Tech · Belgrade</div>
                  <div className="coc-pills"><span className="coc-pill">201–1000 employees</span><span className="coc-pill"><span className="st">★</span>4.1</span></div>
                  <div className="coc-honor">Candidate salary: honored 93%</div>
                  <div className="coc-hiring"><span className="gd" />Actively hiring</div>
                </div>
              </div>
            </div>
          </div>

          <div className="co-rep fx">
            <div className="rep-head">
              <span className="rep-av" style={{ background: 'linear-gradient(140deg,#e0a63f,#c98a1f)' }}>A</span>
              <div><div className="rep-name">Atlas &amp; Co</div><div className="rep-meta">Consulting · Novi Sad · Reputation</div></div>
              <div className="rep-rating">
                <div className="rep-stars">{renderPartialStars(4.2)}</div>
                <div><span className="rep-score">4.2</span> <span className="rep-rc">52 reviews</span></div>
              </div>
            </div>
            <div className="rep-tags">
              <span className="rep-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>On-site</span>
            </div>
            <div className="rep-stats">
              <div className="rep-stat"><span className="n g">4.2</span><span className="l">Average rating</span></div>
              <div className="rep-stat"><span className="n">52</span><span className="l">Reviews</span></div>
              <div className="rep-stat"><span className="n gr">34</span><span className="l">Hires</span></div>
              <div className="rep-stat"><span className="n g">87%</span><span className="l">Recommends</span></div>
              <div className="rep-stat"><span className="n gr">96%</span><span className="l">Profile salary</span></div>
            </div>
            <div className="rep-more"><a href="#">See all reviews</a></div>
            <div className="rep-reviews">
              <div className="rev-card">
                <div className="rev-top">
                  <div><div className="rev-role">Business Analyst</div><div className="rev-dept">Consulting</div></div>
                  <div className="rev-r">
                    <div className="rev-score">3.8</div>
                    <div className="rev-r-stars">{renderPartialStars(3.8)}</div>
                  </div>
                </div>
                <div className="rev-cats">
                  <div className="rev-cat"><div className="rev-cat-l">Hiring process</div><div className="ms"><span className="on">★★★★</span><span className="off">★</span></div></div>
                  <div className="rev-cat"><div className="rev-cat-l">Communication</div><div className="ms"><span className="on">★★★★</span><span className="off">★</span></div></div>
                  <div className="rev-cat"><div className="rev-cat-l">Work culture</div><div className="ms"><span className="on">★★★★</span><span className="off">★</span></div></div>
                  <div className="rev-cat"><div className="rev-cat-l">Benefits</div><div className="ms"><span className="on">★★★</span><span className="off">★★</span></div></div>
                </div>
                <div className="rev-text">Fast learning and work on diverse projects, but occasionally an intense pace.</div>
                <div className="rev-wage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Minimum salary from profile: honored</div>
                <div className="rev-bottom">
                  <div className="rev-date">03.07.2025</div>
                  <span className="rev-rec"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11M2 13v6a2 2 0 0 0 2 2h13.5a2 2 0 0 0 2-1.7l1.1-7A2 2 0 0 0 19.6 10H14V5a2 2 0 0 0-2-2l-3 7" /></svg>Recommend</span>
                </div>
              </div>
              <div className="rev-card">
                <div className="rev-top">
                  <div><div className="rev-role">Junior Consultant</div><div className="rev-dept">Consulting</div></div>
                  <div className="rev-r">
                    <div className="rev-score">4.5</div>
                    <div className="rev-r-stars">{renderPartialStars(4.5)}</div>
                  </div>
                </div>
                <div className="rev-cats">
                  <div className="rev-cat"><div className="rev-cat-l">Hiring process</div><div className="ms"><span className="on">★★★★</span><span className="off">★</span></div></div>
                  <div className="rev-cat"><div className="rev-cat-l">Communication</div><div className="ms"><span className="on">★★★★★</span></div></div>
                  <div className="rev-cat"><div className="rev-cat-l">Work culture</div><div className="ms"><span className="on">★★★★★</span></div></div>
                  <div className="rev-cat"><div className="rev-cat-l">Benefits</div><div className="ms"><span className="on">★★★★</span><span className="off">★</span></div></div>
                </div>
                <div className="rev-text">Great mentorship relationship with senior colleagues, I felt real progress within a few months.</div>
                <div className="rev-wage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Minimum salary from profile: honored</div>
                <div className="rev-bottom">
                  <div className="rev-date">19.05.2025</div>
                  <span className="rev-rec"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11M2 13v6a2 2 0 0 0 2 2h13.5a2 2 0 0 0 2-1.7l1.1-7A2 2 0 0 0 19.6 10H14V5a2 2 0 0 0-2-2l-3 7" /></svg>Recommend</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== WHAT YOU GET ===================== */}
      <section className="section" id="get">
        <div className="wrap">
          <div className="sec-head center fx">
            <span className="eyebrow">What you get</span>
            <h2>Built around you — and your privacy</h2>
            <p>Everything works in your favor: you stay in control of who sees you, when, and on what terms.</p>
          </div>
          <div className="bgrid">
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3M9 3h6M8 12h8M8 16h5" /></svg></span>
              <h3>Free profile &amp; instant CV</h3>
              <p>Join free, fill one profile, and get a standardized PDF CV you can use anywhere.</p>
            </div>
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></svg></span>
              <h3>You control visibility</h3>
              <p>Flip between actively looking, open to offers, or invisible — anytime, in one click.</p>
            </div>
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span>
              <h3>Hidden from your employer</h3>
              <p>Name your current company and we make sure their recruiters never see you while you search.</p>
            </div>
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7" /><path d="M14 7h7v7" /></svg></span>
              <h3>Your salary sets the floor</h3>
              <p>Set your number once — any company that unlocks you accepts it as the minimum they can offer, so you only negotiate up.</p>
            </div>
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></span>
              <h3>Instant unlock alerts</h3>
              <p>The moment a company spends a credit on you, you're notified — with the role and the salary floor they just committed to.</p>
            </div>
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></span>
              <h3>Rate every company</h3>
              <p>Score the companies that reach you on whether they honored your minimum. Public ratings keep employers honest for everyone.</p>
            </div>
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg></span>
              <h3>Anonymous by default</h3>
              <p>Companies browse your skills and experience, but your identity unlocks only when they spend a credit.</p>
            </div>
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7" /></svg></span>
              <h3>See your impact</h3>
              <p>Track how often you're viewed, unlocked and shortlisted — your details stay hidden until someone pays to reach you.</p>
            </div>
            <div className="benefit fx">
              <span className="bi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg></span>
              <h3>No spam, no job boards</h3>
              <p>No mass applying, no feed to perform on. Only companies who unlocked you can message you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="cta">
        <div className="wrap cta-in">
          <h2>Ready to be discovered?</h2>
          <p className="cta-desc">Create your free profile in minutes, name your salary, set your visibility, and let the right companies come to you.</p>
          <a href="/login?tab=candidate&mode=signup" className="btn btn-gold btn-lg">
            Create your free profile
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <p className="cta-fine">Free forever · No credit card · Your salary sets the floor</p>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a href="/landing-page" className="brand">
                <span className="mark">
                  <img src="/assets/images/talentmon.png" alt="Talentmon" />
                </span>
                <span>Talent<b>mon</b></span>
              </a>
              <p className="foot-tag">Build one profile and let pre-screened companies reach you — on your terms, with your privacy intact.</p>
            </div>
            <div className="foot-col">
              <h4>Candidates</h4>
              <a href="#how">How it works</a>
              <a href="#salary">Salary clause</a>
              <a href="#cv">Your CV</a>
              <a href="#companies">Companies</a>
              <a href="#get">What you get</a>
              <a href="/login?tab=candidate">Create profile</a>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <a href="/landing-page">For companies</a>
              <a href="#">About</a>
              <a href="#">Privacy</a>
              <a href="#">Contact</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Talentmon</span>
            <span>Made for people who'd rather be found than apply.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ForCandidates;
