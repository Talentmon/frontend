// utils/currencyService.js - CurrencyService
//
// Single source of truth for "is this a currency we support" and "how do we
// print an amount in it". Pure and synchronous - no network, no exchange
// rates (see exchangeRateService.js for that). Every other salary service
// depends on this one, never the other way round.
import { CURRENCY_MAP, CURRENCY_CODES, MOST_USED_CURRENCIES, OTHER_CURRENCIES } from './currencies';

export { CURRENCY_CODES, CURRENCY_MAP, MOST_USED_CURRENCIES, OTHER_CURRENCIES };

export const isSupportedCurrency = (code) => typeof code === 'string' && CURRENCY_CODES.includes(code);

export const getCurrency = (code) => CURRENCY_MAP?.[code] || null;

// Grouped { value, label, group } options ready for the ui/Select component
// (most-used currencies first, then the rest, alphabetically).
export const currencySelectOptions = () => [
  ...MOST_USED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}`, group: 'Most used' })),
  ...OTHER_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}`, group: 'All currencies' })),
];

// Short symbol for `currencyCode` (€, $, £ ...). Intl returns the ISO code
// itself for currencies without a symbol of their own (e.g. RSD).
export const currencySymbol = (currencyCode) => {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value || currencyCode;
  } catch {
    return currencyCode;
  }
};

// Formats `amount` in its own currency - this is what candidates/employers
// entered and it must never be silently converted. Falls back to a plain
// "1.234 XYZ" format if Intl doesn't recognize the ISO code in this runtime.
export const formatMoney = (amount, currencyCode, { maximumFractionDigits = 0, minimumFractionDigits = 0 } = {}) => {
  const value = Number(amount) || 0;
  if (!isSupportedCurrency(currencyCode)) {
    return `${value.toLocaleString('en-US')} ${currencyCode || ''}`.trim();
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  } catch {
    return `${value.toLocaleString('en-US')} ${currencyCode}`;
  }
};
