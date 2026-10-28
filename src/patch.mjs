// Same checked-anchor strategy as marinara-anon-lumi-work/publish/src/anon/patch.mjs
// and memoryVault-lumi-publish/src/text-map.json. Never edits vendor files.
export function replaceAnchor(source, from, to, count = 1) {
  const actual = source.split(from).length - 1;
  if (actual !== count) throw Error(`Patch expected ${count}, found ${actual}: ${from.slice(0, 100)}`);
  return source.split(from).join(to);
}
export function patchOriginal(source, { probe = false } = {}) {
  const patches = [
    // Original broad CJK range includes surrogate code units: tokenize whole emoji glyphs.
    ['/[ᄀ-ᇿ⺀-〿぀-ヿ㄰-㆏ㇰ-䶿一-鿿ꥠ-꥿가-퟿豈-﫿＀-￯]/;', '/[ᄀ-ᇿ⺀-〿぀-ヿ㄰-㆏ㇰ-䶿一-鿿ꥠ-꥿가-퟿豈-﫿＀-￯]/u;'],
    ['const ch = paragraph[i];', 'const ch = glyphAt(paragraph, i);'],
    ['!CJK_RE.test(paragraph[j])) j += 1;', '!CJK_RE.test(glyphAt(paragraph, j))) j += glyphAt(paragraph, j).length;'],
    ['"bs-studio-prefs-v2"', '"excerpt-studio-lv-prefs-v1"'],
    ['"MARINARA"', '"LUMIVERSE"'],
    ['"MARINARA EXCERPT"', '"LUMIVERSE EXCERPT"'],
    ['"마리나라 설치 폰트"', '"페이지에 등록된 폰트"'],
    ['if (!startEl.closest("[data-message-id]") || !endEl.closest("[data-message-id]")) return null;',
     'if (!LV.isMessageRange(range)) return null;'],
    ['    document.body.appendChild(overlay);', `    document.body.appendChild(overlay);
    LV.onOpen({ overlay, text, close: closeModal, setExcerpt(value) {
      state.baseText = value; state.marks = []; applyRulesWithAnnotation(); renderPreview();
      setStatus("발췌 범위를 바꿨습니다. 마크는 다시 지정하세요.");
    }, cropSelection() {
      const offsets = previewSelectionOffsets();
      if (!offsets) { setStatus("미리보기에서 남길 글자를 드래그하세요."); return; }
      const first = currentAnnotation[offsets.start], last = currentAnnotation[offsets.end - 1];
      if (!first || !last) return;
      state.baseText = state.baseText.slice(first.bs, last.be);
      state.marks = []; applyRulesWithAnnotation(); renderPreview();
      window.getSelection()?.removeAllRanges();
    } });`],
    ['    modalOpen = false;\n    savePrefs();', '    modalOpen = false;\n    LV.onClose();\n    savePrefs();'],
    ['    fetchMarinaraFonts().then(() => {', '    const openedOverlay = overlay;\n    fetchMarinaraFonts().then(() => {'],
    ['      if (!modalOpen) return;', '      if (!modalOpen || overlay !== openedOverlay) return;', 2],
    ['    loadPrefs();\n    applyRulesWithAnnotation();', '    loadPrefs();\n    marinaraFonts = null;\n    applyRulesWithAnnotation();'],
    // Phone readable minimum, applied to canvas and preview together.
    ['Math.max(12, p.fontSize)', 'Math.max(15, p.fontSize)'],
    ['        min: 12,', '        min: 15,'],
    ['titleSize: Math.max(13,', 'titleSize: Math.max(15,'],
    ['authorSize: Math.max(10,', 'authorSize: Math.max(15,'],
    ['  if (typeof marinara !== "undefined" && marinara.log) {\n    marinara.log.info', `  LV.ready({ open: openModal, close: closeModal });
${probe ? '  LV.probe({ annotateReplaced, remapMarks, buildDialogueMap, tokenizeParagraph, applyMark, state, loadPrefs, savePrefs, exportPng });\n' : ''}  if (typeof marinara !== "undefined" && marinara.log) {
    marinara.log.info`],
  ];
  for (const [from, to, count = 1] of patches) source = replaceAnchor(source, from, to, count);
  return `// GENERATED from pinned original. See src/patch.mjs.\nexport function runOriginal(marinara, LV, fetch, localStorage) {\n${source}\n}\n`;
}
