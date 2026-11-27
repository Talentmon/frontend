import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import { SALARY_BASIS_OPTIONS, SALARY_PERIOD_OPTIONS, useSalaryView } from 'lib/salaryView';
import styles from '../styles/dashboard.module.scss';

/** Two options as a segmented switch (radios). */
const Segmented = ({ label, options, value, onChange }) => (
  <div className={styles.barSeg} role="radiogroup" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        onClick={() => option.value !== value && onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

/**
 * "Salaries Net · per month ▾" next to the count on Search, Bookmarked and
 * Purchased: how the cards and CVs show salaries for this visit (the
 * company's default is in its settings). Only the display: a salary filter
 * keeps the net/gross and month/year it was typed in (lib/salaryView
 * rangeView), so who matches stays the same. `fitButton` (Bookmarked,
 * Purchased): the popover is exactly as wide as the button, right under it, so
 * beside an open CV it never runs into the CV.
 */
const SalaryViewMenu = ({ fitButton = false }) => {
  const [view, setView] = useSalaryView();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const id = useId();

  // A press anywhere outside closes it.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Escape closes the popover, and only it: the CV drawer leaves an Escape that's been used alone.
  const handleKeyDown = (e) => {
    if (e.key !== 'Escape' || !open) return;
    e.preventDefault();
    setOpen(false);
    buttonRef.current?.focus();
  };

  const basis = SALARY_BASIS_OPTIONS.find((o) => o.value === view.basis)?.label || 'Net';
  const period = (SALARY_PERIOD_OPTIONS.find((o) => o.value === view.period)?.label || 'Per month').toLowerCase();

  return (
    <div className={styles.menuRoot} ref={rootRef} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        id={`${id}-btn`}
        data-salary-view-button=""
        className={styles.salaryChip}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-pop`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.salaryChipIcon} aria-hidden="true">
          <Icon name="Coins" size={14} strokeWidth={2.2} />
        </span>
        <span className={styles.barMuted}>Salaries</span>
        <span className={styles.barValue}>{basis} · {period}</span>
        <Icon name="ChevronDown" size={14} strokeWidth={2.4} className={styles.barChevron} aria-hidden="true" />
      </button>
      {/* Phones: the dimmed page behind the sheet; a tap on it only closes it. */}
      {open && <div className={styles.menuScrim} onClick={() => setOpen(false)} aria-hidden="true" />}
      {open && (
        <div id={`${id}-pop`} role="dialog" aria-labelledby={`${id}-title`} data-salary-view-pop="" className={`${styles.salaryPop} ${fitButton ? styles.salaryPopFit : ''}`}>
          <p id={`${id}-title`} className={styles.salaryPopTitle}>Show salaries as</p>
          <Segmented label="Net or gross" options={SALARY_BASIS_OPTIONS} value={view.basis} onChange={(next) => setView({ ...view, basis: next })} />
          <Segmented label="Per month or per year" options={SALARY_PERIOD_OPTIONS} value={view.period} onChange={(next) => setView({ ...view, period: next })} />
          <p className={styles.salaryPopNote}>
            <Icon name="Info" size={14} aria-hidden="true" />
            Only changes how salaries are shown. Who matches your filters stays the same.
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryViewMenu;
