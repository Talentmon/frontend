import apiClient from 'lib/apiClient';
import { candidateToFrontend, revealedToFrontend } from '../candidate-search-dashboard/candidateSearchApi';

export { updateNote, deleteNote } from '../candidate-search-dashboard/candidateSearchApi';

const STATUS_TO_FRONTEND = { NEW: 'new', CONTACTED: 'contacted', INTERVIEWED: 'interviewed', HIRED: 'hired', REJECTED: 'rejected' };
const STATUS_TO_BACKEND = Object.fromEntries(Object.entries(STATUS_TO_FRONTEND).map(([k, v]) => [v, k]));

const NOTICE_LABELS = {
  immediately: 'Immediately',
  '2-weeks': '2 weeks',
  '1-month': '1 month',
  '3-months': '3 months',
};

const isoYear = (iso) => (iso ? new Date(iso)?.getFullYear() : '');

function mapWorkHistory(experiences = []) {
  return experiences.map((exp) => ({
    position: exp.role,
    company: exp.company,
    period: `${isoYear(exp.startDate)} - ${exp.endDate ? isoYear(exp.endDate) : 'Present'}`,
    description: exp.description || '',
  }));
}

// Most recent entry only (by end/start date) — the CV preview and the
// downloaded CV show a single "highlight" education line, not a full history.
function mapEducation(education = []) {
  const best = [...education].sort(
    (a, b) => new Date(b.endDate || b.startDate || 0) - new Date(a.endDate || a.startDate || 0)
  )[0];
  return best ? { degree: best.degree, institution: best.school, year: isoYear(best.endDate || best.startDate) } : null;
}

export function listPurchases() {
  return apiClient.get('/companies/me/purchases').then((r) => r.data);
}

/**
 * `row` is `unlock.cvSnapshot` spread with purchase metadata layered on top
 * (see PurchasesService.list) — reuses the same candidateToFrontend /
 * revealedToFrontend mappers as search/bookmarks, since a cvSnapshot is a
 * revealed candidate projection with the same field names.
 */
export function purchaseToFrontend(row) {
  const base = candidateToFrontend(row);
  const revealed = revealedToFrontend(row);
  const experiences = row.experiences || [];
  const unlockedDate = new Date(row.unlockedAt);
  return {
    ...base,
    ...revealed,
    id: row.candidateId,
    purchaseId: row.id,
    // From the experience entries, for the industry filter (as on Bookmarked and Search).
    industries: [...new Set(experiences.map((e) => e.industry).filter(Boolean))],
    subIndustries: [...new Set(experiences.map((e) => e.subIndustry).filter(Boolean))],
    company: row.currentEmployerName || '',
    workHistory: mapWorkHistory(row.experiences),
    education: mapEducation(row.education),
    notice: NOTICE_LABELS[base.availability] || '',
    isAvailable: row.status === 'ACTIVE',
    recruitmentStatus: STATUS_TO_FRONTEND[row.recruitmentStatus] || 'new',
    // { id, text, createdAt, author, editedAt, editedBy }, oldest first — author/editedBy carry `you`.
    // (A backend from before the note list sends one string; ignore it rather than break the card.)
    notes: Array.isArray(row.notes) ? row.notes : [],
    unlockedDate,
    // Last status change; a backend from before the field falls back to the last update.
    statusChangedAt: new Date(row.statusChangedAt || row.updatedAt || row.unlockedAt),
    // The position the company is considering them for, or '' (see HiringForField).
    hiringFor: row.hiringFor || '',
    creditsCost: row.creditsSpent,
    // Team member who spent the credit ("Unlocked by Marko"); the id is for the "Unlocked by" filter
    // (both empty for a company without a team).
    unlockedBy: row.unlockedBy?.name || '',
    unlockedById: row.unlockedBy?.id || null,
    hire: row.hire || null,
  };
}

export function updatePurchaseStatus(purchaseId, status) {
  return apiClient.patch(`/purchases/${purchaseId}/status`, { recruitmentStatus: STATUS_TO_BACKEND[status] }).then((r) => r.data);
}

/** '' clears it. */
export function updatePurchaseHiringFor(purchaseId, hiringFor) {
  return apiClient.patch(`/purchases/${purchaseId}/hiring-for`, { hiringFor }).then((r) => r.data);
}

export function addPurchaseNote(purchaseId, text) {
  return apiClient.post(`/companies/me/purchases/${purchaseId}/notes`, { text }).then((r) => r.data);
}

export function createHire(purchaseId, { hireDate, position, salaryClauseRespected, ratingOverall, comments }) {
  return apiClient
    .post(`/purchases/${purchaseId}/hire`, {
      hireDate,
      position,
      salaryClauseRespected,
      ratingOverall: ratingOverall ? Number(ratingOverall) : undefined,
      comments: comments || undefined,
    })
    .then((r) => r.data);
}

