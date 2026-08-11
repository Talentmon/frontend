import React, { useRef } from 'react';
import CandidateCard from './CandidateCard';
import Icon from 'components/AppIcon';
import styles from '../styles/dashboard.module.scss';

// Matches the CSS transition duration on .page/.grid (grid-template-columns,
// padding-right) — wait for the reflow to settle before centering the card,
// otherwise scrollIntoView targets a position that's still animating.
const LAYOUT_SETTLE_MS = 360;

const CandidateGrid = ({
  candidates = [],
  viewMode = 'grid',
  bookmarkedCandidates = [],
  purchasedCandidates = [],
  onBookmarkCandidate = () => {},
  onUnlockCandidate = () => {},
  onPreviewCandidate = () => {},
  activePreviewId = null,
  isPreviewOpen = false,
  loading = false,
  isFilterCollapsed = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore = () => {}
}) => {
  const gridClassName = `${styles.grid} ${viewMode === 'list' ? styles.list : ''} ${isFilterCollapsed ? styles.filtersCollapsed : ''} ${isPreviewOpen ? styles.previewOpen : ''}`;
  const cardRefs = useRef({});

  const handlePreview = (candidateId) => {
    onPreviewCandidate(candidateId);
    setTimeout(() => {
      cardRefs.current?.[candidateId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, LAYOUT_SETTLE_MS);
  };

  if (loading) {
    return (
      <div className={styles.gridWrap}>
        <div className={gridClassName}>
          {Array.from({ length: 8 })?.map((_, index) => (
            <div key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonCardPulse}>
                <div className={styles.skelAvatar}></div>
                <div className={styles.skelLineWide}></div>
                <div className={styles.skelLineNarrow}></div>
                <div className={styles.skelBody}></div>
                <div className={styles.skelBody}></div>
                <div className={styles.skelBody}></div>
                <div className={styles.skelTagRow}>
                  <div className={styles.skelTag} style={{ width: 64 }}></div>
                  <div className={styles.skelTag} style={{ width: 80 }}></div>
                  <div className={styles.skelTag} style={{ width: 56 }}></div>
                </div>
                <div className={styles.skelButton}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (candidates?.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div>
          <div className={styles.emptyStateIcon}>
            <Icon name="Search" size={32} color="var(--color-muted-foreground)" />
          </div>
          <h3>No search results</h3>
          <p>Try different keywords or adjust your search filters.</p>
          <ul>
            <li>• Check that your keywords are spelled correctly</li>
            <li>• Use more general terms</li>
            <li>• Reduce the number of filters</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridWrap}>
      <div className={gridClassName}>
        {candidates?.map((candidate) => (
          <CandidateCard
            key={candidate?.id}
            ref={(el) => { cardRefs.current[candidate?.id] = el; }}
            candidate={candidate}
            viewMode={viewMode}
            isBookmarked={bookmarkedCandidates?.includes(candidate?.id)}
            isPurchased={purchasedCandidates?.includes(candidate?.id)}
            isActive={activePreviewId === candidate?.id}
            onBookmark={onBookmarkCandidate}
            onUnlock={onUnlockCandidate}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {hasMore && (
        <div className={styles.loadMoreWrap}>
          <button type="button" className={styles.loadMoreBtn} onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more candidates'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CandidateGrid;
