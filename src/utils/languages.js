// utils/languages.js - shared language list used by the candidate-profile
// language entries and the candidate-search-dashboard Languages filter.
const LANGUAGES_RAW = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Azerbaijani',
  'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian', 'Burmese',
  'Catalan', 'Cebuano', 'Chinese (Cantonese)', 'Chinese (Mandarin)', 'Croatian',
  'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Filipino (Tagalog)',
  'Finnish', 'French', 'Georgian', 'German', 'Greek', 'Gujarati', 'Hausa',
  'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Italian',
  'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish',
  'Lao', 'Latvian', 'Lithuanian', 'Macedonian', 'Malay', 'Malayalam', 'Maltese',
  'Marathi', 'Mongolian', 'Montenegrin', 'Nepali', 'Norwegian', 'Pashto',
  'Persian (Farsi)', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian',
  'Serbian', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Swahili',
  'Swedish', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu',
  'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa', 'Yoruba', 'Zulu',
];

export const LANGUAGE_NAMES = [...new Set(LANGUAGES_RAW)].sort((a, b) => a.localeCompare(b));

// CEFR proficiency scale, ordered lowest to highest (Native treated as the ceiling).
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'];
export const LEVEL_PCT = { A1: 20, A2: 35, B1: 55, B2: 70, C1: 85, C2: 100, Native: 100 };
export const LEVEL_NOTES = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-Intermediate',
  C1: 'Advanced',
  C2: 'Full professional proficiency',
  Native: '',
};
