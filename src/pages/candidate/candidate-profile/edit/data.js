import { INDUSTRY_NAMES, getSubIndustries } from 'utils/industries';
import { ISSUER_NAMES, CERTIFICATION_NAMES, getCertificationsFor, findIssuer, findCertificationIssuer } from 'utils/certifications';
import { LANGUAGE_NAMES, LEVELS, LEVEL_NOTES } from 'utils/languages';
import { SKILL_NAMES } from 'utils/skills';

let uid = 0;
export function createId() {
  uid += 1;
  return `e${uid}`;
}

export const MODE_OPTS = ['Hybrid', 'On-site', 'Remote'];
export const TYPE_OPTS = ['Full-time', 'Part-time', 'Contract', 'Freelance'];
export const SALARY_PERIODS = ['month', 'week', 'year'];
export const NOTICE_UNITS = ['month', 'week', 'day'];
export const EDUCATION_LEVELS = ['High School', 'Associate Degree', "Bachelor's Degree", "Master's Degree", 'PhD'];
export const AWARD_LEVELS = ['International', 'National', 'Regional', 'Company'];
export const ORGANIZATION_TYPES = ['Volunteer', 'Professional', 'Student', 'Community', 'Non-profit'];
export const PUBLICATION_TYPES = ['Article', 'Research Paper', 'Book', 'Blog', 'Whitepaper', 'Patent'];
export const WEBSITE_TYPES = ['Portfolio', 'Blog', 'GitHub Pages', 'Company', 'Other'];

// Curated Lucide icon names (see src/components/AppIcon.jsx) for the Interests
// icon picker, grouped by category so IconPicker can render them under sticky
// headers in a scrollable list rather than one flat undifferentiated grid.
export const INTEREST_ICON_GROUPS = [
  {
    category: 'Sports & Fitness',
    icons: [
      'Dumbbell', 'Bike', 'Trophy', 'Target', 'Waves', 'Mountain', 'Footprints', 'Medal', 'Volleyball', 'Swords',
      'Timer', 'Activity', 'TrendingUp', 'Flag', 'Goal', 'Award', 'Weight', 'PersonStanding', 'Zap', 'Flame',
      'CircleDot', 'Crosshair', 'MountainSnow',
    ],
  },
  {
    category: 'Music',
    icons: [
      'Music', 'Music2', 'Guitar', 'Piano', 'Mic', 'Headphones', 'Drum', 'Radio', 'Disc3', 'MicVocal',
      'AudioLines', 'AudioWaveform', 'Speaker', 'Volume2', 'Voicemail', 'Music3', 'Music4', 'SlidersHorizontal',
    ],
  },
  {
    category: 'Arts & Crafts',
    icons: [
      'Paintbrush', 'PaintBucket', 'Palette', 'PenTool', 'Scissors', 'Sparkles', 'Shapes',
      'Pencil', 'PencilRuler', 'Ruler', 'Eraser', 'Frame', 'Image', 'ImagePlus', 'Wand2', 'Wand',
      'Origami', 'Type', 'Highlighter', 'SwatchBook', 'Layers', 'Layout',
    ],
  },
  {
    category: 'Gaming',
    icons: [
      'Gamepad2', 'Dice5', 'Dice6', 'Puzzle', 'Joystick', 'Spade', 'Club',
      'Crown', 'Castle', 'Bomb', 'Sword', 'Dice1', 'Dice2', 'Dice3', 'Dice4', 'Diamond', 'Hexagon', 'Boxes',
      'PocketKnife', 'Gamepad',
    ],
  },
  {
    category: 'Reading & Learning',
    icons: [
      'BookOpen', 'Book', 'Newspaper', 'GraduationCap', 'Library', 'PenLine', 'NotebookPen', 'BookMarked',
      'ScrollText', 'FileText', 'Notebook', 'School', 'Quote', 'BookA', 'BookText', 'BookCopy', 'Album',
      'LibraryBig', 'Atom', 'FlaskConical', 'Beaker', 'TestTube',
    ],
  },
  {
    category: 'Travel & Outdoors',
    icons: [
      'Plane', 'MapPin', 'Compass', 'Globe', 'Tent', 'Backpack', 'Ship', 'Car', 'TrainFront', 'Caravan', 'Sailboat', 'Bus',
      'Luggage', 'MapPinned', 'Map', 'Route', 'Signpost', 'LandPlot', 'Sunrise', 'Sunset', 'CableCar', 'Truck',
      'ParkingCircle', 'Milestone', 'Navigation',
    ],
  },
  {
    category: 'Food & Drink',
    icons: [
      'Utensils', 'Coffee', 'Wine', 'Pizza', 'IceCreamCone', 'ChefHat', 'Cake', 'Beer', 'Martini', 'Croissant', 'Soup', 'Cherry',
      'Sandwich', 'Salad', 'Beef', 'Egg', 'EggFried', 'Grape', 'Apple', 'Banana', 'CupSoda', 'GlassWater', 'Milk',
      'Popcorn', 'Donut', 'Candy', 'CandyCane', 'Drumstick', 'Ham',
    ],
  },
  {
    category: 'Nature & Animals',
    icons: [
      'TreePine', 'Flower2', 'PawPrint', 'Bird', 'Fish', 'Leaf', 'Squirrel', 'Rabbit', 'Cat', 'Dog', 'Turtle', 'Snail', 'Bug', 'Sun',
      'Flower', 'Trees', 'CloudSun', 'CloudRain', 'CloudSnow', 'CloudMoon', 'Rainbow', 'Shell', 'Worm', 'Feather',
      'Cloud', 'Droplets',
    ],
  },
  {
    category: 'Tech & Media',
    icons: [
      'Cpu', 'Code', 'Rocket', 'Camera', 'Film', 'Tv', 'Smartphone', 'Laptop', 'Satellite', 'Telescope',
      'Headset', 'Webcam', 'MonitorPlay', 'Clapperboard', 'Video', 'PlayCircle', 'Bluetooth', 'Wifi', 'Router',
      'HardDrive', 'Server', 'Database', 'Terminal', 'Binary', 'Bot',
    ],
  },
  {
    category: 'Wellness & Mind',
    icons: [
      'HeartPulse', 'Brain', 'Moon', 'Wind', 'Umbrella', 'Snowflake', 'Heart',
      'Bath', 'ShowerHead', 'Bed', 'Stethoscope', 'Pill', 'Syringe', 'Thermometer', 'Battery', 'BatteryCharging',
      'SunMedium', 'CloudDrizzle',
    ],
  },
  {
    category: 'Collecting & Other',
    icons: [
      'Coins', 'Gem', 'Stamp', 'Watch', 'Glasses', 'Ticket', 'Gift', 'Star', 'Shirt', 'Hammer', 'Wrench', 'Sprout', 'Anchor',
      'Key', 'Lock', 'PiggyBank', 'Wallet', 'CreditCard', 'ShoppingBag', 'Package', 'Box', 'Archive', 'Tags', 'Tag',
    ],
  },
];

