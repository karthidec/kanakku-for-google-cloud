import type { ResourceIdentity } from './types';
import { decodeSegment } from './utils';

/**
 * Parses Compute Engine VM instance URLs:
 * /compute/instancesDetail/zones/{zone}/instances/{instanceName}[/...]
 */
export function parseComputeEngineSegments(
  segments: string[],
  projectId: string,
): ResourceIdentity | null {
  if (
    segments[0] !== 'compute' ||
    segments[1] !== 'instancesDetail' ||
    segments[2] !== 'zones' ||
    segments[4] !== 'instances'
  ) {
    return null;
  }

  const zone = decodeSegment(segments[3]);
  const instanceName = decodeSegment(segments[5]);
  if (!zone || !instanceName) {
    return null;
  }

  return {
    projectId,
    serviceType: 'compute-engine',
    regionOrZone: zone,
    resourceName: instanceName,
  };
}
