// ---------------------------------------------------------------------
// iTrueMatch Dashboard – Main Controller (FINAL: UI WIDTHS & BG FIXED)
// ---------------------------------------------------------------------

import { getLocalPlan, saveLocalUser, savePrefsForCurrentUser, clearSession } from './tm-session.js';
import { apiGet, apiPost, apiUpdateProfile, apiSavePrefs } from './tm-api.js';


const DAILY_SWIPE_LIMIT = 20; 

// Feature flag: set to true kapag bukas na ulit ang Creators application.
const CREATOR_APPLICATION_OPEN = false;

// --- Email helper: shorten + mask to avoid UI overlap (Settings header) ---
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const first = local[0] || '';
  const stars = '*'.repeat(8);
  return `${first}${stars}@${domain}`;
}

// --- Image helper (avatar upload): robust decode + square crop + size cap ---
// Note: Some formats (HEIC/HEIF) are not decodable in most desktop browsers without extra libs.
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function isHeicLike(file) {
  const t = String(file?.type || '').toLowerCase();
  const n = String(file?.name || '').toLowerCase();
  return t === 'image/heic' || t === 'image/heif' || n.endsWith('.heic') || n.endsWith('.heif');
}

async function fileToOptimizedSquareDataUrl(file, maxSize = 768, quality = 0.85, maxBytes = 420 * 1024) {
  if (!file) throw new Error('no_file');
  if (isHeicLike(file)) {
    const err = new Error('unsupported_format');
    err.code = 'unsupported_format';
    err.format = 'heic';
    throw err;
  }

  const objectUrl = URL.createObjectURL(file);
  let source = null;
  let sw = 0, sh = 0;

  try {
    // Prefer createImageBitmap (fast + avoids huge base64 in memory)
    if (typeof createImageBitmap === 'function') {
      try {
        source = await createImageBitmap(file, { imageOrientation: 'from-image' });
        sw = source.width;
        sh = source.height;
      } catch (_) {
        source = null;
      }
    }

    if (!source) {
      const img = new Image();
      img.decoding = 'async';
      img.src = objectUrl;
      if (img.decode) {
        await img.decode();
      } else {
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      }
      source = img;
      sw = img.naturalWidth || img.width;
      sh = img.naturalHeight || img.height;
    }

    if (!sw || !sh) throw new Error('image_decode_failed');

    const s = Math.min(sw, sh);
    const sx = Math.floor((sw - s) / 2);
    const sy = Math.floor((sh - s) / 2);

    // Try combinations until we fit under maxBytes (also helps server-side limits)
    const sizeCandidates = [];
    const startOut = Math.min(maxSize, s);

    if (startOut <= 256) {
      sizeCandidates.push(startOut);
    } else {
      for (let cur = startOut; cur >= 256; cur = Math.floor(cur * 0.82)) {
        sizeCandidates.push(cur);
        if (cur <= 256) break;
      }
      if (sizeCandidates[sizeCandidates.length - 1] !== 256) sizeCandidates.push(256);
    }

    const qCandidates = [quality, 0.82, 0.78, 0.74, 0.70, 0.66, 0.62, 0.58];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas_unsupported');

    for (const out of sizeCandidates) {
      canvas.width = out;
      canvas.height = out;
      ctx.clearRect(0, 0, out, out);
      ctx.drawImage(source, sx, sy, s, s, 0, 0, out, out);

      for (const q of qCandidates) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
        if (!blob) continue;
        if (blob.size <= maxBytes) {
          return await blobToDataUrl(blob);
        }
      }
    }

    // Last resort: return a compressed JPEG even if it slightly exceeds maxBytes.
    return canvas.toDataURL('image/jpeg', Math.max(0.55, quality));
  } finally {
    try { URL.revokeObjectURL(objectUrl); } catch {}
    try { if (source && typeof source.close === 'function') source.close(); } catch {}
  }
}

const state = { me: null, prefs: null, plan: 'free', activeTab: 'home', isLoading: false, selectedAvatarDataUrl: null, homeCache: { admirersTs: 0, nearbyTs: 0 }, homeLoading: { admirers: false, nearby: false } };

// --- Chat (modal) runtime state (polling + smart scroll) ---
state.chatPollTimer = null;
state.chatLastSig = '';
state.chatNewToastShown = false;
state.chatForceScrollToBottom = false;
state.chatScrollBound = false;
state.chatIsNearBottom = true;

// --- Inbox (unread) runtime state ---
state.inboxPollTimer = null;
state.inboxThreadState = {}; // { peerEmail: { lastMessageAtMs, lastReadAtMs } }


// Read the last known user from localStorage
function safeGetLocalUser() {
  try {
    return JSON.parse(localStorage.getItem('tm_user') || 'null');
  } catch (_) {
    return null;
  }
}

const DOM = {};

// Avatar full-size viewer (used in Settings > Edit)
function openAvatarLightbox(src) {
  if (!DOM.avatarLightbox || !DOM.avatarLightboxImg) return;
  DOM.avatarLightboxImg.src = src || 'assets/images/truematch-mark.png';
  DOM.avatarLightbox.removeAttribute('hidden');
  // Prevent background scroll while the viewer is open
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function closeAvatarLightbox() {
  if (!DOM.avatarLightbox || !DOM.avatarLightboxImg) return;
  DOM.avatarLightbox.setAttribute('hidden', '');
  DOM.avatarLightboxImg.src = '';
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

function ensureConciergeTab() {
  const tabbar = document.getElementById('tabbar');
  const panels = document.getElementById('panels') || document.querySelector('main.main-feed') || document.querySelector('.main-feed');
  if (!tabbar || !panels) return;

  // --- Nav button (place Concierge between Creators and Premium when Premium exists) ---
  const existingBtn = tabbar.querySelector('.nav-btn[data-panel="concierge"]');
  if (!existingBtn) {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.setAttribute('data-panel', 'concierge');
    btn.innerHTML = '<i class="fa-solid fa-user-tie"></i><span>Concierge</span>';

    const premiumBtn = tabbar.querySelector('.nav-btn[data-panel="premium"]');
    const creatorsBtn = tabbar.querySelector('.nav-btn[data-panel="creators"]');

    // Current nav order has Creators before Premium. Insert Concierge before Premium so it sits between them.
    if (premiumBtn) {
      tabbar.insertBefore(btn, premiumBtn);
    } else if (creatorsBtn) {
      tabbar.insertBefore(btn, creatorsBtn);
    } else {
      tabbar.appendChild(btn);
    }
  }

  // --- Panel ---
  const existingPanel = panels.querySelector('.panel[data-panel="concierge"]');
  if (!existingPanel) {
    const section = document.createElement('section');
    section.className = 'panel';
    section.setAttribute('data-panel', 'concierge');
    section.style.display = 'none';

    section.innerHTML = `
      <div class="feed-header">
        <h2>Concierge</h2>
        <p style="margin:0; color:rgba(255,255,255,0.75); font-size:0.9rem;">
          Date-setter concierge (Tier 3 only).
        </p>
      </div>

      <div id="panel-concierge"></div>
    `;

    // Insert after Shortlist panel if present, otherwise before Creators panel if present.
    const shortlistPanel = panels.querySelector('.panel[data-panel="shortlist"]');
    const creatorsPanel = panels.querySelector('.panel[data-panel="creators"]');

    if (shortlistPanel && shortlistPanel.nextSibling) {
      shortlistPanel.insertAdjacentElement('afterend', section);
    } else if (creatorsPanel) {
      panels.insertBefore(section, creatorsPanel);
    } else {
      panels.appendChild(section);
    }
  }
}

function cacheDom() {
  ensureConciergeTab();
  DOM.tabs = document.querySelectorAll('.nav-btn');
  DOM.panels = document.querySelectorAll('.panel[data-panel]');
  DOM.btnLogout = document.getElementById('btn-logout');
  DOM.btnMobileLogout = document.getElementById('btn-logout-mobile');
  
  DOM.homeWelcomeName = document.getElementById('welcomeName') || document.getElementById('homeWelcomeName');
  DOM.homePlanPill = document.getElementById('planPill') || document.getElementById('homePlanPill');
  DOM.homePlanSummary = document.getElementById('planName') || document.getElementById('homePlanSummary');
  DOM.admirerContainer = document.getElementById('admirerContainer');
  DOM.admirerCount = document.getElementById('admirerCount');
  
  DOM.newMatchesRail = document.getElementById('newMatchesRail');
  DOM.matchesContainer = document.getElementById('matchesContainer');
  DOM.newMatchCount = document.getElementById('newMatchCount');
  DOM.matchSearch = document.getElementById('matchSearch') || document.querySelector('section.panel[data-panel="matches"] input.tm-input');
  
  // Modals & Dialogs
  DOM.dlgChat = document.getElementById('dlgChat');
  DOM.chatUserImg = document.getElementById('chatUserImg');
  DOM.chatUserName = document.getElementById('chatUserName');
  // Backward-compat aliases (older code uses chatAvatar/chatName)
  DOM.chatAvatar = DOM.chatUserImg;
  DOM.chatName = DOM.chatUserName;
  DOM.chatBody = document.getElementById('chatBody');
  DOM.btnCloseChat = document.getElementById('btnCloseChat');
  DOM.chatInput = DOM.dlgChat ? DOM.dlgChat.querySelector('input.tm-input') : null;
  DOM.btnChatSend = DOM.dlgChat ? DOM.dlgChat.querySelector('button.btn.btn--primary') : null;
  DOM.chatReceiptLine = DOM.dlgChat ? DOM.dlgChat.querySelector('.chat-header p') : null;

  DOM.activeNearbyContainer = document.getElementById('activeNearbyContainer');
  DOM.homeActiveNearbyContainer = document.getElementById('homeActiveNearbyContainer');
  DOM.btnSidebarSubscribeMobile = document.getElementById('btnSidebarSubscribeMobile');
  DOM.btnNotifToggle = document.getElementById('btnNotifToggle');
  DOM.notifDropdown = document.getElementById('notifDropdown');
  DOM.notifDot = DOM.btnNotifToggle ? DOM.btnNotifToggle.querySelector('.notif-dot') : null;
  DOM.notifList = DOM.notifDropdown ? (DOM.notifDropdown.querySelector('#notifList') || DOM.notifDropdown.querySelector('.notif-list')) : null;
  DOM.btnNotifMarkAllRead = DOM.notifDropdown ? (DOM.notifDropdown.querySelector('.notif-footer') || null) : null;
  
  DOM.sAvatar = document.getElementById('sAvatar');
  DOM.sNameDisplay = document.getElementById('sNameDisplay');
  DOM.sEmailDisplay = document.getElementById('sEmailDisplay');
  // Settings display (should mirror Preferences page fields)
  DOM.dispCity = document.getElementById('dispCity');
    DOM.dispAge = document.getElementById('dispAge'); // profile city
  DOM.dispProfileGender = document.getElementById('dispProfileGender');
  DOM.dispPrefCity = document.getElementById('dispPrefCity');
  DOM.dispAgeRange = document.getElementById('dispAgeRange');
  DOM.dispEthnicity = document.getElementById('dispEthnicity');
  DOM.dispLooking = document.getElementById('dispLooking');
  DOM.dispIntent = document.getElementById('dispIntent');
  DOM.dispSharedValues = document.getElementById('dispSharedValues');
  DOM.dispDealbreakers = document.getElementById('dispDealbreakers');
  
  DOM.dlgProfile = document.getElementById('dlgProfile');
  DOM.frmProfile = document.getElementById('frmProfile');
  DOM.btnEditProfile = document.getElementById('btnEditProfile');
  DOM.btnCloseProfile = document.getElementById('btnCloseProfile');

  // Profile + preferences modal controls
  DOM.btnAvatarZoom = document.getElementById('btnAvatarZoom');
  DOM.dlgAvatarPreview = document.getElementById('dlgAvatarPreview');
  DOM.btnPickAvatar = document.getElementById('btnPickAvatar');
  DOM.inpAvatarFile = document.getElementById('inpAvatarFile');
  DOM.avatarFilename = document.getElementById('avatarFilename');
  DOM.advancedPrefsSection = document.getElementById('advancedPrefsSection');
  DOM.advLockNote = document.getElementById('advLockNote');

  // Avatar full-size viewer (lightbox)
  DOM.avatarLightbox = document.getElementById('avatarLightbox');
  DOM.avatarLightboxImg = document.getElementById('avatarLightboxImg');
  DOM.btnCloseAvatarLightbox = document.getElementById('btnCloseAvatarLightbox');
  
  DOM.dlgPassword = document.getElementById('dlgPassword');
  DOM.frmPassword = document.getElementById('frmPassword');
  DOM.btnChangePassword = document.getElementById('btnChangePassword');
  DOM.btnCancelPassword = document.getElementById('btnCancelPassword');
  DOM.inpCurrentPassword = document.getElementById('inpCurrentPassword');
  DOM.inpNewPassword = document.getElementById('inpNewPassword');
  DOM.inpConfirmPassword = document.getElementById('inpConfirmPassword');
  DOM.btnSubmitPassword = document.getElementById('btnSubmitPassword');
DOM.inpName = document.getElementById('inpName');
  DOM.inpEmail = document.getElementById('inpEmail');
  DOM.inpCity = document.getElementById('inpCity');
  DOM.inpUserAge = document.getElementById('inpAge') || document.getElementById('inpUserAge');
  DOM.inpProfileGender = document.getElementById('inpProfileGender');
  DOM.inpPrefCity = document.getElementById('inpPrefCity');
  DOM.inpAgeMin = document.getElementById('inpAgeMin');
  DOM.inpAgeMax = document.getElementById('inpAgeMax');
  DOM.inpLooking = document.getElementById('inpLookingFor') || document.getElementById('inpLooking');
  DOM.inpEthnicity = document.getElementById('inpEthnicity');
  DOM.inpIntent = document.getElementById('inpIntent');
  DOM.inpDealbreakers = document.getElementById('inpDealbreakers');
  DOM.inpSharedValues = document.getElementById('inpSharedValues');
  
  DOM.swipeStack = document.getElementById('swipeStack');
  DOM.swipeEmpty = document.getElementById('swipeEmpty');
  DOM.swipeControls = document.getElementById('swipeControls');
  DOM.btnSwipePass = document.getElementById('btnSwipePass');
  DOM.btnSwipeLike = document.getElementById('btnSwipeLike');
  DOM.btnSwipeSuper = document.getElementById('btnSwipeSuper');
  DOM.btnRefreshSwipe = document.getElementById('btnRefreshSwipe');
  DOM.btnSidebarSubscribe = document.getElementById('btnSidebarSubscribe'); 
  
  DOM.statsRingCircle = document.getElementById('statsRingCircle');
  DOM.statsCountDisplay = document.getElementById('statsCountDisplay');
  
    DOM.mobileStatsRingCircle = document.getElementById('mobileStatsRingCircle');
  DOM.mobileStatsCountDisplay = document.getElementById('mobileStatsCountDisplay');
// Panel Bodies
  DOM.panelShortlistBody = document.getElementById('panel-shortlist');
  DOM.panelConciergeBody = document.getElementById('panel-concierge');
  DOM.panelCreatorsBody = document.getElementById('panel-creators');
  DOM.panelPremiumBody = document.getElementById('panel-premium');

  // Creator & Premium Buttons
  DOM.btnOpenCreatorApply = document.getElementById('btnOpenCreatorApply');
  DOM.dlgCreatorApply = document.getElementById('dlgCreatorApply');
  DOM.btnCloseCreatorApply = document.getElementById('btnCloseCreatorApply');
  DOM.btnOpenPremiumApply = document.getElementById('btnOpenPremiumApply') || document.getElementById('btnOpenPremiumApplyMain');
  DOM.dlgPremiumApply = document.getElementById('dlgPremiumApply');
  DOM.btnPremiumCancel = document.getElementById('btnPremiumCancel');
  DOM.btnPremiumSubmit = document.getElementById('btnPremiumSubmit');

  // Application forms
  DOM.frmCreatorApply = document.getElementById('frmCreatorApply');
  DOM.frmPremiumApply = document.getElementById('frmPremiumApply');

  // Creators / Premium Society entry cards
  DOM.creatorEntryCard = document.getElementById('creatorEntryCard');
  DOM.creatorStatusRow = document.getElementById('creatorStatusRow');
  DOM.creatorStatusChip = document.getElementById('creatorStatusChip');
  DOM.creatorStatusHint = document.getElementById('creatorStatusHint');
  DOM.btnGoCreatorsPage = document.getElementById('btnGoCreatorsPage');

  DOM.premiumEntryCard = document.getElementById('premiumEntryCard');
  DOM.premiumStatusRow = document.getElementById('premiumStatusRow');
  DOM.premiumStatusChip = document.getElementById('premiumStatusChip');
  DOM.premiumStatusHint = document.getElementById('premiumStatusHint');
  DOM.btnGoPremiumPage = document.getElementById('btnGoPremiumPage');

  
  // Toast element (supports both legacy #tm-toast and new #toastContainer)
  DOM.toast = document.getElementById('tm-toast');
  if (!DOM.toast) {
    const host = document.getElementById('toastContainer') || document.body;
    const el = document.createElement('div');
    el.id = 'tm-toast';
    el.className = 'toast';
    host.appendChild(el);
    DOM.toast = el;
  }
}

let __toastTimer = null;
let __toastHomeParent = null;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function showToast(msg, type = 'success') {
  if (!DOM.toast) return;

  // Native <dialog> uses a "top layer", so elements outside can appear behind it.
  // If a dialog is open, render the toast inside the open dialog.
  const openDlg = document.querySelector('dialog[open]');
  const host = openDlg || document.body;

  if (!__toastHomeParent) __toastHomeParent = DOM.toast.parentElement || document.body;
  if (host && DOM.toast.parentElement !== host) host.appendChild(DOM.toast);

  const safeMsg = escapeHtml(msg);

  let icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
  else if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
  else if (type === 'info') icon = '<i class="fa-solid fa-circle-info"></i>';

  let cls = '';
  if (type === 'error') cls = 'toast--error';
  else if (type === 'warning') cls = 'toast--warning';
  else if (type === 'info') cls = 'toast--info';

  DOM.toast.innerHTML = `${icon} ${safeMsg}`;
  DOM.toast.className = `toast toast--visible ${cls}`.trim();

  if (__toastTimer) clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => {
    if (!DOM.toast) return;
    DOM.toast.classList.remove('toast--visible');

    // If no dialogs are open, move the toast back to its original container.
    setTimeout(() => {
      const stillOpen = document.querySelector('dialog[open]');
      if (!stillOpen && __toastHomeParent && DOM.toast.parentElement !== __toastHomeParent) {
        __toastHomeParent.appendChild(DOM.toast);
      }
    }, 50);
  }, 3000);
}

// Backwards-compat: some code calls toast(...) instead of showToast(...)
function toast(msg, type = 'success') { showToast(msg, type); }

function normalizePlanKey(rawPlan) {
  // Accepts: 'free' | 'plus' | 'elite' | 'concierge' | 'tier1' | 'tier2' | 'tier3'
  // Also accepts numeric tiers: 0/1/2/3 (or strings like '1', '2', '3')
  if (rawPlan === null || typeof rawPlan === 'undefined' || rawPlan === '') return 'free';

  // If an object was passed (some API shapes nest plan info), try common keys.
  if (typeof rawPlan === 'object') {
    const maybe =
      rawPlan.plan ??
      rawPlan.planKey ??
      rawPlan.plan_name ??
      rawPlan.planName ??
      rawPlan.tier ??
      rawPlan.level ??
      rawPlan.code ??
      rawPlan.name ??
      rawPlan.subscription ??
      rawPlan.subscriptionTier ??
      rawPlan.currentPlan;
    if (typeof maybe !== 'undefined' && maybe !== null && maybe !== rawPlan) {
      return normalizePlanKey(maybe);
    }
  }

  // Numeric plan
  if (typeof rawPlan === 'number' && Number.isFinite(rawPlan)) {
    if (rawPlan >= 3) return 'tier3';
    if (rawPlan === 2) return 'tier2';
    if (rawPlan === 1) return 'tier1';
    return 'free';
  }

  const s = String(rawPlan).toLowerCase().trim();
  const p = s.replace(/\s+/g, '');

  // Plain digit strings like "1", "2", "3"
  if (/^\d+$/.test(p)) {
    const n = parseInt(p, 10);
    if (n >= 3) return 'tier3';
    if (n === 2) return 'tier2';
    if (n === 1) return 'tier1';
    return 'free';
  }

  // Common names / aliases
  if (p.includes('free') || p.includes('basic') || p.includes('tier0')) return 'free';
  if (p.includes('plus') || p.includes('starter') || p.includes('tier1')) return 'tier1';
  if (p.includes('elite') || p.includes('pro') || p.includes('tier2')) return 'tier2';
  if (p.includes('concierge') || p.includes('vip') || p.includes('tier3')) return 'tier3';

  // Patterns like "plan2", "level3", etc.
  const m = p.match(/(?:tier|plan|level)(\d)/);
  if (m && m[1]) {
    const n = parseInt(m[1], 10);
    if (n >= 3) return 'tier3';
    if (n === 2) return 'tier2';
    if (n === 1) return 'tier1';
  }

  return 'free';
}

function normalizeStatus(rawStatus) {
  if (!rawStatus) return '';
  const s = String(rawStatus).trim().toLowerCase();
  if (s === 'pending' || s === 'approved' || s === 'rejected') return s;
  return s; // fallback
}

function renderCreatorPremiumEntryCards() {
  renderCreatorEntryCard();
  renderPremiumEntryCard();
}

function renderCreatorEntryCard() {
  if (!DOM.creatorEntryCard) return;

  const status = normalizeStatus(state.me && state.me.creatorStatus);
  const row = DOM.creatorStatusRow;
  const chip = DOM.creatorStatusChip;
  const hint = DOM.creatorStatusHint;
  const btnApply = DOM.btnOpenCreatorApply;
  const btnGo = DOM.btnGoCreatorsPage;

  const appsOpen = !!CREATOR_APPLICATION_OPEN;

  // Defaults
  if (row) row.style.display = 'none';
  if (btnGo) btnGo.style.display = 'none';
  if (btnApply) {
    btnApply.disabled = false;
    btnApply.textContent = 'Apply';
    btnApply.style.opacity = '1';
    btnApply.style.display = 'inline-flex';
    btnApply.style.cursor = '';
  }

  if (status === 'pending') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Pending';
    if (hint) hint.textContent = 'Your application is under review.';
    if (btnApply) {
      btnApply.disabled = true;
      btnApply.textContent = 'Application Pending';
      btnApply.style.opacity = '0.6';
      btnApply.style.cursor = 'not-allowed';
    }
  } else if (status === 'rejected') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Rejected';

    if (appsOpen) {
      if (hint) hint.textContent = 'You can edit and re-apply anytime.';
      if (btnApply) {
        btnApply.disabled = false;
        btnApply.textContent = 'Re-Apply';
        btnApply.style.opacity = '1';
        btnApply.style.cursor = 'pointer';
      }
    } else {
      if (hint) hint.textContent = 'Re-apply when Creator applications reopen.';
      if (btnApply) {
        btnApply.disabled = true;
        btnApply.textContent = 'Closed';
        btnApply.style.opacity = '0.6';
        btnApply.style.cursor = 'not-allowed';
      }
    }
  } else if (status === 'approved') {
    // In case user lands here (e.g., deep link / back button), show a go button.
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Approved';
    if (hint) hint.textContent = 'You can now access the Creators page.';
    if (btnApply) btnApply.style.display = 'none';
    if (btnGo) btnGo.style.display = 'inline-flex';
  } else {
    // no status yet
    if (!appsOpen) {
      if (row) row.style.display = 'flex';
      if (chip) chip.textContent = 'Coming Soon';
      if (hint) hint.textContent = 'Creator applications are opening soon.';

      if (btnApply) {
        btnApply.disabled = true;
        btnApply.textContent = 'Coming Soon';
        btnApply.style.opacity = '0.6';
        btnApply.style.display = 'inline-flex';
        btnApply.style.cursor = 'not-allowed';
      }
    } else {
      // Applications open: show normal Apply CTA
      if (row) row.style.display = 'none';
      if (btnApply) {
        btnApply.disabled = false;
        btnApply.textContent = 'Apply';
        btnApply.style.opacity = '1';
        btnApply.style.display = 'inline-flex';
        btnApply.style.cursor = 'pointer';
      }
      if (btnGo) btnGo.style.display = 'none';
    }
  }
}


