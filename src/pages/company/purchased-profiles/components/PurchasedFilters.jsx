import React from 'react';
import CandidateFilterBar, { FilterChip } from '../../candidate-filters/CandidateFilterBar';
import { CheckList, RadioList } from '../../candidate-filters/commonFields';
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
 * with Bookmarked): Unlocked by (a team's, first) and Unlocked, then Search's
 * filters; five show, "More filters" holds the rest. The stage and the
 * position are picked in the pipeline above; they show here as chips.
 * (Beside an open CV, PurchasedFilterSidebar takes its place.)
 */
const PurchasedFilters = ({ filters, onFiltersChange, onClearFilters, profiles = [] }) => {
  const opts = filterOptions(profiles);
  const set = (key, value) => onFiltersChange({ ...filters, [key]: value });
  const unlockerLabel = (id) => opts.unlockers.find((o) => o.value === id)?.label || 'teammate';

  const leadFields = ({ onRadioPicked }) => [
    // Once two or more teammates have unlocked.
    opts.unlockers.length > 1 && {
      key: 'unlockedby',
      label: 'Unlocked by',
      count: filters.unlockedBy.length,
      chips: filters.unlockedBy.map((id) => ({
        key: `by-${id}`,
        label: `Unlocked by ${unlockerLabel(id)}`,
        onRemove: () => set('unlockedBy', toggleIn(filters.unlockedBy, id))
      })),
      pill: {
        width: 260,
        body: (
          <CheckList
            label="Unlocked by"
            items={opts.unlockers}
            picked={filters.unlockedBy}
            onToggle={(id) => set('unlockedBy', toggleIn(filters.unlockedBy, id))}
          />
        )
      }
    },
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
