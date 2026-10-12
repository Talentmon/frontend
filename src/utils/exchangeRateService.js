// utils/exchangeRateService.js - ExchangeRateService
//
// The platform's single global base currency, and the only place that knows
// how to turn "1 unit of currency X" into base-currency units.
//
// TODO(backend): this currently reads a static illustrative rate table.
// Replace `fetchRateFromProvider` with a call to the real backend endpoint
// (e.g. GET /api/exchange-rates/:code) that proxies a real FX provider and
// updates once a day. Never call a third-party FX API directly from the
// browser (API keys, rate limits, and the "never fetch rates during search"
// requirement all argue for a backend-owned cache).
export const BASE_CURRENCY = 'EUR';

// Illustrative EUR value of 1 unit of each currency. Good enough to drive
// search/sort/filter in this mock; not a live feed.
const EUR_RATES = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  CHF: 1.05,
  RSD: 0.00853,
  CNY: 0.128,
  RUB: 0.0098,
  JPY: 0.0061,
  AUD: 0.6,
  CAD: 0.67,
  SEK: 0.087,
  NOK: 0.084,
  DKK: 0.134,
  PLN: 0.234,
  CZK: 0.04,
  HUF: 0.0025,
  RON: 0.201,
  BGN: 0.511,
  BAM: 0.511,
  MKD: 0.0163,
  ALL: 0.0098,
  ISK: 0.0067,
  TRY: 0.027,
  UAH: 0.023,
  INR: 0.011,
  BRL: 0.166,
  MXN: 0.048,
  ZAR: 0.05,
  AED: 0.25,
  SAR: 0.245,
  ILS: 0.245,
  KRW: 0.00063,
  SGD: 0.685,
  HKD: 0.118,
  NZD: 0.556,
  THB: 0.026,
  IDR: 0.000057,
  PHP: 0.0157,
  VND: 0.000037,
  EGP: 0.0186,
  NGN: 0.00057,
  KES: 0.0068,
  PKR: 0.0033,
};

// Frozen "as of" date for this mock table - stands in for the daily-refresh
// timestamp a real provider call would return.
const MOCK_RATE_DATE = '2026-07-01';

// Synchronous lookup - the salary services depend on this, not on the async
// wrapper below, so they can normalize without an await.
export const getExchangeRate = (currencyCode) => {
  const rate = EUR_RATES?.[currencyCode];
  if (currencyCode === BASE_CURRENCY) {
    return { currency: BASE_CURRENCY, baseCurrency: BASE_CURRENCY, rate: 1, date: MOCK_RATE_DATE };
  }
  if (typeof rate !== 'number') return null; // missing / unsupported / provider-down - caller decides how to degrade
  return { currency: currencyCode, baseCurrency: BASE_CURRENCY, rate, date: MOCK_RATE_DATE };
};

// Async seam for the future backend call. Today it just wraps the sync
// lookup in a resolved Promise so callers can already code against the
// eventual network contract.
export const fetchExchangeRate = (currencyCode) => Promise.resolve(getExchangeRate(currencyCode));
