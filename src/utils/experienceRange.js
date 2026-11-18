// Years of experience as a From – To range, the filter Search, Bookmarked and
// Purchased share. Both ends count; '' leaves that end open. A candidate's
// years are whole years (the backend's years-experience.ts: 2 years and 11
// months is 2), so every candidate has one number and lands in a range or not.

export const EMPTY_EXPERIENCE = { min: '', max: '' };

// The years the two dropdowns offer (empty = open end, the field's X clears it); 0 means under a full year.
const YEARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25, 30];

const yearsLabel = (n) => `${n} ${Number(n) === 1 ? 'year' : 'years'}`;
const isSet = (value) => value !== '' && value !== null && value !== undefined;

/** "From" offers 1 year and up (from 0 is everyone); never past the picked "To". */
export const experienceFromOptions = (range = EMPTY_EXPERIENCE) => [
  ...YEARS.filter((n) => n > 0 && (!isSet(range.max) || n <= Number(range.max))).map((n) => ({ value: String(n), label: yearsLabel(n) }))
];

/** "To" offers 0 years (under one) and up; never below the picked "From". */
export const experienceToOptions = (range = EMPTY_EXPERIENCE) => [
  ...YEARS.filter((n) => !isSet(range.min) || n >= Number(range.min)).map((n) => ({ value: String(n), label: yearsLabel(n) }))
];

export const experienceActive = (range) => isSet(range?.min) || isSet(range?.max);

/** Whether `years` is in the range; no range (Any) always is. */
export const inExperienceRange = (years, range) => {
  const value = Number(years) || 0;
  if (isSet(range?.min) && value < Number(range.min)) return false;
  if (isSet(range?.max) && value > Number(range.max)) return false;
  return true;
};

/** "3–5 years", "5+ years", "Up to 2 years", "3 years". */
export const experienceLabel = (range) => {
  const { min, max } = range || {};
  if (isSet(min) && isSet(max)) return Number(min) === Number(max) ? yearsLabel(min) : `${min}–${max} years`;
  if (isSet(min)) return `${min}+ years`;
  if (isSet(max)) return `Up to ${yearsLabel(max)}`;
  return '';
};

// Filters saved before the range held a bucket, with both ends counting.
// (From 0 is the same as no From, which is how the dropdown shows it.)
const OLD_BUCKETS = { '0-1': ['', 1], '1-3': [1, 3], '3-5': [3, 5], '5-10': [5, 10], '10+': [10, ''] };

/** A saved filter's experience (a range, or an old bucket) as the range the dropdowns hold. */
export const toExperienceRange = (value) => {
  if (typeof value === 'string') {
    const [min, max] = OLD_BUCKETS[value] || ['', ''];
    return { min: String(min), max: String(max) };
  }
  return {
    min: isSet(value?.min) && Number(value.min) > 0 ? String(value.min) : '',
    max: isSet(value?.max) ? String(value.max) : ''
  };
};

/** The range as the backend takes it ({ min, max } numbers, open ends left out), or undefined for Any. */
export const experienceToBackend = (range) => {
  if (!experienceActive(range)) return undefined;
  return {
    ...(isSet(range.min) ? { min: Number(range.min) } : {}),
    ...(isSet(range.max) ? { max: Number(range.max) } : {})
  };
};
