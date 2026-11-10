import apiClient from 'lib/apiClient';

// Icons live with the page (AreaIcon in index.jsx).
export const AREAS = [
  { value: 'SEARCH', label: 'Search' },
  { value: 'BOOKMARKS', label: 'Bookmarks' },
  { value: 'PURCHASED', label: 'Purchased' },
  { value: 'CREDITS', label: 'Credits' },
  { value: 'TEAM', label: 'Team' },
  { value: 'PROFILE', label: 'Company profile' },
  { value: 'OTHER', label: 'Other' },
];
export const AREA_BY_VALUE = Object.fromEntries(AREAS.map((a) => [a.value, a]));

export const STATUSES = {
  NEW: { label: 'New', tone: 'stNew', text: 'Waiting for our team to read it' },
  UNDER_REVIEW: { label: 'Under review', tone: 'stReview', text: 'We are looking into it' },
  PLANNED: { label: 'Planned', tone: 'stPlanned', text: 'On our roadmap' },
  IN_PROGRESS: { label: 'In progress', tone: 'stProgress', text: 'Being built right now' },
  SHIPPED: { label: 'Shipped', tone: 'stShipped', text: 'Live in Talentmon' },
  DECLINED: { label: 'Declined', tone: 'stDeclined', text: "Not something we'll build" },
};

/** Voting stops once the team has closed a suggestion (mirrors the backend). */
export const CLOSED_STATUSES = ['SHIPPED', 'DECLINED'];

export const MIN_LENGTH = 10;
export const MAX_LENGTH = 1000;

export const errorMessage = (err, fallback) => {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message[0] || fallback;
  return message || fallback;
};

export const listSuggestions = () => apiClient.get('/suggestions').then((r) => r.data);
export const createSuggestion = (dto) => apiClient.post('/suggestions', dto).then((r) => r.data);
export const updateSuggestion = (id, dto) => apiClient.patch(`/suggestions/${id}`, dto).then((r) => r.data);
export const deleteSuggestion = (id) => apiClient.delete(`/suggestions/${id}`).then((r) => r.data);
/** value: 1 up, -1 down, 0 take the vote back. */
export const voteSuggestion = (id, value) => apiClient.put(`/suggestions/${id}/vote`, { value }).then((r) => r.data);
