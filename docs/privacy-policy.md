# Privacy Policy

_Last updated: 2026-11-25_

Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

## Summary

- **No servers of ours:** Kanakku has no backend servers, no analytics, and no telemetry.
- **Your data stays in your browser:** Billing data is queried directly from your own Google Cloud account to your browser.
- **Read-only:** Kanakku never creates, modifies, or deletes Google Cloud resources.

## What Kanakku Accesses

- **Chrome permissions:** `sidePanel` (to display the side panel), `identity` (for Google sign-in with the read-only `https://www.googleapis.com/auth/bigquery.readonly` scope), and `storage` (to save settings and short-lived cost cache in `chrome.storage.local`).
- **Host permissions:**
  - `https://console.cloud.google.com/*` — Used solely to read the active tab's URL. Kanakku never reads webpage DOM content, form values, or console text.
  - `https://bigquery.googleapis.com/*` — Used solely to run read-only BigQuery queries against your configured summary table.
  - `https://generativelanguage.googleapis.com/*` — Used **only** if you explicitly turn on **AI explanations** and enter your own Gemini API key in Options. When enabled, Kanakku sends only the small, visible cost summary (never raw billing rows or account IDs). When disabled or no key is set, Kanakku uses the local Standard Summary with zero AI network calls.
- **Local storage:** Settings, your optional Gemini API key, and cached cost summaries are stored locally in `chrome.storage.local`. You can remove all saved settings, cache, and sign-in tokens at any time using the **Clear all data** button on the Options page.

## Contact

For privacy questions, please open an issue in the `kanakku-for-google-cloud` GitHub repository.
