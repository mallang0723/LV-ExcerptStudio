// Adapter-only range choice. Original replacement/mark/PNG algorithms stay in vendor.
export function splitExcerpt(text, mode = 'sentence') {
  if (mode === 'paragraph') return text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  if (typeof Intl.Segmenter === 'function') {
    return [...new Intl.Segmenter('ko', { granularity: 'sentence' }).segment(text)]
      .map(s => s.segment.trim()).filter(Boolean);
  }
  return (text.match(/[^.!?。！？\n]+[.!?。！？]*[”"']*|[^\n]+/g) || []).map(s => s.trim()).filter(Boolean);
}
export function mountRangePicker({ overlay, text, setExcerpt, cropSelection }) {
  const controls = overlay.querySelector('.bs-controls');
  const section = document.createElement('section'); section.className = 'lv-excerpt-picker';
  const heading = document.createElement('h3'); heading.textContent = '발췌할 범위';
  const hint = document.createElement('p');
  hint.textContent = '문장·문단을 눌러 고른 뒤 적용하세요. 범위를 바꾸면 마크가 지워집니다.';
  const mode = document.createElement('select'); mode.setAttribute('aria-label', '발췌 단위');
  for (const [value, label] of [['sentence', '문장'], ['paragraph', '문단']]) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; mode.append(option);
  }
  const list = document.createElement('div'); list.className = 'lv-excerpt-pieces';
  let parts = [], selected = new Set();
  const button = (label, fn) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); return b;
  };
  function draw() {
    list.replaceChildren(...parts.map((part, i) => {
      const b = button(part, () => { selected.has(i) ? selected.delete(i) : selected.add(i); draw(); });
      b.setAttribute('aria-pressed', String(selected.has(i))); return b;
    }));
    apply.disabled = selected.size === 0;
  }
  const apply = button('선택 범위 적용', () => setExcerpt(parts.filter((_, i) => selected.has(i)).join(mode.value === 'paragraph' ? '\n\n' : ' ')));
  const all = button('전체 선택', () => { selected = new Set(parts.map((_, i) => i)); draw(); });
  const none = button('선택 해제', () => { selected.clear(); draw(); });
  const restore = button('본문 전체 복원', () => { setExcerpt(text); reset(); });
  const crop = button('드래그한 부분만 남기기', cropSelection);
  crop.addEventListener('mousedown', e => e.preventDefault());
  function reset() { parts = splitExcerpt(text, mode.value); selected = new Set(parts.map((_, i) => i)); draw(); }
  mode.addEventListener('change', reset);
  const actions = document.createElement('div'); actions.className = 'lv-excerpt-picker-actions';
  actions.append(all, none, apply, restore, crop);
  section.append(heading, hint, mode, list, actions); controls.prepend(section); reset();
}
