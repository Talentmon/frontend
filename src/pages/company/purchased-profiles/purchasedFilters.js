import {
  COMMON_EMPTY,
  applyCommonFilters,
  commonActiveCount,
  commonOptions,
  uniqueNames
} from '../candidate-filters/commonFilters';
import { OPEN_STATUSES, daysInStage, needsAttention } from './purchasesApi';

// Search's filters (shared with Bookmarked) plus Purchased's own.
export const EMPTY_FILTERS = {
  ...COMMON_EMPTY,
  statuses: [],
  hiringFor: [],
  unlocked: '',
  unlockedBy: [],
  // Set from Review in the pipeline's Needs attention row; shows as a chip only.
  attention: false
};

const DAY_MS = 86400000;

// When the profile was unlocked: the last 7 / 30 / 90 days, or before that.
export const UNLOCKED_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: 'older', label: 'Over 3 months ago' }
];

export const inUnlockedRange = (date, bucket, now = Date.now()) => {
  if (!bucket) return true;
  const age = now - new Date(date).getTime();
  return bucket === 'older' ? age > 90 * DAY_MS : age <= Number(bucket) * DAY_MS;
};

/**
 * What the filters offer: only what the unlocked candidates actually have,
 * each with how many have it (over the whole list, not just what the other
 * filters leave) — Search's filters plus the stages, unlock dates, teammates
 * and "Hiring for" positions.
 */
export function filterOptions(profiles) {
  const unlockers = new Map();
  const stageCounts = {};
  profiles.forEach((p) => {
    stageCounts[p?.recruitmentStatus] = (stageCounts[p?.recruitmentStatus] || 0) + 1;
    if (!p?.unlockedById) return;
    const entry = unlockers.get(p.unlockedById) || { value: p.unlockedById, label: p.unlockedBy, count: 0 };
    entry.count += 1;
    unlockers.set(p.unlockedById, entry);
  });
  return {
    ...commonOptions(profiles),
    stageCounts,
    unlockedCounts: Object.fromEntries(
      UNLOCKED_OPTIONS.map(({ value }) => [value, profiles.filter((p) => inUnlockedRange(p?.unlockedDate, value)).length])
    ),
    unlockers: [...unlockers.values()].sort((a, b) => a.label.localeCompare(b.label)),
    // "Hiring for" positions set on the cards.
    positions: uniqueNames(profiles.map((p) => p?.hiringFor))
  };
}

/** Filters that are on, not counting the search text. */
export const activeFilterCount = (filters) =>
  commonActiveCount(filters) +
  filters.statuses.length +
  filters.hiringFor.length +
  (filters.unlocked ? 1 : 0) +
  filters.unlockedBy.length +
  (filters.attention ? 1 : 0);

const digits = (value = '') => value.replace(/\D/g, '');

// Name, position, current employer, city, country, skills, "Hiring for", email,
// phone (by its digits, whatever the spacing) and the text of the notes.
const matchesSearch = (profile, term) => {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const fields = [profile?.name, profile?.position, profile?.company, profile?.location, profile?.country, profile?.hiringFor, profile?.email];
  if (fields.some((value) => value?.toLowerCase()?.includes(needle))) return true;
  if (profile?.skills?.some((skill) => skill?.toLowerCase()?.includes(needle))) return true;
  if (profile?.notes?.some((note) => note?.text?.toLowerCase()?.includes(needle))) return true;
  const needleDigits = digits(needle);
  return needleDigits.length >= 3 && digits(profile?.phone).includes(needleDigits);
};

export function applyFilters(profiles, filters) {
  const now = Date.now();
  let list = profiles.filter((p) => matchesSearch(p, filters.search));

  if (filters.statuses.length) list = list.filter((p) => filters.statuses.includes(p?.recruitmentStatus));
  if (filters.attention) list = list.filter((p) => needsAttention(p, now));
  if (filters.hiringFor.length) list = list.filter((p) => filters.hiringFor.includes(p?.hiringFor));
  if (filters.unlocked) list = list.filter((p) => inUnlockedRange(p?.unlockedDate, filters.unlocked, now));
  if (filters.unlockedBy.length) list = list.filter((p) => filters.unlockedBy.includes(p?.unlockedById));
  return applyCommonFilters(list, filters);
}

// ===== Sorting (the cards' Sort menu and the table headers share it) =====
const AVAILABILITY_ORDER = { immediately: 0, '2-weeks': 1, '1-month': 2, '3-months': 3 };

const SORT_VALUES = {
  unlocked: (p) => new Date(p?.unlockedDate).getTime() || 0,
  updated: (p) => new Date(p?.statusChangedAt).getTime() || 0,
  // Days in the current status for candidates still in the process; hired and rejected go last.
  waiting: (p) => (OPEN_STATUSES.includes(p?.recruitmentStatus) ? daysInStage(p) : -1),
  name: (p) => (p?.name || '').toLowerCase(),
  experience: (p) => p?.experience || 0,
  // A {amount, currency, base, ...} object — always compare its base-EUR value.
  salary: (p) => p?.expectedSalary?.base ?? 0,
  available: (p) => AVAILABILITY_ORDER[p?.availability] ?? 9
};

// The Sort menu. (The pipeline filters by status, so there's no status sort.)
export const SORT_OPTIONS = [
  { value: 'unlocked-desc', label: 'Recently unlocked' },
  { value: 'unlocked-asc', label: 'Oldest unlocked' },
  { value: 'waiting-desc', label: 'Longest waiting' },
  { value: 'updated-desc', label: 'Recently updated' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'experience-desc', label: 'Most experience' },
  { value: 'salary-desc', label: 'Highest salary' },
  { value: 'salary-asc', label: 'Lowest salary' },
  { value: 'available-asc', label: 'Available soonest' }
];

// Orders only a table header click gives, for the Sort button's label.
const HEADER_ONLY_LABELS = { 'name-desc': 'Name Z–A', 'experience-asc': 'Least experience' };

export const sortLabel = (sortBy) =>
  SORT_OPTIONS.find((option) => option.value === sortBy)?.label || HEADER_ONLY_LABELS[sortBy] || SORT_OPTIONS[0].label;

export const DEFAULT_SORT = 'unlocked-desc';

// The direction a table column starts in when its header is clicked.
export const COLUMN_FIRST_DIR = { name: 'asc', experience: 'desc', salary: 'desc', unlocked: 'desc' };

export const parseSort = (sortBy) => {
  const [key, dir] = sortBy.split('-');
  return { key, dir };
};

export function sortProfiles(profiles, sortBy) {
  const { key, dir } = parseSort(sortBy);
  const valueOf = SORT_VALUES[key] || SORT_VALUES.unlocked;
  return [...profiles].sort((a, b) => {
    const x = valueOf(a);
    const y = valueOf(b);
    const cmp = typeof x === 'string' ? x.localeCompare(y) : x - y;
    // Ties keep the most recently unlocked first.
    return (dir === 'desc' ? -cmp : cmp) || SORT_VALUES.unlocked(b) - SORT_VALUES.unlocked(a);
  });
}
