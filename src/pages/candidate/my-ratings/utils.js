export const CATS = [
  { key: 'process',  label: 'Hiring process', hint: 'Speed, clarity, fairness' },
  { key: 'comms',    label: 'Communication',  hint: 'Feedback and tone' },
  { key: 'culture',  label: 'Work culture',   hint: 'Team, values, atmosphere' },
  { key: 'benefits', label: 'Benefits',       hint: 'Health coverage, days off, equipment, flexibility' },
];

export const calcOverall = (cats, minPay) => {
  const vals = CATS.map(c => cats[c.key] ?? 0).filter(v => v > 0);
  if (!vals.length) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  // RULE: if the minimum salary wasn't honored, the 5-star average is rescaled
  // so that a perfect score (5) maps to 3, not just clamped to a max of 3.
  const scaled = minPay === false ? avg * (3 / 5) : avg;
  return Math.round(scaled * 10) / 10;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const fmtDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
