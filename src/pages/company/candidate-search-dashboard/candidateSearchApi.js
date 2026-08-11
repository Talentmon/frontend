import apiClient from 'lib/apiClient';

// ---- Enum <-> dashboard filter-value maps ----
// FilterSidebar.jsx keeps the same kebab-case values the page has always
// used; the backend's SearchFiltersDto validates real Prisma enums. Every
// value crossing the wire goes through one of these two maps.
const EDUCATION_FILTER_TO_BACKEND = {
  'high-school': 'HIGH_SCHOOL',
  'associate-degree': 'ASSOCIATE',
  'bachelors-degree': 'BACHELORS',
  'masters-degree': 'MASTERS',
  phd: 'PHD',
};
const EDUCATION_BACKEND_TO_FILTER = Object.fromEntries(
  Object.entries(EDUCATION_FILTER_TO_BACKEND).map(([k, v]) => [v, k])
);
const EDUCATION_LEVEL_RANK = { HIGH_SCHOOL: 1, ASSOCIATE: 2, BACHELORS: 3, MASTERS: 4, PHD: 5 };

const JOB_TYPE_TO_BACKEND = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACT',
  freelance: 'FREELANCE',
};
const JOB_TYPE_TO_FRONTEND = Object.fromEntries(
  Object.entries(JOB_TYPE_TO_BACKEND).map(([k, v]) => [v, k])
);

const STATUS_TO_BACKEND = { active: 'ACTIVE', open: 'OPEN' };
const STATUS_TO_FRONTEND = { ACTIVE: 'active', OPEN: 'open', OFF: 'off' };

const WORK_MODE_TO_FRONTEND = { REMOTE: 'Remote', HYBRID: 'Hybrid', ONSITE: 'On-site' };

// ---- Search ----
// Converts FilterSidebar's dashboard-shape filters object into the
// backend's SearchFiltersDto shape, dropping empty/default values entirely
// (an empty string would fail validators like @IsIn/@IsEnum that only
// @IsOptional bypasses for null/undefined, not '').
export function filtersToBackend(filters = {}) {
  const out = {};
  if (filters.position) out.position = filters.position;
  if (filters.location) out.location = filters.location;
  if (filters.experience) out.experience = filters.experience;
  if (filters.education) out.education = EDUCATION_FILTER_TO_BACKEND[filters.education];
  if (filters.availability) out.availability = filters.availability;
  if (filters.status) out.status = STATUS_TO_BACKEND[filters.status];
  if (filters.skills?.length) out.skills = filters.skills;
  if (filters.skillCategory?.length) out.skillCategory = filters.skillCategory;
  if (filters.languages?.length) out.languages = filters.languages;
  if (filters.industry?.length) out.industry = filters.industry;
  if (filters.subIndustry?.length) out.subIndustry = filters.subIndustry;
  if (filters.jobType?.length) out.jobType = filters.jobType.map((t) => JOB_TYPE_TO_BACKEND[t]).filter(Boolean);
  if (filters.hasCertifications) out.hasCertifications = true;
  if (filters.certIssuer?.length) out.certIssuer = filters.certIssuer;
  if (filters.certFamily?.length) out.certFamily = filters.certFamily;
  if (filters.certName?.length) out.certName = filters.certName;
  if (filters.relocationReady) out.relocationReady = true;
  if (filters.travelReady) out.travelReady = true;
  if (filters.salary?.min || filters.salary?.max) {
    out.salary = {
      ...(filters.salary.min ? { min: String(filters.salary.min) } : {}),
      ...(filters.salary.max ? { max: String(filters.salary.max) } : {}),
      currency: filters.salary.currency || 'EUR',
    };
  }
  return out;
}

// Reverse of filtersToBackend — used when a saved filter (stored server-side
// in backend enum shape) is loaded back into FilterSidebar's local state.
export function filtersToFrontend(filters = {}) {
  const out = { ...filters };
  if (out.education) out.education = EDUCATION_BACKEND_TO_FILTER[out.education] || '';
  if (out.jobType?.length) out.jobType = out.jobType.map((t) => JOB_TYPE_TO_FRONTEND[t]).filter(Boolean);
  if (out.status) out.status = STATUS_TO_FRONTEND[out.status] || '';
  return out;
}

export function searchCandidates({ q, filters, sort, page = 1, limit = 20 } = {}) {
  const backendFilters = filtersToBackend(filters);
  const params = { page, limit };
  if (q) params.q = q;
  if (sort) params.sort = sort;
  if (Object.keys(backendFilters).length) params.filters = JSON.stringify(backendFilters);
  return apiClient.get('/candidates/search', { params }).then((r) => r.data);
}

// Deterministic seeded "match" placeholder — the backend intentionally does
// not compute a real match score (no job posting to compare against yet).
// Kept as a visible mock per product decision until real matching logic
// exists; not derived from any real field.
export function mockMatchScore(id = '') {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 68 + (hash % 31); // 68-98
}

