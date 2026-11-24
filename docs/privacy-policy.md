# Privacy Policy (Draft)

_Last updated: 2026-11-24_

Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

## Summary

- **No servers:** Kanakku has no backend servers, no analytics, and no telemetry.
- **Your data stays in your browser:** When BigQuery integration is enabled in future versions, billing data is queried directly from your own Google Cloud account to your browser.
- **Read-only:** Kanakku never creates, modifies, or deletes Google Cloud resources.

## What the Current Version (`0.1.0`) Accesses

- **Chrome permissions:** Only `sidePanel` (used to open the side panel when you click the extension toolbar icon).
- **Page content:** None. Kanakku does not read webpage DOM content.
- **Network requests:** None.
- **Local storage:** None.

## Planned Future Data Access

When resource cost lookup is added in upcoming versions, this policy will be updated alongside those changes to reflect:
- Reading only the active Google Cloud console URL to identify the resource.
- Read-only BigQuery queries (`bigquery.readonly`) against your own Cloud Billing daily summary table.
- Storing settings and a short-lived local cache in `chrome.storage.local` with a "Clear all data" button.

## Contact

For privacy questions, please open an issue in the `kanakku-for-google-cloud` GitHub repository.
