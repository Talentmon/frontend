import React, { useId } from 'react';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import { currencySelectOptions, currencySymbol } from 'utils/currencyService';
import { BASE_CURRENCY } from 'utils/exchangeRateService';
import styles from '../styles/dashboard.module.scss';

const currencyOptions = currencySelectOptions();

// Filter inputs are white with the same 9px corners as the dropdowns.
const INPUT_CLASS = 'bg-white rounded-[9px]';

// Salary inputs take whole numbers only.
const blockNonDigitKeys = (e) => {
  if (['e', 'E', '+', '-', '.', ','].includes(e?.key)) e.preventDefault();
};

/**
 * Salary filter shared by Search (FilterSidebar) and Bookmarked. The company
 * picks a filter currency; both bounds are entered in it and converted to the
 * base currency once (see salaryFilterService.buildBaseSalaryRange) - never
 * per candidate. Candidates enter a net amount per period, and the check
 * compares monthly amounts, hence "Net per month".
 */
const SalaryRangeFilter = ({ value, onChange, rangeLabel = 'Range' }) => {
  const id = useId();
  const filterCurrency = value?.currency || BASE_CURRENCY;
  const symbol = currencySymbol(filterCurrency);
  // Left padding grows with the symbol so "RSD" fits as well as "€".
  const symbolPadding = { paddingLeft: `calc(${symbol.length}ch + 20px)` };

  const change = (key, next) => onChange({ ...value, [key]: next });

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

  return (
    <>
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
          <span id={`${id}-hint`} className={styles.fieldHint}>Net per month</span>
        </div>
        <div
          className={styles.salaryRow}
          role="group"
          aria-labelledby={`${id}-range`}
          aria-describedby={`${id}-hint`}
        >
          {salaryInput('min', 'Minimum salary', '1,500')}
          <span className={styles.salaryDash} aria-hidden="true" />
          {salaryInput('max', 'Maximum salary', '4,000')}
        </div>
      </div>
    </>
  );
};

export default SalaryRangeFilter;
