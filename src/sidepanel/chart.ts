import type { DailyCostPoint } from '../core/billing/types';
import { formatMoney } from '../core/format';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Renders a plain-SVG 30-day daily cost bar chart without any external chart libraries.
 */
export function renderDailyChart(
  container: HTMLElement,
  series: DailyCostPoint[],
  currency: string = 'USD',
): void {
  container.replaceChildren();
  if (series.length === 0) {
    return;
  }

  const width = 260;
  const height = 56;
  const maxVal = Math.max(
    0.01,
    ...series.map((point) => Math.max(0, point.costAfterCredits)),
  );
  const slotWidth = width / series.length;
  const barWidth = Math.max(2, slotWidth - 2);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'sparkline-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', '30-day daily cost chart');

  series.forEach((point, index) => {
    const value = Math.max(0, point.costAfterCredits);
    const barHeight =
      value > 0 ? Math.max(2, (value / maxVal) * (height - 4)) : 1;
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (index * slotWidth + 1).toFixed(1));
    rect.setAttribute('y', (height - barHeight).toFixed(1));
    rect.setAttribute('width', barWidth.toFixed(1));
    rect.setAttribute('height', barHeight.toFixed(1));
    rect.setAttribute('rx', '1');
    rect.setAttribute(
      'class',
      value > 0 ? 'sparkline-bar' : 'sparkline-bar-zero',
    );

    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `${point.date}: ${formatMoney(point.costAfterCredits, currency)} (${formatMoney(point.costBeforeDiscounts, currency)} before discounts)`;
    rect.appendChild(title);

    svg.appendChild(rect);
  });

  container.appendChild(svg);
}
