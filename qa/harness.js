import { setup } from '/dist/frontend.js';
const teardown = [], mounts = new Map();
let layout = 'minimal', active = { chatId: 'chat-a', characterId: 'char-a' };
const ctx = {
  getActiveChat: () => active,
  chats: { listForCharacter: async () => [{ id: 'chat-a', name: '우리 이야기' }, { id: 'chat-b', name: '다른 이야기' }] },
  onTeardown: fn => teardown.push(fn),
  dom: { listMessageElements: () => [...document.querySelectorAll('article')].map(element => ({ messageId: element.dataset.id, element })) },
  ui: { registerDomDecorator(spec) {
    mounts.set(spec.mount, spec);
    return () => { mounts.delete(spec.mount); };
  } },
};
const text = '첫 문장입니다. “다음 대사입니다!”\n\n마지막 문단입니다. 😀 함께 갑니다.';
function render(nextLayout = layout) {
  layout = nextLayout;
  document.querySelector('#messages').innerHTML = `<article data-id="m1"><div><div class="host-name">이름과 시간은 제외</div><div data-component="MessageContent"><div><p>첫 문장입니다. “다음 대사입니다!”</p><p>마지막 문단입니다. 😀 함께 갑니다.</p></div><button>더 보기 제외</button></div><span data-spindle-mount="message_footer"></span></div><div ${layout === 'bubble' ? 'data-component="BubbleActions"' : ''} class="host-actions"><button>수정</button><button>삭제</button><button>복사</button>${layout === 'bubble' ? '<span data-spindle-mount="message_actions"></span>' : ''}</div></article>`;
  const slot = document.querySelector('[data-spindle-mount="message_actions"]');
  if (slot) mounts.get('message_actions')?.render(slot, { scope: 'message:m1:actions' });
}
render();
let dispose = setup(ctx);
window.qa = {
  ready: true, text,
  render,
  setTheme(theme) {
    const style = document.documentElement.style;
    style.setProperty('--lumiverse-bg', theme === 'light' ? '#fffaf5' : '#282033');
    style.setProperty('--lumiverse-text', theme === 'light' ? '#25202c' : '#f7efff');
    style.setProperty('--lumiverse-primary', theme === 'light' ? '#7247ad' : '#bea0ed');
    style.setProperty('--lumiverse-bg-deep-080', '#ff0000'); // must never be used
  },
  switchChat() { active = { chatId: 'chat-b', characterId: 'char-a' }; render(); },
  dispose() { dispose(); },
  reload() { dispose(); dispose = setup(ctx); render(); },
};
