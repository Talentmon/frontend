import React from 'react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import styles from '../styles/bookmarked.module.scss';

const BookmarkedCandidatesHeader = ({
  candidatesCount,
  sortBy,
  onSortChange,
  onToggleSelectionMode,
  selectionMode,
  onSearchCandidates,
  reorderMode,
  hasReordered,
  onToggleReorderMode,
  onSaveOrder
}) => {
  const sortOptions = [
    { value: 'bookmarked-date-desc', label: 'Recently saved' },
    { value: 'bookmarked-date-asc', label: 'Oldest saved' },
    { value: 'experience-desc', label: 'Most experience' },
    { value: 'experience-asc', label: 'Least experience' },
    { value: 'salary-desc', label: 'Highest salary' },
    { value: 'salary-asc', label: 'Lowest salary' },
    { value: 'match-score-desc', label: 'Best match' },
    { value: 'custom', label: 'Custom order' }
  ];

  const reorderLabel = !reorderMode ? 'Reorder' : hasReordered ? 'Save order' : 'Cancel reorder';
  const reorderIcon = !reorderMode ? 'GripVertical' : hasReordered ? 'Check' : 'X';
  const handleReorderClick = reorderMode && hasReordered ? onSaveOrder : onToggleReorderMode;

  return (
    <div className={styles.phead}>
      <div>
        <h1>
          <Icon name="Bookmark" size={22} color="#C98A1F" />
          Bookmarked candidates
          {candidatesCount > 0 && <span className={styles.count}>{candidatesCount}</span>}
        </h1>
      </div>

      <div className={styles.pheadTools}>
        {candidatesCount > 0 && (
          <>
            <Select value={sortBy} onChange={onSortChange} options={sortOptions} disabled={reorderMode} />

            {!selectionMode && (
              <button
                className={`${styles.btnReorder} ${reorderMode ? styles.on : ''}`}
                onClick={handleReorderClick}
              >
                <Icon name={reorderIcon} size={16} />
                {reorderLabel}
              </button>
            )}

            {!reorderMode && (
              <button
                className={`${styles.btnSelectMultiple} ${selectionMode ? styles.on : ''}`}
                onClick={onToggleSelectionMode}
              >
                <Icon name={selectionMode ? 'X' : 'CheckSquare'} size={16} color={selectionMode ? undefined : '#C98A1F'} />
                {selectionMode ? 'Cancel selection' : 'Select multiple'}
              </button>
            )}
          </>
        )}

        <button className={styles.btnPrimary} onClick={onSearchCandidates}>
          <Icon name="Search" size={16} />
          Search candidates
        </button>
      </div>
    </div>
  );
};

export default BookmarkedCandidatesHeader;
