import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from 'components/AppIcon';
import Popover, { CheckBox } from '../bookmarked-candidates/components/Popover';
import bm from '../bookmarked-candidates/styles/bookmarked.module.scss';
import ds from '../candidate-search-dashboard/styles/dashboard.module.scss';
import cf from './candidateFilters.module.scss';
import { commonFields } from './commonFields';
import { useMinWidth } from './cvLayout';
import { useSalaryView } from 'lib/salaryView';

// As on Search: narrower than this, the filters slide in over the page.
const PILLS_MIN = 846;
const PHONE_MAX = 480;

/** The text search over the list. */
export const ListSearch = ({ id, label, placeholder, value, onChange, className = '' }) => {
  const clear = () => {
    onChange('');
    document.getElementById(id)?.focus();
  };
  return (
    <div className={`${bm.fbarSearch} ${className}`}>
      <label htmlFor={id} className={bm.srOnly}>{label}</label>
      <Icon name="Search" size={18} className={bm.fbarSearchIcon} />
      <input id={id} type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e?.target?.value)} />
      {value && (
        <button type="button" className={bm.fbarSearchClear} aria-label="Clear search" onClick={clear}>
          <Icon name="X" size={14} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};

/** A removable active filter. */
export const FilterChip = ({ label, onRemove }) => (
  <span className={bm.chip}>
    {label}
    <button type="button" className={bm.chipRemove} aria-label={`Remove filter ${label}`} onClick={onRemove}>
      <Icon name="X" size={12} strokeWidth={2.6} />
    </button>
  </span>
);

const FilterPill = ({ id, label, count = 0, open, onToggle, onClose, ...panel }) => (
  <Popover
    id={id}
    label={label}
    open={open}
    onToggle={onToggle}
    onClose={onClose}
    renderTrigger={(props) => (
      <button {...props} className={`${bm.pill} ${count > 0 ? bm.pillActive : ''} ${open ? bm.pillOpen : ''}`}>
        {label}
        {count > 0 && <span className={bm.pillCount}>{count}</span>}
        <Icon name="ChevronDown" size={16} strokeWidth={2.2} className={bm.pillChevron} />
      </button>
    )}
    {...panel}
  />
);

/**
 * The filter bar above the cards on Bookmarked and Purchased: the search, the
 * first five filters as pills, With notes, and "More filters" at the far end,
 * which opens the rest in a row underneath (it shows how many of those are on).
 * Every filter on shows as a removable chip below, with Clear all.
 *
 * The filters are Search's (commonFields), after the page's own `leadFields`
 * (e.g. Purchased's Unlocked), each a pill whose panel is a list with counts
 * or a small form. `leadChips`: filters set elsewhere on the page (the pipeline).
 *
 * Phones and small tablets (below 846px, as on Search): no pills, just
 * [Filters (n) >] beside the search; it slides in the page's sidebar
 * (`renderSidebar({ open, onClose })`, the one beside an open CV) from the
 * left. The chips stay.
 */
const CandidateFilterBar = ({
  idPrefix,
  filters,
  onFiltersChange,
  onClearAll,
  opts,
  leadFields = () => [],
  leadChips = [],
  searchLabel,
  searchPlaceholder,
  notesLabel = 'With notes',
  visibleCount = 5,
  renderSidebar
}) => {
  const [openPill, setOpenPill] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const closePill = useCallback(() => setOpenPill(null), []);
  const slideIn = !useMinWidth(PILLS_MIN) && !!renderSidebar;
  // Phones: the search shares its row with Filters, so a short placeholder.
  const roomyPlaceholder = useMinWidth(PHONE_MAX + 1);
  const [panelOpen, setPanelOpen] = useState(false);
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    document.getElementById(`${idPrefix}-filters-open`)?.focus();
  }, [idPrefix]);

  // Wider again, the pills are back and the panel is gone.
  useEffect(() => {
    if (!slideIn) setPanelOpen(false);
  }, [slideIn]);

  // Escape slides it back, unless a list inside it used the key.
  useEffect(() => {
    if (!panelOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('[data-floating-menu]')) closePanel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen, closePanel]);
  const pillId = (key) => `${idPrefix}-pill-${key}`;
  const moreId = `${idPrefix}-more-filters`;

  // A one-pick list closes on a pick and puts focus back on its pill.
  const onRadioPicked = (key) => {
    setOpenPill(null);
    document.getElementById(`${pillId(key)}-trigger`)?.focus();
  };

  const [salaryView] = useSalaryView();
  const fields = [
    ...leadFields({ onRadioPicked }),
    ...commonFields({ filters, onFiltersChange, opts, idPrefix, onRadioPicked, salaryView })
  ].filter((field) => field.pill);
  const shown = fields.slice(0, visibleCount);
  const more = fields.slice(visibleCount);
  const moreOn = more.reduce((sum, field) => sum + field.count, 0);

  const chips = [
    ...leadChips,
    ...fields.flatMap((field) => field.chips),
    ...(filters.hasNotes ? [{ key: 'notes', label: 'With notes', onRemove: () => onFiltersChange({ ...filters, hasNotes: false }) }] : [])
  ];

  // The last pills of the first row open their panels to the left, to stay on screen.
  const renderPill = (field, align) => (
    <FilterPill
      key={field.key}
      id={pillId(field.key)}
      label={field.label}
      count={field.count}
      width={field.pill.width}
      padded={field.pill.padded}
      align={align}
      open={openPill === field.key}
      onToggle={() => setOpenPill((prev) => (prev === field.key ? null : field.key))}
      onClose={closePill}
    >
      {field.pill.body}
    </FilterPill>
  );

  // What the Filters button counts where the filters slide in (as the sidebar's own badge).
  const onCount = fields.reduce((sum, field) => sum + field.count, 0) + leadChips.length + (filters.hasNotes ? 1 : 0);

  return (
    <section aria-label="Filters" className={`${bm.fbar} ${slideIn ? cf.fbarSlim : ''}`}>
      <div className={bm.fbarRow}>
        {slideIn ? (
          // Search's Filters button (SearchToolbar): the sidebar's title made small.
          <button
            type="button"
            id={`${idPrefix}-filters-open`}
            onClick={() => setPanelOpen(true)}
            className={`${ds.filtersToggleBtn} ${cf.filtersOpenBtn}`}
            aria-expanded={panelOpen}
            aria-label={`Filters${onCount > 0 ? ` (${onCount} on)` : ''}`}
          >
            <span className={ds.filtersHeadTitle}>
              <Icon name="Filter" size={18} />
              <span>Filters</span>
              {onCount > 0 && <span className={ds.filtersHeadBadge} aria-hidden="true">{onCount}</span>}
            </span>
            <span className={ds.filtersChevron}>
              <Icon name="ChevronRight" size={18} strokeWidth={2.2} />
            </span>
          </button>
        ) : (
          <Icon name="Filter" size={18} className={bm.fbarIcon} />
        )}
        <ListSearch
          id={`${idPrefix}-search`}
          label={searchLabel}
          placeholder={roomyPlaceholder ? searchPlaceholder : 'Search…'}
          value={filters.search}
          onChange={(value) => onFiltersChange({ ...filters, search: value })}
          className={slideIn ? cf.slimSearch : ''}
        />
        {!slideIn && (
          <>
            {shown.map((field, index) => renderPill(field, index >= shown.length - 2 ? 'right' : 'left'))}
            <span className={bm.fbarDivider} aria-hidden="true" />
            <button
              type="button"
              className={`${bm.pill} ${filters.hasNotes ? bm.pillActive : ''}`}
              aria-pressed={filters.hasNotes}
              onClick={() => onFiltersChange({ ...filters, hasNotes: !filters.hasNotes })}
            >
              <CheckBox checked={filters.hasNotes} />
              {notesLabel}
            </button>
            {more.length > 0 && (
              <button
                type="button"
                className={`${bm.pill} ${cf.moreBtn} ${moreOn > 0 ? bm.pillActive : ''} ${moreOpen ? bm.pillOpen : ''}`}
                aria-expanded={moreOpen}
                aria-controls={moreId}
                onClick={() => setMoreOpen((prev) => !prev)}
              >
                <Icon name="SlidersHorizontal" size={16} strokeWidth={2.1} />
                More filters
                {moreOn > 0 && <span className={bm.pillCount}>{moreOn}</span>}
                <Icon name="ChevronDown" size={16} strokeWidth={2.2} className={`${bm.pillChevron} ${moreOpen ? cf.up : ''}`} />
              </button>
            )}
          </>
        )}
      </div>

      {!slideIn && moreOpen && more.length > 0 && (
        <div id={moreId} className={cf.moreRow}>
          {more.map((field) => renderPill(field, 'left'))}
        </div>
      )}

      {chips.length > 0 && (
        <div className={bm.chipsRow}>
          <span className={bm.chipsLabel}>Active filters</span>
          {chips.map(({ key, label, onRemove }) => <FilterChip key={key} label={label} onRemove={onRemove} />)}
          <button type="button" className={bm.chipsClear} onClick={onClearAll}>
            Clear all
          </button>
        </div>
      )}

      {/* Out of the bar (its z-index would keep the panel under the page's header and cards). */}
      {slideIn && createPortal(
        <>
          <div className={`${ds.scrim} ${panelOpen ? ds.show : ''}`} onClick={closePanel} aria-hidden="true" />
          {renderSidebar({ open: panelOpen, onClose: closePanel })}
        </>,
        document.body
      )}
    </section>
  );
};

export default CandidateFilterBar;
