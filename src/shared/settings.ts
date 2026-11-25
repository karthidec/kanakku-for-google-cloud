export interface ExtensionSettings {
  billingProjectId: string;
  datasetName: string;
  summaryTableName: string;
  cacheMinutes: number;
  monthlyAlertThreshold: number;
  aiExplanationsEnabled: boolean;
  geminiApiKey: string;
}

export const SETTINGS_STORAGE_KEY = 'kanakku_settings';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  billingProjectId: '',
  datasetName: '',
  summaryTableName: '',
  cacheMinutes: 60,
  monthlyAlertThreshold: 0,
  aiExplanationsEnabled: false,
  geminiApiKey: '',
};

/**
 * Normalizes partial or user-edited settings into valid ExtensionSettings.
 */
export function normalizeSettings(
  raw: Partial<ExtensionSettings> | undefined,
): ExtensionSettings {
  const cacheMinutes =
    typeof raw?.cacheMinutes === 'number' &&
    Number.isFinite(raw.cacheMinutes) &&
    raw.cacheMinutes > 0
      ? Math.round(raw.cacheMinutes)
      : DEFAULT_SETTINGS.cacheMinutes;

  const monthlyAlertThreshold =
    typeof raw?.monthlyAlertThreshold === 'number' &&
    Number.isFinite(raw.monthlyAlertThreshold) &&
    raw.monthlyAlertThreshold > 0
      ? Math.round(raw.monthlyAlertThreshold * 100) / 100
      : DEFAULT_SETTINGS.monthlyAlertThreshold;

  return {
    billingProjectId: (raw?.billingProjectId ?? '').trim(),
    datasetName: (raw?.datasetName ?? '').trim(),
    summaryTableName: (raw?.summaryTableName ?? '').trim(),
    cacheMinutes,
    monthlyAlertThreshold,
    aiExplanationsEnabled: Boolean(raw?.aiExplanationsEnabled),
    geminiApiKey: (raw?.geminiApiKey ?? '').trim(),
  };
}

export async function loadSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  return normalizeSettings(
    stored[SETTINGS_STORAGE_KEY] as Partial<ExtensionSettings> | undefined,
  );
}

export async function saveSettings(
  settings: ExtensionSettings,
): Promise<ExtensionSettings> {
  const normalized = normalizeSettings(settings);
  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: normalized });
  return normalized;
}
