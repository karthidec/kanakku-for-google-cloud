import type {
  ActiveConsoleIdentity,
  ExecutiveSummaryPayload,
  SidePanelCostState,
} from '../core/billing/types';
import {
  formatFreshness,
  formatMoney,
  formatPercentChange,
} from '../core/format';
import {
  estimateMonthEndCost,
  evaluateCostInsights,
  evaluateListInsights,
  evaluateProjectInsights,
  type CostInsight,
} from '../core/insights';
import type { ServiceType } from '../core/url/types';
import type { ExtensionMessage } from '../shared/messages';
import { renderDailyChart } from './chart';
import { EMPTY_STATE_MESSAGE } from './messages';

const SERVICE_LABELS: Record<ServiceType, string> = {
  'cloud-run': 'Cloud Run service',
  'compute-engine': 'Compute Engine VM',
  'cloud-storage': 'Cloud Storage bucket',
  gke: 'GKE cluster',
  bigquery: 'BigQuery',
  'vertex-ai': 'Vertex AI',
  'cloud-sql': 'Cloud SQL instance',
  pubsub: 'Cloud Pub/Sub',
  'artifact-registry': 'Artifact Registry',
};

const SERVICE_LIST_LABELS: Record<ServiceType, string> = {
  'cloud-run': 'Cloud Run services',
  'compute-engine': 'Compute Engine VMs',
  'cloud-storage': 'Cloud Storage buckets',
  gke: 'GKE clusters',
  bigquery: 'BigQuery',
  'vertex-ai': 'Vertex AI',
  'cloud-sql': 'Cloud SQL instances',
  pubsub: 'Cloud Pub/Sub',
  'artifact-registry': 'Artifact Registry',
};

let lastSummaryText = '';

function renderIdentityHeader(
  target: ActiveConsoleIdentity,
  doc: Document,
): void {
  const serviceBadge = doc.getElementById('service-badge');
  const resourceName = doc.getElementById('resource-name');
  const resourceProject = doc.getElementById('resource-project');
  const regionRow = doc.getElementById('region-row');
  const resourceRegion = doc.getElementById('resource-region');
  const billingLink = doc.getElementById(
    'billing-link',
  ) as HTMLAnchorElement | null;

  if (target.kind === 'resource') {
    if (serviceBadge) {
      serviceBadge.textContent = SERVICE_LABELS[target.resource.serviceType];
    }
    if (resourceName) {
      resourceName.textContent = target.resource.resourceName;
    }
    if (resourceProject) {
      resourceProject.textContent = target.resource.projectId;
    }
    if (target.resource.regionOrZone) {
      if (resourceRegion) {
        resourceRegion.textContent = target.resource.regionOrZone;
      }
      regionRow?.classList.remove('hidden');
    } else {
      regionRow?.classList.add('hidden');
    }
    if (billingLink) {
      billingLink.href = `https://console.cloud.google.com/billing?project=${encodeURIComponent(target.resource.projectId)}`;
    }
    return;
  }

  if (target.kind === 'service-list') {
    if (serviceBadge) {
      serviceBadge.textContent = SERVICE_LIST_LABELS[target.list.serviceType];
    }
    if (resourceName) {
      resourceName.textContent = `All ${SERVICE_LIST_LABELS[target.list.serviceType]}`;
    }
    if (resourceProject) {
      resourceProject.textContent = target.list.projectId;
    }
    regionRow?.classList.add('hidden');
    if (billingLink) {
      billingLink.href = `https://console.cloud.google.com/billing?project=${encodeURIComponent(target.list.projectId)}`;
    }
    return;
  }

  if (serviceBadge) {
    serviceBadge.textContent = 'Project overview';
  }
  if (resourceName) {
    resourceName.textContent = 'All services this month';
  }
  if (resourceProject) {
    resourceProject.textContent = target.project.projectId;
  }
  regionRow?.classList.add('hidden');
  if (billingLink) {
    billingLink.href = `https://console.cloud.google.com/billing?project=${encodeURIComponent(target.project.projectId)}`;
  }
}

function showNotice(
  doc: Document,
  message: string,
  showSettingsButton: boolean,
  showChecklist: boolean,
): void {
  const noticeSection = doc.getElementById('notice-section');
  const noticeMessage = doc.getElementById('notice-message');
  const settingsBtn = doc.getElementById('open-settings-btn');
  const checklist = doc.getElementById('setup-checklist');

  doc.getElementById('cost-section')?.classList.add('hidden');
  doc.getElementById('list-section')?.classList.add('hidden');
  doc.getElementById('executive-summary-card')?.classList.add('hidden');
  doc.getElementById('card-actions')?.classList.add('hidden');
  doc.getElementById('precision-badge')?.classList.add('hidden');
  noticeSection?.classList.remove('hidden');
  if (noticeMessage) {
    noticeMessage.textContent = message;
  }
  settingsBtn?.classList.toggle('hidden', !showSettingsButton);
  checklist?.classList.toggle('hidden', !showChecklist);
}

