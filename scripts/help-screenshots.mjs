// Regenerates the screenshots in public/help/ used by the company Help & Support
// page (/help).
//
// Usage: start the frontend (vite on 4028) and the backend (3000), then run
//   HELP_SHOTS_EMAIL=<test company email> HELP_SHOTS_PASSWORD=<password> node scripts/help-screenshots.mjs
// HELP_SHOTS_ONLY=credits,payment,alert redoes just those shots (names in SHOTS at the bottom).
//
// It logs in as a test company and replaces the candidate, bookmark, purchase
// and balance responses with the made-up people below, so every picture shows
// the same fake data. All non-GET requests are blocked, so nothing is saved to
// the database. "Match" facts are hidden until real matching exists.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'help');
const BASE = process.env.HELP_SHOTS_BASE || 'http://localhost:4028';
const EMAIL = process.env.HELP_SHOTS_EMAIL;
const PASSWORD = process.env.HELP_SHOTS_PASSWORD;
const CODE = process.env.HELP_SHOTS_CODE || '424242'; // Clerk dev test code for +clerk_test emails
const SCALE = 1.5;
const WEBP_QUALITY = 0.86;

if (!EMAIL || !PASSWORD) {
  console.error('Set HELP_SHOTS_EMAIL and HELP_SHOTS_PASSWORD (a complete-profile test company).');
  process.exit(1);
}

// ---------- Fake data ----------

const NOW = Date.now();
const daysAgo = (days) => new Date(NOW - days * 86400000).toISOString();
const yearIso = (year, month = 1) => new Date(Date.UTC(year, month - 1, 1)).toISOString();

const avatar = (initials, bg) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="${bg}"/>` +
      `<text x="50%" y="54%" font-family="Inter,Arial,sans-serif" font-size="58" font-weight="700" fill="#fff" ` +
      `text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`
  )}`;

const NOTICE = {
  now: { noticeNum: 0, noticeUnit: 'DAY' },
  '2w': { noticeNum: 2, noticeUnit: 'WEEK' },
  '1m': { noticeNum: 1, noticeUnit: 'MONTH' },
  '3m': { noticeNum: 3, noticeUnit: 'MONTH' },
};

function candidate(spec) {
  const cid = `help-cand-${spec.key}`;
  return {
    id: cid,
    anonCode: `TC-${1000 + ([...spec.key].reduce((n, ch) => n * 31 + ch.charCodeAt(0), 7) % 9000)}`,
    roleTitle: spec.role,
    yearsExperience: spec.years,
    location: spec.city,
    status: spec.status,
    profileStrength: 90,
    experiences: spec.jobs.map((job, i) => ({
      id: `${cid}-exp-${i}`,
      candidateId: cid,
      role: job.role,
      company: job.company,
      industry: 'Technology',
      subIndustry: 'IT & Software',
      startDate: yearIso(job.from),
      endDate: job.to ? yearIso(job.to) : null,
      location: spec.city,
      description: job.text,
      tags: [],
      visible: true,
      position: i,
    })),
    education: [
      {
        id: `${cid}-edu`,
        candidateId: cid,
        degree: spec.degree,
        school: spec.school,
        level: spec.level || 'BACHELORS',
        startDate: yearIso(spec.gradYear - 4),
        endDate: yearIso(spec.gradYear),
        location: spec.city,
        description: null,
        visible: true,
        position: 0,
      },
    ],
    certifications: [],
    skills: spec.skills.map((name, i) => ({ id: `${cid}-sk-${i}`, candidateId: cid, name, visible: true, position: i })),
    languages: [
      { id: `${cid}-l0`, candidateId: cid, name: 'Serbian', level: 'Native', note: null, visible: true, position: 0 },
      { id: `${cid}-l1`, candidateId: cid, name: 'English', level: spec.english || 'C1', note: null, visible: true, position: 1 },
    ],
    interests: [],
    projects: [],
    courses: [],
    awards: [],
    organizations: [],
    publications: [],
    websites: [],
    customSections: [
      {
        id: `${cid}-sum`,
        candidateId: cid,
        type: 'summary',
        kind: 'TEXT',
        icon: 'summary',
        title: 'Summary',
        textContent: spec.summary,
        position: 0,
        entries: [],
      },
    ],
    preferences: {
      candidateId: cid,
      mode: spec.mode,
      type: 'FULL_TIME',
      salaryCurrency: 'EUR',
      salaryAmount: spec.salary,
      salaryPeriod: 'MONTH',
      salaryAmountBaseEur: spec.salary,
      ...NOTICE[spec.notice],
      travelReady: !!spec.travel,
      relocationReady: !!spec.relocation,
    },
  };
}

