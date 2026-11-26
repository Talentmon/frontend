import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import Combobox from 'components/ui/Combobox';
import { Checkbox } from 'components/ui/Checkbox';
import { INDUSTRY_NAMES, getSubIndustries } from 'utils/industries';
import { FAMILY_NAMES, getCertificationNamesFor, getIssuerNamesFor } from 'utils/certifications';
import { CATEGORY_NAMES as SKILL_CATEGORY_NAMES, getSkillNamesFor } from 'utils/skills';
import { currencySymbol } from 'utils/currencyService';
import { COUNTRY_OPTIONS } from 'utils/countries';
import { basisWord, periodWord, rangeView, useSalaryView } from 'lib/salaryView';
import {
  listSavedFilters,
  listSearchCities,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  filtersToFrontend,
  savedFilterView,
} from '../candidateSearchApi';
import { EMPTY_EXPERIENCE, experienceActive, experienceLabel } from 'utils/experienceRange';
import ExperienceRangeFilter from './ExperienceRangeFilter';
import LanguageLevelFilter from './LanguageLevelFilter';
import PickedChips from './PickedChips';
import SalaryRangeFilter from './SalaryRangeFilter';
import SkillsMatchToggle, { CERTIFICATE_MATCH, LANGUAGE_MATCH } from './SkillsMatchToggle';
import styles from '../styles/dashboard.module.scss';

