// Integration checks against the actual bundle in jsdom. Canvas is stubbed here;
// real pixel/download/layout checks belong to browser-qa.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const { JSDOM } = await import(process.env.JSDOM_MODULE || 'jsdom');
const bundle = readFileSync(new URL('../dist/frontend.js', import.meta.url), 'utf8').replace(/export \{\s*setup\s*\};\s*$/, 'window.setup = setup;');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fixture(layout = 'minimal') {
  const dom = new JSDOM('<!doctype html><html><head></head><body><header>바깥</header><main></main></body></html>', { url: 'http://qa.test', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window: w } = dom; const d = w.document; const downloads = [], paints = [], decorators = new Map();
  const canvas = new Proxy({ measureText: text => ({ width: text.length * 9 }), createPattern: () => ({}), fillText: (...args) => paints.push(args) }, { get: (o, key) => o[key] ?? (() => {}) });
  w.HTMLCanvasElement.prototype.getContext = () => canvas;
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AA==';
  w.HTMLCanvasElement.prototype.toBlob = cb => cb(new w.Blob(['test'], { type: 'image/png' }));
  w.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
  w.URL.createObjectURL = () => 'blob:qa'; w.URL.revokeObjectURL = () => {};
  d.fonts = Object.assign(new Set(), { load: async () => [], ready: Promise.resolve() });
  let current = 'a';
  const ctx = {
    getActiveChat: () => ({ chatId: current, characterId: 'c' }),
    chats: { listForCharacter: async () => [{ id: 'a', name: '첫 방' }, { id: 'b', name: '둘째 방' }] },
    onTeardown() {},
    dom: { listMessageElements: () => [...d.querySelectorAll('article')].map(element => ({ element, messageId: element.dataset.id })) },
    ui: { registerDomDecorator(spec) { decorators.set(spec.mount, spec); return () => decorators.delete(spec.mount); } },
  };
  function render(next = layout, id = 'm1') {
    layout = next;
    d.querySelector('main').innerHTML = `<article data-id="${id}"><div><div class="name">이름 제외</div><div data-component="MessageContent"><p>첫 문장입니다. “둘째 문장입니다!”</p><p>새 문단입니다.</p><button>더 보기 제외</button></div><span data-spindle-mount="message_footer"></span></div><div ${layout === 'bubble' ? 'data-component="BubbleActions"' : ''}><button>수정</button><button>삭제</button><button>복사</button>${layout === 'bubble' ? '<span data-spindle-mount="message_actions"></span>' : ''}</div></article>`;
    const slot = d.querySelector('[data-spindle-mount="message_actions"]');
    if (slot) decorators.get('message_actions')?.render(slot, { scope: `message:${id}:actions` });
  }
  render(); vm.runInContext(bundle, dom.getInternalVMContext()); const dispose = w.setup(ctx);
  if (layout === 'bubble') render();
  await delay(140);
  const button = label => [...d.querySelectorAll('button')].find(b => b.textContent === label);
  async function open() { d.querySelector('.lv-excerpt-action').click(); await delay(0); }
  return { dom, w, d, ctx, downloads, paints, button, open, render, switchChat: () => { current = 'b'; }, dispose };
}
async function withFixture(fn, layout) {
  const f = await fixture(layout);
  try { await fn(f); } finally { f.dispose(); f.w.close(); }
}
test('minimal action row opens full body, excluding metadata/buttons; tap picker exports without dragging', () => withFixture(async f => {
  await f.open(); assert.equal(f.d.querySelector('.bs-card-title').textContent, '첫 방');
  assert.equal(f.d.querySelector('.bs-card-author').textContent, 'LUMIVERSE');
  assert.equal(f.d.querySelector('.bs-card-text').textContent, '첫 문장입니다. “둘째 문장입니다!”\n\n새 문단입니다.');
  f.button('선택 해제').click(); assert.equal(f.button('선택 범위 적용').disabled, true);
  f.d.querySelector('.lv-excerpt-pieces button').click(); f.button('선택 범위 적용').click();
  assert.equal(f.d.querySelector('.bs-card-text').textContent, '첫 문장입니다.');
  f.button('PNG 저장').click(); await delay(10); assert.equal(f.downloads.length, 1); assert.ok(f.paints.length > 0);
}));
test('excerpt omits hidden HTML subtrees and keeps visible block spacing', () => withFixture(async f => {
  const body = f.d.querySelector('[data-component="MessageContent"]');
  const style = f.d.createElement('style');
  style.textContent = 'article .popup-card { display: none; } article .concealed { visibility: hidden; } article .visible-block { display: block; }';
  f.d.head.append(style);
  body.innerHTML = '<p>여름 기온<span style="display:none">숨긴 카드<span>숨긴 자식</span></span>입니다.</p>'
    + '<div class="popup-card"><span>스타일시트 숨김</span></div>'
    + '<div class="concealed"><span style="visibility:visible">숨긴 부모의 자식</span></div>'
    + '<div hidden style="display:block">hidden 속성</div><div aria-hidden="true">접근성 숨김</div>'
    + '<template>템플릿</template><script type="text/plain">스크립트</script><style>.unused { color: red; }</style>'
    + '다음 줄<span class="visible-block">보이는 블록</span>끝<br>새 줄'
    + '<p aria-hidden="false">마지막 문단.</p>';
  const before = body.innerHTML;
  await f.open();
  assert.equal(f.d.querySelector('.bs-card-text').textContent,
    '여름 기온입니다.\n\n다음 줄\n\n보이는 블록\n\n끝\n새 줄\n\n마지막 문단.');
  assert.equal(body.innerHTML, before);
}));
test('message collection rejects a hidden body or hidden ancestor', async () => {
  const { messageText } = await import('../src/adapter.js');
  await withFixture(async f => {
    const article = f.d.querySelector('article');
    const body = f.d.querySelector('[data-component="MessageContent"]');
    for (const element of [body, article, article.parentElement]) {
      for (const css of ['display:none', 'visibility:hidden']) {
        element.style.cssText = css;
        assert.equal(messageText(article), '');
        element.removeAttribute('style');
      }
      for (const [name, value] of [['hidden', ''], ['aria-hidden', 'true']]) {
        element.setAttribute(name, value);
        assert.equal(messageText(article), '');
        element.removeAttribute(name);
      }
    }
  });
});
test('HTML island reads visible shadow text once and excludes the unslotted duplicate', () => withFixture(async f => {
  const body = f.d.querySelector('[data-component="MessageContent"]');
  body.innerHTML = '<div class="_htmlIsland"></div>';
  const host = body.firstElementChild;
  const markup = '<span>첫 문장<span class="popup-card">숨긴 카드</span>입니다.</span>';
  host.innerHTML = markup;
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style>.popup-card { display: none; }</style>' + markup;
  const computedStyle = f.w.getComputedStyle.bind(f.w);
  // jsdom does not apply shadow styles or report empty styles for unslotted nodes.
  // Model those browser results here; visibility.test.mjs checks native shadow CSS.
  f.w.getComputedStyle = element => {
    if (host.contains(element) && element !== host) return { display: '', visibility: '' };
    if (element.getRootNode() === shadow && element.matches('.popup-card')) {
      return { display: 'none', visibility: 'visible' };
    }
    return computedStyle(element);
  };
  await f.open();
  assert.equal(f.d.querySelector('.bs-card-text').textContent, '첫 문장입니다.');
}));
test('shadow slots include assigned text or fallback once, with hidden slot subtrees excluded', () => withFixture(async f => {
  const body = f.d.querySelector('[data-component="MessageContent"]');
  body.innerHTML = '<div></div>';
  const host = body.firstElementChild;
  host.innerHTML = '본문<span slot="detail"> 설명</span><span slot="unused">미할당</span><span slot="hidden">숨긴 할당</span>';
  host.attachShadow({ mode: 'open' }).innerHTML = '<slot>대체 본문</slot><slot name="detail">대체 설명</slot>'
    + '<slot name="empty"> 끝</slot><slot name="hidden" style="display:none"></slot>';
  await f.open();
  assert.equal(f.d.querySelector('.bs-card-text').textContent, '본문 설명 끝');
}));
test('message collection rejects unslotted bodies and follows slot and shadow host ancestors', async () => {
  const { messageText } = await import('../src/adapter.js');
  const dom = new JSDOM('<div id="host"><article><div data-component="MessageContent">본문</div></article></div>');
  try {
    const host = dom.window.document.querySelector('#host');
    const article = host.firstElementChild;
    const shadow = host.attachShadow({ mode: 'open' });
    assert.equal(messageText(article), '');
    shadow.innerHTML = '<slot style="display:none"></slot>';
    assert.equal(messageText(article), '');
    // Replace the slot: jsdom caches computed styles after shadow attribute edits.
    shadow.innerHTML = '<slot></slot>';
    assert.equal(messageText(article), '본문');
    shadow.replaceChildren(article);
    host.style.display = 'none';
    assert.equal(messageText(article), '');
    host.removeAttribute('style');
    assert.equal(messageText(article), '본문');
  } finally { dom.window.close(); }
});
test('bubble decorator lifecycle, remount and virtualized id updates avoid duplicate buttons', () => withFixture(async f => {
  assert.equal(f.d.querySelectorAll('.lv-excerpt-action').length, 1); f.render('bubble', 'm2'); await delay(150);
  assert.equal(f.d.querySelectorAll('.lv-excerpt-action').length, 1); await f.open(); assert.ok(f.d.querySelector('.bs-overlay'));
}, 'bubble'));
test('paragraph selection, restore and preview drag cropping use original renderer', () => withFixture(async f => {
  await f.open(); const mode = f.d.querySelector('[aria-label="발췌 단위"]'); mode.value = 'paragraph'; mode.dispatchEvent(new f.w.Event('change'));
  f.button('선택 해제').click(); f.d.querySelectorAll('.lv-excerpt-pieces button')[1].click(); f.button('선택 범위 적용').click();
  assert.equal(f.d.querySelector('.bs-card-text').textContent, '새 문단입니다.'); f.button('본문 전체 복원').click();
  const node = f.d.querySelector('.bs-card-text').firstChild; const range = f.d.createRange(); range.setStart(node, 0); range.setEnd(node, 9);
  f.w.getSelection().removeAllRanges(); f.w.getSelection().addRange(range); f.button('드래그한 부분만 남기기').click();
  assert.equal(f.d.querySelector('.bs-card-text').textContent, '첫 문장입니다. ');
}));
test('Escape, floating X, browser back and teardown close and restore scrolling', () => withFixture(async f => {
  await f.open(); assert.equal(f.d.body.style.overflow, 'hidden');
  f.d.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); assert.equal(f.d.querySelector('.bs-overlay'), null); await delay(30);
  await f.open(); f.d.querySelector('#excerpt-overlay-guard').shadowRoot.querySelector('button').click(); await delay(30);
  assert.equal(f.d.querySelector('.bs-overlay'), null);
  await f.open(); f.w.history.back(); await delay(60); assert.equal(f.d.querySelector('.bs-overlay'), null);
  await f.open(); f.dispose(); assert.equal(f.d.querySelectorAll('.bs-overlay,.bs-fab,.lv-excerpt-action,#excerpt-overlay-guard').length, 0); assert.equal(f.d.body.style.overflow, '');
}));
test('host context menu and touch events are not prevented', () => withFixture(async f => {
  const body = f.d.querySelector('[data-component="MessageContent"]');
  for (const type of ['contextmenu', 'touchstart', 'touchend']) assert.equal(body.dispatchEvent(new f.w.Event(type, { bubbles: true, cancelable: true })), true);
}));
test('chat switch uses the new title and device author survives reopening', () => withFixture(async f => {
  await f.open(); const author = f.d.querySelector('input[placeholder="작가"]'); author.value = '우리 작가'; author.dispatchEvent(new f.w.Event('input'));
  f.button('닫기').click(); await delay(30); f.switchChat(); await f.open();
  assert.equal(f.d.querySelector('.bs-card-title').textContent, '둘째 방'); assert.equal(f.d.querySelector('.bs-card-author').textContent, '우리 작가');
}));
test('all sixteen texture/pattern combinations, solid color and card dimensions reach original canvas export', () => withFixture(async f => {
  await f.open();
  for (const texture of ['화이트','다크','크림','크라프트']) for (const pattern of ['종이 질감','줄노트','모눈','없음']) {
    f.button(texture).click(); f.button(pattern).click(); f.button('PNG 저장').click(); await delay(0);
  }
  assert.equal(f.downloads.length, 16);
  const color = [...f.d.querySelectorAll('.bs-row')].find(row => row.querySelector('label')?.textContent === '단색').querySelector('input');
  color.value = '#123456'; color.dispatchEvent(new f.w.Event('input')); assert.equal(f.d.querySelector('.bs-card').style.backgroundColor, 'rgb(18, 52, 86)');
  f.button('높이 직접').click(); f.button('가운데').click();
  assert.equal(f.d.querySelector('.bs-card').style.minHeight, '640px');
}));
test('preview marks follow real replacement controls and dialogue color is rendered', () => withFixture(async f => {
  await f.open();
  const selectText = () => {
    const text = f.d.querySelector('.bs-card-text'); const walker = f.d.createTreeWalker(text, f.w.NodeFilter.SHOW_TEXT);
    const node = walker.nextNode(); const range = f.d.createRange(); range.setStart(node, 0); range.setEnd(node, Math.min(2, node.length));
    f.w.getSelection().removeAllRanges(); f.w.getSelection().addRange(range);
  };
  selectText(); f.d.querySelector('[title="형광펜 (노랑)"]').click(); assert.ok(f.d.querySelector('.bs-mark-hl'));
  f.button('+ 치환 규칙 추가').click();
  const find = f.d.querySelector('[placeholder="찾기"]'), replace = f.d.querySelector('[placeholder="바꾸기"]');
  find.value = '첫'; replace.value = '새로운'; find.dispatchEvent(new f.w.Event('input')); replace.dispatchEvent(new f.w.Event('input')); await delay(280);
  assert.ok(f.d.querySelector('.bs-mark-hl').textContent.includes('새로운'));
  selectText(); f.button('밑줄').click(); f.d.querySelector('[title="밑줄 (노랑)"]').click(); assert.ok(f.d.querySelector('.bs-mark-ul'));
  selectText(); f.d.querySelector('[title="검열 (검은 마크)"]').click(); assert.ok(f.d.querySelector('.bs-mark-censor'));
  selectText(); f.button('지움').click(); assert.equal(f.d.querySelector('.bs-mark-censor'), null);
  const dialogue = f.d.querySelector('[title="대사 색상 켜기/끄기"]'); dialogue.checked = true; dialogue.dispatchEvent(new f.w.Event('change'));
  assert.ok([...f.d.querySelectorAll('.bs-card-text span')].some(span => span.textContent.includes('둘째') && span.style.color === 'rgb(159, 47, 45)'));

}));
test('device image FileReader path reaches canvas without uploading', () => withFixture(async f => {
  let drawn = false;
  const context = f.d.createElement('canvas').getContext('2d'); context.drawImage = () => { drawn = true; };
  f.w.Image = class { width = 64; height = 64; set src(value) { this._src = value; setTimeout(() => this.onload?.(), 0); } get src() { return this._src; } };
  await f.open(); const file = new f.w.File(['image fixture'], 'local.png', { type: 'image/png' });
  const input = f.d.querySelector('input[type=file]'); Object.defineProperty(input, 'files', { value: [file] }); input.dispatchEvent(new f.w.Event('change'));
  await delay(30); assert.ok(f.d.querySelector('.bs-card').style.backgroundImage.includes('data:image/png'));
  f.button('PNG 저장').click(); await delay(10); assert.equal(drawn, true); assert.equal(f.downloads.length, 1);
}));
test('selection adapter accepts one body and rejects metadata, buttons and cross-message ranges', async () => {
  const { isMessageRange } = await import('../src/adapter.js');
  await withFixture(async f => {
    const body = f.d.querySelector('[data-component="MessageContent"]'); const range = f.d.createRange();
    range.selectNodeContents(body.querySelector('p')); assert.equal(isMessageRange(f.ctx, range), true);
    range.selectNodeContents(f.d.querySelector('.name')); assert.equal(isMessageRange(f.ctx, range), false);
    range.selectNodeContents(body); assert.equal(isMessageRange(f.ctx, range), false); // includes a host control
    const clone = f.d.querySelector('article').cloneNode(true); clone.dataset.id = 'm2'; f.d.querySelector('main').append(clone);
    range.setStart(body.querySelector('p').firstChild, 0); range.setEnd(clone.querySelector('p').firstChild, 2);
    assert.equal(isMessageRange(f.ctx, range), false);
  });
});
