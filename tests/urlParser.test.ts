import { describe, expect, it } from 'vitest';
import { parseConsoleUrl } from '../src/core/url';
import {
  CLOUD_RUN_FIXTURES,
  CLOUD_STORAGE_FIXTURES,
  COMPUTE_ENGINE_FIXTURES,
  UNSUPPORTED_FIXTURES,
} from './fixtures/consoleUrls';

describe('parseConsoleUrl', () => {
  it.each(CLOUD_RUN_FIXTURES)('Cloud Run: $name', ({ url, expected }) => {
    expect(parseConsoleUrl(url)).toEqual(expected);
  });

  it.each(COMPUTE_ENGINE_FIXTURES)(
    'Compute Engine: $name',
    ({ url, expected }) => {
      expect(parseConsoleUrl(url)).toEqual(expected);
    },
  );

  it.each(CLOUD_STORAGE_FIXTURES)(
    'Cloud Storage: $name',
    ({ url, expected }) => {
      expect(parseConsoleUrl(url)).toEqual(expected);
    },
  );

  it.each(UNSUPPORTED_FIXTURES)('Unsupported: $name', ({ url, expected }) => {
    expect(parseConsoleUrl(url)).toEqual(expected);
  });
});