function formatCreditValue(amount: number, currency: string): string {
  if (Math.abs(amount) < 0.005) {
    return formatMoney(0, currency);
  }
  const absFormatted = formatMoney(Math.abs(amount), currency);
  return amount < 0 ? `-${absFormatted}` : absFormatted;
}

function renderWaterfall(
  doc: Document,
  prefix: 'cost' | 'list',
  values: {
    listPrice: number;
    contractDiscount: number;
    beforeDiscounts: number;
    cudCredits: number;
    otherCredits: number;
    totalSavings: number;
    savingsPercent: number | null;
    currency: string;
  },
): void {
  const savingsBadge = doc.getElementById(`${prefix}-savings-badge`);
  if (savingsBadge) {
    if (values.totalSavings > 0.005) {
      const pctText =
        values.savingsPercent !== null
          ? ` (${Math.round(values.savingsPercent)}%)`
          : '';
      savingsBadge.textContent = `Saved ${formatMoney(values.totalSavings, values.currency)}${pctText}`;
      savingsBadge.classList.remove('hidden');
    } else {
      savingsBadge.classList.add('hidden');
    }
  }

  const listEl = doc.getElementById(`${prefix}-list-price`);
  if (listEl) {
    listEl.textContent = formatMoney(values.listPrice, values.currency);
  }

  const contractRow = doc.getElementById(`${prefix}-contract-row`);
  const contractEl = doc.getElementById(`${prefix}-contract-discount`);
  if (values.contractDiscount > 0.005) {
    if (contractEl) {
      contractEl.textContent = `-${formatMoney(values.contractDiscount, values.currency)}`;
    }
    contractRow?.classList.remove('hidden');
  } else {
    contractRow?.classList.add('hidden');
  }

  const beforeEl = doc.getElementById(`${prefix}-before-discounts`);
  if (beforeEl) {
    beforeEl.textContent = formatMoney(values.beforeDiscounts, values.currency);
  }

  const cudEl = doc.getElementById(`${prefix}-cud-credits`);
  if (cudEl) {
    cudEl.textContent = formatCreditValue(values.cudCredits, values.currency);
  }

  const otherRow = doc.getElementById(`${prefix}-other-credits-row`);
  const otherEl = doc.getElementById(`${prefix}-other-credits`);
  if (Math.abs(values.otherCredits) > 0.005) {
    if (otherEl) {
      otherEl.textContent = formatCreditValue(
        values.otherCredits,
        values.currency,
      );
    }
    otherRow?.classList.remove('hidden');
  } else {
    otherRow?.classList.add('hidden');
  }
}

function renderInsights(
  container: HTMLElement | null,
  insights: CostInsight[],
  doc: Document,
): void {
  if (!container) {
    return;
  }
  container.replaceChildren();
  if (insights.length === 0) {
    container.classList.add('hidden');
    return;
  }

  for (const insight of insights) {
    const li = doc.createElement('li');
    li.className = `insight-item ${insight.severity}`;

    const title = doc.createElement('div');
    title.className = 'insight-title';
    title.textContent = insight.title;

    const detail = doc.createElement('div');
    detail.className = 'insight-detail';
    detail.textContent = insight.detail;

    li.appendChild(title);
    li.appendChild(detail);

    if (insight.action) {
      const actionEl = doc.createElement('div');
      actionEl.className = 'insight-action';
      actionEl.textContent = `Next: ${insight.action}`;
      li.appendChild(actionEl);
    }

    container.appendChild(li);
  }
  container.classList.remove('hidden');
}

function renderExecutiveSummary(
  payload: ExecutiveSummaryPayload | undefined,
  doc: Document,
): void {
  const card = doc.getElementById('executive-summary-card');
  if (!payload) {
    card?.classList.add('hidden');
    return;
  }

  const badge = doc.getElementById('summary-source-badge');
  const text = doc.getElementById('executive-summary-text');
  const note = doc.getElementById('executive-summary-note');

  if (badge) {
    badge.textContent =
      payload.source === 'gemini' ? 'Gemini AI' : 'Standard Summary';
  }
  if (text) {
    text.textContent = payload.text;
  }
  if (note) {
    if (payload.note) {
      note.textContent = payload.note;
      note.classList.remove('hidden');
    } else {
      note.classList.add('hidden');
    }
  }
  card?.classList.remove('hidden');
}

/**
 * Updates the side panel DOM to render resource cost, service list, project overview, or status.
 */
