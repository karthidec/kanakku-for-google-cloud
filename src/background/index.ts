import { enableActionClickSidePanel } from './panel';

void enableActionClickSidePanel().catch((error: unknown) => {
  console.error('Failed to configure side panel behavior:', error);
});