const SEARCH = [
  candidate({
    key: 'a1', role: 'Senior Frontend Developer', years: 7, city: 'London', status: 'ACTIVE', mode: 'HYBRID', salary: 3800, notice: '1m',
    skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Jest', 'Storybook', 'CSS'],
    summary: 'Frontend engineer focused on fast, accessible web apps. Led the move of a large e-commerce storefront to Next.js and built the design system three product teams now share.',
    jobs: [
      { role: 'Senior Frontend Developer', company: 'Shoply', from: 2021, text: 'Own the storefront web app and the shared component library.' },
      { role: 'Frontend Developer', company: 'Brightline Agency', from: 2018, to: 2021, text: 'Built marketing sites and dashboards for fintech clients.' },
    ],
    degree: 'BSc Computer Science', school: 'University of Belgrade', gradYear: 2018,
  }),
  candidate({
    key: 'a2', role: 'Product Designer', years: 5, city: 'Manchester', status: 'OPEN', mode: 'REMOTE', salary: 2900, notice: '2w',
    skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research', 'Webflow'],
    summary: 'Product designer shaping clean, usable interfaces for SaaS teams. Comfortable taking a feature from research and wireframes all the way to a shipped, measured release.',
    jobs: [
      { role: 'Product Designer', company: 'Fleetio Labs', from: 2022, text: 'Design lead for the driver and dispatcher apps.' },
      { role: 'UI Designer', company: 'Pixel Bureau', from: 2020, to: 2022, text: 'Web and mobile UI for agency clients.' },
    ],
    degree: 'BA Graphic Design', school: 'Academy of Arts Novi Sad', gradYear: 2019,
  }),
  candidate({
    key: 'a3', role: 'DevOps Engineer', years: 6, city: 'Chicago', status: 'ACTIVE', mode: 'REMOTE', salary: 4200, notice: 'now', travel: true,
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'CI/CD', 'Prometheus'],
    summary: 'Platform engineer who automates everything twice. Cut cloud costs by a third for a payments company while moving 40 services to Kubernetes.',
    jobs: [
      { role: 'DevOps Engineer', company: 'PayGrid', from: 2020, text: 'Kubernetes platform and CI/CD for 40+ services.' },
      { role: 'System Administrator', company: 'Telekom Services', from: 2018, to: 2020, text: 'Linux servers and monitoring.' },
    ],
    degree: 'BSc Electrical Engineering', school: 'University of Niš', gradYear: 2018,
  }),
  candidate({
    key: 'a4', role: 'Data Analyst', years: 3, city: 'New York', status: 'ACTIVE', mode: 'HYBRID', salary: 1900, notice: 'now',
    skills: ['SQL', 'Python', 'Power BI', 'Excel', 'dbt'],
    summary: 'Analyst turning messy sales and marketing data into dashboards people actually use. Strong SQL, practical Python, and a habit of asking why a number moved.',
    jobs: [
      { role: 'Data Analyst', company: 'RetailHub', from: 2022, text: 'Sales and marketing reporting in Power BI.' },
      { role: 'Junior Analyst', company: 'MarketView', from: 2021, to: 2022, text: 'Survey data and Excel reporting.' },
    ],
    degree: 'BSc Statistics', school: 'University of Belgrade', gradYear: 2021,
  }),
  candidate({
    key: 'a5', role: 'QA Automation Engineer', years: 4, city: 'Leeds', status: 'OPEN', mode: 'REMOTE', salary: 2400, notice: '1m',
    skills: ['Playwright', 'Cypress', 'Selenium', 'Java', 'API testing'],
    summary: 'QA engineer who builds test suites developers trust. Took a flaky 2-hour regression run down to 12 stable minutes.',
    jobs: [
      { role: 'QA Automation Engineer', company: 'Testwise', from: 2021, text: 'End-to-end and API test automation.' },
      { role: 'QA Engineer', company: 'CodeMill', from: 2020, to: 2021, text: 'Manual and exploratory testing.' },
    ],
    degree: 'BSc Software Engineering', school: 'University of Kragujevac', gradYear: 2020,
  }),
  candidate({
    key: 'a6', role: 'Mobile Developer (Flutter)', years: 5, city: 'Austin', status: 'ACTIVE', mode: 'REMOTE', salary: 3300, notice: '2w',
    skills: ['Flutter', 'Dart', 'Firebase', 'iOS', 'Android', 'REST'],
    summary: 'Mobile developer with four apps in the stores, the largest with 300k users. Cares about smooth animations, offline mode and small app sizes.',
    jobs: [
      { role: 'Mobile Developer', company: 'Appcraft', from: 2021, text: 'Flutter apps for retail and banking clients.' },
      { role: 'Android Developer', company: 'Nova Mobile', from: 2019, to: 2021, text: 'Native Android development.' },
    ],
    degree: 'BSc Computer Science', school: 'University of Novi Sad', gradYear: 2019,
  }),
  candidate({
    key: 'a7', role: 'Project Manager', years: 9, city: 'Boston', status: 'OPEN', mode: 'ONSITE', salary: 3600, notice: '3m', travel: true,
    skills: ['Scrum', 'Jira', 'Stakeholder management', 'Budgeting', 'Risk management'],
    summary: 'Delivery-focused project manager for software and infrastructure projects. Keeps teams calm, clients informed and budgets where they were promised.',
    jobs: [
      { role: 'Project Manager', company: 'Infra Solutions', from: 2019, text: 'Delivery of ERP and infrastructure projects.' },
      { role: 'Team Lead', company: 'Softline', from: 2016, to: 2019, text: 'Led a team of eight developers.' },
    ],
    degree: 'MSc Management', school: 'Faculty of Organizational Sciences', level: 'MASTERS', gradYear: 2016,
  }),
  candidate({
    key: 'a8', role: 'Backend Developer (Java)', years: 6, city: 'Seattle', status: 'ACTIVE', mode: 'HYBRID', salary: 3900, notice: '1m', relocation: true,
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Microservices'],
    summary: 'Backend developer building reliable payment and booking systems. Happiest when designing clean APIs and making slow queries fast.',
    jobs: [
      { role: 'Backend Developer', company: 'TravelNest', from: 2020, text: 'Booking and payment microservices.' },
      { role: 'Java Developer', company: 'BankSoft', from: 2018, to: 2020, text: 'Core banking integrations.' },
    ],
    degree: 'BSc Computer Science', school: 'University of Belgrade', gradYear: 2018,
  }),
  candidate({
    key: 'a9', role: 'Full-stack Developer', years: 4, city: 'Bristol', status: 'ACTIVE', mode: 'REMOTE', salary: 2800, notice: 'now',
    skills: ['Node.js', 'React', 'PostgreSQL', 'Docker', 'TypeScript'],
    summary: 'Full-stack developer who likes owning a feature end to end, from the database schema to the last button. Shipped two SaaS products from zero.',
    jobs: [
      { role: 'Full-stack Developer', company: 'Startbase', from: 2021, text: 'Built two SaaS products from scratch.' },
      { role: 'Web Developer', company: 'Freelance', from: 2020, to: 2021, text: 'Websites and small web apps.' },
    ],
    degree: 'BSc Information Technology', school: 'Higher Technical School Subotica', gradYear: 2020,
  }),
];

