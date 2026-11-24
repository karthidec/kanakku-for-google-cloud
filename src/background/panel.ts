/**
 * Configures Chrome so clicking the extension toolbar icon opens the side panel.
 */
export async function enableActionClickSidePanel(
  sidePanelApi: typeof chrome.sidePanel | undefined = globalThis.chrome
    ?.sidePanel,
): Promise<void> {
  if (!sidePanelApi) {
    return;
  }

  await sidePanelApi.setPanelBehavior({ openPanelOnActionClick: true });
}
