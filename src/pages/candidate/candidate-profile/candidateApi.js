import apiClient from '../../../lib/apiClient';
import { DEFAULT_PHONE_CODE } from './edit/data';
import { endMonthYearToIso, isoToMonthYear, isoToYear, monthYearToIso } from './dateUtils';

/** Backend CandidateStatus <-> frontend status key ('active' | 'open' | 'off'). */
export function statusToFrontend(status) {
  return String(status || 'OPEN').toLowerCase();
}
export function statusToBackend(key) {
  return String(key || 'open').toUpperCase();
}

/** Maps the backend Candidate (GET /candidates/me shape) onto the frontend `basics` object. Non-basics fields (sections) are left to the caller. */
export function candidateToBasics(candidate, email) {
  return {
    name: candidate.name || '',
    photo: candidate.photoHidden ? null : candidate.photoUrl || null,
    photoUrl: candidate.photoUrl || null,
    photoHidden: !!candidate.photoHidden,
    role: candidate.roleTitle || '',
    years: String(candidate.yearsExperience ?? '0'),
    location: candidate.location || '',
    email: email || '',
    phoneCode: candidate.phoneCode || DEFAULT_PHONE_CODE,
    phone: candidate.phone || '',
    linkedin: candidate.linkedin || '',
    links: (candidate.links || []).map((l) => ({ id: l.id, label: l.label, url: l.url })),
    status: statusToFrontend(candidate.status),
    currentEmployer: candidate.currentEmployerName || '',
  };
}

export function updateMyCandidate(patch) {
  return apiClient.patch('/candidates/me', patch).then((r) => r.data);
}

export function addMyCandidateLink(link) {
  return apiClient.post('/candidates/me/links', link).then((r) => r.data);
}

export function updateMyCandidateLink(linkId, link) {
  return apiClient.patch(`/candidates/me/links/${linkId}`, link).then((r) => r.data);
}

export function removeMyCandidateLink(linkId) {
  return apiClient.delete(`/candidates/me/links/${linkId}`).then((r) => r.data);
}

const PHOTO_EXTENSION_BY_CONTENT_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function presignMyCandidateFile(payload) {
  return apiClient.post('/candidates/me/files/presign', payload).then((r) => r.data);
}
function confirmMyCandidateFile(payload) {
  return apiClient.post('/candidates/me/files', payload).then((r) => r.data);
}
function listMyCandidateFiles() {
  return apiClient.get('/candidates/me/files').then((r) => r.data);
}
function removeMyCandidateFile(id) {
  return apiClient.delete(`/candidates/me/files/${id}`).then((r) => r.data);
}

/**
 * Uploads a profile photo straight to R2 (presign -> PUT the raw bytes -> confirm)
 * and returns the resulting public URL. The confirm step also sets
 * `candidate.photoUrl` server-side, so this persists immediately — it does not
 * wait for "Save and view" like the rest of the basics fields.
 */
export async function uploadCandidatePhoto(file) {
  const fileExtension = PHOTO_EXTENSION_BY_CONTENT_TYPE[file.type];
  if (!fileExtension) {
    throw new Error('Please upload a JPG, PNG, or WEBP image.');
  }
  const { uploadUrl, key } = await presignMyCandidateFile({ kind: 'PHOTO', contentType: file.type, fileExtension });
  const putResponse = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!putResponse.ok) {
    throw new Error('Upload to storage failed — please try again.');
  }
  const record = await confirmMyCandidateFile({ kind: 'PHOTO', key });
  return record.url;
}

/** Deletes every stored PHOTO file for the current candidate (normally just one) and clears `candidate.photoUrl`. */
export async function removeCandidatePhoto() {
  const files = await listMyCandidateFiles();
  const photoFiles = files.filter((f) => f.kind === 'PHOTO');
  await Promise.all(photoFiles.map((f) => removeMyCandidateFile(f.id)));
}

/**
 * Reconciles the locally-edited `links` array against the last-known backend
 * list (`originalLinks`, real UUIDs from the last fetch). New local-only rows
 * (blank/invalid label or URL) are skipped rather than rejected by the
 * backend's validation — they're saved once the user finishes filling them in.
 */
