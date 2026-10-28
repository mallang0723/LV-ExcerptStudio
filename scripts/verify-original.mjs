// Adapted from marinara-anon-lumi-work/publish/scripts/verify-original.mjs.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
export const PINS = {
  'vendor/original/extension.js': '740dd9399722574535a80ebbed5555664be4511f41ea2967e9c87a76a708e51b',
  'vendor/original/extension.css': '01e46054a42e6322d38e190dc35bb4b8e5fbb0ccb69e776b72eb945c598e9d85',
};
export function verify(root = fileURLToPath(new URL('../', import.meta.url))) {
  return Object.entries(PINS).flatMap(([file, pin]) => {
    try {
      const hash = createHash('sha256').update(readFileSync(`${root}/${file}`)).digest('hex');
      return hash === pin ? [] : [`${file}: SHA-256 ${hash} != ${pin}`];
    } catch { return [`${file}: missing`]; }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = verify();
  console.log(JSON.stringify({ ok: !problems.length, problems }));
  process.exitCode = problems.length ? 1 : 0;
}
