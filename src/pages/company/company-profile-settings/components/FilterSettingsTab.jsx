import React from 'react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import { SALARY_BASIS_OPTIONS, SALARY_PERIOD_OPTIONS, basisWord, periodWord } from 'lib/salaryView';
import { CURRENCY_MAP, currencySelectOptions, currencySymbol, formatMoney } from 'utils/currencyService';
import SectionHead from './SectionHead';
import { FieldError } from './FormBits';
import styles from '../styles/company.module.scss';

const CURRENCY_OPTIONS = currencySelectOptions();

// "€", "$", "RSD" … worked out once per currency, since the list draws ~150 of them.
const SYMBOLS = {};
const symbolOf = (code) => {
  if (!(code in SYMBOLS)) SYMBOLS[code] = currencySymbol(code);
  return SYMBOLS[code];
};

/** A currency as the field and its list show it: symbol tile, then "EUR · Euro". */
const renderCurrency = (option) => {
  const symbol = symbolOf(option.value);
  return (
    <span className={styles.fsCur}>
      <span className={styles.fsCurSym} data-long={symbol.length > 2 ? 'true' : undefined} aria-hidden="true">{symbol}</span>
      <span className={styles.fsCurText}><b>{option.value}</b> · {CURRENCY_MAP[option.value]?.name}</span>
    </span>
  );
};

const BASIS_HELP = { NET: 'After tax and contributions', GROSS: 'Before tax and contributions' };
const PERIOD_HELP = { MONTH: 'Monthly pay', YEAR: 'Yearly pay, with any 13th/14th salary' };

// Two made-up salaries for "On cards"; a year is shown as 12 monthly salaries.
const CARD_EXAMPLES = [
  { currency: 'EUR', NET: 2000, GROSS: 2900 },
  { currency: 'RSD', NET: 235000, GROSS: 340000 }
];

// What always counts toward Match when the search uses it.
const MATCH_PARTS = ['Position', 'Skills', 'Languages', 'Certification name'];

// Salary and experience: everyone in the range is shown; one end can rank higher.
// `bar` draws the scale: 'down' = the low end counts 100%, 'up' = the high end, 'flat' = only filters.
const RANGE_ROWS = [
  {
    field: 'matchSalaryPreference',
    icon: 'Banknote',
    title: 'Salary',
    chip: 'Salary',
    question: 'Which salaries in your range should rank higher?',
    options: [
      { value: 'LOWER', label: 'Lower is better', text: 'The lowest salary in your range counts 100%, the highest 50%.', bar: 'down', ends: ['Lowest 100%', 'Highest 50%'] },
      { value: 'HIGHER', label: 'Higher is better', text: 'The highest salary in your range counts 100%, the lowest 50%.', bar: 'up', ends: ['Lowest 50%', 'Highest 100%'] },
      { value: 'NONE', label: 'No preference', text: 'Salary only filters. It doesn’t change Match.', bar: 'flat', ends: ['Only filters'] }
    ]
  },
  {
    field: 'matchExperiencePreference',
    icon: 'Briefcase',
    title: 'Years of experience',
    chip: 'Years of experience',
    question: 'Which candidates in your years range should rank higher?',
    options: [
      { value: 'HIGHER', label: 'More is better', text: 'The most years in your range count 100%, the fewest 50%.', bar: 'up', ends: ['Fewest 50%', 'Most 100%'] },
      { value: 'LOWER', label: 'Fewer is better', text: 'The fewest years in your range count 100%, the most 50%.', bar: 'down', ends: ['Fewest 100%', 'Most 50%'] },
      { value: 'NONE', label: 'No preference', text: 'Years only filter. They don’t change Match.', bar: 'flat', ends: ['Only filters'] }
    ]
  }
];

