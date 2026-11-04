import React, { useCallback, useState } from 'react';
import Icon from 'components/AppIcon';
import Popover from './Popover';
import styles from '../styles/bookmarked.module.scss';

const SORT_OPTIONS = [
  { value: 'bookmarked-date-desc', label: 'Recently saved' },
  { value: 'bookmarked-date-asc', label: 'Oldest saved' },
  { value: 'experience-desc', label: 'Most experience' },
  { value: 'experience-asc', label: 'Least experience' },
  { value: 'salary-desc', label: 'Highest salary' },
  { value: 'salary-asc', label: 'Lowest salary' },
  { value: 'match-score-desc', label: 'Best match' },
  { value: 'custom', label: 'Custom order' }
];

/** "Showing 4 of 10 candidates" with Sort, Reorder and Select multiple, right above the cards. */
const BookmarkedResultsBar = ({
  shown,
  total,
  sortBy,
  onSortChange,
  reorderMode,
  hasReordered,
  onToggleReorderMode,
  onSaveOrder,
  selectionMode,
  onToggleSelectionMode
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const closeSort = useCallback(() => setSortOpen(false), []);
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || SORT_OPTIONS[0].label;

  const reorderLabel = !reorderMode ? 'Reorder' : hasReordered ? 'Save order' : 'Cancel reorder';
  const reorderIcon = !reorderMode ? 'GripVertical' : hasReordered ? 'Check' : 'X';

  return (
    <div className={styles.resultsBar}>
      <p role="status" className={styles.resultsCount}>
        Showing <strong>{shown}</strong> of {total} candidate{total === 1 ? '' : 's'}
      </p>

      <div className={styles.resultsTools}>
        {/* Sorting is pinned to the drag order while reordering. */}
        <Popover
          id="bm-sort"
          label="Sort bookmarked candidates"
          role="listbox"
          open={sortOpen && !reorderMode}
          onToggle={() => setSortOpen((prev) => !prev)}
          onClose={closeSort}
          align="right"
          width={210}
          renderTrigger={(props) => (
            <button {...props} className={`${styles.toolBtn} ${sortOpen ? styles.toolBtnOpen : ''}`} disabled={reorderMode}>
              <span className={styles.toolBtnMuted}>Sort:</span>
              <span className={styles.toolBtnStrong}>{sortLabel}</span>
              <Icon name="ChevronDown" size={14} strokeWidth={2.2} className={styles.pillChevron} />
            </button>
          )}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === sortBy}
              className={`${styles.menuOption} ${option.value === sortBy ? styles.menuOptionSelected : ''}`}
              onClick={() => {
                onSortChange(option.value);
                closeSort();
                document.getElementById('bm-sort-trigger')?.focus();
              }}
            >
              {option.label}
            </button>
          ))}
        </Popover>

        {!selectionMode && (
          <button
            type="button"
            className={`${styles.toolBtn} ${reorderMode ? styles.toolBtnOn : ''}`}
            onClick={reorderMode && hasReordered ? onSaveOrder : onToggleReorderMode}
          >
            <Icon name={reorderIcon} size={16} />
            {reorderLabel}
          </button>
        )}

        {!reorderMode && (
          <button
            type="button"
            className={`${styles.toolBtn} ${selectionMode ? styles.toolBtnOn : ''}`}
            onClick={onToggleSelectionMode}
          >
            <Icon name={selectionMode ? 'X' : 'CheckSquare'} size={16} />
            {selectionMode ? 'Cancel selection' : 'Select multiple'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookmarkedResultsBar;