export function renderSidePanel(
  state: SidePanelCostState = { status: 'unsupported' },
  doc: Document = document,
): void {
  const emptyState = doc.getElementById('empty-state');
  const statusElement = doc.getElementById('status-message');
  const resourceCard = doc.getElementById('resource-card');

  if (state.status === 'unsupported') {
    if (statusElement) {
      statusElement.textContent = EMPTY_STATE_MESSAGE;
    }
    emptyState?.classList.remove('hidden');
    resourceCard?.classList.add('hidden');
    lastSummaryText = '';
    return;
  }

  emptyState?.classList.add('hidden');
  resourceCard?.classList.remove('hidden');

  const identity: ActiveConsoleIdentity =
    state.status === 'loaded'
      ? { kind: 'resource', resource: state.resource }
      : state.status === 'loaded_list'
        ? { kind: 'service-list', list: state.list }
        : state.status === 'loaded_project'
          ? { kind: 'project-home', project: state.project }
          : state.target;

  renderIdentityHeader(identity, doc);

  if (state.status === 'not_signed_in') {
    showNotice(
      doc,
      'Sign in with Google in Settings to see costs.',
      true,
      true,
    );
    return;
  }
  if (state.status === 'missing_settings') {
    showNotice(
      doc,
      'Connect your BigQuery billing export in Settings to see costs.',
      true,
      true,
    );
    return;
  }
  if (state.status === 'no_data') {
    showNotice(
      doc,
      'No billing data found yet for this page in your summary table.',
      false,
      false,
    );
    return;
  }
  if (state.status === 'error') {
    showNotice(doc, state.message, true, false);
    return;
  }

  doc.getElementById('notice-section')?.classList.add('hidden');
  doc.getElementById('card-actions')?.classList.remove('hidden');
  renderExecutiveSummary(state.executiveSummary, doc);

  if (state.status === 'loaded_list' || state.status === 'loaded_project') {
    const { breakdown } = state;
    doc.getElementById('cost-section')?.classList.add('hidden');
    doc.getElementById('list-section')?.classList.remove('hidden');

    const precisionBadge = doc.getElementById('precision-badge');
    if (precisionBadge) {
      precisionBadge.textContent =
        state.status === 'loaded_project'
          ? `${breakdown.items.length} services`
          : `${breakdown.items.length} resources`;
      precisionBadge.classList.remove('hidden');
    }

    const totalAfterEl = doc.getElementById('list-after-credits');
    if (totalAfterEl) {
      totalAfterEl.textContent = formatMoney(
        breakdown.totalAfterCredits,
        breakdown.currency,
      );
    }

    renderWaterfall(doc, 'list', {
      listPrice: breakdown.listPrice,
      contractDiscount: breakdown.contractDiscount,
      beforeDiscounts: breakdown.totalBeforeDiscounts,
      cudCredits: breakdown.cudCredits,
      otherCredits: breakdown.otherCredits,
      totalSavings: breakdown.totalSavings,
      savingsPercent: breakdown.savingsPercent,
      currency: breakdown.currency,
    });

    const insights =
      state.status === 'loaded_project'
        ? evaluateProjectInsights(breakdown, state.monthlyAlertThreshold)
        : evaluateListInsights(
            breakdown,
            state.list,
            state.monthlyAlertThreshold,
          );
    renderInsights(doc.getElementById('list-insights-list'), insights, doc);

    const breakdownList = doc.getElementById('breakdown-list');
    if (breakdownList) {
      breakdownList.replaceChildren();
      for (const item of breakdown.items) {
        const li = doc.createElement('li');
        li.className = 'breakdown-row';

        const nameSpan = doc.createElement('span');
        nameSpan.className = 'breakdown-name';
        nameSpan.textContent = item.region
          ? `${item.resourceName} · ${item.region}`
          : item.resourceName;

        const costSpan = doc.createElement('span');
        costSpan.className = 'breakdown-cost';
        costSpan.textContent = formatMoney(
          item.costAfterCredits,
          item.currency,
        );

        li.appendChild(nameSpan);
        li.appendChild(costSpan);
        breakdownList.appendChild(li);
      }
    }

    const listFreshnessEl = doc.getElementById('list-freshness-label');
    const freshness = formatFreshness(breakdown.latestUsageTime);
    if (listFreshnessEl) {
      listFreshnessEl.textContent = breakdown.fromCache
        ? `${freshness} (cached)`
        : freshness;
    }

    const heading =
      state.status === 'loaded_project'
        ? `Project overview (${state.project.projectId})`
        : `${SERVICE_LIST_LABELS[state.list.serviceType]} (${state.list.projectId})`;

    lastSummaryText = [
      heading,
      `Final price this month: ${formatMoney(breakdown.totalAfterCredits, breakdown.currency)}`,
      `List price: ${formatMoney(breakdown.listPrice, breakdown.currency)}`,
      `CUD credits: ${formatCreditValue(breakdown.cudCredits, breakdown.currency)}`,
      state.executiveSummary.text,
      freshness,
    ].join('\n');
    return;
  }

  const { summary } = state;
  doc.getElementById('list-section')?.classList.add('hidden');
  doc.getElementById('cost-section')?.classList.remove('hidden');

  const precisionBadge = doc.getElementById('precision-badge');
  if (precisionBadge) {
    precisionBadge.textContent = summary.precision;
    precisionBadge.classList.remove('hidden');
  }

  const afterEl = doc.getElementById('cost-after-credits');
  if (afterEl) {
    afterEl.textContent = formatMoney(
      summary.thisMonthAfterCredits,
      summary.currency,
    );
  }

  renderWaterfall(doc, 'cost', {
    listPrice: summary.thisMonthListPrice,
    contractDiscount: summary.thisMonthContractDiscount,
    beforeDiscounts: summary.thisMonthBeforeDiscounts,
    cudCredits: summary.thisMonthCudCredits,
    otherCredits: summary.thisMonthOtherCredits,
    totalSavings: summary.totalSavings,
    savingsPercent: summary.savingsPercent,
    currency: summary.currency,
  });

  const estimateRow = doc.getElementById('cost-estimate-row');
  const estimateEl = doc.getElementById('cost-estimate');
  const projected = estimateMonthEndCost(summary);
  if (projected !== null) {
    if (estimateEl) {
      estimateEl.textContent = formatMoney(projected, summary.currency);
    }
    estimateRow?.classList.remove('hidden');
  } else {
    estimateRow?.classList.add('hidden');
  }

  const changeEl = doc.getElementById('cost-percent-change');
  if (changeEl) {
    changeEl.textContent = formatPercentChange(summary.percentChange);
  }

  renderInsights(
    doc.getElementById('insights-list'),
    evaluateCostInsights(summary, state.resource, state.monthlyAlertThreshold),
    doc,
  );

  const chartEl = doc.getElementById('daily-chart');
  if (chartEl) {
    renderDailyChart(chartEl, summary.dailySeries, summary.currency);
  }

  const freshness = formatFreshness(summary.latestUsageTime);
  const freshnessEl = doc.getElementById('freshness-label');
  if (freshnessEl) {
    freshnessEl.textContent = summary.fromCache
      ? `${freshness} (cached)`
      : freshness;
  }

  lastSummaryText = [
    `${state.resource.resourceName} (${SERVICE_LABELS[state.resource.serviceType]}, ${state.resource.projectId})`,
    `Final price this month: ${formatMoney(summary.thisMonthAfterCredits, summary.currency)}`,
    `List price: ${formatMoney(summary.thisMonthListPrice, summary.currency)}`,
    `CUD credits: ${formatCreditValue(summary.thisMonthCudCredits, summary.currency)}`,
    state.executiveSummary.text,
    `${summary.precision} | ${freshness}`,
  ].join('\n');
}

