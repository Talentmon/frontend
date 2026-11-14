import { useMemo, useSyncExternalStore } from 'react';
import { formatMoney } from 'utils/currencyService';
import { useCurrentUser } from './CurrentUserContext';

// How a company sees candidates' salaries: net or gross, per month or per
// year. Candidates give net AND gross for the period they pick, and the other
// period is worked out, so every profile has all four.
//
// The company picks its default in Company profile settings (required). Anyone
// on the team can switch it in the Salary filter; that holds across Search,
// Bookmarked and Purchased until the tab is closed or they sign out, then the
// default from settings applies again.

export const SALARY_BASIS_OPTIONS = [
  { value: 'NET', label: 'Net' },
  { value: 'GROSS', label: 'Gross' }
];

export const SALARY_PERIOD_OPTIONS = [
  { value: 'MONTH', label: 'Per month' },
  { value: 'YEAR', label: 'Per year' }
];

export const DEFAULT_SALARY_VIEW = { basis: 'NET', period: 'MONTH' };

const STORAGE_KEY = 'talentmon.salaryView';
const CHANGE_EVENT = 'salary-view:change';

let cachedRaw;
let cachedValue = null;
const readStored = () => {
  let raw = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = raw ? JSON.parse(raw) : null;
    } catch {
      cachedValue = null;
    }
  }
  return cachedValue;
};

const subscribe = (onChange) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
};

const publish = () => window.dispatchEvent(new CustomEvent(CHANGE_EVENT));

/** The view picked for the rest of this visit (kept per company, so another account in the same tab starts fresh). */
export function setSalaryView(companyId, { basis, period }) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ companyId, basis, period }));
  } catch {
    // Storage blocked: the switch just doesn't outlive this page.
  }
  publish();
}

/** Back to the company's default (sign-out, or the default was just changed in settings). */
export function clearSalaryView() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
  publish();
}

/** The company's default view from its settings (net per month until it has picked one). */
export const companySalaryView = (company) =>
  company?.salaryViewBasis && company?.salaryViewPeriod
    ? { basis: company.salaryViewBasis, period: company.salaryViewPeriod }
    : DEFAULT_SALARY_VIEW;

/** [view, setView] — the salary view in effect for the signed-in company. */
export function useSalaryView() {
  const { company } = useCurrentUser();
  const stored = useSyncExternalStore(subscribe, readStored);
  const fallback = companySalaryView(company);
  const own = stored && stored.companyId === company?.id;
  const basis = own ? stored.basis : fallback.basis;
  const period = own ? stored.period : fallback.period;
  const view = useMemo(() => ({ basis, period }), [basis, period]);
  const companyId = company?.id;
  return [view, (next) => setSalaryView(companyId, next)];
}

// ===== A candidate's salary =====

const FIELD = {
  NET: { MONTH: 'netMonth', YEAR: 'netYear' },
  GROSS: { MONTH: 'grossMonth', YEAR: 'grossYear' }
};

/** Which of the four amounts a view shows: 'netMonth', 'grossYear', … */
export const salaryKey = ({ basis, period } = DEFAULT_SALARY_VIEW) => FIELD[basis]?.[period] || 'netMonth';

const PERIOD_WORDS = { MONTH: { short: 'mo', long: 'month' }, YEAR: { short: 'yr', long: 'year' } };
export const periodWord = (period, form = 'short') => PERIOD_WORDS[period]?.[form] || '';
export const basisWord = (basis) => (basis === 'GROSS' ? 'gross' : 'net');
const otherBasis = (basis) => (basis === 'GROSS' ? 'NET' : 'GROSS');

/**
 * A profile's salary from the backend's work preferences: all four amounts in
 * the candidate's currency, and each in EUR for filtering and sorting. A CV
 * kept at unlock before net and gross were both asked has one net amount; it
 * is spread over month and year the same way, and gross stays unknown.
 */
