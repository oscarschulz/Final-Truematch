// server.js – TrueMatch backend using Firebase Firestore (no MongoDB)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ✅ DITO MO IDIKIT
console.log('[env-check] ADMIN_USERNAME exists?', !!process.env.ADMIN_USERNAME);
console.log('[env-check] PUBLIC_BASE_URL exists?', !!process.env.PUBLIC_BASE_URL);

const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const crypto = require('crypto');
const { AsyncLocalStorage } = require('async_hooks');
const IS_PROD = process.env.NODE_ENV === 'production';

// Google OAuth token verifier (lazy)
let OAuth2Client = null;
try { OAuth2Client = require('google-auth-library').OAuth2Client; } catch (e) { OAuth2Client = null; }


// Google Sheets (Opt-in) (lazy)
let google = null;
try {
  ({ google } = require('googleapis'));
} catch (e) {
  google = null;
}
// ---------------- Basic server setup ----------------
const app = express();
app.set('trust proxy', 1);

// --- Basic hardening headers (lightweight; avoids breaking existing UI) ---
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// =========================
// Frontend public folder resolver
// =========================
// In your project, server.js may live either in the repo root OR inside a /backend folder.
// A common reason for "Cannot GET /preferences.html" is serving the wrong public folder path
// in production (Railway/Linux is case-sensitive & directory-sensitive).
function resolvePublicDir() {
  const candidates = [
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '.', 'public'),
    path.join(process.cwd(), 'public')
  ];

  const mustHave = ['preferences.html', 'dashboard.html', 'index.html'];

  // Prefer a directory that actually contains the key HTML files.
  for (const c of candidates) {
    try {
      if (!fs.existsSync(c)) continue;
      const hasKey = mustHave.some(f => {
        try { return fs.existsSync(path.join(c, f)); } catch { return false; }
      });
      if (hasKey) return c;
    } catch (e) {}
  }

  // Fallback: first existing directory
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (e) {}
  }

  // Last resort
  return candidates[0];
}

const PUBLIC_DIR = resolvePublicDir();


const PORT = Number(process.env.PORT) || 3000;

// NEW: single source of truth for public base URL (works in local & deploy)
const APP_BASE_URL = (process.env.APP_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');


// CORS: limit to local dev origins + allow credentials & x-admin-key
const CORS_ALLOWLIST = String(process.env.CORS_ALLOWLIST || '')
  .split(',')
  .map(s => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // No Origin header = not a browser CORS request; don't add CORS headers.
    // This keeps server-to-server requests working while preventing unnecessary CORS exposure.
    if (!origin) return cb(null, false);

    const o = String(origin || '').trim().replace(/\/+$/, '');

    // "null" origin (file://, sandboxed iframes) is dangerous with credentialed CORS.
    // Keep it OFF in production. You can enable it in local dev via ALLOW_NULL_ORIGIN=1.
    if (o === 'null') {
      if (!IS_PROD && process.env.ALLOW_NULL_ORIGIN === '1') return cb(null, true);
      return cb(null, false);
    }

    // Local dev
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(o)) return cb(null, true);

    // Explicit allowlist
    if (CORS_ALLOWLIST.includes(o)) return cb(null, true);

    return cb(null, false);
  },
  credentials: true,
  // IMPORTANT: tm-api_UPDATED_v2 sends Accept + X-TM-Request by default (preflight must allow these).
  allowedHeaders: ['Content-Type', 'Accept', 'X-TM-Request', 'X-Requested-With', 'Authorization', 'x-admin-key'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));

// body parsers (before routes)
app.use(express.json({
  // Increased to support small photo/video "Recent Moments" uploads (base64 payload)
  // Note: client & server still enforce stricter per-upload limits.
  limit: '15mb',
  verify: (req, res, buf) => {
    // Keep raw body for Coinbase Commerce webhook signature verification
    if (req.originalUrl && req.originalUrl.startsWith('/api/coinbase/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));


app.use(cookieParser());

// --- API responses should never be cached (cookie-based auth) ---
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// --- Minimal CSRF protection for cookie-authenticated APIs ---
// Blocks cross-site POST/PUT/DELETE even if cookies are present.
function _isAllowedApiOrigin(req) {
  const origin = String(req.headers.origin || '').replace(/\/+$/g, '');
  if (!origin) return true; // allow non-browser clients or environments that omit Origin
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http');
  const host = String(req.get('host') || '');
  const expected = `${proto}://${host}`.replace(/\/+$/g, '');
  if (origin === expected) return true;
  if (Array.isArray(CORS_ALLOWLIST) && CORS_ALLOWLIST.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true;
  return false;
}

app.use('/api', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const sfs = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (sfs && !['same-origin', 'same-site'].includes(sfs)) {
    return res.status(403).json({ ok: false, message: 'csrf_blocked' });
  }
  if (!_isAllowedApiOrigin(req)) {
    return res.status(403).json({ ok: false, message: 'csrf_blocked' });
  }
  return next();
});

// AsyncLocalStorage scope for each request
app.use((req, res, next) => als.run({ user: __globalUser, prefs: __globalPrefs }, () => next()));
// =========================
// Public vs protected HTML gating (Variant B)
// =========================
const PUBLIC_HTML = new Set(['/', '/index.html', '/auth.html', '/plan-select.html']);
const PROTECTED_HTML = new Set([
  '/dashboard.html',
  '/preferences.html',
  '/tier.html',
  '/pay.html',
  '/plan.html',
  '/creators.html',
  '/premium-society.html',
]);

function hasSessionCookie(req) {
  return !!getSessionEmail(req);
}

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const p = req.path;

  if (PUBLIC_HTML.has(p)) return next();
  if (!PROTECTED_HTML.has(p)) return next();

  if (hasSessionCookie(req)) return next();

  const nextPath = encodeURIComponent(p + (req.url.includes('?') ? ('?' + req.url.split('?')[1]) : ''));
  return res.redirect(`/auth.html?mode=login&next=${nextPath}`);
});

// Serve frontend and assets (after gating)

// =========================
// Admin UI files (served from backend/admin)
// =========================
const ADMIN_DIR = path.join(__dirname, 'admin');
console.log('[admin] routes enabled. ADMIN_DIR =', ADMIN_DIR);

function sendAdminFile(filename) {
  return (req, res) => {
    try {
      const f = path.join(ADMIN_DIR, filename);
      if (!fs.existsSync(f)) return res.status(404).send('Not found');

      // Avoid stale browser cache after moving files around
      res.setHeader('Cache-Control', 'no-store');
      // Quick way to verify in DevTools > Network > Headers
      res.setHeader('X-TM-Admin-Source', 'backend/admin');

      return res.sendFile(f);
    } catch (e) {
      return res.status(500).send('Server error');
    }
  };
}

// Friendly admin shortcut
// ---------------- Admin UI route guard ----------------
// This prevents direct public access to admin pages/assets.
// Users must login first so cookie tm_admin is set.
function isAdminAuthed(req) {
  try {
    return isValidAdminKey(getProvidedAdminKey(req));
  } catch (e) {
    return false;
  }
}

function adminGate(req, res, next) {
  if (isAdminAuthed(req)) return next();

  // Allow the login page + its JS (public)
  if (req.path === '/admin-login.html' || req.path === '/admin-login.js' || req.path === '/admin.css' || req.path === '/admin-landing.html') return next();

  // Redirect HTML requests to login; block other assets
  if (req.path.endsWith('.html') || req.path === '/admin') {
    const nextUrl = encodeURIComponent(req.originalUrl || '/admin.html');
    return res.redirect(`/admin-login.html?next=${nextUrl}`);
  }

  return res.status(403).send('Forbidden');
}

app.get('/admin', adminGate, (req, res) => res.redirect('/admin-landing.html'));

// Admin pages
app.get('/admin-landing.html', adminGate, sendAdminFile('admin-landing.html'));
app.get('/admin-login.html', sendAdminFile('admin-login.html'));
app.get('/admin.html', adminGate, sendAdminFile('admin.html'));

// Admin static (served from backend/admin)
app.get('/admin.css', adminGate, sendAdminFile('admin.css'));
app.get('/admin.js', adminGate, sendAdminFile('admin.js'));
app.get('/admin-login.js', sendAdminFile('admin-login.js'));


// =========================
// Static aliases for Creators modules
// =========================
// Some Creators page modules import "./tm-api.js" relative to /assets/js/creators/.
// If tm-api.js is deployed in /assets/js/ (shared) instead of /assets/js/creators/,
// the browser requests /assets/js/creators/tm-api.js and gets 404.
// This alias serves the shared file so the page doesn't break.
app.get('/assets/js/creators/tm-api.js', (req, res, next) => {
  try {
    const candidates = [
      path.join(PUBLIC_DIR, 'assets', 'js', 'creators', 'tm-api.js'),
      path.join(PUBLIC_DIR, 'assets', 'js', 'tm-api.js'),
      path.join(PUBLIC_DIR, 'tm-api.js'),
    ];

    for (const f of candidates) {
      try {
        if (fs.existsSync(f)) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          // Avoid stale cache when you move JS files around.
          res.setHeader('Cache-Control', 'no-store');
          return res.sendFile(f);
        }
      } catch (_) {}
    }
  } catch (_) {}
  return next();
});

app.use(express.static(PUBLIC_DIR));
app.use('/public', express.static(PUBLIC_DIR));


// static files

// ---------------- In-memory "DB" (demo + cache) ----------------
const DB = {
  user: {
    id: 'demo-1',
    email: '',
    name: '',
    city: '—',
    plan: null,
    planStart: null,
    planEnd: null,
    avatarUrl: '',
    prefsSaved: false,
    planActive: false,
    emailVerified: false
  },
  // prefs: { city, ageMin, ageMax, lookingFor }
  prefs: null,
  
  // per-user caches (for multi-user sessions)
  users: {},
  prefsByEmail: {},
  // Idagdag ang mga ito:  
  swipes: {}, // { "me@email.com": { "them@email.com": "like" } }
  matches: {}, // { "me@email.com": ["them@email.com"] }

  // shortlistState & datesState are per-email for demo mode
  shortlistState: {},
  datesState: {},
  approvedState: {},
  messages: {},
  messageUsage: {},
  emailVerify: {},
  resetTokens: {},
  forgotOtps: {},
  rateLimits: {},

  // Recent Moments (Stories)
  // Stored as an array of moment objects. When Firebase is enabled, moments are stored in Firestore
  // and media may be stored in Firebase Storage; otherwise we use local disk JSON persistence.
  moments: []
};

/* =========================
   Request-scoped DB.user / DB.prefs (fix concurrency bug)
   - Many routes mutate DB.user / DB.prefs based on the current request (tm_session cookie).
   - Without isolation, concurrent requests can overwrite each other's session state.
   - AsyncLocalStorage keeps these values per-request without rewriting all routes.
   ========================= */
const als = new AsyncLocalStorage();
let __globalUser = DB.user;
let __globalPrefs = DB.prefs;

Object.defineProperty(DB, 'user', {
  configurable: true,
  get() {
    const store = als.getStore();
    return store ? store.user : __globalUser;
  },
  set(v) {
    const store = als.getStore();
    if (store) store.user = v;
    else __globalUser = v;
  }
});

Object.defineProperty(DB, 'prefs', {
  configurable: true,
  get() {
    const store = als.getStore();
    return store ? store.prefs : __globalPrefs;
  },
  set(v) {
    const store = als.getStore();
    if (store) store.prefs = v;
    else __globalPrefs = v;
  }
});

const SERVER_SWIPE_COUNTS = {}; 
const STRICT_DAILY_LIMIT = 20;
// PASS cooldown: profiles you PASS can reappear only after some time.
// Set PASS_RESHOW_AFTER_HOURS=0 to allow immediate re-show (useful for local testing).
const PASS_RESHOW_AFTER_HOURS = (() => {
  const n = Number(process.env.PASS_RESHOW_AFTER_HOURS);
  if (!Number.isFinite(n)) return 12;
  return Math.max(0, n);
})();
// ---------------- Disk persistence (fallback when Firebase is OFF) ----------------
// NOTE: In real production, you should rely on Firestore. This file fallback is mainly for local/demo.
// It makes DB.prefsByEmail survive server restarts (so prefs persist after logout / new device tests).
const PREFS_STORE_PATH = process.env.PREFS_STORE_PATH || path.join(__dirname, '_prefs_store.json');
const MOMENTS_STORE_PATH = process.env.MOMENTS_STORE_PATH || path.join(__dirname, '_moments_store.json');

function loadPrefsStore() {
  try {
    if (!fs.existsSync(PREFS_STORE_PATH)) return;
    const raw = fs.readFileSync(PREFS_STORE_PATH, 'utf8');
    const obj = JSON.parse(raw || '{}');
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      DB.prefsByEmail = obj;
    }
  } catch (e) {
    // swallow; fallback is still in-memory
  }
}

function loadMomentsStore() {
  try {
    if (!fs.existsSync(MOMENTS_STORE_PATH)) {
      DB.moments = [];
      return;
    }
    const raw = fs.readFileSync(MOMENTS_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    DB.moments = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load moments store:', e?.message || e);
    DB.moments = [];
  }
}

function saveMomentsStore() {
  try {
    fs.writeFileSync(MOMENTS_STORE_PATH, JSON.stringify(DB.moments || [], null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save moments store:', e?.message || e);
  }
}

function savePrefsStore() {
  try {
    fs.writeFileSync(PREFS_STORE_PATH, JSON.stringify(DB.prefsByEmail || {}, null, 2));
  } catch (e) {
    // swallow; some hosts have read-only FS
  }
}

// ---------------- PERMANENT STORAGE FIX ----------------
const USERS_STORE_PATH = path.join(__dirname, '_users_store.json');

function loadUsersStore() {
  try {
    if (!fs.existsSync(USERS_STORE_PATH)) return;
    const raw = fs.readFileSync(USERS_STORE_PATH, 'utf8');
    const obj = JSON.parse(raw || '{}');
    if (obj && typeof obj === 'object') {
      DB.users = obj;
      console.log(`[DB] Loaded ${Object.keys(DB.users).length} users from disk.`);
    }
  } catch (e) {
    console.error('[DB] Failed to load users store:', e.message);
  }
}

function saveUsersStore() {
  try {
    // Save the entire DB.users object to a file
    fs.writeFileSync(USERS_STORE_PATH, JSON.stringify(DB.users, null, 2));
  } catch (e) {
    console.error('[DB] Failed to save users store:', e.message);
  }
}

// ---------------- SWIPES PERSISTENCE (per-user swipe history) ----------------
const SWIPES_STORE_PATH = path.join(__dirname, '_swipes_store.json');

function loadSwipesStore() {
  try {
    if (!fs.existsSync(SWIPES_STORE_PATH)) return;
    const raw = fs.readFileSync(SWIPES_STORE_PATH, 'utf8');
    const obj = JSON.parse(raw || '{}');
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      DB.swipes = obj;
      console.log(`[DB] Loaded swipe history for ${Object.keys(DB.swipes).length} users from disk.`);
    }
  } catch (e) {
    console.error('[DB] Failed to load swipes store:', e.message);
  }
}

function saveSwipesStore() {
  try {
    fs.writeFileSync(
      SWIPES_STORE_PATH,
      JSON.stringify(DB.swipes || {}, null, 2)
    );
  } catch (e) {
    console.error('[DB] Failed to save swipes store:', e.message);
  }
}


// ---------------- Plan rules & date helpers ----------------
// Centralized in its own module so you can change plan logic in one place.
const { PLAN_RULES, DAY_MS, todayKey } = require('./planRules');

// Normalize plan keys for consistent backend handling (mirrors frontend tiers).
function normalizePlanKey(rawPlan) {
  if (!rawPlan) return 'free';
  const p = String(rawPlan).toLowerCase().replace(/\s+/g, '');
  if (p.includes('plus') || p.includes('tier1')) return 'tier1';
  if (p.includes('elite') || p.includes('tier2')) return 'tier2';
  if (p.includes('concierge') || p.includes('tier3')) return 'tier3';
  if (p.includes('free')) return 'free';
  return PLAN_RULES[rawPlan] ? rawPlan : 'free';
}

// Messaging limits: only free plan has a strict daily cap; paid tiers are unlimited.
function getMessagesDailyLimit(plan) {
  const key = normalizePlanKey(plan);
  if (key === 'free') return 20;
  return null;
}

// Per-user daily usage helper for messages; resets counters when the day changes.
function getOrInitMessageUsage(email, plan) {
  const today = todayKey();
  if (!email) {
    return {
      dayKey: today,
      sentToday: 0,
      limit: getMessagesDailyLimit(plan)
    };
  }

  if (!DB.messageUsage[email]) {
    DB.messageUsage[email] = {
      dayKey: today,
      sentToday: 0,
      limit: getMessagesDailyLimit(plan)
    };
    return DB.messageUsage[email];
  }

  const usage = DB.messageUsage[email];
  if (!usage.dayKey || usage.dayKey !== today) {
    usage.dayKey = today;
    usage.sentToday = 0;
  }
  usage.limit = getMessagesDailyLimit(plan);
  return usage;
}


// 🔹 SPECIAL DEMO ACCOUNT (global constants)
// 🔹 OPTIONAL special demo account (disabled by default; NEVER enable in production)
const ENABLE_SPECIAL_DEMO = (!IS_PROD) && (process.env.ENABLE_SPECIAL_DEMO === '1');
const DEMO_EMAIL = ENABLE_SPECIAL_DEMO ? String(process.env.DEMO_EMAIL || '').trim().toLowerCase() : '';
const DEMO_PASSWORD = ENABLE_SPECIAL_DEMO ? String(process.env.DEMO_PASSWORD || '') : '';


// 🔹 DEV-only bypass demo accounts (for multi-user testing)
// Enable with: ALLOW_TEST_BYPASS=true (and keep NODE_ENV != 'production')
const ALLOW_TEST_BYPASS = !IS_PROD && (process.env.ALLOW_TEST_BYPASS === '1');

const TEST_BYPASS_ACCOUNTS = {
  "demo1@truematch.app": {
    password: "Demo123!@#",
    name: "Demo One",
    city: "Manila",
    plan: "tier2",
    prefs: { city: "Manila", ageMin: 21, ageMax: 35, lookingFor: ["women"] }
  },
  "demo2@truematch.app": {
    password: "Demo123!@#",
    name: "Demo Two",
    city: "Cebu",
    plan: "tier1",
    prefs: { city: "Cebu", ageMin: 20, ageMax: 33, lookingFor: ["women"] }
  },
  "demo3@truematch.app": {
    password: "Demo123!@#",
    name: "Demo Three",
    city: "Davao",
    plan: "tier3",
    prefs: { city: "Davao", ageMin: 22, ageMax: 38, lookingFor: ["women"] }
  }
};

// 🔹 Cookie session (email-based) — simple & works for your current frontend
// ---------------- Session cookie (signed token; prevents cookie-forging) ----------------
const SESSION_COOKIE = 'tm_session';
const LEGACY_SESSION_COOKIE = 'tm_email'; // legacy (UNSIGNED) cookie from older builds (never trusted)

// Prefer a stable secret from env. If missing, we generate one at boot (secure, but logs everyone out on restart).
const SESSION_SECRET = String(process.env.SESSION_SECRET || process.env.COOKIE_SECRET || process.env.JWT_SECRET || '').trim()
  || crypto.randomBytes(32).toString('hex');

if (!process.env.SESSION_SECRET && !process.env.COOKIE_SECRET && !process.env.JWT_SECRET) {
  console.warn('[security] SESSION_SECRET/COOKIE_SECRET/JWT_SECRET is not set. Sessions will reset on every deploy. Set a strong secret in your env for persistent sessions.');
}

const SESSION_TTL_DAYS = Math.max(1, Math.min(30, Number(process.env.SESSION_TTL_DAYS || 14)));
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function b64urlDecode(str) {
  const s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  return Buffer.from(s + pad, 'base64');
}

function signSessionPayload(payloadObj) {
  const payload = b64urlEncode(Buffer.from(JSON.stringify(payloadObj), 'utf8'));
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest();
  return payload + '.' + b64urlEncode(sig);
}

function verifySessionToken(token) {
  try {
    const t = String(token || '');
    const parts = t.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;

    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest();
    const got = b64urlDecode(sigB64);

    // constant-time compare
    if (got.length !== expected.length || !crypto.timingSafeEqual(got, expected)) return null;

    const payloadJson = b64urlDecode(payloadB64).toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (!payload || typeof payload !== 'object') return null;

    const email = String(payload.e || '').trim().toLowerCase();
    const exp = Number(payload.exp || 0);

    if (!email) return null;
    if (!exp || Date.now() > exp) return null;

    return email;
  } catch {
    return null;
  }
}

function setSession(res, email) {
  const emailNorm = String(email || '').trim().toLowerCase();
  const now = Date.now();
  const token = signSessionPayload({
    v: 1,
    e: emailNorm,
    iat: now,
    exp: now + SESSION_TTL_MS
  });

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: SESSION_TTL_MS,
    priority: 'high'
  });

  // Clear legacy cookie if present (avoid confusion / downgrade attacks)
  res.clearCookie(LEGACY_SESSION_COOKIE, {
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/'
  });
}

function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, {
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/'
  });
  res.clearCookie(LEGACY_SESSION_COOKIE, {
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/'
  });
}

function getSessionEmail(req) {
  const cookies = (req.cookies || {});
  const token = (cookies[SESSION_COOKIE] || '').toString().trim();
  const email = verifySessionToken(token);
  if (email) return email;

  // Never trust unsigned legacy cookie.
  // If it exists, the middleware will clear it when it detects no valid user.
  return '';
}


// ---------------- Simple in-memory rate limiter ----------------
// NOTE: This is intentionally lightweight (no new deps). In multi-instance deployments,
// a shared store (Redis) would be better, but this still blocks basic brute force attacks.
function _rlKey(req, suffix = '') {
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
  return `${ip}${suffix ? ':' + suffix : ''}`;
}
function takeRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const rec = DB.rateLimits[key] || { count: 0, resetAt: now + windowMs };
  if (now > rec.resetAt) {
    rec.count = 0;
    rec.resetAt = now + windowMs;
  }
  rec.count += 1;
  DB.rateLimits[key] = rec;
  const remaining = Math.max(0, limit - rec.count);
  const retryAfterSec = Math.max(0, Math.ceil((rec.resetAt - now) / 1000));
  return { allowed: rec.count <= limit, remaining, retryAfterSec };
}
function rateLimitOr429(req, res, key, limit, windowMs, message = 'too_many_requests') {
  const out = takeRateLimit(key, limit, windowMs);
  if (!out.allowed) {
    res.setHeader('Retry-After', String(out.retryAfterSec));
    res.status(429).json({ ok: false, message, retryAfterSec: out.retryAfterSec });
    return false;
  }
  return true;
}

function setAnonState() {
  DB.user = {
    ...DB.user,
    email: '',
    name: '',
    plan: null,
    planStart: null,
    planEnd: null,
    prefsSaved: false,
    planActive: false,
    emailVerified: false
  };
  DB.prefs = null;
}

// Attach session user to this request (so /api/me and other routes read the right user)
app.use(async (req, res, next) => {
  const email = getSessionEmail(req);
  if (!email) {
    setAnonState();
    return next();
  }

  let user = DB.users[email] || null;

  // If we don't have the user in the in-memory cache but Firebase is configured,
  // fetch the account from Firestore so the dashboard can still resolve name/plan
  // after server restarts / redeploys.
  if (!user && typeof hasFirebase !== 'undefined' && hasFirebase && typeof findUserByEmail === 'function') {
    try {
      const found = await findUserByEmail(email);
      if (found) {
        user = found;
        DB.users[email] = found;
      }
    } catch (e) {
      console.log('[Session] Firestore lookup failed:', e?.message || e);
    }
  }

  // Invalid cookie or missing account -> clear session and treat as signed out.
  if (!user) {
    try { clearSession(res); } catch (_) {}
    setAnonState();
    return next();
  }

  // hydrate from cache (per-email); never carry plan/prefs from previous user
  DB.user = { ...user };
  normalizeDBUser();

  // load per-email prefs map (not the global DB.prefs)
  if (Object.prototype.hasOwnProperty.call(DB.prefsByEmail, email)) {
    DB.prefs = DB.prefsByEmail[email];
  } else if (DB.user && DB.user.prefs) {
    DB.prefs = DB.user.prefs;
    DB.prefsByEmail[email] = DB.user.prefs;
  } else {
    DB.prefs = null;
  }

  return next();
});


// ============================================================
// Auth middleware (cookie-based)
// NOTE: Some API routes (e.g. /api/matches) use this to ensure user is logged in.
// This does NOT change existing session logic; it only reads the same tm_session cookie
// and exposes the resolved user on req.user.
// ============================================================
function authMiddleware(req, res, next) {
  try {
    const email = (typeof getSessionEmail === 'function' ? getSessionEmail(req) : '') ||
                  String((DB.user && DB.user.email) || '').trim().toLowerCase();

    if (!email) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    // DB.user is already hydrated by the session-attaching middleware above.
    // As extra safety, re-hydrate from cache if needed.
    if (!DB.user || String(DB.user.email || '').trim().toLowerCase() !== email) {
      const cached = (DB.users && DB.users[email]) ? DB.users[email] : null;
      if (cached) DB.user = { ...cached };
      normalizeDBUser();
    }

    req.user = DB.user ? { ...DB.user } : { email };
    req.user.email = String(req.user.email || email).trim().toLowerCase();
    return next();
  } catch (e) {
    console.error('authMiddleware error:', e);
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }
}

// ============================================================



// Public Config (Safe)
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});


// ---------------- FOMO (fake social proof) ----------------
// Returns occasional fake activity notifications for the landing page.
// Frontend polls every 5s (public/fomo.js) and shows only when the returned `id` changes.
const FOMO_NAMES = [
  'Ayo','Tobi','Chi','Kemi','Zara','Mika','Nina','Aria','Jay','Santi','Noah','Liam','Ethan','Maya','Ivy','Aisha','Fatima','Amaka','Ola','Rina'
];

const FOMO_LOCATIONS = [
  'Lagos','Abuja','Ibadan','Port Harcourt','Accra','Nairobi','Johannesburg','Cape Town',
  'Manila','Cebu','Davao','BGC','Quezon City','Makati','Dubai','London','Toronto'
];

const FOMO_ACTIONS = [
  'just signed up',
  'just joined',
  'just completed onboarding',
  'just upgraded to Plus',
  'just upgraded to Elite',
  'just unlocked Concierge',
  'just purchased a plan',
  'just applied to become a Creator',
  'just applied to join Premium Society',
  'just got matched',
  'just booked a curated date'
];

function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

let _fomoState = { current: null, nextRotateAt: 0 };

function _makeFomoEvent() {
  const now = Date.now();
  return {
    id: `${now}-${Math.floor(Math.random() * 1e9)}`,
    name: _pick(FOMO_NAMES),
    location: _pick(FOMO_LOCATIONS),
    action: _pick(FOMO_ACTIONS),
    // Keep within the last hour so the frontend won't ignore it.
    timestamp: now - (_randInt(5, 55) * 60 * 1000) // 5–55 minutes ago
  };
}

function _scheduleNextRotate(now) {
  // "Occasional": new event every 3–6 minutes (frontend polls every 5s).
  return now + (_randInt(180, 360) * 1000);
}

app.get('/api/fomo', (req, res) => {
  const now = Date.now();

  if (!_fomoState.current) {
    _fomoState.current = _makeFomoEvent();
    _fomoState.nextRotateAt = _scheduleNextRotate(now);
  } else if (now >= _fomoState.nextRotateAt) {
    _fomoState.current = _makeFomoEvent();
    _fomoState.nextRotateAt = _scheduleNextRotate(now);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json(_fomoState.current);
});

// ---------------- End FOMO ----------------


// ---------------- Opt-in endpoint (Google Sheets) ----------------
// Store opt-in form submissions in a Google Sheet using a Service Account.
// Requirements:
// - Put service_account.json inside /backend (or set GOOGLE_SERVICE_ACCOUNT_PATH)
// - Install dependency: npm i googleapis
// - Share your Google Sheet with the service account email (Editor)
// Optional .env:
// OPTIN_SHEET_ID=...
// OPTIN_SHEET_TAB=Sheet1

const OPTIN_SHEET_ID = (process.env.OPTIN_SHEET_ID || '1NePToYP64nTs-DyILE5B_G8Ns-LSL2a9rI0M_FsGzjc').trim();
const OPTIN_SHEET_TAB = (process.env.OPTIN_SHEET_TAB || 'Hoja 1').trim();
const GOOGLE_SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'service_account.json');

let _optinSheetsClient = null;

function _normalizeIgHandle(h) {
  const s = String(h || '').trim();
  if (!s) return '';
  return s.startsWith('@') ? s.slice(1) : s;
}

function _loadServiceAccountJson() {
  try {
    const raw = fs.readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf8');
    const sa = JSON.parse(raw);
    if (!sa.client_email || !sa.private_key) return null;
    return sa;
  } catch (e) {
    return null;
  }
}

async function _getOptinSheetsClient() {
  if (_optinSheetsClient) return _optinSheetsClient;

  if (!google) {
    throw new Error('googleapis_not_installed');
  }

  const sa = _loadServiceAccountJson();
  if (!sa) {
    throw new Error('service_account_missing');
  }

  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
  const auth = new google.auth.JWT(sa.client_email, null, sa.private_key, scopes);
  _optinSheetsClient = google.sheets({ version: 'v4', auth });
  return _optinSheetsClient;
}

async function _appendOptinToSheet(rowValues) {
  const sheets = await _getOptinSheetsClient();
  const range = `${OPTIN_SHEET_TAB}!A:Z`;

  await sheets.spreadsheets.values.append({
    spreadsheetId: OPTIN_SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [rowValues] }
  });
}

app.post('/api/optin', async (req, res) => {
  try {
    const body = req.body || {};
    const igHandleRaw = body.igHandle || body.ig_handle || '';
    const email = String(body.email || '').trim();
    const city = String(body.city || '').trim();
    const ageRange = String(body.ageRange || '').trim();
    const intent = String(body.intent || '').trim();
    const note = String(body.note || '').trim();
    const updates = !!body.updates;
    const source = String(body.source || '').trim();

    const igHandle = _normalizeIgHandle(igHandleRaw);

    if (!igHandle || !email) {
      return res.status(400).json({ ok: false, message: 'Missing required fields.' });
    }

    const ts = new Date().toISOString();
    const ua = String(req.get('user-agent') || '').slice(0, 250);
    const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

    // Columns:
    // timestamp, ig_handle, email, city, age_range, intent, note, updates, source, ip, user_agent
    const row = [ts, igHandle, email, city, ageRange, intent, note, updates ? 'yes' : 'no', source, ip, ua];

    await _appendOptinToSheet(row);

    return res.json({ ok: true });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);

    if (msg.includes('googleapis_not_installed')) {
      return res.status(500).json({
        ok: false,
        message: 'Server missing dependency "googleapis". Run: npm i googleapis (inside backend).'
      });
    }

    if (msg.includes('service_account_missing')) {
      return res.status(500).json({
        ok: false,
        message: 'Missing/invalid service_account.json. Put it in /backend or set GOOGLE_SERVICE_ACCOUNT_PATH.'
      });
    }

    console.error('[OPTIN] Failed to save opt-in:', err);
    return res.status(500).json({ ok: false, message: 'Failed to save opt-in.' });
  }
});



// ---------------- Admin access (simple secret key) ----------------
// NOTE: palitan mo 'changeme-admin-key' sa .env gamit ADMIN_ACCESS_KEY
// para mas secure sa real deploy.
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || 'changeme-admin-key';

// Dedicated admin login credentials (username + password)
const ADMIN_LOGIN_USERNAME =
  process.env.ADMIN_USERNAME || '@tmadmin2025!';
const ADMIN_LOGIN_PASSWORD =
  process.env.ADMIN_PASSWORD || 'truematchadminbyOS!';

const ADMIN_COOKIE_NAME = 'tm_admin';

// Cookie options for admin session.
// - httpOnly: JS can't read it (safer)
// - sameSite Lax: works for normal navigation
// - secure in production (Railway uses HTTPS)
const ADMIN_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PROD,
  path: '/',
  // 8 hours
  maxAge: 1000 * 60 * 60 * 8
};


const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours (match cookie maxAge)

function createAdminToken() {
  const ts = String(Date.now());
  const sig = crypto.createHmac('sha256', String(ADMIN_ACCESS_KEY)).update(ts).digest('hex');
  return `v1.${ts}.${sig}`;
}

function validateAdminToken(token) {
  try {
    if (!token) return false;
    const parts = String(token).split('.');
    if (parts.length !== 3) return false;
    if (parts[0] !== 'v1') return false;

    const tsStr = parts[1];
    const sig = parts[2] || '';
    const ts = Number(tsStr);
    if (!Number.isFinite(ts)) return false;

    const age = Date.now() - ts;
    if (age < 0 || age > ADMIN_TOKEN_TTL_MS) return false;

    const expected = crypto.createHmac('sha256', String(ADMIN_ACCESS_KEY)).update(String(tsStr)).digest('hex');
    if (expected.length !== sig.length) return false;

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

function getProvidedAdminKey(req) {
  const headerKey = req.headers['x-admin-key'];
  const bodyKey = req.body && req.body.adminKey;
  const queryKey = req.query && req.query.adminKey;
  const cookieKey = req.cookies && req.cookies[ADMIN_COOKIE_NAME];
  return cookieKey || headerKey || bodyKey || queryKey || '';
}

function isValidAdminKey(key) {
  if (!key) return false;
  // Primary: signed token stored in httpOnly cookie
  if (validateAdminToken(key)) return true;

  // Dev-only escape hatch: allow raw ADMIN_ACCESS_KEY for manual testing
  if (!IS_PROD && String(key) === String(ADMIN_ACCESS_KEY)) return true;

  return false;
}

// Small middleware helper: require a valid admin token (cookie) or dev key
function requireAdmin(req, res, next) {
  try {
    const providedKey = getProvidedAdminKey(req);
    if (!isValidAdminKey(providedKey)) {
      return res.status(401).json({ ok: false, message: 'admin_unauthorized' });
    }
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'admin_unauthorized' });
  }
}

