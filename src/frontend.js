import { runOriginal } from './original.generated.js';
import { CSS } from './styles.generated.js';
import { createShim } from './shim.js';
import { createOverlayGuard } from './overlay-guard.js';
import { mountToolbars } from './toolbar.js';
import { messageText, isMessageRange, decorateModal } from './adapter.js';
export function setup(ctx) {
  const shim = createShim(ctx), guard = createOverlayGuard();
  const style = document.createElement('style'); style.textContent = CSS; document.head.append(style);
  let original, entry, focusBefore, oldOverflow, disposed = false;
  const LV = {
    ready(api) { original = api; },
    isMessageRange: range => isMessageRange(ctx, range),
    onOpen(args) {
      focusBefore = document.activeElement; oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      entry = guard.register({ label: '스튜디오 닫기', close: args.close }); entry.sync(true);
      decorateModal(args);
    },
    onClose() {
      entry?.sync(false); entry = null; document.body.style.overflow = oldOverflow || '';
      if (focusBefore?.isConnected) focusBefore.focus({ preventScroll: true });
    },
  };
  runOriginal(shim.marinara, LV, shim.fetch, shim.storage);
  const toolbar = mountToolbars(ctx, id => {
    const item = ctx.dom.listMessageElements().find(m => m.messageId === id);
    const text = messageText(item?.element);
    if (text) original?.open(text);
  });
  function dispose() {
    if (disposed) return;
    disposed = true; original?.close(); toolbar.destroy(); shim.dispose(); guard.dispose(); style.remove();
  }
  ctx.onTeardown?.(dispose);
  return dispose;
}
