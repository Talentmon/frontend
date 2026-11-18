import React from 'react';
import Icon from 'components/AppIcon';

import Select from 'components/ui/Select';
import Button from 'components/ui/Button';
import { salaryViewLabel, useSalaryView } from 'lib/salaryView';
import styles from '../styles/dashboard.module.scss';

// Newest first by default. (No "Relevance": it only meant a more complete profile first.)
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'experience', label: 'Experience (descending)' },
  { value: 'experience_asc', label: 'Experience (ascending)' },
  { value: 'salary', label: 'Salary (descending)' },
  { value: 'salary_asc', label: 'Salary (ascending)' }
];

/** Above the results: how many were found (counted once per search), sort, grid / list. Everything else is in the filters. */
const SearchToolbar = ({
  sortBy = 'newest',
  onSortChange = () => {},
  viewMode = 'grid',
  onViewModeChange = () => {},
  resultsCount = 0,
  isFilterCollapsed = false,
  onToggleFilters = () => {}
}) => {
  // The cards show bare amounts; this says once how they're shown (follows the Salary filter).
  const [salaryView] = useSalaryView();

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarRow}>
        {/* Results Count */}
        <div className={styles.resultsInfo}>
          <div className={styles.resultsCount}>
            Found <b>{resultsCount}</b> candidates
            <span className={styles.resultsSalary}> · Salaries: {salaryViewLabel(salaryView)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.toolbarControls}>
          {/* Filters Toggle (small screens) */}
          <button
            onClick={onToggleFilters}
            className={styles.filtersToggleBtn}
            aria-label={isFilterCollapsed ? 'Show filters' : 'Hide filters'}
          >
            <Icon name="Filter" size={16} />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className={styles.sortDesktop}>
            <Select
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={onSortChange}
              placeholder="Sort by"
              aria-label="Sort by"
              className="min-w-48"
            />
          </div>

          {/* View Mode Toggle */}
          <div className={styles.viewToggle}>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.on : ''}`}
              aria-label="Grid view"
            >
              <Icon name="Grid3X3" size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`${styles.viewToggleBtn} ${styles.viewToggleListBtn} ${viewMode === 'list' ? styles.on : ''}`}
              aria-label="List view"
            >
              <Icon name="List" size={18} />
            </button>
          </div>

          {/* Mobile Sort Button */}
          <div className={styles.sortMobileBtn}>
            <Button
              variant="outline"
              size="sm"
              iconName="ArrowUpDown"
              iconSize={16}
            >
              Sort
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchToolbar;
