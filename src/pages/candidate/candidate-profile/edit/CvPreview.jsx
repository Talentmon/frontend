import React from 'react';
import Icon from 'components/AppIcon';
import { I, SecIcon } from './icons';
import { initials, fmtNum, srPlural, DEFAULT_PHONE_CODE } from './data';

// Rich-text fields (sec.text / entry.desc) hold HTML produced by the contentEditable
// editor. TODO: sanitize this HTML on the backend (e.g. DOMPurify) before rendering it to anyone else.
const Rich = ({ html, className }) => <div className={className} dangerouslySetInnerHTML={{ __html: html || '' }} />;

const hasText = (html) => /\S/.test((html || '').replace(/<[^>]*>/g, ''));

const prefsRows = (d) => {
  const salary = d.salaryAmount ? `${fmtNum(d.salaryAmount)} ${d.salaryCurrency || ''} / ${d.salaryPeriod || ''}` : '';
  const notice = d.noticeNum ? `${d.noticeNum} ${srPlural(d.noticeNum, d.noticeUnit || '')}` : '';
  return [
    ['Work mode', d.mode],
    ['Type', d.type],
    ['Salary (net)', salary],
    ['Notice period', notice],
  ].filter((p) => p[1]);
};

// Sizes every chip to the width of the widest one (measured, not fixed), so short
// interests don't stretch to fill a grid column but the row still stays aligned.
const InterestGrid = ({ entries }) => {
  const ref = React.useRef(null);

  React.useLayoutEffect(() => {
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
            {hasText(e.desc) && <Rich className="interest-chip-desc rich" html={e.desc} />}
          </div>
        </div>
      ))}
    </div>
  );
};

const CvSec = ({ title, children }) => (
  <section className="cv-sec">
    {title && (
      <div className="cv-h">
        <b>{title}</b>
      </div>
    )}
    {children}
  </section>
);

