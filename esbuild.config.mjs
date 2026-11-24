import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(rootDir, 'src');
const distDir = resolve(rootDir, 'dist');

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
  ['manifest.json', 'manifest.json'],
  ['sidepanel/sidepanel.html', 'sidepanel.html'],
  ['sidepanel/sidepanel.css', 'sidepanel.css'],
  ['options/options.html', 'options.html'],
  ['options/options.css', 'options.css'],
  ['icons', 'icons'],
];

for (const [from, to] of staticFiles) {
  cpSync(resolve(srcDir, from), resolve(distDir, to), { recursive: true });
}
