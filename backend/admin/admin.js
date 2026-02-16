/* admin.js - Unified Admin Logic */

// Base API helpers (can also import from tm-api.js if preferred)
const API_BASE = (window.API_BASE || '').replace(/\/$/, '');
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };

    const opts = { method, headers, credentials: 'include' };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + endpoint, opts);

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const data = ct.includes('application/json') ? await res.json() : { ok: res.ok, message: await res.text() };

    if (data && typeof data === 'object') {
      data.ok = res.ok;
      data.status = res.status;
    }

    if (!res.ok && (data && typeof data === 'object')) data.ok = false;
    return data;
  } catch (err) {
    console.error(err);
    return { ok: false, message: 'Network error' };
  }
}


function setTextIfExists(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}




// Basic escaping helpers (defensive; prevents accidental HTML injection)
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}
function escapeAttr(str) {
  // Safe for double-quoted HTML attributes
  return String(str || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// Lightweight modal (no extra HTML/CSS required)
let __ADMIN_MODAL = null;
function ensureAdminModal() {
  if (__ADMIN_MODAL) return __ADMIN_MODAL;

  const overlay = document.createElement('div');
  overlay.id = 'tm-admin-modal';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.58)';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';
  overlay.style.padding = '16px';

  const card = document.createElement('div');
  card.style.width = 'min(760px, 100%)';
  card.style.maxHeight = 'min(84vh, 900px)';
  card.style.overflow = 'auto';
  card.style.background = '#0b1020';
  card.style.border = '1px solid rgba(255,255,255,.10)';
  card.style.borderRadius = '14px';
  card.style.boxShadow = '0 20px 80px rgba(0,0,0,.55)';
  card.style.padding = '14px';

  card.innerHTML = `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:10px;">
      <div>
        <div id="tm-admin-modal-title" style="font-weight:700; color:#fff; font-size:16px; line-height:1.25;"></div>
        <div id="tm-admin-modal-sub" class="tiny muted" style="margin-top:4px;"></div>
      </div>
      <button id="tm-admin-modal-close" class="btn btn--sm btn--ghost" type="button">Close</button>
    </div>
    <div id="tm-admin-modal-body"></div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Close on overlay click (outside card)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideAdminModal();
  });
  card.querySelector('#tm-admin-modal-close')?.addEventListener('click', hideAdminModal);

  __ADMIN_MODAL = overlay;
  return __ADMIN_MODAL;
}

function showAdminModal({ title = '', sub = '', bodyHtml = '' } = {}) {
  const overlay = ensureAdminModal();
  const titleEl = overlay.querySelector('#tm-admin-modal-title');
  const subEl = overlay.querySelector('#tm-admin-modal-sub');
  const bodyEl = overlay.querySelector('#tm-admin-modal-body');

  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = sub;
  if (bodyEl) bodyEl.innerHTML = bodyHtml;

  overlay.style.display = 'flex';
}

function hideAdminModal() {
  if (!__ADMIN_MODAL) return;
  __ADMIN_MODAL.style.display = 'none';
  const bodyEl = __ADMIN_MODAL.querySelector('#tm-admin-modal-body');
  if (bodyEl) bodyEl.innerHTML = '';
}

/* =========================================
   1. NAVIGATION TABS
   ========================================= */
const tabs = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.admin-panel');

function switchTab(tabId) {
  // Update buttons
  tabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  // Update panels
  panels.forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== `panel-${tabId}`);
  });

  // Lazy load data based on tab
  if (tabId === 'users') loadUsers();
  if (tabId === 'matchmaking') loadMatchmakingSubscribers();
  if (tabId === 'creators') loadPendingCreators();
  if (tabId === 'premium') loadPremiumApplicants();
  if (tabId === 'overview') loadOverviewStats();
}

tabs.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* =========================================
   2. OVERVIEW STATS
   ========================================= */
async function loadOverviewStats() {
  // Server-side stats per tier (active + total)
  const statsRes = await apiCall('/api/admin/tier-stats');

  const tiers = (statsRes && statsRes.tiers) ? statsRes.tiers : {};
  const totalUsers =
    Number(statsRes?.totalUsers) ||
    Object.values(tiers).reduce((s, t) => s + (Number(t?.total) || 0), 0);

  setTextIfExists('stat-users-count', totalUsers);

  // Optional per-tier elements (only updates if these IDs exist in your HTML)
  ['free', 'tier1', 'tier2', 'tier3'].forEach((k) => {
    const t = tiers[k] || {};
    setTextIfExists(`stat-${k}-total`, Number(t.total) || 0);
    setTextIfExists(`stat-${k}-active`, Number(t.active) || 0);
  });

  // Pending Creator applications
  const creatorRes = await apiCall('/api/admin/creators/pending');
  const pendingCount =
    Number(creatorRes?.count) ||
    (Array.isArray(creatorRes?.applicants) ? creatorRes.applicants.length : 0);

  setTextIfExists('stat-creators-pending', pendingCount);
  // Pending Premium Society requests
  const premiumRes = await apiCall('/api/admin/premium/pending');
  const pendingPremium =
    Number(premiumRes?.count) ||
    (Array.isArray(premiumRes?.applicants) ? premiumRes.applicants.length : 0);

  setTextIfExists('stat-premium-pending', pendingPremium);


  // Confirmed dates: no aggregate endpoint yet (placeholder)
  setTextIfExists('stat-dates-active', '—');
}

/* =========================================
   3. USER MANAGEMENT
   ========================================= */
const usersBody = document.getElementById('users-table-body');
const btnRefreshUsers = document.getElementById('btn-refresh-users');

const usersPlanFilter = document.getElementById('users-filter-plan');
const usersStatusFilter = document.getElementById('users-filter-status');
const usersSearchFilter = document.getElementById('users-filter-search');
const usersFilterMeta = document.getElementById('users-filter-meta');
const btnClearUserFilters = document.getElementById('btn-clear-user-filters');

let USERS_CACHE_ALL = [];
let USERS_CACHE_LAST = 0;
let USERS_FETCH_INFLIGHT = null;

function debounce(fn, wait = 220) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function extractUsersPayload(data) {
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.users)) return data.users;
  if (data.users && typeof data.users === 'object') return Object.values(data.users);
  if (Array.isArray(data.applicants)) return data.applicants;
  return [];
}

function safeLower(v) {
  return String(v || '').trim().toLowerCase();
}

function parseDateMaybe(v) {
  try {
    if (v == null) return null;
    // Firestore Timestamp-like { seconds, nanoseconds }
    if (typeof v === 'object' && typeof v.seconds === 'number') {
      return new Date(v.seconds * 1000);
    }
    // millis epoch
    if (typeof v === 'number') return new Date(v);
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function normalizeUser(u) {
  const email = (u && (u.email || u.userEmail || u.mail)) ? String(u.email || u.userEmail || u.mail).trim() : '';
  const id = (u && (u.id || u.uid || u.userId || u._id)) ? String(u.id || u.uid || u.userId || u._id).trim() : '';
  const planRaw =
    (u && (u.plan || u.tier || u.subscriptionTier || u.planName)) ? (u.plan || u.tier || u.subscriptionTier || u.planName) : 'free';
  const plan = safeLower(planRaw) || 'free';

  const emailVerified = Boolean(
    u && (u.emailVerified ?? u.verified ?? u.isVerified ?? u.isEmailVerified)
  );

  const planActiveRaw = (u && (u.planActive ?? u.active ?? u.isActive ?? u.subscriptionActive));
  const planActive = (typeof planActiveRaw === 'boolean') ? planActiveRaw : null;

  const planEnd =
    (u && (u.planEnd || u.planEndAt || u.plan_end || u.planExpiry || u.planExpiresAt || u.planExpireAt)) || null;

  const endDate = parseDateMaybe(planEnd);

  let subActive = null;

  if (plan === 'free') {
    subActive = false;
  } else if (typeof planActive === 'boolean') {
    subActive = planActive;
  } else if (endDate) {
    subActive = endDate.getTime() > Date.now();
  }

  return {
    ...u,
    email,
    id,
    plan,
    emailVerified,
    planActive,
    planEnd: planEnd,
    subActive
  };
}

async function fetchUsersAll() {
  // Prevent duplicate in-flight requests
  if (USERS_FETCH_INFLIGHT) return USERS_FETCH_INFLIGHT;

  USERS_FETCH_INFLIGHT = (async () => {
    // 1) Try "all" style
    const firstTry = await apiCall('/api/admin/users?tier=all&include_inactive=1');
    let items = extractUsersPayload(firstTry).map(normalizeUser);

    // Heuristic: if server coerces invalid tier to tier1, we may only get one plan.
    const plans1 = new Set(items.map(x => x.plan).filter(Boolean));
    const coercedTier = safeLower(firstTry && firstTry.tier);

    const looksLikeOnlyOneTier =
      (coercedTier && coercedTier !== 'all' && plans1.size === 1);

    if (!items.length || looksLikeOnlyOneTier) {
      // 2) Try legacy/all endpoint without query
      const legacy = await apiCall('/api/admin/users');
      const legacyItems = extractUsersPayload(legacy).map(normalizeUser);
      const legacyPlans = new Set(legacyItems.map(x => x.plan).filter(Boolean));

      // If legacy returns a mixed plan list, prefer it
      if (legacyItems.length && legacyPlans.size > 1) {
        items = legacyItems;
      } else if (!legacyItems.length && looksLikeOnlyOneTier) {
        // 3) Fallback: merge per tier (active users per tier)
        const tiersToTry = ['free', 'tier1', 'tier2', 'tier3'];
        const merged = [];
        for (const t of tiersToTry) {
          const r = await apiCall(`/api/admin/users?tier=${encodeURIComponent(t)}`);
          // If server returns "tier" and it doesn't match what we asked, skip (prevents duplicates)
          const effective = safeLower(r && r.tier);
          if (effective && effective !== safeLower(t)) continue;

          const xs = extractUsersPayload(r).map(normalizeUser);
          merged.push(...xs);
        }

        // De-dupe by email (preferred) then id
        const seen = new Map();
        for (const u of merged) {
          const key = safeLower(u.email) || safeLower(u.id);
          if (!key) continue;
          if (!seen.has(key)) seen.set(key, u);
        }
        items = Array.from(seen.values());
      } else if (legacyItems.length) {
        items = legacyItems;
      }
    }

    // Final de-dupe
    const seen2 = new Map();
    for (const u of items) {
      const key = safeLower(u.email) || safeLower(u.id);
      if (!key) continue;
      if (!seen2.has(key)) seen2.set(key, u);
    }
    return Array.from(seen2.values());
  })();

  try {
    const users = await USERS_FETCH_INFLIGHT;
    return users;
  } finally {
    USERS_FETCH_INFLIGHT = null;
  }
}

function applyUserFilters(list) {
  let out = Array.isArray(list) ? [...list] : [];

  const planVal = usersPlanFilter ? safeLower(usersPlanFilter.value) : 'all';
  const statusVal = usersStatusFilter ? safeLower(usersStatusFilter.value) : 'all';
  const q = usersSearchFilter ? safeLower(usersSearchFilter.value) : '';

  if (planVal && planVal !== 'all') {
    out = out.filter(u => safeLower(u.plan) === planVal);
  }

  if (statusVal && statusVal !== 'all') {
    if (statusVal === 'verified') out = out.filter(u => u.emailVerified === true);
    if (statusVal === 'unverified') out = out.filter(u => u.emailVerified === false);
    if (statusVal === 'active') out = out.filter(u => u.subActive === true);
    if (statusVal === 'inactive') out = out.filter(u => u.subActive === false);
  }

  if (q) {
    out = out.filter(u => {
      const hay = `${safeLower(u.email)} ${safeLower(u.id)} ${safeLower(u.plan)}`;
      return hay.includes(q);
    });
  }

  // Stable sort: newest-like first if we have updatedAt/createdAt, else email
  out.sort((a, b) => {
    const da = parseDateMaybe(a.updatedAt || a.updated_at || a.createdAt || a.created_at);
    const db = parseDateMaybe(b.updatedAt || b.updated_at || b.createdAt || b.created_at);
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    if (ta !== tb) return tb - ta;
    return safeLower(a.email).localeCompare(safeLower(b.email));
  });

  return out;
}

function renderUsers() {
  const filtered = applyUserFilters(USERS_CACHE_ALL);

  // Meta line
  if (usersFilterMeta) {
    const total = USERS_CACHE_ALL.length;
    const shown = filtered.length;

    const planVal = usersPlanFilter ? safeLower(usersPlanFilter.value) : 'all';
    const statusVal = usersStatusFilter ? safeLower(usersStatusFilter.value) : 'all';

    const labelPlan = planVal === 'all' ? 'All plans' : planVal.toUpperCase();
    const labelStatus = statusVal === 'all' ? 'All statuses' : statusVal.replace('_', ' ');

    usersFilterMeta.textContent = `Showing ${shown} of ${total} users • ${labelPlan} • ${labelStatus}`;
  }

  if (!filtered.length) {
    usersBody.innerHTML = '<p class="muted p-4">No users matched your filters.</p>';
    return;
  }

  usersBody.innerHTML = '';
  filtered.forEach(u => {
    const row = document.createElement('div');
    row.className = 'row';

    const badgeVerified = u.emailVerified
      ? `<span class="badge badge--ok">Verified</span>`
      : `<span class="badge badge--bad">Unverified</span>`;

    const badgeSub =
      (u.plan && u.plan !== 'free')
        ? (u.subActive === true
          ? `<span class="badge badge--ok">Active</span>`
          : (u.subActive === false
            ? `<span class="badge badge--warn">Inactive</span>`
            : `<span class="badge">Unknown</span>`))
        : `<span class="badge">Free</span>`;

        const emailSafe = escapeHtml(u.email || '');
    const idSafe = escapeHtml(u.id || '');
    const planSafe = escapeHtml(u.plan || 'free');
    const emailAttr = escapeAttr(u.email || '');

    row.innerHTML = `
      <div>
        <strong style="display:block; color:#fff;">${emailSafe}</strong>
        <span class="tiny muted">${idSafe}</span>
      </div>

      <div>
        <span class="tiny" style="border:1px solid #444; padding:2px 6px; border-radius:4px;">
          ${planSafe}
        </span>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${badgeVerified}
        ${badgeSub}
      </div>

      <div style="text-align:right; display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
        <button class="btn btn--sm btn--ghost" type="button" data-action="state" data-email="${emailAttr}">View shortlist state</button>
      </div>
    `;
    usersBody.appendChild(row);
});
}

async function loadUsers(forceFetch = false) {
  usersBody.innerHTML = '<p class="muted p-4">Loading...</p>';

  // Restore persisted filter values (once)
  try {
    if (usersPlanFilter && !usersPlanFilter.dataset.hydrated) {
      const v = localStorage.getItem('tm_admin_filter_plan');
      if (v) usersPlanFilter.value = v;
      usersPlanFilter.dataset.hydrated = '1';
    }
    if (usersStatusFilter && !usersStatusFilter.dataset.hydrated) {
      const v = localStorage.getItem('tm_admin_filter_status');
      if (v) usersStatusFilter.value = v;
      usersStatusFilter.dataset.hydrated = '1';
    }
  } catch {}

  // Fetch once (or on refresh)
  if (forceFetch || !USERS_CACHE_ALL.length) {
    const users = await fetchUsersAll();
    USERS_CACHE_ALL = Array.isArray(users) ? users : [];
    USERS_CACHE_LAST = Date.now();
  }

  // Persist current filter values
  try {
    if (usersPlanFilter) localStorage.setItem('tm_admin_filter_plan', usersPlanFilter.value);
    if (usersStatusFilter) localStorage.setItem('tm_admin_filter_status', usersStatusFilter.value);
  } catch {}

  renderUsers();
}

// Events
if (btnRefreshUsers) btnRefreshUsers.addEventListener('click', () => loadUsers(true));
if (usersPlanFilter) usersPlanFilter.addEventListener('change', () => renderUsers());
if (usersStatusFilter) usersStatusFilter.addEventListener('change', () => renderUsers());
if (usersSearchFilter) usersSearchFilter.addEventListener('input', debounce(renderUsers, 220));

if (btnClearUserFilters) {
  btnClearUserFilters.addEventListener('click', () => {
    if (usersPlanFilter) usersPlanFilter.value = 'all';
    if (usersStatusFilter) usersStatusFilter.value = 'all';
    if (usersSearchFilter) usersSearchFilter.value = '';
    renderUsers();
  });
}



// Quick action: View shortlist state (per-user)
async function openUserShortlistState(email) {
  const emailNorm = String(email || '').trim();
  if (!emailNorm) return;

  showAdminModal({
    title: 'Shortlist state',
    sub: emailNorm,
    bodyHtml: '<p class="muted p-4">Loading…</p>'
  });

  const data = await apiCall(`/api/admin/state?email=${encodeURIComponent(emailNorm)}`);

  if (!data || data.ok === false) {
    const msg = (data && (data.message || data.error)) ? (data.message || data.error) : 'Unable to load state.';
    showAdminModal({
      title: 'Shortlist state',
      sub: emailNorm,
      bodyHtml: `<p class="muted p-4">Error: ${escapeHtml(String(msg))}</p>`
    });
    return;
  }

  const planRaw = String(data.plan || 'unknown').toLowerCase();
  const planLabel =
    planRaw === 'tier3' ? 'Concierge (Tier 3)' :
    planRaw === 'tier2' ? 'Elite (Tier 2)' :
    planRaw === 'tier1' ? 'Plus (Tier 1)' :
    planRaw === 'free'  ? 'Free' : planRaw;

  const dailyCap = (data.dailyCap ?? '—');
  const lastDate = data.shortlistLastDate || '—';
  const todayKey = data.today || '—';
  const totalShortlist = Number(data.totalShortlist ?? 0);
  const todayList = Array.isArray(data.todayShortlist) ? data.todayShortlist : [];
  const todayCount = todayList.length;

  const renderRow = (p, i) => {
    const name = escapeHtml(p?.name || p?.candidateName || p?.fullName || `#${i + 1}`);
    const city = escapeHtml(p?.city || p?.locationCity || '');
    const ageRange = escapeHtml(p?.ageRange || p?.age || '');
    const ig = escapeHtml(p?.igUrl || p?.ig || p?.instagram || '');
    const status = escapeHtml(p?.status || '');
    return `
      <div style="display:grid; grid-template-columns: 1.2fr 0.9fr 1fr 1.2fr 0.8fr; gap:10px; padding:10px 12px; border-top:1px solid rgba(255,255,255,.08); font-size:12px;">
        <div style="color:#fff; font-weight:600;">${name}</div>
        <div class="muted">${city || '—'}</div>
        <div class="muted">${ageRange || '—'}</div>
        <div class="muted" style="word-break:break-all;">${ig || '—'}</div>
        <div class="muted">${status || '—'}</div>
      </div>
    `;
  };

  const tableHtml = todayCount
    ? `
      <div style="border:1px solid rgba(255,255,255,.10); border-radius:12px; overflow:hidden;">
        <div style="display:grid; grid-template-columns: 1.2fr 0.9fr 1fr 1.2fr 0.8fr; gap:10px; padding:10px 12px; background:rgba(255,255,255,.04); font-size:12px;">
          <div>Name</div><div>City</div><div>Age</div><div>IG</div><div>Status</div>
        </div>
        ${todayList.map(renderRow).join('')}
      </div>
    `
    : `<p class="muted" style="padding:12px; border:1px solid rgba(255,255,255,.10); border-radius:12px;">No “today shortlist” recorded for this user (either not served today, or empty).</p>`;

  const bodyHtml = `
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;">
      <div style="flex:1; min-width:220px; border:1px solid rgba(255,255,255,.10); border-radius:12px; padding:12px;">
        <div class="tiny muted">Plan</div>
        <div style="color:#fff; font-weight:700; margin-top:4px;">${escapeHtml(planLabel)}</div>
      </div>
      <div style="flex:1; min-width:220px; border:1px solid rgba(255,255,255,.10); border-radius:12px; padding:12px;">
        <div class="tiny muted">Daily cap</div>
        <div style="color:#fff; font-weight:700; margin-top:4px;">${escapeHtml(dailyCap)}</div>
      </div>
      <div style="flex:1; min-width:220px; border:1px solid rgba(255,255,255,.10); border-radius:12px; padding:12px;">
        <div class="tiny muted">Today / Served date</div>
        <div style="color:#fff; font-weight:700; margin-top:4px;">${escapeHtml(todayKey)} / ${escapeHtml(lastDate)}</div>
      </div>
      <div style="flex:1; min-width:220px; border:1px solid rgba(255,255,255,.10); border-radius:12px; padding:12px;">
        <div class="tiny muted">Shortlist count</div>
        <div style="color:#fff; font-weight:700; margin-top:4px;">${todayCount} today • ${totalShortlist} total</div>
      </div>
    </div>

    <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; margin-bottom:12px;">
      <button class="btn btn--sm btn--ghost" type="button" id="tm-admin-copy-state">Copy JSON</button>
      <button class="btn btn--sm btn--primary" type="button" id="tm-admin-go-matchmaking">Go to Matchmaking</button>
    </div>

    ${tableHtml}

    <div class="tiny muted" style="margin-top:10px;">
      Note: “today shortlist” only appears when <code>shortlistLastDate</code> equals today.
    </div>
  `;

  showAdminModal({
    title: 'Shortlist state',
    sub: emailNorm,
    bodyHtml
  });

  // Wire modal actions
  const overlay = ensureAdminModal();
  overlay.querySelector('#tm-admin-copy-state')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      const subEl = overlay.querySelector('#tm-admin-modal-sub');
      if (subEl) subEl.textContent = `${emailNorm} • copied`;
      setTimeout(() => { if (subEl) subEl.textContent = emailNorm; }, 900);
    } catch {
      // fallback
      alert('Copy failed. Your browser may block clipboard access.');
    }
  }, { once: true });

  overlay.querySelector('#tm-admin-go-matchmaking')?.addEventListener('click', () => {
    // Auto-fill target email on Serve Shortlist form, then jump tabs
    const emailInput = document.getElementById('admin-email');
    if (emailInput) emailInput.value = emailNorm;
    hideAdminModal();
    try { switchTab('matchmaking'); } catch {}
  }, { once: true });
}