function renderPremiumEntryCard() {
  if (!DOM.premiumEntryCard) return;

  const status = normalizeStatus(state.me && state.me.premiumStatus);
  const row = DOM.premiumStatusRow;
  const chip = DOM.premiumStatusChip;
  const hint = DOM.premiumStatusHint;
  const btnApply = DOM.btnOpenPremiumApply;
  const btnGo = DOM.btnGoPremiumPage;

  // Defaults
  if (row) row.style.display = 'none';
  if (btnGo) btnGo.style.display = 'none';
  if (btnApply) {
    btnApply.disabled = false;
    btnApply.textContent = 'Apply';
    btnApply.style.opacity = '1';
    btnApply.style.display = 'inline-flex';
  }

  if (status === 'pending') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Pending';
    if (hint) hint.textContent = 'Your application is under review.';
    if (btnApply) {
      btnApply.disabled = true;
      btnApply.textContent = 'Application Pending';
      btnApply.style.opacity = '0.6';
    }
  } else if (status === 'rejected') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Rejected';
    if (hint) hint.textContent = 'You can re-apply anytime.';
    if (btnApply) {
      btnApply.disabled = false;
      btnApply.textContent = 'Re-Apply';
      btnApply.style.opacity = '1';
    }
  } else if (status === 'approved') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Approved';
    if (hint) hint.textContent = 'You can now access Premium Society.';
    if (btnApply) btnApply.style.display = 'none';
    if (btnGo) btnGo.style.display = 'inline-flex';
  } else {
    // no status yet
    if (btnApply) btnApply.style.display = 'inline-flex';
  }
}

function getRandomColor() {
  const colors = ['#FF3366', '#3ad4ff', '#00ffbf', '#fcd34d', '#b197fc'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function updateSwipeStats(current, max) {
    // Desktop widget
    if (DOM.statsCountDisplay) DOM.statsCountDisplay.textContent = current;
    if (DOM.statsRingCircle) {
        const percent = current / max;
        const offset = 251 - (251 * percent);
        DOM.statsRingCircle.style.strokeDashoffset = offset;
    }

    // Mobile widget (Swipe panel)
    if (DOM.mobileStatsCountDisplay) DOM.mobileStatsCountDisplay.textContent = current;
    if (DOM.mobileStatsRingCircle) {
        const percent = current / max;
        const offset = 251 - (251 * percent);
        DOM.mobileStatsRingCircle.style.strokeDashoffset = offset;
    }
}

function enableBackdropClose(dialog) {
    if (!dialog) return;
    dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            dialog.close();
        }
    });
}


// ---------------------------------------------------------------------
// HOME (MOBILE): Ensure sidebar widgets exist inside Home panel
// - We inject these only on mobile view so desktop keeps the right sidebar.
// - This avoids "missing markup" issues when HTML didn't include the containers.
// ---------------------------------------------------------------------
function ensureHomeMobileWidgets() {
  try {
    const isMobile = !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    if (!isMobile) return;

    const homePanel = document.querySelector('section.panel[data-panel="home"]');
    if (!homePanel) return;

    // Prevent duplicates
    if (document.getElementById('homeMobileWidgets')) return;

    const wrap = document.createElement('div');
    wrap.id = 'homeMobileWidgets';
    wrap.className = 'home-mobile-widgets';

    // Inline styles as a fallback (in case responsive.css overrides dashboard.css)
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '12px';
    wrap.style.marginTop = '14px';
    wrap.style.padding = '0 10px 18px';

    wrap.innerHTML = `
      <div class="tm-card" style="padding:14px; border-radius:14px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
          <div style="font-weight:700;">Active Nearby</div>
          <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:#ff4d6d;">
            <span style="width:6px; height:6px; border-radius:999px; background:#ff4d6d; display:inline-block;"></span>
            <span style="letter-spacing:.2em;">LIVE</span>
          </div>
        </div>
        <div id="homeActiveNearbyContainer"></div>
      </div>

      <div class="tm-card" style="padding:16px; border-radius:14px; background:rgba(0,0,0,0.35); border:1px solid rgba(255,215,0,0.35);">
        <div style="display:flex; gap:10px; align-items:center;">
          <div style="width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:rgba(255,215,0,0.08);">
            <i class="fa-solid fa-crown" style="color:#ffd700;"></i>
          </div>
          <div style="flex:1;">
            <div style="font-weight:800;">Unlock More Features</div>
            <div style="font-size:12px; color:rgba(255,255,255,0.70); margin-top:2px;">
              See who likes you &amp; unlimited swipes.
            </div>
          </div>
        </div>
        <button id="btnSidebarSubscribeMobile" class="btn btn--primary" style="width:100%; margin-top:12px;">Upgrade Now</button>
      </div>
    `;

    homePanel.appendChild(wrap);
  } catch (_) {
    // no-op
  }
}


// ---------------------------------------------------------------------
// CORE INIT
// ---------------------------------------------------------------------

async function initApp() {
  cacheDom();
  ensureHomeMobileWidgets();
  // Refresh DOM refs for dynamically injected Home widgets (mobile)
  DOM.homeActiveNearbyContainer = document.getElementById('homeActiveNearbyContainer');
  DOM.btnSidebarSubscribeMobile = document.getElementById('btnSidebarSubscribeMobile');
  await loadMe();
  // Background unread updater (safe even if Matches tab isn't open yet).
  try { startInboxPolling({ immediate: true }); } catch {}
  // Prefetch notifications so the bell dot is accurate even before opening the dropdown.
  try { NotificationsController.load({ force: true }).catch(() => {}); } catch {}
  
  SwipeController.init();
await loadHomePanels(true);
    renderHomeEmptyStates();
  setupEventListeners();
  setupMobileMenu();

  // Restore last opened tab if allowed for this plan
  try {
    const remembered = localStorage.getItem('tm_activeTab') || 'home';
    const allowedBtn = Array.from(DOM.tabs || []).find(b => b && b.dataset && b.dataset.panel === remembered && b.style.display !== 'none');
    const fallbackBtn = Array.from(DOM.tabs || []).find(b => b && b.dataset && b.style.display !== 'none');
    const safeTab = allowedBtn ? remembered : (fallbackBtn ? fallbackBtn.dataset.panel : 'home');
    setActiveTab(safeTab);
  } catch {
    setActiveTab('home');
  }

  // Remove Loader
  setTimeout(() => {
      const loader = document.getElementById('app-loader');
      if(loader) {
          loader.style.opacity = '0';
          setTimeout(() => loader.remove(), 500);
      }
      const layout = document.getElementById('mainLayout');
      if(layout) layout.style.opacity = '1';
  }, 1000);
}