function extractIgUsername(igUrlOrUser) {
  if (!igUrlOrUser) return '';
  try {
    const s = String(igUrlOrUser).trim();
    if (s.startsWith('http://') || s.startsWith('https://')) {
      const u = new URL(s);
      const seg = (u.pathname || '').replace(/\/+$/, '').split('/').filter(Boolean)[0] || '';
      return seg.replace(/^@/, '');
    }
    return s.replace(/^@/, '').split(/[/?#]/)[0];
  } catch {
    const s = String(igUrlOrUser).trim();
    return s.replace(/^@/, '').split(/[/?#]/)[0];
  }
}



// ---------------- Firebase (Firestore) setup ----------------
let admin;
let firestore;
let usersCollection;
let hasFirebase = false;
let storageBucket;
let hasStorage = false;

try {
  admin = require('firebase-admin');

  let serviceAccount;

  // Option 1: ENV variable FIREBASE_SERVICE_ACCOUNT (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Option 2: local JSON file (firebase-service-account.json)
    serviceAccount = require('./firebase-service-account.json');
  }

  // Railway/env vars sometimes store private_key with literal "\\n" sequences.
  // Normalize so Google auth/Storage signing works reliably.
  if (serviceAccount && typeof serviceAccount.private_key === 'string' && serviceAccount.private_key.includes('\\n')) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }


  const storageBucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    (serviceAccount && serviceAccount.project_id
      ? `${serviceAccount.project_id}.appspot.com`
      : undefined);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(storageBucketName ? { storageBucket: storageBucketName } : {})
  });

  firestore = admin.firestore();
  usersCollection = firestore.collection('users');
  hasFirebase = true;

  // Firebase Storage (for profile pictures)
  try {
    // Ensure storage module is registered (no-op if already)
    try { require('firebase-admin/storage'); } catch {}
    storageBucket = admin.storage().bucket();
    hasStorage = true;
    console.log(`✅ Firebase Storage enabled — bucket: ${storageBucket.name}`);
  } catch (e) {
    hasStorage = false;
    console.warn('⚠️ Firebase Storage not configured. Avatar uploads will fail unless FIREBASE_STORAGE_BUCKET is set and Storage is enabled.');
  }

  console.log('✅ Firebase initialized — using Firestore as database');
} catch (err) {
  console.warn(
    '⚠️ Firebase not fully configured. Falling back to pure in-memory demo mode.\nReason:',
    err.message
  );
}



// ---------------- Swipe + Match persistence (Firestore-aware) ----------------
// Goal: pass = never show again, like/superlike = stored actions, mutual (like|superlike) => match
const SWIPES_COLLECTION = process.env.SWIPES_COLLECTION || 'iTrueMatchSwipes';
const MATCHES_COLLECTION = process.env.MATCHES_COLLECTION || 'iTrueMatchMatches';
const PS_SWIPES_COLLECTION = process.env.PS_SWIPES_COLLECTION || 'iTrueMatchPSSwipes';
const PS_MATCHES_COLLECTION = process.env.PS_MATCHES_COLLECTION || 'iTrueMatchPSMatches';

function _b64url(str) {
  return Buffer.from(String(str || ''), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function _swipeDocId(fromEmail, toEmail) {
  return `${_b64url(fromEmail)}__${_b64url(toEmail)}`;
}

function _matchDocId(emailA, emailB) {
  const a = String(emailA || '').toLowerCase();
  const b = String(emailB || '').toLowerCase();
  const x = a <= b ? a : b;
  const y = a <= b ? b : a;
  return `${_b64url(x)}__${_b64url(y)}`;
}

function _isPositiveSwipe(t) {
  return t === 'like' || t === 'superlike' || t === 'super';
}

// Lightweight in-memory caches (avoid hammering Firestore)
const _swipeCache = new Map(); // email -> { ts, map }
// Cache of a user's match emails to reduce reads.
// email -> { ts, emails: string[] }
const _matchEmailsCache = new Map();
const _CACHE_TTL_MS = 15 * 1000;

// ---------------------------------------------------------------------
// Premium Society (PS) - separate swipe + match persistence
// Keeps PS swipes/matches isolated from the main dashboard matching engine.
// ---------------------------------------------------------------------
const _psSwipeCache = new Map(); // email -> { ts, map }
const _psMatchEmailsCache = new Map(); // email -> { ts, emails: string[] }

function _ps_setSwipeCache(fromEmail, toEmail, type) {
  const from = String(fromEmail || '').toLowerCase();
  const to = String(toEmail || '').toLowerCase();
  if (!from || !to) return;

  const cached = _psSwipeCache.get(from);
  if (cached && cached.map) {
    cached.map[to] = { type: String(type || '').toLowerCase(), ts: Date.now() };
    cached.ts = Date.now();
  }
}

async function _ps_getSwipeMapFor(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return {};

  if (!hasFirebase || !firestore) {
    return (DB.psSwipes && DB.psSwipes[e]) ? DB.psSwipes[e] : {};
  }

  const cached = _psSwipeCache.get(e);
  if (cached && (Date.now() - cached.ts) < _CACHE_TTL_MS) return cached.map;

  const snap = await firestore
    .collection(PS_SWIPES_COLLECTION)
    .where('from', '==', e)
    .limit(5000)
    .get();

  const map = {};
  for (const d of snap.docs) {
    const v = d.data() || {};
    const to = String(v.to || '').toLowerCase();
    const type = String(v.type || '').toLowerCase();
    if (!to || !type) continue;
    map[to] = { type, ts: Number(v.ts) || Date.now() };
  }

  _psSwipeCache.set(e, { ts: Date.now(), map });
  return map;
}

async function _ps_saveSwipe(fromEmail, toEmail, type) {
  const from = String(fromEmail || '').toLowerCase();
  const to = String(toEmail || '').toLowerCase();
  const t = String(type || '').toLowerCase();
  if (!from || !to || !t) return;

  if (!DB.psSwipes) DB.psSwipes = {};
  if (!DB.psSwipes[from]) DB.psSwipes[from] = {};
  DB.psSwipes[from][to] = { type: t, ts: Date.now() };
  _ps_setSwipeCache(from, to, t);

  if (hasFirebase && firestore) {
    await firestore.collection(PS_SWIPES_COLLECTION).doc(_swipeDocId(from, to)).set(
      { from, to, type: t, ts: Date.now() },
      { merge: true }
    );
  }
}

async function _ps_saveMatch(emailA, emailB, actionA, actionB) {
  const a = String(emailA || '').toLowerCase();
  const b = String(emailB || '').toLowerCase();
  if (!a || !b || a === b) return false;

  // In-memory adjacency list (non-Firebase mode + quick lookups)
  if (!DB.psMatches) DB.psMatches = {};
  DB.psMatches[a] = Array.isArray(DB.psMatches[a]) ? DB.psMatches[a] : [];
  DB.psMatches[b] = Array.isArray(DB.psMatches[b]) ? DB.psMatches[b] : [];
  if (!DB.psMatches[a].includes(b)) DB.psMatches[a].push(b);
  if (!DB.psMatches[b].includes(a)) DB.psMatches[b].push(a);

  // Optional meta for sorting in non-Firebase mode
  if (!DB.psMatchMeta) DB.psMatchMeta = {};
  const createdAtMs = Date.now();
  const [x, y] = [a, b].sort();
  const docId = _matchDocId(x, y);

  DB.psMatchMeta[docId] = {
    createdAtMs: DB.psMatchMeta[docId]?.createdAtMs || createdAtMs,
    updatedAtMs: createdAtMs,
  };

  _psMatchEmailsCache.delete(a);
  _psMatchEmailsCache.delete(b);

  if (!hasFirebase || !firestore) return true;

  // Persist canonical match doc (pair-sorted) + both actions
  const xAction = (x === a) ? actionA : actionB;
  const yAction = (y === b) ? actionB : actionA;

  await firestore.collection(PS_MATCHES_COLLECTION).doc(docId).set({
    a: x,
    b: y,
    aAction: xAction || null,
    bAction: yAction || null,
    createdAtMs: DB.psMatchMeta[docId]?.createdAtMs || createdAtMs,
    updatedAtMs: createdAtMs,
  }, { merge: true });

  return true;
}

async function _ps_getMatchEmails(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return [];

  if (!hasFirebase || !firestore) {
    return Array.isArray(DB.psMatches && DB.psMatches[e]) ? DB.psMatches[e].slice() : [];
  }

  const cached = _psMatchEmailsCache.get(e);
  if (cached && (Date.now() - cached.ts) < _CACHE_TTL_MS) return cached.emails;

  const [snapA, snapB] = await Promise.all([
    firestore.collection(PS_MATCHES_COLLECTION).where('a', '==', e).get(),
    firestore.collection(PS_MATCHES_COLLECTION).where('b', '==', e).get(),
  ]);

  const out = [];
  snapA.forEach((d) => { const v = d.data(); if (v && v.b) out.push(String(v.b).toLowerCase()); });
  snapB.forEach((d) => { const v = d.data(); if (v && v.a) out.push(String(v.a).toLowerCase()); });

  const uniq = Array.from(new Set(out));
  _psMatchEmailsCache.set(e, { ts: Date.now(), emails: uniq });
  return uniq;
}

async function _ps_getMatchPairs(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return [];

  if (!hasFirebase || !firestore) {
    const others = Array.isArray(DB.psMatches && DB.psMatches[e]) ? DB.psMatches[e] : [];
    const pairs = [];
    for (const o of others) {
      const other = String(o || '').toLowerCase();
      if (!other) continue;
      const docId = _matchDocId(e, other);
      const meta = (DB.psMatchMeta && DB.psMatchMeta[docId]) ? DB.psMatchMeta[docId] : {};
      pairs.push({ otherEmail: other, createdAtMs: meta.createdAtMs || null, updatedAtMs: meta.updatedAtMs || null });
    }
    return pairs;
  }

  const [snapA, snapB] = await Promise.all([
    firestore.collection(PS_MATCHES_COLLECTION).where('a', '==', e).get(),
    firestore.collection(PS_MATCHES_COLLECTION).where('b', '==', e).get(),
  ]);

  const tmp = [];
  snapA.forEach((d) => {
    const v = d.data() || {};
    if (!v.b) return;
    tmp.push({ otherEmail: String(v.b).toLowerCase(), createdAtMs: Number(v.createdAtMs) || null, updatedAtMs: Number(v.updatedAtMs) || null });
  });
  snapB.forEach((d) => {
    const v = d.data() || {};
    if (!v.a) return;
    tmp.push({ otherEmail: String(v.a).toLowerCase(), createdAtMs: Number(v.createdAtMs) || null, updatedAtMs: Number(v.updatedAtMs) || null });
  });

  const byOther = new Map();
  for (const it of tmp) {
    if (!it.otherEmail) continue;
    const prev = byOther.get(it.otherEmail);
    if (!prev) byOther.set(it.otherEmail, it);
    else {
      const prevU = prev.updatedAtMs || 0;
      const curU = it.updatedAtMs || 0;
      if (curU >= prevU) byOther.set(it.otherEmail, it);
    }
  }
  return Array.from(byOther.values());
}


async function _getSwipeMapFor(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return {};

  if (!hasFirebase || !firestore) {
    return (DB.swipes && DB.swipes[e]) ? DB.swipes[e] : {};
  }

  const cached = _swipeCache.get(e);
  if (cached && (Date.now() - cached.ts) < _CACHE_TTL_MS) return cached.map;

  const snap = await firestore
    .collection(SWIPES_COLLECTION)
    .where('from', '==', e)
    .limit(5000)
    .get();

  const map = {};
  for (const d of snap.docs) {
    const v = d.data() || {};
    const to = String(v.to || '').toLowerCase();
    const type = String(v.type || '').toLowerCase();
    if (!to || !type) continue;
    map[to] = { type, ts: Number(v.ts) || Date.now() };
  }

  _swipeCache.set(e, { ts: Date.now(), map });
  return map;
}

function _setSwipeCache(fromEmail, toEmail, type) {
  const from = String(fromEmail || '').toLowerCase();
  const to = String(toEmail || '').toLowerCase();
  if (!from || !to) return;

  const cached = _swipeCache.get(from);
  if (cached && cached.map) {
    cached.map[to] = { type: String(type || '').toLowerCase(), ts: Date.now() };
    cached.ts = Date.now();
  }
}

async function _getSwipeType(fromEmail, toEmail) {
  const from = String(fromEmail || '').toLowerCase();
  const to = String(toEmail || '').toLowerCase();
  if (!from || !to) return null;

  if (!hasFirebase || !firestore) {
    const sw = DB.swipes && DB.swipes[from] ? DB.swipes[from][to] : null;
    return sw && sw.type ? String(sw.type) : null;
  }

  const doc = await firestore.collection(SWIPES_COLLECTION).doc(_swipeDocId(from, to)).get();
  if (!doc.exists) return null;
  const v = doc.data() || {};
  const t = String(v.type || '').toLowerCase();
  return t || null;
}

async function _saveSwipe(fromEmail, toEmail, type) {
  const from = String(fromEmail || '').toLowerCase();
  const to = String(toEmail || '').toLowerCase();
  const t = String(type || '').toLowerCase();
  if (!from || !to || !t) return;

  // Memory store (always)
  if (!DB.swipes) DB.swipes = {};
  if (!DB.swipes[from]) DB.swipes[from] = {};
  DB.swipes[from][to] = { type: t, ts: Date.now() };
  _setSwipeCache(from, to, t);

  // Persist to Firestore when enabled
  if (hasFirebase && firestore) {
    await firestore.collection(SWIPES_COLLECTION).doc(_swipeDocId(from, to)).set(
      { from, to, type: t, ts: Date.now() },
      { merge: true }
    );
  }
}


async function _saveMatch(emailA, emailB, actionA, actionB) {
  const a = String(emailA || '').toLowerCase();
  const b = String(emailB || '').toLowerCase();
  if (!a || !b || a === b) return false;

  // Always keep an in-memory adjacency list (used by Moments scope and non-Firebase mode)
  DB.matches[a] = Array.isArray(DB.matches[a]) ? DB.matches[a] : [];
  DB.matches[b] = Array.isArray(DB.matches[b]) ? DB.matches[b] : [];
  if (!DB.matches[a].includes(b)) DB.matches[a].push(b);
  if (!DB.matches[b].includes(a)) DB.matches[b].push(a);

  // Invalidate caches
  _matchEmailsCache.delete(a);
  _matchEmailsCache.delete(b);

  if (!hasFirebase) return true;

  // Persist a canonical match doc (pair-sorted) with both actions
  const createdAtMs = Date.now();
  const [x, y] = [a, b].sort();
  const xAction = (x === a) ? actionA : actionB;
  const yAction = (y === b) ? actionB : actionA;

  const docId = _matchDocId(x, y);
  await firestore.collection(MATCHES_COLLECTION).doc(docId).set({
    a: x,
    b: y,
    aAction: xAction,
    bAction: yAction,
    createdAtMs,
    updatedAtMs: createdAtMs,
  }, { merge: true });

  return true;
}

async function _getMatchEmails(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return [];

  if (!hasFirebase) {
    return Array.isArray(DB.matches[e]) ? DB.matches[e].slice() : [];
  }

  const cached = _matchEmailsCache.get(e);
  if (cached && (Date.now() - cached.ts) < _CACHE_TTL_MS) return cached.emails;

  const [snapA, snapB] = await Promise.all([
    firestore.collection(MATCHES_COLLECTION).where('a', '==', e).get(),
    firestore.collection(MATCHES_COLLECTION).where('b', '==', e).get(),
  ]);

  const out = [];
  snapA.forEach((d) => { const v = d.data(); if (v && v.b) out.push(String(v.b).toLowerCase()); });
  snapB.forEach((d) => { const v = d.data(); if (v && v.a) out.push(String(v.a).toLowerCase()); });

  const uniq = Array.from(new Set(out));
  _matchEmailsCache.set(e, { ts: Date.now(), emails: uniq });
  return uniq;
}

async function _getMatchesFor(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return [];

  if (!hasFirebase) {
    const others = Array.isArray(DB.matches[e]) ? DB.matches[e] : [];
    const out = [];
    for (const other of others) {
      const otherEmail = String(other || '').toLowerCase();
      if (!otherEmail) continue;
      const myType = await _getSwipeType(e, otherEmail);
      const theirType = await _getSwipeType(otherEmail, e);
      out.push({ otherEmail, meAction: myType, themAction: theirType, createdAtMs: null });
    }
    return out;
  }

  const [snapA, snapB] = await Promise.all([
    firestore.collection(MATCHES_COLLECTION).where('a', '==', e).get(),
    firestore.collection(MATCHES_COLLECTION).where('b', '==', e).get(),
  ]);

  const out = [];

  snapA.forEach((doc) => {
    const v = doc.data() || {};
    const otherEmail = String(v.b || '').toLowerCase();
    if (!otherEmail) return;
    out.push({
      otherEmail,
      meAction: v.aAction || null,
      themAction: v.bAction || null,
      createdAtMs: v.createdAtMs || null,
    });
  });

  snapB.forEach((doc) => {
    const v = doc.data() || {};
    const otherEmail = String(v.a || '').toLowerCase();
    if (!otherEmail) return;
    out.push({
      otherEmail,
      meAction: v.bAction || null,
      themAction: v.aAction || null,
      createdAtMs: v.createdAtMs || null,
    });
  });

  return out;
}

// Load persisted prefs cache at boot (only when Firebase is OFF)
if (!hasFirebase) {
  loadPrefsStore();
  loadUsersStore();
  loadSwipesStore();
  loadMomentsStore();
} // <--- IMPORTANTE: Load users & swipes on boot



// ---------------- Helper functions ----------------
function toMillis(v) {
  if (!v) return NaN;
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string') return new Date(v).getTime();

  // Firestore Timestamp support (Admin SDK)
  if (v && typeof v.toDate === 'function') {
    try { return v.toDate().getTime(); } catch {}
  }
  // Some Timestamp-like shapes
  const sec = (typeof v.seconds === 'number') ? v.seconds
           : (typeof v._seconds === 'number') ? v._seconds
           : null;
  if (typeof sec === 'number') {
    const ns = (typeof v.nanoseconds === 'number') ? v.nanoseconds
             : (typeof v._nanoseconds === 'number') ? v._nanoseconds
             : 0;
    return (sec * 1000) + Math.floor(ns / 1e6);
  }

  return NaN;
}

// ---------------- Recent Moments (Stories) helpers ----------------
function momentOwnerIdFromEmail(email) {
  try {
    const e = String(email || '').trim().toLowerCase();
    return crypto.createHash('sha256').update(e).digest('hex').slice(0, 16);
  } catch {
    return String(email || '').slice(0, 16);
  }
}

function parseBase64DataUrl(input) {
  const raw = String(input || '');
  const m = raw.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], b64: m[2] };
}

function mimeToExt(mime) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  if (m === 'image/gif') return 'gif';
  if (m === 'video/mp4') return 'mp4';
  if (m === 'video/webm') return 'webm';
  if (m === 'video/quicktime') return 'mov';
  return '';
}

function cleanupExpiredMoments() {
  try {
    const now = Date.now();
    const before = Array.isArray(DB.moments) ? DB.moments.length : 0;
    DB.moments = (Array.isArray(DB.moments) ? DB.moments : []).filter(m => (m && Number(m.expiresAtMs) > now));
    const after = DB.moments.length;
    if (!hasFirebase && before !== after) saveMomentsStore();
  } catch {}
}

// [UPDATED] Helper: Anong data ang makikita ng frontend
function publicUser(doc) {
  if (!doc) return null;

  const email = doc.email || doc.userEmail || '';
  const planRaw = doc.plan || doc.tier || 'free';
  const plan = normalizePlanKey(planRaw);

  const planEnd = doc.planEnd ?? doc.subscriptionEnd ?? doc.subEnd ?? null;
  const planStart = doc.planStart ?? doc.subscriptionStart ?? doc.subStart ?? null;

  const planActive = _computePlanActiveForDoc(plan, planEnd, doc.planActive);

  // Normalize "createdAt" for sorting/debug (keeps original field on response too)
  const createdAt = doc.createdAt ?? doc.created_at ?? null;

  return {
    id: doc.id || doc.uid || doc.userId || null,
    uid: doc.uid || doc.id || doc.userId || null,
    email,
    name: doc.name || doc.fullName || '',
    handle: doc.handle || doc.username || (doc.creatorApplication && doc.creatorApplication.handle) || '',
    username: doc.username || doc.handle || '',
    phone: doc.phone || doc.phoneNumber || doc.phone_number || '',
    linkedAccounts: doc.linkedAccounts || doc.linked_accounts || null,
    city: doc.city || doc.location || '',
    age: doc.age ?? null,
    creatorApplication: doc.creatorApplication ?? doc.creator_application ?? null,
    avatarUrl: doc.avatarUrl || doc.avatar || '',
    creatorStatus: doc.creatorStatus ?? doc.creator_status ?? null,
    hasCreatorAccess: Boolean(doc.hasCreatorAccess ?? doc.creatorApproved ?? false),
    premiumStatus: doc.premiumStatus ?? doc.premium_status ?? null,
    premiumSince: doc.premiumSince ?? doc.premium_since ?? null,
    premiumApplication: doc.premiumApplication ?? doc.premium_application ?? null,
verified: Boolean(doc.verified),
    emailVerified: Boolean(doc.emailVerified || doc.email_verified),
    plan,                 // free | tier1 | tier2 | tier3
    planActive,           // boolean computed
    planStart,
    planEnd,
    createdAt,
    lastLoginAt: doc.lastLoginAt ?? doc.last_login_at ?? null,
    lastSeenAt: doc.lastSeenAt ?? doc.last_seen_at ?? null,
  };
}

function normalizeDBUser() {
  if (!DB.user || typeof DB.user !== 'object') return;
  // Never keep auth secrets in DB.user (frontend-safe object)
  if ('passwordHash' in DB.user) delete DB.user.passwordHash;
  if ('_pwHash' in DB.user) delete DB.user._pwHash;
}


async function findUserByEmail(email) {
  const emailNorm = String(email || '').trim().toLowerCase();
  if (!emailNorm) return null;

  // Local JSON store fallback
  if (!hasFirebase || !usersCollection) {
    const u = (DB.users && typeof DB.users === 'object') ? DB.users[emailNorm] : null;
    if (!u) return null;
    return { id: u.id || u._id || null, ...u, email: emailNorm };
  }

  const snap = await usersCollection.where('email', '==', emailNorm).limit(1).get();
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

async function createUserDoc(data) {
  const emailNorm = String((data && data.email) || '').trim().toLowerCase();
  const createdAtLocal = new Date();

  // Local JSON store fallback
  if (!hasFirebase || !usersCollection) {
    if (!emailNorm) return null;
    const id = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    DB.users = DB.users && typeof DB.users === 'object' ? DB.users : {};
    const doc = { id, ...data, email: emailNorm, createdAt: createdAtLocal };
    DB.users[emailNorm] = { ...doc };
    saveUsersStore();
    return doc;
  }

  const ref = await usersCollection.add({
    ...data,
    createdAt: admin
      ? admin.firestore.FieldValue.serverTimestamp()
      : createdAtLocal
  });

  return { id: ref.id, ...data };
}


async function updateUserByEmail(email, fields) {
  const emailNorm = String(email || '').trim().toLowerCase();
  if (!emailNorm) return null;

  const existing = await findUserByEmail(emailNorm);
  if (!existing) return null;

  // Local JSON store fallback
  if (!hasFirebase || !usersCollection) {
    DB.users = DB.users && typeof DB.users === 'object' ? DB.users : {};
    const next = { ...existing, ...fields, email: emailNorm };
    DB.users[emailNorm] = { ...next };
    saveUsersStore();
    return next;
  }

  await usersCollection.doc(existing.id).update(fields);
  return { ...existing, ...fields };
}


async function uploadAvatarDataUrlToStorage(email, avatarDataUrl, prevAvatarPath) {
  if (!hasFirebase || !admin) {
    throw new Error('firebase not configured');
  }
  if (!hasStorage || !storageBucket) {
    throw new Error('storage not configured');
  }

  const raw = String(avatarDataUrl || '');
  const m = raw.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!m) {
    throw new Error('invalid avatar data');
  }

  const mime = m[1];
  const b64 = m[2];
  const buf = Buffer.from(b64, 'base64');

  // Safety: ~4MB decoded max (since request limit is 5mb)
  const maxBytes = 4 * 1024 * 1024;
  if (buf.length > maxBytes) {
    throw new Error('avatar too large');
  }

  // Best-effort cleanup of previous file
  if (prevAvatarPath) {
    try {
      await storageBucket.file(prevAvatarPath).delete({ ignoreNotFound: true });
    } catch {}
  }

  const token = (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

  const safeEmail = String(email || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');

  const ext =
    mime === 'image/png' ? 'png' :
    (mime === 'image/webp' ? 'webp' : 'jpg');

  const filePath = `avatars/${safeEmail}/${Date.now()}.${ext}`;
  const file = storageBucket.file(filePath);

  await file.save(buf, {
    resumable: false,
    contentType: mime,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token
      }
    }
  });

  // Firebase-style download URL (works with download tokens)
  const encoded = encodeURIComponent(filePath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${storageBucket.name}/o/${encoded}?alt=media&token=${token}`;

  return { url, path: filePath };
}


async function uploadHeaderDataUrlToStorage(email, headerDataUrl, prevHeaderPath) {
  if (!hasFirebase || !admin) {
    throw new Error('firebase not configured');
  }
  if (!hasStorage || !storageBucket) {
    throw new Error('storage not configured');
  }

  const raw = String(headerDataUrl || '');
  const m = raw.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!m) {
    throw new Error('invalid header data');
  }

  const mime = m[1];
  const b64 = m[2];
  const buf = Buffer.from(b64, 'base64');

  // Safety: ~4MB decoded max (since request limit is 5mb)
  const maxBytes = 4 * 1024 * 1024;
  if (buf.length > maxBytes) {
    throw new Error('header too large');
  }

  // Best-effort cleanup of previous file
  if (prevHeaderPath) {
    try {
      await storageBucket.file(prevHeaderPath).delete({ ignoreNotFound: true });
    } catch {}
  }

  const token = (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

  const safeEmail = String(email || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');

  const ext =
    mime === 'image/png' ? 'png' :
    (mime === 'image/webp' ? 'webp' : 'jpg');

  const filePath = `headers/${safeEmail}/${Date.now()}.${ext}`;
  const file = storageBucket.file(filePath);

  await file.save(buf, {
    resumable: false,
    metadata: {
      contentType: mime,
      metadata: { firebaseStorageDownloadTokens: token }
    }
  });

  // Public download URL
  const bucketName = storageBucket.name;
  const publicUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;

  return { url: publicUrl, path: filePath };
}


// ---------- Shortlist & dates helpers (plan-based serving) ----------
async function loadShortlistState(email) {
  if (!email) {
    return {
      shortlist: [],
      shortlistLastDate: null,
      plan: DB.user.plan || null,
      prefs: DB.prefs || null
    };
  }

  if (hasFirebase && usersCollection) {
    const doc = await findUserByEmail(email);
    if (!doc) {
      return { shortlist: [], shortlistLastDate: null, plan: null, prefs: null };
    }
    return {
      shortlist: doc.shortlist || [],
      shortlistLastDate: doc.shortlistLastDate || null,
      plan: doc.plan || null,
      prefs: doc.prefs || null
    };
  }

  if (!DB.shortlistState[email]) {
    DB.shortlistState[email] = {
      shortlist: [],
      shortlistLastDate: null
    };
  }

  return {
    shortlist: DB.shortlistState[email].shortlist || [],
    shortlistLastDate: DB.shortlistState[email].shortlistLastDate || null,
    plan: DB.user.plan || null,
    prefs: DB.prefs || null
  };
}

async function saveShortlistState(email, state) {
  if (!email) return;

  if (hasFirebase && usersCollection) {
    await updateUserByEmail(email, {
      shortlist: state.shortlist,
      shortlistLastDate: state.shortlistLastDate
    });
  } else {
    DB.shortlistState[email] = {
      shortlist: state.shortlist,
      shortlistLastDate: state.shortlistLastDate
    };
  }
}

function generateDemoProfiles(count, prefs = {}) {
  const city = prefs.city || 'Lagos';
  const base = Date.now();
  const out = [];

  for (let i = 0; i < count; i++) {
    const idx = i + 1;
    out.push({
      id: `p_${base}_${idx}`,
      name: `Candidate ${idx}`,
      username: `candidate_${idx}`,
      city,
      ageRange: `${20 + (idx % 10)}–${25 + (idx % 10)}`,
      score: 80 + (idx % 20),
      igUrl: `https://instagram.com/candidate_${idx}`,
      photoUrl: `https://i.pravatar.cc/240?img=${(idx % 70) + 1}`,
      avatar: `https://i.pravatar.cc/240?img=${(idx % 70) + 1}`,
      status: 'pending',
      servedAt: new Date().toISOString()
    });
  }

  return out;
}


async function serveShortlistForToday(email) {
  const today = formatYYYYMMDD(new Date());

  const state = await loadShortlistState(email);
  const stateShortlist = Array.isArray(state.shortlist) ? state.shortlist : [];

  // Determine plan + activeness (prefer stored state; fallback to DB.user when available)
  const planKey = normalizePlanKey(state.plan || (DB.user && DB.user.plan) || 'free');

  // Only Elite + Concierge can receive served shortlists
  const eligible = (planKey === 'tier2' || planKey === 'tier3');

  let inferredEnd = state.planEnd || (DB.user && DB.user.planEnd) || null;
  let inferredFlag = (typeof state.planActive === 'boolean') ? state.planActive : (DB.user && typeof DB.user.planActive === 'boolean' ? DB.user.planActive : undefined);
  const active = _computePlanActiveForDoc(planKey, inferredEnd, inferredFlag);

  const rule = PLAN_RULES[planKey] || { dailyCap: 0, canShortlist: false };
  const dailyCap = (eligible && active) ? (rule.dailyCap || 0) : 0;

  if (!eligible) {
    return { ok: true, date: today, plan: planKey, dailyCap, servedToday: 0, items: [], reason: 'not_eligible' };
  }
  if (!active) {
    return { ok: true, date: today, plan: planKey, dailyCap, servedToday: 0, items: [], reason: 'inactive' };
  }

  // Reset daily count when the date changes
  const lastDate = state.shortlistLastDate || null;
  const servedToday = (lastDate === today) ? (state.shortlistServedToday || 0) : 0;

  // If already served today, just return stored shortlist
  if (servedToday >= 1 && stateShortlist.length) {
    return {
      ok: true,
      date: today,
      plan: planKey,
      dailyCap,
      servedToday,
      items: stateShortlist,
      fromCache: true
    };
  }

  // If no shortlist exists in state, nothing to serve
  if (!stateShortlist.length) {
    return { ok: true, date: today, plan: planKey, dailyCap, servedToday, items: [] };
  }

  // Mark as served
  await saveShortlistState(email, {
    shortlistLastDate: today,
    shortlistServedToday: 1
  });

  return { ok: true, date: today, plan: planKey, dailyCap, servedToday: 1, items: stateShortlist };
}

async function addScheduledDate(email, profile) {
  if (!email || !profile) return;

  if (hasFirebase && usersCollection) {
    const existing = await findUserByEmail(email);
    if (!existing) return;
    const current = Array.isArray(existing.scheduledDates)
      ? existing.scheduledDates
      : [];
    current.push(profile);
    await usersCollection.doc(existing.id).update({ scheduledDates: current });
  } else {
    if (!DB.datesState[email]) DB.datesState[email] = [];
    DB.datesState[email].push(profile);
  }
}

async function loadScheduledDates(email) {
  if (!email) return [];

  if (hasFirebase && usersCollection) {
    const existing = await findUserByEmail(email);
    if (!existing || !Array.isArray(existing.scheduledDates)) return [];
    return existing.scheduledDates;
  }

  return DB.datesState[email] || [];
}


// ✅ Approved helpers (Firestore or demo memory)
async function addApprovedProfile(email, profile) {
  if (!email || !profile) return;

  if (hasFirebase && usersCollection) {
    const existing = await findUserByEmail(email);
    if (!existing) return;

    const current = Array.isArray(existing.approvedProfiles)
      ? existing.approvedProfiles
      : [];

    const exists = current.some((p) => String(p.id) === String(profile.id));
    if (!exists) current.push(profile);

    await usersCollection.doc(existing.id).update({ approvedProfiles: current });
  } else {
    if (!DB.approvedState[email]) DB.approvedState[email] = [];
    const exists = DB.approvedState[email].some((p) => String(p.id) === String(profile.id));
    if (!exists) DB.approvedState[email].push(profile);
  }
}


async function saveApprovedProfiles(email, list){
  if (!email) return;
  if (hasFirebase && usersCollection){
    const existing = await findUserByEmail(email);
    if (!existing) return;
    await usersCollection.doc(existing.id).update({ approvedProfiles: Array.isArray(list) ? list : [] });
  } else {
    DB.approvedState[email] = Array.isArray(list) ? list : [];
  }
}
async function loadApprovedProfiles(email) {
  if (!email) return [];

  if (hasFirebase && usersCollection) {
    const existing = await findUserByEmail(email);
    if (!existing || !Array.isArray(existing.approvedProfiles)) return [];
    return existing.approvedProfiles;
  }

  return DB.approvedState[email] || [];
}

// ---------------- Security helpers -------------------
function isValidEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e || e.length > 254) return false;
  // Simple, safe email sanity check (not RFC-perfect on purpose)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isStrongPassword(pw) {
  const p = String(pw || '');
  if (p.length < 8 || p.length > 72) return false; // bcrypt max is 72
  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasNum = /\d/.test(p);
  return hasLower && hasUpper && hasNum;
}

