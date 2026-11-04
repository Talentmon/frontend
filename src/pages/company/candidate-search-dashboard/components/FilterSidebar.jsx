import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import Combobox from 'components/ui/Combobox';
import { Checkbox } from 'components/ui/Checkbox';
import { INDUSTRY_NAMES, getSubIndustries } from 'utils/industries';
import { ISSUER_NAMES, FAMILY_NAMES, getCertificationNamesFor } from 'utils/certifications';
import { CATEGORY_NAMES as SKILL_CATEGORY_NAMES, getSkillNamesFor } from 'utils/skills';
import { currencySymbol } from 'utils/currencyService';
import { BASE_CURRENCY } from 'utils/exchangeRateService';
import {
  listSavedFilters,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  filtersToFrontend,
} from '../candidateSearchApi';
import LanguageLevelFilter from './LanguageLevelFilter';
import SalaryRangeFilter from './SalaryRangeFilter';
import SkillsMatchToggle from './SkillsMatchToggle';
import styles from '../styles/dashboard.module.scss';

const experienceOptions = [
  { value: '', label: 'Any experience' },
  { value: '0-1', label: '0-1 years' },
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-10', label: '5-10 years' },
  { value: '10+', label: '10+ years' }
];

const educationOptions = [
  { value: '', label: 'Any education' },
  { value: 'high-school', label: 'High School' },
  { value: 'associate-degree', label: 'Associate Degree' },
  { value: 'bachelors-degree', label: "Bachelor's Degree" },
  { value: 'masters-degree', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' }
];

const availabilityOptions = [
  { value: '', label: 'Any time' },
  { value: 'immediately', label: 'Immediately' },
  { value: '2-weeks', label: 'Within 2 weeks' },
  { value: '1-month', label: 'Within 1 month' },
  { value: '3-months', label: 'Within 3 months' }
];

const jobTypeOptions = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' }
];