// ---------------------------------------------------------------------
// NOTIFICATIONS CONTROLLER
// ---------------------------------------------------------------------
const NotificationsController = (() => {
  const CACHE_MS = 15000;
  let cache = { ts: 0, items: [] };

  function setDot(unreadCount) {
    if (!DOM.notifDot) return;
    DOM.notifDot.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }

  function formatAge(createdAtMs) {
    const ms = Math.max(0, Date.now() - Number(createdAtMs || 0));
    const sec = Math.floor(ms / 1000);
    if (sec < 10) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  }

  function iconFor(type) {
    const t = String(type || '').toLowerCase();
    if (t.includes('match')) return 'fa-heart';
    if (t.includes('bill') || t.includes('pay')) return 'fa-credit-card';
    if (t.includes('security') || t.includes('auth')) return 'fa-shield-halved';
    if (t.includes('message') || t.includes('chat')) return 'fa-message';
    return 'fa-bell';
  }

  function render(items) {
    if (!DOM.notifList) return;

    DOM.notifList.innerHTML = '';
    const safeItems = Array.isArray(items) ? items : [];

    if (!safeItems.length) {
      const empty = document.createElement('div');
      empty.className = 'notif-empty';
      empty.textContent = 'No notifications yet.';
      DOM.notifList.appendChild(empty);
      setDot(0);
      return;
    }

    let unreadCount = 0;

    safeItems.forEach(n => {
      const notif = n || {};
      const isUnread = !notif.readAtMs;
      if (isUnread) unreadCount += 1;

      const row = document.createElement('div');
      row.className = `notif-item${isUnread ? ' is-unread' : ''}`;

      const iconWrap = document.createElement('div');
      iconWrap.className = 'notif-icon';
      const icon = document.createElement('i');
      icon.className = `fa-solid ${iconFor(notif.type)}`;
      iconWrap.appendChild(icon);

      const textWrap = document.createElement('div');
      textWrap.className = 'notif-text';

      const title = document.createElement('div');
      title.className = 'notif-title';
      title.textContent = String(notif.title || 'Notification');

      const msg = document.createElement('div');
      msg.className = 'notif-msg';
      msg.textContent = String(notif.message || '');

      const time = document.createElement('div');
      time.className = 'notif-time';
      time.textContent = formatAge(notif.createdAtMs);

      textWrap.appendChild(title);
      if (msg.textContent) textWrap.appendChild(msg);
      textWrap.appendChild(time);

      row.appendChild(iconWrap);
      row.appendChild(textWrap);

      // Optional click-through
      if (notif.href) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
          try { window.location.href = notif.href; } catch (_) {}
        });
      }

      DOM.notifList.appendChild(row);
    });

    setDot(unreadCount);
  }

  async function load({ force = false } = {}) {
    if (!DOM.notifList) return;

    const now = Date.now();
    if (!force && cache.ts && (now - cache.ts) < CACHE_MS) {
      render(cache.items);
      return;
    }

    // Loading state
    DOM.notifList.innerHTML = '';
    const loading = document.createElement('div');
    loading.className = 'notif-empty';
    loading.textContent = 'Loading...';
    DOM.notifList.appendChild(loading);

    const resp = await apiGet('/api/me/notifications?limit=30');
    if (!resp || !resp.ok) {
      DOM.notifList.innerHTML = '';
      const err = document.createElement('div');
      err.className = 'notif-empty';
      err.textContent = 'Failed to load notifications.';
      DOM.notifList.appendChild(err);
      setDot(0);
      return;
    }

    const items = Array.isArray(resp.items) ? resp.items : [];
    cache = { ts: Date.now(), items };
    render(items);
  }

  async function markAllRead() {
    const resp = await apiPost('/api/me/notifications/mark-all-read', {});
    if (!resp || !resp.ok) {
      showToast('Failed to mark notifications as read.', 'error');
      return;
    }

    const now = Date.now();
    cache.items = (cache.items || []).map(n => ({ ...(n || {}), readAtMs: now }));
    cache.ts = Date.now();
    render(cache.items);
    setDot(0);
  }

  return { load, render, markAllRead };
})();

// ---------------------------------------------------------------------
// EVENT LISTENERS
// ---------------------------------------------------------------------

function setupEventListeners() {
  // 1. Tabs
  DOM.tabs.forEach(tab => {
    if (tab.dataset.panel) {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveTab(tab.dataset.panel);
        });
    }
  });
  

  // 1b. Upgrade button (opens Tier page)
  const btnUpgradeNav = document.getElementById('btnNavUpgrade');
  if (btnUpgradeNav) {
    btnUpgradeNav.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = './tier.html?upgrade=1';
    });
  }

  // 2. Notifications (Dashboard bell)
  if (DOM.btnNotifToggle && DOM.notifDropdown) {
      // Prevent inside clicks from closing the dropdown
      DOM.notifDropdown.addEventListener('click', (e) => e.stopPropagation());

      DOM.btnNotifToggle.addEventListener('click', async (e) => {
         e.preventDefault();
         e.stopPropagation();

         const willOpen = !DOM.notifDropdown.classList.contains('is-visible');
         DOM.notifDropdown.classList.toggle('is-visible');

         if (willOpen) {
           await NotificationsController.load();
         }
      });

      if (DOM.btnNotifMarkAllRead) {
        DOM.btnNotifMarkAllRead.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await NotificationsController.markAllRead();
        });
      }

      window.addEventListener('click', () => {
          DOM.notifDropdown.classList.remove('is-visible');
      });
  }

  // 4. Matches & Chat Click
  const handleMatchClick = (e) => {
      const btn = e.target.closest('.btn-chat-action');
      const card = e.target.closest('.match-card');
      const item = e.target.closest('.story-item');
      
      let name, imgColor, msg;
      
      if (card || btn) {
          const targetCard = btn ? btn.closest('.match-card') : card;
          if(targetCard) {
              name = targetCard.querySelector('.match-name').textContent.split(',')[0];
              imgColor = targetCard.querySelector('.match-img').style.backgroundColor;
              msg = targetCard.dataset.msg; 
              openChatModal(name, imgColor, msg, targetCard.dataset.email || '', targetCard.dataset.photoUrl || '');
          }
      } else if (item) {
          name = item.dataset.name;
          imgColor = item.querySelector('.story-img').style.backgroundColor;
          openChatModal(name, imgColor, "New match 🔥", item.dataset.email || '', item.dataset.photoUrl || '');
      }
  };
  if (DOM.matchesContainer) DOM.matchesContainer.addEventListener('click', handleMatchClick);
  if (DOM.newMatchesRail) DOM.newMatchesRail.addEventListener('click', handleMatchClick);

  // Matches search (filters both rail + messages)
  if (DOM.matchSearch) {
    DOM.matchSearch.addEventListener('input', (e) => {
      applyMatchesSearch(String((e && e.target && e.target.value) || ''));
    });
  }

  // 5. Modals Close
  if (DOM.btnCloseChat && DOM.dlgChat) DOM.btnCloseChat.addEventListener('click', () => { stopChatPolling(); DOM.dlgChat.close(); });
  if (DOM.dlgChat) DOM.dlgChat.addEventListener('close', () => { stopChatPolling(); });

  // Chat Send
  if (DOM.btnChatSend) DOM.btnChatSend.addEventListener('click', (e) => { e.preventDefault(); sendChatMessage(); });
  if (DOM.chatInput) DOM.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
  });

  // 6. Logout
  const handleLogout = (e) => {
      e.preventDefault();

      // Best-effort server logout (cookie/session). Do not block UI.
      try {
        const url = '/api/auth/logout';
        if (navigator && typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-TM-Request': '1' },
            body: JSON.stringify({}),
            keepalive: true,
          }).catch(() => {});
        }
      } catch (_) {}

      clearSession();
      sessionStorage.clear();
      window.location.href = '/index.html';
  };
  if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', handleLogout);
  if (DOM.btnMobileLogout) DOM.btnMobileLogout.addEventListener('click', handleLogout);

  // 7. Profile Editing
  if (DOM.btnEditProfile) {
    DOM.btnEditProfile.addEventListener('click', () => {
      state.selectedAvatarDataUrl = null;
      syncFormToState();
      applyAdvancedPrefsLock();
      DOM.dlgProfile.showModal();
    });
  }
  if (DOM.btnCloseProfile) DOM.btnCloseProfile.addEventListener('click', () => DOM.dlgProfile.close());

  // Avatar selection (same as Preferences behavior)
  if (DOM.btnPickAvatar && DOM.inpAvatarFile) {
    DOM.btnPickAvatar.addEventListener('click', (e) => {
      e.preventDefault();
      DOM.inpAvatarFile.click();
    });
  }
  // Clicking the avatar preview shows full size (file selection stays on "Change photo")
  const avatarZoomTarget = DOM.btnAvatarZoom || DOM.dlgAvatarPreview;
  if (avatarZoomTarget && DOM.dlgAvatarPreview) {
    avatarZoomTarget.addEventListener('click', (e) => {
      e.preventDefault();
      openAvatarLightbox(DOM.dlgAvatarPreview.src);
    });
  }

  // Lightbox close controls
  if (DOM.btnCloseAvatarLightbox) DOM.btnCloseAvatarLightbox.addEventListener('click', closeAvatarLightbox);
  if (DOM.avatarLightbox) {
    DOM.avatarLightbox.addEventListener('click', (e) => {
      if (e.target === DOM.avatarLightbox) closeAvatarLightbox();
    });
  }
  if (DOM.inpAvatarFile) {
    DOM.inpAvatarFile.addEventListener('change', async () => {
      const file = DOM.inpAvatarFile.files && DOM.inpAvatarFile.files[0];
      if (!file) return;
      if (!file.type || !file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        DOM.inpAvatarFile.value = '';
        return;
      }
      try {
        const optimized = await fileToOptimizedSquareDataUrl(file);
        state.selectedAvatarDataUrl = optimized;
        if (DOM.dlgAvatarPreview) DOM.dlgAvatarPreview.src = optimized;
        if (DOM.avatarFilename) DOM.avatarFilename.textContent = file.name;
      } catch (err) {
        console.error(err);
        const code = err && (err.code || err.message || '');
        if (code === 'unsupported_format' || /heic|heif/i.test(String(code))) {
          showToast('This photo format isn’t supported (HEIC). Please convert it to JPG or PNG then try again.', 'error');
        } else {
          showToast('Failed to process that image. Please try another photo.', 'error');
        }
      } finally {
        // Allow re-selecting the same file again
        DOM.inpAvatarFile.value = '';
      }
    });
  }

  
// 8. Change Password
if (DOM.btnChangePassword) DOM.btnChangePassword.addEventListener('click', () => {
  if (!DOM.dlgPassword) return;
  DOM.dlgPassword.showModal();
  try { (DOM.inpCurrentPassword || DOM.inpNewPassword)?.focus(); } catch {}
});

if (DOM.btnCancelPassword) DOM.btnCancelPassword.addEventListener('click', () => {
  resetPasswordForm();
  if (DOM.dlgPassword) DOM.dlgPassword.close();
});

if (DOM.frmPassword) DOM.frmPassword.addEventListener('submit', async (e) => {
  e.preventDefault();
  await handlePasswordChange();
});

  // 9. Creators & Premium
  const openCreator = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const cs = normalizeStatus(state.me && state.me.creatorStatus);

    // Feature flag: kapag sarado ang applications, huwag mag-open ng apply modal (except pending/approved)
    if (!CREATOR_APPLICATION_OPEN && cs !== 'pending' && cs !== 'approved') {
      showToast('Creator applications are currently closed.', 'info');
      return;
    }

    // If already approved, go straight to Creators
    if (cs === 'approved') {
      window.location.href = 'creators.html';
      return;
    }

    // If pending, allow view-only and start watcher
    if (cs === 'pending') {
      showToast('Creator application is pending. You will be redirected once approved.', 'info');
      hydrateCreatorApplyFormFromState();
      setCreatorApplyFormReadOnly(true);
      if (DOM.dlgCreatorApply) DOM.dlgCreatorApply.showModal();
      startCreatorApprovalWatcher();
      return;
    }

    // rejected/none: allow apply (prefill if we have previous data)
    hydrateCreatorApplyFormFromState();
    setCreatorApplyFormReadOnly(false);
    if (DOM.dlgCreatorApply) DOM.dlgCreatorApply.showModal();
  };

  if (DOM.btnOpenCreatorApply) DOM.btnOpenCreatorApply.addEventListener('click', openCreator);
  if (DOM.btnCloseCreatorApply) DOM.btnCloseCreatorApply.addEventListener('click', () => {
    setCreatorApplyFormReadOnly(false);
    if (DOM.dlgCreatorApply) DOM.dlgCreatorApply.close();
  });

  const openPremium = (e) => {
      // Sidebar "Subscribe" should always go to plans
      if (e && e.currentTarget && (e.currentTarget.id === 'btnSidebarSubscribe' || e.currentTarget.id === 'btnSidebarSubscribeMobile')) {
          window.location.href = './tier.html?upgrade=1';
          return;
      }

      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }

      const ps = normalizeStatus(state.me && state.me.premiumStatus);

      // If already approved, go straight to Premium Society
      if (ps === 'approved') {
          window.location.href = 'premium-society.html';
          return;
      }

      // If pending, show the modal (read-only) and start watching for approval
      if (ps === 'pending') {
          showToast('Premium Society application is pending. You will be redirected once approved.', 'info');
          if (DOM.dlgPremiumApply) DOM.dlgPremiumApply.showModal();
          startPremiumApprovalWatcher();
          return;
      }

      // Otherwise, allow user to apply
      if (DOM.dlgPremiumApply) DOM.dlgPremiumApply.showModal();
  };  if (DOM.btnOpenPremiumApply) DOM.btnOpenPremiumApply.addEventListener('click', openPremium);
  if (DOM.btnPremiumCancel) DOM.btnPremiumCancel.addEventListener('click', () => DOM.dlgPremiumApply.close());
  if (DOM.btnSidebarSubscribe) DOM.btnSidebarSubscribe.addEventListener('click', openPremium);
  if (DOM.btnSidebarSubscribeMobile) DOM.btnSidebarSubscribeMobile.addEventListener('click', openPremium);

  // 10. Forms
  if (DOM.frmProfile) {
    DOM.frmProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleProfileSave();
    });
  }
  if (DOM.frmCreatorApply) {
    DOM.frmCreatorApply.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleCreatorApplicationSubmit();
    });
  }

  if (DOM.frmPremiumApply) {
    DOM.frmPremiumApply.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handlePremiumApplicationSubmit();
    });

    // Extra safety: handle direct click on the submit button (dialog forms can be flaky in some browsers)
    if (DOM.btnPremiumSubmit) {
      DOM.btnPremiumSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const form = DOM.frmPremiumApply;
        if (form && !form.checkValidity()) {
          form.reportValidity();
          return;
        }
        await handlePremiumApplicationSubmit();
      });
    }
  }

  if (DOM.btnGoCreatorsPage) DOM.btnGoCreatorsPage.addEventListener('click', () => {
    window.location.href = 'creators.html';
  });

  if (DOM.btnGoPremiumPage) DOM.btnGoPremiumPage.addEventListener('click', () => {
    window.location.href = 'premium-society.html';
  });


  // 11. Backdrop Closing
  enableBackdropClose(DOM.dlgProfile);
  enableBackdropClose(DOM.dlgPassword);
  enableBackdropClose(DOM.dlgPremiumApply);
  enableBackdropClose(DOM.dlgCreatorApply);
  if (DOM.dlgCreatorApply) {
    DOM.dlgCreatorApply.addEventListener('close', () => {
      // Ensure we never leave the form stuck in read-only mode
      setCreatorApplyFormReadOnly(false);
    });
  }
  enableBackdropClose(DOM.dlgChat); 

  // 12. Swipe Controls
  const handlePass = () => SwipeController.pass();
  const handleLike = () => SwipeController.like();
  const handleSuper = () => SwipeController.superLike();

  if (DOM.btnSwipePass) DOM.btnSwipePass.addEventListener('click', handlePass);
  if (DOM.btnSwipeLike) DOM.btnSwipeLike.addEventListener('click', handleLike);
  if (DOM.btnSwipeSuper) DOM.btnSwipeSuper.addEventListener('click', handleSuper);
  if (DOM.btnRefreshSwipe) DOM.btnRefreshSwipe.addEventListener('click', () => SwipeController.init());
  
  document.addEventListener('keydown', (e) => {
      if(state.activeTab !== 'swipe') return;
      if(e.key === 'ArrowLeft') handlePass();
      if(e.key === 'ArrowRight') handleLike();
      if(e.key === 'ArrowUp') handleSuper();
  });
}

function applyMatchesSearch(rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase();

  // Filter match cards
  if (DOM.matchesContainer) {
    const cards = Array.from(DOM.matchesContainer.querySelectorAll('.match-card'));
    cards.forEach(card => {
      const name = String(card.dataset.name || '').toLowerCase();
      const email = String(card.dataset.email || '').toLowerCase();
      const msg = String(card.dataset.msg || '').toLowerCase();
      const last = String(card.querySelector('.match-last')?.textContent || '').toLowerCase();
      const hay = (name + ' ' + email + ' ' + msg + ' ' + last).trim();
      const show = !q || hay.includes(q);
      card.style.display = show ? '' : 'none';
    });
  }

  // Filter new matches rail
  if (DOM.newMatchesRail) {
    const items = Array.from(DOM.newMatchesRail.querySelectorAll('.story-item'));
    items.forEach(item => {
      const name = String(item.dataset.name || '').toLowerCase();
      const email = String(item.dataset.email || '').toLowerCase();
      const show = !q || name.includes(q) || email.includes(q);
      item.style.display = show ? '' : 'none';
    });
  }
}



