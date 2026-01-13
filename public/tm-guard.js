/**
 * iTrueMatch Frontend Auth Guard
 * - Hides page immediately (prevents flash)
 * - Calls /api/me (same cookies) to confirm session
 * - If not authenticated, redirects to /auth.html?mode=login&next=...
 *
 * Works for:
 * - Production (same-origin API)
 * - Local dev where frontend is served on 5500/Live Server and API is on 3000
 */
(function () {
  try {
    // Allow a page to opt-out (public pages)
    if (window.TM_GUARD && window.TM_GUARD.public === true) return;

    // If a page forgot to set TM_GUARD, default to "protected" because you asked for fallback on front-end pages.
    var cfg = window.TM_GUARD || { requireAuth: true };
    if (!cfg.requireAuth) return;

    var path = window.location.pathname || "";
    var search = window.location.search || "";
    var hash = window.location.hash || "";
    var returnTo = encodeURIComponent(path + search + hash);

    // Match your existing auth.js API_BASE behavior (Live Server -> localhost:3000)
    var isFile = window.location.protocol === "file:";
    var isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    var isLocalStatic = isLocalHost && window.location.port && window.location.port !== "3000";
    var API_BASE = (isFile || isLocalStatic) ? "http://localhost:3000" : "";

    // Hide page instantly to avoid showing protected UI for a split second
    var hideStyle = document.createElement("style");
    hideStyle.setAttribute("data-tm-guard", "1");
    hideStyle.textContent = "html{visibility:hidden} body{opacity:0}";
    document.head.appendChild(hideStyle);

    function reveal() {
      if (hideStyle && hideStyle.parentNode) hideStyle.parentNode.removeChild(hideStyle);
      document.documentElement.style.visibility = "";
      document.body && (document.body.style.opacity = "");
    }

    var loginUrl = (cfg.loginUrl || ("/auth.html?mode=login&next=" + returnTo));

    fetch(API_BASE + "/api/me", { credentials: "include" })
      .then(function (r) {
        if (!r.ok) throw new Error("unauthenticated");
        return r.json();
      })
      .then(function (me) {
        window.TM_ME = me;
        reveal();
      })
      .catch(function () {
        try {
          // Best-effort cleanup (in case older versions stored anything client-side)
          localStorage.removeItem("tm_user");
          localStorage.removeItem("tm_plan");
          localStorage.removeItem("tm_email");
        } catch (e) {}
        window.location.replace(loginUrl);
      });
  } catch (e) {
    // If guard crashes, fail-safe to login.
    try {
      window.location.replace("/auth.html?mode=login");
    } catch (_) {}
  }
})();
