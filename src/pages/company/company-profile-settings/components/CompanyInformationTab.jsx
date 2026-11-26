import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import Select from 'components/ui/Select';
import { COMPANY_SIZE_OPTIONS, INDUSTRY_OPTIONS, PAYMENT_CURRENCY_OPTIONS, WORK_MODE_OPTIONS, uploadCompanyLogo } from '../companyApi';
import { currencySymbol, getCurrency } from 'utils/currencyService';
import SectionHead from './SectionHead';
import { FieldError, Group, Hint } from './FormBits';
import styles from '../styles/company.module.scss';
import { ACCEPTED_IMAGE_TYPES } from 'utils/resizeImage';
import { COUNTRY_NAMES, COUNTRY_OPTIONS } from 'utils/countries';

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
const BENEFIT_OPTIONS = BENEFITS_LIST.map((benefit) => ({ value: benefit, label: benefit }));

const WORK_MODE_CARD = {
  REMOTE: { icon: 'Monitor', sub: 'Work from anywhere' },
  HYBRID: { icon: 'ArrowLeftRight', sub: 'Office and home' },
  ONSITE: { icon: 'Building2', sub: 'From the office' },
};

const SHORT_MAX = 200;
const LONG_MAX = 1000;

// A typed "nordlight.com" still opens; anything else gets https:// in front, so it can't run as a script link.
const toHref = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/** "12 / 200", gold near the limit. */
const Counter = ({ length, max }) => (
  <span className={`${styles.taCount}${length > max * 0.9 ? ` ${styles.taCountNear}` : ''}`} aria-live="polite">
    {length} / {max}
  </span>
);

