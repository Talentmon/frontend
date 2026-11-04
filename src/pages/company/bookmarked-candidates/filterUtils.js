// Experience buckets, the same as Search's (candidate-search.service.ts
// EXPERIENCE_BUCKETS): both ends count, so 3 years is in "1-3" and "3-5".
const EXPERIENCE_BUCKETS = {
  '0-1': [0, 1],
  '1-3': [1, 3],
  '3-5': [3, 5],
  '5-10': [5, 10],
  '10+': [10, Infinity]
};

export const EXPERIENCE_OPTIONS = Object.keys(EXPERIENCE_BUCKETS).map((value) => ({
  value,
  label: `${value} years`
}));

/** Whether `years` falls in the bucket; no bucket (Any experience) always does. */
export const inExperienceRange = (years, bucket) => {
  const range = EXPERIENCE_BUCKETS[bucket];
  return !range || (years >= range[0] && years <= range[1]);
};
