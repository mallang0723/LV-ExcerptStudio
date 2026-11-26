// src/original.generated.js
function runOriginal(marinara, LV, fetch, localStorage) {
  (() => {
    const ROOT_ATTR = "data-bs-studio-root";
    if (document.querySelector(`[${ROOT_ATTR}]`)) {
      if (typeof marinara !== "undefined" && marinara.log) {
        marinara.log.warn("발췌 스튜디오가 이미 실행 중입니다.");
      }
      return;
    }
    const cleanups = [];
    let modalCleanups = null;
    function onCleanup(fn) {
      (modalCleanups || cleanups).push(fn);
    }
    function runCleanups(list) {
      for (const fn of list.splice(0)) {
        try {
          fn();
        } catch {}
      }
    }
    function listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      onCleanup(() => target.removeEventListener(type, handler, options));
    }
    if (typeof marinara !== "undefined" && marinara.onCleanup) {
      marinara.onCleanup(() => {
        if (modalCleanups)
          runCleanups(modalCleanups);
        modalCleanups = null;
        runCleanups(cleanups);
      });
    }
    const PREFS_KEY = "excerpt-studio-lv-prefs-v1";
    const ACTIVE_CHAT_KEY = "marinara-active-chat-id";
    const DEFAULT_AUTHOR = "LUMIVERSE";
    const MAX_TITLE_OVERRIDES = 100;
    const INK = "#2F3437";
    const HIGHLIGHTS = {
      y: { label: "노랑", color: "#FFDF7E" },
      g: { label: "초록", color: "#B9E6B0" },
      p: { label: "분홍", color: "#F9C6D9" },
      b: { label: "파랑", color: "#B4DAF7" },
      c: { label: "직접 선택", color: null }
    };
    const CENSOR = "censor";
    const CUSTOM_KEY = "c";
    const UNDERLINES = {
      uy: { color: "#E0A93E" },
      ug: { color: "#5FA85A" },
      up: { color: "#D9648F" },
      ub: { color: "#4A8FD4" },
      uc: { color: null }
    };
    function highlightColor(type) {
      return type === CUSTOM_KEY ? state.customColor : HIGHLIGHTS[type].color;
    }
    function underlineColor(type) {
      return type === `u${CUSTOM_KEY}` ? underlineFromHighlight(state.customColor) : UNDERLINES[type].color;
    }
    function underlineFromHighlight(hex) {
      const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
      if (!m)
        return "#4A8FD4";
      const n = parseInt(m[1], 16);
      const r = (n >> 16) / 255;
      const g = (n >> 8 & 255) / 255;
      const b = (n & 255) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      const d = max - min;
      let h = 0;
      let s = 0;
      if (d > 0) {
        s = d / (1 - Math.abs(2 * l - 1));
        if (max === r)
          h = (g - b) / d % 6;
        else if (max === g)
          h = (b - r) / d + 2;
        else
          h = (r - g) / d + 4;
        h = (h * 60 + 360) % 360;
      }
      const l2 = Math.min(l, 0.56);
      const s2 = s < 0.15 ? s : Math.min(Math.max(s, 0.45), 0.72);
      const c = (1 - Math.abs(2 * l2 - 1)) * s2;
      const x = c * (1 - Math.abs(h / 60 % 2 - 1));
      const m0 = l2 - c / 2;
      const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
      const ch = (v) => Math.max(0, Math.min(255, Math.round((v + m0) * 255))).toString(16).padStart(2, "0");
      return `#${ch(r1)}${ch(g1)}${ch(b1)}`;
    }
    const TEXTURES = {
      snow: { label: "화이트", base: "#FBFBFA", text: "#2F3437", grainDark: 0.02, grainLight: 0 },
      dark: { label: "다크", base: "#26231F", text: "#EFE8DA", grainDark: 0, grainLight: 0.045 },
      cream: { label: "크림", base: "#F5EEDB", text: "#31291C", grainDark: 0.045, grainLight: 0.05 },
      kraft: { label: "크라프트", base: "#D5BC92", text: "#3A2D1A", grainDark: 0.06, grainLight: 0.06 }
    };
    const FONT_FALLBACK = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    const BUILTIN_FONTS = [
      { label: "기본 (페이지 폰트)", value: "" },
      { label: "리디바탕", value: '"RIDIBatang", "RIDI Batang", "리디바탕", "Noto Serif KR", Batang, serif', ridi: true }
    ];
    const RIDI_WEBFONT_URL = "https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff";
    const CJK_RE = /[ᄀ-ᇿ⺀-〿぀-ヿ㄰-㆏ㇰ-䶿一-鿿ꥠ-꥿가-퟿豈-﫿＀-￯]/u;
    const state = {
      baseText: "",
      text: "",
      marks: [],
      fontSize: 18,
      fontFamily: "",
      fontFamilyName: "",
      align: "left",
      textColor: INK,
      dialogueEnabled: false,
      dialogueColor: "#9F2F2D",
      customColor: "#CDBDF5",
      cornerRadius: 16,
      cardWidth: 640,
      heightMode: "auto",
      cardHeight: 640,
      vAlign: "top",
      showTitle: true,
      showAuthor: true,
      titleText: "",
      authorText: DEFAULT_AUTHOR,
      titleOverrides: {},
      chatId: "",
      chatName: "",
      replaceRules: [],
      bg: { mode: "texture", color: "#FFFFFF", texture: "cream", pattern: "grain", imageData: null, dim: 0, bright: 0 }
    };
    function loadPrefs() {
      try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw)
          return;
        const p = JSON.parse(raw);
        if (typeof p.fontSize === "number")
          state.fontSize = Math.min(44, Math.max(15, p.fontSize));
        if (typeof p.fontFamily === "string")
          state.fontFamily = p.fontFamily;
        if (typeof p.fontFamilyName === "string")
          state.fontFamilyName = p.fontFamilyName;
        if (["left", "center", "right", "justify"].includes(p.align))
          state.align = p.align;
        if (typeof p.cardWidth === "number")
          state.cardWidth = Math.min(1080, Math.max(420, p.cardWidth));
        if (["auto", "fixed"].includes(p.heightMode))
          state.heightMode = p.heightMode;
        if (typeof p.cardHeight === "number")
          state.cardHeight = Math.min(1800, Math.max(360, p.cardHeight));
        if (["top", "center"].includes(p.vAlign))
          state.vAlign = p.vAlign;
        if (typeof p.textColor === "string")
          state.textColor = p.textColor;
        if (typeof p.dialogueEnabled === "boolean")
          state.dialogueEnabled = p.dialogueEnabled;
        if (typeof p.dialogueColor === "string")
          state.dialogueColor = p.dialogueColor;
        if (typeof p.customColor === "string" && /^#[0-9a-f]{6}$/i.test(p.customColor))
          state.customColor = p.customColor;
        if (typeof p.cornerRadius === "number")
          state.cornerRadius = Math.min(60, Math.max(0, p.cornerRadius));
        if (typeof p.showTitle === "boolean")
          state.showTitle = p.showTitle;
        if (typeof p.showAuthor === "boolean")
          state.showAuthor = p.showAuthor;
        if (typeof p.authorText === "string")
          state.authorText = p.authorText;
        if (p.titleOverrides && typeof p.titleOverrides === "object" && !Array.isArray(p.titleOverrides)) {
          state.titleOverrides = Object.fromEntries(Object.entries(p.titleOverrides).filter(([k, v]) => typeof k === "string" && k && typeof v === "string").slice(-MAX_TITLE_OVERRIDES));
        }
        if (Array.isArray(p.replaceRules)) {
          state.replaceRules = p.replaceRules.filter((r) => r && typeof r.find === "string" && typeof r.replace === "string").slice(0, 20).map((r) => ({ find: r.find, replace: r.replace }));
        }
        if (p.bg && typeof p.bg === "object") {
          if (["solid", "texture"].includes(p.bg.mode))
            state.bg.mode = p.bg.mode;
          if (typeof p.bg.color === "string")
            state.bg.color = p.bg.color;
          if (TEXTURES[p.bg.texture])
            state.bg.texture = p.bg.texture;
          if (["grain", "grid", "lines", "none"].includes(p.bg.pattern))
            state.bg.pattern = p.bg.pattern;
        }
      } catch {}
    }
    function rememberTitleOverride() {
      if (!state.chatId)
        return;
      const isDefault = state.chatName ? state.titleText === state.chatName : state.titleText === "";
      delete state.titleOverrides[state.chatId];
      if (isDefault)
        return;
      state.titleOverrides[state.chatId] = state.titleText;
      const keys = Object.keys(state.titleOverrides);
      for (const k of keys.slice(0, Math.max(0, keys.length - MAX_TITLE_OVERRIDES)))
        delete state.titleOverrides[k];
    }
    function savePrefs() {
      rememberTitleOverride();
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({
          fontSize: state.fontSize,
          fontFamily: state.fontFamily,
          fontFamilyName: state.fontFamilyName,
          align: state.align,
          cardWidth: state.cardWidth,
          heightMode: state.heightMode,
          cardHeight: state.cardHeight,
          vAlign: state.vAlign,
          textColor: state.textColor,
          dialogueEnabled: state.dialogueEnabled,
          dialogueColor: state.dialogueColor,
          customColor: state.customColor,
          cornerRadius: state.cornerRadius,
          showTitle: state.showTitle,
          showAuthor: state.showAuthor,
          authorText: state.authorText,
          titleOverrides: state.titleOverrides,
          replaceRules: state.replaceRules,
          bg: {
            mode: state.bg.mode === "image" ? "texture" : state.bg.mode,
            color: state.bg.color,
            texture: state.bg.texture,
            pattern: state.bg.pattern
          }
        }));
      } catch {}
    }
    function el(tag, className, text) {
      const node = document.createElement(tag);
      if (className)
        node.className = className;
      if (text != null)
        node.textContent = text;
      return node;
    }
    function hexToRgba(hex, alpha) {
      const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
      if (!m)
        return `rgba(47,52,55,${alpha})`;
      const n = parseInt(m[1], 16);
      return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${alpha})`;
    }
    function debounce(fn, wait) {
      let t = 0;
      const wrapped = (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
      onCleanup(() => clearTimeout(t));
      return wrapped;
    }
    function numericControl({ label, min, max, step, value, onChange }) {
      const row = el("div", "bs-row");
      row.appendChild(el("label", "bs-label", label));
      const slider = el("input", "bs-slider");
      slider.type = "range";
      slider.min = String(min);
      slider.max = String(max);
      slider.step = String(step || 1);
      slider.value = String(value);
      const num = el("input", "bs-num");
      num.type = "number";
      num.min = String(min);
      num.max = String(max);
      num.step = "1";
      num.value = String(value);
      const commit = (raw, syncNum) => {
        let v = Number(raw);
        if (!Number.isFinite(v))
          return;
        v = Math.min(max, Math.max(min, Math.round(v)));
        slider.value = String(v);
        if (syncNum)
          num.value = String(v);
        onChange(v);
      };
      listen(slider, "input", () => commit(slider.value, true));
      listen(num, "input", () => {
        const v = Number(num.value);
        if (Number.isFinite(v) && v >= min && v <= max)
          commit(v, false);
      });
      listen(num, "change", () => commit(num.value, true));
      row.appendChild(slider);
      row.appendChild(num);
      return row;
    }
    function buildDialogueMap(text) {
      const map = new Uint8Array(text.length);
      let straightOpen = -1;
      let curlyOpen = -1;
      for (let i = 0;i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
          if (straightOpen < 0) {
            straightOpen = i;
          } else {
            map.fill(1, straightOpen, i + 1);
            straightOpen = -1;
          }
        } else if (ch === "“") {
          curlyOpen = i;
        } else if (ch === "”" && curlyOpen >= 0) {
          map.fill(1, curlyOpen, i + 1);
          curlyOpen = -1;
        }
      }
      return map;
    }
    function roundedPath(ctx, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, w, h, rr);
        return;
      }
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
    let marinaraFonts = null;
    const loadedFamilies = new Set;
    async function fetchMarinaraFonts() {
      if (marinaraFonts)
        return marinaraFonts;
      const map = new Map;
      try {
        const res = await fetch("/api/fonts", { credentials: "same-origin" });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            for (const face of list) {
              if (!face || typeof face.family !== "string" || typeof face.url !== "string")
                continue;
              if (!map.has(face.family))
                map.set(face.family, []);
              map.get(face.family).push(face);
            }
          }
        }
      } catch {}
      marinaraFonts = map;
      return map;
    }
    function pageHasFamily(family) {
      let found = false;
      try {
        document.fonts.forEach((f) => {
          if (String(f.family).replace(/^["']|["']$/g, "") === family)
            found = true;
        });
      } catch {}
      return found;
    }
    function ensureFamilyLoaded(family) {
      if (!family || loadedFamilies.has(family))
        return;
      loadedFamilies.add(family);
      if (pageHasFamily(family))
        return;
      const faces = marinaraFonts && marinaraFonts.get(family) || [];
      for (const face of faces) {
        try {
          const desc = { weight: face.weight || "400", style: face.style || "normal" };
          if (face.unicodeRange)
            desc.unicodeRange = face.unicodeRange;
          const ff = new FontFace(family, `url("${face.url}")`, desc);
          document.fonts.add(ff);
        } catch {}
      }
    }
    let ridiLoading = null;
    function ensureRidiWebfont() {
      if (pageHasFamily("RIDIBatang"))
        return Promise.resolve(true);
      if (!ridiLoading) {
        ridiLoading = (async () => {
          const res = await fetch(RIDI_WEBFONT_URL, { mode: "cors" });
          if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
          const buffer = await res.arrayBuffer();
          const face = new FontFace("RIDIBatang", buffer);
          await face.loaded;
          document.fonts.add(face);
          return true;
        })().catch((err) => {
          ridiLoading = null;
          throw err;
        });
      }
      return ridiLoading;
    }
    function resolvedFontFamily() {
      if (state.fontFamily)
        return state.fontFamily;
      try {
        const pageFont = getComputedStyle(document.body).fontFamily;
        if (pageFont)
          return pageFont;
      } catch {}
      return FONT_FALLBACK;
    }
    function activeChatId() {
      try {
        return localStorage.getItem(ACTIVE_CHAT_KEY) || "";
      } catch {
        return "";
      }
    }
    async function detectChatTitle(id) {
      try {
        if (!id)
          return "";
        const res = await fetch(`/api/chats/${encodeURIComponent(id)}`, { credentials: "same-origin" });
        if (!res.ok)
          return "";
        const chat = await res.json();
        return chat && typeof chat.name === "string" ? chat.name : "";
      } catch {
        return "";
      }
    }
    const grainCache = {};
    function grainTile(base, dark, light) {
      const key = `${base}|${dark}|${light}`;
      if (grainCache[key])
        return grainCache[key];
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const g = c.getContext("2d");
      g.fillStyle = base;
      g.fillRect(0, 0, 256, 256);
      for (let i = 0;i < 2200; i++) {
        const a = Math.random() * dark;
        if (a <= 0)
          break;
        g.fillStyle = `rgba(40,30,10,${a.toFixed(3)})`;
        g.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
      }
      for (let i = 0;i < 1400; i++) {
        const a = Math.random() * light;
        if (a <= 0)
          break;
        g.fillStyle = `rgba(255,252,240,${a.toFixed(3)})`;
        g.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
      }
      grainCache[key] = c;
      return c;
    }
    function grainSpecFor() {
      const spec = state.bg.mode === "texture" ? TEXTURES[state.bg.texture] : null;
      return { dark: spec ? spec.grainDark : 0.035, light: spec ? spec.grainLight : 0.04 };
    }
    let currentAnnotation = null;
    function annotateReplaced(base, rules) {
      let chars = Array.from({ length: base.length }, (_, i) => ({ ch: base[i], bs: i, be: i + 1 }));
      for (const rule of rules) {
        if (!rule.find)
          continue;
        const find = rule.find;
        const str = chars.map((c) => c.ch).join("");
        const out = [];
        let i = 0;
        while (i < chars.length) {
          if (str.startsWith(find, i)) {
            const bs = chars[i].bs;
            const be = chars[i + find.length - 1].be;
            for (let k = 0;k < rule.replace.length; k++)
              out.push({ ch: rule.replace[k], bs, be });
            i += find.length;
          } else {
            out.push(chars[i]);
            i += 1;
          }
        }
        chars = out;
      }
      return chars;
    }
    function applyRulesWithAnnotation() {
      currentAnnotation = annotateReplaced(state.baseText, state.replaceRules);
      state.text = currentAnnotation.map((c) => c.ch).join("");
    }
    function remapMarks(marks, oldAnn, newAnn) {
      const result = [];
      for (const mk of marks) {
        if (mk.end <= mk.start || mk.start >= oldAnn.length)
          continue;
        const baseStart = oldAnn[mk.start].bs;
        const baseEnd = oldAnn[Math.min(mk.end, oldAnn.length) - 1].be;
        let s = -1;
        let e = -1;
        for (let j = 0;j < newAnn.length; j++) {
          if (s < 0 && newAnn[j].be > baseStart)
            s = j;
          if (newAnn[j].bs < baseEnd)
            e = j;
        }
        if (s < 0 || e < s)
          continue;
        result.push({ start: s, end: e + 1, type: mk.type });
      }
      result.sort((a, b) => a.start - b.start);
      const cleaned = [];
      for (const mk of result) {
        const last = cleaned[cleaned.length - 1];
        if (last && mk.start < last.end) {
          if (mk.type === last.type) {
            last.end = Math.max(last.end, mk.end);
            continue;
          }
          mk.start = last.end;
          if (mk.start >= mk.end)
            continue;
        }
        cleaned.push(mk);
      }
      return cleaned;
    }
    function applyMark(start, end, type) {
      if (end <= start)
        return;
      const next = [];
      for (const m of state.marks) {
        if (m.end <= start || m.start >= end) {
          next.push(m);
          continue;
        }
        if (m.start < start)
          next.push({ start: m.start, end: start, type: m.type });
        if (m.end > end)
          next.push({ start: end, end: m.end, type: m.type });
      }
      if (type)
        next.push({ start, end, type });
      next.sort((a, b) => a.start - b.start);
      const merged = [];
      for (const m of next) {
        const last = merged[merged.length - 1];
        if (last && last.type === m.type && last.end === m.start)
          last.end = m.end;
        else
          merged.push({ ...m });
      }
      state.marks = merged;
    }
    function markAt(index) {
      for (const m of state.marks) {
        if (index >= m.start && index < m.end)
          return m.type;
      }
      return null;
    }
    const fab = document.createElement("button");
    fab.type = "button";
    fab.className = "bs-fab";
    fab.setAttribute(ROOT_ATTR, "true");
    const fabMark = el("span", "bs-fab-mark", "❝");
    fab.appendChild(fabMark);
    fab.appendChild(document.createTextNode("발췌"));
    fab.style.display = "none";
    document.body.appendChild(fab);
    onCleanup(() => fab.remove());
    let pendingText = "";
    let modalOpen = false;
    function chatSelectionText() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0)
        return null;
      const range = sel.getRangeAt(0);
      const toElement = (node) => node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      const startEl = toElement(range.startContainer);
      const endEl = toElement(range.endContainer);
      if (!startEl || !endEl)
        return null;
      if (!LV.isMessageRange(range))
        return null;
      const text = sel.toString().replace(/\r\n/g, `
