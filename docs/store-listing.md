# Chrome Web Store Listing (Draft)

> Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

## Title
Kanakku for Google Cloud: price tags for your Google Cloud console

## Short Description
See Google Cloud resource costs, CUD savings, 30-day trends, and waste alerts right beside the console using your own BigQuery export.

## Full Description
In the Google Cloud console you can see a resource's settings, but not what it costs. Kanakku for Google Cloud puts the price tag where decisions happen—right inside a Chrome side panel next to your console tab.

### What Kanakku Shows
- **Full Cost Waterfall:** Final price this month, List price, Contract discounts, Committed Use Discount (CUD) credits, Other credits, and Total savings %.
- **30-Day Trend & Freshness:** Plain-SVG daily cost chart with hover tooltips, % change vs. the same days last month, month-end pace estimate, and data freshness (`as of X hours ago`).
- **Resource, Service List & Project Views:** Works on individual resources, service list pages, and Console Home (`/home/dashboard`).
- **Action Required Alerts:** Configurable monthly spend threshold, always-on flat-cost checks, spend spike alerts, and CUD coverage hints.
- **Executive Summary:** Always-on local Standard Summary for SREs, FinOps, and leaders, plus optional Gemini AI summary with your own API key.

### Privacy & Security First
- **Read-only:** Never creates, modifies, or deletes cloud resources.
- **No DOM scraping:** Reads only the active console URL—never page content.
- **No backend or tracking:** Data flows directly between your Google account and your browser.
- **Cheap to run:** Queries a small, partitioned daily summary table (`daily_resource_costs`) and caches results locally (default 60 minutes).

### Permissions Justification
- `sidePanel`: Displays Kanakku in Chrome's side panel.
- `identity`: Signs in with your Google account using read-only BigQuery access (`bigquery.readonly`).
- `storage`: Saves your settings and short-lived local cost cache in `chrome.storage.local`.
- `https://console.cloud.google.com/*`: Reads only the active tab URL to identify the resource or service.
- `https://bigquery.googleapis.com/*`: Queries your own BigQuery billing summary table.
- `https://generativelanguage.googleapis.com/*`: Used only if you opt in to AI explanations with your own Gemini API key.
