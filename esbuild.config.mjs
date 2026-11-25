import { build } from 'esbuild';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(rootDir, 'src');
const distDir = resolve(rootDir, 'dist');
const oauthLocalPath = resolve(rootDir, 'oauth.local.json');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

await build({
  entryPoints: {
    background: resolve(srcDir, 'background/index.ts'),
    sidepanel: resolve(srcDir, 'sidepanel/sidepanel.ts'),
    options: resolve(srcDir, 'options/options.ts'),
  },
  outdir: distDir,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['chrome120'],
  sourcemap: false,
  logLevel: 'info',
});

const staticFiles = [
  ['sidepanel/sidepanel.html', 'sidepanel.html'],
  ['sidepanel/sidepanel.css', 'sidepanel.css'],
  ['options/options.html', 'options.html'],
  ['options/options.css', 'options.css'],
  ['icons', 'icons'],
];

for (const [from, to] of staticFiles) {
  cpSync(resolve(srcDir, from), resolve(distDir, to), { recursive: true });
}

const manifest = JSON.parse(
  readFileSync(resolve(srcDir, 'manifest.json'), 'utf8'),
);

if (existsSync(oauthLocalPath)) {
  const localOAuth = JSON.parse(readFileSync(oauthLocalPath, 'utf8'));
  const oauth2 = manifest.oauth2 ?? {};
  if (localOAuth.client_id) {
    oauth2.client_id = localOAuth.client_id;
  }
  manifest.oauth2 = oauth2;
  if (localOAuth.key) {
    manifest.key = localOAuth.key;
  }
}

writeFileSync(
  resolve(distDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