// `iso` is the lowercase country code used by the `flag-icons` package
// (className `fi fi-${iso}`) - emoji flags don't render as icons on Windows.
// Some dial codes are shared by more than one country/territory (e.g. +1 across
// North America, +7 for Russia/Kazakhstan, +44 for UK/Isle of Man/Guernsey/Jersey) -
// each is still listed separately since the flag and country name differ.
export const DEFAULT_PHONE_CODE = '+381';
export const PHONE_CODES = [
  { code: '+93', iso: 'af', country: 'Afghanistan' },
  { code: '+355', iso: 'al', country: 'Albania' },
  { code: '+213', iso: 'dz', country: 'Algeria' },
  { code: '+1 684', iso: 'as', country: 'American Samoa' },
  { code: '+376', iso: 'ad', country: 'Andorra' },
  { code: '+244', iso: 'ao', country: 'Angola' },
  { code: '+1 264', iso: 'ai', country: 'Anguilla' },
  { code: '+1 268', iso: 'ag', country: 'Antigua and Barbuda' },
  { code: '+54', iso: 'ar', country: 'Argentina' },
  { code: '+374', iso: 'am', country: 'Armenia' },
  { code: '+297', iso: 'aw', country: 'Aruba' },
  { code: '+61', iso: 'au', country: 'Australia' },
  { code: '+43', iso: 'at', country: 'Austria' },
  { code: '+994', iso: 'az', country: 'Azerbaijan' },
  { code: '+1 242', iso: 'bs', country: 'Bahamas' },
  { code: '+973', iso: 'bh', country: 'Bahrain' },
  { code: '+880', iso: 'bd', country: 'Bangladesh' },
  { code: '+1 246', iso: 'bb', country: 'Barbados' },
  { code: '+375', iso: 'by', country: 'Belarus' },
  { code: '+32', iso: 'be', country: 'Belgium' },
  { code: '+501', iso: 'bz', country: 'Belize' },
  { code: '+229', iso: 'bj', country: 'Benin' },
  { code: '+1 441', iso: 'bm', country: 'Bermuda' },
  { code: '+975', iso: 'bt', country: 'Bhutan' },
  { code: '+591', iso: 'bo', country: 'Bolivia' },
  { code: '+387', iso: 'ba', country: 'Bosnia and Herzegovina' },
  { code: '+267', iso: 'bw', country: 'Botswana' },
  { code: '+55', iso: 'br', country: 'Brazil' },
  { code: '+1 284', iso: 'vg', country: 'British Virgin Islands' },
  { code: '+673', iso: 'bn', country: 'Brunei' },
  { code: '+359', iso: 'bg', country: 'Bulgaria' },
  { code: '+226', iso: 'bf', country: 'Burkina Faso' },
  { code: '+257', iso: 'bi', country: 'Burundi' },
  { code: '+855', iso: 'kh', country: 'Cambodia' },
  { code: '+237', iso: 'cm', country: 'Cameroon' },
  { code: '+1', iso: 'ca', country: 'Canada' },
  { code: '+238', iso: 'cv', country: 'Cape Verde' },
  { code: '+1 345', iso: 'ky', country: 'Cayman Islands' },
  { code: '+236', iso: 'cf', country: 'Central African Republic' },
  { code: '+235', iso: 'td', country: 'Chad' },
  { code: '+56', iso: 'cl', country: 'Chile' },
  { code: '+86', iso: 'cn', country: 'China' },
  { code: '+57', iso: 'co', country: 'Colombia' },
  { code: '+269', iso: 'km', country: 'Comoros' },
  { code: '+682', iso: 'ck', country: 'Cook Islands' },
  { code: '+506', iso: 'cr', country: 'Costa Rica' },
  { code: '+385', iso: 'hr', country: 'Croatia' },
  { code: '+53', iso: 'cu', country: 'Cuba' },
  { code: '+599', iso: 'cw', country: 'Curaçao' },
  { code: '+357', iso: 'cy', country: 'Cyprus' },
  { code: '+420', iso: 'cz', country: 'Czechia' },
  { code: '+243', iso: 'cd', country: 'DR Congo' },
  { code: '+45', iso: 'dk', country: 'Denmark' },
  { code: '+253', iso: 'dj', country: 'Djibouti' },
  { code: '+1 767', iso: 'dm', country: 'Dominica' },
  { code: '+1 809', iso: 'do', country: 'Dominican Republic' },
  { code: '+593', iso: 'ec', country: 'Ecuador' },
  { code: '+20', iso: 'eg', country: 'Egypt' },
  { code: '+503', iso: 'sv', country: 'El Salvador' },
  { code: '+240', iso: 'gq', country: 'Equatorial Guinea' },
  { code: '+291', iso: 'er', country: 'Eritrea' },
  { code: '+372', iso: 'ee', country: 'Estonia' },
  { code: '+268', iso: 'sz', country: 'Eswatini' },
  { code: '+251', iso: 'et', country: 'Ethiopia' },
  { code: '+500', iso: 'fk', country: 'Falkland Islands' },
  { code: '+298', iso: 'fo', country: 'Faroe Islands' },
  { code: '+679', iso: 'fj', country: 'Fiji' },
  { code: '+358', iso: 'fi', country: 'Finland' },
  { code: '+33', iso: 'fr', country: 'France' },
  { code: '+594', iso: 'gf', country: 'French Guiana' },
  { code: '+689', iso: 'pf', country: 'French Polynesia' },
  { code: '+241', iso: 'ga', country: 'Gabon' },
  { code: '+220', iso: 'gm', country: 'Gambia' },
  { code: '+995', iso: 'ge', country: 'Georgia' },
  { code: '+49', iso: 'de', country: 'Germany' },
  { code: '+233', iso: 'gh', country: 'Ghana' },
  { code: '+350', iso: 'gi', country: 'Gibraltar' },
  { code: '+30', iso: 'gr', country: 'Greece' },
  { code: '+299', iso: 'gl', country: 'Greenland' },
  { code: '+1 473', iso: 'gd', country: 'Grenada' },
  { code: '+590', iso: 'gp', country: 'Guadeloupe' },
  { code: '+1 671', iso: 'gu', country: 'Guam' },
  { code: '+502', iso: 'gt', country: 'Guatemala' },
  { code: '+44', iso: 'gg', country: 'Guernsey' },
  { code: '+224', iso: 'gn', country: 'Guinea' },
  { code: '+245', iso: 'gw', country: 'Guinea-Bissau' },
  { code: '+592', iso: 'gy', country: 'Guyana' },
  { code: '+509', iso: 'ht', country: 'Haiti' },
  { code: '+504', iso: 'hn', country: 'Honduras' },
  { code: '+852', iso: 'hk', country: 'Hong Kong' },
  { code: '+36', iso: 'hu', country: 'Hungary' },
  { code: '+354', iso: 'is', country: 'Iceland' },
  { code: '+91', iso: 'in', country: 'India' },
  { code: '+62', iso: 'id', country: 'Indonesia' },
  { code: '+98', iso: 'ir', country: 'Iran' },
  { code: '+964', iso: 'iq', country: 'Iraq' },
  { code: '+353', iso: 'ie', country: 'Ireland' },
  { code: '+44', iso: 'im', country: 'Isle of Man' },
  { code: '+972', iso: 'il', country: 'Israel' },
  { code: '+39', iso: 'it', country: 'Italy' },
  { code: '+225', iso: 'ci', country: 'Ivory Coast' },
  { code: '+1 876', iso: 'jm', country: 'Jamaica' },
  { code: '+81', iso: 'jp', country: 'Japan' },
  { code: '+44', iso: 'je', country: 'Jersey' },
  { code: '+962', iso: 'jo', country: 'Jordan' },
  { code: '+7', iso: 'kz', country: 'Kazakhstan' },
  { code: '+254', iso: 'ke', country: 'Kenya' },
  { code: '+686', iso: 'ki', country: 'Kiribati' },
  { code: '+383', iso: 'xk', country: 'Kosovo' },
  { code: '+965', iso: 'kw', country: 'Kuwait' },
  { code: '+996', iso: 'kg', country: 'Kyrgyzstan' },
  { code: '+856', iso: 'la', country: 'Laos' },
  { code: '+371', iso: 'lv', country: 'Latvia' },
  { code: '+961', iso: 'lb', country: 'Lebanon' },
  { code: '+266', iso: 'ls', country: 'Lesotho' },
  { code: '+231', iso: 'lr', country: 'Liberia' },
  { code: '+218', iso: 'ly', country: 'Libya' },
  { code: '+423', iso: 'li', country: 'Liechtenstein' },
  { code: '+370', iso: 'lt', country: 'Lithuania' },
  { code: '+352', iso: 'lu', country: 'Luxembourg' },
  { code: '+853', iso: 'mo', country: 'Macau' },
  { code: '+261', iso: 'mg', country: 'Madagascar' },
  { code: '+265', iso: 'mw', country: 'Malawi' },
  { code: '+60', iso: 'my', country: 'Malaysia' },
  { code: '+960', iso: 'mv', country: 'Maldives' },
  { code: '+223', iso: 'ml', country: 'Mali' },
  { code: '+356', iso: 'mt', country: 'Malta' },
  { code: '+692', iso: 'mh', country: 'Marshall Islands' },
  { code: '+596', iso: 'mq', country: 'Martinique' },
  { code: '+222', iso: 'mr', country: 'Mauritania' },
  { code: '+230', iso: 'mu', country: 'Mauritius' },
  { code: '+262', iso: 'yt', country: 'Mayotte' },
  { code: '+52', iso: 'mx', country: 'Mexico' },
  { code: '+691', iso: 'fm', country: 'Micronesia' },
  { code: '+373', iso: 'md', country: 'Moldova' },
  { code: '+377', iso: 'mc', country: 'Monaco' },
  { code: '+976', iso: 'mn', country: 'Mongolia' },
  { code: '+382', iso: 'me', country: 'Montenegro' },
  { code: '+1 664', iso: 'ms', country: 'Montserrat' },
  { code: '+212', iso: 'ma', country: 'Morocco' },
  { code: '+258', iso: 'mz', country: 'Mozambique' },
  { code: '+95', iso: 'mm', country: 'Myanmar' },
  { code: '+264', iso: 'na', country: 'Namibia' },
  { code: '+674', iso: 'nr', country: 'Nauru' },
  { code: '+977', iso: 'np', country: 'Nepal' },
  { code: '+31', iso: 'nl', country: 'Netherlands' },
  { code: '+687', iso: 'nc', country: 'New Caledonia' },
  { code: '+64', iso: 'nz', country: 'New Zealand' },
  { code: '+505', iso: 'ni', country: 'Nicaragua' },
  { code: '+227', iso: 'ne', country: 'Niger' },
  { code: '+234', iso: 'ng', country: 'Nigeria' },
  { code: '+683', iso: 'nu', country: 'Niue' },
  { code: '+1 670', iso: 'mp', country: 'Northern Mariana Islands' },
  { code: '+850', iso: 'kp', country: 'North Korea' },
  { code: '+389', iso: 'mk', country: 'North Macedonia' },
  { code: '+47', iso: 'no', country: 'Norway' },
  { code: '+968', iso: 'om', country: 'Oman' },
  { code: '+92', iso: 'pk', country: 'Pakistan' },
  { code: '+680', iso: 'pw', country: 'Palau' },
  { code: '+970', iso: 'ps', country: 'Palestine' },
  { code: '+507', iso: 'pa', country: 'Panama' },
  { code: '+675', iso: 'pg', country: 'Papua New Guinea' },
  { code: '+595', iso: 'py', country: 'Paraguay' },
  { code: '+51', iso: 'pe', country: 'Peru' },
  { code: '+63', iso: 'ph', country: 'Philippines' },
  { code: '+48', iso: 'pl', country: 'Poland' },
  { code: '+351', iso: 'pt', country: 'Portugal' },
  { code: '+1 787', iso: 'pr', country: 'Puerto Rico' },
  { code: '+974', iso: 'qa', country: 'Qatar' },
  { code: '+262', iso: 're', country: 'Réunion' },
  { code: '+40', iso: 'ro', country: 'Romania' },
  { code: '+7', iso: 'ru', country: 'Russia' },
  { code: '+250', iso: 'rw', country: 'Rwanda' },
  { code: '+1 869', iso: 'kn', country: 'Saint Kitts and Nevis' },
  { code: '+1 758', iso: 'lc', country: 'Saint Lucia' },
  { code: '+1 784', iso: 'vc', country: 'Saint Vincent and the Grenadines' },
  { code: '+685', iso: 'ws', country: 'Samoa' },
  { code: '+378', iso: 'sm', country: 'San Marino' },
  { code: '+239', iso: 'st', country: 'São Tomé and Príncipe' },
  { code: '+966', iso: 'sa', country: 'Saudi Arabia' },
  { code: '+221', iso: 'sn', country: 'Senegal' },
  { code: '+381', iso: 'rs', country: 'Serbia' },
  { code: '+248', iso: 'sc', country: 'Seychelles' },
  { code: '+232', iso: 'sl', country: 'Sierra Leone' },
  { code: '+65', iso: 'sg', country: 'Singapore' },
  { code: '+1 721', iso: 'sx', country: 'Sint Maarten' },
  { code: '+421', iso: 'sk', country: 'Slovakia' },
  { code: '+386', iso: 'si', country: 'Slovenia' },
  { code: '+677', iso: 'sb', country: 'Solomon Islands' },
  { code: '+252', iso: 'so', country: 'Somalia' },
  { code: '+27', iso: 'za', country: 'South Africa' },
  { code: '+82', iso: 'kr', country: 'South Korea' },
  { code: '+211', iso: 'ss', country: 'South Sudan' },
  { code: '+34', iso: 'es', country: 'Spain' },
  { code: '+94', iso: 'lk', country: 'Sri Lanka' },
  { code: '+249', iso: 'sd', country: 'Sudan' },
  { code: '+597', iso: 'sr', country: 'Suriname' },
  { code: '+46', iso: 'se', country: 'Sweden' },
  { code: '+41', iso: 'ch', country: 'Switzerland' },
  { code: '+963', iso: 'sy', country: 'Syria' },
  { code: '+886', iso: 'tw', country: 'Taiwan' },
  { code: '+992', iso: 'tj', country: 'Tajikistan' },
  { code: '+255', iso: 'tz', country: 'Tanzania' },
  { code: '+66', iso: 'th', country: 'Thailand' },
  { code: '+670', iso: 'tl', country: 'Timor-Leste' },
  { code: '+228', iso: 'tg', country: 'Togo' },
  { code: '+676', iso: 'to', country: 'Tonga' },
  { code: '+1 868', iso: 'tt', country: 'Trinidad and Tobago' },
  { code: '+216', iso: 'tn', country: 'Tunisia' },
  { code: '+90', iso: 'tr', country: 'Turkey' },
  { code: '+993', iso: 'tm', country: 'Turkmenistan' },
  { code: '+1 649', iso: 'tc', country: 'Turks and Caicos Islands' },
  { code: '+688', iso: 'tv', country: 'Tuvalu' },
  { code: '+256', iso: 'ug', country: 'Uganda' },
  { code: '+380', iso: 'ua', country: 'Ukraine' },
  { code: '+971', iso: 'ae', country: 'United Arab Emirates' },
  { code: '+44', iso: 'gb', country: 'United Kingdom' },
  { code: '+1', iso: 'us', country: 'United States' },
  { code: '+598', iso: 'uy', country: 'Uruguay' },
  { code: '+998', iso: 'uz', country: 'Uzbekistan' },
  { code: '+678', iso: 'vu', country: 'Vanuatu' },
  { code: '+39', iso: 'va', country: 'Vatican City' },
  { code: '+58', iso: 've', country: 'Venezuela' },
  { code: '+84', iso: 'vn', country: 'Vietnam' },
  { code: '+1 340', iso: 'vi', country: 'US Virgin Islands' },
  { code: '+681', iso: 'wf', country: 'Wallis and Futuna' },
  { code: '+212', iso: 'eh', country: 'Western Sahara' },
  { code: '+967', iso: 'ye', country: 'Yemen' },
  { code: '+260', iso: 'zm', country: 'Zambia' },
  { code: '+263', iso: 'zw', country: 'Zimbabwe' },
];

