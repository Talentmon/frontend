import React from 'react';
import Select from 'components/ui/Select';
import { Checkbox } from 'components/ui/Checkbox';
import CandidateFilterSidebar from '../../candidate-filters/CandidateFilterSidebar';
import { SideField, toOptions } from '../../candidate-filters/commonFields';
import { optionLabel, toggleIn } from '../../candidate-filters/commonFilters';
import cf from '../../candidate-filters/candidateFilters.module.scss';
import { STATUS_KEYS } from '../purchasesApi';
import { UNLOCKED_OPTIONS, filterOptions } from '../purchasedFilters';
import { STATUS_LABELS } from './PurchasedFilters';
import styles from '../styles/purchased.module.scss';

const STATUS_TONES = { new: 'sNew', contacted: 'sContacted', interviewed: 'sInterviewed', hired: 'sHired', rejected: 'sRejected' };

/**
 * The filters beside an open CV (CandidateFilterSidebar, Search's layout):
 * Purchased's own groups first — Status (the stages, each with its dot and
 * count; open), "Hiring for" (one position, as in the pipeline) and Unlocked
 * (by whom, for a team, and when) — then Search's.
 */
const PurchasedFilterSidebar = ({ filters, onFiltersChange, profiles = [] }) => {
  const opts = filterOptions(profiles);
  const set = (key, value) => onFiltersChange({ ...filters, [key]: value });
  const hasTeam = opts.unlockers.length > 1;
  const unlockerLabel = (id) => opts.unlockers.find((o) => o.value === id)?.label || 'teammate';
  // A pick that's no longer on offer stays listed while it's picked.
  const unlockedOptions = UNLOCKED_OPTIONS.filter(({ value }) => opts.unlockedCounts[value] || value === filters.unlocked);

  const leadGroups = [
    {
      id: 'status',
      title: 'Status',
      count: filters.statuses.length,
      summary: filters.statuses.map((key) => STATUS_LABELS[key]),
      clear: { statuses: [] },
      body: (
        <div role="group" aria-label="Status" className={cf.sideChecks}>
          {STATUS_KEYS.map((key) => {
            const count = opts.stageCounts[key] || 0;
            const checked = filters.statuses.includes(key);
            return (
              <Checkbox
                key={key}
                id={`pp-f-status-${key}`}
                className={cf.sideCheck}
                checked={checked}
                disabled={count === 0 && !checked}
                onChange={() => set('statuses', toggleIn(filters.statuses, key))}
                label={(
                  <span className={cf.sideOpt}>
                    <span className={`${styles.tDot} ${styles[STATUS_TONES[key]]}`} aria-hidden="true" />
                    {STATUS_LABELS[key]}
                    <span className={cf.sideOptCount}>{count}</span>
                  </span>
                )}
              />
            );
          })}
        </div>
      )
    },
    // Shows once a card has a position.
    (opts.positions.length > 0 || filters.hiringFor.length > 0) && {
      id: 'hiringFor',
      title: 'Hiring for',
      count: filters.hiringFor.length,
      summary: filters.hiringFor,
      clear: { hiringFor: [] },
      body: (
        <SideField id="pp-f-hiring-for" label="Hiring for" hideLabel>
          <Select
            id="pp-f-hiring-for"
            options={[{ value: '', label: 'All positions' }, ...toOptions(opts.positions)]}
            value={filters.hiringFor[0] || ''}
            onChange={(value) => set('hiringFor', value ? [value] : [])}
            placeholder="All positions"
          />
        </SideField>
      )
    },
    {
      id: 'unlocked',
      title: 'Unlocked',
      count: (filters.unlocked ? 1 : 0) + filters.unlockedBy.length,
      summary: [...filters.unlockedBy.map(unlockerLabel), filters.unlocked && optionLabel(UNLOCKED_OPTIONS, filters.unlocked)].filter(Boolean),
      clear: { unlocked: '', unlockedBy: [] },
      body: (
        <>
          {hasTeam && (
            <SideField id="pp-f-unlocked-by" label="By">
              <Select
                id="pp-f-unlocked-by"
                options={opts.unlockers.map(({ value, label }) => ({ value, label }))}
                value={filters.unlockedBy}
                onChange={(value) => set('unlockedBy', value)}
                placeholder="Anyone on the team"
                multiple
              />
            </SideField>
          )}
          <SideField id="pp-f-unlocked" label="When" hideLabel={!hasTeam}>
            <Select
              id="pp-f-unlocked"
              options={[{ value: '', label: 'Any time' }, ...unlockedOptions]}
              value={filters.unlocked}
              onChange={(value) => set('unlocked', value)}
              placeholder="Any time"
            />
          </SideField>
        </>
      )
    }
  ].filter(Boolean);

  return (
    <CandidateFilterSidebar
      idPrefix="pp"
      filters={filters}
      onFiltersChange={onFiltersChange}
      opts={opts}
      leadGroups={leadGroups}
      defaultOpen={{ status: true }}
    />
  );
};

export default PurchasedFilterSidebar;