// Delegate clicks from the Users list
if (usersBody && !usersBody.dataset.actionsBound) {
  usersBody.dataset.actionsBound = '1';
  usersBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const email = btn.getAttribute('data-email') || '';
    if (action === 'state') openUserShortlistState(email);
  });
}


/* =========================================
   4. CREATOR APPLICATIONS
   ========================================= */
const creatorsBody = document.getElementById('creators-list-body');
document.getElementById('btn-refresh-creators')?.addEventListener('click', loadPendingCreators);
// Premium refresh button
document.getElementById('btn-refresh-premium')?.addEventListener('click', loadPremiumApplicants);

async function loadPendingCreators() {
  creatorsBody.innerHTML = '<p class="muted p-4">Checking...</p>';
  const data = await apiCall('/api/admin/creators/pending');

  if (!data.applicants || data.applicants.length === 0) {
    creatorsBody.innerHTML = '<p class="muted p-4">No pending applications.</p>';
    return;
  }

  creatorsBody.innerHTML = '';
  const applicants = Array.isArray(data.applicants) ? data.applicants : [];
  applicants.forEach(user => {
    const app = user.creatorApplication || {};
    const row = document.createElement('div');
    row.className = 'row';
    // Override grid columns for this specific table
    row.style.gridTemplateColumns = '1fr 1fr 2fr 100px'; 
    
    row.innerHTML = `
      <div>
        <strong style="color:#fff; display:block;">${app.handle}</strong>
        <span class="tiny muted">${user.email}</span>
      </div>
      <div class="tiny">
        <div>Price: $${app.price}</div>
        <div>Gender: ${app.gender}</div>
      </div>
      <div class="tiny muted" style="font-style:italic;">"${app.contentStyle}"</div>
      <div style="text-align:right; display:flex; flex-direction:column; gap:4px;">
        <button class="btn btn--sm btn--primary btn-decide" data-email="${user.email}" data-type="approve">Approve</button>
        <button class="btn btn--sm btn--ghost text-danger btn-decide" data-email="${user.email}" data-type="reject">Reject</button>
      </div>
    `;
    creatorsBody.appendChild(row);
  });

  // Bind buttons
  document.querySelectorAll('.btn-decide').forEach(btn => {
    btn.addEventListener('click', () => handleCreatorDecision(btn.dataset.email, btn.dataset.type));
  });
}

