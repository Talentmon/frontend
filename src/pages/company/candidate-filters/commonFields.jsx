import React from 'react';
import Select from 'components/ui/Select';
import Combobox from 'components/ui/Combobox';
import { Checkbox } from 'components/ui/Checkbox';
import LanguageLevelFilter from '../candidate-search-dashboard/components/LanguageLevelFilter';
import PickedChips from '../candidate-search-dashboard/components/PickedChips';
import ExperienceRangeFilter from '../candidate-search-dashboard/components/ExperienceRangeFilter';
import { EMPTY_EXPERIENCE, experienceActive, experienceLabel } from 'utils/experienceRange';
import SalaryRangeFilter from '../candidate-search-dashboard/components/SalaryRangeFilter';
import SkillsMatchToggle from '../candidate-search-dashboard/components/SkillsMatchToggle';
import { MenuOption } from '../bookmarked-candidates/components/Popover';
import bm from '../bookmarked-candidates/styles/bookmarked.module.scss';
import ds from '../candidate-search-dashboard/styles/dashboard.module.scss';
import cf from './candidateFilters.module.scss';
import {
  AVAILABILITY_OPTIONS,
  CANDIDATE_STATUS_OPTIONS,
  EDUCATION_OPTIONS,
  JOB_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  optionLabel,
  salaryChipLabel,
  skillsInCategories,
  toggleIn,
  withIndustries,
  withSkillCategories
} from './commonFilters';

export const toOptions = (names) => names.map((name) => ({ value: name, label: name }));

/** A labelled field in the sidebar; the label is for screen readers only when the group's title already says it. */
export const SideField = ({ id, label, hideLabel = false, children }) => (
  <div className={ds.field}>
    <label htmlFor={id} className={hideLabel ? ds.srOnly : ds.fieldLabel}>{label}</label>
    {children}
  </div>
);

/** A labelled field in a pill's panel. */
export const PopField = ({ id, label, children }) => (
  <div className={bm.popField}>
    <label htmlFor={id} className={bm.fieldLabel}>{label}</label>
    {children}
  </div>
);

/** One pick from a list: "Any …" first, then the options, each with how many have it. (`className`: "" inside a panel that scrolls itself.) */
export const RadioList = ({ label, anyLabel, options, counts, total, value, onPick, hideEmpty = false, className = bm.menuList }) => (
  <div role="menu" aria-label={label} className={className}>
    {[{ value: '', label: anyLabel }, ...options].map((option) => {
      const count = option.value ? counts[option.value] || 0 : total;
      const checked = value === option.value;
      if (hideEmpty && option.value && !count && !checked) return null;
      return (
        <MenuOption
          key={option.label}
          radio
          label={option.label}
          count={count}
          checked={checked}
          disabled={count === 0 && !checked}
          onClick={() => onPick(option.value)}
        />
      );
    })}
  </div>
);

/** Several picks from a list, each with how many have it. */
export const CheckList = ({ label, items, picked, onToggle, className = bm.menuList }) => (
  <div role="menu" aria-label={label} className={className}>
    {items.map((item) => (
      <MenuOption key={item.value} label={item.label} count={item.count} checked={picked.includes(item.value)} onClick={() => onToggle(item.value)} />
    ))}
  </div>
);

// A picked value stays offered even after the last candidate with it is gone.
const present = (options, counts, picked) =>
  options.filter(({ value }) => counts[value] || (Array.isArray(picked) ? picked.includes(value) : picked === value));

const namesWithPicked = (names, picked) => [...names, ...picked.filter((name) => !names.includes(name))];

/**
 * Search's filters for Bookmarked and Purchased, in their order on the bar:
 * Industry, Experience, Skills, Salary, Languages, Location, Education,
 * Certifications, Preferences. Each has a pill (its panel: a list with counts
 * or a small form, as Bookmarked has always had) and a sidebar body (Search's
 * fields), plus its chips, count, summary and what clearing it sets. A filter
 * no candidate has data for is left out (`available`).
 * `onRadioPicked(key)` closes the pill after a one-pick list. `salaryView` is
 * the net/gross, month/year view the salary range is typed in.
 */
