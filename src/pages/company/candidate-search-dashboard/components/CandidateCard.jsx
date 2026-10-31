import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import { formatSalary } from '../utils/cvHelpers';
import styles from '../styles/dashboard.module.scss';

const workArrangementIcons = {
  Remote: 'Laptop',
  Hybrid: 'ArrowLeftRight',
  'On-site': 'Building2'
};

const noticeLabels = {
  immediately: 'Immediately',
  '2-weeks': '2 weeks',
  '1-month': '1 month',
  '3-months': '3 months'
};

const statusConfig = {
  active: { title: 'Actively searching' },
  open: { title: 'Open to offers' },
  off: { title: 'Not looking', tone: styles.statusOff }
};

const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

const MatchDial = ({ score }) => (
  <div className={styles.scRingDial}>
    <svg viewBox="0 0 58 58" aria-hidden="true">
      <circle cx="29" cy="29" r={RING_R} className={styles.scRingTrack} />
      <circle
        cx="29"
        cy="29"
        r={RING_R}
        className={styles.scRingFill}
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - Math.min(score, 100) / 100)}
      />
    </svg>
    <span className={styles.scRingValue}>{score}%</span>
  </div>
);

// One line of skill tags: as many as fit, then "+N more" for the rest. The
// count is only a hint (not a toggle) — the full list is in the CV preview.
// A hidden copy of every tag is measured to work out how many fit.
const SkillsRow = ({ skills }) => {
  const rowRef = useRef(null);
  const measureRef = useRef(null);
  const [visible, setVisible] = useState(skills.length);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;

    const fit = () => {
      const tags = Array.from(measure.children);
      const more = tags.pop();
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const moreWidth = gap + parseFloat(getComputedStyle(more).marginLeft) + more.offsetWidth;
      let used = 0;
      let count = 0;
      for (let i = 0; i < tags.length; i += 1) {
        used += (i ? gap : 0) + tags[i].offsetWidth;
        const needed = used + (i < tags.length - 1 ? moreWidth : 0);
        if (needed > row.clientWidth) break;
        count = i + 1;
      }
      setVisible(Math.max(1, count));
    };

    fit();
    // The measured copy also resizes once the web font loads.
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [skills]);

  const hidden = skills.length - visible;

  return (
    <div ref={rowRef} className={styles.scSkills}>
      {skills.slice(0, visible).map((skill, index) => (
        <span key={index} className={styles.scTag}>{skill}</span>
      ))}
      {hidden > 0 && <span className={styles.scMore}>+{hidden} more</span>}

      <div ref={measureRef} className={styles.scSkillsMeasure} aria-hidden="true">
        {skills.map((skill, index) => (
          <span key={index} className={styles.scTag}>{skill}</span>
        ))}
        <span className={styles.scMore}>+{skills.length} more</span>
      </div>
    </div>
  );
};