`).replace(/\n{3,}/g, `

`).trim();
      if (!text)
        return null;
      return { text, range };
    }
    function positionFab(range) {
      const rects = range.getClientRects();
      if (!rects.length)
        return false;
      const last = rects[rects.length - 1];
      const margin = 8;
      let left = last.right + margin;
      let top = last.bottom + margin;
      const fw = 96;
      const fh = 40;
      if (left + fw > window.innerWidth - margin)
        left = window.innerWidth - fw - margin;
      if (top + fh > window.innerHeight - margin)
        top = last.top - fh - margin;
      if (top < margin)
        top = margin;
      if (left < margin)
        left = margin;
      fab.style.left = `${Math.round(left)}px`;
      fab.style.top = `${Math.round(top)}px`;
      return true;
    }
    let selTimer = 0;
    listen(document, "selectionchange", () => {
      if (modalOpen)
        return;
      clearTimeout(selTimer);
      selTimer = setTimeout(() => {
        const found = chatSelectionText();
        if (found && positionFab(found.range)) {
          pendingText = found.text;
          fab.style.display = "inline-flex";
        } else {
          fab.style.display = "none";
        }
      }, 120);
    });
    onCleanup(() => clearTimeout(selTimer));
    listen(fab, "mousedown", (e) => e.preventDefault());
    listen(fab, "touchstart", (e) => e.preventDefault(), { passive: false });
    listen(fab, "click", () => {
      if (!pendingText)
        return;
      fab.style.display = "none";
      openModal(pendingText);
    });
    listen(fab, "touchend", (e) => {
      e.preventDefault();
      if (!pendingText)
        return;
      fab.style.display = "none";
      openModal(pendingText);
    });
    listen(window, "scroll", () => {
      if (!modalOpen)
        fab.style.display = "none";
    }, { capture: true, passive: true });
    let overlay = null;
    let previewCard = null;
    let previewBodyWrap = null;
    let previewText = null;
    let previewFooter = null;
    let statusLine = null;
    let rulesBox = null;
    function openModal(text) {
      if (modalOpen)
        return;
      modalOpen = true;
      modalCleanups = [];
      state.baseText = text;
      state.marks = [];
      state.bg.imageData = null;
      state.bg.dim = 0;
      state.bg.bright = 0;
      loadPrefs();
      marinaraFonts = null;
      applyRulesWithAnnotation();
      state.chatId = activeChatId();
      state.chatName = "";
      const rememberedTitle = state.chatId ? state.titleOverrides[state.chatId] : undefined;
      state.titleText = typeof rememberedTitle === "string" ? rememberedTitle : "";
      if (state.bg.mode === "texture")
        state.textColor = TEXTURES[state.bg.texture].text;
      overlay = el("div", "bs-overlay");
      overlay.setAttribute(ROOT_ATTR, "true");
      const panel = el("div", "bs-panel");
      panel.style.backgroundImage = `url("${grainTile("#FBFBFA", 0.02, 0).toDataURL("image/png")}")`;
      overlay.appendChild(panel);
      const header = el("div", "bs-header");
      const headerLeft = el("div", "bs-header-left");
      headerLeft.appendChild(el("div", "bs-title", "발췌 스튜디오"));
      headerLeft.appendChild(el("div", "bs-subtitle", "LUMIVERSE EXCERPT"));
      header.appendChild(headerLeft);
      const closeBtn = el("button", "bs-icon-btn", "✕");
      closeBtn.type = "button";
      closeBtn.title = "닫기";
      listen(closeBtn, "click", closeModal);
      header.appendChild(closeBtn);
      panel.appendChild(header);
      const body = el("div", "bs-body");
      panel.appendChild(body);
      const previewWrap = el("div", "bs-preview-wrap");
      previewCard = el("div", "bs-card");
      previewBodyWrap = el("div", "bs-card-body");
      previewText = el("div", "bs-card-text");
      previewBodyWrap.appendChild(previewText);
      previewFooter = el("div", "bs-card-footer");
      previewCard.appendChild(previewBodyWrap);
      previewCard.appendChild(previewFooter);
      previewWrap.appendChild(previewCard);
      body.appendChild(previewWrap);
      const controls = el("div", "bs-controls");
      body.appendChild(controls);
      controls.appendChild(el("div", "bs-section-title", "글자"));
      controls.appendChild(numericControl({
        label: "크기",
        min: 15,
        max: 44,
        step: 1,
        value: state.fontSize,
        onChange: (v) => {
          state.fontSize = v;
          renderPreview();
        }
      }));
      const fontRow = el("div", "bs-row");
      fontRow.appendChild(el("label", "bs-label", "폰트"));
      const fontSelect = el("select", "bs-select");
      fontRow.appendChild(fontSelect);
      controls.appendChild(fontRow);
      function rebuildFontSelect() {
        fontSelect.textContent = "";
        let ridiClaimed = null;
        for (const f of BUILTIN_FONTS) {
          const opt = el("option", null, f.label);
          opt.value = f.value;
          if (f.ridi) {
            const family = marinaraFonts ? [...marinaraFonts.keys()].find((k) => /ridi|리디/i.test(k)) : null;
            if (family) {
              opt.dataset.family = family;
              opt.value = `"${family}", ${f.value}`;
              ridiClaimed = family;
            } else {
              opt.dataset.webfont = "ridi";
            }
          }
          if (opt.value === state.fontFamily || f.value === state.fontFamily)
            opt.selected = true;
          fontSelect.appendChild(opt);
        }
        if (marinaraFonts && marinaraFonts.size > 0) {
          const group = el("optgroup");
          group.label = "페이지에 등록된 폰트";
          const families = [...marinaraFonts.keys()].sort((a, b) => a.localeCompare(b, "ko"));
          for (const family of families) {
            if (family === ridiClaimed)
              continue;
            const opt = el("option", null, family);
            opt.value = `"${family}", ${FONT_FALLBACK}`;
            opt.dataset.family = family;
            if (family === state.fontFamilyName)
              opt.selected = true;
            group.appendChild(opt);
          }
          fontSelect.appendChild(group);
        }
      }
      rebuildFontSelect();
      listen(fontSelect, "change", () => {
        const opt = fontSelect.selectedOptions[0];
        state.fontFamily = fontSelect.value;
        state.fontFamilyName = opt && opt.dataset.family ? opt.dataset.family : "";
        if (state.fontFamilyName) {
          ensureFamilyLoaded(state.fontFamilyName);
          setStatus("폰트를 불러오는 중…");
          document.fonts.load(`${state.fontSize}px "${state.fontFamilyName}"`, state.text || "발췌").then(() => {
            setStatus("");
            renderPreview();
          }).catch(() => setStatus(""));
        } else if (opt && opt.dataset.webfont === "ridi") {
          setStatus("리디바탕을 웹에서 불러오는 중…");
          ensureRidiWebfont().then(() => {
            setStatus("");
            renderPreview();
          }).catch(() => setStatus("리디바탕을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요."));
        }
        renderPreview();
      });
      const colorRow = el("div", "bs-row");
      colorRow.appendChild(el("label", "bs-label", "글자색"));
      const textColorInput = el("input", "bs-color");
      textColorInput.type = "color";
      textColorInput.value = state.textColor;
      listen(textColorInput, "input", () => {
        state.textColor = textColorInput.value;
        renderPreview();
      });
      colorRow.appendChild(textColorInput);
      const dlgCheck = el("input");
      dlgCheck.type = "checkbox";
      dlgCheck.className = "bs-check bs-push";
      dlgCheck.checked = state.dialogueEnabled;
      dlgCheck.title = "대사 색상 켜기/끄기";
      const dlgLabel = el("label", "bs-label bs-label-auto", "대사 색상");
      const dlgColorInput = el("input", "bs-color");
      dlgColorInput.type = "color";
      dlgColorInput.value = state.dialogueColor;
      listen(dlgCheck, "change", () => {
        state.dialogueEnabled = dlgCheck.checked;
        renderPreview();
      });
      listen(dlgColorInput, "input", () => {
        state.dialogueColor = dlgColorInput.value;
        if (!state.dialogueEnabled) {
          state.dialogueEnabled = true;
          dlgCheck.checked = true;
        }
        renderPreview();
      });
      colorRow.appendChild(dlgCheck);
      colorRow.appendChild(dlgLabel);
      colorRow.appendChild(dlgColorInput);
      controls.appendChild(colorRow);
      const alignRow = el("div", "bs-seg");
      const aligns = [
        ["left", "왼쪽"],
        ["center", "가운데"],
        ["right", "오른쪽"],
        ["justify", "양쪽"]
      ];
      const alignBtns = {};
      for (const [value, label] of aligns) {
        const b = el("button", "bs-seg-btn", label);
        b.type = "button";
        if (state.align === value)
          b.classList.add("bs-active");
        listen(b, "click", () => {
          state.align = value;
          for (const key of Object.keys(alignBtns))
            alignBtns[key].classList.toggle("bs-active", key === value);
          renderPreview();
        });
        alignBtns[value] = b;
        alignRow.appendChild(b);
      }
      controls.appendChild(alignRow);
      controls.appendChild(el("div", "bs-section-title", "형광펜 · 밑줄 · 검열"));
      controls.appendChild(el("div", "bs-hint", "글자 드래그 후 색상 선택"));
      let markMode = "hl";
      const modeRow = el("div", "bs-seg");
      const modeBtns = {};
      const colorSwatches = [];
      function updateSwatchLook() {
        for (const { key, btn } of colorSwatches) {
          if (markMode === "hl") {
            btn.style.background = highlightColor(key);
            btn.style.borderBottom = "";
            btn.title = `형광펜 (${HIGHLIGHTS[key].label})`;
          } else {
            btn.style.background = "#ffffff";
            btn.style.borderBottom = `5px solid ${underlineColor(`u${key}`)}`;
            btn.title = `밑줄 (${HIGHLIGHTS[key].label})`;
          }
        }
      }
      for (const [value, label] of [
        ["hl", "형광펜"],
        ["ul", "밑줄"]
      ]) {
        const b = el("button", "bs-seg-btn", label);
        b.type = "button";
        if (markMode === value)
          b.classList.add("bs-active");
        listen(b, "mousedown", (e) => e.preventDefault());
        listen(b, "click", () => {
          markMode = value;
          for (const key of Object.keys(modeBtns))
            modeBtns[key].classList.toggle("bs-active", key === value);
          updateSwatchLook();
        });
        modeBtns[value] = b;
        modeRow.appendChild(b);
      }
      controls.appendChild(modeRow);
      const markRow = el("div", "bs-mark-row");
      for (const key of Object.keys(HIGHLIGHTS)) {
        const b = el("button", "bs-swatch");
        b.type = "button";
        listen(b, "mousedown", (e) => e.preventDefault());
        listen(b, "click", () => markSelection(markMode === "hl" ? key : `u${key}`));
        colorSwatches.push({ key, btn: b });
        if (key === CUSTOM_KEY) {
          b.classList.add("bs-swatch-custom");
          const wrap = el("span", "bs-swatch-wrap");
          const badge = el("label", "bs-swatch-badge", "C");
          badge.title = "직접 선택 색 바꾸기";
          const customInput = el("input", "bs-swatch-picker");
          customInput.type = "color";
          customInput.value = state.customColor;
          listen(badge, "mousedown", (e) => e.preventDefault());
          listen(customInput, "input", () => {
            state.customColor = customInput.value;
            updateSwatchLook();
            renderPreview();
          });
          badge.appendChild(customInput);
          wrap.appendChild(b);
          wrap.appendChild(badge);
          markRow.appendChild(wrap);
        } else {
          markRow.appendChild(b);
        }
      }
      updateSwatchLook();
      const censorBtn = el("button", "bs-swatch bs-swatch-censor", "가");
      censorBtn.type = "button";
      censorBtn.title = "검열 (검은 마크)";
      listen(censorBtn, "mousedown", (e) => e.preventDefault());
      listen(censorBtn, "click", () => markSelection(CENSOR));
      markRow.appendChild(censorBtn);
      const eraseBtn = el("button", "bs-swatch bs-swatch-erase", "지움");
      eraseBtn.type = "button";
      eraseBtn.title = "마크 지우기";
      listen(eraseBtn, "mousedown", (e) => e.preventDefault());
      listen(eraseBtn, "click", () => markSelection(null));
      markRow.appendChild(eraseBtn);
      controls.appendChild(markRow);
      controls.appendChild(el("div", "bs-section-title", "치환"));
      rulesBox = el("div", "bs-rules");
      controls.appendChild(rulesBox);
      const addRuleBtn = el("button", "bs-btn bs-btn-slim", "+ 치환 규칙 추가");
      addRuleBtn.type = "button";
      listen(addRuleBtn, "click", () => {
        state.replaceRules.push({ find: "", replace: "" });
        renderRules();
      });
      controls.appendChild(addRuleBtn);
      const onRulesChanged = debounce(() => {
        const before = state.marks.length;
        const oldAnnotation = currentAnnotation;
        applyRulesWithAnnotation();
        state.marks = remapMarks(state.marks, oldAnnotation, currentAnnotation);
        renderPreview();
        if (state.marks.length < before)
          setStatus("치환으로 일부 마크가 사라졌습니다.");
        else
          setStatus("");
      }, 250);
      function renderRules() {
        rulesBox.textContent = "";
        state.replaceRules.forEach((rule, index) => {
          const row = el("div", "bs-rule-row");
          const findInput = el("input", "bs-input");
          findInput.type = "text";
          findInput.placeholder = "찾기";
          findInput.value = rule.find;
          listen(findInput, "input", () => {
            rule.find = findInput.value;
            onRulesChanged();
          });
          const arrow = el("span", "bs-rule-arrow", "→");
          const replaceInput = el("input", "bs-input");
          replaceInput.type = "text";
          replaceInput.placeholder = "바꾸기";
          replaceInput.value = rule.replace;
          listen(replaceInput, "input", () => {
            rule.replace = replaceInput.value;
            onRulesChanged();
          });
          const removeBtn = el("button", "bs-rule-remove", "✕");
          removeBtn.type = "button";
          removeBtn.title = "규칙 삭제";
          listen(removeBtn, "click", () => {
            state.replaceRules.splice(index, 1);
            renderRules();
            onRulesChanged();
          });
          row.appendChild(findInput);
          row.appendChild(arrow);
          row.appendChild(replaceInput);
          row.appendChild(removeBtn);
          rulesBox.appendChild(row);
        });
      }
      renderRules();
      controls.appendChild(el("div", "bs-section-title", "작품 정보"));
      const titleRow = el("div", "bs-check-row");
      const titleCheck = el("input");
      titleCheck.type = "checkbox";
      titleCheck.className = "bs-check";
      titleCheck.checked = state.showTitle;
      const titleInput = el("input", "bs-input");
      titleInput.type = "text";
      titleInput.placeholder = "작품명 (채팅방 이름)";
      titleInput.value = state.titleText;
      const titleRevert = el("button", "bs-icon-btn bs-revert", "↺");
      titleRevert.type = "button";
      titleRevert.title = "채팅방 이름으로 되돌리기";
      const syncTitleRevert = () => {
        titleRevert.classList.toggle("bs-revert--off", !state.chatName || titleInput.value === state.chatName);
      };
      syncTitleRevert();
      listen(titleCheck, "change", () => {
        state.showTitle = titleCheck.checked;
        renderPreview();
      });
      const renderTitleSoon = debounce(() => renderPreview(), 200);
      listen(titleInput, "input", () => {
        state.titleText = titleInput.value;
        syncTitleRevert();
        renderTitleSoon();
      });
      listen(titleRevert, "click", () => {
        titleInput.value = state.chatName;
        state.titleText = state.chatName;
        syncTitleRevert();
        renderPreview();
      });
      titleRow.appendChild(titleCheck);
      titleRow.appendChild(titleInput);
      titleRow.appendChild(titleRevert);
      controls.appendChild(titleRow);
      const authorRow = el("div", "bs-check-row");
      const authorCheck = el("input");
      authorCheck.type = "checkbox";
      authorCheck.className = "bs-check";
      authorCheck.checked = state.showAuthor;
      const authorInput = el("input", "bs-input");
      authorInput.type = "text";
      authorInput.placeholder = "작가";
      authorInput.value = state.authorText;
      listen(authorCheck, "change", () => {
        state.showAuthor = authorCheck.checked;
        renderPreview();
      });
      const authorRevert = el("button", "bs-icon-btn bs-revert", "↺");
      authorRevert.type = "button";
      authorRevert.title = `기본값(${DEFAULT_AUTHOR})으로 되돌리기`;
      const syncAuthorRevert = () => {
        authorRevert.classList.toggle("bs-revert--off", authorInput.value === DEFAULT_AUTHOR);
      };
      syncAuthorRevert();
      const renderAuthorSoon = debounce(() => renderPreview(), 200);
      listen(authorInput, "input", () => {
        state.authorText = authorInput.value;
        syncAuthorRevert();
        renderAuthorSoon();
      });
      listen(authorRevert, "click", () => {
        authorInput.value = DEFAULT_AUTHOR;
        state.authorText = DEFAULT_AUTHOR;
        syncAuthorRevert();
        renderPreview();
      });
      authorRow.appendChild(authorCheck);
      authorRow.appendChild(authorInput);
      authorRow.appendChild(authorRevert);
      controls.appendChild(authorRow);
      controls.appendChild(el("div", "bs-section-title", "배경"));
      const texRow = el("div", "bs-tex-row");
      for (const [key, spec] of Object.entries(TEXTURES)) {
        const b = el("button", "bs-tex-btn", spec.label);
        b.type = "button";
        b.style.background = spec.base;
        b.style.color = spec.text;
        listen(b, "click", () => {
          state.bg.mode = "texture";
          state.bg.texture = key;
          state.textColor = spec.text;
          textColorInput.value = spec.text;
          renderPreview();
        });
        texRow.appendChild(b);
      }
      controls.appendChild(texRow);
      const bgRow = el("div", "bs-row");
      bgRow.appendChild(el("label", "bs-label", "단색"));
      const bgColorInput = el("input", "bs-color");
      bgColorInput.type = "color";
      bgColorInput.value = state.bg.color;
      listen(bgColorInput, "input", () => {
        state.bg.mode = "solid";
        state.bg.color = bgColorInput.value;
        renderPreview();
      });
      bgRow.appendChild(bgColorInput);
      const fileBtn = el("button", "bs-btn bs-btn-slim bs-push", "이미지 불러오기");
      fileBtn.type = "button";
      const fileInput = el("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";
      listen(fileBtn, "click", () => fileInput.click());
      listen(fileInput, "change", () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file)
          return;
        const reader = new FileReader;
        reader.onload = () => {
          const img = new Image;
          img.onload = () => {
            state.bg.mode = "image";
            state.bg.imageData = img;
            renderPreview();
          };
          img.onerror = () => setStatus("이미지 파일을 읽지 못했습니다.");
          img.src = String(reader.result);
        };
        reader.onerror = () => setStatus("이미지 파일을 읽지 못했습니다.");
        reader.readAsDataURL(file);
        fileInput.value = "";
      });
      bgRow.appendChild(fileBtn);
      bgRow.appendChild(fileInput);
      controls.appendChild(bgRow);
      const patternRow = el("div", "bs-seg");
      const patterns = [
        ["grain", "종이 질감"],
        ["lines", "줄노트"],
        ["grid", "모눈"],
        ["none", "없음"]
      ];
      const patternBtns = {};
      for (const [value, label] of patterns) {
        const b = el("button", "bs-seg-btn", label);
        b.type = "button";
        if (state.bg.pattern === value)
          b.classList.add("bs-active");
        listen(b, "click", () => {
          state.bg.pattern = value;
          for (const key of Object.keys(patternBtns))
            patternBtns[key].classList.toggle("bs-active", key === value);
          if (state.bg.mode === "image")
            state.bg.mode = "texture";
          renderPreview();
        });
        patternBtns[value] = b;
        patternRow.appendChild(b);
      }
      controls.appendChild(patternRow);
      controls.appendChild(numericControl({
        label: "어둡게",
        min: 0,
        max: 70,
        step: 1,
        value: 0,
        onChange: (v) => {
          state.bg.dim = v / 100;
          renderPreview();
        }
      }));
      controls.appendChild(numericControl({
        label: "밝게",
        min: 0,
        max: 70,
        step: 1,
        value: 0,
        onChange: (v) => {
          state.bg.bright = v / 100;
          renderPreview();
        }
      }));
      controls.appendChild(el("div", "bs-section-title", "카드"));
      controls.appendChild(numericControl({
        label: "폭",
        min: 420,
        max: 1080,
        step: 20,
        value: state.cardWidth,
        onChange: (v) => {
          state.cardWidth = v;
          renderPreview();
        }
      }));
      controls.appendChild(numericControl({
        label: "둥글기",
        min: 0,
        max: 60,
        step: 2,
        value: state.cornerRadius,
        onChange: (v) => {
          state.cornerRadius = v;
          renderPreview();
        }
      }));
      const heightModeRow = el("div", "bs-seg");
      const heightModes = [
        ["auto", "높이 자동"],
        ["fixed", "높이 직접"]
      ];
      const heightModeBtns = {};
      const heightRow = numericControl({
        label: "높이",
        min: 360,
        max: 1800,
        step: 20,
        value: state.cardHeight,
        onChange: (v) => {
          state.cardHeight = v;
          renderPreview();
        }
      });
      const vAlignRow = el("div", "bs-seg");
      function syncHeightRows() {
        heightRow.style.display = state.heightMode === "fixed" ? "" : "none";
        vAlignRow.style.display = state.heightMode === "fixed" ? "" : "none";
      }
      for (const [value, label] of heightModes) {
        const b = el("button", "bs-seg-btn", label);
        b.type = "button";
        if (state.heightMode === value)
          b.classList.add("bs-active");
        listen(b, "click", () => {
          state.heightMode = value;
          for (const key of Object.keys(heightModeBtns))
            heightModeBtns[key].classList.toggle("bs-active", key === value);
          syncHeightRows();
          renderPreview();
        });
        heightModeBtns[value] = b;
        heightModeRow.appendChild(b);
      }
      controls.appendChild(heightModeRow);
      controls.appendChild(heightRow);
      const vAligns = [
        ["top", "본문 위쪽"],
        ["center", "본문 가운데"]
      ];
      const vAlignBtns = {};
      for (const [value, label] of vAligns) {
        const b = el("button", "bs-seg-btn", label);
        b.type = "button";
        if (state.vAlign === value)
          b.classList.add("bs-active");
        listen(b, "click", () => {
          state.vAlign = value;
          for (const key of Object.keys(vAlignBtns))
            vAlignBtns[key].classList.toggle("bs-active", key === value);
          renderPreview();
        });
        vAlignBtns[value] = b;
        vAlignRow.appendChild(b);
      }
      controls.appendChild(vAlignRow);
      syncHeightRows();
      const footer = el("div", "bs-footer");
      statusLine = el("div", "bs-status", "");
      footer.appendChild(statusLine);
      const cancelBtn = el("button", "bs-btn", "닫기");
      cancelBtn.type = "button";
      listen(cancelBtn, "click", closeModal);
      footer.appendChild(cancelBtn);
      const saveBtn = el("button", "bs-btn bs-btn-primary", "PNG 저장");
      saveBtn.type = "button";
      listen(saveBtn, "click", () => {
        exportPng().catch(() => setStatus("이미지 저장에 실패했습니다."));
      });
      footer.appendChild(saveBtn);
      panel.appendChild(footer);
      listen(overlay, "mousedown", (e) => {
        if (e.target === overlay)
          closeModal();
      });
      listen(document, "keydown", escToClose, true);
      document.body.appendChild(overlay);
      LV.onOpen({ overlay, text, close: closeModal, setExcerpt(value) {
        state.baseText = value;
        state.marks = [];
        applyRulesWithAnnotation();
        renderPreview();
        setStatus("발췌 범위를 바꿨습니다. 마크는 다시 지정하세요.");
      }, cropSelection() {
        const offsets = previewSelectionOffsets();
        if (!offsets) {
          setStatus("미리보기에서 남길 글자를 드래그하세요.");
          return;
        }
        const first = currentAnnotation[offsets.start], last = currentAnnotation[offsets.end - 1];
        if (!first || !last)
          return;
        state.baseText = state.baseText.slice(first.bs, last.be);
        state.marks = [];
        applyRulesWithAnnotation();
        renderPreview();
        window.getSelection()?.removeAllRanges();
      } });
      onCleanup(() => {
        if (overlay)
          overlay.remove();
      });
      renderPreview();
      const openedOverlay = overlay;
      fetchMarinaraFonts().then(() => {
        if (!modalOpen || overlay !== openedOverlay)
          return;
        rebuildFontSelect();
        if (state.fontFamilyName && marinaraFonts.has(state.fontFamilyName)) {
          ensureFamilyLoaded(state.fontFamilyName);
          document.fonts.load(`${state.fontSize}px "${state.fontFamilyName}"`, state.text || "발췌").then(() => renderPreview()).catch(() => {});
        } else if (state.fontFamily.includes("RIDIBatang")) {
          ensureRidiWebfont().then(() => renderPreview()).catch(() => {});
        }
      });
      detectChatTitle(state.chatId).then((name) => {
        if (!modalOpen || overlay !== openedOverlay)
          return;
        state.chatName = name;
        if (name && typeof rememberedTitle !== "string") {
          titleInput.value = name;
          state.titleText = name;
          renderPreview();
        }
        syncTitleRevert();
      });
    }
    function escToClose(e) {
      if (e.key === "Escape" && modalOpen) {
        e.stopPropagation();
        closeModal();
      }
    }
    function closeModal() {
      if (!modalOpen)
        return;
      modalOpen = false;
      LV.onClose();
      savePrefs();
      document.removeEventListener("keydown", escToClose, true);
      if (overlay)
        overlay.remove();
      if (modalCleanups)
        runCleanups(modalCleanups);
      modalCleanups = null;
      overlay = previewCard = previewBodyWrap = previewText = previewFooter = statusLine = rulesBox = null;
    }
    function setStatus(message) {
      if (statusLine)
        statusLine.textContent = message;
    }
    function cardMetrics() {
      const fontSize = state.fontSize;
      return {
        padding: Math.round(fontSize * 2.1),
        lineHeight: Math.round(fontSize * 1.75),
        titleSize: Math.max(15, Math.round(fontSize * 0.78)),
        authorSize: Math.max(15, Math.round(fontSize * 0.56)),
        gapAboveDivider: Math.round(fontSize * 1.7),
        gapTitle: Math.round(fontSize * 1.05),
        gapAuthor: Math.round(fontSize * 0.45)
      };
    }
    function effectiveFooter() {
      const title = state.showTitle && state.titleText.trim() ? state.titleText.trim() : null;
      const author = state.showAuthor && state.authorText.trim() ? state.authorText.trim() : null;
      return title || author ? { title, author } : null;
    }
    function renderPreview() {
      if (!previewCard || !previewText)
        return;
      const m = cardMetrics();
      const family = resolvedFontFamily();
      previewCard.style.width = `${state.cardWidth}px`;
      previewCard.style.padding = `${m.padding}px`;
      previewCard.style.borderRadius = `${state.cornerRadius}px`;
      previewCard.style.minHeight = state.heightMode === "fixed" ? `${state.cardHeight}px` : "";
      previewBodyWrap.style.justifyContent = state.heightMode === "fixed" && state.vAlign === "center" ? "center" : "flex-start";
      previewBodyWrap.style.flex = state.heightMode === "fixed" ? "1" : "0 0 auto";
      if (state.bg.mode === "image" && state.bg.imageData) {
        previewCard.style.backgroundColor = "#000";
        previewCard.style.backgroundImage = `linear-gradient(rgba(0,0,0,${state.bg.dim}), rgba(0,0,0,${state.bg.dim})), linear-gradient(rgba(255,255,255,${state.bg.bright}), rgba(255,255,255,${state.bg.bright})), url("${state.bg.imageData.src}")`;
        previewCard.style.backgroundSize = "cover, cover, cover";
        previewCard.style.backgroundPosition = "center, center, center";
        previewCard.style.backgroundRepeat = "no-repeat, no-repeat, no-repeat";
      } else {
        const base = state.bg.mode === "solid" ? state.bg.color : TEXTURES[state.bg.texture].base;
        const patternInk = hexToRgba(state.textColor, 0.08);
        const layers = [];
        const sizes = [];
        const positions = [];
        const repeats = [];
        if (state.bg.pattern === "grain") {
          const g = grainSpecFor();
          layers.push(`url("${grainTile(base, g.dark, g.light).toDataURL("image/png")}")`);
          sizes.push("256px 256px");
          positions.push("0 0");
          repeats.push("repeat");
        } else if (state.bg.pattern === "grid") {
          layers.push(`repeating-linear-gradient(to right, ${patternInk} 0 1px, transparent 1px 24px)`);
          sizes.push("auto");
          positions.push("0 0");
          repeats.push("repeat");
          layers.push(`repeating-linear-gradient(to bottom, ${patternInk} 0 1px, transparent 1px 24px)`);
          sizes.push("auto");
          positions.push("0 0");
          repeats.push("repeat");
        } else if (state.bg.pattern === "lines") {
          const ruleOff = Math.round(m.lineHeight / 2 + state.fontSize * 0.71);
          layers.push(`repeating-linear-gradient(to bottom, transparent 0 ${m.lineHeight - 1}px, ${patternInk} ${m.lineHeight - 1}px ${m.lineHeight}px)`);
          sizes.push("auto");
          positions.push(`0 ${m.padding + ruleOff - m.lineHeight + 1}px`);
          repeats.push("repeat");
        }
        previewCard.style.backgroundColor = base;
        previewCard.style.backgroundImage = layers.length ? layers.join(", ") : "none";
        previewCard.style.backgroundSize = sizes.join(", ");
        previewCard.style.backgroundPosition = positions.join(", ");
        previewCard.style.backgroundRepeat = repeats.join(", ");
      }
      previewText.style.fontFamily = family;
      previewText.style.fontSize = `${state.fontSize}px`;
      previewText.style.lineHeight = `${m.lineHeight}px`;
      previewText.style.textAlign = state.align;
      previewText.style.color = state.textColor;
      previewText.textContent = "";
      const dlgMap = state.dialogueEnabled ? buildDialogueMap(state.text) : null;
      const points = new Set([0, state.text.length]);
      for (const mk of state.marks) {
        points.add(mk.start);
        points.add(mk.end);
      }
      if (dlgMap) {
        for (let i = 1;i < dlgMap.length; i++) {
          if (dlgMap[i] !== dlgMap[i - 1])
            points.add(i);
        }
        if (dlgMap.length > 0 && dlgMap[0])
          points.add(0);
      }
      const sorted = [...points].sort((a, b) => a - b);
      for (let i = 0;i < sorted.length - 1; i++) {
        const start = sorted[i];
        const end = sorted[i + 1];
        const chunk = state.text.slice(start, end);
        if (!chunk)
          continue;
        const type = markAt(start);
        const inDialogue = dlgMap ? dlgMap[start] === 1 : false;
        if (!type) {
          if (inDialogue) {
            const span = el("span");
            span.textContent = chunk;
            span.style.color = state.dialogueColor;
            previewText.appendChild(span);
          } else {
            previewText.appendChild(document.createTextNode(chunk));
          }
        } else {
          const span = el("span");
          span.textContent = chunk;
          if (type === CENSOR) {
            span.className = "bs-mark-censor";
          } else if (UNDERLINES[type]) {
            span.className = "bs-mark-ul";
            span.style.textDecorationColor = underlineColor(type);
            if (inDialogue)
              span.style.color = state.dialogueColor;
          } else {
            span.className = "bs-mark-hl";
            span.style.backgroundColor = highlightColor(type);
          }
          previewText.appendChild(span);
        }
      }
      previewFooter.textContent = "";
      const footerInfo = effectiveFooter();
      if (footerInfo) {
        const footerAlign = state.align === "justify" ? "left" : state.align;
        previewFooter.style.display = "";
        previewFooter.style.marginTop = `${m.gapAboveDivider}px`;
        previewFooter.style.borderTop = `1px solid ${hexToRgba(state.textColor, 0.22)}`;
        previewFooter.style.paddingTop = `${m.gapTitle}px`;
        previewFooter.style.textAlign = footerAlign;
        previewFooter.style.fontFamily = family;
        if (footerInfo.title) {
          const t = el("div", "bs-card-title", footerInfo.title);
          t.style.fontSize = `${m.titleSize}px`;
          t.style.color = state.textColor;
          previewFooter.appendChild(t);
        }
        if (footerInfo.author) {
          const a = el("div", "bs-card-author", footerInfo.author);
          a.style.fontSize = `${m.authorSize}px`;
          a.style.color = hexToRgba(state.textColor, 0.55);
          a.style.marginTop = footerInfo.title ? `${m.gapAuthor}px` : "0";
          previewFooter.appendChild(a);
        }
      } else {
        previewFooter.style.display = "none";
      }
    }
    function previewSelectionOffsets() {
      if (!previewText)
        return null;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed)
        return null;
      const range = sel.getRangeAt(0);
      if (!previewText.contains(range.startContainer) || !previewText.contains(range.endContainer))
        return null;
      const pre = range.cloneRange();
      pre.selectNodeContents(previewText);
      pre.setEnd(range.startContainer, range.startOffset);
      const start = pre.toString().length;
      const length = range.toString().length;
      if (length <= 0)
        return null;
      return { start, end: start + length };
    }
    function markSelection(type) {
      const offsets = previewSelectionOffsets();
      if (!offsets) {
        setStatus("먼저 미리보기에서 글자를 드래그하세요.");
        return;
      }
      applyMark(offsets.start, offsets.end, type);
      const sel = window.getSelection();
      if (sel)
        sel.removeAllRanges();
      setStatus("");
      renderPreview();
    }
    function glyphAt(str, k) {
      const cp = str.codePointAt(k);
      return cp > 65535 ? str.slice(k, k + 2) : str[k];
    }
    function tokenizeParagraph(paragraph, baseIndex) {
      const tokens = [];
      let i = 0;
      while (i < paragraph.length) {
        const ch = glyphAt(paragraph, i);
        if (/\s/.test(ch)) {
          tokens.push({ kind: "space", text: " ", index: baseIndex + i });
          i += 1;
        } else if (CJK_RE.test(ch)) {
          tokens.push({ kind: "cjk", text: ch, index: baseIndex + i });
          i += 1;
        } else {
          let j = i;
          while (j < paragraph.length && !/\s/.test(paragraph[j]) && !CJK_RE.test(glyphAt(paragraph, j)))
            j += glyphAt(paragraph, j).length;
          tokens.push({ kind: "word", text: paragraph.slice(i, j), index: baseIndex + i });
          i = j;
        }
      }
      return tokens;
    }
    function layoutLines(ctx, maxWidth) {
      const widthOf = (text) => ctx.measureText(text).width;
      const lines = [];
      let cursor = 0;
      const paragraphs = state.text.split(`
`);
      for (const paragraph of paragraphs) {
        const tokens = tokenizeParagraph(paragraph, cursor);
        let line = [];
        let lineWidth = 0;
        const pushLine = (isParagraphEnd) => {
          while (line.length && line[line.length - 1].kind === "space") {
            lineWidth -= line.pop().width;
          }
          lines.push({ tokens: line, width: lineWidth, paragraphEnd: isParagraphEnd });
          line = [];
          lineWidth = 0;
        };
        for (const token of tokens) {
          const w = widthOf(token.text);
          const entry = { ...token, width: w };
          if (token.kind === "space" && line.length === 0)
            continue;
          if (lineWidth + w > maxWidth && line.length > 0 && token.kind !== "space") {
            pushLine(false);
          }
          if (entry.width > maxWidth && entry.kind === "word") {
            let piece = "";
            let pieceStart = entry.index;
            for (let k = 0;k < entry.text.length; ) {
              const glyph = glyphAt(entry.text, k);
              const next = piece + glyph;
              if (widthOf(next) > maxWidth && piece) {
                const pw = widthOf(piece);
                if (lineWidth + pw > maxWidth && line.length > 0)
                  pushLine(false);
                line.push({ kind: "word", text: piece, index: pieceStart, width: pw });
                lineWidth += pw;
                pushLine(false);
                piece = glyph;
                pieceStart = entry.index + k;
              } else {
                piece = next;
              }
              k += glyph.length;
            }
            if (piece) {
              const pw = widthOf(piece);
              if (lineWidth + pw > maxWidth && line.length > 0)
                pushLine(false);
              line.push({ kind: "word", text: piece, index: pieceStart, width: pw });
              lineWidth += pw;
            }
            continue;
          }
          line.push(entry);
          lineWidth += entry.width;
        }
        pushLine(true);
        cursor += paragraph.length + 1;
      }
      return lines;
    }
    function drawBackground(ctx, width, height) {
      if (state.bg.mode === "image" && state.bg.imageData) {
        const img = state.bg.imageData;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
        if (state.bg.bright > 0) {
          ctx.fillStyle = `rgba(255,255,255,${state.bg.bright})`;
          ctx.fillRect(0, 0, width, height);
        }
        if (state.bg.dim > 0) {
          ctx.fillStyle = `rgba(0,0,0,${state.bg.dim})`;
          ctx.fillRect(0, 0, width, height);
        }
        return;
      }
      const m = cardMetrics();
      const base = state.bg.mode === "solid" ? state.bg.color : TEXTURES[state.bg.texture].base;
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);
      const patternInk = hexToRgba(state.textColor, 0.08);
      if (state.bg.pattern === "grain") {
        const g = grainSpecFor();
        const pattern = ctx.createPattern(grainTile(base, g.dark, g.light), "repeat");
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
      } else if (state.bg.pattern === "grid") {
        ctx.fillStyle = patternInk;
        for (let gx = 0;gx <= width; gx += 24)
          ctx.fillRect(gx, 0, 1, height);
        for (let gy = 0;gy <= height; gy += 24)
          ctx.fillRect(0, gy, width, 1);
      } else if (state.bg.pattern === "lines") {
        ctx.fillStyle = patternInk;
        const ruleOff = Math.round(m.lineHeight / 2 + state.fontSize * 0.71);
        for (let ly = m.padding + ruleOff;ly < height - 4; ly += m.lineHeight) {
          ctx.fillRect(0, ly, width, 1);
        }
      }
    }
    async function exportPng() {
      setStatus("이미지를 만드는 중…");
      const family = resolvedFontFamily();
      const m = cardMetrics();
      try {
        const sample = `${state.text}${state.titleText}${state.authorText}발췌`;
        await document.fonts.load(`${state.fontSize}px ${family}`, sample);
        await document.fonts.load(`700 ${m.titleSize}px ${family}`, sample);
        await document.fonts.ready;
      } catch {}
      const scale = 2;
      const contentWidth = state.cardWidth - m.padding * 2;
      const measure = document.createElement("canvas").getContext("2d");
      measure.font = `${state.fontSize}px ${family}`;
      const lines = layoutLines(measure, contentWidth);
      const bodyHeight = Math.max(1, lines.length) * m.lineHeight;
      const footerInfo = effectiveFooter();
      let footerHeight = 0;
      if (footerInfo) {
        footerHeight = m.gapAboveDivider + 1 + m.gapTitle;
        if (footerInfo.title)
          footerHeight += Math.round(m.titleSize * 1.3);
        if (footerInfo.author)
          footerHeight += (footerInfo.title ? m.gapAuthor : 0) + Math.round(m.authorSize * 1.4);
      }
      const autoHeight = m.padding * 2 + bodyHeight + footerHeight;
      const cardHeight = state.heightMode === "fixed" ? Math.max(state.cardHeight, autoHeight) : autoHeight;
      const bodyAreaHeight = cardHeight - m.padding * 2 - footerHeight;
      const bodyOffset = state.heightMode === "fixed" && state.vAlign === "center" ? Math.max(0, (bodyAreaHeight - bodyHeight) / 2) : 0;
      const canvas = document.createElement("canvas");
      canvas.width = state.cardWidth * scale;
      canvas.height = cardHeight * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      if (state.cornerRadius > 0) {
        roundedPath(ctx, 0, 0, state.cardWidth, cardHeight, state.cornerRadius);
        ctx.clip();
      }
      drawBackground(ctx, state.cardWidth, cardHeight);
      ctx.font = `${state.fontSize}px ${family}`;
      ctx.textBaseline = "alphabetic";
      const metrics = measure.measureText("한Ag");
      const ascent = metrics.fontBoundingBoxAscent || state.fontSize * 0.82;
      const descent = metrics.fontBoundingBoxDescent || state.fontSize * 0.22;
      const dlgMap = state.dialogueEnabled ? buildDialogueMap(state.text) : null;
      const inkFor = (i) => {
        const t = markAt(i);
        if (t && HIGHLIGHTS[t])
          return INK;
        return dlgMap && dlgMap[i] ? state.dialogueColor : state.textColor;
      };
      lines.forEach((line, lineIndex) => {
        const baseline = m.padding + bodyOffset + lineIndex * m.lineHeight + (m.lineHeight + ascent - descent) / 2;
        let startX = m.padding;
        let spaceExtra = 0;
        const spaceCount = line.tokens.filter((t) => t.kind === "space").length;
        if (state.align === "center")
          startX = m.padding + (contentWidth - line.width) / 2;
        else if (state.align === "right")
          startX = m.padding + contentWidth - line.width;
        else if (state.align === "justify" && !line.paragraphEnd && spaceCount > 0) {
          spaceExtra = (contentWidth - line.width) / spaceCount;
        }
        const ulY = baseline + state.fontSize * 0.18 + 3;
        const ulThick = Math.max(1.5, state.fontSize * 0.1);
        let ulRun = null;
        const flushUl = () => {
          if (!ulRun)
            return;
          ctx.fillStyle = ulRun.color;
          ctx.fillRect(ulRun.x1, ulY, ulRun.x2 - ulRun.x1, ulThick);
          ulRun = null;
        };
        let x = startX;
        for (const token of line.tokens) {
          const tokenWidth = token.width + (token.kind === "space" ? spaceExtra : 0);
          let cx = x;
          for (let k = 0;k < token.text.length; ) {
            const glyph = glyphAt(token.text, k);
            const chWidth = token.text.length === glyph.length ? tokenWidth : measure.measureText(glyph).width;
            const type = markAt(token.index + k);
            if (type === CENSOR) {
              flushUl();
              ctx.fillStyle = "#111111";
              ctx.fillRect(cx - 0.5, baseline - ascent - 1, chWidth + 1, ascent + descent + 2);
            } else if (type && HIGHLIGHTS[type]) {
              flushUl();
              ctx.fillStyle = highlightColor(type);
              ctx.fillRect(cx - 0.5, baseline - ascent - 3, chWidth + 1, ascent + descent + 6);
            } else if (type && UNDERLINES[type]) {
              const color = underlineColor(type);
              if (ulRun && ulRun.color === color)
                ulRun.x2 = cx + chWidth;
              else {
                flushUl();
                ulRun = { color, x1: cx, x2: cx + chWidth };
              }
            } else {
              flushUl();
            }
            cx += chWidth;
            k += glyph.length;
          }
          x += tokenWidth;
        }
        flushUl();
        x = startX;
        for (const token of line.tokens) {
          const tokenWidth = token.width + (token.kind === "space" ? spaceExtra : 0);
          if (token.kind !== "space") {
            let uniform = true;
            for (let k = 1;k < token.text.length; k++) {
              if (markAt(token.index + k) !== markAt(token.index) || inkFor(token.index + k) !== inkFor(token.index)) {
                uniform = false;
                break;
              }
            }
            if (uniform) {
              if (markAt(token.index) !== CENSOR) {
                ctx.fillStyle = inkFor(token.index);
                ctx.fillText(token.text, x, baseline);
              }
            } else {
              let cx = x;
              for (let k = 0;k < token.text.length; ) {
                const glyph = glyphAt(token.text, k);
                const chWidth = measure.measureText(glyph).width;
                if (markAt(token.index + k) !== CENSOR) {
                  ctx.fillStyle = inkFor(token.index + k);
                  ctx.fillText(glyph, cx, baseline);
                }
                cx += chWidth;
                k += glyph.length;
              }
            }
          }
          x += tokenWidth;
        }
      });
      if (footerInfo) {
        const footerAlign = state.align === "justify" ? "left" : state.align;
        const alignX = (w) => footerAlign === "center" ? m.padding + (contentWidth - w) / 2 : footerAlign === "right" ? m.padding + contentWidth - w : m.padding;
        let y = m.padding + bodyAreaHeight + m.gapAboveDivider;
        ctx.fillStyle = hexToRgba(state.textColor, 0.22);
        ctx.fillRect(m.padding, y, contentWidth, 1);
        y += 1 + m.gapTitle;
        if (footerInfo.title) {
          ctx.font = `700 ${m.titleSize}px ${family}`;
          let title = footerInfo.title;
          if (ctx.measureText(title).width > contentWidth) {
            while (title.length > 1 && ctx.measureText(`${title}…`).width > contentWidth)
              title = title.slice(0, -1);
            title = `${title}…`;
          }
          ctx.fillStyle = state.textColor;
          ctx.fillText(title, alignX(ctx.measureText(title).width), y + m.titleSize);
          y += Math.round(m.titleSize * 1.3) + m.gapAuthor;
        }
        if (footerInfo.author) {
          ctx.font = `500 ${m.authorSize}px ${family}`;
          try {
            ctx.letterSpacing = `${Math.round(m.authorSize * 0.18)}px`;
          } catch {}
          ctx.fillStyle = hexToRgba(state.textColor, 0.55);
          ctx.fillText(footerInfo.author, alignX(ctx.measureText(footerInfo.author).width), y + m.authorSize);
          try {
            ctx.letterSpacing = "0px";
          } catch {}
        }
      }
      await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("toBlob 실패"));
            return;
          }
          const stamp = new Date;
          const pad2 = (n) => String(n).padStart(2, "0");
          const name = `발췌_${stamp.getFullYear()}${pad2(stamp.getMonth() + 1)}${pad2(stamp.getDate())}_${pad2(stamp.getHours())}${pad2(stamp.getMinutes())}${pad2(stamp.getSeconds())}.png`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          resolve();
        }, "image/png");
      });
      setStatus("저장했습니다. 다운로드 폴더를 확인하세요.");
    }
    LV.ready({ open: openModal, close: closeModal });
    if (typeof marinara !== "undefined" && marinara.log) {
      marinara.log.info("발췌 스튜디오 v2가 준비되었습니다. 채팅에서 글을 드래그해 보세요.");
    }
  })();
}

