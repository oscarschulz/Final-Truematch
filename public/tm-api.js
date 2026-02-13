/**
 * TrueMatch Frontend API helper (ES module)
 *
 * Hardened:
 * - Timeout via AbortController
 * - Sends CSRF-ish marker header (server should validate)
 * - Sends Accept: application/json
 * - Normalizes password change payload for backward compatibility
 */

const DEFAULT_TIMEOUT_MS = 15000;

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: 'Non-JSON response', status: res.status, body: text.slice(0, 500) };
  }
}

async function request(path, { method = 'GET', body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'X-TM-Request': '1',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await safeJson(res);

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: msg, ...(data && typeof data === 'object' ? data : {}) };
    }

    if (!data || typeof data !== 'object') return { ok: true };
    if (typeof data.ok !== 'boolean') return { ok: true, ...data };
    return data;
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    return { ok: false, error: isAbort ? 'Request timeout' : (err?.message || 'Network error') };
  } finally {
    clearTimeout(t);
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

export async function apiChangePassword(currentPassword, newPassword) {
  // Backward-compatible payload: some servers expect oldPassword instead of currentPassword
  return apiPost('/api/me/password', { currentPassword, oldPassword: currentPassword, newPassword });
}

// Backwards-compatible alias (older bundles may import apiSave)
export const apiSave = apiSavePrefs;

// ---- Creator-to-Creator Subscriptions (Following / Subscribers)
export async function apiGetMySubscriptions(dir = '') {
  const qs = dir ? `?dir=${encodeURIComponent(dir)}` : '';
  return apiGet(`/api/me/subscriptions${qs}`);
}

export async function apiSubscribeToCreator(creatorEmail, durationDays = 30) {
  return apiPost('/api/creator/subscribe', { creatorEmail, durationDays });
}

export async function apiUnsubscribeFromCreator(creatorEmail) {
  return apiPost('/api/creator/unsubscribe', { creatorEmail });
}
