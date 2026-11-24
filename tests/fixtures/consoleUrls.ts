import type { ParseResult } from '../../src/core/url/types';

export interface UrlFixture {
  name: string;
  url: string;
  expected: ParseResult;
}

export const CLOUD_RUN_FIXTURES: UrlFixture[] = [
  {
    name: 'Cloud Run service detail page',
    url: 'https://console.cloud.google.com/run/detail/us-central1/checkout-api?project=demo-project-123',
    expected: {
      projectId: 'demo-project-123',
      serviceType: 'cloud-run',
      regionOrZone: 'us-central1',
      resourceName: 'checkout-api',
    },
  },
  {
    name: 'Cloud Run service metrics tab',
    url: 'https://console.cloud.google.com/run/detail/us-central1/checkout-api/metrics?project=demo-project-123',
    expected: {
      projectId: 'demo-project-123',
      serviceType: 'cloud-run',
      regionOrZone: 'us-central1',
      resourceName: 'checkout-api',
    },
  },
  {
    name: 'Cloud Run service revisions tab with extra query params',
    url: 'https://console.cloud.google.com/run/detail/europe-west1/billing-worker/revisions?project=prod-app&authuser=1',
    expected: {
      projectId: 'prod-app',
      serviceType: 'cloud-run',
      regionOrZone: 'europe-west1',
      resourceName: 'billing-worker',
    },
  },
  {
    name: 'Cloud Run service logs tab',
    url: 'https://console.cloud.google.com/run/detail/asia-south1/kanakku-api/logs?project=my-org-proj',
    expected: {
      projectId: 'my-org-proj',
      serviceType: 'cloud-run',
      regionOrZone: 'asia-south1',
      resourceName: 'kanakku-api',
    },
  },
  {
    name: 'Cloud Run service with URL-encoded characters',
    url: 'https://console.cloud.google.com/run/detail/us-east1/orders%2Dservice/yaml?project=my%2Dproj%2D1',
    expected: {
      projectId: 'my-proj-1',
      serviceType: 'cloud-run',
      regionOrZone: 'us-east1',
      resourceName: 'orders-service',
    },
  },
];

export const COMPUTE_ENGINE_FIXTURES: UrlFixture[] = [
  {
    name: 'Compute Engine VM details page',
    url: 'https://console.cloud.google.com/compute/instancesDetail/zones/us-central1-a/instances/web-node-1?project=demo-project-123',
    expected: {
      projectId: 'demo-project-123',
      serviceType: 'compute-engine',
      regionOrZone: 'us-central1-a',
      resourceName: 'web-node-1',
    },
  },
  {
    name: 'Compute Engine VM monitoring tab',
    url: 'https://console.cloud.google.com/compute/instancesDetail/zones/us-central1-a/instances/web-node-1?project=demo-project-123&tab=monitoring',
    expected: {
      projectId: 'demo-project-123',
      serviceType: 'compute-engine',
      regionOrZone: 'us-central1-a',
      resourceName: 'web-node-1',
    },
  },
  {
    name: 'Compute Engine VM details tab with trailing slash and authuser',
    url: 'https://console.cloud.google.com/compute/instancesDetail/zones/europe-west4-b/instances/batch-runner/?authuser=0&project=analytics-prod&tab=details',
    expected: {
      projectId: 'analytics-prod',
      serviceType: 'compute-engine',
      regionOrZone: 'europe-west4-b',
      resourceName: 'batch-runner',
    },
  },
  {
    name: 'Compute Engine VM observability sub-path',
    url: 'https://console.cloud.google.com/compute/instancesDetail/zones/us-west1-b/instances/db-replica/observability?project=core-infra',
    expected: {
      projectId: 'core-infra',
      serviceType: 'compute-engine',
      regionOrZone: 'us-west1-b',
      resourceName: 'db-replica',
    },
  },
  {
    name: 'Compute Engine VM with URL-encoded instance and project',
    url: 'https://console.cloud.google.com/compute/instancesDetail/zones/asia-southeast1-a/instances/app%2Dvm%2D02?project=team%2Dalpha',
    expected: {
      projectId: 'team-alpha',
      serviceType: 'compute-engine',
      regionOrZone: 'asia-southeast1-a',
      resourceName: 'app-vm-02',
    },
  },
];

export const CLOUD_STORAGE_FIXTURES: UrlFixture[] = [
  {
    name: 'Cloud Storage bucket root',
    url: 'https://console.cloud.google.com/storage/browser/app-assets-bucket?project=demo-project-123',
    expected: {
      projectId: 'demo-project-123',
      serviceType: 'cloud-storage',
      regionOrZone: null,
      resourceName: 'app-assets-bucket',
    },
  },
  {
    name: 'Cloud Storage bucket subfolder',
    url: 'https://console.cloud.google.com/storage/browser/app-assets-bucket/releases/2026/?project=demo-project-123',
    expected: {
      projectId: 'demo-project-123',
      serviceType: 'cloud-storage',
      regionOrZone: null,
      resourceName: 'app-assets-bucket',
    },
  },
  {
    name: 'Cloud Storage bucket configuration tab via query param',
    url: 'https://console.cloud.google.com/storage/browser/billing-exports-raw?project=finops-proj&pageState=(%22StorageObjectListTable%22:(%22f%22:%22%22))&tab=configuration',
    expected: {
      projectId: 'finops-proj',
      serviceType: 'cloud-storage',
      regionOrZone: null,
      resourceName: 'billing-exports-raw',
    },
  },
  {
    name: 'Cloud Storage object details page',
    url: 'https://console.cloud.google.com/storage/browser/_details/billing-exports-raw/2026/11/report.csv?project=finops-proj',
    expected: {
      projectId: 'finops-proj',
      serviceType: 'cloud-storage',
      regionOrZone: null,
      resourceName: 'billing-exports-raw',
    },
  },
  {
    name: 'Cloud Storage bucket with URL-encoded characters',
    url: 'https://console.cloud.google.com/storage/browser/team%2Dbackups/folder%20one?project=my%2Dproj',
    expected: {
      projectId: 'my-proj',
      serviceType: 'cloud-storage',
      regionOrZone: null,
      resourceName: 'team-backups',
    },
  },
];

export const UNSUPPORTED_FIXTURES: UrlFixture[] = [
  {
    name: 'Cloud Run missing project parameter',
    url: 'https://console.cloud.google.com/run/detail/us-central1/checkout-api',
    expected: 'unsupported',
  },
  {
    name: 'Compute Engine empty project parameter',
    url: 'https://console.cloud.google.com/compute/instancesDetail/zones/us-central1-a/instances/web-node-1?project=',
    expected: 'unsupported',
  },
  {
    name: 'Cloud Storage bucket list page (no bucket selected)',
    url: 'https://console.cloud.google.com/storage/browser?project=demo-project-123',
    expected: 'unsupported',
  },
  {
    name: 'Cloud Storage _details without bucket name',
    url: 'https://console.cloud.google.com/storage/browser/_details?project=demo-project-123',
    expected: 'unsupported',
  },
  {
    name: 'Unsupported Google Cloud console service',
    url: 'https://console.cloud.google.com/bigquery?project=demo-project-123',
    expected: 'unsupported',
  },
  {
    name: 'Non-console URL',
    url: 'https://cloud.google.com/run/docs',
    expected: 'unsupported',
  },
  {
    name: 'Malformed percent-encoding',
    url: 'https://console.cloud.google.com/run/detail/us-central1/%E0%A4%A?project=demo-project-123',
    expected: 'unsupported',
  },
  {
    name: 'Invalid URL string',
    url: 'not a valid url',
    expected: 'unsupported',
  },
];
