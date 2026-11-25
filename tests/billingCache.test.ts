import { describe, expect, it } from 'vitest';
import {
  buildCacheKey,
  getCachedSummary,
  setCachedSummary,
  type StorageAdapter,
} from '../src/core/billing/cache';
import type { ResourceCostSummary } from '../src/core/billing/types';
import type { ResourceIdentity } from '../src/core/url/types';

function createMemoryStorage(): StorageAdapter {
  const store = new Map<string, unknown>();
  return {
    async get(key: string) {
      return { [key]: store.get(key) };
    },
    async set(items: Record<string, unknown>) {
      for (const [k, v] of Object.entries(items)) {
        store.set(k, v);
      }
    },
  };
}

describe('billing cache', () => {
  const resource: ResourceIdentity = {
    projectId: 'demo-proj',
    serviceType: 'cloud-run',
    regionOrZone: 'us-central1',
    resourceName: 'checkout-api',
  };

  const sampleSummary: ResourceCostSummary = {
    currency: 'USD',
    thisMonthListPrice: 15,
    thisMonthContractDiscount: 0,
    thisMonthBeforeDiscounts: 15,
    thisMonthCudCredits: -2.5,
    thisMonthOtherCredits: 0,
    thisMonthAfterCredits: 12.5,
    totalSavings: 2.5,
    savingsPercent: 16.67,
    lastMonthSameDaysAfterCredits: 10,
    percentChange: 25,
    dailySeries: [],
    latestUsageTime: '2026-11-24T09:00:00Z',
    precision: 'this resource',
    fetchedAt: 1000,
    fromCache: false,
  };

  it('returns cached summary before TTL expires', async () => {
    const storage = createMemoryStorage();
    const key = buildCacheKey(resource);

    await setCachedSummary(key, sampleSummary, 60, 1000, storage);
    const cached = await getCachedSummary(key, 1000 + 30 * 60_000, storage);

    expect(cached).not.toBeNull();
    expect(cached?.fromCache).toBe(true);
    expect(cached?.thisMonthAfterCredits).toBe(12.5);
  });

  it('returns null once TTL expires', async () => {
    const storage = createMemoryStorage();
    const key = buildCacheKey(resource);

    await setCachedSummary(key, sampleSummary, 60, 1000, storage);
    const cached = await getCachedSummary(key, 1000 + 61 * 60_000, storage);

    expect(cached).toBeNull();
  });
});
