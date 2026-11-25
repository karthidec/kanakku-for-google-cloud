import type { ResourceIdentity } from './types';
import { decodeSegment } from './utils';

/**
 * Parses Cloud SQL instance detail URLs:
 * /sql/instances/{instanceName}[/overview|...]
 */
export function parseCloudSqlSegments(
  segments: string[],
  projectId: string,
): ResourceIdentity | null {
  if (segments[0] !== 'sql' || segments[1] !== 'instances') {
    return null;
  }

  const instanceName = decodeSegment(segments[2]);
  if (!instanceName) {
    return null;
  }

  return {
    projectId,
    serviceType: 'cloud-sql',
    regionOrZone: null,
    resourceName: instanceName,
  };
}
