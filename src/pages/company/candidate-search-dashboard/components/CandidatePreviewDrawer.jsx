import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import {
  mockContactFor,
  educationLabels,
  availabilityLabels,
  jobTypeLabels,
  candidateCode,
  formatSalary
} from '../utils/cvHelpers';
import styles from '../styles/drawer.module.scss';

const CandidatePreviewDrawer = ({
  candidates = [],
  activeId = null,
  onClose = () => {},
  bookmarkedCandidates = [],
  purchasedCandidates = [],
  onBookmark = () => {},
  onUnlock = () => {},
  onPrint = () => {},
  unlockCost = 1,
  // Pages whose results are already full-width (list rows, or grids with no
  // room to spare) pass this to keep the drawer overlay+scrim at every
  // viewport width instead of pushing the page content aside on wide screens.
  forceOverlay = false,
  // Which edge of the viewport the drawer slides in from. purchased-profiles
  // uses 'left' since its results sit to the right of the drawer instead of
  // the left (mirror of the search dashboard's filter+results layout).
  side = 'right',
  // 'default' shows the bookmark/unlock actions (search + bookmarks pages).
  // 'purchased' shows send-email/print actions instead, since every profile
  // shown here is already unlocked — there's nothing left to buy or save.
  variant = 'default',
  // Viewport width (px) above which the host page pushes its content aside
  // instead of overlaying it with the scrim — must match that page's own
  // push breakpoint so the scrim doesn't stay dimmed after the push kicks in.
  pushBreakpoint = 1520
}) => {
  const bodyRef = useRef(null);
  const [displayCandidate, setDisplayCandidate] = useState(null);
  const [isWidePush, setIsWidePush] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= pushBreakpoint
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${pushBreakpoint}px)`);
    const handleChange = (e) => setIsWidePush(e?.matches);
    handleChange(mediaQuery);
    mediaQuery?.addEventListener('change', handleChange);
    return () => mediaQuery?.removeEventListener('change', handleChange);
  }, [pushBreakpoint]);

  const liveIndex = candidates?.findIndex((c) => c?.id === activeId);
  const liveCandidate = liveIndex >= 0 ? candidates?.[liveIndex] : null;
  const isOpen = !!liveCandidate;

  // Keep rendering the last-known candidate while the drawer slides shut so the
  // close transition doesn't flash empty content (the drawer itself always
  // stays mounted — only the `.open` class toggles the transform).
  useEffect(() => {
    if (liveCandidate) setDisplayCandidate(liveCandidate);
  }, [liveCandidate]);

  const candidate = displayCandidate;

  useEffect(() => {
    // The previewed candidate can drop out of the result set (unlocked, or
    // filtered out by search/filters while the drawer is open) — close it
    // automatically rather than showing a stale entry.
    if (activeId !== null && liveIndex === -1) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, liveIndex]);

  useEffect(() => {
    if (bodyRef?.current) bodyRef.current.scrollTop = 0;
  }, [activeId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e?.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Purchased profiles already carry real contact details — only fall back
  // to the deterministic mock contact for pages that don't have them yet.
  const mockContact = useMemo(() => mockContactFor(candidate), [candidate?.id]);
  const contact = {
    email: candidate?.email || mockContact?.email,
    phone: candidate?.phone || mockContact?.phone,
    linkedin: candidate?.linkedin || mockContact?.linkedin
  };

  const isRevealed = !!candidate && purchasedCandidates?.includes(candidate?.id);
  const isBookmarked = !!candidate && bookmarkedCandidates?.includes(candidate?.id);

  if (!candidate) return null;

  const currentYear = new Date()?.getFullYear();
  const startYear = currentYear - (candidate?.experience || 0);
  // Purchased profiles already carry a formatted work arrangement/notice
  // string (workArrangement/notice) instead of the search dashboard's raw
  // jobType/availability codes — prefer those when present.
  const workMode = candidate?.workArrangement
    || (candidate?.jobType?.includes('remote') ? 'Remote' : 'On-site');
  const workType = candidate?.jobType
    ?.map((t) => jobTypeLabels?.[t])
    ?.find(Boolean) || 'Full-time';
  const availabilityLabel = candidate?.availability
    ? (availabilityLabels?.[candidate?.availability] || candidate?.availability)
    : candidate?.notice;
  const isEducationObject = candidate?.education && typeof candidate?.education === 'object';

  return (
    <>
      <div
        className={`${styles.scrim} ${isOpen ? styles.show : ''} ${forceOverlay ? styles.forceOverlay : ''} ${isWidePush ? styles.pushed : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ''} ${isRevealed ? styles.revealed : ''} ${forceOverlay ? styles.forceOverlay : ''} ${side === 'left' ? styles.left : ''}`}
        aria-label="Candidate preview"
        aria-hidden={!isOpen}
      >
        {variant !== 'purchased' && (
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icon name="X" size={18} />
          </button>
        )}

        <div className={`${styles.body} ${variant === 'purchased' ? styles.noCornerClose : ''}`} ref={bodyRef}>
          <div className={styles.paper}>
            <div className={styles.banner}>
              <Icon name="Lock" size={15} />
              <span>The candidate's <b>name, photo, contact info, and employers</b> stay hidden until you unlock them.</span>
            </div>

            <div className={styles.identity}>
              <div className={styles.photo}>
                <Image src={candidate?.avatar} alt="" className={styles.photoImg} />
                <span className={styles.photoLock}>
                  <Icon name="Lock" size={22} color="#fff" />
                </span>
              </div>
              <div className={styles.identityText}>
                <div>
                  <span className={styles.nameAnon}>Candidate &middot; {candidateCode(candidate)}</span>
                  <span className={styles.nameReal}>{candidate?.name}</span>
                </div>
                <div className={styles.role}>
                  {[candidate?.position, candidate?.experience && `${candidate?.experience} yrs`]?.filter(Boolean)?.join(' · ')}
                </div>
                <div className={styles.loc}>
                  <Icon name="MapPin" size={14} />
                  <span>{candidate?.location}</span>
                </div>
                <span className={styles.lockPill}>
                  <Icon name="Lock" size={13} />
                  Name and contact info unlock for {unlockCost} {unlockCost === 1 ? 'credit' : 'credits'}
                </span>
              </div>
            </div>

            <div className={styles.contactStrip}>
              <div className={styles.contactRow}>
                <Icon name="Mail" size={15} />
                <span>{contact?.email}</span>
              </div>
              <div className={styles.contactRow}>
                <Icon name="Phone" size={15} />
                <span>{contact?.phone}</span>
              </div>
              <div className={styles.contactRow}>
                <Icon name="Linkedin" size={15} />
                <span>{contact?.linkedin}</span>
              </div>
            </div>

            <div className={styles.sec}>
              <div className={styles.prefs}>
                <div className={styles.pref}>
                  <span className={styles.pl}>Work Mode</span>
                  <span className={styles.pv}>{workMode}</span>
                </div>
                <div className={styles.pref}>
                  <span className={styles.pl}>Type</span>
                  <span className={styles.pv}>{workType}</span>
                </div>
                <div className={styles.pref}>
                  <span className={styles.pl}>Expected Salary</span>
                  <span className={styles.pv}>{formatSalary(candidate?.expectedSalary)}</span>
                </div>
                {availabilityLabel && (
                  <div className={styles.pref}>
                    <span className={styles.pl}>Availability</span>
                    <span className={styles.pv}>{availabilityLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {candidate?.description && (
              <div className={styles.sec}>
                <div className={styles.secHead}><b>Summary</b></div>
                <p className={styles.about}>{candidate?.description}</p>
              </div>
            )}

            <div className={styles.sec}>
              <div className={styles.secHead}><b>Experience</b></div>
              <div className={styles.xp}>
                <span className={styles.xpRole}>{candidate?.position}</span>
                <span className={styles.xpDate}>{startYear} — Present</span>
                <div className={styles.xpCo}>
                  <span className={styles.priv}>{candidate?.company}</span>
                  {candidate?.location ? ` · ${candidate?.location}` : ''}
                </div>
                {candidate?.skills?.length > 0 && (
                  <div className={styles.xpTags}>
                    {candidate?.skills?.slice(0, 4)?.map((skill) => (
                      <span key={skill} className={styles.tag}>{skill}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {candidate?.education && (
              <div className={styles.sec}>
                <div className={styles.secHead}><b>Education</b></div>
                {isEducationObject ? (
                  <div className={styles.edu}>
                    <div>
                      <div className={styles.eduName}>{candidate?.education?.degree}</div>
                      {candidate?.education?.institution && (
                        <div className={styles.eduSub}>{candidate?.education?.institution}</div>
                      )}
                    </div>
                    {candidate?.education?.year && (
                      <div className={styles.eduDate}>{candidate?.education?.year}</div>
                    )}
                  </div>
                ) : (
                  <div className={styles.edu}>
                    <span className={styles.eduName}>{educationLabels?.[candidate?.education] || candidate?.education}</span>
                  </div>
                )}
              </div>
            )}

            {candidate?.skills?.length > 0 && (
              <div className={styles.sec}>
                <div className={styles.secHead}><b>Skills</b></div>
                <div className={styles.skills}>
                  {candidate?.skills?.map((skill) => (
                    <span key={skill} className={styles.tag}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {candidate?.languages?.length > 0 && (
              <div className={styles.sec}>
                <div className={styles.secHead}><b>Languages</b></div>
                <div className={styles.langs}>
                  {candidate.languages.map((lang) => (
                    <div className={styles.lang} key={lang?.name}>
                      <span className={styles.ln}>{lang?.name}</span>
                      <span className={styles.lvwrap}>
                        <span className={styles.lv}>{lang?.level}</span>
                        {lang?.note && <span className={styles.lnote}><span className={styles.dot} />{lang.note}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {variant === 'purchased' ? (
          <div className={styles.foot}>
            <a href={`mailto:${contact?.email || ''}`} className={styles.mailBtn}>
              Send Email
              <Icon name="Mail" size={18} />
            </a>
            <button type="button" className={styles.printBtn} onClick={() => onPrint(candidate)}>
              Print
              <Icon name="Printer" size={18} />
            </button>
            <button type="button" className={styles.footCloseBtn} onClick={onClose} aria-label="Close">
              <Icon name="X" size={18} />
            </button>
          </div>
        ) : (
          <div className={styles.foot}>
            <button
              type="button"
              className={`${styles.bookmarkBtn} ${isBookmarked ? styles.on : ''}`}
              onClick={() => onBookmark(candidate?.id)}
              aria-label={isBookmarked ? 'Remove from bookmarks' : 'Bookmark candidate'}
            >
              <Icon name="Bookmark" size={18} style={isBookmarked ? { fill: 'currentColor' } : undefined} />
            </button>
            {isRevealed ? (
              <button type="button" className={`${styles.unlockBtn} ${styles.unlockBtnDone}`} disabled>
                <Icon name="Unlock" size={18} />
                Unlocked
              </button>
            ) : (
              <button type="button" className={styles.unlockBtn} onClick={() => onUnlock(candidate?.id)}>
                <Icon name="Unlock" size={18} />
                Unlock · {unlockCost} {unlockCost === 1 ? 'Credit' : 'Credits'}
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default CandidatePreviewDrawer;
