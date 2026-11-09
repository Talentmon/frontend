// utils/countries.js - the company profile's Country field: the 193 UN member states plus Palestine, no territories.
// Names are spelled as in PHONE_CODES in the candidate profile (candidate-profile/edit/data.js).
export const COUNTRY_NAMES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
  'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
  'Comoros', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'DR Congo', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia',
  'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
  'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Republic of the Congo', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'São Tomé and Príncipe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain',
  'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia',
  'Zimbabwe',
];

export const COUNTRY_OPTIONS = COUNTRY_NAMES.map((name) => ({ value: name, label: name }));

// Other ways people write a country, for reading older "City, country" locations.
// (The candidate_country migration used the same list to split stored profiles.)
export const COUNTRY_ALIASES = {
  uk: 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  britain: 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  wales: 'United Kingdom',
  'northern ireland': 'United Kingdom',
  usa: 'United States',
  'u.s.a.': 'United States',
  us: 'United States',
  'u.s.': 'United States',
  'united states of america': 'United States',
  'czech republic': 'Czechia',
  holland: 'Netherlands',
  'the netherlands': 'Netherlands',
  uae: 'United Arab Emirates',
  bosnia: 'Bosnia and Herzegovina',
  'bosnia & herzegovina': 'Bosnia and Herzegovina',
  bih: 'Bosnia and Herzegovina',
  macedonia: 'North Macedonia',
  'republic of korea': 'South Korea',
  korea: 'South Korea',
  "côte d'ivoire": 'Ivory Coast',
  "cote d'ivoire": 'Ivory Coast',
  srbija: 'Serbia',
  hrvatska: 'Croatia',
  'crna gora': 'Montenegro',
  deutschland: 'Germany'
};

const COUNTRY_BY_KEY = new Map([
  ...COUNTRY_NAMES.map((name) => [name.toLowerCase(), name]),
  ...Object.entries(COUNTRY_ALIASES)
]);

/** The country on the list that `text` names (any case, or a common other name), or ''. */
export const countryFromName = (text = '') => COUNTRY_BY_KEY.get(String(text).trim().toLowerCase()) || '';

/**
 * A candidate's city and country. The country is its own field now; older
 * profiles and CV snapshots kept both in the location ("Belgrade, Serbia"), so
 * a known country after the last comma is read off it.
 */
export function splitLocation(location = '', country = '') {
  const text = String(location || '').trim();
  if (country) return { city: text, country };
  const comma = text.lastIndexOf(',');
  const found = comma >= 0 ? countryFromName(text.slice(comma + 1)) : '';
  return found ? { city: text.slice(0, comma).trim(), country: found } : { city: text, country: '' };
}

/** "City, Country", as the CV shows it. */
export const formatLocation = (city, country) => [city, country].filter(Boolean).join(', ');
