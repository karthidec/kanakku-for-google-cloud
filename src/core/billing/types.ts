import type {
  ProjectHomeIdentity,
  ResourceIdentity,
  ServiceListIdentity,
} from '../url/types';

export type CostPrecision = 'this resource' | 'project share';

export interface DailyBillingRow {
  usageDate: string;
  currency: string;
  costAtList: number;
  costBeforeDiscounts: number;
  cudCredits: number;
  otherCredits: number;
  costAfterCredits: number;
  latestUsageTime: string | null;
}

export interface DailyCostPoint {
  date: string;
  costAfterCredits: number;
  costBeforeDiscounts: number;
}

export interface ResourceCostSummary {
  currency: string;
  thisMonthListPrice: number;
  thisMonthContractDiscount: number;
  thisMonthBeforeDiscounts: number;
  thisMonthCudCredits: number;
  thisMonthOtherCredits: number;
  thisMonthAfterCredits: number;
  totalSavings: number;
  savingsPercent: number | null;
  lastMonthSameDaysAfterCredits: number;
  percentChange: number | null;
  dailySeries: DailyCostPoint[];
  latestUsageTime: string | null;
  precision: CostPrecision;
  fetchedAt: number;
  fromCache: boolean;
}

export interface ServiceBreakdownItem {
  resourceName: string;
  currency: string;
  costBeforeDiscounts: number;
  cudCredits: number;
  otherCredits: number;
  costAfterCredits: number;
}

export interface ServiceCostBreakdown {
  currency: string;
  listPrice: number;
  contractDiscount: number;
  totalBeforeDiscounts: number;
  cudCredits: number;
  otherCredits: number;
  totalAfterCredits: number;
  totalSavings: number;
  savingsPercent: number | null;
  items: ServiceBreakdownItem[];
  latestUsageTime: string | null;
  fetchedAt: number;
  fromCache: boolean;
}

export type ActiveConsoleIdentity =
  | { kind: 'resource'; resource: ResourceIdentity }
  | { kind: 'service-list'; list: ServiceListIdentity }
  | { kind: 'project-home'; project: ProjectHomeIdentity };

export interface ExecutiveSummaryPayload {
  source: 'standard' | 'gemini';
  text: string;
  note?: string;
}

export type SidePanelCostState =
  | { status: 'unsupported' }
  | { status: 'not_signed_in'; target: ActiveConsoleIdentity }
  | { status: 'missing_settings'; target: ActiveConsoleIdentity }
  | { status: 'no_data'; target: ActiveConsoleIdentity }
  | { status: 'error'; target: ActiveConsoleIdentity; message: string }
  | {
      status: 'loaded';
      resource: ResourceIdentity;
      summary: ResourceCostSummary;
      monthlyAlertThreshold: number;
      executiveSummary: ExecutiveSummaryPayload;
    }
  | {
      status: 'loaded_list';
      list: ServiceListIdentity;
      breakdown: ServiceCostBreakdown;
      monthlyAlertThreshold: number;
      executiveSummary: ExecutiveSummaryPayload;
    }
  | {
      status: 'loaded_project';
      project: ProjectHomeIdentity;
      breakdown: ServiceCostBreakdown;
      monthlyAlertThreshold: number;
      executiveSummary: ExecutiveSummaryPayload;
    };
