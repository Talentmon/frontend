import React from 'react';
import CandidateFilterBar from '../../candidate-filters/CandidateFilterBar';
import BookmarkedFilterSidebar from './BookmarkedFilterSidebar';

/**
 * The filter bar above the cards (CandidateFilterBar, shared with Purchased):
 * Search's filters; five show, "More filters" holds the rest. Lists offer only
 * what the bookmarked candidates have, with how many have it. Whatever is on
 * shows as a chip below, each removable, plus Clear all.
 * (Saved by sits beside Sort, TeamFilterMenu. Beside an open CV,
 * BookmarkedFilterSidebar takes this bar's place; on phones and small
 * tablets the bar slides it in.)
 */
const BookmarkedCandidatesFilters = ({ filters, onFiltersChange, onClearFilters, opts }) => (
  <CandidateFilterBar
    idPrefix="bm"
    filters={filters}
    onFiltersChange={onFiltersChange}
    onClearAll={onClearFilters}
    opts={opts}
    searchLabel="Search bookmarked candidates"
    searchPlaceholder="Search by position, skills, location…"
    notesLabel="With notes only"
    renderSidebar={(slide) => (
      <BookmarkedFilterSidebar filters={filters} onFiltersChange={onFiltersChange} opts={opts} slideIn {...slide} />
    )}
  />
);

export default BookmarkedCandidatesFilters;