export async function syncCandidateLinks(originalLinks, currentLinks) {
  const originalById = new Map(originalLinks.map((l) => [l.id, l]));
  const currentIds = new Set(currentLinks.map((l) => l.id));
  const isComplete = (l) => String(l.label || '').trim() && /^https?:\/\/.+/i.test(String(l.url || '').trim());

  const resolved = [];
  for (const link of currentLinks) {
    const original = originalById.get(link.id);
    if (original) {
      if (original.label !== link.label || original.url !== link.url) {
        if (isComplete(link)) await updateMyCandidateLink(link.id, { label: link.label, url: link.url });
        resolved.push(link);
      } else {
        resolved.push(link);
      }
    } else if (isComplete(link)) {
      const created = await addMyCandidateLink({ label: link.label, url: link.url });
      resolved.push({ id: created.id, label: created.label, url: created.url });
    } else {
      resolved.push(link);
    }
  }

  for (const original of originalLinks) {
    if (!currentIds.has(original.id)) await removeMyCandidateLink(original.id);
  }

  return resolved;
}

/**
 * Generic diff/sync for a list-backed resource (experience, education, ...):
 * creates new complete entries, updates changed ones, deletes removed ones,
 * then reorders whatever made it to the backend. Entries failing `isComplete`
 * (still being filled in) are left local-only rather than rejected by the
 * backend's validation.
 */
async function syncListEntries({ original, current, isComplete, toPayload, fromApi, create, update, remove, reorder }) {
  const originalById = new Map(original.map((e) => [e.id, e]));
  const currentIds = new Set(current.map((e) => e.id));
  const resolved = [];

  for (const entry of current) {
    const orig = originalById.get(entry.id);
    if (orig) {
      const payload = toPayload(entry);
      if (JSON.stringify(payload) !== JSON.stringify(toPayload(orig))) {
        if (isComplete(entry)) {
          const updated = await update(entry.id, payload);
          resolved.push({ ...entry, ...fromApi(updated) });
        } else {
          resolved.push(entry);
        }
      } else {
        resolved.push(entry);
      }
    } else if (isComplete(entry)) {
      const created = await create(toPayload(entry));
      resolved.push({ ...entry, ...fromApi(created) });
    } else {
      resolved.push(entry);
    }
  }

  for (const orig of original) {
    if (!currentIds.has(orig.id)) await remove(orig.id);
  }

  const orderedComplete = resolved.filter(isComplete);
  if (orderedComplete.length) {
    await reorder({ items: orderedComplete.map((e, i) => ({ id: e.id, position: i })) });
  }

  return resolved;
}

// ---------------- EXPERIENCE ----------------

export function experienceToFrontend(exp) {
  return {
    id: exp.id,
    role: exp.role || '',
    company: exp.company || '',
    industry: exp.industry || '',
    subIndustry: exp.subIndustry || '',
    start: isoToMonthYear(exp.startDate),
    end: exp.endDate ? isoToMonthYear(exp.endDate) : 'Present',
    location: exp.location || '',
    desc: exp.description || '',
    tags: exp.tags || [],
    visible: exp.visible !== false,
  };
}

function experienceToPayload(entry) {
  return {
    role: entry.role || '',
    company: entry.company || '',
    industry: entry.industry || undefined,
    subIndustry: entry.subIndustry || undefined,
    startDate: monthYearToIso(entry.start),
    endDate: endMonthYearToIso(entry.end),
    location: entry.location || undefined,
    description: entry.desc || undefined,
    tags: entry.tags || [],
    visible: entry.visible !== false,
  };
}

function experienceIsComplete(entry) {
  return !!(String(entry.role || '').trim() && String(entry.company || '').trim() && monthYearToIso(entry.start));
}

export function syncCandidateExperience(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: experienceIsComplete,
    toPayload: experienceToPayload,
    fromApi: experienceToFrontend,
    create: (payload) => apiClient.post('/candidates/me/experience', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/experience/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/experience/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/experience/reorder', dto),
  });
}

// ---------------- EDUCATION ----------------

const EDUCATION_LEVEL_TO_BACKEND = {
  'High School': 'HIGH_SCHOOL',
  'Associate Degree': 'ASSOCIATE',
  "Bachelor's Degree": 'BACHELORS',
  "Master's Degree": 'MASTERS',
  PhD: 'PHD',
};
const EDUCATION_LEVEL_TO_FRONTEND = Object.fromEntries(Object.entries(EDUCATION_LEVEL_TO_BACKEND).map(([k, v]) => [v, k]));

export function educationToFrontend(edu) {
  return {
    id: edu.id,
    degree: edu.degree || '',
    school: edu.school || '',
    level: EDUCATION_LEVEL_TO_FRONTEND[edu.level] || '',
    start: isoToYear(edu.startDate),
    end: edu.endDate ? isoToYear(edu.endDate) : '',
    location: edu.location || '',
    desc: edu.description || '',
    visible: edu.visible !== false,
  };
}

