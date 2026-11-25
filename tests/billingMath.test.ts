import { describe, expect, it } from 'vitest';
import { summarizeBillingRows } from '../src/core/billing/math';
import type { DailyBillingRow } from '../src/core/billing/types';
import {
  formatFreshness,
  formatMoney,
  formatPercentChange,
} from '../src/core/format';

describe('summarizeBillingRows', () => {
  const referenceDate = new Date('2026-11-24T15:00:00Z');

  it('computes MTD waterfall (list, contract discount, CUDs, other credits, final), % change, and 30-day series', () => {
    const rows: DailyBillingRow[] = [
      {
        usageDate: '2026-11-10',
        currency: 'USD',
        costAtList: 20,
        costBeforeDiscounts: 15,
        cudCredits: -2,
        otherCredits: -1,
        costAfterCredits: 12,
        latestUsageTime: '2026-11-10T23:00:00Z',
      },
      {
        usageDate: '2026-11-24',
        currency: 'USD',
        costAtList: 10,
        costBeforeDiscounts: 10,
        cudCredits: -2,
        otherCredits: 0,
        costAfterCredits: 8,
        latestUsageTime: '2026-11-24T09:00:00Z',
      },
      {
        usageDate: '2026-10-15',
        currency: 'USD',
        costAtList: 12,
        costBeforeDiscounts: 12,
        cudCredits: 0,
        otherCredits: -2,
        costAfterCredits: 10,
        latestUsageTime: '2026-10-15T23:00:00Z',
      },
      {
        usageDate: '2026-10-28',
        currency: 'USD',
        costAtList: 50,
        costBeforeDiscounts: 50,
        cudCredits: 0,
        otherCredits: -10,
        costAfterCredits: 40,
        latestUsageTime: '2026-10-28T23:00:00Z',
      },
    ];

    const summary = summarizeBillingRows(
      rows,
      'this resource',
      referenceDate,
      1000,
    );

    expect(summary.currency).toBe('USD');
    expect(summary.thisMonthListPrice).toBe(30);
    expect(summary.thisMonthContractDiscount).toBe(5);
    expect(summary.thisMonthBeforeDiscounts).toBe(25);
    expect(summary.thisMonthCudCredits).toBe(-4);
    expect(summary.thisMonthOtherCredits).toBe(-1);
    expect(summary.thisMonthAfterCredits).toBe(20);
    expect(summary.totalSavings).toBe(10);
    expect(Math.round(summary.savingsPercent ?? 0)).toBe(33);
    expect(summary.lastMonthSameDaysAfterCredits).toBe(10);
    expect(summary.percentChange).toBe(100);
    expect(summary.latestUsageTime).toBe('2026-11-24T09:00:00Z');
    expect(summary.precision).toBe('this resource');
    expect(summary.dailySeries).toHaveLength(30);
    expect(summary.dailySeries[0]?.date).toBe('2026-10-26');
    expect(summary.dailySeries[29]?.date).toBe('2026-11-24');
    expect(summary.dailySeries[29]?.costAfterCredits).toBe(8);
    expect(
      summary.dailySeries.find((d) => d.date === '2026-10-28')
        ?.costAfterCredits,
    ).toBe(40);
  });

  it('returns null percentChange when last month baseline is zero', () => {
    const rows: DailyBillingRow[] = [
      {
        usageDate: '2026-11-20',
        currency: 'USD',
        costAtList: 5,
        costBeforeDiscounts: 5,
        cudCredits: 0,
        otherCredits: 0,
        costAfterCredits: 5,
        latestUsageTime: '2026-11-20T12:00:00Z',
      },
    ];

    const summary = summarizeBillingRows(
      rows,
      'project share',
      referenceDate,
      1000,
    );

    expect(summary.percentChange).toBeNull();
    expect(summary.precision).toBe('project share');
  });
});

describe('formatting helpers', () => {
  it('formats money in the given currency', () => {
    expect(formatMoney(12.345, 'USD')).toBe('$12.35');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
  });

  it('formats percent change with sign', () => {
    expect(formatPercentChange(25.4)).toBe('+25% vs last month');
    expect(formatPercentChange(-12.6)).toBe('-13% vs last month');
    expect(formatPercentChange(null)).toBe('No prior month baseline');
  });

  it('formats freshness in plain English', () => {
    const now = Date.parse('2026-11-24T15:00:00Z');
    expect(formatFreshness('2026-11-24T09:00:00Z', now)).toBe(
      'as of 6 hours ago',
    );
    expect(formatFreshness('2026-11-24T14:40:00Z', now)).toBe(
      'as of 20 minutes ago',
    );
    expect(formatFreshness('2026-11-22T15:00:00Z', now)).toBe(
      'as of 2 days ago',
    );
    expect(formatFreshness(null, now)).toBe('freshness unknown');
  });
});
