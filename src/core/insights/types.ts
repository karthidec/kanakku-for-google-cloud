export type InsightSeverity = 'info' | 'warning';

export interface CostInsight {
  id:
    | 'high-spend-alert'
    | 'credits-masking-spend'
    | 'always-on-flat-cost'
    | 'recent-spend-spike'
    | 'no-cud-coverage';
  severity: InsightSeverity;
  title: string;
  detail: string;
  action?: string;
}