function educationToPayload(entry) {
  return {
    degree: entry.degree || '',
    school: entry.school || '',
    level: EDUCATION_LEVEL_TO_BACKEND[entry.level] || undefined,
    startDate: monthYearToIso(entry.start),
    endDate: entry.end ? monthYearToIso(entry.end) : null,
    location: entry.location || undefined,
    description: entry.desc || undefined,
    visible: entry.visible !== false,
  };
}

function educationIsComplete(entry) {
  return !!(
    String(entry.degree || '').trim() &&
    String(entry.school || '').trim() &&
    EDUCATION_LEVEL_TO_BACKEND[entry.level] &&
    monthYearToIso(entry.start)
  );
}

export function syncCandidateEducation(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: educationIsComplete,
    toPayload: educationToPayload,
    fromApi: educationToFrontend,
    create: (payload) => apiClient.post('/candidates/me/education', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/education/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/education/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/education/reorder', dto),
  });
}

// ---------------- SKILLS ----------------

export function skillToFrontend(skill) {
  return { id: skill.id, name: skill.name || '', visible: skill.visible !== false };
}

function skillToPayload(entry) {
  return { name: entry.name || '', visible: entry.visible !== false };
}

function skillIsComplete(entry) {
  return !!String(entry.name || '').trim();
}

export function syncCandidateSkills(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: skillIsComplete,
    toPayload: skillToPayload,
    fromApi: skillToFrontend,
    create: (payload) => apiClient.post('/candidates/me/skills', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/skills/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/skills/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/skills/reorder', dto),
  });
}

// ---------------- LANGUAGES ----------------

export function languageToFrontend(lang) {
  return { id: lang.id, name: lang.name || '', level: lang.level || '', note: lang.note || '', visible: lang.visible !== false };
}

function languageToPayload(entry) {
  return { name: entry.name || '', level: entry.level || '', note: entry.note || undefined, visible: entry.visible !== false };
}

function languageIsComplete(entry) {
  return !!(String(entry.name || '').trim() && String(entry.level || '').trim());
}

export function syncCandidateLanguages(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: languageIsComplete,
    toPayload: languageToPayload,
    fromApi: languageToFrontend,
    create: (payload) => apiClient.post('/candidates/me/languages', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/languages/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/languages/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/languages/reorder', dto),
  });
}

// ---------------- CERTIFICATIONS ----------------

export function certificationToFrontend(cert) {
  return {
    id: cert.id,
    name: cert.name || '',
    issuer: cert.issuer || '',
    issueDate: isoToMonthYear(cert.issueDate),
    expirationDate: cert.expirationDate ? isoToMonthYear(cert.expirationDate) : '',
    doesNotExpire: !!cert.doesNotExpire,
    credentialId: cert.credentialId || '',
    credentialUrl: cert.credentialUrl || '',
    visible: cert.visible !== false,
  };
}

function certificationToPayload(entry) {
  return {
    name: entry.name || '',
    issuer: entry.issuer || '',
    issueDate: monthYearToIso(entry.issueDate) || undefined,
    expirationDate: entry.doesNotExpire ? null : monthYearToIso(entry.expirationDate) || null,
    doesNotExpire: !!entry.doesNotExpire,
    credentialId: entry.credentialId ? entry.credentialId.trim() : undefined,
    credentialUrl: entry.credentialUrl && /^https?:\/\/.+/i.test(entry.credentialUrl.trim()) ? entry.credentialUrl.trim() : undefined,
    visible: entry.visible !== false,
  };
}

function certificationIsComplete(entry) {
  return !!(String(entry.name || '').trim() && String(entry.issuer || '').trim() && monthYearToIso(entry.issueDate));
}

export function syncCandidateCertifications(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: certificationIsComplete,
    toPayload: certificationToPayload,
    fromApi: certificationToFrontend,
    create: (payload) => apiClient.post('/candidates/me/certifications', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/certifications/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/certifications/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/certifications/reorder', dto),
  });
}

// ---------------- CUSTOM SECTIONS (summary, declaration, interests, projects, ...) ----------------

// experience/education/skills/languages/certificates/preferences all have their
// own dedicated backend resources (handled above) - everything else (summary,
// declaration, and any list-type section including user-added "custom" ones)
// is backed by the generic CandidateCustomSection/-Entry tables.
const DEDICATED_SECTION_TYPES = new Set([
  'experience', 'education', 'skills', 'languages', 'certificates', 'preferences',
  'interests', 'projects', 'courses', 'awards', 'organisations', 'publications', 'website',
]);

