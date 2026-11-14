// utils/salaryNormalizationService.js - SalaryNormalizationService
//
// Turns a user-entered salary (amount + currency + pay period) into its
// base-currency (EUR) value at today's rate, while always preserving the
// original values untouched. The backend keeps candidates' EUR salaries the
// same way: worked out on save and again after each daily rates refresh.
// Here it converts a company's salary filter range (Bookmarked, Purchased).
import { isSupportedCurrency } from './currencyService';
import { getExchangeRate, BASE_CURRENCY } from './exchangeRateService';

export const SALARY_PERIODS = ['month', 'year'];
const BASE_PERIOD = 'month';

// Multiply an amount in `period` by this to get a monthly amount.
const MONTHLY_FACTOR = { month: 1, year: 1 / 12 };

const round2 = (n) => Math.round(n * 100) / 100;

// Validates a single salary amount (candidate's "expected salary" field).
export const validateSalaryAmount = ({ amount, currency }) => {
  const errors = [];
  if (amount !== '' && amount !== null && amount !== undefined) {
    const n = Number(amount);
    if (Number.isNaN(n)) errors.push('Salary must be a number.');
    else if (n < 0) errors.push('Salary cannot be negative.');
  }
  if (currency && !isSupportedCurrency(currency)) errors.push(`Unsupported currency: ${currency}.`);
  return { valid: errors.length === 0, errors };
};

// Validates a from/to range (job-style salary range, e.g. a search filter or
// a future job-posting form). Either bound may be omitted (open-ended).
export const validateSalaryRange = ({ from, to, currency }) => {
  const errors = [];
  const hasFrom = from !== '' && from !== null && from !== undefined;
  const hasTo = to !== '' && to !== null && to !== undefined;
  const fromNum = hasFrom ? Number(from) : null;
  const toNum = hasTo ? Number(to) : null;

  if (hasFrom && Number.isNaN(fromNum)) errors.push('"From" must be a number.');
  else if (hasFrom && fromNum < 0) errors.push('"From" cannot be negative.');

  if (hasTo && Number.isNaN(toNum)) errors.push('"To" must be a number.');
  else if (hasTo && toNum < 0) errors.push('"To" cannot be negative.');

  if (hasFrom && hasTo && !Number.isNaN(fromNum) && !Number.isNaN(toNum) && fromNum > toNum) {
    errors.push('"From" must be less than or equal to "To".');
  }
  if (currency && !isSupportedCurrency(currency)) errors.push(`Unsupported currency: ${currency}.`);

  return { valid: errors.length === 0, errors };
};

// Normalizes a single amount. Returns { ok:false, errors } on invalid input
// or when no exchange rate is available for the given currency (missing
// rate / unsupported currency / provider down are all the same case here).
export const normalizeSalary = ({ amount, currency, period = BASE_PERIOD }) => {
  const validation = validateSalaryAmount({ amount, currency });
  if (!validation.valid) return { ok: false, errors: validation.errors };
  if (amount === '' || amount === null || amount === undefined) {
    return { ok: false, errors: ['Amount is required.'] };
  }

  const rateInfo = getExchangeRate(currency);
  if (!rateInfo) return { ok: false, errors: [`No exchange rate available for ${currency}.`] };

  const monthlyAmount = Number(amount) * (MONTHLY_FACTOR[period] ?? 1);
  const baseAmount = round2(monthlyAmount * rateInfo.rate);

  return {
    ok: true,
    original: { amount: Number(amount), currency, period },
    normalized: {
      baseAmount,
      baseCurrency: BASE_CURRENCY,
      basePeriod: BASE_PERIOD,
      exchangeRate: rateInfo.rate,
      exchangeRateDate: rateInfo.date,
    },
  };
};

// Normalizes a from/to range in one call, sharing a single exchange-rate
// lookup between the two bounds (mirrors "fetch the rate once" from the
// spec). Either bound may be absent (open-ended salary).
export const normalizeSalaryRange = ({ from, to, currency, period = BASE_PERIOD }) => {
  const validation = validateSalaryRange({ from, to, currency });
  if (!validation.valid) return { ok: false, errors: validation.errors };

  const rateInfo = getExchangeRate(currency);
  if (!rateInfo) return { ok: false, errors: [`No exchange rate available for ${currency}.`] };

  const toBase = (v) => (v === '' || v === null || v === undefined ? null : round2(Number(v) * (MONTHLY_FACTOR[period] ?? 1) * rateInfo.rate));

  return {
    ok: true,
    original: { from: from ?? null, to: to ?? null, currency, period },
    normalized: {
      fromBase: toBase(from),
      toBase: toBase(to),
      baseCurrency: BASE_CURRENCY,
      basePeriod: BASE_PERIOD,
      exchangeRate: rateInfo.rate,
      exchangeRateDate: rateInfo.date,
    },
  };
};
