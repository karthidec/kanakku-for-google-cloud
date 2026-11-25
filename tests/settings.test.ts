import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/shared/settings';

describe('settings', () => {
  it('uses safe defaults', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      billingProjectId: '',
      datasetName: '',
      summaryTableName: '',
      cacheMinutes: 60,
      monthlyAlertThreshold: 0,
      aiExplanationsEnabled: false,
      geminiApiKey: '',
    });
  });

  it('normalizes partial and out-of-range settings', () => {
    expect(
      normalizeSettings({
        billingProjectId: '  my-project  ',
        datasetName: ' billing_export ',
        summaryTableName: ' daily_summary ',
        cacheMinutes: -5,
        monthlyAlertThreshold: 150,
        aiExplanationsEnabled: true,
        geminiApiKey: '  AIzaTestKey  ',
      }),
    ).toEqual({
      billingProjectId: 'my-project',
      datasetName: 'billing_export',
      summaryTableName: 'daily_summary',
      cacheMinutes: 60,
      monthlyAlertThreshold: 150,
      aiExplanationsEnabled: true,
      geminiApiKey: 'AIzaTestKey',
    });
  });
});
