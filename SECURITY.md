# Security Policy

Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

## Security Principles

- **Read-only access:** Kanakku never modifies Google Cloud resources or automates console actions.
- **No backend or telemetry:** Data stays in the user's browser; there are no Kanakku servers, analytics, or tracking.
- **Minimal permissions:** Only strictly necessary Manifest V3 permissions and OAuth scopes are requested.
- **No secrets in the repository:** Never commit credentials, project IDs, billing account IDs, or real billing data.

## Reporting a Vulnerability

If you discover a security or privacy issue, please do **not** open a public issue with exploit details. Instead, report it privately via GitHub Security Advisories (or contact the repository maintainers directly) with:

- A clear description of the issue and potential impact
- Steps to reproduce
- Any suggested remediation

We will acknowledge receipt promptly and work with you on a fix before public disclosure.
