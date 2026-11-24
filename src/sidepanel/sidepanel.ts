import type { ParseResult, ServiceType } from '../core/url/types';
import type { ExtensionMessage } from '../shared/messages';
import { EMPTY_STATE_MESSAGE } from './messages';

const SERVICE_LABELS: Record<ServiceType, string> = {
  'cloud-run': 'Cloud Run service',
  'compute-engine': 'Compute Engine VM',
  'cloud-storage': 'Cloud Storage bucket',
};

/**
 * Updates the side panel DOM to show either the detected resource or empty state.
 */
export function renderSidePanel(
  resource: ParseResult = 'unsupported',
  doc: Document = document,
): void {
  const emptyState = doc.getElementById('empty-state');
  const statusElement = doc.getElementById('status-message');
  const resourceCard = doc.getElementById('resource-card');
  const serviceBadge = doc.getElementById('service-badge');
  const resourceName = doc.getElementById('resource-name');
  const resourceProject = doc.getElementById('resource-project');
  const regionRow = doc.getElementById('region-row');
  const resourceRegion = doc.getElementById('resource-region');

  if (resource === 'unsupported') {
    if (statusElement) {
      statusElement.textContent = EMPTY_STATE_MESSAGE;
    }
    emptyState?.classList.remove('hidden');
    resourceCard?.classList.add('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  resourceCard?.classList.remove('hidden');

  if (serviceBadge) {
    serviceBadge.textContent = SERVICE_LABELS[resource.serviceType];
  }
  if (resourceName) {
    resourceName.textContent = resource.resourceName;
  }
  if (resourceProject) {
    resourceProject.textContent = resource.projectId;
  }

  if (resource.regionOrZone) {
    if (resourceRegion) {
      resourceRegion.textContent = resource.regionOrZone;
    }
    regionRow?.classList.remove('hidden');
  } else {
    regionRow?.classList.add('hidden');
  }
}

function initSidePanel(): void {
  renderSidePanel('unsupported');

  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return;
  }

  chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
    if (message?.type === 'RESOURCE_CHANGED') {
      renderSidePanel(message.resource);
    }
  });

  const request: ExtensionMessage = { type: 'GET_ACTIVE_RESOURCE' };
  void chrome.runtime
    .sendMessage<ExtensionMessage, ParseResult>(request)
    .then((resource) => {
      if (resource) {
        renderSidePanel(resource);
      }
    })
    .catch(() => renderSidePanel('unsupported'));
}

if (typeof document !== 'undefined') {
  initSidePanel();
}
