import React from 'react';
import CandidateFilterBar from '../../candidate-filters/CandidateFilterBar';
import { CheckList } from '../../candidate-filters/commonFields';
import { toggleIn } from '../../candidate-filters/commonFilters';

/**
 * The filter bar above the cards (CandidateFilterBar, shared with Purchased):
 * Saved by first (a team's, once two or more teammates have saved), then
 * Search's filters; five show, "More filters" holds the rest. Lists offer only
 * what the bookmarked candidates have, with how many have it. Whatever is on
 * shows as a chip below, each removable, plus Clear all.
 * (Beside an open CV, BookmarkedFilterSidebar takes its place.)
 */
const BookmarkedCandidatesFilters = ({ filters, onFiltersChange, onClearFilters, opts, recruiterOptions = [] }) => {
  const recruiterLabel = (id) => recruiterOptions.find((o) => o.value === id)?.label || 'teammate';
  const setSavedBy = (savedBy) => onFiltersChange({ ...filters, savedBy });

  const leadFields = () =>
    recruiterOptions.length > 1
      ? [
          {
            key: 'savedby',
            label: 'Saved by',
            count: filters.savedBy.length,
            chips: filters.savedBy.map((id) => ({
              key: `by-${id}`,
              label: `Saved by ${recruiterLabel(id)}`,
              onRemove: () => setSavedBy(toggleIn(filters.savedBy, id))
            })),
            pill: {
              width: 260,
              body: (
                <CheckList
                  label="Saved by"
                  items={recruiterOptions}
                  picked={filters.savedBy}
                  onToggle={(id) => setSavedBy(toggleIn(filters.savedBy, id))}
                />
              )
            }
          }
        ]
      : [];

  return (
    <CandidateFilterBar
      idPrefix="bm"
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearAll={onClearFilters}
      opts={opts}
      leadFields={leadFields}
      searchLabel="Search bookmarked candidates"
      searchPlaceholder="Search by position, skills, location…"
      notesLabel="With notes only"
    />
  );
};

export default BookmarkedCandidatesFilters;