// Mirrors the STATUS enum from candidate-profile/edit/data.js (active / open).
// "off" (not looking) candidates are excluded from search entirely - see
// applyFiltersAndSearch in index.jsx - so it isn't offered as a filter here.
const statusOptions = [
  { value: '', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open to offers' }
];

const skillCategoryOptions = SKILL_CATEGORY_NAMES.map((name) => ({ value: name, label: name }));

const industryOptions = INDUSTRY_NAMES.map((name) => ({ value: name, label: name }));

const certIssuerOptions = ISSUER_NAMES.map((name) => ({ value: name, label: name }));
const certFamilyOptions = FAMILY_NAMES.map((name) => ({ value: name, label: name }));

// Every skill / certification name in the catalog. Names outside it were
// typed in by hand and survive a category / issuer / family change.
const CATALOG_SKILLS = new Set(getSkillNamesFor({ categories: [] }));
const CATALOG_CERT_NAMES = new Set(getCertificationNamesFor({ issuers: [], families: [] }));

// Single source of truth for every filter: its type drives both rendering
// and the default/active/clear logic below, so adding a filter only means
// adding an entry here.
const FILTER_GROUPS = [
  {
    id: 'basic',
    title: 'Basic Search',
    fields: [
      { key: 'position', type: 'text', label: 'Position', placeholder: 'e.g. Frontend Developer' },
      { key: 'location', type: 'text', label: 'Location', placeholder: 'e.g. London, New York' }
    ]
  },
  {
    id: 'experience',
    title: 'Experience & Education',
    fields: [
      { key: 'experience', type: 'select', label: 'Experience Level', placeholder: 'Select experience', options: experienceOptions },
      { key: 'education', type: 'select', label: 'Education', placeholder: 'Select education', options: educationOptions }
    ]
  },
  {
    id: 'salary',
    title: 'Salary',
    fields: [
      { key: 'salary', type: 'salaryRange' }
    ]
  },
  {
    id: 'skills',
    title: 'Skills',
    fields: [
      { key: 'skillCategory', type: 'multiSelect', label: 'Category', placeholder: 'Select category', options: skillCategoryOptions },
      {
        key: 'skills',
        type: 'comboMulti',
        label: 'Skills',
        placeholder: 'Type or choose a skill',
        getOptions: (localFilters) => getSkillNamesFor({ categories: localFilters?.skillCategory || [] })
      }
    ]
  },
  {
    id: 'languages',
    title: 'Languages',
    fields: [
      // The group title already says "Languages", so the field label is
      // only there for screen readers.
      { key: 'languages', type: 'languageLevel', label: 'Languages', hideLabel: true, placeholder: 'Select languages' }
    ]
  },
  {
    id: 'industry',
    title: 'Industry',
    fields: [
      { key: 'industry', type: 'multiSelect', label: 'Industry', placeholder: 'Select industry', options: industryOptions },
      {
        key: 'subIndustry',
        type: 'multiSelect',
        label: 'Subindustry',
        placeholder: 'Select subindustry',
        disabledPlaceholder: 'Select an industry first',
        getOptions: (localFilters) =>
          (localFilters?.industry || []).flatMap((industryName) =>
            getSubIndustries(industryName).map((subIndustry) => ({
              value: subIndustry,
              label: subIndustry,
              group: industryName
            }))
          ),
        disabled: (localFilters) => !(localFilters?.industry?.length > 0)
      }
    ]
  },
  {
    id: 'certifications',
    title: 'Certifications',
    fields: [
      { key: 'hasCertifications', type: 'checkbox', label: 'Has at least one certification' },
      { key: 'certIssuer', type: 'multiSelect', label: 'Issuing Organization', placeholder: 'Select issuer', options: certIssuerOptions, searchable: true },
      { key: 'certFamily', type: 'multiSelect', label: 'Certification Family', placeholder: 'Select family', options: certFamilyOptions },
      {
        key: 'certName',
        type: 'comboMulti',
        label: 'Certification Name',
        placeholder: 'Type or choose from list',
        getOptions: (localFilters) =>
          getCertificationNamesFor({ issuers: localFilters?.certIssuer || [], families: localFilters?.certFamily || [] })
      }
    ]
  },
  {
    id: 'status',
    title: 'Status & Preferences',
    fields: [
      { key: 'status', type: 'select', label: 'Candidate Status', placeholder: 'Any status', options: statusOptions },
      { key: 'jobType', type: 'multiSelect', label: 'Job Type', placeholder: 'Select job type', options: jobTypeOptions },
      { key: 'availability', type: 'select', label: 'Availability', placeholder: 'Select availability', options: availabilityOptions },
      { key: 'relocationReady', type: 'checkbox', label: 'Open to Relocation' },
      { key: 'travelReady', type: 'checkbox', label: 'Open to Business Travel' }
    ]
  }
];

const ALL_FIELDS = FILTER_GROUPS.flatMap((group) => group?.fields);

const emptyValueForType = (type) => {
  switch (type) {
    case 'salaryRange':
      return { min: '', max: '', currency: BASE_CURRENCY };
    case 'multiSelect':
    case 'comboMulti':
    case 'languageLevel':
      return [];
    case 'checkbox':
      return false;
    default:
      return '';
  }
};

// skillsMatch isn't a filter of its own (it never counts as active): it
// says whether 2+ picked skills are matched as "any of" or "all of".
const DEFAULT_FILTERS = {
  ...ALL_FIELDS?.reduce((acc, field) => {
    acc[field.key] = emptyValueForType(field?.type);
    return acc;
  }, {}),
  skillsMatch: 'any'
};

const isFieldActive = (field, localFilters) => {
  const value = localFilters?.[field?.key];
  switch (field?.type) {
    case 'salaryRange':
      return !!(value?.min || value?.max);
    case 'multiSelect':
    case 'comboMulti':
    case 'languageLevel':
      return value?.length > 0;
    case 'checkbox':
      return !!value;
    default:
      return !!value;
  }
};

const countActiveInGroup = (group, localFilters) =>
  group?.fields?.filter((field) => isFieldActive(field, localFilters))?.length;

// Saved filters come back from the API with empty values left out, so both
// sides are filled in with the defaults before comparing.
const normalizeFilters = (f = {}) => {
  const merged = { ...DEFAULT_FILTERS, ...f, salary: { ...DEFAULT_FILTERS.salary, ...f?.salary } };
  merged.skillsMatch = merged.skills?.length >= 2 && merged.skillsMatch === 'all' ? 'all' : 'any';
  return merged;
};
const sameFilters = (a, b) => JSON.stringify(normalizeFilters(a)) === JSON.stringify(normalizeFilters(b));

// Groups expanded on first render; the rest start collapsed. Open/closed
// state lives only as long as the page does - nothing is persisted.
const DEFAULT_OPEN_GROUPS = { basic: true, salary: true };

// Saved filters listed before "Show all (N)".
const SAVED_FILTERS_PREVIEW = 2;

const optionLabel = (options, value) => options.find((option) => option.value === value)?.label || value;

const formatAmount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('en-US') : String(value);
};

