// utils/exchangeRateService.js - ExchangeRateService
//
// Today's exchange rates, from the backend (GET /exchange-rates), which
// refreshes them once a day from a public rates source. Loaded once per visit
// and kept here, so the salary services can convert without an await. The
// browser never calls the rates source itself.
import { useEffect, useSyncExternalStore } from 'react';
import apiClient from 'lib/apiClient';

export const BASE_CURRENCY = 'EUR';

// status: idle → loading → ready (or error, tried again on the next use).
// rates: EUR value of 1 unit of each currency.
let state = { status: 'idle', rates: {}, source: null, ratesDate: null };
let request = null;
const listeners = new Set();

const setState = (next) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Fetches today's rates once; later calls share the same request. */
export function loadExchangeRates() {
  if (state.status === 'ready') return Promise.resolve(state);
  if (!request) {
    setState({ ...state, status: 'loading' });
    request = apiClient
      .get('/exchange-rates')
      .then(({ data }) => {
        setState({ status: 'ready', rates: data?.rates || {}, source: data?.source || null, ratesDate: data?.ratesDate || null });
        return state;
      })
      .catch(() => {
        setState({ ...state, status: 'error' });
        return state;
      })
      .finally(() => {
        request = null;
      });
  }
  return request;
}

// Synchronous lookup - the salary services depend on this. Null while the
// rates are loading or when a currency has no rate; the caller decides how
// to degrade.
export const getExchangeRate = (currencyCode) => {
  if (currencyCode === BASE_CURRENCY) {
    return { currency: BASE_CURRENCY, baseCurrency: BASE_CURRENCY, rate: 1, date: state.ratesDate };
  }
  const rate = state.rates?.[currencyCode];
  if (typeof rate !== 'number') return null;
  return { currency: currencyCode, baseCurrency: BASE_CURRENCY, rate, date: state.ratesDate };
};

/**
 * { status, rates, source, ratesDate } — loads the rates on first use and
 * re-renders when they arrive. After a failed load the next page that uses
 * them tries again.
 */
export function useExchangeRates() {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    if (state.status === 'idle' || state.status === 'error') loadExchangeRates();
  }, []);
  return snapshot;
}