async function handleCreatorDecision(email, type) {
  if (!confirm(`Are you sure you want to ${type.toUpperCase()} ${email}?`)) return;
  
  const res = await apiCall(`/api/admin/creators/${type}`, 'POST', { email });
  if (res.ok) {
    alert(`Success: User ${type}d.`);
    loadPendingCreators(); // Refresh list
    loadOverviewStats();   // Refresh counts
  } else {
    alert(res.message || 'Action failed.');
  }
}

/* =========================================
   5. MATCHMAKING (Shortlist Serving)
   ========================================= */
const profilesInput = document.getElementById('profiles-input');
const emailInput = document.getElementById('admin-email');
const previewBox = document.getElementById('admin-list-body');

// Live Preview
profilesInput?.addEventListener('input', () => {
  try {
    const raw = profilesInput.value;
    const parsed = JSON.parse(raw);
    previewBox.innerHTML = Array.isArray(parsed) 
      ? `<p class="tiny text-accent">${parsed.length} profiles ready.</p>`
      : `<p class="tiny text-danger">Invalid JSON format (must be array).</p>`;
  } catch (e) {
    // If not JSON, assume raw text parsing (if supported) or error
    previewBox.innerHTML = `<p class="tiny muted">Typing...</p>`;
  }
});

// Load Default Mock
document.getElementById('btn-load').addEventListener('click', () => {
  const mock = [
    { name: "Mock 1", age: 24, city: "Makati", bio: "Test Bio", photoUrl: "https://i.pravatar.cc/300?u=1" },
    { name: "Mock 2", age: 28, city: "BGC", bio: "Test Bio 2", photoUrl: "https://i.pravatar.cc/300?u=2" }
  ];
  profilesInput.value = JSON.stringify(mock, null, 2);
  profilesInput.dispatchEvent(new Event('input'));
});

