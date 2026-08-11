import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import CandidateHeader from 'components/ui/CandidateHeader';
import Icon from 'components/AppIcon';
import { loadProfile } from './profileStore';
import { createInitialState, initials, fmtNum, srPlural, DEFAULT_PHONE_CODE } from './edit/data';
import {
  candidateToBasics,
  DEDICATED_LIST_RESOURCES,
  mergeCustomSections,
  preferencesToFrontend,
  statusToBackend,
  updateMyCandidate,
} from './candidateApi';
import { useCurrentUser } from '../../../lib/CurrentUserContext';
import { useMyCandidateProfile } from '../../../hooks/useMyCandidateProfile';
import './styles.scss';

const STATUS_OPTIONS = [
  { key: 'active', tone: 'green', title: 'Actively looking', desc: 'Open to all companies' },
  { key: 'open', tone: 'amber', title: 'Open to offers', desc: 'Employed, but listening' },
  { key: 'off', tone: 'grey', title: 'Not interested', desc: 'Hidden from search' },
];

const hasText = (html) => /\S/.test((html || '').replace(/<[^>]*>/g, ''));

const prefsRows = (d) => {
  const salary = d.salaryAmount ? `${fmtNum(d.salaryAmount)} ${d.salaryCurrency || ''} / ${d.salaryPeriod || ''}` : '';
  const notice = d.noticeNum ? `${d.noticeNum} ${srPlural(d.noticeNum, d.noticeUnit || '')}` : '';
  return [
    ['Work mode', d.mode],
    ['Type', d.type],
    ['Expected salary (net)', salary],
    ['Availability', notice],
  ].filter((r) => r[1]);
};

// Sizes every chip to the width of the widest one (measured, not fixed), so short
// interests don't stretch to fill a grid column but the row still stays aligned.
const InterestGrid = ({ entries }) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chips = Array.from(el.querySelectorAll('.interest-chip'));
    chips.forEach((c) => {
      c.style.width = 'auto';
    });
    let max = 0;
    chips.forEach((c) => {
      max = Math.max(max, c.getBoundingClientRect().width);
    });
    chips.forEach((c) => {
      c.style.width = max ? `${Math.ceil(max)}px` : '';
    });
  });

  return (
    <div className="interest-grid" ref={ref}>
      {entries.map((e) => (
        <div className="interest-chip" key={e.id}>
          {e.icon && (
            <span className="ic">
              <Icon name={e.icon} size={18} />
            </span>
          )}
          <div className="interest-chip-text">
            {e.name && <div className="interest-chip-name">{e.name}</div>}
            {hasText(e.desc) && <p className="interest-chip-desc rich" dangerouslySetInnerHTML={{ __html: e.desc }} />}
          </div>
        </div>
      ))}
    </div>
  );
};

