// tm-guard.js
// Front-end route guard for iTRUEMATCH protected pages.
// Uses server session cookie via GET /api/me (credentials: include).
// If not authenticated, redirects to auth.html with a safe return URL.

function resolveApiBase() {
  // If a page explicitly sets window.API_BASE, respect it.
  if (typeof window !== "undefined" && typeof window.API_BASE === "string") return window.API_BASE;

  const host = window.location.hostname;
  // Local dev convenience: default API to localhost:3000 if running pages from Live Server.
  if (host === "127.0.0.1" || host === "localhost") return "http://localhost:3000";

  // Production: same-origin API.
  return "";
}

const API_BASE = resolveApiBase();

function buildReturnParam(returnTo) {
  const raw = returnTo || (window.location.pathname + window.location.search);
  // Always encode as a single param value.
  return encodeURIComponent(raw);
}

async function fetchMe({ timeoutMs = 6500 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" },
      signal: controller.signal
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    if (data && data.user) return data.user;

    return null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function requireAuthOrRedirect(options = {}) {
  const {
    loginPage = "auth.html",
    mode = "login",
    returnTo
  } = options;

  const me = await fetchMe();
  if (me) return me;

  const rt = buildReturnParam(returnTo);
  const url = `${loginPage}?mode=${encodeURIComponent(mode)}&return=${rt}`;
  window.location.replace(url);
  return null;
}

// Optional helper if you want to re-use the session user inside page scripts.
export async function getSessionUser() {
  return fetchMe();
}
