---
trigger: always_on
---

# Engineering rules (always on)

- Before changing code, write an implementation plan and wait for my approval when the change touches more than 3 files.
- Before using any Google Cloud API, BigQuery billing export field, or console URL pattern, look it up in official Google documentation (use the Google Developer Knowledge MCP server if available) and tell me what you found. Do not guess field names.
- Manifest V3 only. No remotely hosted code. All code ships inside the extension.
- Read the resource identity ONLY from the page URL. Never read page content, DOM text, or form values to get data.
- Keep the URL parser pure and fully unit tested with real example URLs in tests/fixtures.
- All money values are handled as numbers in the billing currency and formatted only at display time.
- Always show both "what you pay" (cost plus credits) and "before discounts", and label which is which.
- Every displayed number must carry a freshness label and a precision label (exact resource, project share, or estimate).
- Cache query results in chrome.storage.local for a short time (default 60 minutes). Never re-query on every page change.
- Handle errors in plain language for the user (for example "Billing export not found. Open setup guide.") and never show raw stack traces.
- Prefer small, readable functions. Add a short comment only where the "why" is not obvious.
