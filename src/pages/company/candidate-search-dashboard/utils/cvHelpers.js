// Helpers for the CV preview drawer.

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

// A candidate's salary is shown through lib/salaryView (net/gross, month/year).

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
