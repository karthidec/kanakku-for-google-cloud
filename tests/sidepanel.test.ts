import { describe, expect, it, vi } from 'vitest';
import { enableActionClickSidePanel } from '../src/background/panel';
import { EMPTY_STATE_MESSAGE } from '../src/sidepanel/messages';
import { renderSidePanel } from '../src/sidepanel/sidepanel';

interface FakeClassList {
  classes: Set<string>;
  add(name: string): void;
  remove(name: string): void;
  toggle(name: string, force?: boolean): void;
}

interface FakeElement {
  id: string;
  textContent: string;
  href?: string;
  classList: FakeClassList;
  children: FakeElement[];
  replaceChildren(): void;
  appendChild(child: FakeElement): void;
  setAttribute(): void;
}

function createFakeDoc(): {
  doc: Document;
  elements: Map<string, FakeElement>;
} {
  const elements = new Map<string, FakeElement>();

  function makeEl(id = ''): FakeElement {
    const classes = new Set<string>();
    const el: FakeElement = {
      id,
      textContent: '',
      children: [],
      classList: {
        classes,
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        toggle: (name, force) => {
          if (force === undefined) {
            if (classes.has(name)) classes.delete(name);
            else classes.add(name);
          } else if (force) {
            classes.add(name);
          } else {
            classes.delete(name);
          }
        },
      },
      replaceChildren: () => {
        el.children = [];
      },
      appendChild: (child) => {
        el.children.push(child);
      },
      setAttribute: () => undefined,
    };
    return el;
  }

  const ids = [
    'empty-state',
    'status-message',
    'resource-card',
    'service-badge',
    'precision-badge',
    'resource-name',
    'resource-project',
    'region-row',
    'resource-region',
    'billing-link',
    'notice-section',
    'notice-message',
    'open-settings-btn',
    'setup-checklist',
    'cost-section',
    'list-section',
    'card-actions',
    'executive-summary-card',
    'summary-source-badge',
    'executive-summary-text',
    'executive-summary-note',
    'cost-after-credits',
    'cost-savings-badge',
    'cost-list-price',
    'cost-contract-row',
    'cost-contract-discount',
    'cost-before-discounts',
    'cost-cud-credits',
    'cost-other-credits-row',
    'cost-other-credits',
    'cost-estimate-row',
    'cost-estimate',
    'cost-percent-change',
    'insights-list',
    'daily-chart',
    'freshness-label',
  ];

  for (const id of ids) {
    elements.set(id, makeEl(id));
  }

  const doc = {
    getElementById: (id: string) => elements.get(id) ?? null,
    createElement: () => makeEl(),
    createElementNS: () => makeEl(),
  } as unknown as Document;

  return { doc, elements };
}

describe('side panel defaults', () => {
  it('shows the expected empty-state prompt', () => {
    expect(EMPTY_STATE_MESSAGE).toBe(
      'Open a Google Cloud resource to see its cost.',
    );
  });

  it('enables opening the side panel on toolbar icon click', async () => {
    const setPanelBehavior = vi.fn().mockResolvedValue(undefined);
    await enableActionClickSidePanel({
      setPanelBehavior,
    } as unknown as typeof chrome.sidePanel);

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it('does not throw when chrome.sidePanel is unavailable', async () => {
    await expect(
      enableActionClickSidePanel(undefined),
    ).resolves.toBeUndefined();
  });
});

describe('renderSidePanel', () => {
  it('renders empty state for unsupported pages', () => {
    const { doc, elements } = createFakeDoc();
    renderSidePanel({ status: 'unsupported' }, doc);

    expect(elements.get('status-message')?.textContent).toBe(
      EMPTY_STATE_MESSAGE,
    );
    expect(elements.get('empty-state')?.classList.classes.has('hidden')).toBe(
      false,
    );
    expect(elements.get('resource-card')?.classList.classes.has('hidden')).toBe(
      true,
    );
  });

  it('renders waterfall, CUDs, and executive summary for loaded resource', () => {
    const { doc, elements } = createFakeDoc();
    renderSidePanel(
      {
        status: 'loaded',
        resource: {
          projectId: 'demo-proj',
          serviceType: 'cloud-run',
          regionOrZone: 'us-central1',
          resourceName: 'api-svc',
        },
        summary: {
          currency: 'USD',
          thisMonthListPrice: 50,
          thisMonthContractDiscount: 5,
          thisMonthBeforeDiscounts: 45,
          thisMonthCudCredits: -10,
          thisMonthOtherCredits: 0,
          thisMonthAfterCredits: 35,
          totalSavings: 15,
          savingsPercent: 30,
          lastMonthSameDaysAfterCredits: 30,
          percentChange: 16.6,
          dailySeries: [],
          latestUsageTime: '2026-11-25T16:00:00Z',
          precision: 'this resource',
          fetchedAt: 1000,
          fromCache: false,
        },
        monthlyAlertThreshold: 0,
        executiveSummary: {
          source: 'standard',
          text: 'Summary text',
        },
      },
      doc,
    );

    expect(elements.get('resource-name')?.textContent).toBe('api-svc');
    expect(elements.get('cost-after-credits')?.textContent).toBe('$35.00');
    expect(elements.get('cost-list-price')?.textContent).toBe('$50.00');
    expect(elements.get('cost-cud-credits')?.textContent).toBe('-$10.00');
    expect(elements.get('cost-savings-badge')?.textContent).toBe(
      'Saved $15.00 (30%)',
    );
    expect(elements.get('summary-source-badge')?.textContent).toBe(
      'Standard Summary',
    );
  });
});
