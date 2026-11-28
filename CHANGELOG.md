# Changelog

All notable changes to Kanakku for Google Cloud are documented in this file.

## [0.1.1] - 2026-11-28

### Changed
- Bumped extension version to `0.1.1` for Chrome Web Store package update.

## [0.1.0] - 2026-11-24

### Added
- GitHub Pages static site (`docs/index.html`, `docs/privacy-policy.html`, `docs/terms.html`) for Google Search Console domain verification and OAuth Branding review.
- Embedded screenshots (`docs/images/kanakku-1.png`, `docs/images/kanakku-2.png`) in `README.md` and added step-by-step Chrome Web Store user setup instructions to `README.md` and `docs/setup-guide.md`.
- Budget pacing bar (when Monthly spend alert threshold > 0), estimated daily/hourly burn rate (`estimated`), and one-click **Download CSV** export on Service List and Project Overview views.
- Original geometric price-tag + ledger-bars Kanakku logo (`src/icons/` and side panel SVG header), replacing the `₹` placeholder, plus refreshed side panel header and framed 30-day chart well (`30d ago` → `Today`).
- Automatic eviction of expired cached OAuth tokens on HTTP 401.
- Support for **Cloud SQL** (`/sql/instances`), **Cloud Pub/Sub** (`/cloudpubsub`), and **Artifact Registry** (`/artifacts`), plus side panel DOM rendering tests.
- Project-wide **Executive Home** view (`/home/dashboard`, `/welcome`) showing all project services ranked by spend.
- Support for **GKE** (`/kubernetes/clusters...`), **BigQuery** (`/bigquery`), and **Vertex AI** (`/vertex-ai`) console pages.
- **Executive Summary** card (`src/core/ai/`) with always-on local **Standard Summary** and opt-in **Gemini AI** (`gemini-2.5-flash`) using your own Gemini API key in Options.
- Updated `README.md`, `docs/setup-guide.md`, `docs/privacy-policy.md`, and `docs/store-listing.md`.
- CUD & cost waterfall breakdown (list price, contract discount, CUD credits, other credits, total savings %, final price) in `sql/create_daily_summary.sql`, `src/core/billing/`, and the side panel.
- Configurable monthly spend alert threshold in Options and **Action required** alerts (`high-spend-alert`, `no-cud-coverage`) in `src/core/insights/`.
- Service list/overview mode (`parseConsoleTarget`, `buildServiceBreakdownQuery`, `fetchServiceBreakdown`) showing total spend and per-resource breakdown on Cloud Run, Compute Engine, and Cloud Storage list pages.
- Side panel loading banner, setup checklist, **Copy summary** button, and read-only **View in Cloud Billing** link.
- `src/core/insights` rule-based cost and waste checks (credits masking spend, always-on flat cost, recent spend spike), month-end pace estimate (`estimated`), credits applied row, and SVG `<title>` hover tooltips on the 30-day chart.
- `src/core/billing` (parameterized SQL builders, BigQuery `jobs.query` client, cost/percent-change math, and `chrome.storage.local` cache) and `src/core/format`.
- Side panel cost card showing month-to-date cost after credits, cost before discounts, % change vs. same days last month, plain-SVG 30-day chart, freshness, precision (`this resource` / `project share`), and friendly status states.
- `sql/create_daily_summary.sql` scheduled query to build and incrementally merge a partitioned daily resource cost summary table from the Cloud Billing detailed export, plus `docs/admin-guide.md`.
- Options page with BigQuery billing export settings, Google sign-in (`chrome.identity` with `bigquery.readonly` scope), **Test connection**, and **Clear all data** button.
- Local build-time OAuth config injection via git-ignored `oauth.local.json` (`oauth.example.json` template) and `docs/setup-guide.md`.
- Console URL parser in `src/core/url` supporting Cloud Run services, Compute Engine VM instances, and Cloud Storage buckets, with unit tests and URL fixtures.
- Active-tab URL detection in the service worker and resource display in the side panel (using `https://console.cloud.google.com/*` host permission only).
- Initial Manifest V3 Chrome extension scaffold in TypeScript built with esbuild into `dist/`.
- Service worker configuring the toolbar action to open the side panel.
- Side panel UI showing the initial empty-state message and options page placeholder.
- Original geometric price-tag placeholder icons (`16`, `32`, `48`, `128`).
- Vitest, ESLint, Prettier, Apache 2.0 `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, draft `docs/privacy-policy.md`, and GitHub Actions CI workflow.
