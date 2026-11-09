// Filters Bookmarked and Purchased share — Search's filters, run in the browser
// on the company's own list. They match the way Search's backend does
// (candidate-search.service.ts), and the lists offer only what the candidates
// on the page actually have, with how many have it.
import { buildBaseSalaryRange, filterByBaseSalary } from 'utils/salaryFilterService';
import { CATEGORY_NAMES as SKILL_CATEGORY_NAMES, getSkillNamesFor } from 'utils/skills';
import { getSubIndustries } from 'utils/industries';
import { currencySymbol } from 'utils/currencyService';
import { EXPERIENCE_OPTIONS, inExperienceRange } from '../bookmarked-candidates/filterUtils';

export { EXPERIENCE_OPTIONS };

export const COMMON_EMPTY = {
  search: '',
  industry: [],
  subIndustry: [],
  experience: '',
  skillCategory: [],
  skills: [],
  skillsMatch: 'any',
  salary: { min: '', max: '', currency: 'EUR' },
  languages: [],
  country: [],
  location: [], // cities
  education: '',
  certificates: [],
  candidateStatus: '',
  availability: '',
  jobType: [],
  relocationReady: false,
  travelReady: false,
  hasNotes: false
};

// Same values and labels as Search's sidebar (FilterSidebar.jsx).
export const EDUCATION_OPTIONS = [
  { value: 'high-school', label: 'High School' },
  { value: 'associate-degree', label: 'Associate Degree' },
  { value: 'bachelors-degree', label: "Bachelor's Degree" },
  { value: 'masters-degree', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' }
];

export const AVAILABILITY_OPTIONS = [
  { value: 'immediately', label: 'Immediately' },
  { value: '2-weeks', label: 'Within 2 weeks' },
  { value: '1-month', label: 'Within 1 month' },
  { value: '3-months', label: 'Within 3 months' }
];

// Notice of at most this many days (Search: candidate-search.service.ts AVAILABILITY_DAYS).
const AVAILABILITY_DAYS = { immediately: 0, '2-weeks': 14, '1-month': 30, '3-months': 90 };

export const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' }
];

// As the cards' status badge says it.
export const CANDIDATE_STATUS_OPTIONS = [
  { value: 'active', label: 'Actively searching' },
  { value: 'open', label: 'Open to offers' }
];

export const lower = (value) => String(value || '').trim().toLowerCase();

