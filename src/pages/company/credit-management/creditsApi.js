import apiClient from 'lib/apiClient';

// ---- Packages (public) ----
export function listPackages() {
  return apiClient.get('/credits/packages').then((r) => r.data);
}

/** priceCents/currency are the only real backend fields — pricePerCredit is derived, nothing else is invented (no fake "savings %" with no baseline to compare against). */
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
      ? `Purchase of ${t.packageName || 'credits'} package`
      : 'Profile unlock',
    amount: t.amount,
    cost: t.costCents ? Math.round(t.costCents / 100) : null,
    currency: t.currency,
    date: new Date(t.createdAt),
    status: (t.status || 'completed').toLowerCase(),
    balanceAfter: t.balanceAfter,
  };
}

// ---- Usage analytics (real: monthly usage + hires/investment; no fabricated department/ROI metrics) ----
export function getUsageAnalytics(months) {
  return apiClient.get('/companies/me/credits/usage-analytics', { params: { months } }).then((r) => r.data);
}

// ---- Auto-renewal ----
export function getAutoRenewal() {
  return apiClient.get('/companies/me/credits/auto-renewal').then((r) => r.data);
}
export function updateAutoRenewal(patch) {
  return apiClient.put('/companies/me/credits/auto-renewal', patch).then((r) => r.data);
}

/** Step 1 of the purchase flow: opens a Paddle transaction. `requiresCheckout` tells the frontend whether to open the Paddle Checkout overlay (no saved card yet) or just poll the balance (saved card was auto-charged). */
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
/** Opens Paddle's hosted portal for adding/updating a card outside of a purchase — Paddle has no direct SetupIntent-style flow. */
export function createPaymentMethodPortalSession() {
  return apiClient.post('/companies/me/payment-methods/portal-session').then((r) => r.data);
}

export function paymentMethodToFrontend(m) {
  return {
    id: m.id,
    name: m.card ? `${m.card.type[0].toUpperCase()}${m.card.type.slice(1)} **** ${m.card.last4}` : 'Card',
    expiry: m.card ? `${String(m.card.expiry_month).padStart(2, '0')}/${String(m.card.expiry_year).slice(-2)}` : '—',
  };
}
