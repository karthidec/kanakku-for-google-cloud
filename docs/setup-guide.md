# Setup Guide

Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

This guide explains how to create a Chrome Extension OAuth client, configure your local build, and connect Kanakku to your BigQuery Cloud Billing summary table.

## Prerequisites

- A Google Cloud project with **BigQuery API** enabled (`bigquery.googleapis.com`).
- A BigQuery dataset and daily billing summary table that your Google account can read (IAM roles: **BigQuery Data Viewer** and **BigQuery Job User**).
- Node.js and npm installed locally.

## Step 1: Build and Load the Extension to Get Your Extension ID

1. Install dependencies and build the extension:
   ```bash
   npm install
   npm run build
   ```
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Click **Load unpacked** and select the `dist/` directory.
4. Copy the **ID** shown on the Kanakku extension card (for example, `YOUR_EXTENSION_ID`).

## Step 2: Create a Chrome Extension OAuth Client

1. In Google Cloud Console, go to **APIs & Services → OAuth consent screen** (or **Google Auth Platform → Branding / Audience**) for your project (`YOUR_PROJECT_ID`):
   - Choose **Internal** (if using a Google Workspace org) or **External** (and add your Google email under **Test users**).
   - Add the scope: `https://www.googleapis.com/auth/bigquery.readonly`.
2. Go to **Credentials → Create Credentials → OAuth client ID**.
3. Select **Application type: Chrome extension**.
4. Paste your **Item ID** (`YOUR_EXTENSION_ID`) from Step 1 and click **Create**.
5. Copy the generated **Client ID** (looks like `YOUR_CHROME_EXTENSION_CLIENT_ID.apps.googleusercontent.com`).

## Step 3: Add Your Local OAuth Config (Git-Ignored)

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
   Then click **Reload** on the Kanakku card in `chrome://extensions`.

## Step 4: Sign In and Configure Settings

1. Right-click the Kanakku toolbar icon and choose **Options** (or click **Extension options** in `chrome://extensions`).
2. Click **Sign in with Google** and grant the read-only BigQuery permission.
3. Fill in your BigQuery settings:
   - **Billing export project ID:** `YOUR_BILLING_PROJECT_ID`
   - **Dataset name:** `YOUR_DATASET_NAME`
   - **Summary table name:** `daily_resource_costs`
   - **Cache time (minutes):** `60` (default)
   - **Monthly spend alert threshold (0 = off):** Optional budget alert in your billing currency
   - **AI explanations & Gemini API key (optional):** Off by default. Leave blank to use the built-in **Standard Summary** locally, or enable and enter your own Gemini API key for Gemini-powered FinOps/SRE briefs.
4. Click **Save settings**, then click **Test connection**.
5. You should see: `Connected! Found the summary table in BigQuery.`
