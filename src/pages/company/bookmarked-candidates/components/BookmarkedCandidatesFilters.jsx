import React, { useCallback, useState } from 'react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import Combobox from 'components/ui/Combobox';
import { CATEGORY_NAMES as SKILL_CATEGORY_NAMES, getSkillNamesFor } from 'utils/skills';
import { getSubIndustries } from 'utils/industries';
import { currencySymbol } from 'utils/currencyService';
import LanguageLevelFilter from '../../candidate-search-dashboard/components/LanguageLevelFilter';
import SalaryRangeFilter from '../../candidate-search-dashboard/components/SalaryRangeFilter';
import SkillsMatchToggle from '../../candidate-search-dashboard/components/SkillsMatchToggle';
import Popover, { CheckBox, MenuOption } from './Popover';
import { EXPERIENCE_OPTIONS, inExperienceRange } from '../filterUtils';
import styles from '../styles/bookmarked.module.scss';

const skillCategoryOptions = SKILL_CATEGORY_NAMES.map((name) => ({ value: name, label: name }));

const toggleIn = (list = [], value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// How many bookmarks have each value - over the whole list, not just what
// the other filters leave.
const countBy = (candidates, valuesOf) => {
  const counts = {};
  candidates.forEach((candidate) => {
    new Set(valuesOf(candidate)).forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
  });
  return counts;
};

const salaryChipLabel = ({ min, max, currency }) => {
  const symbol = currencySymbol(currency || 'EUR');
  const prefix = symbol.length > 1 ? `${symbol} ` : symbol;
  const from = min ? `${prefix}${Number(min).toLocaleString('en-US')}` : '';
  const to = max ? `${prefix}${Number(max).toLocaleString('en-US')}` : '';
  const range = from && to ? `${from} – ${to}` : from ? `From ${from}` : `Up to ${to}`;
  return `${range} net / mo`;
};

const FilterPill = ({ id, label, count = 0, open, onToggle, onClose, ...panel }) => (
  <Popover
    id={id}
    label={label}
    open={open}
    onToggle={onToggle}
    onClose={onClose}
    renderTrigger={(props) => (
      <button {...props} className={`${styles.pill} ${count > 0 ? styles.pillActive : ''} ${open ? styles.pillOpen : ''}`}>
        {label}
        {count > 0 && <span className={styles.pillCount}>{count}</span>}
        <Icon name="ChevronDown" size={16} strokeWidth={2.2} className={styles.pillChevron} />
      </button>
    )}
    {...panel}
  />
);

/**
 * One row of filters above the cards: text search, pills that open a list or
 * a small form (Industry, Experience, Languages, Skills, Salary, and Saved by
 * for a team), and "With notes only". Lists show how many bookmarks have each
 * value. Whatever is on shows as a chip below, each removable, plus Clear all.
 */
const BookmarkedCandidatesFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  candidates = [],
  recruiterOptions = [],
  savedBy = [],
  onSavedByChange
}) => {
  const [openPill, setOpenPill] = useState(null);
  const closePill = useCallback(() => setOpenPill(null), []);
  const pillProps = (key) => ({
    id: `bm-pill-${key}`,
    open: openPill === key,
    onToggle: () => setOpenPill((prev) => (prev === key ? null : key)),
    onClose: closePill
  });

  const setFilter = (key, value) => onFiltersChange({ ...filters, [key]: value });

  // Picking an industry covers all its subindustries, so any picked on their
  // own are dropped (and unpicking it leaves none behind).
  const toggleIndustry = (name) => {
    const subs = getSubIndustries(name);
    onFiltersChange({
      ...filters,
      industry: toggleIn(filters?.industry, name),
      subIndustry: (filters?.subIndustry || []).filter((sub) => !subs.includes(sub))
    });
  };

  // Unpicking a category drops the skills that no longer belong to the picked ones.
  const handleSkillCategoryChange = (categories) => {
    const validNames = getSkillNamesFor({ categories });
    onFiltersChange({
      ...filters,
      skillCategory: categories,
      skills: (filters?.skills || []).filter((name) => validNames.includes(name))
    });
  };

  const industryCounts = countBy(candidates, (c) => c?.industries || []);
  const subCounts = countBy(candidates, (c) => c?.subIndustries || []);
  const industryTree = Object.keys(industryCounts).sort().map((name) => ({
    name,
    subs: getSubIndustries(name).filter((sub) => subCounts[sub]).sort()
  }));
  const experienceCounts = Object.fromEntries(
    EXPERIENCE_OPTIONS.map(({ value }) => [value, candidates.filter((c) => inExperienceRange(c?.experience, value)).length])
  );
  const salary = filters?.salary || {};
  const salaryActive = !!(salary.min || salary.max);
  const recruiterLabel = (id) => recruiterOptions.find((o) => o.value === id)?.label || 'teammate';

  const chips = [];
  const chip = (key, label, onRemove) => chips.push({ key, label, onRemove });
  (filters?.industry || []).forEach((name) => chip(`ind-${name}`, name, () => toggleIndustry(name)));
  (filters?.subIndustry || []).forEach((name) => chip(`sub-${name}`, name, () => setFilter('subIndustry', toggleIn(filters.subIndustry, name))));
  if (filters?.experience) {
    chip('exp', EXPERIENCE_OPTIONS.find((o) => o.value === filters.experience)?.label, () => setFilter('experience', ''));
  }
  (filters?.languages || []).forEach((entry) =>
    chip(
      `lang-${entry.name}`,
      entry.levels?.length ? `${entry.name} (${entry.levels.join(', ')})` : entry.name,
      () => setFilter('languages', filters.languages.filter((e) => e.name !== entry.name))
    )
  );
  (filters?.skillCategory || []).forEach((name) => chip(`cat-${name}`, name, () => handleSkillCategoryChange(toggleIn(filters.skillCategory, name))));
  (filters?.skills || []).forEach((name) => chip(`skill-${name}`, name, () => setFilter('skills', toggleIn(filters.skills, name))));
  if (salaryActive) chip('salary', salaryChipLabel(salary), () => setFilter('salary', { ...salary, min: '', max: '' }));
  savedBy.forEach((id) => chip(`by-${id}`, `Saved by ${recruiterLabel(id)}`, () => onSavedByChange(savedBy.filter((v) => v !== id))));
  if (filters?.hasNotes) chip('notes', 'With notes', () => setFilter('hasNotes', false));

  const clearSearch = () => {
    setFilter('search', '');
    document.getElementById('bm-search')?.focus();
  };

  return (
    <section aria-label="Filters" className={styles.fbar}>
      <div className={styles.fbarRow}>
        <Icon name="Filter" size={18} className={styles.fbarIcon} />

        <div className={styles.fbarSearch}>
          <label htmlFor="bm-search" className={styles.srOnly}>Search bookmarked candidates</label>
          <Icon name="Search" size={18} className={styles.fbarSearchIcon} />
          <input
            id="bm-search"
            type="search"
            placeholder="Search by position, skills, location…"
            value={filters?.search || ''}
            onChange={(e) => setFilter('search', e?.target?.value)}
          />
          {filters?.search && (
            <button type="button" className={styles.fbarSearchClear} aria-label="Clear search" onClick={clearSearch}>
              <Icon name="X" size={14} strokeWidth={2.4} />
            </button>
          )}
        </div>

        <FilterPill
          label="Industry"
          count={(filters?.industry?.length || 0) + (filters?.subIndustry?.length || 0)}
          width={300}
          {...pillProps('industry')}
        >
          <div role="menu" aria-label="Industry" className={styles.menuList}>
            {industryTree.length === 0 ? (
              <p className={styles.menuNote}>No industries on these candidates yet.</p>
            ) : (
              industryTree.map(({ name, subs }) => {
                const wholeIndustry = !!filters?.industry?.includes(name);
                return (
                  <React.Fragment key={name}>
                    <MenuOption strong label={name} count={industryCounts[name]} checked={wholeIndustry} onClick={() => toggleIndustry(name)} />
                    {subs.map((sub) => (
                      <MenuOption
                        key={sub}
                        sub
                        label={sub}
                        count={subCounts[sub]}
                        checked={wholeIndustry || !!filters?.subIndustry?.includes(sub)}
                        disabled={wholeIndustry}
                        onClick={() => setFilter('subIndustry', toggleIn(filters?.subIndustry, sub))}
                      />
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </FilterPill>

        <FilterPill label="Experience" count={filters?.experience ? 1 : 0} width={240} {...pillProps('experience')}>
          <div role="menu" aria-label="Experience" className={styles.menuList}>
            {[{ value: '', label: 'Any experience' }, ...EXPERIENCE_OPTIONS].map(({ value, label }) => {
              const count = value ? experienceCounts[value] : candidates.length;
              const checked = (filters?.experience || '') === value;
              return (
                <MenuOption
                  key={label}
                  radio
                  label={label}
                  count={count}
                  checked={checked}
                  disabled={count === 0 && !checked}
                  onClick={() => {
                    setFilter('experience', value);
                    closePill();
                    document.getElementById('bm-pill-experience-trigger')?.focus();
                  }}
                />
              );
            })}
          </div>
        </FilterPill>

        <FilterPill label="Languages" count={filters?.languages?.length || 0} width={340} padded {...pillProps('languages')}>
          <div className={styles.popField}>
            <label htmlFor="bm-languages" className={styles.fieldLabel}>Languages</label>
            <LanguageLevelFilter
              id="bm-languages"
              value={filters?.languages || []}
              onChange={(entries) => setFilter('languages', entries)}
            />
          </div>
        </FilterPill>

        <FilterPill
          label="Skills"
          count={(filters?.skillCategory?.length || 0) + (filters?.skills?.length || 0)}
          width={320}
          padded
          {...pillProps('skills')}
        >
          <div className={styles.popField}>
            <label htmlFor="bm-skill-category" className={styles.fieldLabel}>Category</label>
            <Select
              id="bm-skill-category"
              value={filters?.skillCategory || []}
              onChange={handleSkillCategoryChange}
              placeholder="Select category"
              options={skillCategoryOptions}
              multiple
            />
          </div>
          <div className={styles.popField}>
            <label htmlFor="bm-skills" className={styles.fieldLabel}>Skills</label>
            <Combobox
              id="bm-skills"
              value={filters?.skills || []}
              onChange={(value) => setFilter('skills', value)}
              placeholder="Type or choose a skill"
              options={getSkillNamesFor({ categories: filters?.skillCategory || [] })}
              multiple
            />
          </div>
          {filters?.skills?.length >= 2 && (
            <SkillsMatchToggle value={filters?.skillsMatch} onChange={(value) => setFilter('skillsMatch', value)} />
          )}
        </FilterPill>

        <FilterPill label="Salary" count={salaryActive ? 1 : 0} width={320} padded align="right" {...pillProps('salary')}>
          <SalaryRangeFilter value={salary} onChange={(next) => setFilter('salary', next)} rangeLabel="Minimum salary" />
        </FilterPill>

        {/* Saved by: only once two or more teammates have saved candidates. */}
        {recruiterOptions.length > 1 && (
          <FilterPill label="Saved by" count={savedBy.length} width={260} align="right" {...pillProps('savedby')}>
            <div role="menu" aria-label="Saved by" className={styles.menuList}>
              {recruiterOptions.map((option) => (
                <MenuOption
                  key={option.value}
                  label={option.label}
                  count={option.description}
                  checked={savedBy.includes(option.value)}
                  onClick={() => onSavedByChange(toggleIn(savedBy, option.value))}
                />
              ))}
            </div>
          </FilterPill>
        )}

        <span className={styles.fbarDivider} aria-hidden="true" />

        <button
          type="button"
          className={`${styles.pill} ${filters?.hasNotes ? styles.pillActive : ''}`}
          aria-pressed={!!filters?.hasNotes}
          onClick={() => setFilter('hasNotes', !filters?.hasNotes)}
        >
          <CheckBox checked={!!filters?.hasNotes} />
          With notes only
        </button>
      </div>

      {chips.length > 0 && (
        <div className={styles.chipsRow}>
          <span className={styles.chipsLabel}>Active filters</span>
          {chips.map(({ key, label, onRemove }) => (
            <span key={key} className={styles.chip}>
              {label}
              <button type="button" className={styles.chipRemove} aria-label={`Remove filter ${label}`} onClick={onRemove}>
                <Icon name="X" size={12} strokeWidth={2.6} />
              </button>
            </span>
          ))}
          <button type="button" className={styles.chipsClear} onClick={onClearFilters}>
            Clear all
          </button>
        </div>
      )}
    </section>
  );
};

export default BookmarkedCandidatesFilters;