const SAVED_FILTERS = [
  { id: 'help-sf-1', name: 'Senior React · London', filters: { position: 'Frontend Developer', location: 'London', experience: '5-10' }, createdAt: daysAgo(20), updatedAt: daysAgo(20) },
  { id: 'help-sf-2', name: 'Remote designers', filters: { position: 'Designer', status: 'OPEN' }, createdAt: daysAgo(9), updatedAt: daysAgo(9) },
];

const bookmark = (cand, i, notes = null, savedDaysAgo = i + 1) => ({
  id: `help-bm-${cand.id}`,
  companyId: 'help-company',
  candidateId: cand.id,
  notes,
  sortIndex: i,
  pocket: 'SHARED',
  bookmarkedByMemberId: 'help-member',
  bookmarkedAt: daysAgo(savedDaysAgo),
  overflowDeadline: null,
  bookmarkedBy: null,
  canRemove: true,
  candidate: cand,
});

const BOOKMARKS = [
  bookmark(SEARCH[0], 0, 'Strong design-system experience. Ask about the Next.js migration in the first call.'),
  bookmark(SEARCH[2], 1),
  bookmark(SEARCH[3], 2, 'Good fit for the reporting role, available right away.'),
  bookmark(SEARCH[5], 3),
  bookmark(SEARCH[7], 4),
  bookmark(SEARCH[8], 5),
];

