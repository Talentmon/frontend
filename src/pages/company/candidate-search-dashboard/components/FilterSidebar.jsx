import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import Combobox from 'components/ui/Combobox';
import { Checkbox } from 'components/ui/Checkbox';
import { INDUSTRY_NAMES, getSubIndustries } from 'utils/industries';
import { ISSUER_NAMES, FAMILY_NAMES, getCertificationNamesFor } from 'utils/certifications';
import { CATEGORY_NAMES as SKILL_CATEGORY_NAMES, getSkillNamesFor } from 'utils/skills';
import { LANGUAGE_NAMES, LEVELS } from 'utils/languages';
import { currencySelectOptions } from 'utils/currencyService';
import { BASE_CURRENCY } from 'utils/exchangeRateService';
import {
  listSavedFilters,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  filtersToFrontend,
} from '../candidateSearchApi';
import styles from '../styles/dashboard.module.scss';

const currencyOptions = currencySelectOptions();

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

const languageOptions = LANGUAGE_NAMES.map((language) => ({ value: language, label: language }));

// Proficiency sub-filter shown per selected language - picking one or more
// levels matches candidates at exactly those levels; none picked ("Any
// level", the default) keeps the language selected without constraining it.
const languageLevelOptions = LEVELS.map((level) => ({ value: level, label: level }));

const industryOptions = INDUSTRY_NAMES.map((name) => ({ value: name, label: name }));

const certIssuerOptions = ISSUER_NAMES.map((name) => ({ value: name, label: name }));
const certFamilyOptions = FAMILY_NAMES.map((name) => ({ value: name, label: name }));

