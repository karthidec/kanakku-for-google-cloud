# Build prompts for Antigravity, phase by phase

How to use:
- Open this folder in Antigravity. Keep the Agent in Planning mode.
- Paste ONE phase at a time. Review the implementation plan before approving.
- Finish each phase's "Done when" checks before moving to the next.
- Do DEMO-SETUP.md in parallel (it needs 1 to 2 days for billing data to appear).

---------------------------------------------------------------

## Phase 0: Scaffold the extension

Set up this repository following AGENTS.md and the rules in .agents/rules.
Create a Manifest V3 Chrome extension in TypeScript, built with esbuild into dist/.
Include: a service worker, a side panel page, an options page, and a placeholder icon that does not resemble any Google logo.
The side panel should open from the extension's toolbar button and show "Open a Google Cloud resource to see its cost."
Add Vitest, ESLint, Prettier, a .gitignore (include .env, dist, any local data), LICENSE (Apache 2.0), README skeleton with the sections required by the rules, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md, and docs/privacy-policy.md (draft).
Add a GitHub Actions workflow that runs build, lint, and tests on every pull request.
Use the fewest permissions possible and explain each one in the plan.

Done when: npm run build works, I can load dist/ as an unpacked extension in Chrome, the side panel opens, and tests and lint pass.

---------------------------------------------------------------

## Phase 1: Console URL parser

Use /new-feature. Build src/core/url.
Given a Google Cloud console URL, return a structured identity: project id, service type, region or zone, and resource name. Return "unsupported" for anything else.
Support version 1 services: Cloud Run services, Compute Engine VM instances, Cloud Storage buckets.
First, look up the current console URL formats in official docs and real examples, and show me the patterns you found before coding.
Create tests/fixtures with at least 5 example URLs per service, including edge cases (different tabs of the same resource, missing project parameter, encoded characters).
Wire it up: when the active tab URL changes, the side panel shows the detected resource (no cost yet).

Done when: all parser tests pass, and the side panel shows the correct resource name when I browse to each service type in my own console.

---------------------------------------------------------------

## Phase 2: Settings and sign-in

Use /new-feature. Build the options page and sign-in.
Settings: billing export project id, dataset name, summary table name, cache time (default 60 minutes), and an "AI explanations" toggle (off by default, not functional yet).
Sign-in: use chrome.identity with an OAuth client of type "Chrome extension" and only the BigQuery read-only scope.
Add a "Test connection" button that runs a tiny query against the summary table and shows a plain-English result.
Add a "Clear all data" button.
Write docs/setup-guide.md explaining how a user creates the OAuth client and fills in settings, using placeholders only.
Do not put any real client id in the repo. Load it from a local, git-ignored config file.

Done when: I can sign in with my own account and "Test connection" succeeds against my demo project.

---------------------------------------------------------------

## Phase 3: The daily summary table

Use /new-feature. Create sql/create_daily_summary.sql.
First, look up the current Cloud Billing detailed (resource-level) export schema in official docs and show me the exact fields you will use, including how credits and list prices are represented.
The scheduled query should build a small table with one row per day, project, service, and resource, including: cost before discounts, credits total, cost after credits (what you pay), currency, and the latest usage time seen.
Keep it cheap: only process recent days on each run (configurable, default the last 3 days) and merge into the summary table.
Write docs/admin-guide.md: how an admin creates this scheduled query once and gives teams read-only access to the summary table only.
Do NOT run anything against my project. Give me the exact steps and I will run them.

Done when: I have run the scheduled query in my demo project and the summary table has rows.

---------------------------------------------------------------

## Phase 4: Cost in the side panel

Use /new-feature. Build src/core/billing and connect it to the side panel.
For the detected resource, show:
1. What you pay this month (cost after credits)
2. Before discounts (smaller text)
3. Change versus the same days last month, as a percent
4. A 30-day daily cost mini chart (plain SVG, no chart libraries)
5. Freshness ("as of 6 hours ago") based on the latest usage time in the data
6. Precision label: "this resource" or "project share" if resource-level data is not available for that service
Use cached results when fresh. Show friendly states for: not signed in, billing export missing, no data yet, unsupported page.
Unit test the SQL builders, cost math, percent change, and formatting.

Done when: opening my demo Cloud Run service shows real numbers that match the Cloud Billing reports page for the same period (I will check manually).

---------------------------------------------------------------

## Phase 5: Waste warnings (no AI)

Use /new-feature. Build src/core/insights with simple, explainable rules. Start with:
1. Cloud Run: cost every day but very low traffic signals (for example, steady daily cost with min instances likely above 0). Phrase it as a possibility, not a certainty.
2. Compute Engine: VM costing money every day for 14+ days in a project with no recent changes (flag for review only).
3. Cloud Storage: bucket cost growing week over week for 4 weeks.
Each warning shows: what we noticed, why it might matter, an estimated monthly amount at stake (clearly labeled estimate), and a "how to check" link to official docs.
Never tell the user to delete anything. Suggest checks only.
If a rule needs data we do not have from billing export alone, tell me which official read-only API would be needed and wait for approval before adding any permission.

Done when: my demo Cloud Run service with min instances set to 2 shows the warning.

---------------------------------------------------------------

## Phase 6: Optional extras (do one at a time, only after Phase 5)

6a. On-page badge: a small, feature-flagged price tag next to the resource name. It must fail silently if the console layout changes, and the side panel must keep working without it.
6b. Cost column on list pages for the 3 supported services, also feature-flagged.
6c. AI explanation (off by default): when the user turns it on and adds their own Gemini setup, a "Why is this expensive?" button sends ONLY the small summary shown in the panel (no raw billing rows) and shows a short plain-English explanation plus one suggested check. Show the exact text being sent before sending.

Done when: each extra works and can be turned off in settings with no side effects.

---------------------------------------------------------------

## Phase 7: Docs, privacy, and release

Finish README (with screenshot), docs/setup-guide.md, docs/admin-guide.md, docs/privacy-policy.md, docs/architecture.md (with a Mermaid diagram), and docs/store-listing.md (Chrome Web Store text and permission explanations). Use the full display name "Kanakku for Google Cloud: price tags for your Google Cloud console" and the exact independent community project disclaimer in README and docs/store-listing.md.
Add CONTRIBUTING ideas: new services (BigQuery, GKE, Agent Platform), list page support, localization, Firefox support.
Then run /release-check.

Done when: every release-check item passes.