const purchase = (spec) => {
  const base = candidate(spec);
  return {
    ...base,
    name: spec.name,
    photoUrl: avatar(spec.initials, spec.color),
    email: spec.email,
    phone: spec.phone,
    linkedin: spec.linkedin,
    currentEmployerName: spec.jobs[0].company,
    id: `help-pur-${spec.key}`,
    candidateId: base.id,
    recruitmentStatus: spec.pipeline,
    notes: spec.notes || null,
    updatedAt: daysAgo(spec.unlocked - 1),
    unlockedAt: daysAgo(spec.unlocked),
    creditsSpent: 1,
    unlockedBy: null,
    hire: spec.hire || null,
  };
};

const PURCHASES = [
  purchase({
    key: 'b1', name: 'Emily Carter', initials: 'EC', color: '#3b6fb0', email: 'emily.carter@example.com', phone: '+44 7700 900123', linkedin: 'https://linkedin.com/in/example-emily',
    unlocked: 2, pipeline: 'NEW',
    role: 'Senior Frontend Developer', years: 6, city: 'London', status: 'ACTIVE', mode: 'HYBRID', salary: 3700, notice: '1m',
    skills: ['React', 'TypeScript', 'Redux', 'Next.js', 'Testing Library', 'Figma'],
    summary: 'Frontend developer building dashboards and booking flows for travel products. Mentors juniors and runs the team’s code reviews.',
    jobs: [
      { role: 'Senior Frontend Developer', company: 'TripLane', from: 2021, text: 'Booking flow and partner dashboard.' },
      { role: 'Frontend Developer', company: 'WebForge', from: 2019, to: 2021, text: 'React apps for agency clients.' },
    ],
    degree: 'BSc Software Engineering', school: 'University of Belgrade', gradYear: 2019,
  }),
  purchase({
    key: 'b2', name: 'James Mitchell', initials: 'JM', color: '#2f9e69', email: 'james.mitchell@example.com', phone: '+44 7700 900456', linkedin: 'https://linkedin.com/in/example-james',
    unlocked: 6, pipeline: 'CONTACTED', notes: 'Called on Monday, sending the task on Wednesday.',
    role: 'DevOps Engineer', years: 5, city: 'Manchester', status: 'ACTIVE', mode: 'REMOTE', salary: 4000, notice: '2w',
    skills: ['AWS', 'Terraform', 'Kubernetes', 'GitHub Actions', 'Linux'],
    summary: 'DevOps engineer running cloud platforms for SaaS companies. Infrastructure as code, sensible alerts and calm on-call nights.',
    jobs: [
      { role: 'DevOps Engineer', company: 'CloudNine', from: 2021, text: 'AWS platform for 25 microservices.' },
      { role: 'Junior DevOps', company: 'Hostline', from: 2019, to: 2021, text: 'CI/CD and server automation.' },
    ],
    degree: 'BSc Computer Engineering', school: 'University of Novi Sad', gradYear: 2019,
  }),
  purchase({
    key: 'b3', name: 'Sarah Thompson', initials: 'ST', color: '#C98A1F', email: 'sarah.thompson@example.com', phone: '+1 212 555 0147', linkedin: 'https://linkedin.com/in/example-sarah',
    unlocked: 12, pipeline: 'INTERVIEWED', notes: 'Great second interview. Waiting for the reference check.',
    role: 'Product Designer', years: 6, city: 'New York', status: 'OPEN', mode: 'HYBRID', salary: 3100, notice: '1m',
    skills: ['Figma', 'UX Research', 'Prototyping', 'Design Systems', 'Usability testing'],
    summary: 'Product designer for fintech and health apps. Runs research herself and turns it into simple, tested interfaces.',
    jobs: [
      { role: 'Product Designer', company: 'HealthPal', from: 2021, text: 'Patient app and clinic dashboard.' },
      { role: 'UX Designer', company: 'FinFlow', from: 2018, to: 2021, text: 'Mobile banking experience.' },
    ],
    degree: 'MA Interaction Design', school: 'University of Arts Belgrade', level: 'MASTERS', gradYear: 2018,
  }),
  purchase({
    key: 'b4', name: 'Michael Brooks', initials: 'MB', color: '#7a4fb0', email: 'michael.brooks@example.com', phone: '+1 512 555 0183', linkedin: 'https://linkedin.com/in/example-michael',
    unlocked: 34, pipeline: 'HIRED',
    hire: { id: 'help-hire-1', purchaseId: 'help-pur-b4', hireDate: daysAgo(12), position: 'Backend Developer', salaryClauseRespected: true, ratingOverall: 5, comments: null, createdAt: daysAgo(12) },
    role: 'Backend Developer (Node.js)', years: 4, city: 'Austin', status: 'ACTIVE', mode: 'REMOTE', salary: 2900, notice: 'now',
    skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
    summary: 'Backend developer building APIs for logistics and e-commerce. Clean code, good tests and clear documentation.',
    jobs: [
      { role: 'Backend Developer', company: 'ShipRoute', from: 2021, text: 'Tracking and routing APIs.' },
      { role: 'Junior Developer', company: 'Devhouse', from: 2020, to: 2021, text: 'REST APIs and integrations.' },
    ],
    degree: 'BSc Computer Science', school: 'University of Niš', gradYear: 2020,
  }),
  purchase({
    key: 'b5', name: 'Olivia Bennett', initials: 'OB', color: '#cf4b4b', email: 'olivia.bennett@example.com', phone: '+1 416 555 0129', linkedin: 'https://linkedin.com/in/example-olivia',
    unlocked: 41, pipeline: 'REJECTED', notes: 'Looking for a fully remote role only.',
    role: 'QA Engineer', years: 3, city: 'Toronto', status: 'OPEN', mode: 'REMOTE', salary: 2100, notice: '2w',
    skills: ['Cypress', 'Postman', 'Jira', 'SQL', 'Test planning'],
    summary: 'QA engineer with an eye for edge cases. Writes clear bug reports and automated checks for web apps.',
    jobs: [
      { role: 'QA Engineer', company: 'Bugless', from: 2021, text: 'Manual and automated testing of web apps.' },
    ],
    degree: 'BSc Information Systems', school: 'University of Kragujevac', gradYear: 2021,
  }),
];