// Single source of truth for every filter: its type drives both rendering
// and the default/active/clear logic below, so adding a filter only means
// adding an entry here.
const FILTER_GROUPS = [
  {
    title: 'Basic Search',
    fields: [
      { key: 'position', type: 'text', label: 'Position', placeholder: 'e.g. Frontend Developer' },
      { key: 'location', type: 'text', label: 'Location', placeholder: 'e.g. Belgrade, Novi Sad' }
    ]
  },
  {
    title: 'Experience & Education',
    fields: [
      { key: 'experience', type: 'select', label: 'Experience Level', placeholder: 'Select experience', options: experienceOptions },
      { key: 'education', type: 'select', label: 'Education', placeholder: 'Select education', options: educationOptions }
    ]
  },
  {
    title: 'Salary',
    fields: [
      { key: 'salary', type: 'salaryRange' }
    ]
  },
  {
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
    title: 'Languages',
    fields: [
      { key: 'languages', type: 'languageLevel', label: 'Languages', placeholder: 'Select languages', options: languageOptions }
    ]
  },
  {
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
    title: 'Certifications',
    fields: [
      { key: 'hasCertifications', type: 'checkbox', label: 'Has at least one certification' },
      { key: 'certIssuer', type: 'multiSelect', label: 'Issuing Organization', placeholder: 'Select issuer', options: certIssuerOptions },
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

const DEFAULT_FILTERS = ALL_FIELDS?.reduce((acc, field) => {
  acc[field.key] = emptyValueForType(field?.type);
  return acc;
}, {});

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
  const [isNamingFilter, setIsNamingFilter] = useState(false);
  const [filterNameDraft, setFilterNameDraft] = useState('');

  useEffect(() => {
    listSavedFilters()
      .then((rows) => setSavedFilters(rows.map((row) => ({ id: row.id, name: row.name, filters: filtersToFrontend(row.filters) }))))
      .catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleSalaryChange = (type, value) => {
    const updatedSalary = { ...localFilters?.salary, [type]: value };
    handleFilterChange('salary', updatedSalary);
  };

  const handleMultiToggle = (key, value) => {
    const current = localFilters?.[key] || [];
    const updated = current?.includes(value)
      ? current?.filter((v) => v !== value)
      : [...current, value];

    // Unchecking an industry should drop any of its subindustries that were selected.
    if (key === 'industry') {
      const stillValidSubIndustries = updated?.flatMap((industryName) => getSubIndustries(industryName));
      const prunedSubIndustry = (localFilters?.subIndustry || [])?.filter((sub) => stillValidSubIndustries?.includes(sub));
      const updatedFilters = { ...localFilters, industry: updated, subIndustry: prunedSubIndustry };
      setLocalFilters(updatedFilters);
      onFiltersChange(updatedFilters);
      return;
    }

    // Unchecking a skill category should drop skills that no longer match.
    if (key === 'skillCategory') {
      const validNames = getSkillNamesFor({ categories: updated });
      const prunedSkills = (localFilters?.skills || [])?.filter((name) => validNames?.includes(name));
      const updatedFilters = { ...localFilters, skillCategory: updated, skills: prunedSkills };
      setLocalFilters(updatedFilters);
      onFiltersChange(updatedFilters);
      return;
    }

    // Unchecking an issuer/family should drop certification names that no longer match.
    if (key === 'certIssuer' || key === 'certFamily') {
      const validNames = getCertificationNamesFor({
        issuers: key === 'certIssuer' ? updated : (localFilters?.certIssuer || []),
        families: key === 'certFamily' ? updated : (localFilters?.certFamily || [])
      });
      const prunedCertName = (localFilters?.certName || [])?.filter((name) => validNames?.includes(name));
      const updatedFilters = { ...localFilters, [key]: updated, certName: prunedCertName };
      setLocalFilters(updatedFilters);
      onFiltersChange(updatedFilters);
      return;
    }

    handleFilterChange(key, updated);
  };

  // Languages are stored as { name, minLevel }[] so proficiency can be
  // constrained per language. Toggling the name Select adds/removes entries
  // while preserving the levels already chosen for names that stay selected.
  // An empty `levels` array means "any level" - no proficiency constraint.
  const handleLanguageNamesChange = (key, names) => {
    const current = localFilters?.[key] || [];
    const updated = names?.map((name) => current?.find((entry) => entry?.name === name) || { name, levels: [] });
    handleFilterChange(key, updated);
  };

  const handleLanguageLevelChange = (key, name, levels) => {
    const current = localFilters?.[key] || [];
    const updated = current?.map((entry) => (entry?.name === name ? { ...entry, levels } : entry));
    handleFilterChange(key, updated);
  };

  // The X on a language row removes it the same way unchecking it in the
  // name Select would.
  const handleRemoveLanguage = (key, name) => {
    const current = localFilters?.[key] || [];
    handleFilterChange(key, current?.filter((entry) => entry?.name !== name));
  };

  const handleBooleanToggle = (key) => {
    handleFilterChange(key, !localFilters?.[key]);
  };

  const handleClearAll = () => {
    setLocalFilters(DEFAULT_FILTERS);
    setActiveSavedFilterId(null);
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    return ALL_FIELDS?.filter((field) => isFieldActive(field, localFilters))?.length;
  };

  const isSavedFilterCurrent = (entry) =>
    entry?.id === activeSavedFilterId && JSON.stringify(entry?.filters) === JSON.stringify(localFilters);

  const handleApplySavedFilter = (entry) => {
    const nextFilters = { ...DEFAULT_FILTERS, ...entry?.filters };
    setLocalFilters(nextFilters);
    setActiveSavedFilterId(entry?.id);
    setIsNamingFilter(false);
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

  const renderField = (field) => {
    switch (field?.type) {
      case 'text':
        return (
          <Input
            key={field?.key}
            label={field?.label}
            type="text"
            placeholder={field?.placeholder}
            value={localFilters?.[field?.key]}
            onChange={(e) => handleFilterChange(field?.key, e?.target?.value)}
          />
        );

      case 'select':
        return (
          <Select
            key={field?.key}
            label={field?.label}
            options={field?.options}
            value={localFilters?.[field?.key]}
            onChange={(value) => handleFilterChange(field?.key, value)}
            placeholder={field?.placeholder}
          />
        );

      case 'multiSelect': {
        const options = field?.getOptions ? field.getOptions(localFilters) : field?.options;
        const isDisabled = field?.disabled ? field.disabled(localFilters) : false;
        return (
          <Select
            key={field?.key}
            label={field?.label}
            options={options}
            value={localFilters?.[field?.key]}
            onChange={(value) => handleFilterChange(field?.key, value)}
            placeholder={isDisabled ? (field?.disabledPlaceholder || field?.placeholder) : field?.placeholder}
            multiple
            disabled={isDisabled}
          />
        );
      }

      case 'languageLevel': {
        const entries = localFilters?.[field?.key] || [];
        const selectedNames = entries?.map((entry) => entry?.name);
        return (
          <div key={field?.key}>
            <Select
              label={field?.label}
              options={field?.options}
              value={selectedNames}
              onChange={(names) => handleLanguageNamesChange(field?.key, names)}
              placeholder={field?.placeholder}
              multiple
            />
            {entries?.length > 0 && (
              <div className={styles.languageLevelRows}>
                {entries?.map((entry) => (
                  <div className={styles.languageLevelRow} key={entry?.name}>
                    <span className={styles.languageLevelName}>{entry?.name}</span>
                    <Select
                      className={styles.languageLevelSelect}
                      options={languageLevelOptions}
                      value={entry?.levels || []}
                      onChange={(levels) => handleLanguageLevelChange(field?.key, entry?.name, levels)}
                      placeholder="Any level"
                      multiple
                    />
                    <button
                      type="button"
                      className={styles.languageLevelRemove}
                      onClick={() => handleRemoveLanguage(field?.key, entry?.name)}
                      aria-label={`Remove ${entry?.name}`}
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'comboMulti': {
        const options = field?.getOptions ? field.getOptions(localFilters) : field?.options;
        return (
          <Combobox
            key={field?.key}
            label={field?.label}
            options={options}
            value={localFilters?.[field?.key]}
            onChange={(value) => handleFilterChange(field?.key, value)}
            placeholder={field?.placeholder}
            multiple
          />
        );
      }

      case 'salaryRange': {
        // The company picks a filter currency; both bounds are entered in
        // it and converted to the base currency once (see
        // salaryFilterService.buildBaseSalaryRange) - never per candidate.
        const filterCurrency = localFilters?.salary?.currency || 'EUR';
        return (
          <div key={field?.key}>
            <Select
              label="Filter currency"
              options={currencyOptions}
              value={filterCurrency}
              onChange={(value) => handleSalaryChange('currency', value)}
              searchable
            />
            <div className={styles.salaryRow}>
              <Input
                label={`From (${filterCurrency})`}
                type="number"
                min="0"
                placeholder="50,000"
                value={localFilters?.salary?.min}
                onChange={(e) => handleSalaryChange('min', e?.target?.value)}
              />
              <Input
                label={`To (${filterCurrency})`}
                type="number"
                min="0"
                placeholder="150,000"
                value={localFilters?.salary?.max}
                onChange={(e) => handleSalaryChange('max', e?.target?.value)}
              />
            </div>
          </div>
        );
      }

      case 'checkbox':
        return (
          <Checkbox
            key={field?.key}
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
          <Icon name="ChevronRight" size={20} />
        </button>
        {getActiveFiltersCount() > 0 && (
          <div className={styles.collapsedBadge}>
            {getActiveFiltersCount()}
          </div>
        )}
      </div>
    );
  }

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
              <Icon name="ChevronLeft" size={20} />
            </button>
          </div>
        </div>
      </div>
      {/* Saved filters */}
      {savedFilters?.length > 0 && (
        <div className={styles.savedFilters}>
          <h4 className={styles.savedFiltersTitle}>Your filters</h4>
          <div className={styles.savedFiltersList}>
            {savedFilters?.map((entry) => (
              <div
                key={entry?.id}
                className={`${styles.savedFilterChip} ${isSavedFilterCurrent(entry) ? styles.savedFilterChipActive : ''}`}
              >
                <button
                  type="button"
                  className={styles.savedFilterChipLabel}
                  onClick={() => handleApplySavedFilter(entry)}
                  title={entry?.name}
                >
                  {entry?.name}
                </button>
                <button
                  type="button"
                  className={styles.savedFilterChipDelete}
                  onClick={() => handleDeleteSavedFilter(entry?.id)}
                  aria-label={`Delete ${entry?.name}`}
                >
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Filters Content */}
      <div className={styles.filtersBody}>
        {FILTER_GROUPS?.map((group) => (
          <div className={styles.fgroup} key={group?.title}>
            <h3 className={styles.fgroupTitle}>{group?.title}</h3>
            <div className={styles.fgroupBody}>
              {group?.fields?.map(renderField)}
            </div>
          </div>
        ))}
        <div className={styles.fgroup}>
          {isNamingFilter ? (
            <div className={styles.saveFilterRow}>
              <Input
                autoFocus
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
                aria-label="Confirm save"
              >
                <Icon name="Check" size={16} />
              </button>
              <button
                type="button"
                className={styles.saveFilterCancel}
                onClick={handleCancelSaveFilter}
                aria-label="Cancel"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.saveFilterBtn}
              onClick={handleSaveFilter}
              disabled={getActiveFiltersCount() === 0}
            >
              <Icon name="Save" size={16} />
              {activeSavedFilterId ? 'Update saved filter' : 'Save filter'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
