import { parseCloudRunSegments } from './cloudRun';
import { parseCloudStorageSegments } from './cloudStorage';
import { parseComputeEngineSegments } from './computeEngine';
import type { ParseResult, ResourceIdentity } from './types';
import { getPathSegments } from './utils';

export type { ParseResult, ResourceIdentity, ServiceType } from './types';

const CONSOLE_ORIGIN = 'https://console.cloud.google.com';

type ServiceParser = (
  segments: string[],
  projectId: string,
) => ResourceIdentity | null;

const SERVICE_PARSERS: ServiceParser[] = [
  parseCloudRunSegments,
  parseComputeEngineSegments,
  parseCloudStorageSegments,
];

/**
 * Parses a Google Cloud console URL into a structured resource identity,
 * or returns "unsupported" if the URL is not a supported resource page.
 */
export function parseConsoleUrl(rawUrl: string): ParseResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return 'unsupported';
  }

  if (parsed.origin !== CONSOLE_ORIGIN) {
    return 'unsupported';
  }

  const projectId = parsed.searchParams.get('project')?.trim();
  if (!projectId) {
    return 'unsupported';
  }

  const segments = getPathSegments(parsed.pathname);
  for (const parseService of SERVICE_PARSERS) {
    const match = parseService(segments, projectId);
    if (match) {
      return match;
    }
  }

  return 'unsupported';
}
