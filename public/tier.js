// tier.js — Choose plan (onboarding / upgrade)
// Includes: Email Gate, Auth Gate (Anti-Flicker), Upgrade View, and Logout -> Landing Page

import * as TMAPI from './tm-api.js';
import { getLocalPlan } from './tm-session.js';

// ============================================================
// [FIXED] EMAIL VERIFIED GATE (DISABLED)
// ============================================================
async function __gateEmailVerified() {
  // Return true agad para hindi humarang ang verification
  return true; 

  /* ORIGINAL CODE (DISABLED FOR DEV)
  try {
    const usp = new URLSearchParams(location.search);
    if (usp.get('upgrade') === '1') return true; 

    const isDemoQS = usp.get('demo') === '1';
    let isDemoLocal = false;
    let localUser = {};
    try {
      localUser = JSON.parse(localStorage.getItem('tm_user')||'{}');
      const em = String(localUser?.email||'').toLowerCase();
      isDemoLocal = em.endsWith('.demo@truematch.app');
    } catch {}
    
    if (isDemoQS || isDemoLocal) return true;

    const me = await TMAPI.apiGet('/api/me');
    if (me?.user?.emailVerified) return true;

    if (localUser && localUser.emailVerified === true) return true;

    const ret = encodeURIComponent(location.pathname + location.search);
    location.href = `./auth.html?mode=signin&verify=1&return=${ret}`;
    return false;

  } catch { return true; }
  */
}

// --- Logout (only way back to landing) ---
async function doLogoutToLanding(){
  const tries = ['/api/auth/logout', '/api/logout', '/logout'];
  for (const url of tries){
    try{
      const r = await fetch(url, { method:'POST', credentials:'include' });
      if (r && r.ok) break;
    }catch{}
  }
  try{
    localStorage.removeItem('tm_user');
    localStorage.removeItem('tm_plan_override');
    localStorage.removeItem('tm_prefs_by_user');
    localStorage.removeItem('tm_prefs'); 
  }catch{}
  
  // Balik sa index (relative path)
  location.replace('./index.html');
}

function attachLogoutButton(){
  const btn = document.getElementById('btnLogout');
  if (!btn) return;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.disabled = true;
    const prev = btn.innerHTML;
    btn.innerHTML = 'Logging out…';
    await doLogoutToLanding();
  });
}

// --- Notice banner helpers ---
function renderTierNotice(kind, message){
  try{
    const box = document.getElementById('tierNotice');
    const text = document.getElementById('tierNoticeText');
    if (!box || !text) return;
    box.classList.remove('success','error');
    if (kind) box.classList.add(kind);
    text.textContent = message;
    box.style.display = 'block';
  }catch{}
}

function getQS() {
  return new URLSearchParams(location.search);
}

// ---- Normalize to tier1/tier2/tier3/free
function normalizePlanName(code) {
  const v = String(code || '').toLowerCase().trim();
  if (v === 'free' || v === 'basic') return 'free';
  if (v === 'plus' || v === 'starter' || v === 'tier1' || v === '1') return 'tier1';
  if (v === 'elite' || v === 'pro' || v === 'tier2' || v === '2') return 'tier2';
  if (v === 'concierge' || v === 'vip' || v === 'tier3' || v === '3') return 'tier3';
  return 'tier1'; 
}

// ---- Helpers for server shapes
function serverEmail(j) {
  const u = j?.user || {};
  return String(u.email || j?.email || '').trim();
}

function serverPlanActive(j) {
  const u = j?.user || {};
  if (typeof u.planActive === 'boolean') return u.planActive;
  if (typeof j?.planActive === 'boolean') return j.planActive;

  const plan = u.plan || j?.plan || null;
  const planEnd = u.planEnd || j?.planEnd || null;

  if (!plan) return false;
  if (!planEnd) return false;
  const endTs = new Date(planEnd).getTime();
  if (Number.isNaN(endTs)) return false;
  return Date.now() <= endTs;
}

function cleanURLParam(param) {
  try {
    const u = new URL(location.href);
    if (u.searchParams.has(param)) {
      u.searchParams.delete(param);
      history.replaceState(null, '', u.toString());
    }
  } catch { }
}

