import React from 'react';
import CandidateFilterSidebar from '../../candidate-filters/CandidateFilterSidebar';

/**
 * The filters beside an open CV (CandidateFilterSidebar, Search's layout):
 * Search's groups, Location open. (Saved by sits beside Sort, TeamFilterMenu.)
 * Phones and small tablets slide the same card in from the bar (`slide`).
 */
const BookmarkedFilterSidebar = ({ filters, onFiltersChange, opts, ...slide }) => (
  <CandidateFilterSidebar
    idPrefix="bm"
    filters={filters}
    onFiltersChange={onFiltersChange}
    opts={opts}
    defaultOpen={{ location: true }}
    notesLabel="With notes only"
    {...slide}
  />
);

export default BookmarkedFilterSidebar;
