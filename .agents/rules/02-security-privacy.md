---
trigger: always_on
---

# Security and privacy rules (always on)

- Request the fewest permissions possible. Host permissions only for the Google Cloud console and the BigQuery API. Ask me before adding any permission or OAuth scope.
- Read-only access only. Never call any API that creates, changes, or deletes Google Cloud resources.
- Never automate clicks or actions in the console.
- No backend, no telemetry, no analytics, no third-party scripts, no remote fonts.
- Never send billing data anywhere except the user's own browser. The optional AI feature sends only a small, user-visible summary, and only after the user turns it on.
- Never commit secrets, OAuth client secrets, API keys, project ids, billing account ids, or real billing data. Use placeholders and .gitignore.
- Store only settings and short-lived cache in chrome.storage.local. Provide a "Clear all data" button.
- Never run gcloud or any command that changes cloud state without showing me the exact command and getting my approval.
- Never ask for, store, or type my Google password. Testing in a real signed-in console is done by me, manually.
