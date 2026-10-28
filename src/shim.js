// Lexically scoped Marinara compatibility, following the referenced ports' responseLike
// and onCleanup patterns. Does not replace host globals or touch host storage keys.
export const RIDI_URL = 'https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff';
export function createShim(ctx, { win = window, doc = document } = {}) {
  const cleanups = [];
  const active = () => ctx.getActiveChat();
  const storage = {
    getItem(key) {
      if (key === 'marinara-active-chat-id') return active()?.chatId || '';
      try { return win.localStorage.getItem(key); } catch { return null; }
    },
    setItem(key, value) { try { win.localStorage.setItem(key, value); } catch { /* device storage unavailable */ } },
  };
  const response = data => ({ ok: true, json: async () => data });
  async function fetchCompat(url, init) {
    if (url === '/api/fonts') {
      const faces = [];
      doc.fonts?.forEach(face => faces.push({ family: String(face.family).replace(/^["']|["']$/g, ''), url: '', weight: face.weight, style: face.style }));
      return response(faces);
    }
    if (url.startsWith('/api/chats/')) {
      const id = decodeURIComponent(url.slice('/api/chats/'.length));
      const { chatId, characterId } = active() || {};
      if (id !== chatId) return response({ name: '' });
      // Read-only frontend domain API; no backend or extra permissions required.
      const chats = characterId ? await ctx.chats.listForCharacter(characterId) : [];
      let chat = chats.find(chat => chat.id === id);
      // Group/character-less chats have no listForCharacter scope. Walk read-only recent pages.
      if (!chat && typeof ctx.chats.listRecent === 'function') {
        for (let offset = 0; ; ) {
          if (active()?.chatId !== id) break;
          const page = await ctx.chats.listRecent({ limit: 100, offset });
          const rows = page.data || [];
          chat = rows.find(row => row.id === id);
          if (chat || rows.length === 0 || offset + rows.length >= page.total) break;
          offset += rows.length;
        }
      }
      return response({ name: chat?.name || '' });
    }
    if (url === RIDI_URL) return win.fetch(url, { ...init, credentials: 'omit' });
    throw Error('Unsupported original request');
  }
  return {
    storage, fetch: fetchCompat,
    marinara: { log: { info() {}, warn: (...args) => console.warn(...args) }, onCleanup: fn => cleanups.push(fn) },
    dispose() { for (const fn of cleanups.splice(0).reverse()) fn(); },
  };
}
