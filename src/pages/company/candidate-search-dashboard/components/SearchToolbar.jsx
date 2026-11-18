import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import SalaryViewMenu from './SalaryViewMenu';
import ViewToggle from './ViewToggle';
import styles from '../styles/dashboard.module.scss';

// Newest first by default. (No "Relevance": it only meant a more complete profile first.)
// `group` puts a line between kinds; `short` is what the closed button shows.
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first', short: 'Newest', icon: 'Clock', group: 0 },
  { value: 'experience', label: 'Most experience first', short: 'Most experience', icon: 'Briefcase', group: 1 },
  { value: 'experience_asc', label: 'Least experience first', short: 'Least experience', icon: 'Briefcase', group: 1 },
  { value: 'salary', label: 'Highest salary first', short: 'Highest salary', icon: 'Coins', group: 2 },
  { value: 'salary_asc', label: 'Lowest salary first', short: 'Lowest salary', icon: 'Coins', group: 2 }
];

// List rows need room: below 1000px only the cards are offered (viewToggleListBtn).
const VIEW_OPTIONS = [
  { value: 'grid', label: 'Card view', icon: 'LayoutGrid' },
  { value: 'list', label: 'List view', icon: 'List', className: styles.viewToggleListBtn }
];

/** Closes a menu on a press anywhere outside `rootRef` while `open`. */
const useCloseOutside = (open, rootRef, close) => {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, rootRef, close]);
};

/** "Sort by Newest ▾": a listbox; arrows, Home / End and Enter work from the button. */
const SortMenu = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const close = useRef(() => setOpen(false)).current;
  useCloseOutside(open, rootRef, close);

  const current = Math.max(0, SORT_OPTIONS.findIndex((o) => o.value === value));
  const openMenu = () => {
    setActive(current);
    setOpen(true);
  };
  const pick = (next) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (next !== value) onChange(next);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    const at = active >= 0 ? active : current;
    const last = SORT_OPTIONS.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(last, at + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, at - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(SORT_OPTIONS[at].value); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className={styles.menuRoot} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        id="sort-btn"
        className={styles.sortTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="sort-list"
        aria-activedescendant={open && active >= 0 ? `sort-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <Icon name="ArrowUpDown" size={16} aria-hidden="true" />
        <span className={styles.barMuted}>Sort by</span>
        <span className={styles.sortValue}>{SORT_OPTIONS[current].short}</span>
        <Icon name="ChevronDown" size={15} strokeWidth={2.4} className={styles.barChevron} aria-hidden="true" />
      </button>
      {open && (
        <div id="sort-list" role="listbox" aria-label="Sort candidates" className={styles.sortList}>
          {SORT_OPTIONS.map((option, i) => (
            <React.Fragment key={option.value}>
              {i > 0 && SORT_OPTIONS[i - 1].group !== option.group && <div role="presentation" className={styles.sortSep} />}
              <button
                type="button"
                id={`sort-opt-${i}`}
                role="option"
                tabIndex={-1}
                aria-selected={option.value === value}
                className={`${styles.sortOption} ${i === active ? styles.sortOptionActive : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(option.value)}
              >
                <span className={styles.sortOptionIcon} aria-hidden="true">
                  <Icon name={option.icon} size={16} />
                </span>
                <span className={styles.sortOptionLabel}>{option.label}</span>
                <span className={styles.sortOptionCheck} aria-hidden="true">
                  <Icon name="Check" size={16} strokeWidth={2.6} />
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Above the results: "9 candidates found" (counted once per search) and how
 * salaries are shown, then sort, and cards / list. Everything else is in the filters.
 */
const SearchToolbar = ({
  sortBy = 'newest',
  onSortChange = () => {},
  viewMode = 'grid',
  onViewModeChange = () => {},
  resultsCount = 0,
  isFilterCollapsed = false,
  onToggleFilters = () => {}
}) => (
  <div className={styles.toolbar}>
    <div className={styles.toolbarRow}>
      <div className={styles.resultsInfo}>
        <p role="status" className={styles.resultsCount}>
          <strong>{resultsCount}</strong>
          {resultsCount === 1 ? 'candidate found' : 'candidates found'}
        </p>
        <span className={styles.resultsDivider} aria-hidden="true" />
        <SalaryViewMenu />
      </div>

      <div className={styles.toolbarControls}>
        {/* Filters toggle (small screens) */}
        <button
          type="button"
          onClick={onToggleFilters}
          className={styles.filtersToggleBtn}
          aria-label={isFilterCollapsed ? 'Show filters' : 'Hide filters'}
        >
          <Icon name="Filter" size={16} />
          <span>Filters</span>
        </button>

        <SortMenu value={sortBy} onChange={onSortChange} />

        <ViewToggle value={viewMode} onChange={onViewModeChange} options={VIEW_OPTIONS} />
      </div>
    </div>
  </div>
);

export default SearchToolbar;
