(function () {
  const UTM_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"];
  const STORE_KEY = "vartia_utm_v1";
  const TTL_DAYS = 7;

  function nowMs() { return Date.now(); }
  function ttlMs() { return TTL_DAYS * 24 * 60 * 60 * 1000; }

  function readFromUrl() {
    const u = new URL(window.location.href);
    const out = {};
    for (const k of UTM_KEYS) {
      const v = u.searchParams.get(k);
      if (v) out[k] = v;
    }
    return out;
  }

  function loadStored() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj._ts) return null;
      if (nowMs() - obj._ts > ttlMs()) return null;
      delete obj._ts;
      return obj;
    } catch {
      return null;
    }
  }

  function store(params) {
    const obj = { ...params, _ts: nowMs() };
    localStorage.setItem(STORE_KEY, JSON.stringify(obj));
  }

  function mergeParams(existingSearch, utmObj) {
    const merged = new URLSearchParams(existingSearch);
    for (const [k, v] of Object.entries(utmObj)) {
      if (!merged.has(k)) merged.set(k, v);
    }
    return merged.toString();
  }

  function sameOriginOrRelative(href) {
    // Accept /foo, foo, ./foo, ../foo; also accept absolute to same origin
    try {
      const u = new URL(href, window.location.origin);
      return u.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function shouldRewriteLink(u) {
    // Only rewrite on-site posts + booking link
    return (
      u.pathname.startsWith("/posts/") ||
      u.pathname === "/book.html"
    );
  }

  function apply(utmObj) {
    if (!utmObj || Object.keys(utmObj).length === 0) return;

    const anchors = document.querySelectorAll("a[href]");
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      if (!sameOriginOrRelative(href)) return;

      const u = new URL(href, window.location.origin);
      if (!shouldRewriteLink(u)) return;

      u.search = mergeParams(u.search, utmObj);
      a.setAttribute("href", u.toString());
    });
  }

  // 1) If URL has UTMs, store them (and prefer them)
  const fromUrl = readFromUrl();
  if (Object.keys(fromUrl).length > 0) {
    store(fromUrl);
    // Apply immediately so all next clicks keep UTMs
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => apply(fromUrl));
    } else {
      apply(fromUrl);
    }
    return;
  }

  // 2) Otherwise, use stored UTMs (if any, and not expired)
  const stored = loadStored();
  if (stored) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => apply(stored));
    } else {
      apply(stored);
    }
  }
})();