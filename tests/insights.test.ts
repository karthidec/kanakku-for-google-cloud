import { describe, expect, it } from 'vitest';
import type {
  DailyCostPoint,
  ResourceCostSummary,
} from '../src/core/billing/types';
import {
  estimateMonthEndCost,
  evaluateCostInsights,
} from '../src/core/insights';
import type { ResourceIdentity } from '../src/core/url/types';

function makeDailySeries(values: number[]): DailyCostPoint[] {
  return values.map((val, index) => ({
    date: `2026-11-${String(index + 1).padStart(2, '0')}`,
    costAfterCredits: val,
    costBeforeDiscounts: val,
  }));
}

function makeSummary(
  overrides: Partial<ResourceCostSummary> = {},
): ResourceCostSummary {
  return {
    currency: 'USD',
    thisMonthListPrice: 10,
    thisMonthContractDiscount: 0,
    thisMonthAfterCredits: 10,
    thisMonthBeforeDiscounts: 10,
    thisMonthCudCredits: 0,
    thisMonthOtherCredits: 0,
    totalSavings: 0,
    savingsPercent: 0,
    lastMonthSameDaysAfterCredits: 10,
    percentChange: 0,
    dailySeries: makeDailySeries(Array(30).fill(0)),
    latestUsageTime: '2026-11-25T08:00:00Z',
    precision: 'this resource',
    fetchedAt: 1000,
    fromCache: false,
    ...overrides,
  };
}

const cloudRunResource: ResourceIdentity = {
  projectId: 'demo-proj',
  serviceType: 'cloud-run',
  regionOrZone: 'us-central1',
  resourceName: 'api-svc',
};

describe('estimateMonthEndCost', () => {
  it('projects month-end cost from current daily pace', () => {
    // Nov has 30 days; on Nov 15 with $15 spent => $30 projected
    const summary = makeSummary({ thisMonthAfterCredits: 15 });
    const projected = estimateMonthEndCost(
      summary,
      new Date('2026-11-15T12:00:00Z'),
    );
    expect(projected).toBe(30);
  });

  it('returns null when month-to-date cost after credits is zero or negative', () => {
    const summary = makeSummary({ thisMonthAfterCredits: 0 });
    expect(
      estimateMonthEndCost(summary, new Date('2026-11-15T12:00:00Z')),
    ).toBeNull();
  });
});

describe('evaluateCostInsights', () => {
  it('flags credits masking spend when credits cover >= 80% of bill', () => {
    const summary = makeSummary({
      thisMonthAfterCredits: 0,
      thisMonthBeforeDiscounts: 5,
    });
    const insights = evaluateCostInsights(summary, cloudRunResource);
    expect(insights.some((i) => i.id === 'credits-masking-spend')).toBe(true);
  });

  it('flags always-on flat cost across 14+ active days with low variance', () => {
    const series = makeDailySeries([
      ...Array(16).fill(2.0),
      ...Array(14).fill(2.02),
    ]);
    const summary = makeSummary({ dailySeries: series });
    const insights = evaluateCostInsights(summary, cloudRunResource);
    expect(insights.some((i) => i.id === 'always-on-flat-cost')).toBe(true);
  });

  it('flags recent spend spike when latest non-zero day > 2x 30-day average', () => {
    const series = makeDailySeries([...Array(29).fill(1.0), 5.0]);
    const summary = makeSummary({ dailySeries: series });
    const insights = evaluateCostInsights(summary, cloudRunResource);
    expect(insights.some((i) => i.id === 'recent-spend-spike')).toBe(true);
  });

  it('returns empty insights when spend is normal and uncredited', () => {
    const series = makeDailySeries([
      ...Array(25).fill(0),
      1.0,
      2.5,
      0.5,
      1.8,
      1.2,
    ]);
    const summary = makeSummary({
      thisMonthListPrice: 7,
      thisMonthAfterCredits: 7,
      thisMonthBeforeDiscounts: 7,
      thisMonthCudCredits: -1,
      dailySeries: series,
    });
    const insights = evaluateCostInsights(summary, cloudRunResource);
    expect(insights).toEqual([]);
  });

  it('flags high-spend alert when monthlyAlertThreshold is exceeded', () => {
    const summary = makeSummary({
      thisMonthAfterCredits: 120,
      thisMonthBeforeDiscounts: 120,
      thisMonthCudCredits: -10,
    });
    const insights = evaluateCostInsights(summary, cloudRunResource, 100);
    const alert = insights.find((i) => i.id === 'high-spend-alert');
    expect(alert).toBeDefined();
    expect(alert?.severity).toBe('warning');
    expect(alert?.action).toBeTruthy();
  });

  it('flags no-cud-coverage for significant Compute Engine or Cloud Run spend with $0 CUDs', () => {
    const summary = makeSummary({
      thisMonthAfterCredits: 60,
      thisMonthBeforeDiscounts: 60,
      thisMonthCudCredits: 0,
    });
    const insights = evaluateCostInsights(summary, cloudRunResource, 0);
    expect(insights.some((i) => i.id === 'no-cud-coverage')).toBe(true);
  });
});
