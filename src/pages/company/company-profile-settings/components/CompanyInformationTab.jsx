import React, { useState, useRef, useEffect } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import Select from 'components/ui/Select';
import { COMPANY_SIZE_OPTIONS, INDUSTRY_OPTIONS, WORK_MODE_OPTIONS, uploadCompanyLogo } from '../companyApi';
import styles from '../styles/company.module.scss';
import { ACCEPTED_IMAGE_TYPES } from 'utils/resizeImage';

const BENEFITS_LIST = [
  'Private health insurance',
  'Bonus',
  'Stock options',
  'Education budget',
  'Conferences',
  'Gym membership',
  'Parking',
  'Lunch',
  'Team building',
  'Extra days off',
];

// `readOnly`: recruiters see the company profile but only the owner edits it (the backend enforces the same).
const CompanyInformationTab = ({ companyData, onDataChange, onSave, isSaving, fireToast, errors = {}, readOnly = false }) => {
  const [logoPreview, setLogoPreview] = useState(companyData?.logo);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLogoPreview(companyData?.logo);
  }, [companyData?.logo]);
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const benefitsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (benefitsRef.current && !benefitsRef.current.contains(e.target)) {
        setBenefitsOpen(false);
      }
    };
    if (benefitsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [benefitsOpen]);

  const handleInputChange = (field, value) => {
    onDataChange({ ...companyData, [field]: value }, field);
  };

  // Required-field error plumbing — `data-invalid` is what the page scrolls to on a blocked save.
  const fieldProps = (field) => ({
    className: styles.field,
    'data-invalid': errors[field] ? 'true' : undefined,
  });
  const inputClass = (field, base = styles.finput) => (errors[field] ? `${base} ${styles.finvalid}` : base);
  const fieldError = (field) => (errors[field] ? <span className={styles.ferr}>{errors[field]}</span> : null);
  const requiredMark = <span className={styles.req}>*</span>;

  const toggleBenefit = (benefit) => {
    const current = companyData?.benefits || [];
    const updated = current.includes(benefit)
      ? current.filter(b => b !== benefit)
      : [...current, benefit];
    handleInputChange('benefits', updated);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target?.files?.[0];
    event.target.value = '';
    if (!file) return;

    const preview = new FileReader();
    preview.onload = (e) => setLogoPreview(e?.target?.result);
    preview.readAsDataURL(file);

    setIsUploading(true);
    try {
      const logoUrl = await uploadCompanyLogo(file);
      setLogoPreview(logoUrl);
      handleInputChange('logo', logoUrl);
    } catch (err) {
      setLogoPreview(companyData?.logo || null);
      fireToast?.(err?.response?.data?.message || err?.message || 'Could not upload logo — please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    // A disabled <fieldset> disables every input, Select trigger and button inside it in one go.
    <fieldset className={styles.stack} disabled={readOnly} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {readOnly && (
        <div className={styles.readOnlyNote}>
          <Icon name="Lock" size={15} />
          Only the account owner can edit the company profile.
        </div>
      )}

      {/* Company Logo Section */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Company logo</div>
        <div className={styles.cardSub}>Shown on your public profile and in search results</div>

        <div className={styles.logoUp}>
          <div className={styles.logoBox}>
            {logoPreview ? (
              <Image src={logoPreview} alt="Company logo" className={styles.logoImg} />
            ) : (
              <Icon name="Building2" size={28} />
            )}
          </div>

          <div>
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
              style={{ display: 'none' }}
            />
            <div className={styles.logoActions}>
              <button
                type="button"
                className={styles.upBtn}
                disabled
                title="Logo upload is temporarily unavailable"
              >
                <Icon name="Upload" size={15} />Upload unavailable
              </button>
            </div>
            <p className={styles.logoHint}>
              Recommended dimensions: 200×200px · JPG, PNG, WEBP — resized automatically
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Basic information</div>
        <div className={styles.cardSub}>Key details that candidates will see</div>

        <div className={styles.form2}>
          <div {...fieldProps('name')}>
            <label className={styles.flabel}>Company name {requiredMark}</label>
            <input
              className={inputClass('name')}
              type="text"
              placeholder="Enter company name"
              value={companyData?.name}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              required
            />
            {fieldError('name')}
          </div>

          <div {...fieldProps('foundedYear')}>
            <label className={styles.flabel}>Year founded {requiredMark}</label>
            <input
              className={inputClass('foundedYear')}
              type="number"
              min={1800}
              max={new Date().getFullYear()}
              placeholder="2010"
              value={companyData?.foundedYear}
              onChange={(e) => handleInputChange('foundedYear', e?.target?.value)}
              required
            />
            {fieldError('foundedYear')}
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>Company email {requiredMark}</label>
            <input className={styles.finput} type="email" value={companyData?.email || ''} disabled />
          </div>

          <div {...fieldProps('industry')}>
            <label className={styles.flabel}>Industry {requiredMark}</label>
            <div className={errors.industry ? styles.selectInvalid : undefined}>
              <Select
                value={companyData?.industry || ''}
                onChange={(v) => handleInputChange('industry', v)}
                options={INDUSTRY_OPTIONS}
                placeholder="Select industry…"
              />
            </div>
            {fieldError('industry')}
          </div>

          <div {...fieldProps('size')}>
            <label className={styles.flabel}>Company size {requiredMark}</label>
            <div className={errors.size ? styles.selectInvalid : undefined}>
              <Select
                value={companyData?.size || ''}
                onChange={(v) => handleInputChange('size', v)}
                options={COMPANY_SIZE_OPTIONS}
                placeholder="Select size…"
                disabled={!!companyData?.sizeChangeableFrom}
              />
            </div>
            {fieldError('size')}
            {/* Size sets how many team accounts the company gets, so it changes at most once a year. */}
            {companyData?.sizeChangeableFrom ? (
              <span className={styles.fhint}>
                Can be changed again on {new Date(companyData.sizeChangeableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
              </span>
            ) : companyData?.savedSize ? (
              <span className={styles.fhint}>Company size can be changed once a year.</span>
            ) : null}
          </div>

          <div {...fieldProps('location')}>
            <label className={styles.flabel}>City {requiredMark}</label>
            <input
              className={inputClass('location')}
              type="text"
              placeholder="Belgrade"
              value={companyData?.location}
              onChange={(e) => handleInputChange('location', e?.target?.value)}
              required
            />
            {fieldError('location')}
          </div>

          <div {...fieldProps('country')}>
            <label className={styles.flabel}>Country {requiredMark}</label>
            <input
              className={inputClass('country')}
              type="text"
              placeholder="Serbia"
              value={companyData?.country || ''}
              onChange={(e) => handleInputChange('country', e?.target?.value)}
              required
            />
            {fieldError('country')}
          </div>

          <div {...fieldProps('address')}>
            <label className={styles.flabel}>Address {requiredMark}</label>
            <input
              className={inputClass('address')}
              type="text"
              placeholder="Knez Mihailova 12, Belgrade"
              value={companyData?.address}
              onChange={(e) => handleInputChange('address', e?.target?.value)}
              required
            />
            {fieldError('address')}
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>Company registration number</label>
            <input
              className={styles.finput}
              type="text"
              placeholder="12345678"
              value={companyData?.registrationNumber || ''}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>Tax ID number</label>
            <input
              className={styles.finput}
              type="text"
              placeholder="123456789"
              value={companyData?.pib || ''}
              onChange={(e) => handleInputChange('pib', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Company Description */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Company description</div>
        <div className={styles.cardSub}>Tell candidates who you are</div>

        <div {...fieldProps('shortDescription')} style={{ marginBottom: 16 }}>
          <label className={styles.flabel}>Short description {requiredMark}</label>
          <textarea
            rows={4}
            maxLength={200}
            placeholder="Describe your company in a few sentences..."
            value={companyData?.shortDescription}
            onChange={(e) => handleInputChange('shortDescription', e?.target?.value)}
            className={inputClass('shortDescription', styles.ftext)}
            required
          />
          <div className={styles.counterRow}>
            {fieldError('shortDescription')}
            <div className={styles.counter}>{companyData?.shortDescription?.length || 0}/200 characters</div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.flabel}>Detailed description</label>
          <textarea
            rows={8}
            maxLength={1000}
            placeholder="Describe your company, mission, vision, and values in more detail..."
            value={companyData?.detailedDescription}
            onChange={(e) => handleInputChange('detailedDescription', e?.target?.value)}
            className={styles.ftext}
          />
          <div className={styles.counter}>{companyData?.detailedDescription?.length || 0}/1000 characters</div>
        </div>
      </div>

      {/* Contact Information */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Contact information</div>
        <div className={styles.cardSub}>How candidates and partners can reach you</div>

        <div className={styles.form2}>
          <div className={styles.field}>
            <label className={styles.flabel}>Contact email</label>
            <input
              className={styles.finput}
              type="email"
              placeholder="contact@yoursite.com"
              value={companyData?.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e?.target?.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>Phone</label>
            <input
              className={styles.finput}
              type="tel"
              placeholder="+381 11 123 4567"
              value={companyData?.phone}
              onChange={(e) => handleInputChange('phone', e?.target?.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>LinkedIn profile</label>
            <input
              className={styles.finput}
              type="url"
              placeholder="https://linkedin.com/company/yourcompany"
              value={companyData?.linkedinUrl}
              onChange={(e) => handleInputChange('linkedinUrl', e?.target?.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>Website</label>
            <input
              className={styles.finput}
              type="url"
              placeholder="https://www.yoursite.com"
              value={companyData?.website}
              onChange={(e) => handleInputChange('website', e?.target?.value)}
            />
          </div>
        </div>
      </div>

      {/* Work Conditions */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Work conditions</div>
        <div className={styles.cardSub}>Work mode and working hours flexibility</div>

        <div className={styles.field} style={{ marginBottom: 18 }}>
          <label className={styles.flabel}>Work mode</label>
          <div className={styles.modeGroup}>
            {WORK_MODE_OPTIONS.map(mode => (
              <button
                key={mode.value}
                type="button"
                className={`${styles.modeBtn} ${companyData?.workMode === mode.value ? styles.modeBtnOn : ''}`}
                onClick={() => handleInputChange('workMode', companyData?.workMode === mode.value ? '' : mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.flexRow}>
          <div>
            <div className={styles.flabel} style={{ marginBottom: 2 }}>Flexible working hours</div>
            <div style={{ fontSize: '.82rem', color: '#566776' }}>Employees can choose when they work within working hours</div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={!!companyData?.flexibleHours}
              onChange={(e) => handleInputChange('flexibleHours', e.target.checked)}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>
      </div>

      {/* Benefits */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Benefits</div>
        <div className={styles.cardSub}>Choose the benefits you offer employees</div>

        <div className={styles.field} ref={benefitsRef}>
          <label className={styles.flabel}>Benefits</label>
          <button
            type="button"
            className={`${styles.bDropTrigger} ${benefitsOpen ? styles.open : ''}`}
            onClick={() => setBenefitsOpen(o => !o)}
          >
            <span>
              {(companyData?.benefits?.length || 0) === 0
                ? 'Choose benefits...'
                : `${companyData.benefits.length} benefit${companyData.benefits.length === 1 ? '' : 's'} selected`}
            </span>
            <Icon
              name="ChevronDown"
              size={16}
              style={{ transform: benefitsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: '#566776' }}
            />
          </button>

          {benefitsOpen && (
            <div className={styles.bDropPanel}>
              {BENEFITS_LIST.map(benefit => {
                const checked = (companyData?.benefits || []).includes(benefit);
                return (
                  <div
                    key={benefit}
                    className={styles.bItem}
                    onClick={() => toggleBenefit(benefit)}
                  >
                    <div className={`${styles.bCheck} ${checked ? styles.checked : ''}`}>
                      <Icon name="Check" size={11} />
                    </div>
                    <span>{benefit}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className={styles.btnPrimary} onClick={onSave} disabled={isSaving}>
            <Icon name="Save" size={16} />{isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </fieldset>
  );
};

export default CompanyInformationTab;