// src/styles.generated.js
var CSS = `/* ── 발췌 스튜디오 v2 · 저널 미니멀 ───────────────
   팔레트: 웜 화이트 #FBFBFA · 오프블랙 잉크 #2F3437
   보조 그레이 #787774 · 헤어라인 #EAEAEA
   포인트: 딥 레드 #9F2F2D (페일 레드 #FDEBEC 위)
──────────────────────────────────────────────── */

.bs-fab {
  position: fixed;
  z-index: 2147483200;
  display: none;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border: 1px solid #eaeaea;
  border-radius: 999px;
  background: #ffffff;
  color: #2f3437;
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.08);
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.bs-fab:hover {
  transform: scale(0.98);
  border-color: #dddddd;
}
.bs-fab-mark {
  color: #9f2f2d;
  font-size: 0.95rem;
  line-height: 1;
}

.bs-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem;
  background: rgba(24, 23, 21, 0.45);
  backdrop-filter: blur(4px);
}

.bs-panel {
  display: flex;
  flex-direction: column;
  width: min(1100px, 100%);
  max-height: min(92vh, 100%);
  border: 1px solid #eaeaea;
  border-radius: 12px;
  background: #fbfbfa;
  color: #2f3437;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.bs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.4rem;
  border-bottom: 1px solid #eaeaea;
  background: rgba(255, 255, 255, 0.55);
}
.bs-header-left {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}
.bs-title {
  font-family: "Noto Serif KR", "Nanum Myeongjo", Batang, serif;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.bs-subtitle {
  font-family: Consolas, "SF Mono", monospace;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: #787774;
}
.bs-icon-btn {
  border: none;
  background: transparent;
  color: #787774;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
}
.bs-icon-btn:hover {
  background: #f1f0ee;
  color: #2f3437;
}

.bs-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.bs-preview-wrap {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 2rem;
  background: #f1f0ee;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.bs-card {
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 12px 40px rgba(0, 0, 0, 0.14);
  background-repeat: repeat;
}
.bs-card-body {
  display: flex;
  flex-direction: column;
}
.bs-card-text {
  white-space: pre-wrap;
  overflow-wrap: break-word;
  cursor: text;
}
.bs-card-text::selection,
.bs-card-text *::selection {
  background: rgba(159, 47, 45, 0.22);
}
.bs-card-title {
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
}
.bs-card-author {
  font-weight: 500;
  letter-spacing: 0.18em;
  line-height: 1.4;
}

.bs-mark-hl {
  padding: 2px 0;
  border-radius: 2px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  color: #2f3437;
}
.bs-mark-ul {
  text-decoration: underline;
  text-decoration-thickness: 0.1em;
  text-underline-offset: calc(0.18em + 3px);
}
.bs-mark-censor {
  background: #111111;
  color: transparent;
  border-radius: 2px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.bs-controls {
  width: 364px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 1.1rem 1.3rem 1.5rem;
  border-left: 1px solid #eaeaea;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.bs-section-title {
  margin-top: 0.9rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #eaeaea;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  color: #787774;
  text-transform: uppercase;
}
.bs-section-title:first-child {
  margin-top: 0;
}

.bs-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.bs-label {
  flex-shrink: 0;
  min-width: 3.4rem;
  font-size: 0.8rem;
  color: #2f3437;
}
.bs-label-auto {
  min-width: 0;
}
.bs-push {
  margin-left: auto;
}
.bs-num {
  flex-shrink: 0;
  width: 3.7rem;
  padding: 0.35rem 0.4rem;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background: #ffffff;
  color: #2f3437;
  font-family: Consolas, "SF Mono", monospace;
  font-size: 0.74rem;
  text-align: right;
}
.bs-num:focus {
  outline: none;
  border-color: #b9b7b2;
}
.bs-hint {
  font-size: 0.73rem;
  color: #787774;
  line-height: 1.45;
}

.bs-slider {
  flex: 1;
  min-width: 0;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #e3e1dc;
  outline: none;
}
.bs-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #2f3437;
  border: 2.5px solid #fbfbfa;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}
.bs-slider::-moz-range-thumb {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #2f3437;
  border: 2.5px solid #fbfbfa;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}
.bs-select {
  flex: 1;
  min-width: 0;
  padding: 0.42rem 0.5rem;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background: #ffffff;
  color: #2f3437;
  font-size: 0.8rem;
}
.bs-select:focus {
  outline: none;
  border-color: #b9b7b2;
}
.bs-input {
  flex: 1;
  min-width: 0;
  padding: 0.42rem 0.55rem;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background: #ffffff;
  color: #2f3437;
  font-size: 0.8rem;
}
.bs-input::placeholder {
  color: #b3b1ac;
}
.bs-input:focus {
  outline: none;
  border-color: #b9b7b2;
}
.bs-color {
  width: 2.5rem;
  height: 1.75rem;
  padding: 0.1rem;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}

.bs-seg {
  display: flex;
  gap: 0.3rem;
}
.bs-seg-btn {
  flex: 1;
  padding: 0.42rem 0.2rem;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background: #ffffff;
  color: #2f3437;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.12s ease;
}
.bs-seg-btn:hover {
  background: #f5f4f2;
}
.bs-seg-btn.bs-active {
  border-color: #2f3437;
  background: #2f3437;
  color: #ffffff;
  font-weight: 600;
}

.bs-mark-row {
  display: flex;
  flex-wrap: wrap; /* 견본이 늘어 좁은 폭에서는 다음 줄로 */
  gap: 0.45rem;
  align-items: center;
}
.bs-swatch {
  width: 2.05rem;
  height: 2.05rem;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.76rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease;
}
.bs-swatch:hover {
  transform: scale(0.96);
}
.bs-swatch-censor {
  background: #111111;
  color: #111111;
  border-color: #111111;
}
.bs-swatch-erase {
  background: #ffffff;
  color: #787774;
  border: 1px dashed #cfcdc8;
  width: auto;
  padding: 0 0.55rem;
  white-space: nowrap;
}
.bs-swatch-erase:hover {
  color: #2f3437;
}
.bs-swatch-wrap {
  position: relative;
  display: inline-flex;
}
.bs-swatch-badge {
  position: absolute;
  right: -0.25rem;
  bottom: -0.25rem;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.15rem;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.18);
  color: #2f3437;
  font-size: 0.6rem;
  font-weight: 700;
  line-height: 0.9rem;
  text-align: center;
  cursor: pointer;
  user-select: none;
}
.bs-swatch-badge:hover {
  background: #f1f0ee;
}
.bs-swatch-picker {
  /* 뱃지(label)를 누르면 열리는 색 선택기. 화면에는 보이지 않는다. */
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.bs-rules {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.bs-rule-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.bs-rule-arrow {
  flex-shrink: 0;
  font-size: 0.72rem;
  color: #787774;
}
.bs-rule-remove {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: #b3b1ac;
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0.25rem 0.3rem;
  border-radius: 4px;
}
.bs-rule-remove:hover {
  background: #fdebec;
  color: #9f2f2d;
}

.bs-check-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.bs-revert {
  flex-shrink: 0;
  padding: 0.2rem 0.4rem;
  font-size: 0.9rem;
  line-height: 1;
}
.bs-revert--off {
  /* 숨겨도 자리는 남겨 제목·작가 입력칸 폭이 같게 (hidden 속성은 엔진 CSS가 display:none !important로 덮음) */
  visibility: hidden;
  pointer-events: none;
}
.bs-check {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  accent-color: #2f3437;
  cursor: pointer;
}

.bs-tex-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.bs-tex-btn {
  flex: 1;
  padding: 0.42rem 0.3rem;
  text-align: center;
  white-space: nowrap;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease;
}
.bs-tex-btn:hover {
  transform: scale(0.97);
}

.bs-btn {
  padding: 0.48rem 0.9rem;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background: #ffffff;
  color: #2f3437;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.12s ease;
}
.bs-btn:hover {
  background: #f5f4f2;
}
.bs-btn-slim {
  align-self: flex-start;
  padding: 0.38rem 0.7rem;
  font-size: 0.75rem;
}
.bs-btn-primary {
  border-color: #9f2f2d;
  background: #9f2f2d;
  color: #ffffff;
}
.bs-btn-primary:hover {
  background: #b03a37;
  border-color: #b03a37;
}

.bs-footer {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.4rem;
  border-top: 1px solid #eaeaea;
  background: rgba(255, 255, 255, 0.55);
}
.bs-status {
  flex: 1;
  font-size: 0.75rem;
  color: #787774;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 모바일 · 좁은 화면 */
@media (max-width: 760px) {
  .bs-overlay {
    padding: 0.6rem;
  }
  .bs-body {
    flex-direction: column;
    overflow-y: auto;
  }
  .bs-preview-wrap {
    flex: none;
    max-height: 44vh;
    padding: 1rem;
  }
  .bs-controls {
    width: auto;
    border-left: none;
    border-top: 1px solid #eaeaea;
    overflow-y: visible;
  }
}

/* Host theme recipe copied/adapted from lv-translator 0.2.1 src/frontend.ts.
   --lumiverse-bg is authoritative even with custom background themes. */
.bs-overlay, .bs-fab {
  --ex-bg: var(--lumiverse-bg, Canvas);
  --ex-text: var(--lumiverse-text, CanvasText);
  --ex-accent: var(--lumiverse-primary, currentColor);
  --ex-edge: color-mix(in srgb, var(--ex-text) 24%, transparent);
  color: var(--ex-text); font-size: 15px;
}
.bs-overlay, .bs-overlay *, .bs-fab { box-sizing: border-box; }
.bs-panel { background: var(--ex-bg); background-image: none !important; color: var(--ex-text); border-color: var(--ex-edge); }
.bs-header, .bs-footer { background: var(--ex-bg); border-color: var(--ex-edge); flex-shrink: 0; }
.bs-controls { width: 390px; color: var(--ex-text); border-color: var(--ex-edge); }
.bs-preview-wrap { background: color-mix(in srgb, var(--ex-text) 7%, var(--ex-bg)); }
.bs-controls :is(.bs-label,.bs-hint,.bs-section-title,.bs-rule-arrow), .bs-subtitle, .bs-status { color: var(--ex-text); font-size: 15px; }
.bs-title { font-size: 18px; }
.bs-header-left { flex-wrap: wrap; gap: 4px 12px; }
.bs-subtitle { letter-spacing: .03em; }
.bs-overlay :is(button,select,input:not([type=file]):not(.bs-swatch-picker)), .bs-fab {
  min-height: 44px; min-width: 44px; font-size: 15px; touch-action: manipulation;
}
.bs-overlay :is(.bs-btn,.bs-icon-btn,.bs-select,.bs-input,.bs-num,.bs-seg-btn,.bs-rule-remove,.bs-swatch-erase),
.lv-excerpt-picker :is(button,select), .bs-fab {
  background: var(--ex-bg); color: var(--ex-text); border: 1px solid var(--ex-edge); border-radius: 6px;
}
.bs-overlay :is(.bs-btn-primary,.bs-seg-btn.bs-active), .lv-excerpt-picker button[aria-pressed=true] {
  background: color-mix(in srgb, var(--ex-accent) 25%, var(--ex-bg));
  color: var(--ex-text); border-color: var(--ex-accent);
}
.bs-overlay :is(button,select,input):focus-visible {
  outline: 2px solid var(--ex-accent); outline-offset: 2px;
}
.bs-input::placeholder { color: color-mix(in srgb, var(--ex-text) 75%, transparent); }
.bs-slider { height: 44px; background: linear-gradient(var(--ex-edge),var(--ex-edge)) center / 100% 4px no-repeat; }
.bs-check { accent-color: var(--ex-accent); }
.bs-swatch-badge { position: static; display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; margin-left: 4px; background: var(--ex-bg); color: var(--ex-text); font-size: 15px; }
.bs-swatch-censor { color: white; }
.bs-footer { flex-wrap: wrap; padding: 10px 16px; }
.bs-status { white-space: normal; flex: 1 1 140px; }
.bs-fab { padding: 8px 14px; }
.bs-fab-mark { color: var(--ex-accent); }
/* Match the host's 28px action box at every width; host classes supply color and hover. */
.lv-excerpt-action {
  display: inline-flex; align-items: center; justify-content: center;
  box-sizing: border-box; width: 28px; height: 28px; min-width: 28px; min-height: 28px;
  flex: 0 0 28px; padding: 0; touch-action: manipulation;
}
.lv-excerpt-action > svg { display: block; width: 13px; height: 13px; flex-shrink: 0; }
.lv-excerpt-action-fallback {
  border: 0; border-radius: 6px;
  background: transparent; color: var(--lumiverse-text-muted, var(--lumiverse-text, CanvasText));
  cursor: pointer;
}
.lv-excerpt-action-fallback:hover {
  background: var(--lumiverse-fill-hover, color-mix(in srgb, currentColor 10%, transparent));
  color: var(--lumiverse-text, CanvasText);
}
.lv-excerpt-action:focus-visible {
  outline: 2px solid var(--lumiverse-primary, currentColor); outline-offset: 2px;
}

.lv-excerpt-picker { border-bottom: 1px solid var(--ex-edge); padding-bottom: 16px; }
.lv-excerpt-picker h3 { margin: 0 0 8px; font-size: 17px; }
.lv-excerpt-picker p { font-size: 15px; line-height: 1.5; }
.lv-excerpt-picker select { width: 100%; }
.lv-excerpt-pieces { display: grid; gap: 6px; margin: 8px 0; max-height: 240px; overflow: auto; }
.lv-excerpt-pieces button { text-align: left; white-space: pre-wrap; overflow-wrap: anywhere; padding: 8px; }
.lv-excerpt-picker-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.lv-excerpt-picker-actions button { padding: 6px 10px; }
.lv-excerpt-picker button:disabled { opacity: .6; }
@media(max-width:760px) {
  .bs-overlay { padding: 0; height: 100dvh; }
  .bs-panel { width: 100%; height: 100%; max-height: 100dvh; border-radius: 0; }
  .bs-header { padding: calc(env(safe-area-inset-top,0px) + 8px) 58px 8px 12px; }
  .bs-subtitle { display: none; }
  .bs-body { flex-direction: column; overflow-y: auto; overscroll-behavior: contain; }
  .bs-preview-wrap { flex: none; overflow: visible; max-height: none; padding: 12px; }
  .bs-controls { width: 100%; overflow: visible; padding: 16px 12px; }
  .bs-row { flex-wrap: wrap; gap: 6px; }
  .bs-footer { padding: 8px max(12px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px)); gap: 6px; }
  .bs-status { flex-basis: 100%; }
}
@media(max-width:720px) {
  .bs-header .bs-icon-btn { display: none; }
}
.bs-fab-mark { font-size: 15px; }
`;

