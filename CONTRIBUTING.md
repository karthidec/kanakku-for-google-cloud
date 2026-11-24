# Contributing to Kanakku for Google Cloud

Thank you for helping improve Kanakku for Google Cloud!

> Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

## Development Setup

```bash
npm install
npm run build
npm run lint
npm test
```

Load the `dist/` directory in `chrome://extensions` with **Developer mode** enabled to test changes locally.

## Guidelines

1. **Read-only & minimal permissions:** Never add Chrome permissions, host permissions, or OAuth scopes without documenting why in your PR and updating `docs/privacy-policy.md`.
2. **No DOM scraping:** Resource identity must come only from the page URL, never from console DOM content.
3. **No secrets or real billing data:** Never commit OAuth client secrets, API keys, project IDs, billing account IDs, or real billing exports.
4. **Tests & lint required:** Add or update unit tests in `tests/` and ensure `npm run build`, `npm run lint`, `npm run typecheck`, and `npm test` all pass.
5. **Keep docs current:** Update `README.md`, `CHANGELOG.md`, and `docs/privacy-policy.md` when behavior or permissions change.