// `readOnly`: recruiters see the company profile but only the owner edits it (the backend enforces the same).
// `onOpenAccount`: switches to the Account settings tab, where the login email is changed.
const CompanyInformationTab = ({ companyData, onDataChange, onSave, isSaving, fireToast, errors = {}, readOnly = false, onOpenAccount }) => {
  const [logoPreview, setLogoPreview] = useState(companyData?.logo);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLogoPreview(companyData?.logo);
  }, [companyData?.logo]);

  const handleInputChange = (field, value) => {
    onDataChange({ ...companyData, [field]: value }, field);
  };

  // Required-field error plumbing — `data-invalid` is what the page scrolls to on a blocked save.
  const fieldProps = (field, extra = '') => ({
    className: extra ? `${styles.field} ${extra}` : styles.field,
    'data-invalid': errors[field] ? 'true' : undefined,
  });
  const inputClass = (field) => (errors[field] ? `${styles.finput} ${styles.finvalid}` : styles.finput);
  const fieldError = (field) => <FieldError>{errors[field]}</FieldError>;
  const requiredMark = <span className={styles.req}>*</span>;
  // Country used to be typed in; a saved name that isn't on the list stays selectable instead of vanishing.
  const savedCountry = companyData?.country;
  const countryOptions = savedCountry && !COUNTRY_NAMES.includes(savedCountry)
    ? [{ value: savedCountry, label: savedCountry }, ...COUNTRY_OPTIONS]
    : COUNTRY_OPTIONS;
  // An input with its icon inside; `right` is a lock or an "open link" button at the other end.
  const withIcon = (icon, input, right = null) => (
    <div className={right ? `${styles.inputIcon} ${styles.inputIconR}` : styles.inputIcon}>
      <Icon name={icon} size={16} />
      {input}
      {right}
    </div>
  );
  const openLink = (url, label) =>
    url?.trim() ? (
      <a
        className={styles.inInputBtn}
        href={toHref(url.trim())}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${label} in a new tab`}
        title={`Open ${label} in a new tab`}
      >
        <Icon name="ExternalLink" size={15} />
      </a>
    ) : null;

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

  const benefits = companyData?.benefits || [];
  const shortLength = companyData?.shortDescription?.length || 0;
  const longLength = companyData?.detailedDescription?.length || 0;
  // Payments: the symbol inside the currency field and the three "How you're charged" steps.
  const payCurrency = companyData?.paymentCurrency || '';
  const paySymbol = payCurrency ? currencySymbol(payCurrency) : '¤';
  const payName = getCurrency(payCurrency)?.name || payCurrency;
  const payInEur = payCurrency === 'EUR';
  const paySteps = [
    { n: '01', icon: 'Tag', tone: 'payToneGold', title: 'Prices are in EUR', text: 'Credits are always priced in euros.' },
    payInEur
      ? { n: '02', icon: 'ArrowLeftRight', tone: 'payToneBlue', title: 'No conversion', text: 'You pay in euros, so nothing changes.' }
      : { n: '02', icon: 'ArrowLeftRight', tone: 'payToneBlue', title: 'Converted at checkout', text: "Paddle uses that day's exchange rate." },
    payCurrency
      ? {
          n: '03', icon: 'CreditCard', tone: 'payToneSolid', last: true, title: `Charged in ${payCurrency}`,
          text: payInEur ? 'This is what your bank statement shows.' : `Your bank statement shows the amount in ${payName}.`,
        }
      : { n: '03', icon: 'CreditCard', tone: 'payToneSolid', last: true, title: 'Charged in your currency', text: 'Pick a payment currency first.' },
  ];

  const previewMeta = [
    INDUSTRY_OPTIONS.find((o) => o.value === companyData?.industry)?.label,
    companyData?.location?.trim(),
  ].filter(Boolean).join(' · ');

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
        <SectionHead icon="Image" title="Company logo" subtitle="Shown on your public profile and in the company list." />

        <div className={styles.logoUp}>
          <div className={styles.logoBox}>
            {logoPreview ? (
              <Image src={logoPreview} alt="Company logo" className={styles.logoImg} />
            ) : (
              <>
                <Icon name="Image" size={26} strokeWidth={1.7} />
                No logo yet
              </>
            )}
          </div>

          <div className={styles.logoBody}>
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
                <Icon name="Upload" size={16} />{isUploading ? 'Uploading…' : 'Upload unavailable'}
              </button>
            </div>
            <p className={styles.logoHint}>
              Square image, at least 200 × 200 px. JPG, PNG or WEBP.
              <br />
              We resize it automatically.
            </p>
          </div>

          <div className={styles.logoPreview} aria-hidden="true">
            <p className={styles.logoPreviewLabel}>In the company list</p>
            <div className={styles.logoPreviewCard}>
              <span className={styles.logoPreviewMark}>
                {logoPreview ? <img src={logoPreview} alt="" /> : <Icon name="Building2" size={17} strokeWidth={1.8} />}
              </span>
              <span className={styles.logoPreviewText}>
                <b>{companyData?.name?.trim() || 'Your company'}</b>
                <span>{previewMeta || 'Industry · City'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className={styles.card}>
        <SectionHead icon="Building2" title="Basic information" subtitle="Key details that candidates will see on your company profile." />

        <Group label="Company">
          <div {...fieldProps('name')}>
            <label className={styles.flabel} htmlFor="coName">Company name {requiredMark}</label>
            {withIcon('Building2', (
              <input
                id="coName"
                className={inputClass('name')}
                type="text"
                placeholder="Enter company name"
                value={companyData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                aria-invalid={!!errors.name}
              />
            ))}
            {fieldError('name')}
          </div>

          <div {...fieldProps('foundedYear')}>
            <label className={styles.flabel} htmlFor="coYear">Year founded {requiredMark}</label>
            {withIcon('CalendarDays', (
              <input
                id="coYear"
                className={inputClass('foundedYear')}
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="2010"
                value={companyData?.foundedYear}
                onChange={(e) => handleInputChange('foundedYear', e?.target?.value.replace(/\D/g, ''))}
                aria-invalid={!!errors.foundedYear}
              />
            ))}
            {fieldError('foundedYear')}
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
              <Hint info>
                You can change it again on {new Date(companyData.sizeChangeableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
              </Hint>
            ) : companyData?.savedSize ? (
              <Hint info>You can change this once a year.</Hint>
            ) : null}
          </div>
        </Group>

        <Group label="Location">
          <div {...fieldProps('country')}>
            <label className={styles.flabel}>Country {requiredMark}</label>
            <div className={errors.country ? styles.selectInvalid : undefined}>
              <Select
                value={companyData?.country || ''}
                onChange={(v) => handleInputChange('country', v)}
                options={countryOptions}
                placeholder="Select country…"
                searchable
              />
            </div>
            {fieldError('country')}
          </div>

          <div {...fieldProps('location')}>
            <label className={styles.flabel} htmlFor="coCity">City {requiredMark}</label>
            {withIcon('MapPin', (
              <input
                id="coCity"
                className={inputClass('location')}
                type="text"
                placeholder="London"
                value={companyData?.location}
                onChange={(e) => handleInputChange('location', e?.target?.value)}
                aria-invalid={!!errors.location}
              />
            ))}
            {fieldError('location')}
          </div>

          <div {...fieldProps('address', styles.fieldFull)}>
            <label className={styles.flabel} htmlFor="coAddress">Address {requiredMark}</label>
            {withIcon('Map', (
              <input
                id="coAddress"
                className={inputClass('address')}
                type="text"
                placeholder="12 High Street"
                value={companyData?.address}
                onChange={(e) => handleInputChange('address', e?.target?.value)}
                aria-invalid={!!errors.address}
              />
            ))}
            {fieldError('address')}
          </div>
        </Group>

        <Group label="Contact and legal">
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.flabel} htmlFor="coEmail">Company email {requiredMark}</label>
            {withIcon(
              'Mail',
              <input id="coEmail" className={styles.finput} type="email" value={companyData?.email || ''} disabled />,
              <span className={styles.inputLock} title="Managed in Account settings"><Icon name="Lock" size={16} /></span>,
            )}
            {readOnly ? (
              <Hint>The account owner's login email.</Hint>
            ) : (
              <Hint>
                This is your login email. You can change it in{' '}
                <button type="button" className={styles.fhintLink} onClick={onOpenAccount}>Account settings</button>.
              </Hint>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="coReg">Company registration number</label>
            {withIcon('Hash', (
              <input
                id="coReg"
                className={styles.finput}
                type="text"
                placeholder="12345678"
                value={companyData?.registrationNumber || ''}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              />
            ))}
          </div>

          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="coTax">Tax ID number</label>
            {withIcon('Receipt', (
              <input
                id="coTax"
                className={styles.finput}
                type="text"
                placeholder="123456789"
                value={companyData?.pib || ''}
                onChange={(e) => handleInputChange('pib', e.target.value)}
              />
            ))}
          </div>
        </Group>
      </div>

      {/* Company Description */}
      <div className={styles.card}>
        <SectionHead icon="FileText" title="Company description" subtitle="Tell candidates who you are." />

        <div {...fieldProps('shortDescription')} style={{ marginBottom: 18 }}>
          <label className={styles.flabel} htmlFor="coShort">Short description {requiredMark}</label>
          <div className={errors.shortDescription ? `${styles.taWrap} ${styles.taInvalid}` : styles.taWrap}>
            <textarea
              id="coShort"
              rows={2}
              maxLength={SHORT_MAX}
              placeholder="Describe your company in a sentence or two…"
              value={companyData?.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e?.target?.value)}
              aria-invalid={!!errors.shortDescription}
            />
            <Counter length={shortLength} max={SHORT_MAX} />
          </div>
          {fieldError('shortDescription')}
          <Hint>A sentence or two. Candidates see it on your profile until you add a detailed description.</Hint>
        </div>

        <div className={styles.field}>
          <label className={styles.flabel} htmlFor="coLong">Detailed description</label>
          <div className={styles.taWrap}>
            <textarea
              id="coLong"
              rows={5}
              maxLength={LONG_MAX}
              placeholder="Your mission, how you work, who you hire…"
              value={companyData?.detailedDescription}
              onChange={(e) => handleInputChange('detailedDescription', e?.target?.value)}
            />
            <Counter length={longLength} max={LONG_MAX} />
          </div>
          <Hint>Shown on your company profile. Tell candidates what you build, how you work and who you hire.</Hint>
        </div>
      </div>

      {/* Contact Information */}
      <div className={styles.card}>
        <SectionHead icon="Contact" title="Contact information" subtitle="How candidates and partners can reach you." />

        <div className={styles.form2}>
          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="coContactEmail">Contact email</label>
            {withIcon('Mail', (
              <input
                id="coContactEmail"
                className={styles.finput}
                type="email"
                placeholder="jobs@company.com"
                value={companyData?.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e?.target?.value)}
              />
            ))}
            <Hint>Candidates use this to reach you.</Hint>
          </div>

          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="coPhone">Phone</label>
            {withIcon('Phone', (
              <input
                id="coPhone"
                className={styles.finput}
                type="tel"
                placeholder="+44 20 7946 0958"
                value={companyData?.phone}
                onChange={(e) => handleInputChange('phone', e?.target?.value)}
              />
            ))}
          </div>

          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="coLinkedin">LinkedIn page</label>
            {withIcon(
              'Linkedin',
              <input
                id="coLinkedin"
                className={styles.finput}
                type="url"
                placeholder="https://linkedin.com/company/…"
                value={companyData?.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e?.target?.value)}
              />,
              openLink(companyData?.linkedinUrl, 'LinkedIn page'),
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="coWebsite">Website</label>
            {withIcon(
              'Link2',
              <input
                id="coWebsite"
                className={styles.finput}
                type="url"
                placeholder="https://company.com"
                value={companyData?.website}
                onChange={(e) => handleInputChange('website', e?.target?.value)}
              />,
              openLink(companyData?.website, 'website'),
            )}
          </div>
        </div>
      </div>

      {/* Work Conditions */}
      <div className={styles.card}>
        <SectionHead icon="Briefcase" title="Work conditions" subtitle="Work mode and how flexible your hours are." />

        <div className={styles.field}>
          <span className={styles.flabel} id="workModeLabel">Work mode</span>
          <div className={styles.modeCards} role="radiogroup" aria-labelledby="workModeLabel">
            {WORK_MODE_OPTIONS.map((mode) => {
              const on = companyData?.workMode === mode.value;
              const card = WORK_MODE_CARD[mode.value] || {};
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`${styles.modeCard}${on ? ` ${styles.modeCardOn}` : ''}`}
                  onClick={() => handleInputChange('workMode', on ? '' : mode.value)}
                >
                  <span className={styles.modeIcon} aria-hidden="true"><Icon name={card.icon || 'Briefcase'} size={18} /></span>
                  <span className={styles.modeText}>
                    <b>{mode.label}</b>
                    {card.sub && <span>{card.sub}</span>}
                  </span>
                  {on && (
                    <span className={styles.modeCheck} aria-hidden="true"><Icon name="Check" size={11} strokeWidth={3.2} /></span>
                  )}
                </button>
              );
            })}
          </div>
          {!companyData?.workMode && <Hint>Pick the one that fits most of your roles.</Hint>}
        </div>

        <div className={styles.divider} />

        <div className={styles.switchRow}>
          <div className={styles.switchText}>
            <b id="flexHoursLabel">Flexible working hours</b>
            <span>People choose when they work within your working hours.</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              role="switch"
              aria-labelledby="flexHoursLabel"
              checked={!!companyData?.flexibleHours}
              onChange={(e) => handleInputChange('flexibleHours', e.target.checked)}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>
      </div>

      {/* Benefits — a dropdown, with each pick shown as a removable pill below it */}
      <div className={styles.card}>
        <SectionHead icon="Gift" title="Benefits" subtitle="What employees get on top of salary." />

        <div className={styles.field}>
          <label className={styles.flabel}>What do you offer?</label>
          <Select
            multiple
            value={benefits}
            onChange={(next) => handleInputChange('benefits', next)}
            options={BENEFIT_OPTIONS}
            placeholder="Choose benefits…"
            multipleLabel={(count) => `${count} benefits selected`}
          />
          {benefits.length > 0 ? (
            <div className={styles.benChips}>
              {benefits.map((benefit) => (
                <span key={benefit} className={`${styles.benChip}${readOnly ? ` ${styles.benChipRO}` : ''}`}>
                  {benefit}
                  {!readOnly && (
                    <button
                      type="button"
                      className={styles.benChipX}
                      aria-label={`Remove ${benefit}`}
                      onClick={() => handleInputChange('benefits', benefits.filter((b) => b !== benefit))}
                    >
                      <Icon name="X" size={12} strokeWidth={2.6} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <Hint>Pick everything you offer. Candidates see these on your profile.</Hint>
          )}
        </div>
      </div>

      {/* Salary view is on the Filter settings tab (FilterSettingsTab). */}

      {/* Payments — what the company's card is charged in; Credit prices stay in EUR */}
      <div className={styles.card}>
        <SectionHead icon="CreditCard" title="Payments" subtitle="The currency your card is charged in when you buy Credits." />

        <div className={styles.payTop}>
          <div {...fieldProps('paymentCurrency')}>
            <label className={styles.flabel}>Payment currency {requiredMark}</label>
            <div className={`${styles.paySelect}${errors.paymentCurrency ? ` ${styles.selectInvalid}` : ''}`}>
              <span
                className={styles.paySym}
                style={paySymbol.length > 2 ? { fontSize: 10 } : paySymbol.length === 2 ? { fontSize: 12 } : undefined}
                aria-hidden="true"
              >
                {paySymbol}
              </span>
              <Select
                value={payCurrency}
                onChange={(v) => handleInputChange('paymentCurrency', v)}
                options={PAYMENT_CURRENCY_OPTIONS}
                placeholder="Select currency…"
                searchable
              />
            </div>
            {fieldError('paymentCurrency')}
          </div>

          <div className={styles.payTip}>
            <span className={styles.payTipIcon} aria-hidden="true"><Icon name="DollarSign" size={16} strokeWidth={2.1} /></span>
            <p><b>Match your card's currency.</b> Applies to the whole team.</p>
          </div>
        </div>

        {/* EUR price → (conversion) → what the card is charged in; the last step follows the pick above. */}
        <div className={styles.payFlow}>
          <p className={styles.payFlowLabel}>How you're charged</p>
          <ol className={styles.paySteps}>
            {paySteps.map((stepItem, i) => (
              <React.Fragment key={stepItem.n}>
                {i > 0 && (
                  <li className={styles.payArrow} aria-hidden="true"><Icon name="ArrowRight" size={16} strokeWidth={2.2} /></li>
                )}
                <li className={`${styles.payStep}${stepItem.last ? ` ${styles.payStepLast}` : ''}`}>
                  <span className={styles.payStepTop}>
                    <span className={`${styles.payStepIcon} ${styles[stepItem.tone]}`} aria-hidden="true">
                      <Icon name={stepItem.icon} size={17} />
                    </span>
                    <span className={styles.payStepNum} aria-hidden="true">{stepItem.n}</span>
                  </span>
                  <span className={styles.payStepText}>
                    <b aria-live={stepItem.last ? 'polite' : undefined}>{stepItem.title}</b>
                    <span>{stepItem.text}</span>
                  </span>
                </li>
              </React.Fragment>
            ))}
          </ol>
          <p className={styles.payHistory}>
            <Icon name="History" size={15} />
            Your purchase history always stays in EUR, whatever currency you pay in.
          </p>
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

export default CompanyInformationTab;
