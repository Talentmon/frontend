import apiClient from 'lib/apiClient';
import { companyVisual } from '../candidate/companiesApi';

// ---- Dashboard ----
export function getOverview(period) {
  return apiClient.get('/admin/overview', { params: { period } }).then((r) => r.data);
}
export function getPurchases(period) {
  return apiClient.get('/admin/purchases', { params: { period } }).then((r) => r.data);
}
export function getBurn(period) {
  return apiClient.get('/admin/burn', { params: { period } }).then((r) => r.data);
}
export function getSupplyDemand(period) {
  return apiClient.get('/admin/supply-demand', { params: { period } }).then((r) => r.data);
}
export function getCompanies(query) {
  return apiClient.get('/admin/companies', { params: query }).then((r) => r.data);
}

// ---- Settings ----
export function getMe() {
  return apiClient.get('/admin/me').then((r) => r.data);
}
export function updateMe(dto) {
  return apiClient.patch('/admin/me', dto).then((r) => r.data);
}
export function getSessions() {
  return apiClient.get('/admin/me/sessions').then((r) => r.data);
}
export function updateNotifPrefs(dto) {
  return apiClient.patch('/admin/me/notification-prefs', dto).then((r) => r.data);
}
export function getPlatformSettings() {
  return apiClient.get('/admin/settings').then((r) => r.data);
}
export function updatePlatformSettings(dto) {
  return apiClient.put('/admin/settings', dto).then((r) => r.data);
}
export function listCreditPackages() {
  return apiClient.get('/admin/credit-packages').then((r) => r.data);
}
export function updateCreditPackage(id, dto) {
  return apiClient.patch(`/admin/credit-packages/${id}`, dto).then((r) => r.data);
}
export function listAdmins() {
  return apiClient.get('/admin/admins').then((r) => r.data);
}
export function inviteAdmin(dto) {
  return apiClient.post('/admin/admins', dto).then((r) => r.data);
}
export function updateAdminRole(userId, role) {
  return apiClient.patch(`/admin/admins/${userId}/role`, { role }).then((r) => r.data);
}
export function removeAdmin(userId) {
  return apiClient.delete(`/admin/admins/${userId}`).then((r) => r.data);
}

// ---- Formatting helpers ----
export const eur = (cents) => `€${Math.round((cents || 0) / 100).toLocaleString('en-US')}`;
export const eurCents2 = (cents) => `€${((cents || 0) / 100).toFixed(2)}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (d) => MONTHS[new Date(d)?.getMonth()];

// height% for a bar chart column, with a visible floor for zero/near-zero values
export const barHeight = (value, max) => Math.max(max > 0 ? (value / max) * 100 : 0, 4);

export { companyVisual };

// ---- Settings field <-> backend value maps ----
export const TIMEZONE_TO_BACKEND = { be: 'Europe/Belgrade', ld: 'Europe/London' };
export const TIMEZONE_TO_FRONTEND = { 'Europe/Belgrade': 'be', 'Europe/London': 'ld' };

export const CURRENCY_TO_BACKEND = { eur: 'EUR', rsd: 'RSD' };
export const CURRENCY_TO_FRONTEND = { EUR: 'eur', RSD: 'rsd' };

export const creditValidityToBackend = (value) => (value === 'never' ? null : Number(value));
export const creditValidityToFrontend = (months) => (months ? String(months) : 'never');

export const ROLE_LABEL = { OWNER: 'Owner (full access)', ADMIN: 'Admin', ANALYST: 'Analyst (read-only)' };
