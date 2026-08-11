import apiClient from 'lib/apiClient';

// ---- Account preferences (language, timezone, theme, reduce motion, text size) ----
export function getAccountPreferences() {
  return apiClient.get('/candidates/me/account-preferences').then((r) => r.data);
}
export function updateAccountPreferences(patch) {
  return apiClient.patch('/candidates/me/account-preferences', patch).then((r) => r.data);
}

// ---- Privacy (visibility + unlock toggles) ----
export function getPrivacy() {
  return apiClient.get('/candidates/me/privacy').then((r) => r.data);
}
export function updatePrivacy(patch) {
  return apiClient.patch('/candidates/me/privacy', patch).then((r) => r.data);
}

// ---- Blocked companies ----
export function listBlockedCompanies() {
  return apiClient.get('/candidates/me/blocked-companies').then((r) => r.data);
}
export function addBlockedCompany(payload) {
  return apiClient.post('/candidates/me/blocked-companies', payload).then((r) => r.data);
}
export function removeBlockedCompany(id) {
  return apiClient.delete(`/candidates/me/blocked-companies/${id}`).then((r) => r.data);
}
/** Used to resolve a typed company name/email/tax ID to a real companyId before blocking. */
export function searchCompanies(query) {
  return apiClient.get('/companies', { params: { search: query, limit: 5 } }).then((r) => r.data);
}

// ---- Hidden employers (plain free-text, no backend lookup) ----
export function listHiddenEmployers() {
  return apiClient.get('/candidates/me/hidden-employers').then((r) => r.data);
}
export function addHiddenEmployer(employerName) {
  return apiClient.post('/candidates/me/hidden-employers', { employerName }).then((r) => r.data);
}
export function removeHiddenEmployer(id) {
  return apiClient.delete(`/candidates/me/hidden-employers/${id}`).then((r) => r.data);
}

// ---- Notification preferences (also carries the Data tab's 3 consent booleans) ----
export function getNotificationPrefs() {
  return apiClient.get('/candidates/me/notification-prefs').then((r) => r.data);
}
export function updateNotificationPrefs(patch) {
  return apiClient.patch('/candidates/me/notification-prefs', patch).then((r) => r.data);
}

// ---- Account status / deletion ----
/** Same `status` field as the candidate-profile "availability" selector — pausing just sets it to OFF. */
export function pauseAccount() {
  return apiClient.patch('/candidates/me', { status: 'OFF' }).then((r) => r.data);
}
export function deleteAccount() {
  return apiClient.delete('/candidates/me', { data: { confirm: 'DELETE' } }).then((r) => r.data);
}
