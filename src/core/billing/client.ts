import type { ResourceIdentity, ServiceListIdentity } from '../url/types';
import {
  mapHttpErrorToMessage,
  validateBigQueryTarget,
  type BigQueryTarget,
} from './connection';
import { summarizeBillingRows } from './math';
import {
  buildProjectOverviewParameters,
  buildProjectOverviewQuery,
  buildQueryParameters,
  buildResourceCostQuery,
  buildServiceBreakdownParameters,
  buildServiceBreakdownQuery,
  type BigQueryQueryParameter,
} from './query';
import type {
  DailyBillingRow,
  ResourceCostSummary,
  ServiceBreakdownItem,
  ServiceCostBreakdown,
} from './types';

interface BigQueryRowCell {
  v?: string | null;
}

interface BigQueryQueryResponse {
  rows?: Array<{ f?: BigQueryRowCell[] }>;
}

export type BillingFetchResult =
  | { status: 'loaded'; summary: ResourceCostSummary }
  | { status: 'no_data' }
  | { status: 'error'; message: string; unauthorized?: boolean };

export type ServiceBreakdownFetchResult =
  | { status: 'loaded'; breakdown: ServiceCostBreakdown }
  | { status: 'no_data' }
  | { status: 'error'; message: string; unauthorized?: boolean };

function mapBigQueryRows(response: BigQueryQueryResponse): DailyBillingRow[] {
  if (!response.rows || response.rows.length === 0) {
    return [];
  }

  return response.rows
    .map((row): DailyBillingRow | null => {
      const cells = row.f ?? [];
      const usageDate = cells[0]?.v ?? '';
      if (!usageDate) {
        return null;
      }
      return {
        usageDate,
        currency: cells[1]?.v ?? 'USD',
        costAtList: Number(cells[2]?.v ?? 0) || 0,
        costBeforeDiscounts: Number(cells[3]?.v ?? 0) || 0,
        cudCredits: Number(cells[4]?.v ?? 0) || 0,
        otherCredits: Number(cells[5]?.v ?? 0) || 0,
        costAfterCredits: Number(cells[6]?.v ?? 0) || 0,
        latestUsageTime: cells[7]?.v ?? null,
      };
    })
    .filter((row): row is DailyBillingRow => row !== null);
}

function aggregateGroupedRows(
  rawRows: Array<{ f?: BigQueryRowCell[] }>,
  fallbackLabel: string,
): ServiceCostBreakdown {
  let currency = 'USD';
  let listPrice = 0;
  let totalBeforeDiscounts = 0;
  let cudCredits = 0;
  let otherCredits = 0;
  let totalAfterCredits = 0;
  let latestUsageTime: string | null = null;
  const items: ServiceBreakdownItem[] = [];

  for (const row of rawRows) {
    const cells = row.f ?? [];
    const resourceName = cells[0]?.v ?? fallbackLabel;
    const rowCurrency = cells[1]?.v ?? 'USD';
    const rowList = Number(cells[2]?.v ?? 0) || 0;
    const before = Number(cells[3]?.v ?? 0) || 0;
    const cud = Number(cells[4]?.v ?? 0) || 0;
    const other = Number(cells[5]?.v ?? 0) || 0;
    const after = Number(cells[6]?.v ?? 0) || 0;
    const usageTime = cells[7]?.v ?? null;
    const region = cells[8]?.v ?? null;

    currency = rowCurrency;
    listPrice += rowList > 0 ? rowList : before;
    totalBeforeDiscounts += before;
    cudCredits += cud;
    otherCredits += other;
    totalAfterCredits += after;
    if (usageTime && (!latestUsageTime || usageTime > latestUsageTime)) {
      latestUsageTime = usageTime;
    }

    items.push({
      resourceName,
      region,
      currency: rowCurrency,
      costBeforeDiscounts: before,
      cudCredits: cud,
      otherCredits: other,
      costAfterCredits: after,
    });
  }

  const contractDiscount = Math.max(0, listPrice - totalBeforeDiscounts);
  const totalSavings = Math.max(0, listPrice - totalAfterCredits);
  const savingsPercent =
    listPrice > 0 ? (totalSavings / listPrice) * 100 : null;

  return {
    currency,
    listPrice,
    contractDiscount,
    totalBeforeDiscounts,
    cudCredits,
    otherCredits,
    totalAfterCredits,
    totalSavings,
    savingsPercent,
    items,
    latestUsageTime,
    fetchedAt: Date.now(),
    fromCache: false,
  };
}

