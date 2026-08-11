import apiClient from 'lib/apiClient';
import { candidateToFrontend, revealedToFrontend } from '../candidate-search-dashboard/candidateSearchApi';

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

// Most recent entry only (by end/start date) — the card's expand panel and
// the downloaded CV both show a single "highlight" education line, not a
// full history.
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
  return {
    ...base,
    ...revealed,
    id: row.candidateId,
    purchaseId: row.id,
    company: row.currentEmployerName || '',
    workHistory: mapWorkHistory(row.experiences),
    education: mapEducation(row.education),
    notice: NOTICE_LABELS[base.availability] || '',
    isAvailable: row.status === 'ACTIVE',
    recruitmentStatus: STATUS_TO_FRONTEND[row.recruitmentStatus] || 'new',
    notes: row.notes || '',
    unlockedDate: new Date(row.unlockedAt),
    creditsCost: row.creditsSpent,
    hire: row.hire || null,
  };
}

export function updatePurchaseStatus(purchaseId, status) {
  return apiClient.patch(`/purchases/${purchaseId}/status`, { recruitmentStatus: STATUS_TO_BACKEND[status] }).then((r) => r.data);
}

export function updatePurchaseNotes(purchaseId, notes) {
  return apiClient.patch(`/purchases/${purchaseId}/notes`, { notes }).then((r) => r.data);
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

const MONTH_FORMATTER = new Intl.DateTimeFormat('en', { month: 'short' });
const STATUS_KEYS = ['new', 'contacted', 'interviewed', 'hired', 'rejected'];

/**
 * Everything here is derived straight from the purchases already fetched —
 * no ROI%: there's no salary/revenue value tracked anywhere to compute a
 * return against (same gap that dropped ROI% from credit-management's
 * usage analytics).
 */
export function buildAnalytics(purchases) {
  const totalSpent = purchases.reduce((sum, p) => sum + (p.creditsCost || 0), 0);
  const profilesUnlocked = purchases.length;
  const hired = purchases.filter((p) => p.recruitmentStatus === 'hired');
  const successfulHires = hired.length;
  const hireRate = profilesUnlocked ? Math.round((successfulHires / profilesUnlocked) * 100) : 0;
  const creditsPerHire = successfulHires ? Math.round(totalSpent / successfulHires) : null;

  const hireDurations = hired
    .map((p) => (p.hire?.hireDate ? (new Date(p.hire.hireDate) - p.unlockedDate) / 86400000 : null))
    .filter((d) => d !== null && d >= 0);
  const avgTimeToHire = hireDurations.length
    ? Math.round(hireDurations.reduce((a, b) => a + b, 0) / hireDurations.length)
    : null;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTH_FORMATTER.format(d), credits: 0 };
  });
  const monthIndex = new Map(months.map((m) => [m.key, m]));
  purchases.forEach((p) => {
    const key = `${p.unlockedDate.getFullYear()}-${p.unlockedDate.getMonth()}`;
    const bucket = monthIndex.get(key);
    if (bucket) bucket.credits += p.creditsCost || 0;
  });

  const statusCounts = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]));
  purchases.forEach((p) => {
    if (statusCounts[p.recruitmentStatus] !== undefined) statusCounts[p.recruitmentStatus] += 1;
  });

  return {
    totalSpent,
    profilesUnlocked,
    successfulHires,
    hireRate,
    creditsPerHire,
    avgTimeToHire,
    monthlySpending: months.map(({ month, credits }) => ({ month, credits })),
    statusDistribution: statusCounts,
  };
}
