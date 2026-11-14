import React from 'react';
import { shortDate } from 'utils/formatDate';

// The rates' source, named wherever its rates are used. ExchangeRate-API's
// free terms ask for exactly this link text; the fallback source is named the
// same way.
const SOURCES = {
  'exchangerate-api': { label: 'Rates By Exchange Rate API', href: 'https://www.exchangerate-api.com' },
  'currency-api': { label: 'Rates by currency-api', href: 'https://github.com/fawazahmed0/exchange-api' }
};

/** "Rates By Exchange Rate API · 13 Nov 2026" — nothing until the backend has fetched real rates. */
const RatesSourceLink = ({ source, ratesDate, className = '', prefix = '' }) => {
  const known = SOURCES[source];
  if (!known) return null;
  return (
    <span className={className}>
      {prefix}
      <a href={known.href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
        {known.label}
      </a>
      {ratesDate ? ` · ${shortDate(ratesDate)}` : ''}
    </span>
  );
};

export default RatesSourceLink;
