// tm-session.js — shared helpers for localStorage state
//
// SECURITY NOTES (important):
// - localStorage is NOT a security boundary. Users can edit it via DevTools.
// - Treat anything stored here as "UI hints" only. Server must enforce entitlements.
//
// Goal of this v2 hardening:
// - Avoid writing fake placeholder users (prevents confusing auth states)
// - Make plan override explicitly non-authoritative
// - Keep backwards compatibility with dashboard.js expectations (clearSession, isAuthenticated)

export const PREFS_KEY = 'tm_prefs';
export const PREFS_MAP_KEY = 'tm_prefs_by_user';

function isDevHost() {
  try {
    const h = String(location.hostname || '').toLowerCase();
    // file:// => hostname is "" (treat as dev)
    if (!h) return true;
    return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
  } catch {
    return false;
  }
}


// -------- User helpers --------

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('tm_user') || 'null');
  } catch {
    return null;
  }
}

export function getCurrentUserEmail() {
  try {
    const u = getCurrentUser();
    const email = u && u.email;
    return email ? String(email).toLowerCase().trim() : null;
  } catch {
    return null;
  }
}

// Safer version: only stores a user if we have an email.
// If called with invalid data, it won't create a fake user.
export function saveLocalUser(u) {
  const email = u?.email ? String(u.email).toLowerCase().trim() : '';
  if (!email) return null;

  const minimal = {
    id: u?.id || 'local',
    email,
    name: (u?.name || 'User').trim(),
  };

  // Keep plan as UI hint only.
  if (u && u.plan) minimal.plan = u.plan;

  try {
    const dev = isDevHost();
    localStorage.setItem('tm_user', JSON.stringify(minimal));
    if (dev && u && u.plan) localStorage.setItem('tm_plan_override', u.plan);
    if (!dev) localStorage.removeItem('tm_plan_override');
  } catch {
    // ignore storage errors
  }

  return minimal;
}

// -------- Plan helpers (UI hint only; server must enforce) --------

export function getLocalPlan() {
  try {
    if (isDevHost()) {
      return (
        localStorage.getItem('tm_plan_override') ||
        (JSON.parse(localStorage.getItem('tm_user') || '{}').plan || null)
      );
    }
    return (JSON.parse(localStorage.getItem('tm_user') || '{}').plan || null);
  } catch {
    return null;
  }
}

export function setLocalPlan(plan) {
  if (!plan) return;
  if (!isDevHost()) return;
  try {
    localStorage.setItem('tm_plan_override', plan);
    const raw = JSON.parse(localStorage.getItem('tm_user') || '{}');
    raw.plan = plan;
    localStorage.setItem('tm_user', JSON.stringify(raw));
  } catch {
    // ignore
  }
}

export function clearPlanOverride() {
  try {
    localStorage.removeItem('tm_plan_override');
  } catch {
    // ignore
  }
}

// -------- Preferences helpers --------

export function getRawPrefsForCurrentUser() {
  try {
    const email = getCurrentUserEmail();
    if (email) {
      const rawMap = localStorage.getItem(PREFS_MAP_KEY);
      if (rawMap) {
        const map = JSON.parse(rawMap) || {};
        if (map && typeof map === 'object' && map[email]) return map[email];
      }
    }

    const legacy = localStorage.getItem(PREFS_KEY);
    if (legacy) return JSON.parse(legacy) || null;

    return null;
  } catch {
    return null;
  }
}

export function savePrefsForCurrentUser(prefs) {
  try {
    const email = getCurrentUserEmail();
    if (email) {
      let map = {};
      const rawMap = localStorage.getItem(PREFS_MAP_KEY);
      if (rawMap) {
        try { map = JSON.parse(rawMap) || {}; } catch { map = {}; }
      }
      map[email] = prefs;
      localStorage.setItem(PREFS_MAP_KEY, JSON.stringify(map));
    }

    // Legacy slot para sa ibang scripts
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function hasLocalPrefs() {
  return !!getRawPrefsForCurrentUser();
}

// -------- Generic JSON helpers + auth clear --------

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem('tm_user');
    localStorage.removeItem('tm_plan_override');
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem(PREFS_MAP_KEY);
  } catch {
    // ignore
  }
}