// ---------------------------------------------------------------------
// MOBILE MENU CONTROLLER
// ---------------------------------------------------------------------

function setupMobileMenu() {
    const sidebar = document.getElementById('mainSidebar');
    const menuBtn = document.getElementById('mobileNavToggle');

    // Hamburger Menu Logic
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Toggle Sidebar
            sidebar.classList.toggle('is-open');

            // Toggle Icon
            const isOpen = sidebar.classList.contains('is-open');
            menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('is-open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('is-open');
                menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });
    }
}

// ---------------------------------------------------------------------
// TAB SWITCHING
// ---------------------------------------------------------------------

function setActiveTab(tabName) {

  // Access redirect (when approved by admin)
  if (state && state.me) {
    const cst = normalizeStatus(state.me.creatorStatus);
    const pst = normalizeStatus(state.me.premiumStatus);
    if (tabName === 'creators' && cst === 'approved') {
      window.location.href = 'creators.html';
      return;
    }
    if (tabName === 'premium' && pst === 'approved') {
      window.location.href = 'premium-society.html';
      return;
    }
  }
  state.activeTab = tabName;
  // Creators watcher should only run while user is on Creators tab.
  if (tabName === 'creators') startCreatorApprovalWatcher();
  else stopCreatorApprovalWatcher();
  // 1. Update Navigation State
  DOM.tabs.forEach(t => {
    if (t.dataset.panel === tabName) t.classList.add('is-active');
    else t.classList.remove('is-active');
  });

  // 2. Show Correct Panel & Fix Layout
  DOM.panels.forEach(p => {
    if (p.dataset.panel === tabName) {
      p.hidden = false;
      p.classList.add('is-active');

      // SPECIAL FIX FOR HOME PANEL: Push footer to bottom
      if (tabName === 'home') {
          p.style.display = 'flex';
          p.style.flexDirection = 'column';
          p.style.justifyContent = 'space-between';
          p.style.minHeight = '100%'; 
      } else if (tabName === 'premium') {
          // SPECIAL FIX FOR PREMIUM PANEL: Center content
          p.style.display = 'flex';
          p.style.flexDirection = 'column';
          p.style.alignItems = 'center';
          p.style.justifyContent = 'center';
          p.style.height = '100%';
      } else {
          p.style.display = 'block';
          p.style.height = 'auto';
          p.style.minHeight = '0';
      }

      // Mobile: Scroll to top
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
      p.hidden = true;
      p.classList.remove('is-active');
      p.style.display = 'none';
    }
  });

  // 3. Auto-Close Mobile Menu
  const sidebar = document.getElementById('mainSidebar');
  const menuBtn = document.getElementById('mobileNavToggle');
  if(sidebar && sidebar.classList.contains('is-open')) {
      sidebar.classList.remove('is-open');
      if(menuBtn) menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }


  // 4. Persist last active tab (used on reload)
  try { localStorage.setItem('tm_activeTab', tabName); } catch {}

  // 5. Lazy-load panel data when the tab becomes active
  try { onPanelActivated(tabName); } catch {}
}

function onPanelActivated(tabName) {
  if (tabName === 'home') {
    loadHomePanels(false);
  }
  if (tabName === 'matches') {
    loadMatchesPanel();
  }
  if (tabName === 'shortlist') {
    loadShortlistPanel();
  }
  if (tabName === 'concierge') {
    loadConciergePanel();
  }
}



// ---------------------------------------------------------------------
// HOME: REAL DATA (Who Liked You + Active Nearby)
// ---------------------------------------------------------------------
const HOME_CACHE_MS = 15000;

async function loadHomePanels(force = false) {
  // Home widgets are safe to load in parallel.
  await Promise.allSettled([
    loadAdmirersPanel(force),
    loadActiveNearbyPanel(force),
  ]);
}

async function loadAdmirersPanel(force = false) {
  if (!DOM.admirerContainer) return;
  if (state.homeLoading && state.homeLoading.admirers) return;

  const now = Date.now();
  if (!force && state.homeCache && (now - (state.homeCache.admirersTs || 0) < HOME_CACHE_MS)) return;

  if (state.homeLoading) state.homeLoading.admirers = true;

  try {
    const resp = await apiGet('/api/me/admirers?limit=12');
    if (resp && resp.ok) {
      renderAdmirersPanel(resp);
      if (state.homeCache) state.homeCache.admirersTs = now;
    } else {
      // Keep empty state copy; useful when server hasn't been deployed yet.
      console.warn('Admirers load failed:', resp);
    }
  } catch (err) {
    console.warn('Admirers load error:', err);
  } finally {
    if (state.homeLoading) state.homeLoading.admirers = false;
  }
}

function renderAdmirersPanel(payload) {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const count = Math.max(0, Number(payload && payload.count || 0) || 0);
  const locked = !!(payload && payload.locked) || state.plan === 'free';

  if (DOM.admirerCount) DOM.admirerCount.textContent = `${count} New`;

  // Empty
  if (!count) {
    DOM.admirerContainer.innerHTML = "<div class='tiny muted' style='padding:12px 2px;'>No likes yet. When someone likes you, they’ll appear here.</div>";
    return;
  }

  if (locked) {
    const preview = Math.min(4, Math.max(1, count));
    let html = '';
    for (let i = 0; i < preview; i++) {
      html += `
        <div class="admirer-row" style="justify-content:flex-start; gap:15px;" data-locked="1">
          <img class="admirer-img-blur" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
          <div class="admirer-info" style="flex:1; text-align:left;">
            <div class="admirer-name">Someone</div>
            <div class="admirer-meta">Upgrade to see</div>
          </div>
          <div class="admirer-action"><i class="fa-solid fa-lock"></i></div>
        </div>`;
    }
    DOM.admirerContainer.innerHTML = html;

    // Clicking any row -> Premium tab
    DOM.admirerContainer.querySelectorAll('.admirer-row').forEach(row => {
      row.addEventListener('click', () => {
        const btn = document.querySelector('button[data-panel="premium"]');
        if (btn) btn.click();
      });
    });
    return;
  }

  // Unlocked list
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) {
    DOM.admirerContainer.innerHTML = "<div class='tiny muted' style='padding:12px 2px;'>Likes are loading… try again in a moment.</div>";
    return;
  }

  let html = '';
  items.forEach(it => {
    const name = esc(it.name || 'Member');
    const age = it.age ? `, ${esc(it.age)}` : '';
    const city = esc(it.city || '');
    const photo = it.photoUrl ? esc(it.photoUrl) : 'assets/images/truematch-mark.png';
    const hasPhoto = !!it.photoUrl;

    html += `
      <div class="admirer-row" data-email="${esc(it.email || '')}" data-name="${name}" data-age="${esc(it.age || '')}" data-city="${city}" data-photo="${esc(it.photoUrl || '')}" style="justify-content:flex-start; gap:15px;">
        <img class="${hasPhoto ? 'admirer-img' : 'admirer-img'}" src="${photo}" style="background:${hasPhoto ? 'transparent' : getRandomColor()}; object-fit:${hasPhoto ? 'cover' : 'contain'}">
        <div class="admirer-info" style="flex:1; text-align:left;">
          <div class="admirer-name">${name}${age}</div>
          <div class="admirer-meta">${city || '—'}</div>
        </div>
        <div class="admirer-action"><i class="fa-solid fa-heart"></i></div>
      </div>`;
  });

  DOM.admirerContainer.innerHTML = html;

  DOM.admirerContainer.querySelectorAll('.admirer-row[data-email]').forEach(row => {
    row.addEventListener('click', () => {
      const email = String(row.dataset.email || '').toLowerCase();
      if (!email) return;

      const profile = {
        id: email,
        email,
        name: row.dataset.name || 'Member',
        age: row.dataset.age || '',
        city: row.dataset.city || '',
        photoUrl: row.dataset.photo || ''
      };

      try { setActiveTab('swipe'); } catch {}
      try {
        if (SwipeController && typeof SwipeController.jumpTo === 'function') {
          SwipeController.jumpTo(profile);
        } else {
          toast('Opening profile…', 'info');
        }
      } catch {
        toast('Opening profile…', 'info');
      }
    });
  });
}

async function loadActiveNearbyPanel(force = false) {
  if (!DOM.activeNearbyContainer && !DOM.homeActiveNearbyContainer) return;
  if (state.homeLoading && state.homeLoading.nearby) return;

  const now = Date.now();
  if (!force && state.homeCache && (now - (state.homeCache.nearbyTs || 0) < HOME_CACHE_MS)) return;

  if (state.homeLoading) state.homeLoading.nearby = true;

  try {
    const resp = await apiGet('/api/me/active-nearby?limit=9');
    if (resp && resp.ok) {
      renderActiveNearbyPanel(resp);
      if (state.homeCache) state.homeCache.nearbyTs = now;
    } else {
      console.warn('Active nearby load failed:', resp);
    }
  } catch (err) {
    console.warn('Active nearby load error:', err);
  } finally {
    if (state.homeLoading) state.homeLoading.nearby = false;
  }
}

function renderActiveNearbyPanel(payload) {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const items = Array.isArray(payload.items) ? payload.items : [];

  const targets = [DOM.activeNearbyContainer, DOM.homeActiveNearbyContainer].filter(Boolean);
  if (!targets.length) return;

  if (!items.length) {
    targets.forEach(t => {
      t.innerHTML = "<div class='active-empty tiny muted'>No active users nearby yet.</div>";
    });
    return;
  }

  let html = `<div class="active-grid">`;
  items.forEach(u => {
    const photo = u.photoUrl ? esc(u.photoUrl) : 'assets/images/truematch-mark.png';
    const hasPhoto = !!u.photoUrl;
    html += `
      <div class="active-item" data-email="${esc(u.email || '')}" data-name="${esc(u.name || 'Member')}" data-city="${esc(u.city || '')}" data-age="${esc(u.age || '')}" data-photo="${esc(u.photoUrl || '')}" title="${esc(u.name || 'Member')}">
        <img class="active-img" src="${photo}" style="background:${hasPhoto ? 'transparent' : getRandomColor()}; object-fit:${hasPhoto ? 'cover' : 'contain'};">
        <span class="online-dot"></span>
      </div>`;
  });
  html += `</div>`;

  targets.forEach(t => {
    t.innerHTML = html;

    t.querySelectorAll('.active-item').forEach(el => {
      el.addEventListener('click', () => {
        const email = String(el.dataset.email || '').toLowerCase();
        if (!email) return;

        const profile = {
          id: email,
          email,
          name: el.dataset.name || 'Member',
          age: el.dataset.age || '',
          city: el.dataset.city || '',
          photoUrl: el.dataset.photo || ''
        };

        try { setActiveTab('swipe'); } catch {}
        try {
          if (SwipeController && typeof SwipeController.jumpTo === 'function') {
            SwipeController.jumpTo(profile);
          } else {
            toast('Opening profile…', 'info');
          }
        } catch {
          toast('Opening profile…', 'info');
        }
      });
    });
  });
}



// ---------------------------------------------------------------------
// MODAL HELPERS
// ---------------------------------------------------------------------

// Chat (modal) polling + smart scroll
const CHAT_POLL_MS = 4000;
const INBOX_POLL_MS = 12000;

function isChatModalOpen() {
  return !!(DOM.dlgChat && DOM.dlgChat.open);
}

function getChatBottomOffsetPx() {
  if (!DOM.chatBody) return 0;
  const el = DOM.chatBody;
  const scrollH = Number(el.scrollHeight || 0);
  const scrollTop = Number(el.scrollTop || 0);
  const clientH = Number(el.clientHeight || 0);
  return Math.max(0, scrollH - scrollTop - clientH);
}

function isChatNearBottom(thresholdPx = 110) {
  return getChatBottomOffsetPx() <= thresholdPx;
}

function bindChatScrollTracker() {
  if (!DOM.chatBody) return;
  if (state.chatScrollBound) return;

  state.chatScrollBound = true;
  // Keep an up-to-date "near bottom" flag so renders don't yank the user to the bottom.
  DOM.chatBody.addEventListener('scroll', () => {
    state.chatIsNearBottom = isChatNearBottom();
    if (state.chatIsNearBottom) {
      // User is at bottom again; allow future "new message" toasts.
      state.chatNewToastShown = false;
    }
  }, { passive: true });
}

async function pollChatThreadOnce() {
  if (!isChatModalOpen()) return;
  if (!state.currentChatPeerEmail) return;
  await loadAndRenderThread(state.currentChatPeerEmail);
}

function startChatPolling({ immediate = false } = {}) {
  stopChatPolling();

  if (!isChatModalOpen()) return;
  if (!state.currentChatPeerEmail) return;

  state.chatPollTimer = setInterval(() => {
    // Don't await inside interval; loadAndRenderThread already has its own try/catch.
    pollChatThreadOnce();
  }, CHAT_POLL_MS);

  if (immediate) pollChatThreadOnce();
}

function stopChatPolling() {
  if (state.chatPollTimer) {
    try { clearInterval(state.chatPollTimer); } catch {}
    state.chatPollTimer = null;
  }
}

function updateMatchPreview(peerEmail, lastText, { bumpToTop = true } = {}) {
  const email = String(peerEmail || '').trim().toLowerCase();
  if (!email) return;
  const text = String(lastText || '').trim();
  if (!text) return;

  if (!DOM.matchesContainer) return;

  // Find match card by data-email (case-insensitive)
  const cards = Array.from(DOM.matchesContainer.querySelectorAll('.match-card'));
  const card = cards.find(c => String(c.dataset.email || '').trim().toLowerCase() === email);
  if (!card) return;

  // Update stored preview (used by click handler + search)
  card.dataset.msg = text;
  const lastEl = card.querySelector('.match-last');
  if (lastEl) lastEl.textContent = text;

  // Optional: move active conversation to top (like real inbox behavior)
  if (bumpToTop && card.parentElement) {
    const parent = card.parentElement;
    if (parent.firstElementChild !== card) {
      parent.insertBefore(card, parent.firstElementChild);
    }
  }
}

function setMatchUnread(peerEmail, hasUnread) {
  const email = String(peerEmail || '').trim().toLowerCase();
  if (!email) return;
  if (!DOM.matchesContainer) return;

  const cards = Array.from(DOM.matchesContainer.querySelectorAll('.match-card'));
  const card = cards.find(c => String(c.dataset.email || '').trim().toLowerCase() === email);
  if (!card) return;

  const badge = card.querySelector('.match-unread-badge');
  if (badge) {
    badge.style.display = hasUnread ? 'block' : 'none';
  }
  card.dataset.unread = hasUnread ? '1' : '0';

  const lastEl = card.querySelector('.match-last');
  if (lastEl) {
    if (hasUnread) {
      lastEl.style.fontWeight = '700';
      lastEl.style.color = '#fff';
    } else {
      lastEl.style.fontWeight = '';
      lastEl.style.color = '';
    }
  }
}

function startInboxPolling({ immediate = false } = {}) {
  stopInboxPolling();

  if (!state.me || !state.me.email) return;

  state.inboxPollTimer = setInterval(() => {
    pollInboxOnce();
  }, INBOX_POLL_MS);

  if (immediate) pollInboxOnce();
}

function stopInboxPolling() {
  if (state.inboxPollTimer) {
    try { clearInterval(state.inboxPollTimer); } catch {}
    state.inboxPollTimer = null;
  }
}