const CandidateProfile = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { candidate } = useMyCandidateProfile();
  const [profile, setProfile] = useState(() => loadProfile() || createInitialState());
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState(profile.basics.status || 'open');
  const [currentEmployer, setCurrentEmployer] = useState(profile.basics.currentEmployer || '');

  // Merge real basics + links + experience + education from the backend once
  // loaded — other sections stay local/mock until their own wiring step.
  useEffect(() => {
    if (!candidate) return;
    const realBasics = candidateToBasics(candidate, user?.email);
    const backendCustomSections = candidate.customSections || [];
    const backendPreferences = preferencesToFrontend(candidate.preferences);
    const listEntriesByType = {};
    for (const { type, candidateField, toFrontend } of DEDICATED_LIST_RESOURCES) {
      listEntriesByType[type] = (candidate[candidateField] || []).map(toFrontend);
    }
    setProfile((prev) => ({
      ...prev,
      basics: { ...prev.basics, ...realBasics, photo: prev.basics.photo || realBasics.photo },
      sections: mergeCustomSections(prev.sections, backendCustomSections).map((sec) => {
        if (listEntriesByType[sec.type]) return { ...sec, entries: listEntriesByType[sec.type] };
        if (sec.type === 'preferences' && backendPreferences) return { ...sec, data: { ...sec.data, ...backendPreferences } };
        return sec;
      }),
    }));
    setStatus(realBasics.status);
    setCurrentEmployer(realBasics.currentEmployer);
  }, [candidate, user?.email]);

  const handleStatusChange = (key) => {
    const previous = status;
    setStatus(key);
    updateMyCandidate({ status: statusToBackend(key) }).catch(() => setStatus(previous));
  };

  const handleCurrentEmployerBlur = (e) => {
    const value = e.target.value;
    if (value === (profile.basics.currentEmployer || '')) return;
    updateMyCandidate({ currentEmployerName: value }).catch(() => {});
  };

  const { basics } = profile;

  const roleLine = [basics.role, basics.years && `${basics.years} years`].filter(Boolean).join(' · ');
  const userInitials = initials(basics.name);

  return (
    <div className="cp-page">
      <Helmet>
        <title>My profile · Talentmon</title>
      </Helmet>

      <CandidateHeader />

      <main className="page">
        <div className="wrap">
          <div className="greet">
            <h1>Your profile</h1>
            <p>This is your CV. Keep it sharp — it&apos;s the only thing companies see.</p>
          </div>

          {/* TOOLBAR */}
          <div className="toolbar">
            <button type="button" className="btn btn-ghost" onClick={() => setPreview((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
              <span className="lbl">{preview ? 'Back to my view' : 'Preview as a company sees it'}</span>
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/candidate-profile/edit')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              Edit profile
            </button>
            <span className="spacer" />
            <span className="hint">
              {preview ? 'Showing the anonymous view companies get before unlocking' : "You're viewing your full profile"}
            </span>
          </div>

          {/* DASH */}
          <div className="dash">
            {/* ===== CV DOCUMENT ===== */}
            <article className={`card cv${preview ? ' company-view' : ''}`} id="cv">
              <div className="cv-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                <span>This is the anonymous view. Your <b>name, photo, contact and current employer</b> stay hidden until a company spends a credit to unlock you.</span>
              </div>

              <div className="cv-head">
                {(!basics.photoHidden || preview) && (
                  <div className="cv-photo">
                    {basics.photo ? <img alt="" src={basics.photo} /> : <span className="mono">{userInitials}</span>}
                    <span className="lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span>
                  </div>
                )}
                <div className="cv-id">
                  <div className="cv-name"><span className="real">{basics.name || 'No name'}</span><span className="anon">Candidate · TC-7741</span></div>
                  <div className="cv-role">{roleLine}</div>
                  <div className="cv-loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg><span>{basics.location}</span></div>
                  <span className="cv-lockpill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Name &amp; contact unlock for 1 credit</span>
                </div>
              </div>
              {(basics.email || basics.phone || basics.linkedin || (basics.links || []).some((lk) => lk.url || lk.label)) && (
                <div className="cv-contact-strip">
                  {basics.email && (
                    <span className="cv-c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg><span className="priv">{basics.email}</span></span>
                  )}
                  {basics.phone && (
                    <span className="cv-c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.6 3 .2 2 .7 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" /></svg><span className="priv">{[basics.phoneCode || DEFAULT_PHONE_CODE, basics.phone].filter(Boolean).join(' ')}</span></span>
                  )}
                  {basics.linkedin && (
                    <span className="cv-c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="3" /><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4" strokeLinecap="round" /></svg><span className="priv">{basics.linkedin}</span></span>
                  )}
                  {(basics.links || []).filter((lk) => lk.url || lk.label).map((lk) => (
                    <span className="cv-c" key={lk.id}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                      <span className="priv">
                        {lk.url ? (
                          <a href={lk.url} target="_blank" rel="noopener noreferrer">
                            {lk.label || lk.url}
                          </a>
                        ) : (
                          lk.label
                        )}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {profile.sections.map((sec) => {
                if (sec.kind === 'text') {
                  if (!hasText(sec.text)) return null;
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <div className="cv-about rich" dangerouslySetInnerHTML={{ __html: sec.text }} />
                    </section>
                  );
                }

                if (sec.kind === 'prefs') {
                  const rows = prefsRows(sec.data);
                  if (!rows.length) return null;
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <div className="prefs">
                        {rows.map((r) => (
                          <div className="pref" key={r[0]}>
                            <span className="pl">{r[0]}</span>
                            <span className="pv">{r[1]}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                const vis = sec.entries.filter((e) => e.visible);
                if (!vis.length) return null;

                if (sec.kind === 'skill') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <div className="skills">
                        {vis.map((e) => (
                          <span className="tag" key={e.id}>{e.name}</span>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (sec.kind === 'lang') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <div className="langs">
                        {vis.map((e) => (
                          <div className="lang" key={e.id}>
                            <span className="ln">{e.name}</span>
                            <span className="lvwrap">
                              <span className="lv">{e.level || ''}</span>
                              {e.note && (
                                <span className="lnote"><span className="dot">·</span>{e.note}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (sec.schema === 'education') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      {vis.map((e) => (
                        <div className="edu" key={e.id}>
                          <div>
                            <div className="edu-name">{e.degree || ''}</div>
                            <div className="edu-sub">{[e.school, e.location].filter(Boolean).join(' · ')}</div>
                            {hasText(e.desc) && <div className="edu-desc rich" dangerouslySetInnerHTML={{ __html: e.desc }} />}
                          </div>
                          <div className="edu-date">{[e.start, e.end].filter(Boolean).join(' — ')}</div>
                        </div>
                      ))}
                    </section>
                  );
                }

                if (sec.schema === 'certificates') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <div className="certs">
                        {vis.map((e) => {
                          const metaParts = [
                            e.issuer,
                            e.issueDate && `Issued ${e.issueDate}`,
                            e.doesNotExpire ? 'No expiration' : (e.expirationDate && `Expires ${e.expirationDate}`),
                          ].filter(Boolean);
                          const linkIcon = (
                            <a
                              href={e.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cert-link-ic"
                              aria-label="Has credential link"
                              title="View credential"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <path d="M15 3h6v6" />
                                <path d="M10 14 21 3" />
                              </svg>
                            </a>
                          );
                          return (
                            <div className="cert" key={e.id}>
                              <span className="ci">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="8" r="6" />
                                  <path d="M9 8.2 11 10.2 15 6.2" />
                                  <path d="M8.3 13.5 7 21l5-3 5 3-1.3-7.5" />
                                </svg>
                              </span>
                              <div className="cert-body">
                                <div className="cert-row">
                                  <b>{e.credentialUrl ? <a href={e.credentialUrl} target="_blank" rel="noopener noreferrer">{e.name}</a> : e.name}</b>
                                  {metaParts.map((part, i) => (
                                    <span key={i}><span className="dot">·</span>{part}</span>
                                  ))}
                                  {!e.credentialId && e.credentialUrl && linkIcon}
                                </div>
                                {e.credentialId && (
                                  <div className="cert-row cert-id-row">
                                    <span>ID: {e.credentialId}</span>
                                    {e.credentialUrl && linkIcon}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                if (sec.schema === 'interests') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <InterestGrid entries={vis} />
                    </section>
                  );
                }

                if (sec.schema === 'projects') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      {vis.map((e) => (
                        <div className="xp" key={e.id}>
                          <div className="xp-role">{e.name}</div>
                          <div className="xp-date">{[e.start, e.currentlyWorking ? 'Present' : e.end].filter(Boolean).join(' — ')}</div>
                          {e.role && <div className="xp-co">{e.role}</div>}
                          {hasText(e.desc) && <p className="xp-desc rich" dangerouslySetInnerHTML={{ __html: e.desc }} />}
                          {hasText(e.challenge) && (
                            <p className="xp-desc"><b>Challenge: </b><span dangerouslySetInnerHTML={{ __html: e.challenge }} /></p>
                          )}
                          {hasText(e.solution) && (
                            <p className="xp-desc"><b>Solution: </b><span dangerouslySetInnerHTML={{ __html: e.solution }} /></p>
                          )}
                          {hasText(e.impact) && (
                            <p className="xp-desc"><b>Impact: </b><span dangerouslySetInnerHTML={{ __html: e.impact }} /></p>
                          )}
                          {e.technologies && e.technologies.length > 0 && (
                            <div className="xp-tags">
                              {e.technologies.map((t) => (
                                <span className="tag" key={`t-${t}`}>{t}</span>
                              ))}
                            </div>
                          )}
                          {e.skills && e.skills.length > 0 && (
                            <div className="xp-tags">
                              {e.skills.map((t) => (
                                <span className="tag" key={`s-${t}`}>{t}</span>
                              ))}
                            </div>
                          )}
                          {e.githubUrl && (
                            <a
                              href={e.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cert-link-ic"
                              aria-label="GitHub repository"
                              title="View on GitHub"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <path d="M15 3h6v6" />
                                <path d="M10 14 21 3" />
                              </svg>
                            </a>
                          )}
                        </div>
                      ))}
                    </section>
                  );
                }

                if (sec.schema === 'courses') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <div className="certs">
                        {vis.map((e) => {
                          const metaParts = [
                            e.provider,
                            e.category,
                            e.completionDate && `Completed ${e.completionDate}`,
                            e.durationHours && `${e.durationHours}h`,
                            e.certificateId && `ID: ${e.certificateId}`,
                          ].filter(Boolean);
                          const linkIcon = e.certificateUrl && (
                            <a
                              href={e.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cert-link-ic"
                              aria-label="Has certificate link"
                              title="View certificate"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <path d="M15 3h6v6" />
                                <path d="M10 14 21 3" />
                              </svg>
                            </a>
                          );
                          return (
                            <div className="cert" key={e.id}>
                              <span className="ci">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 19V6a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z" />
                                  <path d="M8 8h8M8 12h6" />
                                </svg>
                              </span>
                              <div className="cert-body">
                                <div className="cert-row">
                                  <b>{e.certificateUrl ? <a href={e.certificateUrl} target="_blank" rel="noopener noreferrer">{e.name}</a> : e.name}</b>
                                  {metaParts.map((part, i) => (
                                    <span key={i}><span className="dot">·</span>{part}</span>
                                  ))}
                                  {hasText(e.desc) && (
                                    <span>
                                      <span className="dot">·</span>
                                      <span dangerouslySetInnerHTML={{ __html: e.desc }} />
                                    </span>
                                  )}
                                  {linkIcon}
                                </div>
                                {e.skills && e.skills.length > 0 && (
                                  <div className="cert-row cert-id-row">
                                    <span>Skills: {e.skills.join(' · ')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                if (sec.schema === 'awards') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <div className="certs">
                        {vis.map((e) => {
                          const metaParts = [e.organization, e.level, e.date].filter(Boolean);
                          return (
                            <div className="cert" key={e.id}>
                              <span className="ci">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="9" r="6" />
                                  <path d="M9 14.5 7.5 22 12 19l4.5 3L15 14.5" />
                                </svg>
                              </span>
                              <div className="cert-body">
                                <div className="cert-row">
                                  <b>{e.link ? <a href={e.link} target="_blank" rel="noopener noreferrer">{e.name}</a> : e.name}</b>
                                  {metaParts.map((part, i) => (
                                    <span key={i}><span className="dot">·</span>{part}</span>
                                  ))}
                                </div>
                                {hasText(e.desc) && (
                                  <div className="cert-row cert-id-row">
                                    <p className="rich" dangerouslySetInnerHTML={{ __html: e.desc }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                if (sec.schema === 'organisations') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      {vis.map((e) => (
                        <div className="xp" key={e.id}>
                          <div className="xp-role">{e.name}</div>
                          <div className="xp-date">{[e.start, e.currentlyActive ? 'Present' : e.end].filter(Boolean).join(' — ')}</div>
                          {(e.role || e.type) && <div className="xp-co">{[e.role, e.type].filter(Boolean).join(' · ')}</div>}
                          {hasText(e.desc) && <p className="xp-desc rich" dangerouslySetInnerHTML={{ __html: e.desc }} />}
                          {hasText(e.achievements) && <p className="xp-desc rich" dangerouslySetInnerHTML={{ __html: e.achievements }} />}
                        </div>
                      ))}
                    </section>
                  );
                }

                if (sec.schema === 'publications') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      {vis.map((e) => (
                        <div className="xp" key={e.id}>
                          <div className="xp-role">{e.title}</div>
                          <div className="xp-date">{e.date || ''}</div>
                          {(e.type || e.publisher) && <div className="xp-co">{[e.type, e.publisher].filter(Boolean).join(' · ')}</div>}
                          {hasText(e.desc) && <p className="xp-desc rich" dangerouslySetInnerHTML={{ __html: e.desc }} />}
                          {(e.doi || e.url) && (
                            <div className="cert-row cert-id-row">
                              {e.doi && <span>DOI: {e.doi}</span>}
                              {e.url && (
                                <a
                                  href={e.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cert-link-ic"
                                  aria-label="Has link"
                                  title="View publication"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <path d="M15 3h6v6" />
                                    <path d="M10 14 21 3" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          )}
                          {e.coAuthors && e.coAuthors.length > 0 && (
                            <div className="xp-tags">
                              {e.coAuthors.map((a) => (
                                <span className="tag" key={a}>{a}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </section>
                  );
                }

                if (sec.schema === 'website') {
                  return (
                    <section className="cv-sec" key={sec.id}>
                      {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                      <div className="certs">
                        {vis.map((e) => {
                          const metaParts = [e.type, e.featured && 'Featured'].filter(Boolean);
                          return (
                            <div className="cert" key={e.id}>
                              <span className="ci">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M2 12h20" />
                                  <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
                                </svg>
                              </span>
                              <div className="cert-body">
                                <div className="cert-row">
                                  <b><a href={e.url} target="_blank" rel="noopener noreferrer">{e.name}</a></b>
                                  {metaParts.map((part, i) => (
                                    <span key={i}><span className="dot">·</span>{part}</span>
                                  ))}
                                </div>
                                {hasText(e.desc) && (
                                  <div className="cert-row cert-id-row">
                                    <p className="rich" dangerouslySetInnerHTML={{ __html: e.desc }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                const isExp = sec.schema === 'experience';
                return (
                  <section className="cv-sec" key={sec.id}>
                    {sec.title && <div className="cv-h"><b>{sec.title}</b></div>}
                    {vis.map((e) => {
                      const roleTxt = isExp ? e.role || '' : e.title || '';
                      const coTxt = isExp ? e.company : e.subtitle;
                      return (
                        <div className="xp" key={e.id}>
                          <div className="xp-role">{roleTxt}</div>
                          <div className="xp-date">{[e.start, e.end].filter(Boolean).join(' — ')}</div>
                          {coTxt && (
                            <div className="xp-co">
                              <span className="priv">{coTxt}</span>
                              {e.location ? ` · ${e.location}` : ''}
                            </div>
                          )}
                          {hasText(e.desc) && <p className="xp-desc rich" dangerouslySetInnerHTML={{ __html: e.desc }} />}
                          {e.tags && e.tags.length > 0 && (
                            <div className="xp-tags">
                              {e.tags.map((t) => (
                                <span className="tag" key={t}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </article>

            {/* ===== SIDEBAR ===== */}
            <aside className="side" id="insights">
              {/* STATUS */}
              <div className="card scard">
                <h3>Your status</h3>
                <p className="sub">Control who can find you — and stay invisible to your current employer.</p>
                <div className="status-opts">
                  {STATUS_OPTIONS.map((opt) => (
                    <div
                      key={opt.key}
                      className={`sopt ${opt.tone}`}
                      data-on={status === opt.key ? '1' : '0'}
                      onClick={() => handleStatusChange(opt.key)}
                    >
                      <span className="dot" />
                      <div>
                        <div className="st">{opt.title}</div>
                        <div className="sd">{opt.desc}</div>
                      </div>
                      <span className="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M20 6 9 17l-5-5" /></svg></span>
                    </div>
                  ))}
                </div>
                <div className="cur-co">
                  <label htmlFor="curco">Current employer</label>
                  <input
                    id="curco"
                    type="text"
                    value={currentEmployer}
                    onChange={(e) => setCurrentEmployer(e.target.value)}
                    onBlur={handleCurrentEmployerBlur}
                  />
                  <div className="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Recruiters at {currentEmployer || 'your employer'} will never see your profile while you&apos;re looking.</div>
                </div>
              </div>

              {/* INSIGHTS */}
              <div className="card scard">
                <h3>Your reach</h3>
                <p className="sub">Last 30 days</p>
                <div className="ins-grid">
                  <div className="ins"><span className="n">38</span><span className="l">Views</span></div>
                  <div className="ins"><span className="n">5</span><span className="l">Unlocks</span></div>
                  <div className="ins"><span className="n">12</span><span className="l">Saved</span></div>
                </div>
                <div className="ins-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>You won&apos;t see which companies — privacy works both ways.</div>
              </div>

              {/* STRENGTH */}
              <div className="card scard">
                <h3>Profile strength</h3>
                <div className="str-bar"><i style={{ width: '88%' }} /></div>
                <div className="str-pct">88% complete</div>
                <div className="str-list">
                  <div className="str-item done"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>Photo &amp; basics added</div>
                  <div className="str-item done"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>3 work experiences</div>
                  <div className="str-item done"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>Skills &amp; languages</div>
                  <div className="str-item todo"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg></span>Add a portfolio link<a href="#">Add</a></div>
                  <div className="str-item todo"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg></span>Add 2 more skills<a href="#">Add</a></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateProfile;
