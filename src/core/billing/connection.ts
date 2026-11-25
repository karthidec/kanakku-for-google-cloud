export interface BigQueryTarget {
  billingProjectId: string;
  datasetName: string;
  summaryTableName: string;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
}

const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$/;
const BIGQUERY_IDENTIFIER_PATTERN = /^[a-zA-Z0-9_]{1,1024}$/;

/**
 * Validates BigQuery project, dataset, and table names before SQL interpolation.
 */
export function validateBigQueryTarget(
  target: BigQueryTarget,
): { ok: true } | { ok: false; message: string } {
  const project = target.billingProjectId.trim();
  const dataset = target.datasetName.trim();
  const table = target.summaryTableName.trim();

  if (!project) {
    return { ok: false, message: 'Enter your billing project ID first.' };
  }
  if (!PROJECT_ID_PATTERN.test(project)) {
    return {
      ok: false,
      message:
        'Billing project ID looks invalid. Use lowercase letters, numbers, and hyphens.',
    };
  }
  if (!dataset || !BIGQUERY_IDENTIFIER_PATTERN.test(dataset)) {
    return {
      ok: false,
      message:
        'Dataset name must contain only letters, numbers, and underscores.',
    };
  }
  if (!table || !BIGQUERY_IDENTIFIER_PATTERN.test(table)) {
    return {
      ok: false,
      message:
        'Summary table name must contain only letters, numbers, and underscores.',
    };
  }

  return { ok: true };
}

export function buildTestQuery(target: BigQueryTarget): string {
  const project = target.billingProjectId.trim();
  const dataset = target.datasetName.trim();
  const table = target.summaryTableName.trim();
  return `SELECT 1 FROM \`${project}.${dataset}.${table}\` LIMIT 1`;
}

export function mapHttpErrorToMessage(status: number): string {
  if (status === 401) {
    return 'Google sign-in expired or was cancelled. Please sign in again.';
  }
  if (status === 403) {
    return 'Access denied. Check that your account has BigQuery Data Viewer and BigQuery Job User access on this project.';
  }
  if (status === 404) {
    return 'Billing summary table not found. Check your project ID, dataset name, and table name, or open the setup guide.';
  }
  if (status === 400) {
    return 'BigQuery rejected the query. Check your project ID, dataset name, and table name.';
  }
  return `BigQuery returned an unexpected error (HTTP ${status}). Please try again.`;
}

/**
 * Runs a minimal read-only query against the configured BigQuery summary table.
 */
export async function testBigQueryConnection(
  target: BigQueryTarget,
  accessToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<ConnectionResult> {
  const validation = validateBigQueryTarget(target);
  if (!validation.ok) {
    return validation;
  }

  const projectId = target.billingProjectId.trim();
  const endpoint = `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/queries`;

  try {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: buildTestQuery(target),
        useLegacySql: false,
        maxResults: 1,
        timeoutMs: 10000,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: mapHttpErrorToMessage(response.status),
      };
    }

    return {
      ok: true,
      message: 'Connected! Found the summary table in BigQuery.',
    };
  } catch {
    return {
      ok: false,
      message:
        'Could not reach BigQuery. Check your internet connection and try again.',
    };
  }
}
