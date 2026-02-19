/**
 * TrueMatch Frontend API helper (ES module)
 *
 * Hardened improvements:
 * - Request timeout via AbortController (prevents "stuck" UI)
 * - Always sends cookies (credentials: 'include')
 * - Always sends Accept: application/json
 * - Adds X-TM-Request marker header (optional server-side validation)
 * - Normalizes errors into { ok:false, status?, error, message? }
 * - Backward-compatible password change payload
 */

const DEFAULT_TIMEOUT_MS = 15000;

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

function normalizeError(res, data) {
  const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
  return {
    ok: false,
    status: res.status,
    error: msg,
    ...(data && typeof data === 'object' ? data : {}),
  };
}

async function request(path, { method = 'GET', body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

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

    if (!res.ok) return normalizeError(res, data);

    // Normalize empty bodies.
    if (!data || typeof data !== 'object') return { ok: true };

    // Some endpoints might not include ok=true; normalize.
    if (typeof data.ok !== 'boolean') return { ok: true, ...data };

    return data;
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    return { ok: false, error: isAbort ? 'Request timeout' : (err?.message || 'Network error') };
  } finally {
    clearTimeout(timer);
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
  // Backward-compatible payload: some server builds used oldPassword.
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
// ---- Collections (Lists) API (backend-first)
export async function apiGetCollections(includeItems = false) {
  const qs = includeItems ? '?includeItems=1' : '';
  return apiGet(`/api/collections${qs}`);
}

export async function apiCreateCollection(name) {
  return apiPost('/api/collections/create', { name });
}

export async function apiRenameCollection(id, name) {
  return apiPost('/api/collections/rename', { id, name });
}

export async function apiDeleteCollection(id) {
  return apiPost('/api/collections/delete', { id });
}

export async function apiAddToCollection(id, item) {
  return apiPost('/api/collections/add', { id, item });
}

export async function apiRemoveFromCollection(id, key) {
  return apiPost('/api/collections/remove', { id, key });
}

// ---- Creator Posts API (used by home/profile modules)
export async function apiGetCreatorPosts(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiGet(`/api/creator/posts${q ? `?${q}` : ''}`);
}

export async function apiCreateCreatorPost(payload) {
  return apiPost('/api/creator/posts', payload || {});
}

export async function apiDeleteCreatorPost(postId) {
  return apiPost('/api/creator/posts/delete', { id: postId });
}

export async function apiReactToPost(postId, emoji = 'like') {
  return apiPost('/api/creator/posts/react', { postId, reaction: emoji });
}
