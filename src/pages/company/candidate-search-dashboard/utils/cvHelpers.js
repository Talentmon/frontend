// Helpers for the CV preview drawer.
import { formatMoney } from 'utils/currencyService';

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

// "Candidate · TC-XXXX" code shown instead of the real name until the profile
// is unlocked — the backend's anonCode, same as the candidate-profile page's
// anonymous view.
export const candidateCode = (candidate) => candidate?.anonCode || 'TC-····';