export function isCustomBackedSection(sec) {
  return !DEDICATED_SECTION_TYPES.has(sec.type);
}

const hasText = (html) => /\S/.test(String(html || '').replace(/<[^>]*>/g, ''));

function customEntryToFrontend(entry, sectionKind) {
  if (sectionKind === 'skill') {
    return { id: entry.id, name: entry.title || '', visible: entry.visible !== false };
  }
  return {
    id: entry.id,
    title: entry.title || '',
    subtitle: entry.subtitle || '',
    start: entry.startDate ? isoToMonthYear(entry.startDate) : '',
    end: entry.endDate ? isoToMonthYear(entry.endDate) : '',
    location: entry.location || '',
    desc: entry.description || '',
    tags: entry.tags || [],
    visible: entry.visible !== false,
  };
}

function customEntryToPayload(entry, sectionKind) {
  if (sectionKind === 'skill') {
    return { title: entry.name || '', visible: entry.visible !== false };
  }
  return {
    title: entry.title || '',
    subtitle: entry.subtitle || undefined,
    startDate: monthYearToIso(entry.start) || null,
    endDate: monthYearToIso(entry.end) || null,
    location: entry.location || undefined,
    description: entry.desc || undefined,
    tags: entry.tags || [],
    visible: entry.visible !== false,
  };
}

function customEntryIsComplete(entry, sectionKind) {
  if (sectionKind === 'skill') return !!String(entry.name || '').trim();
  return !!(
    String(entry.title || '').trim() ||
    String(entry.subtitle || '').trim() ||
    String(entry.location || '').trim() ||
    String(entry.desc || '').replace(/<[^>]+>/g, '').trim() ||
    (entry.tags && entry.tags.length) ||
    String(entry.start || '').trim()
  );
}

