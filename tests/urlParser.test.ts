import { describe, expect, it } from 'vitest';
import { parseConsoleTarget, parseConsoleUrl } from '../src/core/url';
import {
  CLOUD_RUN_FIXTURES,
  CLOUD_STORAGE_FIXTURES,
  COMPUTE_ENGINE_FIXTURES,
  UNSUPPORTED_FIXTURES,
} from './fixtures/consoleUrls';

describe('parseConsoleUrl', () => {
  it.each(CLOUD_RUN_FIXTURES)('Cloud Run: $name', ({ url, expected }) => {
    expect(parseConsoleUrl(url)).toEqual(expected);
  });

  it.each(COMPUTE_ENGINE_FIXTURES)(
    'Compute Engine: $name',
    ({ url, expected }) => {
      expect(parseConsoleUrl(url)).toEqual(expected);
    },
  );

  it.each(CLOUD_STORAGE_FIXTURES)(
    'Cloud Storage: $name',
    ({ url, expected }) => {
      expect(parseConsoleUrl(url)).toEqual(expected);
    },
  );

  it.each(UNSUPPORTED_FIXTURES)('Unsupported: $name', ({ url, expected }) => {
    expect(parseConsoleUrl(url)).toEqual(expected);
  });
});

describe('parseConsoleTarget', () => {
  it('detects Cloud Run service list page', () => {
    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/run?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'cloud-run' },
    });
  });

  it('detects Compute Engine VM list page', () => {
    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/compute/instances?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'compute-engine' },
    });
  });

  it('detects Cloud Storage bucket list page', () => {
    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/storage/browser?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'cloud-storage' },
    });
  });

  it('returns unsupported when project query param is missing on list page', () => {
    expect(parseConsoleTarget('https://console.cloud.google.com/run')).toBe(
      'unsupported',
    );
  });

  it('detects GKE cluster detail and list pages', () => {
    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/kubernetes/clusters/details/us-central1/prod-cluster/details?project=demo-proj',
      ),
    ).toEqual({
      kind: 'resource',
      resource: {
        projectId: 'demo-proj',
        serviceType: 'gke',
        regionOrZone: 'us-central1',
        resourceName: 'prod-cluster',
      },
    });

    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/kubernetes/clusters?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'gke' },
    });
  });

  it('detects BigQuery and Vertex AI pages', () => {
    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/bigquery?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'bigquery' },
    });

    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/vertex-ai/models?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'vertex-ai' },
    });
  });

  it('detects Console Home / Dashboard as project-home', () => {
    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/home/dashboard?project=demo-proj',
      ),
    ).toEqual({
      kind: 'project-home',
      project: { projectId: 'demo-proj' },
    });
  });

  it('detects Cloud SQL instance, Cloud SQL list, Pub/Sub, and Artifact Registry', () => {
    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/sql/instances/prod-db/overview?project=demo-proj',
      ),
    ).toEqual({
      kind: 'resource',
      resource: {
        projectId: 'demo-proj',
        serviceType: 'cloud-sql',
        regionOrZone: null,
        resourceName: 'prod-db',
      },
    });

    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/sql/instances?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'cloud-sql' },
    });

    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/cloudpubsub/topic/list?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'pubsub' },
    });

    expect(
      parseConsoleTarget(
        'https://console.cloud.google.com/artifacts?project=demo-proj',
      ),
    ).toEqual({
      kind: 'service-list',
      list: { projectId: 'demo-proj', serviceType: 'artifact-registry' },
    });
  });
});
