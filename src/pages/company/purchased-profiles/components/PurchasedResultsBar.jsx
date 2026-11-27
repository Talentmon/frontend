import React, { useCallback, useState } from 'react';
import Icon from 'components/AppIcon';
import Popover from '../../bookmarked-candidates/components/Popover';
import bm from '../../bookmarked-candidates/styles/bookmarked.module.scss';
import ViewToggle from '../../candidate-search-dashboard/components/ViewToggle';
import ResultsCount from '../../candidate-filters/ResultsCount';
import TeamFilterMenu from '../../candidate-filters/TeamFilterMenu';
import { SORT_OPTIONS, sortLabel } from '../purchasedFilters';

/** Sort (the cards and the table share it): "Sort: Recently unlocked". */
export const SortMenu = ({ sortBy, onSortChange }) => {
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
      matchTrigger
      renderTrigger={(props) => (
        <button {...props} className={`${bm.toolBtn} ${open ? bm.toolBtnOpen : ''}`}>
          <span className={bm.toolBtnMuted}>Sort:</span>
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

/**
 * The bar above the cards: the count and how salaries are shown, then Unlocked
 * by (a team's), Sort and Cards / Table. `compact` (beside an open CV): the
 * tools take a row of their own, Cards / Table on the left, Unlocked by and
 * Sort on the right.
 */
const PurchasedResultsBar = ({
  shown,
  total,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  unlockers = [],
  unlockedBy = [],
  onUnlockedByChange,
  compact = false
}) => {
  // No switch where only the cards are offered (phones: no onViewModeChange).
  const view = onViewModeChange ? <ViewToggle value={viewMode} onChange={onViewModeChange} options={VIEW_OPTIONS} /> : null;
  return (
    <div className={bm.resultsBar}>
      <ResultsCount shown={shown} total={total} fill={compact} />
      <div className={`${bm.resultsTools} ${compact ? bm.resultsToolsRow : ''}`}>
        {compact && view}
        <div className={bm.resultsToolsGroup}>
          <TeamFilterMenu
            id="pp-unlocked-by"
            label="Unlocked by"
            items={unlockers}
            picked={unlockedBy}
            onChange={onUnlockedByChange}
            compact={compact}
          />
          <SortMenu sortBy={sortBy} onSortChange={onSortChange} />
        </div>
        {!compact && view}
      </div>
    </div>
  );
};

export default PurchasedResultsBar;
