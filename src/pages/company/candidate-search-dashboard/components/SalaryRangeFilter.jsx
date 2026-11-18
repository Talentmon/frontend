import React, { useId } from 'react';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import RatesSourceLink from 'components/RatesSourceLink';
import { currencySelectOptions, currencySymbol } from 'utils/currencyService';
import { getExchangeRate, useExchangeRates } from 'utils/exchangeRateService';
import { SALARY_BASIS_OPTIONS, SALARY_PERIOD_OPTIONS, rangeView, useSalaryView } from 'lib/salaryView';
import styles from '../styles/dashboard.module.scss';

const currencyOptions = currencySelectOptions();

// Filter inputs are white with the same 9px corners as the dropdowns.
const INPUT_CLASS = 'bg-white rounded-[9px]';

// Salary inputs take whole numbers only.
const blockNonDigitKeys = (e) => {
  if (['e', 'E', '+', '-', '.', ','].includes(e?.key)) e.preventDefault();
};

const PLACEHOLDERS = { MONTH: ['1,500', '4,000'], YEAR: ['18,000', '48,000'] };

/**
 * Salary filter shared by Search (FilterSidebar), Bookmarked and Purchased.
 * The salary view (net or gross, per month or per year, and the currency) is
 * one for the whole app: the cards and CVs show that salary (always in the
 * candidate's own currency) and sorting uses it, starting from the company's
 * default in its settings. The currency picked here is the one the range is
 * typed in.
 *
 * A range keeps the net/gross and month/year it was typed in (`basis`,
 * `period` on the value; an empty range takes the view's), so showing salaries
 * another way doesn't change who matches. How salaries are shown is switched
 * next to the results count (SalaryViewMenu) on Search, Bookmarked and Purchased.
 *
 * Candidates give all four amounts, so the range is compared with the
 * candidate's own figure for its terms, never converted between net and gross.
 * Both bounds are converted to EUR once, at today's rate, and compared with the
 * candidates' salaries in EUR at the same rate
 * (salaryFilterService.buildBaseSalaryRange; the backend does the same).
 */
const SalaryRangeFilter = ({ value, onChange, rangeLabel = 'Range' }) => {
  const id = useId();
  const [view, setView] = useSalaryView();
  const exchangeRates = useExchangeRates();
  const filterCurrency = view.currency;
  const symbol = currencySymbol(filterCurrency);
  // Left padding grows with the symbol so "RSD" fits as well as "€".
  const symbolPadding = { paddingLeft: `calc(${symbol.length}ch + 20px)` };
  const hasRange = !!(value?.min || value?.max);
  // What the range means: the terms it was typed in, or the view's while it's empty.
  const terms = rangeView(hasRange ? value : null, view);
  // Rare once real rates are in: a currency the rates source doesn't cover can't be compared.
  const noRate = hasRange && exchangeRates.status === 'ready' && !getExchangeRate(filterCurrency);
  const [minPlaceholder, maxPlaceholder] = PLACEHOLDERS[terms.period] || PLACEHOLDERS.MONTH;

  // The first amount typed fixes the range's terms; emptying both lets it take the view's again.
  const change = (key, next) => {
    const updated = { ...value, [key]: next };
    if (!updated.min && !updated.max) {
      onChange({ min: '', max: '' });
      return;
    }
    onChange({ ...updated, basis: terms.basis, period: terms.period });
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

  // The hint by the range says what it means (its own terms once typed).
  const basisLabel = SALARY_BASIS_OPTIONS.find((o) => o.value === terms.basis)?.label || 'Net';
  const periodLabel = (SALARY_PERIOD_OPTIONS.find((o) => o.value === terms.period)?.label || 'Per month').toLowerCase();

  return (
    <>
      <div className={styles.field}>
        <label htmlFor={`${id}-currency`} className={styles.fieldLabel}>Currency</label>
        <Select
          id={`${id}-currency`}
          options={currencyOptions}
          value={filterCurrency}
          onChange={(next) => next && setView({ ...view, currency: next })}
          searchable
        />
        <RatesSourceLink className={styles.fieldHint} source={exchangeRates.source} ratesDate={exchangeRates.ratesDate} />
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
        {noRate && (
          <p className={styles.salaryWarn} role="status">
            There's no exchange rate for {filterCurrency} yet, so this range isn't applied. Pick another currency.
          </p>
        )}
      </div>
    </>
  );
};

export default SalaryRangeFilter;
