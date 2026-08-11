import apiClient from 'lib/apiClient';
import { companyVisual } from '../companiesApi';

export function getRated() {
  return apiClient.get('/candidates/me/reviews/rated').then((r) => r.data);
}
export function getPending() {
  return apiClient.get('/candidates/me/reviews/pending').then((r) => r.data);
}
export function createReview(payload) {
  return apiClient.post('/candidates/me/reviews', payload).then((r) => r.data);
}
export function updateReview(id, payload) {
  return apiClient.put(`/candidates/me/reviews/${id}`, payload).then((r) => r.data);
}
export function deleteReview(id) {
  return apiClient.delete(`/candidates/me/reviews/${id}`).then((r) => r.data);
}

const isoDate = (d) => (d ? new Date(d)?.toISOString()?.slice(0, 10) : '');

export function ratedToFrontend(row) {
  return {
    id: row.id,
    companyId: row.companyId,
    company: row.company,
    industry: row.industry,
    city: row.city,
    color: companyVisual(row.companyId, row.company)?.color,
    role: row.role,
    date: isoDate(row.date),
    recommend: row.recommend,
    minPay: row.minPay,
    review: row.review,
    cats: row.cats,
    pub: row.pub,
  };
}

export function pendingToFrontend(row) {
  return {
    id: row.id,
    companyId: row.companyId,
    company: row.company,
    industry: row.industry,
    city: row.city,
    color: companyVisual(row.companyId, row.company)?.color,
    role: row.role,
    pub: row.pub,
  };
}

export function ratingFormToPayload({ companyId, cats, minPay, recommend, review }) {
  return {
    ...(companyId ? { companyId } : {}),
    ratingProcess: cats.process,
    ratingComms: cats.comms,
    ratingCulture: cats.culture,
    ratingBenefits: cats.benefits,
    minWageRespected: minPay,
    recommend,
    comment: review || undefined,
  };
}
