import React, { useCallback, useState } from 'react';
import Icon from 'components/AppIcon';
import ResultsCount from '../../candidate-filters/ResultsCount';
import TeamFilterMenu from '../../candidate-filters/TeamFilterMenu';
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

/**
 * "Showing 4 of 10 candidates" and how salaries are shown, with Saved by (a
 * team's), Sort, Reorder and Select multiple, right above the cards.
 * `compact` (beside an open CV): the tools take a row of their own, Reorder and
 * Select multiple as just their icons on the left, Saved by and Sort on the right.
 */
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
  onToggleSelectionMode,
  recruiters = [],
  savedBy = [],
  onSavedByChange,
  compact = false
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const closeSort = useCallback(() => setSortOpen(false), []);
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || SORT_OPTIONS[0].label;

  const reorderLabel = !reorderMode ? 'Reorder' : hasReordered ? 'Save order' : 'Cancel reorder';
  const reorderIcon = !reorderMode ? 'GripVertical' : hasReordered ? 'Check' : 'X';

  const menus = (
    <div className={styles.resultsToolsGroup}>
      <TeamFilterMenu
        id="bm-saved-by"
        label="Saved by"
        items={recruiters}
        picked={savedBy}
        onChange={onSavedByChange}
        compact={compact}
      />

      {/* Sorting is pinned to the drag order while reordering. */}
      <Popover
        id="bm-sort"
        label="Sort bookmarked candidates"
        role="listbox"
        open={sortOpen && !reorderMode}
        onToggle={() => setSortOpen((prev) => !prev)}
        onClose={closeSort}
        matchTrigger
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
    </div>
  );

  const actions = (
    <div className={styles.resultsToolsGroup}>
      {!selectionMode && (
        <button
          type="button"
          className={`${styles.toolBtn} ${reorderMode ? styles.toolBtnOn : ''}`}
          onClick={reorderMode && hasReordered ? onSaveOrder : onToggleReorderMode}
          title={compact ? reorderLabel : undefined}
        >
          <Icon name={reorderIcon} size={16} />
          <span className={compact ? styles.srOnly : undefined}>{reorderLabel}</span>
        </button>
      )}

      {!reorderMode && (
        <button
          type="button"
          className={`${styles.toolBtn} ${selectionMode ? styles.toolBtnOn : ''}`}
          onClick={onToggleSelectionMode}
          title={compact ? (selectionMode ? 'Cancel selection' : 'Select multiple') : undefined}
        >
          <Icon name={selectionMode ? 'X' : 'CheckSquare'} size={16} />
          <span className={compact ? styles.srOnly : undefined}>{selectionMode ? 'Cancel selection' : 'Select multiple'}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className={styles.resultsBar}>
      <ResultsCount shown={shown} total={total} fill={compact} />

      <div className={`${styles.resultsTools} ${compact ? styles.resultsToolsRow : ''}`}>
        {compact ? (
          <>
            {actions}
            {menus}
          </>
        ) : (
          <>
            {menus}
            {actions}
          </>
        )}
      </div>
    </div>
  );
};

export default BookmarkedResultsBar;
