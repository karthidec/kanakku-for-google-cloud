/**
 * Formats a numeric amount in the billing currency at display time.
 */
export function formatMoney(amount: number, currency: string): string {
  const code = currency || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

/**
 * Formats month-over-month percent change in plain English.
 */
export function formatPercentChange(percent: number | null): string {
  if (percent === null || !Number.isFinite(percent)) {
    return 'No prior month baseline';
  }
  const rounded = Math.round(percent);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}% vs last month`;
}

/**
 * Formats the latest usage timestamp as a relative freshness string.
 */
export function formatFreshness(
  isoTimestamp: string | null,
  nowMs: number = Date.now(),
): string {
  if (!isoTimestamp) {
    return 'freshness unknown';
  }

  const parsedMs = Date.parse(isoTimestamp);
  if (!Number.isFinite(parsedMs)) {
    return 'freshness unknown';
  }

  const diffMinutes = Math.max(0, Math.floor((nowMs - parsedMs) / 60_000));
  if (diffMinutes < 60) {
    const unit = diffMinutes === 1 ? 'minute' : 'minutes';
    return `as of ${diffMinutes} ${unit} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 48) {
    const unit = diffHours === 1 ? 'hour' : 'hours';
    return `as of ${diffHours} ${unit} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  const unit = diffDays === 1 ? 'day' : 'days';
  return `as of ${diffDays} ${unit} ago`;
}
