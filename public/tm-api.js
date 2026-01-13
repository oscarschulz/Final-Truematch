// tm-api.js
// ESM helper for calling your backend API, with a small "bridge" so older scripts
// can also access the same functions via window.TM_API.
//
// Usage (ESM): import { apiGet, apiPost, apiMe } from './tm-api.js'
//
// Notes:
// - Always sends cookies via credentials: 'include' (so your session cookie works).
// - Returns an object: { ok, status, ...json } (json may be empty if response isn't JSON).

const API_BASE =
  (typeof window !== 'undefined' && window.TM_API_BASE)
    ? String(window.TM_API_BASE).replace(/\/+$/, '')
    : '';

function buildUrl(path) {
  if (!path) return API_BASE || '';
  // Allow absolute URLs
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function request(method, path, data, opts = {}) {
  const url = buildUrl(path);

  const headers = { ...(opts.headers || {}) };

  // Only attach JSON headers when sending a body (and when caller didn't override).
  let body;
  if (data !== undefined) {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    const ct = headers['Content-Type'] || headers['content-type'] || '';
    body = String(ct).includes('application/json') ? JSON.stringify(data) : data;
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: 'include',
    cache: 'no-store',
    ...opts,
  });

  const text = await res.text();
  let json = {};
  if (text) {
    try { json = JSON.parse(text); } catch { json = {}; }
  }

  return { ok: res.ok, status: res.status, ...json };
}

// Generic helpers
export const apiGet = (path, opts) => request('GET', path, undefined, opts);
export const apiPost = (path, data, opts) => request('POST', path, data, opts);
export const apiPut = (path, data, opts) => request('PUT', path, data, opts);
export const apiDel = (path, opts) => request('DELETE', path, undefined, opts);

// App-specific helpers (aliases used across your front-end files)
export const apiMe = () => apiGet('/api/me');

// Some pages import apiGetPlan even if they can read plan from /api/me
export async function apiGetPlan() {
  const r = await apiMe();
  if (!r.ok) return r;
  return { ok: true, status: 200, plan: r.user?.plan, user: r.user };
}

// Preferences save endpoint used by preferences.js and dashboard settings flows
export const apiSavePrefs = (prefs) => apiPost('/api/me/preferences', prefs);

// Profile update endpoint (name, age, city, etc.)
export const apiUpdateProfile = (profile) => apiPost('/api/me/profile', profile);

// Plan selection endpoint (tier1 / tier2 / tier3)
export const apiSetPlan = (plan) => apiPost('/api/plan/choose', { plan });

// Optional: a "client builder" (keeps older patterns working)
export function buildApiClient(base = API_BASE) {
  if (typeof window !== 'undefined') window.TM_API_BASE = base;
  return {
    apiGet, apiPost, apiPut, apiDel,
    apiMe, apiGetPlan, apiSavePrefs, apiUpdateProfile, apiSetPlan,
  };
}

// Bridge for non-module scripts (optional)
if (typeof window !== 'undefined') {
  window.TM_API = window.TM_API || {};
  Object.assign(window.TM_API, {
    apiGet, apiPost, apiPut, apiDel,
    apiMe, apiGetPlan, apiSavePrefs, apiUpdateProfile, apiSetPlan,
    buildApiClient,
  });
}