// dashboard.js expects clearSession
export const clearSession = clearAuth;

// IMPORTANT: This is only a local check.
// Real auth must be validated by calling /api/me.
export function isAuthenticated() {
  return !!getCurrentUser();
}

// Compatibility exports for Premium Society page
export function loadPrefsForUser(email) {
  try {
    const e = String(email || '').trim().toLowerCase();
    if (!e) return null;

    const rawMap = localStorage.getItem(PREFS_MAP_KEY);
    if (!rawMap) return null;

    const map = JSON.parse(rawMap) || {};
    return (map && typeof map === 'object') ? (map[e] || null) : null;
  } catch {
    return null;
  }
}

export function savePrefsForUser(email, prefs) {
  try {
    const e = String(email || '').trim().toLowerCase();
    if (!e) return;

    let map = {};
    const rawMap = localStorage.getItem(PREFS_MAP_KEY);
    if (rawMap) {
      try { map = JSON.parse(rawMap) || {}; } catch { map = {}; }
    }

    map[e] = prefs;
    localStorage.setItem(PREFS_MAP_KEY, JSON.stringify(map));

    // keep legacy slot in sync if this is the current user
    try {
      const rawUser = JSON.parse(localStorage.getItem('tm_user') || 'null');
      const curEmail = rawUser?.email ? String(rawUser.email).toLowerCase().trim() : null;
      if (curEmail && curEmail === e) {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      }
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// OPTIONAL SHARED ME CACHE (backend-first)
// - Keeps a lightweight in-memory cache of /api/me for pages that want it.
// - Updates window.__tmMe for cross-module usage (Creators app uses this).
// - Never treats localStorage as authoritative: server still enforces auth.
// ---------------------------------------------------------------------------

let __tmMeCache = null;
let __tmMeCacheAt = 0;
const __TM_ME_TTL_MS = 30 * 1000;

export function getCachedMe() {
  try {
    return __tmMeCache || (typeof window !== 'undefined' ? (window.__tmMe || null) : null);
  } catch {
    return __tmMeCache;
  }
}

export function setCachedMe(user) {
  __tmMeCache = user || null;
  __tmMeCacheAt = Date.now();
  try { if (typeof window !== 'undefined') window.__tmMe = user || null; } catch {}
}

export function dispatchMeUpdated(detail = {}) {
  try {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('tm:me-updated', { detail }));
  } catch {
    // ignore
  }
}

// Fetch /api/me and hydrate caches.
// NOTE: This does NOT replace real server checks; it's just a convenient getter.
export async function apiMe(force = false) {
  try {
    const now = Date.now();
    if (!force && __tmMeCache && (now - __tmMeCacheAt) < __TM_ME_TTL_MS) {
      return { ok: true, user: __tmMeCache, cached: true };
    }

    const res = await fetch('/api/me', { method: 'GET', credentials: 'include' });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.ok || !data.user) {
      // If the session is invalid, clear local hints.
      if (res.status === 401 || data?.message === 'not_logged_in') {
        try { clearAuth(); } catch {}
        setCachedMe(null);
        dispatchMeUpdated({ reason: 'auth_cleared' });
      }
      return data || { ok: false, message: 'not_logged_in' };
    }

    setCachedMe(data.user);

    // Keep local UI hint in sync (email/name/plan). Only stores if email exists.
    try {
      saveLocalUser({
        email: data.user.email,
        name: data.user.name,
        plan: data.user.plan
      });
    } catch {}

    dispatchMeUpdated({ reason: 'me_refreshed' });
    return data;
  } catch (e) {
    return { ok: false, message: 'network_error' };
  }
}
