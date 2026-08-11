// Shared industry / subindustry taxonomy used for candidate search filtering
// and for tagging work experience entries. Purely metadata for search - it
// is never rendered on a CV.
export const INDUSTRIES = [
  {
    name: 'Technology',
    subIndustries: [
      'IT & Software',
      'Artificial Intelligence (AI)',
      'Cybersecurity',
      'Cloud Computing',
      'Gaming',
      'Hardware & Electronics',
      'Semiconductors'
    ]
  },
  {
    name: 'Finance',
    subIndustries: [
      'Banking',
      'Financial Services',
      'FinTech',
      'Insurance',
      'Investment Management',
      'Accounting & Auditing'
    ]
  },
  {
    name: 'Healthcare',
    subIndustries: [
      'Healthcare',
      'Pharmaceuticals',
      'Biotechnology',
      'Medical Devices',
      'Hospitals & Clinics',
      'Veterinary Services'
    ]
  },
  {
    name: 'Manufacturing & Industry',
    subIndustries: [
      'Manufacturing',
      'Automotive',
      'Aerospace & Defense',
      'Industrial Automation',
      'Machinery',
      'Chemicals',
      'Plastics & Rubber',
      'Textiles & Apparel',
      'Packaging'
    ]
  },
  {
    name: 'Construction & Real Estate',
    subIndustries: [
      'Construction',
      'Architecture',
      'Civil Engineering',
      'Real Estate',
      'Property Management'
    ]
  },
  {
    name: 'Retail & Trade',
    subIndustries: [
      'Retail',
      'Wholesale',
      'E-commerce',
      'Consumer Goods',
      'Luxury Goods'
    ]
  },
  {
    name: 'Marketing & Media',
    subIndustries: [
      'Marketing & Advertising',
      'Public Relations',
      'Digital Marketing',
      'Media & Publishing',
      'Entertainment',
      'Film & Television',
      'Music',
      'Gaming & Esports'
    ]
  },
  {
    name: 'Education',
    subIndustries: [
      'Education',
      'E-learning',
      'Research',
      'Training & Development'
    ]
  },
  {
    name: 'Telecommunications',
    subIndustries: [
      'Telecommunications',
      'Internet Service Providers',
      'Satellite Communications'
    ]
  },
  {
    name: 'Energy',
    subIndustries: [
      'Energy',
      'Oil & Gas',
      'Renewable Energy',
      'Utilities',
      'Nuclear Energy'
    ]
  },
  {
    name: 'Transportation & Logistics',
    subIndustries: [
      'Logistics',
      'Transportation',
      'Supply Chain',
      'Shipping',
      'Aviation',
      'Rail Transport',
      'Warehousing'
    ]
  },
  {
    name: 'Agriculture',
    subIndustries: [
      'Agriculture',
      'Food Production',
      'Forestry',
      'Fisheries'
    ]
  },
  {
    name: 'Food & Hospitality',
    subIndustries: [
      'Food & Beverage',
      'Restaurants',
      'Hospitality',
      'Hotels & Resorts',
      'Tourism & Travel'
    ]
  },
  {
    name: 'Professional Services',
    subIndustries: [
      'Consulting',
      'Legal Services',
      'Human Resources',
      'Recruiting & Staffing',
      'Business Services',
      'Outsourcing'
    ]
  },
  {
    name: 'Government & Public Sector',
    subIndustries: [
      'Government',
      'Public Administration',
      'Defense',
      'Public Safety',
      'Nonprofit & NGOs',
      'International Organizations'
    ]
  },
  {
    name: 'Environmental Science',
    subIndustries: [
      'Environmental Services',
      'Sustainability',
      'Waste Management',
      'Recycling',
      'Scientific Research'
    ]
  },
  {
    name: 'Other',
    subIndustries: [
      'Fashion',
      'Beauty & Cosmetics',
      'Sports',
      'Fitness & Wellness',
      'Events',
      'Security Services',
      'Household Services',
      'Mining',
      'Marine Industry'
    ]
  }
];

export const INDUSTRY_NAMES = INDUSTRIES.map((industry) => industry.name);

export function getSubIndustries(industryName) {
  return INDUSTRIES.find((industry) => industry.name === industryName)?.subIndustries || [];
}

export function getIndustryForSubIndustry(subIndustryName) {
  return INDUSTRIES.find((industry) => industry.subIndustries.includes(subIndustryName))?.name;
}
