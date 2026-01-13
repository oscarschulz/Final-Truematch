/**
 * TrueMatch Frontend API helper (ES module)
 *
 * This file is intentionally small and predictable:
 * - Always uses same-origin relative paths
 * - Always sends cookies (credentials: 'include')
 * - Always returns a JSON object with { ok: boolean, ... }
 */

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Non-JSON response (misconfigured route / proxy). Surface as a structured error.
    return { ok: false, error: 'Non-JSON response', status: res.status, body: text.slice(0, 500) };
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  try {
    const res = await fetch(path, {
      method,
      credentials: 'include',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await safeJson(res);

    if (!res.ok) {
      // Prefer server-provided message if present
      const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: msg, ...(data && typeof data === 'object' ? data : {}) };
    }

    // If server returns null/empty, normalize.
    if (!data || typeof data !== 'object') return { ok: true };

    // Some endpoints might not include ok=true; normalize.
    if (typeof data.ok !== 'boolean') return { ok: true, ...data };

    return data;
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

export async function apiGet(path) {
  return request(path, { method: 'GET' });
}

export async function apiPost(path, body) {
  return request(path, { method: 'POST', body });
}

// Convenience wrappers used across pages
export async function apiMe() {
  return apiGet('/api/me');
}

export async function apiUpdateProfile(profile) {
  return apiPost('/api/me/profile', profile);
}

export async function apiSavePrefs(prefs) {
  return apiPost('/api/me/preferences', prefs);
}

// Backwards-compatible alias (older bundles may import apiSave)
export const apiSave = apiSavePrefs;