// Serve
document.getElementById('btn-serve').addEventListener('click', async () => {
  const email = emailInput.value.trim();
  let profiles = [];
  try { profiles = JSON.parse(profilesInput.value); } catch(e) { return alert('Invalid JSON profiles'); }

  if (!email || !profiles.length) return alert('Email and Profiles required');

  const res = await apiCall('/api/admin/shortlist', 'POST', { email, profiles });
  if (res.ok) {
    document.getElementById('admin-status').textContent = 'Shortlist Served Successfully!';
    document.getElementById('admin-status').style.color = '#7a9dff';
  } else {
    document.getElementById('admin-status').textContent = 'Error: ' + res.message;
    document.getElementById('admin-status').style.color = 'red';
  }
});



  // -------------------------------
  // Matchmaking: Elite/Concierge subscriber list
  // -------------------------------
  let MM_CACHE = [];
  let MM_FILTERED = [];

  const mmBody = document.getElementById('mm-users-body');
  const mmCounts = document.getElementById('mm-counts');
  const mmTierFilter = document.getElementById('mm-tier-filter');
  const mmStatusFilter = document.getElementById('mm-status-filter');
  const mmSearch = document.getElementById('mm-search');
  const mmRefresh = document.getElementById('mm-refresh');

  function mmPlanLabel(plan) {
    const p = String(plan || 'free').toLowerCase();
    if (p === 'tier3') return 'Concierge';
    if (p === 'tier2') return 'Elite';
    if (p === 'tier1') return 'Plus';
    return 'Free';
  }

  function mmEscape(str) {
    return String(str || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function mmUpdateCounts() {
    if (!mmCounts) return;
    const total = MM_CACHE.length;
    const active = MM_CACHE.filter(u => !!u.subActive).length;
    const inactive = total - active;
    mmCounts.textContent = `${total} total • ${active} active • ${inactive} inactive`;
  }

  function mmRenderRows() {
    if (!mmBody) return;

    if (!MM_FILTERED.length) {
      mmBody.innerHTML = `
        <div class="row">
          <div class="muted">No Elite/Concierge subscribers found.</div>
          <div></div>
          <div></div>
        </div>
      `;
      return;
    }

    mmBody.innerHTML = MM_FILTERED.map(u => {
      const email = mmEscape(u.email);
      const name = mmEscape(u.name);
      const planLabel = mmPlanLabel(u.plan);
      const planClass = (u.plan === 'tier3') ? 'badge--warn' : 'badge--ok';

      const statusText = u.subActive ? 'Active' : 'Inactive';
      const statusClass = u.subActive ? 'badge--ok' : 'badge--bad';

      const emailCell = name
        ? `<div><div class="cell-main">${email}</div><div class="cell-sub muted">${name}</div></div>`
        : `<div>${email}</div>`;

      return `
        <div class="row mm-row" data-email="${email}">
          ${emailCell}
          <div><span class="badge ${planClass}">${planLabel}</span></div>
          <div><span class="badge ${statusClass}">${statusText}</span></div>
        </div>
      `;
    }).join('');
  }

  function applyMatchmakingFilters() {
    if (!mmBody) return;

    const tierVal = mmTierFilter ? mmTierFilter.value : 'all';
    const statusVal = mmStatusFilter ? mmStatusFilter.value : 'all';
    const q = (mmSearch ? mmSearch.value : '').trim().toLowerCase();

    let list = MM_CACHE.slice();

    if (tierVal !== 'all') {
      list = list.filter(u => u.plan === tierVal);
    }
    if (statusVal !== 'all') {
      list = list.filter(u => statusVal === 'active' ? !!u.subActive : !u.subActive);
    }
    if (q) {
      list = list.filter(u =>
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.name || '').toLowerCase().includes(q)
      );
    }

    MM_FILTERED = list;
    mmRenderRows();
    mmUpdateCounts();
  }

  async function loadMatchmakingSubscribers(force = false) {
    if (!mmBody) return;

    if (!USERS_CACHE_ALL.length || force) {
      const users = await fetchUsersAll();
      USERS_CACHE_ALL = Array.isArray(users) ? users : [];
      USERS_CACHE_LAST = Date.now();
    }

    MM_CACHE = USERS_CACHE_ALL.filter(u => u.plan === 'tier2' || u.plan === 'tier3');
    applyMatchmakingFilters();
  }

  // Hook up UI events (only if the markup exists)
  if (mmBody) {
    if (mmTierFilter) mmTierFilter.addEventListener('change', applyMatchmakingFilters);
    if (mmStatusFilter) mmStatusFilter.addEventListener('change', applyMatchmakingFilters);

    if (mmSearch) {
      const mmSearchDebounced = debounce(applyMatchmakingFilters, 150);
      mmSearch.addEventListener('input', mmSearchDebounced);
    }

    if (mmRefresh) {
      mmRefresh.addEventListener('click', () => loadMatchmakingSubscribers(true));
    }

    // Row click -> auto fill email in the Serve Shortlist form
    mmBody.addEventListener('click', (e) => {
      const row = e.target.closest('.mm-row');
      if (!row) return;

      const email = row.getAttribute('data-email') || '';
      if (emailInput) {
        emailInput.value = email;
        emailInput.focus();
      }
    });
  }

/* =========================================
   6. CONCIERGE (Confirmed Dates)
   ========================================= */
const cdForm = document.getElementById('form-confirmed');
if (cdForm) {
  cdForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = (document.getElementById('cd-email')?.value || '').trim();
    const candidateName = (document.getElementById('cd-name')?.value || '').trim();
    const whenRaw = (document.getElementById('cd-when')?.value || '').trim();
    const location = (document.getElementById('cd-location')?.value || '').trim();
    const notes = (document.getElementById('cd-notes')?.value || '').trim();

    const statusEl = document.getElementById('cd-status');
    const submitBtn = cdForm.querySelector('button[type="submit"]');

    if (!email || !candidateName || !whenRaw) {
      if (statusEl) {
        statusEl.textContent = 'Please fill: User Email, Match Name, Date & Time.';
        statusEl.style.color = '#ff7a7a';
      }
      return;
    }

    // Convert datetime-local -> ISO (UTC) for consistent storage
    let scheduledAt = whenRaw;
    try {
      const d = new Date(whenRaw);
      if (!isNaN(d.getTime())) scheduledAt = d.toISOString();
    } catch (_) {}

    const prevLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';
    }
    if (statusEl) {
      statusEl.textContent = 'Saving…';
      statusEl.style.color = 'rgba(255,255,255,.75)';
    }

    const res = await apiCall('/api/admin/confirmed-date', 'POST', {
      email,
      candidateName,
      scheduledAt,
      location,
      notes
    });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel || 'Save Date';
    }

    if (!res || res.ok === false) {
      const msg = (res && (res.message || res.error)) ? (res.message || res.error) : 'Unable to save date.';
      if (statusEl) {
        statusEl.textContent = `Error: ${msg}`;
        statusEl.style.color = '#ff7a7a';
      }
      return;
    }

    if (statusEl) {
      statusEl.textContent = `Saved confirmed date for ${email}.`;
      statusEl.style.color = '#7a9dff';
    }

    // Keep email (for speed). Clear the rest.
    try {
      const elName = document.getElementById('cd-name'); if (elName) elName.value = '';
      const elWhen = document.getElementById('cd-when'); if (elWhen) elWhen.value = '';
      const elLoc = document.getElementById('cd-location'); if (elLoc) elLoc.value = '';
      const elNotes = document.getElementById('cd-notes'); if (elNotes) elNotes.value = '';
    } catch {}
  });
}

