import React, { useLayoutEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import { formatSalary, salaryPeriod } from '../utils/cvHelpers';
import styles from '../styles/dashboard.module.scss';

// Pieces of the candidate card shared by Search (CandidateCard) and
// Bookmarked (BookmarkedCandidateCard), so both cards stay one design.

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

/** Grid card's match score: the ring with "MATCH" under it. */
export const MatchRing = ({ score }) => (
  <div className={styles.scRing}>
    <MatchDial score={score} />
    <span className={styles.scRingLabel}>match</span>
  </div>
);

// One line of skill tags: as many as fit, then "+N more" for the rest. The
// count is only a hint (not a toggle) — the full list is in the CV preview.
// A hidden copy of every tag is measured to work out how many fit.
export const SkillsRow = ({ skills }) => {
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

/** Photo once unlocked; until then a silhouette with a lock badge. */
export const CardAvatar = ({ candidate, unlocked }) => (
  <div className={styles.scAvatar}>
    {unlocked ? (
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

/** Name (pills until unlocked), role and location/work arrangement. */
export const CardIdentity = ({ candidate, unlocked }) => {
  const workArrangement = candidate?.workArrangement || (candidate?.jobType?.includes('remote') ? 'Remote' : 'On-site');

  return (
    <>
      {unlocked ? (
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
};

export const StatusBadge = ({ searchStatus }) => {
  const status = statusConfig?.[searchStatus] || statusConfig?.active;

  return (
    <span className={`${styles.statusBadge} ${status?.tone || ''}`}>
      <span className={styles.pulse} />
      <span className={styles.statusTitle}>{status?.title}</span>
    </span>
  );
};

/**
 * Experience · Minimum salary · Notice period strip. Grid cards pass
 * `salaryFirst` to lead with the salary; the list row keeps experience first.
 */
export const CardStats = ({ candidate, salaryFirst = false }) => {
  const experience = candidate?.experience;
  const period = salaryPeriod(candidate?.expectedSalary);

  const experienceStat = (
    <div className={styles.scStat}>
      <span className={styles.scStatK}>Experience</span>
      <span className={styles.scStatV}>{experience} {experience === 1 ? 'year' : 'years'}</span>
    </div>
  );
  const salaryStat = (
    <div className={styles.scStat}>
      <span className={styles.scStatK}>Minimum salary</span>
      <span className={styles.scStatV}>
        {/* The amount never breaks ("RSD 230,000"); only "/ mo" may drop to the next line. */}
        <span className={styles.scStatAmount}>{formatSalary(candidate?.expectedSalary)}</span>
        {period && <> <span className={styles.scStatPer}>/ {period}</span></>}
      </span>
    </div>
  );

  return (
    <div className={styles.scStats}>
      {salaryFirst ? salaryStat : experienceStat}
      {salaryFirst ? experienceStat : salaryStat}
      <div className={styles.scStat}>
        <span className={styles.scStatK}>Notice period</span>
        <span className={styles.scStatV}>{noticeLabels?.[candidate?.availability] || candidate?.availability || '—'}</span>
      </div>
    </div>
  );
};
