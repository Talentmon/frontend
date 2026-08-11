import React from 'react';
import Icon from 'components/AppIcon';

import Select from 'components/ui/Select';
import Button from 'components/ui/Button';
import styles from '../styles/dashboard.module.scss';

const SearchToolbar = ({
  searchQuery = '',
  onSearchChange = () => {},
  sortBy = 'relevance',
  onSortChange = () => {},
  viewMode = 'grid',
  onViewModeChange = () => {},
  resultsCount = 0,
  onClearSearch = () => {},
  isFilterCollapsed = false,
  onToggleFilters = () => {}
}) => {
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'experience', label: 'Experience (descending)' },
    { value: 'experience_asc', label: 'Experience (ascending)' },
    { value: 'salary', label: 'Salary (descending)' },
    { value: 'salary_asc', label: 'Salary (ascending)' },
    { value: 'newest', label: 'Newest' }
  ];

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
  };

  return (
    <div className={styles.toolbar}>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit}>
        <div className={styles.searchbar}>
          <Icon name="Search" size={20} />
          <input
            type="text"
            placeholder="Search candidates by position, skills, location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e?.target?.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className={styles.searchClear}
              aria-label="Clear search"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
      </form>
      {/* Toolbar */}
      <div className={styles.toolbarRow}>
        {/* Results Count */}
        <div className={styles.resultsInfo}>
          <div className={styles.resultsCount}>
            Found <b>{resultsCount}</b> candidates
          </div>

          {searchQuery && (
            <div className={styles.queryPill}>
              <span>for: "{searchQuery}"</span>
              <button
                onClick={onClearSearch}
                aria-label="Remove filter"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
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
              options={sortOptions}
              value={sortBy}
              onChange={onSortChange}
              placeholder="Sort by"
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
