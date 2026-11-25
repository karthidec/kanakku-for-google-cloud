# Admin Guide: Daily Summary Table & Team Access

Kanakku for Google Cloud is an independent community project and is not affiliated with or endorsed by Google.

This guide explains how a billing or platform administrator sets up the BigQuery daily summary scheduled query once and grants teams read-only access **only** to the summary table (never the full billing export).

## Prerequisites

- **Detailed usage cost** export enabled in Google Cloud Billing to BigQuery (`gcp_billing_export_resource_v1_YOUR_BILLING_ACCOUNT_ID`).
- **BigQuery API** (`bigquery.googleapis.com`) and **BigQuery Data Transfer API** (`bigquerydatatransfer.googleapis.com`) enabled in `YOUR_BILLING_PROJECT_ID`.
- Admin permissions to create scheduled queries and manage IAM on the target table.

## Step 1: Run the Initial Summary Query

1. Open [sql/create_daily_summary.sql](../sql/create_daily_summary.sql) and replace:
   - `YOUR_BILLING_PROJECT_ID` with your BigQuery project ID
   - `YOUR_DATASET_NAME` with your billing export dataset name
   - `YOUR_BILLING_ACCOUNT_ID` with your billing account ID using underscores (for example `012345_6789AB_CDEF01`)
2. *(Optional first-time backfill)* Temporarily change `DECLARE lookback_days INT64 DEFAULT 3;` to `35` (or `90`) for your first manual run so the summary table includes the last 30+ days of history.
3. *(Upgrading an existing `daily_resource_costs` table)* Run this once before re-running the `MERGE` query so CUD and other credit columns exist:
   ```sql
   ALTER TABLE `YOUR_BILLING_PROJECT_ID.YOUR_DATASET_NAME.daily_resource_costs`
   ADD COLUMN IF NOT EXISTS cud_credits NUMERIC,
   ADD COLUMN IF NOT EXISTS other_credits NUMERIC;
   ```
4. Open **BigQuery → SQL workspace** in Google Cloud Console, paste the query, and click **Run**.
4. Confirm `YOUR_BILLING_PROJECT_ID.YOUR_DATASET_NAME.daily_resource_costs` was created and contains rows:
   ```sql
   SELECT COUNT(*) AS row_count, MAX(latest_usage_time) AS latest_usage_time
   FROM `YOUR_BILLING_PROJECT_ID.YOUR_DATASET_NAME.daily_resource_costs`;
   ```

## Step 2: Schedule the Query Once

1. Set `lookback_days` back to `3` (`DECLARE lookback_days INT64 DEFAULT 3;`) so each scheduled run only scans the last few days of billing data.
2. In BigQuery SQL workspace, click **Schedule → Create new scheduled query**.
3. Configure:
   - **Name:** `kanakku-daily-resource-costs`
   - **Repeats:** Daily (or every 12 hours)
   - **Query:** Keep the `CREATE TABLE IF NOT EXISTS` + `MERGE` script (do **not** set a separate destination table, because `MERGE` writes directly into `daily_resource_costs`).
4. Click **Save**.

## Step 3: Grant Teams Read-Only Access to the Summary Table Only

Give developers read access to `daily_resource_costs` **without** granting access to `gcp_billing_export_resource_v1_*`:

1. In BigQuery Explorer, open the table `YOUR_BILLING_PROJECT_ID.YOUR_DATASET_NAME.daily_resource_costs`.
2. Click **Share → Manage permissions** (at the **table** level, not the dataset level).
3. Add your team's Google Group or user emails with role **BigQuery Data Viewer** (`roles/bigquery.dataViewer`).
4. In **IAM & Admin → IAM** for `YOUR_BILLING_PROJECT_ID` (or the project where users run queries), grant the same group **BigQuery Job User** (`roles/bigquery.jobUser`) so they can run read-only queries.

## Step 4: Share Settings with Your Team

Team members enter these values in the Kanakku **Options** page:
- **Billing export project ID:** `YOUR_BILLING_PROJECT_ID`
- **Dataset name:** `YOUR_DATASET_NAME`
- **Summary table name:** `daily_resource_costs`