// What a collapsed group lists under its title, e.g. "React, TypeScript +1".
const groupSummaryItems = (groupId, f) => {
  switch (groupId) {
    case 'basic':
      return [f.position?.trim(), f.location?.trim()].filter(Boolean);
    case 'experience':
      return [
        f.experience && optionLabel(experienceOptions, f.experience),
        f.education && optionLabel(educationOptions, f.education)
      ].filter(Boolean);
    case 'salary': {
      const { min, max, currency } = f.salary || {};
      if (!min && !max) return [];
      const symbol = currencySymbol(currency || BASE_CURRENCY);
      const prefix = symbol.length > 1 ? `${symbol} ` : symbol;
      const from = min ? `${prefix}${formatAmount(min)}` : '';
      const to = max ? `${prefix}${formatAmount(max)}` : '';
      if (from && to) return [`${from} – ${to}`];
      return [from ? `From ${from}` : `Up to ${to}`];
    }
    case 'skills':
      return [...(f.skills || []), ...(f.skillCategory || [])];
    case 'languages':
      return (f.languages || []).map((entry) => (entry?.levels?.length ? `${entry.name} (${entry.levels.join(', ')})` : entry?.name));
    case 'industry': {
      const subs = f.subIndustry || [];
      const withoutSub = (f.industry || []).filter((name) => !getSubIndustries(name).some((sub) => subs.includes(sub)));
      return [...subs, ...withoutSub];
    }
    case 'certifications':
      return [
        f.hasCertifications && 'Has a certification',
        ...(f.certName || []),
        ...(f.certIssuer || []),
        ...(f.certFamily || [])
      ].filter(Boolean);
    case 'status':
      return [
        f.status && optionLabel(statusOptions, f.status),
        ...(f.jobType || []).map((type) => optionLabel(jobTypeOptions, type)),
        f.availability && optionLabel(availabilityOptions, f.availability),
        f.relocationReady && 'Open to relocation',
        f.travelReady && 'Open to business travel'
      ].filter(Boolean);
    default:
      return [];
  }
};

const groupSummary = (groupId, f) => {
  const items = groupSummaryItems(groupId, f);
  return items.length > 2 ? `${items.slice(0, 2).join(', ')} +${items.length - 2}` : items.join(', ');
};

const fieldId = (key) => `filter-${key}`;

// Filter inputs are white with the same 9px corners as the dropdowns.
const INPUT_CLASS = 'bg-white rounded-[9px]';

