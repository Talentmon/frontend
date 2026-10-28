import apiClient from 'lib/apiClient';
import { formatMoney } from 'utils/currencyService';

// ---- Packages, priced in the company's billing currency ----
export function listPackages() {
  return apiClient.get('/companies/me/credits/packages').then((r) => r.data);
}

/** "€199", "$216" — or "€19.90" with `cents`, for per-unlock prices. */
export const formatPrice = (amount, currency, { cents = false } = {}) =>
  formatMoney(amount, currency || 'EUR', cents ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {});

/** priceCents/currency are the only real backend fields — pricePerCredit is derived, nothing else is invented (the Purchase tab's "Save N%" is measured against the 1-Credit package). */
export function packageToFrontend(p) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    credits: p.credits,
    price: p.priceCents / 100,
    currency: p.currency,
    pricePerCredit: p.priceCents / 100 / p.credits,
    popular: p.popular,
  };
}

/**
 * Extra bookmarks each package adds (same for every company size) and how
 * many months they last — `{ validMonths, packages: [{ packageId, bookmarks }] }`.
 */
export function getPackageBookmarkBonuses() {
  return apiClient.get('/companies/me/bookmarks/package-bonuses').then((r) => r.data);
}

// ---- Balance & transactions ----
export function getBalance() {
  return apiClient.get('/companies/me/credits/balance').then((r) => r.data);
}
export function getTransactions(query) {
  return apiClient.get('/companies/me/credits/transactions', { params: query }).then((r) => r.data);
}

export function transactionToFrontend(t) {
  const isPurchase = t.type === 'PURCHASE';
  return {
    id: t.id,
    type: isPurchase ? 'purchase' : 'unlock',
    description: isPurchase
      ? (t.packageName ? `${t.packageName} package` : 'Credits purchase')
      : 'Profile unlock',
    amount: t.amount,
    // A multi-Credit package (Starter and up) — tinted gold in the history, a single Credit green.
    bundle: isPurchase && t.amount > 1,
    cost: t.costCents ? Math.round(t.costCents / 100) : null,
    currency: t.currency,
    date: new Date(t.createdAt),
    status: (t.status || 'completed').toLowerCase(),
    balanceAfter: t.balanceAfter,
    // { id, name, removed } — the team member who bought/spent, null for system adjustments.
    actor: t.actor || null,
  };
}

// ---- Usage analytics (real: monthly usage + hires/investment; no fabricated department/ROI metrics) ----
export function getUsageAnalytics(months) {
  return apiClient.get('/companies/me/credits/usage-analytics', { params: { months } }).then((r) => r.data);
}

// ---- Low balance alert ({ enabled, thresholdCredits }) ----
export function getLowBalanceAlert() {
  return apiClient.get('/companies/me/credits/low-balance-alert').then((r) => r.data);
}
export function updateLowBalanceAlert(patch) {
  return apiClient.patch('/companies/me/credits/low-balance-alert', patch).then((r) => r.data);
}

/** Step 1 of the purchase flow: opens a Paddle transaction, then the frontend opens Paddle Checkout for it — `{ transactionId, customerAuthToken }`. */
export function purchaseCredits(packageId) {
  return apiClient.post('/companies/me/credits/purchase', { packageId }).then((r) => r.data);
}

// ---- Payment methods (Paddle-managed — no local card storage) ----
export function listPaymentMethods() {
  return apiClient.get('/companies/me/payment-methods').then((r) => r.data);
}
export function removePaymentMethod(id) {
  return apiClient.delete(`/companies/me/payment-methods/${id}`).then((r) => r.data);
}

// Paddle's card.type values, by the names people know them.
const CARD_BRANDS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  american_express: 'American Express',
  discover: 'Discover',
  diners_club: 'Diners Club',
  jcb: 'JCB',
  maestro: 'Maestro',
  union_pay: 'UnionPay',
  mada: 'Mada',
};

export function paymentMethodToFrontend(m) {
  const card = m.card;
  const month = card ? String(card.expiry_month).padStart(2, '0') : null;
  return {
    id: m.id,
    brand: card ? CARD_BRANDS[card.type] || 'Card' : m.type === 'paypal' ? 'PayPal' : 'Card',
    last4: card?.last4 || null,
    // "08/28" on the card itself, "08/2028" in the text under it.
    expiry: card ? `${month}/${String(card.expiry_year).slice(-2)}` : null,
    expiryFull: card ? `${month}/${card.expiry_year}` : null,
  };
}
