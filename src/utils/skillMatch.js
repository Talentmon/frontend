/**
 * How skills, positions and words are found on a CV, for the company lists
 * filtered in the browser (Bookmarked, Purchased). Keep in step with the
 * backend's candidate-search.service.ts, which does the same for Search.
 *
 * - A skill counts in the Skills section, among a job's "Skills / tools", or in a
 *   job's description. A category counts the same way for any skill in it.
 *   Catalog aliases count too ("Postgres" is PostgreSQL).
 * - Words match whole: "Java" doesn't match "JavaScript", "C" doesn't match "C++".
 * - In running text (descriptions, summary) a catalog name that is also an
 *   ordinary word must be written with its capital, so "more-or-less" isn't Less
 *   and "react quickly" isn't React. 1–2 letter names (AI, QA, Go, JS) match as written.
 */
import { SKILL_CATALOG } from 'utils/skills';

const lower = (value) => String(value || '').trim().toLowerCase();

/**
 * Catalog skill names and aliases that are also ordinary words: in running text
 * they count only when written with the capital, like the name. Same list in the
 * backend's candidate-search.service.ts (ORDINARY_WORD_SKILLS).
 */
const ORDINARY_WORD_SKILLS = new Set([
  'agile', 'blender', 'bootstrap', 'capacitor', 'celery', 'chai', 'consul', 'dart', 'echo', 'emotion',
  'expo', 'express', 'fiber', 'flask', 'foundry', 'ghost', 'gin', 'harbor', 'haystack', 'helm', 'hive',
  'insomnia', 'ionic', 'jest', 'karma', 'lean', 'less', 'lit', 'locust', 'mocha', 'node', 'nomad', 'notion',
  'packer', 'pact', 'parcel', 'phoenix', 'polygon', 'postman', 'presto', 'prettier', 'rails', 'railway',
  'react', 'realm', 'relay', 'remix', 'render', 'rocket', 'rollup', 'rust', 'sanity', 'selenium', 'sketch',
  'slack', 'snowflake', 'spring', 'stencil', 'swift', 'tailwind', 'unity', 'vault', 'whisper', 'windows'
]);

// One entry per catalog skill (a few names sit in several categories): name + aliases.
const CATALOG = (() => {
  const byKey = new Map();
  SKILL_CATALOG.forEach((s) => {
    const key = lower(s.name);
    const prev = byKey.get(key);
    byKey.set(key, { name: s.name, aliases: [...new Set([...(prev?.aliases || []), ...(s.aliases || [])])] });
  });
  return [...byKey.values()];
})();
const CATALOG_BY_FORM = new Map();
CATALOG.forEach((s) => [s.name, ...s.aliases].forEach((form) => {
  if (!CATALOG_BY_FORM.has(lower(form))) CATALOG_BY_FORM.set(lower(form), s);
}));

const hasCase = (ch) =>
  ch.toLowerCase() !== ch.toUpperCase() && ch.toLowerCase().length === 1 && ch.toUpperCase().length === 1;
const escapeRegex = (ch) => ch.replace(/[\\^$.|?*+()[\]{}]/g, '\\$&');

/** `name` as a regex body; letterCase 'any' | 'capital' (first letter as written) | 'exact'. */
function namePattern(name, letterCase) {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word, w) =>
      [...word]
        .map((ch, i) => {
          if (letterCase === 'exact' || !hasCase(ch) || (letterCase === 'capital' && w === 0 && i === 0)) return escapeRegex(ch);
          return `[${ch.toLowerCase()}${ch.toUpperCase()}]`;
        })
        .join('')
    )
    .join('(?:[\\s-]|&nbsp;)+');
}

// Group 1 / group 2 are the characters around the word (or nothing at the ends).
const anyWord = (bodies, flags = 'u') =>
  new RegExp(`(^|[^\\p{L}\\p{N}_])(?:${bodies.join('|')})($|[^\\p{L}\\p{N}_+#])`, flags);

/** How one spelling is read in running text (see the note at the top). */
function proseForm(form, catalog) {
  const text = String(form).trim();
  if (text.length <= 2) return namePattern(text, 'exact');
  return namePattern(text, catalog && ORDINARY_WORD_SKILLS.has(lower(text)) ? 'capital' : 'any');
}

/** A skill as matching reads it: catalog name + aliases, or the text as typed. */
function skillForms(name) {
  const entry = CATALOG_BY_FORM.get(lower(name));
  if (entry) return { key: lower(entry.name), name: entry.name, forms: [entry.name, ...entry.aliases], catalog: true };
  const text = String(name || '').trim();
  return { key: lower(text), name: text, forms: [text], catalog: false };
}

const proseBodies = (skill) => skill.forms.map((form) => proseForm(form, skill.catalog));

const plainText = (html) => String(html || '').replace(/<[^>]*>/g, ' ');

/**
 * (candidate) => true when any of `names` is in their Skills, a job's skills, or a
 * job's description. A job's own skills are read first; its description only
 * matters for skills the job doesn't list.
 */
export function makeSkillMatcher(names) {
  const skills = (names || []).filter((name) => String(name || '').trim()).map(skillForms);
  if (!skills.length) return () => false;
  const forms = new Set(skills.flatMap((s) => s.forms.map(lower)));
  const anyOf = anyWord(skills.flatMap(proseBodies));
  return (candidate) => {
    if (candidate?.skills?.some((skill) => forms.has(lower(skill)))) return true;
    return (candidate?.experiences || []).some(
      (job) => job?.tags?.some((tag) => forms.has(lower(tag))) || anyOf.test(plainText(job?.description))
    );
  };
}

/**
 * The list's search box: whole words in the headline and the jobs' positions; in
 * the skills (Skills section and the jobs', aliases too); in the jobs' descriptions
 * and the summary. Names, cities, notes and the like
 * stay "any part" matches in the page itself.
 */
export function makeTextMatcher(term) {
  const text = String(term || '').trim();
  if (!text) return () => false;
  const skill = skillForms(text);
  const label = anyWord([namePattern(text, 'any')]);
  const skillLabel = anyWord(skill.forms.map((form) => namePattern(form, 'any')));
  const prose = anyWord(proseBodies(skill));
  return (candidate) =>
    label.test(candidate?.position || '') ||
    (candidate?.skills || []).some((name) => skillLabel.test(name)) ||
    prose.test(plainText(candidate?.description)) ||
    (candidate?.experiences || []).some(
      (job) =>
        label.test(job?.role || '') ||
        (job?.tags || []).some((tag) => skillLabel.test(tag)) ||
        prose.test(plainText(job?.description))
    );
}

/** Every skill name in the Skills section and the jobs' skills (as typed). */
export const allSkillNames = (candidate) => [
  ...(candidate?.skills || []),
  ...(candidate?.experiences || []).flatMap((job) => job?.tags || [])
];