// ==========================================
// [FIXED] REQUIRE AUTH with Local Fallback
// ==========================================
async function requireAuth() {
  const sp = getQS();
  const isDemoQS = sp.get('demo') === '1';

  // Check Local Storage FIRST
  let localUser = null;
  let isDemoLocal = false;
  try {
    const raw = localStorage.getItem('tm_user');
    if (raw) {
      localUser = JSON.parse(raw);
      const em = String(localUser?.email || '').toLowerCase();
      if (em.endsWith('.demo@truematch.app')) {
        isDemoLocal = true;
      }
    }
  } catch {}

  const isDemo = isDemoQS || isDemoLocal;
  const isUpgrade = sp.get('upgrade') === '1';

  cleanURLParam('session_id');

  try {
    // 1. Try contacting server
    let j = await TMAPI.apiMe();

    // [IMPORTANT FIX] Kung fail ang server pero may Local User, gamitin ang Local User.
    if ((!j || j.ok === false || j.error) && localUser) {
        console.warn('Backend unreachable, using Local Storage fallback.');
        j = { ok: true, user: localUser };
    }

    // 2. Kung wala talagang login -> Redirect
    if (!j || j.ok === false || j.error) {
      if (!isDemo) {
        const ret = encodeURIComponent(location.pathname + location.search);
        location.replace(`./auth.html?mode=signin&return=${ret}`);
        return false;
      }
    }

    // 3. Check Email presence
    const email = serverEmail(j);
    if (!email && !isDemo) {
      const ret = encodeURIComponent(location.pathname + location.search);
      location.replace(`./auth.html?mode=signin&return=${ret}`);
      return false;
    }

    // 4. Check User & Preferences (Anti-Flicker)
    const user = j?.user || {};
    // Update local storage para laging fresh
    if(user && user.email) {
        localStorage.setItem('tm_user', JSON.stringify(user));
    }

    // ============================================================
    // [FIX 1 - DISABLED] PREFERENCES GATE
    // ============================================================
    /*
    const prefsSaved = !!(user.prefsSaved || user.preferencesSaved || user.prefs || user.preferences || j.prefs);
    if (!prefsSaved && !isUpgrade) {
       // ... redirect code removed ...
    }
    */

    // 5. Check Active Plan
    const planActiveFromServer = serverPlanActive(j);
    const hasPlan = isDemo ? (planActiveFromServer || !!getLocalPlan()) : planActiveFromServer;

    // Prevent going back to dashboard if we are explicitly upgrading
    if (hasPlan && !isUpgrade) {
      location.replace('./dashboard.html');
      return false;
    }

    if (sp.get('cancelled') === '1') {
      const prePlan = sp.get('prePlan') || '';
      const p = prePlan ? ` (${prePlan})` : '';
      renderTierNotice('error', 'Payment canceled. Please choose a plan again' + p + '.');
    }

    return true;
  } catch (e) {
    console.error(e);
    // Safety net: Kung nag-crash ang code, check local storage bago i-kickout
    if(localStorage.getItem('tm_user')){
        return true; 
    }

    const ret = encodeURIComponent(location.pathname + location.search);
    location.replace(`./auth.html?mode=signin&return=${ret}`);
    return false;
  }
}

function buildPayURL(plan) {
  const sp = getQS();
  const qs = new URLSearchParams();

  qs.set('plan', normalizePlanName(plan));

  const demo = sp.get('demo');
  const onboarding = sp.get('onboarding');
  const upgrade = sp.get('upgrade');

  if (demo === '1') qs.set('demo', '1');
  if (onboarding === '1') qs.set('onboarding', '1');
  if (upgrade === '1') qs.set('upgrade', '1');

  qs.set('prePlan', normalizePlanName(plan));

  return `./pay.html?${qs.toString()}`;
}

function attachPlanButtons() {
  document.querySelectorAll('[data-plan]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const plan = normalizePlanName(btn.dataset.plan);
      if (plan === 'free') return;

      try{ window.TMLoader && TMLoader.show('Opening checkout…','Connecting to Coinbase'); }catch{}
      location.href = buildPayURL(plan);
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-plan]')) return;

    const el = e.target.closest('[data-plan-card]') || e.target.closest('[data-tier]');
    if (!el) return;

    const planCard = el.getAttribute('data-plan-card');
    const tier = el.getAttribute('data-tier');

    let plan = planCard ? normalizePlanName(planCard) : '';
    if (!plan && tier) {
      plan = ({ '1': 'tier1', '2': 'tier2', '3': 'tier3' }[tier]) || tier;
    }

    plan = normalizePlanName(plan);
    if (plan === 'free') return;

    try{ window.TMLoader && TMLoader.show('Opening checkout…','Connecting to Coinbase'); }catch{}
    location.href = buildPayURL(plan);
  });
}

async function renderUpgradeView() {
  const sp = new URLSearchParams(location.search);
  if (sp.get('upgrade') !== '1') return;

  try {
    const j = await TMAPI.apiMe();
    
    // FALLBACK: Use local if api failed
    let current = 'free';
    if(j && (j.user || j.plan)) {
        current = String((j?.user?.plan || j?.plan || 'free')).toLowerCase();
    } else {
        const local = JSON.parse(localStorage.getItem('tm_user')||'{}');
        current = String(local.plan || 'free').toLowerCase();
    }
    
    const ranks = { free: 0, tier1: 1, tier2: 2, tier3: 3 };
    const myRank = ranks[current] ?? 0;

    document.querySelectorAll('[data-plan-card], [data-tier]').forEach(el => {
      let cardPlan = el.getAttribute('data-plan-card') || el.getAttribute('data-tier') || '';
      cardPlan = cardPlan.toLowerCase();
      
      if(cardPlan === 'plus') cardPlan = 'tier1';
      if(cardPlan === 'elite') cardPlan = 'tier2';
      if(cardPlan === 'concierge') cardPlan = 'tier3';

      const cardRank = ranks[cardPlan] ?? 0;
      const btn = el.querySelector('button');

      if (cardPlan === current) {
        el.style.opacity = '1';
        el.classList.add('current-plan-card');
        if(btn) {
          btn.textContent = 'Current Plan';
          btn.disabled = true;
          btn.classList.add('btn--disabled');
        }
      } 
      else if (cardRank < myRank) {
        el.style.opacity = '0.5';
        el.style.pointerEvents = 'none';
        if(btn) {
          btn.textContent = 'Included';
          btn.disabled = true;
        }
      }
      else {
        el.style.opacity = '1';
        el.classList.add('ring-2');
        if(btn) {
          btn.textContent = 'Upgrade';
          btn.disabled = false;
        }
      }
    });

  } catch (e) {
    console.error('Upgrade view error:', e);
  }
}

// =================================================================
// MAIN INITIALIZATION
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {
  attachLogoutButton();

  // 1. Check basic Auth
  const ok = await requireAuth();
  if (!ok) return;

  // 2. CHECK UPGRADE FLAG
  const sp = new URLSearchParams(location.search);
  const isUpgrade = sp.get('upgrade') === '1';

  if (!isUpgrade) {
    const verifiedOk = await __gateEmailVerified();
    if (!verifiedOk) return;
  }

  // 3. Setup UI
  attachPlanButtons();
  renderUpgradeView();
});