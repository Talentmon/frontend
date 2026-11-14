import React, { useMemo } from 'react';
import SectionShell from './SectionShell';
import { MODE_OPTS, TYPE_OPTS, SALARY_PERIODS, SALARIES_PER_YEAR, NOTICE_UNITS, fmtNum, salaryCheck, salaryOtherPeriod } from './data';
import { MOST_USED_CURRENCIES, OTHER_CURRENCIES } from 'utils/currencies';
import { validateSalaryAmount } from 'utils/salaryNormalizationService';
import FlagSelect from './FlagSelect';
import Dropdown from './Dropdown';

const toOpt = (c) => ({ value: c.code, iso: c.iso, label: c.code, title: c.name });

const PrefsSection = ({ sec, open, renaming, onToggleOpen, onStartRename, onRenameCommit, onChangeData, sectionDragProps, sectionDragClassName }) => {
  const d = sec.data;
  const set = (key) => (e) => onChangeData(key, e.target.value);
  const setValue = (key) => (v) => onChangeData(key, v);

  const currencyGroups = useMemo(
    () => [
      { label: 'Most used', options: MOST_USED_CURRENCIES.map(toOpt) },
      { label: 'All currencies', options: OTHER_CURRENCIES.map(toOpt) },
    ],
    []
  );

  // Net and gross for the period picked; the other period is worked out below.
  const currencyValidation = useMemo(
    () => validateSalaryAmount({ amount: d.salaryNet, currency: d.salaryCurrency }),
    [d.salaryNet, d.salaryCurrency]
  );
  const { error: pairError, warning: pairWarning } = salaryCheck(d);
  const salaryError = (currencyValidation.valid ? '' : currencyValidation.errors[0]) || pairError;
  const other = salaryOtherPeriod(d);
  const currency = d.salaryCurrency || '';

  return (
    <SectionShell
      sectionKey={sec.id}
      icon={sec.icon}
      title={sec.title}
      count="WORK PREFERENCES"
      renamable={false}
      movable={false}
      open={open}
      renaming={renaming}
      onToggleOpen={onToggleOpen}
      onStartRename={onStartRename}
      onRename={onRenameCommit}
      dragProps={sectionDragProps}
      dragClassName={sectionDragClassName}
    >
      <div className="simple-body">
        <div className="fgrid">
          <div className="field">
            <label>Work mode</label>
            <Dropdown value={d.mode} onChange={setValue('mode')} options={MODE_OPTS} />
          </div>
          <div className="field">
            <label>Type</label>
            <Dropdown value={d.type} onChange={setValue('type')} options={TYPE_OPTS} />
          </div>
        </div>

        <div className={`field full${salaryError ? ' invalid' : ''}`}>
          <label>Salary minimum</label>
          <div className="salary-grid">
            <div>
              <span className="sub-label">Currency</span>
              <FlagSelect ariaLabel="Currency" value={d.salaryCurrency} onChange={(v) => onChangeData('salaryCurrency', v)} groups={currencyGroups} />
            </div>
            <div>
              <span className="sub-label">Per</span>
              <Dropdown ariaLabel="Per month or per year" value={d.salaryPeriod} onChange={setValue('salaryPeriod')} options={SALARY_PERIODS} />
            </div>
            <div>
              <span className="sub-label" aria-hidden="true">Net</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                aria-label="Net salary minimum"
                placeholder="Take-home pay"
                value={d.salaryNet || ''}
                onChange={set('salaryNet')}
                aria-invalid={!!salaryError}
              />
            </div>
            <div>
              <span className="sub-label" aria-hidden="true">Gross</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                aria-label="Gross salary minimum"
                placeholder="Before tax"
                value={d.salaryGross || ''}
                onChange={set('salaryGross')}
                aria-invalid={!!pairError}
              />
            </div>
          </div>
          <div className="salary-calc">
            {other && (
              <>
                = {fmtNum(other.net)} {currency} net · {fmtNum(other.gross)} {currency} gross per {other.period},{' '}
              </>
            )}
            {other ? 'paid in' : 'Paid in'}
            <Dropdown
              className="salary-count"
              ariaLabel="Salaries a year"
              value={d.salariesPerYear || '12'}
              onChange={setValue('salariesPerYear')}
              options={SALARIES_PER_YEAR}
            />
            salaries a year
          </div>
          {salaryError && <span className="field-hint error">{salaryError}</span>}
          {!salaryError && pairWarning && <span className="field-hint warn">{pairWarning}</span>}
          <span className="field-hint">
            Companies that unlock your profile agree to offer at least this. Some countries pay 13 or 14 salaries a
            year — pick that and the yearly amount counts them.
          </span>
        </div>

        <div className="field full">
          <label>Availability (notice period)</label>
          <div className="duo">
            <input type="number" min="0" inputMode="numeric" placeholder="e.g. 2" value={d.noticeNum || ''} onChange={set('noticeNum')} />
            <Dropdown ariaLabel="Unit" value={d.noticeUnit} onChange={setValue('noticeUnit')} options={NOTICE_UNITS} />
          </div>
        </div>

        {/* Search-only preferences - never shown on the CV or on candidate
            cards, only used as filter signals once wired to a backend. */}
        <div className="field full">
          <div className="checkbox-row">
            <label className="field-checkbox">
              <input
                type="checkbox"
                checked={!!d.travelReady}
                onChange={(e) => onChangeData('travelReady', e.target.checked)}
              />
              Willing to business travel
            </label>
            <label className="field-checkbox">
              <input
                type="checkbox"
                checked={!!d.relocationReady}
                onChange={(e) => onChangeData('relocationReady', e.target.checked)}
              />
              Willing to relocate
            </label>
          </div>
        </div>
      </div>
    </SectionShell>
  );
};

export default PrefsSection;
