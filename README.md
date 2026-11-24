# Kanakku for Google Cloud: price tags for your Google Cloud console

Kanakku for Google Cloud ("Kanakku", Tamil for "accounts", pronounced *KUH-nuk-koo*) is an independent, open source Chrome extension that shows what your Google Cloud resources cost right next to the Google Cloud console.

> **Disclaimer:** Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

## Preview

_Screenshot or short GIF coming soon once the cost card UI is implemented._

## 10-Minute Setup Guide (Developer Preview)

1. Clone this repository and install dependencies:
   ```bash
   npm install
   npm run build
   ```
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` directory.
4. Click the Kanakku toolbar icon to open the side panel.

_(BigQuery billing export setup and OAuth configuration steps will be added here in `docs/setup-guide.md` as those features land.)_

## What Data It Reads and Why

- **Current version (`0.1.0` scaffold):** Reads **no** page data, stores **no** user data, and makes **no** network requests. It only requests Chrome's `sidePanel` permission so clicking the toolbar button opens the side panel.
- **Planned behavior:** Kanakku will read only the active Google Cloud console page URL (to identify the resource) and query your own BigQuery Cloud Billing daily summary table directly from your browser using read-only OAuth access. See [docs/privacy-policy.md](docs/privacy-policy.md).

## Known Limitations

- Initial `0.1.0` scaffold: displays the side panel shell and options placeholder only; URL parsing and BigQuery cost queries are not yet implemented.
- Chrome desktop only (Manifest V3 `chrome.sidePanel` API).

## How to Contribute

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) before opening a pull request.

## License

Apache 2.0 — see [LICENSE](LICENSE).
