import React from 'react';
import CandidateFilterSidebar from '../../candidate-filters/CandidateFilterSidebar';

/**
 * The filters beside an open CV (CandidateFilterSidebar, Search's layout):
 * Search's groups, Location open. (Saved by sits beside Sort, TeamFilterMenu.)
 */
const BookmarkedFilterSidebar = ({ filters, onFiltersChange, opts }) => (
  <CandidateFilterSidebar
    idPrefix="bm"
    filters={filters}
    onFiltersChange={onFiltersChange}
    opts={opts}
    defaultOpen={{ location: true }}
    notesLabel="With notes only"
  />
);

export default BookmarkedFilterSidebar;
