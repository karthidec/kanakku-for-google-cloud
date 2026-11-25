# Kanakku for Google Cloud: price tags for your Google Cloud console

Kanakku for Google Cloud ("Kanakku", Tamil for "accounts", pronounced *KUH-nuk-koo*) is an independent, open source Chrome extension that shows what your Google Cloud resources cost right next to the Google Cloud console.

> **Disclaimer:** Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

## Preview

_Screenshot or short GIF coming soon._

## Features

- **Resource & Service Cost Waterfall:** Final price this month, List price, Contract discount, CUD credits (`COMMITTED_USAGE_DISCOUNT*`, `FEE_UTILIZATION_OFFSET`), Other credits, and total savings %.
- **30-Day Trend & Freshness:** Plain-SVG daily cost bar chart with hover tooltips, % change vs. same days last month, month-end pace estimate (`estimated`), and data freshness (`as of X hours ago`).
- **Service List & Project Executive Overview:** Ranked per-resource costs on service list pages and ranked per-service costs on Console Home (`/home/dashboard`).
- **Action Required Alerts:** Configurable monthly spend threshold, always-on flat-cost detection, spend spike alerts, credits-masking-spend reminders, and CUD coverage hints.
- **Standard & Opt-In AI Executive Summary:** Always-on deterministic SRE/FinOps/Leader summary, plus optional Gemini summary when you turn it on and supply your own Gemini API key.
- **Supported Services:** Cloud Run, Compute Engine, Cloud Storage, GKE, BigQuery, Vertex AI, Cloud SQL, Cloud Pub/Sub, Artifact Registry, plus all billed services on Console Home (`/home/dashboard`).

## 10-Minute Setup Guide

See [docs/setup-guide.md](docs/setup-guide.md) for user setup (OAuth client, `oauth.local.json`, building `dist/`, and configuring Options) and [docs/admin-guide.md](docs/admin-guide.md) for scheduling [sql/create_daily_summary.sql](sql/create_daily_summary.sql).

Quick start:
```bash
npm install
npm run build
```
Load `dist/` in `chrome://extensions` with **Developer mode** enabled.

## What Data It Reads and Why

- **Page URL only:** Kanakku reads only the active `https://console.cloud.google.com/*` tab URL to identify the project, service, or resource. It never reads DOM content or form values.
- **BigQuery read-only:** Queries your own `daily_resource_costs` summary table directly from your browser using `bigquery.readonly`.
- **Optional Gemini API:** Off by default. Only when enabled with your own Gemini API key does Kanakku send the small, visible cost summary to `generativelanguage.googleapis.com`; otherwise it uses the built-in Standard Summary locally.
- See [docs/privacy-policy.md](docs/privacy-policy.md).

## Known Limitations

- Requires the **Detailed usage cost** BigQuery billing export (`gcp_billing_export_resource_v1_*`) and the scheduled summary table (`daily_resource_costs`).
- When a service does not emit resource-level billing rows, Kanakku falls back to project-level service spend labeled `project share`.
- Chrome desktop only (Manifest V3 `chrome.sidePanel` API).

## How to Contribute

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) before opening a pull request.

## License

Apache 2.0 — see [LICENSE](LICENSE).
