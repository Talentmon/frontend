import React from 'react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import Combobox from 'components/ui/Combobox';
import Input from 'components/ui/Input';
import { CATEGORY_NAMES as SKILL_CATEGORY_NAMES, getSkillNamesFor } from 'utils/skills';
import { INDUSTRY_NAMES, getSubIndustries } from 'utils/industries';
import { currencySelectOptions } from 'utils/currencyService';
import styles from '../styles/bookmarked.module.scss';

const currencyOptions = currencySelectOptions();

const skillCategoryOptions = SKILL_CATEGORY_NAMES.map((name) => ({ value: name, label: name }));

const industryOptions = INDUSTRY_NAMES.map((name) => ({ value: name, label: name }));

const BookmarkedCandidatesFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  candidatesCount,
  isExpanded = false,
  onToggleExpand = () => {}
}) => {
  const experienceOptions = [
    { value: '', label: 'Any experience' },
    { value: '0-1', label: '0-1 years' },
    { value: '1-3', label: '1-3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-10', label: '5-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Actively searching' },
    { value: 'open', label: 'Open to offers' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleSalaryChange = (type, value) => {
    const updatedSalary = { ...filters?.salary, [type]: value };
    handleFilterChange('salary', updatedSalary);
  };

  const handleSkillCategoryChange = (updatedCategories) => {
    // Unchecking a category should drop skills that no longer match it.
    const validNames = getSkillNamesFor({ categories: updatedCategories });
    const prunedSkills = (filters?.skills || [])?.filter((name) => validNames?.includes(name));
    onFiltersChange({
      ...filters,
      skillCategory: updatedCategories,
      skills: prunedSkills
    });
  };

  const handleIndustryChange = (updatedIndustries) => {
    // Unchecking an industry should drop any of its subindustries that were selected.
    const stillValidSubIndustries = updatedIndustries?.flatMap((name) => getSubIndustries(name));
    const prunedSubIndustry = (filters?.subIndustry || [])?.filter((sub) => stillValidSubIndustries?.includes(sub));
    onFiltersChange({
      ...filters,
      industry: updatedIndustries,
      subIndustry: prunedSubIndustry
    });
  };

  const skillOptions = getSkillNamesFor({ categories: filters?.skillCategory || [] });

  const subIndustryOptions = (filters?.industry || [])?.flatMap((industryName) =>
    getSubIndustries(industryName)?.map((subIndustry) => ({
      value: subIndustry,
      label: subIndustry,
      group: industryName
    }))
  );
  const hasIndustry = filters?.industry?.length > 0;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters?.search) count++;
    if (filters?.experience) count++;
    if (filters?.status) count++;
    if (filters?.salary?.min || filters?.salary?.max) count++;
    if (filters?.industry && filters?.industry?.length > 0) count++;
    if (filters?.subIndustry && filters?.subIndustry?.length > 0) count++;
    if (filters?.skillCategory && filters?.skillCategory?.length > 0) count++;
    if (filters?.skills && filters?.skills?.length > 0) count++;
    if (filters?.hasNotes) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={styles.filters}>
      <div className={styles.filtersHead}>
        <div className={styles.filtersHeadRow}>
          <div className={styles.filtersTitle}>
            <Icon name="Filter" size={20} />
            <h3>Filters</h3>
            {activeFiltersCount > 0 && (
              <span className={styles.filtersBadge}>{activeFiltersCount}</span>
            )}
          </div>

          <div className={styles.filtersHeadActions}>
            {activeFiltersCount > 0 && (
              <button className={styles.filtersClear} onClick={onClearFilters}>
                <Icon name="X" size={14} />Clear all
              </button>
            )}

            <button
              className={`${styles.filtersToggle} ${isExpanded ? styles.open : ''}`}
              onClick={onToggleExpand}
            >
              <Icon name="ChevronDown" size={16} />
            </button>
          </div>
        </div>

        <div className={styles.quickSearch}>
          <Icon name="Search" size={17} />
          <input
            type="search"
            placeholder="Search by name, position, skills..."
            value={filters?.search || ''}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
          />
        </div>
      </div>

      {isExpanded && (
        <div className={styles.filtersBody}>
          <div className={styles.filtersSplit}>
            <div className={styles.filtersCol}>
              <div>
                <label className={styles.fieldLabel}>Industry</label>
                <Select
                  value={filters?.industry || []}
                  onChange={handleIndustryChange}
                  placeholder="Select industry"
                  options={industryOptions}
                  multiple
                />
                <div className={styles.stackedField}>
                  <Select
                    value={filters?.subIndustry || []}
                    onChange={(value) => handleFilterChange('subIndustry', value)}
                    placeholder={hasIndustry ? 'Select subindustry' : 'Select an industry first'}
                    options={subIndustryOptions}
                    disabled={!hasIndustry}
                    multiple
                  />
                </div>
              </div>

              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={filters?.hasNotes || false}
                  onChange={(e) => handleFilterChange('hasNotes', e?.target?.checked)}
                />
                With notes only
              </label>
            </div>

            <div className={styles.filtersColDivider} />

            <div className={styles.filtersCol}>
              <div>
                <label className={styles.fieldLabel}>Experience Level</label>
                <Select
                  value={filters?.experience || ''}
                  onChange={(value) => handleFilterChange('experience', value)}
                  placeholder="Any experience"
                  options={experienceOptions}
                />
              </div>

              <div>
                <label className={styles.fieldLabel}>Status</label>
                <Select
                  value={filters?.status || ''}
                  onChange={(value) => handleFilterChange('status', value)}
                  placeholder="All statuses"
                  options={statusOptions}
                />
              </div>
            </div>

            <div className={styles.filtersColDivider} />

            <div className={styles.filtersCol}>
              <div>
                <label className={styles.fieldLabel}>Skills</label>
                <Select
                  value={filters?.skillCategory || []}
                  onChange={handleSkillCategoryChange}
                  placeholder="Select category"
                  options={skillCategoryOptions}
                  multiple
                />
                <div className={styles.stackedField}>
                  <Combobox
                    value={filters?.skills || []}
                    onChange={(value) => handleFilterChange('skills', value)}
                    placeholder="Type or choose a skill"
                    options={skillOptions}
                    multiple
                  />
                </div>
              </div>
            </div>

            <div className={styles.filtersColDivider} />

            <div className={styles.filtersCol}>
              <div>
                <label className={styles.fieldLabel}>Salary range</label>
                <Select
                  label="Filter currency"
                  value={filters?.salary?.currency || 'EUR'}
                  onChange={(value) => handleSalaryChange('currency', value)}
                  options={currencyOptions}
                  searchable
                />
                <div className={styles.salaryRow}>
                  <Input
                    label={`From (${filters?.salary?.currency || 'EUR'})`}
                    type="number"
                    min="0"
                    placeholder="50,000"
                    value={filters?.salary?.min || ''}
                    onChange={(e) => handleSalaryChange('min', e?.target?.value)}
                  />
                  <Input
                    label={`To (${filters?.salary?.currency || 'EUR'})`}
                    type="number"
                    min="0"
                    placeholder="150,000"
                    value={filters?.salary?.max || ''}
                    onChange={(e) => handleSalaryChange('max', e?.target?.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.filtersFoot}>
            <p>Showing {candidatesCount} candidates</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkedCandidatesFilters;
