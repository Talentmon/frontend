import React, { useState } from 'react';
import Icon from '../AppIcon';
import Input from './Input';
import Select from './Select';
import { Checkbox } from './Checkbox';
import Button from './Button';

const SearchFilterPanel = ({
  filters = {},
  onFiltersChange = () => {},
  onClearFilters = () => {},
  onSaveFilters = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {}
}) => {
  const [localFilters, setLocalFilters] = useState({
    keywords: '',
    location: '',
    experience: '',
    salary: { min: '', max: '' },
    skills: [],
    jobType: [],
    education: '',
    company: '',
    availability: '',
    ...filters
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    experience: true,
    compensation: false,
    skills: false,
    preferences: false
  });

  const experienceOptions = [
    { value: '', label: 'Any Experience' },
    { value: '0-1', label: '0-1 years' },
    { value: '1-3', label: '1-3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-10', label: '5-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  const educationOptions = [
    { value: '', label: 'Any Education' },
    { value: 'high-school', label: 'High School' },
    { value: 'bachelor', label: "Bachelor\'s Degree" },
    { value: 'master', label: "Master\'s Degree" },
    { value: 'phd', label: 'PhD' }
  ];

  const availabilityOptions = [
    { value: '', label: 'Any Availability' },
    { value: 'immediate', label: 'Immediate' },
    { value: '2-weeks', label: 'Within 2 weeks' },
    { value: '1-month', label: 'Within 1 month' },
    { value: '3-months', label: 'Within 3 months' }
  ];

  const jobTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'remote', label: 'Remote' }
  ];

  const popularSkills = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'TypeScript',
    'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Git'
  ];

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleSalaryChange = (type, value) => {
    const updatedSalary = { ...localFilters?.salary, [type]: value };
    handleFilterChange('salary', updatedSalary);
  };

  const handleSkillToggle = (skill) => {
    const updatedSkills = localFilters?.skills?.includes(skill)
      ? localFilters?.skills?.filter(s => s !== skill)
      : [...localFilters?.skills, skill];
    handleFilterChange('skills', updatedSkills);
  };

  const handleJobTypeToggle = (jobType) => {
    const updatedJobTypes = localFilters?.jobType?.includes(jobType)
      ? localFilters?.jobType?.filter(jt => jt !== jobType)
      : [...localFilters?.jobType, jobType];
    handleFilterChange('jobType', updatedJobTypes);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev?.[section]
    }));
  };

  const handleClearAll = () => {
    const clearedFilters = {
      keywords: '',
      location: '',
      experience: '',
      salary: { min: '', max: '' },
      skills: [],
      jobType: [],
      education: '',
      company: '',
      availability: ''
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters?.keywords) count++;
    if (localFilters?.location) count++;
    if (localFilters?.experience) count++;
    if (localFilters?.salary?.min || localFilters?.salary?.max) count++;
    if (localFilters?.skills?.length > 0) count++;
    if (localFilters?.jobType?.length > 0) count++;
    if (localFilters?.education) count++;
    if (localFilters?.company) count++;
    if (localFilters?.availability) count++;
    return count;
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-card border-r border-border flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Expand filters"
        >
          <Icon name="ChevronRight" size={20} />
        </button>
        {getActiveFiltersCount() > 0 && (
          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium mt-2">
            {getActiveFiltersCount()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-foreground">Filters</h3>
            {getActiveFiltersCount() > 0 && (
              <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                {getActiveFiltersCount()}
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
            aria-label="Collapse filters"
          >
            <Icon name="ChevronLeft" size={20} />
          </button>
        </div>
        
        <div className="flex space-x-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={getActiveFiltersCount() === 0}
            className="flex-1"
          >
            Clear All
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onSaveFilters(localFilters)}
            iconName="Save"
            iconSize={14}
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </div>
      {/* Filters Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-6">
          {/* Basic Search */}
          <div>
            <button
              onClick={() => toggleSection('basic')}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="font-medium text-foreground">Basic Search</h4>
              <Icon 
                name="ChevronDown" 
                size={16} 
                className={`transition-transform ${expandedSections?.basic ? 'rotate-180' : ''}`}
              />
            </button>
            
            {expandedSections?.basic && (
              <div className="space-y-3">
                <Input
                  label="Keywords"
                  type="text"
                  placeholder="Job title, skills, company..."
                  value={localFilters?.keywords}
                  onChange={(e) => handleFilterChange('keywords', e?.target?.value)}
                />
                
                <Input
                  label="Location"
                  type="text"
                  placeholder="City, state, or remote"
                  value={localFilters?.location}
                  onChange={(e) => handleFilterChange('location', e?.target?.value)}
                />
                
                <Input
                  label="Company"
                  type="text"
                  placeholder="Company name"
                  value={localFilters?.company}
                  onChange={(e) => handleFilterChange('company', e?.target?.value)}
                />
              </div>
            )}
          </div>

          {/* Experience */}
          <div>
            <button
              onClick={() => toggleSection('experience')}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="font-medium text-foreground">Experience & Education</h4>
              <Icon 
                name="ChevronDown" 
                size={16} 
                className={`transition-transform ${expandedSections?.experience ? 'rotate-180' : ''}`}
              />
            </button>
            
            {expandedSections?.experience && (
              <div className="space-y-3">
                <Select
                  label="Experience Level"
                  options={experienceOptions}
                  value={localFilters?.experience}
                  onChange={(value) => handleFilterChange('experience', value)}
                  placeholder="Select experience"
                />
                
                <Select
                  label="Education"
                  options={educationOptions}
                  value={localFilters?.education}
                  onChange={(value) => handleFilterChange('education', value)}
                  placeholder="Select education"
                />
              </div>
            )}
          </div>

          {/* Compensation */}
          <div>
            <button
              onClick={() => toggleSection('compensation')}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="font-medium text-foreground">Compensation</h4>
              <Icon 
                name="ChevronDown" 
                size={16} 
                className={`transition-transform ${expandedSections?.compensation ? 'rotate-180' : ''}`}
              />
            </button>
            
            {expandedSections?.compensation && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Min Salary"
                    type="number"
                    placeholder="50,000"
                    value={localFilters?.salary?.min}
                    onChange={(e) => handleSalaryChange('min', e?.target?.value)}
                  />
                  <Input
                    label="Max Salary"
                    type="number"
                    placeholder="150,000"
                    value={localFilters?.salary?.max}
                    onChange={(e) => handleSalaryChange('max', e?.target?.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          <div>
            <button
              onClick={() => toggleSection('skills')}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="font-medium text-foreground">Skills</h4>
              <Icon 
                name="ChevronDown" 
                size={16} 
                className={`transition-transform ${expandedSections?.skills ? 'rotate-180' : ''}`}
              />
            </button>
            
            {expandedSections?.skills && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {popularSkills?.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-1 text-sm rounded-full border transition-all ${
                        localFilters?.skills?.includes(skill)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:border-primary'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div>
            <button
              onClick={() => toggleSection('preferences')}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="font-medium text-foreground">Job Preferences</h4>
              <Icon 
                name="ChevronDown" 
                size={16} 
                className={`transition-transform ${expandedSections?.preferences ? 'rotate-180' : ''}`}
              />
            </button>
            
            {expandedSections?.preferences && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Job Type
                  </label>
                  <div className="space-y-2">
                    {jobTypeOptions?.map((option) => (
                      <Checkbox
                        key={option?.value}
                        label={option?.label}
                        checked={localFilters?.jobType?.includes(option?.value)}
                        onChange={() => handleJobTypeToggle(option?.value)}
                      />
                    ))}
                  </div>
                </div>
                
                <Select
                  label="Availability"
                  options={availabilityOptions}
                  value={localFilters?.availability}
                  onChange={(value) => handleFilterChange('availability', value)}
                  placeholder="Select availability"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterPanel;