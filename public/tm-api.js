// ==========================================
// tm-api.js — API Handler (Live + Optional Mock)
// ==========================================
// Goal: Use REAL backend by default (so new users stay on "free").
// Mock responses are available only when explicitly enabled via ?mock=1
// or window.TM_USE_MOCK_API = true.

export const API_BASE = (() => {
  const v = String(window.API_BASE || "").trim().replace(/\/$/, "");
  if (v) return v;
  if (location.protocol === "file:") return "http://localhost:3000";
  const host = location.hostname;
  const port = location.port || "";
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (isLocal && port && port !== "3000") {
    return `${location.protocol}//${host}:3000`;
  }
  return "";
})();

const QS = new URLSearchParams(location.search);
const USE_MOCK_API = QS.get("mock") === "1" || window.TM_USE_MOCK_API === true;

// -------------------------
// Low-level request helper
// -------------------------
async function requestJSON(path, { method = "GET", body = undefined } = {}) {
  const url = `${API_BASE}${path}`;

  const init = {
    method,
    credentials: "include",
    headers: {},
  };

  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    // Network-level failure (server down, blocked, etc.)
    return { ok: false, error: `Network error calling ${path}` };
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { ok: false, error: `Non-JSON response from ${path} (HTTP ${res.status})` };
    }
  }

  // If backend didn't include ok, normalize it
  if (typeof data.ok === "undefined") data.ok = res.ok;

  // If HTTP error but payload says ok, force ok=false
  if (!res.ok) data.ok = false;

  // Attach HTTP status for debugging (non-breaking)
  data.status = res.status;

  return data;
}

// -------------------------
// Public helpers (used by pages)
// -------------------------
export async function apiGet(path) {
  if (USE_MOCK_API) return getMockResponse(path, null);
  return requestJSON(path, { method: "GET" });
}

export async function apiPost(path, body) {
  if (USE_MOCK_API) return getMockResponse(path, body);
  return requestJSON(path, { method: "POST", body });
}

// Convenience wrappers some pages expect
export async function apiMe() {
  return apiGet("/api/me");
}

export async function apiPrefsGet() {
  return apiGet("/api/prefs/get");
}

export async function apiPrefsSave(prefs) {
  return apiPost("/api/prefs/save", prefs);
}

export async function apiPlanUpdate(plan) {
  // Backend: POST /plan/choose { plan }
  // Some pages use /plan/choose (no /api prefix) so we keep it consistent.
  return apiPost("/plan/choose", { plan });
}

// ==========================================
// Mock Layer (ONLY when enabled)
// ==========================================

export function getMockUser() {
  return {
    id: "u-demo",
    email: "demo@itruematch.com",
    name: "Demo User",
    city: "Manila",
    age: 27,
    plan: "tier2", // demo default
    planActive: true,
  };
}

function getMockResponse(path, body) {
  console.log("[MOCK api]", path, body || "");

  // Simulate network delay for realism
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const user = getMockUser();

  const P = String(path || "");
  const respond = async () => {
    await delay(200);

    if (P === "/api/me") return { ok: true, user };
    if (P === "/api/prefs/get") return { ok: true, prefs: getMockPrefs() };
    if (P === "/api/prefs/save") return { ok: true, saved: true };
    if (P === "/api/creators") return { ok: true, creators: getMockCreators() };
    if (P === "/api/shortlist/get") return { ok: true, shortlist: [] };
    if (P === "/api/shortlist/add") return { ok: true };
    if (P === "/api/shortlist/remove") return { ok: true };

    // Plan choose
    if (P === "/plan/choose") return { ok: true, plan: body?.plan || "free" };

    return { ok: false, error: `Mock: Unknown path ${P}` };
  };

  return respond();
}

function getMockPrefs() {
  return {
    yourAge: 27,
    yourCity: "Manila",
    preferredCity: "Marbella",
    ageMin: 25,
    ageMax: 35,
    ethnicity: "Any",
    lookingFor: "Women",
    verified: true,
  };
}

function getMockCreators() {
  return [
    { id: "c1", name: "Aly", city: "Manila", age: 24, bio: "Lifestyle & travel." },
    { id: "c2", name: "Mia", city: "Cebu", age: 26, bio: "Fitness & wellness." },
    { id: "c3", name: "Lena", city: "Davao", age: 25, bio: "Art & music." },
  ];
}