export function expectedSalaryFrom(prefs) {
  if (!prefs) return null;
  const currency = prefs.salaryCurrency;
  if (prefs.salaryNetMonth != null) {
    return {
      currency,
      period: prefs.salaryPeriod,
      salariesPerYear: prefs.salariesPerYear || 12,
      netMonth: prefs.salaryNetMonth,
      grossMonth: prefs.salaryGrossMonth,
      netYear: prefs.salaryNetYear,
      grossYear: prefs.salaryGrossYear,
      base: {
        netMonth: prefs.salaryNetMonthBaseEur ?? null,
        grossMonth: prefs.salaryGrossMonthBaseEur ?? null,
        netYear: prefs.salaryNetYearBaseEur ?? null,
        grossYear: prefs.salaryGrossYearBaseEur ?? null
      }
    };
  }
  if (prefs.salaryAmount == null) return null;
  const amount = Number(prefs.salaryAmount);
  const perMonth = { YEAR: amount / 12, WEEK: (amount * 52) / 12 }[prefs.salaryPeriod] ?? amount;
  const netMonth = Math.round(perMonth);
  const baseMonth = prefs.salaryAmountBaseEur ?? null;
  return {
    currency,
    period: prefs.salaryPeriod === 'YEAR' ? 'YEAR' : 'MONTH',
    salariesPerYear: 12,
    netMonth,
    grossMonth: null,
    netYear: prefs.salaryPeriod === 'YEAR' ? amount : netMonth * 12,
    grossYear: null,
    base: { netMonth: baseMonth, grossMonth: null, netYear: baseMonth == null ? null : baseMonth * 12, grossYear: null }
  };
}

/**
 * The salary to show for a view: { amount, currency, basis, period }. When
 * that basis isn't known (an old kept CV with net only) it falls back to the
 * other one, and says so through `basis`.
 */
export function salaryForView(expectedSalary, view = DEFAULT_SALARY_VIEW) {
  if (!expectedSalary) return null;
  const { currency } = expectedSalary;
  const amount = expectedSalary[salaryKey(view)];
  if (amount != null) return { amount, currency, basis: view.basis, period: view.period };
  const basis = otherBasis(view.basis);
  const fallback = expectedSalary[salaryKey({ basis, period: view.period })];
  return fallback != null ? { amount: fallback, currency, basis, period: view.period } : null;
}

/** "€1,500" — the amount only, in the candidate's own currency. */
export const formatSalaryAmount = (salary) => (salary ? formatMoney(salary.amount, salary.currency) : '');

/** "net / mo" (cards) or "net / month" (CV). */
export const salarySuffix = (salary, form = 'short') =>
  salary ? `${basisWord(salary.basis)} / ${periodWord(salary.period, form)}` : '';

/** The EUR value a view filters and sorts on. */
export const salaryBase = (expectedSalary, view = DEFAULT_SALARY_VIEW) => expectedSalary?.base?.[salaryKey(view)] ?? null;

/**
 * Both amounts for the salary clause, the viewed basis first:
 * "€1,500 net / month (€2,100 gross / month)". The backend keeps the same
 * sentence with the unlock (unlocks/salary-clause.ts).
 */
export function salaryClauseAmounts(expectedSalary, view = DEFAULT_SALARY_VIEW) {
  const main = salaryForView(expectedSalary, view);
  if (!main) return '';
  const part = (amount, basis) => `${formatMoney(amount, main.currency)} ${basisWord(basis)} / ${periodWord(view.period, 'long')}`;
  const other = expectedSalary[salaryKey({ basis: otherBasis(main.basis), period: view.period })];
  return other != null ? `${part(main.amount, main.basis)} (${part(other, otherBasis(main.basis))})` : part(main.amount, main.basis);
}

/** A filter range moved to another period: ×12 to a year, ÷12 to a month (rounded), so the numbers stay meaningful. */
export function rangeForPeriod(range, fromPeriod, toPeriod) {
  if (fromPeriod === toPeriod) return range;
  const factor = toPeriod === 'YEAR' ? 12 : 1 / 12;
  const move = (value) => (value === '' || value == null ? value : String(Math.round(Number(value) * factor)));
  return { ...range, min: move(range?.min), max: move(range?.max) };
}