// Several can be picked; a candidate matches with any of them, exactly that level.
const educationOptions = [
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

const workModeOptions = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' }
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

const certFamilyOptions = FAMILY_NAMES.map((name) => ({ value: name, label: name }));
const toOptions = (names) => names.map((name) => ({ value: name, label: name }));

// The cities in `places` ({ city, country }, where the candidates live), in
// any of `countries` when some are picked: each once, A–Z.
const citiesIn = (places = [], countries = []) => {
  const byKey = new Map();
  places.forEach(({ city, country }) => {
    if (!city || (countries.length && !countries.includes(country))) return;
    if (!byKey.has(city.toLowerCase())) byKey.set(city.toLowerCase(), city);
  });
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
};

// Single source of truth for every filter: its type drives both rendering
// and the default/active/clear logic below, so adding a filter only means
// adding an entry here.
// `helper`: not a filter, it only narrows the list of the field under it
// (Category → Skills; Family → Issuer → Certification Name). Nothing is
// searched by it; it doesn't count as a filter and isn't sent or saved.
// `selectAll(filters)`: when the list offers "Select all" (once a helper narrows it).
// `countNoun`: how the picks are counted next to the label ("14 skills").
const FILTER_GROUPS = [
  {
    id: 'basic',
    title: 'Basic Search',
    fields: [
      { key: 'position', type: 'text', label: 'Position', placeholder: 'e.g. Frontend Developer' },
      // Any of the cities: picked from where the candidates live (in the picked countries), or typed.
      {
        key: 'location',
        type: 'comboMulti',
        label: 'City',
        placeholder: 'Type or choose a city',
        maxRows: 3,
        getOptions: (localFilters, { cities }) => citiesIn(cities, localFilters?.country || [])
      },
      { key: 'country', type: 'multiSelect', label: 'Country', placeholder: 'Select country', options: COUNTRY_OPTIONS, searchable: true }
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
    id: 'experience',
    title: 'Experience & Education',
    fields: [
      { key: 'experience', type: 'experienceRange', label: 'Years of experience' },
      {
        key: 'education',
        type: 'multiSelect',
        label: 'Education',
        placeholder: 'Select education',
        options: educationOptions,
        multipleLabel: (count) => `${count} levels selected`,
        // The picks as pills under the field.
        chips: true
      }
    ]
  },
  {
    id: 'skills',
    title: 'Skills',
    fields: [
      {
        key: 'skillCategory',
        type: 'multiSelect',
        helper: true,
        label: 'Category',
        placeholder: 'All categories',
        hint: 'Narrows the skills list below',
        options: skillCategoryOptions,
        multipleLabel: (count) => `${count} categories`
      },
      {
        key: 'skills',
        type: 'comboMulti',
        label: 'Skills',
        placeholder: 'Type or choose a skill',
        countNoun: ['skill', 'skills'],
        maxRows: 5,
        selectAll: (localFilters) => localFilters?.skillCategory?.length > 0,
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
      {
        key: 'certFamily',
        type: 'multiSelect',
        helper: true,
        label: 'Certification Family',
        placeholder: 'All families',
        hint: 'Narrows the issuers and certificates below',
        options: certFamilyOptions,
        multipleLabel: (count) => `${count} families`
      },
      {
        key: 'certIssuer',
        type: 'multiSelect',
        helper: true,
        label: 'Issuing Organization',
        placeholder: 'All issuers',
        hint: 'Narrows the certificates below',
        searchable: true,
        getOptions: (localFilters) => toOptions(getIssuerNamesFor({ families: localFilters?.certFamily || [] })),
        multipleLabel: (count) => `${count} issuers`
      },
      {
        key: 'certName',
        type: 'comboMulti',
        label: 'Certification Name',
        placeholder: 'Type or choose from list',
        countNoun: ['certificate', 'certificates'],
        maxRows: 5,
        selectAll: (localFilters) => localFilters?.certFamily?.length > 0 || localFilters?.certIssuer?.length > 0,
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
      { key: 'workMode', type: 'multiSelect', label: 'Work Mode', placeholder: 'Select work mode', options: workModeOptions },
      { key: 'availability', type: 'select', label: 'Availability', placeholder: 'Select availability', options: availabilityOptions },
      { key: 'relocationReady', type: 'checkbox', label: 'Open to Relocation' },
      { key: 'travelReady', type: 'checkbox', label: 'Open to Business Travel' }
    ]
  }
];

const ALL_FIELDS = FILTER_GROUPS.flatMap((group) => group?.fields);
const HELPER_KEYS = ALL_FIELDS.filter((field) => field.helper).map((field) => field.key);
// The helper fields' values in `f` (empty when it has none), e.g. to keep them through a reset.
const helpersOf = (f = {}) => Object.fromEntries(HELPER_KEYS.map((key) => [key, f?.[key] || []]));

// A list narrowed by a helper with nothing picked from it. The helper alone
// filters nothing, so Apply doesn't search then: it points at the list.
const ORPHAN_CHECKS = [
  {
    group: 'skills',
    field: 'skills',
    test: (f) => f?.skillCategory?.length > 0 && !f?.skills?.length,
    message: 'Pick skills, use Select all, or clear the category.'
  },
  {
    group: 'certifications',
    field: 'certName',
    test: (f) => (f?.certFamily?.length > 0 || f?.certIssuer?.length > 0) && !f?.certName?.length,
    message: 'Pick certificates, use Select all, or clear the family and issuer.'
  }
];
const orphansIn = (f) => ORPHAN_CHECKS.filter((check) => check.test(f));

// "Match any / all" under a group's list, once 2+ are picked. Stored as `key`.
const MATCH_TOGGLES = {
  skills: { list: 'skills', key: 'skillsMatch' },
  languages: { list: 'languages', key: 'languagesMatch', ...LANGUAGE_MATCH },
  certifications: { list: 'certName', key: 'certMatch', ...CERTIFICATE_MATCH }
};

const emptyValueForType = (type) => {
  switch (type) {
    // Its currency is part of the salary view (lib/salaryView.js).
    case 'salaryRange':
      return { min: '', max: '' };
    case 'experienceRange':
      return EMPTY_EXPERIENCE;
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

// skillsMatch, languagesMatch and certMatch aren't filters of their own (they
// never count as active): each says whether 2+ picks are "any of" or "all of".
const DEFAULT_FILTERS = {
  ...ALL_FIELDS?.reduce((acc, field) => {
    acc[field.key] = emptyValueForType(field?.type);
    return acc;
  }, {}),
  skillsMatch: 'any',
  languagesMatch: 'any',
  certMatch: 'any'
};

const isFieldActive = (field, localFilters) => {
  if (field?.helper) return false;
  const value = localFilters?.[field?.key];
  switch (field?.type) {
    case 'salaryRange':
      return !!(value?.min || value?.max);
    case 'experienceRange':
      return experienceActive(value);
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

const hasActiveFilters = (f) => ALL_FIELDS.some((field) => isFieldActive(field, f));

// Saved filters come back from the API with empty values left out, so both
// sides are filled in with the defaults before comparing. Helpers aren't
// filters, so they never make the fields differ from the results.
const normalizeFilters = (f = {}) => {
  const merged = {
    ...DEFAULT_FILTERS,
    ...f,
    salary: { ...DEFAULT_FILTERS.salary, ...f?.salary },
    experience: { ...DEFAULT_FILTERS.experience, ...f?.experience }
  };
  Object.values(MATCH_TOGGLES).forEach(({ list, key }) => {
    merged[key] = merged[list]?.length >= 2 && merged[key] === 'all' ? 'all' : 'any';
  });
  HELPER_KEYS.forEach((key) => delete merged[key]);
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
// `view`: the salary view (and currency) the salary range is typed in.
const groupSummaryItems = (groupId, f, view) => {
  switch (groupId) {
    case 'basic':
      return [f.position?.trim(), ...(f.location || []), ...(f.country || [])].filter(Boolean);
    case 'experience':
      return [
        experienceActive(f.experience) && experienceLabel(f.experience),
        ...(f.education || []).map((level) => optionLabel(educationOptions, level))
      ].filter(Boolean);
    case 'salary': {
      const { min, max } = f.salary || {};
      if (!min && !max) return [];
      // In the range's own terms (net/gross, month/year), the view's currency.
      const terms = rangeView(f.salary, view);
      const symbol = currencySymbol(terms.currency);
      const prefix = symbol.length > 1 ? `${symbol} ` : symbol;
      const from = min ? `${prefix}${formatAmount(min)}` : '';
      const to = max ? `${prefix}${formatAmount(max)}` : '';
      const per = `${basisWord(terms.basis)} / ${periodWord(terms.period)}`;
      if (from && to) return [`${from} – ${to} ${per}`];
      return [`${from ? `From ${from}` : `Up to ${to}`} ${per}`];
    }
    case 'skills':
      return [...(f.skills || [])];
    case 'languages':
      return (f.languages || []).map((entry) => (entry?.levels?.length ? `${entry.name} (${entry.levels.join(', ')})` : entry?.name));
    case 'industry': {
      const subs = f.subIndustry || [];
      const withoutSub = (f.industry || []).filter((name) => !getSubIndustries(name).some((sub) => subs.includes(sub)));
      return [...subs, ...withoutSub];
    }
    case 'certifications':
      return [f.hasCertifications && 'Has a certification', ...(f.certName || [])].filter(Boolean);
    case 'status':
      return [
        f.status && optionLabel(statusOptions, f.status),
        ...(f.jobType || []).map((type) => optionLabel(jobTypeOptions, type)),
        ...(f.workMode || []).map((mode) => optionLabel(workModeOptions, mode)),
        f.availability && optionLabel(availabilityOptions, f.availability),
        f.relocationReady && 'Open to relocation',
        f.travelReady && 'Open to business travel'
      ].filter(Boolean);
    default:
      return [];
  }
};

const groupSummary = (groupId, f, view) => {
  const items = groupSummaryItems(groupId, f, view);
  return items.length > 2 ? `${items.slice(0, 2).join(', ')} +${items.length - 2}` : items.join(', ');
};

const fieldId = (key) => `filter-${key}`;

// Filter inputs are white with the same 9px corners as the dropdowns.
const INPUT_CLASS = 'bg-white rounded-[9px]';

/**
 * The fields are a draft: nothing is searched until Apply filters (or Enter in
 * a text field). Clear all, taking off the last filter and picking a saved
 * filter search right away.
 * `appliedFilters` / `appliedView`: what the results show now (the view the
 * applied salary range was typed in). `onApply(filters, view?)`: search with these.
 */
const FilterSidebar = ({
  appliedFilters = {},
  appliedView = null,
  onApply = () => {},
  onClearFilters = () => {},
  isCollapsed = false,
  // False where the filters must stay beside the cards (no hide button then).
  canCollapse = true,
  onToggleCollapse = () => {},
  onActiveCountChange = () => {},
  onNotify = () => {}
}) => {
  const [localFilters, setLocalFilters] = useState({
    ...DEFAULT_FILTERS,
    ...appliedFilters
  });

  const [savedFilters, setSavedFilters] = useState([]);
  const [activeSavedFilterId, setActiveSavedFilterId] = useState(null);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const [isNamingFilter, setIsNamingFilter] = useState(false);
  const [filterNameDraft, setFilterNameDraft] = useState('');
  const [openGroups, setOpenGroups] = useState(DEFAULT_OPEN_GROUPS);
  // Lists Apply pointed at (a helper set, nothing picked); each one's message
  // shows until something is picked from it or its helper is cleared.
  const [flagged, setFlagged] = useState([]);
  const [salaryView, setSalaryView] = useSalaryView();

  // A saved filter keeps the salary view its range was typed in (`view`).
  const toEntry = (row) => ({ id: row.id, name: row.name, filters: filtersToFrontend(row.filters), view: savedFilterView(row.filters) });

  useEffect(() => {
    listSavedFilters()
      .then((rows) => setSavedFilters(rows.map(toEntry)))
      .catch(() => {});
  }, []);

  // Where the candidates this company can find live: the City field's suggestions.
  // Without them the field still takes typed cities.
  const [cityPlaces, setCityPlaces] = useState([]);
  useEffect(() => {
    listSearchCities()
      .then(setCityPlaces)
      .catch(() => {});
  }, []);
  // What a field's getOptions may need besides the filters.
  const optionContext = { cities: cityPlaces };

  // Every field edits the draft only - except taking off the last filter while
  // the results still show some: that's Clear all, so it searches right away
  // instead of waiting for Apply.
  // (The helpers stay as they are: they only narrow a list.)
  const updateDraft = (updatedFilters) => {
    if (!hasActiveFilters(updatedFilters) && hasActiveFilters(appliedFilters)) {
      clearFilters(helpersOf(updatedFilters));
      return;
    }
    setLocalFilters(updatedFilters);
  };

  const handleFilterChange = (key, value) => {
    updateDraft({ ...localFilters, [key]: value });
  };

  // Something in the fields isn't searched yet: a field differs, or a salary
  // range is now typed in another currency. (Its net/gross and month/year ride
  // on the range itself, so showing salaries another way changes nothing here.)
  const salaryRangeOn = !!(localFilters?.salary?.min || localFilters?.salary?.max);
  const hasChanges =
    !sameFilters(localFilters, appliedFilters) || (salaryRangeOn && salaryView.currency !== appliedView?.currency);

  const orphans = orphansIn(localFilters);
  const orphanFields = orphans.map((check) => check.field).join(',');
  useEffect(() => {
    const stillOrphan = orphanFields.split(',');
    setFlagged((prev) => (prev.some((field) => !stillOrphan.includes(field)) ? prev.filter((field) => stillOrphan.includes(field)) : prev));
  }, [orphanFields]);
  const fieldErrors = Object.fromEntries(orphans.filter((check) => flagged.includes(check.field)).map((check) => [check.field, check.message]));

  const handleApply = () => {
    // A helper with nothing picked under it: open its group and point at the list, search nothing.
    if (orphans.length) {
      setFlagged(orphans.map((check) => check.field));
      setOpenGroups((prev) => ({ ...prev, ...Object.fromEntries(orphans.map((check) => [check.group, true])) }));
      // Once the group has unfolded.
      setTimeout(() => {
        document.getElementById(fieldId(orphans[0].field))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 320);
      return;
    }
    if (!hasChanges) return;
    onApply(localFilters);
    // Below 846px the filters cover the results; close them to show what was found.
    if (!isCollapsed && window.matchMedia?.('(max-width: 845px)')?.matches) onToggleCollapse();
  };

  // Enter in a typed field (Position, the salary amounts) applies, like a
  // form. Dropdowns and the Skills box use Enter themselves, so they're left alone.
  const handleBodyKeyDown = (e) => {
    const target = e?.target;
    if (e?.key !== 'Enter' || e.defaultPrevented || target?.tagName !== 'INPUT') return;
    if (target.getAttribute('role') === 'combobox' || target.closest('[role="listbox"]')) return;
    e.preventDefault();
    handleApply();
  };

  // Subindustries of an unpicked industry go, and so do issuers outside the
  // picked families (Issuer only narrows the list). Picked skills and
  // certificates always stay, whatever list a helper shows now.
  const handleMultiChange = (key, updated) => {
    const next = { ...localFilters, [key]: updated };

    if (key === 'industry') {
      const validSubs = updated.flatMap((industryName) => getSubIndustries(industryName));
      next.subIndustry = (localFilters?.subIndustry || []).filter((sub) => validSubs.includes(sub));
    }

    if (key === 'certFamily') {
      const validIssuers = new Set(getIssuerNamesFor({ families: updated }));
      next.certIssuer = (localFilters?.certIssuer || []).filter((issuer) => validIssuers.has(issuer));
    }

    updateDraft(next);
  };

  const handleBooleanToggle = (key) => {
    handleFilterChange(key, !localFilters?.[key]);
  };

  // Searches with no filters right away. `keep`: fields to leave as they are (the helpers).
  const clearFilters = (keep = {}) => {
    setLocalFilters({ ...DEFAULT_FILTERS, ...keep });
    setActiveSavedFilterId(null);
    setIsNamingFilter(false);
    onClearFilters();
  };

  const handleClearAll = () => clearFilters();

  // "Clear" in an open group's header empties just that group (the salary
  // currency is part of the salary view, so it stays as picked) and hands
  // focus back to the group title.
  const handleClearGroup = (group) => {
    const cleared = { ...localFilters };
    group?.fields?.forEach((field) => {
      // An emptied salary range drops its terms too (the currency is the view's and stays).
      cleared[field.key] = emptyValueForType(field.type);
    });
    if (MATCH_TOGGLES[group?.id]) cleared[MATCH_TOGGLES[group.id].key] = 'any';
    updateDraft(cleared);
    document.getElementById(`filter-group-toggle-${group?.id}`)?.focus();
  };

  const getActiveFiltersCount = () => {
    return ALL_FIELDS?.filter((field) => isFieldActive(field, localFilters))?.length;
  };

  // The toolbar's Filters button shows the same count while the filters are hidden.
  const activeFiltersCount = getActiveFiltersCount();
  useEffect(() => {
    onActiveCountChange(activeFiltersCount);
  }, [activeFiltersCount, onActiveCountChange]);

  // A saved range's net/gross and month/year are in its filters; only the currency is the view's.
  const sameView = (entry) => !entry?.view || entry.view.currency === salaryView.currency;
  const isSavedFilterCurrent = (entry) =>
    entry?.id === activeSavedFilterId && sameFilters(entry?.filters, localFilters) && sameView(entry);

  const handleToggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev?.[id] }));
  };

  // A saved filter searches right away, and expands every group it sets
  // something in, so what's switched on is visible; open groups stay open.
  const handleApplySavedFilter = (entry) => {
    // Only filters are saved; a helper from an older saved filter isn't brought back.
    const nextFilters = { ...DEFAULT_FILTERS, ...entry?.filters, ...helpersOf() };
    // Its salary range carries its own net/gross and month/year; it's typed in its currency.
    if (entry?.view && entry.view.currency !== salaryView.currency) setSalaryView({ ...salaryView, currency: entry.view.currency });
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
    onApply(nextFilters, entry?.view || undefined);
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
        ? await updateSavedFilter(activeSavedFilterId, { filters: localFilters, view: salaryView })
        : await createSavedFilter(name, localFilters, salaryView);
      const entry = toEntry(row);
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
        const options = field?.getOptions ? field.getOptions(localFilters, optionContext) : field?.options;
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
              multipleLabel={field?.multipleLabel}
              searchable={!!field?.searchable}
              disabled={isDisabled}
              // A helper is cleared on its own, without touching what's picked under it.
              clearable={!!field?.helper}
              clearPosition="end"
              clearLabel={`Clear ${field?.label?.toLowerCase()}`}
              aria-describedby={field?.hint ? `${fieldId(field?.key)}-hint` : undefined}
            />
            {field?.hint && (
              <p id={`${fieldId(field?.key)}-hint`} className={styles.fieldHint}>{field.hint}</p>
            )}
            {field?.chips && (
              <PickedChips
                label={`Selected ${field?.label?.toLowerCase()}`}
                items={(localFilters?.[field?.key] || []).map((value) => ({ value, label: optionLabel(options, value) }))}
                onRemove={(value) => handleMultiChange(field?.key, (localFilters?.[field?.key] || []).filter((v) => v !== value))}
              />
            )}
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
        const options = field?.getOptions ? field.getOptions(localFilters, optionContext) : field?.options;
        const picked = localFilters?.[field?.key] || [];
        const error = fieldErrors[field?.key];
        const errorId = `${fieldId(field?.key)}-error`;
        return (
          <div className={styles.field} key={field?.key} data-invalid={error ? 'true' : undefined}>
            {field?.countNoun ? (
              <div className={styles.fieldLabelRow}>
                {renderLabel(field)}
                {picked.length > 0 && (
                  <span className={styles.fieldHint}>
                    {picked.length} {picked.length === 1 ? field.countNoun[0] : field.countNoun[1]}
                  </span>
                )}
              </div>
            ) : (
              renderLabel(field)
            )}
            <Combobox
              id={fieldId(field?.key)}
              options={options}
              value={picked}
              onChange={(value) => handleFilterChange(field?.key, value)}
              placeholder={field?.placeholder}
              multiple
              selectAll={!!field?.selectAll?.(localFilters)}
              maxRows={field?.maxRows}
              invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            {error && (
              <p id={errorId} className={styles.fieldError} role="alert">
                <Icon name="AlertCircle" size={14} strokeWidth={2.2} />
                {error}
              </p>
            )}
          </div>
        );
      }

      case 'experienceRange':
        return (
          <ExperienceRangeFilter
            key={field?.key}
            id={fieldId(field?.key)}
            label={field?.label}
            value={localFilters?.[field?.key]}
            onChange={(range) => handleFilterChange(field?.key, range)}
          />
        );

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

  // Hidden: nothing to show on a computer (the toolbar's Filters button brings
  // them back); where they slide in over the page, this empty card is what
  // slides out of view.
  if (isCollapsed) {
    return <div className={`${styles.filters} ${styles.collapsed}`} aria-hidden="true" />;
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
            {/* Only where hiding them helps (card view: from three columns). */}
            {canCollapse && (
              <button
                onClick={onToggleCollapse}
                className={styles.filtersHeadCollapse}
                aria-label="Hide filters"
              >
                {/* Turns into the toolbar button's > as the filters hide. */}
                <span className={styles.filtersChevron}>
                  <Icon name="ChevronLeft" size={18} strokeWidth={2.2} />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Scrollable middle: saved filters + collapsible groups */}
      <div className={styles.filtersBody} onKeyDown={handleBodyKeyDown}>
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
          // Summary, Clear and the fields stay in the page either way and fold /
          // fade with the group (styles: $fold); while closed, the fields are inert.
          const hasActive = activeCount > 0;
          const matchToggle = MATCH_TOGGLES[group?.id];
          return (
            <div className={`${styles.fgroup} ${isOpen ? styles.fgroupOpen : ''}`} key={group?.id}>
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
                    {hasActive && (
                      <span className={styles.fgroupCount}>{activeCount}</span>
                    )}
                    {/* keeps room for the absolutely placed Clear button */}
                    {hasActive && <span className={styles.fgroupClearSpace} aria-hidden="true" />}
                    <Icon name="ChevronDown" size={16} strokeWidth={2.2} className={styles.fgroupChevron} />
                  </span>
                  {hasActive && (
                    <span className={styles.fgroupSummaryFold} aria-hidden={isOpen || undefined}>
                      <span className={styles.fgroupSummary}>{groupSummary(group?.id, localFilters, salaryView)}</span>
                    </span>
                  )}
                </button>
                {hasActive && (
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
              <div className={styles.fgroupFold} inert={isOpen ? undefined : ''}>
                <div className={styles.fgroupFoldInner}>
                  <div className={styles.fgroupBody} id={bodyId}>
                    {group?.fields?.map(renderField)}
                    {matchToggle && localFilters?.[matchToggle.list]?.length >= 2 && (
                      <SkillsMatchToggle
                        value={localFilters?.[matchToggle.key]}
                        onChange={(value) => handleFilterChange(matchToggle.key, value)}
                        {...(matchToggle.label
                          ? { label: matchToggle.label, anyHint: matchToggle.anyHint, allHint: matchToggle.allHint }
                          : {})}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Pinned footer: Save filter left, Apply filters right; naming a new filter takes the row */}
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
          <div className={styles.footActions}>
            <button
              type="button"
              className={styles.saveFilterBtn}
              onClick={handleSaveFilter}
              disabled={getActiveFiltersCount() === 0}
              title={activeSavedFilterId ? 'Update the saved filter with these fields' : undefined}
            >
              <Icon name="Save" size={16} />
              {activeSavedFilterId ? 'Update filter' : 'Save filter'}
            </button>
            <button
              type="button"
              className={styles.applyFiltersBtn}
              onClick={handleApply}
              // On while a helper waits for picks too: a click shows what's missing.
              disabled={!hasChanges && !orphans.length}
              title={hasChanges || orphans.length ? undefined : 'The results already show these filters'}
            >
              <Icon name="Search" size={16} strokeWidth={2.4} />
              Apply filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;