function setLoading(isLoading: boolean): void {
  document
    .getElementById('loading-banner')
    ?.classList.toggle('hidden', !isLoading);
}

function requestCostState(forceRefresh = false): void {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return;
  }
  setLoading(true);
  const request: ExtensionMessage = {
    type: 'GET_SIDE_PANEL_STATE',
    forceRefresh,
  };
  void chrome.runtime
    .sendMessage<ExtensionMessage, SidePanelCostState>(request)
    .then((state) => {
      if (state) {
        renderSidePanel(state);
      }
    })
    .catch(() => renderSidePanel({ status: 'unsupported' }))
    .finally(() => setLoading(false));
}

function initSidePanel(): void {
  renderSidePanel({ status: 'unsupported' });

  document
    .getElementById('open-settings-btn')
    ?.addEventListener('click', () => {
      void chrome.runtime?.sendMessage<ExtensionMessage>({
        type: 'OPEN_OPTIONS',
      });
    });

  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    requestCostState(true);
  });

  document.getElementById('list-refresh-btn')?.addEventListener('click', () => {
    requestCostState(true);
  });

  const copyBtn = document.getElementById('copy-summary-btn');
  copyBtn?.addEventListener('click', () => {
    if (!lastSummaryText || !navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(lastSummaryText).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy summary';
      }, 1500);
    });
  });

  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return;
  }

  chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
    if (message?.type === 'COST_STATE_CHANGED') {
      setLoading(false);
      renderSidePanel(message.state);
    }
  });

  requestCostState(false);
}

if (typeof document !== 'undefined') {
  initSidePanel();
}
