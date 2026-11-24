import type { ResourceIdentity } from './types';
import { decodeSegment } from './utils';

/**
 * Parses Cloud Run service URLs:
 * /run/detail/{region}/{serviceName}[/{tab}]
 */
export function parseCloudRunSegments(
  segments: string[],
  projectId: string,
): ResourceIdentity | null {
  if (segments[0] !== 'run' || segments[1] !== 'detail') {
    return null;
  }

  const region = decodeSegment(segments[2]);
  const serviceName = decodeSegment(segments[3]);
  if (!region || !serviceName) {
    return null;
  }

  return {
    projectId,
    serviceType: 'cloud-run',
    regionOrZone: region,
    resourceName: serviceName,
  };
}
