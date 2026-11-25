import type { ResourceIdentity } from './types';
import { decodeSegment } from './utils';

/**
 * Parses GKE cluster detail URLs:
 * /kubernetes/clusters/details/{location}/{clusterName}[/...]
 */
export function parseGkeSegments(
  segments: string[],
  projectId: string,
): ResourceIdentity | null {
  if (
    segments[0] !== 'kubernetes' ||
    segments[1] !== 'clusters' ||
    segments[2] !== 'details'
  ) {
    return null;
  }

  const location = decodeSegment(segments[3]);
  const clusterName = decodeSegment(segments[4]);
  if (!location || !clusterName) {
    return null;
  }

  return {
    projectId,
    serviceType: 'gke',
    regionOrZone: location,
    resourceName: clusterName,
  };
}
