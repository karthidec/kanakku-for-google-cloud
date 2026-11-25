import { generateExecutiveSummary } from '../core/ai';
import {
  buildCacheKey,
  buildListCacheKey,
  buildProjectCacheKey,
  getCachedBreakdown,
  getCachedSummary,
  setCachedBreakdown,
  setCachedSummary,
} from '../core/billing/cache';
import {
  fetchProjectOverview,
  fetchResourceCostSummary,
  fetchServiceBreakdown,
} from '../core/billing/client';
import { testBigQueryConnection } from '../core/billing/connection';
import type {
  ActiveConsoleIdentity,
  SidePanelCostState,
} from '../core/billing/types';
import {
  evaluateCostInsights,
  evaluateListInsights,
  evaluateProjectInsights,
} from '../core/insights';
import { parseConsoleTarget } from '../core/url';
import type { AuthStatusResult, ExtensionMessage } from '../shared/messages';
import { loadSettings, saveSettings } from '../shared/settings';
import { enableActionClickSidePanel } from './panel';

void enableActionClickSidePanel().catch((error: unknown) => {
  console.error('Failed to configure side panel behavior:', error);
});

async function getAccessToken(interactive: boolean): Promise<string | null> {
  try {
    const result = await chrome.identity.getAuthToken({ interactive });
    return result.token ?? null;
  } catch {
    return null;
  }
}

async function evictExpiredToken(token: string): Promise<void> {
  try {
    await chrome.identity.removeCachedAuthToken({ token });
  } catch {
    // Ignore eviction errors; user will be prompted to sign in again.
  }
}

async function resolveCostStateForUrl(
  url: string | undefined,
  forceRefresh = false,
): Promise<SidePanelCostState> {
  const parsed = url ? parseConsoleTarget(url) : 'unsupported';
  if (parsed === 'unsupported') {
    return { status: 'unsupported' };
  }

  const target: ActiveConsoleIdentity = parsed;
  const settings = await loadSettings();
  if (
    !settings.billingProjectId ||
    !settings.datasetName ||
    !settings.summaryTableName
  ) {
    return { status: 'missing_settings', target };
  }

  const aiConfig = {
    enabled: settings.aiExplanationsEnabled,
    apiKey: settings.geminiApiKey,
  };

  if (target.kind === 'resource') {
    const cacheKey = buildCacheKey(target.resource);
    let summary = !forceRefresh ? await getCachedSummary(cacheKey) : null;

    if (!summary) {
      const token = await getAccessToken(false);
      if (!token) {
        return { status: 'not_signed_in', target };
      }

      const result = await fetchResourceCostSummary(
        settings,
        target.resource,
        token,
      );
      if (result.status === 'no_data') {
        return { status: 'no_data', target };
      }
      if (result.status === 'error') {
        if (result.unauthorized) {
          await evictExpiredToken(token);
          return { status: 'not_signed_in', target };
        }
        return { status: 'error', target, message: result.message };
      }
      summary = result.summary;
      await setCachedSummary(cacheKey, summary, settings.cacheMinutes);
    }

    const insights = evaluateCostInsights(
      summary,
      target.resource,
      settings.monthlyAlertThreshold,
    );
    const executiveSummary = await generateExecutiveSummary(
      {
        title: `${target.resource.resourceName} (${target.resource.serviceType})`,
        projectId: target.resource.projectId,
        currency: summary.currency,
        listPrice: summary.thisMonthListPrice,
        cudCredits: summary.thisMonthCudCredits,
        totalSavings: summary.totalSavings,
        finalPrice: summary.thisMonthAfterCredits,
        percentChange: summary.percentChange,
        insights,
      },
      aiConfig,
    );

    return {
      status: 'loaded',
      resource: target.resource,
      summary,
      monthlyAlertThreshold: settings.monthlyAlertThreshold,
      executiveSummary,
    };
  }

  if (target.kind === 'service-list') {
    const listCacheKey = buildListCacheKey(target.list);
    let breakdown = !forceRefresh
      ? await getCachedBreakdown(listCacheKey)
      : null;

    if (!breakdown) {
      const token = await getAccessToken(false);
      if (!token) {
        return { status: 'not_signed_in', target };
      }

      const listResult = await fetchServiceBreakdown(
        settings,
        target.list,
        token,
      );
      if (listResult.status === 'no_data') {
        return { status: 'no_data', target };
      }
      if (listResult.status === 'error') {
        if (listResult.unauthorized) {
          await evictExpiredToken(token);
          return { status: 'not_signed_in', target };
        }
        return { status: 'error', target, message: listResult.message };
      }
      breakdown = listResult.breakdown;
      await setCachedBreakdown(listCacheKey, breakdown, settings.cacheMinutes);
    }

    const insights = evaluateListInsights(
      breakdown,
      target.list,
      settings.monthlyAlertThreshold,
    );
    const executiveSummary = await generateExecutiveSummary(
      {
        title: `${target.list.serviceType} overview`,
        projectId: target.list.projectId,
        currency: breakdown.currency,
        listPrice: breakdown.listPrice,
        cudCredits: breakdown.cudCredits,
        totalSavings: breakdown.totalSavings,
        finalPrice: breakdown.totalAfterCredits,
        percentChange: null,
        insights,
      },
      aiConfig,
    );

    return {
      status: 'loaded_list',
      list: target.list,
      breakdown,
      monthlyAlertThreshold: settings.monthlyAlertThreshold,
      executiveSummary,
    };
  }

  const projectCacheKey = buildProjectCacheKey(target.project.projectId);
  let projectBreakdown = !forceRefresh
    ? await getCachedBreakdown(projectCacheKey)
    : null;

  if (!projectBreakdown) {
    const token = await getAccessToken(false);
    if (!token) {
      return { status: 'not_signed_in', target };
    }

    const projectResult = await fetchProjectOverview(
      settings,
      target.project.projectId,
      token,
    );
    if (projectResult.status === 'no_data') {
      return { status: 'no_data', target };
    }
    if (projectResult.status === 'error') {
      if (projectResult.unauthorized) {
        await evictExpiredToken(token);
        return { status: 'not_signed_in', target };
      }
      return { status: 'error', target, message: projectResult.message };
    }
    projectBreakdown = projectResult.breakdown;
    await setCachedBreakdown(
      projectCacheKey,
      projectBreakdown,
      settings.cacheMinutes,
    );
  }

  const projectInsights = evaluateProjectInsights(
    projectBreakdown,
    settings.monthlyAlertThreshold,
  );
  const executiveSummary = await generateExecutiveSummary(
    {
      title: 'All project services',
      projectId: target.project.projectId,
      currency: projectBreakdown.currency,
      listPrice: projectBreakdown.listPrice,
      cudCredits: projectBreakdown.cudCredits,
      totalSavings: projectBreakdown.totalSavings,
      finalPrice: projectBreakdown.totalAfterCredits,
      percentChange: null,
      insights: projectInsights,
    },
    aiConfig,
  );

  return {
    status: 'loaded_project',
    project: target.project,
    breakdown: projectBreakdown,
    monthlyAlertThreshold: settings.monthlyAlertThreshold,
    executiveSummary,
  };
}