const CandidateCard = forwardRef(({
  candidate,
  viewMode = 'grid',
  onBookmark,
  onUnlock,
  onPreview = () => {},
  isBookmarked = false,
  isPurchased = false,
  isActive = false
}, ref) => {
  const handleBookmarkClick = (e) => {
    e?.stopPropagation();
    onBookmark(candidate?.id);
  };

  const handleUnlockClick = (e) => {
    e?.stopPropagation();
    onUnlock(candidate?.id);
  };

  const handlePreviewClick = (e) => {
    e?.stopPropagation();
    onPreview(candidate?.id);
  };

  const isList = viewMode === 'list';
  const status = statusConfig?.[candidate?.searchStatus] || statusConfig?.active;
  const workArrangement = candidate?.workArrangement || (candidate?.jobType?.includes('remote') ? 'Remote' : 'On-site');
  const experience = candidate?.experience;
  const matchScore = candidate?.matchScore;
  const skills = candidate?.skills || [];
  const bookmarkLabel = isBookmarked ? 'Remove from bookmarks' : 'Bookmark candidate';

  const avatar = (
    <div className={styles.scAvatar}>
      {isPurchased ? (
        <Image src={candidate?.avatar} alt={candidate?.name} />
      ) : (
        <>
          <Icon name="User" size={32} strokeWidth={1.6} />
          <span className={styles.scLockBadge}>
            <Icon name="Lock" size={12} strokeWidth={2.5} />
          </span>
        </>
      )}
    </div>
  );

  // Name (pills until unlocked), role and location/work arrangement.
  const identity = (
    <>
      {isPurchased ? (
        <span className={styles.scName}>{candidate?.name}</span>
      ) : (
        <span className={styles.scNamePills} aria-hidden="true">
          <i />
          <i />
        </span>
      )}
      <h3 className={styles.scTitle}>{candidate?.position}</h3>
      <div className={styles.scMeta}>
        {candidate?.location && (
          <span><Icon name="MapPin" size={15} />{candidate?.location}</span>
        )}
        <span><Icon name={workArrangementIcons?.[workArrangement] || 'Laptop'} size={15} />{workArrangement}</span>
      </div>
    </>
  );

  const statusBadge = (
    <span className={`${styles.statusBadge} ${status?.tone || ''}`}>
      <span className={styles.pulse} />
      <span className={styles.statusTitle}>{status?.title}</span>
    </span>
  );

  const stats = (
    <div className={styles.scStats}>
      <div className={styles.scStat}>
        <span className={styles.scStatK}>Experience</span>
        <span className={styles.scStatV}>{experience} {experience === 1 ? 'year' : 'years'}</span>
      </div>
      <div className={styles.scStat}>
        <span className={styles.scStatK}>Expected salary</span>
        <span className={styles.scStatV}>{formatSalary(candidate?.expectedSalary)}</span>
      </div>
      <div className={styles.scStat}>
        <span className={styles.scStatK}>Notice period</span>
        <span className={styles.scStatV}>{noticeLabels?.[candidate?.availability] || candidate?.availability || '—'}</span>
      </div>
    </div>
  );

  const skillsRow = skills.length > 0 && <SkillsRow skills={skills} />;

  const desc = <p className={styles.scDesc}>{candidate?.description}</p>;

  const primaryButton = isPurchased ? (
    <button className={`${styles.scPrimary} ${styles.done}`} onClick={handlePreviewClick}>
      <Icon name="Eye" size={18} />
      View profile
    </button>
  ) : (
    <button onClick={handleUnlockClick} className={styles.scPrimary}>
      <Icon name="Unlock" size={18} />
      Unlock profile
    </button>
  );

  if (isList) {
    return (
      <div ref={ref} className={`${styles.card} ${styles.scCard} ${styles.scListCard} ${isPurchased ? styles.unlocked : ''} ${isActive ? styles.active : ''}`}>
        {/* Main: avatar/identity + stats, skills, description */}
        <div className={styles.scListMain}>
          <div className={styles.scListTop}>
            <div className={styles.scListHead}>
              {avatar}
              <div className={styles.scInfo}>{identity}</div>
            </div>
            {stats}
          </div>
          {skillsRow}
          {desc}
        </div>

        {/* Side: match + status, unlock, preview + save */}
        <div className={styles.scListSide}>
          {statusBadge}
          {!!matchScore && (
            <div className={styles.listMatch}>
              <span className={styles.factK}>Match</span>
              <span className={styles.matchDot}>·</span>
              <span className={`${styles.factV} ${styles.factVGold}`}>{matchScore}%</span>
            </div>
          )}
          {primaryButton}
          <div className={styles.scListBtns}>
            {!isPurchased && (
              <button onClick={handlePreviewClick} className={`${styles.scTextBtn} ${styles.scPreviewBtn} ${isActive ? styles.active : ''}`} title="Preview CV" aria-pressed={isActive}>
                <Icon name="Eye" size={19} />
                Preview
              </button>
            )}
            <button onClick={handleBookmarkClick} className={`${styles.scTextBtn} ${styles.scSaveBtn} ${isBookmarked ? styles.on : ''}`} title={bookmarkLabel}>
              <Icon name="Bookmark" size={19} style={isBookmarked ? { fill: 'currentColor' } : undefined} />
              {isBookmarked ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div ref={ref} className={`${styles.card} ${styles.scCard} ${isPurchased ? styles.unlocked : ''} ${isActive ? styles.active : ''}`}>
      {/* Header: avatar, name/role/meta/status, match ring */}
      <div className={styles.scHead}>
        {avatar}

        <div className={styles.scInfo}>
          {identity}
          {statusBadge}
        </div>

        {!!matchScore && (
          <div className={styles.scRing}>
            <MatchDial score={matchScore} />
            <span className={styles.scRingLabel}>match</span>
          </div>
        )}
      </div>

      {stats}
      {skillsRow}
      {desc}

      {/* Actions */}
      <div className={styles.scActions}>
        {primaryButton}
        {!isPurchased && (
          <button onClick={handlePreviewClick} className={`${styles.scIconBtn} ${styles.scPreviewBtn} ${isActive ? styles.active : ''}`} aria-label="Preview CV" title="Preview CV" aria-pressed={isActive}>
            <Icon name="Eye" size={19} />
          </button>
        )}
        <button
          onClick={handleBookmarkClick}
          className={`${styles.scIconBtn} ${styles.scSaveBtn} ${isBookmarked ? styles.on : ''}`}
          aria-label={bookmarkLabel}
          title={bookmarkLabel}
        >
          <Icon name="Bookmark" size={18} style={isBookmarked ? { fill: 'currentColor' } : undefined} />
        </button>
      </div>
    </div>
  );
});

CandidateCard.displayName = 'CandidateCard';

export default CandidateCard;
