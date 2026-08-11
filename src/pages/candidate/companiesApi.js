import apiClient from 'lib/apiClient';

// Same curated gradient set the old company mock data used — kept for visual
// parity now that companies are real DB rows with no stored "color" field.
const LOGO_GRADIENTS = [
  'linear-gradient(140deg,#3f6fb0,#24405e)',
  'linear-gradient(140deg,#c98a1f,#e6a93c)',
  'linear-gradient(140deg,#4aa6a0,#2c6f6a)',
  'linear-gradient(140deg,#9a6fc4,#5e3f8c)',
  'linear-gradient(140deg,#c46a6a,#8c3f3f)',
  'linear-gradient(140deg,#6aa3c4,#3f6f8c)',
  'linear-gradient(140deg,#b08a4f,#7a5e2c)',
  'linear-gradient(140deg,#5f8c6a,#3f6f4a)',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic per-company logo color + initial, derived from the (stable) company id. */
export function companyVisual(id, name) {
  return {
    color: LOGO_GRADIENTS[hashString(id || name || '') % LOGO_GRADIENTS.length],
    initial: (name || '?').trim().charAt(0).toUpperCase() || '?',
  };
}

const WORK_MODE_LABELS = { REMOTE: 'Remote', HYBRID: 'Hybrid', ONSITE: 'On-site' };

// ---- Browsing (candidate-side, all public endpoints) ----
export function listCompanies(query) {
  return apiClient.get('/companies', { params: query }).then((r) => r.data);
}
export function getCompanyFilterOptions() {
  return apiClient.get('/companies/filter-options').then((r) => r.data);
}
export function getCompanyById(id) {
  return apiClient.get(`/companies/${id}`).then((r) => r.data);
}
export function getCompanyReviews(id, query) {
  return apiClient.get(`/companies/${id}/reviews`, { params: query }).then((r) => r.data);
}

/** Shape used by the company-list grid cards. */
export function companyToListCard(c) {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry || '—',
    location: c.location || '—',
    sizeLabel: c.sizeLabel || '—',
    rating: c.rating || 0,
    minWageRate: c.minWageRate,
    hiring: c.hiring,
    mine: c.mine,
    ...companyVisual(c.id, c.name),
  };
}

/** Shape used by the company-details "About"/"Reputation" tabs. `email` here is the public contact email, never the login email (the backend never sends that one down). */
export function companyToDetails(c) {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry || '—',
    location: c.location || '—',
    website: c.website || '',
    email: c.contactEmail || '',
    phone: c.phone || '',
    address: c.address || '',
    pib: c.pib || '',
    registrationNumber: c.registrationNumber || '',
    workMode: c.workMode ? WORK_MODE_LABELS[c.workMode] || c.workMode : '',
    flexibleHours: !!c.flexibleHours,
    employeesRange: c.sizeLabel || '—',
    founded: c.foundedYear || '—',
    about: c.detailedDescription || c.shortDescription || '',
    benefits: c.benefits || [],
    rating: c.rating || 0,
    totalReviews: c.totalReviews || 0,
    hires: c.hires || 0,
    recommendRate: c.recommendRate || 0,
    minWageRate: c.minWageRate,
    hiring: c.hiring,
    mine: c.mine,
    ...companyVisual(c.id, c.name),
  };
}

/** Maps one row of `GET /companies/:id/reviews` onto the review-card shape used by company-details + reviews.jsx. */
export function reviewToFrontend(r) {
  return {
    role: r.roleTitle || 'Position not specified',
    dept: r.department || '',
    rating: (r.ratingProcess + r.ratingComms + r.ratingCulture + r.ratingBenefits) / 4,
    cats: { process: r.ratingProcess, comms: r.ratingComms, culture: r.ratingCulture, benefits: r.ratingBenefits },
    text: r.comment || '',
    minWageRespected: r.minWageRespected,
    date: new Date(r.createdAt).toLocaleDateString(),
    recommend: r.recommend,
  };
}
