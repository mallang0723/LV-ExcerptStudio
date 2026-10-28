// Generation + Bun bundle pattern reused from both referenced Marinara ports.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verify } from './verify-original.mjs';
import { patchOriginal } from '../src/patch.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const bad = verify();
if (bad.length) throw Error(bad.join('\n'));
writeFileSync('src/original.generated.js', patchOriginal(readFileSync('vendor/original/extension.js', 'utf8')));
writeFileSync('src/styles.generated.js', `export const CSS = ${JSON.stringify(readFileSync('vendor/original/extension.css', 'utf8') + '\n' + readFileSync('src/overrides.css', 'utf8'))};\n`);
mkdirSync('dist', { recursive: true });
const result = spawnSync(process.env.BUN_BIN || 'bun', ['build', 'src/frontend.js', '--outfile', 'dist/frontend.js', '--target', 'browser', '--format', 'esm'], { stdio: 'inherit' });
if (result.error || result.status !== 0) throw result.error || Error('Bun build failed');
