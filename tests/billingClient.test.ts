import { describe, expect, it, vi } from 'vitest';
import {
  fetchResourceCostSummary,
  fetchServiceBreakdown,
} from '../src/core/billing/client';
import type { ResourceIdentity } from '../src/core/url/types';

describe('fetchResourceCostSummary', () => {
  const target = {
    billingProjectId: 'my-billing-proj',
    datasetName: 'billing_ds',
    summaryTableName: 'daily_resource_costs',
  };

  const resource: ResourceIdentity = {
    projectId: 'demo-proj',
    serviceType: 'cloud-run',
    regionOrZone: 'us-central1',
    resourceName: 'checkout-api',
  };

  it('returns resource-level summary when resource rows exist', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        rows: [
          {
            f: [
              { v: '2026-11-24' },
              { v: 'USD' },
              { v: '18.0' },
              { v: '15.0' },
              { v: '-2.0' },
              { v: '-1.0' },
              { v: '12.0' },
              { v: '2026-11-24T09:00:00Z' },
            ],
          },
        ],
      }),
    });

    const result = await fetchResourceCostSummary(
      target,
      resource,
      'token-123',
      fetchMock as unknown as typeof fetch,
      new Date('2026-11-24T15:00:00Z'),
    );

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.summary.precision).toBe('this resource');
      expect(result.summary.thisMonthAfterCredits).toBe(12);
      expect(result.summary.thisMonthBeforeDiscounts).toBe(15);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to project share when resource rows are empty', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rows: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          rows: [
            {
              f: [
                { v: '2026-11-24' },
                { v: 'USD' },
                { v: '30.0' },
                { v: '30.0' },
                { v: '0' },
                { v: '-5.0' },
                { v: '25.0' },
                { v: '2026-11-24T09:00:00Z' },
              ],
            },
          ],
        }),
      });

    const result = await fetchResourceCostSummary(
      target,
      resource,
      'token-123',
      fetchMock as unknown as typeof fetch,
      new Date('2026-11-24T15:00:00Z'),
    );

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.summary.precision).toBe('project share');
      expect(result.summary.thisMonthAfterCredits).toBe(25);
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns no_data when both resource and project queries are empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ rows: [] }),
    });

    const result = await fetchResourceCostSummary(
      target,
      resource,
      'token-123',
      fetchMock as unknown as typeof fetch,
    );

    expect(result.status).toBe('no_data');
  });

  it('returns friendly error when summary table is missing (404)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const result = await fetchResourceCostSummary(
      target,
      resource,
      'token-123',
      fetchMock as unknown as typeof fetch,
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toContain('Billing summary table not found');
      expect(result.unauthorized).toBe(false);
    }
  });

  it('marks unauthorized true on HTTP 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const result = await fetchResourceCostSummary(
      target,
      resource,
      'expired-token',
      fetchMock as unknown as typeof fetch,
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.unauthorized).toBe(true);
    }
  });
});

describe('fetchServiceBreakdown', () => {
  const target = {
    billingProjectId: 'my-billing-proj',
    datasetName: 'billing_ds',
    summaryTableName: 'daily_resource_costs',
  };

  it('maps grouped resource rows into totals and sorted breakdown items', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        rows: [
          {
            f: [
              { v: 'api-svc' },
              { v: 'USD' },
              { v: '12.0' },
              { v: '10.0' },
              { v: '-2.0' },
              { v: '0' },
              { v: '8.0' },
              { v: '2026-11-25T08:00:00Z' },
            ],
          },
          {
            f: [
              { v: 'worker-svc' },
              { v: 'USD' },
              { v: '5.0' },
              { v: '5.0' },
              { v: '0' },
              { v: '-3.0' },
              { v: '2.0' },
              { v: '2026-11-25T07:00:00Z' },
            ],
          },
        ],
      }),
    });

    const result = await fetchServiceBreakdown(
      target,
      { projectId: 'demo-proj', serviceType: 'cloud-run' },
      'token-123',
      fetchMock as unknown as typeof fetch,
    );

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.breakdown.totalAfterCredits).toBe(10);
      expect(result.breakdown.totalBeforeDiscounts).toBe(15);
      expect(result.breakdown.items).toHaveLength(2);
      expect(result.breakdown.items[0]?.resourceName).toBe('api-svc');
      expect(result.breakdown.latestUsageTime).toBe('2026-11-25T08:00:00Z');
    }
  });
});
