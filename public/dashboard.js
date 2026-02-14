// ---------------------------------------------------------------------
// iTrueMatch Dashboard – Main Controller (FINAL: UI WIDTHS & BG FIXED)
// ---------------------------------------------------------------------

import { getLocalPlan, saveLocalUser, savePrefsForCurrentUser, clearSession } from './tm-session.js';
import { apiGet, apiPost, apiUpdateProfile, apiSavePrefs } from './tm-api.js';

// Production mode: disable all mock/demo UI population.
const DEV_MODE = false;

const DAILY_SWIPE_LIMIT = 20; 

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

// --- Image helper (same behavior as Preferences page: crop to square + compress) ---
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataUrl(file);
  });
}

async function fileToOptimizedSquareDataUrl(file, maxSize = 768, quality = 0.85) {
  const dataUrl = await readFileAsDataUrl(file);
  const img = new Image();
  img.src = dataUrl;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

  const s = Math.min(img.width, img.height);
  const sx = (img.width - s) / 2;
  const sy = (img.height - s) / 2;

  const canvas = document.createElement('canvas');
  const out = Math.min(maxSize, s);
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, s, s, 0, 0, out, out);
  return canvas.toDataURL('image/jpeg', quality);
}

function getMockUser() {
  return {
    id: 99, name: 'Baudss User', email: 'user@itruematch.com', age: 24, city: 'Manila',
    avatarUrl: 'assets/images/truematch-mark.png', plan: 'free',
    creatorStatus: 'none', premiumStatus: 'none', hasCreatorAccess: false
  };
}

const state = { me: null, prefs: null, plan: 'free', activeTab: 'home', isLoading: false, selectedAvatarDataUrl: null, homeCache: { admirersTs: 0, nearbyTs: 0 }, homeLoading: { admirers: false, nearby: false } };

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

  // --- Nav button (insert between Premium and Creators) ---
  const existingBtn = tabbar.querySelector('.nav-btn[data-panel="concierge"]');
  if (!existingBtn) {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.setAttribute('data-panel', 'concierge');
    btn.innerHTML = '<i class="fa-solid fa-user-tie"></i><span>Concierge</span>';

    const creatorsBtn = tabbar.querySelector('.nav-btn[data-panel="creators"]');
    if (creatorsBtn) {
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
  DOM.storiesContainer = document.getElementById('storiesContainer');
  DOM.admirerContainer = document.getElementById('admirerContainer');
  DOM.admirerCount = document.getElementById('admirerCount');
  
  DOM.newMatchesRail = document.getElementById('newMatchesRail');
  DOM.matchesContainer = document.getElementById('matchesContainer');
  DOM.newMatchCount = document.getElementById('newMatchCount');
  DOM.matchesSearch = document.getElementById('matchesSearch');
  
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
  DOM.btnNotifToggle = document.getElementById('btnNotifToggle');
  DOM.notifDropdown = document.getElementById('notifDropdown');
  DOM.notifDot = DOM.btnNotifToggle ? DOM.btnNotifToggle.querySelector('.notif-dot') : null;
  DOM.notifList = DOM.notifDropdown ? (DOM.notifDropdown.querySelector('#notifList') || DOM.notifDropdown.querySelector('.notif-list')) : null;
  DOM.btnNotifMarkAllRead = DOM.notifDropdown ? (DOM.notifDropdown.querySelector('.notif-footer') || null) : null;
  
  DOM.dlgStory = document.getElementById('dlgStory');
  DOM.storyMainImg = document.getElementById('storyMainImg');
  DOM.storyMainVideo = document.getElementById('storyMainVideo');
  DOM.storyUserImg = document.getElementById('storyUserImg');
  DOM.storyUserName = document.getElementById('storyUserName');
  DOM.btnCloseStory = document.getElementById('btnCloseStory');
  DOM.storyProgressFill = document.getElementById('storyProgressFill');

  // Recent Moments (mobile)
  DOM.mobileMomentsToggle = document.getElementById('mobileMomentsToggle');
  DOM.momentsPopup = document.getElementById('momentsPopup');
  DOM.mobileStoriesContainer = document.getElementById('mobileStoriesContainer');

  // Hidden input for Moment uploads
  DOM.momentFileInput = document.getElementById('momentFileInput');
  
  DOM.sAvatar = document.getElementById('sAvatar');
  DOM.sNameDisplay = document.getElementById('sNameDisplay');
  DOM.sEmailDisplay = document.getElementById('sEmailDisplay');
  // Settings display (should mirror Preferences page fields)
  DOM.dispCity = document.getElementById('dispCity');
    DOM.dispAge = document.getElementById('dispAge'); // profile city
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

  
  DOM.toast = document.getElementById('tm-toast');
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

  // Defaults
  if (row) row.style.display = 'none';
  if (btnGo) btnGo.style.display = 'none';
  if (btnApply) {
    btnApply.disabled = false;
    btnApply.textContent = 'Apply';
    btnApply.style.opacity = '1';
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
    if (hint) hint.textContent = 'You can edit and re-apply anytime.';
    if (btnApply) {
      btnApply.disabled = false;
      btnApply.textContent = 'Re-Apply';
      btnApply.style.opacity = '1';
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
    if (btnApply) btnApply.style.display = 'inline-flex';
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
    if(DOM.statsCountDisplay) DOM.statsCountDisplay.textContent = current;
    if(DOM.statsRingCircle) {
        const percent = current / max; 
        const offset = 251 - (251 * percent);
        DOM.statsRingCircle.style.strokeDashoffset = offset;
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
// CORE INIT
// ---------------------------------------------------------------------

async function initApp() {
  cacheDom();
  await loadMe();
  
  // Swipe deck loads lazily when Swipe tab is opened.

  if (DEV_MODE) {
    populateMockContent();
  } else {
    await loadHomePanels(true);
    renderHomeEmptyStates();
    await MomentsController.init();
  }
  
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

  // 3. Recent Moments (Stories) Click
  const handleStoryClick = (e) => MomentsController.handleStoryClick(e);
  if (DOM.storiesContainer) DOM.storiesContainer.addEventListener('click', handleStoryClick);
  if (DOM.mobileStoriesContainer) DOM.mobileStoriesContainer.addEventListener('click', handleStoryClick);

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
          openChatModal(name, imgColor, "Matched via Stories 🔥", item.dataset.email || '', item.dataset.photoUrl || '');
      }
  };
  if (DOM.matchesContainer) DOM.matchesContainer.addEventListener('click', handleMatchClick);
  if (DOM.newMatchesRail) DOM.newMatchesRail.addEventListener('click', handleMatchClick);

  // 5. Modals Close
  if (DOM.btnCloseStory && DOM.dlgStory) DOM.btnCloseStory.addEventListener('click', () => MomentsController.closeStory());
  if (DOM.btnCloseChat && DOM.dlgChat) DOM.btnCloseChat.addEventListener('click', () => DOM.dlgChat.close());

  // Chat Send
  if (DOM.btnChatSend) DOM.btnChatSend.addEventListener('click', (e) => { e.preventDefault(); sendChatMessage(); });
  if (DOM.chatInput) DOM.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
  });

  // 6. Logout
  const handleLogout = (e) => {
      e.preventDefault();
      clearSession();
      sessionStorage.clear();
      window.location.href = 'index.html'; 
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
        showToast('Failed to read that image. Please try another file.', 'error');
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
});// 9. Creators & Premium
  if (DOM.btnOpenCreatorApply) DOM.btnOpenCreatorApply.addEventListener('click', () => DOM.dlgCreatorApply.showModal());
  if (DOM.btnCloseCreatorApply) DOM.btnCloseCreatorApply.addEventListener('click', () => DOM.dlgCreatorApply.close());
  
  const openPremium = (e) => {
      // Sidebar "Subscribe" should always go to plans
      if (e && e.currentTarget && e.currentTarget.id === 'btnSidebarSubscribe') {
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
  enableBackdropClose(DOM.dlgStory);
  enableBackdropClose(DOM.dlgChat); 

  // 12. Swipe Controls
  const handlePass = () => SwipeController.pass();
  const handleLike = () => SwipeController.like();
  const handleSuper = () => SwipeController.superLike();

  if (DOM.btnSwipePass) DOM.btnSwipePass.addEventListener('click', handlePass);
  if (DOM.btnSwipeLike) DOM.btnSwipeLike.addEventListener('click', handleLike);
  if (DOM.btnSwipeSuper) DOM.btnSwipeSuper.addEventListener('click', handleSuper);
  if (DOM.btnRefreshSwipe) DOM.btnRefreshSwipe.addEventListener('click', () => SwipeController.init(true));
  
  document.addEventListener('keydown', (e) => {
      if(state.activeTab !== 'swipe') return;
      if(e.key === 'ArrowLeft') handlePass();
      if(e.key === 'ArrowRight') handleLike();
      if(e.key === 'ArrowUp') handleSuper();
  });
}

// ---------------------------------------------------------------------
// MOBILE MENU CONTROLLER
// ---------------------------------------------------------------------

function setupMobileMenu() {
    const sidebar = document.getElementById('mainSidebar');
    const menuBtn = document.getElementById('mobileNavToggle');
    const momentsBtn = document.getElementById('mobileMomentsToggle');
    const momentsPopup = document.getElementById('momentsPopup');
    
    // Hamburger Menu Logic
    if(menuBtn && sidebar) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close Moments if open
            if(momentsPopup) momentsPopup.classList.remove('is-open'); 
            if(momentsBtn) momentsBtn.querySelector('i').className = 'fa-solid fa-bolt';
            
            // Toggle Sidebar
            sidebar.classList.toggle('is-open');
            
            // Toggle Icon
            const isOpen = sidebar.classList.contains('is-open');
            menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if(sidebar.classList.contains('is-open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('is-open');
                menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });
    }

    // Moments Button Logic
    if(momentsBtn && momentsPopup) {
        momentsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close Sidebar if open
            if(sidebar) sidebar.classList.remove('is-open'); 
            if(menuBtn) menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';

            // Toggle Moments Popup
            momentsPopup.classList.toggle('is-open');
            
            // Toggle Icon
            const icon = momentsBtn.querySelector('i');
            icon.className = momentsPopup.classList.contains('is-open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bolt';
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
             if(momentsPopup.classList.contains('is-open') && !momentsPopup.contains(e.target) && !momentsBtn.contains(e.target)) {
                momentsPopup.classList.remove('is-open');
                momentsBtn.querySelector('i').className = 'fa-solid fa-bolt';
             }
        });
    }
}