async function pollInboxOnce() {
  try {
    if (!state.me || !state.me.email) return;

    const res = await apiGet('/api/messages');
    if (!res || !res.ok) return;

    const threads = Array.isArray(res.threads) ? res.threads : [];
    if (!threads.length) return;

    state.inboxThreadState = state.inboxThreadState && typeof state.inboxThreadState === 'object'
      ? state.inboxThreadState
      : {};

    for (const t of threads) {
      const peer = String(t.peerEmail || '').trim().toLowerCase();
      if (!peer) continue;

      const lastMessage = String(t.lastMessage || '').trim();
      const lastMessageAtMs = Number(t.lastMessageAtMs || 0);
      const lastReadAtMs = Number(t.lastReadAtMs || 0);
      const hasUnread = (lastMessageAtMs > lastReadAtMs) && (lastMessageAtMs > 0);

      const prev = state.inboxThreadState[peer] || {};
      const prevLastAt = Number(prev.lastMessageAtMs || 0);
      const changedLast = lastMessageAtMs > 0 && lastMessageAtMs !== prevLastAt;

      // Update preview only when last message changed.
      if (changedLast && lastMessage) {
        // Bump only when it looks like a new incoming unread message.
        updateMatchPreview(peer, lastMessage, { bumpToTop: hasUnread });
      }

      setMatchUnread(peer, hasUnread);

      state.inboxThreadState[peer] = { lastMessageAtMs, lastReadAtMs };
    }
  } catch (e) {
    // silent
  }
}

async function openChatModal(name, imgColor, lastMsg, peerEmail, peerPhotoUrl) {
  if (!DOM.dlgChat) return;

  // Switching chats / reopening: always reset polling + "new message" signals.
  stopChatPolling();
  state.chatLastSig = '';
  state.chatNewToastShown = false;

  state.currentChatPeerEmail = String(peerEmail || '').toLowerCase();
  state.currentChatPeerName = name || 'Match';
  state.currentChatPeerPhoto = peerPhotoUrl || '';

  const avatarEl = DOM.chatUserImg || DOM.chatAvatar;
  if (avatarEl) {
    const isImg = avatarEl.tagName && avatarEl.tagName.toLowerCase() === 'img';
    const hasPhoto = !!state.currentChatPeerPhoto;
    if (isImg) {
      avatarEl.src = hasPhoto ? state.currentChatPeerPhoto : 'assets/images/truematch-mark.png';
      avatarEl.style.backgroundColor = hasPhoto ? 'transparent' : (imgColor || '#3AAFB9');
      avatarEl.style.objectFit = hasPhoto ? 'cover' : 'contain';
    } else {
      avatarEl.style.background = imgColor || '#3AAFB9';
      avatarEl.style.backgroundImage = hasPhoto ? `url('${state.currentChatPeerPhoto}')` : 'none';
      avatarEl.style.backgroundSize = hasPhoto ? 'cover' : 'auto';
      avatarEl.style.backgroundPosition = 'center';
    }
  }

  const nameEl = DOM.chatUserName || DOM.chatName;
  if (nameEl) nameEl.textContent = state.currentChatPeerName;

  // Reset header meta line (presence is a placeholder for now)
  if (DOM.chatReceiptLine) {
    DOM.chatReceiptLine.textContent = '● Online';
  }

  // Clear body and show initial hint
  if (DOM.chatBody) DOM.chatBody.innerHTML = '';
  DOM.dlgChat.showModal();

  // Track user scroll so refreshes don't yank the view.
  bindChatScrollTracker();
  state.chatIsNearBottom = true;

  if (!state.currentChatPeerEmail) {
    if (DOM.chatBody) {
      DOM.chatBody.innerHTML = '<p style="margin:0; color:rgba(255,255,255,0.7);">No chat recipient found.</p>';
    }
    return;
  }

  // On first open, always land at the bottom (latest message).
  state.chatForceScrollToBottom = true;
  await loadAndRenderThread(state.currentChatPeerEmail);
  // Clear unread badge (backend also updates lastReadAtMs on thread load).
  try { setMatchUnread(state.currentChatPeerEmail, false); } catch {}

  // Keep the thread fresh while modal is open.
  startChatPolling();

  try { DOM.chatInput && DOM.chatInput.focus(); } catch {}
}



// ---------------------------------------------------------------------
// UI POPULATION LOGIC (FIXED: Card Widths & Backgrounds)
// ---------------------------------------------------------------------

async function loadMatchesPanel() {
  try {
    // Only load when panel exists and user is logged in
    if (!DOM.matchesContainer) return;
    if (!state.me || !state.me.email) return;

    const res = await apiGet('/api/matches');
    if (!res || !res.ok) {
      // keep current UI
      return;
    }

    renderMatchesFromApi(Array.isArray(res.matches) ? res.matches : []);
  } catch (err) {
    console.warn('loadMatchesPanel failed:', err);
  }
}

