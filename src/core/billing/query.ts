import type {
  ResourceIdentity,
  ServiceListIdentity,
  ServiceType,
} from '../url/types';
import type { BigQueryTarget } from './connection';

export const SERVICE_DESCRIPTION_MAP: Record<ServiceType, string> = {
  'cloud-run': 'Cloud Run',
  'compute-engine': 'Compute Engine',
  'cloud-storage': 'Cloud Storage',
  gke: 'Kubernetes Engine',
  bigquery: 'BigQuery',
  'vertex-ai': 'Vertex AI',
  'cloud-sql': 'Cloud SQL',
  pubsub: 'Cloud Pub/Sub',
  'artifact-registry': 'Artifact Registry',
};

export interface BigQueryQueryParameter {
  name: string;
  parameterType: { type: 'STRING' };
  parameterValue: { value: string };
}

/**
 * Builds a parameterized SQL query against the daily summary table.
 * Scans only the last ~65 days to cover this month, last month's same days, and the 30-day trend.
 */
export function buildResourceCostQuery(
  target: BigQueryTarget,
  resourceLevel: boolean,
): string {
  const project = target.billingProjectId.trim();
  const dataset = target.datasetName.trim();
  const table = target.summaryTableName.trim();
  const resourceFilter = resourceLevel
    ? `
    AND (
      resource_name = @resourceName
      OR resource_global_name = @resourceName
      OR ENDS_WITH(resource_global_name, CONCAT('/', @resourceName))
    )`
    : '';

  return `SELECT
  FORMAT_DATE('%Y-%m-%d', usage_date) AS usage_date,
  ANY_VALUE(currency) AS currency,
  SUM(CAST(IFNULL(cost_at_list, 0) AS FLOAT64)) AS cost_at_list,
  SUM(CAST(cost_before_discounts AS FLOAT64)) AS cost_before_discounts,
  SUM(CAST(IFNULL(cud_credits, 0) AS FLOAT64)) AS cud_credits,
  SUM(CAST(IFNULL(other_credits, 0) AS FLOAT64)) AS other_credits,
  SUM(CAST(cost_after_credits AS FLOAT64)) AS cost_after_credits,
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', MAX(latest_usage_time)) AS latest_usage_time
FROM \`${project}.${dataset}.${table}\`
WHERE usage_date >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 1 MONTH)
  AND project_id = @projectId
  AND service_description = @serviceDescription${resourceFilter}
GROUP BY usage_date
ORDER BY usage_date ASC`;
}

export function buildQueryParameters(
  resource: ResourceIdentity,
  resourceLevel: boolean,
): BigQueryQueryParameter[] {
  const params: BigQueryQueryParameter[] = [
    {
      name: 'projectId',
      parameterType: { type: 'STRING' },
      parameterValue: { value: resource.projectId },
    },
    {
      name: 'serviceDescription',
      parameterType: { type: 'STRING' },
      parameterValue: { value: SERVICE_DESCRIPTION_MAP[resource.serviceType] },
    },
  ];

  if (resourceLevel) {
    params.push({
      name: 'resourceName',
      parameterType: { type: 'STRING' },
      parameterValue: { value: resource.resourceName },
    });
  }

  return params;
}

/**
 * Builds a parameterized SQL query grouping current month spend by resource
 * for a project and service (used on console list/overview pages).
 */
export function buildServiceBreakdownQuery(target: BigQueryTarget): string {
  const project = target.billingProjectId.trim();
  const dataset = target.datasetName.trim();
  const table = target.summaryTableName.trim();

  return `SELECT
  COALESCE(NULLIF(resource_name, ''), NULLIF(resource_global_name, ''), '(project-level)') AS resource_label,
  ANY_VALUE(currency) AS currency,
  SUM(CAST(IFNULL(cost_at_list, 0) AS FLOAT64)) AS cost_at_list,
  SUM(CAST(cost_before_discounts AS FLOAT64)) AS cost_before_discounts,
  SUM(CAST(IFNULL(cud_credits, 0) AS FLOAT64)) AS cud_credits,
  SUM(CAST(IFNULL(other_credits, 0) AS FLOAT64)) AS other_credits,
  SUM(CAST(cost_after_credits AS FLOAT64)) AS cost_after_credits,
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', MAX(latest_usage_time)) AS latest_usage_time
FROM \`${project}.${dataset}.${table}\`
WHERE usage_date >= DATE_TRUNC(CURRENT_DATE(), MONTH)
  AND project_id = @projectId
  AND service_description = @serviceDescription
GROUP BY resource_label
ORDER BY cost_after_credits DESC
LIMIT 25`;
}

export function buildServiceBreakdownParameters(
  list: ServiceListIdentity,
): BigQueryQueryParameter[] {
  return [
    {
      name: 'projectId',
      parameterType: { type: 'STRING' },
      parameterValue: { value: list.projectId },
    },
    {
      name: 'serviceDescription',
      parameterType: { type: 'STRING' },
      parameterValue: { value: SERVICE_DESCRIPTION_MAP[list.serviceType] },
    },
  ];
}

/**
 * Builds a parameterized SQL query grouping current month spend by service
 * for a project (used on Google Cloud Console Home / Dashboard).
 */
export function buildProjectOverviewQuery(target: BigQueryTarget): string {
  const project = target.billingProjectId.trim();
  const dataset = target.datasetName.trim();
  const table = target.summaryTableName.trim();

  return `SELECT
  COALESCE(NULLIF(service_description, ''), '(other)') AS service_description,
  ANY_VALUE(currency) AS currency,
  SUM(CAST(IFNULL(cost_at_list, 0) AS FLOAT64)) AS cost_at_list,
  SUM(CAST(cost_before_discounts AS FLOAT64)) AS cost_before_discounts,
  SUM(CAST(IFNULL(cud_credits, 0) AS FLOAT64)) AS cud_credits,
  SUM(CAST(IFNULL(other_credits, 0) AS FLOAT64)) AS other_credits,
  SUM(CAST(cost_after_credits AS FLOAT64)) AS cost_after_credits,
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', MAX(latest_usage_time)) AS latest_usage_time
FROM \`${project}.${dataset}.${table}\`
WHERE usage_date >= DATE_TRUNC(CURRENT_DATE(), MONTH)
  AND project_id = @projectId
GROUP BY service_description
ORDER BY cost_after_credits DESC
LIMIT 25`;
}

export function buildProjectOverviewParameters(
  projectId: string,
): BigQueryQueryParameter[] {
  return [
    {
      name: 'projectId',
      parameterType: { type: 'STRING' },
      parameterValue: { value: projectId },
    },
  ];
}
