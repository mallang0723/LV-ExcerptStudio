import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { patchOriginal, replaceAnchor } from '../src/patch.mjs';
import { verify } from '../scripts/verify-original.mjs';
import { createShim } from '../src/shim.js';
import { splitExcerpt } from '../src/range-picker.js';
const source = readFileSync(new URL('../vendor/original/extension.js', import.meta.url), 'utf8');
function original({ brokenStorage = false } = {}) {
  let api; const downloads = [], storage = new Map();
  const ctx = new Proxy({ measureText: text => ({ width: text.length * 9 }), createPattern: () => 'pattern' }, { get: (o, key) => o[key] ?? (() => {}) });
  const element = tag => ({ style: {}, appendChild() {}, setAttribute() {}, addEventListener() {}, removeEventListener() {}, remove() {},
    getContext: () => ctx, toBlob: cb => cb(new Blob(['png'])), click() { if (tag === 'a') downloads.push(this.download); } });
  const doc = { querySelector: () => null, body: element('body'), createElement: element, createTextNode: () => ({}), addEventListener() {}, removeEventListener() {}, fonts: { load: async () => [], ready: Promise.resolve() } };
  const localStorage = { getItem(key) { if (brokenStorage) throw Error('denied'); return storage.get(key); }, setItem(key, value) { if (brokenStorage) throw Error('denied'); storage.set(key, value); } };
  const globals = { document: doc, window: element('window'), Blob, console, getComputedStyle: () => ({ fontFamily: 'sans-serif' }),
    setTimeout: () => 0, clearTimeout() {}, URL: { createObjectURL: () => 'blob:qa', revokeObjectURL() {} },
    Date: class extends Date { constructor() { super(2026, 0, 2, 3, 4, 5); } },
    marinara: { onCleanup() {} }, LV: { ready() {}, probe(a) { api = a; } }, localStorage, fetch() { throw Error('unexpected network'); } };
  runInNewContext(patchOriginal(source, { probe: true }).replace('export function', 'function') + '\nrunOriginal(marinara, LV, fetch, localStorage);', globals);
  return { api, downloads, storage };
}
const plain = v => JSON.parse(JSON.stringify(v));
test('both vendor hashes match pinned originals', () => assert.deepEqual(verify(), []));
test('patch anchors fail closed on missing or duplicated matches', () => {
  assert.throws(() => replaceAnchor('a a', 'a', 'b'));
  assert.throws(() => replaceAnchor('c', 'a', 'b'));
  assert.throws(() => patchOriginal(source.replace('"MARINARA"', '"CHANGED"')));
});
test('UTF-16 replacement moves marks after emoji and covers expanded words', () => {
  const { api: a } = original(); const text = '😀 민수와 민수';
  const before = a.annotateReplaced(text, []), after = a.annotateReplaced(text, [{ find: '민수', replace: '주인공' }]);
  assert.equal(after.map(c => c.ch).join(''), '😀 주인공와 주인공');
  assert.deepEqual(plain(a.remapMarks([{ start: 3, end: 5, type: 'y' }], before, after)), [{ start: 3, end: 6, type: 'y' }]);
});
test('sequential replacements and deletion keep/drop original marks', () => {
  const { api: a } = original(); const before = a.annotateReplaced('a fox z', []);
  const after = a.annotateReplaced('a fox z', [{ find: 'fox', replace: 'cat' }, { find: 'cat', replace: '' }]);
  assert.equal(after.map(c => c.ch).join(''), 'a  z');
  assert.deepEqual(plain(a.remapMarks([{ start: 2, end: 5, type: 'censor' }], before, after)), []);
});
test('overlapping highlight, underline, censorship, erasure use original interval logic', () => {
  const { api: a } = original(); a.applyMark(0, 6, 'y'); a.applyMark(2, 4, 'uy'); a.applyMark(3, 5, 'censor'); a.applyMark(0, 1, null);
  assert.deepEqual(plain(a.state.marks), [{ start: 1, end: 2, type: 'y' }, { start: 2, end: 3, type: 'uy' }, { start: 3, end: 5, type: 'censor' }, { start: 5, end: 6, type: 'y' }]);
});
test('dialogue detects straight/curly closed quotes, including emoji, but excludes unclosed quotes', () => {
  const { api: a } = original(); const text = '말 “😀 안녕” 밖 "네" 끝 "미완';
  const marked = [...a.buildDialogueMap(text)].map((v, i) => v ? text[i] : '').join('');
  assert.equal(marked, '“😀 안녕”"네"');
});
test('NBSP tokenization terminates and retains UTF-16 offsets', () => {
  const { api: a } = original(); const tokens = a.tokenizeParagraph('😀\u00a0안녕', 0);
  assert.deepEqual(plain(tokens.map(t => t.index)), [0, 2, 3, 4]);
});
test('original preference storage survives denied access and defaults to LUMIVERSE', () => {
  const { api: a } = original({ brokenStorage: true }); a.loadPrefs(); a.savePrefs(); assert.equal(a.state.authorText, 'LUMIVERSE');
});
test('namespaced preferences preserve per-chat title and common author', () => {
  const { api: a, storage } = original(); Object.assign(a.state, { chatId: 'a', chatName: '방', titleText: '작품', authorText: '작가' }); a.savePrefs();
  const prefs = JSON.parse(storage.get('excerpt-studio-lv-prefs-v1'));
  assert.equal(prefs.titleOverrides.a, '작품'); assert.equal(prefs.authorText, '작가');
  assert.equal(storage.has('bs-studio-prefs-v2'), false);
});
test('actual original PNG export uses Blob download and deterministic Korean filename without secure APIs', async () => {
  const { api: a, downloads } = original(); Object.assign(a.state, { text: '😀\u00a0안녕', showTitle: false, showAuthor: false }); a.state.bg.mode = 'solid'; a.state.bg.pattern = 'none';
  await a.exportPng(); assert.deepEqual(downloads, ['발췌_20260102_030405.png']);
});
test('shim provides active chat, title, registered fonts and denied-storage fallback without globals', async () => {
  const shim = createShim({ getActiveChat: () => ({ chatId: 'a/b', characterId: 'c' }), chats: { listForCharacter: async () => [{ id: 'a/b', name: '우리 방' }] } }, {
    win: { get localStorage() { throw Error('denied'); } }, doc: { fonts: new Set([{ family: '"Test Font"', weight: '400', style: 'normal' }]) },
  });
  assert.equal(shim.storage.getItem('marinara-active-chat-id'), 'a/b'); assert.equal(shim.storage.getItem('prefs'), null); shim.storage.setItem('prefs', 'x');
  assert.equal((await (await shim.fetch('/api/chats/a%2Fb')).json()).name, '우리 방');
  assert.equal((await (await shim.fetch('/api/fonts')).json())[0].family, 'Test Font');
  await assert.rejects(shim.fetch('/api/unknown'));
});
test('sentence/paragraph picker supports Korean and preserves paragraph text', () => {
  assert.deepEqual(splitExcerpt('첫 문장. 다음 문장!'), ['첫 문장.', '다음 문장!']);
  assert.deepEqual(splitExcerpt('첫 줄\n둘째 줄\n\n다음 문단', 'paragraph'), ['첫 줄\n둘째 줄', '다음 문단']);
});
test('frontend-only manifest has no backend or permissions and bundle has no secure API dependency', () => {
  const manifest = JSON.parse(readFileSync(new URL('../spindle.json', import.meta.url)));
  assert.deepEqual(manifest.permissions, []); assert.equal(manifest.entry_backend, undefined);
  const bundle = readFileSync(new URL('../dist/frontend.js', import.meta.url), 'utf8');
  assert.doesNotMatch(bundle, /crypto\.randomUUID|navigator\.clipboard|showSaveFilePicker|eval\(|new Function/);
});
test('character-less chat title uses read-only recent pagination', async () => {
  const offsets = [];
  const shim = createShim({ getActiveChat: () => ({ chatId: 'group', characterId: null }), chats: { listRecent: async ({ offset }) => {
    offsets.push(offset); return { data: [{ id: offset ? 'group' : 'other', name: offset ? '그룹 방' : '다른 방' }], total: 2 };
  } } }, { win: {}, doc: {} });
  assert.equal((await (await shim.fetch('/api/chats/group')).json()).name, '그룹 방');
  assert.deepEqual(offsets, [0, 1]);
});