// src/shim.js
var RIDI_URL = "https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff";
function createShim(ctx, { win = window, doc = document } = {}) {
  const cleanups = [];
  const active = () => ctx.getActiveChat();
  const storage = {
    getItem(key) {
      if (key === "marinara-active-chat-id")
        return active()?.chatId || "";
      try {
        return win.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        win.localStorage.setItem(key, value);
      } catch {}
    }
  };
  const response = (data) => ({ ok: true, json: async () => data });
  async function fetchCompat(url, init) {
    if (url === "/api/fonts") {
      const faces = [];
      doc.fonts?.forEach((face) => faces.push({ family: String(face.family).replace(/^["']|["']$/g, ""), url: "", weight: face.weight, style: face.style }));
      return response(faces);
    }
    if (url.startsWith("/api/chats/")) {
      const id = decodeURIComponent(url.slice("/api/chats/".length));
      const { chatId, characterId } = active() || {};
      if (id !== chatId)
        return response({ name: "" });
      const chats = characterId ? await ctx.chats.listForCharacter(characterId) : [];
      let chat = chats.find((chat) => chat.id === id);
      if (!chat && typeof ctx.chats.listRecent === "function") {
        for (let offset = 0;; ) {
          if (active()?.chatId !== id)
            break;
          const page = await ctx.chats.listRecent({ limit: 100, offset });
          const rows = page.data || [];
          chat = rows.find((row) => row.id === id);
          if (chat || rows.length === 0 || offset + rows.length >= page.total)
            break;
          offset += rows.length;
        }
      }
      return response({ name: chat?.name || "" });
    }
    if (url === RIDI_URL)
      return win.fetch(url, { ...init, credentials: "omit" });
    throw Error("Unsupported original request");
  }
  return {
    storage,
    fetch: fetchCompat,
    marinara: { log: { info() {}, warn: (...args) => console.warn(...args) }, onCleanup: (fn) => cleanups.push(fn) },
    dispose() {
      for (const fn of cleanups.splice(0).reverse())
        fn();
    }
  };
}

// src/overlay-guard.js
var GUARD_CSS = `
:host{all:initial;position:fixed;top:0;right:0;z-index:2147483647;pointer-events:none;display:block}
button{pointer-events:auto;position:fixed;top:calc(env(safe-area-inset-top,0px) + 2px);right:calc(env(safe-area-inset-right,0px) + 6px);width:44px;height:44px;min-width:44px;min-height:44px;padding:0;margin:0;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:var(--lumiverse-bg,Canvas);color:var(--lumiverse-text,CanvasText);border:2px solid currentColor;box-shadow:0 0 0 1px rgba(0,0,0,.55),0 4px 14px rgba(0,0,0,.45);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
button:active{background:color-mix(in srgb,currentColor 15%,var(--lumiverse-bg,Canvas))}
button:focus-visible{outline:3px solid var(--lumiverse-primary,currentColor);outline-offset:2px}
svg{width:22px;height:22px;display:block}
/* Above phone width, use the screen's own close button regardless of input device. */
@media (min-width:721px){button{display:none}}
`;
var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function createOverlayGuard({ doc = globalThis.document, win = globalThis.window } = {}) {
  const stack = [];
  let host = null, btn = null, ignoreAt = 0, seq = 0;
  const mark = "__excerptOverlay";
  const ensureButton = () => {
    if (host)
      return;
    host = doc.createElement("div");
    host.id = "excerpt-overlay-guard";
    const root = host.attachShadow({ mode: "open" });
    const st = doc.createElement("style");
    st.textContent = GUARD_CSS;
    btn = doc.createElement("button");
    btn.type = "button";
    btn.innerHTML = ICON;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeTop();
    });
    root.append(st, btn);
  };
  const paint = () => {
    if (!stack.length) {
      if (host)
        host.remove();
      return;
    }
    ensureButton();
    const top = stack[stack.length - 1];
    btn.setAttribute("aria-label", top.label);
    btn.title = top.label;
    doc.documentElement.append(host);
  };
  function closeTop() {
    const top = stack[stack.length - 1];
    if (top) {
      try {
        top.close();
      } catch {}
    }
  }
  const onPop = () => {
    if (ignoreAt && Date.now() - ignoreAt < 700) {
      ignoreAt = 0;
      return;
    }
    ignoreAt = 0;
    const top = stack[stack.length - 1];
    if (!top)
      return;
    top.pushed = false;
    try {
      top.close();
    } catch {}
  };
  const onKey = (e) => {
    if (e.key !== "Escape" || e.defaultPrevented)
      return;
    const top = stack[stack.length - 1];
    if (top && top.escape) {
      try {
        top.close();
      } catch {}
    }
  };
  win.addEventListener("popstate", onPop);
  win.addEventListener("keydown", onKey);
  return {
    register({ label, close, escape = false }) {
      const entry = { id: ++seq, label, close, escape, pushed: false };
      return {
        sync(open) {
          const at = stack.indexOf(entry);
          if (open && at < 0) {
            stack.push(entry);
            try {
              win.history.pushState({ ...win.history.state, [mark]: entry.id }, "");
              entry.pushed = true;
            } catch {}
          } else if (open && at >= 0 && at !== stack.length - 1) {
            stack.push(...stack.splice(at, 1));
          } else if (!open && at >= 0) {
            stack.splice(at, 1);
            if (entry.pushed) {
              entry.pushed = false;
              try {
                if (win.history.state && win.history.state[mark] === entry.id) {
                  ignoreAt = Date.now();
                  win.history.back();
                }
              } catch {}
            }
          }
          paint();
        }
      };
    },
    isOpen: () => stack.length > 0,
    dispose() {
      win.removeEventListener("popstate", onPop);
      win.removeEventListener("keydown", onKey);
      stack.length = 0;
      if (host)
        host.remove();
    }
  };
}

// src/toolbar.js
var BUBBLE_ROW = '[data-component="BubbleActions"]';
var QUOTE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote" aria-hidden="true" focusable="false"><path d="M10 3H7a4 4 0 0 0-4 4v10h7V9H3m18-6h-3a4 4 0 0 0-4 4v10h7V9h-7"/></svg>';
function findActionRow(messageEl) {
  const footer = messageEl.querySelector('[data-spindle-mount="message_footer"]');
  const next = footer?.parentElement?.nextElementSibling;
  if (!next)
    return null;
  if (next.matches(BUBBLE_ROW))
    return next;
  const candidates = [next, next.firstElementChild];
  for (const c of candidates) {
    if (!(c instanceof HTMLElement))
      continue;
    const buttons = Array.from(c.children).filter((x) => x.tagName === "BUTTON");
    if (buttons.length >= 3)
      return c;
  }
  return null;
}
function mountToolbars(ctx, onOpen) {
  const slots = new Map;
  let unregister = null, timer = null, destroyed = false;
  const attach = (slot, id, own) => {
    slot.dataset.excerptToolbar = id;
    slot.style.display = "contents";
    const button = document.createElement("button");
    const row = slot.closest(BUBBLE_ROW) || slot.parentElement;
    const ref = row?.querySelector(":scope > button:not(.lv-excerpt-action)");
    button.type = "button";
    button.className = ref?.className || "lv-excerpt-action-fallback";
    button.classList.add("lv-excerpt-action");
    button.innerHTML = QUOTE_SVG;
    button.title = "이 메시지 발췌";
    button.setAttribute("aria-label", "이 메시지 발췌");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onOpen(id);
    });
    slots.set(slot, { id, own });
    slot.replaceChildren(button);
  };
  if (typeof ctx.ui?.registerDomDecorator === "function") {
    const scopeId = (scope) => /^message:(.+):actions$/.exec(scope)?.[1];
    try {
      const handle = ctx.ui.registerDomDecorator({
        mount: "message_actions",
        render(root, context) {
          const id = scopeId(context.scope);
          if (id)
            attach(root, id, false);
          return () => {
            slots.delete(root);
            root.replaceChildren();
          };
        },
        update(root, context) {
          const id = scopeId(context.scope);
          if (id && (slots.get(root)?.id !== id || !root.firstChild))
            attach(root, id, false);
        }
      });
      unregister = typeof handle === "function" ? handle : () => handle?.destroy?.();
    } catch {}
  }
  function scan() {
    if (destroyed)
      return;
    for (const [slot, meta] of slots)
      if (meta.own && !slot.isConnected)
        slots.delete(slot);
    for (const { messageId, element } of ctx.dom.listMessageElements()) {
      const existing = element.querySelector("[data-excerpt-toolbar]");
      if (existing) {
        if (slots.get(existing)?.id !== messageId)
          attach(existing, messageId, true);
        continue;
      }
      const row = findActionRow(element);
      if (!row || unregister && row.matches(BUBBLE_ROW))
        continue;
      const slot = document.createElement("span");
      row.appendChild(slot);
      attach(slot, messageId, true);
    }
  }
  const observer = new MutationObserver(() => {
    if (timer || destroyed)
      return;
    timer = setTimeout(() => {
      timer = null;
      scan();
    }, 120);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
  return { destroy() {
    destroyed = true;
    clearTimeout(timer);
    observer.disconnect();
    unregister?.();
    for (const [slot, meta] of slots) {
      if (meta.own)
        slot.remove();
      else
        slot.replaceChildren();
    }
    slots.clear();
  } };
}

// src/range-picker.js
function splitExcerpt(text, mode = "sentence") {
  if (mode === "paragraph")
    return text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter("ko", { granularity: "sentence" }).segment(text)].map((s) => s.segment.trim()).filter(Boolean);
  }
  return (text.match(/[^.!?。！？\n]+[.!?。！？]*[”"']*|[^\n]+/g) || []).map((s) => s.trim()).filter(Boolean);
}
function mountRangePicker({ overlay, text, setExcerpt, cropSelection }) {
  const controls = overlay.querySelector(".bs-controls");
  const section = document.createElement("section");
  section.className = "lv-excerpt-picker";
  const heading = document.createElement("h3");
  heading.textContent = "발췌할 범위";
  const hint = document.createElement("p");
  hint.textContent = "문장·문단을 눌러 고른 뒤 적용하세요. 범위를 바꾸면 마크가 지워집니다.";
  const mode = document.createElement("select");
  mode.setAttribute("aria-label", "발췌 단위");
  for (const [value, label] of [["sentence", "문장"], ["paragraph", "문단"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    mode.append(option);
  }
  const list = document.createElement("div");
  list.className = "lv-excerpt-pieces";
  let parts = [], selected = new Set;
  const button = (label, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  };
  function draw() {
    list.replaceChildren(...parts.map((part, i) => {
      const b = button(part, () => {
        selected.has(i) ? selected.delete(i) : selected.add(i);
        draw();
      });
      b.setAttribute("aria-pressed", String(selected.has(i)));
      return b;
    }));
    apply.disabled = selected.size === 0;
  }
  const apply = button("선택 범위 적용", () => setExcerpt(parts.filter((_, i) => selected.has(i)).join(mode.value === "paragraph" ? `

` : " ")));
  const all = button("전체 선택", () => {
    selected = new Set(parts.map((_, i) => i));
    draw();
  });
  const none = button("선택 해제", () => {
    selected.clear();
    draw();
  });
  const restore = button("본문 전체 복원", () => {
    setExcerpt(text);
    reset();
  });
  const crop = button("드래그한 부분만 남기기", cropSelection);
  crop.addEventListener("mousedown", (e) => e.preventDefault());
  function reset() {
    parts = splitExcerpt(text, mode.value);
    selected = new Set(parts.map((_, i) => i));
    draw();
  }
  mode.addEventListener("change", reset);
  const actions = document.createElement("div");
  actions.className = "lv-excerpt-picker-actions";
  actions.append(all, none, apply, restore, crop);
  section.append(heading, hint, mode, list, actions);
  controls.prepend(section);
  reset();
}

// src/adapter.js
var CONTENT = '[data-component="MessageContent"]';
var EXCLUDED = 'button, input, textarea, select, [contenteditable="true"], [data-spindle-ext], [data-spindle-mount], [data-spindle-extension-root]';
function messageBody(element) {
  return element?.querySelector(CONTENT) || null;
}
function messageText(element) {
  const body = messageBody(element);
  if (!body)
    return "";
  const win = body.ownerDocument.defaultView;
  const omitted = (el) => el.matches(EXCLUDED + ', [hidden], [aria-hidden="true"], template, script, style');
  const hidden = (style) => style.display === "none" || style.visibility === "hidden";
  const unslotted = (node) => node.parentElement?.shadowRoot && !node.assignedSlot;
  const renderedParent = (node) => node.assignedSlot || node.parentElement || node.getRootNode().host;
  for (let ancestor = body;ancestor; ancestor = renderedParent(ancestor)) {
    if (unslotted(ancestor) || omitted(ancestor) || hidden(win.getComputedStyle(ancestor)))
      return "";
  }
  function collect(node) {
    if (unslotted(node))
      return "";
    if (node.nodeType === 3)
      return node.textContent;
    if (node.nodeType !== 1 || omitted(node))
      return "";
    const style = win.getComputedStyle(node);
    if (hidden(style))
      return "";
    if (node.tagName === "BR")
      return `
`;
    let children = node.shadowRoot?.childNodes || node.childNodes;
    if (node.tagName === "SLOT" && node.getRootNode().host) {
      const assigned = node.assignedNodes();
      if (assigned.length)
        children = assigned;
    }
    const text = [...children].map(collect).join("");
    const block = /^(block|flow-root|flex|grid|list-item|table|table-row|table-caption)( |$)/.test(style.display);
    return block && text ? `

` + text + `

` : text;
  }
  return collect(body).replace(/\r\n/g, `
`).replace(/\n{3,}/g, `

`).trim();
}
function isMessageRange(ctx, range) {
  const elementOf = (n) => n.nodeType === 1 ? n : n.parentElement;
  const start = elementOf(range.startContainer), end = elementOf(range.endContainer);
  if (!start || !end || start.closest(EXCLUDED) || end.closest(EXCLUDED))
    return false;
  return ctx.dom.listMessageElements().some(({ element }) => {
    const body = messageBody(element);
    return body && body.contains(start) && body.contains(end) && ![...body.querySelectorAll(EXCLUDED)].some((el) => range.intersectsNode(el));
  });
}
function decorateModal(args) {
  const { overlay } = args;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "발췌 스튜디오");
  mountRangePicker(args);
  for (const field of overlay.querySelectorAll("input, select")) {
    if (field.type === "file")
      continue;
    const row = field.closest(".bs-row, .bs-check-row, .bs-rule-row");
    const label = field.placeholder || field.title || row?.querySelector("label")?.textContent || "설정";
    if (!field.hasAttribute("aria-label"))
      field.setAttribute("aria-label", label);
  }
  const close = overlay.querySelector(".bs-header button");
  close.setAttribute("aria-label", "스튜디오 닫기");
  close.focus({ preventScroll: true });
}

// src/frontend.js
function setup(ctx) {
  const shim = createShim(ctx), guard = createOverlayGuard();
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
  let original, entry, focusBefore, oldOverflow, disposed = false;
  const LV = {
    ready(api) {
      original = api;
    },
    isMessageRange: (range) => isMessageRange(ctx, range),
    onOpen(args) {
      focusBefore = document.activeElement;
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      entry = guard.register({ label: "스튜디오 닫기", close: args.close });
      entry.sync(true);
      decorateModal(args);
    },
    onClose() {
      entry?.sync(false);
      entry = null;
      document.body.style.overflow = oldOverflow || "";
      if (focusBefore?.isConnected)
        focusBefore.focus({ preventScroll: true });
    }
  };
  runOriginal(shim.marinara, LV, shim.fetch, shim.storage);
  const toolbar = mountToolbars(ctx, (id) => {
    const item = ctx.dom.listMessageElements().find((m) => m.messageId === id);
    const text = messageText(item?.element);
    if (text)
      original?.open(text);
  });
  function dispose() {
    if (disposed)
      return;
    disposed = true;
    original?.close();
    toolbar.destroy();
    shim.dispose();
    guard.dispose();
    style.remove();
  }
  ctx.onTeardown?.(dispose);
  return dispose;
}
export {
  setup
};