export const STATUS = [
  { k: 'active', cls: 'green', t: 'Actively looking', d: 'Open to all companies' },
  { k: 'open', cls: 'amber', t: 'Open to offers', d: 'Employed, but listening' },
  { k: 'off', cls: 'grey', t: 'Not interested', d: 'Hidden from search' },
];
export function statusMeta(k) {
  return STATUS.find((s) => s.k === k) || STATUS[1];
}

export function initials(name) {
  return (
    (name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase() || '?'
  );
}

export function fmtNum(v) {
  const n = String(v).replace(/[^\d]/g, '');
  if (!n) return String(v);
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function srPlural(num, unit) {
  const n = Math.abs(parseInt(num, 10)) || 0;
  return n === 1 ? unit : `${unit}s`;
}

// ---------- FIELD SCHEMAS (for list sections) ----------
export const SCHEMAS = {
  experience: {
    noun: 'entry',
    blank: () => ({
      id: createId(),
      role: '',
      company: '',
      industry: '',
      subIndustry: '',
      start: '',
      end: '',
      location: '',
      desc: '',
      tags: [],
      visible: true,
    }),
    summary: (e) => ({
      title: e.role || 'New position',
      companyText: e.company || null,
      sub: [e.start && `${e.start} – ${e.end || '…'}`, e.location].filter(Boolean).join('  ·  '),
    }),
    // Industry / subindustry are search metadata only - never shown on the CV.
    fields: [
      { k: 'role', label: 'Position', t: 'text', ph: 'e.g. Product Designer', required: true },
      { k: 'company', label: 'Employer', t: 'text', ph: 'e.g. Nordwave', required: true },
      { k: 'industry', label: 'Industry', t: 'select', ph: 'Select industry', opts: INDUSTRY_NAMES, required: true, resets: ['subIndustry'] },
      { k: 'subIndustry', label: 'Subindustry', t: 'select', ph: 'Select subindustry', opts: (entry) => getSubIndustries(entry?.industry), required: true },
      { k: 'start', label: 'Start', t: 'text', ph: 'MM/YYYY', half: 1, required: true },
      { k: 'end', label: 'End', t: 'text', ph: 'MM/YYYY or Present', half: 1, required: true },
      { k: 'location', label: 'Location', t: 'text', ph: 'City, country', full: 1, required: true },
      { k: 'desc', label: 'Description', t: 'textarea', ph: 'What you did, outcomes, numbers…', full: 1 },
      { k: 'tags', label: 'Skills / tools', t: 'tags', full: 1 },
    ],
  },
  education: {
    noun: 'entry',
    blank: () => ({ id: createId(), degree: '', school: '', level: '', start: '', end: '', location: '', desc: '', visible: true }),
    summary: (e) => ({
      title: e.degree || 'New degree',
      sub: [e.school, e.start && `${e.start} – ${e.end || '…'}`].filter(Boolean).join('  ·  '),
    }),
    // `level` (education level) is edit-only metadata, like industry/subIndustry
    // on experience entries - CvPreview reads degree/school/location/desc/start/end
    // explicitly, so it never shows on the CV.
    fields: [
      { k: 'degree', label: 'Major / degree', t: 'text', ph: 'e.g. BFA, Graphic Design', required: true, full: 1 },
      { k: 'school', label: 'Institution', t: 'text', ph: 'e.g. University of the Arts', required: true },
      { k: 'level', label: 'Education Level', t: 'select', ph: 'Select level', opts: EDUCATION_LEVELS, required: true },
      { k: 'start', label: 'Start', t: 'text', ph: 'YYYY', half: 1 },
      { k: 'end', label: 'End', t: 'text', ph: 'YYYY', half: 1 },
      { k: 'location', label: 'Location', t: 'text', ph: 'City', full: 1, required: true },
      { k: 'desc', label: 'Additional', t: 'textarea', ph: 'Focus, notes…', full: 1 },
    ],
  },
  certificates: {
    noun: 'certificate',
    blank: () => ({
      id: createId(),
      name: '',
      issuer: '',
      issueDate: '',
      expirationDate: '',
      doesNotExpire: false,
      credentialId: '',
      credentialUrl: '',
      visible: true,
    }),
    summary: (e) => ({
      title: e.name || 'New certificate',
      sub: [e.issuer, e.doesNotExpire ? 'No expiration' : e.issueDate].filter(Boolean).join('  ·  '),
    }),
    fields: [
      {
        k: 'name',
        label: 'Certification Name',
        t: 'combobox',
        ph: 'Type or choose from list',
        opts: (entry) => {
          const issuer = findIssuer(entry?.issuer);
          return issuer ? [...new Set(getCertificationsFor({ issuer }).map((c) => c.name))] : CERTIFICATION_NAMES;
        },
        // Picking a known certification auto-fills its issuer.
        autoFill: (newValue) => {
          const issuer = findCertificationIssuer(newValue);
          return issuer ? { issuer } : {};
        },
        required: true,
        full: 1,
      },
      { k: 'issuer', label: 'Issuing Organization', t: 'combobox', ph: 'Type or choose from list', opts: ISSUER_NAMES, required: true, full: 1 },
      { k: 'issueDate', label: 'Issue Date', t: 'text', ph: 'MM/YYYY', half: 1, required: true },
      { k: 'expirationDate', label: 'Expiration Date', t: 'text', ph: 'MM/YYYY', half: 1, disabledWhen: (entry) => entry.doesNotExpire },
      { k: 'doesNotExpire', label: 'Does not expire', t: 'checkbox', full: 1, resets: ['expirationDate'] },
      { k: 'credentialId', label: 'Credential ID', t: 'text', ph: 'e.g. ABC-123456', half: 1 },
      { k: 'credentialUrl', label: 'Credential URL', t: 'link', ph: 'https://…', half: 1 },
    ],
  },
  generic: {
    noun: 'entry',
    blank: () => ({ id: createId(), title: '', subtitle: '', start: '', end: '', location: '', desc: '', tags: [], visible: true }),
    summary: (e) => ({
      title: e.title || 'New entry',
      sub: [e.subtitle, e.start && `${e.start} – ${e.end || '…'}`, e.location].filter(Boolean).join('  ·  '),
    }),
    fields: [
      { k: 'title', label: 'Title', t: 'text', ph: 'Enter title' },
      { k: 'subtitle', label: 'Subtitle', t: 'text', ph: 'Enter subtitle' },
      { k: 'start', label: 'Start', t: 'text', ph: 'MM/YYYY', half: 1 },
      { k: 'end', label: 'End', t: 'text', ph: 'MM/YYYY', half: 1 },
      { k: 'location', label: 'Location', t: 'text', ph: 'City, country', full: 1 },
      { k: 'desc', label: 'Description', t: 'textarea', ph: 'Description…', full: 1 },
      { k: 'tags', label: 'Tags', t: 'tags', full: 1 },
    ],
  },
  interests: {
    noun: 'interest',
    blank: () => ({ id: createId(), icon: '', name: '', desc: '', visible: true }),
    summary: (e) => ({
      title: e.name || 'New interest',
      sub: '',
      icon: e.icon || undefined,
    }),
    fields: [
      { k: 'icon', label: 'Icon', t: 'icon', opts: INTEREST_ICON_GROUPS, half: 1 },
      { k: 'name', label: 'Interest Name', t: 'text', ph: 'e.g. Rock climbing', required: true, half: 1 },
      { k: 'desc', label: 'Short Description', t: 'textarea', ph: 'A sentence or two…', full: 1 },
    ],
  },
  projects: {
    noun: 'project',
    blank: () => ({
      id: createId(),
      name: '',
      role: '',
      desc: '',
      challenge: '',
      solution: '',
      impact: '',
      technologies: [],
      skills: [],
      start: '',
      end: '',
      currentlyWorking: false,
      githubUrl: '',
      visible: true,
    }),
    summary: (e) => ({
      title: e.name || 'New project',
      sub: [e.role, e.start && `${e.start} – ${e.currentlyWorking ? 'Present' : (e.end || '…')}`].filter(Boolean).join('  ·  '),
    }),
    fields: [
      { k: 'name', label: 'Project Name', t: 'text', ph: 'e.g. Design system rebuild', required: true, full: 1 },
      { k: 'start', label: 'Start', t: 'text', ph: 'MM/YYYY', half: 1 },
      { k: 'end', label: 'End', t: 'text', ph: 'MM/YYYY', half: 1, disabledWhen: (entry) => entry.currentlyWorking },
      { k: 'currentlyWorking', label: 'Currently working on this', t: 'checkbox', full: 1, resets: ['end'] },
      {
        k: 'narrative',
        t: 'tabs',
        full: 1,
        tabs: [
          { k: 'desc', label: 'Short Description', ph: 'A brief overview…' },
          { k: 'challenge', label: 'Challenge', ph: 'What problem were you solving?' },
          { k: 'solution', label: 'Solution', ph: 'What did you build or do?' },
          { k: 'impact', label: 'Impact / Results', ph: 'Outcomes, metrics, results…' },
        ],
      },
      { k: 'role', label: 'Role', t: 'text', ph: 'e.g. Lead Designer', half: 1 },
      { k: 'githubUrl', label: 'GitHub URL', t: 'link', ph: 'https://github.com/…', half: 1 },
      { k: 'technologies', label: 'Technologies Used', t: 'tags', full: 1 },
      { k: 'skills', label: 'Skills', t: 'tags', full: 1 },
    ],
  },
  courses: {
    noun: 'course',
    blank: () => ({
      id: createId(),
      name: '',
      provider: '',
      category: '',
      completionDate: '',
      durationHours: '',
      certificateId: '',
      certificateUrl: '',
      skills: [],
      desc: '',
      visible: true,
    }),
    summary: (e) => ({
      title: e.name || 'New course',
      sub: [e.provider, e.completionDate].filter(Boolean).join('  ·  '),
    }),
    fields: [
      { k: 'name', label: 'Course Name', t: 'text', required: true, full: 1 },
      { k: 'provider', label: 'Organization / Provider', t: 'text', required: true, half: 1 },
      { k: 'category', label: 'Category', t: 'text', half: 1 },
      { k: 'completionDate', label: 'Completion Date', t: 'text', ph: 'MM/YYYY', half: 1 },
      { k: 'durationHours', label: 'Duration (hours)', t: 'number', half: 1 },
      { k: 'certificateId', label: 'Certificate ID', t: 'text', half: 1 },
      { k: 'certificateUrl', label: 'Certificate URL', t: 'link', half: 1 },
      { k: 'skills', label: 'Skills Learned', t: 'tags', full: 1 },
      { k: 'desc', label: 'Description', t: 'textarea', full: 1 },
    ],
  },
  awards: {
    noun: 'award',
    blank: () => ({ id: createId(), name: '', organization: '', date: '', level: '', desc: '', link: '', visible: true }),
    summary: (e) => ({
      title: e.name || 'New award',
      sub: [e.organization, e.level, e.date].filter(Boolean).join('  ·  '),
    }),
    fields: [
      { k: 'name', label: 'Award Name', t: 'text', required: true, full: 1 },
      { k: 'organization', label: 'Organization', t: 'text', half: 1 },
      { k: 'date', label: 'Date', t: 'text', ph: 'MM/YYYY', half: 1 },
      { k: 'level', label: 'Award Level', t: 'select', opts: AWARD_LEVELS, half: 1 },
      { k: 'link', label: 'Related Link', t: 'link', half: 1 },
      { k: 'desc', label: 'Description', t: 'textarea', full: 1 },
    ],
  },
  organisations: {
    noun: 'entry',
    blank: () => ({
      id: createId(),
      name: '',
      role: '',
      type: '',
      start: '',
      end: '',
      currentlyActive: false,
      desc: '',
      achievements: '',
      visible: true,
    }),
    summary: (e) => ({
      title: e.name || 'New organization',
      sub: [e.role, e.type].filter(Boolean).join('  ·  '),
    }),
    fields: [
      { k: 'name', label: 'Organization Name', t: 'text', required: true, full: 1 },
      { k: 'role', label: 'Role', t: 'text', half: 1 },
      { k: 'type', label: 'Organization Type', t: 'select', opts: ORGANIZATION_TYPES, half: 1 },
      { k: 'start', label: 'Start', t: 'text', ph: 'MM/YYYY', half: 1 },
      { k: 'end', label: 'End', t: 'text', ph: 'MM/YYYY', half: 1, disabledWhen: (entry) => entry.currentlyActive },
      { k: 'currentlyActive', label: 'Currently active', t: 'checkbox', full: 1, resets: ['end'] },
      {
        k: 'narrative',
        t: 'tabs',
        full: 1,
        tabs: [
          { k: 'desc', label: 'Description', ph: 'What does this organization do, and what was your involvement?' },
          { k: 'achievements', label: 'Achievements', ph: 'Notable accomplishments, milestones, recognitions…' },
        ],
      },
    ],
  },
  publications: {
    noun: 'publication',
    blank: () => ({
      id: createId(),
      title: '',
      type: '',
      publisher: '',
      date: '',
      coAuthors: [],
      doi: '',
      url: '',
      desc: '',
      visible: true,
    }),
    summary: (e) => ({
      title: e.title || 'New publication',
      sub: [e.type, e.publisher, e.date].filter(Boolean).join('  ·  '),
    }),
    fields: [
      { k: 'title', label: 'Title', t: 'text', required: true, full: 1 },
      { k: 'type', label: 'Publication Type', t: 'select', opts: PUBLICATION_TYPES, half: 1 },
      { k: 'publisher', label: 'Publisher', t: 'text', half: 1 },
      { k: 'date', label: 'Publication Date', t: 'text', ph: 'MM/YYYY', half: 1 },
      { k: 'coAuthors', label: 'Co-authors', t: 'tags', half: 1 },
      { k: 'doi', label: 'DOI', t: 'text', half: 1 },
      { k: 'url', label: 'URL', t: 'link', half: 1 },
      { k: 'desc', label: 'Description', t: 'textarea', full: 1 },
    ],
  },
  website: {
    noun: 'site',
    blank: () => ({ id: createId(), name: '', url: '', type: '', desc: '', featured: false, visible: true }),
    summary: (e) => ({
      title: e.name || 'New website',
      sub: [e.type, e.url].filter(Boolean).join('  ·  '),
    }),
    fields: [
      { k: 'name', label: 'Website Name', t: 'text', required: true, half: 1 },
      { k: 'url', label: 'URL', t: 'link', ph: 'https://…', required: true, half: 1 },
      { k: 'type', label: 'Website Type', t: 'select', opts: WEBSITE_TYPES, half: 1 },
      { k: 'featured', label: 'Featured', t: 'checkbox', half: 1 },
      { k: 'desc', label: 'Short Description', t: 'textarea', full: 1 },
    ],
  },
};

const SKILL_SCHEMA = {
  noun: 'skill',
  blank: () => ({ id: createId(), name: '', visible: true }),
  summary: (e) => ({ title: e.name || 'New skill', sub: '' }),
  fields: [{ k: 'name', label: 'Skill name', t: 'combobox', ph: 'Type or choose from list', opts: SKILL_NAMES, full: 1 }],
};
const LANG_SCHEMA = {
  noun: 'language',
  blank: () => ({ id: createId(), name: '', level: 'B1', note: LEVEL_NOTES.B1, visible: true }),
  summary: (e) => ({ title: e.name || 'New language', sub: [e.level, e.note].filter(Boolean).join('  ·  ') }),
  fields: [
    { k: 'name', label: 'Language', t: 'select', ph: 'Select language', opts: LANGUAGE_NAMES },
    { k: 'level', label: 'Level', t: 'select', opts: LEVELS, autoFill: (value) => ({ note: LEVEL_NOTES[value] ?? '' }) },
    { k: 'note', label: 'Note', t: 'text', full: 1, readOnly: true },
  ],
};

export function schemaOf(sec) {
  if (sec.kind === 'skill') return SKILL_SCHEMA;
  if (sec.kind === 'lang') return LANG_SCHEMA;
  return SCHEMAS[sec.schema] || SCHEMAS.generic;
}

// ---------- ADD-CONTENT CATALOG ----------
export const CATALOG = [
  { type: 'summary', kind: 'text', icon: 'summary', title: 'Summary', desc: 'A brief overview of your strengths, experience, and goals.' },
  { type: 'education', kind: 'list', schema: 'education', icon: 'education', title: 'Education', desc: 'Degrees and schools — major, awards, exchanges.' },
  { type: 'experience', kind: 'list', schema: 'experience', icon: 'experience', title: 'Experience', desc: 'Professional roles and employers, including internships.' },
  { type: 'skills', kind: 'skill', icon: 'skills', title: 'Skills', desc: 'Technical and soft skills that set you apart.' },
  { type: 'languages', kind: 'lang', icon: 'languages', title: 'Languages', desc: 'Languages and proficiency level — your communication range.' },
  { type: 'certificates', kind: 'list', schema: 'certificates', icon: 'certificates', title: 'Certificates', desc: 'Certificates and licenses — issuer and date.' },
  { type: 'interests', kind: 'list', schema: 'interests', icon: 'interests', title: 'Interests', desc: 'Personal interests that support your story.' },
  { type: 'projects', kind: 'list', schema: 'projects', icon: 'projects', title: 'Projects', desc: 'Key projects — challenge, role, and impact.' },
  { type: 'courses', kind: 'list', schema: 'courses', icon: 'courses', title: 'Courses', desc: 'Online or in-person courses and training.' },
  { type: 'awards', kind: 'list', schema: 'awards', icon: 'awards', title: 'Awards', desc: 'Awards and recognition from industry or academia.' },
  { type: 'organisations', kind: 'list', schema: 'organisations', icon: 'orgs', title: 'Organizations', desc: 'Memberships or volunteering and your role.' },
  { type: 'publications', kind: 'list', schema: 'publications', icon: 'pubs', title: 'Publications', desc: 'Articles, papers, or books you have written.' },
  { type: 'website', kind: 'list', schema: 'website', icon: 'web', title: 'Personal website', desc: 'Link and short description of your site or portfolio.' },
  { type: 'custom', kind: 'list', icon: 'custom', title: 'Custom', desc: 'Anything else — choose your own name, icon, and type.' },
];

// ---------- INITIAL STATE ----------
export function createInitialState() {
  const sumId = createId();
  const expId = createId();
  const eduId = createId();
  const skId = createId();
  const lgId = createId();
  const ceId = createId();
  const prefId = createId();
  return {
    basics: {
      name: 'Jovana Kovacevic',
      photo: null,
      role: 'Product Designer',
      years: '5',
      location: 'Belgrade, Serbia',
      email: 'jovana.kovacevic@email.com',
      phoneCode: '+381',
      phone: '64 118 9920',
      linkedin: '/in/jovanak',
      links: [{ id: createId(), label: 'Portfolio', url: 'https://jovana.design' }],
      status: 'open',
      currentEmployer: 'Nordwave',
    },
    sections: [
      {
        id: prefId,
        type: 'preferences',
        kind: 'prefs',
        icon: 'prefs',
        title: 'Work preferences',
        data: { mode: 'Remote', type: 'Full-time', salaryCurrency: 'EUR', salaryAmount: '2000', salaryPeriod: 'month', noticeNum: '2', noticeUnit: 'week', travelReady: false, relocationReady: false },
      },
      {
        id: sumId,
        type: 'summary',
        kind: 'text',
        icon: 'summary',
        title: 'Summary',
        text: 'Product designer with 5 years of experience shaping clean, usable interfaces for fintech and SaaS teams. I love design systems, fast iteration, and decisions backed by user research — not guesswork.',
      },
      {
        id: expId,
        type: 'experience',
        kind: 'list',
        schema: 'experience',
        icon: 'experience',
        title: 'Experience',
        entries: [
          {
            id: createId(),
            role: 'Product Designer',
            company: 'Nordwave',
            start: '2022',
            end: 'Present',
            location: 'Belgrade, Serbia',
            desc: 'Lead designer on the main dashboard. Built and maintained the design system, ran usability testing, and cut new-feature design time by ~40%.',
            tags: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
            visible: true,
          },
          {
            id: createId(),
            role: 'UX Designer',
            company: 'Beacon',
            start: '2020',
            end: '2022',
            location: 'Belgrade, Serbia',
            desc: 'Led end-to-end flows for the mobile app, from research through handoff. Launched an onboarding redesign that lifted activation by 18%.',
            tags: ['Figma', 'Wireframing', 'Mobile UX'],
            visible: true,
          },
          {
            id: createId(),
            role: 'Junior Designer',
            company: 'Forge Labs',
            start: '2019',
            end: '2020',
            location: 'Niš, Serbia',
            desc: 'Supported brand and UI work on web projects. First hands-on experience with component-driven design.',
            tags: ['UI Design', 'Webflow'],
            visible: false,
          },
        ],
      },
      {
        id: eduId,
        type: 'education',
        kind: 'list',
        schema: 'education',
        icon: 'education',
        title: 'Education',
        entries: [
          {
            id: createId(),
            school: 'University of the Arts, Belgrade',
            degree: 'BFA, Graphic Design',
            start: '2015',
            end: '2019',
            location: 'Belgrade',
            desc: 'Visual Communications',
            visible: true,
          },
        ],
      },
      {
        id: skId,
        type: 'skills',
        kind: 'skill',
        icon: 'skills',
        title: 'Skills',
        entries: [
          { id: createId(), name: 'Figma', visible: true },
          { id: createId(), name: 'Prototyping', visible: true },
          { id: createId(), name: 'Design Systems', visible: true },
          { id: createId(), name: 'User Research', visible: true },
          { id: createId(), name: 'Wireframing', visible: true },
          { id: createId(), name: 'HTML / CSS', visible: true },
          { id: createId(), name: 'Accessibility', visible: true },
          { id: createId(), name: 'Usability Testing', visible: true },
        ],
      },
      {
        id: lgId,
        type: 'languages',
        kind: 'lang',
        icon: 'languages',
        title: 'Languages',
        entries: [
          { id: createId(), name: 'Serbian', level: 'Native', note: LEVEL_NOTES.Native, visible: true },
          { id: createId(), name: 'English', level: 'C1', note: LEVEL_NOTES.C1, visible: true },
          { id: createId(), name: 'German', level: 'A2', note: LEVEL_NOTES.A2, visible: true },
        ],
      },
      {
        id: ceId,
        type: 'certificates',
        kind: 'list',
        schema: 'certificates',
        icon: 'certificates',
        title: 'Certificates',
        entries: [
          { id: createId(), name: 'UX Certification', issuer: 'Nielsen Norman Group', issueDate: '2023', doesNotExpire: true, credentialId: '', credentialUrl: '', visible: true },
          { id: createId(), name: 'Google UX Design', issuer: 'Coursera', issueDate: '2021', doesNotExpire: false, expirationDate: '', credentialId: '', credentialUrl: '', visible: true },
        ],
      },
    ],
  };
}

// Seeds a fresh profile from signup form input — unlike createInitialState(),
// section titles are pre-filled but content is blank for the user to complete.
export function createEmptyState({ name = '', role = '', years = '', location = '', email = '', phoneCode = DEFAULT_PHONE_CODE, phone = '' } = {}) {
  return {
    basics: {
      name,
      photo: null,
      role,
      years,
      location,
      email,
      phoneCode,
      phone,
      linkedin: '',
      links: [],
      status: 'open',
      currentEmployer: '',
    },
    sections: [
      {
        id: createId(),
        type: 'preferences',
        kind: 'prefs',
        icon: 'prefs',
        title: 'Work preferences',
        data: { mode: '', type: '', salaryCurrency: 'EUR', salaryAmount: '', salaryPeriod: 'month', noticeNum: '', noticeUnit: 'week', travelReady: false, relocationReady: false },
      },
      { id: createId(), type: 'summary', kind: 'text', icon: 'summary', title: 'Summary', text: '' },
      { id: createId(), type: 'experience', kind: 'list', schema: 'experience', icon: 'experience', title: 'Experience', entries: [] },
      { id: createId(), type: 'education', kind: 'list', schema: 'education', icon: 'education', title: 'Education', entries: [] },
      { id: createId(), type: 'skills', kind: 'skill', icon: 'skills', title: 'Skills', entries: [] },
      { id: createId(), type: 'languages', kind: 'lang', icon: 'languages', title: 'Languages', entries: [] },
      { id: createId(), type: 'certificates', kind: 'list', schema: 'certificates', icon: 'certificates', title: 'Certificates', entries: [] },
    ],
  };
}

export const INITIAL_OPEN_IDS = (state) => {
  const open = { basics: true };
  if (state.sections[1]) open[state.sections[1].id] = true;
  return open;
};
