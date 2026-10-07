import apiClient from 'lib/apiClient';
import { ACCEPTED_IMAGE_TYPES, resizeImageToWebp } from 'utils/resizeImage';
import { INDUSTRY_NAMES } from 'utils/industries';

export const INDUSTRY_OPTIONS = INDUSTRY_NAMES.map((name) => ({ value: name, label: name }));

/**
 * Fields that must be filled in (and saved) before the company can use
 * search, bookmarks, purchases and credits. Mirrors REQUIRED_COMPANY_FIELDS
 * in the backend's company-profile.ts, which is what actually enforces it —
 * this copy only drives the asterisks, inline errors and the banner labels.
 */
export const REQUIRED_COMPANY_FIELD_LABELS = {
  name: 'Company name',
  foundedYear: 'Year founded',
  email: 'Company email',
  industry: 'Industry',
  size: 'Company size',
  location: 'City',
  country: 'Country',
  address: 'Address',
  shortDescription: 'Short description',
};

const MIN_FOUNDED_YEAR = 1800;

/** Inline validation before saving — returns `{ [field]: message }`, empty when the form can be saved. */
export function validateCompany(companyData) {
  const errors = {};
  for (const field of Object.keys(REQUIRED_COMPANY_FIELD_LABELS)) {
    if (!String(companyData?.[field] ?? '').trim()) errors[field] = 'This field is required.';
  }
  const currentYear = new Date().getFullYear();
  const year = Number(companyData?.foundedYear);
  if (!errors.foundedYear && (!Number.isInteger(year) || year < MIN_FOUNDED_YEAR || year > currentYear)) {
    errors.foundedYear = `Enter a year between ${MIN_FOUNDED_YEAR} and ${currentYear}.`;
  }
  return errors;
}

export const COMPANY_SIZE_OPTIONS = [
  { value: 'SMALL', label: '1–50 employees' },
  { value: 'MID', label: '51–200 employees' },
  { value: 'LARGE', label: '201–1000 employees' },
  { value: 'ENTERPRISE', label: '1000+ employees' },
];

export const WORK_MODE_OPTIONS = [
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ONSITE', label: 'On-site' },
];

// ---- Company profile (basics/description/contact/work conditions/benefits) ----
export function getCompany() {
  return apiClient.get('/companies/me').then((r) => r.data);
}
export function updateCompany(patch) {
  return apiClient.patch('/companies/me', patch).then((r) => r.data);
}

/** Maps the backend Company (GET /companies/me shape) onto the frontend `companyData` object. */
export function companyToFrontend(c) {
  return {
    companyId: c.companyCode || '',
    name: c.name || '',
    email: c.email || '',
    website: c.website || '',
    // Industry used to be free text — a value outside the fixed list shows
    // as unselected, so it has to be re-picked from the dropdown.
    industry: INDUSTRY_NAMES.includes(c.industry) ? c.industry : '',
    size: c.size || '',
    location: c.location || '',
    foundedYear: c.foundedYear ? String(c.foundedYear) : '',
    pib: c.pib || '',
    country: c.country || '',
    logo: c.logoUrl || null,
    shortDescription: c.shortDescription || '',
    detailedDescription: c.detailedDescription || '',
    contactEmail: c.contactEmail || '',
    phone: c.phone || '',
    linkedinUrl: c.linkedinUrl || '',
    address: c.address || '',
    workMode: c.workMode || '',
    flexibleHours: !!c.flexibleHours,
    benefits: c.benefits || [],
    registrationNumber: c.registrationNumber || '',
    profileComplete: !!c.profileComplete,
    missingFields: c.missingFields || [],
  };
}

const emptyToUndefined = (v) => (v === '' ? undefined : v);

/** Builds an UpdateCompanyDto-shaped payload — optional string fields must be `undefined`, not `''`, or class-validator's @IsUrl/@IsEmail reject them. */
export function companyToPayload(companyData) {
  return {
    name: emptyToUndefined(companyData.name),
    website: emptyToUndefined(companyData.website),
    industry: emptyToUndefined(companyData.industry),
    size: emptyToUndefined(companyData.size),
    location: emptyToUndefined(companyData.location),
    foundedYear: companyData.foundedYear ? Number(companyData.foundedYear) : undefined,
    pib: emptyToUndefined(companyData.pib),
    country: emptyToUndefined(companyData.country),
    shortDescription: emptyToUndefined(companyData.shortDescription),
    detailedDescription: emptyToUndefined(companyData.detailedDescription),
    contactEmail: emptyToUndefined(companyData.contactEmail),
    phone: emptyToUndefined(companyData.phone),
    linkedinUrl: emptyToUndefined(companyData.linkedinUrl),
    address: emptyToUndefined(companyData.address),
    workMode: emptyToUndefined(companyData.workMode),
    flexibleHours: !!companyData.flexibleHours,
    registrationNumber: emptyToUndefined(companyData.registrationNumber),
    benefits: companyData.benefits || [],
  };
}