// ---------------------------------------------------------------------
// TAB SWITCHING
// ---------------------------------------------------------------------

function setActiveTab(tabName) {

  // Access redirect (when approved by admin)
  if (!DEV_MODE && state && state.me) {
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
  if (tabName === 'swipe') {
    SwipeController.init(false);
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
      <div class="admirer-row" data-email="${esc(it.email || '')}" style="justify-content:flex-start; gap:15px;">
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
      // In v1 we simply take you to Swipe to continue.
      try { setActiveTab('swipe'); } catch {}
      toast('Open Swipe to see new people.', 'info');
    });
  });
}

async function loadActiveNearbyPanel(force = false) {
  if (!DOM.activeNearbyContainer) return;
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
  if (!items.length) {
    DOM.activeNearbyContainer.innerHTML = "<div class='active-empty tiny muted'>No active users nearby yet.</div>";
    return;
  }

  let html = `<div class="active-grid">`;
  items.forEach(u => {
    const photo = u.photoUrl ? esc(u.photoUrl) : 'assets/images/truematch-mark.png';
    const hasPhoto = !!u.photoUrl;
    html += `
      <div class="active-item" data-email="${esc(u.email || '')}" title="${esc(u.name || 'Member')}">
        <img src="${photo}" style="background:${hasPhoto ? 'transparent' : getRandomColor()}; object-fit:${hasPhoto ? 'cover' : 'contain'};">
        <span class="active-dot"></span>
      </div>`;
  });
  html += `</div>`;

  DOM.activeNearbyContainer.innerHTML = html;

  DOM.activeNearbyContainer.querySelectorAll('.active-item').forEach(el => {
    el.addEventListener('click', () => {
      try { setActiveTab('swipe'); } catch {}
      toast('Swipe to discover more people.', 'info');
    });
  });
}


// ---------------------------------------------------------------------
// MODAL HELPERS
// ---------------------------------------------------------------------

async function openChatModal(name, imgColor, lastMsg, peerEmail, peerPhotoUrl) {
  if (!DOM.dlgChat) return;

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

  // Reset header meta line
  if (DOM.chatReceiptLine) {
    DOM.chatReceiptLine.textContent = '● Online';
  }

  // Clear body and show initial hint
  DOM.chatBody.innerHTML = '';
  DOM.dlgChat.showModal();

  if (!state.currentChatPeerEmail) {
    DOM.chatBody.innerHTML = '<p style="margin:0; color:rgba(255,255,255,0.7);">No chat recipient found.</p>';
    return;
  }

  await loadAndRenderThread(state.currentChatPeerEmail);
}

function openStoryModal(name, color) {
    if (DOM.dlgStory) {
        if(DOM.storyUserName) DOM.storyUserName.textContent = name;
        if(DOM.storyUserImg) {
            DOM.storyUserImg.src = 'assets/images/truematch-mark.png'; 
            DOM.storyUserImg.style.backgroundColor = color || '#333';
        }
        if(DOM.storyMainImg) {
            DOM.storyMainImg.src = 'assets/images/truematch-mark.png';
            DOM.storyMainImg.style.backgroundColor = color || '#333';
        }
        DOM.dlgStory.showModal();
    }
}