function syncCustomSectionEntries(sectionId, originalEntries, currentEntries, sectionKind) {
  return syncListEntries({
    original: originalEntries,
    current: currentEntries,
    isComplete: (e) => customEntryIsComplete(e, sectionKind),
    toPayload: (e) => customEntryToPayload(e, sectionKind),
    fromApi: (e) => customEntryToFrontend(e, sectionKind),
    create: (payload) => apiClient.post(`/candidates/me/custom-sections/${sectionId}/entries`, payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/custom-sections/${sectionId}/entries/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/custom-sections/${sectionId}/entries/${id}`),
    reorder: (dto) => apiClient.patch(`/candidates/me/custom-sections/${sectionId}/entries/reorder`, dto),
  });
}

/**
 * Backend only knows TEXT/LIST kinds - a custom section's local "Skills"
 * sub-toggle (kind='skill', see setSectionKind) always round-trips back as a
 * plain LIST ('Standard') on next full reload. Entries/content are never
 * lost, just the toggle state - documented tradeoff, not a bug.
 */
export function customSectionToFrontend(section) {
  const kind = section.kind === 'TEXT' ? 'text' : 'list';
  const base = { id: section.id, type: section.type, kind, icon: section.icon || undefined, title: section.title };
  if (kind === 'text') return { ...base, text: section.textContent || '' };
  return { ...base, schema: 'generic', entries: (section.entries || []).map((e) => customEntryToFrontend(e, 'list')) };
}

function customSectionIsComplete(sec) {
  if (sec.kind === 'text') return hasText(sec.text);
  return (sec.entries || []).some((e) => customEntryIsComplete(e, sec.kind));
}

/**
 * Syncs every non-dedicated section (summary, declaration, interests,
 * projects, ... and user-added "custom" sections) against the generic
 * CandidateCustomSection/-Entry backend resources. Sections that never became
 * "complete" (no text / no complete entries) are left local-only, same
 * incomplete-draft rule as every other resource. Returns the resolved list in
 * the same order as `currentSections` (deletions simply aren't included).
 */
export async function syncCandidateCustomSections(originalSections, currentSections) {
  const originalById = new Map(originalSections.map((s) => [s.id, s]));
  const currentIds = new Set(currentSections.map((s) => s.id));
  const resolved = [];
  const syncedIds = new Set();

  for (const sec of currentSections) {
    const orig = originalById.get(sec.id);
    if (orig) {
      const patch = {};
      if (orig.title !== sec.title) patch.title = sec.title;
      if (sec.kind === 'text' && orig.text !== sec.text) patch.textContent = sec.text;
      if (Object.keys(patch).length) await apiClient.patch(`/candidates/me/custom-sections/${sec.id}`, patch);

      let entries = sec.entries;
      if (sec.kind !== 'text') {
        entries = await syncCustomSectionEntries(sec.id, orig.entries || [], sec.entries || [], sec.kind);
      }
      resolved.push({ ...sec, entries });
      syncedIds.add(sec.id);
    } else if (customSectionIsComplete(sec)) {
      const created = await apiClient
        .post('/candidates/me/custom-sections', {
          type: sec.type,
          kind: sec.kind === 'text' ? 'TEXT' : 'LIST',
          icon: sec.icon || undefined,
          title: sec.title,
          textContent: sec.kind === 'text' ? sec.text : undefined,
        })
        .then((r) => r.data);
      let entries = sec.entries;
      if (sec.kind !== 'text') {
        entries = await syncCustomSectionEntries(created.id, [], sec.entries || [], sec.kind);
      }
      resolved.push({ ...sec, id: created.id, entries });
      syncedIds.add(created.id);
    } else {
      resolved.push(sec);
    }
  }

  for (const orig of originalSections) {
    if (!currentIds.has(orig.id)) await apiClient.delete(`/candidates/me/custom-sections/${orig.id}`);
  }

  const orderedSynced = resolved.filter((s) => syncedIds.has(s.id));
  if (orderedSynced.length) {
    await apiClient.patch('/candidates/me/custom-sections/reorder', {
      items: orderedSynced.map((s, i) => ({ id: s.id, position: i })),
    });
  }

  return resolved;
}

/**
 * Reconciles the locally-known sections against the backend's custom-section
 * list on load: sections already known locally (matched by real backend id,
 * or by type for the always-present "summary" section) get refreshed content;
 * any backend section with no local counterpart (e.g. added from another
 * device/browser) is appended so it isn't silently dropped.
 */
export function mergeCustomSections(prevSections, backendSections) {
  const backendById = new Map(backendSections.map((s) => [s.id, s]));
  const localIds = new Set(prevSections.map((s) => s.id));
  const hasSummaryLocally = prevSections.some((s) => s.type === 'summary');

  const updated = prevSections.map((sec) => {
    let match = backendById.get(sec.id);
    if (!match && sec.type === 'summary') match = backendSections.find((b) => b.type === 'summary');
    if (!match) return sec;
    const fe = customSectionToFrontend(match);
    return { ...fe, kind: sec.kind === 'skill' ? 'skill' : fe.kind };
  });

  const missing = backendSections
    .filter((b) => !localIds.has(b.id) && !(b.type === 'summary' && hasSummaryLocally))
    .map(customSectionToFrontend);

  return [...updated, ...missing];
}

// ---------------- WORK PREFERENCES ----------------

const WORK_MODE_TO_BACKEND = { Hybrid: 'HYBRID', 'On-site': 'ONSITE', Remote: 'REMOTE' };
const WORK_MODE_TO_FRONTEND = Object.fromEntries(Object.entries(WORK_MODE_TO_BACKEND).map(([k, v]) => [v, k]));
const EMPLOYMENT_TYPE_TO_BACKEND = { 'Full-time': 'FULL_TIME', 'Part-time': 'PART_TIME', Contract: 'CONTRACT', Freelance: 'FREELANCE' };
const EMPLOYMENT_TYPE_TO_FRONTEND = Object.fromEntries(Object.entries(EMPLOYMENT_TYPE_TO_BACKEND).map(([k, v]) => [v, k]));

export function preferencesToFrontend(pref) {
  if (!pref) return null;
  return {
    mode: WORK_MODE_TO_FRONTEND[pref.mode] || '',
    type: EMPLOYMENT_TYPE_TO_FRONTEND[pref.type] || '',
    salaryCurrency: pref.salaryCurrency || 'EUR',
    salaryAmount: pref.salaryAmount != null ? String(pref.salaryAmount) : '',
    salaryPeriod: (pref.salaryPeriod || 'MONTH').toLowerCase(),
    noticeNum: pref.noticeNum != null ? String(pref.noticeNum) : '',
    noticeUnit: (pref.noticeUnit || 'WEEK').toLowerCase(),
    travelReady: !!pref.travelReady,
    relocationReady: !!pref.relocationReady,
  };
}

function preferencesToPayload(data) {
  return {
    mode: WORK_MODE_TO_BACKEND[data.mode],
    type: EMPLOYMENT_TYPE_TO_BACKEND[data.type],
    salaryCurrency: data.salaryCurrency,
    salaryAmount: parseInt(data.salaryAmount, 10) || 0,
    salaryPeriod: String(data.salaryPeriod || 'month').toUpperCase(),
    noticeNum: parseInt(data.noticeNum, 10) || 0,
    noticeUnit: String(data.noticeUnit || 'week').toUpperCase(),
    travelReady: !!data.travelReady,
    relocationReady: !!data.relocationReady,
  };
}

export function preferencesIsComplete(data) {
  return !!(
    WORK_MODE_TO_BACKEND[data.mode] &&
    EMPLOYMENT_TYPE_TO_BACKEND[data.type] &&
    data.salaryCurrency &&
    String(data.salaryAmount || '').trim() &&
    String(data.noticeNum || '').trim() &&
    data.noticeUnit
  );
}

export function updateMyCandidatePreferences(data) {
  return apiClient.patch('/candidates/me/preferences', preferencesToPayload(data)).then((r) => r.data);
}

// ---------------- ENUM MAPS (dedicated section types) ----------------

const AWARD_LEVEL_TO_BACKEND = { International: 'INTERNATIONAL', National: 'NATIONAL', Regional: 'REGIONAL', Company: 'COMPANY' };
const AWARD_LEVEL_TO_FRONTEND = Object.fromEntries(Object.entries(AWARD_LEVEL_TO_BACKEND).map(([k, v]) => [v, k]));

const ORGANIZATION_TYPE_TO_BACKEND = {
  Volunteer: 'VOLUNTEER', Professional: 'PROFESSIONAL', Student: 'STUDENT', Community: 'COMMUNITY', 'Non-profit': 'NON_PROFIT',
};
const ORGANIZATION_TYPE_TO_FRONTEND = Object.fromEntries(Object.entries(ORGANIZATION_TYPE_TO_BACKEND).map(([k, v]) => [v, k]));

const PUBLICATION_TYPE_TO_BACKEND = {
  Article: 'ARTICLE', 'Research Paper': 'RESEARCH_PAPER', Book: 'BOOK', Blog: 'BLOG', Whitepaper: 'WHITEPAPER', Patent: 'PATENT',
};
const PUBLICATION_TYPE_TO_FRONTEND = Object.fromEntries(Object.entries(PUBLICATION_TYPE_TO_BACKEND).map(([k, v]) => [v, k]));

const WEBSITE_TYPE_TO_BACKEND = {
  Portfolio: 'PORTFOLIO', Blog: 'BLOG', 'GitHub Pages': 'GITHUB_PAGES', Company: 'COMPANY', Other: 'OTHER',
};
const WEBSITE_TYPE_TO_FRONTEND = Object.fromEntries(Object.entries(WEBSITE_TYPE_TO_BACKEND).map(([k, v]) => [v, k]));

const validUrl = (v) => (v && /^https?:\/\/.+/i.test(String(v).trim()) ? String(v).trim() : undefined);

// ---------------- INTERESTS ----------------

export function interestToFrontend(i) {
  return {
    id: i.id,
    icon: i.icon || '',
    name: i.name || '',
    desc: i.description || '',
    visible: i.visible !== false,
  };
}

function interestToPayload(entry) {
  return {
    icon: entry.icon || undefined,
    name: entry.name || '',
    description: entry.desc || undefined,
    visible: entry.visible !== false,
  };
}

function interestIsComplete(entry) {
  return !!String(entry.name || '').trim();
}

export function syncCandidateInterests(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: interestIsComplete,
    toPayload: interestToPayload,
    fromApi: interestToFrontend,
    create: (payload) => apiClient.post('/candidates/me/interests', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/interests/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/interests/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/interests/reorder', dto),
  });
}

// ---------------- PROJECTS ----------------

export function projectToFrontend(p) {
  return {
    id: p.id,
    name: p.name || '',
    role: p.role || '',
    desc: p.description || '',
    challenge: p.challenge || '',
    solution: p.solution || '',
    impact: p.impact || '',
    technologies: p.technologies || [],
    skills: p.skills || [],
    start: isoToMonthYear(p.startDate),
    end: p.endDate ? isoToMonthYear(p.endDate) : '',
    currentlyWorking: !!p.currentlyWorking,
    githubUrl: p.githubUrl || '',
    visible: p.visible !== false,
  };
}

function projectToPayload(entry) {
  return {
    name: entry.name || '',
    role: entry.role || undefined,
    description: entry.desc || undefined,
    challenge: entry.challenge || undefined,
    solution: entry.solution || undefined,
    impact: entry.impact || undefined,
    technologies: entry.technologies || [],
    skills: entry.skills || [],
    startDate: monthYearToIso(entry.start) || undefined,
    endDate: entry.currentlyWorking ? null : monthYearToIso(entry.end) || null,
    currentlyWorking: !!entry.currentlyWorking,
    githubUrl: validUrl(entry.githubUrl),
    visible: entry.visible !== false,
  };
}

function projectIsComplete(entry) {
  return !!String(entry.name || '').trim();
}

export function syncCandidateProjects(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: projectIsComplete,
    toPayload: projectToPayload,
    fromApi: projectToFrontend,
    create: (payload) => apiClient.post('/candidates/me/projects', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/projects/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/projects/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/projects/reorder', dto),
  });
}

// ---------------- COURSES ----------------

export function courseToFrontend(c) {
  return {
    id: c.id,
    name: c.name || '',
    provider: c.provider || '',
    category: c.category || '',
    completionDate: isoToMonthYear(c.completionDate),
    durationHours: c.durationHours != null ? String(c.durationHours) : '',
    certificateId: c.certificateId || '',
    certificateUrl: c.certificateUrl || '',
    skills: c.skills || [],
    desc: c.description || '',
    visible: c.visible !== false,
  };
}

function courseToPayload(entry) {
  return {
    name: entry.name || '',
    provider: entry.provider || '',
    category: entry.category || undefined,
    completionDate: monthYearToIso(entry.completionDate) || null,
    durationHours: entry.durationHours ? parseInt(entry.durationHours, 10) || undefined : undefined,
    certificateId: entry.certificateId || undefined,
    certificateUrl: validUrl(entry.certificateUrl),
    skills: entry.skills || [],
    description: entry.desc || undefined,
    visible: entry.visible !== false,
  };
}

function courseIsComplete(entry) {
  return !!(String(entry.name || '').trim() && String(entry.provider || '').trim());
}

export function syncCandidateCourses(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: courseIsComplete,
    toPayload: courseToPayload,
    fromApi: courseToFrontend,
    create: (payload) => apiClient.post('/candidates/me/courses', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/courses/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/courses/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/courses/reorder', dto),
  });
}

// ---------------- AWARDS ----------------

export function awardToFrontend(a) {
  return {
    id: a.id,
    name: a.name || '',
    organization: a.organization || '',
    date: isoToMonthYear(a.date),
    level: AWARD_LEVEL_TO_FRONTEND[a.level] || '',
    desc: a.description || '',
    link: a.link || '',
    visible: a.visible !== false,
  };
}

function awardToPayload(entry) {
  return {
    name: entry.name || '',
    organization: entry.organization || undefined,
    date: monthYearToIso(entry.date) || null,
    level: AWARD_LEVEL_TO_BACKEND[entry.level] || undefined,
    description: entry.desc || undefined,
    link: validUrl(entry.link),
    visible: entry.visible !== false,
  };
}

function awardIsComplete(entry) {
  return !!String(entry.name || '').trim();
}

export function syncCandidateAwards(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: awardIsComplete,
    toPayload: awardToPayload,
    fromApi: awardToFrontend,
    create: (payload) => apiClient.post('/candidates/me/awards', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/awards/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/awards/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/awards/reorder', dto),
  });
}

// ---------------- ORGANIZATIONS ----------------

export function organizationToFrontend(o) {
  return {
    id: o.id,
    name: o.name || '',
    role: o.role || '',
    type: ORGANIZATION_TYPE_TO_FRONTEND[o.type] || '',
    start: isoToMonthYear(o.startDate),
    end: o.endDate ? isoToMonthYear(o.endDate) : '',
    currentlyActive: !!o.currentlyActive,
    desc: o.description || '',
    achievements: o.achievements || '',
    visible: o.visible !== false,
  };
}

function organizationToPayload(entry) {
  return {
    name: entry.name || '',
    role: entry.role || undefined,
    type: ORGANIZATION_TYPE_TO_BACKEND[entry.type] || undefined,
    startDate: monthYearToIso(entry.start) || undefined,
    endDate: entry.currentlyActive ? null : monthYearToIso(entry.end) || null,
    currentlyActive: !!entry.currentlyActive,
    description: entry.desc || undefined,
    achievements: entry.achievements || undefined,
    visible: entry.visible !== false,
  };
}

function organizationIsComplete(entry) {
  return !!String(entry.name || '').trim();
}

export function syncCandidateOrganizations(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: organizationIsComplete,
    toPayload: organizationToPayload,
    fromApi: organizationToFrontend,
    create: (payload) => apiClient.post('/candidates/me/organizations', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/organizations/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/organizations/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/organizations/reorder', dto),
  });
}

// ---------------- PUBLICATIONS ----------------

export function publicationToFrontend(p) {
  return {
    id: p.id,
    title: p.title || '',
    type: PUBLICATION_TYPE_TO_FRONTEND[p.type] || '',
    publisher: p.publisher || '',
    date: isoToMonthYear(p.publicationDate),
    coAuthors: p.coAuthors || [],
    doi: p.doi || '',
    url: p.url || '',
    desc: p.description || '',
    visible: p.visible !== false,
  };
}

function publicationToPayload(entry) {
  return {
    title: entry.title || '',
    type: PUBLICATION_TYPE_TO_BACKEND[entry.type] || undefined,
    publisher: entry.publisher || undefined,
    publicationDate: monthYearToIso(entry.date) || null,
    coAuthors: entry.coAuthors || [],
    doi: entry.doi || undefined,
    url: validUrl(entry.url),
    description: entry.desc || undefined,
    visible: entry.visible !== false,
  };
}

function publicationIsComplete(entry) {
  return !!String(entry.title || '').trim();
}

export function syncCandidatePublications(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: publicationIsComplete,
    toPayload: publicationToPayload,
    fromApi: publicationToFrontend,
    create: (payload) => apiClient.post('/candidates/me/publications', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/publications/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/publications/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/publications/reorder', dto),
  });
}

// ---------------- PERSONAL WEBSITES ----------------

export function websiteToFrontend(w) {
  return {
    id: w.id,
    name: w.name || '',
    url: w.url || '',
    type: WEBSITE_TYPE_TO_FRONTEND[w.type] || '',
    desc: w.description || '',
    featured: !!w.featured,
    visible: w.visible !== false,
  };
}

function websiteToPayload(entry) {
  return {
    name: entry.name || '',
    url: entry.url || '',
    type: WEBSITE_TYPE_TO_BACKEND[entry.type] || undefined,
    description: entry.desc || undefined,
    featured: !!entry.featured,
    visible: entry.visible !== false,
  };
}

function websiteIsComplete(entry) {
  return !!(String(entry.name || '').trim() && validUrl(entry.url));
}

export function syncCandidateWebsites(original, current) {
  return syncListEntries({
    original,
    current,
    isComplete: websiteIsComplete,
    toPayload: websiteToPayload,
    fromApi: websiteToFrontend,
    create: (payload) => apiClient.post('/candidates/me/websites', payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`/candidates/me/websites/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`/candidates/me/websites/${id}`),
    reorder: (dto) => apiClient.patch('/candidates/me/websites/reorder', dto),
  });
}

