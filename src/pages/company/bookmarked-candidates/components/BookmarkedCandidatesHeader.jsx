import React from 'react';
import Icon from 'components/AppIcon';
import BookmarkSlotsStrip from './BookmarkSlotsStrip';
import styles from '../styles/bookmarked.module.scss';

/** Title with the slots strip under it, and Search candidates on the right. */
const BookmarkedCandidatesHeader = ({ slots, onSearchCandidates, onRemoveSome }) => (
  <div className={styles.phead}>
    <div className={styles.pheadMain}>
      <h1>
        <Icon name="Bookmark" size={24} color="#C98A1F" />
        Bookmarked candidates
      </h1>
      <BookmarkSlotsStrip {...slots} onAddMore={onSearchCandidates} onRemoveSome={onRemoveSome} />
    </div>

    <button className={`${styles.btnPrimary} ${styles.btnSearch}`} onClick={onSearchCandidates}>
      <Icon name="Search" size={16} />
      Search candidates
    </button>
  </div>
);

export default BookmarkedCandidatesHeader;