// ---- Logo (multipart upload through the backend, same shape as candidate photo upload) ----
// SVG is deliberately not in ACCEPTED_IMAGE_TYPES: it's an XML document a
// browser can execute (<script>, event-handler attributes, <foreignObject>,
// external <use href>), not just pixels — a stored-XSS vector if ever
// served/rendered as a document rather than an <img>. Magic-byte sniffing
// can't close this (a file starting with '<svg>' followed by a script tag
// still "looks like" valid SVG), so the only real fix is not accepting the
// format at all.
export async function uploadCompanyLogo(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WEBP image.');
  }

  let uploadFile;
  try {
    uploadFile = await resizeImageToWebp(file);
  } catch {
    throw new Error('Could not process this image — please try a different one.');
  }

  const form = new FormData();
  form.append('file', uploadFile);
  const { data: company } = await apiClient.post('/companies/me/logo', form);
  return company.logoUrl;
}

// ---- Reputation (read-only) ----
export function getMyReviews() {
  return apiClient.get('/companies/me/reviews').then((r) => r.data);
}

/**
 * Maps `GET /companies/me/reviews` onto the shape ReputationManagementTab
 * expects. Only real, computable fields — no fabricated stats (hiring time,
 * candidate satisfaction, retention rate, successful hires are not tracked
 * anywhere and were dropped from the tab rather than faked).
 */
export function reviewsToReputationData(data) {
  const reviews = data.reviews || [];
  const recommendCounted = reviews.filter((r) => r.recommend !== null).length;
  const recommendYes = reviews.filter((r) => r.recommend === true).length;

  return {
    overallRating: data.averageRating,
    totalReviews: data.totalReviews,
    ratingBreakdown: data.ratingBreakdown,
    recommendationRate: recommendCounted ? Math.round((recommendYes / recommendCounted) * 100) : 0,
    recentReviews: reviews.slice(0, 5).map((r) => ({
      position: r.roleTitle || 'Position not specified',
      department: r.department || '',
      rating: Math.round((r.ratingProcess + r.ratingComms + r.ratingCulture + r.ratingBenefits) / 4),
      comment: r.comment || '',
      minWageRespected: r.minWageRespected,
      hiredDate: r.hire?.hireDate ? new Date(r.hire.hireDate).toLocaleDateString() : '—',
      reviewDate: new Date(r.createdAt).toLocaleDateString(),
    })),
  };
}

// ---- Team ----
export function listTeam() {
  return apiClient.get('/companies/me/team').then((r) => r.data);
}
export function inviteTeamMember(email) {
  return apiClient.post('/companies/me/team', { email }).then((r) => r.data);
}
export function removeTeamMember(id) {
  return apiClient.delete(`/companies/me/team/${id}`).then((r) => r.data);
}

// ---- Account preferences ----
export function getCompanyPreferences() {
  return apiClient.get('/companies/me/preferences').then((r) => r.data);
}
export function updateCompanyPreferences(patch) {
  return apiClient.patch('/companies/me/preferences', patch).then((r) => r.data);
}

// `notificationPrefs` is a freeform JSON blob with no server-side defaults —
// a first-time company gets `{}` back, so sensible per-toggle defaults are
// merged in on load rather than everything rendering as switched off.
export const DEFAULT_COMPANY_NOTIFICATIONS = {
  candidates: {
    newApplications: { email: true, sms: false, push: true },
    profileViews: { email: false, sms: false, push: true },
    bookmarks: { email: true, sms: false, push: false },
  },
  system: {
    creditLow: { email: true, sms: true, push: true },
    creditPurchase: { email: true, sms: false, push: false },
    accountUpdates: { email: true, sms: false, push: false },
  },
  marketing: {
    newsletters: { email: true, sms: false, push: false },
    promotions: { email: false, sms: false, push: false },
    surveys: { email: false, sms: false, push: false },
  },
};

export function companyPreferencesToFrontend(data) {
  return {
    language: data.language,
    timezone: data.timezone,
    currency: data.currency,
    profileVisibility: data.profileVisibility,
    showEmployeeCount: data.showEmployeeCount,
    showContactInfo: data.showContactInfo,
    showHiringHistory: data.showHiringHistory,
    notifications: { ...DEFAULT_COMPANY_NOTIFICATIONS, ...(data.notificationPrefs || {}) },
    twoFactorEnabled: data.twoFactorEnabled,
    loginNotifications: data.loginNotifications,
  };
}

export function companyPreferencesToPayload(preferences) {
  return {
    language: preferences.language,
    timezone: preferences.timezone,
    currency: preferences.currency,
    profileVisibility: preferences.profileVisibility,
    showEmployeeCount: preferences.showEmployeeCount,
    showContactInfo: preferences.showContactInfo,
    showHiringHistory: preferences.showHiringHistory,
    notificationPrefs: preferences.notifications,
    twoFactorEnabled: preferences.twoFactorEnabled,
    loginNotifications: preferences.loginNotifications,
  };
}

// ---- Account deletion ----
export function deleteCompanyAccount() {
  return apiClient.delete('/companies/me', { data: { confirm: 'DELETE' } }).then((r) => r.data);
}
