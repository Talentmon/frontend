// The CV editor uses free-text "MM/YYYY" (experience) or "YYYY" (education)
// fields; the backend stores real dates. Conversions always go through UTC
// to avoid local-timezone shifting the displayed month/year by a day.

export function monthYearToIso(str) {
  const s = String(str || '').trim();
  const my = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (my) {
    const month = Math.min(12, Math.max(1, parseInt(my[1], 10)));
    const year = parseInt(my[2], 10);
    return new Date(Date.UTC(year, month - 1, 1)).toISOString();
  }
  const y = s.match(/^(\d{4})$/);
  if (y) return new Date(Date.UTC(parseInt(y[1], 10), 0, 1)).toISOString();
  return undefined;
}

/** Experience "end" field: blank or "Present" both mean ongoing (endDate = null). */
export function endMonthYearToIso(str) {
  const s = String(str || '').trim();
  if (!s || /^present$/i.test(s)) return null;
  return monthYearToIso(str) ?? null;
}

export function isoToMonthYear(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${month}/${d.getUTCFullYear()}`;
}

export function isoToYear(iso) {
  if (!iso) return '';
  return String(new Date(iso).getUTCFullYear());
}