export const toggleIn = (list = [], value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export const optionLabel = (options, value) => options.find((option) => option.value === value)?.label || value;

export const salaryChipLabel = ({ min, max, currency }) => {
  const symbol = currencySymbol(currency || 'EUR');
  const prefix = symbol.length > 1 ? `${symbol} ` : symbol;
  const from = min ? `${prefix}${Number(min).toLocaleString('en-US')}` : '';
  const to = max ? `${prefix}${Number(max).toLocaleString('en-US')}` : '';
  const range = from && to ? `${from} – ${to}` : from ? `From ${from}` : `Up to ${to}`;
  return `${range} net / mo`;
};

const countBy = (candidates, valuesOf) => {
  const counts = {};
  candidates.forEach((candidate) => {
    new Set(valuesOf(candidate)).forEach((value) => {
      if (value) counts[value] = (counts[value] || 0) + 1;
    });
  });
  return counts;
};

// Names as written on the profiles (the first spelling wins), A–Z.
export const uniqueNames = (names) => {
  const byKey = new Map();
  names.forEach((name) => {
    const text = typeof name === 'string' ? name.trim() : name;
    if (text && !byKey.has(lower(text))) byKey.set(lower(text), text);
  });
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
};

// Counts keyed by the spelling uniqueNames keeps.
const countNames = (candidates, namesOf) => {
  const byKey = countBy(candidates, (c) => namesOf(c).map(lower));
  return (name) => byKey[lower(name)] || 0;
};

// ===== Matching (one candidate against one filter) =====
const matchers = {
  country: (c, countries) => countries.some((name) => lower(name) === lower(c?.country)),
  location: (c, places) => places.some((place) => lower(place) === lower(c?.location)),
  education: (c, level) => !!c?.educationLevels?.includes(level),
  availability: (c, bucket) => typeof c?.noticeDays === 'number' && c.noticeDays <= AVAILABILITY_DAYS[bucket],
  jobType: (c, types) => !!c?.jobType?.some((type) => types.includes(type)),
  certificates: (c, names) => !!c?.certificates?.some((cert) => names.some((name) => lower(name) === lower(cert?.name))),
  candidateStatus: (c, status) => c?.searchStatus === status
};

export function applyCommonFilters(list, f) {
  let out = list;
  const keep = (test) => {
    out = out.filter(test);
  };

  // A picked industry covers all its subindustries.
  if (f.industry.length || f.subIndustry.length) {
    keep((c) => c?.industries?.some((name) => f.industry.includes(name)) || c?.subIndustries?.some((name) => f.subIndustry.includes(name)));
  }
  if (f.experience) keep((c) => inExperienceRange(c?.experience, f.experience));

  // Whole skill names, Match any / Match all; a category with no skill picked matches any skill in it.
  if (f.skills.length) {
    const names = f.skills.map(lower);
    keep((c) => {
      const has = new Set(c?.skills?.map(lower));
      return f.skillsMatch === 'all' ? names.every((name) => has.has(name)) : names.some((name) => has.has(name));
    });
  } else if (f.skillCategory.length) {
    const names = new Set(getSkillNamesFor({ categories: f.skillCategory }).map(lower));
    keep((c) => c?.skills?.some((skill) => names.has(lower(skill))));
  }

  if (f.salary.min || f.salary.max) {
    const range = buildBaseSalaryRange({ min: f.salary.min, max: f.salary.max, currency: f.salary.currency || 'EUR' });
    out = filterByBaseSalary(out, range, (c) => c?.expectedSalary?.base);
  }

  // Any picked language, at one of its picked levels (none picked = any level).
  if (f.languages.length) {
    keep((c) =>
      f.languages.some((entry) =>
        c?.languages?.some((language) => lower(language?.name) === lower(entry?.name) && (!entry?.levels?.length || entry.levels.includes(language?.level)))
      )
    );
  }

  if (f.country.length) keep((c) => matchers.country(c, f.country));
  if (f.location.length) keep((c) => matchers.location(c, f.location));
  if (f.education) keep((c) => matchers.education(c, f.education));
  if (f.certificates.length) keep((c) => matchers.certificates(c, f.certificates));
  if (f.candidateStatus) keep((c) => matchers.candidateStatus(c, f.candidateStatus));
  if (f.availability) keep((c) => matchers.availability(c, f.availability));
  if (f.jobType.length) keep((c) => matchers.jobType(c, f.jobType));
  if (f.relocationReady) keep((c) => c?.relocationReady);
  if (f.travelReady) keep((c) => c?.travelReady);
  if (f.hasNotes) keep((c) => c?.notes?.length > 0);
  return out;
}

/** How many of the common filters are on (each picked value counts). */
export const commonActiveCount = (f) =>
  [
    f.industry.length + f.subIndustry.length,
    f.experience ? 1 : 0,
    f.skillCategory.length + f.skills.length,
    f.salary.min || f.salary.max ? 1 : 0,
    f.languages.length,
    f.country.length,
    f.location.length,
    f.education ? 1 : 0,
    f.certificates.length,
    f.candidateStatus ? 1 : 0,
    f.availability ? 1 : 0,
    f.jobType.length,
    f.relocationReady ? 1 : 0,
    f.travelReady ? 1 : 0,
    f.hasNotes ? 1 : 0
  ].reduce((a, b) => a + b, 0);

// ===== What the lists offer =====
export function commonOptions(candidates) {
  const industryCounts = countBy(candidates, (c) => c?.industries || []);
  const subCounts = countBy(candidates, (c) => c?.subIndustries || []);
  const skills = uniqueNames(candidates.flatMap((c) => c?.skills || []));
  const skillKeys = new Set(skills.map(lower));
  const countMatching = (options, key) =>
    Object.fromEntries(options.map(({ value }) => [value, candidates.filter((c) => matchers[key](c, key === 'jobType' ? [value] : value)).length]));
  const countriesOf = (c) => (c?.country ? [c.country] : []);
  const locationsOf = (c) => (c?.location?.trim() ? [c.location] : []);
  const certsOf = (c) => (c?.certificates || []).map((cert) => cert?.name).filter(Boolean);
  return {
    total: candidates.length,
    industryCounts,
    subCounts,
    // Each industry with the subindustries the candidates have in it.
    industryTree: Object.keys(industryCounts).sort().map((name) => ({
      name,
      subs: getSubIndustries(name).filter((sub) => subCounts[sub]).sort()
    })),
    experienceCounts: Object.fromEntries(
      EXPERIENCE_OPTIONS.map(({ value }) => [value, candidates.filter((c) => inExperienceRange(c?.experience, value)).length])
    ),
    skills,
    // Categories holding at least one of those skills.
    skillCategories: SKILL_CATEGORY_NAMES.filter((category) =>
      getSkillNamesFor({ categories: [category] }).some((name) => skillKeys.has(lower(name)))
    ),
    languages: uniqueNames(candidates.flatMap((c) => (c?.languages || []).map((language) => language?.name))),
    countries: uniqueNames(candidates.flatMap(countriesOf)),
    countryCount: countNames(candidates, countriesOf),
    // Cities (the candidates' location)
    locations: uniqueNames(candidates.flatMap(locationsOf)),
    locationCount: countNames(candidates, locationsOf),
    certificates: uniqueNames(candidates.flatMap(certsOf)),
    certificateCount: countNames(candidates, certsOf),
    educationCounts: countMatching(EDUCATION_OPTIONS, 'education'),
    availabilityCounts: countMatching(AVAILABILITY_OPTIONS, 'availability'),
    jobTypeCounts: countMatching(JOB_TYPE_OPTIONS, 'jobType'),
    candidateStatusCounts: countMatching(CANDIDATE_STATUS_OPTIONS, 'candidateStatus'),
    relocationCount: candidates.filter((c) => c?.relocationReady).length,
    travelCount: candidates.filter((c) => c?.travelReady).length
  };
}

/** The candidates' skills, narrowed to the picked categories (none picked = all). */
export const skillsInCategories = (skills, categories = []) => {
  if (!categories.length) return skills;
  const inCategories = new Set(getSkillNamesFor({ categories }).map(lower));
  return skills.filter((name) => inCategories.has(lower(name)));
};

// Changes that also tidy what depends on them.

/** Industries picked; a picked industry covers its subindustries, so they drop out. */
export const withIndustries = (filters, industries) => {
  const covered = new Set(industries.flatMap((name) => getSubIndustries(name)));
  return { ...filters, industry: industries, subIndustry: filters.subIndustry.filter((sub) => !covered.has(sub)) };
};

/** Skill categories picked; skills outside them drop out. */
export const withSkillCategories = (filters, categories) => {
  const valid = new Set(getSkillNamesFor({ categories }).map(lower));
  return { ...filters, skillCategory: categories, skills: filters.skills.filter((name) => valid.has(lower(name))) };
};
