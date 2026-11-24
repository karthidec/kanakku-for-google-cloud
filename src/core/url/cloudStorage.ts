import type { ResourceIdentity } from './types';
import { decodeSegment } from './utils';

/**
 * Parses Cloud Storage bucket URLs:
 * /storage/browser/{bucketName}[/{prefix...}]
 * /storage/browser/_details/{bucketName}/{objectPath...}
 */
export function parseCloudStorageSegments(
  segments: string[],
  projectId: string,
): ResourceIdentity | null {
  if (segments[0] !== 'storage' || segments[1] !== 'browser') {
    return null;
  }

  const bucketSegment = segments[2] === '_details' ? segments[3] : segments[2];
  const bucketName = decodeSegment(bucketSegment);
  if (!bucketName) {
    return null;
  }

  return {
    projectId,
    serviceType: 'cloud-storage',
    regionOrZone: null,
    resourceName: bucketName,
  };
}
