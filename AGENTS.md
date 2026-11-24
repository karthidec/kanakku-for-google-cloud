# Project: Kanakku for Google Cloud

- Full display name: "Kanakku for Google Cloud: price tags for your Google Cloud console"
- Short name: "Kanakku" (Tamil for "accounts", pronounced KUH-nuk-koo)
- GitHub repo: `kanakku-for-google-cloud`

## What this project is
Kanakku is an independent, open source Chrome extension that shows what Google Cloud resources cost, right next to the Google Cloud console.
When a user opens a resource page (for example a Cloud Run service), a side panel shows: cost this month, cost before discounts, how fresh the data is, a 30-day daily trend, and simple waste warnings (for example "always-on instances with near-zero traffic").

Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google. Never use Google logos or wording that suggests Google made or endorses it.

## The problem it solves
In the console you can see a resource's settings but not its cost. Cost lives in separate billing reports, so people find out at the end of the month. Kanakku puts the price tag where the decision happens.

## How it works (high level)
1. Kanakku reads ONLY the current page address (URL) to identify which resource the user is looking at (project, service type, region, resource name).
2. It queries the user's OWN Cloud Billing export in BigQuery, using the user's own Google sign-in with read-only access.
3. It reads from a small daily summary table (created once by a scheduled query), never scanning the full billing export on every page view.
4. It shows the result in the Chrome side panel. Optional small badges on the page are a later, feature-flagged extra.

## Core principles
1. Read-only. Kanakku never changes anything in Google Cloud and never automates console actions.
2. No scraping. Cost data comes only from official APIs (BigQuery). The console page is used only for its URL.
3. No servers of ours. Data goes from the user's Google account straight to their browser. No telemetry, no analytics, no tracking.
4. Honest numbers. Every number shows its source and freshness ("as of 6 hours ago", "estimated", "project-level share").
5. Cheap to run. Queries hit a small daily summary table and results are cached, so most users stay within BigQuery free allowances.
6. AI is optional and off by default. When on, it uses the user's own Gemini setup.
7. Simple, boring, readable code. This repo is meant to be learned from.

## Tech stack
- Chrome extension, Manifest V3, Chrome Side Panel API (chrome.sidePanel)
- TypeScript, built with a minimal bundler (esbuild). No heavy frameworks.
- Sign-in: chrome.identity with an OAuth client of type "Chrome extension"
- Scopes: BigQuery read-only (https://www.googleapis.com/auth/bigquery.readonly). Add nothing else without asking.
- BigQuery REST API (jobs.query) called directly with fetch
- Storage: chrome.storage.local for settings and a short-lived cache only
- Tests: Vitest for unit tests (URL parsing, SQL builders, cost math, formatting)
- Lint and format: ESLint and Prettier

## Supported services (version 1)
Start with three, then expand:
1. Cloud Run services
2. Compute Engine VM instances
3. Cloud Storage buckets
Later: BigQuery, GKE, Agent Platform.

## Repository layout (target)
- src/background/        service worker: auth, messaging, query orchestration
- src/sidepanel/         side panel UI (HTML, CSS, TS)
- src/options/           settings page (billing project, dataset, table names, AI toggle)
- src/core/url/          console URL parser, one module per service, with fixtures
- src/core/billing/      SQL builders, BigQuery client, result mapping
- src/core/insights/     rule-based waste checks (no AI)
- src/core/format/       money, percent, freshness formatting
- sql/                   scheduled query that builds the daily summary table
- docs/                  setup guide, admin guide, privacy policy, architecture
- tests/                 unit tests and URL fixtures

## Commands
- Install: npm install
- Build: npm run build (outputs dist/ to load as an unpacked extension)
- Test: npm test
- Lint: npm run lint

## Definition of done for any change
- Unit tests added or updated and passing
- Lint passing
- No new permissions or scopes unless I approved them
- Docs updated if behavior or setup changed
- No secrets, project ids, billing account ids, or real billing data in the repo
