import React from 'react';
import CandidateFilterBar, { FilterChip } from '../../candidate-filters/CandidateFilterBar';
import { RadioList } from '../../candidate-filters/commonFields';
import { optionLabel, toggleIn } from '../../candidate-filters/commonFilters';
import { UNLOCKED_OPTIONS, filterOptions } from '../purchasedFilters';

export const STATUS_LABELS = { new: 'New', contacted: 'Contacted', interviewed: 'Interviewed', hired: 'Hired', rejected: 'Rejected' };

/**
 * Needs attention (set from the pipeline's Review) as a chip. Beside an open
 * CV the pipeline is hidden and the sidebar has no such filter, so it shows
 * over the cards while it's on.
 */
export const AttentionChip = ({ filters, onFiltersChange, className = '' }) =>
  filters.attention ? (
    <div className={className}>
      <FilterChip label="Needs attention" onRemove={() => onFiltersChange({ ...filters, attention: false })} />
    </div>
  ) : null;

/**
 * The filter bar above the unlocked candidates (CandidateFilterBar, shared
 * with Bookmarked): Unlocked, then Search's filters; five show, "More
 * filters" holds the rest. The stage and the position are picked in the
 * pipeline above; they show here as chips. (Unlocked by sits beside Sort,
 * TeamFilterMenu. Beside an open CV, PurchasedFilterSidebar takes this bar's place.)
 */
const PurchasedFilters = ({ filters, onFiltersChange, onClearFilters, profiles = [] }) => {
  const opts = filterOptions(profiles);
  const set = (key, value) => onFiltersChange({ ...filters, [key]: value });

  const leadFields = ({ onRadioPicked }) => [
    {
      key: 'unlocked',
      label: 'Unlocked',
      count: filters.unlocked ? 1 : 0,
      chips: filters.unlocked
        ? [{ key: 'unlocked', label: `Unlocked: ${optionLabel(UNLOCKED_OPTIONS, filters.unlocked).toLowerCase()}`, onRemove: () => set('unlocked', '') }]
        : [],
      pill: {
        width: 240,
        body: (
          <RadioList
            label="Unlocked"
            anyLabel="Any time"
            options={UNLOCKED_OPTIONS}
            counts={opts.unlockedCounts}
            total={opts.total}
            value={filters.unlocked}
            onPick={(value) => {
              set('unlocked', value);
              onRadioPicked('unlocked');
            }}
          />
        )
      }
    }
  ].filter(Boolean);

  const leadChips = [
    ...filters.hiringFor.map((name) => ({
      key: `for-${name}`,
      label: `Hiring for: ${name}`,
      onRemove: () => set('hiringFor', toggleIn(filters.hiringFor, name))
    })),
    ...filters.statuses.map((stage) => ({
      key: `st-${stage}`,
      label: `Status: ${STATUS_LABELS[stage]}`,
      onRemove: () => set('statuses', toggleIn(filters.statuses, stage))
    })),
    ...(filters.attention ? [{ key: 'attention', label: 'Needs attention', onRemove: () => set('attention', false) }] : [])
  ];

  return (
    <CandidateFilterBar
      idPrefix="pp"
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearAll={onClearFilters}
      opts={opts}
      leadFields={leadFields}
      leadChips={leadChips}
      searchLabel="Search unlocked candidates"
      searchPlaceholder="Name, email, phone, skills, notes…"
    />
  );
};

export default PurchasedFilters;