export function commonFields({ filters: f, onFiltersChange, opts, idPrefix, onRadioPicked = () => {}, salaryView }) {
  const set = (key, value) => onFiltersChange({ ...f, [key]: value });
  const fid = (name) => `${idPrefix}-${name}`;
  const chip = (key, label, onRemove) => ({ key, label, onRemove });
  const salaryActive = !!(f.salary.min || f.salary.max);

  const industry = {
    key: 'industry',
    label: 'Industry',
    available: opts.industryTree.length > 0 || f.industry.length + f.subIndustry.length > 0,
    count: f.industry.length + f.subIndustry.length,
    summary: [...f.industry, ...f.subIndustry],
    clear: { industry: [], subIndustry: [] },
    chips: [
      ...f.industry.map((name) => chip(`ind-${name}`, name, () => onFiltersChange(withIndustries(f, toggleIn(f.industry, name))))),
      ...f.subIndustry.map((name) => chip(`sub-${name}`, name, () => set('subIndustry', toggleIn(f.subIndustry, name))))
    ],
    pill: {
      width: 300,
      body: (
        <div role="menu" aria-label="Industry" className={bm.menuList}>
          {opts.industryTree.map(({ name, subs }) => {
            const whole = f.industry.includes(name);
            return (
              <React.Fragment key={name}>
                <MenuOption
                  strong
                  label={name}
                  count={opts.industryCounts[name]}
                  checked={whole}
                  onClick={() => onFiltersChange(withIndustries(f, toggleIn(f.industry, name)))}
                />
                {subs.map((sub) => (
                  <MenuOption
                    key={sub}
                    sub
                    label={sub}
                    count={opts.subCounts[sub]}
                    checked={whole || f.subIndustry.includes(sub)}
                    disabled={whole}
                    onClick={() => set('subIndustry', toggleIn(f.subIndustry, sub))}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </div>
      )
    },
    side: () => {
      // A picked industry already covers its subindustries, so they leave the second list.
      const subOptions = opts.industryTree
        .filter(({ name }) => !f.industry.includes(name))
        .flatMap(({ name, subs }) => subs.map((sub) => ({ value: sub, label: sub, group: name })));
      return (
        <>
          <SideField id={fid('industry')} label="Industry">
            <Select
              id={fid('industry')}
              options={toOptions(opts.industryTree.map(({ name }) => name))}
              value={f.industry}
              onChange={(value) => onFiltersChange(withIndustries(f, value))}
              placeholder="Select industry"
              multiple
            />
          </SideField>
          <SideField id={fid('subindustry')} label="Subindustry">
            <Select
              id={fid('subindustry')}
              options={subOptions}
              value={f.subIndustry}
              onChange={(value) => set('subIndustry', value)}
              placeholder={subOptions.length ? 'Select subindustry' : 'No other subindustries'}
              disabled={!subOptions.length}
              multiple
            />
          </SideField>
        </>
      );
    }
  };

  // Years of experience, From – To (utils/experienceRange).
  const experienceOn = experienceActive(f.experience);
  const experience = {
    key: 'experience',
    label: 'Experience',
    available: true,
    count: experienceOn ? 1 : 0,
    summary: experienceOn ? [experienceLabel(f.experience)] : [],
    clear: { experience: EMPTY_EXPERIENCE },
    chips: experienceOn ? [chip('exp', experienceLabel(f.experience), () => set('experience', EMPTY_EXPERIENCE))] : [],
    pill: {
      width: 300,
      padded: true,
      body: <ExperienceRangeFilter id={fid('experience')} value={f.experience} onChange={(next) => set('experience', next)} />
    },
    side: () => <ExperienceRangeFilter id={fid('experience')} value={f.experience} onChange={(next) => set('experience', next)} />
  };

  const skillOptions = skillsInCategories(opts.skills, f.skillCategory);
  const skills = {
    key: 'skills',
    label: 'Skills',
    available: opts.skills.length > 0 || f.skills.length + f.skillCategory.length > 0,
    count: f.skillCategory.length + f.skills.length,
    summary: [...f.skills, ...f.skillCategory],
    clear: { skillCategory: [], skills: [], skillsMatch: 'any' },
    chips: [
      ...f.skillCategory.map((name) => chip(`cat-${name}`, name, () => onFiltersChange(withSkillCategories(f, toggleIn(f.skillCategory, name))))),
      ...f.skills.map((name) => chip(`skill-${name}`, name, () => set('skills', toggleIn(f.skills, name))))
    ],
    pill: {
      width: 320,
      padded: true,
      body: (
        <>
          {opts.skillCategories.length > 0 && (
            <PopField id={fid('skill-category')} label="Category">
              <Select
                id={fid('skill-category')}
                value={f.skillCategory}
                onChange={(value) => onFiltersChange(withSkillCategories(f, value))}
                placeholder="Select category"
                options={toOptions(opts.skillCategories)}
                multiple
              />
            </PopField>
          )}
          <PopField id={fid('skills')} label="Skills">
            <Combobox
              id={fid('skills')}
              value={f.skills}
              onChange={(value) => set('skills', value)}
              placeholder="Type or choose a skill"
              options={skillOptions}
              multiple
            />
          </PopField>
          {f.skills.length >= 2 && <SkillsMatchToggle value={f.skillsMatch} onChange={(value) => set('skillsMatch', value)} />}
        </>
      )
    },
    side: () => (
      <>
        {opts.skillCategories.length > 0 && (
          <SideField id={fid('skill-category')} label="Category">
            <Select
              id={fid('skill-category')}
              options={toOptions(opts.skillCategories)}
              value={f.skillCategory}
              onChange={(value) => onFiltersChange(withSkillCategories(f, value))}
              placeholder="Select category"
              multiple
            />
          </SideField>
        )}
        <SideField id={fid('skills')} label="Skills">
          <Combobox
            id={fid('skills')}
            options={skillOptions}
            value={f.skills}
            onChange={(value) => set('skills', value)}
            placeholder="Type or choose a skill"
            multiple
          />
        </SideField>
        {f.skills.length >= 2 && <SkillsMatchToggle value={f.skillsMatch} onChange={(value) => set('skillsMatch', value)} />}
      </>
    )
  };

  const salary = {
    key: 'salary',
    label: 'Salary',
    available: true,
    count: salaryActive ? 1 : 0,
    summary: salaryActive ? [salaryChipLabel(f.salary, salaryView)] : [],
    // The currency is part of the salary view, so clearing leaves it as picked.
    clear: { salary: { ...f.salary, min: '', max: '' } },
    chips: salaryActive ? [chip('salary', salaryChipLabel(f.salary, salaryView), () => set('salary', { ...f.salary, min: '', max: '' }))] : [],
    pill: {
      width: 320,
      padded: true,
      body: <SalaryRangeFilter value={f.salary} onChange={(next) => set('salary', next)} rangeLabel="Salary minimum" />
    },
    side: () => <SalaryRangeFilter value={f.salary} onChange={(next) => set('salary', next)} rangeLabel="Salary minimum" />
  };

  const languageLabel = (entry) => (entry.levels?.length ? `${entry.name} (${entry.levels.join(', ')})` : entry.name);
  const languageField = (hideLabel) => (
    <LanguageLevelFilter
      id={fid('languages')}
      names={namesWithPicked(opts.languages, f.languages.map((entry) => entry.name))}
      value={f.languages}
      onChange={(entries) => set('languages', entries)}
    />
  );
  const languages = {
    key: 'languages',
    label: 'Languages',
    available: opts.languages.length > 0 || f.languages.length > 0,
    count: f.languages.length,
    summary: f.languages.map(languageLabel),
    clear: { languages: [] },
    chips: f.languages.map((entry) =>
      chip(`lang-${entry.name}`, languageLabel(entry), () => set('languages', f.languages.filter((e) => e.name !== entry.name)))
    ),
    pill: {
      width: 340,
      padded: true,
      body: (
        <PopField id={fid('languages')} label="Languages">
          {languageField()}
        </PopField>
      )
    },
    side: (hideLabel) => (
      <SideField id={fid('languages')} label="Languages" hideLabel={hideLabel}>
        {languageField(hideLabel)}
      </SideField>
    )
  };

  // Location: the candidates' countries, then their cities (the city is their `location`).
  const countryNames = namesWithPicked(opts.countries, f.country);
  const cityNames = namesWithPicked(opts.locations, f.location);
  const countryList = (className) => (
    <CheckList
      className={className}
      label="Country"
      items={countryNames.map((name) => ({ value: name, label: name, count: opts.countryCount(name) }))}
      picked={f.country}
      onToggle={(name) => set('country', toggleIn(f.country, name))}
    />
  );
  const cityList = (className) => (
    <CheckList
      className={className}
      label="City"
      items={cityNames.map((name) => ({ value: name, label: name, count: opts.locationCount(name) }))}
      picked={f.location}
      onToggle={(name) => set('location', toggleIn(f.location, name))}
    />
  );
  const location = {
    key: 'location',
    label: 'Location',
    available: countryNames.length + cityNames.length > 0,
    count: f.country.length + f.location.length,
    summary: [...f.country, ...f.location],
    clear: { country: [], location: [] },
    chips: [
      ...f.country.map((name) => chip(`country-${name}`, name, () => set('country', toggleIn(f.country, name)))),
      ...f.location.map((name) => chip(`loc-${name}`, name, () => set('location', toggleIn(f.location, name))))
    ],
    pill: {
      width: 280,
      body:
        countryNames.length > 0 ? (
          <div className={bm.menuList}>
            <p className={cf.menuHeading}>Country</p>
            {countryList('')}
            {cityNames.length > 0 && (
              <>
                <p className={cf.menuHeading}>City</p>
                {cityList('')}
              </>
            )}
          </div>
        ) : (
          cityList(bm.menuList)
        )
    },
    side: () => (
      <>
        {countryNames.length > 0 && (
          <SideField id={fid('country')} label="Country">
            <Select
              id={fid('country')}
              options={toOptions(countryNames)}
              value={f.country}
              onChange={(value) => set('country', value)}
              placeholder="Select country"
              multiple
              searchable
            />
          </SideField>
        )}
        {cityNames.length > 0 && (
          <SideField id={fid('location')} label="City">
            <Select
              id={fid('location')}
              options={toOptions(cityNames)}
              value={f.location}
              onChange={(value) => set('location', value)}
              placeholder="Select city"
              multiple
              searchable
            />
          </SideField>
        )}
      </>
    )
  };

  // Several levels can be picked; a candidate matches with any of them, each exactly.
  const educationOptions = present(EDUCATION_OPTIONS, opts.educationCounts, f.education);
  const educationLabel = (level) => optionLabel(EDUCATION_OPTIONS, level);
  const education = {
    key: 'education',
    label: 'Education',
    available: educationOptions.length > 0,
    count: f.education.length,
    summary: f.education.map(educationLabel),
    clear: { education: [] },
    chips: f.education.map((level) => chip(`edu-${level}`, educationLabel(level), () => set('education', toggleIn(f.education, level)))),
    pill: {
      width: 240,
      body: (
        <CheckList
          label="Education"
          items={educationOptions.map((option) => ({ ...option, count: opts.educationCounts[option.value] }))}
          picked={f.education}
          onToggle={(level) => set('education', toggleIn(f.education, level))}
        />
      )
    },
    side: (hideLabel) => (
      <SideField id={fid('education')} label="Education" hideLabel={hideLabel}>
        <Select
          id={fid('education')}
          options={educationOptions}
          value={f.education}
          onChange={(value) => set('education', value)}
          placeholder="Select education"
          multipleLabel={(count) => `${count} levels selected`}
          multiple
        />
        <PickedChips
          label="Selected education"
          items={f.education.map((level) => ({ value: level, label: educationLabel(level) }))}
          onRemove={(level) => set('education', toggleIn(f.education, level))}
        />
      </SideField>
    )
  };

  const certificateNames = namesWithPicked(opts.certificates, f.certificates);
  const certificates = {
    key: 'certificates',
    label: 'Certifications',
    available: opts.certificates.length > 0 || f.certificates.length > 0,
    count: f.certificates.length,
    summary: f.certificates,
    clear: { certificates: [] },
    chips: f.certificates.map((name) => chip(`cert-${name}`, name, () => set('certificates', toggleIn(f.certificates, name)))),
    pill: {
      width: 300,
      body: (
        <CheckList
          label="Certifications"
          items={certificateNames.map((name) => ({ value: name, label: name, count: opts.certificateCount(name) }))}
          picked={f.certificates}
          onToggle={(name) => set('certificates', toggleIn(f.certificates, name))}
        />
      )
    },
    side: (hideLabel) => (
      <SideField id={fid('certificates')} label="Certifications" hideLabel={hideLabel}>
        <Select
          id={fid('certificates')}
          options={toOptions(certificateNames)}
          value={f.certificates}
          onChange={(value) => set('certificates', value)}
          placeholder="Select certification"
          multiple
          searchable
        />
      </SideField>
    )
  };

  // Preferences: what Search calls Status & Preferences.
  const statusOptions = present(CANDIDATE_STATUS_OPTIONS, opts.candidateStatusCounts, f.candidateStatus);
  const availabilityOptions = present(AVAILABILITY_OPTIONS, opts.availabilityCounts, f.availability);
  const jobTypeOptions = present(JOB_TYPE_OPTIONS, opts.jobTypeCounts, f.jobType);
  const workModeOptions = present(WORK_MODE_OPTIONS, opts.workModeCounts, f.workMode);
  const openTo = [
    { key: 'relocationReady', label: 'Open to relocation', count: opts.relocationCount },
    { key: 'travelReady', label: 'Open to business travel', count: opts.travelCount }
  ].filter((item) => item.count || f[item.key]);
  const preferences = {
    key: 'preferences',
    label: 'Preferences',
    available: statusOptions.length + availabilityOptions.length + jobTypeOptions.length + workModeOptions.length + openTo.length > 0,
    count:
      (f.candidateStatus ? 1 : 0) + (f.availability ? 1 : 0) + f.jobType.length + f.workMode.length + (f.relocationReady ? 1 : 0) + (f.travelReady ? 1 : 0),
    summary: [
      f.candidateStatus && optionLabel(CANDIDATE_STATUS_OPTIONS, f.candidateStatus),
      f.availability && optionLabel(AVAILABILITY_OPTIONS, f.availability),
      ...f.jobType.map((type) => optionLabel(JOB_TYPE_OPTIONS, type)),
      ...f.workMode.map((mode) => optionLabel(WORK_MODE_OPTIONS, mode)),
      f.relocationReady && 'Open to relocation',
      f.travelReady && 'Open to business travel'
    ].filter(Boolean),
    clear: { candidateStatus: '', availability: '', jobType: [], workMode: [], relocationReady: false, travelReady: false },
    chips: [
      ...(f.candidateStatus ? [chip('cstatus', optionLabel(CANDIDATE_STATUS_OPTIONS, f.candidateStatus), () => set('candidateStatus', ''))] : []),
      ...(f.availability ? [chip('avail', `Available: ${optionLabel(AVAILABILITY_OPTIONS, f.availability).toLowerCase()}`, () => set('availability', ''))] : []),
      ...f.jobType.map((type) => chip(`job-${type}`, optionLabel(JOB_TYPE_OPTIONS, type), () => set('jobType', toggleIn(f.jobType, type)))),
      ...f.workMode.map((mode) => chip(`mode-${mode}`, optionLabel(WORK_MODE_OPTIONS, mode), () => set('workMode', toggleIn(f.workMode, mode)))),
      ...(f.relocationReady ? [chip('reloc', 'Open to relocation', () => set('relocationReady', false))] : []),
      ...(f.travelReady ? [chip('travel', 'Open to business travel', () => set('travelReady', false))] : [])
    ],
    // Several lists in one panel, so a pick doesn't close it.
    pill: {
      width: 280,
      body: (
        <div className={bm.menuList}>
          {statusOptions.length > 0 && (
            <>
              <p className={cf.menuHeading}>Candidate status</p>
              <RadioList className="" label="Candidate status" anyLabel="Any status" options={statusOptions} counts={opts.candidateStatusCounts} total={opts.total} value={f.candidateStatus} onPick={(value) => set('candidateStatus', value)} />
            </>
          )}
          {availabilityOptions.length > 0 && (
            <>
              <p className={cf.menuHeading}>Availability</p>
              <RadioList className="" label="Availability" anyLabel="Any time" options={availabilityOptions} counts={opts.availabilityCounts} total={opts.total} value={f.availability} onPick={(value) => set('availability', value)} />
            </>
          )}
          {jobTypeOptions.length > 0 && (
            <>
              <p className={cf.menuHeading}>Job type</p>
              <CheckList
                className=""
                label="Job type"
                items={jobTypeOptions.map((option) => ({ ...option, count: opts.jobTypeCounts[option.value] }))}
                picked={f.jobType}
                onToggle={(type) => set('jobType', toggleIn(f.jobType, type))}
              />
            </>
          )}
          {workModeOptions.length > 0 && (
            <>
              <p className={cf.menuHeading}>Work mode</p>
              <CheckList
                className=""
                label="Work mode"
                items={workModeOptions.map((option) => ({ ...option, count: opts.workModeCounts[option.value] }))}
                picked={f.workMode}
                onToggle={(mode) => set('workMode', toggleIn(f.workMode, mode))}
              />
            </>
          )}
          {openTo.length > 0 && (
            <>
              <p className={cf.menuHeading}>Open to</p>
              <div role="menu" aria-label="Open to">
                {openTo.map((item) => (
                  <MenuOption key={item.key} label={item.label} count={item.count} checked={!!f[item.key]} onClick={() => set(item.key, !f[item.key])} />
                ))}
              </div>
            </>
          )}
        </div>
      )
    },
    side: () => (
      <>
        {statusOptions.length > 0 && (
          <SideField id={fid('candidate-status')} label="Candidate status">
            <Select
              id={fid('candidate-status')}
              options={[{ value: '', label: 'Any status' }, ...statusOptions]}
              value={f.candidateStatus}
              onChange={(value) => set('candidateStatus', value)}
              placeholder="Any status"
            />
          </SideField>
        )}
        {jobTypeOptions.length > 0 && (
          <SideField id={fid('job-type')} label="Job type">
            <Select
              id={fid('job-type')}
              options={jobTypeOptions}
              value={f.jobType}
              onChange={(value) => set('jobType', value)}
              placeholder="Select job type"
              multiple
            />
          </SideField>
        )}
        {workModeOptions.length > 0 && (
          <SideField id={fid('work-mode')} label="Work mode">
            <Select
              id={fid('work-mode')}
              options={workModeOptions}
              value={f.workMode}
              onChange={(value) => set('workMode', value)}
              placeholder="Select work mode"
              multiple
            />
          </SideField>
        )}
        {availabilityOptions.length > 0 && (
          <SideField id={fid('availability')} label="Availability">
            <Select
              id={fid('availability')}
              options={[{ value: '', label: 'Any time' }, ...availabilityOptions]}
              value={f.availability}
              onChange={(value) => set('availability', value)}
              placeholder="Any time"
            />
          </SideField>
        )}
        {openTo.map((item) => (
          <Checkbox
            key={item.key}
            id={fid(item.key)}
            className={ds.checkRow}
            label={item.label}
            checked={!!f[item.key]}
            onChange={() => set(item.key, !f[item.key])}
          />
        ))}
      </>
    )
  };

  return [industry, experience, skills, salary, languages, location, education, certificates, preferences].filter((field) => field.available);
}