/** A row of buttons, one of which is on (Net / Gross, Per month / Per year). */
const Segmented = ({ labelledBy, options, value, onChange, invalid = false }) => (
  <div className={`${styles.seg}${invalid ? ` ${styles.segInvalid}` : ''}`} role="radiogroup" aria-labelledby={labelledBy}>
    {options.map((option) => {
      const on = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={on}
          className={`${styles.segBtn}${on ? ` ${styles.segOn}` : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

/**
 * Filter settings: how Search shows salaries (Salary view) and which end of a
 * salary / experience range ranks higher in Match. Saved with the page's Save,
 * like Company information; only the owner edits them (the backend enforces it).
 */
const FilterSettingsTab = ({ companyData, onDataChange, onSave, isSaving, errors = {}, readOnly = false }) => {
  const handleChange = (field, value) => onDataChange({ ...companyData, [field]: value }, field);
  const requiredMark = <span className={styles.req}>*</span>;

  const basis = companyData?.salaryViewBasis;
  const period = companyData?.salaryViewPeriod;
  const currency = companyData?.salaryViewCurrency;
  const exampleUnit = `${basisWord(basis || 'NET')} / ${periodWord(period || 'MONTH', 'long')}`;
  const exampleAmount = (example) => formatMoney(example[basis || 'NET'] * (period === 'YEAR' ? 12 : 1), example.currency);

  const segFields = [
    { field: 'salaryViewBasis', id: 'fs-basis', label: 'Net or gross', options: SALARY_BASIS_OPTIONS, help: BASIS_HELP[basis] },
    { field: 'salaryViewPeriod', id: 'fs-period', label: 'Per month or per year', options: SALARY_PERIOD_OPTIONS, help: PERIOD_HELP[period] }
  ];

  return (
    // A disabled <fieldset> disables every input, Select trigger and button inside it in one go.
    <fieldset className={styles.stack} disabled={readOnly} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {readOnly && (
        <div className={styles.readOnlyNote}>
          <Icon name="Lock" size={15} />
          Only the account owner can edit the filter settings.
        </div>
      )}

      {/* Salary view — for the team only; candidates never see it */}
      <div className={styles.card}>
        <SectionHead
          icon="Banknote"
          title="Salary view"
          subtitle="How candidates’ salaries are shown to your team in Search, Bookmarked and Purchased."
        />

        <div className={styles.fsBody}>
          <div className={styles.fsGrid3}>
            {segFields.map(({ field, id, label, options, help }) => (
              <div key={field} className={styles.field} data-invalid={errors[field] ? 'true' : undefined}>
                <span id={id} className={styles.flabel}>{label} {requiredMark}</span>
                <Segmented
                  labelledBy={id}
                  options={options}
                  value={companyData?.[field]}
                  onChange={(value) => handleChange(field, value)}
                  invalid={!!errors[field]}
                />
                {errors[field] ? <FieldError>{errors[field]}</FieldError> : help && <p className={styles.fsHelp}>{help}</p>}
              </div>
            ))}

            <div className={styles.field} data-invalid={errors.salaryViewCurrency ? 'true' : undefined}>
              <label className={styles.flabel}>Salary filter currency {requiredMark}</label>
              <div className={`${styles.fsCurrency}${errors.salaryViewCurrency ? ` ${styles.selectInvalid}` : ''}`}>
                <Select
                  value={currency || ''}
                  onChange={(v) => handleChange('salaryViewCurrency', v)}
                  options={CURRENCY_OPTIONS}
                  renderLabel={renderCurrency}
                  placeholder="Select currency…"
                  aria-label="Salary filter currency"
                  searchable
                />
              </div>
              {errors.salaryViewCurrency
                ? <FieldError>{errors.salaryViewCurrency}</FieldError>
                : <p className={styles.fsHelp}>For the range typed in the Salary filter</p>}
            </div>
          </div>

          <div className={styles.fsPanel} role="note" aria-labelledby="fs-shown">
            <div className={styles.fsPanelHead}>
              <p id="fs-shown" className={styles.fsPanelTitle}><Icon name="Info" size={16} />How salaries are shown</p>
              <p className={styles.fsOnCards}>
                <span className={styles.fsMono}>On cards</span>
                {CARD_EXAMPLES.map((example) => (
                  <span key={example.currency} className={styles.fsAmount}>
                    {exampleAmount(example)}<span>{exampleUnit}</span>
                  </span>
                ))}
              </p>
            </div>
            <ul className={styles.fsTiles}>
              <li>
                <span className={`${styles.fsTileIcon} ${styles.fsToneGold}`} aria-hidden="true"><Icon name="Coins" size={16} /></span>
                <p><strong>Net and gross for everyone</strong>Every candidate gives both, so any profile can be shown either way, always in their own currency.</p>
              </li>
              <li>
                <span className={`${styles.fsTileIcon} ${styles.fsToneBlue}`} aria-hidden="true"><Icon name="ArrowLeftRight" size={16} /></span>
                <p>
                  <strong>Filter range in {currency || 'your currency'}</strong>
                  The range typed in the Salary filter is in {currency || 'this currency'} and compared at today’s exchange rate.
                </p>
              </li>
              <li>
                <span className={`${styles.fsTileIcon} ${styles.fsToneGrey}`} aria-hidden="true"><Icon name="Users" size={16} /></span>
                <p><strong>Defaults for the whole team</strong>Anyone can switch them in the Salary filter. They come back to these after closing the tab or signing out.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Match — how Search orders what the filters find */}
      <div className={styles.card}>
        <SectionHead icon="Target" title="Match" subtitle="How Search ranks the candidates your filters find." />

        <div className={`${styles.fsBody} ${styles.fsBodyMatch}`}>
          <div className={`${styles.fsPanel} ${styles.fsPanelMatch}`}>
            <div className={styles.fsFlow}>
              <div className={styles.fsFlowCard}>
                <span className={`${styles.fsFlowIcon} ${styles.fsToneBlue}`} aria-hidden="true"><Icon name="Filter" size={18} /></span>
                <span>
                  <span className={styles.fsFlowTitle}>Filters decide <strong>who</strong> you see</span>
                  <span className={styles.fsFlowSub}>Everyone in your results passes all of them.</span>
                </span>
              </div>
              <span className={styles.fsFlowArrow} aria-hidden="true"><Icon name="ArrowRight" size={18} strokeWidth={2.2} /></span>
              <div className={styles.fsFlowCard}>
                <span className={`${styles.fsFlowIcon} ${styles.fsToneGold}`} aria-hidden="true"><Icon name="ArrowDownWideNarrow" size={18} /></span>
                <span>
                  <span className={styles.fsFlowTitle}>Match decides the <strong>order</strong></span>
                  <span className={styles.fsFlowSub}>Best fits come first. Everything you asked for is 100%.</span>
                </span>
              </div>
            </div>

            <div className={styles.fsCounts}>
              <p className={styles.fsMono}>What counts toward Match · all equally</p>
              <div className={styles.fsChips}>
                {MATCH_PARTS.map((part) => <span key={part} className={styles.fsChip}>{part}</span>)}
                <span className={styles.fsChipSep} aria-hidden="true" />
                {RANGE_ROWS.map(({ field, chip }) => {
                  const counts = !!companyData?.[field] && companyData[field] !== 'NONE';
                  return (
                    <span
                      key={field}
                      className={`${styles.fsChip} ${counts ? styles.fsChipOn : styles.fsChipOff}`}
                      title={counts ? `${chip} counts toward Match` : `${chip} only filters right now`}
                    >
                      {chip}<span className={styles.fsChipState}>· {counts ? 'counts' : 'off'}</span>
                    </span>
                  );
                })}
              </div>
              <p className={styles.fsCountsNote}>
                The first four count whenever your search uses them. Salary and years count only when you pick a preference below.
              </p>
            </div>

            <div className={styles.fsExample}>
              <span className={styles.fsMono}>Example</span>
              <span className={styles.fsExampleSum}>
                <span>All your skills <strong>100%</strong></span>
                <span className={styles.fsOp} aria-hidden="true">+</span>
                <span>1 of 2 languages <strong>50%</strong></span>
                <span className={styles.fsOp} aria-hidden="true">=</span>
                <span className={styles.fsResult}>75% match</span>
              </span>
            </div>
          </div>

          <div className={styles.fsPrefs}>
            {RANGE_ROWS.map(({ field, icon, title, question, options }) => {
              const titleId = `fs-${field}`;
              return (
                <section key={field} className={styles.fsPref} aria-labelledby={titleId}>
                  <div className={styles.fsPrefHead}>
                    <div className={styles.fsPrefTitle}>
                      <span className={styles.fsPrefIcon} aria-hidden="true"><Icon name={icon} size={18} /></span>
                      <div>
                        <h3 id={titleId}>{title}</h3>
                        <p>{question}</p>
                      </div>
                    </div>
                    <span className={styles.fsMono}>Within your range</span>
                  </div>

                  <div role="radiogroup" aria-labelledby={titleId} className={styles.fsOptions}>
                    {options.map((option) => {
                      const on = companyData?.[field] === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          className={`${styles.fsOpt}${on ? ` ${styles.fsOptOn}` : ''}`}
                          onClick={() => handleChange(field, option.value)}
                        >
                          <span className={styles.fsOptHead}>
                            <span className={styles.fsRadio} aria-hidden="true" />
                            <span className={styles.fsOptLabel}>{option.label}</span>
                          </span>
                          <span className={styles.fsOptText}>{option.text}</span>
                          <span className={styles.fsScale} aria-hidden="true">
                            <span className={styles.fsBar} data-dir={option.bar} />
                            <span className={styles.fsBarEnds}>
                              {option.ends.map((end) => <span key={end}>{end}</span>)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phones/tablets only — on desktop the page header's Save is always in view */}
      {!readOnly && (
        <div className={styles.saveBottom}>
          <button className={styles.btnPrimary} onClick={onSave} disabled={isSaving}>
            <Icon name="Save" size={16} />{isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </fieldset>
  );
};

export default FilterSettingsTab;