// ---------------- SHARED TABLE (used by edit/index.jsx + index.jsx to avoid ----------------
// ---------------- repeating one ref+merge+save block per dedicated type) --------------------

export const DEDICATED_LIST_RESOURCES = [
  { type: 'experience', candidateField: 'experiences', toFrontend: experienceToFrontend, sync: syncCandidateExperience },
  { type: 'education', candidateField: 'education', toFrontend: educationToFrontend, sync: syncCandidateEducation },
  { type: 'skills', candidateField: 'skills', toFrontend: skillToFrontend, sync: syncCandidateSkills },
  { type: 'languages', candidateField: 'languages', toFrontend: languageToFrontend, sync: syncCandidateLanguages },
  { type: 'certificates', candidateField: 'certifications', toFrontend: certificationToFrontend, sync: syncCandidateCertifications },
  { type: 'interests', candidateField: 'interests', toFrontend: interestToFrontend, sync: syncCandidateInterests },
  { type: 'projects', candidateField: 'projects', toFrontend: projectToFrontend, sync: syncCandidateProjects },
  { type: 'courses', candidateField: 'courses', toFrontend: courseToFrontend, sync: syncCandidateCourses },
  { type: 'awards', candidateField: 'awards', toFrontend: awardToFrontend, sync: syncCandidateAwards },
  { type: 'organisations', candidateField: 'organizations', toFrontend: organizationToFrontend, sync: syncCandidateOrganizations },
  { type: 'publications', candidateField: 'publications', toFrontend: publicationToFrontend, sync: syncCandidatePublications },
  { type: 'website', candidateField: 'websites', toFrontend: websiteToFrontend, sync: syncCandidateWebsites },
];
