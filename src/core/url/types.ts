export type ServiceType = 'cloud-run' | 'compute-engine' | 'cloud-storage';

export interface ResourceIdentity {
  projectId: string;
  serviceType: ServiceType;
  regionOrZone: string | null;
  resourceName: string;
}

export type ParseResult = ResourceIdentity | 'unsupported';
