import React, { useMemo } from 'react';
import SectionShell from './SectionShell';
import { MODE_OPTS, TYPE_OPTS, SALARY_PERIODS, NOTICE_UNITS } from './data';
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

  const salaryValidation = useMemo(
    () => validateSalaryAmount({ amount: d.salaryAmount, currency: d.salaryCurrency }),
    [d.salaryAmount, d.salaryCurrency]
  );
  const salaryInvalid = !!d.salaryAmount && !salaryValidation.valid;

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

        <div className={`field full${salaryInvalid ? ' invalid' : ''}`}>
          <label>Expected salary (net)</label>
          <div className="trio">
            <FlagSelect ariaLabel="Currency" value={d.salaryCurrency} onChange={(v) => onChangeData('salaryCurrency', v)} groups={currencyGroups} />
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Amount"
              value={d.salaryAmount || ''}
              onChange={set('salaryAmount')}
              aria-invalid={salaryInvalid}
            />
            <Dropdown ariaLabel="Period" value={d.salaryPeriod} onChange={setValue('salaryPeriod')} options={SALARY_PERIODS} />
          </div>
          {salaryInvalid && <span className="field-hint error">{salaryValidation.errors[0]}</span>}
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
