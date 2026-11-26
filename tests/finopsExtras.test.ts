import { describe, expect, it } from 'vitest';
import type {
  DailyCostPoint,
  ResourceCostSummary,
} from '../src/core/billing/types';
import { estimateBurnRate } from '../src/core/insights';
import { buildBreakdownCsv } from '../src/sidepanel/csv';

function makeSummary(values: number[]): ResourceCostSummary {
  const dailySeries: DailyCostPoint[] = values.map((v, i) => ({
    date: `2026-11-${String(i + 1).padStart(2, '0')}`,
    costAfterCredits: v,
    costBeforeDiscounts: v,
  }));

  return {
    currency: 'USD',
    thisMonthListPrice: 100,
    thisMonthContractDiscount: 0,
    thisMonthBeforeDiscounts: 100,
    thisMonthCudCredits: 0,
    thisMonthOtherCredits: 0,
    thisMonthAfterCredits: 100,
    totalSavings: 0,
    savingsPercent: 0,
    lastMonthSameDaysAfterCredits: 80,
    percentChange: 25,
    dailySeries,
    latestUsageTime: '2026-11-26T10:00:00Z',
    precision: 'this resource',
    fetchedAt: 1000,
    fromCache: false,
  };
}

describe('estimateBurnRate', () => {
  it('computes daily and hourly burn rate from recent active days', () => {
    const values = [...Array(23).fill(0), 24, 24, 24, 24, 24, 24, 24];
    const rate = estimateBurnRate(makeSummary(values));
    expect(rate).toEqual({ daily: 24, hourly: 1, beforeCreditsOnly: false });
  });

  it('returns null when there is no recent non-zero spend', () => {
    const rate = estimateBurnRate(makeSummary(Array(30).fill(0)));
    expect(rate).toBeNull();
  });
});

describe('buildBreakdownCsv', () => {
  it('builds a valid CSV with header and rows', () => {
    const csv = buildBreakdownCsv([
      {
        resourceName: 'api-svc',
        region: 'us-east1',
        currency: 'USD',
        costBeforeDiscounts: 10,
        cudCredits: -2,
        otherCredits: 0,
        costAfterCredits: 8,
      },
    ]);

    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'Name,Region,Currency,Before Discounts,CUD Credits,Other Credits,Final Price',
    );
    expect(lines[1]).toBe('api-svc,us-east1,USD,10.00,-2.00,0.00,8.00');
  });

  it('neutralizes CSV formula prefixes and quotes commas', () => {
    const csv = buildBreakdownCsv([
      {
        resourceName: '=CMD,calc',
        region: null,
        currency: 'USD',
        costBeforeDiscounts: 1,
        cudCredits: 0,
        otherCredits: 0,
        costAfterCredits: 1,
      },
    ]);

    expect(csv).toContain('"\'=CMD,calc"');
  });
});