const BALANCE = 86; // above the alert level below, so the header shows no low-balance warning

const SAVED_CARDS = [
  { id: 'help-pm-visa', type: 'card', card: { type: 'visa', last4: '4242', expiry_month: 12, expiry_year: 2030 } },
  { id: 'help-pm-mc', type: 'card', card: { type: 'mastercard', last4: '5454', expiry_month: 3, expiry_year: 2029 } },
];

// A just-registered company: only the name and login email are filled in.
const NEW_COMPANY = {
  foundedYear: null,
  industry: null,
  size: null,
  location: null,
  country: null,
  address: null,
  shortDescription: null,
  detailedDescription: null,
  website: null,
  contactEmail: null,
  phone: null,
  linkedinUrl: null,
  registrationNumber: null,
  pib: null,
  workMode: null,
  flexibleHours: false,
  benefits: [],
  profileComplete: false,
  missingFields: ['foundedYear', 'industry', 'size', 'location', 'country', 'address', 'shortDescription'],
};

const BASE_OVERRIDES = {
  'candidates/search': () => ({ items: SEARCH, total: SEARCH.length, page: 1, limit: 20, totalPages: 1 }),
  'companies/me/bookmarks': () => BOOKMARKS,
  'companies/me/bookmarks/limit': () => ({ limit: 10, count: BOOKMARKS.length, personalLimit: 0, personalUsed: 0, overflowDeadline: null }),
  'companies/me/purchases': () => PURCHASES,
  'companies/me/credits/balance': (real) => ({ ...real, balance: BALANCE, lowBalanceThreshold: 10 }),
  'companies/me/saved-search-filters': () => SAVED_FILTERS,
  'companies/me/payment-methods': () => SAVED_CARDS,
  'companies/me/credits/low-balance-alert': () => ({ enabled: true, thresholdCredits: 10 }),
  // A team pace of 12 unlocks a month, for the alert's suggestion and "goes off in" line.
  'companies/me/credits/usage-analytics': (real) => ({ ...real, pace: { ...real?.pace, perMonth: 12 } }),
};

