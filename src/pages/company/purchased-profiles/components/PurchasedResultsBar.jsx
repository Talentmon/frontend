import React, { useCallback, useState } from 'react';
import Icon from 'components/AppIcon';
import Popover from '../../bookmarked-candidates/components/Popover';
import bm from '../../bookmarked-candidates/styles/bookmarked.module.scss';
import { SORT_OPTIONS, sortLabel } from '../purchasedFilters';
import styles from '../styles/purchased.module.scss';

/** Sort (the cards and the table share it). */
// `compact` (beside an open CV): just the sort's name on the button, as Search's Sort shows it.
export const SortMenu = ({ sortBy, onSortChange, compact = false }) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <Popover
      id="pp-sort"
      label="Sort unlocked candidates"
      role="listbox"
      open={open}
      onToggle={() => setOpen((prev) => !prev)}
      onClose={close}
      align="right"
      width={220}
      renderTrigger={(props) => (
        <button {...props} className={`${bm.toolBtn} ${open ? bm.toolBtnOpen : ''}`}>
          <span className={compact ? bm.srOnly : bm.toolBtnMuted}>Sort:</span>
          <span className={bm.toolBtnStrong}>{sortLabel(sortBy)}</span>
          <Icon name="ChevronDown" size={14} strokeWidth={2.2} className={bm.pillChevron} />
        </button>
      )}
    >
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={option.value === sortBy}
          className={`${bm.menuOption} ${option.value === sortBy ? bm.menuOptionSelected : ''}`}
          onClick={() => {
            onSortChange(option.value);
            close();
            document.getElementById('pp-sort-trigger')?.focus();
          }}
        >
          {option.label}
        </button>
      ))}
    </Popover>
  );
};

/** Cards / Table. */
export const ViewToggle = ({ viewMode, onViewModeChange }) => (
  <div className={styles.viewSeg} role="group" aria-label="View">
    <button
      type="button"
      className={viewMode === 'cards' ? styles.on : ''}
      onClick={() => onViewModeChange('cards')}
      aria-label="Cards"
      aria-pressed={viewMode === 'cards'}
      title="Cards"
    >
      <Icon name="LayoutGrid" size={16} />
    </button>
    <button
      type="button"
      className={viewMode === 'table' ? styles.on : ''}
      onClick={() => onViewModeChange('table')}
      aria-label="Table"
      aria-pressed={viewMode === 'table'}
      title="Table"
    >
      <Icon name="List" size={16} />
    </button>
  </div>
);

/** "Showing 3 of 5 candidates". */
export const ResultsCount = ({ shown, total, className = bm.resultsCount }) => (
  <p role="status" className={className}>
    Showing <strong>{shown}</strong> of {total} candidate{total === 1 ? '' : 's'}
  </p>
);

/** The wide page's bar above the cards: the count, then Sort and Cards / Table. */
const PurchasedResultsBar = ({ shown, total, sortBy, onSortChange, viewMode, onViewModeChange, compact = false }) => (
  <div className={bm.resultsBar}>
    <ResultsCount shown={shown} total={total} />
    <div className={bm.resultsTools}>
      <SortMenu sortBy={sortBy} onSortChange={onSortChange} compact={compact} />
      <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </div>
  </div>
);

export default PurchasedResultsBar;