const CvPreview = ({ state, mode = 'self' }) => {
  const { basics: b, sections } = state;
  const isSelf = mode === 'self';
  const photoHidden = isSelf && !!b.photoHidden;
  const roleLine = [b.role, b.years && `${b.years} years`].filter(Boolean).join(' · ');
  const photoInner = b.photo ? <img className="ph" alt="" src={b.photo} /> : <span className="ph">{initials(b.name)}</span>;

  return (
    <>
      {isSelf ? (
        <>
          <div className="cv-head cv-head-self">
            {!photoHidden && <div className="cv-photo">{photoInner}</div>}
            <div>
              <div className="cv-name">{b.name || 'No name'}</div>
              <div className="cv-role">{roleLine}</div>
              <div className="cv-loc">
                <I name="pin" />
                {b.location || ''}
              </div>
            </div>
          </div>
          {(b.email || b.phone || b.linkedin || (b.links || []).some((l) => l.url || l.label)) && (
            <div className="cv-contact-strip">
              {b.email && (
                <span className="cv-c">
                  <I name="mail" />
                  {b.email}
                </span>
              )}
              {b.phone && (
                <span className="cv-c">
                  <I name="phone" />
                  {[b.phoneCode || DEFAULT_PHONE_CODE, b.phone].filter(Boolean).join(' ')}
                </span>
              )}
              {b.linkedin && (
                <span className="cv-c">
                  <I name="linkedin" />
                  {b.linkedin}
                </span>
              )}
              {(b.links || [])
                .filter((lk) => lk.url || lk.label)
                .map((lk) => (
                  <span className="cv-c" key={lk.id}>
                    <I name="link" />
                    {lk.url ? (
                      <a href={lk.url} target="_blank" rel="noopener noreferrer">
                        {lk.label || lk.url}
                      </a>
                    ) : (
                      lk.label
                    )}
                  </span>
                ))}
            </div>
          )}
        </>
      ) : (
        <div className="cv-head">
          <div className="cv-photo locked">
            {photoInner}
            <span className="lockic">
              <I name="lock" />
            </span>
          </div>
          <div>
            <div className="cv-name">Candidate · TC-7741</div>
            <div className="cv-role">{roleLine}</div>
            <div className="cv-loc">
              <I name="pin" />
              {b.location || ''}
            </div>
            <div className="cv-lockpill">
              <I name="lock" />
              Name and contact unlock for 1 credit
            </div>
          </div>
        </div>
      )}

      {sections.map((sec) => {
        if (sec.kind === 'text') {
          if (!hasText(sec.text)) return null;
          return (
            <CvSec key={sec.id} title={sec.title}>
              <Rich className="cv-about rich" html={sec.text} />
            </CvSec>
          );
        }

        if (sec.kind === 'prefs') {
          const pr = prefsRows(sec.data);
          if (!pr.length) return null;
          return (
            <CvSec key={sec.id} title={sec.title}>
              <div className="prefs">
                {pr.map((p) => (
                  <div className="pref" key={p[0]}>
                    <span className="pl">{p[0]}</span>
                    <span className="pv">{p[1]}</span>
                  </div>
                ))}
              </div>
            </CvSec>
          );
        }

        const vis = sec.entries.filter((e) => e.visible);
        if (!vis.length) return null;

        if (sec.kind === 'skill') {
          return (
            <CvSec key={sec.id} title={sec.title}>
              <div className="skills-wrap">
                {vis.map((e) => (
                  <span className="tag" key={e.id}>
                    {e.name}
                  </span>
                ))}
              </div>
            </CvSec>
          );
        }

        if (sec.kind === 'lang') {
          return (
            <CvSec key={sec.id} title={sec.title}>
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
            </CvSec>
          );
        }

        if (sec.schema === 'education') {
          return (
            <CvSec key={sec.id} title={sec.title}>
              {vis.map((e) => (
                <div className="edu" key={e.id}>
                  <div>
                    <div className="edu-name">{e.degree || ''}</div>
                    <div className="edu-sub">{[e.school, e.location].filter(Boolean).join(' · ')}</div>
                    {hasText(e.desc) && <Rich className="edu-desc rich" html={e.desc} />}
                  </div>
                  <div className="edu-date">{[e.start, e.end].filter(Boolean).join(' — ')}</div>
                </div>
              ))}
            </CvSec>
          );
        }

        if (sec.schema === 'certificates') {
          return (
            <CvSec key={sec.id} title={sec.title}>
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
                        <SecIcon kind="certificates" />
                      </span>
                      <div className="cert-body">
                        <div className="cert-row">
                          <b>
                            {e.credentialUrl ? (
                              <a href={e.credentialUrl} target="_blank" rel="noopener noreferrer">
                                {e.name}
                              </a>
                            ) : (
                              e.name
                            )}
                          </b>
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
            </CvSec>
          );
        }

        if (sec.schema === 'interests') {
          return (
            <CvSec key={sec.id} title={sec.title}>
              <InterestGrid entries={vis} />
            </CvSec>
          );
        }

        if (sec.schema === 'projects') {
          return (
            <CvSec key={sec.id} title={sec.title}>
              {vis.map((e) => (
                <div className="xp" key={e.id}>
                  <div className="xp-role">{e.name}</div>
                  <div className="xp-date">{[e.start, e.currentlyWorking ? 'Present' : e.end].filter(Boolean).join(' — ')}</div>
                  {e.role && <div className="xp-co">{e.role}</div>}
                  {hasText(e.desc) && <Rich className="xp-desc rich" html={e.desc} />}
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
            </CvSec>
          );
        }

        if (sec.schema === 'courses') {
          return (
            <CvSec key={sec.id} title={sec.title}>
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
                        <SecIcon kind="courses" />
                      </span>
                      <div className="cert-body">
                        <div className="cert-row">
                          <b>{e.certificateUrl ? (
                            <a href={e.certificateUrl} target="_blank" rel="noopener noreferrer">{e.name}</a>
                          ) : (
                            e.name
                          )}</b>
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
            </CvSec>
          );
        }

        if (sec.schema === 'awards') {
          return (
            <CvSec key={sec.id} title={sec.title}>
              <div className="certs">
                {vis.map((e) => {
                  const metaParts = [e.organization, e.level, e.date].filter(Boolean);
                  return (
                    <div className="cert" key={e.id}>
                      <span className="ci">
                        <SecIcon kind="awards" />
                      </span>
                      <div className="cert-body">
                        <div className="cert-row">
                          <b>{e.link ? (
                            <a href={e.link} target="_blank" rel="noopener noreferrer">{e.name}</a>
                          ) : (
                            e.name
                          )}</b>
                          {metaParts.map((part, i) => (
                            <span key={i}><span className="dot">·</span>{part}</span>
                          ))}
                        </div>
                        {hasText(e.desc) && (
                          <div className="cert-row cert-id-row">
                            <Rich className="rich" html={e.desc} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CvSec>
          );
        }

        if (sec.schema === 'organisations') {
          return (
            <CvSec key={sec.id} title={sec.title}>
              {vis.map((e) => (
                <div className="xp" key={e.id}>
                  <div className="xp-role">{e.name}</div>
                  <div className="xp-date">{[e.start, e.currentlyActive ? 'Present' : e.end].filter(Boolean).join(' — ')}</div>
                  {(e.role || e.type) && <div className="xp-co">{[e.role, e.type].filter(Boolean).join(' · ')}</div>}
                  {hasText(e.desc) && <Rich className="xp-desc rich" html={e.desc} />}
                  {hasText(e.achievements) && <Rich className="xp-desc rich" html={e.achievements} />}
                </div>
              ))}
            </CvSec>
          );
        }

        if (sec.schema === 'publications') {
          return (
            <CvSec key={sec.id} title={sec.title}>
              {vis.map((e) => (
                <div className="xp" key={e.id}>
                  <div className="xp-role">{e.title}</div>
                  <div className="xp-date">{e.date || ''}</div>
                  {(e.type || e.publisher) && <div className="xp-co">{[e.type, e.publisher].filter(Boolean).join(' · ')}</div>}
                  {hasText(e.desc) && <Rich className="xp-desc rich" html={e.desc} />}
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
            </CvSec>
          );
        }

        if (sec.schema === 'website') {
          return (
            <CvSec key={sec.id} title={sec.title}>
              <div className="certs">
                {vis.map((e) => {
                  const metaParts = [e.type, e.featured && 'Featured'].filter(Boolean);
                  return (
                    <div className="cert" key={e.id}>
                      <span className="ci">
                        <SecIcon kind="web" />
                      </span>
                      <div className="cert-body">
                        <div className="cert-row">
                          <b>
                            <a href={e.url} target="_blank" rel="noopener noreferrer">{e.name}</a>
                          </b>
                          {metaParts.map((part, i) => (
                            <span key={i}><span className="dot">·</span>{part}</span>
                          ))}
                        </div>
                        {hasText(e.desc) && (
                          <div className="cert-row cert-id-row">
                            <Rich className="rich" html={e.desc} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CvSec>
          );
        }

        const isExp = sec.schema === 'experience';
        return (
          <CvSec key={sec.id} title={sec.title}>
            {vis.map((e) => {
              const roleTxt = isExp ? e.role || '' : e.title || '';
              const coTxt = isExp ? e.company : e.subtitle;
              return (
                <div className="xp" key={e.id}>
                  <div className="xp-role">{roleTxt}</div>
                  <div className="xp-date">{[e.start, e.end].filter(Boolean).join(' — ')}</div>
                  <div className="xp-co">
                    {coTxt ? (
                      !isSelf ? (
                        <span className="co redact" aria-hidden="true" />
                      ) : isExp ? (
                        <span className="co">{coTxt}</span>
                      ) : (
                        coTxt
                      )
                    ) : null}
                    {e.location ? ` · ${e.location}` : ''}
                  </div>
                  {hasText(e.desc) && <Rich className="xp-desc rich" html={e.desc} />}
                  {e.tags && e.tags.length > 0 && (
                    <div className="xp-tags">
                      {e.tags.map((t) => (
                        <span className="tag" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CvSec>
        );
      })}
    </>
  );
};

export default CvPreview;
