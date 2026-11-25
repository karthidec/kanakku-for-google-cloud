import type {
  AuthStatusResult,
  ConnectionResult,
  ExtensionMessage,
} from '../shared/messages';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type ExtensionSettings,
} from '../shared/settings';

function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing expected element: #${id}`);
  }
  return el as T;
}

function readFormSettings(): ExtensionSettings {
  const projectInput = getElement<HTMLInputElement>('billing-project-id');
  const datasetInput = getElement<HTMLInputElement>('dataset-name');
  const tableInput = getElement<HTMLInputElement>('summary-table-name');
  const cacheInput = getElement<HTMLInputElement>('cache-minutes');
  const alertInput = getElement<HTMLInputElement>('monthly-alert-threshold');
  const aiInput = getElement<HTMLInputElement>('ai-explanations');
  const geminiInput = getElement<HTMLInputElement>('gemini-api-key');

  return {
    billingProjectId: projectInput.value,
    datasetName: datasetInput.value,
    summaryTableName: tableInput.value,
    cacheMinutes: Number(cacheInput.value),
    monthlyAlertThreshold: Number(alertInput.value),
    aiExplanationsEnabled: aiInput.checked,
    geminiApiKey: geminiInput.value,
  };
}

function writeFormSettings(settings: ExtensionSettings): void {
  getElement<HTMLInputElement>('billing-project-id').value =
    settings.billingProjectId;
  getElement<HTMLInputElement>('dataset-name').value = settings.datasetName;
  getElement<HTMLInputElement>('summary-table-name').value =
    settings.summaryTableName;
  getElement<HTMLInputElement>('cache-minutes').value = String(
    settings.cacheMinutes,
  );
  getElement<HTMLInputElement>('monthly-alert-threshold').value = String(
    settings.monthlyAlertThreshold,
  );
  getElement<HTMLInputElement>('ai-explanations').checked =
    settings.aiExplanationsEnabled;
  getElement<HTMLInputElement>('gemini-api-key').value = settings.geminiApiKey;
}

function showStatusBanner(ok: boolean, message: string): void {
  const banner = getElement<HTMLParagraphElement>('connection-status');
  banner.textContent = message;
  banner.classList.remove('hidden', 'ok', 'error');
  banner.classList.add(ok ? 'ok' : 'error');
}

function updateAuthStatus(status: AuthStatusResult): void {
  const label = getElement<HTMLSpanElement>('auth-status');
  label.textContent = status.message;
}

export async function initOptionsPage(): Promise<void> {
  const settings = await loadSettings();
  writeFormSettings(settings);

  const authStatus = await chrome.runtime.sendMessage<
    ExtensionMessage,
    AuthStatusResult
  >({ type: 'GET_AUTH_STATUS' });
  updateAuthStatus(authStatus);

  getElement<HTMLButtonElement>('sign-in-btn').addEventListener('click', () => {
    void (async () => {
      const result = await chrome.runtime.sendMessage<
        ExtensionMessage,
        AuthStatusResult
      >({ type: 'SIGN_IN' });
      updateAuthStatus(result);
    })();
  });

  getElement<HTMLFormElement>('settings-form').addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      void (async () => {
        const saved = await saveSettings(readFormSettings());
        writeFormSettings(saved);
        showStatusBanner(true, 'Settings saved.');
      })();
    },
  );

  getElement<HTMLButtonElement>('test-btn').addEventListener('click', () => {
    const testBtn = getElement<HTMLButtonElement>('test-btn');
    testBtn.disabled = true;
    showStatusBanner(true, 'Testing BigQuery connection…');

    void chrome.runtime
      .sendMessage<ExtensionMessage, ConnectionResult>({
        type: 'TEST_CONNECTION',
        settings: readFormSettings(),
      })
      .then((result) => showStatusBanner(result.ok, result.message))
      .catch(() =>
        showStatusBanner(
          false,
          'Could not test the connection. Please try again.',
        ),
      )
      .finally(() => {
        testBtn.disabled = false;
      });
  });

  getElement<HTMLButtonElement>('clear-btn').addEventListener('click', () => {
    void (async () => {
      const result = await chrome.runtime.sendMessage<
        ExtensionMessage,
        ConnectionResult
      >({ type: 'CLEAR_ALL_DATA' });
      writeFormSettings(DEFAULT_SETTINGS);
      updateAuthStatus({ signedIn: false, message: 'Not signed in.' });
      showStatusBanner(result.ok, result.message);
    })();
  });
}

if (typeof document !== 'undefined') {
  void initOptionsPage();
}