function renderMatchesFromApi(matches) {
  // Update counters
  const count = matches.length;
  if (DOM.matchCount) DOM.matchCount.textContent = String(count);
  if (DOM.newMatchCount) DOM.newMatchCount.textContent = String(Math.min(count, 6));

  // --- Stories (new matches rail) ---
  if (DOM.newMatchesRail) {
    if (!count) {
      DOM.newMatchesRail.innerHTML = '<div style="color:rgba(255,255,255,0.65); font-size:0.9rem;">No matches yet.</div>';
    } else {
      DOM.newMatchesRail.innerHTML = matches.slice(0, 6).map(m => {
        const safeName = (m.name || 'Match').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const photoUrl = m.photoUrl || '';
        return `
          <div class="story-item" data-name="${safeName}" data-email="${m.email || ''}" data-photo-url="${photoUrl}">
            <div class="story-ring">
              <div class="story-img" style="${photoUrl ? `background-image:url('${photoUrl}')` : ''}"></div>
            </div>
            <div class="story-name">${safeName}</div>
          </div>
        `;
      }).join('');
    }
  }

  // --- Match cards ---
  if (DOM.matchesContainer) {
    if (!count) {
      DOM.matchesContainer.innerHTML = '<div style="color:rgba(255,255,255,0.65);">No matches yet. Keep swiping.</div>';
      return;
    }

    DOM.matchesContainer.innerHTML = matches.map(m => {
      const safeName = (m.name || 'Match').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeSub = (m.city ? m.city : '—');
      const photoUrl = m.photoUrl || '';
      const msg = (m.lastMessage || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const lastAt = Number(m.lastMessageAtMs || 0);
      const readAt = Number(m.lastReadAtMs || 0);
      const hasUnread = !!m.hasUnread || (lastAt > readAt && lastAt > 0);
      const seedColor = getRandomColor();
      const unreadBadge = `<div class="match-unread-badge" style="position:absolute; top:12px; right:12px; width:10px; height:10px; border-radius:999px; background:#3AAFB9; box-shadow:0 0 0 4px rgba(58,175,185,0.15); ${hasUnread ? '' : 'display:none;'}"></div>`;
      const lastStyle = hasUnread ? 'font-weight:700; color:#fff;' : '';
      return `
        <div class="match-card" data-name="${safeName}" data-email="${m.email || ''}" data-photo-url="${photoUrl}" data-msg="${msg}" data-unread="${hasUnread ? '1' : '0'}">
          ${unreadBadge}
          <div class="match-img" style="background-color:${seedColor}; ${photoUrl ? `background-image:url('${photoUrl}'); background-size:cover; background-position:center;` : ''}"></div>
          <div class="match-info">
            <div class="match-name">${safeName}</div>
            <div class="match-sub">${safeSub}</div>
            <div class="match-last" style="${lastStyle}">${msg || 'Tap to chat'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

// --- Matches UI helpers (keep last message preview in sync with chat) ---
function updateMatchPreview(peerEmail, lastText, { bumpToTop = true } = {}) {
  const email = String(peerEmail || '').trim().toLowerCase();
  if (!email) return;
  const text = String(lastText || '').trim();
  if (!text) return;

  if (!DOM.matchesContainer) return;

  // Find match card by data-email (case-insensitive)
  const cards = Array.from(DOM.matchesContainer.querySelectorAll('.match-card'));
  const card = cards.find(c => String(c.dataset.email || '').trim().toLowerCase() === email);
  if (!card) return;

  // Update stored preview (used by click handler + search)
  card.dataset.msg = text;
  const lastEl = card.querySelector('.match-last');
  if (lastEl) lastEl.textContent = text;

  // Optional: move active conversation to top (like real inbox behavior)
  if (bumpToTop && card.parentElement) {
    const parent = card.parentElement;
    if (parent.firstElementChild !== card) {
      parent.insertBefore(card, parent.firstElementChild);
    }
  }
}

}

// --- Messages / Chat ---
async function loadAndRenderThread(peerEmail) {
  try {
    const res = await apiGet('/api/messages/thread/' + encodeURIComponent(peerEmail));
    if (!res || !res.ok) return;

    const planKey = normalizePlanKey(res.plan || state.plan || 'free');
    const messages = Array.isArray(res.messages) ? res.messages : [];
    const usage = res.usage || {};

    renderThreadMessages(messages, planKey, usage);

  } catch (err) {
    console.warn('load thread failed:', err);
  }
}


function renderThreadMessages(messages, planKey, usage) {
  if (!DOM.chatBody) return;

  const body = DOM.chatBody;

  const meEmail = String((state.me && state.me.email) || '').toLowerCase();
  const peerEmail = String(state.currentChatPeerEmail || '').toLowerCase();

  // Preserve user reading position: if the user is not near the bottom, do NOT auto-jump on refresh.
  const prevClientH = Number(body.clientHeight || 0);
  const prevScrollH = Number(body.scrollHeight || 0);
  const prevScrollTop = Number(body.scrollTop || 0);
  const prevFromBottom = Math.max(0, prevScrollH - prevScrollTop - prevClientH);
  const wasNearBottom = state.chatForceScrollToBottom || prevFromBottom <= 110;

  if (!messages.length) {
    body.innerHTML = '<p style="margin:0; color:rgba(255,255,255,0.7);">Start the conversation.</p>';
  } else {
    body.innerHTML = messages.map(msg => {
      const from = String(msg.from || '').toLowerCase();
      const isMe = from === meEmail;
      const safeText = String(msg.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const rowStyle = isMe
        ? 'display:flex; justify-content:flex-end; margin:10px 0;'
        : 'display:flex; justify-content:flex-start; margin:10px 0;';

      const bubbleStyle = isMe
        ? 'max-width:78%; background:rgba(255,255,255,0.12); padding:10px 12px; border-radius:14px; line-height:1.35;'
        : 'max-width:78%; background:rgba(58,175,185,0.18); padding:10px 12px; border-radius:14px; line-height:1.35;';

      return `<div style="${rowStyle}"><div style="${bubbleStyle}">${safeText}</div></div>`;
    }).join('');
  }

  // Read receipt line (Tier1+)
  if (DOM.chatReceiptLine) {
    if (planKey === 'free') {
      DOM.chatReceiptLine.textContent = '● Online';
    } else {
      const lastOut = [...messages].reverse().find(m =>
        String(m.from || '').toLowerCase() === meEmail &&
        String(m.to || '').toLowerCase() === peerEmail
      );
      const seen = !!(lastOut && lastOut.readAt);
      DOM.chatReceiptLine.textContent = seen ? 'Seen' : 'Delivered';
    }
  }

  // Message cap enforcement (free only)
  if (planKey === 'free' && usage && typeof usage.limit === 'number') {
    const remaining = Math.max(0, usage.limit - (usage.sentToday || 0));
    if (DOM.btnChatSend) DOM.btnChatSend.disabled = remaining <= 0;
  } else {
    if (DOM.btnChatSend) DOM.btnChatSend.disabled = false;
  }

  // Signature for "new message" detection (avoid spamming toasts on every poll).
  const last = messages && messages.length ? messages[messages.length - 1] : null;
  const lastKey = last
    ? `${String(last.messageId || last.id || '')}|${String(last.createdAtMs || last.createdAt || '')}|${String(last.from || '')}|${String(last.text || '')}`
    : '';
  const sig = `${messages.length}|${lastKey}`;
  const prevSig = String(state.chatLastSig || '');
  const changed = sig !== prevSig;
  if (changed) state.chatLastSig = sig;

  // Keep Matches list preview in sync with the latest message (if the Matches panel is currently rendered).
  if (changed && last && String(last.text || '').trim()) {
    try { updateMatchPreview(peerEmail, last.text, { bumpToTop: true }); } catch {}
  }

  // Smart scroll:
  // - If user is (or was) at the bottom, keep them at the bottom.
  // - If user scrolled up, preserve their distance from bottom (so the view doesn't jump).
  const forceBottom = !!state.chatForceScrollToBottom;

  if (forceBottom || wasNearBottom) {
    body.scrollTop = body.scrollHeight;
    state.chatNewToastShown = false; // user is at bottom; allow future toasts
  } else {
    const newClientH = Number(body.clientHeight || 0);
    const newScrollH = Number(body.scrollHeight || 0);
    const target = Math.max(0, newScrollH - newClientH - prevFromBottom);
    body.scrollTop = target;
  }

  // If new incoming message arrived while user is reading older messages, show a single toast.
  if (prevSig && changed && !forceBottom && !wasNearBottom) {
    const incoming = !!(last && String(last.from || '').toLowerCase() !== meEmail);
    if (incoming && !state.chatNewToastShown) {
      showToast('New message', 'info');
      state.chatNewToastShown = true;
    }
  }

  // Reset one-shot scroll flag
  state.chatForceScrollToBottom = false;
}

async function sendChatMessage() {
  try {
    if (!state.currentChatPeerEmail) return;
    if (!DOM.chatInput) return;

    const text = String(DOM.chatInput.value || '').trim();
    if (!text) return;

    if (DOM.btnChatSend) DOM.btnChatSend.disabled = true;

    const res = await apiPost('/api/messages/send', { to: state.currentChatPeerEmail, text });

    if (!res || !res.ok) {
      showToast('Unable to send message.', 'error');
      if (DOM.btnChatSend) DOM.btnChatSend.disabled = false;
      return;
    }

    // Update matches preview immediately (optimistic UI)
    try { updateMatchPreview(state.currentChatPeerEmail, text, { bumpToTop: true }); } catch {}

    DOM.chatInput.value = '';
    state.chatForceScrollToBottom = true;
    await loadAndRenderThread(state.currentChatPeerEmail);

    // Free message cap feedback
    if (res.usage && typeof res.usage.limit === 'number') {
      const remaining = Math.max(0, res.usage.limit - (res.usage.sentToday || 0));
      if (remaining <= 0) {
        showToast('Daily message limit reached (20). Upgrade to Plus for unlimited messaging.', 'warning');
      }
    }

    if (DOM.btnChatSend) DOM.btnChatSend.disabled = false;
  } catch (err) {
    const msg = (err && err.message) ? err.message : '';
    if (String(msg).includes('daily_message_limit')) {
      showToast('Daily message limit reached (20). Upgrade to Plus for unlimited messaging.', 'warning');
    } else {
      showToast('Unable to send message.', 'error');
    }
    if (DOM.btnChatSend) DOM.btnChatSend.disabled = false;
  }
}

// --- Shortlist (Tier2+) ---
async function loadShortlistPanel() {
  try {
    if (!DOM.panelShortlistBody) return;

    const plan = normalizePlanKey(state.plan || 'free');
    if (plan !== 'tier2' && plan !== 'tier3') return;

    const res = await apiGet('/api/shortlist');
    if (!res || !res.ok) return;

    renderShortlist(res);
  } catch (err) {
    console.warn('loadShortlistPanel failed:', err);
  }
}

function renderShortlist(res) {
  if (!DOM.panelShortlistBody) return;

  const header = DOM.panelShortlistBody.querySelector('.feed-header');
  let container = DOM.panelShortlistBody.querySelector('.shortlist-wrap');
  if (!container) {
    container = document.createElement('div');
    container.className = 'shortlist-wrap';
    DOM.panelShortlistBody.appendChild(container);
  }

  const items = Array.isArray(res.items) ? res.items : [];
  if (!items.length) {
    container.innerHTML = '<div style="color:rgba(255,255,255,0.7);">No profiles in today\'s shortlist.</div>';
    return;
  }

  container.innerHTML = items.map(p => {
    const safeName = String(p.name || 'Profile').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeCity = String(p.city || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const photoUrl = p.photoUrl || '';
    return `
      <div class="short-card" data-id="${p.id}">
        <div class="short-img" style="${photoUrl ? `background-image:url('${photoUrl}')` : ''}"></div>
        <div class="short-meta">
          <div class="short-name">${safeName}</div>
          <div class="short-sub">${safeCity}</div>
          <div class="short-actions">
            <button class="btn btn--ghost" data-act="pass">Pass</button>
            <button class="btn btn--primary" data-act="approve">Approve</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('button[data-act]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const act = btn.dataset.act;
      const card = btn.closest('.short-card');
      const id = card ? card.dataset.id : '';
      if (!id) return;

      btn.disabled = true;
      try {
        const out = await apiPost('/api/shortlist/decision', { profileId: id, action: act });
        if (out && out.ok) {
          card.remove();
          showToast(act === 'approve' ? 'Approved.' : 'Passed.', 'success');
        } else {
          showToast('Action failed.', 'error');
          btn.disabled = false;
        }
      } catch (_err) {
        showToast('Action failed.', 'error');
        btn.disabled = false;
      }
    });
  });
}

// --- Concierge (Tier3) ---
async function loadConciergePanel() {
  try {
    if (!DOM.panelConciergeBody) return;
    const plan = normalizePlanKey(state.plan || 'free');
    if (plan !== 'tier3') return;

    const [picks, approved, scheduled] = await Promise.all([
      apiGet('/api/shortlist'),
      apiGet('/api/shortlist/approved'),
      apiGet('/api/concierge/scheduled')
    ]);

    renderConciergePanel(picks, approved, scheduled);
  } catch (err) {
    console.warn('loadConciergePanel failed:', err);
  }
}

function renderConciergePanel(picksRes, approvedRes, scheduledRes) {
  if (!DOM.panelConciergeBody) return;

  const picks = (picksRes && picksRes.ok && Array.isArray(picksRes.items)) ? picksRes.items : [];
  const approved = (approvedRes && approvedRes.ok && Array.isArray(approvedRes.items)) ? approvedRes.items : [];
  const scheduled = (scheduledRes && scheduledRes.ok && Array.isArray(scheduledRes.scheduled)) ? scheduledRes.scheduled : [];

  DOM.panelConciergeBody.innerHTML = `
    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 8px 0;">Today's concierge picks</h3>
      <div class="shortlist-wrap" id="conc-picks"></div>
    </div>

    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 8px 0;">Approved profiles</h3>
      <div class="conc-list" id="conc-approved"></div>
    </div>

    <div>
      <h3 style="margin:0 0 8px 0;">Scheduled dates</h3>
      <div class="conc-list" id="conc-scheduled"></div>
    </div>
  `;

  const picksEl = DOM.panelConciergeBody.querySelector('#conc-picks');
  const approvedEl = DOM.panelConciergeBody.querySelector('#conc-approved');
  const scheduledEl = DOM.panelConciergeBody.querySelector('#conc-scheduled');

  // --- Picks (served by admin through /api/admin/shortlist) ---
  if (!picks.length) {
    picksEl.innerHTML = '<div style="color:rgba(255,255,255,0.7);">No concierge picks served yet.</div>';
  } else {
    picksEl.innerHTML = picks.map(p => {
      const safeName = String(p.name || 'Profile').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeCity = String(p.city || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const photoUrl = p.photoUrl || '';
      return `
        <div class="short-card" data-id="${p.id}">
          <div class="short-img" style="${photoUrl ? `background-image:url('${photoUrl}')` : ''}"></div>
          <div class="short-meta">
            <div class="short-name">${safeName}</div>
            <div class="short-sub">${safeCity}</div>
            <div class="short-actions">
              <button class="btn btn--ghost" data-act="pass">Pass</button>
              <button class="btn btn--ghost" data-act="approve">Approve</button>
              <button class="btn btn--primary" data-act="date">Request date</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    picksEl.querySelectorAll('button[data-act]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const act = btn.dataset.act;
        const card = btn.closest('.short-card');
        const id = card ? card.dataset.id : '';
        if (!id) return;

        btn.disabled = true;
        try {
          const out = await apiPost('/api/shortlist/decision', { profileId: id, action: act });
          if (out && out.ok) {
            if (act === 'date') showToast('Date requested. Your concierge is scheduling.', 'success');
            else if (act === 'approve') showToast('Approved.', 'success');
            else showToast('Passed.', 'success');

            await loadConciergePanel();
          } else {
            showToast('Action failed.', 'error');
            btn.disabled = false;
          }
        } catch (_err) {
          showToast('Action failed.', 'error');
          btn.disabled = false;
        }
      });
    });
  }

  // --- Approved (persisted) ---
  if (!approved.length) {
    approvedEl.innerHTML = '<div style="color:rgba(255,255,255,0.7);">No approved profiles yet.</div>';
  } else {
    approvedEl.innerHTML = approved.map(p => {
      const safeName = String(p.name || 'Profile').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeCity = String(p.city || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const photoUrl = p.photoUrl || '';
      return `
        <div class="conc-card" data-id="${p.id}">
          <div class="conc-img" style="${photoUrl ? `background-image:url('${photoUrl}')` : ''}"></div>
          <div class="conc-meta">
            <div class="conc-name">${safeName}</div>
            <div class="conc-sub">${safeCity}</div>
          </div>
          <div class="conc-actions">
            <button class="btn btn--primary" data-act="date">Request date</button>
          </div>
        </div>
      `;
    }).join('');

    approvedEl.querySelectorAll('button[data-act="date"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const card = btn.closest('.conc-card');
        const id = card ? card.dataset.id : '';
        if (!id) return;

        btn.disabled = true;
        try {
          const out = await apiPost('/api/approved/date', { profileId: id });
          if (out && out.ok) {
            showToast('Date requested. Your concierge is scheduling.', 'success');
            await loadConciergePanel();
          } else {
            showToast('Request failed.', 'error');
            btn.disabled = false;
          }
        } catch (_err) {
          showToast('Request failed.', 'error');
          btn.disabled = false;
        }
      });
    });
  }

  // --- Scheduled dates ---
  if (!scheduled.length) {
    scheduledEl.innerHTML = '<div style="color:rgba(255,255,255,0.7);">No scheduled dates yet.</div>';
  } else {
    scheduledEl.innerHTML = scheduled.map(it => {
      const p = it.profile || it;
      const safeName = String(p.name || 'Profile').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeCity = String(p.city || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const when = it.when || it.date || it.time || it.scheduledAt || '';
      return `
        <div class="conc-card">
          <div class="conc-meta">
            <div class="conc-name">${safeName}</div>
            <div class="conc-sub">${safeCity}${when ? ' • ' + String(when) : ''}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}


function renderHomeEmptyStates() {
  if (DOM.admirerCount) DOM.admirerCount.textContent = '0 New';
  if (DOM.admirerContainer) {
    const hasRows = DOM.admirerContainer.querySelector('.admirer-row');
    if (!hasRows) {
      DOM.admirerContainer.innerHTML = "<div class='tiny muted' style='padding:12px 2px;'>No likes yet. When someone likes you, they’ll appear here.</div>";
    }
  }
  if (DOM.activeNearbyContainer) {
    const hasActive = DOM.activeNearbyContainer.querySelector('.active-item');
    if (!hasActive) {
      DOM.activeNearbyContainer.innerHTML = "<div class='active-empty tiny muted'>No active users nearby yet.</div>";
    }
  }
  if (DOM.homeActiveNearbyContainer) {
    const hasActive = DOM.homeActiveNearbyContainer.querySelector('.active-item');
    if (!hasActive) {
      DOM.homeActiveNearbyContainer.innerHTML = "<div class='active-empty tiny muted'>No active users nearby yet.</div>";
    }
  }
}

// ---------------------------------------------------------------------
// BACKEND SYNC
// ---------------------------------------------------------------------


function isProfileCompleteForOnboarding(user) {
  if (!user) return false;
  const ageOk = Number(user.age) >= 18;
  const cityOk = (user.city || '').toString().trim().length > 1;
  const avatarOk = !!(user.avatarUrl || user.avatar || user.photoUrl || user.photo);
  return ageOk && cityOk && avatarOk;
}

async function loadMe() {
  try {
    const data = await apiGet('/api/me');
    const local = safeGetLocalUser();

    let user = null;
    let prefs = {};

    if (!data || !data.ok || !data.user) {
      // If session cookie is missing/expired but local cache exists, allow a soft render
      // (user will still be redirected on any authenticated API calls).
      if (local && (local.email || local.name)) {
        user = local;
        prefs = {};
      } else {
        window.location.href = 'auth.html?mode=login';
        return;
      }
    } else {
      user = data.user;
      prefs = data.prefs || user.preferences || {};
      if (local) {
        if (!user.name && local.name) user.name = local.name;
        if (!user.email && local.email) user.email = local.email;
      }
    }

    // Onboarding enforcement: require preferences + profile photo before showing dashboard
    // (Skip this for demo accounts.)
    if (data && data.ok && data.user && !data.demo) {
      const prefsSaved =
        Boolean(user && user.prefsSaved) ||
        (prefs && typeof prefs === 'object' && Object.keys(prefs).length > 0);

      const profileOk = isProfileCompleteForOnboarding(user);

      if (!prefsSaved || !profileOk) {
        // Force user through Preferences onboarding (profile photo is required there)
        window.location.replace('preferences.html?onboarding=1');
        return;
      }
    }

    state.me = user;
    state.prefs = prefs;

    const rawPlan = (user && (user.plan ?? user.planKey ?? user.tier ?? user.level ?? user.subscriptionTier ?? user.subscription ?? user.currentPlan)) || 'free';
    state.plan = normalizePlanKey(rawPlan);

    renderHome(user);
    renderSettingsDisplay(user, prefs);
    applyPlanNavGating();
    applyAdvancedPrefsLock();

    // Creators & Premium Society entry cards
    renderCreatorPremiumEntryCards();
  } catch (err) {
    console.error("Error loading user:", err);
  }
}

function renderHome(user) {
  if (DOM.homeWelcomeName) {
    const displayName = user?.name || user?.displayName || user?.fullName || 'Member';
    DOM.homeWelcomeName.textContent = displayName.trim();
  }
  if (DOM.homePlanPill) {
    const map = { free: 'Free', tier1: 'Plus', tier2: 'Elite', tier3: 'Concierge' };
    DOM.homePlanPill.textContent = String(map[state.plan] || state.plan || 'Free').toUpperCase();
  }
  if (DOM.homePlanSummary) {
    if (state.plan === 'tier3') DOM.homePlanSummary.textContent = "Concierge Service Active.";
    else if (state.plan === 'tier2') DOM.homePlanSummary.textContent = "Elite Member Access.";
    else if (state.plan === 'tier1') DOM.homePlanSummary.textContent = "Plus Member Access.";
    else DOM.homePlanSummary.textContent = "Upgrade for more daily swipes.";
  }
}

function applyPlanNavGating() {
  const plan = normalizePlanKey(state.plan || 'free');

  // Tabs visible per plan:
  // free: Home, Swipe, Matches, Settings, Creators
  // tier1: (Plus) no Premium Society
  // tier2: + Premium Society + Shortlist
  // tier3: + Concierge
  const allowed = new Set(['home', 'swipe', 'matches', 'settings', 'creators']);

  if (plan === 'tier2' || plan === 'tier3') {
    allowed.add('premium');
  }
  if (plan === 'tier2' || plan === 'tier3') {
    allowed.add('shortlist');
  }
  if (plan === 'tier3') {
    allowed.add('concierge');
  }

  // Hide / show nav buttons + panels
  DOM.tabs.forEach(btn => {
    const tabName = btn.dataset.panel;
    const show = allowed.has(tabName);
    btn.style.display = show ? '' : 'none';
  });

  DOM.panels.forEach((panel) => {
    const panelName = panel.dataset.panel;
    const show = allowed.has(panelName);
    panel.style.display = show ? '' : 'none';
  });

  // If current active tab is not allowed anymore, jump to first allowed
  const activeNow = state.activeTab || localStorage.getItem('tm_activeTab') || 'home';
  if (!allowed.has(activeNow)) {
    const first = ['home', 'swipe', 'matches', 'premium', 'shortlist', 'concierge', 'settings', 'creators']
      .find(t => allowed.has(t)) || 'home';
    setActiveTab(first);
  }
}

function applyAdvancedPrefsLock() {
  if (!DOM.advancedPrefsSection) return;
  // Keep behavior consistent with Preferences page: advanced section is not editable on Free.
  const locked = state.plan === 'free';
  DOM.advancedPrefsSection.classList.toggle('is-locked', locked);
  if (DOM.advLockNote) DOM.advLockNote.hidden = !locked;

  const fields = DOM.advancedPrefsSection.querySelectorAll('select, textarea, input');
  fields.forEach((el) => {
    el.disabled = locked;
  });
}

function getSharedValuesFromUI() {
  if (!DOM.inpSharedValues) return [];
  return Array.from(DOM.inpSharedValues.querySelectorAll('input[type="checkbox"]'))
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function setSharedValuesInUI(values) {
  if (!DOM.inpSharedValues) return;
  const set = new Set(Array.isArray(values) ? values : []);
  Array.from(DOM.inpSharedValues.querySelectorAll('input[type="checkbox"]')).forEach((cb) => {
    cb.checked = set.has(cb.value);
  });
}

function humanizeEthnicity(val) {
  const map = {
    african: 'African',
    asian: 'Asian',
    caucasian: 'Caucasian',
    hispanic: 'Hispanic',
    'middle-eastern': 'Middle Eastern',
    mixed: 'Mixed',
    other: 'Other'
  };
  return map[val] || val || '';
}

function humanizeIntent(val) {
  const map = {
    'long-term': 'Long-term',
    'short-term': 'Short-term',
    open: 'Open'
  };
  return map[val] || (val ? String(val) : '');
}

function renderSettingsDisplay(user, prefs) {
  if (DOM.sNameDisplay) DOM.sNameDisplay.textContent = user?.name || '—';
  if (DOM.sEmailDisplay) {
    const rawEmail = user?.email || '';
    DOM.sEmailDisplay.textContent = maskEmail(rawEmail) || '—';
  }
  if (DOM.sAvatar) DOM.sAvatar.src = user?.avatarUrl || 'assets/images/truematch-mark.png';

  // Profile fields (matches Preferences "Your profile")
  if (DOM.dispCity) DOM.dispCity.textContent = user?.city || '—';

  
  if (DOM.dispAge) DOM.dispAge.textContent = user?.age ? String(user.age) : '—';

  if (DOM.dispProfileGender) {
    const g = String(user?.profileGender || '').toLowerCase();
    DOM.dispProfileGender.textContent = (g === 'women') ? 'Woman' : (g === 'men' ? 'Man' : '—');
  }
// Preferences fields (matches Preferences page)
  const prefCity = prefs?.city || '';
  const ageMin = Number.isFinite(prefs?.ageMin) ? prefs.ageMin : (prefs?.ageMin ? parseInt(prefs.ageMin, 10) : null);
  const ageMax = Number.isFinite(prefs?.ageMax) ? prefs.ageMax : (prefs?.ageMax ? parseInt(prefs.ageMax, 10) : null);

  if (DOM.dispPrefCity) DOM.dispPrefCity.textContent = prefCity || '—';
  if (DOM.dispAgeRange) {
    DOM.dispAgeRange.textContent = (ageMin && ageMax) ? `${ageMin} - ${ageMax}` : '—';
  }
  if (DOM.dispEthnicity) {
    DOM.dispEthnicity.textContent = prefs?.ethnicity ? humanizeEthnicity(prefs.ethnicity) : 'Any';
  }
  if (DOM.dispLooking) {
    const lookingArr = Array.isArray(prefs?.lookingFor) ? prefs.lookingFor : (prefs?.lookingFor ? [prefs.lookingFor] : []);
    const lookingText = lookingArr.length ? lookingArr.map(v => v ? (v[0].toUpperCase() + v.slice(1)) : '').filter(Boolean).join(', ') : '—';
    DOM.dispLooking.textContent = lookingText;
  }
  if (DOM.dispIntent) {
    DOM.dispIntent.textContent = prefs?.intent ? humanizeIntent(prefs.intent) : 'Any';
  }
  if (DOM.dispSharedValues) {
    const vals = Array.isArray(prefs?.sharedValues) ? prefs.sharedValues : [];
    DOM.dispSharedValues.textContent = vals.length ? vals.map(v => v ? (v[0].toUpperCase() + v.slice(1)) : '').filter(Boolean).join(', ') : '—';
  }
  if (DOM.dispDealbreakers) {
    const d = (prefs?.dealbreakers || '').trim();
    DOM.dispDealbreakers.textContent = d ? (d.length > 70 ? `${d.slice(0, 67)}...` : d) : '—';
  }
}

function syncFormToState() {
  const { me, prefs } = state;
  if (!me) return;

  if (DOM.inpName) DOM.inpName.value = me.name || '';
  if (DOM.inpEmail) DOM.inpEmail.value = me.email || '';
  if (DOM.inpCity) DOM.inpCity.value = me.city || '';
  if (DOM.inpUserAge) DOM.inpUserAge.value = me.age || '';
  if (DOM.inpProfileGender) DOM.inpProfileGender.value = me.profileGender || '';

  // Avatar (preview existing unless user selects a new one)
  if (DOM.inpAvatarFile) DOM.inpAvatarFile.value = '';
  if (DOM.avatarFilename) DOM.avatarFilename.textContent = 'No file chosen';
  if (DOM.dlgAvatarPreview) DOM.dlgAvatarPreview.src = me.avatarUrl || 'assets/images/truematch-mark.png';

  const p = prefs || {};
  if (DOM.inpPrefCity) DOM.inpPrefCity.value = p.city || '';
  if (DOM.inpAgeMin) DOM.inpAgeMin.value = p.ageMin || 18;
  if (DOM.inpAgeMax) DOM.inpAgeMax.value = p.ageMax || 50;
  if (DOM.inpLooking) {
    const lf = Array.isArray(p.lookingFor) ? p.lookingFor[0] : p.lookingFor;
    DOM.inpLooking.value = lf || 'women';
  }
  if (DOM.inpEthnicity) DOM.inpEthnicity.value = p.ethnicity || '';

  // Advanced filters
  if (DOM.inpIntent) DOM.inpIntent.value = p.intent || '';
  if (DOM.inpDealbreakers) DOM.inpDealbreakers.value = p.dealbreakers || '';
  setSharedValuesInUI(p.sharedValues || []);
}

// ------------------------------------------------------------------
// Creators – form helpers (prefill + read-only mode)
// ------------------------------------------------------------------

function _parsePackedParts(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split('|').map(s => String(s).trim()).filter(Boolean);
}

function _getPackedValue(parts, prefix) {
  const pfx = String(prefix).toLowerCase();
  const hit = parts.find(x => x.toLowerCase().startsWith(pfx));
  if (!hit) return '';
  const idx = hit.indexOf(':');
  return idx >= 0 ? hit.slice(idx + 1).trim() : hit.replace(new RegExp(`^${prefix}`, 'i'), '').trim();
}

function hydrateCreatorApplyFormFromState() {
  const form = DOM.frmCreatorApply;
  if (!form) return;

  const app = (state.me && state.me.creatorApplication && typeof state.me.creatorApplication === 'object')
    ? state.me.creatorApplication
    : null;

  if (!app) return;

  try {
    const h = String(app.handle || '').trim();
    if (h && form.elements.handle) {
      form.elements.handle.value = h.startsWith('@') ? h : `@${h}`;
    }
    if (app.gender && form.elements.gender) form.elements.gender.value = String(app.gender || '');
    if (app.price && form.elements.price) form.elements.price.value = String(app.price);

    // Packed fields live inside contentStyle (backward compatible)
    const parts = _parsePackedParts(app.contentStyle);
    const displayName = _getPackedValue(parts, 'Display name');
    const location = _getPackedValue(parts, 'Location');
    const languages = _getPackedValue(parts, 'Languages');
    const category = _getPackedValue(parts, 'Category');
    const niche = _getPackedValue(parts, 'Niche');
    const schedule = _getPackedValue(parts, 'Posting schedule');
    const bio = _getPackedValue(parts, 'Bio');
    const boundaries = _getPackedValue(parts, 'Boundaries');
    const currency = _getPackedValue(parts, 'Currency');
    const styleNotes = _getPackedValue(parts, 'Style notes');

    if (displayName && form.elements.creatorDisplayName) form.elements.creatorDisplayName.value = displayName;
    if (location && form.elements.creatorCountry) form.elements.creatorCountry.value = location;
    if (languages && form.elements.creatorLanguages) form.elements.creatorLanguages.value = languages;
    if (bio && form.elements.creatorBio) form.elements.creatorBio.value = bio;
    if (category && form.elements.creatorCategory) form.elements.creatorCategory.value = category;
    if (niche && form.elements.creatorNiche) form.elements.creatorNiche.value = niche;
    if (schedule && form.elements.creatorPostingSchedule) form.elements.creatorPostingSchedule.value = schedule;
    if (boundaries && form.elements.creatorContentBoundaries) form.elements.creatorContentBoundaries.value = boundaries;
    if (currency && form.elements.creatorCurrency) form.elements.creatorCurrency.value = currency;
    if (styleNotes && form.elements.contentStyle) form.elements.contentStyle.value = styleNotes;

    // Links are packed as: "Instagram: ... | TikTok: ... | X: ... | Website: ..."
    const linkParts = _parsePackedParts(app.links);
    const ig = _getPackedValue(linkParts, 'Instagram');
    const tt = _getPackedValue(linkParts, 'TikTok');
    const x = _getPackedValue(linkParts, 'X');
    const web = _getPackedValue(linkParts, 'Website');

    if (ig && form.elements.creatorInstagram) form.elements.creatorInstagram.value = ig;
    if (tt && form.elements.creatorTikTok) form.elements.creatorTikTok.value = tt;
    if (x && form.elements.creatorX) form.elements.creatorX.value = x;
    if (web && form.elements.creatorWebsite) form.elements.creatorWebsite.value = web;
  } catch (_) {
    // non-fatal
  }
}

function setCreatorApplyFormReadOnly(readOnly) {
  const form = DOM.frmCreatorApply;
  if (!form) return;

  form.dataset.readOnly = readOnly ? '1' : '';
  const fields = form.querySelectorAll('input, textarea, select');
  fields.forEach((el) => {
    // Allow hidden fields to remain writable
    if (el.type === 'hidden') return;
    el.disabled = !!readOnly;
  });

  // Always keep Cancel clickable
  if (DOM.btnCloseCreatorApply) DOM.btnCloseCreatorApply.disabled = false;

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = !!readOnly;
    submitBtn.textContent = readOnly ? 'Pending Review' : 'Submit';
    submitBtn.style.opacity = readOnly ? '0.7' : '1';
  }
}


async function handleCreatorApplicationSubmit() {
  if (DOM.frmCreatorApply && DOM.frmCreatorApply.dataset.readOnly === '1') {
    showToast('Your Creator application is pending review.', 'info');
    return;
  }

  if (!state.me || !state.me.email) {
    showToast('Please log in first.', 'error');
    window.location.href = 'auth.html?mode=login';
    return;
  }

  const status = normalizeStatus(state.me.creatorStatus);
  if (status === 'pending') {
    showToast('Creator application is already pending.', 'error');
    return;
  }

  const form = DOM.frmCreatorApply;
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const oldTxt = submitBtn ? submitBtn.textContent : '';
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    const fd = new FormData(form);

    // Respect HTML required fields (so the form feels native and solid).
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

    const handle = String(fd.get('handle') || '').trim();
    const price = String(fd.get('price') || '').trim();

    // New (OnlyFans-style) fields (UI-only, but we still persist them safely)
    const displayName = String(fd.get('creatorDisplayName') || '').trim();
    const country = String(fd.get('creatorCountry') || '').trim();
    const languages = String(fd.get('creatorLanguages') || '').trim();
    const bio = String(fd.get('creatorBio') || '').trim();
    const category = String(fd.get('creatorCategory') || '').trim();
    const niche = String(fd.get('creatorNiche') || '').trim();
    const schedule = String(fd.get('creatorPostingSchedule') || '').trim();
    const boundaries = String(fd.get('creatorContentBoundaries') || '').trim();
    const currency = String(fd.get('creatorCurrency') || 'USD').trim();

    // Links (optional)
    const ig = String(fd.get('creatorInstagram') || '').trim();
    const tt = String(fd.get('creatorTikTok') || '').trim();
    const x = String(fd.get('creatorX') || '').trim();
    const web = String(fd.get('creatorWebsite') || '').trim();

    const contentStyleRaw = String(fd.get('contentStyle') || '').trim();
    const gender = String(fd.get('gender') || '').trim();

    const linksParts = [];
    if (ig) linksParts.push(`Instagram: ${ig}`);
    if (tt) linksParts.push(`TikTok: ${tt}`);
    if (x) linksParts.push(`X: ${x}`);
    if (web) linksParts.push(`Website: ${web}`);
    const linksCompiled = linksParts.join(" | ");

    // NOTE: Current backend stores only {handle, gender, contentStyle, price, links}.
    // To avoid touching server logic, we safely "pack" the new fields into contentStyle/links.
    const packedContentStyle = [
      displayName ? `Display name: ${displayName}` : '',
      country ? `Location: ${country}` : '',
      languages ? `Languages: ${languages}` : '',
      category ? `Category: ${category}` : '',
      niche ? `Niche: ${niche}` : '',
      schedule ? `Posting schedule: ${schedule}` : '',
      bio ? `Bio: ${bio}` : '',
      boundaries ? `Boundaries: ${boundaries}` : '',
      currency ? `Currency: ${currency}` : '',
      contentStyleRaw ? `Style notes: ${contentStyleRaw}` : ''
    ].filter(Boolean).join(" | ");

    const payload = {
      handle,
      price,
      contentStyle: packedContentStyle,
      gender,
      links: linksCompiled
    };

    if (!payload.handle || !payload.price) {
      showToast('Please fill in your handle and monthly price.', 'error');
      return;
    }

    // Extra "OnlyFans-style" required checks (kept lightweight)
    if (!displayName || !country || !languages || !bio || !category || !schedule) {
      showToast('Please complete the required Creator Application fields.', 'error');
      return;
    }

    const res = await apiPost('/api/me/creator/apply', payload);
    if (!res || !res.ok) throw new Error(res && res.error ? res.error : 'Failed to submit application.');

    showToast('Creator application submitted. Status: pending.');
    if (DOM.dlgCreatorApply) DOM.dlgCreatorApply.close();

    // Update local state (so UI reflects pending immediately)
    state.me.creatorStatus = 'pending';
    state.me.creatorApplication = { ...payload, submittedAt: Date.now() };

    renderCreatorPremiumEntryCards();

    // Start watcher only while user is on the Creators tab (no surprise redirects)
    startCreatorApprovalWatcher();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to submit creator application.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = oldTxt || 'Submit Application';
    }
  }
}


// ------------------------------------------------------------------
// Creators approval watcher (client-side polling)
// - When a user's application is pending AND the user is on the Creators tab,
//   poll /api/me periodically.
// - If approved -> redirect to creators.html immediately.
// ------------------------------------------------------------------
let __creatorWatchTimer = null;
let __creatorWatchStartedAt = 0;

function stopCreatorApprovalWatcher() {
  if (__creatorWatchTimer) {
    clearInterval(__creatorWatchTimer);
    __creatorWatchTimer = null;
  }
  __creatorWatchStartedAt = 0;
}

function startCreatorApprovalWatcher() {
  // Only watch while user is on Creators tab (matches the UX copy)
  if (!state || state.activeTab !== 'creators') {
    stopCreatorApprovalWatcher();
    return;
  }

  const st = normalizeStatus(state.me && state.me.creatorStatus);
  if (st !== 'pending') {
    stopCreatorApprovalWatcher();
    return;
  }

  if (__creatorWatchTimer) return; // already running

  __creatorWatchStartedAt = Date.now();

  __creatorWatchTimer = setInterval(async () => {
    try {
      // auto-stop after 10 minutes to avoid endless polling
      if (Date.now() - __creatorWatchStartedAt > 10 * 60 * 1000) {
        stopCreatorApprovalWatcher();
        return;
      }

      const meRes = await apiGet('/api/me');
      if (meRes && meRes.ok && meRes.user) {
        state.me = { ...(state.me || {}), ...(meRes.user || {}) };
      } else if (meRes && meRes.ok && !meRes.user) {
        state.me = { ...(state.me || {}), ...(meRes || {}) };
      }

      const nowSt = normalizeStatus(state.me && state.me.creatorStatus);

      // Keep entry card in sync while pending
      renderCreatorPremiumEntryCards();

      if (nowSt === 'approved') {
        stopCreatorApprovalWatcher();
        window.location.href = 'creators.html';
        return;
      }

      if (nowSt === 'rejected' || nowSt === 'none' || nowSt === 'inactive') {
        stopCreatorApprovalWatcher();
        // re-enable apply (status resolved)
        renderCreatorPremiumEntryCards();
      }
    } catch (_) {
      // silent: keep trying
    }
  }, 4000);
}


// ------------------------------------------------------------------
// Premium Society approval watcher (client-side polling)
// - When a user's application is pending, poll /api/me periodically.
// - If approved -> redirect immediately.
// ------------------------------------------------------------------
let __premiumWatchTimer = null;
let __premiumWatchStartedAt = 0;

function stopPremiumApprovalWatcher() {
  if (__premiumWatchTimer) {
    clearInterval(__premiumWatchTimer);
    __premiumWatchTimer = null;
  }
  __premiumWatchStartedAt = 0;
}

function startPremiumApprovalWatcher() {
  const st = normalizeStatus(state.me && state.me.premiumStatus);
  if (st !== 'pending') {
    stopPremiumApprovalWatcher();
    return;
  }
  if (__premiumWatchTimer) return; // already running

  __premiumWatchStartedAt = Date.now();

  __premiumWatchTimer = setInterval(async () => {
    try {
      // auto-stop after 10 minutes to avoid endless polling
      if (Date.now() - __premiumWatchStartedAt > 10 * 60 * 1000) {
        stopPremiumApprovalWatcher();
        return;
      }

      const meRes = await apiGet('/api/me');
      if (meRes && meRes.ok && meRes.user) {
        state.me = { ...(state.me || {}), ...(meRes.user || {}) };
      } else if (meRes && meRes.ok && !meRes.user) {
        // Some builds return the user object at top level
        state.me = { ...(state.me || {}), ...(meRes || {}) };
      }

      const nowSt = normalizeStatus(state.me && state.me.premiumStatus);

      if (nowSt === 'approved') {
        stopPremiumApprovalWatcher();
        window.location.href = 'premium-society.html';
        return;
      }

      if (nowSt === 'rejected' || nowSt === 'none' || nowSt === 'inactive') {
        // application resolved (rejected) or removed
        stopPremiumApprovalWatcher();
        // refresh entry card state
        renderCreatorPremiumEntryCards();
      }
    } catch (e) {
      // silent: keep trying
    }
  }, 4000);
}

async function handlePremiumApplicationSubmit() {
  if (!state.me || !state.me.email) {
    showToast('Please log in first.', 'error');
    window.location.href = 'auth.html?mode=login';
    return;
  }

  const status = normalizeStatus(state.me.premiumStatus);

  // If they’re already approved, don’t allow re-submitting.
  if (status === 'approved') {
    showToast('You are already a Premium Society member.', 'success');
    if (DOM.dlgPremiumApply) DOM.dlgPremiumApply.close();
    return;
  }

  if (status === 'pending') {
    showToast('Premium Society application is already pending.', 'error');
    return;
  }

  // Intentional product rule: only Elite (Tier 2) and Concierge (Tier 3) can apply from the dashboard.
  const planKey = String(state.me.planKey || '').toLowerCase();
  const isEligibleByUiRule = (planKey === 'tier2' || planKey === 'tier3');
  if (!isEligibleByUiRule) {
    showToast('Premium Society applications are available for Elite (Tier 2) and Concierge (Tier 3) members only.', 'error');
    window.location.href = './tier.html?upgrade=1';
    return;
  }

  const form = DOM.frmPremiumApply;
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const oldTxt = submitBtn ? submitBtn.textContent : '';
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    const fd = new FormData(form);
    const payload = {
      fullName: String(fd.get('fullName') || '').trim(),
      age: String(fd.get('age') || '').trim(),
      occupation: String(fd.get('occupation') || '').trim(),

      wealthStatus: String(fd.get('wealthStatus') || '').trim(),
      incomeRange: String(fd.get('incomeRange') || '').trim(),
      netWorthRange: String(fd.get('netWorthRange') || '').trim(),
      incomeSource: String(fd.get('incomeSource') || '').trim(),

      // Legacy field name (kept for backward compatibility)
      finance: String(fd.get('incomeSource') || '').trim(),

      socialLink: String(fd.get('socialLink') || '').trim(),
      reason: String(fd.get('reason') || '').trim(),
      amountUsd: String(fd.get('amountUsd') || '').trim()
    };

    // Backend requires these fields; keep the error message simple.
    if (!payload.fullName || !payload.occupation || !payload.wealthStatus || !payload.incomeRange || !payload.netWorthRange || !payload.incomeSource || !payload.reason) {
      showToast('Please complete the form.', 'error');
      form.reportValidity();
      return;
    }

    const res = await apiPost('/api/me/premium/apply', payload);

    if (!res || !res.ok) {
      const msg = (res && (res.message || res.error)) ? (res.message || res.error) : 'Failed to submit application.';
      const msgStr = String(msg || '');

      // Keep UX consistent with the intentional gating rule.
      if (res && res.code === 'not_eligible') {
        showToast('Premium Society applications are available for Elite (Tier 2) and Concierge (Tier 3) members only.', 'error');
        window.location.href = './tier.html?upgrade=1';
        return;
      }

      // Common server-side eligibility failure (inactive plan, etc.)
      if (/requires?\s+an\s+ACTIVE/i.test(msgStr) || (/plan/i.test(msgStr) && /active/i.test(msgStr))) {
        showToast('Your plan must be active to submit a Premium Society application. Please upgrade/renew and try again.', 'error');
        window.location.href = './tier.html?upgrade=1';
        return;
      }

      throw new Error(msgStr || 'Failed to submit application.');
    }

    showToast('Premium Society application submitted. Status: pending.', 'success');

    // Update local state immediately so UI reflects pending and watcher can run.
    state.me.premiumStatus = 'pending';
    state.me.premiumApplication = { ...payload, submittedAt: Date.now() };

    startPremiumApprovalWatcher();
    if (DOM.dlgPremiumApply) DOM.dlgPremiumApply.close();

    renderCreatorPremiumEntryCards();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to submit Premium Society application.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = oldTxt || 'Submit Application';
    }
  }
}

async function handleProfileSave() {
  const name = (DOM.inpName ? DOM.inpName.value : '').trim();
  const profileCity = (DOM.inpCity ? DOM.inpCity.value : '').trim();
  const age = DOM.inpUserAge ? parseInt(DOM.inpUserAge.value, 10) : null;
  const profileGender = (DOM.inpProfileGender ? DOM.inpProfileGender.value : '').trim();

  const preferredCity = (DOM.inpPrefCity ? DOM.inpPrefCity.value : '').trim();
  const ageMin = DOM.inpAgeMin ? parseInt(DOM.inpAgeMin.value, 10) : 18;
  const ageMax = DOM.inpAgeMax ? parseInt(DOM.inpAgeMax.value, 10) : 50;
  const lookingFor = DOM.inpLooking ? DOM.inpLooking.value : 'women';
  const ethnicity = DOM.inpEthnicity ? DOM.inpEthnicity.value : '';

  const intent = DOM.inpIntent ? DOM.inpIntent.value : '';
  const dealbreakers = (DOM.inpDealbreakers ? DOM.inpDealbreakers.value : '').trim();
  const sharedValues = getSharedValuesFromUI();

  // Validation (mirrors Preferences page requirements)
  if (!name) {
    showToast('Name is required.', 'error');
    return;
  }
  if (!preferredCity) {
    showToast('Preferred city is required.', 'error');
    return;
  }
  if (profileGender && !['women','men'].includes(profileGender)) {
    showToast('Please select a valid value for “I am”.', 'error');
    return;
  }
  if (!Number.isFinite(age) || age < 18 || age > 99) {
    showToast('Please enter a valid age (18-99).', 'error');
    return;
  }
  if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax) || ageMin < 18 || ageMax > 99 || ageMin > ageMax) {
    showToast('Please enter a valid age range.', 'error');
    return;
  }

  const profilePayload = {
    name,
    city: profileCity,
    age
  };
  if (profileGender) profilePayload.profileGender = profileGender;
  if (state.selectedAvatarDataUrl) profilePayload.avatarDataUrl = state.selectedAvatarDataUrl;

  const prefsPayload = {
    city: preferredCity,
    ageMin,
    ageMax,
    lookingFor: [lookingFor]
  };
  if (profileGender) prefsPayload.profileGender = profileGender;
  if (ethnicity) prefsPayload.ethnicity = ethnicity;
  if (intent) prefsPayload.intent = intent;
  if (dealbreakers) prefsPayload.dealbreakers = dealbreakers;
  prefsPayload.sharedValues = Array.isArray(sharedValues) ? sharedValues : [];

  try {
    let profileRes = await apiUpdateProfile(profilePayload);

    if (!profileRes || !profileRes.ok) {
      throw new Error('Failed to update profile.');
    }

    let prefsRes = await apiSavePrefs(prefsPayload);

    if (!prefsRes || !prefsRes.ok) {
      throw new Error('Failed to update preferences.');
    }

    const updatedUser = profileRes.user || { ...state.me, ...profilePayload };
    const updatedPrefs = prefsRes.prefs || { ...state.prefs, ...prefsPayload };

    state.me = updatedUser;
    state.prefs = updatedPrefs;

    saveLocalUser(state.me);
    savePrefsForCurrentUser(state.prefs);

    showToast('Saved successfully!');
    renderSettingsDisplay(state.me, state.prefs);
    renderHome(state.me);
    DOM.dlgProfile.close();
  } catch (e) {
    console.error(e);
    showToast(e?.message || 'Failed to save. Please try again.', 'error');
  }
}