// ---------------- Auth: REGISTER -------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, city } = req.body || {};

    const emailNorm = (email || '').toString().trim().toLowerCase();
    const pass = (password || '').toString();
    const nameNorm = (name || '').toString().trim();

    if (!emailNorm || !pass) {
      return res.status(400).json({ ok: false, message: 'email & password required' });
    }

    if (!isValidEmail(emailNorm)) {
      return res.status(400).json({ ok: false, message: 'invalid_email' });
    }

    if (!isStrongPassword(pass)) {
      return res.status(400).json({ ok: false, message: 'weak_password' });
    }

    // Rate limit registrations (anti-abuse)
    if (!rateLimitOr429(req, res, _rlKey(req, 'register'), 10, 60 * 60 * 1000, 'too_many_requests')) return;
    if (!rateLimitOr429(req, res, _rlKey(req, `register:${emailNorm}`), 3, 60 * 60 * 1000, 'too_many_requests')) return;

    // If prod and Firebase is missing, do NOT fall back to insecure demo auth.
    if (IS_PROD && !hasFirebase) {
      return res.status(503).json({ ok: false, message: 'auth_backend_misconfigured' });
    }

    // ❗ Demo mode kung walang Firebase
    if (!hasFirebase) {
      const bcrypt = require('bcryptjs');
      const pwHash = await bcrypt.hash(pass, 10);

      // fresh per-user state (do NOT inherit global DB.user/DB.prefs)
      DB.user = {
        id: 'demo-1',
        email: emailNorm,
        name: nameNorm || emailNorm.split('@')[0] || 'User',
        city: city ? String(city) : '',
        plan: 'free',
        planStart: new Date().toISOString(),
        planEnd: null,
        avatarUrl: '',
        prefsSaved: false,
        planActive: true
      };

      // reset per-email prefs to empty on first register
      DB.prefsByEmail[emailNorm] = null;
      DB.prefs = null;

      DB.shortlistState[emailNorm] = { shortlist: [], shortlistLastDate: null };
      DB.datesState[emailNorm] = [];

      // cache clean baseline user for middleware hydration (store password hash privately)
      DB.users[emailNorm] = { ...DB.user, _pwHash: pwHash };

      // set cookie session (so protected pages work even in demo/local mode)
      setSession(res, emailNorm);

      return res.json({ ok: true, user: DB.user, demo: true });
    }

    // Check kung existing na sa Firestore
    const existing = await findUserByEmail(emailNorm);
    if (existing) {
      // Avoid email enumeration in production
      return res.status(409).json({ ok: false, message: 'unable_to_register' });
    }

    const passwordHash = await bcrypt.hash(pass, 10);

    const docData = {
      email: emailNorm,
      passwordHash,
      name: nameNorm || emailNorm.split('@')[0] || 'User',
      city: city ? String(city) : '',
      plan: 'free',
      planStart: new Date().toISOString(),
      planEnd: null,
      avatarUrl: '',
      prefsSaved: false,
      emailVerified: false,
      prefs: null,
      planActive: true,
      shortlist: [],
      shortlistLastDate: null,
      scheduledDates: []
    };

    const newUser = await createUserDoc(docData);

    DB.user = publicUser(newUser);
    DB.prefs = null;


    DB.users[emailNorm] = { ...DB.user };
    DB.prefsByEmail[emailNorm] = DB.prefs;
    setSession(res, emailNorm);
    saveUsersStore();
    return res.json({ ok: true, user: DB.user });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ---------------- Auth: LOGIN -------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const emailNorm = (email || '').toString().trim().toLowerCase();
    const pass = (password || '').toString();

    if (!emailNorm || !pass) {
      return res.status(400).json({ ok: false, message: 'email & password required' });
    }

    if (!isValidEmail(emailNorm)) {
      clearSession(res);
      return res.status(401).json({ ok: false, message: 'invalid credentials' });
    }

    // Rate limit logins (anti-bruteforce)
    if (!rateLimitOr429(req, res, _rlKey(req, 'login'), 30, 15 * 60 * 1000, 'too_many_requests')) return;
    if (!rateLimitOr429(req, res, _rlKey(req, `login:${emailNorm}`), 10, 15 * 60 * 1000, 'too_many_requests')) return;

    // If prod and Firebase is missing, do NOT fall back to insecure demo auth.
    if (IS_PROD && !hasFirebase) {
      clearSession(res);
      return res.status(503).json({ ok: false, message: 'auth_backend_misconfigured' });
    }

    // ✅ DEV bypass accounts (demo1/demo2/demo3): auto-create + auto-activate tier/prefs
    if (ALLOW_TEST_BYPASS && process.env.NODE_ENV !== 'production') {
      const demo = TEST_BYPASS_ACCOUNTS[emailNorm];
      if (demo && pass === demo.password) {
        const now = new Date();
        const rule = PLAN_RULES[demo.plan] || PLAN_RULES.tier1;
        const planStart = now.toISOString();
        const planEnd = new Date(now.getTime() + rule.durationDays * DAY_MS).toISOString();

        if (hasFirebase) {
          let userDoc;
          try {
            try {
              userDoc = await findUserByEmail(emailNorm);
            } catch (dbErr) {
              console.error('login DB lookup failed:', dbErr);
              return res.status(503).json({
                ok: false,
                message: 'Auth database unavailable. Please try again.'
              });
            }

          } catch (dbErr) {
            console.error('login DB lookup failed:', dbErr);
            return res.status(503).json({
              ok: false,
              message: 'Auth database unavailable. Please try again.'
            });
          }

          const passwordHash = await bcrypt.hash(pass, 10);

          if (!userDoc) {
            userDoc = await createUserDoc({
              email: emailNorm,
              passwordHash,
              name: demo.name,
              city: demo.city,
              plan: demo.plan,
              planStart,
              planEnd,
              avatarUrl: '',
              prefsSaved: true,
              prefs: demo.prefs,
              shortlist: [],
              shortlistLastDate: null,
              scheduledDates: [],
              approvedProfiles: []
            });
          } else {
            // If you previously created a broken demo doc (missing passwordHash), fix it here
            const fields = {
              name: demo.name,
              city: demo.city,
              plan: demo.plan,
              planStart,
              planEnd,
              prefsSaved: true,
              prefs: demo.prefs
            };
            if (!userDoc.passwordHash) fields.passwordHash = passwordHash;
            userDoc = await updateUserByEmail(emailNorm, fields);
          }

          DB.prefs = userDoc.prefs || demo.prefs;
          DB.user = publicUser(userDoc);
          DB.user.prefsSaved = true;
        } else {
          // fallback: in-memory demo mode
          DB.user.email = emailNorm;
          DB.user.name = demo.name;
          DB.user.city = demo.city;
          DB.user.plan = demo.plan;
          DB.user.planStart = planStart;
          DB.user.planEnd = planEnd;
          DB.user.planActive = true;
          DB.user.prefsSaved = true;

          DB.prefs = demo.prefs;
          DB.users[emailNorm] = { ...DB.user };
          DB.prefsByEmail[emailNorm] = DB.prefs;
        }

        // Cache + set session cookie so other pages show the right user
        DB.users[emailNorm] = { ...DB.user };
        DB.prefsByEmail[emailNorm] = DB.prefs;

        setSession(res, emailNorm);
        return res.json({ ok: true, user: DB.user, bypass: true });
      }
    }

// ❗ Demo mode fallback (no Firebase)
    if (!hasFirebase) {
      // Safety: NEVER allow insecure demo-auth in production
      if (IS_PROD) {
        clearSession(res);
        return res.status(503).json({ ok: false, message: 'auth_backend_misconfigured' });
      }

      // Special demo account (only if explicitly enabled)
      const isSpecialDemo = ENABLE_SPECIAL_DEMO && DEMO_EMAIL && DEMO_PASSWORD && (emailNorm === DEMO_EMAIL) && (pass === DEMO_PASSWORD);

      // Require an existing registered user in demo/local mode (prevents "any password works")
      const stored = DB.users[emailNorm] || null;
      const storedHash = stored && stored._pwHash ? String(stored._pwHash) : '';

      if (!isSpecialDemo) {
        if (!stored || !storedHash) {
          clearSession(res);
          return res.status(401).json({ ok: false, message: 'invalid credentials' });
        }
        const ok = await bcrypt.compare(pass, storedHash);
        if (!ok) {
          clearSession(res);
          return res.status(401).json({ ok: false, message: 'invalid credentials' });
        }
      }

      // hydrate clean per-user state (do NOT inherit previous DB.user)
      if (stored) {
        DB.user = { ...stored };
  normalizeDBUser();
      } else {
        DB.user = {
          id: 'demo-1',
          email: emailNorm,
          name: emailNorm.split('@')[0] || 'User',
          city: '—',
          plan: null,
          planStart: null,
          planEnd: null,
          avatarUrl: '',
          prefsSaved: false,
          planActive: false
        };
      }

      // Never expose stored password hash to the client
      if (DB.user && Object.prototype.hasOwnProperty.call(DB.user, '_pwHash')) delete DB.user._pwHash;

      // load per-email prefs (default null)
      DB.prefs = Object.prototype.hasOwnProperty.call(DB.prefsByEmail, emailNorm)
        ? DB.prefsByEmail[emailNorm]
        : null;

      if (isSpecialDemo) {
        // SPECIAL DEMO ACCOUNT IN PURE IN-MEMORY MODE
        const now  = new Date();
        const rule = PLAN_RULES['tier3'];

        DB.user.name       = 'Demo User';
        DB.user.city       = DB.user.city || 'Manila';
        DB.user.plan       = 'tier3';
        DB.user.planStart  = now.toISOString();
        DB.user.planEnd    = new Date(now.getTime() + rule.durationDays * DAY_MS).toISOString();
        DB.user.planActive = true;

        // Default prefs so preferences step is already done
        DB.prefs = DB.prefs || {
          city: 'Manila',
          ageMin: 21,
          ageMax: 35,
          lookingFor: ['women']
        };
        DB.user.prefsSaved = true;
      } else {
        DB.user.prefsSaved = Boolean(DB.prefs);

        // recompute planActive based on planEnd if present
        if (DB.user.plan && DB.user.planEnd) {
          const endTs = new Date(DB.user.planEnd).getTime();
          DB.user.planActive = !Number.isNaN(endTs) && Date.now() <= endTs;
        } else {
          DB.user.planActive = false;
        }
      }

      if (!DB.shortlistState[emailNorm]) {
        DB.shortlistState[emailNorm] = { shortlist: [], shortlistLastDate: null };
      }
      if (!DB.datesState[emailNorm]) {
        DB.datesState[emailNorm] = [];
      }

      // persist user state back to memory store (keep password hash private)
      DB.users[emailNorm] = { ...DB.user, _pwHash: storedHash };
      DB.prefsByEmail[emailNorm] = DB.prefs;

      setSession(res, emailNorm);
      saveUsersStore();

      return res.json({ ok: true, user: DB.user, demo: isSpecialDemo });
    }

    // ---------- Firebase mode ----------
    let userDoc;
    try {
      try {
        userDoc = await findUserByEmail(emailNorm);
      } catch (dbErr) {
        console.error('login DB lookup failed:', dbErr);
        return res.status(503).json({
          ok: false,
          message: 'Auth database unavailable. Please try again.'
        });
      }

    } catch (dbErr) {
      console.error('login DB lookup failed:', dbErr);
      return res.status(503).json({
        ok: false,
        message: 'Auth database unavailable. Please try again.'
      });
    }

    // SPECIAL DEMO ACCOUNT (auto-create if missing)
    if (!userDoc && ENABLE_SPECIAL_DEMO && DEMO_EMAIL && DEMO_PASSWORD && emailNorm === DEMO_EMAIL && pass === DEMO_PASSWORD) {
      const passwordHash = await bcrypt.hash(pass, 10);
      const now          = new Date();
      const rule         = PLAN_RULES['tier3'];
      const planStart    = now.toISOString();
      const planEnd      = new Date(now.getTime() + rule.durationDays * DAY_MS).toISOString();

      const docData = {
        email: emailNorm,
        passwordHash,
        name: 'Aries Aquino (Demo)',
        city: 'Manila',
        plan: 'tier3',
        planStart,
        planEnd,
        avatarUrl: '',
        prefsSaved: true,
        prefs: {
          city: 'Manila',
          ageMin: 21,
          ageMax: 35,
          lookingFor: ['women']
        },
        planActive: true,
        shortlist: [],
        shortlistLastDate: null,
        scheduledDates: []
      };

      const newUser = await createUserDoc(docData);

      DB.prefs = docData.prefs;
      DB.user  = publicUser(newUser);
      DB.user.prefsSaved = true;

      return res.json({ ok: true, user: DB.user, demo: true });
    }

    if (!userDoc) {
      clearSession(res);
      return res.status(401).json({ ok: false, message: 'invalid credentials' });
    }

    if (!userDoc.passwordHash) {
      clearSession(res);
      return res.status(401).json({ ok: false, message: 'invalid credentials' });
    }

    let ok = false;

    try {

      ok = await bcrypt.compare(pass, userDoc.passwordHash);

    } catch (hashErr) {

      console.error('login password hash compare failed:', hashErr);

      return res.status(401).json({

        ok: false,

        message: 'Invalid email or password.'

      });

    }

    if (!ok) {
      clearSession(res);
      return res.status(401).json({ ok: false, message: 'invalid credentials' });
    }

    // Ensure every logged-in user has at least the free plan
    if (!userDoc.plan) {
      userDoc.plan = 'free';
      userDoc.planActive = true;
      userDoc.planStart = userDoc.planStart || new Date().toISOString();
      userDoc.planEnd = null;

      if (hasFirebase) {
        try {
          await updateUserByEmail(emailNorm, {
            plan: 'free',
            planActive: true,
            planStart: userDoc.planStart,
            planEnd: null,
          });
        } catch (e) {
          console.warn('Failed to persist free plan on login:', e);
        }
      }
    }

    DB.prefs = userDoc.prefs || null;
    DB.user = publicUser(userDoc);
    DB.user.prefsSaved = Boolean(DB.prefs || userDoc.prefsSaved);


    DB.users[emailNorm] = { ...DB.user };
    DB.prefsByEmail[emailNorm] = DB.prefs;
    setSession(res, emailNorm);

    return res.json({ ok: true, user: DB.user });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ---------------- Auth: LOGOUT (clears cookie session) -------------------
app.post('/api/auth/logout', (req, res) => {
  clearSession(res);
  setAnonState();
  return res.json({ ok: true });
});


// ---------------- Auth: FORGOT PASSWORD (reset via emailed link) ----------------
app.post('/api/auth/forgot/request', async (req, res) => {
  try{
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok:false, message:'email required' });

    if (IS_PROD && !hasFirebase) {
      return res.status(503).json({ ok:false, message:'auth_backend_misconfigured' });
    }

    // Basic anti-abuse (per-IP). We always respond OK to avoid email enumeration.
    if (!rateLimitOr429(req, res, _rlKey(req, 'forgot_request'), 5, 15 * 60 * 1000, 'too_many_requests')) return;

    let userExists = false;
    if (hasFirebase) {
      try { userExists = !!(await findUserByEmail(email)); } catch { userExists = false; }
    } else {
      userExists = !!DB.users[email];
    }

    if (userExists) {
      const token = b64urlEncode(crypto.randomBytes(32));
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const now = Date.now();
      const exp = now + (30 * 60 * 1000); // 30 minutes

      // store (memory)
      DB.resetTokens[tokenHash] = { email, exp, createdAt: now };

      // store (Firestore) for production reliability
      if (hasFirebase && firestore) {
        try{
          await firestore.collection('iTrueMatchPasswordResets').doc(tokenHash).set({
            email,
            exp,
            createdAt: now
          });
        }catch(err){
          console.warn('[forgot] Firestore store warn:', err?.message || err);
        }
      }

      const base = String(process.env.PUBLIC_BASE_URL || '').replace(/\/+$/g, '');
      const baseOk = Boolean(base) && (!IS_PROD || String(base).startsWith('https://'));
      if (baseOk) {
        const resetUrl = `${base}/auth.html?mode=reset&token=${encodeURIComponent(token)}`;
        try{
          await sendPasswordResetEmail(email, resetUrl);
        }catch(err){
          console.warn('[forgot] email send warn:', err?.message || err);
        }
      } else {
        console.warn('[forgot] PUBLIC_BASE_URL is missing/invalid; cannot build reset link email.');
      }
    }

    // Always OK (no enumeration)
    return res.json({ ok:true, message:'if_account_exists_reset_sent' });
  }catch(err){
    console.error(err);
    return res.status(500).json({ ok:false, message:'server_error' });
  }
});

// ---------------- Auth: FORGOT PASSWORD (OTP reset) ----------------
// Step 1: send a 6-digit code to the email (always responds OK to prevent enumeration)
app.post('/api/auth/forgot/send-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, message: 'email required' });

    if (IS_PROD && !hasFirebase) {
      return res.status(503).json({ ok: false, message: 'auth_backend_misconfigured' });
    }

    // Anti-abuse (per-IP). Always OK response (no enumeration).
    if (!rateLimitOr429(req, res, _rlKey(req, 'forgot_otp_send'), 6, 15 * 60 * 1000, 'too_many_requests')) return;

    let userExists = false;
    if (hasFirebase) {
      try { userExists = !!(await findUserByEmail(email)); } catch { userExists = false; }
    } else {
      userExists = !!DB.users[email];
    }

    if (userExists) {
      const now = Date.now();
      const key = crypto.createHash('sha256').update(`forgot:${email}`).digest('hex');

      // Pull existing record (memory/Firestore) for resend throttling
      let rec = DB.forgotOtps[key] || null;
      if (!rec && hasFirebase && firestore) {
        try {
          const snap = await firestore.collection('iTrueMatchPasswordResetOtps').doc(key).get();
          if (snap.exists) rec = snap.data();
        } catch (e) {
          console.warn('[forgot-otp] Firestore read warn:', e?.message || e);
        }
      }

      const lastSentAt = rec && rec.lastSentAt ? normalizeEpochMs(rec.lastSentAt) : 0;
      if (lastSentAt && (now - lastSentAt) < RESEND_GAP_MS) {
        return res.json({ ok: true, message: 'resend_wait' });
      }

      const code = generateCode();
      const bcrypt = require('bcryptjs');
      const codeHash = await bcrypt.hash(code, 10);
      const exp = now + CODE_TTL_MS;

      const next = {
        email,
        codeHash,
        exp,
        createdAt: rec?.createdAt || now,
        lastSentAt: now,
        attempts: 0
      };

      DB.forgotOtps[key] = next;

      if (hasFirebase && firestore) {
        try {
          await firestore.collection('iTrueMatchPasswordResetOtps').doc(key).set(next, { merge: true });
        } catch (e) {
          console.warn('[forgot-otp] Firestore store warn:', e?.message || e);
        }
      }

      try {
        await sendPasswordResetOtpEmail(email, code);
      } catch (e) {
        console.warn('[forgot-otp] email send warn:', e?.message || e);
      }
    }

    return res.json({ ok: true, message: 'if_account_exists_code_sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'server_error' });
  }
});

// Step 2: verify code + set new password
app.post('/api/auth/forgot/reset-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').replace(/\D/g, '');
    const newPassword = String(req.body?.newPassword || '').trim();

    if (!email || !code || code.length !== 6 || !newPassword) {
      return res.status(400).json({ ok: false, message: 'email, 6-digit code, and newPassword required' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ ok: false, message: 'weak_password' });
    }

    // Anti-abuse (per-IP)
    if (!rateLimitOr429(req, res, _rlKey(req, 'forgot_otp_reset'), 12, 15 * 60 * 1000, 'too_many_requests')) return;

    const key = crypto.createHash('sha256').update(`forgot:${email}`).digest('hex');
    let rec = DB.forgotOtps[key] || null;

    if (!rec && hasFirebase && firestore) {
      try {
        const snap = await firestore.collection('iTrueMatchPasswordResetOtps').doc(key).get();
        if (snap.exists) rec = snap.data();
      } catch (e) {
        console.warn('[forgot-otp] Firestore read warn:', e?.message || e);
      }
    }

    const now = Date.now();
    const expMs = rec ? normalizeEpochMs(rec.exp) : 0;
    if (!rec || !expMs || now > expMs) {
      // cleanup
      delete DB.forgotOtps[key];
      if (hasFirebase && firestore) {
        try { await firestore.collection('iTrueMatchPasswordResetOtps').doc(key).delete(); } catch {}
      }
      return res.status(400).json({ ok: false, message: 'invalid_or_expired_code' });
    }

    const attempts = Number(rec.attempts || 0);
    if (attempts >= 8) {
      delete DB.forgotOtps[key];
      if (hasFirebase && firestore) {
        try { await firestore.collection('iTrueMatchPasswordResetOtps').doc(key).delete(); } catch {}
      }
      return res.status(400).json({ ok: false, message: 'invalid_or_expired_code' });
    }

    const bcrypt = require('bcryptjs');
    const ok = await bcrypt.compare(code, String(rec.codeHash || rec.hash || rec.code_hash || ''));
    if (!ok) {
      rec.attempts = attempts + 1;
      DB.forgotOtps[key] = rec;
      if (hasFirebase && firestore) {
        try { await firestore.collection('iTrueMatchPasswordResetOtps').doc(key).set({ attempts: rec.attempts }, { merge: true }); } catch {}
      }
      return res.status(400).json({ ok: false, message: 'invalid_or_expired_code' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (hasFirebase) {
      const updated = await updateUserByEmail(email, { passwordHash, passwordUpdatedAt: now });
      if (!updated) {
        // No enumeration: treat as invalid
        delete DB.forgotOtps[key];
        if (firestore) {
          try { await firestore.collection('iTrueMatchPasswordResetOtps').doc(key).delete(); } catch {}
        }
        return res.status(400).json({ ok: false, message: 'invalid_or_expired_code' });
      }
    } else {
      if (!DB.users[email]) {
        delete DB.forgotOtps[key];
        return res.status(400).json({ ok: false, message: 'invalid_or_expired_code' });
      }
      DB.users[email].passwordHash = passwordHash;
      DB.users[email].passwordUpdatedAt = now;
      try { saveUsersStore(); } catch {}
    }

    // invalidate OTP
    delete DB.forgotOtps[key];
    if (hasFirebase && firestore) {
      try { await firestore.collection('iTrueMatchPasswordResetOtps').doc(key).delete(); } catch {}
    }

    return res.json({ ok: true, message: 'password_reset_ok' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'server_error' });
  }
});

app.post('/api/auth/forgot/reset', async (req, res) => {
  try{
    const token = String(req.body?.token || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();

    if (!token || !newPassword) return res.status(400).json({ ok:false, message:'token and newPassword required' });
    if (!isStrongPassword(newPassword)) return res.status(400).json({ ok:false, message:'weak_password' });

    // Basic anti-abuse (per-IP)
    if (!rateLimitOr429(req, res, _rlKey(req, 'forgot_reset'), 10, 15 * 60 * 1000, 'too_many_requests')) return;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    let rec = DB.resetTokens[tokenHash] || null;

    // if not in memory, try Firestore
    if (!rec && hasFirebase && firestore) {
      try{
        const snap = await firestore.collection('iTrueMatchPasswordResets').doc(tokenHash).get();
        if (snap.exists) rec = snap.data();
      }catch(err){
        console.warn('[forgot] Firestore read warn:', err?.message || err);
      }
    }

    if (!rec) return res.status(400).json({ ok:false, message:'invalid_or_expired_token' });

    const now = Date.now();
    if (rec.exp && now > Number(rec.exp)) {
      // cleanup
      delete DB.resetTokens[tokenHash];
      if (hasFirebase && firestore) {
        try{ await firestore.collection('iTrueMatchPasswordResets').doc(tokenHash).delete(); } catch {}
      }
      return res.status(400).json({ ok:false, message:'invalid_or_expired_token' });
    }

    if (!hasFirebase) {
      // demo/in-memory environment does not enforce passwords consistently
      delete DB.resetTokens[tokenHash];
      return res.status(501).json({ ok:false, message:'password_reset_not_available_in_demo_mode' });
    }

    const email = String(rec.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok:false, message:'invalid_or_expired_token' });

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // update user doc (Firestore)
    const updated = await updateUserByEmail(email, { passwordHash, passwordUpdatedAt: now });
    if (!updated) {
      return res.status(400).json({ ok:false, message:'invalid_or_expired_token' });
    }

    // invalidate token
    delete DB.resetTokens[tokenHash];
    if (firestore) {
      try{ await firestore.collection('iTrueMatchPasswordResets').doc(tokenHash).delete(); }catch{}
    }

    return res.json({ ok:true, message:'password_reset_ok' });
  }catch(err){
    console.error(err);
    return res.status(500).json({ ok:false, message:'server_error' });
  }
});

// ---------------- Mock OAuth -------------------
app.post('/api/auth/oauth/mock', (_req, res) => {
  if (!DB.user) DB.user = {};
  if (!DB.user.email) {
    DB.user.email = 'oauth-demo@truematch.app';
    DB.user.name = DB.user.name || 'Demo User';
  }
  DB.user.prefsSaved = Boolean(DB.prefs);
  DB.user.planActive = false;
  return res.json({ ok: true, user: DB.user });
});

// ---------------- Current user -------------------
// GET /api/me - Current User Session (cookie-based)
// This uses the same email cookie + in-memory DB that login / logout already maintain.
// Firestore is still the source of truth on login; here we only read the cached user.
app.get('/api/me', async (req, res) => {
  try {
    const email = getSessionEmail(req);
    if (!email) {
      return res.json({ ok: false, user: null, demo: false });
    }

    // Prefer source-of-truth (Firestore) when available; fallback to in-memory cache.
    let user = null;

    if (hasFirebase) {
      try {
        const fresh = await findUserByEmail(email);
        if (fresh) user = { id: fresh.id, ...fresh };
      } catch (e) {
        // ignore and fallback
      }
    }

    if (!user) {
      user = DB.users[email] || null;
      if (!user && DB.user && DB.user.email === email) {
        user = { ...DB.user };
      }
    }

    if (!user) {
      return res.json({ ok: false, user: null, demo: false });
    }

    // Attach prefs from cache (populated at login and when saving preferences)
    const prefs = DB.prefsByEmail[email] || DB.prefs || null;
    const prefsSaved = Boolean(prefs || user.prefsSaved);

    // Keep central DB pointers in sync
    DB.user = { ...user, prefsSaved };
  normalizeDBUser();
    DB.prefs = prefs || null;
    DB.users[email] = { ...DB.user };
    if (prefs) {
      DB.prefsByEmail[email] = prefs;
    }

    const responseUser = {
      ...DB.user,
      prefsSaved,
      preferences: prefs || null
    };

    return res.json({
      ok: true,
      user: responseUser,
      prefs,
      demo: Boolean(TEST_BYPASS_ACCOUNTS[email]) || (ENABLE_SPECIAL_DEMO && DEMO_EMAIL && email === DEMO_EMAIL)
    });
  } catch (err) {
    console.error('error in /api/me:', err);
    return res.status(500).json({ ok: false, user: null, message: 'internal error' });
  }
});

// ---------------- Home widgets: Admirers + Active Nearby -------------------
// These endpoints are used by dashboard.js Home panel widgets:
// - GET /api/me/admirers?limit=12
// - GET /api/me/active-nearby?limit=9
// They are intentionally lightweight and only return public profile fields.

function _miniProfileFromDoc(doc, emailFallback) {
  const d = doc ? (doc.id ? { id: doc.id, ...doc } : { ...doc }) : {};
  const pu = (typeof publicUser === 'function') ? (publicUser(d) || {}) : (d || {});
  const email = String(pu.email || emailFallback || '').trim().toLowerCase();
  return {
    email,
    name: pu.name || pu.fullName || pu.displayName || pu.username || 'Member',
    age: (pu.age !== undefined && pu.age !== null && pu.age !== '') ? pu.age : null,
    city: pu.city || pu.location || null,
    photoUrl: pu.avatarUrl || pu.photoUrl || pu.avatar || 'assets/images/truematch-mark.png'
  };
}

function _isPremiumCandidateDoc(u) {
  const pk = normalizePlanKey((u && u.plan) || 'free');
  const act = (u && typeof u.planActive === 'boolean') ? u.planActive : true;
  return pk !== 'free' && act !== false;
}

