// Helpers for the anonymous CV preview drawer.
// The dashboard's candidate records only carry contact/company details once a
// company has actually unlocked the profile, so the drawer synthesizes a
// deterministic, display-only email/phone/LinkedIn for the redacted preview.
import { formatMoney } from 'utils/currencyService';

const CYRILLIC_TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'dj', е: 'e', ж: 'z', з: 'z', и: 'i', ј: 'j',
  к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  ћ: 'c', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'c', џ: 'dz', ш: 's'
};

export const slugify = (name = '') =>
  name
    ?.toLowerCase()
    ?.split('')
    ?.map((ch) => CYRILLIC_TO_LATIN?.[ch] ?? ch)
    ?.join('')
    ?.replace(/[^a-z0-9\s-]/g, '')
    ?.trim()
    ?.replace(/\s+/g, '.') || '';

export const mockContactFor = (candidate) => {
  const slug = slugify(candidate?.name) || `candidate${candidate?.id ?? ''}`;
  const seed = candidate?.id ?? 0;
  const phoneMid = String(60 + (seed % 9)).padStart(2, '0');
  const phoneRest = String(1000000 + seed * 7919).slice(-7);
  return {
    email: `${slug}@email.com`,
    phone: `+381 ${phoneMid} ${phoneRest?.slice(0, 3)} ${phoneRest?.slice(3)}`,
    linkedin: `/in/${slug}`
  };
};

export const educationLabels = {
  'high-school': 'High School',
  'associate-degree': 'Associate Degree',
  'bachelors-degree': "Bachelor's Degree",
  'masters-degree': "Master's Degree",
  phd: 'PhD'
};

export const availabilityLabels = {
  immediately: 'Available Immediately',
  '2-weeks': '2 weeks notice period',
  '1-month': '1 month notice period',
  '3-months': '3 months notice period'
};

// Displays a candidate's expected salary exactly as they entered it - the
// original amount and currency, never a converted value (see
// CurrencyService.formatMoney / salaryNormalizationService).
export const formatSalary = (expectedSalary) =>
  formatMoney(expectedSalary?.amount, expectedSalary?.currency);

export const jobTypeLabels = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  freelance: 'Freelance'
};

// Deterministic "Candidate · TC-XXXX" style code shown instead of the real
// name until the profile is unlocked, matching the candidate-profile page's
// anonymous view.
export const candidateCode = (candidate) => `TC-${7700 + (candidate?.id ?? 0)}`;
