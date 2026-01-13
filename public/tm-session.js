// tm-session.js
// Shared local session helpers (ES module) + window bridge for non-module pages.

export const USER_KEY = 'tm_user';
export const PLAN_OVERRIDE_KEY = 'tm_plan_override';
export const PREFS_KEY = 'tm_prefs';
export const PREFS_MAP_KEY = 'tm_prefs_by_user';

// --------------------
// JSON helpers
// --------------------
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

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// --------------------
// User helpers
// --------------------
export function getCurrentUser() {
  return readJSON(USER_KEY, null);
}

export function setCurrentUser(user) {
  const minimal = {
    id: user?.id || 'local-demo',
    email: user?.email || '',
    name: user?.name || user?.displayName || user?.fullName || 'User',
    plan: user?.plan || user?.tier || user?.subscription || null,
  };
  writeJSON(USER_KEY, minimal);

  if (minimal.plan) {
    writeJSON(PLAN_OVERRIDE_KEY, minimal.plan);
  }
  return minimal;
}

// Alias used by auth.js patterns
export function saveLocalUser(user) {
  return setCurrentUser(user);
}

export function clearCurrentUser() {
  removeKey(USER_KEY);
}

export function getCurrentUserEmail() {
  try {
    const u = getCurrentUser();
    const email = u?.email;
    return email ? String(email).trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

// --------------------
// Plan helpers
// --------------------
export function getPlanOverride() {
  try {
    const v = localStorage.getItem(PLAN_OVERRIDE_KEY);
    return v ? String(v).trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export function setPlanOverride(plan) {
  if (!plan) return null;
  const v = String(plan).trim().toLowerCase();
  try {
    localStorage.setItem(PLAN_OVERRIDE_KEY, v);
  } catch {}

  // keep tm_user.plan in sync (nice-to-have)
  try {
    const raw = readJSON(USER_KEY, {}) || {};
    raw.plan = v;
    writeJSON(USER_KEY, raw);
  } catch {}

  return v;
}

export function clearPlanOverride() {
  removeKey(PLAN_OVERRIDE_KEY);
}

export function normalizePlan(plan) {
  const v = String(plan || '').trim().toLowerCase();
  if (!v) return 'free';
  if (v === 'basic') return 'free';
  if (v === 'plus') return 'tier1';
  if (v === 'elite') return 'tier2';
  if (v === 'concierge') return 'tier3';
  if (v === 'tier1' || v === 'tier2' || v === 'tier3' || v === 'free') return v;
  return 'free';
}

export function getEffectivePlan() {
  const override = getPlanOverride();
  if (override) return normalizePlan(override);

  const u = getCurrentUser();
  if (u?.plan) return normalizePlan(u.plan);

  return 'free';
}

// Compatibility exports expected by dashboard.js / tier.js
export function getLocalPlan() {
  return getEffectivePlan();
}

export function setLocalPlan(plan) {
  setPlanOverride(plan);
  return getEffectivePlan();
}

// --------------------
// Preferences helpers
// --------------------
export function getRawPrefsForCurrentUser() {
  try {
    const email = getCurrentUserEmail();
    if (email) {
      const map = readJSON(PREFS_MAP_KEY, {}) || {};
      if (map && typeof map === 'object' && map[email]) return map[email];
    }
    return readJSON(PREFS_KEY, null);
  } catch {
    return null;
  }
}

export function savePrefsForCurrentUser(prefs) {
  try {
    const email = getCurrentUserEmail();
    if (email) {
      const map = readJSON(PREFS_MAP_KEY, {}) || {};
      map[email] = prefs;
      writeJSON(PREFS_MAP_KEY, map);
    }
    // legacy slot (keep)
    writeJSON(PREFS_KEY, prefs);
  } catch {
    // ignore
  }
}

export function hasLocalPrefs() {
  return !!getRawPrefsForCurrentUser();
}

// --------------------
// Auth clear helpers (dashboard expects clearSession)
// --------------------
export function clearAuth() {
  removeKey(USER_KEY);
  removeKey(PLAN_OVERRIDE_KEY);
  removeKey(PREFS_KEY);
  removeKey(PREFS_MAP_KEY);
}

export const clearSession = clearAuth;

export function isAuthenticated() {
  const u = getCurrentUser();
  return !!(u && u.email);
}

// --------------------
// Optional bridge for non-module scripts
// --------------------
if (typeof window !== 'undefined') {
  window.TM_SESSION = window.TM_SESSION || {};
  Object.assign(window.TM_SESSION, {
    USER_KEY,
    PLAN_OVERRIDE_KEY,
    PREFS_KEY,
    PREFS_MAP_KEY,
    readJSON,
    writeJSON,
    removeKey,
    getCurrentUser,
    setCurrentUser,
    saveLocalUser,
    clearCurrentUser,
    getCurrentUserEmail,
    getPlanOverride,
    setPlanOverride,
    clearPlanOverride,
    normalizePlan,
    getEffectivePlan,
    getLocalPlan,
    setLocalPlan,
    getRawPrefsForCurrentUser,
    savePrefsForCurrentUser,
    hasLocalPrefs,
    clearAuth,
    clearSession,
    isAuthenticated,
  });
}
