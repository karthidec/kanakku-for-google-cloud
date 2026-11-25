import { describe, expect, it, vi } from 'vitest';
import {
  buildStandardExecutiveSummary,
  generateExecutiveSummary,
} from '../src/core/ai';
import type { ResourceCostSummary } from '../src/core/billing/types';
import type { CostInsight } from '../src/core/insights';

const sampleSummary: ResourceCostSummary = {
  currency: 'USD',
  thisMonthListPrice: 120,
  thisMonthContractDiscount: 10,
  thisMonthBeforeDiscounts: 110,
  thisMonthCudCredits: -30,
  thisMonthOtherCredits: 0,
  thisMonthAfterCredits: 80,
  totalSavings: 40,
  savingsPercent: 33.3,
  lastMonthSameDaysAfterCredits: 60,
  percentChange: 33.3,
  dailySeries: [],
  latestUsageTime: '2026-11-25T09:00:00Z',
  precision: 'this resource',
  fetchedAt: 1000,
  fromCache: false,
};

const sampleInsights: CostInsight[] = [
  {
    id: 'always-on-flat-cost',
    severity: 'warning',
    title: 'Action required: Always-on daily cost',
    detail: 'Steady spend across 20 days.',
    action: 'Set min-instances to 0 if traffic can tolerate cold starts.',
  },
];

describe('buildStandardExecutiveSummary', () => {
  it('builds a clear FinOps/SRE summary without an API key', () => {
    const result = buildStandardExecutiveSummary({
      title: 'checkout-api (Cloud Run service)',
      projectId: 'demo-proj',
      currency: 'USD',
      listPrice: sampleSummary.thisMonthListPrice,
      cudCredits: sampleSummary.thisMonthCudCredits,
      totalSavings: sampleSummary.totalSavings,
      finalPrice: sampleSummary.thisMonthAfterCredits,
      percentChange: sampleSummary.percentChange,
      insights: sampleInsights,
    });

    expect(result.source).toBe('standard');
    expect(result.text).toContain('$80.00');
    expect(result.text).toContain('$30.00');
    expect(result.text).toContain('Set min-instances to 0');
  });
});

describe('generateExecutiveSummary', () => {
  const input = {
    title: 'checkout-api (Cloud Run service)',
    projectId: 'demo-proj',
    currency: 'USD',
    listPrice: 120,
    cudCredits: -30,
    totalSavings: 40,
    finalPrice: 80,
    percentChange: 33.3,
    insights: sampleInsights,
  };

  it('uses standard summary when AI is disabled or key is empty', async () => {
    const fetchMock = vi.fn();
    const res = await generateExecutiveSummary(
      input,
      { enabled: false, apiKey: '' },
      fetchMock as unknown as typeof fetch,
    );

    expect(res.source).toBe('standard');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls Gemini API when AI is enabled and key is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'AI brief: $80.00 final after $30 CUDs.' }],
            },
          },
        ],
      }),
    });

    const res = await generateExecutiveSummary(
      input,
      { enabled: true, apiKey: 'AIzaFakeKey123' },
      fetchMock as unknown as typeof fetch,
    );

    expect(res.source).toBe('gemini');
    expect(res.text).toContain('AI brief:');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-goog-api-key': 'AIzaFakeKey123',
        }),
      }),
    );
  });

  it('falls back to standard summary if Gemini request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const res = await generateExecutiveSummary(
      input,
      { enabled: true, apiKey: 'AIzaFakeKey123' },
      fetchMock as unknown as typeof fetch,
    );

    expect(res.source).toBe('standard');
    expect(res.note).toContain('standard summary');
  });
});
