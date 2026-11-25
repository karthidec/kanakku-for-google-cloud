import type { ResourceIdentity, ServiceListIdentity } from '../url/types';
import type { ResourceCostSummary, ServiceCostBreakdown } from './types';

export interface StorageAdapter {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

interface CachedEntry<T> {
  expiresAt: number;
  value: T;
}

const CACHE_PREFIX = 'kanakku_cost_cache_v2:';
const LIST_CACHE_PREFIX = 'kanakku_list_cache_v2:';
const PROJECT_CACHE_PREFIX = 'kanakku_project_cache_v2:';

export function buildCacheKey(resource: ResourceIdentity): string {
  return [
    CACHE_PREFIX,
    resource.projectId,
    resource.serviceType,
    resource.regionOrZone ?? '_',
    resource.resourceName,
  ].join(':');
}

export function buildListCacheKey(list: ServiceListIdentity): string {
  return [LIST_CACHE_PREFIX, list.projectId, list.serviceType].join(':');
}

export function buildProjectCacheKey(projectId: string): string {
  return `${PROJECT_CACHE_PREFIX}:${projectId}`;
}

function getDefaultStorage(): StorageAdapter {
  return chrome.storage.local;
}

export async function getCachedValue<T extends { fromCache: boolean }>(
  key: string,
  nowMs: number = Date.now(),
  storage: StorageAdapter = getDefaultStorage(),
): Promise<T | null> {
  const result = await storage.get(key);
  const entry = result[key] as CachedEntry<T> | undefined;
  if (!entry || entry.expiresAt <= nowMs) {
    return null;
  }

  return {
    ...entry.value,
    fromCache: true,
  };
}

export async function setCachedValue<T extends { fromCache: boolean }>(
  key: string,
  value: T,
  cacheMinutes: number,
  nowMs: number = Date.now(),
  storage: StorageAdapter = getDefaultStorage(),
): Promise<void> {
  const ttlMs = Math.max(1, cacheMinutes) * 60_000;
  const entry: CachedEntry<T> = {
    expiresAt: nowMs + ttlMs,
    value: { ...value, fromCache: false },
  };
  await storage.set({ [key]: entry });
}

export const getCachedSummary = getCachedValue<ResourceCostSummary>;
export const setCachedSummary = setCachedValue<ResourceCostSummary>;
export const getCachedBreakdown = getCachedValue<ServiceCostBreakdown>;
export const setCachedBreakdown = setCachedValue<ServiceCostBreakdown>;
