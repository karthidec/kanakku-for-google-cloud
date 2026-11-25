export type ServiceType =
  | 'cloud-run'
  | 'compute-engine'
  | 'cloud-storage'
  | 'gke'
  | 'bigquery'
  | 'vertex-ai'
  | 'cloud-sql'
  | 'pubsub'
  | 'artifact-registry';

export interface ResourceIdentity {
  projectId: string;
  serviceType: ServiceType;
  regionOrZone: string | null;
  resourceName: string;
}

export interface ServiceListIdentity {
  projectId: string;
  serviceType: ServiceType;
}

export interface ProjectHomeIdentity {
  projectId: string;
}

export type ParseResult = ResourceIdentity | 'unsupported';

export type ConsoleTarget =
  | { kind: 'resource'; resource: ResourceIdentity }
  | { kind: 'service-list'; list: ServiceListIdentity }
  | { kind: 'project-home'; project: ProjectHomeIdentity }
  | 'unsupported';
