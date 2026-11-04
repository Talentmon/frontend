import React, { forwardRef } from 'react';
import Icon from 'components/AppIcon';
import { CardAvatar, CardIdentity, CardStats, MatchRing, SkillsRow, StatusBadge } from './CandidateCardParts';
import styles from '../styles/dashboard.module.scss';

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
  const matchScore = candidate?.matchScore;
  const skills = candidate?.skills || [];
  const bookmarkLabel = isBookmarked ? 'Remove from bookmarks' : 'Bookmark candidate';

  const avatar = <CardAvatar candidate={candidate} unlocked={isPurchased} />;
  const identity = <CardIdentity candidate={candidate} unlocked={isPurchased} />;
  const statusBadge = <StatusBadge searchStatus={candidate?.searchStatus} />;
  const stats = <CardStats candidate={candidate} salaryFirst={!isList} />;
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
              <span className={styles.matchDot} aria-hidden="true" />
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

        {!!matchScore && <MatchRing score={matchScore} />}
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
