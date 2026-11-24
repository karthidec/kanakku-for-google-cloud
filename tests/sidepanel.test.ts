import { describe, expect, it, vi } from 'vitest';
import { enableActionClickSidePanel } from '../src/background/panel';
import { EMPTY_STATE_MESSAGE } from '../src/sidepanel/messages';

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
