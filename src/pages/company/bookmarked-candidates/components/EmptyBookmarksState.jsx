import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/bookmarked.module.scss';

const EmptyBookmarksState = ({ onSearchCandidates }) => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icon name="Bookmark" size={48} />
      </div>

      <h2 className={styles.emptyTitle}>No bookmarked candidates</h2>
      <p className={styles.emptyText}>
        Start searching for candidates and bookmark the ones you're interested in.
        You can save up to 10 candidates before unlocking their profiles.
      </p>

      <button className={styles.btnPrimary} onClick={onSearchCandidates}>
        <Icon name="Search" size={18} />
        Search candidates
      </button>

      <div className={styles.emptyFeatures}>
        <div className={styles.featureItem}>
          <div className={`${styles.featureIcon} ${styles.b1}`}>
            <Icon name="Search" size={22} />
          </div>
          <h3 className={styles.featureTitle}>Search candidates</h3>
          <p className={styles.featureText}>Use advanced filters to find the ideal candidates</p>
        </div>

        <div className={styles.featureItem}>
          <div className={`${styles.featureIcon} ${styles.b2}`}>
            <Icon name="Bookmark" size={22} />
          </div>
          <h3 className={styles.featureTitle}>Bookmark the ones you like</h3>
          <p className={styles.featureText}>Add up to 10 candidates to your bookmarks list for easier comparison</p>
        </div>

        <div className={styles.featureItem}>
          <div className={`${styles.featureIcon} ${styles.b3}`}>
            <Icon name="Unlock" size={22} />
          </div>
          <h3 className={styles.featureTitle}>Unlock profiles</h3>
          <p className={styles.featureText}>Use tokens to access detailed candidate information</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyBookmarksState;