// ---------------------------------------------------------------------
// RECENT MOMENTS (STORIES) – LIVE MODE
// - One bubble per user (Option A)
// - Sequential playback per user
// - Upload supports photo/video only (no music)
// ---------------------------------------------------------------------

const MomentsController = (() => {
  let momentsByOwner = new Map();
  let activeOwnerId = null;
  let activeList = [];
  let activeIndex = 0;
  let timer = null;

  const IMG_DURATION_MS = 5500;
  const MAX_UPLOAD_BYTES = 7 * 1024 * 1024; // 7MB base file (before base64 overhead)

  function stopPlayback() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (DOM.storyMainVideo) {
      try {
        DOM.storyMainVideo.pause();
        DOM.storyMainVideo.currentTime = 0;
      } catch {}
      DOM.storyMainVideo.onended = null;
    }
    if (DOM.storyProgressFill) {
      DOM.storyProgressFill.style.transition = 'none';
      DOM.storyProgressFill.style.width = '0%';
    }
  }

  function timeAgo(ms) {
    const now = Date.now();
    const d = Math.max(0, now - ms);
    const sec = Math.floor(d / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  }

  function groupMoments(moments = []) {
    const map = new Map();
    moments
      .filter(m => m && m.ownerId)
      .sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0))
      .forEach(m => {
        const key = m.ownerId;
        if (!map.has(key)) {
          map.set(key, {
            ownerId: key,
            ownerName: m.ownerName || 'User',
            ownerAvatarUrl: m.ownerAvatarUrl || 'assets/images/truematch-mark.png',
            moments: []
          });
        }
        map.get(key).moments.push(m);
      });
    momentsByOwner = map;
  }

  function buildStoryItemHTML({ ownerId, ownerName, ownerAvatarUrl, thumbUrl, hasVideo }) {
    const safeName = ownerName || 'User';
    const avatar = ownerAvatarUrl || 'assets/images/truematch-mark.png';
    const thumb = thumbUrl || avatar;
    const playBadge = hasVideo
      ? `<div style="position:absolute; bottom:6px; right:6px; width:18px; height:18px; border-radius:9px; background:rgba(0,0,0,.55); color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px;">▶</div>`
      : '';

    return `
      <div class="story-item" data-owner-id="${ownerId}">
        <div class="story-ring" style="border: 2px solid #ffd700; padding:2px; position:relative;">
          <img class="story-img" src="${thumb}" alt="${safeName}" style="background:transparent">
          ${playBadge}
        </div>
        <span class="story-name">${safeName}</span>
      </div>
    `;
  }

  function render(container) {
    if (!container) return;

    let html = `
      <div class="story-item action" data-action="add-moment">
        <div class="story-ring ring-add" style="border:2px solid rgba(255,255,255,.25); padding:2px;">
          <div class="story-img" style="display:flex; align-items:center; justify-content:center; font-size:22px;">+</div>
        </div>
        <span class="story-name">Add</span>
      </div>
    `;

    const owners = Array.from(momentsByOwner.values())
      // latest activity first
      .sort((a, b) => {
        const al = a.moments[a.moments.length - 1];
        const bl = b.moments[b.moments.length - 1];
        return (bl?.createdAtMs || 0) - (al?.createdAtMs || 0);
      });

    owners.forEach(o => {
      const last = o.moments[o.moments.length - 1];
      const hasVideo = !!last?.mediaType && String(last.mediaType).startsWith('video/');
      // For video moments, use the user's avatar as thumbnail to avoid broken <img src="video">.
      const thumbUrl = hasVideo ? (o.ownerAvatarUrl || 'assets/images/truematch-mark.png') : (last?.mediaUrl || o.ownerAvatarUrl);
      html += buildStoryItemHTML({
        ownerId: o.ownerId,
        ownerName: o.ownerName,
        ownerAvatarUrl: o.ownerAvatarUrl,
        thumbUrl,
        hasVideo
      });
    });

    container.innerHTML = html;
  }

  async function refresh() {
    try {
      // Scope moments to matches + self (no global feed)
      const resp = await apiGet('/api/moments/list?scope=matches');
      if (resp && resp.ok && Array.isArray(resp.moments)) {
        groupMoments(resp.moments);
      } else {
        groupMoments([]);
      }
    } catch {
      groupMoments([]);
    }
    render(DOM.storiesContainer);
    render(DOM.mobileStoriesContainer);
  }

  function startProgress(durationMs) {
    if (!DOM.storyProgressFill) return;
    DOM.storyProgressFill.style.transition = 'none';
    DOM.storyProgressFill.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        DOM.storyProgressFill.style.transition = `width ${durationMs}ms linear`;
        DOM.storyProgressFill.style.width = '100%';
      });
    });
  }

  function setHeader(owner, moment) {
    if (DOM.storyUserName) DOM.storyUserName.textContent = owner?.ownerName || 'User';
    if (DOM.storyUserImg) {
      DOM.storyUserImg.src = owner?.ownerAvatarUrl || 'assets/images/truematch-mark.png';
      DOM.storyUserImg.style.backgroundColor = '#111';
    }
    // Update the small time label if present
    const t = DOM.dlgStory ? DOM.dlgStory.querySelector('.story-header-overlay .time') : null;
    if (t && moment?.createdAtMs) t.textContent = timeAgo(moment.createdAtMs);
  }

  function showMoment(owner, moment) {
    if (!moment) return;
    stopPlayback();
    setHeader(owner, moment);

    const isVideo = !!moment.mediaType && String(moment.mediaType).startsWith('video/');
    const url = moment.mediaUrl;

    if (isVideo && DOM.storyMainVideo) {
      if (DOM.storyMainImg) DOM.storyMainImg.style.display = 'none';
      DOM.storyMainVideo.style.display = 'block';
      DOM.storyMainVideo.src = url;
      DOM.storyMainVideo.muted = true;
      DOM.storyMainVideo.playsInline = true;

      // When metadata loads, start progress for the actual duration (capped).
      const onLoaded = () => {
        const dur = Number.isFinite(DOM.storyMainVideo.duration) ? DOM.storyMainVideo.duration * 1000 : 8000;
        const capped = Math.max(4000, Math.min(dur, 20000));
        startProgress(capped);
        // Attempt autoplay; if blocked, user can tap to continue.
        DOM.storyMainVideo.play().catch(() => {});
      };
      DOM.storyMainVideo.onloadedmetadata = onLoaded;
      DOM.storyMainVideo.onended = () => next();
    } else {
      if (DOM.storyMainVideo) {
        DOM.storyMainVideo.style.display = 'none';
        DOM.storyMainVideo.src = '';
      }
      if (DOM.storyMainImg) {
        DOM.storyMainImg.style.display = 'block';
        DOM.storyMainImg.src = url || 'assets/images/truematch-mark.png';
        DOM.storyMainImg.style.backgroundColor = '#111';
      }
      startProgress(IMG_DURATION_MS);
      timer = setTimeout(() => next(), IMG_DURATION_MS);
    }
  }

  function openOwnerStories(ownerId) {
    const owner = momentsByOwner.get(ownerId);
    if (!owner || !owner.moments || owner.moments.length === 0) return;

    activeOwnerId = ownerId;
    activeList = owner.moments.slice();
    activeIndex = 0;

    if (DOM.dlgStory) {
      DOM.dlgStory.showModal();
    }

    showMoment(owner, activeList[activeIndex]);

    // Tap zones: left = prev, right = next
    const storyView = DOM.dlgStory ? DOM.dlgStory.querySelector('.story-view') : null;
    if (storyView && !storyView._momentsBound) {
      storyView._momentsBound = true;
      storyView.addEventListener('click', (e) => {
        // Ignore clicks on the close button area handled elsewhere
        const rect = storyView.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width * 0.33) prev();
        else next();
      });
    }
  }

  function next() {
    if (!activeOwnerId) return;
    const owner = momentsByOwner.get(activeOwnerId);
    if (!owner) return;
    activeIndex += 1;
    if (activeIndex >= activeList.length) {
      closeStory();
      return;
    }
    showMoment(owner, activeList[activeIndex]);
  }

  function prev() {
    if (!activeOwnerId) return;
    const owner = momentsByOwner.get(activeOwnerId);
    if (!owner) return;
    activeIndex -= 1;
    if (activeIndex < 0) activeIndex = 0;
    showMoment(owner, activeList[activeIndex]);
  }

  async function uploadFile(file) {
    if (!file) return;
    const type = String(file.type || '');
    if (!(type.startsWith('image/') || type.startsWith('video/'))) {
      showToast('Photo or video only for Moments.', 'error');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast('File too large. Use a smaller photo/video (max ~7MB).', 'error');
      return;
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('read failed'));
      r.readAsDataURL(file);
    });

    try {
      showToast('Uploading moment...');
      const resp = await apiPost('/api/moments/create', {
        mediaDataUrl: dataUrl,
        mediaType: type
      });
      if (resp && resp.ok) {
        showToast('Moment posted.');
        await refresh();
      } else {
        showToast(resp?.error || 'Upload failed.', 'error');
      }
    } catch {
      showToast('Upload failed.', 'error');
    }
  }

  function pickAndUpload() {
    if (!DOM.momentFileInput) {
      showToast('Upload input missing.', 'error');
      return;
    }
    DOM.momentFileInput.click();
  }

  function handleStoryClick(e) {
    const item = e.target.closest('.story-item');
    if (!item) return;

    if (item.classList.contains('action') || item.dataset.action === 'add-moment') {
      pickAndUpload();
      return;
    }

    const ownerId = item.dataset.ownerId;
    if (!ownerId) return;
    openOwnerStories(ownerId);
  }

  function closeStory() {
    stopPlayback();
    activeOwnerId = null;
    activeList = [];
    activeIndex = 0;
    if (DOM.dlgStory && DOM.dlgStory.open) DOM.dlgStory.close();
  }

  async function init() {
    // Bind file input once
    if (DOM.momentFileInput && !DOM.momentFileInput._momentsBound) {
      DOM.momentFileInput._momentsBound = true;
      DOM.momentFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        // Reset value so selecting same file again triggers change
        e.target.value = '';
        await uploadFile(file);
      });
    }

    // Ensure closing the dialog stops timers
    if (DOM.dlgStory && !DOM.dlgStory._momentsBound) {
      DOM.dlgStory._momentsBound = true;
      DOM.dlgStory.addEventListener('close', () => stopPlayback());
    }

    await refresh();
  }

  return {
    init,
    handleStoryClick,
    closeStory
  };
})();