// ---------------------------------------------------------------------
// SETTINGS: PASSWORD CHANGE
// ---------------------------------------------------------------------

function resetPasswordForm() {
  if (DOM.inpCurrentPassword) DOM.inpCurrentPassword.value = '';
  if (DOM.inpNewPassword) DOM.inpNewPassword.value = '';
  if (DOM.inpConfirmPassword) DOM.inpConfirmPassword.value = '';
  if (DOM.btnSubmitPassword) {
    DOM.btnSubmitPassword.disabled = false;
    DOM.btnSubmitPassword.textContent = 'Update';
  }
}

async function handlePasswordChange() {
  try {
    const cur = String(DOM.inpCurrentPassword ? DOM.inpCurrentPassword.value : '').trim();
    const nxt = String(DOM.inpNewPassword ? DOM.inpNewPassword.value : '').trim();
    const conf = String(DOM.inpConfirmPassword ? DOM.inpConfirmPassword.value : '').trim();

    if (!nxt) {
      showToast('Enter a new password.', 'error');
      return;
    }
    if (nxt.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (nxt !== conf) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    const submitBtn = DOM.btnSubmitPassword || (DOM.frmPassword ? DOM.frmPassword.querySelector('button[type="submit"]') : null);
    const oldTxt = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating...';
    }

    const res = await apiPost('/api/me/password', { currentPassword: cur, newPassword: nxt });

    if (res && res.ok) {
      if (DOM.dlgPassword) DOM.dlgPassword.close();
      resetPasswordForm();
      showToast('Password updated successfully.', 'success');
      return;
    }

    const code = String((res && (res.message || res.error || res.code)) || '');
    if (code === 'wrong_password') {
      showToast('Current password is incorrect.', 'error');
    } else if (code === 'weak_password') {
      showToast('Password must be at least 6 characters.', 'error');
    } else if (code === 'too_many_requests') {
      showToast('Too many attempts. Please try again later.', 'warning');
    } else if (code === 'not_logged_in') {
      showToast('Session expired. Please sign in again.', 'error');
      try { clearSession(); } catch {}
      try { window.location.href = 'index.html'; } catch {}
    } else if (code === 'auth_backend_misconfigured') {
      showToast('Password updates are temporarily unavailable. Please try again later.', 'error');
    } else {
      showToast('Unable to update password. Please try again.', 'error');
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = oldTxt || 'Update';
    }
  } catch (err) {
    console.error('handlePasswordChange error:', err);
    showToast('Unable to update password. Please try again.', 'error');
    if (DOM.btnSubmitPassword) {
      DOM.btnSubmitPassword.disabled = false;
      DOM.btnSubmitPassword.textContent = 'Update';
    }
  }
}

