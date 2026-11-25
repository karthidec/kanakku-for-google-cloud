-- Kanakku for Google Cloud: Daily Resource Cost Summary Scheduled Query
--
-- Builds and incrementally updates a small, partitioned daily summary table
-- from the Cloud Billing detailed (resource-level) BigQuery export.
--
-- Replace the placeholders before running:
--   YOUR_BILLING_PROJECT_ID   -> Google Cloud project hosting the billing export
--   YOUR_DATASET_NAME         -> BigQuery dataset containing the export table
--   YOUR_BILLING_ACCOUNT_ID   -> Billing account ID with hyphens replaced by underscores (e.g. 012345_6789AB_CDEF01)

DECLARE lookback_days INT64 DEFAULT 3;

CREATE TABLE IF NOT EXISTS
  `YOUR_BILLING_PROJECT_ID.YOUR_DATASET_NAME.daily_resource_costs` (
    usage_date DATE,
    project_id STRING,
    service_description STRING,
    resource_name STRING,
    resource_global_name STRING,
    region STRING,
    zone STRING,
    currency STRING,
    cost_before_discounts NUMERIC,
    cud_credits NUMERIC,
    other_credits NUMERIC,
    credits_total NUMERIC,
    cost_after_credits NUMERIC,
    cost_at_list NUMERIC,
    latest_usage_time TIMESTAMP,
    updated_at TIMESTAMP
  )
PARTITION BY usage_date
CLUSTER BY project_id, service_description, resource_name;

MERGE `YOUR_BILLING_PROJECT_ID.YOUR_DATASET_NAME.daily_resource_costs` AS T
USING (
  SELECT
    DATE(usage_start_time) AS usage_date,
    COALESCE(project.id, '') AS project_id,
    COALESCE(service.description, '') AS service_description,
    COALESCE(resource.name, '') AS resource_name,
    COALESCE(resource.global_name, '') AS resource_global_name,
    COALESCE(location.region, '') AS region,
    COALESCE(location.zone, '') AS zone,
    COALESCE(currency, '') AS currency,
    SUM(CAST(cost AS NUMERIC)) AS cost_before_discounts,
    SUM(
      (
        SELECT IFNULL(SUM(CAST(c.amount AS NUMERIC)), 0)
        FROM UNNEST(credits) AS c
        WHERE c.type IN (
          'COMMITTED_USAGE_DISCOUNT',
          'COMMITTED_USAGE_DISCOUNT_DOLLAR_BASE',
          'FEE_UTILIZATION_OFFSET'
        )
      )
    ) AS cud_credits,
    SUM(
      (
        SELECT IFNULL(SUM(CAST(c.amount AS NUMERIC)), 0)
        FROM UNNEST(credits) AS c
        WHERE c.type NOT IN (
          'COMMITTED_USAGE_DISCOUNT',
          'COMMITTED_USAGE_DISCOUNT_DOLLAR_BASE',
          'FEE_UTILIZATION_OFFSET'
        ) OR c.type IS NULL
      )
    ) AS other_credits,
    SUM(
      (
        SELECT IFNULL(SUM(CAST(c.amount AS NUMERIC)), 0)
        FROM UNNEST(credits) AS c
      )
    ) AS credits_total,
    SUM(CAST(cost AS NUMERIC)) + SUM(
      (
        SELECT IFNULL(SUM(CAST(c.amount AS NUMERIC)), 0)
        FROM UNNEST(credits) AS c
      )
    ) AS cost_after_credits,
    SUM(CAST(IFNULL(cost_at_list, 0) AS NUMERIC)) AS cost_at_list,
    MAX(usage_end_time) AS latest_usage_time,
    CURRENT_TIMESTAMP() AS updated_at
  FROM
    `YOUR_BILLING_PROJECT_ID.YOUR_DATASET_NAME.gcp_billing_export_resource_v1_YOUR_BILLING_ACCOUNT_ID`
  WHERE
    export_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL lookback_days + 2 DAY)
    AND DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY)
  GROUP BY
    usage_date,
    project_id,
    service_description,
    resource_name,
    resource_global_name,
    region,
    zone,
    currency
) AS S
ON
  T.usage_date >= DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY)
  AND T.usage_date = S.usage_date
  AND T.project_id = S.project_id
  AND T.service_description = S.service_description
  AND T.resource_name = S.resource_name
  AND T.resource_global_name = S.resource_global_name
  AND T.region = S.region
  AND T.zone = S.zone
  AND T.currency = S.currency
WHEN MATCHED THEN
  UPDATE SET
    T.cost_before_discounts = S.cost_before_discounts,
    T.cud_credits = S.cud_credits,
    T.other_credits = S.other_credits,
    T.credits_total = S.credits_total,
    T.cost_after_credits = S.cost_after_credits,
    T.cost_at_list = S.cost_at_list,
    T.latest_usage_time = S.latest_usage_time,
    T.updated_at = S.updated_at
WHEN NOT MATCHED THEN
  INSERT (
    usage_date,
    project_id,
    service_description,
    resource_name,
    resource_global_name,
    region,
    zone,
    currency,
    cost_before_discounts,
    cud_credits,
    other_credits,
    credits_total,
    cost_after_credits,
    cost_at_list,
    latest_usage_time,
    updated_at
  )
  VALUES (
    S.usage_date,
    S.project_id,
    S.service_description,
    S.resource_name,
    S.resource_global_name,
    S.region,
    S.zone,
    S.currency,
    S.cost_before_discounts,
    S.cud_credits,
    S.other_credits,
    S.credits_total,
    S.cost_after_credits,
    S.cost_at_list,
    S.latest_usage_time,
    S.updated_at
  );
