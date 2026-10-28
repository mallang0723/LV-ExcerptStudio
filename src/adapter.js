import { mountRangePicker } from './range-picker.js';
const CONTENT = '[data-component="MessageContent"]';
const EXCLUDED = 'button, input, textarea, select, [contenteditable="true"], [data-spindle-ext], [data-spindle-mount], [data-spindle-extension-root]';
export function messageBody(element) { return element?.querySelector(CONTENT) || null; }
export function messageText(element) {
  const body = messageBody(element);
  if (!body) return '';
  // Clone only for reading: the host message is never modified by the shim.
  const clone = body.cloneNode(true);
  clone.querySelectorAll(EXCLUDED + ', script, style').forEach(el => el.remove());
  // innerText on detached nodes loses line breaks; preserve rendered block separators explicitly.
  clone.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
  clone.querySelectorAll('p, div, li, blockquote, pre, h1, h2, h3').forEach(el => el.append('\n\n'));
  return (clone.textContent || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
export function isMessageRange(ctx, range) {
  const elementOf = n => n.nodeType === 1 ? n : n.parentElement;
  const start = elementOf(range.startContainer), end = elementOf(range.endContainer);
  if (!start || !end || start.closest(EXCLUDED) || end.closest(EXCLUDED)) return false;
  return ctx.dom.listMessageElements().some(({ element }) => {
    const body = messageBody(element);
    return body && body.contains(start) && body.contains(end)
      && ![...body.querySelectorAll(EXCLUDED)].some(el => range.intersectsNode(el));
  });
}
export function decorateModal(args) {
  const { overlay } = args;
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '발췌 스튜디오');
  mountRangePicker(args);
  // Original visual labels are not associated with their fields. Add accessible names outside it.
  for (const field of overlay.querySelectorAll('input, select')) {
    if (field.type === 'file') continue;
    const row = field.closest('.bs-row, .bs-check-row, .bs-rule-row');
    const label = field.placeholder || field.title || row?.querySelector('label')?.textContent || '설정';
    if (!field.hasAttribute('aria-label')) field.setAttribute('aria-label', label);
  }
  const close = overlay.querySelector('.bs-header button'); close.setAttribute('aria-label', '스튜디오 닫기');
  close.focus({ preventScroll: true });
}
