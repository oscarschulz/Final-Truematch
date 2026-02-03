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
    if (!origin || origin === 'null') return cb(null, true);

    const o = String(origin || '').trim().replace(/\/+$/, '');
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(o)) return cb(null, true);

    if (CORS_ALLOWLIST.includes(o)) return cb(null, true);

    return cb(null, false);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-admin-key'],
  methods: ['GET', 'POST', 'OPTIONS']
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
  try {
    const v = req.cookies && req.cookies.tm_email;
    if (!v) return false;
    const email = String(v).trim().toLowerCase();
    return email.includes('@') && email.length <= 320;
  } catch (e) {
    return false;
  }
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

  // Recent Moments (Stories)
  // Stored as an array of moment objects. When Firebase is enabled, moments are stored in Firestore
  // and media may be stored in Firebase Storage; otherwise we use local disk JSON persistence.
  moments: []
};
const SERVER_SWIPE_COUNTS = {}; 
const STRICT_DAILY_LIMIT = 20;
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
const DEMO_EMAIL = 'aries.aquino@gmail.com';
const DEMO_PASSWORD = 'aries2311';


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
const SESSION_COOKIE = 'tm_email';

function setSession(res, email) {
  res.cookie(SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

function getSessionEmail(req) {
  return ((req.cookies || {})[SESSION_COOKIE] || '').toString().trim().toLowerCase();
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
// This does NOT change existing session logic; it only reads the same tm_email cookie
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
// [INSERT 1] ADMIN MIDDLEWARE (Ilagay sa taas, bago ang routes)
// ============================================================
function requireAdmin(req, res, next) {
  // Siguraduhin na ang DB variable ay accessible. 
  // Kung iba ang variable name ng database mo, palitan ang 'DB'.
  const user = (typeof DB !== 'undefined' && DB.user) ? DB.user : null;
  
  if (user && user.isAdmin === true) {
    return next(); // Allowed
  }
  
  console.log('[AdminGuard] Blocked access attempt.');
  return res.status(403).json({ ok: false, message: 'Access denied: Admins only' });
}


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

function getProvidedAdminKey(req) {
  const headerKey = req.headers['x-admin-key'];
  const bodyKey = req.body && req.body.adminKey;
  const queryKey = req.query && req.query.adminKey;
  const cookieKey = req.cookies && req.cookies[ADMIN_COOKIE_NAME];
  return headerKey || bodyKey || queryKey || cookieKey || '';
}

function isValidAdminKey(key) {
  if (!key) return false;
  return String(key) === String(ADMIN_ACCESS_KEY);
}


// Small middleware helper: require a valid admin key (header/body/query/cookie)
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
  return t === 'like' || t === 'superlike';
}

// Lightweight in-memory caches (avoid hammering Firestore)
const _swipeCache = new Map(); // email -> { ts, map }
// Cache of a user's match emails to reduce reads.
// email -> { ts, emails: string[] }
const _matchEmailsCache = new Map();
const _CACHE_TTL_MS = 15 * 1000;

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
    
    city: doc.city || doc.location || '',
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

async function findUserByEmail(email) {
  if (!hasFirebase || !usersCollection) return null;
  const snap = await usersCollection.where('email', '==', email).limit(1).get();
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

async function createUserDoc(data) {
  if (!hasFirebase || !usersCollection) return null;

  const ref = await usersCollection.add({
    ...data,
    createdAt: admin
      ? admin.firestore.FieldValue.serverTimestamp()
      : new Date()
  });

  return { id: ref.id, ...data };
}

async function updateUserByEmail(email, fields) {
  if (!hasFirebase || !usersCollection) return null;

  const existing = await findUserByEmail(email);
  if (!existing) return null;

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

  const crypto = require('crypto');
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

    // ❗ Demo mode kung walang Firebase
    if (!hasFirebase) {
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

      // cache clean baseline user for middleware hydration
      DB.users[emailNorm] = { ...DB.user };

      return res.json({ ok: true, user: DB.user });
    }

    // Check kung existing na sa Firestore
    const existing = await findUserByEmail(emailNorm);
    if (existing) {
      return res.status(409).json({ ok: false, message: 'email already registered' });
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
      // hydrate clean per-user state (do NOT inherit previous DB.user)
      if (DB.users[emailNorm]) {
        DB.user = { ...DB.users[emailNorm] };
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

      // load per-email prefs (default null)
      DB.prefs = Object.prototype.hasOwnProperty.call(DB.prefsByEmail, emailNorm)
        ? DB.prefsByEmail[emailNorm]
        : null;
      if (emailNorm === DEMO_EMAIL && pass === DEMO_PASSWORD) {
        // SPECIAL DEMO ACCOUNT IN PURE IN-MEMORY MODE
        const now  = new Date();
        const rule = PLAN_RULES['tier3'];

        DB.user.name       = 'Aries Aquino (Demo)';
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

      DB.users[emailNorm] = { ...DB.user };
      DB.prefsByEmail[emailNorm] = DB.prefs;
      setSession(res, emailNorm);

      return res.json({ ok: true, user: DB.user, demo: emailNorm === DEMO_EMAIL });
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
    if (!userDoc && emailNorm === DEMO_EMAIL && pass === DEMO_PASSWORD) {
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
app.get('/api/me', (req, res) => {
  try {
    const email = getSessionEmail(req);
    if (!email) {
      return res.json({ ok: false, user: null, demo: false });
    }

    // Prefer per-email cache, then fallback to global DB.user if same email
    let user = DB.users[email] || null;
    if (!user && DB.user && DB.user.email === email) {
      user = { ...DB.user };
    }

    if (!user) {
      return res.json({ ok: false, user: null, demo: false });
    }

    // Attach prefs from cache (populated at login and when saving preferences)
    const prefs = DB.prefsByEmail[email] || DB.prefs || null;
    const prefsSaved = Boolean(prefs || user.prefsSaved);

    // Keep central DB pointers in sync
    DB.user = { ...user, prefsSaved };
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
      demo: email === DEMO_EMAIL || Boolean(TEST_BYPASS_ACCOUNTS[email])
    });
  } catch (err) {
    console.error('error in /api/me:', err);
    return res.status(500).json({ ok: false, user: null, message: 'internal error' });
  }
});

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
// [UPDATED] Update Profile (Handles EVERYTHING: Info, Avatar, Password, Age, City)
app.post('/api/me/profile', async (req, res) => {
  try {
    if (!DB.user || !DB.user.email) {
      return res.status(401).json({ ok: false, message: 'not logged in' });
    }

    // 1. Kunin LAHAT ng data galing sa request
    let { name, email, password, avatarDataUrl, avatarUrl, age, city, requireProfileCompletion } = req.body || {};

    // Basic sanitization
    name = (name || '').toString().trim();
    email = (email || '').toString().trim().toLowerCase();
    city = (city || '').toString().trim();
    age = age ? Number(age) : null;
    avatarDataUrl = (avatarDataUrl || '').toString();
    avatarUrl = (avatarUrl || '').toString();
    requireProfileCompletion = !!requireProfileCompletion;

    // Validate Email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, message: 'invalid email' });
    }

    const oldEmail = DB.user.email;

    // 2. Build Update Fields (Kung ano lang ang binigay, yun lang ang ia-update)
    const fields = {};
    if (name) fields.name = name;
    if (email) fields.email = email;
    if (age) fields.age = age;
    if (city) fields.city = city;
    // Avatar upload: prefer Firebase Storage
    let newAvatarUrl = '';
    let newAvatarPath = '';

    // Fetch existing user doc (for existing avatar path/url) when Firebase is ON
    let existingDoc = null;
    if (hasFirebase && usersCollection) {
      try {
        existingDoc = await findUserByEmail(oldEmail);
      } catch {}
    }

    const existingAvatarUrl =
      (existingDoc && existingDoc.avatarUrl) ||
      (DB.user && DB.user.avatarUrl) ||
      '';

    const existingAvatarPath =
      (existingDoc && existingDoc.avatarPath) ||
      (DB.user && DB.user.avatarPath) ||
      '';

    // Onboarding validation (required fields)
    if (requireProfileCompletion) {
      if (!age || !Number.isFinite(age) || age < 18 || age > 80) {
        return res.status(400).json({ ok: false, message: 'invalid age' });
      }
      if (!city || city.trim().length < 2) {
        return res.status(400).json({ ok: false, message: 'invalid city' });
      }
      const hasAvatarAlready = !!existingAvatarUrl;
      const hasNewAvatar = !!avatarDataUrl;
      if (!hasAvatarAlready && !hasNewAvatar) {
        return res.status(400).json({ ok: false, message: 'profile picture required' });
      }
    }

    if (avatarDataUrl) {
      // Validate avatar data URL format early (must be base64 image)
      const av = String(avatarDataUrl || '');
      const m = av.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!m) {
        return res.status(400).json({ ok: false, message: 'invalid avatar data' });
      }

      // Inline fallback (Firestore-safe) — keeps onboarding flow working even if Storage is not enabled.
      // Firestore doc max is ~1MB; keep avatar payload comfortably below that.
      const inlineMaxBytes = 450 * 1024; // ~450KB decoded (Firestore-safe)
      let inlineBufSize = 0;
      try {
        inlineBufSize = Buffer.from(m[2], 'base64').length;
      } catch {
        return res.status(400).json({ ok: false, message: 'invalid avatar data' });
      }

      const canInline = inlineBufSize > 0 && inlineBufSize <= inlineMaxBytes;
      const canUseStorage = !!(hasFirebase && hasStorage && storageBucket);

      const setInlineAvatar = () => {
        if (!canInline) {
          return res.status(413).json({
            ok: false,
            message: 'Profile picture too large. Please choose a smaller image.'
          });
        }
        fields.avatarUrl = av;
        // Clear any old storage path so we don't keep stale references
        fields.avatarPath = '';
        fields.avatarUpdatedAt = new Date().toISOString();
        return null;
      };

      if (canUseStorage) {
        // Firebase mode: prefer Firebase Storage
        try {
          const up = await uploadAvatarDataUrlToStorage(
            (email || oldEmail),
            av,
            existingAvatarPath
          );
          newAvatarUrl = up.url;
          newAvatarPath = up.path;
          fields.avatarUrl = newAvatarUrl;
          fields.avatarPath = newAvatarPath;
          fields.avatarUpdatedAt = new Date().toISOString();
        } catch (e) {
          // Fallback to inline data URL so the user can complete onboarding.
          console.warn('[Avatar] Storage upload failed; falling back to inline avatarUrl. Reason:', e && e.message ? e.message : e);
          const resp = setInlineAvatar();
          if (resp) return resp;
        }
      } else {
        // No Storage configured (or running in demo) — store data URL directly
        if (hasFirebase && !canUseStorage) {
          console.warn('[Avatar] Firebase is ON but Storage is not configured. Using inline avatarUrl fallback.');
        }
        const resp = setInlineAvatar();
        if (resp) return resp;
      }

    } else if (avatarUrl) {
      // Accept direct avatarUrl updates (optional)
      fields.avatarUrl = avatarUrl;
    }
    // (store download URL in Firestore)
    // If avatarDataUrl is provided, we upload it; otherwise we keep existing avatarUrl.
    // Note: For onboarding completion, avatar must exist (new upload or existing).


    // Handle Password Update (Only if provided)
    if (password && password.trim().length > 0) {
      const hash = await bcrypt.hash(password, 10);
      fields.passwordHash = hash;
    }

    // 3. Update Database (Firestore & Memory)
    if (hasFirebase && usersCollection) {
      const existing = await findUserByEmail(oldEmail);
      if (!existing) return res.status(404).json({ ok: false, message: 'user not found' });

      // Update Firestore
      await usersCollection.doc(existing.id).update(fields);

      // Refresh Memory Data
      const updatedData = { ...existing, ...fields };
      
      // Kung nagbago ang email, ayusin ang mapping
      if (email && email !== oldEmail) {
        // Ilipat ang data sa bagong email key
        DB.users[email] = { ...updatedData, id: existing.id };
        DB.prefsByEmail[email] = DB.prefsByEmail[oldEmail];
        
        // Burahin ang luma
        delete DB.users[oldEmail];
        delete DB.prefsByEmail[oldEmail];
      } else {
        // Update lang yung existing key
        DB.users[oldEmail] = { ...updatedData, id: existing.id };
      }
      
      // Update Current Session User
      DB.user = publicUser({ id: existing.id, ...updatedData });

    } else {
      // LOCAL DEMO MODE UPDATE
      Object.assign(DB.user, fields); // Update session user
      
      // Update Global Store
      if (DB.users[oldEmail]) {
        Object.assign(DB.users[oldEmail], fields);
        
        // Handle Email Change in Local Mode
        if (email && email !== oldEmail) {
          DB.users[email] = DB.users[oldEmail];
          DB.users[email].email = email;
          delete DB.users[oldEmail];
        }
      }
      saveUsersStore(); // Save to _users_store.json immediately
    }

    console.log(`[Profile] Updated details for ${email || oldEmail}`);
    return res.json({ ok: true, user: DB.user });

  } catch (err) {
    console.error('update profile error:', err);
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

    let ok = false;

    if (
      userInput === ADMIN_LOGIN_USERNAME &&
      pass === ADMIN_LOGIN_PASSWORD
    ) {
      ok = true;
    }

    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, message: 'invalid_admin_credentials' });
    }

    // Set httpOnly cookie so admin pages + API can work without exposing the key in URLs
    res.cookie(ADMIN_COOKIE_NAME, ADMIN_ACCESS_KEY, ADMIN_COOKIE_OPTS);

    // Keep returning the key too (backward compatible with older admin JS)
    return res.json({ ok: true, adminKey: ADMIN_ACCESS_KEY });
  } catch (err) {
    console.error('admin login error:', err);
    return res.status(500).json({ ok: false, message: 'server error' });
  }
});

// Simple “who am I” check for admin
app.get('/api/admin/me', (req, res) => {
  try {
    const providedKey = getProvidedAdminKey(req);
    if (!isValidAdminKey(providedKey)) {
      return res
        .status(401)
        .json({ ok: false, message: 'admin_unauthorized' });
    }
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

app.get('/api/admin/state', async (req, res) => {
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
app.post('/api/plan/choose', async (req, res) => {
  try {
    const { plan } = req.body || {};

    if (!plan || !['tier1', 'tier2', 'tier3'].includes(plan)) {
      return res.status(400).json({ ok: false, message: 'invalid plan' });
    }

    const rule = PLAN_RULES[plan];
    const now = new Date();
    const planStart = now.toISOString();
    const planEnd = new Date(now.getTime() + rule.durationDays * DAY_MS).toISOString();

    if (!DB.user) DB.user = {};
    DB.user.plan = String(plan);
    DB.user.planStart = planStart;
    DB.user.planEnd = planEnd;
    DB.user.planActive = true;

    if (hasFirebase && DB.user.email) {
      try {
        await updateUserByEmail(DB.user.email, {
          plan: DB.user.plan,
          planStart,
          planEnd,
          planActive: true
        });
      } catch (err) {
        console.error('error saving plan to Firestore:', err);
      }
    }

    return res.json({ ok: true, user: DB.user });
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

const crypto = require('crypto');

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
      // Keep old behavior: approving Premium Society ALSO activates tier3 (Concierge) if possible.
      // If activation fails for any reason, we still persist the premium fields so it never "doesn't save".
      if (dec === 'approved') {
        const activated = await activatePlanForEmail(e, 'tier3', fields);
        if (!activated) {
          await updateUserByEmail(e, fields);
        }
      } else {
        await updateUserByEmail(e, fields);
      }

      // Pull fresh doc + refresh cache so /api/me shows the new status immediately
      const fresh = await findUserByEmail(e);
      if (fresh) {
        DB.users[e] = { ...publicUser({ id: fresh.id, ...fresh }) };
        if (DB.user && String(DB.user.email || '').toLowerCase() === e) {
          DB.user = { ...DB.users[e] };
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
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

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
// ---------------- SWIPE & MATCHING ENGINE ----------------

// 1. Get Candidates (Real Users)
// 1. Get Candidates (Global + Cap 20)
// [UPDATED] Get Candidates (Supports Firestore & Local)
// [UPDATED] Get Candidates with Daily Limit Check
// =======================================================================
// [PALITAN ANG BUONG "app.get('/api/swipe/candidates'...)"]
// =======================================================================
app.get('/api/swipe/candidates', async (req, res) => {
  try {
    const myEmail = String(((req.user && req.user.email) || (DB.user && DB.user.email) || '')).toLowerCase();
    if (!myEmail) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const mySwipes = await _getSwipeMapFor(myEmail);

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
        if (mySwipes[candEmail]) return;

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
          if (mySwipes[e]) return false;

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

    // ✅ Premium unlimited: remaining stays null, limit stays null
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
    if (!tId || !['like', 'pass', 'super'].includes(action)) {
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
const actionType = action === 'super' ? 'super' : (action === 'like' ? 'like' : 'pass');
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
    const email = (req.body?.email || getSessionEmail(req) || DB.user?.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ ok:false, message:'email required' });

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
        }else{
          await createUserDoc({ email, emailVerified:false });
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
    const email = (req.body?.email || getSessionEmail(req) || DB.user?.email || '').toLowerCase().trim();
    const code  = String(req.body?.code || '').trim();
    if (!email || !code) return res.status(400).json({ ok:false, message:'email and code required' });

    const info = DB.emailVerify[email];
    if (!info) return res.status(400).json({ ok:false, message:'code_not_requested' });

    const now = Date.now();
    if (info.expiresAt && now > info.expiresAt){
      return res.status(400).json({ ok:false, message:'code_expired' });
    }

    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(code, info.codeHash || '');
    info.attempts = (info.attempts||0)+1;
    if (!match){
      return res.status(400).json({ ok:false, message:'invalid_code', attempts: info.attempts });
    }

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