// Who liked you (not yet acted on by you)
app.get('/api/me/admirers', authMiddleware, async (req, res) => {
  try {
    const myEmail = String((req.user && req.user.email) || '').trim().toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const limitRaw = Number(req.query && req.query.limit ? req.query.limit : 12);
    const limit = Math.max(1, Math.min(50, Number.isFinite(limitRaw) ? limitRaw : 12));

    const userDoc = (DB.users && DB.users[myEmail]) || DB.user || {};
    const planKey = normalizePlanKey((req.user && req.user.plan) || userDoc.plan || 'free');
    const planActive = (typeof userDoc.planActive === 'boolean') ? userDoc.planActive
                      : (typeof req.user.planActive === 'boolean') ? req.user.planActive
                      : true;

    // Locked for free or inactive subscriptions (server side; frontend also locks for free)
    const locked = (planKey === 'free') || (planActive === false);

    // My outgoing swipes (so we can show only "new" likes)
    const mySwipes = await _getSwipeMapFor(myEmail);
    const hasActedOn = (otherEmail) => {
      const e = String(otherEmail || '').trim().toLowerCase();
      if (!e) return false;
      return !!(mySwipes && mySwipes[e]);
    };

    // Collect incoming positive swipes (bounded scan to keep it light)
    const SCAN_MAX = Math.max(200, Math.min(800, limit * 20));
    const incoming = [];

    if (hasFirebase && firestore) {
      let snap = null;
      try {
        snap = await firestore
          .collection(SWIPES_COLLECTION)
          .where('to', '==', myEmail)
          .where('type', 'in', ['like', 'superlike', 'super'])
          .limit(SCAN_MAX)
          .get();
      } catch (e) {
        // Fallback: if "in" query is not allowed (older Firestore rules), use a single equality query.
        snap = await firestore
          .collection(SWIPES_COLLECTION)
          .where('to', '==', myEmail)
          .limit(SCAN_MAX)
          .get();
      }

      for (const d of (snap && snap.docs) ? snap.docs : []) {
        const v = d.data() || {};
        const from = String(v.from || '').trim().toLowerCase();
        const type = String(v.type || '').trim().toLowerCase();
        const ts = Number(v.ts) || 0;
        if (!from || from === myEmail) continue;
        if (!_isPositiveSwipe(type)) continue;
        if (hasActedOn(from)) continue; // only show new/unseen likes
        incoming.push({ email: from, ts });
      }
    } else {
      const sw = DB.swipes && typeof DB.swipes === 'object' ? DB.swipes : {};
      for (const from of Object.keys(sw)) {
        const fromEmail = String(from || '').trim().toLowerCase();
        if (!fromEmail || fromEmail === myEmail) continue;
        const rec = sw[fromEmail] && sw[fromEmail][myEmail] ? sw[fromEmail][myEmail] : null;
        if (!rec) continue;
        const type = String(rec.type || '').trim().toLowerCase();
        const ts = Number(rec.ts) || 0;
        if (!_isPositiveSwipe(type)) continue;
        if (hasActedOn(fromEmail)) continue; // only show new/unseen likes
        incoming.push({ email: fromEmail, ts });
      }
    }

    // Sort newest first
    incoming.sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0));

    const count = incoming.length;

    // For locked users, return only count (marketing); items omitted
    if (locked) {
      return res.json({ ok: true, count, locked: true, items: [] });
    }

    // Build items
    const items = [];
    for (const it of incoming.slice(0, limit)) {
      const e = String(it.email || '').trim().toLowerCase();
      if (!e) continue;

      let doc = null;
      if (hasFirebase) {
        try { doc = await findUserByEmail(e); } catch { doc = null; }
      } else {
        doc = (DB.users && DB.users[e]) ? { ...DB.users[e] } : null;
      }

      const mini = _miniProfileFromDoc(doc || { email: e }, e);
      // Ensure email always present
      mini.email = e;
      items.push(mini);
    }

    return res.json({ ok: true, count, locked: false, items });
  } catch (e) {
    console.error('GET /api/me/admirers error:', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Active nearby (simple: same city if available; premium users see premium-only)
app.get('/api/me/active-nearby', authMiddleware, async (req, res) => {
  try {
    const myEmail = String((req.user && req.user.email) || '').trim().toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const limitRaw = Number(req.query && req.query.limit ? req.query.limit : 9);
    const limit = Math.max(1, Math.min(30, Number.isFinite(limitRaw) ? limitRaw : 9));

    const userDoc = (DB.users && DB.users[myEmail]) || DB.user || {};
    const planKey = normalizePlanKey((req.user && req.user.plan) || userDoc.plan || 'free');
    const planActive = (typeof userDoc.planActive === 'boolean') ? userDoc.planActive
                      : (typeof req.user.planActive === 'boolean') ? req.user.planActive
                      : true;

    const isPremium = (planKey !== 'free') && (planActive !== false);

    const myCity = String(userDoc.city || userDoc.location || '').trim();
    const out = [];

    const pushCandidate = (doc) => {
      const mini = _miniProfileFromDoc(doc, doc && doc.email ? doc.email : '');
      const e = String(mini.email || '').trim().toLowerCase();
      if (!e || e === myEmail) return;
      if (isPremium && !_isPremiumCandidateDoc(doc || mini)) return; // premium-only browsing
      out.push({ ...mini, email: e });
    };

    if (hasFirebase && usersCollection) {
      let snap = null;
      try {
        if (myCity && myCity !== '—') {
          snap = await usersCollection.where('city', '==', myCity).limit(80).get();
        } else {
          snap = await usersCollection.limit(80).get();
        }
      } catch (e) {
        // fallback: no city index/rules
        snap = await usersCollection.limit(80).get();
      }

      for (const d of (snap && snap.docs) ? snap.docs : []) {
        const u = { id: d.id, ...(d.data() || {}) };
        const e = String(u.email || '').trim().toLowerCase();
        if (!e || e === myEmail) continue;
        if (myCity && myCity !== '—') {
          const c = String(u.city || u.location || '').trim();
          if (c && c !== myCity) continue;
        }
        if (isPremium && !_isPremiumCandidateDoc(u)) continue;
        pushCandidate(u);
        if (out.length >= limit) break;
      }
    } else {
      const all = Object.values(DB.users || {});
      for (const u0 of all) {
        const u = u0 || {};
        const e = String(u.email || '').trim().toLowerCase();
        if (!e || e === myEmail) continue;
        if (myCity && myCity !== '—') {
          const c = String(u.city || u.location || '').trim();
          if (c && c !== myCity) continue;
        }
        if (isPremium && !_isPremiumCandidateDoc(u)) continue;
        pushCandidate(u);
        if (out.length >= limit) break;
      }
    }

    return res.json({ ok: true, items: out.slice(0, limit) });
  } catch (e) {
    console.error('GET /api/me/active-nearby error:', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});


// ---------------- Notifications (Dashboard bell) -------------------
// Simple per-user notifications stored under users/{id}/notifications.
// Frontend: dashboard.js loads these when the bell is opened.
const NOTIFS_SUBCOL = process.env.NOTIFS_SUBCOL || 'notifications';
const NOTIFS_DEFAULT_LIMIT = 30;

function _tsToMs(v) {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  // Firestore Timestamp
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v && typeof v === 'object' && typeof v._seconds === 'number') {
    const ms = (Number(v._seconds) * 1000) + Math.floor(Number(v._nanoseconds || 0) / 1e6);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

function _normalizeNotif(id, data) {
  const createdAtMs = _tsToMs(data.createdAt) || _tsToMs(data.createdAtMs) || Date.now();
  const readAtMs = _tsToMs(data.readAt) || _tsToMs(data.readAtMs) || 0;
  return {
    id: String(id || data.id || ''),
    type: String(data.type || 'system'),
    title: String(data.title || ''),
    message: String(data.message || data.text || ''),
    href: data.href ? String(data.href) : '',
    createdAtMs,
    readAtMs: readAtMs || 0
  };
}

async function _seedWelcomeNotifIfMissing(userId, emailNorm) {
  try {
    const payload = {
      type: 'system',
      title: 'Welcome to iTrueMatch',
      message: 'Your account is secured with OTP and signed sessions. If you forget your password, use the Reset Password flow anytime.',
      href: '',
      createdAt: admin && admin.firestore ? admin.firestore.FieldValue.serverTimestamp() : Date.now(),
      readAt: null
    };

    // Local JSON / demo fallback
    if (!hasFirebase || !usersCollection || !userId) {
      DB.notificationsByEmail = DB.notificationsByEmail && typeof DB.notificationsByEmail === 'object' ? DB.notificationsByEmail : {};
      const arr = Array.isArray(DB.notificationsByEmail[emailNorm]) ? DB.notificationsByEmail[emailNorm] : [];
      const exists = arr.some(n => n && String(n.id) === 'welcome_v1');
      if (!exists) {
        arr.unshift(_normalizeNotif('welcome_v1', { ...payload, createdAtMs: Date.now(), readAtMs: 0 }));
        DB.notificationsByEmail[emailNorm] = arr;
      }
      return;
    }

    const ref = usersCollection.doc(userId).collection(NOTIFS_SUBCOL).doc('welcome_v1');
    const snap = await ref.get();
    if (snap.exists) return;
    await ref.set(payload, { merge: true });
  } catch (e) {
    console.warn('seed welcome notification failed:', e?.message || e);
  }
}

app.get('/api/me/notifications', authMiddleware, async (req, res) => {
  try {
    const email = String(req.user && req.user.email ? req.user.email : '').trim().toLowerCase();
    if (!email) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const limitRaw = Number(req.query && req.query.limit ? req.query.limit : NOTIFS_DEFAULT_LIMIT);
    const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : NOTIFS_DEFAULT_LIMIT));

    const user = await findUserByEmail(email);
    const userId = user && user.id ? String(user.id) : '';

    await _seedWelcomeNotifIfMissing(userId, email);

    // Local JSON fallback
    if (!hasFirebase || !usersCollection || !userId) {
      DB.notificationsByEmail = DB.notificationsByEmail && typeof DB.notificationsByEmail === 'object' ? DB.notificationsByEmail : {};
      const arr = Array.isArray(DB.notificationsByEmail[email]) ? DB.notificationsByEmail[email] : [];
      const items = arr.slice(0, limit).map(n => _normalizeNotif(n.id, n));
      const unreadCount = items.filter(n => !n.readAtMs).length;
      return res.json({ ok: true, items, unreadCount });
    }

    const snap = await usersCollection
      .doc(userId)
      .collection(NOTIFS_SUBCOL)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const items = snap.docs.map(d => _normalizeNotif(d.id, d.data() || {}));
    const unreadCount = items.filter(n => !n.readAtMs).length;

    return res.json({ ok: true, items, unreadCount });
  } catch (e) {
    console.error('GET /api/me/notifications error:', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.post('/api/me/notifications/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const email = String(req.user && req.user.email ? req.user.email : '').trim().toLowerCase();
    if (!email) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const user = await findUserByEmail(email);
    const userId = user && user.id ? String(user.id) : '';

    // Local JSON fallback
    if (!hasFirebase || !usersCollection || !userId) {
      DB.notificationsByEmail = DB.notificationsByEmail && typeof DB.notificationsByEmail === 'object' ? DB.notificationsByEmail : {};
      const arr = Array.isArray(DB.notificationsByEmail[email]) ? DB.notificationsByEmail[email] : [];
      const now = Date.now();
      for (const n of arr) {
        if (n && !n.readAtMs && !n.readAt) {
          n.readAtMs = now;
          n.readAt = now;
        }
      }
      DB.notificationsByEmail[email] = arr;
      return res.json({ ok: true });
    }

    const ref = usersCollection.doc(userId).collection(NOTIFS_SUBCOL);
    const snap = await ref.orderBy('createdAt', 'desc').limit(200).get();

    const batch = firestore.batch();
    let touched = 0;
    const nowField = admin && admin.firestore ? admin.firestore.FieldValue.serverTimestamp() : new Date();

    snap.docs.forEach(d => {
      const data = d.data() || {};
      const readAtMs = _tsToMs(data.readAt) || _tsToMs(data.readAtMs) || 0;
      if (!readAtMs) {
        batch.set(d.ref, { readAt: nowField }, { merge: true });
        touched += 1;
      }
    });

    if (touched > 0) {
      await batch.commit();
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/me/notifications/mark-all-read error:', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// ============================================================

// ---------------- Recent Moments (Stories) -------------------
// A "moment" is a short-lived media post (photo/video) that expires after 24 hours.
// We scope the feed by default to: {self + matches}. Use ?scope=all only for debugging.

app.get('/api/moments/list', async (req, res) => {
  try {
    const now = Date.now();

    const scope = String((req.query || {}).scope || 'matches').toLowerCase();
    const email = getSessionEmail(req);
    let allowedEmails = null;
    if (scope !== 'all') {
      if (!email) {
        return res.json({ ok: true, moments: [] });
      }
      const matchEmails = await _getMatchEmails(email);
      allowedEmails = new Set([email, ...matchEmails.map(e => String(e || '').toLowerCase())]);
    }

    if (hasFirebase && firestore) {
      // Query by expiry (inequality requires ordering by same field)
      const snap = await firestore
        .collection('moments')
        .where('expiresAtMs', '>', now)
        .orderBy('expiresAtMs', 'desc')
        .limit(120)
        .get();

      const out = [];
      for (const d of snap.docs) {
        const v = d.data() || {};

        const ownerEmail = String(v.ownerEmail || '').toLowerCase();
        if (allowedEmails && !allowedEmails.has(ownerEmail)) continue;

        // If stored in Storage, regenerate a fresh signed URL on each request
        let mediaUrl = v.mediaUrl || '';
        if (v.storagePath && hasStorage && storageBucket) {
          try {
            const file = storageBucket.file(String(v.storagePath));
            const [signedUrl] = await file.getSignedUrl({
              action: 'read',
              expires: new Date(Date.now() + 1000 * 60 * 60 * 48) // 48h
            });
            mediaUrl = signedUrl;
          } catch (e) {
            // Keep fallback mediaUrl
          }
        }

        out.push({
          id: d.id,
          ownerId: v.ownerId || momentOwnerIdFromEmail(v.ownerEmail || ''),
          ownerName: v.ownerName || '',
          ownerAvatarUrl: v.ownerAvatarUrl || '',
          mediaUrl,
          mediaType: v.mediaType || '',
          caption: v.caption || '',
          createdAtMs: Number(v.createdAtMs) || now,
          expiresAtMs: Number(v.expiresAtMs) || (now + 1000 * 60 * 60 * 24)
        });
      }

      return res.json({ ok: true, moments: out });
    }

    // Non-Firebase fallback
    cleanupExpiredMoments();
    const all = Array.isArray(DB.moments) ? DB.moments : [];
    const moments = all
      .filter(m => m && Number(m.expiresAtMs) > now)
      .filter(m => {
        if (!allowedEmails) return true;
        const oe = String(m.ownerEmail || '').toLowerCase();
        return oe && allowedEmails.has(oe);
      })
      .sort((a, b) => Number(b.createdAtMs) - Number(a.createdAtMs))
      .slice(0, 120)
      .map(m => ({
        id: m.id,
        ownerId: m.ownerId,
        ownerName: m.ownerName,
        ownerAvatarUrl: m.ownerAvatarUrl || '',
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        caption: m.caption || '',
        createdAtMs: Number(m.createdAtMs) || now,
        expiresAtMs: Number(m.expiresAtMs) || (now + 1000 * 60 * 60 * 24)
      }));

    return res.json({ ok: true, moments });
  } catch (e) {
    console.error('moments/list error:', e);
    return res.status(500).json({ ok: false, moments: [] });
  }
});

app.post('/api/moments/create', async (req, res) => {
  try {
    const email = getSessionEmail(req);
    if (!email) return res.status(401).json({ ok: false, message: 'not logged in' });

    const body = req.body || {};
    const dataUrl = body.mediaDataUrl;
    const caption = (body.caption || '').toString().slice(0, 180);

    const parsed = parseBase64DataUrl(dataUrl);
    if (!parsed || !parsed.mime || !parsed.b64) {
      return res.status(400).json({ ok: false, message: 'invalid media payload' });
    }

    const mime = parsed.mime;
    if (!/^image\//.test(mime) && !/^video\//.test(mime)) {
      return res.status(400).json({ ok: false, message: 'unsupported media type' });
    }

    const ext = mimeToExt(mime);
    if (!ext) {
      return res.status(400).json({ ok: false, message: 'unsupported file extension' });
    }

    const buf = Buffer.from(parsed.b64, 'base64');
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB hard limit
    if (!buf || !buf.length) {
      return res.status(400).json({ ok: false, message: 'empty media' });
    }
    if (buf.length > MAX_BYTES) {
      return res.status(413).json({ ok: false, message: 'media too large (max 10MB)' });
    }

    const now = Date.now();
    const id = `m_${now}_${Math.random().toString(16).slice(2, 10)}`;
    const owner = DB.users[email] || DB.user || {};
    const ownerName = owner.name || '';
    const ownerAvatarUrl = owner.avatarUrl || '';
    const ownerId = momentOwnerIdFromEmail(email);

    const moment = {
      id,
      ownerId,
      ownerEmail: email,
      ownerName,
      ownerAvatarUrl,
      mediaUrl: '',
      storagePath: '',
      mediaType: mime,
      caption,
      createdAtMs: now,
      expiresAtMs: now + 1000 * 60 * 60 * 24
    };

    // Prefer Firebase Storage when available.
    if (hasFirebase && hasStorage && storageBucket) {
      const safeEmail = email.replace(/[^a-z0-9@._-]/gi, '_');
      const storagePath = `moments/${safeEmail}/${id}.${ext}`;
      const file = storageBucket.file(storagePath);
      await file.save(buf, {
        contentType: mime,
        resumable: false,
        metadata: { cacheControl: 'private, max-age=3600' }
      });

      moment.storagePath = storagePath;

      // We store a placeholder; list endpoint will generate a fresh signed URL.
      moment.mediaUrl = '';

      try {
        await firestore.collection('moments').doc(id).set({
          ownerId,
          ownerEmail: email,
          ownerName,
          ownerAvatarUrl,
          storagePath,
          mediaUrl: '',
          mediaType: mime,
          caption,
          createdAtMs: moment.createdAtMs,
          expiresAtMs: moment.expiresAtMs
        });
      } catch (e) {
        console.warn('Failed to store moment metadata in Firestore:', e?.message || e);
      }

      return res.json({ ok: true, moment: { id, ownerId, ownerName, ownerAvatarUrl, mediaType: mime, createdAtMs: moment.createdAtMs, expiresAtMs: moment.expiresAtMs } });
    }

    // Fallback: save file to local public/uploads/moments
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'moments');
    try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}

    const filename = `${id}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buf);

    moment.mediaUrl = `/uploads/moments/${filename}`;

    DB.moments = Array.isArray(DB.moments) ? DB.moments : [];
    DB.moments.push(moment);
    cleanupExpiredMoments();
    if (!hasFirebase) saveMomentsStore();

    return res.json({ ok: true, moment: { id, ownerId, ownerName, ownerAvatarUrl, mediaUrl: moment.mediaUrl, mediaType: mime, createdAtMs: moment.createdAtMs, expiresAtMs: moment.expiresAtMs } });
  } catch (e) {
    console.error('moments/create error:', e);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});


/**
 * Preferences endpoints live below.
 */
// ---------------- Preferences -------------------

// Fetch the current user's preferences (used by preferences.js to prefill the UI)
app.get('/api/me/preferences', async (req, res) => {
  try {
    const email = getSessionEmail(req);
    if (!email) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const userEmail = String(email).toLowerCase();

    // Prefer per-user cached prefs
    let prefs = (DB.prefsByEmail && DB.prefsByEmail[userEmail]) ? DB.prefsByEmail[userEmail] : null;

    // Backward-compat: older flows stored a single DB.prefs for the logged-in user
    if (!prefs && DB.user && DB.user.email && String(DB.user.email).toLowerCase() === userEmail) {
      prefs = DB.prefs || null;
    }

    // If we have Firestore, use it as source of truth when available
    if ((!prefs || (typeof prefs === 'object' && Object.keys(prefs).length === 0)) && hasFirebase) {
      const userDoc = await findUserByEmail(userEmail);
      if (userDoc && userDoc.prefs && typeof userDoc.prefs === 'object') {
        prefs = userDoc.prefs;
      }
    }

    return res.json({ ok: true, prefs: prefs || null });
  } catch (e) {
    console.error('me/preferences get error:', e);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

app.post('/api/me/preferences', async (req, res) => {
  try {
    const body = req.body || {};

    const cityRaw = body.city;
    const ageMinRaw = (typeof body.ageMin !== 'undefined') ? body.ageMin : body.minAge;
    const ageMaxRaw = (typeof body.ageMax !== 'undefined') ? body.ageMax : body.maxAge;
    const lookingRaw = (typeof body.lookingFor !== 'undefined') ? body.lookingFor : body.looking_for;
    const ethRaw = body.ethnicity;

    const city = (cityRaw || '').toString().trim();
    const min = Number(ageMinRaw);
    const max = Number(ageMaxRaw);

    if (!city) {
      return res.status(400).json({ ok: false, message: 'city required' });
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 18 || max < min) {
      return res.status(400).json({ ok: false, message: 'invalid age range' });
    }

    // normalize + validate ethnicity (optional)
    const allowedEth = new Set(['african','asian','caucasian','hispanic','middle-eastern','mixed','other']);
    let eth = undefined;
    if (typeof ethRaw !== 'undefined' && ethRaw !== null) {
      const cand = String(ethRaw).trim().toLowerCase();
      if (allowedEth.has(cand)) eth = cand;
    }

    // normalize lookingFor to an array of strings
    let lf = [];
    if (Array.isArray(lookingRaw)) {
      lf = lookingRaw.map(v => String(v).trim()).filter(Boolean);
    } else if (typeof lookingRaw === 'string') {
      if (lookingRaw.includes(',')) {
        lf = lookingRaw.split(',').map(s => s.trim()).filter(Boolean);
      } else if (lookingRaw.trim()) {
        lf = [lookingRaw.trim()];
      }
    }

    lf = lf.map((v) => String(v).trim().toLowerCase()).filter(Boolean);


    const allowedLF = new Set(['women', 'men']);


    const badLF = lf.find((v) => !allowedLF.has(v));


    if (badLF) {


      return res.status(400).json({ ok: false, message: 'lookingFor must be women or men' });


    }


    


    if (!lf.length) {
      return res.status(400).json({ ok: false, message: 'lookingFor required' });
    }

    // Save in memory
    DB.prefs = {
      city,
      ageMin: min,
      ageMax: max,
      lookingFor: lf,
      ...(eth ? { ethnicity: eth } : {})
    };
    DB.user.prefsSaved = true;

    // IMPORTANT: persist to per-email cache so next requests keep it
    const email = DB.user?.email || getSessionEmail(req);
    if (email) {
      DB.prefsByEmail[email] = DB.prefs;
      if (DB.users[email]) {
        DB.users[email].prefsSaved = true;
      } else {
        DB.users[email] = { ...(DB.user || {}), email, prefsSaved: true };
      }

      // Persist to disk only when Firebase is OFF (demo/local fallback)
      if (!hasFirebase) {
        try {
          savePrefsStore();
        } catch (err) {
          console.warn('error saving prefs store:', err);
        }
      }
    }

    // Push to Firestore if available
    if (hasFirebase && email) {
      try {
        await updateUserByEmail(email, { prefs: DB.prefs, prefsSaved: true });
      } catch (err) {
        console.error('error saving prefs to Firestore:', err);
      }
    }

    return res.json({ ok: true, prefs: DB.prefs });
  } catch (err) {
    console.error('error in /api/me/preferences:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});
// ---------------- Update Profile (name/email/password/avatar) ----------------
// [UPDATED] Update Profile (Handles EVERYTHING: Info, Avatar, Password, Age, City, Username, Phone)
// Uses cookie session (tm_session) so email changes don't break the session.
app.post('/api/me/profile', async (req, res) => {
  try {
    const sessionEmail = getSessionEmail(req);
    if (!sessionEmail) {
      return res.status(401).json({ ok: false, message: 'not_logged_in' });
    }

    // 1) Pull + sanitize
    let {
      name,
      email,
      password,
      avatarDataUrl,
      avatarUrl,
      headerDataUrl,
      headerUrl,
      age,
      city,
      username,
      phone,
      requireProfileCompletion
    } = req.body || {};

    name = (name || '').toString().trim();
    email = (email || '').toString().trim().toLowerCase();
    city = (city || '').toString().trim();
    username = (username || '').toString().trim();
    phone = (phone || '').toString().trim();
    age = (typeof age !== 'undefined' && age !== null && age !== '') ? Number(age) : null;
    avatarDataUrl = (avatarDataUrl || '').toString();
    avatarUrl = (avatarUrl || '').toString();
    headerDataUrl = (headerDataUrl || '').toString();
    headerUrl = (headerUrl || '').toString();
    requireProfileCompletion = !!requireProfileCompletion;

    // 2) Validate
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, message: 'invalid_email' });
    }

    if (username) {
      const u = username;
      // Keep it simple + safe for URLs/handles
      const ok =
        u.length >= 3 &&
        u.length <= 24 &&
        /^[a-zA-Z0-9._]+$/.test(u) &&
        !/^\./.test(u) &&
        !/\.$/.test(u) &&
        !/\.\./.test(u);
      if (!ok) {
        return res.status(400).json({ ok: false, message: 'invalid_username' });
      }
    }

    if (phone) {
      // Very permissive (international); frontend can format better
      const ok = phone.length <= 32 && /^[0-9+()\-\s.]+$/.test(phone);
      if (!ok) {
        return res.status(400).json({ ok: false, message: 'invalid_phone' });
      }
    }

    const oldEmail = sessionEmail;

    // 3) Build update fields (only update provided values)
    const fields = {};
    if (name) fields.name = name;
    if (email) fields.email = email;
    if (username) fields.username = username;
    if (phone) fields.phone = phone;
    if (Number.isFinite(age)) fields.age = age;
    if (city) fields.city = city;

    // Fetch existing user doc (for existing avatar path/url) when Firebase is ON
    let existingDoc = null;
    if (hasFirebase && usersCollection) {
      try { existingDoc = await findUserByEmail(oldEmail); } catch {}
    }

    const existingAvatarUrl =
      (existingDoc && existingDoc.avatarUrl) ||
      (DB.users && DB.users[oldEmail] && DB.users[oldEmail].avatarUrl) ||
      (DB.user && DB.user.avatarUrl) ||
      '';

    const existingAvatarPath =
      (existingDoc && existingDoc.avatarPath) ||
      (DB.users && DB.users[oldEmail] && DB.users[oldEmail].avatarPath) ||
      (DB.user && DB.user.avatarPath) ||
      '';

    const existingHeaderPath =
      (existingDoc && existingDoc.headerPath) ||
      (DB.users && DB.users[oldEmail] && DB.users[oldEmail].headerPath) ||
      (DB.user && DB.user.headerPath) ||
      '';

    // Onboarding validation (required fields)
    if (requireProfileCompletion) {
      if (!Number.isFinite(age) || age < 18 || age > 80) {
        return res.status(400).json({ ok: false, message: 'invalid_age' });
      }
      if (!city || city.trim().length < 2) {
        return res.status(400).json({ ok: false, message: 'invalid_city' });
      }
      const hasAvatarAlready = !!existingAvatarUrl;
      const hasNewAvatar = !!avatarDataUrl;
      if (!hasAvatarAlready && !hasNewAvatar) {
        return res.status(400).json({ ok: false, message: 'profile_picture_required' });
      }
    }

    // 4) Avatar upload: prefer Firebase Storage, fallback to inline dataURL
    if (avatarDataUrl) {
      const av = String(avatarDataUrl || '');
      const m = av.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!m) {
        return res.status(400).json({ ok: false, message: 'invalid_avatar_data' });
      }

      // Firestore doc max is ~1MB; keep avatar payload comfortably below that.
      const inlineMaxBytes = 450 * 1024; // ~450KB decoded
      let inlineBufSize = 0;
      try { inlineBufSize = Buffer.from(m[2], 'base64').length; } catch {}
      const canInline = inlineBufSize > 0 && inlineBufSize <= inlineMaxBytes;
      const canUseStorage = !!(hasFirebase && hasStorage && storageBucket);

      const setInlineAvatar = () => {
        if (!canInline) {
          return res.status(413).json({
            ok: false,
            message: 'avatar_too_large'
          });
        }
        fields.avatarUrl = av;
        fields.avatarPath = '';
        fields.avatarUpdatedAt = new Date().toISOString();
        return null;
      };

      if (canUseStorage) {
        try {
          const up = await uploadAvatarDataUrlToStorage(
            (email || oldEmail),
            av,
            existingAvatarPath
          );
          fields.avatarUrl = up.url;
          fields.avatarPath = up.path;
          fields.avatarUpdatedAt = new Date().toISOString();
        } catch (e) {
          console.warn('[Avatar] Storage upload failed; using inline avatarUrl. Reason:', e?.message || e);
          const resp = setInlineAvatar();
          if (resp) return resp;
        }
      } else {
        const resp = setInlineAvatar();
        if (resp) return resp;
      }
    } else if (avatarUrl) {
      fields.avatarUrl = avatarUrl;
    }

    // 4b) Cover/Header upload: prefer Firebase Storage, fallback to inline dataURL
    if (headerDataUrl) {
      const hd = String(headerDataUrl || '');
      const m = hd.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!m) {
        return res.status(400).json({ ok: false, message: 'invalid_header_data' });
      }

      // Firestore doc max is ~1MB; keep header payload comfortably below that.
      const inlineMaxBytes = 650 * 1024; // ~650KB decoded
      let inlineBufSize = 0;
      try { inlineBufSize = Buffer.from(m[2], 'base64').length; } catch {}
      const canInline = inlineBufSize > 0 && inlineBufSize <= inlineMaxBytes;
      const canUseStorage = !!(hasFirebase && hasStorage && storageBucket);

      const setInlineHeader = () => {
        if (!canInline) {
          return res.status(413).json({
            ok: false,
            message: 'header_too_large'
          });
        }
        fields.headerUrl = hd;
        fields.headerPath = '';
        fields.headerUpdatedAt = new Date().toISOString();
        return null;
      };

      if (canUseStorage) {
        try {
          const up = await uploadHeaderDataUrlToStorage(
            (email || oldEmail),
            hd,
            existingHeaderPath
          );
          fields.headerUrl = up.url;
          fields.headerPath = up.path;
          fields.headerUpdatedAt = new Date().toISOString();
        } catch (e) {
          console.warn('[Header] Storage upload failed; using inline headerUrl. Reason:', e?.message || e);
          const resp = setInlineHeader();
          if (resp) return resp;
        }
      } else {
        const resp = setInlineHeader();
        if (resp) return resp;
      }
    } else if (headerUrl) {
      fields.headerUrl = headerUrl;
    }

    // 5) Password update (optional)
    if (password && password.trim().length > 0) {
      const hash = await bcrypt.hash(String(password).trim(), 10);
      fields.passwordHash = hash;
    }

    // Nothing to update?
    if (!Object.keys(fields).length) {
      // still return fresh current user
      const cur = (hasFirebase && usersCollection) ? await findUserByEmail(oldEmail) : (DB.users[oldEmail] || DB.user || null);
      return res.json({ ok: true, user: publicUser(cur ? { id: cur.id, ...cur } : (DB.user || null)) });
    }

    // 6) Persist (Firestore + memory)
    let updatedData = null;

    if (hasFirebase && usersCollection) {
      const existing = existingDoc || await findUserByEmail(oldEmail);
      if (!existing) return res.status(404).json({ ok: false, message: 'user_not_found' });

      await usersCollection.doc(existing.id).update(fields);

      updatedData = { ...existing, ...fields, id: existing.id };

      // If email changed: move caches + update cookie session
      if (email && email !== oldEmail) {
        try { setSession(res, email); } catch {}

        DB.users[email] = { ...updatedData };
        if (DB.prefsByEmail && DB.prefsByEmail[oldEmail]) {
          DB.prefsByEmail[email] = DB.prefsByEmail[oldEmail];
          delete DB.prefsByEmail[oldEmail];
        }
        delete DB.users[oldEmail];

        // Also move messages/usage buckets if present (demo memory)
        if (DB.messages && DB.messages[oldEmail]) {
          DB.messages[email] = DB.messages[oldEmail];
          delete DB.messages[oldEmail];
        }
        if (DB.messageUsage && DB.messageUsage[oldEmail]) {
          DB.messageUsage[email] = DB.messageUsage[oldEmail];
          delete DB.messageUsage[oldEmail];
        }
      } else {
        DB.users[oldEmail] = { ...updatedData };
      }

      DB.user = publicUser(updatedData);
    } else {
      // Local/demo mode
      const current = (DB.users && DB.users[oldEmail]) ? DB.users[oldEmail] : (DB.user || { email: oldEmail });
      updatedData = { ...current, ...fields };

      if (!DB.users) DB.users = {};
      if (email && email !== oldEmail) {
        DB.users[email] = updatedData;
        delete DB.users[oldEmail];
        try { setSession(res, email); } catch {}
      } else {
        DB.users[oldEmail] = updatedData;
      }

      DB.user = publicUser(updatedData);
      try { saveUsersStore(); } catch {}
    }

    return res.json({ ok: true, user: DB.user });
  } catch (err) {
    console.error('update profile error:', err);
    return res.status(500).json({ ok: false, message: 'server_error' });
  }
});


// ---------------- Linked Accounts (Settings) -------------------
// NOTE: This is a lightweight "link/unlink" store (manual value). OAuth linking can be added later.
app.get('/api/me/linked-accounts', authMiddleware, async (req, res) => {
  try {
    const email = String(req.user && req.user.email || '').trim().toLowerCase();
    if (!email) return res.status(401).json({ ok: false, message: 'not_logged_in' });

    let linkedAccounts = null;

    if (hasFirebase && usersCollection) {
      const u = await findUserByEmail(email);
      linkedAccounts = (u && (u.linkedAccounts || u.linked_accounts)) ? (u.linkedAccounts || u.linked_accounts) : null;
    } else {
      const u = (DB.users && DB.users[email]) || DB.user || {};
      linkedAccounts = u.linkedAccounts || u.linked_accounts || null;
    }

    return res.json({ ok: true, linkedAccounts: linkedAccounts || null });
  } catch (e) {
    console.error('GET /api/me/linked-accounts error:', e);
    return res.status(500).json({ ok: false, message: 'server_error' });
  }
});

app.post('/api/me/linked-accounts/connect', authMiddleware, async (req, res) => {
  try {
    const email = String(req.user && req.user.email || '').trim().toLowerCase();
    if (!email) return res.status(401).json({ ok: false, message: 'not_logged_in' });

    const provider = String((req.body && req.body.provider) || '').trim().toLowerCase();
    let value = String((req.body && req.body.value) || '').trim();

    if (!provider || !['google', 'twitter'].includes(provider)) {
      return res.status(400).json({ ok: false, message: 'invalid_provider' });
    }

    if (provider === 'google' && value) {
      value = value.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return res.status(400).json({ ok: false, message: 'invalid_google_email' });
      }
    }

    if (provider === 'twitter' && value) {
      value = value.replace(/^@/, '');
      if (!/^[a-zA-Z0-9_]{1,15}$/.test(value)) {
        return res.status(400).json({ ok: false, message: 'invalid_twitter_handle' });
      }
      value = '@' + value;
    }

    const entry = {
      value: value || '',
      connectedAt: new Date().toISOString()
    };

    let nextUser = null;

    if (hasFirebase && usersCollection) {
      const existing = await findUserByEmail(email);
      if (!existing) return res.status(404).json({ ok: false, message: 'user_not_found' });

      const fieldPath = `linkedAccounts.${provider}`;
      const patch = {
        [fieldPath]: entry,
        linkedAccountsUpdatedAt: new Date().toISOString()
      };

      await usersCollection.doc(existing.id).update(patch);

      nextUser = { ...existing, linkedAccounts: { ...(existing.linkedAccounts || {}), [provider]: entry } };

      // update in-memory cache
      const cached = (DB.users && DB.users[email]) ? DB.users[email] : null;
      if (cached) {
        cached.linkedAccounts = { ...(cached.linkedAccounts || {}), [provider]: entry };
        cached.linkedAccountsUpdatedAt = patch.linkedAccountsUpdatedAt;
        DB.users[email] = cached;
      }
      if (DB.user && String(DB.user.email || '').toLowerCase() === email) {
        DB.user = { ...(DB.user || {}), linkedAccounts: { ...((DB.user || {}).linkedAccounts || {}), [provider]: entry } };
      }
    } else {
      const u = (DB.users && DB.users[email]) ? DB.users[email] : (DB.user || { email });
      u.linkedAccounts = { ...(u.linkedAccounts || {}), [provider]: entry };
      u.linkedAccountsUpdatedAt = new Date().toISOString();
      if (!DB.users) DB.users = {};
      DB.users[email] = u;
      if (DB.user && String(DB.user.email || '').toLowerCase() === email) DB.user = u;
    normalizeDBUser();
      try { saveUsersStore(); } catch {}
      nextUser = u;
    }

    return res.json({ ok: true, linkedAccounts: (nextUser && nextUser.linkedAccounts) ? nextUser.linkedAccounts : { [provider]: entry } });
  } catch (e) {
    console.error('POST /api/me/linked-accounts/connect error:', e);
    return res.status(500).json({ ok: false, message: 'server_error' });
  }
});

app.post('/api/me/linked-accounts/disconnect', authMiddleware, async (req, res) => {
  try {
    const email = String(req.user && req.user.email || '').trim().toLowerCase();
    if (!email) return res.status(401).json({ ok: false, message: 'not_logged_in' });

    const provider = String((req.body && req.body.provider) || '').trim().toLowerCase();
    if (!provider || !['google', 'twitter'].includes(provider)) {
      return res.status(400).json({ ok: false, message: 'invalid_provider' });
    }

    if (hasFirebase && usersCollection && admin) {
      const existing = await findUserByEmail(email);
      if (!existing) return res.status(404).json({ ok: false, message: 'user_not_found' });

      const fieldPath = `linkedAccounts.${provider}`;
      const patch = {
        [fieldPath]: admin.firestore.FieldValue.delete(),
        linkedAccountsUpdatedAt: new Date().toISOString()
      };

      await usersCollection.doc(existing.id).update(patch);

      // update cache
      if (DB.users && DB.users[email]) {
        const la = { ...(DB.users[email].linkedAccounts || {}) };
        delete la[provider];
        DB.users[email].linkedAccounts = la;
        DB.users[email].linkedAccountsUpdatedAt = patch.linkedAccountsUpdatedAt;
      }
      if (DB.user && String(DB.user.email || '').toLowerCase() === email) {
        const la = { ...((DB.user || {}).linkedAccounts || {}) };
        delete la[provider];
        DB.user = { ...(DB.user || {}), linkedAccounts: la };
      }

      return res.json({ ok: true });
    }

    // demo/local
    const u = (DB.users && DB.users[email]) ? DB.users[email] : (DB.user || null);
    if (u) {
      const la = { ...(u.linkedAccounts || {}) };
      delete la[provider];
      u.linkedAccounts = la;
      u.linkedAccountsUpdatedAt = new Date().toISOString();
      if (DB.users) DB.users[email] = u;
      if (DB.user && String(DB.user.email || '').toLowerCase() === email) DB.user = u;
    normalizeDBUser();
      try { saveUsersStore(); } catch {}
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/me/linked-accounts/disconnect error:', e);
    return res.status(500).json({ ok: false, message: 'server_error' });
  }
});


// ---------------- Delete Account (Settings) -------------------
// Deletes the user document + related swipe/match/moment docs, then clears cookie session.
app.post('/api/me/delete-account', authMiddleware, async (req, res) => {
  try {
    const email = String(req.user && req.user.email || '').trim().toLowerCase();
    const confirm = String((req.body && req.body.confirm) || '').trim().toUpperCase();

    if (!email) return res.status(401).json({ ok: false, message: 'not_logged_in' });
    if (confirm !== 'DELETE') return res.status(400).json({ ok: false, message: 'confirm_required' });

    // Helper: batch delete by query
    const batchDelete = async (query, batchSize = 400) => {
      if (!hasFirebase || !firestore) return;
      while (true) {
        const snap = await query.limit(batchSize).get();
        if (snap.empty) break;
        const batch = firestore.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        if (snap.size < batchSize) break;
      }
    };

    if (hasFirebase && usersCollection) {
      const existing = await findUserByEmail(email);

      // Best-effort delete related docs first (so you don't keep orphaned data)
      try {
        await batchDelete(firestore.collection(SWIPES_COLLECTION).where('from', '==', email));
        await batchDelete(firestore.collection(SWIPES_COLLECTION).where('to', '==', email));
      } catch (e) {
        console.warn('[DeleteAccount] Failed deleting swipes:', e?.message || e);
      }

      try {
        await batchDelete(firestore.collection(MATCHES_COLLECTION).where('a', '==', email));
        await batchDelete(firestore.collection(MATCHES_COLLECTION).where('b', '==', email));
      } catch (e) {
        console.warn('[DeleteAccount] Failed deleting matches:', e?.message || e);
      }

      try {
        await batchDelete(firestore.collection(PS_SWIPES_COLLECTION).where('from', '==', email));
        await batchDelete(firestore.collection(PS_SWIPES_COLLECTION).where('to', '==', email));
      } catch (e) {
        console.warn('[DeleteAccount] Failed deleting PS swipes:', e?.message || e);
      }

      try {
        await batchDelete(firestore.collection(PS_MATCHES_COLLECTION).where('a', '==', email));
        await batchDelete(firestore.collection(PS_MATCHES_COLLECTION).where('b', '==', email));
      } catch (e) {
        console.warn('[DeleteAccount] Failed deleting PS matches:', e?.message || e);
      }

      try {
        await batchDelete(firestore.collection('moments').where('ownerEmail', '==', email));
      } catch (e) {
        console.warn('[DeleteAccount] Failed deleting moments:', e?.message || e);
      }

      // Delete avatar file (if any)
      if (existing && existing.avatarPath && hasStorage && storageBucket) {
        try {
          await storageBucket.file(String(existing.avatarPath)).delete({ ignoreNotFound: true });
        } catch (e) {
          // ignore
        }
      }

      // Delete user document
      if (existing && existing.id) {
        await usersCollection.doc(existing.id).delete();
      }
    }

    // Cleanup in-memory caches (safe even when Firebase is on)
    try {
      if (DB.users && DB.users[email]) delete DB.users[email];
      if (DB.prefsByEmail && DB.prefsByEmail[email]) delete DB.prefsByEmail[email];
      if (DB.messages && DB.messages[email]) delete DB.messages[email];
      if (DB.messageUsage && DB.messageUsage[email]) delete DB.messageUsage[email];

      // Remove swipes involving the user (demo-mode structures)
      if (DB.swipes) {
        delete DB.swipes[email];
        Object.keys(DB.swipes).forEach(k => {
          if (DB.swipes[k] && typeof DB.swipes[k] === 'object' && DB.swipes[k][email]) {
            delete DB.swipes[k][email];
          }
        });
      }
      if (DB.psSwipes) {
        delete DB.psSwipes[email];
        Object.keys(DB.psSwipes).forEach(k => {
          if (DB.psSwipes[k] && typeof DB.psSwipes[k] === 'object' && DB.psSwipes[k][email]) {
            delete DB.psSwipes[k][email];
          }
        });
      }

      // Remove matches involving the user
      if (DB.matches) {
        delete DB.matches[email];
        Object.keys(DB.matches).forEach(k => {
          if (Array.isArray(DB.matches[k])) {
            DB.matches[k] = DB.matches[k].filter(v => String(v || '').toLowerCase() !== email);
          }
        });
      }

      // Remove local moments
      if (Array.isArray(DB.moments)) {
        DB.moments = DB.moments.filter(m => String(m && m.ownerEmail || '').toLowerCase() !== email);
      }
      if (!hasFirebase) {
        try { saveUsersStore(); } catch {}
        try { savePrefsStore(); } catch {}
        try { saveMomentsStore(); } catch {}
      }
    } catch {}

    // Clear session (logout)
    clearSession(res);
    setAnonState();

    return res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/me/delete-account error:', e);
    return res.status(500).json({ ok: false, message: 'server_error' });
  }
});

// Change password (requires current password)

// ---------------- Update Creator Status (Available / Away / Busy) ----------------
app.post('/api/me/status', async (req, res) => {
  try {
    if (!DB.user || !DB.user.email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }

    const raw = (req.body && req.body.status) ? req.body.status : '';
    const v = String(raw || '').trim().toLowerCase();

    const allowed = {
      available: 'Available',
      away: 'Away',
      busy: 'Busy'
    };

    const canonical =
      allowed[v] ||
      (raw === 'Available' || raw === 'Away' || raw === 'Busy' ? raw : null);

    if (!canonical) {
      return res.status(400).json({ ok: false, message: 'invalid status' });
    }

    const email = String(DB.user.email || '').trim().toLowerCase();
    const fields = {
      creatorStatus: canonical,
      creatorStatusUpdatedAt: new Date().toISOString()
    };

    if (hasFirebase && usersCollection) {
      const existing = await findUserByEmail(email);
      if (!existing) return res.status(404).json({ ok: false, message: 'user not found' });

      await usersCollection.doc(existing.id).update(fields);

      // Refresh memory
      const updatedData = { ...existing, ...fields };
      DB.users[email] = { ...updatedData, id: existing.id };
      DB.user = publicUser({ id: existing.id, ...updatedData });

    } else {
      // Local/demo mode
      Object.assign(DB.user, fields);
      if (DB.users[email]) Object.assign(DB.users[email], fields);
    }

    return res.json({ ok: true, status: canonical });
  } catch (e) {
    console.error('POST /api/me/status error:', e);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});


app.post('/api/me/password', async (req, res) => {
  try {
    if (!DB.user || !DB.user.email) return res.status(401).json({ ok: false, message: 'not_logged_in' });

    const emailNorm = String(DB.user.email).trim().toLowerCase();
    const { currentPassword, newPassword } = req.body || {};

    const cur = String(currentPassword || '');
    const nxt = String(newPassword || '');

    // Rate limit password changes
    if (!rateLimitOr429(req, res, _rlKey(req, 'change_password'), 10, 30 * 60 * 1000, 'too_many_requests')) return;

    if (!isStrongPassword(nxt)) {
      return res.status(400).json({ ok: false, message: 'weak_password' });
    }

    if (IS_PROD && !hasFirebase) {
      return res.status(503).json({ ok: false, message: 'auth_backend_misconfigured' });
    }

    const user = await findUserByEmail(emailNorm);
    if (!user) return res.status(404).json({ ok: false, message: 'user_not_found' });

    if (user.passwordHash) {
      const ok = await bcrypt.compare(cur, String(user.passwordHash));
      if (!ok) return res.status(401).json({ ok: false, message: 'wrong_password' });
    } else if (cur) {
      // If no passwordHash exists yet but currentPassword was provided, treat as mismatch
      return res.status(401).json({ ok: false, message: 'wrong_password' });
    }

    const passwordHash = await bcrypt.hash(nxt, 10);
    await updateUserByEmail(emailNorm, { passwordHash });

    return res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/me/password error:', e);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// Update simple settings used by Premium Society settings UI
app.post('/api/me/settings', async (req, res) => {
  try {
    if (!DB.user || !DB.user.email) return res.status(401).json({ ok: false, message: 'not_logged_in' });

    const emailNorm = String(DB.user.email).trim().toLowerCase();
    const distanceKm = Number(req.body && req.body.distanceKm);
    const maxAge = Number(req.body && req.body.maxAge);

    // Merge into existing prefs (prefsByEmail is the canonical store in demo/local mode)
    const existing = (DB.prefsByEmail && DB.prefsByEmail[emailNorm]) ? DB.prefsByEmail[emailNorm] : (DB.prefs || {});
    const next = { ...(existing || {}) };

    if (Number.isFinite(distanceKm) && distanceKm > 0) next.distanceKm = Math.round(distanceKm);
    if (Number.isFinite(maxAge) && maxAge > 17) next.ageMax = Math.round(maxAge);

    DB.prefs = next;
    DB.prefsByEmail[emailNorm] = next;
    savePrefsStore();

    // Mirror onto the user record for convenience (optional)
    await updateUserByEmail(emailNorm, { settings: { ...(DB.user.settings || {}), distanceKm: next.distanceKm, maxAge: next.ageMax } });

    return res.json({ ok: true, settings: { distanceKm: next.distanceKm, maxAge: next.ageMax } });
  } catch (e) {
    console.error('POST /api/me/settings error:', e);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ---------------- KPIs demo (optional) -------------------
app.get('/api/kpis', (_req, res) => {
  // You can update this later to use real counters if needed
  res.json({ ok: true, today: 20, approved: 5, dates: 0 });
});

// ---------------- Shortlist (plan logic) -------------------
app.get('/api/shortlist', async (_req, res) => {
  try {
    const email = DB.user && DB.user.email;
    if (!email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }


  const user = (DB.users && DB.users[email]) || DB.user || {};
  const planKey = normalizePlanKey(user.plan || 'free');
  if (planKey !== 'tier2' && planKey !== 'tier3') {
    return res.status(403).json({ ok: false, message: 'not_allowed' });
  }

    const data = await serveShortlistForToday(email);
    return res.json({ ok: true, ...data });
  } catch (err) {
    console.error('shortlist error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ✅ Approved list (persisted per user)

// ✅ Approved list (persisted per user)
app.get('/api/shortlist/approved', async (_req, res) => {
  try {
    const email = DB.user && DB.user.email;
    if (!email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }


  const user = (DB.users && DB.users[email]) || DB.user || {};
  const planKey = normalizePlanKey(user.plan || 'free');
  if (planKey !== 'tier2' && planKey !== 'tier3') {
    return res.status(403).json({ ok: false, message: 'not_allowed' });
  }

    const approved = await loadApprovedProfiles(email);
    return res.json({ ok: true, approved, items: approved });
  } catch (err) {
    console.error('approved error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// Scheduled dates (Tier 3 Concierge)
app.get('/api/concierge/scheduled', async (_req, res) => {
  try {
    const email = DB.user && DB.user.email;
    if (!email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }

    const user = (DB.users && DB.users[email]) || DB.user || {};
    const planKey = normalizePlanKey(user.plan || 'free');
    if (planKey !== 'tier3') {
      return res.status(403).json({ ok: false, message: 'not_allowed' });
    }

    const scheduled = await loadScheduledDates(email);
    return res.json({ ok: true, scheduled });
  } catch (err) {
    console.error('concierge scheduled error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});


// Request a date from an APPROVED profile (moves from approved -> scheduledDates)
app.post('/api/approved/date', async (req, res) => {
  try {
    const email = DB.user && DB.user.email;
    if (!email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }


  const user = (DB.users && DB.users[email]) || DB.user || {};
  const planKey = normalizePlanKey(user.plan || 'free');
  if (planKey !== 'tier3') {
    return res.status(403).json({ ok: false, message: 'not_allowed' });
  }

    const { profileId } = req.body || {};
    if (!profileId) {
      return res.status(400).json({ ok: false, message: 'profileId required' });
    }

    const approved = await loadApprovedProfiles(email);
    const idx = approved.findIndex((p) => String(p.id) === String(profileId));
    if (idx === -1) {
      return res
        .status(404)
        .json({ ok: false, message: 'profile not in approved list' });
    }

    const profile = approved[idx];
    approved.splice(idx, 1);
    await saveApprovedProfiles(email, approved);

    const scheduled = {
      ...profile,
      status: 'scheduled',
      scheduledAt: new Date().toISOString()
    };
    await addScheduledDate(email, scheduled);

    return res.json({ ok: true });
  } catch (err) {
    console.error('approved/date error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});
// User decisions: approve, pass, request date (Tier 3)

// User decisions: approve, pass, request date (Tier 3)
app.post('/api/shortlist/decision', async (req, res) => {
  try {
    const email = DB.user && DB.user.email;
    if (!email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }


  const user = (DB.users && DB.users[email]) || DB.user || {};
  const planKey = normalizePlanKey(user.plan || 'free');
  if (planKey !== 'tier2' && planKey !== 'tier3') {
    return res.status(403).json({ ok: false, message: 'not_allowed' });
  }

    const { profileId, action } = req.body || {};
    if (!profileId || !['approve', 'pass', 'date'].includes(action)) {
      return res.status(400).json({ ok: false, message: 'invalid action' });
    }


  if (action === 'date' && planKey !== 'tier3') {
    return res.status(403).json({ ok: false, message: 'not_allowed' });
  }

    const state = await loadShortlistState(email);
    let shortlist = Array.isArray(state.shortlist) ? state.shortlist : [];

    const idx = shortlist.findIndex(p => String(p.id) === String(profileId));
    if (idx === -1) {
      return res.json({ ok: true }); // already removed / not found
    }

    const profile = shortlist[idx];

    // remove from shortlist once may decision na
    shortlist.splice(idx, 1);

    if (action === 'date') {
      const scheduled = {
        ...profile,
        status: 'scheduled',
        scheduledAt: new Date().toISOString()
      };
      await addScheduledDate(email, scheduled);
    } else if (action === 'approve') {
      await addApprovedProfile(email, profile);
    }

    const nextState = { ...state, shortlist };
    await saveShortlistState(email, nextState);

    return res.json({ ok: true });
  } catch (err) {
    console.error('decision error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});
// ---------------- Admin auth (username + password login) -------------------
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password, email } = req.body || {};

    // Allow either explicit username field or fallback to email field
    const userInput = (username || email || '').toString().trim();
    const pass = (password || '').toString();

    const ok =
      userInput === ADMIN_LOGIN_USERNAME &&
      pass === ADMIN_LOGIN_PASSWORD;

    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, message: 'invalid_admin_credentials' });
    }

    // Issue a short-lived signed token in an httpOnly cookie (no admin key is returned to the browser)
    const token = createAdminToken();
    res.cookie(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTS);

    return res.json({ ok: true });
  } catch (err) {
    console.error('admin login error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// Simple “who am I” check for admin
app.get('/api/admin/me', (req, res) => {
  try {
    return res.json({ ok: true });
  } catch (err) {
    console.error('admin me error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// Stateless logout – frontend lang maglilinis ng localStorage
app.post('/api/admin/logout', (req, res) => {
  try {
    res.clearCookie(ADMIN_COOKIE_NAME, { ...ADMIN_COOKIE_OPTS, maxAge: 0 });
  } catch (e) {}
  return res.json({ ok: true });
});

// ---------------- Admin helpers (secured by admin key) -------------------

// 1) List active users per tier
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const tierRaw = String(req.query.tier || 'all').toLowerCase().trim();
    const includeInactiveRaw = String(req.query.include_inactive || '').toLowerCase().trim();
    const includeInactive = (includeInactiveRaw === '1' || includeInactiveRaw === 'true' || includeInactiveRaw === 'yes');

    const tier = (tierRaw === 'all') ? 'all' : normalizePlanKey(tierRaw);
    const allowed = new Set(['all', 'free', 'tier1', 'tier2', 'tier3']);
    const finalTier = allowed.has(tier) ? tier : 'all';

    let usersArr = [];

    if (admin && admin.firestore) {
      const snap = await admin.firestore().collection('users').get();
      usersArr = snap.docs.map(d => publicUser({ id: d.id, ...d.data() })).filter(Boolean);
    } else if (Array.isArray(DB.users)) {
      usersArr = DB.users.map(u => publicUser(u)).filter(Boolean);
    } else if (DB.users && typeof DB.users === 'object') {
      usersArr = Object.values(DB.users).map(u => publicUser(u)).filter(Boolean);
    }

    if (finalTier !== 'all') {
      usersArr = usersArr.filter(u => normalizePlanKey(u.plan || 'free') === finalTier);
    }

    if (!includeInactive) {
      usersArr = usersArr.filter(u => {
        const pk = normalizePlanKey(u.plan || 'free');
        if (pk === 'free') return true;
        return !!u.planActive;
      });
    }

    // Sort by tier (Concierge > Elite > Plus > Free), then email
    const rank = { tier3: 3, tier2: 2, tier1: 1, free: 0 };
    usersArr.sort((a, b) => {
      const ra = rank[normalizePlanKey(a.plan || 'free')] ?? 0;
      const rb = rank[normalizePlanKey(b.plan || 'free')] ?? 0;
      if (rb !== ra) return rb - ra;
      return String(a.email || '').localeCompare(String(b.email || ''));
    });

    return res.json({
      ok: true,
      tier: finalTier,
      include_inactive: includeInactive,
      count: usersArr.length,
      users: usersArr
    });
  } catch (err) {
    console.error('admin users error:', err);
    return res.status(500).json({ ok: false, error: 'admin_users_failed' });
  }
});

app.get('/api/admin/state', requireAdmin, async (req, res) => {
  try {
    const providedKey = getProvidedAdminKey(req);
    if (!isValidAdminKey(providedKey)) {
      return res
        .status(401)
        .json({ ok: false, message: 'admin_unauthorized' });
    }

    let { email } = req.query || {};
    if (!email) {
      return res
        .status(400)
        .json({ ok: false, message: 'email required' });
    }

    const emailNorm = String(email).trim().toLowerCase();
    if (!emailNorm) {
      return res
        .status(400)
        .json({ ok: false, message: 'invalid email' });
    }

    // If Firebase mode, make sure user exists
    if (hasFirebase && usersCollection) {
      const existing = await findUserByEmail(emailNorm);
      if (!existing) {
        return res
          .status(404)
          .json({ ok: false, message: 'user_not_found' });
      }
    }

    const state = await loadShortlistState(emailNorm);
    const plan =
      state.plan || (DB.user && DB.user.plan) || null;
    const rule =
      plan && PLAN_RULES[plan]
        ? PLAN_RULES[plan]
        : PLAN_RULES.tier1;
    const today = todayKey();

    const shortlist = Array.isArray(state.shortlist)
      ? state.shortlist
      : [];
    const todayShortlist =
      state.shortlistLastDate === today ? shortlist : [];

    return res.json({
      ok: true,
      email: emailNorm,
      plan,
      dailyCap: rule.dailyCap,
      shortlistLastDate: state.shortlistLastDate,
      today,
      totalShortlist: shortlist.length,
      todayShortlist
    });
  } catch (err) {
    console.error('admin state error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// 3) Serve shortlist for today (STRICT: one batch per user per day, plan-based cap)
app.post('/api/admin/shortlist', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'] || req.headers['x-admin-token'] || '';
    if (!isValidAdminKey(adminKey)) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const profiles = Array.isArray(req.body.profiles) ? req.body.profiles : [];

    if (!email) {
      return res.status(400).json({ ok: false, error: 'missing_email' });
    }
    if (!profiles.length) {
      return res.status(400).json({ ok: false, error: 'no_profiles' });
    }

    const emailNorm = email.toLowerCase();
    const today = formatYYYYMMDD(new Date());
    const nowIso = new Date().toISOString();

    // Load existing shortlist state
    const state = await loadShortlistState(emailNorm);

    // Try to fetch the user's plan from the users collection (source of truth)
    let userDoc = null;
    if (admin && admin.firestore) {
      try {
        userDoc = await findUserByEmail(emailNorm);
      } catch (e) {
        userDoc = null;
      }
    }

    const planKey = normalizePlanKey(
      (userDoc && userDoc.plan) || state.plan || (DB.user && DB.user.plan) || 'free'
    );

    // Only Elite + Concierge can be served
    const eligible = (planKey === 'tier2' || planKey === 'tier3');
    if (!eligible) {
      return res.status(403).json({
        ok: false,
        error: 'not_eligible',
        plan: planKey,
        message: 'Shortlist serving is only available for Elite and Concierge subscribers.'
      });
    }

    const planEnd = (userDoc && (userDoc.planEnd ?? userDoc.subscriptionEnd)) || state.planEnd || null;
    const planActiveFlag =
      (userDoc && typeof userDoc.planActive === 'boolean') ? userDoc.planActive :
      (typeof state.planActive === 'boolean' ? state.planActive : undefined);

    const active = _computePlanActiveForDoc(planKey, planEnd, planActiveFlag);
    if (!active) {
      return res.status(403).json({
        ok: false,
        error: 'subscription_inactive',
        plan: planKey,
        message: 'Subscription is inactive or expired.'
      });
    }

    const rule = PLAN_RULES[planKey] || { dailyCap: 0, canShortlist: false };
    const dailyCap = rule.dailyCap || 0;

    // Normalize profiles into a consistent schema
    const normalized = profiles.slice(0, 30).map((p, idx) => {
      const base = (emailNorm || 'user').split('@')[0];
      const name =
        p && p.name ? String(p.name).trim() : `Match #${idx + 1}`;
      const city =
        p && p.city ? String(p.city).trim() : 'Lagos';
      const igUrl =
        p && p.igUrl ? String(p.igUrl).trim() : '';

      const username =
        p && p.username
          ? String(p.username).trim().replace(/^@/, '')
          : (() => {
              const m = String(igUrl || '').match(/instagram\.com\/([^/?#]+)/i);
              return m ? m[1] : '';
            })();

      const ageRange =
        p && (p.ageRange || p.age)
          ? String(p.ageRange || p.age).trim()
          : '';

      const photoUrl =
        p && (p.photoUrl || p.avatar)
          ? String(p.photoUrl || p.avatar).trim()
          : '';

      return {
        id: p && p.id ? p.id : `admin_${base}_${idx + 1}`,
        name,
        username,
        city,
        ageRange,
        igUrl,
        photoUrl,
        avatar: photoUrl, // backward-compatible
        score:
          p && typeof p.score === 'number'
            ? p.score
            : 80 + (idx % 20),
        status: 'pending',
        servedAt: nowIso
      };
    });

    const nextState = {
      ...state,
      plan: planKey,
      planEnd: planEnd || state.planEnd || null,
      planActive: true,
      shortlist: normalized,
      shortlistLastDate: today
    };

    await saveShortlistState(emailNorm, nextState);

    return res.json({
      ok: true,
      email: emailNorm,
      plan: planKey,
      dailyCap,
      date: today,
      count: normalized.length
    });
  } catch (err) {
    console.error('admin shortlist error:', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});


// 4) Save confirmed date (Tier 3)
app.post('/api/admin/confirmed-date', async (req, res) => {
  try {
    const providedKey = getProvidedAdminKey(req);
    if (!isValidAdminKey(providedKey)) {
      return res
        .status(401)
        .json({ ok: false, message: 'admin_unauthorized' });
    }

    let {
      email,
      candidateName,
      igUrl,
      city,
      scheduledAt,
      location,
      notes
    } = req.body || {};

    const emailNorm = String(email || '').trim().toLowerCase();
    if (!emailNorm || !candidateName || !scheduledAt) {
      return res.status(400).json({
        ok: false,
        message: 'email, candidateName & scheduledAt required'
      });
    }

    const profile = {
      id: `date_${Date.now()}`,
      name: String(candidateName).trim(),
      igUrl: igUrl ? String(igUrl).trim() : '',
      city: city ? String(city).trim() : '',
      location: location ? String(location).trim() : '',
      notes: notes ? String(notes).trim() : '',
      status: 'scheduled',
      scheduledAt: String(scheduledAt)
    };

    await addScheduledDate(emailNorm, profile);

    return res.json({ ok: true });
  } catch (err) {
    console.error('admin confirmed-date error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ---------------- Dates (Tier 3 scheduling) -------------------
app.get('/api/dates', async (_req, res) => {
  try {
    const email = DB.user && DB.user.email;
    if (!email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }

    const items = await loadScheduledDates(email);
    return res.json({ ok: true, items });
  } catch (err) {
    console.error('dates error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ---------------- Messages (per-match chat + daily limits) -------------------
// NOTE: This is an in-memory demo implementation. In production you would persist
// messages in Firestore or another database, but the interface can stay the same.

// List all message threads for the logged-in user, including usage info.
app.get('/api/messages', (req, res) => {
  const email = DB.user && DB.user.email;
  if (!email) {
    return res.status(401).json({ ok: false, message: 'not logged in' });
  }

  const user = (DB.users && DB.users[email]) || DB.user || {};
  const plan = user.plan || null;
  const usage = getOrInitMessageUsage(email, plan);

  const byPeer = DB.messages[email] || {};
  const threads = Object.keys(byPeer).map((peerEmail) => {
    const list = byPeer[peerEmail] || [];
    const last = list.length ? list[list.length - 1] : null;
    return {
      peerEmail,
      count: list.length,
      lastMessage: last
        ? {
            id: last.id,
            from: last.from,
            to: last.to,
            text: last.text,
            sentAt: last.sentAt
          }
        : null
    };
  });

  return res.json({
    ok: true,
    plan: normalizePlanKey(plan),
    usage: {
      dayKey: usage.dayKey,
      sentToday: usage.sentToday || 0,
      limit: usage.limit
    },
    threads
  });
});

// Get the full conversation with a specific peer.
app.get('/api/messages/thread/:peer', (req, res) => {
  const email = DB.user && DB.user.email;
  if (!email) {
    return res.status(401).json({ ok: false, message: 'not logged in' });
  }

  const peerRaw = req.params.peer || '';
  const peerEmail = String(peerRaw).trim().toLowerCase();
  if (!peerEmail) {
    return res.status(400).json({ ok: false, message: 'peer required' });
  }

  const user = (DB.users && DB.users[email]) || DB.user || {};
  const plan = user.plan || null;
  const planKey = normalizePlanKey(plan);
  const usage = getOrInitMessageUsage(email, plan);

  const byPeer = DB.messages[email] || {};
  const list = byPeer[peerEmail] || [];

  // Read receipts:
  // Only tier1+ should update read state (free has no read receipts)
  if (planKey !== 'free' && Array.isArray(list) && list.length) {
    const nowIso = new Date().toISOString();
    let changed = false;
    for (const msg of list) {
      if (msg && String(msg.to || '').toLowerCase() === String(email).toLowerCase() && !msg.readAt) {
        msg.readAt = nowIso;
        changed = true;
      }
    }
    // Because the same msg objects are stored for both sides in this demo store,
    // marking readAt here is enough for the sender to see "seen".
    if (changed) {
      DB.messages[email][peerEmail] = list;
    }
  }

  return res.json({
    ok: true,
    plan: planKey,
    usage: {
      dayKey: usage.dayKey,
      sentToday: usage.sentToday || 0,
      limit: usage.limit
    },
    messages: list
  });
});
// Send a message to a peer. Free plan has 20 messages/day cap; paid tiers are unlimited.
app.post('/api/messages/send', (req, res) => {
  const email = DB.user && DB.user.email;
  if (!email) {
    return res.status(401).json({ ok: false, message: 'not logged in' });
  }

  const body = req.body || {};
  const peerRaw = body.to || body.peer || '';
  const textRaw = body.text || body.message || '';

  const peerEmail = String(peerRaw).trim().toLowerCase();
  const text = String(textRaw).trim();

  if (!peerEmail || !text) {
    return res.status(400).json({ ok: false, message: 'to and text are required' });
  }

  // Optional guard: only allow chat with matches. Uncomment to enforce strictly:
  // const myMatches = DB.matches[email] || [];
  // if (!myMatches.includes(peerEmail)) {
  //   return res.status(403).json({ ok: false, message: 'messages allowed only with matches' });
  // }

  const user = (DB.users && DB.users[email]) || DB.user || {};
  const plan = user.plan || null;
  const usage = getOrInitMessageUsage(email, plan);

  const limit = usage.limit;
  const used = usage.sentToday || 0;

  if (limit != null && used >= limit) {
    return res.status(403).json({
      ok: false,
      message: 'daily_message_limit_reached',
      usage: {
        dayKey: usage.dayKey,
        sentToday: used,
        limit
      }
    });
  }

  const nowIso = new Date().toISOString();
  const msg = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from: email.toLowerCase(),
    to: peerEmail,
    text,
    sentAt: nowIso
  };

  // Store under sender
  if (!DB.messages[email]) DB.messages[email] = {};
  if (!Array.isArray(DB.messages[email][peerEmail])) {
    DB.messages[email][peerEmail] = [];
  }
  DB.messages[email][peerEmail].push(msg);

  // Store symmetric view for the recipient
  if (!DB.messages[peerEmail]) DB.messages[peerEmail] = {};
  if (!Array.isArray(DB.messages[peerEmail][email])) {
    DB.messages[peerEmail][email] = [];
  }
  DB.messages[peerEmail][email].push(msg);

  usage.sentToday = used + 1;

  return res.json({
    ok: true,
    message: msg,
    usage: {
      dayKey: usage.dayKey,
      sentToday: usage.sentToday,
      limit
    }
  });
});
// ---------------- Plan selection -------------------
// Free upgrade (beta) mode: allows manual plan activation without payment.
// Secure by requiring either:
// - Admin auth (tm_admin cookie / x-admin-key)
// - OR a shared upgrade key (x-upgrade-key header or { upgradeKey } body)
// Enable via env FREE_UPGRADE_MODE=1 and set FREE_UPGRADE_KEY to a long random string.
const FREE_UPGRADE_MODE = String(process.env.FREE_UPGRADE_MODE || '0') === '1';
const FREE_UPGRADE_KEY = String(process.env.FREE_UPGRADE_KEY || '').trim();


// ---------- Small helpers ----------
// safeStr: always returns a string (never throws) without trimming by default.
function safeStr(v) {
  if (v === null || v === undefined) return '';
  try { return String(v); } catch { return ''; }
}

// pruneUndefinedDeep: remove undefined values recursively (Firestore rejects undefined).
function pruneUndefinedDeep(input) {
  if (input === undefined) return undefined;
  if (Array.isArray(input)) {
    const arr = input
      .map(pruneUndefinedDeep)
      .filter(v => v !== undefined);
    return arr;
  }
  if (input && typeof input === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      const pv = pruneUndefinedDeep(v);
      if (pv !== undefined) out[k] = pv;
    }
    return out;
  }
  return input;
}

function safeEqualStr(a, b) {
  try {
    const aa = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    if (!aa.length || aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

app.post('/api/plan/choose', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body || {};

    if (!plan || !['tier1', 'tier2', 'tier3'].includes(plan)) {
      return res.status(400).json({ ok: false, message: 'invalid plan' });
    }

    const isAdmin = (typeof isAdminAuthed === 'function') ? isAdminAuthed(req) : false;

    // In production, block manual upgrades unless:
    // - you're admin, OR
    // - FREE_UPGRADE_MODE is enabled AND the correct FREE_UPGRADE_KEY is provided.
    if (IS_PROD && !isAdmin && !FREE_UPGRADE_MODE) {
      return res.status(403).json({ ok: false, message: 'manual_plan_choose_disabled' });
    }

    if (!isAdmin) {
      if (!FREE_UPGRADE_MODE) {
        return res.status(403).json({ ok: false, message: 'free_upgrade_disabled' });
      }
      if (!FREE_UPGRADE_KEY) {
        return res.status(500).json({ ok: false, message: 'FREE_UPGRADE_KEY_not_configured' });
      }

      const provided =
        (req.headers['x-upgrade-key'] || '') ||
        (req.body && (req.body.upgradeKey || req.body.key || '')) ||
        '';

      if (!safeEqualStr(String(provided).trim(), FREE_UPGRADE_KEY)) {
        return res.status(403).json({ ok: false, message: 'invalid_upgrade_key' });
      }
    }

    const email = String((req.user && req.user.email) || getSessionEmail(req) || '').trim().toLowerCase();
    if (!email) {
      return res.status(401).json({ ok: false, message: 'not_authenticated' });
    }

    const activated = await activatePlanForEmail(email, String(plan), {
      paymentProvider: isAdmin ? 'admin_override' : 'free_beta',
      freeUpgrade: !isAdmin,
      upgradedByAdmin: isAdmin
    });

    if (!activated) {
      return res.status(500).json({ ok: false, message: 'plan_activation_failed' });
    }

    return res.json({ ok: true, activated, user: DB.user });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ---------------- Coinbase Commerce (crypto) checkout -------------------
// We removed Stripe entirely. Coinbase Commerce is the ONLY subscription payment provider.
//
// Env needed:
// - COINBASE_COMMERCE_API_KEY        (API Keys page in Coinbase Commerce)
// - COINBASE_COMMERCE_WEBHOOK_SECRET (Webhook subscription "Shared Secret")
//
// Optional:
// - COINBASE_FULFILL_AT = PENDING | COMPLETED   (default: PENDING)

const COINBASE_API_BASE = 'https://api.commerce.coinbase.com';
const COINBASE_API_KEY =
  process.env.COINBASE_COMMERCE_API_KEY ||
  process.env.COINBASE_API_KEY ||
  '';

const COINBASE_WEBHOOK_SECRET =
  process.env.COINBASE_COMMERCE_WEBHOOK_SECRET ||
  process.env.COINBASE_WEBHOOK_SHARED_SECRET ||
  process.env.COINBASE_WEBHOOK_SECRET ||
  '';

const COINBASE_API_VERSION = process.env.COINBASE_COMMERCE_API_VERSION || '2018-03-22';
const COINBASE_FULFILL_AT = String(process.env.COINBASE_FULFILL_AT || 'PENDING').toUpperCase(); // PENDING or COMPLETED

// Match your current pricing (same values used in pay.js)
// [FIXED] Match Coinbase API requirements (amount + currency)
const COINBASE_PLANS = {
  tier1: {
    name: 'Plus',
    amount: '28.12',  // Changed from 'price' to 'amount'
    currency: 'USD'   // Added currency
  },
  tier2: {
    name: 'Elite',
    amount: '95.00',
    currency: 'USD'
  },
  tier3: {
    name: 'Concierge',
    amount: '485.00',
    currency: 'USD'
  },
  creator_access: {
    name: 'Creator Access',
    amount: '9.99',
    currency: 'USD'
  }
};
function safeEqualHex(sigA, sigB) {
  try {
    const a = Buffer.from(String(sigA || '').trim(), 'hex');
    const b = Buffer.from(String(sigB || '').trim(), 'hex');
    if (!a.length || !b.length) return false;
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function coinbaseRequest(path, { method = 'GET', body } = {}) {
  if (!COINBASE_API_KEY) throw new Error('coinbase_not_configured');

  const url = `${COINBASE_API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-CC-Api-Key': COINBASE_API_KEY,
    'X-CC-Version': COINBASE_API_VERSION
  };

  const r = await fetch(url, {
    method,
    headers,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
  });

  let json = null;
  try { json = await r.json(); } catch {}
  if (!r.ok) {
  const errInfo = json && (json.error || json.message || json.error_message);
  let msg = errInfo ? errInfo : `coinbase_http_${r.status}`;

  // Coinbase sometimes returns objects like {type, message}
  if (msg && typeof msg === 'object') {
    msg = msg.message || msg.error || JSON.stringify(msg);
  }

  const err = new Error(String(msg || 'coinbase_error'));
  err.status = r.status;
  err.payload = json;
  throw err;
}
  return json;
}

function unwrapCharge(response) {
  // Response can be { data: {...} } depending on endpoint/version
  return (response && response.data) ? response.data : response;
}

function getChargeStatus(charge) {
  // Latest status is the last entry in timeline (per Coinbase docs)
  const tl = charge && charge.timeline;
  if (Array.isArray(tl) && tl.length) {
    return String(tl[tl.length - 1].status || '').toUpperCase();
  }
  return '';
}

function isFulfilledStatus(status) {
  const s = String(status || '').toUpperCase();
  if (COINBASE_FULFILL_AT === 'COMPLETED') return s === 'COMPLETED';
  // default: fulfill at PENDING or COMPLETED (fast + safe enough for most digital goods)
  return s === 'PENDING' || s === 'COMPLETED';
}

// server.js (Updated activatePlanForEmail)

async function activatePlanForEmail(email, planKey, extra = {}) {
  const key = String(planKey || '').trim();
  const e = String(email || '').toLowerCase();
  
  if (!email) return null;

  // --- CASE A: CREATOR ACCESS (ADD-ON) ---
  if (key === 'creator_access') {
    console.log(`[Payment] Activating CREATOR ACCESS for ${e}`);
    
    // 1. Update Memory DB
    if (DB.user && DB.user.email === e) {
      DB.user.hasCreatorAccess = true;
    }
    if (DB.users[e]) {
      DB.users[e].hasCreatorAccess = true;
      saveUsersStore();
    }

    // 2. Update Firestore
    if (hasFirebase) {
      try {
        await updateUserByEmail(e, { hasCreatorAccess: true });
      } catch (err) {
        console.error('Firestore update error (creator_access):', err);
      }
    }
    return { hasCreatorAccess: true };
  }

  // --- CASE B: MEMBERSHIP TIERS (EXISTING LOGIC) ---
  if (!PLAN_RULES[key]) return null;

  const rule = PLAN_RULES[key];
  const now = new Date();
  const planStart = now.toISOString();
  const planEnd = new Date(now.getTime() + rule.durationDays * DAY_MS).toISOString();

  // Update In-Memory
  if (DB.user && DB.user.email === e) {
    DB.user.plan = key;
    DB.user.planStart = planStart;
    DB.user.planEnd = planEnd;
    DB.user.planActive = true;
    DB.user.paymentProvider = 'coinbase_commerce';
    Object.assign(DB.user, extra || {});
  }

// Update Cache
if (DB.users[e]) {
  const prev = DB.users[e] || {};
  DB.users[e] = {
    ...prev,
    email: e,
    plan: key,
    planStart,
    planEnd,
    planActive: true,
    paymentProvider: 'coinbase_commerce',
    ...(extra || {})
  };

  // Clear shortlist/swipe/match state on upgrade
  try {
    if (DB.shortlistState && DB.shortlistState[e]) {
      delete DB.shortlistState[e];
    }
    if (DB.datesState && DB.datesState[e]) {
      delete DB.datesState[e];
    }
    if (DB.approvedState && DB.approvedState[e]) {
      delete DB.approvedState[e];
    }
    if (DB.swipes && DB.swipes[e]) {
      delete DB.swipes[e];
    }
    if (DB.matches && DB.matches[e]) {
      delete DB.matches[e];
    }
    if (typeof SERVER_SWIPE_COUNTS === 'object' &&
        SERVER_SWIPE_COUNTS &&
        SERVER_SWIPE_COUNTS[e] != null) {
      delete SERVER_SWIPE_COUNTS[e];
    }

    if (!hasFirebase) {
      saveUsersStore();
      saveSwipesStore();
    }
  } catch (err) {
    console.error('Error clearing swipe state on plan upgrade for', e, err);
  }
}



// Update Firestore
  if (hasFirebase) {
    try {
      await updateUserByEmail(e, {
        plan: key,
        planStart,
        planEnd,
        planActive: true,
        paymentProvider: 'coinbase_commerce',
        ...extra
      });
    } catch (err) {
      console.error('error saving plan to Firestore:', err);
    }
  }

  return { plan: key, planStart, planEnd, planActive: true };
}

async function createCoinbaseCharge(planKey, email) {
  const key = String(planKey || '').trim();
  const plan = COINBASE_PLANS[key];
  if (!plan) throw new Error('invalid_plan');

  const body = {
    pricing_type: 'fixed_price',
    local_price: { amount: plan.amount, currency: plan.currency },
    metadata: {
      plan: key,
      email: String(email || '').trim(),
      app: 'truematch'
    },
    // We cannot pass the charge code via redirect_url (Coinbase doesn't append extra params),
    // so we use a cookie-based return handler on our own server.
    redirect_url: `${APP_BASE_URL}/api/coinbase/return`,
    cancel_url: `${APP_BASE_URL}/api/coinbase/cancel?plan=${encodeURIComponent(key)}`
  };

  const resp = await coinbaseRequest('/charges', { method: 'POST', body });
  const c = unwrapCharge(resp);

  const hosted = c.hosted_url || c.url;
  if (!c || !hosted || !c.code) throw new Error('coinbase_bad_response');
  return { hosted_url: hosted, code: c.code, charge: c };
}

function setCoinbaseCheckoutCookies(res, { code, plan }) {
  const isHttps = String(APP_BASE_URL || '').startsWith('https://');
  const opts = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    maxAge: 1000 * 60 * 60 // 1 hour
  };
  res.cookie('tm_cc_code', String(code || ''), opts);
  res.cookie('tm_cc_plan', String(plan || ''), opts);
}

// After Coinbase redirects back (success), we read cookies and go straight to dashboard.
// Dashboard will finalize/confirm using the session_id (Coinbase charge code).
app.get('/api/coinbase/return', (req, res) => {
  const code = String(req.cookies?.tm_cc_code || '').trim();
  const plan = String(req.cookies?.tm_cc_plan || '').trim();

  // clear cookies ASAP
  res.clearCookie('tm_cc_code');
  res.clearCookie('tm_cc_plan');

  // If we somehow lost the charge code, return user to tier (they can retry)
  if (!code) {
    const qs = new URLSearchParams();
    qs.set('onboarding', '1');
    qs.set('error', 'missing_charge_code');
    if (plan) qs.set('prePlan', plan);
    return res.redirect(`/tier.html?${qs.toString()}`);
  }

  // ✅ Send the user back to the pay page; pay.html will confirm
  // the Coinbase charge and decide where to send them next (advanced
  // preferences onboarding vs dashboard).
  const qs = new URLSearchParams();
  if (plan) qs.set('plan', plan);
  qs.set('session_id', code);
  qs.set('from', 'coinbase');
  return res.redirect(`/pay.html?${qs.toString()}`);
});

app.get('/api/coinbase/cancel', (req, res) => {
  const plan = String(req.query?.plan || '').trim();
  const qs = new URLSearchParams();
  qs.set('cancelled', '1');
  if (plan) qs.set('prePlan', plan);
  return res.redirect(`/tier.html?${qs.toString()}`);
});

// ---- New Coinbase endpoints (preferred) ----

// Create a charge and return hosted_url
app.post('/api/coinbase/create-charge', async (req, res) => {
  try {
    const { plan, planKey } = req.body || {};
    const key = String(planKey || plan || '').trim();

    const email = (DB && DB.user && DB.user.email) ? DB.user.email : '';
    if (!email) return res.status(401).json({ ok: false, message: 'not_authenticated' });

    const { hosted_url, code } = await createCoinbaseCharge(key, email);
    setCoinbaseCheckoutCookies(res, { code, plan: key });

    return res.json({ ok: true, url: hosted_url, code });
    } catch (err) {
    console.error('coinbase create-charge error', err);
    const status = err.status || 500;
   return res.status(status).json({
    ok: false,
    message: err.message || 'coinbase_error',
    details: err.payload || null
  });
}

});

// Poll a charge by code (useful if webhook isn't set up yet)
app.get('/api/coinbase/charge/:code', async (req, res) => {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) return res.status(400).json({ ok: false, message: 'code_required' });

    const resp = await coinbaseRequest(`/charges/${encodeURIComponent(code)}`, { method: 'GET' });
    const c = unwrapCharge(resp);
    const status = getChargeStatus(c);

    return res.json({ ok: true, status, charge: c });
  } catch (err) {
    console.error('coinbase charge fetch error', err);
    return res.status(500).json({ ok: false, message: err.message || 'coinbase_error' });
  }
});

// Coinbase webhook (charge:pending, charge:confirmed, etc.)
// IMPORTANT: set COINBASE_COMMERCE_WEBHOOK_SECRET in your .env
app.post('/api/coinbase/webhook', async (req, res) => {
  try {
    if (!COINBASE_WEBHOOK_SECRET) {
      return res.status(500).json({ ok: false, message: 'webhook_secret_not_configured' });
    }

    const signature = req.get('X-CC-Webhook-Signature') || '';
    const rawBuf = req.rawBody || Buffer.from(JSON.stringify(req.body || {}), 'utf8');

    const expected = crypto.createHmac('sha256', COINBASE_WEBHOOK_SECRET).update(rawBuf).digest('hex');
    if (!safeEqualHex(expected, signature)) {
      return res.status(400).json({ ok: false, message: 'invalid_signature' });
    }

    // Coinbase Commerce webhook payload typically includes { event: { type, data } }
    const payload = req.body || {};
    const ev = payload.event || payload;
    const type = String(ev.type || '').toLowerCase();
    const data = unwrapCharge(ev.data || payload.data || {});
    const meta = (data.metadata || {});
    const email = meta.email || meta.customer_email || '';
    const plan = meta.plan || meta.planKey || meta.plan_id || '';

    // Option A: Fulfill via webhook events (fastest)
    if ((type === 'charge:pending' || type === 'charge:confirmed') && email && plan) {
      // Optional stricter fulfillment:
      // - If COINBASE_FULFILL_AT=COMPLETED, we only activate when timeline shows COMPLETED
      if (COINBASE_FULFILL_AT === 'COMPLETED') {
        const status = getChargeStatus(data);
        if (status !== 'COMPLETED') {
          return res.json({ ok: true, ignored: true, reason: `status_${status}` });
        }
      }

      await activatePlanForEmail(email, plan, {
        lastCoinbaseChargeCode: data.code || null,
        lastPaymentEvent: type
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('coinbase webhook error', err);
    return res.status(500).json({ ok: false, message: 'webhook_error' });
  }
});

// ---- Backward-compatible aliases (so your current pay.js keeps working) ----
// pay.js currently calls /api/stripe/create-checkout-session and expects { url }.
// We keep the same endpoint, but it now creates a Coinbase charge (NO Stripe used).
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { plan, planKey } = req.body || {};
    const key = String(planKey || plan || '').trim();

    const email = (DB && DB.user && DB.user.email) ? DB.user.email : '';
    if (!email) return res.status(401).json({ ok: false, message: 'not_authenticated' });

    const { hosted_url, code } = await createCoinbaseCharge(key, email);
    setCoinbaseCheckoutCookies(res, { code, plan: key });

    // Still return { url } to avoid changing frontend right now
    return res.json({ ok: true, url: hosted_url, code });
  } catch (err) {
    console.error('legacy checkout alias error', err);
    return res.status(500).json({ ok: false, message: err.message || 'coinbase_error' });
  }
});

// pay.js currently calls /api/stripe/confirm with { session_id }.
// We interpret session_id as Coinbase "charge code" and confirm via GET /charges/{code}.
app.post('/api/stripe/confirm', async (req, res) => {
  try {
    const { session_id } = req.body || {};
    const code = String(session_id || '').trim();
    if (!code) return res.status(400).json({ ok: false, message: 'session_id required' });

    const resp = await coinbaseRequest(`/charges/${encodeURIComponent(code)}`, { method: 'GET' });
    const c = unwrapCharge(resp);
    const status = getChargeStatus(c);

    if (!isFulfilledStatus(status)) {
      return res.json({ ok: false, message: 'not_paid_yet', status });
    }

    const meta = c.metadata || {};
    const email = meta.email || (DB && DB.user && DB.user.email) || '';
    const plan = meta.plan || meta.planKey || '';

    if (!email || !plan) {
      return res.json({ ok: false, message: 'missing_metadata', status });
    }

    await activatePlanForEmail(email, plan, {
      lastCoinbaseChargeCode: c.code || code,
      lastPaymentEvent: `poll_${status}`
    });

    return res.json({ ok: true, status, plan });
  } catch (err) {
    console.error('legacy confirm alias error', err);
    return res.status(500).json({ ok: false, message: err.message || 'coinbase_error' });
  }
});

// ---------------- Creator Application ----------------
app.post('/api/me/creator/apply', async (req, res) => {
  try {
    if (!DB.user || !DB.user.email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }

    const { handle, gender, contentStyle, price, links } = req.body || {};

    // Basic validation
    if (!handle || !price) {
      return res.status(400).json({ ok: false, message: 'Handle and price are required' });
    }

    const applicationData = {
      handle: String(handle).trim(),
      gender: String(gender || 'woman'),
      contentStyle: String(contentStyle || ''),
      price: Number(price),
      links: String(links || ''),
      appliedAt: new Date().toISOString(),
      status: 'pending' // pending | approved | rejected
    };

    // Update Memory DB
    DB.user.creatorStatus = 'pending';
    DB.user.creatorApplication = applicationData;

    // [FIX START] Update Cache / Global DB
    // Siguraduhing naka-save ang user sa main listahan (DB.users) bago mag-update
    const email = DB.user.email;
    
    // Kung wala sa listahan (halimbawa: kakarestart lang), idagdag muna
    if (!DB.users[email]) {
       DB.users[email] = { ...DB.user };
    }
    
    // Ngayon, i-update ang status at application data
    Object.assign(DB.users[email], {
        creatorStatus: 'pending',
        creatorApplication: applicationData
    });
      saveUsersStore();
    // [FIX END]

    // Update Firestore (if active)
    if (hasFirebase && DB.user.email) {
      try {
        await updateUserByEmail(DB.user.email, {
          creatorStatus: 'pending',
          creatorApplication: applicationData
        });
      } catch (err) {
        console.error('Firestore update failed', err);
      }
    }

    return res.json({ ok: true, creatorStatus: 'pending' });
  } catch (err) {
    console.error('Creator apply error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});
// ---------------- Creator Subscription (ILIPAT MO DITO SA LABAS) ----------------


// Update creator profile details WITHOUT resetting status to pending.
// Used by Settings > Edit Profile on creators page.
app.post('/api/me/creator/profile', async (req, res) => {
  try {
    if (!DB.user) {
      return res.status(401).json({ ok: false, error: 'Not logged in' });
    }

    const body = req.body || {};

    const prev = (DB.user.creatorApplication && typeof DB.user.creatorApplication === 'object')
      ? DB.user.creatorApplication
      : {};

    const next = { ...prev };

    // Preserve status (do NOT force pending here)
    const preservedStatus = safeStr(prev.status) || safeStr(DB.user.creatorStatus) || 'pending';
    next.status = preservedStatus;

    if (Object.prototype.hasOwnProperty.call(body, 'handle')) {
      const h = safeStr(body.handle).replace(/^@/, '').trim();
      if (h) next.handle = h;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'contentStyle')) {
      next.contentStyle = safeStr(body.contentStyle);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'links')) {
      next.links = safeStr(body.links);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'gender')) {
      next.gender = safeStr(body.gender);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'price')) {
      const p = Number(body.price);
      if (!Number.isNaN(p)) next.price = p;
    }

    next.updatedAt = new Date().toISOString();

    const cleaned = pruneUndefinedDeep(next);

    DB.user.creatorApplication = cleaned;
    DB.user.creatorStatus = preservedStatus;

    if (DB.user.email && DB.users && DB.users[DB.user.email]) {
      DB.users[DB.user.email].creatorApplication = cleaned;
      DB.users[DB.user.email].creatorStatus = preservedStatus;
    }

    // Persist
    if (DB.user.email) {
      await updateUserByEmail(DB.user.email, {
        creatorApplication: cleaned,
        creatorStatus: preservedStatus,
      });
    }

    return res.json({ ok: true, creatorApplication: cleaned });
  } catch (e) {
    console.error('creator/profile error', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.post('/api/me/creator/subscribe', async (req, res) => {
  try {
    if (!DB.user || !DB.user.email) {
      return res.status(401).json({ ok: false, message: 'Not logged in' });
    }

    const email = DB.user.email;

    // Ensure user exists in Global DB
    if (!DB.users[email]) {
       DB.users[email] = { ...DB.user };
    }

    // Activate Creator Access
    DB.users[email].hasCreatorAccess = true;
    
    // Update Session User
    DB.user.hasCreatorAccess = true;
    saveUsersStore();
    // Optional: Save to Firestore/Disk if needed
    if (hasFirebase) {
      try { await updateUserByEmail(email, { hasCreatorAccess: true }); } catch (e) {}
    }
    
    return res.json({ ok: true, message: 'Subscription active' });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});
// server.js
// ---------------- Creator-to-Creator Subscriptions (Following / Subscribers) ----------------
const CREATOR_SUBS_COLLECTION = process.env.CREATOR_SUBS_COLLECTION || 'iTrueMatchCreatorSubscriptions';

function _b64url(str) {
  return Buffer.from(String(str || '').toLowerCase(), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function _subDocId(subscriberEmail, creatorEmail) {
  return `${_b64url(subscriberEmail)}__${_b64url(creatorEmail)}`;
}

function _normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function _tsToMs(t) {
  if (!t) return null;
  if (typeof t === 'number') return t;
  if (t._seconds) return (t._seconds * 1000) + Math.floor((t._nanoseconds || 0) / 1e6);
  if (t.seconds) return (t.seconds * 1000) + Math.floor((t.nanoseconds || 0) / 1e6);
  if (t.toMillis) return t.toMillis();
  return null;
}

function _computeSubFlags(sub, nowMs) {
  const endAtMs = _tsToMs(sub.endAt) || null;
  const startAtMs = _tsToMs(sub.startAt) || null;
  const rawStatus = String(sub.status || '').toLowerCase();
  let status = rawStatus || (endAtMs && endAtMs > nowMs ? 'active' : 'expired');
  if (!endAtMs && status === '') status = 'active';
  const isCancelled = status === 'cancelled' || status === 'canceled';
  const isActive = !isCancelled && (!endAtMs || endAtMs > nowMs) && status !== 'expired';
  if (isCancelled) status = 'cancelled';
  if (!isActive && status === 'active') status = 'expired';
  return { status, isActive, startAtMs, endAtMs };
}

async function _publicUserByEmailCached(email, cache) {
  const key = _normalizeEmail(email);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);
  try {
    const u = await findUserByEmail(key);
    const pu = u ? publicUser(u) : { email: key, name: '', handle: '', avatarUrl: '', verified: false };
    cache.set(key, pu);
    return pu;
  } catch (e) {
    const pu = { email: key, name: '', handle: '', avatarUrl: '', verified: false };
    cache.set(key, pu);
    return pu;
  }
}

async function _listSubsFor(email, direction /* 'subscribed' | 'subscribers' */, limit = 250) {
  const me = _normalizeEmail(email);
  const nowMs = Date.now();

  // Local fallback (if Firebase not enabled)
  if (!hasFirebase || !firestore) {
    DB.creatorSubs = DB.creatorSubs || {};
    const items = Object.values(DB.creatorSubs)
      .filter((x) => (direction === 'subscribed' ? _normalizeEmail(x.subscriberEmail) === me : _normalizeEmail(x.creatorEmail) === me))
      .slice(0, limit)
      .map((x) => {
        const flags = _computeSubFlags(x, nowMs);
        const otherEmail = direction === 'subscribed' ? x.creatorEmail : x.subscriberEmail;
        return {
          id: x.id || _subDocId(x.subscriberEmail, x.creatorEmail),
          subscriberEmail: _normalizeEmail(x.subscriberEmail),
          creatorEmail: _normalizeEmail(x.creatorEmail),
          startAt: x.startAt || null,
          endAt: x.endAt || null,
          status: flags.status,
          isActive: flags.isActive,
          otherEmail: _normalizeEmail(otherEmail),
          otherUser: { email: _normalizeEmail(otherEmail), name: '', handle: '', avatarUrl: '', verified: false },
        };
      });

    const active = items.filter((it) => it.isActive).length;
    const expired = items.length - active;
    return { items, counts: { all: items.length, active, expired } };
  }

  const field = direction === 'subscribed' ? 'subscriberEmail' : 'creatorEmail';
  const snap = await firestore
    .collection(CREATOR_SUBS_COLLECTION)
    .where(field, '==', me)
    .limit(limit)
    .get();

  const cache = new Map();
  const items = await Promise.all(
    snap.docs.map(async (d) => {
      const sub = d.data() || {};
      const subscriberEmail = _normalizeEmail(sub.subscriberEmail || '');
      const creatorEmail = _normalizeEmail(sub.creatorEmail || '');
      const flags = _computeSubFlags(sub, nowMs);
      const otherEmail = direction === 'subscribed' ? creatorEmail : subscriberEmail;
      const otherUser = await _publicUserByEmailCached(otherEmail, cache);

      return {
        id: d.id,
        subscriberEmail,
        creatorEmail,
        startAt: sub.startAt || null,
        endAt: sub.endAt || null,
        status: flags.status,
        isActive: flags.isActive,
        otherEmail,
        otherUser,
        updatedAt: sub.updatedAt || null,
        createdAt: sub.createdAt || null,
      };
    })
  );

  items.sort((a, b) => {
    const am = _tsToMs(a.updatedAt) || _tsToMs(a.createdAt) || 0;
    const bm = _tsToMs(b.updatedAt) || _tsToMs(b.createdAt) || 0;
    return bm - am;
  });

  const active = items.filter((it) => it.isActive).length;
  const expired = items.length - active;
  return { items, counts: { all: items.length, active, expired } };
}

app.get('/api/me/subscriptions', async (req, res) => {
  try {
    const me = _normalizeEmail(getSessionEmail(req) || (DB.user && DB.user.email) || '');
    if (!me) return res.status(401).json({ ok: false, message: 'Not logged in' });

    const dir = String(req.query.dir || '').toLowerCase();
    const wantSubscribed = !dir || dir === 'subscribed' || dir === 'subscribedto';
    const wantSubscribers = !dir || dir === 'subscribers' || dir === 'fans';

    const [subscribed, subscribers] = await Promise.all([
      wantSubscribed ? _listSubsFor(me, 'subscribed') : Promise.resolve({ items: [], counts: { all: 0, active: 0, expired: 0 } }),
      wantSubscribers ? _listSubsFor(me, 'subscribers') : Promise.resolve({ items: [], counts: { all: 0, active: 0, expired: 0 } }),
    ]);

    return res.json({ ok: true, subscribed, subscribers, ts: Date.now() });
  } catch (e) {
    console.error('GET /api/me/subscriptions error', e);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// For testing / future payment integration
app.post('/api/creator/subscribe', async (req, res) => {
  try {
    const me = _normalizeEmail(getSessionEmail(req) || (DB.user && DB.user.email) || '');
    if (!me) return res.status(401).json({ ok: false, message: 'Not logged in' });

    const creatorEmail = _normalizeEmail(req.body && req.body.creatorEmail);
    const durationDays = Math.max(1, Math.min(365, parseInt((req.body && req.body.durationDays) || '30', 10) || 30));

    if (!creatorEmail) return res.status(400).json({ ok: false, message: 'creatorEmail is required' });
    if (creatorEmail === me) return res.status(400).json({ ok: false, message: "You can't subscribe to yourself" });

    const creatorDoc = await findUserByEmail(creatorEmail);
    if (!creatorDoc) return res.status(404).json({ ok: false, message: 'Creator not found' });

    const nowMs = Date.now();

    const id = _subDocId(me, creatorEmail);
    if (!hasFirebase || !firestore) {
      DB.creatorSubs = DB.creatorSubs || {};
      DB.creatorSubs[id] = {
        id,
        subscriberEmail: me,
        creatorEmail,
        status: 'active',
        startAt: nowMs,
        endAt: nowMs + durationDays * 24 * 60 * 60 * 1000,
        createdAt: DB.creatorSubs[id]?.createdAt || nowMs,
        updatedAt: nowMs,
      };
      return res.json({ ok: true, subscribed: true, id });
    }

    const ref = firestore.collection(CREATOR_SUBS_COLLECTION).doc(id);
    const existing = await ref.get();
    const prev = existing.exists ? (existing.data() || {}) : {};
    const prevEndMs = _tsToMs(prev.endAt) || 0;
    const baseMs = Math.max(nowMs, prevEndMs);
    const newEndMs = baseMs + durationDays * 24 * 60 * 60 * 1000;

    await ref.set(
      {
        subscriberEmail: me,
        creatorEmail,
        status: 'active',
        startAt: prev.startAt || new Date(nowMs),
        endAt: new Date(newEndMs),
        createdAt: prev.createdAt || new Date(nowMs),
        updatedAt: new Date(nowMs),
      },
      { merge: true }
    );

    return res.json({ ok: true, subscribed: true, id });
  } catch (e) {
    console.error('POST /api/creator/subscribe error', e);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.post('/api/creator/unsubscribe', async (req, res) => {
  try {
    const me = _normalizeEmail(getSessionEmail(req) || (DB.user && DB.user.email) || '');
    if (!me) return res.status(401).json({ ok: false, message: 'Not logged in' });

    const creatorEmail = _normalizeEmail(req.body && req.body.creatorEmail);
    if (!creatorEmail) return res.status(400).json({ ok: false, message: 'creatorEmail is required' });

    const id = _subDocId(me, creatorEmail);
    const nowMs = Date.now();

    if (!hasFirebase || !firestore) {
      DB.creatorSubs = DB.creatorSubs || {};
      if (DB.creatorSubs[id]) {
        DB.creatorSubs[id].status = 'cancelled';
        DB.creatorSubs[id].endAt = nowMs;
        DB.creatorSubs[id].updatedAt = nowMs;
      }
      return res.json({ ok: true, unsubscribed: true, id });
    }

    await firestore.collection(CREATOR_SUBS_COLLECTION).doc(id).set(
      { status: 'cancelled', endAt: new Date(nowMs), updatedAt: new Date(nowMs) },
      { merge: true }
    );

    return res.json({ ok: true, unsubscribed: true, id });
  } catch (e) {
    console.error('POST /api/creator/unsubscribe error', e);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});



// ---------------- Wallet + Payments + Support ----------------
// NOTE: These endpoints make "More" + Wallet actions real (backend + DB), not UI-only.

const WALLET_COLLECTION = process.env.WALLET_COLLECTION || 'iTrueMatchWallets';
const SUPPORT_TICKETS_COLLECTION = process.env.SUPPORT_TICKETS_COLLECTION || 'iTrueMatchSupportTickets';

function _walletDefault(email) {
  return {
    email: safeStr(email || ''),
    balance: { credits: 0 },
    prefs: { rebillPrimary: false },
    cards: [],
    tx: [],
    updatedAt: new Date(),
    createdAt: new Date()
  };
}

function _capArray(arr, max) {
  if (!Array.isArray(arr)) return [];
  if (arr.length <= max) return arr;
  return arr.slice(0, max);
}

function _sanitizeCardInput(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const last4 = String(c.last4 || '').replace(/\D/g, '').slice(-4);
  const expMonth = Number(c.expMonth || 0);
  const expYear = Number(c.expYear || 0);
  const brand = safeStr(c.brand || '');
  const nameOnCard = safeStr(c.nameOnCard || c.name || '');

  // Billing address (optional)
  const billing = {
    country: safeStr(c.country || ''),
    state: safeStr(c.state || ''),
    city: safeStr(c.city || ''),
    address: safeStr(c.address || ''),
    zip: safeStr(c.zip || '')
  };

  // Never store PAN / CVV even if accidentally sent
  return {
    id: safeStr(c.id || '') || `card_${crypto.randomUUID()}`,
    brand,
    last4,
    expMonth: Number.isFinite(expMonth) ? expMonth : 0,
    expYear: Number.isFinite(expYear) ? expYear : 0,
    nameOnCard,
    billing,
    isPrimary: !!c.isPrimary,
    createdAtMs: Number(c.createdAtMs || Date.now())
  };
}

async function _walletLoad(email) {
  const key = safeStr(email || '').toLowerCase();
  if (!key) return _walletDefault(email);

  if (hasFirebase && firestore) {
    const ref = firestore.collection(WALLET_COLLECTION).doc(key);
    const snap = await ref.get();
    if (!snap.exists) {
      const def = _walletDefault(key);
      await ref.set(def, { merge: true });
      return def;
    }
    const data = snap.data() || {};
    return {
      ..._walletDefault(key),
      ...data,
      balance: { ...(_walletDefault(key).balance), ...(data.balance || {}) },
      prefs: { ...(_walletDefault(key).prefs), ...(data.prefs || {}) },
      cards: Array.isArray(data.cards) ? data.cards : [],
      tx: Array.isArray(data.tx) ? data.tx : []
    };
  }

  // Fallback (no Firebase): in-memory only
  DB.wallets = DB.wallets || {};
  if (!DB.wallets[key]) DB.wallets[key] = _walletDefault(key);
  return DB.wallets[key];
}

async function _walletSave(email, wallet) {
  const key = safeStr(email || '').toLowerCase();
  const next = { ...(wallet || _walletDefault(key)), updatedAt: new Date() };

  // Cap lists to prevent unbounded growth
  next.cards = _capArray(next.cards || [], 25);
  next.tx = _capArray(next.tx || [], 200);

  if (hasFirebase && firestore) {
    const ref = firestore.collection(WALLET_COLLECTION).doc(key);
    await ref.set(next, { merge: true });
  } else {
    DB.wallets = DB.wallets || {};
    DB.wallets[key] = next;
  }

  return next;
}

app.get('/api/me/wallet', async (req, res) => {
  try {
    if (!DB.user) return res.status(401).json({ ok: false, message: 'Not signed in' });
    const email = DB.user.email;
    const wallet = await _walletLoad(email);
    return res.json({ ok: true, wallet });
  } catch (e) {
    console.error('[wallet] get error', e);
    return res.status(500).json({ ok: false, message: 'Wallet load failed' });
  }
});

app.post('/api/me/wallet/cards/add', async (req, res) => {
  try {
    if (!DB.user) return res.status(401).json({ ok: false, message: 'Not signed in' });
    const email = DB.user.email;

    const card = _sanitizeCardInput(req.body && req.body.card);
    if (!card.last4 || card.last4.length !== 4) {
      return res.status(400).json({ ok: false, message: 'Invalid card details' });
    }
    if (card.expMonth < 1 || card.expMonth > 12) {
      return res.status(400).json({ ok: false, message: 'Invalid expiry month' });
    }
    if (card.expYear < 0) {
      return res.status(400).json({ ok: false, message: 'Invalid expiry year' });
    }

    const wallet = await _walletLoad(email);
    const cards = Array.isArray(wallet.cards) ? wallet.cards.slice() : [];

    // De-dupe by last4+exp (best-effort)
    const dup = cards.some(c => String(c.last4) === String(card.last4) && Number(c.expMonth) === Number(card.expMonth) && Number(c.expYear) === Number(card.expYear));
    if (dup) return res.status(409).json({ ok: false, message: 'This card already exists' });

    if (cards.length >= 25) return res.status(400).json({ ok: false, message: 'Card limit reached' });

    // Primary logic: first card becomes primary automatically
    if (cards.length === 0) card.isPrimary = true;
    if (card.isPrimary) cards.forEach(c => { c.isPrimary = false; });

    cards.unshift(card);

    // Ensure exactly one primary
    if (!cards.some(c => !!c.isPrimary) && cards[0]) cards[0].isPrimary = true;

    const next = await _walletSave(email, { ...wallet, cards });

    return res.json({ ok: true, wallet: next, cards: next.cards });
  } catch (e) {
    console.error('[wallet] add-card error', e);
    return res.status(500).json({ ok: false, message: 'Failed to add card' });
  }
});

app.post('/api/me/wallet/cards/remove', async (req, res) => {
  try {
    if (!DB.user) return res.status(401).json({ ok: false, message: 'Not signed in' });
    const email = DB.user.email;

    const cardId = safeStr(req.body && req.body.cardId);
    if (!cardId) return res.status(400).json({ ok: false, message: 'Missing cardId' });

    const wallet = await _walletLoad(email);
    const cards = (wallet.cards || []).filter(c => safeStr(c.id) !== cardId);

    // Re-assign primary if needed
    if (cards.length && !cards.some(c => !!c.isPrimary)) cards[0].isPrimary = true;

    const next = await _walletSave(email, { ...wallet, cards });

    return res.json({ ok: true, wallet: next, cards: next.cards });
  } catch (e) {
    console.error('[wallet] remove-card error', e);
    return res.status(500).json({ ok: false, message: 'Failed to remove card' });
  }
});

app.post('/api/me/wallet/cards/primary', async (req, res) => {
  try {
    if (!DB.user) return res.status(401).json({ ok: false, message: 'Not signed in' });
    const email = DB.user.email;

    const cardId = safeStr(req.body && req.body.cardId);
    if (!cardId) return res.status(400).json({ ok: false, message: 'Missing cardId' });

    const wallet = await _walletLoad(email);
    const cards = (wallet.cards || []).map(c => ({ ...c, isPrimary: safeStr(c.id) === cardId }));

    if (!cards.some(c => !!c.isPrimary)) return res.status(404).json({ ok: false, message: 'Card not found' });

    const next = await _walletSave(email, { ...wallet, cards });

    return res.json({ ok: true, wallet: next, cards: next.cards });
  } catch (e) {
    console.error('[wallet] set-primary error', e);
    return res.status(500).json({ ok: false, message: 'Failed to set primary card' });
  }
});

app.post('/api/me/wallet/prefs', async (req, res) => {
  try {
    if (!DB.user) return res.status(401).json({ ok: false, message: 'Not signed in' });
    const email = DB.user.email;

    const rebillPrimary = !!(req.body && req.body.rebillPrimary);

    const wallet = await _walletLoad(email);
    const next = await _walletSave(email, { ...wallet, prefs: { ...(wallet.prefs || {}), rebillPrimary } });

    return res.json({ ok: true, wallet: next, prefs: next.prefs });
  } catch (e) {
    console.error('[wallet] prefs error', e);
    return res.status(500).json({ ok: false, message: 'Failed to update wallet preferences' });
  }
});

app.post('/api/me/wallet/tx/add', async (req, res) => {
  try {
    if (!DB.user) return res.status(401).json({ ok: false, message: 'Not signed in' });
    const email = DB.user.email;

    const raw = req.body && req.body.tx;
    const tx = raw && typeof raw === 'object' ? raw : {};
    const nextTx = {
      id: safeStr(tx.id || '') || `tx_${crypto.randomUUID()}`,
      title: safeStr(tx.title || ''),
      type: safeStr(tx.type || 'activity'),
      amount: Number(tx.amount || 0),
      createdAtMs: Number(tx.createdAtMs || Date.now())
    };

    const wallet = await _walletLoad(email);
    const txList = Array.isArray(wallet.tx) ? wallet.tx.slice() : [];
    txList.unshift(nextTx);

    const next = await _walletSave(email, { ...wallet, tx: txList });

    return res.json({ ok: true, wallet: next, tx: next.tx });
  } catch (e) {
    console.error('[wallet] tx/add error', e);
    return res.status(500).json({ ok: false, message: 'Failed to add transaction' });
  }
});

app.get('/api/me/payments', async (req, res) => {
  try {
    if (!DB.user) return res.status(401).json({ ok: false, message: 'Not signed in' });
    const email = DB.user.email;

    let subs = [];
    if (hasFirebase && firestore) {
      const snap = await firestore.collection(CREATOR_SUBS_COLLECTION).where('subscriberEmail', '==', email).get();
      subs = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    } else {
      // Fallback in-memory
      subs = Object.values(DB.creatorSubs || {}).filter(s => safeStr(s.subscriberEmail).toLowerCase() === safeStr(email).toLowerCase());
    }

    const payments = subs.map(s => {
      const creatorEmail = safeStr(s.creatorEmail || '');
      const status = safeStr(s.status || '');
      const createdAtMs = s.createdAt && typeof s.createdAt.toMillis === 'function'
        ? s.createdAt.toMillis()
        : Number(s.createdAtMs || (s.createdAt ? new Date(s.createdAt).getTime() : Date.now()));

      // Amount is best-effort: use stored price if present, else null (avoid lying)
      const amount = (typeof s.amount === 'number') ? s.amount : (typeof s.price === 'number' ? s.price : null);

      return {
        id: safeStr(s.id || '') || `pay_${crypto.randomUUID()}`,
        kind: 'subscription',
        creatorEmail,
        status: status || 'active',
        currency: safeStr(s.currency || 'USD'),
        amount,
        createdAtMs
      };
    });

    // Most recent first
    payments.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));

    return res.json({ ok: true, payments });
  } catch (e) {
    console.error('[payments] error', e);
    return res.status(500).json({ ok: false, message: 'Failed to load payments' });
  }
});

app.post('/api/support/email', async (req, res) => {
  try {
    if (!DB.user) return res.status(401).json({ ok: false, message: 'Not signed in' });

    const fromEmail = safeStr(DB.user.email || '');
    const name = safeStr((req.body && req.body.name) || '');
    const subject = safeStr((req.body && req.body.subject) || 'Support request');
    const message = safeStr((req.body && req.body.message) || '');

    if (!message) return res.status(400).json({ ok: false, message: 'Message is required' });

    const ticketId = `tkt_${crypto.randomUUID()}`;
    const ticket = {
      id: ticketId,
      fromEmail,
      name,
      subject,
      message,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      ua: safeStr(req.headers['user-agent'] || ''),
      ip: safeStr(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    };

    // Store to DB (Firestore primary if available)
    if (hasFirebase && firestore) {
      await firestore.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId).set(ticket, { merge: true });
    } else {
      DB.supportTickets = DB.supportTickets || {};
      DB.supportTickets[ticketId] = ticket;
    }

    // Email notify (best-effort)
    const toEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || process.env.MAIL_TO || fromEmail;
    try {
      await sendMail({
        to: toEmail,
        subject: `[TrueMatch Support] ${subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h3>New Support Ticket</h3>
            <p><b>Ticket:</b> ${ticketId}</p>
            <p><b>From:</b> ${name ? `${name} &lt;${fromEmail}&gt;` : fromEmail}</p>
            <p><b>Subject:</b> ${subject}</p>
            <pre style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:8px">${message}</pre>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn('[support] email notify failed:', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    return res.json({ ok: true, ticketId });
  } catch (e) {
    console.error('[support] error', e);
    return res.status(500).json({ ok: false, message: 'Failed to submit support request' });
  }
});

// ---------------- End Wallet + Payments + Support ----------------


// ---------------- Creator Posts (Feed) ----------------
const CREATOR_POSTS_COLLECTION = process.env.CREATOR_POSTS_COLLECTION || 'iTrueMatchCreatorPosts';

function _splitPipesSafe(str) {
  return String(str || '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);
}

function _getPackedValue(packed, label) {
  const wanted = String(label || '').toLowerCase();
  for (const part of _splitPipesSafe(packed)) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim().toLowerCase();
    if (k === wanted) return part.slice(idx + 1).trim();
  }
  return '';
}

function _creatorMetaFromUserDoc(u) {
  const app = (u && typeof u.creatorApplication === 'object' && u.creatorApplication) ? u.creatorApplication : {};
  const packed = app.contentStyle || '';
  const displayName =
    _getPackedValue(packed, 'Display name') ||
    _getPackedValue(packed, 'Name') ||
    (u && u.name) ||
    'Creator';

  const rawHandle = String(app.handle || u?.handle || u?.username || '').trim().replace(/^@/, '');
  const creatorHandle = rawHandle ? `@${rawHandle}` : '';

  const creatorAvatarUrl = String(u?.avatarUrl || u?.photoUrl || u?.photoURL || '').trim();
  const creatorVerified = !!u?.verified;

  return { creatorName: displayName, creatorHandle, creatorAvatarUrl, creatorVerified };
}

function _newPostId() {
  try { return crypto.randomUUID(); } catch (e) {
    return `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function _sanitizeCreatorPostPayload(body) {
  const b = body && typeof body === 'object' ? body : {};
  const typeRaw = String(b.type || 'text').toLowerCase().trim();
  const type = (typeRaw === 'poll' || typeRaw === 'quiz') ? typeRaw : 'text';

  const text = safeStr(String(b.text || '')).trim().slice(0, 2400);

  let poll = null;
  let pollVotes = null;

  if (type === 'poll') {
    const options = Array.isArray(b.poll?.options) ? b.poll.options : [];
    const clean = options
      .map(o => safeStr(String(o || '')).trim())
      .filter(Boolean)
      .slice(0, 6);

    if (clean.length < 2) {
      throw new Error('Poll needs at least 2 options.');
    }
    poll = { options: clean };
    pollVotes = new Array(clean.length).fill(0);
  }

  let quiz = null;
  let quizVotes = null;

  if (type === 'quiz') {
    const q = b.quiz && typeof b.quiz === 'object' ? b.quiz : {};
    const question = safeStr(String(q.question || text || '')).trim().slice(0, 2400);

    const options = Array.isArray(q.options) ? q.options : [];
    const clean = options
      .map(o => safeStr(String(o || '')).trim())
      .filter(Boolean)
      .slice(0, 6);

    const correctIndex = Number.isFinite(+q.correctIndex) ? Math.max(0, Math.min(clean.length - 1, +q.correctIndex)) : 0;
    const explanation = safeStr(String(q.explanation || '')).trim().slice(0, 1200);

    if (!question || clean.length < 2) {
      throw new Error('Quiz needs a question and at least 2 options.');
    }

    quiz = { question, options: clean, correctIndex, explanation };
    quizVotes = new Array(clean.length).fill(0);
  }

  if (type === 'text' && !text) {
    throw new Error('Post text is required.');
  }

  return { type, text, poll, pollVotes, quiz, quizVotes };
}

function _creatorPostToClient(id, d) {
  const createdAtMs = _tsToMs(d?.createdAt) || _tsToMs(d?.timestamp) || _tsToMs(d?.createdAtMs) || null;
  const updatedAtMs = _tsToMs(d?.updatedAt) || null;

  return {
    id: id || d?.id || '',
    creatorEmail: safeStr(d?.creatorEmail || ''),
    creatorName: safeStr(d?.creatorName || ''),
    creatorHandle: safeStr(d?.creatorHandle || ''),
    creatorAvatarUrl: safeStr(d?.creatorAvatarUrl || ''),
    creatorVerified: !!d?.creatorVerified,
    type: safeStr(d?.type || 'text') || 'text',
    text: safeStr(d?.text || ''),
    poll: d?.poll || null,
    pollVotes: Array.isArray(d?.pollVotes) ? d.pollVotes : null,
    quiz: d?.quiz || null,
    quizVotes: Array.isArray(d?.quizVotes) ? d.quizVotes : null,
    timestamp: createdAtMs || Date.now(),
    updatedAt: updatedAtMs || null,
  };
}

function _mixPriority(subs, others, limit) {
  const out = [];
  let i = 0, j = 0;

  while (out.length < limit && (i < subs.length || j < others.length)) {
    // 2 subscribed posts, then 1 non-subscribed post (classic "mixed but prioritized" feed)
    for (let k = 0; k < 2 && out.length < limit && i < subs.length; k++) out.push(subs[i++]);
    if (out.length < limit && j < others.length) out.push(others[j++]);

    if (i >= subs.length && j < others.length) {
      while (out.length < limit && j < others.length) out.push(others[j++]);
      break;
    }
    if (j >= others.length && i < subs.length) {
      while (out.length < limit && i < subs.length) out.push(subs[i++]);
      break;
    }
  }

  return out;
}

// Create a creator post (stored in Firestore)
app.post('/api/creator/posts', async (req, res) => {
  try {
    const me = _normalizeEmail(getSessionEmail(req));
    if (!me) return res.status(401).json({ ok: false, error: 'Not signed in.' });

    const payload = _sanitizeCreatorPostPayload(req.body);

    // Creator meta (best-effort)
    let userDoc = null;
    try { userDoc = await findUserByEmail(me); } catch (e) { userDoc = null; }
    const meta = _creatorMetaFromUserDoc(userDoc || { name: me });

    const nowMs = Date.now();
    const id = _newPostId();

    const doc = {
      id,
      creatorEmail: me,
      ...meta,
      type: payload.type,
      text: payload.text,
      poll: payload.poll,
      pollVotes: payload.pollVotes,
      quiz: payload.quiz,
      quizVotes: payload.quizVotes,
      createdAt: new Date(nowMs),
      updatedAt: new Date(nowMs),
    };

    if (!hasFirebase || !firestore) {
      DB.creatorPosts = DB.creatorPosts || {};
      DB.creatorPosts[id] = { ...doc, createdAt: nowMs, updatedAt: nowMs };
      return res.json({ ok: true, post: _creatorPostToClient(id, DB.creatorPosts[id]) });
    }

    await firestore.collection(CREATOR_POSTS_COLLECTION).doc(id).set(doc);
    return res.json({ ok: true, post: _creatorPostToClient(id, doc) });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
});

// Delete a creator post (creator only)
app.post('/api/creator/posts/delete', async (req, res) => {
  try {
    const me = _normalizeEmail(getSessionEmail(req));
    if (!me) return res.status(401).json({ ok: false, error: 'Not signed in.' });

    const id = safeStr(String(req.body?.id || '')).trim();
    if (!id) return res.status(400).json({ ok: false, error: 'Missing post id.' });

    if (!hasFirebase || !firestore) {
      const p = DB.creatorPosts?.[id];
      if (!p) return res.status(404).json({ ok: false, error: 'Not found.' });
      if (_normalizeEmail(p.creatorEmail) !== me) return res.status(403).json({ ok: false, error: 'Forbidden.' });
      delete DB.creatorPosts[id];
      return res.json({ ok: true });
    }

    const ref = firestore.collection(CREATOR_POSTS_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: 'Not found.' });

    const data = snap.data() || {};
    if (_normalizeEmail(data.creatorEmail) !== me) return res.status(403).json({ ok: false, error: 'Forbidden.' });

    await ref.delete();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
});

// Creator posts (single creator)
app.get('/api/creator/posts', async (req, res) => {
  try {
    const me = _normalizeEmail(getSessionEmail(req));
    if (!me) return res.status(401).json({ ok: false, error: 'Not signed in.' });

    const creatorEmail = _normalizeEmail(req.query?.creatorEmail || me);
    const limit = Math.max(1, Math.min(100, parseInt(req.query?.limit || '50', 10) || 50));

    if (!hasFirebase || !firestore) {
      const all = Object.values(DB.creatorPosts || {})
        .filter(p => _normalizeEmail(p.creatorEmail) === creatorEmail)
        .sort((a, b) => (_tsToMs(b.createdAt) || b.timestamp || 0) - (_tsToMs(a.createdAt) || a.timestamp || 0))
        .slice(0, limit)
        .map(p => _creatorPostToClient(p.id, p));
      return res.json({ ok: true, items: all });
    }

    const snap = await firestore
      .collection(CREATOR_POSTS_COLLECTION)
      .where('creatorEmail', '==', creatorEmail)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const items = snap.docs.map(d => _creatorPostToClient(d.id, d.data() || {}));
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
});

// Mixed feed: prioritize subscribed creators (2:1 mix)
app.get('/api/creators/feed', async (req, res) => {
  try {
    const me = _normalizeEmail(getSessionEmail(req));
    if (!me) return res.status(401).json({ ok: false, error: 'Not signed in.' });

    const limit = Math.max(1, Math.min(100, parseInt(req.query?.limit || '40', 10) || 40));
    const nowMs = Date.now();

    // Active subscribed creator emails
    const subscribedSet = new Set();

    if (!hasFirebase || !firestore) {
      const subs = Object.values(DB.creatorSubs || {}).filter(s => _normalizeEmail(s.subscriberEmail) === me);
      for (const s of subs) {
        const flags = _computeSubFlagsFromDoc(s, nowMs);
        const c = _normalizeEmail(s.creatorEmail || '');
        if (flags.isActive && c) subscribedSet.add(c);
      }

      const all = Object.values(DB.creatorPosts || {})
        .map(p => _creatorPostToClient(p.id, p))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, Math.min(300, Math.max(60, limit * 5)));

      const subsPosts = [];
      const otherPosts = [];
      for (const p of all) {
        p.isSubscribed = subscribedSet.has(_normalizeEmail(p.creatorEmail));
        (p.isSubscribed ? subsPosts : otherPosts).push(p);
      }

      return res.json({ ok: true, items: _mixPriority(subsPosts, otherPosts, limit), subscribedCreators: Array.from(subscribedSet) });
    }

    const subsSnap = await firestore
      .collection(CREATOR_SUBS_COLLECTION)
      .where('subscriberEmail', '==', me)
      .limit(250)
      .get();

    subsSnap.docs.forEach(d => {
      const sub = d.data() || {};
      const flags = _computeSubFlagsFromDoc(sub, nowMs);
      const c = _normalizeEmail(sub.creatorEmail || '');
      if (flags.isActive && c) subscribedSet.add(c);
    });

    const base = Math.min(300, Math.max(60, limit * 5));
    const postsSnap = await firestore
      .collection(CREATOR_POSTS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(base)
      .get();

    const all = postsSnap.docs.map(d => _creatorPostToClient(d.id, d.data() || {}));

    const subsPosts = [];
    const otherPosts = [];
    for (const p of all) {
      p.isSubscribed = subscribedSet.has(_normalizeEmail(p.creatorEmail));
      (p.isSubscribed ? subsPosts : otherPosts).push(p);
    }

    return res.json({
      ok: true,
      items: _mixPriority(subsPosts, otherPosts, limit),
      subscribedCreators: Array.from(subscribedSet),
    });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
});

// ---------------- End Creator Posts (Feed) ----------------

// ---------------- Premium Society Application ----------------
app.post('/api/me/premium/apply', async (req, res) => {
  try {
    const email = (typeof getSessionEmail === 'function' ? getSessionEmail(req) : '') ||
                  String((DB.user && DB.user.email) || '').trim().toLowerCase();

    if (!email) {
      return res.status(401).json({ ok: false, message: 'Not authenticated' });
    }

    const body = req.body || {};
    const form = body.application || body || {};

    // Always use DB source-of-truth user (Firestore if enabled) to avoid stale/global DB.user
    let userDoc = null;
    if (hasFirebase) {
      userDoc = await findUserByEmail(email);
      if (!userDoc) {
        return res.status(404).json({ ok: false, message: 'User not found' });
      }
    } else {
      userDoc = (DB.users && DB.users[email]) ? { ...DB.users[email] } : null;
      if (!userDoc) {
        return res.status(404).json({ ok: false, message: 'User not found' });
      }
    }

    
    // Eligibility: Premium Society requires an ACTIVE Plus (Tier 1) or higher plan.
    const myPlanKey = normalizePlanKey(
      userDoc.plan || userDoc.planKey || userDoc.tier || userDoc.tierKey || userDoc.subscriptionPlan || 'free'
    );
    const myTier = (myPlanKey === 'tier3') ? 3 : (myPlanKey === 'tier2') ? 2 : (myPlanKey === 'tier1') ? 1 : 0;
    const myPlanEnd = (userDoc.planEnd ?? userDoc.subscriptionEnd ?? userDoc.subEnd ?? null);
    const myPlanActive = _computePlanActiveForDoc(myPlanKey, myPlanEnd, userDoc.planActive);

    if (!(myPlanActive && myTier >= 1)) {
      return res.status(403).json({
        ok: false,
        code: 'not_eligible',
        message: 'Premium Society applications require an active Plus (Tier 1) or higher plan.'
      });
    }

const currentStatus = String(userDoc.premiumStatus || '').toLowerCase();
    if (currentStatus === 'approved') {
      return res.status(409).json({
        ok: false,
        message: 'You are already approved as a Premium Society member.'
      });
    }
    if (currentStatus === 'pending') {
      return res.status(409).json({
        ok: false,
        message: 'Your Premium Society application is already pending.'
      });
    }

    // Build application payload
    const nowIso = new Date().toISOString();
    const nextApp = {
      ...form,
      fullName: (form.fullName || userDoc.name || '').toString().trim(),
      age: form.age ?? null,
      status: 'pending',
      submittedAt: nowIso,
      decidedAt: null
    };

    if (hasFirebase) {
      await updateUserByEmail(email, {
        premiumStatus: 'pending',
        premiumSince: null,
        premiumApplication: nextApp
      });
      // refresh cache from firestore so /api/me reflects immediately
      const fresh = await findUserByEmail(email);
      if (fresh) {
        DB.users[email] = { ...publicUser({ id: fresh.id, ...fresh }) };
        // keep premium fields even if publicUser is older
        DB.users[email].premiumStatus = fresh.premiumStatus ?? null;
        DB.users[email].premiumSince = fresh.premiumSince ?? null;
        DB.users[email].premiumApplication = fresh.premiumApplication ?? null;
        if (DB.user && String(DB.user.email || '').toLowerCase() === email) {
          DB.user = { ...DB.users[email] };
  normalizeDBUser();
        }
      }
    } else {
      DB.users[email] = DB.users[email] || {};
      DB.users[email].premiumStatus = 'pending';
      DB.users[email].premiumSince = null;
      DB.users[email].premiumApplication = nextApp;
      saveUsersStore();
      if (DB.user && String(DB.user.email || '').toLowerCase() === email) {
        DB.user.premiumStatus = 'pending';
        DB.user.premiumSince = null;
        DB.user.premiumApplication = nextApp;
      }
    }

    return res.json({ ok: true, status: 'pending' });
  } catch (err) {
    console.error('premium apply error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ------------------------------------------------------------------
// ADMIN: APPLICATIONS + TIER STATS (SECURED)
// ------------------------------------------------------------------

// Compute "active" similar to publicUser() but without requiring full doc.
function _toMillis(value) {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : null;
  }
  // Firestore Timestamp shape: { seconds, nanoseconds }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  // Some libs expose toDate()
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date ? d.getTime() : null;
  }
  return null;
}

function _computePlanActiveForDoc(plan, planEnd, planActiveFlag) {
  const planKey = normalizePlanKey(plan);
  if (planKey === 'free') return true;

  const endTs = _toMillis(planEnd);
  if (endTs && Date.now() > endTs) return false;

  const hasFlag = (typeof planActiveFlag === 'boolean');
  if (!hasFlag) {
    // If we don't have an explicit flag, infer from planEnd when available.
    if (endTs) return Date.now() <= endTs;
    return false;
  }

  if (planActiveFlag === false) return false;
  return true;
}

// Active + total users per tier (computed from Firestore so it's accurate)
app.get('/api/admin/tier-stats', requireAdmin, async (req, res) => {
  try {
    const tiers = {
      free: { total: 0, active: 0 },
      tier1: { total: 0, active: 0 },
      tier2: { total: 0, active: 0 },
      tier3: { total: 0, active: 0 }
    };

    if (hasFirebase && usersCollection) {
      // NOTE: This is an admin-only endpoint; occasional full scan is acceptable for small/medium datasets.
      const snap = await usersCollection
        .select('plan', 'planEnd', 'planActive')
        .get();

      snap.forEach((docSnap) => {
        const d = docSnap.data() || {};
        const planKey = normalizePlanKey(d.plan);
        if (!tiers[planKey]) tiers[planKey] = { total: 0, active: 0 };

        tiers[planKey].total += 1;

        const active = _computePlanActiveForDoc(d.plan, d.planEnd, d.planActive);
        if (active) tiers[planKey].active += 1;
      });
    } else {
      const list = Object.values(DB.users || {});
      list.forEach((u) => {
        const planKey = normalizePlanKey(u.plan);
        if (!tiers[planKey]) tiers[planKey] = { total: 0, active: 0 };
        tiers[planKey].total += 1;
        const active = _computePlanActiveForDoc(u.plan, u.planEnd, u.planActive);
        if (active) tiers[planKey].active += 1;
      });
    }

    const totalUsers = Object.values(tiers).reduce((s, t) => s + (t.total || 0), 0);
    const activeUsers = Object.values(tiers).reduce((s, t) => s + (t.active || 0), 0);

    return res.json({ ok: true, tiers, totalUsers, activeUsers });
  } catch (err) {
    console.error('tier-stats error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ---------------- ADMIN: CREATOR APPLICATIONS ----------------

// 1) Get pending Creator applications
app.get('/api/admin/creators/pending', requireAdmin, async (req, res) => {
  try {
    const applicants = [];

    if (hasFirebase && usersCollection) {
      const snap = await usersCollection
        .where('creatorStatus', '==', 'pending')
        .get();

      snap.forEach((docSnap) => {
        const d = docSnap.data() || {};
        const pub = publicUser({ id: docSnap.id, ...d });

        applicants.push({
          ...pub,
          creatorStatus: d.creatorStatus || null,
          creatorApplication: d.creatorApplication || null,
          premiumStatus: d.premiumStatus || null,
          premiumApplication: d.premiumApplication || null
        });
      });
    } else {
      const list = Object.values(DB.users || {}).filter(
        (u) => u && u.creatorStatus === 'pending'
      );

      list.forEach((u) => {
        applicants.push({
          id: u.id || '',
          email: u.email || '',
          name: u.name || '',
          plan: u.plan || 'free',
          planStart: u.planStart || null,
          planEnd: u.planEnd || null,
          avatarUrl: u.avatarUrl || '',
          prefsSaved: !!u.prefsSaved,
          emailVerified: !!u.emailVerified,
          planActive: !!u.planActive,
          creatorStatus: u.creatorStatus || null,
          creatorApplication: u.creatorApplication || null,
          premiumStatus: u.premiumStatus || null,
          premiumApplication: u.premiumApplication || null
        });
      });
    }

    return res.json({ ok: true, count: applicants.length, applicants });
  } catch (err) {
    console.error('creators/pending error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// 2) Approve a Creator
app.post('/api/admin/creators/approve', requireAdmin, async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, message: 'email required' });

    const decidedAt = new Date().toISOString();

    // Firestore (source of truth)
    if (hasFirebase && usersCollection) {
      const existing = await findUserByEmail(email);
      if (!existing) return res.status(404).json({ ok: false, message: 'User not found' });

      const prevApp = existing.creatorApplication || {};
      const nextApp = { ...prevApp, status: 'approved', decidedAt };

      await updateUserByEmail(email, {
        creatorStatus: 'approved',
        creatorSince: decidedAt,
        creatorApplication: nextApp
      });
    }

    // Fallback / local cache
    if (DB.users && DB.users[email]) {
      DB.users[email].creatorStatus = 'approved';
      DB.users[email].creatorSince = decidedAt;
      const prev = DB.users[email].creatorApplication || {};
      DB.users[email].creatorApplication = { ...prev, status: 'approved', decidedAt };
      if (typeof saveUsersStore === 'function') saveUsersStore();
    }

    // session user mirror (if same)
    if (DB.user && String(DB.user.email || '').toLowerCase() === email) {
      DB.user.creatorStatus = 'approved';
      DB.user.creatorSince = decidedAt;
      const prev = DB.user.creatorApplication || {};
      DB.user.creatorApplication = { ...prev, status: 'approved', decidedAt };
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('creators/approve error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// 3) Reject a Creator
app.post('/api/admin/creators/reject', requireAdmin, async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, message: 'email required' });

    const decidedAt = new Date().toISOString();

    if (hasFirebase && usersCollection) {
      const existing = await findUserByEmail(email);
      if (!existing) return res.status(404).json({ ok: false, message: 'User not found' });

      const prevApp = existing.creatorApplication || {};
      const nextApp = { ...prevApp, status: 'rejected', decidedAt };

      await updateUserByEmail(email, {
        creatorStatus: 'rejected',
        creatorApplication: nextApp
      });
    }

    if (DB.users && DB.users[email]) {
      DB.users[email].creatorStatus = 'rejected';
      const prev = DB.users[email].creatorApplication || {};
      DB.users[email].creatorApplication = { ...prev, status: 'rejected', decidedAt };
      if (typeof saveUsersStore === 'function') saveUsersStore();
    }

    if (DB.user && String(DB.user.email || '').toLowerCase() === email) {
      DB.user.creatorStatus = 'rejected';
      const prev = DB.user.creatorApplication || {};
      DB.user.creatorApplication = { ...prev, status: 'rejected', decidedAt };
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('creators/reject error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// ---------------- ADMIN: PREMIUM SOCIETY APPLICATIONS ----------------

// 1) Get pending Premium applications
app.get('/api/admin/premium/pending', requireAdmin, async (req, res) => {
  try {
    const applicants = [];

    if (hasFirebase && usersCollection) {
      const snap = await usersCollection
        .where('premiumStatus', '==', 'pending')
        .get();

      snap.forEach((docSnap) => {
        const d = docSnap.data() || {};
        const pub = publicUser({ id: docSnap.id, ...d });

        applicants.push({
          ...pub,
          premiumStatus: d.premiumStatus || null,
          premiumApplication: d.premiumApplication || null,
          creatorStatus: d.creatorStatus || null,
          creatorApplication: d.creatorApplication || null
        });
      });
    } else {
      const list = Object.values(DB.users || {}).filter(
        (u) => u && u.premiumStatus === 'pending'
      );

      list.forEach((u) => {
        applicants.push({
          id: u.id || '',
          email: u.email || '',
          name: u.name || '',
          plan: u.plan || 'free',
          planStart: u.planStart || null,
          planEnd: u.planEnd || null,
          avatarUrl: u.avatarUrl || '',
          prefsSaved: !!u.prefsSaved,
          emailVerified: !!u.emailVerified,
          planActive: !!u.planActive,
          premiumStatus: u.premiumStatus || null,
          premiumApplication: u.premiumApplication || null,
          creatorStatus: u.creatorStatus || null,
          creatorApplication: u.creatorApplication || null
        });
      });
    }

    return res.json({ ok: true, count: applicants.length, applicants });
  } catch (err) {
    console.error('premium/pending error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// 2) Decide on Premium Application (approved / rejected)
app.post('/api/admin/premium/decision', requireAdmin, async (req, res) => {
  try {
    const { email, decision } = req.body || {};
    const e = (email || '').toString().trim().toLowerCase();
    const dec = (decision || '').toString().trim().toLowerCase();

    if (!e || !['approved', 'rejected'].includes(dec)) {
      return res.status(400).json({ ok: false, message: 'email + decision required' });
    }

    const userDoc = hasFirebase ? await findUserByEmail(e) : (DB.users && DB.users[e] ? { ...DB.users[e] } : null);
    if (!userDoc) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const decidedAt = new Date().toISOString();
    const prevApp = userDoc.premiumApplication || {};
    const nextApp = { ...prevApp, status: dec, decidedAt };

    const fields = {
      premiumStatus: dec,
      premiumSince: dec === 'approved' ? decidedAt : null,
      premiumApplication: nextApp
    };

    if (hasFirebase) {
      // Premium Society decision should NOT modify the user's subscription plan.
      await updateUserByEmail(e, fields);

      // Pull fresh doc + refresh cache so /api/me shows the new status immediately
      const fresh = await findUserByEmail(e);
      if (fresh) {
        DB.users[e] = { ...publicUser({ id: fresh.id, ...fresh }) };
        if (DB.user && String(DB.user.email || '').toLowerCase() === e) {
          DB.user = { ...DB.users[e] };
  normalizeDBUser();
        }
      }
    } else {
      DB.users[e] = DB.users[e] || {};
      DB.users[e].premiumStatus = fields.premiumStatus;
      DB.users[e].premiumSince = fields.premiumSince;
      DB.users[e].premiumApplication = fields.premiumApplication;
      saveUsersStore();

      if (DB.user && String(DB.user.email || '').toLowerCase() === e) {
        DB.user.premiumStatus = fields.premiumStatus;
        DB.user.premiumSince = fields.premiumSince;
        DB.user.premiumApplication = fields.premiumApplication;
      }
    }

    return res.json({ ok: true, status: dec });
  } catch (err) {
    console.error('premium decision error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});


// [UPDATED] Get Matches Route
// [UPDATED] Get Real Matches

app.get('/api/matches', authMiddleware, async (req, res) => {
  try {
    const myEmail = String(((req.user && req.user.email) || (DB.user && DB.user.email) || '')).toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const rawMatches = await _getMatchesFor(myEmail);
    const out = [];

    for (const m of rawMatches) {
      const otherEmail = String(m.otherEmail || '').toLowerCase();
      if (!otherEmail) continue;

      let other = null;
      if (hasFirebase) {
        other = await findUserByEmail(otherEmail);
      } else {
        other = (DB.users && DB.users[otherEmail]) ? DB.users[otherEmail] : null;
      }

      const name = (other && other.name) ? other.name : (otherEmail.split('@')[0] || 'Member');
      const city = (other && other.city) ? other.city : 'Global';
      const photoUrl = (other && (other.avatarUrl || other.photoUrl)) ? (other.avatarUrl || other.photoUrl) : 'assets/images/truematch-mark.png';

      out.push({
        id: otherEmail,
        email: otherEmail,
        name,
        city,
        photoUrl,
        meAction: m.meAction || null,
        themAction: m.themAction || null,
        since: m.createdAtMs || null,
      });
    }

    res.json({ ok: true, matches: out });
  } catch (err) {
    console.error('matches error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});
// Public config to expose client IDs (safe values only)


// ---------------- Email Verification (OTP) -------------------
let _mailer = null;

async function getMailer() {
  if (_mailer !== null) return _mailer;
  try {
    const nodemailer = require('nodemailer');
    const host = process.env.SMTP_HOST || '';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (host && user && pass) {
      _mailer = nodemailer.createTransport({
        host,
        port,
        secure: (port === 465),
        auth: { user, pass }
      });
      // sanity ping: log once at boot whether transport looks OK
      _mailer.verify().then(() => {
        console.log(`[mail] SMTP transport ready → ${host}:${port} as ${user}`);
      }).catch(err => {
        console.error('[mail] SMTP verify failed:', err?.message || err);
      });
    } else {
      _mailer = false;
      console.warn('[mail] SMTP disabled (missing SMTP_HOST/SMTP_USER/SMTP_PASS)');
    }
  } catch (e) {
    _mailer = false;
    console.error('[mail] Nodemailer init failed:', e?.message || e);
  }
  return _mailer;
}

function generateCode() {
  return '' + Math.floor(100000 + Math.random() * 900000);
}

const CODE_TTL_MS = 10 * 60 * 1000;   // 10 minutes
const RESEND_GAP_MS = 60 * 1000;      // 60 seconds
function normalizeEpochMs(v) {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return (v < 1e12 ? v * 1000 : v);
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return (n < 1e12 ? n * 1000 : n);
    return 0;
  }
  if (typeof v === 'object') {
    if (typeof v.toMillis === 'function') return v.toMillis(); // Firestore Timestamp
    if (typeof v.seconds === 'number') return v.seconds * 1000;
    if (typeof v._seconds === 'number') return v._seconds * 1000;
  }
  return 0;
}
if (!DB.emailVerify) DB.emailVerify = {};

function promiseTimeout(promise, ms, label = "operation") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function sendWithResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");

  const from =
    process.env.RESEND_FROM ||
    process.env.MAIL_FROM ||
    "iTrueMatch <noreply@itruematch.com>";

  const payload = {
    from,
    to,
    subject,
    html,
    text,
  };

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg =
      (data && (data.message || data.error || data.name)) ||
      JSON.stringify(data);
    throw new Error(`Resend API error (${resp.status}): ${msg}`);
  }

  return data;
}

// Generic mail helper used by reset/OTP flows.
// Uses Resend when available, falls back to SMTP.
async function sendMail(toEmail, subject, html, text) {
  try {
    const to = String(toEmail || '').trim();
    if (!to) return false;
    const subj = String(subject || '').trim() || 'iTrueMatch';
    const txt = String(text || '').trim() || ' '; // Resend expects non-empty text

    if (process.env.RESEND_API_KEY) {
      try {
        const data = await promiseTimeout(
          sendWithResend({ to, subject: subj, html, text: txt }),
          12000,
          'Resend'
        );
        console.log(`[mail] Resend sent to ${to}`, data?.id ? `id=${data.id}` : '');
        return true;
      } catch (err) {
        console.error('[mail] Resend send failed:', err?.message || err);
        // fall through
      }
    }

    const mailer = await getMailer();
    if (!mailer) {
      console.error('[mail] No mailer configured (set RESEND_API_KEY or SMTP_* env vars).');
      return false;
    }

    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@itruematch.com';
    await promiseTimeout(
      mailer.sendMail({ from, to, subject: subj, html, text: txt }),
      12000,
      'SMTP sendMail'
    );
    console.log('[mail] Email sent via SMTP to:', to);
    return true;
  } catch (err) {
    console.error('[mail] sendMail failed:', err?.message || err);
    return false;
  }
}

async function sendPasswordResetOtpEmail(toEmail, code) {
  const subj = 'Your iTrueMatch password reset code';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px 0;">Reset your password</h2>
      <p style="margin:0 0 16px 0;">Enter this 6-digit code to reset your password. It expires in <b>10 minutes</b>.</p>
      <div style="font-size:28px;letter-spacing:6px;font-weight:700;padding:14px 16px;border:1px solid #ddd;border-radius:12px;display:inline-block;">
        ${code}
      </div>
      <p style="margin:16px 0 0 0;color:#666;font-size:12px;">
        If you didn’t request this, you can ignore this email.
      </p>
    </div>
  `;
  return sendMail(String(toEmail || '').trim(), subj, html, `Your iTrueMatch password reset code is ${code}`);
}

async function sendVerificationEmail(toEmail, code) {
  const subj = "Your iTrueMatch verification code";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px 0;">Verify your email</h2>
      <p style="margin:0 0 16px 0;">Use this code to finish signing in:</p>
      <div style="font-size:28px;letter-spacing:6px;font-weight:700;padding:14px 16px;border:1px solid #ddd;border-radius:12px;display:inline-block;">
        ${code}
      </div>
      <p style="margin:16px 0 0 0;color:#666;font-size:12px;">
        If you didn’t request this, you can ignore this email.
      </p>
    </div>
  `;

  // Preferred: Resend (fast; avoids SMTP port issues on hosts)
  if (process.env.RESEND_API_KEY) {
    try {
      const data = await promiseTimeout(
        sendWithResend({
          to: toEmail,
          subject: subj,
          html,
          text: `Your iTrueMatch verification code is ${code}`,
        }),
        12000,
        "Resend"
      );
      console.log(`[mail] Resend OTP sent to ${toEmail}`, data?.id ? `id=${data.id}` : "");
      return true;
    } catch (err) {
      console.error("[mail] Resend send failed:", err?.message || err);
      // fall through to SMTP fallback
    }
  }

  // Fallback: SMTP (keep this for local/dev, but protect with a short timeout)
  try {
    const mailer = await getMailer();
    if (!mailer) {
      console.error("[mail] No mailer configured (set RESEND_API_KEY or SMTP_* env vars).");
      return false;
    }

    const from = process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@itruematch.com";

    await promiseTimeout(
      mailer.sendMail({
        from,
        to: toEmail,
        subject: subj,
        html,
        text: `Your iTrueMatch verification code is ${code}`,
      }),
      12000,
      "SMTP sendMail"
    );

    console.log("[mail] OTP email sent via SMTP to:", toEmail);
    return true;
  } catch (err) {
    console.error("[mail] Email send failed:", err?.message || err);
    return false;
  }
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  try {
    const safeTo = String(toEmail || '').trim();
    if (!safeTo) return false;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111;">
        <h2 style="margin:0 0 12px 0;">Reset your TrueMatch password</h2>
        <p style="margin:0 0 10px 0;">Someone requested a password reset for this email.</p>
        <p style="margin:0 0 14px 0;">If this was you, click the button below. This link expires in <b>30 minutes</b>.</p>
        <p style="margin:0 0 16px 0;">
          <a href="${resetUrl}" style="display:inline-block; padding:10px 14px; background:#111; color:#fff; text-decoration:none; border-radius:8px;">
            Reset Password
          </a>
        </p>
        <p style="margin:0; font-size:12px; color:#555;">If you didn’t request this, you can ignore this email.</p>
      </div>
    `;

    const ok = await sendMail(safeTo, "TrueMatch • Password Reset", html);
    if (ok) console.log("[mail] Password reset email sent to:", safeTo);
    return ok;
  } catch (err) {
    console.error("[mail] Password reset email send failed:", err?.message || err);
    return false;
  }
}

// ---------------- SWIPE & MATCHING ENGINE ----------------

// 1. Get Candidates (Real Users)
// 1. Get Candidates (Global + Cap 20)
// [UPDATED] Get Candidates (Supports Firestore & Local)
// [UPDATED] Get Candidates with Daily Limit Check
// =======================================================================
// [PALITAN ANG BUONG "
// ---------------------------------------------------------------------
// PREMIUM SOCIETY SWIPE API
// Definition (authoritative):
// - Eligible: active Elite (tier2) or Concierge (tier3) plan.
// - Premium Society Member: eligible + premiumStatus === 'approved'.
// This API is intentionally separate from /api/swipe/* so other matchmaking flows can keep their own rules.
// ---------------------------------------------------------------------
function psTierNumFromPlanKey(planKey) {
  const k = normalizePlanKey(planKey || 'free');
  if (k === 'tier3') return 3;
  if (k === 'tier2') return 2;
  if (k === 'tier1') return 1;
  return 0;
}

function psIsEligibleForPremiumSociety(uPublic) {
  return Boolean(uPublic && uPublic.planActive === true && psTierNumFromPlanKey(uPublic.plan) >= 2);
}

function psIsPremiumSocietyMember(uPublic) {
  return psIsEligibleForPremiumSociety(uPublic) && String(uPublic.premiumStatus || '').toLowerCase() === 'approved';
}

// ---------------------------------------------------------------------
// Premium Society - Edit Profile (updates premiumApplication details)
// ---------------------------------------------------------------------
app.post('/api/me/premium/profile', async (req, res) => {
  try {
    const email = getSessionEmail(req);
    if (!email) return res.status(401).json({ ok: false, message: 'Not logged in' });

    const meDoc = hasFirebase ? await findUserByEmail(email) : (DB.users[email] || null);
    if (!meDoc) return res.status(404).json({ ok: false, message: 'User not found' });

    const mePublic = publicUser({ id: meDoc.id, ...meDoc });

    // Only approved Premium Society members can edit their Premium profile from this page.
    if (!psIsPremiumSocietyMember(mePublic)) {
      return res.status(403).json({ ok: false, message: 'Premium Society members only' });
    }

    const body = req.body || {};
    const input = body.premiumApplication || body.application || body || {};

    const prev = (meDoc.premiumApplication || {}) || {};
    const nowIso = new Date().toISOString();

    const toStr = (v) => (v == null ? '' : String(v)).trim();
    const toNumOrNull = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Preserve decision fields from admin
    const preservedStatus = prev.status;
    const preservedSubmittedAt = prev.submittedAt;
    const preservedDecidedAt = prev.decidedAt;

    const next = {
      ...prev,
      fullName: toStr(input.fullName || prev.fullName),
      occupation: toStr(input.occupation || prev.occupation),
      wealthStatus: toStr(input.wealthStatus || prev.wealthStatus),
      incomeRange: toStr(input.incomeRange || prev.incomeRange),
      netWorthRange: toStr(input.netWorthRange || prev.netWorthRange),
      incomeSource: toStr(input.incomeSource || prev.incomeSource),
      socialLink: toStr(input.socialLink || prev.socialLink),
      reason: toStr(input.reason || prev.reason),
      updatedAt: nowIso,
    };

    // Optional numeric field
    const age = input.age != null ? toNumOrNull(input.age) : (prev.age != null ? prev.age : null);
    if (age != null) next.age = age;

    if (preservedStatus != null) next.status = preservedStatus;
    if (preservedSubmittedAt != null) next.submittedAt = preservedSubmittedAt;
    if (preservedDecidedAt != null) next.decidedAt = preservedDecidedAt;

    if (hasFirebase) {
      await updateUserByEmail(email, { premiumApplication: next });

      // Keep in-memory cache fresh
      const fresh = await findUserByEmail(email);
      if (fresh) {
        const p = normalizePlanKey(fresh.plan ?? fresh.planKey ?? fresh.tier ?? fresh.level ?? 'free');
        const planEnd = fresh.planEnd ?? fresh.planExpiry ?? fresh.subscriptionEnd ?? null;
        const planActive = _computePlanActiveForDoc(p, planEnd, fresh.planActive);
        DB.users[email] = { ...fresh, plan: p, planActive };
      } else {
        DB.users[email] = { ...(DB.users[email] || {}), premiumApplication: next };
      }
    } else {
      DB.users[email] = { ...(DB.users[email] || {}), premiumApplication: next };
      saveUsersStore();
    }

    return res.json({ ok: true, premiumApplication: next });
  } catch (err) {
    console.error('[me premium profile] error:', err);
    return res.status(500).json({ ok: false, message: 'Server error updating premium profile' });
  }
});


app.get('/api/premium-society/candidates', authMiddleware, async (req, res) => {
  try {
    const myEmail = String(req.user && req.user.email ? req.user.email : '').trim().toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, message: 'Not authenticated' });

    // Source-of-truth user doc
    let meDoc = null;
    if (hasFirebase) {
      meDoc = await findUserByEmail(myEmail);
    } else {
      meDoc = (DB.users && DB.users[myEmail]) ? { ...DB.users[myEmail] } : (DB.user ? { ...DB.user } : null);
    }
    if (!meDoc) return res.status(404).json({ ok: false, message: 'User not found' });

    const mePublic = publicUser({ id: meDoc.id, ...meDoc });
    if (!psIsPremiumSocietyMember(mePublic)) {
      return res.status(403).json({
        ok: false,
        code: 'not_premium_society',
        message: 'Premium Society access requires an active Elite (Tier 2) or Concierge (Tier 3) plan AND an approved Premium Society application.'
      });
    }

    const mySwipes = await _ps_getSwipeMapFor(myEmail);
    const candidates = [];

    if (hasFirebase && usersCollection) {
      let snap = null;
      try {
        snap = await usersCollection.where('premiumStatus', '==', 'approved').limit(250).get();
      } catch (e) {
        // Fallback if query fails (e.g., missing index) — we still filter in-memory.
        snap = await usersCollection.limit(250).get();
      }

      snap.forEach(doc => {
        const raw = doc.data() || {};
        const pu = publicUser({ id: doc.id, ...raw });
        const email = String(pu.email || raw.email || '').trim().toLowerCase();
        if (!email || email === myEmail) return;
        if (mySwipes[email]) return;
        if (!psIsPremiumSocietyMember(pu)) return;

        candidates.push({
          id: email,
          email,
          fullName: pu.name,
          name: pu.name,
          age: pu.age,
          city: pu.location || pu.city || '',
          photoUrl: pu.avatarUrl || pu.photoUrl || pu.profilePhotoUrl || ''
        });
      });
    } else {
      const all = Object.values(DB.users || {});
      for (const raw of all) {
        const pu = publicUser(raw);
        const email = String(pu.email || raw.email || '').trim().toLowerCase();
        if (!email || email === myEmail) continue;
        if (mySwipes[email]) continue;
        if (!psIsPremiumSocietyMember(pu)) continue;

        candidates.push({
          id: email,
          email,
          fullName: pu.name,
          name: pu.name,
          age: pu.age,
          city: pu.location || pu.city || '',
          photoUrl: pu.avatarUrl || pu.photoUrl || pu.profilePhotoUrl || ''
        });
      }
    }

    const picked = pickOneCandidate(candidates);
    const list = picked ? [picked] : [];
    return res.json({ ok: true, candidates: list, remaining: null, limit: null, limitReached: false });
  } catch (err) {
    console.error('[premium-society] candidates error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.post('/api/premium-society/action', authMiddleware, async (req, res) => {
  try {
    const myEmail = String(req.user && req.user.email ? req.user.email : '').trim().toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, message: 'Not authenticated' });

    const targetEmail = String((req.body && req.body.targetEmail) || '').trim().toLowerCase();
    const action = String((req.body && req.body.action) || '').trim().toLowerCase();
    if (!targetEmail || !['like','pass','super','superlike'].includes(action)) {
      return res.status(400).json({ ok: false, message: 'Invalid swipe payload' });
    }

    // Verify actor is Premium Society member
    let meDoc = null;
    if (hasFirebase) {
      meDoc = await findUserByEmail(myEmail);
    } else {
      meDoc = (DB.users && DB.users[myEmail]) ? { ...DB.users[myEmail] } : (DB.user ? { ...DB.user } : null);
    }
    if (!meDoc) return res.status(404).json({ ok: false, message: 'User not found' });

    const mePublic = publicUser({ id: meDoc.id, ...meDoc });
    if (!psIsPremiumSocietyMember(mePublic)) {
      return res.status(403).json({
        ok: false,
        code: 'not_premium_society',
        message: 'Premium Society access requires an active Elite (Tier 2) or Concierge (Tier 3) plan AND an approved Premium Society application.'
      });
    }

    // Verify target is Premium Society member too
    let targetDoc = null;
    if (hasFirebase) {
      targetDoc = await findUserByEmail(targetEmail);
    } else {
      targetDoc = (DB.users && DB.users[targetEmail]) ? { ...DB.users[targetEmail] } : null;
    }
    if (!targetDoc) return res.status(404).json({ ok: false, message: 'Target user not found' });

    const targetPublic = publicUser({ id: targetDoc.id, ...targetDoc });
    if (!psIsPremiumSocietyMember(targetPublic)) {
      return res.status(400).json({ ok: false, code: 'target_not_premium_society', message: 'You can only swipe on Premium Society members.' });
    }

    const type = (action === 'super' || action === 'superlike') ? 'superlike' : (action === 'like' ? 'like' : 'pass');
    await _ps_saveSwipe(myEmail, targetEmail, type);

    let isMatch = false;
    let matchId = null;

    if (_isPositiveSwipe(type)) {
      const theirSwipes = await _ps_getSwipeMapFor(targetEmail);
      const theirType = (theirSwipes && theirSwipes[myEmail]) ? theirSwipes[myEmail].type : null;
      const isMutual = _isPositiveSwipe(type) && _isPositiveSwipe(theirType);
      if (isMutual) {
        isMatch = true;
        await _ps_saveMatch(myEmail, targetEmail, type, theirType);
        matchId = _matchDocId(myEmail, targetEmail);
      }
    }

    return res.json({ ok: true, isMatch, matchId, remaining: null, limit: null, limitReached: false });
  } catch (err) {
    console.error('[premium-society] action error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// ---------------------------------------------------------------------
// Premium Society - Matches (ONLY from Premium Society swipes)
// ---------------------------------------------------------------------
app.get('/api/premium-society/matches', authMiddleware, async (req, res) => {
  try {
    const myEmail = String(req.user && req.user.email ? req.user.email : '').trim().toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, message: 'Not authenticated' });

    // Verify actor is Premium Society member
    let meDoc = null;
    if (hasFirebase) meDoc = await findUserByEmail(myEmail);
    else meDoc = (DB.users && DB.users[myEmail]) ? { ...DB.users[myEmail] } : (DB.user ? { ...DB.user } : null);

    if (!meDoc) return res.status(404).json({ ok: false, message: 'User not found' });

    const mePublic = publicUser({ id: meDoc.id, ...meDoc });
    if (!psIsPremiumSocietyMember(mePublic)) {
      return res.status(403).json({ ok: false, code: 'not_premium_society', message: 'Premium Society members only' });
    }

    const pairs = await _ps_getMatchPairs(myEmail);
    pairs.sort((a, b) => {
      const at = Number(a.updatedAtMs || a.createdAtMs || 0);
      const bt = Number(b.updatedAtMs || b.createdAtMs || 0);
      return bt - at;
    });

    const matches = [];
    for (const p of pairs.slice(0, 200)) {
      const otherEmail = String(p.otherEmail || '').toLowerCase();
      if (!otherEmail) continue;

      let otherDoc = null;
      if (hasFirebase) otherDoc = await findUserByEmail(otherEmail);
      else otherDoc = (DB.users && DB.users[otherEmail]) ? { ...DB.users[otherEmail] } : null;

      if (!otherDoc) continue;

      const pu = publicUser({ id: otherDoc.id, ...otherDoc });
      // extra safety: keep Premium Society list clean
      if (!psIsPremiumSocietyMember(pu)) continue;

      matches.push({
        id: otherEmail,
        email: otherEmail,
        name: pu.name || pu.fullName || pu.displayName || pu.username || 'Member',
        username: pu.username || null,
        age: pu.age || null,
        city: pu.city || pu.location || null,
        photoUrl: pu.avatarUrl || pu.photoUrl || pu.avatar || 'assets/images/truematch-mark.png',
        createdAtMs: p.createdAtMs || null,
        updatedAtMs: p.updatedAtMs || null
      });
    }

    return res.json({ ok: true, matches });
  } catch (err) {
    console.error('Premium Society matches error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// =======================================================================
// =======================================================================
app.get('/api/swipe/candidates', async (req, res) => {
  try {
    const myEmail = String(((req.user && req.user.email) || (DB.user && DB.user.email) || '')).toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    // ✅ IMPORTANT: Use MAIN swipe map (not Premium Society swipe map)
    const mySwipes = await _getSwipeMapFor(myEmail);

    // NOTE: Only PASSED profiles are allowed to re-appear in the Swipe deck.
    // Likes / Super-likes are removed from the deck permanently (they should only show up if matched).

    // ✅ Use real user doc (not only DB.user)
    const userDoc = (DB.users && DB.users[myEmail]) || DB.user || {};
    const planKey = normalizePlanKey((req.user && req.user.plan) || userDoc.plan || 'free');
    const planActive = ((req.user && typeof req.user.planActive === 'boolean') ? req.user.planActive
                      : (typeof userDoc.planActive === 'boolean') ? userDoc.planActive
                      : true);

    const isPremium = (planKey !== 'free') && (planActive !== false);

    // ✅ Cap: free only; premium unlimited
    const cap = isPremium ? null : STRICT_DAILY_LIMIT;

    // ✅ Daily counter only if capped (free/inactive)
    let limitReached = false;
    let remaining = null;
    let limit = null;

    if (cap !== null) {
      const today = new Date().toISOString().slice(0, 10);
      let rec = SERVER_SWIPE_COUNTS[myEmail];
      if (!rec || typeof rec !== 'object' || !('count' in rec) || !('date' in rec)) rec = { date: today, count: 0 };
      if (rec.date !== today) rec = { date: today, count: 0 };
      SERVER_SWIPE_COUNTS[myEmail] = rec;

      const currentCount = rec.count || 0;
      remaining = Math.max(0, cap - currentCount);
      limit = cap;

      if (currentCount >= cap) {
        return res.json({ ok: true, candidates: [], limitReached: true, remaining: 0, limit: cap, message: 'Daily limit reached.' });
      }
    }

    // Helper: premium candidate (plan != free and active)
    const isPremiumCandidate = (u) => {
      const pk = normalizePlanKey((u && u.plan) || 'free');
      const act = (u && typeof u.planActive === 'boolean') ? u.planActive : true;
      return pk !== 'free' && act !== false;
    };

    // ✅ Load candidates
    let candidates = [];

    if (hasFirebase && usersCollection) {
      const snap = await usersCollection.limit(80).get();
      snap.forEach(doc => {
        const u = doc.data() || {};
        const candEmail = String(u.email || '').toLowerCase();
        if (!candEmail || candEmail === myEmail) return;

        // ✅ PASS-only re-serve rule (+ cooldown):
        // - like/superlike: never re-serve
        // - pass: may re-serve only after PASS_RESHOW_AFTER_HOURS
        const prev = mySwipes[candEmail];
        if (prev) {
          const t = String(prev.type || '').toLowerCase();
          if (t && t !== 'pass') return; // like/superlike removed from deck
          if (t === 'pass') {
            const minMs = PASS_RESHOW_AFTER_HOURS * 60 * 60 * 1000;
            const lastTs = Number(prev.ts) || 0;
            if (minMs > 0 && lastTs && (Date.now() - lastTs) < minMs) return;
          }
        }

        // ✅ Premium-to-premium only
        if (isPremium && !isPremiumCandidate(u)) return;

        candidates.push({
          id: candEmail,
          name: u.name || 'Member',
          age: u.age || 25,
          city: u.city || 'Global',
          photoUrl: u.avatarUrl || 'assets/images/truematch-mark.png'
        });
      });
    } else {
      const allUsers = Object.values(DB.users || {});
      candidates = allUsers
        .filter(u => {
          const e = String(u.email || '').toLowerCase();
          if (!e || e === myEmail) return false;

          // ✅ PASS-only re-serve rule (+ cooldown):
          // - like/superlike: never re-serve
          // - pass: may re-serve only after PASS_RESHOW_AFTER_HOURS
          const prev = mySwipes[e];
          if (prev) {
            const t = String(prev.type || '').toLowerCase();
            if (t && t !== 'pass') return false;
            if (t === 'pass') {
              const minMs = PASS_RESHOW_AFTER_HOURS * 60 * 60 * 1000;
              const lastTs = Number(prev.ts) || 0;
              if (minMs > 0 && lastTs && (Date.now() - lastTs) < minMs) return false;
            }
          }

          // ✅ Premium-to-premium only
          if (isPremium && !isPremiumCandidate(u)) return false;

          return true;
        })
        .map(u => ({
          id: String(u.email || '').toLowerCase(),
          name: u.name || 'Member',
          age: u.age || 25,
          city: u.city || 'Global',
          photoUrl: u.avatarUrl || 'assets/images/truematch-mark.png'
        }));
    }

    // ✅ If capped (free), slice candidates to remaining swipes
    if (cap !== null) {
      if (remaining <= 0) {
        candidates = [];
        limitReached = true;
      } else {
        candidates = candidates.slice(0, remaining);
      }
      return res.json({ ok: true, candidates, limitReached, remaining, limit });
    }

    // ✅ Premium unlimited
    return res.json({ ok: true, candidates, limitReached: false, remaining: null, limit: null });
  } catch (err) {
    console.error('Swipe candidate error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});


// 2. Swipe Action (Like/Pass)
// [UPDATED] Swipe Action (Saves Timestamp)
// =======================================================================
// [PALITAN ANG BUONG "app.post('/api/swipe/action'...)"]
// =======================================================================

app.post('/api/swipe/action', async (req, res) => {
  try {
    const myEmail = String(((req.user && req.user.email) || (DB.user && DB.user.email) || '')).toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, error: 'Not logged in' });

    const tId = String((req.body && req.body.targetEmail) || '').toLowerCase();
    const action = String((req.body && req.body.action) || '').toLowerCase();
    if (!tId || !['like', 'pass', 'super', 'superlike'].includes(action)) {
      return res.status(400).json({ ok: false, error: 'Invalid swipe payload' });
    }

    // Plan-gated daily swipe cap:
    // - free: 20/day (server-side enforced)
    // - tier1+: unlimited
    const userDoc = (DB.users && DB.users[myEmail]) || DB.user || {};
    const planKey = normalizePlanKey((req.user && req.user.plan) || userDoc.plan || 'free');
    const cap = (planKey === 'free') ? STRICT_DAILY_LIMIT : null;
    const planActive = (typeof userDoc.planActive === 'boolean') ? userDoc.planActive : true;
    const isPremium = (planKey !== 'free') && (planActive !== false);

  if (isPremium) {
  // prevent premium users from swiping on non-premium targets (extra safety)
  let other = null;
  if (hasFirebase) other = await findUserByEmail(tId);
  else other = (DB.users && DB.users[tId]) ? DB.users[tId] : null;

  const otherPlanKey = normalizePlanKey((other && other.plan) || 'free');
  const otherActive = (other && typeof other.planActive === 'boolean') ? other.planActive : true;

  if (otherPlanKey === 'free' || otherActive === false) {
    return res.status(400).json({ ok: false, error: 'target_not_premium' });
  }
}

    let remaining = null;
    let limitReached = false;

    if (cap !== null) {
      const today = new Date().toISOString().slice(0, 10);
      let rec = SERVER_SWIPE_COUNTS[myEmail];
      if (!rec || typeof rec !== 'object' || rec.date !== today) {
        rec = { date: today, count: 0 };
        SERVER_SWIPE_COUNTS[myEmail] = rec;
      }
      if (rec.count >= cap) {
        return res.json({ ok: true, remaining: 0, limit: cap, limitReached: true, isMatch: false });
      }
    }
const actionType = (action === 'super' || action === 'superlike') ? 'superlike' : (action === 'like' ? 'like' : 'pass');
    await _saveSwipe(myEmail, tId, actionType);

    if (cap !== null) {
      const rec = SERVER_SWIPE_COUNTS[myEmail];
      rec.count += 1;
      remaining = Math.max(0, cap - rec.count);
      limitReached = remaining <= 0;
    }
// If pass: no match check needed
    if (!_isPositiveSwipe(actionType)) {
      return res.json({ ok: true, remaining, limit: cap, limitReached, isMatch: false });
    }

    // Check reciprocal swipe and create match if mutual positive
    const otherType = await _getSwipeType(tId, myEmail);
    const isMutual = _isPositiveSwipe(actionType) && _isPositiveSwipe(otherType);

    if (isMutual) {
      await _saveMatch(myEmail, tId, actionType, otherType);
      return res.json({ ok: true, remaining, limit: cap, limitReached, isMatch: true, matchWithEmail: tId });
    }

    return res.json({ ok: true, remaining, limit: cap, limitReached, isMatch: false });
  } catch (err) {
    console.error('Swipe action error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});
// ---------------- Google Sign-In (GIS ID token) ----------------
app.post('/api/auth/oauth/google', async (req, res) => {
  try {
    const idToken = (req.body && req.body.idToken) || '';
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    if (!idToken || !clientId) {
      return res.status(400).json({ ok:false, message: 'missing_token_or_client_id' });
    }
    if (!OAuth2Client) {
      return res.status(500).json({ ok:false, message: 'google_library_missing' });
    }
    const oclient = new OAuth2Client(clientId);
    const ticket = await oclient.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload() || {};
    const email = String(payload.email || '').toLowerCase().trim();
    const name  = payload.name || email.split('@')[0] || 'Google User';
    const emailVerifiedClaim = !!payload.email_verified;

    if (!email) {
      return res.status(400).json({ ok:false, message:'no_email_in_token' });
    }

    // Find or create user
    const emailNorm = email;
    let userDoc = null;
    if (hasFirebase) {
      userDoc = await findUserByEmail(emailNorm);
      if (!userDoc) {
        userDoc = await createUserDoc({ email: emailNorm, name, emailVerified: false, provider: 'google' });
      }
    }

    // Build in-memory user
    DB.user = DB.user || {};
    DB.user.email = emailNorm;
    DB.user.name = name;
    DB.user.emailVerified = Boolean((userDoc && userDoc.emailVerified) || (DB.users[emailNorm] && DB.users[emailNorm].emailVerified) || false);

    // Cache user by email and set session cookie
    DB.users[emailNorm] = { ...DB.user };
    setSession(res, emailNorm);

    // Decide if OTP is needed (one-time verification)
    let needVerification = !DB.user.emailVerified;
    if (!needVerification && emailVerifiedClaim && !DB.user.emailVerified) {
      // If Google's email_verified claim is true, you could trust it; but we stick to your own OTP policy.
      needVerification = false;
    }

    if (needVerification) {
      // Auto-send OTP code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const bcrypt = require('bcryptjs');
      const codeHash = await bcrypt.hash(code, 10);
      const now = Date.now();
      const expiresAt = now + CODE_TTL_MS;

      DB.emailVerify[emailNorm] = { codeHash, expiresAt, lastSentAt: now, attempts: 0 };

      // mark user as not verified persistently
      if (hasFirebase && userDoc) {
        try { await updateUserByEmail(emailNorm, { emailVerified: false }); } catch {}
      }

      await sendVerificationEmail(emailNorm, code);

      return res.json({ ok:true, user: publicUser(userDoc || DB.user), needVerification: true });
    }

    return res.json({ ok:true, user: publicUser(userDoc || DB.user), needVerification: false });
  } catch (err) {
    console.error('oauth/google error:', err && (err.message || err));
    return res.status(500).json({ ok:false, message:'server_error' });
  }
});

app.post('/api/auth/send-verification-code', async (req, res) => {
  try{
    const email = String(req.body?.email || getSessionEmail(req) || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ ok:false, message:'email required' });
    // Avoid account enumeration + avoid spamming unknown addresses:
    // Only send if the email belongs to an existing user (or an in-memory/demo user).
    let emailHasAccount = false;
    if (hasFirebase) {
      try { emailHasAccount = !!(await findUserByEmail(email)); } catch { emailHasAccount = false; }
    } else {
      emailHasAccount = !!DB.users[email];
    }
    if (!emailHasAccount) {
      // Always respond OK (do not leak whether the account exists).
      return res.json({ ok: true, message: 'if_account_exists_code_sent' });
    }


    // rate limit
    const info = DB.emailVerify[email] || {};
    const now = Date.now();
    if (info.lastSentAt && (now - info.lastSentAt) < RESEND_GAP_MS){
      const secs = Math.ceil((RESEND_GAP_MS - (now - info.lastSentAt))/1000);
      return res.status(429).json({ ok:false, message:`Please wait ${secs}s before requesting again.` });
    }

    // generate and store hashed code
    const code = generateCode();
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(code, 8);
    DB.emailVerify[email] = {
      codeHash: hash,
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      lastSentAt: now
    };

    const ok = await sendVerificationEmail(email, code);
    if (!ok){
      return res.status(500).json({ ok:false, message:'failed_to_send_email' });
    }

    // Persist a flag in Firestore that user exists + not verified yet
    if (hasFirebase){
      try{
        const doc = await findUserByEmail(email);
        if (doc){
          await updateUserByEmail(email, { emailVerified: false });
        } else {
          // Do NOT create placeholder user docs here (prevents ghost accounts + avoids abusing verification emails).
        }
      }catch(err){ console.warn('verify email: firestorm persist warn', err?.message||err); }
    }

    return res.json({ ok:true, message:'code_sent' });
  }catch(err){
    console.error(err);
    return res.status(500).json({ ok:false, message:'server_error' });
  }
});

app.post('/api/auth/verify-email-code', async (req, res) => {
  try{
    const email = String(req.body?.email || getSessionEmail(req) || '').toLowerCase().trim();
    const code  = String(req.body?.code || '').trim();
    if (!email || !code) return res.status(400).json({ ok:false, message:'email and code required' });

    const info = DB.emailVerify[email];
    if (!info) return res.status(400).json({ ok:false, message:'code_not_requested' });

    const now = Date.now();
    if (info.expiresAt && now > info.expiresAt){
      return res.status(400).json({ ok:false, message:'code_expired' });
    }
    // brute-force protection
    const MAX_OTP_ATTEMPTS = 5;
    const LOCK_MS = 10 * 60 * 1000; // 10 minutes
    if (info.lockedUntil && now < info.lockedUntil) {
      return res.status(429).json({ ok: false, message: 'too_many_attempts' });
    }
    if ((info.attempts || 0) >= MAX_OTP_ATTEMPTS) {
      info.lockedUntil = now + LOCK_MS;
      return res.status(429).json({ ok: false, message: 'too_many_attempts' });
    }


    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(code, info.codeHash || '');
    if (!match){
      info.attempts = (info.attempts||0)+1;
      if (info.attempts >= MAX_OTP_ATTEMPTS) info.lockedUntil = now + LOCK_MS;
      return res.status(400).json({ ok:false, message:'invalid_code', attempts: info.attempts });
    }

    delete DB.emailVerify[email];

    // mark verified
    DB.user = DB.user || {};
    if (DB.user && (DB.user.email || '').toLowerCase() === email){
      DB.user.emailVerified = true;
    }
    // also persist
// keep per-email cache in sync (prevents redirect loops on next page)
if (email) {
  if (DB.users[email]) {
    DB.users[email].emailVerified = true;
  } else {
    // minimal seed so subsequent middleware hydration keeps verified=true
    DB.users[email] = { ...(DB.user || {}), email, emailVerified: true };
  }
}

    if (hasFirebase){
      try{ await updateUserByEmail(email, { emailVerified: true }); }catch{}
    }
    // clear code
    delete DB.emailVerify[email];

    return res.json({ ok:true, message:'email_verified' });
  }catch(err){
    console.error(err);
    return res.status(500).json({ ok:false, message:'server_error' });
  }
});



// =============== NEW HELPERS + IMAGE/AVATAR ENDPOINTS (non-breaking) ===============

// Simple remote image streamer to avoid CORS issues on the client.
async function _streamRemoteImage(res, url) {
  try {
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) {
      res.status(r.status).end();
      return;
    }
    const ct = r.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (err) {
    console.error('proxy image error:', err.message || err);
    res.status(500).end();
  }
}

// Proxy any remote image (use with care; we still restrict to http/https)
app.get('/api/proxy-image', async (req, res) => {
  const raw = (req.query && req.query.url) ? String(req.query.url) : '';
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) {
      return res.status(400).json({ ok:false, message:'invalid_protocol' });
    }
    return _streamRemoteImage(res, url.toString());
  } catch {
    return res.status(400).json({ ok:false, message:'invalid_url' });
  }
});

// Instagram avatar helper using the public unavatar.io service as a lightweight fallback.
// This avoids scraping Instagram directly and keeps things simple for admin previews.
app.get('/api/ig/avatar/:username', async (req, res) => {
  const username = String(req.params.username || '').trim().replace(/^@/, '');
  if (!username) return res.status(400).json({ ok:false, message:'username_required' });

  const jsonUrl = `https://unavatar.io/instagram/${encodeURIComponent(username)}?json`;
  try {
    const jr = await fetch(jsonUrl);
    if (jr.ok) {
      const data = await jr.json();
      if (data && data.url) {
        return _streamRemoteImage(res, data.url);
      }
    }
  } catch {}
  const imgUrl = `https://unavatar.io/instagram/${encodeURIComponent(username)}`;
  return _streamRemoteImage(res, imgUrl);
});

// ---------------- Start server -------------------
app.listen(PORT, () => {
  console.log(`TrueMatch server running at ${APP_BASE_URL}`);
});