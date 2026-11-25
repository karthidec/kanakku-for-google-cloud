import type {
  CostPrecision,
  DailyBillingRow,
  DailyCostPoint,
  ResourceCostSummary,
} from './types';

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPriorMonthRange(referenceDate: Date): {
  start: string;
  end: string;
} {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const day = referenceDate.getUTCDate();

  const priorMonthStart = new Date(Date.UTC(year, month - 1, 1));
  const priorMonthLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const clampedDay = Math.min(day, priorMonthLastDay);
  const priorMonthEnd = new Date(Date.UTC(year, month - 1, clampedDay));

  return {
    start: formatUtcDate(priorMonthStart),
    end: formatUtcDate(priorMonthEnd),
  };
}

function buildThirtyDaySeries(
  byDate: Map<string, { after: number; before: number }>,
  referenceDate: Date,
): DailyCostPoint[] {
  const series: DailyCostPoint[] = [];
  const baseUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );

  for (let offset = 29; offset >= 0; offset--) {
    const dayDate = new Date(baseUtc - offset * 86_400_000);
    const key = formatUtcDate(dayDate);
    const entry = byDate.get(key);
    series.push({
      date: key,
      costAfterCredits: entry?.after ?? 0,
      costBeforeDiscounts: entry?.before ?? 0,
    });
  }

  return series;
}

/**
 * Aggregates daily billing rows into month-to-date waterfall totals,
 * prior-month comparison, a 30-day daily series, and latest usage timestamp.
 */
export function summarizeBillingRows(
  rows: DailyBillingRow[],
  precision: CostPrecision,
  referenceDate: Date = new Date(),
  fetchedAt: number = Date.now(),
): ResourceCostSummary {
  const thisMonthStart = formatUtcDate(
    new Date(
      Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
    ),
  );
  const today = formatUtcDate(referenceDate);
  const priorRange = getPriorMonthRange(referenceDate);

  let thisMonthListPrice = 0;
  let thisMonthBeforeDiscounts = 0;
  let thisMonthCudCredits = 0;
  let thisMonthOtherCredits = 0;
  let thisMonthAfterCredits = 0;
  let lastMonthSameDaysAfterCredits = 0;
  let latestUsageTime: string | null = null;
  let currency = 'USD';
  const byDate = new Map<string, { after: number; before: number }>();

  for (const row of rows) {
    if (row.currency) {
      currency = row.currency;
    }

    const existing = byDate.get(row.usageDate);
    byDate.set(row.usageDate, {
      after: (existing?.after ?? 0) + row.costAfterCredits,
      before: (existing?.before ?? 0) + row.costBeforeDiscounts,
    });

    if (row.usageDate >= thisMonthStart && row.usageDate <= today) {
      const effectiveList =
        row.costAtList > 0 ? row.costAtList : row.costBeforeDiscounts;
      thisMonthListPrice += effectiveList;
      thisMonthBeforeDiscounts += row.costBeforeDiscounts;
      thisMonthCudCredits += row.cudCredits;
      thisMonthOtherCredits += row.otherCredits;
      thisMonthAfterCredits += row.costAfterCredits;
    }

    if (row.usageDate >= priorRange.start && row.usageDate <= priorRange.end) {
      lastMonthSameDaysAfterCredits += row.costAfterCredits;
    }

    if (
      row.latestUsageTime &&
      (!latestUsageTime || row.latestUsageTime > latestUsageTime)
    ) {
      latestUsageTime = row.latestUsageTime;
    }
  }

  const thisMonthContractDiscount = Math.max(
    0,
    thisMonthListPrice - thisMonthBeforeDiscounts,
  );
  const totalSavings = Math.max(0, thisMonthListPrice - thisMonthAfterCredits);
  const savingsPercent =
    thisMonthListPrice > 0 ? (totalSavings / thisMonthListPrice) * 100 : null;

  const percentChange =
    lastMonthSameDaysAfterCredits > 0
      ? ((thisMonthAfterCredits - lastMonthSameDaysAfterCredits) /
          lastMonthSameDaysAfterCredits) *
        100
      : null;

  return {
    currency,
    thisMonthListPrice,
    thisMonthContractDiscount,
    thisMonthBeforeDiscounts,
    thisMonthCudCredits,
    thisMonthOtherCredits,
    thisMonthAfterCredits,
    totalSavings,
    savingsPercent,
    lastMonthSameDaysAfterCredits,
    percentChange,
    dailySeries: buildThirtyDaySeries(byDate, referenceDate),
    latestUsageTime,
    precision,
    fetchedAt,
    fromCache: false,
  };
}