async function executeBigQueryQuery(
  projectId: string,
  sql: string,
  queryParameters: BigQueryQueryParameter[],
  accessToken: string,
  fetchFn: typeof fetch,
): Promise<
  | { ok: true; response: BigQueryQueryResponse }
  | { ok: false; message: string; unauthorized: boolean }
> {
  const endpoint = `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId.trim())}/queries`;
  const response = await fetchFn(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: sql,
      useLegacySql: false,
      parameterMode: 'NAMED',
      queryParameters,
      timeoutMs: 15000,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      message: mapHttpErrorToMessage(response.status),
      unauthorized: response.status === 401,
    };
  }

  return {
    ok: true,
    response: (await response.json()) as BigQueryQueryResponse,
  };
}

/**
 * Fetches cost summary for a resource, falling back to project-level service
 * share if resource-level rows are unavailable.
 */
export async function fetchResourceCostSummary(
  target: BigQueryTarget,
  resource: ResourceIdentity,
  accessToken: string,
  fetchFn: typeof fetch = fetch,
  referenceDate: Date = new Date(),
): Promise<BillingFetchResult> {
  const validation = validateBigQueryTarget(target);
  if (!validation.ok) {
    return { status: 'error', message: validation.message };
  }

  try {
    const resourceQuery = await executeBigQueryQuery(
      target.billingProjectId,
      buildResourceCostQuery(target, true),
      buildQueryParameters(resource, true),
      accessToken,
      fetchFn,
    );
    if (!resourceQuery.ok) {
      return {
        status: 'error',
        message: resourceQuery.message,
        unauthorized: resourceQuery.unauthorized,
      };
    }
    const resourceRows = mapBigQueryRows(resourceQuery.response);
    if (resourceRows.length > 0) {
      return {
        status: 'loaded',
        summary: summarizeBillingRows(
          resourceRows,
          'this resource',
          referenceDate,
        ),
      };
    }

    const projectQuery = await executeBigQueryQuery(
      target.billingProjectId,
      buildResourceCostQuery(target, false),
      buildQueryParameters(resource, false),
      accessToken,
      fetchFn,
    );
    if (!projectQuery.ok) {
      return {
        status: 'error',
        message: projectQuery.message,
        unauthorized: projectQuery.unauthorized,
      };
    }
    const projectRows = mapBigQueryRows(projectQuery.response);
    if (projectRows.length > 0) {
      return {
        status: 'loaded',
        summary: summarizeBillingRows(
          projectRows,
          'project share',
          referenceDate,
        ),
      };
    }

    return { status: 'no_data' };
  } catch {
    return {
      status: 'error',
      message:
        'Could not reach BigQuery. Check your internet connection and try again.',
    };
  }
}

async function fetchGroupedBreakdown(
  target: BigQueryTarget,
  sql: string,
  params: BigQueryQueryParameter[],
  fallbackLabel: string,
  accessToken: string,
  fetchFn: typeof fetch,
): Promise<ServiceBreakdownFetchResult> {
  const validation = validateBigQueryTarget(target);
  if (!validation.ok) {
    return { status: 'error', message: validation.message };
  }

  try {
    const queryResult = await executeBigQueryQuery(
      target.billingProjectId,
      sql,
      params,
      accessToken,
      fetchFn,
    );
    if (!queryResult.ok) {
      return {
        status: 'error',
        message: queryResult.message,
        unauthorized: queryResult.unauthorized,
      };
    }

    const rawRows = queryResult.response.rows ?? [];
    if (rawRows.length === 0) {
      return { status: 'no_data' };
    }

    return {
      status: 'loaded',
      breakdown: aggregateGroupedRows(rawRows, fallbackLabel),
    };
  } catch {
    return {
      status: 'error',
      message:
        'Could not reach BigQuery. Check your internet connection and try again.',
    };
  }
}

export function fetchServiceBreakdown(
  target: BigQueryTarget,
  list: ServiceListIdentity,
  accessToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<ServiceBreakdownFetchResult> {
  return fetchGroupedBreakdown(
    target,
    buildServiceBreakdownQuery(target),
    buildServiceBreakdownParameters(list),
    '(project-level)',
    accessToken,
    fetchFn,
  );
}

export function fetchProjectOverview(
  target: BigQueryTarget,
  projectId: string,
  accessToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<ServiceBreakdownFetchResult> {
  return fetchGroupedBreakdown(
    target,
    buildProjectOverviewQuery(target),
    buildProjectOverviewParameters(projectId),
    '(other)',
    accessToken,
    fetchFn,
  );
}
