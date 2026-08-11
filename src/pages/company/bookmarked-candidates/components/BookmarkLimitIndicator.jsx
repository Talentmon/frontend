import React from 'react';
import { motion } from 'framer-motion';
import Icon from 'components/AppIcon';
import styles from '../styles/bookmarked.module.scss';

const LAYOUT_TRANSITION = { duration: 0.4, ease: [0.2, 0.7, 0.2, 1] };

const BookmarkLimitIndicator = ({
  currentCount,
  maxCount = 10,
  onManageBookmarks,
  onSearchCandidates,
  stacked = false
}) => {
  const isNearLimit = currentCount >= maxCount * 0.8;
  const isAtLimit = currentCount >= maxCount;

  const stateClass = isAtLimit ? 'danger' : isNearLimit ? 'warn' : '';
  const iconColor = isAtLimit ? '#cf4b4b' : isNearLimit ? '#C98A1F' : '#2f9e69';

  const percentage = Math.min((currentCount / maxCount) * 100, 100);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      layout
      transition={LAYOUT_TRANSITION}
      className={`${styles.limit} ${stateClass ? styles[stateClass] : ''} ${stacked ? styles.stacked : ''}`}
    >
      <motion.div layout transition={LAYOUT_TRANSITION} className={styles.limitRing}>
        <svg width="100%" height="100%" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r={radius} fill="none" stroke="#E8ECF0" strokeWidth="9" />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke={iconColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 56 56)"
          />
        </svg>
        <span className={`${styles.limitRingText} ${stateClass ? styles[stateClass] : ''}`}>
          <b>{currentCount}</b>/{maxCount}
        </span>
      </motion.div>

      <motion.div layout transition={LAYOUT_TRANSITION} className={styles.limitContent}>
        <h3>
          <Icon name="Bookmark" size={17} color={iconColor} />
          Bookmarked candidates limit
        </h3>

        {isAtLimit ? (
          <div className={`${styles.limitNote} ${styles.danger}`}>
            <Icon name="AlertCircle" size={16} />
            <span>
              <b>You've reached the maximum number of bookmarked candidates.</b> Unlock profiles or remove some candidates so you can save new ones.
            </span>
          </div>
        ) : isNearLimit ? (
          <div className={`${styles.limitNote} ${styles.warn}`}>
            <Icon name="AlertTriangle" size={16} />
            <span>
              You're approaching the limit. You have <b>{maxCount - currentCount}</b> free slots left.
            </span>
          </div>
        ) : (
          <div className={styles.limitNote}>
            <Icon name="CheckCircle" size={16} />
            <span>You can save <b>{maxCount - currentCount}</b> more candidates.</span>
          </div>
        )}

        <div className={styles.limitActions}>
          {isAtLimit ? (
            <>
              <button className={styles.btnDanger} onClick={onManageBookmarks}>
                <Icon name="Trash2" size={14} />Remove some
              </button>
              <button className={styles.btnOutline} onClick={onSearchCandidates}>
                <Icon name="Search" size={14} />Search new
              </button>
            </>
          ) : (
            <button className={styles.btnOutline} onClick={onSearchCandidates}>
              <Icon name="Plus" size={14} />Add more candidates
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BookmarkLimitIndicator;
