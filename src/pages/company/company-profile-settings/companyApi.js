import apiClient from 'lib/apiClient';

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
    industry: c.industry || '',
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

// ---- Logo (R2 presign -> PUT -> confirm, same shape as candidate photo upload) ----
const LOGO_EXTENSION_BY_CONTENT_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/svg+xml': 'svg', 'image/webp': 'webp' };

export async function uploadCompanyLogo(file) {
  const fileExtension = LOGO_EXTENSION_BY_CONTENT_TYPE[file.type];
  if (!fileExtension) {
    throw new Error('Please upload a JPG, PNG, SVG, or WEBP image.');
  }
  const { data: presign } = await apiClient.post('/companies/me/logo/presign', { contentType: file.type, fileExtension });
  const putResponse = await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!putResponse.ok) {
    throw new Error('Upload to storage failed — please try again.');
  }
  const { data: company } = await apiClient.post('/companies/me/logo/confirm', { key: presign.key });
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
