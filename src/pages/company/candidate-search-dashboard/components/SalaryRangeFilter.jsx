import React, { useId } from 'react';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import { currencySelectOptions, currencySymbol } from 'utils/currencyService';
import { BASE_CURRENCY } from 'utils/exchangeRateService';
import { SALARY_BASIS_OPTIONS, SALARY_PERIOD_OPTIONS, rangeForPeriod, useSalaryView } from 'lib/salaryView';
import styles from '../styles/dashboard.module.scss';

const currencyOptions = currencySelectOptions();

// Filter inputs are white with the same 9px corners as the dropdowns.
const INPUT_CLASS = 'bg-white rounded-[9px]';

// Salary inputs take whole numbers only.
const blockNonDigitKeys = (e) => {
  if (['e', 'E', '+', '-', '.', ','].includes(e?.key)) e.preventDefault();
};

const PLACEHOLDERS = { MONTH: ['1,500', '4,000'], YEAR: ['18,000', '48,000'] };

/** Two-way switch in the style of Match any / Match all. */
const ViewSwitch = ({ label, options, value, onChange }) => (
  <div className={styles.matchToggle} role="radiogroup" aria-label={label}>
    {options.map((option) => {
      const on = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={on}
          className={`${styles.matchOption} ${on ? styles.matchOptionOn : ''}`}
          onClick={() => !on && onChange(option.value)}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

/**
 * Salary filter shared by Search (FilterSidebar), Bookmarked and Purchased.
 * The two switches are the salary view: net or gross, per month or per year.
 * It's one view for the whole app — the cards and CVs show that salary and
 * sorting uses it — starting from the company's default in its settings.
 * Candidates give all four amounts, so the range is compared with the
 * candidate's own figure for that view, never converted between net and
 * gross. The company picks a currency and both bounds are converted to the
 * base currency once (salaryFilterService.buildBaseSalaryRange).
 */
const SalaryRangeFilter = ({ value, onChange, rangeLabel = 'Range' }) => {
  const id = useId();
  const [view, setView] = useSalaryView();
  const filterCurrency = value?.currency || BASE_CURRENCY;
  const symbol = currencySymbol(filterCurrency);
  // Left padding grows with the symbol so "RSD" fits as well as "€".
  const symbolPadding = { paddingLeft: `calc(${symbol.length}ch + 20px)` };
  const hasRange = !!(value?.min || value?.max);
  const [minPlaceholder, maxPlaceholder] = PLACEHOLDERS[view.period] || PLACEHOLDERS.MONTH;

  const change = (key, next) => onChange({ ...value, [key]: next });

  // Another period keeps the range, moved to it (x12 or /12). Net and gross
  // can't be converted, so switching between them clears it.
  const changeBasis = (basis) => {
    setView({ ...view, basis });
    if (hasRange) onChange({ ...value, min: '', max: '' });
  };
  const changePeriod = (period) => {
    setView({ ...view, period });
    if (hasRange) onChange(rangeForPeriod(value, view.period, period));
  };

  const salaryInput = (bound, label, placeholder) => (
    <div className={styles.salaryField}>
      <span className={styles.salarySymbol} aria-hidden="true">{symbol}</span>
      <Input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        className={INPUT_CLASS}
        placeholder={placeholder}
        aria-label={`${label} (${filterCurrency})`}
        style={symbolPadding}
        value={value?.[bound] || ''}
        onKeyDown={blockNonDigitKeys}
        onChange={(e) => change(bound, String(e?.target?.value || '').replace(/\D/g, ''))}
      />
    </div>
  );

  const basisLabel = SALARY_BASIS_OPTIONS.find((o) => o.value === view.basis)?.label || 'Net';
  const periodLabel = (SALARY_PERIOD_OPTIONS.find((o) => o.value === view.period)?.label || 'Per month').toLowerCase();

  return (
    <>
      <div className={styles.field}>
        <span id={`${id}-view`} className={styles.fieldLabel}>Show salaries as</span>
        <div className={styles.salaryView} role="group" aria-labelledby={`${id}-view`}>
          <ViewSwitch label="Net or gross" options={SALARY_BASIS_OPTIONS} value={view.basis} onChange={changeBasis} />
          <ViewSwitch label="Per month or per year" options={SALARY_PERIOD_OPTIONS} value={view.period} onChange={changePeriod} />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-currency`} className={styles.fieldLabel}>Currency</label>
        <Select
          id={`${id}-currency`}
          options={currencyOptions}
          value={filterCurrency}
          onChange={(next) => change('currency', next)}
          searchable
        />
      </div>
      <div className={styles.field}>
        <div className={styles.fieldLabelRow}>
          <span id={`${id}-range`} className={styles.fieldLabel}>{rangeLabel}</span>
          <span id={`${id}-hint`} className={styles.fieldHint}>{basisLabel} {periodLabel}</span>
        </div>
        <div
          className={styles.salaryRow}
          role="group"
          aria-labelledby={`${id}-range`}
          aria-describedby={`${id}-hint`}
        >
          {salaryInput('min', 'Salary minimum from', minPlaceholder)}
          <span className={styles.salaryDash} aria-hidden="true" />
          {salaryInput('max', 'Salary minimum to', maxPlaceholder)}
        </div>
      </div>
    </>
  );
};

export default SalaryRangeFilter;
