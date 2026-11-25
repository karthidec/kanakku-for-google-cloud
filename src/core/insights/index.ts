import type {
  ResourceCostSummary,
  ServiceCostBreakdown,
} from '../billing/types';
import { formatMoney } from '../format';
import type { ResourceIdentity, ServiceListIdentity } from '../url/types';
import type { CostInsight } from './types';

export type { CostInsight, InsightSeverity } from './types';

/**
 * Estimates month-end spend from current month-to-date pace.
 */
export function estimateMonthEndCost(
  summary: ResourceCostSummary,
  referenceDate: Date = new Date(),
): number | null {
  if (summary.thisMonthAfterCredits <= 0) {
    return null;
  }

  const dayOfMonth = Math.max(1, referenceDate.getUTCDate());
  const daysInMonth = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  return (summary.thisMonthAfterCredits / dayOfMonth) * daysInMonth;
}

function checkHighSpendAlert(
  amount: number,
  currency: string,
  threshold: number,
): CostInsight | null {
  if (threshold <= 0 || amount < threshold) {
    return null;
  }

  return {
    id: 'high-spend-alert',
    severity: 'warning',
    title: 'Action required: Spend exceeds monthly alert',
    detail: `Current spend (${formatMoney(amount, currency)}) is above your ${formatMoney(threshold, currency)}/month threshold.`,
    action: 'Review scaling limits, idle instances, or traffic drivers.',
  };
}

function checkNoCudCoverage(
  serviceType: ResourceIdentity['serviceType'],
  beforeDiscounts: number,
  cudCredits: number,
  currency: string,
): CostInsight | null {
  if (
    serviceType === 'cloud-storage' ||
    serviceType === 'bigquery' ||
    beforeDiscounts < 50 ||
    Math.abs(cudCredits) > 0.01
  ) {
    return null;
  }

  return {
    id: 'no-cud-coverage',
    severity: 'info',
    title: 'No CUD coverage detected',
    detail: `${formatMoney(beforeDiscounts, currency)} this month has $0 in Committed Use Discounts.`,
    action: 'Evaluate 1-year or 3-year CUDs if this workload is steady.',
  };
}

function checkCreditsMaskingSpend(
  summary: ResourceCostSummary,
): CostInsight | null {
  if (summary.thisMonthBeforeDiscounts <= 0) {
    return null;
  }

  const creditAmount =
    summary.thisMonthBeforeDiscounts - summary.thisMonthAfterCredits;
  const creditRatio = creditAmount / summary.thisMonthBeforeDiscounts;
  if (creditRatio < 0.8) {
    return null;
  }

  const pct = Math.min(100, Math.round(creditRatio * 100));
  return {
    id: 'credits-masking-spend',
    severity: 'info',
    title: 'Credits cover most of this cost',
    detail: `${pct}% is covered by credits right now (${formatMoney(summary.thisMonthBeforeDiscounts, summary.currency)} before discounts).`,
    action: 'Plan ahead for when promotional or trial credits expire.',
  };
}

function checkAlwaysOnFlatCost(
  summary: ResourceCostSummary,
  resource: ResourceIdentity,
): CostInsight | null {
  const activeDays = summary.dailySeries
    .map((point) => point.costBeforeDiscounts)
    .filter((cost) => cost > 0.01);

  if (activeDays.length < 14) {
    return null;
  }

  const min = Math.min(...activeDays);
  const max = Math.max(...activeDays);
  const avg = activeDays.reduce((sum, v) => sum + v, 0) / activeDays.length;
  if (avg <= 0 || (max - min) / avg > 0.15) {
    return null;
  }

  const action =
    resource.serviceType === 'cloud-run'
      ? 'Set min-instances to 0 if traffic can tolerate cold starts.'
      : resource.serviceType === 'compute-engine'
        ? 'Stop or right-size this VM outside active hours.'
        : 'Review storage class lifecycle rules.';

  return {
    id: 'always-on-flat-cost',
    severity: 'warning',
    title: 'Action required: Always-on daily cost',
    detail: `Steady spend (~${formatMoney(avg, summary.currency)}/day) on ${activeDays.length} of the last 30 days.`,
    action,
  };
}

function checkRecentSpendSpike(
  summary: ResourceCostSummary,
): CostInsight | null {
  const nonZeroDays = summary.dailySeries
    .map((point) => point.costBeforeDiscounts)
    .filter((cost) => cost > 0);

  if (nonZeroDays.length < 3) {
    return null;
  }

  const latest = summary.dailySeries[summary.dailySeries.length - 1];
  if (!latest || latest.costBeforeDiscounts <= 0.5) {
    return null;
  }

  const avg = nonZeroDays.reduce((sum, v) => sum + v, 0) / nonZeroDays.length;
  if (latest.costBeforeDiscounts <= avg * 2) {
    return null;
  }

  return {
    id: 'recent-spend-spike',
    severity: 'warning',
    title: 'Action required: Recent daily spend spike',
    detail: `${latest.date} was ${formatMoney(latest.costBeforeDiscounts, summary.currency)} vs ${formatMoney(avg, summary.currency)} daily average.`,
    action: 'Check recent deployments, traffic spikes, or runaway jobs.',
  };
}

/**
 * Evaluates deterministic, rule-based cost insights and alerts for a single resource.
 */
export function evaluateCostInsights(
  summary: ResourceCostSummary,
  resource: ResourceIdentity,
  monthlyAlertThreshold = 0,
): CostInsight[] {
  const candidates = [
    checkHighSpendAlert(
      summary.thisMonthAfterCredits,
      summary.currency,
      monthlyAlertThreshold,
    ),
    checkRecentSpendSpike(summary),
    checkAlwaysOnFlatCost(summary, resource),
    checkCreditsMaskingSpend(summary),
    checkNoCudCoverage(
      resource.serviceType,
      summary.thisMonthBeforeDiscounts,
      summary.thisMonthCudCredits,
      summary.currency,
    ),
  ];

  return candidates.filter((item): item is CostInsight => item !== null);
}

/**
 * Evaluates high-spend and CUD-coverage insights on service list pages.
 */
export function evaluateListInsights(
  breakdown: ServiceCostBreakdown,
  list: ServiceListIdentity,
  monthlyAlertThreshold = 0,
): CostInsight[] {
  const candidates = [
    checkHighSpendAlert(
      breakdown.totalAfterCredits,
      breakdown.currency,
      monthlyAlertThreshold,
    ),
    checkNoCudCoverage(
      list.serviceType,
      breakdown.totalBeforeDiscounts,
      breakdown.cudCredits,
      breakdown.currency,
    ),
  ];

  return candidates.filter((item): item is CostInsight => item !== null);
}

/**
 * Evaluates project-wide high-spend and CUD-coverage insights on Console Home.
 */
export function evaluateProjectInsights(
  breakdown: ServiceCostBreakdown,
  monthlyAlertThreshold = 0,
): CostInsight[] {
  const candidates = [
    checkHighSpendAlert(
      breakdown.totalAfterCredits,
      breakdown.currency,
      monthlyAlertThreshold,
    ),
    checkNoCudCoverage(
      'compute-engine',
      breakdown.totalBeforeDiscounts,
      breakdown.cudCredits,
      breakdown.currency,
    ),
  ];

  return candidates.filter((item): item is CostInsight => item !== null);
}