// ---------------------------------------------------------------------
// UI POPULATION LOGIC (FIXED: Card Widths & Backgrounds)
// ---------------------------------------------------------------------

function populateMockContent() {
  console.log("Populating mock data...");

  // NEW MATCHES RAIL
  if (DOM.newMatchesRail) {
      const newMatches = ['Alexa', 'Sam', 'Mika', 'Joy'];
      if(DOM.newMatchCount) DOM.newMatchCount.textContent = newMatches.length;

      let html = '';
      newMatches.forEach(name => {
          html += `
            <div class="story-item" data-name="${name}">
              <div class="story-ring" style="border: 2px solid #ffd700; padding:2px;">
                <img class="story-img" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
              </div>
              <span class="story-name">${name}</span>
            </div>
          `;
      });
      DOM.newMatchesRail.innerHTML = html;
  }

  // MESSAGES GRID (UI FIX: Buttons aligned to bottom)
  const matches = [
    { name: 'Sofia', age: 24, msg: 'Hey! How are you?', time: '2m', img: 'assets/images/truematch-mark.png', unread: true },
    { name: 'Chloe', age: 22, msg: 'See you later! 👋', time: '1h', img: 'assets/images/truematch-mark.png', unread: false },
    { name: 'Liam', age: 26, msg: 'Haha that was funny', time: '3h', img: 'assets/images/truematch-mark.png', unread: false },
    { name: 'Noah', age: 25, msg: 'Sent a photo', time: '1d', img: 'assets/images/truematch-mark.png', unread: false }
  ];

  if (DOM.matchesContainer) {
    let html = '';
    matches.forEach(m => {
      const unreadDot = m.unread ? '<div class="match-unread-dot"></div>' : '';
      const msgStyle = m.unread ? 'color: #fff; font-weight:bold;' : '';
      // INLINE STYLES APPLIED HERE:
      html += `
        <div class="match-card" data-msg="${m.msg}" style="display: flex; flex-direction: column; height: 100%;">
          <img src="${m.img}" class="match-img" alt="${m.name}" style="background:${getRandomColor()}">
          <div class="match-info" style="flex: 1; display: flex; flex-direction: column; padding: 12px;">
            <div style="flex: 1; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                    <span class="match-name">${m.name}, ${m.age}</span>
                    <div class="match-msg" style="${msgStyle}">
                    ${unreadDot} ${m.msg} • ${m.time}
                    </div>
                </div>
            </div>
            <button class="btn btn--sm btn--primary btn-chat-action" style="width:100%; margin-top: auto;">Chat</button>
          </div>
        </div>
      `;
    });
    DOM.matchesContainer.innerHTML = html;
  }

  // SHORTLIST (FIXED: Uniform Colors & Clean UI)
  if (DOM.panelShortlistBody) {
    if(!DOM.panelShortlistBody.querySelector('.matches-grid')) {
        const shortlisted = [
            { name: 'Isabella', age: 24, job: 'Fashion Model' },
            { name: 'Marcus', age: 29, job: 'Tech CEO & Founder' },
            { name: 'Sarah', age: 26, job: 'Artist' }
        ];
        
        let html = '<div class="matches-grid" style="margin-top:20px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); justify-content: center; gap: 15px;">';
        
        shortlisted.forEach((s) => {
          html += `
            <div class="glass-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); text-align:center; padding: 25px 20px !important; display:flex; flex-direction:column; justify-content:space-between; height:100%; transition: transform 0.2s;">
                
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="width:80px; height:80px; border-radius:50%; border: 2px solid #00aff0; padding: 3px; margin-bottom: 15px;">
                        <img src="assets/images/truematch-mark.png" style="width:100%; height:100%; border-radius:50%; object-fit:cover; background: #1a1a1a;">
                    </div>
                    
                    <h3 style="margin:0; color:#fff; font-size:1.1rem; font-weight:700;">${s.name}, ${s.age}</h3>
                    <p class="tiny muted" style="margin:5px 0 0; font-size:0.85rem; color:#8899a6;">${s.job}</p>
                </div>

                <button class="btn btn--sm btn--primary btn-shortlist-connect" data-name="${s.name}" style="width:100%; margin-top:20px; border-radius:99px; background: rgba(0, 175, 240, 0.15); color: #00aff0; border: 1px solid rgba(0, 175, 240, 0.3);">
                    Connect
                </button>
            </div>
          `;
        });
        html += '</div>';
        
        // Add Header if missing
        if(!DOM.panelShortlistBody.innerHTML.trim()) {
             DOM.panelShortlistBody.insertAdjacentHTML('beforeend', '<div class="feed-header">Daily Shortlist</div>');
        }
        DOM.panelShortlistBody.insertAdjacentHTML('beforeend', html);

        // SWEETALERT EVENT LISTENER
        const btns = DOM.panelShortlistBody.querySelectorAll('.btn-shortlist-connect');
        btns.forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.getAttribute('data-name');
                if (typeof Swal !== 'undefined') {
                    const Toast = Swal.mixin({
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 3000,
                      timerProgressBar: false,
                      background: '#1a1a20',
                      color: '#fff',
                      iconColor: '#00aff0',
                      didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                      }
                    });
                    Toast.fire({
                      icon: 'success',
                      title: `Request sent to ${name}`
                    });
                } else {
                    alert(`Request sent to ${name}!`);
                }
                this.textContent = 'Pending';
                this.style.background = 'transparent';
                this.style.color = '#888';
                this.style.borderColor = '#444';
                this.disabled = true;
            });
        });
    }
  }

  // CREATORS (FIXED: Reduced Banner Width)
  if (DOM.panelCreatorsBody) {
    if(!DOM.panelCreatorsBody.querySelector('.creators-grid')) {
        const creators = [
            { name: 'Sasha Grey', followers: '1.2M', price: 'FREE', locked: false, handle: 'Follow' },
            { name: 'Kim Lee', followers: '850k', price: 'Unlock 💎 50', locked: true, handle: 'Unlock' },
            { name: 'Tyler', followers: '500k', price: 'Unlock 💎 100', locked: true, handle: 'Unlock' },
            { name: 'Eva Art', followers: '200k', price: 'Unlock 💎 20', locked: true, handle: 'Unlock' }
        ];

        // ADDED: max-width: 500px and margin: 0 auto
        let html = `
            <div style="background: linear-gradient(90deg, #00c6ff, #0072ff); border-radius: 20px; padding: 30px; text-align: center; margin: 0 auto 25px; max-width: 500px; position: relative; overflow: hidden;">
                <h2 style="margin:0; font-size:1.5rem; color:#fff;">Become a Creator</h2>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 15px;">Monetize your fanbase today.</p>
                <button class="btn btn--white" id="btnOpenCreatorApplyInjected" style="border-radius:99px; padding: 8px 30px; color:#0072ff; font-weight:800;">Apply</button>
                <i class="fa-solid fa-fire" style="position: absolute; right: -10px; bottom: -20px; font-size: 8rem; color: rgba(255,255,255,0.1); transform: rotate(-15deg);"></i>
            </div>

            <div class="category-scroll" id="creatorFilters">
                <div class="cat-pill active">All</div>
                <div class="cat-pill">Popular</div>
                <div class="cat-pill">New</div>
                <div class="cat-pill">Nearby</div>
                <div class="cat-pill">VIP</div>
            </div>

            <div class="creators-grid">
        `;

        creators.forEach(c => {
            const lockedClass = c.locked ? 'locked' : '';
            const bgGradient = c.locked ? 'linear-gradient(135deg, #1a1a1a, #000)' : 'linear-gradient(135deg, #4b0082, #800080)';
            const btnStyle = c.locked ? 'background:#ffd700; color:#000;' : 'background:rgba(255,255,255,0.2); color:#fff;';
            const badge = c.locked ? 'PREMIUM' : 'FREE';
            const badgeColor = c.locked ? '#ffd700' : '#fff';
            
            html += `
                <div class="creator-card" style="background: ${bgGradient}; border: 1px solid rgba(255,255,255,0.1); height: 240px; position: relative; border-radius: 16px; padding: 15px; display:flex; flex-direction:column; justify-content:flex-end;">
                    <span style="position:absolute; top:15px; right:15px; background:${badgeColor}; color:#000; font-size:0.7rem; font-weight:800; padding:2px 6px; border-radius:4px;">${badge}</span>
                    
                    ${c.locked ? '<div style="position:absolute; top:40%; left:50%; transform:translate(-50%, -50%); width:50px; height:50px; background:rgba(255,255,255,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);"><i class="fa-solid fa-lock" style="color:#fff;"></i></div>' : ''}
                    
                    <h3 style="margin:0; font-size:1.1rem;">${c.name} <i class="fa-solid fa-circle-check" style="color:#00aff0; font-size:0.8rem;"></i></h3>
                    <p style="margin:2px 0 10px; font-size:0.8rem; color:rgba(255,255,255,0.7);"><i class="fa-solid fa-users"></i> ${c.followers}</p>
                    <button class="btn-unlock-action" style="width:100%; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer; ${btnStyle}">${c.price}</button>
                </div>
            `;
        });
        html += `</div>`;
        
        DOM.panelCreatorsBody.innerHTML = ''; 
        DOM.panelCreatorsBody.insertAdjacentHTML('beforeend', '<div class="feed-header">Creators</div>' + html);
        
        // Listeners for Creators
        const newApplyBtn = DOM.panelCreatorsBody.querySelector('#btnOpenCreatorApplyInjected');
        if(newApplyBtn && DOM.dlgCreatorApply) {
            newApplyBtn.addEventListener('click', () => DOM.dlgCreatorApply.showModal());
        }

        // Filter Interactivity (Clickable)
        const pills = DOM.panelCreatorsBody.querySelectorAll('.cat-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => { 
                    p.classList.remove('active'); 
                    p.style.background = 'rgba(255,255,255,0.1)'; 
                    p.style.borderColor = 'rgba(255,255,255,0.1)';
                });
                pill.classList.add('active');
                pill.style.background = '#00aff0';
                pill.style.borderColor = '#00aff0';
            });
        });

        // Unlock Buttons Interactivity
        DOM.panelCreatorsBody.querySelectorAll('.btn-unlock-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(btn.textContent.includes('FREE')) showToast('Followed successfully!');
                else showToast('Insufficient gems!', 'error');
            });
        });
    }
  }

  // PREMIUM (FIXED: Increased Width 600px, Restored Glass BG)
  if (DOM.panelPremiumBody) {
     if(!DOM.panelPremiumBody.querySelector('.premium-plans')) {
         const html = `
            <div class="premium-plans" style="padding-top: 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%;">
                
                <div class="glass-card" style="width:100%; max-width:600px; padding: 40px 30px; text-align:center; border: 1px solid #ffd700; position:relative; overflow:hidden; background: rgba(20, 20, 20, 0.2); backdrop-filter: blur(20px);">
                    
                    <div style="position:absolute; top:0; left:0; right:0; height:4px; background: linear-gradient(90deg, #FFD700, #FDB931);"></div>
                    
                    <i class="fa-solid fa-crown" style="color:#ffd700; font-size:3.5rem; margin-bottom:20px; filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));"></i>
                    
                    <h2 style="font-size: 2rem; margin:0; font-weight:800;">iTrueMatch <span style="color:#ffd700;">GOLD</span></h2>
                    <p style="color:#aaa; margin: 10px 0 30px;">Upgrade to the ultimate experience.</p>
                    
                    <ul style="list-style:none; padding:0; text-align:left; margin-bottom:40px; display:flex; flex-direction:column; gap:20px; width:100%; max-width:400px; margin-left:auto; margin-right:auto;">
                        <li style="display:flex; align-items:center; gap:15px; font-size:1rem; color:#fff;">
                            <div style="width:30px; height:30px; background:rgba(255,215,0,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#ffd700;"><i class="fa-solid fa-eye"></i></div>
                            See who liked you
                        </li>
                        <li style="display:flex; align-items:center; gap:15px; font-size:1rem; color:#fff;">
                            <div style="width:30px; height:30px; background:rgba(255,215,0,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#ffd700;"><i class="fa-solid fa-infinity"></i></div>
                            Unlimited Swipes
                        </li>
                        <li style="display:flex; align-items:center; gap:15px; font-size:1rem; color:#fff;">
                            <div style="width:30px; height:30px; background:rgba(255,215,0,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#ffd700;"><i class="fa-solid fa-bolt"></i></div>
                            1 Free Boost / month
                        </li>
                         <li style="display:flex; align-items:center; gap:15px; font-size:1rem; color:#fff;">
                            <div style="width:30px; height:30px; background:rgba(255,215,0,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#ffd700;"><i class="fa-solid fa-earth-americas"></i></div>
                            Passport to any location
                        </li>
                    </ul>

                    <button id="btnPremiumUpgradeInternal" style="width:100%; max-width:400px; padding:15px; font-size:1.1rem; font-weight:800; border-radius:99px; border:none; background: linear-gradient(90deg, #FFD700, #FDB931); color:#000; box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); cursor:pointer; transition: transform 0.2s;">Get Premium Access</button>
                    <p style="margin-top:15px; font-size:0.8rem; color:#666;">Recurring billing. Cancel anytime.</p>
                </div>
            </div>`;
         DOM.panelPremiumBody.innerHTML = html;
         
         const btnUpgrade = DOM.panelPremiumBody.querySelector('#btnPremiumUpgradeInternal');
         if(btnUpgrade && DOM.dlgPremiumApply) {
             btnUpgrade.addEventListener('click', () => DOM.dlgPremiumApply.showModal());
         }
     }
  }

  // STORIES (Centered + Icon)
  if (DOM.storiesContainer) {
    const stories = ['Bea', 'Kat', 'Pia', 'Coleen', 'Sam'];
    // INLINE STYLES APPLIED: display: flex; align-items: center; justify-content: center;
    let html = `
        <div class="story-item action" onclick="document.querySelector('button[data-panel=swipe]').click()">
          <div class="story-ring ring-add" style="display: flex; align-items: center; justify-content: center;">
             <i class="fa-solid fa-plus"></i>
          </div>
          <span class="story-name">Add</span>
        </div>`;
    stories.forEach(name => {
      html += `
        <div class="story-item" data-name="${name}">
          <div class="story-ring">
            <img class="story-img" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
          </div>
          <span class="story-name">${name}</span>
        </div>
      `;
    });
    DOM.storiesContainer.innerHTML = html;
  }
  
  // ADMIRERS (UI FIX: Forced Left Align)
  if (DOM.admirerContainer) {
    let html = '';
    const admirers = [
        { name: 'Celine', age: 23, city: 'Boston' },
        { name: 'Patricia', age: 25, city: 'Seattle' },
        { name: 'Gab', age: 22, city: 'Austin' },
        { name: 'Yassi', age: 24, city: 'Denver' }
    ];
    
    if (DOM.admirerCount) {
        DOM.admirerCount.textContent = `${admirers.length} New`;
    }
    
    admirers.forEach(adm => {
        // INLINE STYLES APPLIED: justify-content: flex-start; gap: 15px; text-align: left;
        html += `
          <div class="admirer-row" onclick="document.querySelector('button[data-panel=premium]').click()" style="justify-content: flex-start; gap: 15px;">
             <img class="admirer-img-blur" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
             <div class="admirer-info" style="flex: 1; text-align: left;">
                <h4 style="margin:0;">${adm.name}, ${adm.age}</h4>
                <p style="margin:0;">📍 ${adm.city}</p>
             </div>
             <div class="admirer-action"><i class="fa-solid fa-lock"></i></div>
          </div>
        `;
    });
    DOM.admirerContainer.innerHTML = html;
  }

  // ACTIVE NEARBY
  if (DOM.activeNearbyContainer) {
      let html = '';
      for(let i=0; i<6; i++) {
          html += `
            <div class="active-item" onclick="document.querySelector('button[data-panel=swipe]').click()">
                <img class="active-img" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
                <div class="online-dot"></div>
            </div>
          `;
      }
      DOM.activeNearbyContainer.innerHTML = html;
  }
}

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

    state.matchesAll = Array.isArray(res.matches) ? res.matches : [];
    renderMatchesFromApi(state.matchesAll);
    setupMatchesSearch();
} catch (err) {
    console.warn('loadMatchesPanel failed:', err);
  }
}

