// utils/salaryFilterService.js - SalaryFilterService
//
// Rule: filtering/sorting NEVER converts currency per record. The user's
// filter range is converted to the base currency exactly once (see
// buildBaseSalaryRange), and every candidate/record being filtered is
// expected to already carry a precomputed `*Base` field (from
// salaryNormalizationService, computed when the salary was entered/saved).
// This mirrors comparing indexed `salary_from_base` / `salary_to_base`
// columns in SQL instead of converting every row on every query.
import { normalizeSalaryRange } from './salaryNormalizationService';

// Converts a company's chosen filter range (min/max in a currency they pick)
// into base-currency bounds, once. Returns null if no bounds were given, or
// { minBase, maxBase, ok:false, errors } if the range/currency is invalid.
export const buildBaseSalaryRange = ({ min, max, currency }) => {
  const hasMin = min !== '' && min !== null && min !== undefined;
  const hasMax = max !== '' && max !== null && max !== undefined;
  if (!hasMin && !hasMax) return null;

  const result = normalizeSalaryRange({ from: min, to: max, currency });
  if (!result.ok) return { ok: false, errors: result.errors, minBase: null, maxBase: null };

  return { ok: true, minBase: result.normalized.fromBase, maxBase: result.normalized.toBase };
};

// Pure filter over precomputed base salary values - no conversion happens
// here, only numeric comparison, so it's as cheap as a DB range scan on
// indexed columns.
export const filterByBaseSalary = (records, baseRange, getBaseAmount = (r) => r?.expectedSalaryBase) => {
  if (!baseRange || baseRange.ok === false) return records;
  const { minBase, maxBase } = baseRange;
  return records.filter((record) => {
    const value = getBaseAmount(record);
    if (value === null || value === undefined) return false;
    if (minBase !== null && value < minBase) return false;
    if (maxBase !== null && value > maxBase) return false;
    return true;
  });
};

// Pure sort over precomputed base salary values.
export const sortByBaseSalary = (records, direction = 'desc', getBaseAmount = (r) => r?.expectedSalaryBase) => {
  const sign = direction === 'asc' ? 1 : -1;
  return [...records].sort((a, b) => sign * ((getBaseAmount(a) ?? 0) - (getBaseAmount(b) ?? 0)));
};