const NEW_COMPANY_OVERRIDES = {
  ...BASE_OVERRIDES,
  'auth/me': (real) => ({ ...real, company: { ...real.company, ...NEW_COMPANY } }),
  'companies/me': (real) => ({ ...real, ...NEW_COMPANY }),
};

// ---------- Browser helpers ----------

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.Clerk?.loaded, null, { timeout: 30000 });
  if (await page.evaluate(() => !!window.Clerk?.session)) return;
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  const next = await Promise.race([
    page.waitForSelector('#loginCode', { timeout: 20000 }).then(() => 'code'),
    page.waitForFunction(() => !!window.Clerk?.session, null, { timeout: 20000 }).then(() => 'in'),
  ]);
  if (next === 'code') {
    await page.fill('#loginCode', CODE);
    await page.click('button:has-text("Confirm & log in")');
  }
  await page.waitForFunction(() => !!window.Clerk?.session, null, { timeout: 20000 });
}

let activeOverrides = BASE_OVERRIDES;

async function installApiMock(page) {
  await page.route(/:3000\/api\//, async (route) => {
    const req = route.request();
    if (req.method() !== 'GET') {
      console.log('  blocked', req.method(), new URL(req.url()).pathname);
      return route.abort();
    }
    const key = new URL(req.url()).pathname.replace(/^\/api\//, '');
    const override = activeOverrides[key];
    if (!override) return route.continue();
    const response = await route.fetch();
    const real = await response.json().catch(() => null);
    return route.fulfill({ response, json: override(real) });
  });
}

// "Match" is a placeholder score for now, so it stays out of the guide.
async function hideMatch(page) {
  await page.addInitScript(() => {
    const hide = () => {
      document.querySelectorAll('[class*="factK"]').forEach((el) => {
        if (el.textContent.trim().toLowerCase() !== 'match') return;
        const fact = el.closest('[class*="_fact_"]') || el.parentElement;
        if (fact) fact.style.display = 'none';
      });
    };
    new MutationObserver(hide).observe(document, { subtree: true, childList: true });
  });
}

let converter;

async function save(buffer, name) {
  const dataUrl = await converter.evaluate(
    async ({ src, quality }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      return canvas.toDataURL('image/webp', quality);
    },
    { src: `data:image/png;base64,${buffer.toString('base64')}`, quality: WEBP_QUALITY }
  );
  const webp = Buffer.from(dataUrl.split(',')[1], 'base64');
  writeFileSync(path.join(OUT, `${name}.webp`), webp);
  console.log(`  saved ${name}.webp (${Math.round(webp.length / 1024)} KB)`);
}

const settle = (page, ms = 700) => page.waitForTimeout(ms);

async function open(page, route, readySelector) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
  // The first request after the dev database has been idle can fail — one reload covers it.
  await page.waitForSelector(readySelector, { timeout: 20000 }).catch(async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector(readySelector, { timeout: 30000 });
  });
  await settle(page, 1200);
}

