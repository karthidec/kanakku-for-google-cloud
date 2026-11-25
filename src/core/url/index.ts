import { parseCloudRunSegments } from './cloudRun';
import { parseCloudSqlSegments } from './cloudSql';
import { parseCloudStorageSegments } from './cloudStorage';
import { parseComputeEngineSegments } from './computeEngine';
import { parseGkeSegments } from './gke';
import type {
  ConsoleTarget,
  ParseResult,
  ProjectHomeIdentity,
  ResourceIdentity,
  ServiceListIdentity,
} from './types';
import { getPathSegments } from './utils';

export type {
  ConsoleTarget,
  ParseResult,
  ProjectHomeIdentity,
  ResourceIdentity,
  ServiceListIdentity,
  ServiceType,
} from './types';

const CONSOLE_ORIGIN = 'https://console.cloud.google.com';

type ServiceParser = (
  segments: string[],
  projectId: string,
) => ResourceIdentity | null;

const SERVICE_PARSERS: ServiceParser[] = [
  parseCloudRunSegments,
  parseComputeEngineSegments,
  parseCloudStorageSegments,
  parseGkeSegments,
  parseCloudSqlSegments,
];

function parseConsoleBase(
  rawUrl: string,
): { projectId: string; segments: string[] } | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.origin !== CONSOLE_ORIGIN) {
    return null;
  }

  const projectId = parsed.searchParams.get('project')?.trim();
  if (!projectId) {
    return null;
  }

  return {
    projectId,
    segments: getPathSegments(parsed.pathname),
  };
}

function parseServiceListSegments(
  segments: string[],
  projectId: string,
): ServiceListIdentity | null {
  if (
    (segments.length === 1 && segments[0] === 'run') ||
    (segments.length === 2 &&
      segments[0] === 'run' &&
      segments[1] === 'services')
  ) {
    return { projectId, serviceType: 'cloud-run' };
  }

  if (
    segments.length === 2 &&
    segments[0] === 'compute' &&
    segments[1] === 'instances'
  ) {
    return { projectId, serviceType: 'compute-engine' };
  }

  if (
    segments.length === 2 &&
    segments[0] === 'storage' &&
    segments[1] === 'browser'
  ) {
    return { projectId, serviceType: 'cloud-storage' };
  }

  if (
    segments[0] === 'kubernetes' &&
    (segments[1] === 'clusters' || segments[1] === 'list')
  ) {
    return { projectId, serviceType: 'gke' };
  }

  if (segments[0] === 'bigquery') {
    return { projectId, serviceType: 'bigquery' };
  }

  if (segments[0] === 'vertex-ai') {
    return { projectId, serviceType: 'vertex-ai' };
  }

  if (
    segments.length === 2 &&
    segments[0] === 'sql' &&
    segments[1] === 'instances'
  ) {
    return { projectId, serviceType: 'cloud-sql' };
  }

  if (segments[0] === 'cloudpubsub') {
    return { projectId, serviceType: 'pubsub' };
  }

  if (segments[0] === 'artifacts') {
    return { projectId, serviceType: 'artifact-registry' };
  }

  return null;
}

function parseProjectHomeSegments(
  segments: string[],
  projectId: string,
): ProjectHomeIdentity | null {
  if (
    (segments[0] === 'home' && segments[1] === 'dashboard') ||
    segments[0] === 'welcome'
  ) {
    return { projectId };
  }
  return null;
}

/**
 * Parses a Google Cloud console URL into a structured resource identity,
 * or returns "unsupported" if the URL is not a specific resource page.
 */
export function parseConsoleUrl(rawUrl: string): ParseResult {
  const base = parseConsoleBase(rawUrl);
  if (!base) {
    return 'unsupported';
  }

  for (const parseService of SERVICE_PARSERS) {
    const match = parseService(base.segments, base.projectId);
    if (match) {
      return match;
    }
  }

  return 'unsupported';
}

/**
 * Parses a Google Cloud console URL into a specific resource,
 * a supported service list page, or the project home dashboard.
 */
export function parseConsoleTarget(rawUrl: string): ConsoleTarget {
  const base = parseConsoleBase(rawUrl);
  if (!base) {
    return 'unsupported';
  }

  for (const parseService of SERVICE_PARSERS) {
    const match = parseService(base.segments, base.projectId);
    if (match) {
      return { kind: 'resource', resource: match };
    }
  }

  const listMatch = parseServiceListSegments(base.segments, base.projectId);
  if (listMatch) {
    return { kind: 'service-list', list: listMatch };
  }

  const homeMatch = parseProjectHomeSegments(base.segments, base.projectId);
  if (homeMatch) {
    return { kind: 'project-home', project: homeMatch };
  }

  return 'unsupported';
}
