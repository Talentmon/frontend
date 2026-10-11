// Every IANA time zone the browser knows, labelled "City (UTC±h)" and sorted by
// offset. Offsets are read for today's date, so they follow daylight saving.
const FALLBACK_ZONES = ['Europe/Belgrade', 'Europe/London', 'Europe/Berlin', 'America/New_York'];

// Chrome/ICU still list some zones under their old names — show the current city name so search finds it.
const CITY_RENAMES = {
  'Asia/Calcutta': 'Kolkata',
  'Europe/Kiev': 'Kyiv',
  'Asia/Saigon': 'Ho Chi Minh City',
  'Asia/Katmandu': 'Kathmandu',
  'Asia/Rangoon': 'Yangon',
  'America/Godthab': 'Nuuk',
  'Atlantic/Faeroe': 'Faroe',
  'Pacific/Truk': 'Chuuk',
  'Pacific/Ponape': 'Pohnpei',
  'Pacific/Enderbury': 'Kanton',
};

function offsetMinutes(timeZone, date) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  const match = name?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0);
  return match[1] === '-' ? -minutes : minutes;
}

function formatOffset(minutes) {
  const abs = Math.abs(minutes);
  const mins = abs % 60;
  return `UTC${minutes < 0 ? '-' : '+'}${Math.floor(abs / 60)}${mins ? `:${String(mins).padStart(2, '0')}` : ''}`;
}

function toOption(timeZone, date) {
  const offset = offsetMinutes(timeZone, date);
  const city = timeZone === 'UTC'
    ? 'Coordinated Universal Time'
    : CITY_RENAMES[timeZone] || timeZone.split('/').pop().replace(/_/g, ' ');
  return { value: timeZone, label: `${city} (${formatOffset(offset)})`, offset };
}

let cached = null;

function allOptions() {
  if (cached) return cached;
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : FALLBACK_ZONES;
  const now = new Date();
  cached = ['UTC', ...zones.filter((zone) => zone !== 'UTC')]
    .map((zone) => toOption(zone, now))
    .sort((a, b) => a.offset - b.offset || a.label.localeCompare(b.label));
  return cached;
}

/** Options for a time-zone Select; keeps `current` selectable even if this browser lists it under another name (e.g. Europe/Kyiv vs Europe/Kiev). */
export function getTimezoneOptions(current) {
  const options = allOptions();
  if (!current || options.some((option) => option.value === current)) return options;
  try {
    return [toOption(current, new Date()), ...options];
  } catch {
    return options;
  }
}
