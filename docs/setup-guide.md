# Setup Guide

Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

---

## Option 1: Installed from the Chrome Web Store (End Users & Teams)

### Prerequisites
- Your Google account has read-only access to your team's `daily_resource_costs` BigQuery summary table (**BigQuery Data Viewer** on the table + **BigQuery Job User** on the query project).
- If your team has not created `daily_resource_costs` yet, ask an admin to follow [docs/admin-guide.md](admin-guide.md) once.

### Steps
1. Install **Kanakku for Google Cloud** from the Chrome Web Store.
2. Right-click the Kanakku icon in the Chrome toolbar and select **Options** (or open `chrome://extensions` → **Details** → **Extension options**).
3. Click **Sign in with Google** and approve the read-only BigQuery scope (`https://www.googleapis.com/auth/bigquery.readonly`).
4. Enter your BigQuery settings:
   - **Billing export project ID:** `YOUR_BILLING_PROJECT_ID`
   - **Dataset name:** `YOUR_DATASET_NAME`
   - **Summary table name:** `daily_resource_costs`
   - **Cache time (minutes):** `60` (default)
   - **Monthly spend alert threshold (0 = off):** Optional budget alert in your billing currency
   - **AI explanations & Gemini API key (optional):** Off by default. Leave blank to use the local **Standard Summary**, or enable and enter your own Gemini API key.
5. Click **Save settings**, then click **Test connection**.
6. You should see: `Connected! Found the summary table in BigQuery.`
7. Open Google Cloud Console (`https://console.cloud.google.com`) and click the Kanakku toolbar icon to open the side panel.

---

## Option 2: Building from Source (Developers / Unpacked Extension)

### Prerequisites
- Node.js and npm installed locally.
- A Google Cloud project with **BigQuery API** enabled (`bigquery.googleapis.com`).
- A BigQuery dataset and `daily_resource_costs` summary table (see [docs/admin-guide.md](admin-guide.md)).

### Step 1: Build and Load the Extension to Get Your Extension ID
1. Install dependencies and build the extension:
   ```bash
   npm install
   npm run build
   ```
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Click **Load unpacked** and select the `dist/` directory.
4. Copy the **ID** shown on the Kanakku extension card (`YOUR_EXTENSION_ID`).

### Step 2: Create a Chrome Extension OAuth Client
1. In Google Cloud Console, go to **APIs & Services → Google Auth Platform** (or **OAuth consent screen**) for your project (`YOUR_PROJECT_ID`):
   - **Audience:** Choose **Internal** (Workspace org) or **External** (add your email under **Test users**).
   - **Data Access:** Add the scope `https://www.googleapis.com/auth/bigquery.readonly`.
2. Go to **Clients** (or **Credentials → Create Credentials → OAuth client ID**).
3. Select **Application type: Chrome extension**, paste `YOUR_EXTENSION_ID` as the **Item ID**, and click **Create**.
4. Copy the generated **Client ID** (`YOUR_CHROME_EXTENSION_CLIENT_ID.apps.googleusercontent.com`).

### Step 3: Add Your Local OAuth Config (Git-Ignored)
1. Copy `oauth.example.json` to `oauth.local.json` in the repository root:
   ```bash
   cp oauth.example.json oauth.local.json
   ```
2. Replace the placeholder in `oauth.local.json` with your Client ID:
   ```json
   {
     "client_id": "YOUR_CHROME_EXTENSION_CLIENT_ID.apps.googleusercontent.com"
   }
   ```
   *(Never commit `oauth.local.json`; it is listed in `.gitignore`.)*
3. Rebuild and reload the extension:
   ```bash
   npm run build
   ```
   Then click **Reload** (`↻`) on the Kanakku card in `chrome://extensions` and follow **Option 1 (Steps 2–7)** above.
