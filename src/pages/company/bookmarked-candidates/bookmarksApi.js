import apiClient from 'lib/apiClient';
import { candidateToFrontend } from '../candidate-search-dashboard/candidateSearchApi';

export { unlockCandidate, revealedToFrontend, getCreditsBalance } from '../candidate-search-dashboard/candidateSearchApi';

/** Matches the backend's UnlocksService UNLOCK_COST (1 credit per profile). */
export const UNLOCK_COST = 1;

export function listBookmarks() {
  return apiClient.get('/companies/me/bookmarks').then((r) => r.data);
}

export function bookmarkToFrontend(row) {
  return {
    ...candidateToFrontend(row.candidate),
    bookmarkId: row.id,
    unlockCost: UNLOCK_COST,
    notes: row.notes || '',
    bookmarkedDate: new Date(row.bookmarkedAt),
    sortIndex: row.sortIndex,
  };
}

export function removeBookmark(bookmarkId) {
  return apiClient.delete(`/companies/me/bookmarks/${bookmarkId}`).then((r) => r.data);
}

export function updateBookmarkNotes(bookmarkId, notes) {
  return apiClient.patch(`/companies/me/bookmarks/${bookmarkId}/notes`, { notes }).then((r) => r.data);
}

export function reorderBookmarks(items) {
  return apiClient.patch('/companies/me/bookmarks/reorder', { items }).then((r) => r.data);
}

/** Best-effort on the backend — some candidates can fail (e.g. balance runs out mid-batch) while others succeed. Returns { unlocked: { candidateId, cvSnapshot }[], failed: { candidateId, reason }[] }. */
export function bulkUnlockBookmarks(candidateIds) {
  return apiClient.post('/companies/me/bookmarks/bulk-unlock', { candidateIds }).then((r) => r.data);
}