function renderMatchesFromApi(matches, opts = {}) {
  const updateCounts = opts.updateCounts !== false;
  // Update counters
  const count = matches.length;
  if (updateCounts) {
    if (DOM.matchCount) DOM.matchCount.textContent = String(count);
    if (DOM.newMatchCount) DOM.newMatchCount.textContent = String(Math.min(count, 6));
  }

  // --- Stories (new matches rail) ---
  if (DOM.newMatchesRail) {
    if (!count) {
      DOM.newMatchesRail.innerHTML = '<div style="color:rgba(255,255,255,0.65); font-size:0.9rem;"></div>';
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
      const seedColor = getRandomColor();
      return `
        <div class="match-card" data-name="${safeName}" data-email="${m.email || ''}" data-photo-url="${photoUrl}" data-msg="${msg}">
          <div class="match-img" style="background-color:${seedColor}; ${photoUrl ? `background-image:url('${photoUrl}'); background-size:cover; background-position:center;` : ''}"></div>
          <div class="match-info">
            <div class="match-name">${safeName}</div>
            <div class="match-sub">${safeSub}</div>
            <div class="match-last">${msg || 'Tap to chat'}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}
let _matchesSearchBound = false;

function setupMatchesSearch() {
  if (_matchesSearchBound) return;
  if (!DOM.matchesSearch) return;

  _matchesSearchBound = true;

  DOM.matchesSearch.addEventListener('input', () => {
    const q = String(DOM.matchesSearch.value || '').trim().toLowerCase();
    const all = Array.isArray(state.matchesAll) ? state.matchesAll : [];

    if (!q) {
      renderMatchesFromApi(all, { updateCounts: false });
      return;
    }

    const filtered = all.filter(m => {
      const name = String(m.name || '').toLowerCase();
      const email = String(m.email || m.id || '').toLowerCase();
      const city = String(m.city || '').toLowerCase();
      return name.includes(q) || email.includes(q) || city.includes(q);
    });

    renderMatchesFromApi(filtered, { updateCounts: false });
  });
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

  const meEmail = String((state.me && state.me.email) || '').toLowerCase();
  const peerEmail = String(state.currentChatPeerEmail || '').toLowerCase();

  if (!messages.length) {
    DOM.chatBody.innerHTML = '<p style="margin:0; color:rgba(255,255,255,0.7);">Start the conversation.</p>';
  } else {
    DOM.chatBody.innerHTML = messages.map(msg => {
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

  DOM.chatBody.scrollTop = DOM.chatBody.scrollHeight;

  // Read receipt line (Tier1+)
  if (DOM.chatReceiptLine) {
    if (planKey === 'free') {
      DOM.chatReceiptLine.textContent = '● Online';
    } else {
      const lastOut = [...messages].reverse().find(m => String(m.from || '').toLowerCase() === meEmail && String(m.to || '').toLowerCase() === peerEmail);
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

    DOM.chatInput.value = '';
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

    const [approved, scheduled] = await Promise.all([
      apiGet('/api/shortlist/approved'),
      apiGet('/api/concierge/scheduled')
    ]);

    renderConciergePanel(approved, scheduled);
  } catch (err) {
    console.warn('loadConciergePanel failed:', err);
  }
}

function renderConciergePanel(approvedRes, scheduledRes) {
  if (!DOM.panelConciergeBody) return;

  const approved = (approvedRes && approvedRes.ok && Array.isArray(approvedRes.items)) ? approvedRes.items : [];
  const scheduled = (scheduledRes && scheduledRes.ok && Array.isArray(scheduledRes.scheduled)) ? scheduledRes.scheduled : [];

  DOM.panelConciergeBody.innerHTML = `
    <div style="margin-bottom:14px;">
      <h3 style="margin:0 0 8px 0;">Approved profiles</h3>
      <div class="conc-list" id="conc-approved"></div>
    </div>
    <div>
      <h3 style="margin:0 0 8px 0;">Scheduled dates</h3>
      <div class="conc-list" id="conc-scheduled"></div>
    </div>
  `;

  const approvedEl = DOM.panelConciergeBody.querySelector('#conc-approved');
  const scheduledEl = DOM.panelConciergeBody.querySelector('#conc-scheduled');

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

  if (!scheduled.length) {
    scheduledEl.innerHTML = '<div style="color:rgba(255,255,255,0.7);">No scheduled dates yet.</div>';
  } else {
    scheduledEl.innerHTML = scheduled.map(it => {
      const p = it.profile || it;
      const safeName = String(p.name || 'Profile').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeCity = String(p.city || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const when = it.when || it.date || it.time || '';
      return `
        <div class="conc-card">
          <div class="conc-meta">
            <div class="conc-name">${safeName}</div>
            <div class="conc-sub">${safeCity}${when ? ' • ' + when : ''}</div>
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
  if (DOM.storiesContainer) {
    const hasStories = DOM.storiesContainer.querySelector('.story-item');
    if (!hasStories) {
      DOM.storiesContainer.innerHTML = "<div class='story-item action'><div class='story-ring ring-add'><i class='fa-solid fa-plus'></i></div><span class='story-name'>Add</span></div>";
    }
  }
}

// ---------------------------------------------------------------------
// BACKEND SYNC
// ---------------------------------------------------------------------

async function loadMe() {
  try {
    let user, prefs;

    if (DEV_MODE) {
      user = getMockUser();
      prefs = { city: 'New York', ageMin: 21, ageMax: 35, ethnicity: 'caucasian', lookingFor: ['women'], intent: 'long-term', dealbreakers: '', sharedValues: ['fitness'] };
    } else {
      const data = await apiGet('/api/me');
      const local = safeGetLocalUser();

      if (!data || !data.ok || !data.user) {
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
    if (!DEV_MODE) renderCreatorPremiumEntryCards();

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
  const locked = !DEV_MODE && state.plan === 'free';
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


async function handleCreatorApplicationSubmit() {
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
  if (status === 'pending') {
    showToast('Premium Society application is already pending.', 'error');
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
      // If user is not eligible (not Elite/Concierge), guide them to upgrade.
      if (res && (res.code === 'not_eligible' || /require/i.test(String(msg)))) {
        showToast(msg, 'error');
        // Optional convenience: open upgrade page
        window.location.href = './tier.html?upgrade=1';
        return;
      }
      throw new Error(msg);
    }

    showToast('Premium Society application submitted. Status: pending.', 'success');

    // Update local state immediately so UI reflects pending and watcher can run.
    state.me.premiumStatus = 'pending';
    startPremiumApprovalWatcher();
    if (DOM.dlgPremiumApply) DOM.dlgPremiumApply.close();

    state.me.premiumStatus = 'pending';
    state.me.premiumApplication = { ...payload, submittedAt: Date.now() };

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
  if (state.selectedAvatarDataUrl) profilePayload.avatarDataUrl = state.selectedAvatarDataUrl;

  const prefsPayload = {
    city: preferredCity,
    ageMin,
    ageMax,
    lookingFor: [lookingFor]
  };
  if (ethnicity) prefsPayload.ethnicity = ethnicity;
  if (intent) prefsPayload.intent = intent;
  if (dealbreakers) prefsPayload.dealbreakers = dealbreakers;
  prefsPayload.sharedValues = Array.isArray(sharedValues) ? sharedValues : [];

  try {
    let profileRes;
    if (DEV_MODE) profileRes = { ok: true, user: { ...state.me, ...profilePayload } };
    else profileRes = await apiUpdateProfile(profilePayload);

    if (!profileRes || !profileRes.ok) {
      throw new Error('Failed to update profile.');
    }

    let prefsRes;
    if (DEV_MODE) prefsRes = { ok: true, prefs: { ...state.prefs, ...prefsPayload } };
    else prefsRes = await apiSavePrefs(prefsPayload);

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
  let isActing = false;
  let everLoaded = false;

  let lastLimit = DAILY_SWIPE_LIMIT; // default (Free), may become null for paid
  let lastRemaining = DAILY_SWIPE_LIMIT;

  function setButtonsDisabled(disabled) {
    const btns = [DOM.btnSwipePass, DOM.btnSwipeLike, DOM.btnSwipeSuper];
    btns.forEach(b => { if (b) b.disabled = !!disabled; });
  }

  function setSwipeStats(remaining, limit) {
    // limit === null => unlimited
    lastLimit = (limit === null || typeof limit === 'undefined') ? null : Number(limit);
    lastRemaining = (remaining === null || typeof remaining === 'undefined') ? null : Number(remaining);

    // Update ring/counter UI (if present)
    if (lastLimit === null) {
      if (DOM.statsCountDisplay) DOM.statsCountDisplay.textContent = '∞';
      if (DOM.statsRingCircle) DOM.statsRingCircle.style.strokeDashoffset = 0;
      return;
    }

    const safeLimit = Number.isFinite(lastLimit) && lastLimit > 0 ? lastLimit : DAILY_SWIPE_LIMIT;
    const safeRemaining = Number.isFinite(lastRemaining) ? Math.max(0, Math.min(safeLimit, lastRemaining)) : safeLimit;
    updateSwipeStats(safeRemaining, safeLimit);
  }

  async function init(force = false) {
    if (!force && everLoaded) return;
    await loadCandidates();
  }

  async function loadCandidates() {
    if (isLoading) return;
    isLoading = true;
    isActing = false;
    setButtonsDisabled(true);

    if (DOM.swipeStack) DOM.swipeStack.innerHTML = '';
    if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = true;

    try {
      const data = await apiGet('/api/swipe/candidates');
      everLoaded = true;

      if (data && data.ok && (data.limit === null || typeof data.limit === 'number' || typeof data.limit === 'undefined')) {
        setSwipeStats(data.remaining, data.limit);
      }

      const list = (data && Array.isArray(data.candidates)) ? data.candidates : [];

      if (data && data.limitReached) {
        // Free cap reached: keep empty state visible and disable controls
        profiles = [];
        currentIndex = 0;
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
        setButtonsDisabled(true);
        showToast('Daily swipe limit reached. Come back tomorrow.', 'error');
        return;
      }

      if (list.length > 0) {
        profiles = list;
        currentIndex = 0;
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = true;
        renderCards();
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'flex';
        setButtonsDisabled(false);
      } else {
        profiles = [];
        currentIndex = 0;
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
        setButtonsDisabled(true);
      }
    } catch (e) {
      console.error('Swipe Error', e);
      showToast('Failed to load swipe deck.', 'error');
      profiles = [];
      currentIndex = 0;
      if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
      if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
      setButtonsDisabled(true);
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
    if (type === 'superlike') return 'superlike';
    if (type === 'pass') return 'pass';
    return 'like';
  }

  async function handleAction(type) {
    if (isLoading || isActing) return;
    if (currentIndex >= profiles.length) return;

    isActing = true;
    setButtonsDisabled(true);

    const active = document.getElementById('activeSwipeCard');
    let animClass = 'swipe-out-right';
    if (type === 'pass') animClass = 'swipe-out-left';
    if (active) active.classList.add(animClass);

    const targetEmail = profiles[currentIndex].id;

    let okToAdvance = true;
    let limitReachedAfter = false;

    try {
      const res = await apiPost('/api/swipe/action', { targetEmail, action: mapAction(type) });

      if (!res || !res.ok) {
        okToAdvance = false;
        const code = String((res && (res.code || res.error || res.message)) || '').toLowerCase();

        if (code === 'target_not_premium') {
          showToast('You can only swipe on paid members.', 'error');
        } else if (code === 'not_logged_in' || res?.status === 401) {
          showToast('Session expired. Please sign in again.', 'error');
          try { clearSession(); } catch {}
          try { window.location.href = 'index.html'; } catch {}
          return;
        } else {
          showToast((res && (res.error || res.message)) || 'Swipe failed. Please try again.', 'error');
        }
      } else {
        setSwipeStats(res.remaining, res.limit);
        limitReachedAfter = !!res.limitReached;

        const isMatch = !!(res.isMatch || res.match);
        if (isMatch) showToast("It’s a match! 🎉 Check Matches tab.", 'success');
      }
    } catch (e) {
      console.error(e);
      okToAdvance = false;
      showToast('Swipe failed. Please try again.', 'error');
    }

    if (!okToAdvance) {
      // Reset card UI (remove animation and re-render current top card)
      if (active) active.classList.remove('swipe-out-left', 'swipe-out-right');
      renderCards();
      isActing = false;
      setButtonsDisabled(false);
      return;
    }

    let msg = 'Liked!';
    if (type === 'pass') msg = 'Passed';
    if (type === 'superlike') msg = 'Super Liked! ⭐';
    showToast(msg);

    setTimeout(() => {
      // If user just hit the daily cap, end the deck immediately.
      if (limitReachedAfter) {
        profiles = [];
        currentIndex = 0;
        if (DOM.swipeStack) DOM.swipeStack.innerHTML = '';
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
        setButtonsDisabled(true);
        isActing = false;
        return;
      }

      currentIndex++;
      if (currentIndex >= profiles.length) {
        if (DOM.swipeStack) DOM.swipeStack.innerHTML = '';
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
        setButtonsDisabled(true);
      } else {
        renderCards();
        setButtonsDisabled(false);
      }
      isActing = false;
    }, 420);
  }

  return {
    init,
    like: () => handleAction('like'),
    pass: () => handleAction('pass'),
    superLike: () => handleAction('superlike')
  };
})();;

// ONE SINGLE ENTRY POINT
window.addEventListener('DOMContentLoaded', initApp);