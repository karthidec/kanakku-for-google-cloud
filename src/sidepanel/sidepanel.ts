import { EMPTY_STATE_MESSAGE } from './messages';

/**
 * Renders the initial empty-state message in the side panel.
 */
export function renderSidePanel(doc: Document = document): void {
  const statusElement = doc.getElementById('status-message');
  if (statusElement) {
    statusElement.textContent = EMPTY_STATE_MESSAGE;
  }
}

if (typeof document !== 'undefined') {
  renderSidePanel();
}