const FilterSidebar = ({
  filters = {},
  onFiltersChange = () => {},
  onClearFilters = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {},
  onNotify = () => {}
}) => {
  const [localFilters, setLocalFilters] = useState({
    ...DEFAULT_FILTERS,
    ...filters
  });

  const [savedFilters, setSavedFilters] = useState([]);
  const [activeSavedFilterId, setActiveSavedFilterId] = useState(null);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const [isNamingFilter, setIsNamingFilter] = useState(false);
  const [filterNameDraft, setFilterNameDraft] = useState('');
  const [openGroups, setOpenGroups] = useState(DEFAULT_OPEN_GROUPS);

  useEffect(() => {
    listSavedFilters()
      .then((rows) => setSavedFilters(rows.map((row) => ({ id: row.id, name: row.name, filters: filtersToFrontend(row.filters) }))))
      .catch(() => {});
  }, []);

  const applyFilters = (updatedFilters) => {
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleFilterChange = (key, value) => {
    applyFilters({ ...localFilters, [key]: value });
  };

  // Multi-selects that narrow another field also drop what no longer fits
  // in it: subindustries of an unpicked industry, skills outside the picked
  // categories, certification names outside the picked issuers / families.
  // Names typed in by hand (not in the catalog) are always kept.
  const handleMultiChange = (key, updated) => {
    const next = { ...localFilters, [key]: updated };

    if (key === 'industry') {
      const validSubs = updated.flatMap((industryName) => getSubIndustries(industryName));
      next.subIndustry = (localFilters?.subIndustry || []).filter((sub) => validSubs.includes(sub));
    }

    if (key === 'skillCategory') {
      const validNames = new Set(getSkillNamesFor({ categories: updated }));
      next.skills = (localFilters?.skills || []).filter((name) => validNames.has(name) || !CATALOG_SKILLS.has(name));
    }

    if (key === 'certIssuer' || key === 'certFamily') {
      const validNames = new Set(getCertificationNamesFor({
        issuers: next.certIssuer || [],
        families: next.certFamily || []
      }));
      next.certName = (localFilters?.certName || []).filter((name) => validNames.has(name) || !CATALOG_CERT_NAMES.has(name));
    }

    applyFilters(next);
  };

  const handleBooleanToggle = (key) => {
    handleFilterChange(key, !localFilters?.[key]);
  };

  const handleClearAll = () => {
    setLocalFilters(DEFAULT_FILTERS);
    setActiveSavedFilterId(null);
    setIsNamingFilter(false);
    onClearFilters();
  };

  // "Clear" in an open group's header empties just that group (the salary
  // currency stays as picked) and hands focus back to the group title.
  const handleClearGroup = (group) => {
    const cleared = { ...localFilters };
    group?.fields?.forEach((field) => {
      cleared[field.key] = field.type === 'salaryRange'
        ? { ...localFilters?.salary, min: '', max: '' }
        : emptyValueForType(field.type);
    });
    if (group?.id === 'skills') cleared.skillsMatch = 'any';
    applyFilters(cleared);
    document.getElementById(`filter-group-toggle-${group?.id}`)?.focus();
  };

  const getActiveFiltersCount = () => {
    return ALL_FIELDS?.filter((field) => isFieldActive(field, localFilters))?.length;
  };

  const isSavedFilterCurrent = (entry) =>
    entry?.id === activeSavedFilterId && sameFilters(entry?.filters, localFilters);

  const handleToggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev?.[id] }));
  };

  // Applying a saved filter also expands every group it sets something in,
  // so what's switched on is visible right away; open groups stay open.
  const handleApplySavedFilter = (entry) => {
    const nextFilters = { ...DEFAULT_FILTERS, ...entry?.filters };
    setLocalFilters(nextFilters);
    setActiveSavedFilterId(entry?.id);
    setIsNamingFilter(false);
    setOpenGroups((prev) => {
      const next = { ...prev };
      FILTER_GROUPS.forEach((group) => {
        if (countActiveInGroup(group, nextFilters) > 0) next[group.id] = true;
      });
      return next;
    });
    onFiltersChange(nextFilters);
  };

  const handleDeleteSavedFilter = async (id) => {
    try {
      await deleteSavedFilter(id);
      setSavedFilters((prev) => prev?.filter((entry) => entry?.id !== id));
      if (activeSavedFilterId === id) {
        setActiveSavedFilterId(null);
      }
    } catch {
      onNotify('Could not delete filter — please try again.');
    }
  };

  const persistSavedFilter = async (name) => {
    try {
      const row = activeSavedFilterId
        ? await updateSavedFilter(activeSavedFilterId, { filters: localFilters })
        : await createSavedFilter(name, localFilters);
      const entry = { id: row.id, name: row.name, filters: filtersToFrontend(row.filters) };
      setSavedFilters((prev) => {
        const exists = prev?.some((item) => item?.id === entry?.id);
        return exists ? prev.map((item) => (item?.id === entry?.id ? entry : item)) : [...prev, entry];
      });
      setActiveSavedFilterId(entry?.id);
      onNotify('Filter saved');
    } catch {
      onNotify('Could not save filter — please try again.');
    }
  };

  const handleSaveFilter = () => {
    if (activeSavedFilterId) {
      persistSavedFilter();
      return;
    }
    setFilterNameDraft('');
    setIsNamingFilter(true);
  };

  const handleConfirmSaveFilter = async () => {
    if (!filterNameDraft?.trim()) return;
    await persistSavedFilter(filterNameDraft);
    setIsNamingFilter(false);
    setFilterNameDraft('');
  };

  const handleCancelSaveFilter = () => {
    setIsNamingFilter(false);
    setFilterNameDraft('');
  };

  const renderLabel = (field) => (
    <label
      htmlFor={fieldId(field?.key)}
      className={field?.hideLabel ? styles.srOnly : styles.fieldLabel}
    >
      {field?.label}
    </label>
  );

  const renderField = (field) => {
    switch (field?.type) {
      case 'text':
        return (
          <div className={styles.field} key={field?.key}>
            {renderLabel(field)}
            <Input
              id={fieldId(field?.key)}
              type="text"
              className={INPUT_CLASS}
              placeholder={field?.placeholder}
              value={localFilters?.[field?.key]}
              onChange={(e) => handleFilterChange(field?.key, e?.target?.value)}
            />
          </div>
        );

      case 'select':
        return (
          <div className={styles.field} key={field?.key}>
            {renderLabel(field)}
            <Select
              id={fieldId(field?.key)}
              options={field?.options}
              value={localFilters?.[field?.key]}
              onChange={(value) => handleFilterChange(field?.key, value)}
              placeholder={field?.placeholder}
            />
          </div>
        );

      case 'multiSelect': {
        const options = field?.getOptions ? field.getOptions(localFilters) : field?.options;
        const isDisabled = field?.disabled ? field.disabled(localFilters) : false;
        return (
          <div className={styles.field} key={field?.key}>
            {renderLabel(field)}
            <Select
              id={fieldId(field?.key)}
              options={options}
              value={localFilters?.[field?.key]}
              onChange={(value) => handleMultiChange(field?.key, value)}
              placeholder={isDisabled ? (field?.disabledPlaceholder || field?.placeholder) : field?.placeholder}
              multiple
              searchable={!!field?.searchable}
              disabled={isDisabled}
            />
          </div>
        );
      }

      case 'languageLevel':
        return (
          <div className={styles.field} key={field?.key}>
            {renderLabel(field)}
            <LanguageLevelFilter
              id={fieldId(field?.key)}
              value={localFilters?.[field?.key] || []}
              onChange={(entries) => handleFilterChange(field?.key, entries)}
              placeholder={field?.placeholder}
            />
          </div>
        );

      case 'comboMulti': {
        const options = field?.getOptions ? field.getOptions(localFilters) : field?.options;
        return (
          <div className={styles.field} key={field?.key}>
            {renderLabel(field)}
            <Combobox
              id={fieldId(field?.key)}
              options={options}
              value={localFilters?.[field?.key]}
              onChange={(value) => handleFilterChange(field?.key, value)}
              placeholder={field?.placeholder}
              multiple
            />
          </div>
        );
      }

      case 'salaryRange':
        return (
          <SalaryRangeFilter
            key={field?.key}
            value={localFilters?.salary}
            onChange={(salary) => handleFilterChange('salary', salary)}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            key={field?.key}
            className={styles.checkRow}
            label={field?.label}
            checked={!!localFilters?.[field?.key]}
            onChange={() => handleBooleanToggle(field?.key)}
          />
        );

      default:
        return null;
    }
  };

  if (isCollapsed) {
    return (
      <div className={`${styles.filters} ${styles.collapsed}`}>
        <button
          onClick={onToggleCollapse}
          className={styles.filtersHeadCollapse}
          aria-label="Expand filters"
        >
          <Icon name="ChevronRight" size={18} strokeWidth={2.2} />
        </button>
        {getActiveFiltersCount() > 0 && (
          <div className={styles.collapsedBadge}>
            {getActiveFiltersCount()}
          </div>
        )}
      </div>
    );
  }

  const visibleSavedFilters = showAllSaved ? savedFilters : savedFilters?.slice(0, SAVED_FILTERS_PREVIEW);

  return (
    <div className={styles.filters}>
      {/* Header */}
      <div className={styles.filtersHead}>
        <div className={styles.filtersHeadRow}>
          <div className={styles.filtersHeadTitle}>
            <Icon name="Filter" size={18} />
            <h3>Filters</h3>
            {getActiveFiltersCount() > 0 && (
              <div className={styles.filtersHeadBadge}>
                {getActiveFiltersCount()}
              </div>
            )}
          </div>
          <div className={styles.filtersHeadActions}>
            <button
              onClick={handleClearAll}
              disabled={getActiveFiltersCount() === 0}
              className={styles.filtersClear}
            >
              Clear all
            </button>
            <button
              onClick={onToggleCollapse}
              className={styles.filtersHeadCollapse}
              aria-label="Hide filters"
            >
              <Icon name="ChevronLeft" size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
      {/* Scrollable middle: saved filters + collapsible groups */}
      <div className={styles.filtersBody}>
        {savedFilters?.length > 0 && (
          <div className={styles.savedFilters}>
            <h4 className={styles.savedFiltersTitle}>Your filters</h4>
            <ul className={styles.savedFiltersList} id="saved-filter-list">
              {visibleSavedFilters?.map((entry) => {
                const isCurrent = isSavedFilterCurrent(entry);
                return (
                  <li
                    key={entry?.id}
                    className={`${styles.savedFilterChip} ${isCurrent ? styles.savedFilterChipActive : ''}`}
                  >
                    <button
                      type="button"
                      className={styles.savedFilterChipLabel}
                      onClick={() => handleApplySavedFilter(entry)}
                      aria-pressed={isCurrent}
                      title={entry?.name}
                    >
                      {entry?.name}
                    </button>
                    <button
                      type="button"
                      className={styles.savedFilterChipDelete}
                      onClick={() => handleDeleteSavedFilter(entry?.id)}
                      aria-label={`Delete saved filter ${entry?.name}`}
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
            {savedFilters?.length > SAVED_FILTERS_PREVIEW && (
              <button
                type="button"
                className={styles.savedFiltersMore}
                onClick={() => setShowAllSaved((prev) => !prev)}
                aria-controls="saved-filter-list"
                aria-expanded={showAllSaved}
              >
                {showAllSaved ? 'Show less' : `Show all (${savedFilters.length})`}
                <Icon
                  name="ChevronDown"
                  size={14}
                  strokeWidth={2.4}
                  className={`${styles.savedFiltersMoreIcon} ${showAllSaved ? styles.savedFiltersMoreIconOpen : ''}`}
                />
              </button>
            )}
          </div>
        )}
        {FILTER_GROUPS?.map((group) => {
          const isOpen = !!openGroups?.[group?.id];
          const activeCount = countActiveInGroup(group, localFilters);
          const bodyId = `filter-group-${group?.id}`;
          const showClear = isOpen && activeCount > 0;
          return (
            <div className={styles.fgroup} key={group?.id}>
              <h3 className={`${styles.fgroupHead} ${isOpen ? styles.fgroupHeadOpen : ''}`}>
                <button
                  type="button"
                  id={`filter-group-toggle-${group?.id}`}
                  className={styles.fgroupToggle}
                  onClick={() => handleToggleGroup(group?.id)}
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                >
                  <span className={styles.fgroupRow}>
                    <span className={styles.fgroupTitle}>{group?.title}</span>
                    {activeCount > 0 && (
                      <span className={styles.fgroupCount}>{activeCount}</span>
                    )}
                    {/* keeps room for the absolutely placed Clear button */}
                    {showClear && <span className={styles.fgroupClearSpace} aria-hidden="true" />}
                    <Icon name="ChevronDown" size={16} strokeWidth={2.2} className={styles.fgroupChevron} />
                  </span>
                  {!isOpen && activeCount > 0 && (
                    <span className={styles.fgroupSummary}>{groupSummary(group?.id, localFilters)}</span>
                  )}
                </button>
                {showClear && (
                  <button
                    type="button"
                    className={styles.fgroupClear}
                    onClick={() => handleClearGroup(group)}
                    aria-label={`Clear ${group?.title} filters`}
                  >
                    Clear
                  </button>
                )}
              </h3>
              {isOpen && (
                <div className={styles.fgroupBody} id={bodyId}>
                  {group?.fields?.map(renderField)}
                  {group?.id === 'skills' && localFilters?.skills?.length >= 2 && (
                    <SkillsMatchToggle
                      value={localFilters?.skillsMatch}
                      onChange={(value) => handleFilterChange('skillsMatch', value)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Pinned footer: save / name the current filter */}
      <div className={styles.filtersFoot}>
        {isNamingFilter ? (
          <div className={styles.saveFilterRow}>
            <label htmlFor="filter-name" className={styles.srOnly}>Filter name</label>
            <Input
              id="filter-name"
              autoFocus
              className={INPUT_CLASS}
              placeholder="Filter name"
              value={filterNameDraft}
              onChange={(e) => setFilterNameDraft(e?.target?.value)}
              onKeyDown={(e) => {
                if (e?.key === 'Enter') handleConfirmSaveFilter();
                if (e?.key === 'Escape') handleCancelSaveFilter();
              }}
            />
            <button
              type="button"
              className={styles.saveFilterConfirm}
              onClick={handleConfirmSaveFilter}
              disabled={!filterNameDraft?.trim()}
              aria-label="Save filter with this name"
            >
              <Icon name="Check" size={18} strokeWidth={2.6} />
            </button>
            <button
              type="button"
              className={styles.saveFilterCancel}
              onClick={handleCancelSaveFilter}
              aria-label="Cancel"
            >
              <Icon name="X" size={16} strokeWidth={2.4} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.saveFilterBtn}
            onClick={handleSaveFilter}
            disabled={getActiveFiltersCount() === 0}
          >
            <Icon name="Save" size={17} />
            {activeSavedFilterId ? 'Update saved filter' : 'Save filter'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;
