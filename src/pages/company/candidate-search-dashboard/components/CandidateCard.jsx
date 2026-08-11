import React, { forwardRef } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import { formatSalary } from '../utils/cvHelpers';
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

  const MatchBar = () => (
    candidate?.matchScore ? (
      <div className={styles.match}>
        <div className={styles.matchTop}>
          <span className={styles.ml}>MATCH</span>
          <span className={styles.mv}>{candidate?.matchScore}%</span>
        </div>
        <div className={styles.matchBar}>
          <i style={{ width: `${candidate?.matchScore}%` }} />
        </div>
      </div>
    ) : null
  );

  const noticeLabels = {
    immediately: 'Immediately',
    '2-weeks': '2 weeks',
    '1-month': '1 month',
    '3-months': '3 months'
  };

  const statusConfig = {
    active: {
      title: 'Actively searching',
      tone: styles.statusActive
    },
    open: {
      title: 'Open to offers',
      tone: styles.statusOpen
    },
    off: {
      title: 'Not looking',
      tone: styles.statusOff
    }
  };

  const status = statusConfig?.[candidate?.searchStatus] || statusConfig?.active;

  const StatusBadge = () => (
    <span className={`${styles.statusBadge} ${status?.tone}`}>
      <span className={styles.pulse} />
      <span className={styles.statusTitle}>{status?.title}</span>
    </span>
  );

  const workArrangement = candidate?.workArrangement || (candidate?.jobType?.includes('remote') ? 'Remote' : 'On-site');

  const BlurredText = ({ text, redactedClassName = '', className = '' }) => (
    isPurchased
      ? <span className={className}>{text}</span>
      : <span className={redactedClassName}></span>
  );

  const Avatar = ({ size }) => (
    <div className={styles.avatar} style={{ width: size, height: size }}>
      {!isPurchased ? (
        <div className={styles.avatarLocked}>
          <Image src={candidate?.avatar} alt="" className={styles.avatarLockedImg} />
          <span className={styles.avatarLockedTint} />
          <Icon name="Lock" size={size * 0.46} color="#F2C871" className={styles.avatarLockedIcon} />
        </div>
      ) : (
        <Image
          src={candidate?.avatar}
          alt={candidate?.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div ref={ref} className={`${styles.card} ${styles.list} ${isPurchased ? styles.unlocked : ''} ${isActive ? styles.active : ''}`}>
        {/* Content: avatar + name/title + facts + skills + description */}
        <div className={styles.listContent}>
          <div className={styles.listAvatar}>
            <Avatar size={72} />
          </div>

          <div className={styles.listHead}>
            <BlurredText
              text={candidate?.name}
              className={styles.name}
              redactedClassName={styles.redactedName}
            />
            <span className={styles.role}>{candidate?.position}</span>
          </div>

          <div className={styles.listFacts}>
            <div className={styles.fact}>
              <span className={styles.factK}>Experience</span>
              <span className={styles.factV}>{candidate?.experience} yrs</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factK}>Salary</span>
              <span className={styles.factV}>{formatSalary(candidate?.expectedSalary)}</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factK}>Location</span>
              <span className={styles.factV}>{candidate?.location}</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factK}>Work Arrangement</span>
              <span className={styles.factV}>{workArrangement}</span>
            </div>
            {candidate?.availability && (
              <div className={styles.fact}>
                <span className={styles.factK}>Notice Period</span>
                <span className={styles.factV}>{noticeLabels?.[candidate?.availability] || candidate?.availability}</span>
              </div>
            )}
          </div>

          <div className={styles.listSkills}>
            {candidate?.skills?.slice(0, 5)?.map((skill, index) => (
              <span key={index} className={styles.tag}>{skill}</span>
            ))}
            {candidate?.skills?.length > 5 && (
              <span className={styles.moreTag}>+{candidate?.skills?.length - 5}</span>
            )}
          </div>

          <p className={styles.listDesc}>{candidate?.description}</p>
        </div>

        {/* Actions: status, unlock, bookmark + preview */}
        <div className={styles.listActions}>
          <StatusBadge />

          {!!candidate?.matchScore && (
            <div className={styles.listMatch}>
              <span className={styles.factK}>Match</span>
              <span className={styles.matchDot}>·</span>
              <span className={`${styles.factV} ${styles.factVGold}`}>{candidate?.matchScore}%</span>
            </div>
          )}

          {!isPurchased ? (
            <>
              <button onClick={handleUnlockClick} className={styles.unlockBtn}>
                <Icon name="Unlock" size={16} />
                Unlock
              </button>
              <div className={styles.listActionsRow}>
                <button
                  onClick={handleBookmarkClick}
                  className={`${styles.cardBookmark} ${isBookmarked ? styles.on : ''}`}
                  aria-label={isBookmarked ? 'Remove from bookmarks' : 'Bookmark candidate'}
                >
                  <Icon
                    name="Bookmark"
                    size={18}
                    color={isBookmarked ? undefined : 'var(--color-muted-foreground)'}
                    style={isBookmarked ? { fill: 'currentColor' } : undefined}
                  />
                </button>
                <button onClick={handlePreviewClick} className={`${styles.previewBtn} ${isActive ? styles.active : ''}`} aria-label="Preview CV" title="Preview CV" aria-pressed={isActive}>
                  <Icon name="Eye" size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button className={`${styles.unlockBtn} ${styles.done}`} onClick={handlePreviewClick}>
                <Icon name="Eye" size={16} />
                View Profile
              </button>
              <button
                onClick={handleBookmarkClick}
                className={`${styles.cardBookmark} ${isBookmarked ? styles.on : ''}`}
                style={{ width: '100%' }}
                aria-label={isBookmarked ? 'Remove from bookmarks' : 'Bookmark candidate'}
              >
                <Icon
                  name="Bookmark"
                  size={18}
                  color={isBookmarked ? undefined : 'var(--color-muted-foreground)'}
                  style={isBookmarked ? { fill: 'currentColor' } : undefined}
                />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div ref={ref} className={`${styles.card} ${isPurchased ? styles.unlocked : ''} ${isActive ? styles.active : ''}`}>
      <div className={styles.cardTop}>
        <StatusBadge />
      </div>

      {/* Header */}
      <div className={styles.cardHead}>
        <Avatar size={72} />
        <div style={{ minWidth: 0 }}>
          <BlurredText
            text={candidate?.name}
            className={styles.name}
            redactedClassName={styles.redactedName}
          />
          <span className={styles.role}>{candidate?.position}</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Facts */}
      <div className={styles.factsGrid}>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="Calendar" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Experience</span>
            <span className={styles.factV}>{candidate?.experience} yrs</span>
          </span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="CreditCard" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Salary</span>
            <span className={styles.factV}>{formatSalary(candidate?.expectedSalary)}</span>
          </span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="MapPin" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Location</span>
            <span className={styles.factV}>{candidate?.location}</span>
          </span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="Building2" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Work Arrangement</span>
            <span className={styles.factV}>{workArrangement}</span>
          </span>
        </div>
        {candidate?.availability && (
          <div className={styles.fact}>
            <span className={styles.factIcon}><Icon name="Clock" size={16} /></span>
            <span className={styles.factText}>
              <span className={styles.factK}>Notice Period</span>
              <span className={styles.factV}>{noticeLabels?.[candidate?.availability] || candidate?.availability}</span>
            </span>
          </div>
        )}
        {!!candidate?.matchScore && (
          <div className={styles.fact}>
            <span className={styles.factIcon}><Icon name="TrendingUp" size={16} /></span>
            <span className={styles.factText}>
              <span className={styles.factK}>Match</span>
              <span className={`${styles.factV} ${styles.factVGold}`}>{candidate?.matchScore}%</span>
            </span>
          </div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.skills}>
        {candidate?.skills?.slice(0, 4)?.map((skill, index) => (
          <span key={index} className={styles.tag}>{skill}</span>
        ))}
        {candidate?.skills?.length > 4 && (
          <span className={styles.moreTag}>+{candidate?.skills?.length - 4}</span>
        )}
      </div>

      <p className={styles.desc}>{candidate?.description}</p>

      {/* Actions */}
      <div className={styles.cardActions}>
        {!isPurchased ? (
          <>
            <button onClick={handleUnlockClick} className={styles.unlockBtn}>
              <Icon name="Unlock" size={16} />
              Unlock
            </button>
            <button onClick={handlePreviewClick} className={`${styles.previewBtn} ${isActive ? styles.active : ''}`} aria-label="Preview CV" title="Preview CV" aria-pressed={isActive}>
              <Icon name="Eye" size={16} />
            </button>
          </>
        ) : (
          <button className={`${styles.unlockBtn} ${styles.done}`} onClick={handlePreviewClick}>
            <Icon name="Eye" size={16} />
            View Profile
          </button>
        )}
        <button
          onClick={handleBookmarkClick}
          className={`${styles.cardBookmark} ${isBookmarked ? styles.on : ''}`}
          aria-label={isBookmarked ? 'Remove from bookmarks' : 'Bookmark candidate'}
        >
          <Icon
            name="Bookmark"
            size={18}
            color={isBookmarked ? undefined : 'var(--color-muted-foreground)'}
            style={isBookmarked ? { fill: 'currentColor' } : undefined}
          />
        </button>
      </div>
    </div>
  );
});

CandidateCard.displayName = 'CandidateCard';

export default CandidateCard;
