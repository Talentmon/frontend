import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/bookmarked.module.scss';

/**
 * The strip under the page title: one segment per slot in the company's
 * shared list (10, up to 30 with package bonuses), "4/10 slots used" and how
 * many are left. Team members also have personal slots, which count toward
 * "left" but not the segments. Green, gold with 2 or fewer left, red when
 * full; full swaps "Add more candidates" for "Remove some". Past the limit
 * after an ownership transfer, a note below gives the deadline.
 */
const BookmarkSlotsStrip = ({
  used,
  limit = 10,
  personalUsed = 0,
  personalLimit = 0,
  overflowDeadline = null,
  onAddMore,
  onRemoveSome
}) => {
  const sharedFree = Math.max(0, limit - used);
  const personalFree = Math.max(0, personalLimit - personalUsed);
  const free = sharedFree + personalFree;
  const isFull = free === 0;
  const overBy = overflowDeadline ? used - limit : 0;
  const tone = isFull || overBy > 0 ? styles.full : free <= 2 ? styles.near : '';

  // Thinner segments once the list grows past 10 slots, so 30 still fits.
  const segmentSize = limit <= 10 ? styles.segWide : limit <= 20 ? styles.segMid : styles.segThin;

  return (
    <div className={styles.slots}>
      <div className={`${styles.slotsStrip} ${tone}`}>
        <div
          role="meter"
          aria-label="Bookmark slots used"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(used, limit)}
          aria-valuetext={`${used} of ${limit} slots used, ${free} left`}
          className={`${styles.slotsMeter} ${segmentSize}`}
        >
          {Array.from({ length: limit }, (_, i) => (
            <span key={i} aria-hidden="true" className={i < used ? styles.segOn : ''} />
          ))}
        </div>

        <p className={styles.slotsText}>
          <strong>
            {used}
            <span>/{limit}</span>
          </strong>
          slots used
        </p>

        <span className={styles.slotsLeft}>{isFull ? 'Limit reached' : `${free} left`}</span>

        {personalLimit > 0 && (
          <span className={styles.slotsPersonal} title="Your personal slots - only you can remove these">
            Personal {personalUsed}/{personalLimit}
          </span>
        )}

        <span className={styles.slotsDivider} aria-hidden="true" />

        {isFull ? (
          <button type="button" className={styles.slotsAction} onClick={onRemoveSome}>
            <Icon name="Trash2" size={15} strokeWidth={2.2} />
            Remove some
          </button>
        ) : (
          <button type="button" className={styles.slotsAction} onClick={onAddMore}>
            <Icon name="Plus" size={16} strokeWidth={2.4} />
            Add more candidates
          </button>
        )}
      </div>

      {overBy > 0 && (
        <p className={styles.slotsOver}>
          <Icon name="AlertCircle" size={16} />
          <span>
            <b>The shared list is {overBy} over the limit.</b> Remove {overBy} shared bookmark{overBy === 1 ? '' : 's'} by{' '}
            <b>{new Date(overflowDeadline).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</b>
            {' '}— otherwise the {overBy} oldest from the ownership transfer are removed.
          </span>
        </p>
      )}
    </div>
  );
};

export default BookmarkSlotsStrip;
