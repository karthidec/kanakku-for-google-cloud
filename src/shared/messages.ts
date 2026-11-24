import type { ParseResult } from '../core/url/types';

export type ExtensionMessage =
  | { type: 'GET_ACTIVE_RESOURCE' }
  | { type: 'RESOURCE_CHANGED'; resource: ParseResult };
