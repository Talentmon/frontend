import React, { useCallback, useState } from 'react';
import Icon from 'components/AppIcon';
import Popover from '../../bookmarked-candidates/components/Popover';
import bm from '../../bookmarked-candidates/styles/bookmarked.module.scss';
import SalaryViewMenu from '../../candidate-search-dashboard/components/SalaryViewMenu';
import ViewToggle from '../../candidate-search-dashboard/components/ViewToggle';
import ds from '../../candidate-search-dashboard/styles/dashboard.module.scss';
import { SORT_OPTIONS, sortLabel } from '../purchasedFilters';

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

// Cards / Table, the same switch as Search's.
const VIEW_OPTIONS = [
  { value: 'cards', label: 'Cards', icon: 'LayoutGrid' },
  { value: 'table', label: 'Table', icon: 'List' }
];

/** "Showing 3 of 5 candidates", then how salaries are shown (the cards show bare amounts). */
export const ResultsCount = ({ shown, total, className = bm.resultsCount, compact = false }) => (
  <div className={ds.resultsInfo}>
    <p role="status" className={className}>
      Showing <strong>{shown}</strong> of {total} candidate{total === 1 ? '' : 's'}
    </p>
    <span className={ds.resultsDivider} aria-hidden="true" />
    <SalaryViewMenu compact={compact} />
  </div>
);

/** The wide page's bar above the cards: the count and how salaries are shown, then Sort and Cards / Table. */
const PurchasedResultsBar = ({ shown, total, sortBy, onSortChange, viewMode, onViewModeChange, compact = false }) => (
  <div className={bm.resultsBar}>
    <ResultsCount shown={shown} total={total} compact={compact} />
    <div className={bm.resultsTools}>
      <SortMenu sortBy={sortBy} onSortChange={onSortChange} compact={compact} />
      <ViewToggle value={viewMode} onChange={onViewModeChange} options={VIEW_OPTIONS} />
    </div>
  </div>
);

export default PurchasedResultsBar;