async function getActiveTabCostState(
  forceRefresh = false,
): Promise<SidePanelCostState> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return resolveCostStateForUrl(activeTab?.url, forceRefresh);
}

function broadcastCostState(url: string | undefined): void {
  void resolveCostStateForUrl(url)
    .then((state) => {
      const message: ExtensionMessage = { type: 'COST_STATE_CHANGED', state };
      // Ignore when the side panel is closed and no listener is attached.
      return chrome.runtime.sendMessage(message).catch(() => undefined);
    })
    .catch(() => undefined);
}

async function handleGetAuthStatus(): Promise<AuthStatusResult> {
  const token = await getAccessToken(false);
  return token
    ? { signedIn: true, message: 'Signed in with Google (read-only BigQuery).' }
    : { signedIn: false, message: 'Not signed in.' };
}

async function handleSignIn(): Promise<AuthStatusResult> {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2?.client_id ?? '';
  if (!clientId || clientId === '__OAUTH_CLIENT_ID__') {
    return {
      signedIn: false,
      message:
        'OAuth client ID is not configured. Add oauth.local.json and rebuild (see docs/setup-guide.md).',
    };
  }

  const token = await getAccessToken(true);
  return token
    ? { signedIn: true, message: 'Signed in with Google (read-only BigQuery).' }
    : {
        signedIn: false,
        message: 'Google sign-in was cancelled or failed. Please try again.',
      };
}

async function handleClearAllData(): Promise<{ ok: boolean; message: string }> {
  await chrome.storage.local.clear();
  if (typeof chrome.identity.clearAllCachedAuthTokens === 'function') {
    await chrome.identity.clearAllCachedAuthTokens();
  }
  return {
    ok: true,
    message: 'Cleared all saved settings, cached data, and sign-in tokens.',
  };
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs
    .get(tabId)
    .then((tab) => broadcastCostState(tab.url))
    .catch(() => broadcastCostState(undefined));
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (!tab.active || !changeInfo.url) {
    return;
  }
  broadcastCostState(changeInfo.url);
});

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    switch (message?.type) {
      case 'GET_SIDE_PANEL_STATE':
        void getActiveTabCostState(Boolean(message.forceRefresh))
          .then((state) => sendResponse(state))
          .catch(() => sendResponse({ status: 'unsupported' }));
        return true;

      case 'OPEN_OPTIONS':
        void chrome.runtime.openOptionsPage();
        return false;

      case 'GET_AUTH_STATUS':
        void handleGetAuthStatus()
          .then((status) => sendResponse(status))
          .catch(() =>
            sendResponse({ signedIn: false, message: 'Not signed in.' }),
          );
        return true;

      case 'SIGN_IN':
        void handleSignIn()
          .then((status) => sendResponse(status))
          .catch(() =>
            sendResponse({
              signedIn: false,
              message: 'Google sign-in failed. Please try again.',
            }),
          );
        return true;

      case 'TEST_CONNECTION':
        void (async () => {
          const saved = await saveSettings(message.settings);
          const token = await getAccessToken(false);
          if (!token) {
            return {
              ok: false,
              message: 'Please sign in with Google first.',
            };
          }
          return testBigQueryConnection(saved, token);
        })()
          .then((result) => sendResponse(result))
          .catch(() =>
            sendResponse({
              ok: false,
              message: 'Could not test the connection. Please try again.',
            }),
          );
        return true;

      case 'CLEAR_ALL_DATA':
        void handleClearAllData()
          .then((result) => sendResponse(result))
          .catch(() =>
            sendResponse({
              ok: false,
              message: 'Failed to clear local data. Please try again.',
            }),
          );
        return true;

      default:
        return false;
    }
  },
);
