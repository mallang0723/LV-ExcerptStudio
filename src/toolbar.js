// Copied findActionRow and adapted lifecycle from lv-translator 0.2.1 src/toolbar.ts.
const BUBBLE_ROW = '[data-component="BubbleActions"]';
// Match lv-translator src/host-emu/dom-bridge.ts:33 and 573–580:
// a 16px currentColor SVG inside a button with the neighboring host button's classes.
const QUOTE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote" aria-hidden="true" focusable="false"><path d="M10 3H7a4 4 0 0 0-4 4v10h7V9H3m18-6h-3a4 4 0 0 0-4 4v10h7V9h-7"/></svg>';
export function findActionRow(messageEl) {
  const footer = messageEl.querySelector('[data-spindle-mount="message_footer"]');
  const next = footer?.parentElement?.nextElementSibling;
  if (!next) return null;
  if (next.matches(BUBBLE_ROW)) return next;
  const candidates = [next, next.firstElementChild];
  for (const c of candidates) {
    if (!(c instanceof HTMLElement)) continue;
    const buttons = Array.from(c.children).filter((x) => x.tagName === 'BUTTON');
    if (buttons.length >= 3) return c;
  }
  return null;
}

export function mountToolbars(ctx, onOpen) {
  const slots = new Map();
  let unregister = null, timer = null, destroyed = false;
  const attach = (slot, id, own) => {
    slot.dataset.excerptToolbar = id;
    slot.style.display = 'contents';
    const button = document.createElement('button');
    const row = slot.closest(BUBBLE_ROW) || slot.parentElement;
    const ref = row?.querySelector(':scope > button:not(.lv-excerpt-action)');
    button.type = 'button'; button.className = ref?.className || 'lv-excerpt-action-fallback';
    button.classList.add('lv-excerpt-action');
    button.innerHTML = QUOTE_SVG; button.title = '이 메시지 발췌';
    button.setAttribute('aria-label', '이 메시지 발췌');
    button.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation(); onOpen(id);
    });
    slots.set(slot, { id, own }); slot.replaceChildren(button);
  };
  if (typeof ctx.ui?.registerDomDecorator === 'function') {
    const scopeId = scope => /^message:(.+):actions$/.exec(scope)?.[1];
    try {
      const handle = ctx.ui.registerDomDecorator({
        mount: 'message_actions',
        render(root, context) {
          const id = scopeId(context.scope);
          if (id) attach(root, id, false);
          return () => { slots.delete(root); root.replaceChildren(); };
        },
        update(root, context) {
          const id = scopeId(context.scope);
          if (id && (slots.get(root)?.id !== id || !root.firstChild)) attach(root, id, false);
        },
      });
      unregister = typeof handle === 'function' ? handle : () => handle?.destroy?.();
    } catch { /* old host: use action-row fallback */ }
  }
  function scan() {
    if (destroyed) return;
    for (const [slot, meta] of slots) if (meta.own && !slot.isConnected) slots.delete(slot);
    for (const { messageId, element } of ctx.dom.listMessageElements()) {
      const existing = element.querySelector('[data-excerpt-toolbar]');
      if (existing) {
        if (slots.get(existing)?.id !== messageId) attach(existing, messageId, true);
        continue;
      }
      const row = findActionRow(element);
      if (!row || (unregister && row.matches(BUBBLE_ROW))) continue;
      const slot = document.createElement('span'); row.appendChild(slot); attach(slot, messageId, true);
    }
  }
  const observer = new MutationObserver(() => {
    if (timer || destroyed) return;
    timer = setTimeout(() => { timer = null; scan(); }, 120);
  });
  observer.observe(document.body, { childList: true, subtree: true }); scan();
  return { destroy() {
    destroyed = true; clearTimeout(timer); observer.disconnect(); unregister?.();
    for (const [slot, meta] of slots) { if (meta.own) slot.remove(); else slot.replaceChildren(); }
    slots.clear();
  } };
}
