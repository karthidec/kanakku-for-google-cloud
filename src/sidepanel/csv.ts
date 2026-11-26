import type { ServiceBreakdownItem } from '../core/billing/types';

function escapeCsvCell(value: string): string {
  const neutralized = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

/**
 * Builds a formula-safe CSV export of service or resource cost rows.
 */
export function buildBreakdownCsv(items: ServiceBreakdownItem[]): string {
  const header =
    'Name,Region,Currency,Before Discounts,CUD Credits,Other Credits,Final Price';
  const rows = items.map((item) =>
    [
      escapeCsvCell(item.resourceName),
      escapeCsvCell(item.region ?? ''),
      escapeCsvCell(item.currency),
      item.costBeforeDiscounts.toFixed(2),
      item.cudCredits.toFixed(2),
      item.otherCredits.toFixed(2),
      item.costAfterCredits.toFixed(2),
    ].join(','),
  );

  return [header, ...rows].join('\n');
}
