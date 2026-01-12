// ==========================================
// tm-api.js — API Handler (Final Fixed Version)
// ==========================================

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

// ---------------- Generic helpers ----------------

export async function apiGet(path) {
  console.log("[MOCK apiGet]", path);
  
  // Simulate Network Delay
  await new Promise(r => setTimeout(r, 300));

  // --- MOCK RESPONSES ---
  
  if (path === "/api/me") {
    return {
      ok: true,
      user: {
        id: 1,
        name: "Miguel", 
        email: "miguel@demo.com",
        avatarUrl: "assets/images/truematch-mark.png",
        age: 27,
        city: "Manila",
        plan: "tier2", // Demo plan
        creatorStatus: "approved",
        premiumStatus: "active",
        hasCreatorAccess: true
      },
      prefs: {
        city: "Manila",
        ageMin: 21,
        ageMax: 35,
        ethnicity: "any",
        lookingFor: ["women"]
      }
    };
  }

  if (path === "/api/dashboard/usage") {
    return {
      ok: true,
      usage: {
        swipesRemaining: 20,
        swipesLimit: 20,
        shortlistCount: 2,
        shortlistLimit: 5,
        approvedCount: 1,
        datesCount: 0
      }
    };
  }

  if (path === "/api/swipe/candidates") {
    return {
      ok: true,
      candidates: [
        { id: 101, name: "Alice", age: 24, city: "Makati", photoUrl: "assets/images/truematch-mark.png" },
        { id: 102, name: "Bea", age: 22, city: "BGC", photoUrl: "assets/images/truematch-mark.png" },
        { id: 103, name: "Cathy", age: 25, city: "Ortigas", photoUrl: "assets/images/truematch-mark.png" }
      ]
    };
  }

  if (path === "/api/shortlist") {
    return { ok: true, list: [] };
  }

  // Fallback
  return { ok: true };
}

export async function apiPost(path, payload) {
  console.log("[MOCK apiPost]", path, payload);
  
  // Simulate Network Delay
  await new Promise(r => setTimeout(r, 300));

  // simulate success for all POST endpoints
  if (path.includes("/swipe/action")) {
    return { ok: true, remaining: 19, match: Math.random() > 0.7 };
  }

  if (path.includes("/auth")) {
    return { ok: true, token: "mock-token-123" };
  }

  return { ok: true };
}

// Ito ang nawawala kanina kaya nag-eerror:
export async function apiSavePrefs(prefs) {
    console.log("[MOCK apiSavePrefs]", prefs);
    await new Promise(r => setTimeout(r, 300));
    return { ok: true };
}

// Ito rin kailangan ng dashboard.js:
export async function apiUpdateProfile(payload) {
    console.log("[MOCK apiUpdateProfile]", payload);
    await new Promise(r => setTimeout(r, 300));
    return { ok: true, user: payload };
}

export async function apiPatch(path, payload) {
  console.log("[MOCK apiPatch]", path, payload);
  return { ok: true };
}

// ---------------- Convenience wrappers ----------------

export const apiRegister  = (fields) => apiPost("/api/auth/register", fields);
export const apiLogin     = (fields) => apiPost("/api/auth/login", fields);
export const apiOAuthMock = (provider) => apiPost("/api/auth/oauth/mock", { provider });

// User Helpers
export const apiMe = () => apiGet("/api/me");

// Plan
export const apiChoosePlan = (plan) => apiPost("/api/plan/choose", { plan });

// Shortlist
export const apiShortlistToday = () => apiGet("/api/shortlist");
export const apiShortlistDecision = (profileId, action) =>
  apiPost("/api/shortlist/decision", { profileId, action });