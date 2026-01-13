// ---------------------------------------------------------------------
// iTrueMatch Session Utilities
// - Single source of truth for lightweight client-side session helpers
// - Safe for ES modules (import ...) and for legacy pages via window.TM_SESSION
// ---------------------------------------------------------------------

const LS_USER = 'tm_user';
const LS_PLAN_OVERRIDE = 'tm_plan_override';
const LS_PREFS = 'tm_prefs';
const LS_PREFS_BY_USER = 'tm_prefs_by_user';

function safeParse(json, fallback = null) {
  try { return JSON.parse(json); } catch { return fallback; }
}

function normPlan(plan) {
  if (!plan) return null;
  const p = String(plan).trim().toLowerCase();
  // Treat free/basic/no-plan as no paid plan.
  if (!p || p === 'free' || p === 'basic' || p === 'none') return null;
  return p;
}

export function getCurrentUser() {
  return safeParse(localStorage.getItem(LS_USER), null);
}

export function saveLocalUser(user) {
  if (!user) return;
  try { localStorage.setItem(LS_USER, JSON.stringify(user)); } catch {}
}

export function getLocalPlan() {
  // Only return PAID plan (tier1/tier2/tier3/etc). Free returns null.
  const override = normPlan(localStorage.getItem(LS_PLAN_OVERRIDE));
  if (override) return override;

  const u = getCurrentUser();
  return normPlan(u && u.plan);
}

export function setLocalPlan(plan) {
  const p = normPlan(plan);
  try {
    if (p) localStorage.setItem(LS_PLAN_OVERRIDE, p);
    else localStorage.removeItem(LS_PLAN_OVERRIDE);
  } catch {}
}

export function getLocalPrefs() {
  return safeParse(localStorage.getItem(LS_PREFS), null);
}

export function saveLocalPrefs(prefs) {
  if (!prefs) return;
  try { localStorage.setItem(LS_PREFS, JSON.stringify(prefs)); } catch {}
}

export function getPrefsByUserId(userId) {
  const map = safeParse(localStorage.getItem(LS_PREFS_BY_USER), {});
  if (!map || typeof map !== 'object') return null;
  return map[userId] || null;
}

export function setPrefsByUserId(userId, prefs) {
  if (!userId) return;
  const map = safeParse(localStorage.getItem(LS_PREFS_BY_USER), {});
  const next = (map && typeof map === 'object') ? map : {};
  next[userId] = prefs;
  try { localStorage.setItem(LS_PREFS_BY_USER, JSON.stringify(next)); } catch {}
}

export function clearSession(options = {}) {
  const { skipServer = false } = options;

  try {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_PLAN_OVERRIDE);
    localStorage.removeItem(LS_PREFS);
    localStorage.removeItem(LS_PREFS_BY_USER);
  } catch {}

  if (!skipServer) {
    try {
      // Keepalive allows logout request to be sent even if the page navigates immediately.
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }
}

// Expose to legacy pages
try {
  window.TM_SESSION = {
    getCurrentUser,
    saveLocalUser,
    getLocalPlan,
    setLocalPlan,
    getLocalPrefs,
    saveLocalPrefs,
    getPrefsByUserId,
    setPrefsByUserId,
    clearSession,
  };
} catch {}
