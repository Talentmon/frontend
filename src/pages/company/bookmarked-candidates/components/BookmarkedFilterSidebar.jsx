import React from 'react';
import Select from 'components/ui/Select';
import CandidateFilterSidebar from '../../candidate-filters/CandidateFilterSidebar';
import { SideField } from '../../candidate-filters/commonFields';

/**
 * The filters beside an open CV (CandidateFilterSidebar, Search's layout):
 * Saved by first for a team (open), then Search's groups (Location open
 * otherwise).
 */
const BookmarkedFilterSidebar = ({ filters, onFiltersChange, opts, recruiterOptions = [] }) => {
  const hasTeam = recruiterOptions.length > 1;
  const recruiterLabel = (id) => recruiterOptions.find((o) => o.value === id)?.label || 'teammate';

  const leadGroups = hasTeam
    ? [
        {
          id: 'savedBy',
          title: 'Saved by',
          count: filters.savedBy.length,
          summary: filters.savedBy.map(recruiterLabel),
          clear: { savedBy: [] },
          body: (
            <SideField id="bm-f-saved-by" label="Saved by" hideLabel>
              <Select
                id="bm-f-saved-by"
                options={recruiterOptions.map(({ value, label }) => ({ value, label }))}
                value={filters.savedBy}
                onChange={(value) => onFiltersChange({ ...filters, savedBy: value })}
                placeholder="Anyone on the team"
                multiple
              />
            </SideField>
          )
        }
      ]
    : [];

  return (
    <CandidateFilterSidebar
      idPrefix="bm"
      filters={filters}
      onFiltersChange={onFiltersChange}
      opts={opts}
      leadGroups={leadGroups}
      defaultOpen={hasTeam ? { savedBy: true } : { location: true }}
      notesLabel="With notes only"
    />
  );
};

export default BookmarkedFilterSidebar;