/* =========================================
   INIT
   ========================================= */
// Logout
document.getElementById('btn-logout-admin')?.addEventListener('click', async () => {
  try { await apiCall('/api/admin/logout', 'POST'); } catch (_) {}
  window.location.href = '/admin-login.html';
});

// Initial Load
loadOverviewStats();
// If user refreshed while a non-overview tab is active, ensure lazy loaders run.
const __initialTab = document.querySelector('.nav-btn.active')?.dataset.tab;
if (__initialTab && __initialTab !== 'overview') switchTab(__initialTab);

/* =========================================
   7. PREMIUM SOCIETY MANAGEMENT
   ========================================= */
// Note: Siguraduhing may button ka sa admin.html na may id="btn-refresh-premium" 
// at container na id="premium-list-body" kung gusto mo itong makita.

async function loadPremiumApplicants() {
  const container = document.getElementById('premium-list-body');
  if (!container) return; // Skip kung wala sa HTML

  container.innerHTML = '<p class="muted p-4">Checking...</p>';
  const data = await apiCall('/api/admin/premium/pending');
  if (!data || data.ok === false) {
    const msg = (data && (data.message || data.error)) ? (data.message || data.error) : 'Unable to load premium applications.';
    container.innerHTML = `<p class="muted p-4">${mmEscape(String(msg))}</p>`;
    return;
  }

  const applicants = Array.isArray(data.applicants) ? data.applicants : [];
  if (applicants.length === 0) {
    container.innerHTML = '<p class="muted p-4">No pending premium applications.</p>';
    return;
  }

  container.innerHTML = '';
  applicants.forEach(user => {
    const app = user.premiumApplication || {};
    const row = document.createElement('div');
    row.className = 'row';
    // Custom grid for premium info
    row.style.gridTemplateColumns = '1.2fr 0.9fr 2.2fr 110px'; 
    
    const wealth = (app.wealthStatus || '').replace(/_/g, ' ');
      const income = app.incomeRange || '';
      const netWorth = app.netWorthRange || '';
      const incomeSrc = (app.incomeSource || app.finance || '').trim();
      const reason = (app.reason || '').trim();
      const social = (app.socialLink || '').trim();

      const clip = (s, n = 140) => {
        const str = String(s || '');
        return str.length > n ? str.slice(0, n) + '…' : str;
      };

      row.innerHTML = `
        <div>
          <strong style="color:#fff; display:block;">${mmEscape(app.fullName || user.name || '—')}${app.age ? ` (${mmEscape(app.age)})` : ''}</strong>
          <span class="tiny muted">${mmEscape(user.email || '')}</span>
          <div class="tiny muted" style="margin-top:6px;">Occ: ${mmEscape(app.occupation || '—')}</div>
        </div>

        <div class="tiny">
          <div style="text-transform:capitalize;">${mmEscape(wealth || '—')}</div>
          ${social ? `<a class="tiny" href="${mmEscape(social)}" target="_blank" rel="noopener" style="color:#7a9dff; display:inline-block; margin-top:6px;">View link</a>`
                   : `<div class="tiny muted" style="margin-top:6px;">No link</div>`}
        </div>

        <div class="tiny muted" style="line-height:1.4;">
          <div><span style="color:rgba(255,255,255,.8)">Income:</span> ${mmEscape(income || '—')}</div>
          <div><span style="color:rgba(255,255,255,.8)">Net worth:</span> ${mmEscape(netWorth || '—')}</div>
          ${incomeSrc ? `<div style="margin-top:6px;"><span style="color:rgba(255,255,255,.8)">Source:</span> ${mmEscape(clip(incomeSrc, 140))}</div>` : ''}
          ${reason ? `<div style="margin-top:6px; font-style:italic;">"${mmEscape(clip(reason, 160))}"</div>` : ''}
        </div>

        <div style="text-align:right; display:flex; flex-direction:column; gap:4px;">
          <button class="btn btn--sm btn--primary btn-prem-decide" data-email="${mmEscape(user.email)}" data-dec="approved">Approve</button>
          <button class="btn btn--sm btn--ghost text-danger btn-prem-decide" data-email="${mmEscape(user.email)}" data-dec="rejected">Reject</button>
        </div>
      `;
      container.appendChild(row);
  });

  // Bind buttons
  document.querySelectorAll('.btn-prem-decide').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(!confirm(`Confirm ${btn.dataset.dec}?`)) return;
      const resp = await apiCall('/api/admin/premium/decision', 'POST', { 
        email: btn.dataset.email, 
        decision: btn.dataset.dec 
      });
      if (!resp || resp.ok === false) {
        alert(resp && (resp.message || resp.error) ? (resp.message || resp.error) : 'Failed to update status.');
      }
      loadPremiumApplicants(); // Refresh
    });
  });
}

// I-expose globally or tawagin sa switchTab kung may tab na
window.loadPremiumApplicants = loadPremiumApplicants;