// Screenshot of the page area from the top of `fromSel` to the bottom of `toSel`, across <main>.
async function clipBetween(page, fromSel, toSel, pad = 16) {
  const clip = await page.evaluate(
    ([from, to, padding]) => {
      const find = (sel) => (typeof sel === 'string' ? document.querySelector(sel) : null);
      const top = find(from).getBoundingClientRect();
      const bottom = find(to).getBoundingClientRect();
      const main = document.querySelector('main').getBoundingClientRect();
      return {
        x: main.left + 6,
        y: top.top + window.scrollY + 2, // skip the site header's bottom edge
        width: main.width - 12,
        height: bottom.bottom - top.top + padding,
      };
    },
    [fromSel, toSel, pad]
  );
  return page.screenshot({ clip, fullPage: true });
}

// Tags the first element matching `selector` whose text includes `text`, so it can be addressed by id.
async function tag(page, selector, text, id) {
  await page.evaluate(
    ([sel, needle, newId]) => {
      const el = [...document.querySelectorAll(sel)].find((node) => node.textContent.includes(needle));
      if (el) el.id = newId;
    },
    [selector, text, id]
  );
}

// ---------- Shots ----------

async function shotProfile(page) {
  console.log('profile');
  activeOverrides = NEW_COMPANY_OVERRIDES;
  await open(page, '/company-profile-settings', 'text=Complete your company profile');
  // The logo upload is not in the guide yet.
  await page.evaluate(() => {
    const logo = [...document.querySelectorAll('main [class*="_card_"]')].find((el) => el.textContent.includes('Company logo'));
    if (logo) logo.style.display = 'none';
  });
  await tag(page, 'main [class*="_card_"]', 'Basic information', 'help-basic');
  await page.evaluate(() => {
    const head = document.querySelector('main h1')?.closest('div[class*="_head_"]');
    if (head) head.id = 'help-head';
  });
  await save(await clipBetween(page, '#help-head', '#help-basic', 4), 'profile-required');
  activeOverrides = BASE_OVERRIDES;
}

async function shotCredits(page) {
  console.log('credits');
  await open(page, '/credit-management', 'text=Credits management');
  await page.locator('nav button', { hasText: 'Purchase' }).first().click();
  await page.waitForSelector('text=Choose a Credits package');
  await settle(page, 1500);
  await page.evaluate(() => {
    const head = document.querySelector('main h1')?.closest('div[class*="_head_"]');
    if (head) head.id = 'help-head';
    // Stop after the first row of packages; the rest repeat the same layout.
    const firstRow = [...document.querySelectorAll('main [class*="_pkg_"]')].slice(0, 4).pop();
    if (firstRow) firstRow.id = 'help-pkg-row';
  });
  await save(await clipBetween(page, '#help-head', '#help-pkg-row', 12), 'credits-packages');
}

async function openCreditsTab(page, tabName, readySelector) {
  await open(page, '/credit-management', 'text=Credits management');
  await page.locator('nav button', { hasText: tabName }).first().click();
  await page.waitForSelector(readySelector);
  await settle(page, 1200);
}

async function shotPaymentMethods(page) {
  console.log('payment methods');
  await openCreditsTab(page, 'Payment', 'text=Visa ending in 4242');
  await page.locator('button', { hasText: 'Manage cards' }).click();
  await settle(page, 500);
  await save(await page.locator('main [class*="pmPanel"]').screenshot(), 'credits-payment-methods');
}

async function shotLowBalanceAlert(page) {
  console.log('low balance alert');
  await openCreditsTab(page, 'Settings', '#lba-threshold');
  await save(await page.locator('main [class*="settingsCard"]').screenshot(), 'credits-alert');
}

async function shotSearch(page) {
  console.log('search');
  await open(page, '/candidate-search-dashboard', 'text=Senior Frontend Developer');
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);
  await save(await page.screenshot(), 'search-overview');

  const firstCard = page.locator('[class*="_card_"]').filter({ has: page.locator('button', { hasText: 'Unlock' }) }).first();
  await save(await firstCard.screenshot(), 'search-card');

  await firstCard.locator('button[aria-label="Preview CV"]').click();
  await settle(page, 900);
  await save(await page.screenshot(), 'search-preview');
  await page.keyboard.press('Escape');
  await settle(page, 500);
  // Escape usually closes the drawer already; its close button then sits off-screen.
  await page.locator('aside button[aria-label="Close"]').first().click({ timeout: 2000 }).catch(() => {});
  await settle(page, 600);

  const card = page.locator('[class*="_card_"]').filter({ hasText: 'Data Analyst' }).first();
  await card.locator('button', { hasText: 'Unlock' }).click();
  const modal = page.locator('[role="dialog"][aria-labelledby="unlockModalTitle"]');
  await modal.waitFor();
  await settle(page, 600);
  await save(await modal.screenshot(), 'unlock-modal');
  await modal.locator('button', { hasText: 'Cancel' }).click();
}

