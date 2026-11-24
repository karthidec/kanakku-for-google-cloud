import { parseConsoleUrl, type ParseResult } from '../core/url';
import type { ExtensionMessage } from '../shared/messages';
import { enableActionClickSidePanel } from './panel';

void enableActionClickSidePanel().catch((error: unknown) => {
  console.error('Failed to configure side panel behavior:', error);
});

function parseTabUrl(url: string | undefined): ParseResult {
  return url ? parseConsoleUrl(url) : 'unsupported';
}

async function getActiveTabResource(): Promise<ParseResult> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return parseTabUrl(activeTab?.url);
}

function broadcastResource(resource: ParseResult): void {
  const message: ExtensionMessage = { type: 'RESOURCE_CHANGED', resource };
  // Ignore when the side panel is closed and no listener is attached.
  void chrome.runtime.sendMessage(message).catch(() => undefined);
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs
    .get(tabId)
    .then((tab) => broadcastResource(parseTabUrl(tab.url)))
    .catch(() => broadcastResource('unsupported'));
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (!tab.active || !changeInfo.url) {
    return;
  }
  broadcastResource(parseTabUrl(changeInfo.url));
});

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message?.type !== 'GET_ACTIVE_RESOURCE') {
      return false;
    }

    void getActiveTabResource()
      .then((resource) => sendResponse(resource))
      .catch(() => sendResponse('unsupported'));
    return true;
  },
);
