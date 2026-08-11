---
name: project-overview
description: Architecture and maturity snapshot of the hr-talent-platform frontend (React/Vite, no backend wiring)
metadata:
  type: project
---

hr-talent-platform is a React 18 + Vite frontend (Rocket.new scaffold) for an HR/candidate matching platform where companies spend tokens to unlock candidate CVs. Stack: React Router v6, TailwindCSS + SCSS modules, axios/d3/recharts/framer-motion installed but mostly unused.

**Current maturity: alpha UI prototype.** All 10 pages are visually built (landing-page, for-candidates, login, candidate-search-dashboard, detailed-candidate-cv, bookmarked-candidates, purchased-profiles, token-management, company-profile-settings, candidate-profile) but:
- All data is hardcoded mock arrays inside components — no API/service layer despite axios being installed.
- No authentication at all — login page explicitly says "Demo screen — connect your backend to enable sign-in"; no protected routes, no auth context.
- Redux Toolkit is listed as a "rocketCritical" dependency but is NOT actually used anywhere — every page manages its own local useState, so state (e.g. token balance) is not synced across pages.
- `.env` has placeholder keys for Supabase, Stripe, OpenAI/Gemini/Anthropic/Perplexity, Google Analytics — suggests planned (not yet built) integrations: Supabase for auth/DB, Stripe for payments.
- No tests despite Jest/RTL being installed. No route lazy-loading. Serbian Cyrillic text hardcoded, no i18n library.

**Why:** Built via Rocket.new as a UI scaffold first; backend/auth/state/payments integration was deferred entirely.

**How to apply:** When asked "what's missing besides backend," lead with: auth/protected routes, centralized state (Redux Toolkit installed but unused — token balance inconsistency across pages is the visible symptom), and real Stripe/Supabase wiring. Don't assume any API layer exists — grep before claiming an endpoint is called anywhere.

**2026-07-09 reorg:** `src/pages/` was restructured from a flat list into audience-based segments: `pages/landing/` (landing-page, landing-page-candidates, login), `pages/company/` (candidate-search-dashboard, bookmarked-candidates, purchased-profiles, credit-management, company-profile-settings), `pages/candidate/` (candidate-profile, candidate-settings, company-list, my-ratings, company-details). `company-profile` was renamed to `company-details` (folder + route `/company-details/:companyId` + component name `CompanyDetails`/`CompanyDetailsReviews`) per user request — it's the candidate-side page for viewing one company from `company-list`. `NotFound.jsx` stays at `pages/` root. Imports reaching outside a page folder into `components/`, `data/`, or `utils/` were converted from relative (`../../X`) to absolute (`X`, via the `jsconfig.json` `baseUrl: "./src"`) so they don't break on future folder moves. `src/Routes.jsx` is the single source of truth for the route table and import paths.

**How to apply:** When adding a new page, put it under the correct segment folder (`landing/`, `company/`, or `candidate/`) matching who it's for, and use absolute imports (`components/...`, `data/...`, `utils/...`) rather than deep relative paths.

**2026-07-09 Rocket.new de-scaffolding:** User confirmed they will develop locally (npm + Claude Code) and won't use the Rocket.new web UI again, so all Rocket.new/DhiWise scaffold traces were removed: `@dhiwise/component-tagger` plugin + npm package (was in `vite.config.mjs` and `package.json`), the `allowedHosts: ['.amazonaws.com', '.builtwithrocket.new']` dev-server entry, the `rocketCritical` metadata block in `package.json`, the `<script src="https://static.rocket.new/rocket-web.js?...">` tag in `index.html` (this one actually loaded external JS on every page load — the most consequential trace, not just metadata), the `dhiwise-code` CSS class on the root div, and the "Built with Rocket.new" lines in `README.md`. Build verified clean after each step. The `.env` placeholder keys (Supabase/Stripe/OpenAI/etc.) were flagged as unused but left in place — not yet deleted.

**Why:** These were AI-scaffold artifacts with no functional purpose once development moved off the Rocket.new platform; the `rocket-web.js` script in particular was an active third-party script load tied to this project's specific Rocket.new backend ID.

**How to apply:** Don't assume any Rocket.new/DhiWise tooling exists in this project going forward — it's a plain Vite/React app now. If `.env` deletion or further boilerplate (unused Redux/axios/testing-library deps) comes up, check with the user first since those weren't confirmed yet.
