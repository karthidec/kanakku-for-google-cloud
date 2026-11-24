# Changelog

All notable changes to Kanakku for Google Cloud are documented in this file.

## [0.1.0] - 2026-11-24

### Added
- Console URL parser in `src/core/url` supporting Cloud Run services, Compute Engine VM instances, and Cloud Storage buckets, with unit tests and URL fixtures.
- Active-tab URL detection in the service worker and resource display in the side panel (using `https://console.cloud.google.com/*` host permission only).
- Initial Manifest V3 Chrome extension scaffold in TypeScript built with esbuild into `dist/`.
- Service worker configuring the toolbar action to open the side panel.
- Side panel UI showing the initial empty-state message and options page placeholder.
- Original geometric price-tag placeholder icons (`16`, `32`, `48`, `128`).
- Vitest, ESLint, Prettier, Apache 2.0 `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, draft `docs/privacy-policy.md`, and GitHub Actions CI workflow.