export const STATUS_KEYS = ['new', 'contacted', 'interviewed', 'hired', 'rejected'];
export const OPEN_STATUSES = ['new', 'contacted', 'interviewed'];

/** Still in the process (not hired or rejected) with no status change for this many days. */
export const ATTENTION_DAYS = 14;
const DAY_MS = 86400000;

/** Whole days since the status last changed. */
export const daysInStage = (purchase, now = Date.now()) =>
  Math.max(0, Math.floor((now - new Date(purchase?.statusChangedAt).getTime()) / DAY_MS));

export const needsAttention = (purchase, now = Date.now()) =>
  OPEN_STATUSES.includes(purchase?.recruitmentStatus) && daysInStage(purchase, now) >= ATTENTION_DAYS;

const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

// Days from unlock to the hire date, for hired candidates with a hire record.
const daysToHire = (purchases) =>
  purchases
    .map((p) => (p.hire?.hireDate ? (new Date(p.hire.hireDate) - p.unlockedDate) / DAY_MS : null))
    .filter((d) => d !== null && d >= 0);

/**
 * The page header's numbers, over every unlocked candidate. Derived straight
 * from the purchases already fetched — no ROI%: there's no salary/revenue
 * value tracked anywhere to compute a return against.
 */
export function buildAnalytics(purchases, now = Date.now()) {
  const totalSpent = purchases.reduce((sum, p) => sum + (p.creditsCost || 0), 0);
  const profilesUnlocked = purchases.length;
  const hired = purchases.filter((p) => p.recruitmentStatus === 'hired');
  const successfulHires = hired.length;
  const hireRate = profilesUnlocked ? Math.round((successfulHires / profilesUnlocked) * 100) : 0;
  const creditsPerHire = successfulHires ? Math.round(totalSpent / successfulHires) : null;
  const avgDaysToHire = average(daysToHire(hired));
  const unlockedWithin = (from, to) =>
    purchases.filter((p) => {
      const age = now - new Date(p.unlockedDate).getTime();
      return age >= from * DAY_MS && age < to * DAY_MS;
    }).length;

  // Hire rate per position ("Hiring for"), the busiest first — the position menu shows it.
  const positions = new Map();
  purchases.forEach((p) => {
    if (!p.hiringFor) return;
    const entry = positions.get(p.hiringFor) || { position: p.hiringFor, unlocked: 0, hired: 0 };
    entry.unlocked += 1;
    if (p.recruitmentStatus === 'hired') entry.hired += 1;
    positions.set(p.hiringFor, entry);
  });
  const byPosition = [...positions.values()]
    .map((entry) => ({ ...entry, hireRate: Math.round((entry.hired / entry.unlocked) * 100) }))
    .sort((a, b) => b.unlocked - a.unlocked || a.position.localeCompare(b.position));

  return {
    totalSpent,
    profilesUnlocked,
    successfulHires,
    hireRate,
    creditsPerHire,
    avgTimeToHire: avgDaysToHire === null ? null : Math.round(avgDaysToHire),
    movedPastNew: purchases.filter((p) => p.recruitmentStatus !== 'new').length,
    unlockedThisWeek: unlockedWithin(0, 7),
    unlockedPreviousWeek: unlockedWithin(7, 14),
    byPosition,
  };
}

/**
 * The pipeline over a set of candidates: per status how many, their share,
 * the average days in it (for Hired: days from unlock to hire; none for
 * Rejected), and for open statuses who has waited ATTENTION_DAYS or more.
 */
export function buildPipeline(purchases, now = Date.now()) {
  const total = purchases.length;
  const stages = STATUS_KEYS.map((key) => {
    const inStage = purchases.filter((p) => p.recruitmentStatus === key);
    const open = OPEN_STATUSES.includes(key);
    let avgDays = null;
    if (open) avgDays = average(inStage.map((p) => daysInStage(p, now)));
    if (key === 'hired') avgDays = average(daysToHire(inStage));
    const waiting = open ? inStage.filter((p) => needsAttention(p, now)) : [];
    return {
      key,
      n: inStage.length,
      share: total ? Math.round((inStage.length / total) * 100) : 0,
      avgDays,
      waiting: waiting.length,
      maxWait: waiting.reduce((max, p) => Math.max(max, daysInStage(p, now)), 0),
      names: inStage.map((p) => p.name),
    };
  });
  return { total, stages };
}

/** Open candidates waiting ATTENTION_DAYS or more, the longest first. */
export const attentionList = (purchases, now = Date.now()) =>
  purchases
    .filter((p) => needsAttention(p, now))
    .map((p) => ({ id: p.id, name: p.name, status: p.recruitmentStatus, days: daysInStage(p, now) }))
    .sort((a, b) => b.days - a.days);