async function shotBookmarks(page) {
  console.log('bookmarks');
  await open(page, '/bookmarked-candidates', 'text=Senior Frontend Developer');
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);
  await save(await page.screenshot(), 'bookmarks-overview');

  const noted = page.locator('article').filter({ hasText: 'Senior Frontend Developer' }).first();
  await noted.locator('button[aria-label="Notes"]').click();
  await settle(page, 800);
  await save(await noted.screenshot(), 'bookmarks-notes');
  await noted.locator('button[aria-label="Notes"]').click();
  await settle(page, 500);

  await page.locator('button', { hasText: 'Select multiple' }).click();
  await settle(page, 500);
  // In select mode the whole card is the checkbox.
  const cards = page.locator('[role="checkbox"]');
  await cards.nth(0).click();
  await cards.nth(2).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page, 700);
  await save(await page.screenshot(), 'bookmarks-select');
}

async function shotPurchased(page) {
  console.log('purchased');
  await open(page, '/purchased-profiles', 'text=Emily Carter');
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);
  await save(await page.screenshot(), 'purchased-overview');

  const card = page.locator('article').filter({ hasText: 'Sarah Thompson' }).first();
  // The card is almost as tall as the window, so the fixed site header would cover its top edge.
  await page.evaluate(() => { document.querySelector('header').style.visibility = 'hidden'; });
  await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await settle(page, 400);
  await save(await card.screenshot(), 'purchased-card');
  await page.evaluate(() => { document.querySelector('header').style.visibility = ''; });

  const other = page.locator('article').filter({ hasText: 'James Mitchell' }).first();
  await other.locator('select').selectOption('hired');
  const modal = page.locator('[role="dialog"][aria-label="Hiring feedback"]');
  await modal.waitFor();
  await settle(page, 600);
  await save(await modal.screenshot(), 'purchased-feedback');
}

async function shotSettingsTab(page, tabName, waitText, file) {
  console.log(file);
  await open(page, '/company-profile-settings', 'text=Company profile settings');
  await page.locator('nav[class*="sidenav"] button', { hasText: tabName }).click();
  await page.waitForSelector(`text=${waitText}`);
  await settle(page, 1200);
  const panel = page.locator('main [class*="_panel_"]').first();
  await save(await panel.screenshot(), file);
}

// ---------- Run ----------

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SCALE });
converter = await context.newPage();
const page = await context.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

await login(page);
await hideMatch(page);
await installApiMock(page);

const SHOTS = {
  profile: shotProfile,
  credits: shotCredits,
  payment: shotPaymentMethods,
  alert: shotLowBalanceAlert,
  search: shotSearch,
  bookmarks: shotBookmarks,
  purchased: shotPurchased,
  team: (p) => shotSettingsTab(p, 'Team', 'Invite member', 'team'),
  reputation: (p) => shotSettingsTab(p, 'Reputation management', 'Overall reputation', 'reputation'),
};
const only = process.env.HELP_SHOTS_ONLY?.split(',').map((name) => name.trim());

try {
  for (const [name, shot] of Object.entries(SHOTS)) {
    if (!only || only.includes(name)) await shot(page);
  }
} catch (err) {
  const debugPath = path.join(OUT, '..', 'help-screenshots-error.png');
  await page.screenshot({ path: debugPath }).catch(() => {});
  console.error(`Failed on ${page.url()} — see ${debugPath} (delete it afterwards)\n`, err.message);
  process.exitCode = 1;
}

if (errors.length) console.log('page errors:', errors);
await browser.close();
