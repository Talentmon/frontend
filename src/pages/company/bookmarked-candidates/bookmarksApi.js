import apiClient from 'lib/apiClient';
import { candidateToFrontend } from '../candidate-search-dashboard/candidateSearchApi';

export { unlockCandidate, revealedToFrontend, updateNote, deleteNote } from '../candidate-search-dashboard/candidateSearchApi';

/** Matches the backend's UnlocksService UNLOCK_COST (1 credit per profile). */
export const UNLOCK_COST = 1;

export function listBookmarks() {
  return apiClient.get('/companies/me/bookmarks').then((r) => r.data);
}

/** `{ limit, count }` — the company-wide bookmark allowance (it varies per company; only the number is shown). */
export function getBookmarkLimit() {
  return apiClient.get('/companies/me/bookmarks/limit').then((r) => r.data);
}

export function bookmarkToFrontend(row) {
  const experiences = row.candidate?.experiences || [];
  return {
    ...candidateToFrontend(row.candidate),
    // From the experience entries, for the industry filter (as in Search).
    industries: [...new Set(experiences.map((e) => e.industry).filter(Boolean))],
    subIndustries: [...new Set(experiences.map((e) => e.subIndustry).filter(Boolean))],
    bookmarkId: row.id,
    unlockCost: UNLOCK_COST,
    // { id, text, createdAt, author, editedAt, editedBy }, oldest first — author/editedBy carry `you`.
    // (A backend from before the note list sends one string; ignore it rather than break the card.)
    notes: Array.isArray(row.notes) ? row.notes : [],
    bookmarkedDate: new Date(row.bookmarkedAt),
    // Team member who saved it ("Saved by Marko").
    bookmarkedBy: row.bookmarkedBy?.name || '',
    // Their team-member id, for the "saved by" filter (null for a solo company).
    bookmarkedById: row.bookmarkedBy?.id || null,
    // PERSONAL bookmarks sit in their bookmarker's own slots — only they can remove them (`canRemove`).
    pocket: row.pocket,
    canRemove: row.canRemove !== false,
    sortIndex: row.sortIndex,
  };
}

export function removeBookmark(bookmarkId) {
  return apiClient.delete(`/companies/me/bookmarks/${bookmarkId}`).then((r) => r.data);
}

export function addBookmarkNote(bookmarkId, text) {
  return apiClient.post(`/companies/me/bookmarks/${bookmarkId}/notes`, { text }).then((r) => r.data);
}

export function reorderBookmarks(items) {
  return apiClient.patch('/companies/me/bookmarks/reorder', { items }).then((r) => r.data);
}

/** Best-effort on the backend — some candidates can fail (e.g. balance runs out mid-batch) while others succeed. Returns { unlocked: { candidateId, cvSnapshot }[], failed: { candidateId, reason }[] }. */
export function bulkUnlockBookmarks(candidateIds) {
  return apiClient.post('/companies/me/bookmarks/bulk-unlock', { candidateIds }).then((r) => r.data);
}
