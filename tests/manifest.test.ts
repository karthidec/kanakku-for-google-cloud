import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface ManifestV3 {
  manifest_version: number;
  name: string;
  permissions: string[];
  host_permissions?: string[];
  background: {
    service_worker: string;
    type?: string;
  };
  side_panel?: {
    default_path: string;
  };
  options_ui?: {
    page: string;
  };
}

describe('manifest.json', () => {
  const manifestPath = resolve(process.cwd(), 'src/manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ManifestV3;

  it('uses Manifest V3 with minimal permissions', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('Kanakku for Google Cloud');
    expect(manifest.permissions).toEqual(['sidePanel']);
    expect(manifest.host_permissions).toEqual([
      'https://console.cloud.google.com/*',
    ]);
  });

  it('configures service worker, side panel, and options page', () => {
    expect(manifest.background.service_worker).toBe('background.js');
    expect(manifest.side_panel?.default_path).toBe('sidepanel.html');
    expect(manifest.options_ui?.page).toBe('options.html');
  });
});