// ---------------------------------------------------------------------
// SWIPE CONTROLLER
// ---------------------------------------------------------------------

const SwipeController = (() => {
  let profiles = [];
  let currentIndex = 0;
  let isLoading = false;
  let lastLimit = DAILY_SWIPE_LIMIT; // default (Free), may become null for paid
  let lastRemaining = DAILY_SWIPE_LIMIT;

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  function setSwipeStats(remaining, limit) {
    // limit === null => unlimited
    lastLimit = (limit === null || typeof limit === 'undefined') ? null : Number(limit);
    lastRemaining = (remaining === null || typeof remaining === 'undefined') ? null : Number(remaining);

    // Update ring/counter UI (if present)
    
if (lastLimit === null) {
  if (DOM.statsCountDisplay) DOM.statsCountDisplay.textContent = '∞';
  if (DOM.statsRingCircle) DOM.statsRingCircle.style.strokeDashoffset = 0;

  if (DOM.mobileStatsCountDisplay) DOM.mobileStatsCountDisplay.textContent = '∞';
  if (DOM.mobileStatsRingCircle) DOM.mobileStatsRingCircle.style.strokeDashoffset = 0;
  return;
}

    const safeLimit = Number.isFinite(lastLimit) && lastLimit > 0 ? lastLimit : DAILY_SWIPE_LIMIT;
    const safeRemaining = Number.isFinite(lastRemaining) ? Math.max(0, Math.min(safeLimit, lastRemaining)) : safeLimit;
    updateSwipeStats(safeRemaining, safeLimit);
  }

  async function init() {
    await loadCandidates();
  }

  async function jumpTo(profile) {
    try {
      const email = String((profile && (profile.email || profile.id)) || '').toLowerCase();
      if (!email) return;

      // If a load is in progress, wait briefly for it to finish.
      if (isLoading) {
        for (let i = 0; i < 12 && isLoading; i++) {
          await delay(60);
        }
      }

      // Ensure we have a deck.
      if (!profiles.length) {
        await loadCandidates();
      }

      if (!profiles.length) {
        // Either no candidates or limit reached.
        toast('No profiles to show right now.', 'info');
        return;
      }

      let idx = profiles.findIndex(p => String(p && p.id || '').toLowerCase() === email);
      if (idx === -1) {
        // Not in current deck: prepend a minimal card so user can "open" it.
        const cand = {
          id: email,
          name: (profile && profile.name) ? String(profile.name) : 'Member',
          age: (profile && profile.age) ? String(profile.age) : '',
          city: (profile && profile.city) ? String(profile.city) : '',
          photoUrl: (profile && profile.photoUrl) ? String(profile.photoUrl) : ''
        };
        profiles = [cand, ...profiles];
        idx = 0;
      }

      currentIndex = Math.max(0, idx);
      if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = true;
      if (DOM.swipeControls) DOM.swipeControls.style.display = 'flex';
      renderCards();
    } catch (e) {
      console.warn('SwipeController.jumpTo failed:', e);
      toast('Unable to open profile right now.', 'error');
    }
  }

  async function loadCandidates() {
    if (isLoading) return;
    isLoading = true;

    if (DOM.swipeStack) DOM.swipeStack.innerHTML = '';
    if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = true;

    try {
      const data = await apiGet('/api/swipe/candidates');

      if (data && data.ok && (data.limit === null || typeof data.limit === 'number' || typeof data.limit === 'undefined')) {
        setSwipeStats(data.remaining, data.limit);
      }

      const list = (data && data.candidates) ? data.candidates : [];

      if (data && data.limitReached) {
        // Free cap reached: keep empty state visible and disable controls
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
        showToast('Daily swipe limit reached. Come back tomorrow.', 'error');
        profiles = [];
        currentIndex = 0;
        return;
      }

      if (list.length > 0) {
        profiles = list;
        currentIndex = 0;
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = true;
        renderCards();
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'flex';
      } else {
        profiles = [];
        currentIndex = 0;
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
      }
    } catch (e) {
      console.error('Swipe Error', e);
      showToast('Failed to load swipe deck.', 'error');
    } finally {
      isLoading = false;
    }
  }

  function renderCards() {
    if (!DOM.swipeStack) return;
    DOM.swipeStack.innerHTML = '';

    const cardLimit = 2;
    const cardsToRender = profiles.slice(currentIndex, currentIndex + cardLimit).reverse();

    cardsToRender.forEach((p, idx) => {
      const isTop = idx === cardsToRender.length - 1;
      const card = document.createElement('div');
      card.className = 'swipe-card';
      const img = p.photoUrl || 'assets/images/truematch-mark.png';

      card.style.backgroundImage = `url('${img}')`;
      card.style.backgroundColor = getRandomColor();

      if (isTop) {
        card.id = 'activeSwipeCard';
        card.style.zIndex = 10;
        card.style.opacity = 1;
        card.style.transform = 'scale(1)';
      } else {
        card.style.zIndex = 5;
        card.style.opacity = 0.5;
        card.style.transform = 'scale(0.95) translateY(10px)';
      }

      let tagsHtml = '';
      if (p.tags && p.tags.length > 0) {
        tagsHtml = `<div class="swipe-tags">` + p.tags.map(t => `<span class="tag">${t}</span>`).join('') + `</div>`;
      }

      card.innerHTML = `
        <div class="swipe-card__info">
          <h2>${p.name} <span>${p.age}</span></h2>
          <p>📍 ${p.city}</p>
          ${tagsHtml}
        </div>
      `;
      DOM.swipeStack.appendChild(card);
    });
  }

  function mapAction(type) {
    if (type === 'superlike') return 'super';
    if (type === 'pass') return 'pass';
    return 'like';
  }

  async function handleAction(type) {
    if (currentIndex >= profiles.length) return;

    const active = document.getElementById('activeSwipeCard');
    if (active) {
      let animClass = 'swipe-out-right';
      if (type === 'pass') animClass = 'swipe-out-left';
      else if (type === 'superlike') animClass = 'swipe-out-right';
      active.classList.add(animClass);
    }

    const targetEmail = profiles[currentIndex].id;
    try {
        const res = await apiPost('/api/swipe/action', { targetEmail, action: mapAction(type) });

        if (!res || !res.ok) {
          const err = (res && (res.error || res.message)) || 'Swipe failed';
          if (String(err) === 'daily_swipe_limit_reached') {
            setSwipeStats(0, res.limit || DAILY_SWIPE_LIMIT);
            showToast('Daily swipe limit reached. Come back tomorrow.', 'error');
            // clear deck
            profiles = [];
            currentIndex = 0;
            if (DOM.swipeStack) DOM.swipeStack.innerHTML = '';
            if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
            if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
            return;
          }
          if (String(err) === 'target_is_premium_society') {
            showToast('This member is only available inside Premium Society.', 'error');
          } else {
            showToast(err, 'error');
          }
        } else {
          setSwipeStats(res.remaining, res.limit);
          if (res.match) showToast('It’s a match! 🎉');
        }
    } catch (e) {
        console.error(e);
        showToast('Swipe failed. Please try again.', 'error');
    }

    let msg = 'Liked!';
    if (type === 'pass') msg = 'Passed';
    if (type === 'superlike') msg = 'Super Liked! ⭐';
    showToast(msg);

    setTimeout(() => {
      currentIndex++;
      if (currentIndex >= profiles.length) {
        if (DOM.swipeStack) DOM.swipeStack.innerHTML = '';
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
      } else {
        renderCards();
      }
    }, 300);
  }

  return {
    init,
    like: () => handleAction('like'),
    pass: () => handleAction('pass'),
    superLike: () => handleAction('superlike'),
    jumpTo
  };
})();;

// ONE SINGLE ENTRY POINT
window.addEventListener('DOMContentLoaded', initApp);