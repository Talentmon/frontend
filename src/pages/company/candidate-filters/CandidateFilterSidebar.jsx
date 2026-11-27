import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import { Checkbox } from 'components/ui/Checkbox';
import ds from '../candidate-search-dashboard/styles/dashboard.module.scss';
import cf from './candidateFilters.module.scss';
import { commonFields } from './commonFields';
import { useSalaryView } from 'lib/salaryView';

// Search's groups (FilterSidebar.jsx), with the fields Bookmarked and Purchased share.
const SIDE_GROUPS = [
  { id: 'location', title: 'Location', keys: ['location'] },
  { id: 'salary', title: 'Salary', keys: ['salary'] },
  { id: 'experience', title: 'Experience & Education', keys: ['experience', 'education'] },
  { id: 'skills', title: 'Skills', keys: ['skills'] },
  { id: 'languages', title: 'Languages', keys: ['languages'] },
  { id: 'industry', title: 'Industry', keys: ['industry'] },
  { id: 'certificates', title: 'Certifications', keys: ['certificates'] },
  { id: 'preferences', title: 'Preferences', keys: ['preferences'] }
];

// What a collapsed group lists under its title, e.g. "React, TypeScript +1" (as on Search).
const summaryOf = (items) => (items.length > 2 ? `${items.slice(0, 2).join(', ')} +${items.length - 2}` : items.join(', '));

/**
 * The filters beside an open CV, laid out like Search's sidebar: a card with
 * "Filters", how many are on and Clear all, then groups that fold open, each
 * with its count, a Clear while open and what's set while closed; With notes
 * in the footer under a line (where Search has Save filter), so the groups
 * scroll above it and the card always ends the same way. The page's own groups (`leadGroups`: { id, title, count,
 * summary, clear, body }) come first, then Search's. The lists offer only what
 * the candidates on the page have. Clear all leaves the search alone. On phones
 * and small tablets the same card slides in from the bar (CandidateFilterBar).
 */
const CandidateFilterSidebar = ({
  idPrefix,
  filters,
  onFiltersChange,
  opts,
  leadGroups = [],
  defaultOpen = {},
  notesLabel = 'With notes',
  // Phones and small tablets (CandidateFilterBar): the card slides in over the
  // page from the left, as Search's does; `open` says whether it's out, and
  // `onClose` puts a < in its title that slides it back.
  slideIn = false,
  open = false,
  onClose
}) => {
  const [openGroups, setOpenGroups] = useState(defaultOpen);
  const [salaryView] = useSalaryView();
  const fieldsByKey = Object.fromEntries(
    commonFields({ filters, onFiltersChange, opts, idPrefix: `${idPrefix}-f`, salaryView }).map((field) => [field.key, field])
  );

  const commonGroups = SIDE_GROUPS.map((group) => {
    const fields = group.keys.map((key) => fieldsByKey[key]).filter(Boolean);
    if (!fields.length) return null;
    return {
      id: group.id,
      title: fields.length === 1 ? group.title.split(' & ')[0] : group.title,
      count: fields.reduce((sum, field) => sum + field.count, 0),
      summary: fields.flatMap((field) => field.summary),
      clear: Object.assign({}, ...fields.map((field) => field.clear)),
      body: fields.map((field) => <React.Fragment key={field.key}>{field.side(fields.length === 1)}</React.Fragment>)
    };
  }).filter(Boolean);

  const groups = [...leadGroups, ...commonGroups];
  const total = groups.reduce((sum, group) => sum + group.count, 0) + (filters.hasNotes ? 1 : 0);

  const clearAll = () => onFiltersChange({ ...filters, ...Object.assign({}, ...groups.map((group) => group.clear)), hasNotes: false });

  // Empties just that group and hands focus back to its title (as on Search).
  const clearGroup = (group) => {
    onFiltersChange({ ...filters, ...group.clear });
    document.getElementById(`${idPrefix}-fgroup-toggle-${group.id}`)?.focus();
  };

  const toggleGroup = (id) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section
      className={`${ds.filters} ${cf.sidebarCard} ${slideIn && !open ? ds.collapsed : ''}`}
      aria-labelledby={`${idPrefix}-filters-title`}
      inert={slideIn && !open ? '' : undefined}
    >
      <div className={ds.filtersHead}>
        <div className={ds.filtersHeadRow}>
          <div className={ds.filtersHeadTitle}>
            <Icon name="Filter" size={18} />
            <h2 id={`${idPrefix}-filters-title`}>Filters</h2>
            {total > 0 && <div className={ds.filtersHeadBadge}>{total}</div>}
          </div>
          <div className={ds.filtersHeadActions}>
            <button type="button" onClick={clearAll} disabled={total === 0} className={ds.filtersClear}>
              Clear all
            </button>
            {onClose && (
              <button type="button" onClick={onClose} className={ds.filtersHeadCollapse} aria-label="Close filters">
                <span className={ds.filtersChevron}>
                  <Icon name="ChevronLeft" size={18} strokeWidth={2.2} />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={ds.filtersBody}>
        {groups.map((group) => {
          const isOpen = !!openGroups[group.id];
          const bodyId = `${idPrefix}-fgroup-${group.id}`;
          // Summary, Clear and the fields stay in the page either way and fold /
          // fade with the group (as on Search); while closed, the fields are inert.
          const hasActive = group.count > 0;
          return (
            <div className={`${ds.fgroup} ${isOpen ? ds.fgroupOpen : ''}`} key={group.id}>
              <h3 className={`${ds.fgroupHead} ${isOpen ? ds.fgroupHeadOpen : ''}`}>
                <button
                  type="button"
                  id={`${idPrefix}-fgroup-toggle-${group.id}`}
                  className={ds.fgroupToggle}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                >
                  <span className={ds.fgroupRow}>
                    <span className={ds.fgroupTitle}>{group.title}</span>
                    {hasActive && <span className={ds.fgroupCount}>{group.count}</span>}
                    {/* keeps room for the absolutely placed Clear button */}
                    {hasActive && <span className={ds.fgroupClearSpace} aria-hidden="true" />}
                    <Icon name="ChevronDown" size={16} strokeWidth={2.2} className={ds.fgroupChevron} />
                  </span>
                  {hasActive && (
                    <span className={ds.fgroupSummaryFold} aria-hidden={isOpen || undefined}>
                      <span className={ds.fgroupSummary}>{summaryOf(group.summary)}</span>
                    </span>
                  )}
                </button>
                {hasActive && (
                  <button
                    type="button"
                    className={ds.fgroupClear}
                    onClick={() => clearGroup(group)}
                    aria-label={`Clear ${group.title} filters`}
                  >
                    Clear
                  </button>
                )}
              </h3>
              <div className={ds.fgroupFold} inert={isOpen ? undefined : ''}>
                <div className={ds.fgroupFoldInner}>
                  <div className={ds.fgroupBody} id={bodyId}>
                    {group.body}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`${ds.filtersFoot} ${cf.sideFoot}`}>
        <Checkbox
          id={`${idPrefix}-f-notes`}
          className={ds.checkRow}
          label={notesLabel}
          checked={filters.hasNotes}
          onChange={() => onFiltersChange({ ...filters, hasNotes: !filters.hasNotes })}
        />
      </div>
    </section>
  );
};

export default CandidateFilterSidebar;
