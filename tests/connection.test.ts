import { describe, expect, it, vi } from 'vitest';
import {
  buildTestQuery,
  testBigQueryConnection,
  validateBigQueryTarget,
} from '../src/core/billing/connection';

describe('validateBigQueryTarget', () => {
  it('accepts valid project, dataset, and table identifiers', () => {
    const result = validateBigQueryTarget({
      billingProjectId: 'my-billing-project',
      datasetName: 'billing_export',
      summaryTableName: 'daily_resource_costs',
    });

    expect(result).toEqual({ ok: true });
  });

  it('rejects empty fields with plain-English message', () => {
    const result = validateBigQueryTarget({
      billingProjectId: '',
      datasetName: 'billing_export',
      summaryTableName: 'daily_resource_costs',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Enter your billing project ID');
    }
  });

  it('rejects invalid identifier characters to prevent SQL injection', () => {
    const result = validateBigQueryTarget({
      billingProjectId: 'my-project; DROP TABLE x',
      datasetName: 'billing_export',
      summaryTableName: 'daily_resource_costs',
    });

    expect(result.ok).toBe(false);
  });
});

describe('buildTestQuery', () => {
  it('builds a minimal query against the summary table', () => {
    expect(
      buildTestQuery({
        billingProjectId: 'my-project',
        datasetName: 'billing_ds',
        summaryTableName: 'daily_summary',
      }),
    ).toBe('SELECT 1 FROM `my-project.billing_ds.daily_summary` LIMIT 1');
  });
});

describe('testBigQueryConnection', () => {
  const validTarget = {
    billingProjectId: 'my-project',
    datasetName: 'billing_ds',
    summaryTableName: 'daily_summary',
  };

  it('returns success when BigQuery jobs.query succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ jobComplete: true }),
    });

    const result = await testBigQueryConnection(
      validTarget,
      'fake-token',
      fetchMock as unknown as typeof fetch,
    );

    expect(result).toEqual({
      ok: true,
      message: 'Connected! Found the summary table in BigQuery.',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://bigquery.googleapis.com/bigquery/v2/projects/my-project/queries',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-token',
        }),
      }),
    );
  });

  it('returns plain-English error for 404 not found', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Not found: Table ...' } }),
    });

    const result = await testBigQueryConnection(
      validTarget,
      'fake-token',
      fetchMock as unknown as typeof fetch,
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain('Billing summary table not found');
  });

  it('returns plain-English error for 403 permission denied', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'Access Denied' } }),
    });

    const result = await testBigQueryConnection(
      validTarget,
      'fake-token',
      fetchMock as unknown as typeof fetch,
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain('Access denied');
  });

  it('returns plain-English error for 401 unauthorized', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid Credentials' } }),
    });

    const result = await testBigQueryConnection(
      validTarget,
      'fake-token',
      fetchMock as unknown as typeof fetch,
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain('sign in again');
  });
});
