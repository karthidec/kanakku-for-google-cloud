import type { ConnectionResult } from '../core/billing/connection';
import type { SidePanelCostState } from '../core/billing/types';
import type { ExtensionSettings } from './settings';

export interface AuthStatusResult {
  signedIn: boolean;
  message: string;
}

export type ExtensionMessage =
  | { type: 'GET_SIDE_PANEL_STATE'; forceRefresh?: boolean }
  | { type: 'COST_STATE_CHANGED'; state: SidePanelCostState }
  | { type: 'OPEN_OPTIONS' }
  | { type: 'GET_AUTH_STATUS' }
  | { type: 'SIGN_IN' }
  | { type: 'TEST_CONNECTION'; settings: ExtensionSettings }
  | { type: 'CLEAR_ALL_DATA' };

export type { ConnectionResult };