function highestEducation(education = []) {
  const best = [...education].sort((a, b) => (EDUCATION_LEVEL_RANK[b.level] || 0) - (EDUCATION_LEVEL_RANK[a.level] || 0))[0];
  return best ? EDUCATION_BACKEND_TO_FILTER[best.level] : undefined;
}

function availabilityBucket(preferences) {
  if (!preferences?.noticeUnit) return undefined;
  const days =
    preferences.noticeUnit === 'DAY' ? preferences.noticeNum
    : preferences.noticeUnit === 'WEEK' ? preferences.noticeNum * 7
    : preferences.noticeNum * 30;
  if (days <= 0) return 'immediately';
  if (days <= 14) return '2-weeks';
  if (days <= 30) return '1-month';
  return '3-months';
}

function summaryFrom(customSections = []) {
  return customSections.find((s) => s.type === 'summary')?.textContent || '';
}

/** Anonymized search-result row -> the shape CandidateCard/CandidatePreviewDrawer expect. No name/photo/contact — those only exist post-unlock (see revealedToFrontend). */
export function candidateToFrontend(raw) {
  const prefs = raw.preferences;
  return {
    id: raw.id,
    anonCode: raw.anonCode,
    name: null,
    avatar: '/assets/images/no_image.png',
    position: raw.roleTitle || '',
    location: raw.location || '',
    experience: raw.yearsExperience || 0,
    profileStrength: raw.profileStrength || 0,
    matchScore: mockMatchScore(raw.id),
    searchStatus: STATUS_TO_FRONTEND[raw.status] || 'active',
    description: summaryFrom(raw.customSections),
    skills: (raw.skills || []).map((s) => s.name),
    languages: (raw.languages || []).map((l) => ({ name: l.name, level: l.level, note: l.note })),
    education: highestEducation(raw.education),
    certificates: raw.certifications || [],
    jobType: prefs?.type ? [JOB_TYPE_TO_FRONTEND[prefs.type]].filter(Boolean) : [],
    workArrangement: prefs?.mode ? WORK_MODE_TO_FRONTEND[prefs.mode] : undefined,
    availability: availabilityBucket(prefs),
    relocationReady: !!prefs?.relocationReady,
    travelReady: !!prefs?.travelReady,
    expectedSalary: prefs
      ? { amount: prefs.salaryAmount, currency: prefs.salaryCurrency, period: prefs.salaryPeriod?.toLowerCase(), base: prefs.salaryAmountBaseEur }
      : null,
  };
}

/** Fields revealed by CandidateUnlock.cvSnapshot after a successful unlock — merged onto the anonymized card so the "unlocked" state can show the real name/photo/contact. */
export function revealedToFrontend(snapshot = {}) {
  return {
    name: snapshot.name,
    avatar: snapshot.photoUrl || '/assets/images/no_image.png',
    position: snapshot.roleTitle || '',
    email: snapshot.email || undefined,
    phone: snapshot.phone || undefined,
    linkedin: snapshot.linkedin || undefined,
    company: snapshot.currentEmployerName || undefined,
  };
}

// ---- Unlock ----
export function unlockCandidate(candidateId, positionContext) {
  return apiClient
    .post('/companies/me/unlocks', { candidateId, positionContext: positionContext || undefined })
    .then((r) => r.data);
}

// ---- Bookmarks ----
export function listBookmarks() {
  return apiClient.get('/companies/me/bookmarks').then((r) => r.data);
}
export function createBookmark(candidateId) {
  return apiClient.post('/companies/me/bookmarks', { candidateId }).then((r) => r.data);
}
export function removeBookmark(id) {
  return apiClient.delete(`/companies/me/bookmarks/${id}`).then((r) => r.data);
}

// ---- Credits ----
export function getCreditsBalance() {
  return apiClient.get('/companies/me/credits/balance').then((r) => r.data?.balance ?? 0);
}

export function listCreditPackages() {
  return apiClient.get('/credits/packages').then((r) =>
    r.data.map((p) => ({
      id: p.id,
      credits: p.credits,
      price: p.priceCents / 100,
      pricePerCredit: p.priceCents / 100 / p.credits,
      popular: p.popular,
    }))
  );
}

// ---- Saved filters ----
export function listSavedFilters() {
  return apiClient.get('/companies/me/saved-search-filters').then((r) => r.data);
}
export function createSavedFilter(name, filters) {
  return apiClient.post('/companies/me/saved-search-filters', { name, filters: filtersToBackend(filters) }).then((r) => r.data);
}
export function updateSavedFilter(id, { name, filters } = {}) {
  const body = {};
  if (name) body.name = name;
  if (filters) body.filters = filtersToBackend(filters);
  return apiClient.patch(`/companies/me/saved-search-filters/${id}`, body).then((r) => r.data);
}
export function deleteSavedFilter(id) {
  return apiClient.delete(`/companies/me/saved-search-filters/${id}`).then((r) => r.data);
}
