/*
  creators.js (hard consolidated bundle)
*/

// ===== data.js (bundled) =====
const __CreatorsData = (function() {


 const BLANK_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20fill%3D%22%23222%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3C%2Fsvg%3E';
 const DEFAULT_AVATAR = 'assets/images/truematch-mark.png';

// --- SYSTEM DEFAULTS ---
 let COLLECTIONS_DB = [
    { id: 'fans', name: 'Fans', type: 'user', count: 0, system: true },
    { id: 'following', name: 'Following', type: 'user', count: 0, system: true },
    { id: 'restricted', name: 'Restricted', type: 'user', count: 0, system: true },
    { id: 'blocked', name: 'Blocked', type: 'user', count: 0, system: true },
    { id: 'favorites', name: 'Favorite Posts', type: 'post', count: 0, system: true },
    { id: 'watch_later', name: 'Watch Later', type: 'post', count: 0, system: false }
];

// --- CLEAN: EMPTY USERS LIST ---
 const MSG_USERS = [];

// --- CLEAN: EMPTY CHAT HISTORY ---
 const CHAT_DATA = {};

// --- 🔥 NEW: CLEAN NOTIFICATIONS (Para sa Backend) ---
 const NOTIFICATIONS_DATA = []; 

// --- UI TRANSLATIONS ---
 const TRANSLATIONS = {
    'en': {
        name: 'English',
        // Sidebar
        nav_home: 'Home', nav_notif: 'Notifications', nav_msg: 'Messages', nav_col: 'Collections', nav_subs: 'Subscriptions', nav_card: 'Add card', nav_profile: 'My profile', nav_more: 'More', nav_post: 'NEW POST',
        // Settings Menu
        set_header: 'SETTINGS',
        set_profile: 'Profile', set_profile_desc: 'Edit details, avatar, cover',
        set_account: 'Account', set_account_desc: 'Username, email, phone',
        set_privacy: 'Privacy and safety', set_privacy_desc: 'Discoverability, message privacy',
        set_security: 'Security', set_security_desc: 'Password, 2FA, Sessions',
        set_notif: 'Notifications', set_notif_desc: 'Push, Email, Telegram',
        set_sub: 'Subscription price', set_sub_desc: 'Bundles, promotions',
        set_pay_title: 'Payments',
        set_cards: 'Your cards', set_cards_desc: 'To subscribe',
        set_bank: 'Bank details', set_bank_desc: 'To earn',
        set_gen_title: 'General',
        set_display: 'Display', set_display_desc: 'Dark mode, language',
        set_help: 'Help and support', set_help_desc: 'FAQ, Support tickets',
        // Popover
        pop_profile: 'My profile', pop_col: 'Collections', pop_set: 'Settings',
        pop_cards: 'Your cards', pop_cards_sub: '(to subscribe)',
        pop_creator: 'Become a creator', pop_creator_sub: '(to earn)',
        pop_help: 'Help and support', pop_dark: 'Dark mode', pop_logout: 'Log out',
        // Settings Content
        lbl_lang: 'Language', lbl_dark: 'Dark Mode',
        // Cards UI
        card_tab_cards: 'YOUR CARDS', card_tab_pay: 'PAYMENTS',
        card_alert: 'Please add a new card to subscribe to other users or recharge your wallet.',
        card_compliant: 'We are fully compliant with Payment Card Industry Data Security Standards.',
        card_statement: 'The charges on your credit card statement will appear as iTrueMatch',
        card_footer_1: 'Fenix International Limited, 9th Floor, 107 Cheapside, London, EC2V 6DN',
        card_footer_2: 'Fenix Internet LLC, 1000 N.West Street, Suite 1200, Wilmington, Delaware, 19801 USA'
    },
    'ph': {
        name: 'Filipino (Tagalog)',
        nav_home: 'Home', nav_notif: 'Abiso', nav_msg: 'Mensahe', nav_col: 'Koleksyon', nav_subs: 'Subscriptions', nav_card: 'Maglagay ng Card', nav_profile: 'Aking Profile', nav_more: 'Iba pa', nav_post: 'POST',
        set_header: 'SETTINGS',
        set_profile: 'Profile', set_profile_desc: 'Palitan ang detalye, avatar',
        set_account: 'Account', set_account_desc: 'Username, email, telepono',
        set_privacy: 'Privacy at Ligtas', set_privacy_desc: 'Sino makakakita sayo',
        set_security: 'Seguridad', set_security_desc: 'Password, 2FA',
        set_notif: 'Abiso', set_notif_desc: 'Push, Email, Telegram',
        set_sub: 'Presyo ng Subskripsyon', set_sub_desc: 'Bundles, promosyon',
        set_pay_title: 'Bayad',
        set_cards: 'Iyong mga Card', set_cards_desc: 'Pambayad',
        set_bank: 'Bangko', set_bank_desc: 'Payouts at Kita',
        set_gen_title: 'Pangkalahatan',
        set_display: 'Itsura', set_display_desc: 'Dark mode, wika',
        set_help: 'Tulong', set_help_desc: 'FAQ, Tickets',
        pop_profile: 'Aking profile', pop_col: 'Koleksyon', pop_set: 'Settings',
        pop_cards: 'Mga Card', pop_cards_sub: '(pambayad)',
        pop_creator: 'Maging Creator', pop_creator_sub: '(kumita)',
        pop_help: 'Tulong at Suporta', pop_dark: 'Dark mode', pop_logout: 'Mag-logout',
        lbl_lang: 'Wika', lbl_dark: 'Dark Mode',
        card_tab_cards: 'MGA CARD MO', card_tab_pay: 'MGA BAYAD',
        card_alert: 'Maglagay ng card para makapag-subscribe sa iba o lagyan ng laman ang wallet.',
        card_compliant: 'Kami ay fully compliant sa Payment Card Industry Data Security Standards.',
        card_statement: 'Ang lalabas sa statement ng iyong credit card ay iTrueMatch',
        card_footer_1: 'Fenix International Limited, 9th Floor, 107 Cheapside, London, EC2V 6DN',
        card_footer_2: 'Fenix Internet LLC, 1000 N.West Street, Suite 1200, Wilmington, Delaware, 19801 USA'
    },
    'es': {
        name: 'Español',
        nav_home: 'Inicio', nav_notif: 'Notificaciones', nav_msg: 'Mensajes', nav_col: 'Colecciones', nav_subs: 'Suscripciones', nav_card: 'Añadir tarjeta', nav_profile: 'Mi perfil', nav_more: 'Más', nav_post: 'PUBLICAR',
        set_header: 'CONFIGURACIÓN',
        set_profile: 'Perfil', set_profile_desc: 'Editar detalles, avatar',
        set_account: 'Cuenta', set_account_desc: 'Usuario, email, teléfono',
        set_privacy: 'Privacidad', set_privacy_desc: 'Visibilidad, mensajes',
        set_security: 'Seguridad', set_security_desc: 'Contraseña, 2FA',
        set_notif: 'Notificaciones', set_notif_desc: 'Push, Email, Telegram',
        set_sub: 'Precio de suscripción', set_sub_desc: 'Paquetes, promociones',
        set_pay_title: 'Pagos',
        set_cards: 'Tus tarjetas', set_cards_desc: 'Para suscribirse',
        set_bank: 'Detalles bancarios', set_bank_desc: 'Pagos y Ganancias',
        set_gen_title: 'General',
        set_display: 'Pantalla', set_display_desc: 'Modo oscuro, idioma',
        set_help: 'Ayuda', set_help_desc: 'FAQ, Soporte',
        pop_profile: 'Mi perfil', pop_col: 'Colecciones', pop_set: 'Ajustes',
        pop_cards: 'Tus tarjetas', pop_cards_sub: '(para suscribirse)',
        pop_creator: 'Ser creador', pop_creator_sub: '(para ganar)',
        pop_help: 'Ayuda y soporte', pop_dark: 'Modo oscuro', pop_logout: 'Cerrar sesión',
        lbl_lang: 'Idioma', lbl_dark: 'Modo oscuro',
        card_tab_cards: 'TUS TARJETAS', card_tab_pay: 'PAGOS',
        card_alert: 'Por favor añade una tarjeta para suscribirte a otros usuarios.',
        card_compliant: 'Cumplimos totalmente con los estándares de seguridad de datos.',
        card_statement: 'Los cargos en tu estado de cuenta aparecerán como iTrueMatch',
        card_footer_1: 'Fenix International Limited, 9th Floor, 107 Cheapside, London, EC2V 6DN',
        card_footer_2: 'Fenix Internet LLC, 1000 N.West Street, Suite 1200, Wilmington, Delaware, 19801 USA'
    }
};

// =============================================================
// API HELPERS (shared)
// =============================================================
 function tmApiBase() {
    const raw = (typeof window !== 'undefined' && window.API_BASE) ? String(window.API_BASE) : '';
    return raw.replace(/\/+$/, '');
}

 function tmApiUrl(path) {
    const base = tmApiBase();
    if (!path) return base || '';
    const p = String(path);
    if (!base) return p;
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (p.startsWith('/')) return base + p;
    return base + '/' + p;
}

 async function apiGetJson(path, opts = {}) {
    const url = tmApiUrl(path);
    const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json', ...(opts.headers || {}) },
        ...opts
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = data?.message || `Request failed (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

 async function apiPostJson(path, body, opts = {}) {
    const url = tmApiUrl(path);
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(opts.headers || {})
        },
        body: JSON.stringify(body || {}),
        ...opts
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = data?.message || `Request failed (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

 async function getMySubscriptions({ dir } = {}) {
    const q = dir ? `?dir=${encodeURIComponent(dir)}` : '';
    return apiGetJson(`/api/me/subscriptions${q}`);
}


 async function getMyPayments() {
    return apiGetJson('/api/me/payments');
}

// =============================================================
// MESSAGES (shared)
// =============================================================
 async function getMessageThreads() {
    return apiGetJson('/api/messages');
}

 async function getMessageThread(peerEmail) {
    const peer = encodeURIComponent(String(peerEmail || '').trim().toLowerCase());
    if (!peer) throw new Error('peer required');
    return apiGetJson(`/api/messages/thread/${peer}`);
}

 async function sendMessageTo(peerEmail, text) {
    const to = String(peerEmail || '').trim().toLowerCase();
    const msg = String(text || '').trim();
    if (!to) throw new Error('peer required');
    if (!msg) throw new Error('text required');
    return apiPostJson('/api/messages/send', { to, text: msg });
}

// =============================================================
// LOCAL CARDS STORAGE (Client-only)
// Notes:
// - This is UI-only for now (no payment processing).
// - We DO NOT store full card numbers or CVC.
// =============================================================
const TM_CARDS_KEY = 'tm_cards_v1';
const TM_WALLET_PREFS_KEY = 'tm_wallet_prefs_v1';
const TM_TX_KEY = 'tm_tx_v1';

// NOTE: Wallet/Cards storage is now backend-first (Firestore).
// These are kept only as minimal client-side cache keys (not the source of truth).

let __tmWalletCache = null;

function _tmWalletFallback() {
  return {
    balance: { credits: 0 },
    prefs: { rebillPrimary: false },
    cards: [],
    tx: []
  };
}

// Optional: local cache fallback (safe-ish, no sensitive PAN/CVV)
function _readLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v);
  } catch (e) {
    return fallback;
  }
}
function _writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

 async function tmWalletHydrate(force = false) {
  if (__tmWalletCache && !force) return __tmWalletCache;

  try {
    const out = await apiGetJson('/api/me/wallet');
    if (out && out.ok && out.wallet) {
      __tmWalletCache = out.wallet;
      // store non-sensitive cache
      _writeLocal(TM_CARDS_KEY, __tmWalletCache.cards || []);
      _writeLocal(TM_WALLET_PREFS_KEY, __tmWalletCache.prefs || { rebillPrimary: false });
      _writeLocal(TM_TX_KEY, __tmWalletCache.tx || []);
      return __tmWalletCache;
    }
  } catch (e) {
    // ignore - will fall back to local cache
  }

  // fallback (offline / backend issue): use local cache to still render UI
  const cards = _readLocal(TM_CARDS_KEY, []);
  const prefs = _readLocal(TM_WALLET_PREFS_KEY, { rebillPrimary: false });
  const tx = _readLocal(TM_TX_KEY, []);
  __tmWalletCache = { ..._tmWalletFallback(), cards, prefs, tx };
  return __tmWalletCache;
}

 function tmWalletGetCached() {
  return __tmWalletCache || { ..._tmWalletFallback() };
}

// Format helper (safe display)
 function tmCardsMask(card) {
  const last4 = String(card?.last4 || '0000').slice(-4);
  return `•••• ${last4}`;
}

// -------------------------------------------------------------
// Cards (real backend storage)
// -------------------------------------------------------------

 function tmCardsGetAll() {
  const w = tmWalletGetCached();
  return Array.isArray(w.cards) ? w.cards : [];
}

 async function tmCardsAdd(card) {
  const out = await apiPostJson('/api/me/wallet/cards/add', { card });
  if (!out || !out.ok) throw new Error(out?.message || 'Failed to add card');
  if (out.wallet) __tmWalletCache = out.wallet;
  if (out.cards) _writeLocal(TM_CARDS_KEY, out.cards);
  return tmCardsGetAll();
}

 async function tmCardsRemove(cardId) {
  const out = await apiPostJson('/api/me/wallet/cards/remove', { cardId });
  if (!out || !out.ok) throw new Error(out?.message || 'Failed to remove card');
  if (out.wallet) __tmWalletCache = out.wallet;
  if (out.cards) _writeLocal(TM_CARDS_KEY, out.cards);
  return tmCardsGetAll();
}

 async function tmCardsSetPrimary(cardId) {
  const out = await apiPostJson('/api/me/wallet/cards/primary', { cardId });
  if (!out || !out.ok) throw new Error(out?.message || 'Failed to set primary card');
  if (out.wallet) __tmWalletCache = out.wallet;
  if (out.cards) _writeLocal(TM_CARDS_KEY, out.cards);
  return tmCardsGetAll();
}

 function tmCardsGetPrimary() {
  const cards = tmCardsGetAll();
  return cards.find(c => !!c.isPrimary) || null;
}

// -------------------------------------------------------------
// Wallet preferences (real backend storage)
// -------------------------------------------------------------

 function tmWalletPrefsGet() {
  const w = tmWalletGetCached();
  if (w.prefs && typeof w.prefs === 'object') return w.prefs;
  return { rebillPrimary: false };
}

 async function tmWalletPrefsSet(nextPrefs) {
  const payload = { rebillPrimary: !!(nextPrefs && nextPrefs.rebillPrimary) };
  const out = await apiPostJson('/api/me/wallet/prefs', payload);
  if (!out || !out.ok) throw new Error(out?.message || 'Failed to update wallet preferences');
  if (out.wallet) __tmWalletCache = out.wallet;
  _writeLocal(TM_WALLET_PREFS_KEY, out.prefs || payload);
  return tmWalletPrefsGet();
}

// -------------------------------------------------------------
// Transactions (activity feed) (real backend storage)
// -------------------------------------------------------------

 function tmTransactionsGet() {
  const w = tmWalletGetCached();
  return Array.isArray(w.tx) ? w.tx : [];
}

 async function tmTransactionsAdd(tx) {
  const out = await apiPostJson('/api/me/wallet/tx/add', { tx });
  if (!out || !out.ok) throw new Error(out?.message || 'Failed to add activity');
  if (out.wallet) __tmWalletCache = out.wallet;
  _writeLocal(TM_TX_KEY, out.tx || []);
  return tmTransactionsGet();
}

 async function tmTransactionsClear() {
  // optional endpoint not required yet – clear locally as UX fallback
  _writeLocal(TM_TX_KEY, []);
  if (__tmWalletCache) __tmWalletCache.tx = [];
  return [];
}


// =============================================================
// Payments History (Data #8)
// - Local cache for payments list (used as fallback if API not available)
// =============================================================
const TM_PAYMENTS_KEY = 'tm_payments_v1';

function tmPayNormalize(p) {
  const nowIso = (() => { try { return new Date().toISOString(); } catch { return String(Date.now()); } })();
  const x = p && typeof p === 'object' ? p : {};

  let amt = null;
  if (typeof x.amount === 'number') amt = x.amount;
  else if (x.amount === null || x.amount === undefined || x.amount === '') amt = null;
  else {
    const n = Number(x.amount);
    amt = Number.isNaN(n) ? null : n;
  }

  return {
    id: String(x.id || `pay_${Math.random().toString(16).slice(2)}_${Date.now()}`),
    type: String(x.type || 'payment'),
    title: String(x.title || x.description || 'Payment'),
    description: String(x.description || ''),
    status: String(x.status || 'succeeded'),
    currency: String(x.currency || 'USD'),
    amount: amt,
    createdAt: String(x.createdAt || nowIso)
  };
}

 function tmPaymentsGet() {
  const raw = tmReadLS(TM_PAYMENTS_KEY, null);
  const arr = raw ? tmSafeJsonParse(raw, []) : [];
  if (!Array.isArray(arr)) return [];
  const norm = arr.map(tmPayNormalize);
  norm.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return norm;
}

 function tmPaymentsSetAll(items) {
  const arr = Array.isArray(items) ? items : [];
  const norm = arr.map(tmPayNormalize);
  // sort latest first and cap
  norm.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const next = norm.slice(0, 100);
  tmWriteLS(TM_PAYMENTS_KEY, tmSafeJsonStringify(next, '[]'));
  return next;
}

 function tmPaymentsAdd(item) {
  const list = tmPaymentsGet();
  const p = tmPayNormalize(item);
  // de-dupe by id
  const filtered = list.filter(x => x.id !== p.id);
  const next = [p, ...filtered].slice(0, 100);
  tmWriteLS(TM_PAYMENTS_KEY, tmSafeJsonStringify(next, '[]'));
  return next;
}

  return { BLANK_IMG, CHAT_DATA, COLLECTIONS_DB, DEFAULT_AVATAR, MSG_USERS, NOTIFICATIONS_DATA, TRANSLATIONS, apiGetJson, apiPostJson, getMessageThread, getMessageThreads, getMyPayments, getMySubscriptions, sendMessageTo, tmApiBase, tmApiUrl, tmCardsAdd, tmCardsGetAll, tmCardsGetPrimary, tmCardsMask, tmCardsRemove, tmCardsSetPrimary, tmPaymentsAdd, tmPaymentsGet, tmPaymentsSetAll, tmTransactionsAdd, tmTransactionsClear, tmTransactionsGet, tmWalletGetCached, tmWalletHydrate, tmWalletPrefsGet, tmWalletPrefsSet };
})();

// ===== dom.js (bundled) =====
const __CreatorsDOM = (function() {


 const DOM = {
    // --- LAYOUT ---
    get mainFeedColumn() { return document.querySelector('.main-feed-column'); },
    get rightSidebar() { return document.getElementById('right-sidebar'); },
    get appLoader() { return document.getElementById('app-loader'); },

    // --- VIEWS (Static & Dynamic) ---
    get viewHome() { return document.getElementById('view-home'); },
    get viewAddCard() { return document.getElementById('view-add-card'); },
    get viewYourCards() { return document.getElementById('view-your-cards'); },
    get viewBecomeCreator() { return document.getElementById('view-become-creator'); },
    get viewMyProfile() { return document.getElementById('view-my-profile'); },
    
    // FETCHED VIEWS
    get viewMessages() { return document.getElementById('view-messages'); },
    get viewSettings() { return document.getElementById('view-settings'); },
    get viewNotif() { return document.getElementById('view-notifications'); },
    get viewCollections() { return document.getElementById('view-collections'); },

    // --- PROFILE ELEMENTS (Dynamic Updates) ---
    get profileName() { return document.querySelector('#view-my-profile h1'); },
    get profileHandle() { return document.querySelector('#view-my-profile .ph-handle-text'); }, 
    get profileBio() { return document.querySelector('#view-my-profile .profile-bio-text'); }, 
    get profileHeaderImg() { return document.querySelector('#view-my-profile .profile-header-bg'); },
    get profileAvatar() { return document.querySelector('#view-my-profile .profile-avatar-main'); }, 
    get btnEditProfile() { return document.getElementById('btn-edit-profile'); },
    get backToHomeBtn() { return document.querySelector('#view-my-profile .back-btn'); },

    get profileTabPosts() { return document.getElementById('tab-profile-posts'); },
    get profileTabMedia() { return document.getElementById('tab-profile-media'); },
    get profileContentPosts() { return document.getElementById('profile-content-posts'); },
    get profileContentMedia() { return document.getElementById('profile-content-media'); },

    // --- CARD TABS ---
    get btnTabCards() { return document.getElementById('btn-tab-cards'); },
    get btnTabPayments() { return document.getElementById('btn-tab-payments'); },
    get tabContentCards() { return document.getElementById('tab-content-cards'); },
    get tabContentPayments() { return document.getElementById('tab-content-payments'); },

    // --- SIDEBAR WIDGETS ---
    get rsSuggestions() { return document.getElementById('rs-suggestions-view'); },
    get rsCollections() { return document.getElementById('rs-collections-view'); },
    get rsWalletView() { return document.getElementById('rs-wallet-view'); },
    get rsSettingsView() { return document.getElementById('rs-settings-view'); },
    
    get rsTitle() { return document.getElementById('rs-col-title'); },
    get rsViewUsers() { return document.getElementById('rs-view-type-users'); },
    get rsViewMedia() { return document.getElementById('rs-view-type-media'); },
    get rsMediaGrid() { return document.getElementById('rs-media-grid-content'); },
    get rsMediaEmpty() { return document.getElementById('rs-media-empty-state'); },

    // --- SETTINGS ELEMENTS ---
    get settingsItems() { return document.querySelectorAll('.set-item'); },
    settingsContents: {
        get profile() { return document.getElementById('set-content-profile'); },
        get account() { return document.getElementById('set-content-account'); },
        get privacy() { return document.getElementById('set-content-privacy'); },
        get display() { return document.getElementById('set-content-display'); },
        get notifications() { return document.getElementById('set-content-notifications'); },
        get subscription() { return document.getElementById('set-content-subscription'); },
        get cards() { return document.getElementById('set-content-cards'); },
        get bank() { return document.getElementById('set-content-bank'); },
        get security() { return document.getElementById('set-content-security'); },
        get help() { return document.getElementById('set-content-help'); }
    },

    // --- NAVIGATION ---
    get navHome() { return document.getElementById('nav-link-home'); },
    get navNotif() { return document.getElementById('nav-link-notif'); },
    get navMessages() { return document.getElementById('nav-link-messages'); },
    get navCollections() { return document.getElementById('nav-link-collections'); },
    get navSubs() { return document.getElementById('nav-link-subs'); },
    get navAddCard() { return document.getElementById('nav-link-add-card'); },
    get navProfile() { return document.getElementById('nav-link-profile'); },
    
    // --- MOBILE NAVIGATION ---
    get mobHome() { return document.getElementById('mob-nav-home'); },
    get mobExplore() { return document.getElementById('mob-nav-explore'); },
    get mobAdd() { return document.getElementById('mob-nav-add'); },
    get mobNotif() { return document.getElementById('mob-nav-notif'); },
    get mobMessages() { return document.getElementById('mob-nav-messages'); },

    // --- GLOBAL POPOVERS ---
    get themeToggle() { return document.getElementById('themeToggle'); },
    get popover() { return document.getElementById('settings-popover'); },
    get closePopoverBtn() { return document.getElementById('btnClosePopover'); },
    get btnSettingsPop() { return document.getElementById('btn-settings-pop'); },
    
    get popoverLinks() { return document.querySelectorAll('.pop-item'); },
    get btnMore() { return document.getElementById('trigger-more-btn'); },
    get profileCard() { return document.getElementById('trigger-profile-card'); },

    get paymentModal() { return document.getElementById('payment-modal'); },
    get btnPayConfirm() { return document.getElementById('btnPayConfirm'); },
    get btnPayCancel() { return document.getElementById('btnPayCancel'); },
    get btnSubscribe() { return document.getElementById('btnSubscribe'); },

    // --- HOME / COMPOSE ---
    get composeActions() { return document.querySelector('.compose-actions'); },
    get mediaUploadInput() { return document.getElementById('media-upload-input'); },
    get pollUI() { return document.getElementById('poll-creator-ui'); },
    get textTools() { return document.getElementById('text-format-toolbar'); },
    get closePollBtn() { return document.querySelector('.close-poll-btn'); },
    get composeInput() { return document.getElementById('compose-input'); }, 
    get btnPostSubmit() { return document.getElementById('btn-post-submit'); },
    get creatorFeed() { return document.getElementById('creator-feed'); },
    get feedEmptyState() { return document.querySelector('.feed-empty-state'); },

    // --- MESSAGES ---
    get btnNewMsg() { return document.getElementById('btn-new-msg'); },
    get btnTriggerSearch() { return document.getElementById('trigger-msg-search'); },
    get btnCloseSearch() { return document.getElementById('close-msg-search'); },
    get msgSearchBox() { return document.getElementById('msg-search-box'); },
    get msgSearchInput() { return document.getElementById('msg-search-input'); },
    get msgTabs() { return document.querySelectorAll('#msg-tabs span'); },
    get msgUserList() { return document.getElementById('msg-user-list'); }, 
    get msgUserItems() { return document.querySelectorAll('.msg-user-item'); },
    
    // 🔥 NEW MESSAGE UI SELECTORS 🔥
    get newMsgOverlay() { return document.getElementById('new-msg-overlay'); },
    get btnCloseNewMsg() { return document.getElementById('btn-close-new-msg'); },
    get newMsgResults() { return document.getElementById('new-msg-results'); },
    get newMsgInput() { return document.querySelector('.new-msg-search input'); },

    // Chat Area
    get activeChatAvatar() { return document.getElementById('active-chat-avatar'); },
    get activeChatName() { return document.getElementById('active-chat-name'); },
    get chatHistoryContainer() { return document.getElementById('chat-history-container'); },
    get chatInput() { return document.getElementById('chat-message-input'); },
    get btnSendMsg() { return document.getElementById('btn-send-message'); },
    get btnEmoji() { return document.getElementById('btn-emoji-trigger'); },
    get emojiContainer() { return document.getElementById('emoji-picker-container'); },
    get btnPPV() { return document.getElementById('btn-ppv-trigger'); },
    get btnChatSearch() { return document.getElementById('btn-chat-search'); },
    get chatSearchBar() { return document.getElementById('chat-inner-search-bar'); },
    get closeChatSearch() { return document.getElementById('close-chat-search'); },
    get chatSearchInput() { return document.getElementById('chat-history-search'); },
    get btnChatStar() { return document.getElementById('btn-chat-star'); },

    // Info Panel
    get infoNickname() { return document.getElementById('info-nickname'); },
    get infoHandle() { return document.getElementById('info-handle'); },
    get infoJoined() { return document.getElementById('info-joined'); },
    get infoSpent() { return document.getElementById('info-spent'); },

    // --- COLLECTIONS ---
    get colListWrapper() { return document.getElementById('collection-list-wrapper'); },
    get colBtnSearch() { return document.getElementById('col-btn-search'); },
    get colBtnAdd() { return document.getElementById('col-btn-add'); },
    get colSearchContainer() { return document.getElementById('col-search-container'); },
    get colSearchInput() { return document.getElementById('col-search-input'); },
    get colSearchClose() { return document.getElementById('col-search-close'); },
    get colTabUsers() { return document.getElementById('tab-col-users'); },
    get colTabBookmarks() { return document.getElementById('tab-col-bookmarks'); },

    // --- NOTIFICATIONS ---
    get notifGearBtn() { return document.getElementById('notif-btn-settings'); },
    get notifSearchBtn() { return document.getElementById('notif-btn-search'); },
    get notifSearchContainer() { return document.getElementById('notif-search-container'); },
    get notifSearchInput() { return document.getElementById('notif-search-input'); },
    get notifPills() { return document.querySelectorAll('.notif-tabs-bar .n-pill'); },

    // --- WALLET ---
    get btnAddPaymentCard() { return document.querySelector('.btn-add-payment-card'); }
};

  return { DOM };
})();

// ===== tm-api.js (inlined) =====
const __CreatorsApi = (function() {
  async function apiGet(path) {
    try {
      const res = await fetch(path, { method: 'GET', credentials: 'include' });
      return await res.json().catch(() => null);
    } catch (e) { return null; }
  }

  async function apiPost(path, body) {
    try {
      const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      });
      return await res.json().catch(() => null);
    } catch (e) { return null; }
  }

  async function apiMe() {
    return apiGet('/api/me');
  }

  return { apiGet, apiPost, apiMe };
})();


// ===== tm-session.js (inlined) =====
const __CreatorsSession = (function() {
  const { apiMe } = __CreatorsApi;

  function readJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(String(key));
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(String(key), JSON.stringify(value));
      return true;
    } catch (e) { return false; }
  }

  async function getCurrentUserEmail() {
    const me = await apiMe();
    const email = me?.user?.email || me?.email || '';
    return String(email || '').toLowerCase().trim();
  }

  return { readJSON, writeJSON, getCurrentUserEmail };
})();


// ===== loader.js (bundled) =====
const __CreatorsLoader = (function() {


// loader.js
// Robust HTML view loader used by Creators app.
// Backwards-compatible signature: loadView(elementId, filePath)
// Optional 3rd arg: { cacheBust?: boolean, credentials?: RequestCredentials }

function tmSafeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function tmWithCacheBust(urlStr, cacheBust) {
  try {
    const u = new URL(urlStr, window.location.href);
    if (cacheBust) u.searchParams.set('v', String(Date.now()));
    return u.toString();
  } catch {
    if (!cacheBust) return urlStr;
    const glue = urlStr.includes('?') ? '&' : '?';
    return `${urlStr}${glue}v=${Date.now()}`;
  }
}

function tmRenderLoadError(container, elementId, filePath, err, opts) {
  if (!container) return;

  const msg = tmSafeHtml(err?.message || err || 'Failed to load');
  const path = tmSafeHtml(filePath);

  container.dataset.viewLoaded = '0';
  container.dataset.viewError = msg;
  container.innerHTML = `
    <div class="tm-view-load-error" style="
      margin: 18px 15px;
      padding: 14px 14px;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
      color: rgba(255,255,255,0.86);
      font-family: Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    ">
      <div style="font-weight: 800; font-size: 14px; margin-bottom: 6px;">Unable to load this section</div>
      <div style="opacity: 0.85; font-size: 12px; line-height: 1.4;">
        <div style="margin-bottom: 6px;"><span style="opacity:0.7;">Path:</span> <code style="opacity:0.9;">${path}</code></div>
        <div><span style="opacity:0.7;">Error:</span> <code style="opacity:0.9;">${msg}</code></div>
      </div>
      <div style="margin-top: 12px; display:flex; gap:10px; align-items:center;">
        <button type="button" data-tm-retry="1" style="
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(100,233,238,0.12);
          color: rgba(255,255,255,0.95);
          font-weight: 800;
          cursor: pointer;
        ">Retry</button>
        <button type="button" data-tm-reload="1" style="
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
          font-weight: 800;
          cursor: pointer;
        ">Reload page</button>
      </div>
    </div>
  `;

  const retryBtn = container.querySelector('[data-tm-retry="1"]');
  if (retryBtn) {
    retryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      loadView(elementId, filePath, opts);
    }, { once: true });
  }

  const reloadBtn = container.querySelector('[data-tm-reload="1"]');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { window.location.reload(); } catch {}
    }, { once: true });
  }
}

 async function loadView(elementId, filePath, opts = {}) {
  const container = document.getElementById(elementId);
  if (!container) return { ok: false, error: 'container_missing' };

  const cacheBust = !!opts.cacheBust;
  const credentials = opts.credentials || 'include';

  const url = tmWithCacheBust(filePath, cacheBust);

  

  // Hard consolidation: if template exists, use it (no network fetch)
  try {
    const tpl = document.querySelector(`template[data-view="${filePath}"]`);
    if (tpl) {
      container.innerHTML = tpl.innerHTML;
      container.dataset.viewLoaded = '1';
      return { ok: true, source: 'template' };
    }
  } catch (e) { /* ignore */ }
try {
    const response = await fetch(url, { credentials });
    if (!response.ok) throw new Error(`Failed to load (${response.status}) ${filePath}`);

    const html = await response.text();
    container.innerHTML = html;
    container.dataset.viewLoaded = '1';
    container.dataset.viewError = '';
    container.dataset.viewUrl = url;
    return { ok: true, html };
  } catch (error) {
    console.error(`❌ Error loading component from ${filePath}:`, error);
    tmRenderLoadError(container, elementId, filePath, error, opts);
    return { ok: false, error: error?.message || String(error) };
  }
}

  return { loadView };
})();

// ===== home.js (bundled) =====
const __CreatorsHome = (function() {
  const { DOM } = __CreatorsDOM;

// TODO: Backend Integration - Replace STORAGE_KEY with API Endpoints
const STORAGE_KEY = 'tm_user_posts';
const BOOKMARKS_KEY = 'tm_creator_bookmarks';



const FEED_ENDPOINT = '/api/creators/feed';
const CREATE_POST_ENDPOINT = '/api/creator/posts';
const DELETE_POST_ENDPOINT = '/api/creator/posts/delete';

// Backend-first interaction endpoints (best-effort; fallback to local if 404/disabled)
const POST_REACT_ENDPOINT = '/api/creator/posts/react';
const POST_COMMENT_ENDPOINT = '/api/creator/posts/comment';
const POST_COMMENT_REACT_ENDPOINT = '/api/creator/posts/comment/react';
const POST_PIN_ENDPOINT = '/api/creator/posts/pin';
const POST_COMMENTS_ENDPOINT = '/api/creator/posts/comments';
const POST_VOTE_ENDPOINT = '/api/creator/posts/vote';
// ------------------------------
// Helpers (safe HTML + identity)
// ------------------------------
function tmEscapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function tmGetCreatorIdentity() {
    const safeStr = (v) => (v === null || v === undefined) ? '' : String(v).trim();

    // Prefer hydrated session object from app.js
    const me = (typeof window !== 'undefined' && window.__tmMe) ? window.__tmMe : null;

    const contentStyle = safeStr(me?.creatorApplication?.contentStyle || me?.creatorApplication?.content_style || '');

    const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const getPacked = (label) => {
        if (!contentStyle) return '';
        // Support both pipe-packed ("A: 1 | B: 2") and newline-packed ("A: 1\nB: 2") formats.
        // Also: we must escape backslashes properly in the RegExp string (use \\s not \s).
        const normalized = String(contentStyle || '')
            .replace(/\r\n/g, '\n')
            .split('|')
            .map((s) => String(s || '').trim())
            .filter(Boolean)
            .join('\n');

        const re = new RegExp(`(?:^|\\n)\\s*${escapeRe(label)}\\s*:\\s*(.+?)(?:\\n|$)`, 'i');
        const m = normalized.match(re);
        return m ? safeStr(m[1]) : '';
    };

    // DOM fallbacks (already hydrated on creators.html by app.js/profile.js)
    const nameEl =
        document.getElementById('creatorProfileName') ||
        document.getElementById('creatorHeaderName') ||
        document.getElementById('creatorPopoverName');

    const handleEl =
        document.getElementById('creatorProfileHandle') ||
        document.getElementById('creatorHeaderHandle') ||
        document.getElementById('creatorPopoverHandle');

    const avatarEl =
        document.getElementById('creatorProfileAvatar') ||
        document.getElementById('creatorPopoverAvatar') ||
        document.querySelector('#view-my-profile .profile-avatar-main') ||
        document.querySelector('.sidebar .user img');

    const domName = safeStr(nameEl?.textContent);
    const domHandle = safeStr(handleEl?.textContent);
    const domAvatar = safeStr(avatarEl?.getAttribute?.('src') || avatarEl?.src);

    const email = safeStr(me?.email);
    const emailPrefix = email ? safeStr(email.split('@')[0]) : '';

    const displayName =
        getPacked('Display name') ||
        getPacked('Name') ||
        safeStr(me?.name || me?.displayName) ||
        domName ||
        emailPrefix ||
        'You';

    let rawHandle =
        safeStr(me?.handle || me?.username || me?.userName) ||
        (domHandle ? domHandle.replace(/^@+/, '') : '') ||
        emailPrefix ||
        'you';

    rawHandle = rawHandle.replace(/^@+/, '').replace(/\s+/g, '');
    const handle = rawHandle ? `@${rawHandle}` : '@you';

    const avatarUrl =
        safeStr(me?.avatarUrl || me?.photoURL || me?.photoUrl || me?.photoURL) ||
        domAvatar ||
        'assets/images/truematch-mark.png';

    return { name: displayName, handle, avatarUrl, email };
}

function tmToast(TopToast, icon, title) {
    try {
        if (TopToast && TopToast.fire) return TopToast.fire({ icon, title });
    } catch {}
}

function tmNowId() {
    return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
}


// ------------------------------
// Backend-first interactions (best-effort)
// If server routes are not present yet, we fallback to existing local-only behavior.
// ------------------------------
async function tmFetchJson(url, opts = {}) {
    try {
        const res = await fetch(url, { credentials: 'include', ...opts });
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        const data = isJson ? await res.json().catch(() => null) : null;
        return { res, data };
    } catch (e) {
        return { res: null, data: null };
    }
}

async function tmSetPostReaction(postId, reaction) {
    if (!postId) return null;
    const payload = { id: String(postId), reaction: reaction || null };
    const { res, data } = await tmFetchJson(POST_REACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    // If endpoint doesn't exist yet, treat as not available
    if (!res || res.status === 404) return null;
    if (data && data.ok) return data;
    return null;
}


async function tmSetCommentReaction(postId, commentId, reaction) {
    try {
        if (!postId || !commentId) return null;
        const body = { postId: String(postId), commentId: String(commentId), reaction: reaction || null };
        const { data } = await tmFetchJson(POST_COMMENT_REACT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (data && data.ok) return data;
        return null;
    } catch (err) {
        console.error('tmSetCommentReaction error:', err);
        return null;
    }
}


async function tmPinPost(postId, pinned) {
    if (!postId) return null;
    const payload = { id: String(postId), pinned: !!pinned };
    const { res, data } = await tmFetchJson(POST_PIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res || res.status === 404) return null;
    if (data && data.ok) return data;
    return null;
}

async function tmAddPostComment(postId, text) {
    if (!postId || !text) return null;
    const payload = { id: String(postId), text: String(text) };
    const { res, data } = await tmFetchJson(POST_COMMENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res || res.status === 404) return null;
    if (data && data.ok) return data;
    return null;
}

async function tmFetchPostComments(postId, limit = 50) {
    if (!postId) return null;

    // Prefer querystring to avoid breaking if backend uses query-based endpoint
    const url = `${POST_COMMENTS_ENDPOINT}?id=${encodeURIComponent(String(postId))}&limit=${encodeURIComponent(limit)}`;
    const { res, data } = await tmFetchJson(url, { method: 'GET' });
    if (!res || res.status === 404) return null;
    if (data && data.ok && Array.isArray(data.items)) return data.items;
    if (Array.isArray(data?.comments)) return data.comments;
    return null;
}

async function tmVoteCreatorPost(postId, type, optionIndex) {
    if (!postId) return null;

    const payload = {
        id: String(postId),
        type: String(type || ''),
        optionIndex: Number(optionIndex),
    };

    const { res, data } = await tmFetchJson(POST_VOTE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    // If endpoint doesn't exist yet, treat as not available
    if (!res || res.status === 404) return null;

    return { status: res.status, data };
}

function tmMergeComments(localComments, remoteComments) {
    const lc = Array.isArray(localComments) ? localComments : [];
    const rc = Array.isArray(remoteComments) ? remoteComments : [];
    if (!rc.length) return lc;

    const seen = new Set();
    const out = [];

    const norm = (c) => ({
        id: c?.id || c?._id || null,
        text: String(c?.text || ''),
        timestamp: Number(c?.timestamp || c?.createdAtMs || c?.createdAt || Date.now()) || Date.now(),

        // Reactions (preserve server-backed state)
        myReaction: String(c?.myReaction || c?.reaction || c?.reactionType || '').trim(),
        reactionCounts: (c?.reactionCounts && typeof c.reactionCounts === 'object') ? c.reactionCounts : {},
        reactionCount: Number(c?.reactionCount || 0) || 0,

        // Back-compat + new fields
        creatorEmail: c?.creatorEmail || c?.authorEmail || null,
        creatorName: c?.creatorName || c?.authorName || null,
        creatorAvatarUrl: c?.creatorAvatarUrl || c?.authorAvatarUrl || c?.avatarUrl || null,

        authorEmail: c?.authorEmail || c?.creatorEmail || null,
        authorName: c?.authorName || c?.creatorName || null,
        authorAvatarUrl: c?.authorAvatarUrl || c?.creatorAvatarUrl || c?.avatarUrl || null,
    });

    // Remote first (authoritative)
    for (const c of rc) {
        const n = norm(c);
        const k = n.id ? String(n.id) : `${n.timestamp}|${n.text}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(n);
    }

    // Append local-only
    for (const c of lc) {
        const n = norm(c);
        const k = n.id ? String(n.id) : `${n.timestamp}|${n.text}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(n);
    }

    // Oldest to newest for UI list
    out.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return out;
}

async function tmEnsureCommentsLoaded(postCard, TopToast) {
    try {
        if (!postCard) return;
        const postId = postCard?.dataset?.postId || postCard?.id?.replace('post-', '');
        if (!postId) return;

        const commentSection = postCard.querySelector('.post-comments-section');
        const list = postCard.querySelector('.comment-list');
        const emptyMsg = postCard.querySelector('.no-comments-msg');
        if (!commentSection || !list) return;

        if (commentSection.dataset.loaded === '1') return;

        const remote = await tmFetchPostComments(postId, 80);
        if (!remote) {
            // Leave as-is (local-only)
            commentSection.dataset.loaded = '1';
            return;
        }

        // Merge with local cache
        const updated = updatePost(postId, (post) => {
            if (!post) return post;
            const merged = tmMergeComments(post.comments, remote);
            post.comments = merged;
            return post;
        });

        const comments = Array.isArray(updated?.comments) ? updated.comments : tmMergeComments([], remote);

        // Rebuild list UI (keep the "no comments" element)
        const keepNo = emptyMsg ? emptyMsg.outerHTML : '<div class="no-comments-msg" style="text-align: center; font-size: 0.85rem; color: var(--muted);">No comments yet</div>';
        // Build threaded comments: replies are stored as normal comments with a prefix tag:
        //   [[replyTo:<parentCommentId>]] Your reply text
        const byId = new Map();
        for (const c of comments) {
            const id = (c && (c.id || c._id)) ? String(c.id || c._id) : '';
            if (id) byId.set(id, c);
        }

        const top = [];
        const repliesByParent = new Map();

        for (const c of comments) {
            const meta = tmParseReplyTag(String(c?.text || ''));
            if (meta.isReply && meta.parentId && byId.has(meta.parentId)) {
                c.__replyTo = meta.parentId;
                c.__cleanText = meta.cleanText;
                const arr = repliesByParent.get(meta.parentId) || [];
                arr.push(c);
                repliesByParent.set(meta.parentId, arr);
            } else {
                c.__replyTo = '';
                c.__cleanText = String(c?.text || '');
                top.push(c);
            }
        }

        // Deterministic ordering (oldest to newest) within each thread
        top.sort((a, b) => (Number(a.timestamp || 0) - Number(b.timestamp || 0)));
        for (const [pid, arr] of repliesByParent.entries()) {
            arr.sort((a, b) => (Number(a.timestamp || 0) - Number(b.timestamp || 0)));
            repliesByParent.set(pid, arr);
        }

        const threadHTML = top.map((c) => {
            const id = String(c?.id || c?._id || '');
            const replies = id ? (repliesByParent.get(id) || []) : [];
            const repliesHtml = replies.map(r => generateCommentHTML(r, undefined, { isReply: true })).join('');
            return generateCommentHTML(c, undefined, { repliesHtml });
        }).join('');

        list.innerHTML = keepNo + threadHTML;

        const has = comments.length > 0;
        const newEmpty = list.querySelector('.no-comments-msg');
        if (newEmpty) newEmpty.style.display = has ? 'none' : 'block';

        commentSection.dataset.loaded = '1';
    } catch (e) {
        // silent
    }
}


// ------------------------------
// Local bookmarks (Home feed)
// ------------------------------
function tmGetBookmarksSet() {
    try {
        const raw = localStorage.getItem(BOOKMARKS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
        return new Set();
    }
}

function tmIsBookmarked(postId) {
    return tmGetBookmarksSet().has(String(postId));
}

function tmToggleBookmark(postId) {
    const id = String(postId);
    const set = tmGetBookmarksSet();
    if (set.has(id)) set.delete(id);
    else set.add(id);
    try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(set)));
    } catch {}
    return set.has(id);
}

// ------------------------------
// Text formatting helpers (mini-markdown)
// **bold**  *italic*  __underline__  - list
// ------------------------------
function tmWrapSelection(textarea, left, right) {
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    const v = textarea.value || '';
    const sel = v.slice(start, end);

    const next = v.slice(0, start) + left + sel + right + v.slice(end);
    textarea.value = next;

    const cursorStart = start + left.length;
    const cursorEnd = cursorStart + sel.length;
    textarea.setSelectionRange(cursorStart, cursorEnd);
    textarea.focus();
}

function tmToggleLinePrefix(textarea, prefix) {
    if (!textarea) return;
    const v = textarea.value || '';
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    // Expand selection to full lines
    const lineStart = v.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = (() => {
        const idx = v.indexOf('\n', end);
        return idx === -1 ? v.length : idx;
    })();

    const block = v.slice(lineStart, lineEnd);
    const lines = block.split(/\n/);

    const allPrefixed = lines.every(l => l.startsWith(prefix) || l.trim() === '');
    const nextLines = lines.map(l => {
        if (!l.trim()) return l;
        return allPrefixed ? l.replace(new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '') : (prefix + l);
    });

    const nextBlock = nextLines.join('\n');
    textarea.value = v.slice(0, lineStart) + nextBlock + v.slice(lineEnd);

    const newEnd = lineStart + nextBlock.length;
    textarea.setSelectionRange(lineStart, newEnd);
    textarea.focus();
}

function tmRenderFormattedText(rawText) {
    const raw = String(rawText || '');

    // Build lists from lines first
    const lines = raw.split(/\n/);
    let out = '';
    let inList = false;

    const flushList = () => {
        if (inList) {
            out += '</ul>';
            inList = false;
        }
    };

    const formatInline = (s) => {
        let safe = tmEscapeHtml(s);
        safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/__(.+?)__/g, '<u>$1</u>');
        safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
        return safe;
    };

    for (const line of lines) {
        const m = line.match(/^\s*[-•*]\s+(.*)$/);
        if (m) {
            if (!inList) {
                out += '<ul style="margin: 6px 0 10px 18px; padding:0;">';
                inList = true;
            }
            out += `<li style="margin:4px 0;">${formatInline(m[1] || '')}</li>`;
        } else {
            flushList();
            out += formatInline(line) + '<br>';
        }
    }
    flushList();

    // Trim trailing <br>
    out = out.replace(/(<br>)+$/g, '');
    return out;
}

function tmGetLikeUi(reactionType) {
    const t = String(reactionType || '').toLowerCase();
    if (!t) return { icon: 'fa-regular fa-thumbs-up', color: '' };

    switch (t) {
        case 'like': return { icon: 'fa-solid fa-thumbs-up', color: '#64E9EE' };
        case 'love': return { icon: 'fa-solid fa-heart', color: '#ff4757' };
        case 'haha': return { icon: 'fa-solid fa-face-laugh-squint', color: '#f1c40f' };
        case 'wow': return { icon: 'fa-solid fa-face-surprise', color: '#f1c40f' };
        case 'sad': return { icon: 'fa-solid fa-face-sad-tear', color: '#e67e22' };
        case 'angry': return { icon: 'fa-solid fa-face-angry', color: '#e74c3c' };
        default: return { icon: 'fa-regular fa-thumbs-up', color: '' };
    }
}

function tmLikesText(count) {
    const n = Number(count || 0) || 0;
    return `${n} Like${n === 1 ? '' : 's'}`;
}


function tmGetMeEmail() {
    try {
        return String(window.__tmMe?.email || '').toLowerCase();
    } catch (e) {
        return '';
    }
}

function tmGetPostIdentity(post) {
    const fallback = tmGetCreatorIdentity();
    const name = post?.creatorName || fallback.name;
    const handle = post?.creatorHandle || fallback.handle;
    const avatarUrl = post?.creatorAvatarUrl || fallback.avatarUrl;
    const verified = !!(post?.creatorVerified);
    return { name, handle, avatarUrl, verified };
}

async function tmCreateCreatorPost(draft) {
    try {
        const res = await fetch(CREATE_POST_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(draft || {}),
        });

        const data = await res.json().catch(() => null);
        if (data?.ok && data?.post) return data.post;
    } catch (e) {
        // ignore
    }
    return null;
}

async function tmFetchCreatorsFeed(limit = 40) {
    try {
        const url = `${FEED_ENDPOINT}?limit=${encodeURIComponent(limit)}`;
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (data?.ok && Array.isArray(data?.items)) return data.items;
    } catch (e) {
        // ignore
    }
    return null;
}


 function initHome(TopToast) {
    
    // 0. LOAD POSTS FROM STORAGE (With 24h Check)
    loadPosts();

    // 1. ENABLE/DISABLE POST BUTTON (Text + Poll Options)
    function syncPostButtonState() {
        if (!DOM.btnPostSubmit) return;

        const text = (DOM.composeInput?.value || '').trim();

        const pollIsOpen = DOM.pollUI && !DOM.pollUI.classList.contains('hidden');
        const pollInputs = pollIsOpen ? Array.from(DOM.pollUI.querySelectorAll('input[type="text"]')) : [];
        const pollOptions = pollInputs.map(i => (i.value || '').trim()).filter(Boolean);

        const canPost = (text.length > 0) || (pollIsOpen && pollOptions.length >= 2);

        if (canPost) {
            DOM.btnPostSubmit.removeAttribute('disabled');
            DOM.btnPostSubmit.style.opacity = '1';
            DOM.btnPostSubmit.style.cursor = 'pointer';
        } else {
            DOM.btnPostSubmit.setAttribute('disabled', 'true');
            DOM.btnPostSubmit.style.opacity = '0.5';
            DOM.btnPostSubmit.style.cursor = 'not-allowed';
        }
    }

    if (DOM.composeInput && DOM.btnPostSubmit) {
        DOM.composeInput.addEventListener('input', syncPostButtonState);
        if (DOM.pollUI) DOM.pollUI.addEventListener('input', syncPostButtonState);

        // Keyboard shortcuts for formatting
        DOM.composeInput.addEventListener('keydown', (e) => {
            const key = String(e.key || '').toLowerCase();
            const isMod = e.ctrlKey || e.metaKey;

            if (!isMod) return;

            if (key === 'b') { e.preventDefault(); tmWrapSelection(DOM.composeInput, '**', '**'); }
            if (key === 'i') { e.preventDefault(); tmWrapSelection(DOM.composeInput, '*', '*'); }
            if (key === 'u') { e.preventDefault(); tmWrapSelection(DOM.composeInput, '__', '__'); }
        });

        syncPostButtonState();

        // 2. POST SUBMIT LOGIC
        DOM.btnPostSubmit.addEventListener('click', async () => {
            const text = (DOM.composeInput.value || '').trim();

            // If poll UI is open and user typed poll options, turn this into a poll-post
            const pollIsOpen = DOM.pollUI && !DOM.pollUI.classList.contains('hidden');
            const pollInputs = pollIsOpen ? Array.from(DOM.pollUI.querySelectorAll('input[type="text"]')) : [];
            const pollOptions = pollInputs
                .map(i => (i.value || '').trim())
                .filter(Boolean);

            const isPollDraft = pollIsOpen && pollOptions.length > 0;
            const isPollPost = pollIsOpen && pollOptions.length >= 2;

            if (isPollDraft && pollOptions.length < 2) {
                tmToast(TopToast, 'warning', 'Add at least 2 poll options');
                return;
            }

            if (!text && !isPollPost) {
                tmToast(TopToast, 'warning', 'Write something or add a poll');
                return;
            }

            // Create post via backend (single-source-of-truth). Fallback to local-only if backend is unavailable.
            const draft = {
                type: isPollPost ? 'poll' : 'text',
                text: text,
            };

            if (isPollPost) {
                draft.poll = { options: pollOptions.slice(0, 6) };
            }

            let createdPost = await tmCreateCreatorPost(draft);

            if (!createdPost) {
                const meEmail = tmGetMeEmail();
                const myIdentity = tmGetCreatorIdentity();
                createdPost = {
                    id: tmNowId(),
                    creatorEmail: meEmail || null,
                    creatorName: myIdentity.name,
                    creatorHandle: myIdentity.handle,
                    creatorAvatarUrl: myIdentity.avatarUrl,
                    creatorVerified: true,
                    type: draft.type,
                    text: text,
                    timestamp: Date.now(),
                    comments: [],
                };

                if (isPollPost) {
                    createdPost.poll = { options: pollOptions.slice(0, 6) };
                    createdPost.pollVotes = new Array(createdPost.poll.options.length).fill(0);
                    createdPost.pollMyVote = null;
                }
            } else {
                // Ensure client-side fields exist (prototype interactions)
                createdPost.comments = Array.isArray(createdPost.comments) ? createdPost.comments : [];
                if (createdPost.type === 'poll' && createdPost.poll && Array.isArray(createdPost.poll.options)) {
                    createdPost.pollVotes = Array.isArray(createdPost.pollVotes)
                        ? createdPost.pollVotes
                        : new Array(createdPost.poll.options.length).fill(0);
                    createdPost.pollMyVote = null;
                }
            }

            savePost(createdPost);
            renderPost(createdPost, true);
            if (DOM.feedEmptyState) DOM.feedEmptyState.style.display = 'none';

            // Reset composer
            DOM.composeInput.value = '';
            syncPostButtonState();

            // Reset poll UI
            if (isPollPost && DOM.pollUI) {
                DOM.pollUI.classList.add('hidden');
                pollInputs.forEach(i => (i.value = ''));
                // Keep only the first 2 rows if user added more
                const rows = Array.from(DOM.pollUI.querySelectorAll('.poll-input-row'));
                rows.slice(2).forEach(r => r.remove());
            }

            tmToast(TopToast, 'success', isPollPost ? 'Poll posted' : 'Posted successfully');
        });
    }


// 3. Compose Actions (Redirect Image to Bookmarks, Poll, Text)
    if (DOM.composeActions) {
        DOM.composeActions.addEventListener('click', (e) => {
            const target = e.target;
            const el = target.closest('i, span');
            if (!el) return;

            // --- UPDATED: IMAGE ICON -> GO TO COLLECTIONS > BOOKMARKS ---
            if (el.classList.contains('fa-image')) {
                if (DOM.navCollections) {
                    DOM.navCollections.click();
                    setTimeout(() => {
                        if (DOM.colTabBookmarks) {
                            DOM.colTabBookmarks.click();
                        }
                    }, 100);
                }
            }
            // Poll Toggle
            else if (el.classList.contains('fa-square-poll-horizontal') || el.id === 'btn-trigger-poll') {
                if(DOM.pollUI) DOM.pollUI.classList.toggle('hidden');
                syncPostButtonState();
            }
            // Quiz Composer
            else if (el.classList.contains('fa-clipboard-question')) {
                tmOpenQuizComposer(TopToast);
            }
            // Text Tools Toggle
            else if (el.id === 'btn-trigger-text' || (el.textContent || '').trim() === 'Aa') {
                if(DOM.textTools) DOM.textTools.classList.toggle('hidden');
            }
        });
    }

    if (DOM.closePollBtn) {
        DOM.closePollBtn.addEventListener('click', () => {
            if(DOM.pollUI) DOM.pollUI.classList.add('hidden');
            syncPostButtonState();
        });
    }

    // 3b. Text Toolbar Formatting Buttons
    if (DOM.textTools && DOM.composeInput) {
        DOM.textTools.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const icon = btn.querySelector('i') || e.target.closest('i');
            if (!icon) return;

            if (icon.classList.contains('fa-bold')) tmWrapSelection(DOM.composeInput, '**', '**');
            else if (icon.classList.contains('fa-italic')) tmWrapSelection(DOM.composeInput, '*', '*');
            else if (icon.classList.contains('fa-underline')) tmWrapSelection(DOM.composeInput, '__', '__');
            else if (icon.classList.contains('fa-list-ul')) tmToggleLinePrefix(DOM.composeInput, '- ');

            syncPostButtonState();
        });
    }


    // 4. POLL: ADD OPTION (+) LOGIC
    const addOptBtn = document.querySelector('#poll-creator-ui .add-option-btn');
    if (addOptBtn) {
        addOptBtn.addEventListener('click', () => {
            const poll = document.getElementById('poll-creator-ui');
            if (!poll) return;
            const inputsWrap = poll.querySelector('.poll-inputs');
            if (!inputsWrap) return;
            const rows = Array.from(inputsWrap.querySelectorAll('.poll-input-row'));
            if (rows.length >= 6) {
                tmToast(TopToast, 'info', 'Max 6 options');
                return;
            }
            const next = rows.length + 1;
            const row = document.createElement('div');
            row.className = 'poll-input-row';
            row.innerHTML = `<input type=\"text\" placeholder=\"Option ${next}...\"><i class=\"fa-solid fa-grip-lines\"></i>`;
            inputsWrap.appendChild(row);
        });
    }

    // 4. GLOBAL FEED INTERACTIONS (FIXED FOR MOBILE/CLICK)
    const feed = document.getElementById('creator-feed');
    if (feed) {
        
        // 🆕 LONG PRESS LOGIC (Mobile Support)
        let pressTimer;
        feed.addEventListener('touchstart', (e) => {
            if (e.target.closest('.main-like-btn') || e.target.closest('.action-comment-like')) {
                pressTimer = setTimeout(() => {
                    const wrapper = e.target.closest('.reaction-wrapper') || e.target.closest('.comment-reaction-wrapper');
                    if(wrapper) {
                        const picker = wrapper.querySelector('.reaction-picker, .comment-reaction-picker');
                        if(picker) {
                            document.querySelectorAll('.reaction-picker.active, .comment-reaction-picker.active').forEach(p => p.classList.remove('active'));
                            picker.classList.add('active');
                        }
                    }
                }, 500); // 500ms Long press
            }
        });
        feed.addEventListener('touchend', () => clearTimeout(pressTimer));
        feed.addEventListener('touchmove', () => clearTimeout(pressTimer));

        // CLICK HANDLER
        feed.addEventListener('click', async (e) => {
            const target = e.target;

            // --- POST MENU ACTIONS (Copy Link / Pin) ---
            const menuCopy = target.closest('.action-copy-link');
            if (menuCopy) {
                const postCard = target.closest('.post-card');
                const postId = postCard?.dataset?.postId;
                const url = postId ? `${location.origin}${location.pathname}#post-${postId}` : location.href;

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url)
                        .then(() => tmToast(TopToast, 'success', 'Link copied'))
                        .catch(() => tmToast(TopToast, 'info', 'Copy not supported'));
                } else {
                    tmToast(TopToast, 'info', 'Copy not supported');
                }

                const dropdown = target.closest('.post-menu-dropdown');
                if (dropdown) dropdown.classList.add('hidden');
                return;
            }

            const menuPin = target.closest('.action-pin');
            if (menuPin) {
                const postCard = target.closest('.post-card');
                const postId = postCard?.dataset?.postId;
                if (!postId) return;

                const posts = getPosts();
                const p = posts.find(x => String(x.id) === String(postId));
                if (!p) return;

                const nextPinned = !p.pinned;

                // Backend-first (best-effort). If endpoint not available yet, fallback to local.
                let serverPinned = null;
                try {
                    const resp = await tmPinPost(postId, nextPinned);
                    if (resp && resp.ok) {
                        if (resp.pinned !== undefined) serverPinned = !!resp.pinned;
                        else if (resp.post && resp.post.pinned !== undefined) serverPinned = !!resp.post.pinned;
                        else serverPinned = nextPinned;
                    }
                } catch {}

                const finalPinned = (serverPinned === null) ? nextPinned : serverPinned;

                updatePost(postId, { pinned: finalPinned });

                // Re-render at top (keeps UX simple)
                const el = document.getElementById(`post-${postId}`);
                if (el && el.parentNode) el.parentNode.removeChild(el);

                const updated = getPosts().find(x => String(x.id) === String(postId));
                if (updated) renderPost(updated, true);

                tmToast(TopToast, 'success', finalPinned ? 'Pinned' : 'Unpinned');

                const dropdown = target.closest('.post-menu-dropdown');
                if (dropdown) dropdown.classList.add('hidden');
                return;
            }

            // --- QUIZ OPTION CLICK ---
            const quizBtn = target.closest('.quiz-option-btn');
            if (quizBtn) {
                const postId = quizBtn.getAttribute('data-post-id');
                const idx = Number(quizBtn.getAttribute('data-option-idx'));

                if (postId) {
                    // Prevent double-answer client-side
                    const cur = getPosts().find(x => String(x.id) === String(postId));
                    if (cur && cur.quizMyAnswer != null) return;

                    // Backend-first (best-effort). If endpoint not available yet, fallback to local.
                    let serverResp = null;
                    try {
                        serverResp = await tmVoteCreatorPost(postId, 'quiz', idx);
                    } catch {}

                    let updatedPost = null;

                    // If server responds with canonical state, apply it
                    if (serverResp && serverResp.data) {
                        const d = serverResp.data;

                        if (d && d.ok) {
                            const patch = (d.post && typeof d.post === 'object') ? d.post
                                : (d.patch && typeof d.patch === 'object') ? d.patch
                                : d;

                            updatedPost = updatePost(postId, (post) => {
                                if (!post) return post;
                                return { ...post, ...patch };
                            });
                        } else if (serverResp.status === 409) {
                            // already answered on server
                            const patch = (d && d.post && typeof d.post === 'object') ? d.post
                                : (d && d.patch && typeof d.patch === 'object') ? d.patch
                                : null;

                            if (patch) {
                                updatedPost = updatePost(postId, (post) => {
                                    if (!post) return post;
                                    return { ...post, ...patch };
                                });
                            }
                            tmToast(TopToast, 'info', 'Already answered');
                        }
                    }

                    // Fallback: local-only behavior (keeps current UX even if backend vote route isn't deployed yet)
                    if (!updatedPost) {
                        updatedPost = updatePost(postId, (post) => {
                            if (!post || post.type !== 'quiz' || !post.quiz) return post;
                            if (post.quizMyAnswer != null) return post;

                            const opts = (post.quiz.options || []);
                            if (!Number.isFinite(idx) || idx < 0 || idx >= opts.length) return post;

                            if (!Array.isArray(post.quizVotes) || post.quizVotes.length !== opts.length) {
                                post.quizVotes = new Array(opts.length).fill(0);
                            }
                            post.quizVotes[idx] = (post.quizVotes[idx] || 0) + 1;
                            post.quizMyAnswer = idx;
                            return post;
                        });
                    }

                    if (updatedPost && updatedPost.type === 'quiz') {
                        const card = document.getElementById(`post-${postId}`);
                        const block = card ? card.querySelector('.post-quiz-block') : null;
                        if (block) block.outerHTML = renderQuizBlock(updatedPost);

                        const isCorrect = updatedPost.quizMyAnswer === updatedPost.quiz.correctIndex;
                        tmToast(TopToast, isCorrect ? 'success' : 'error', isCorrect ? 'Correct!' : 'Wrong answer');
                    }
                }
                return;
            }


            // --- POLL OPTION CLICK ---
            const pollBtn = target.closest('.poll-option-btn');
            if (pollBtn) {
                const postId = pollBtn.getAttribute('data-post-id');
                const idx = Number(pollBtn.getAttribute('data-option-idx'));

                if (postId) {
                    // Prevent double-vote client-side
                    const cur = getPosts().find(x => String(x.id) === String(postId));
                    if (cur && cur.pollMyVote != null) return;

                    // Backend-first (best-effort). If endpoint not available yet, fallback to local.
                    let serverResp = null;
                    try {
                        serverResp = await tmVoteCreatorPost(postId, 'poll', idx);
                    } catch {}

                    let updatedPost = null;

                    // If server responds with canonical state, apply it
                    if (serverResp && serverResp.data) {
                        const d = serverResp.data;

                        if (d && d.ok) {
                            const patch = (d.post && typeof d.post === 'object') ? d.post
                                : (d.patch && typeof d.patch === 'object') ? d.patch
                                : d;

                            updatedPost = updatePost(postId, (post) => {
                                if (!post) return post;
                                return { ...post, ...patch };
                            });
                        } else if (serverResp.status === 409) {
                            // already voted on server
                            const patch = (d && d.post && typeof d.post === 'object') ? d.post
                                : (d && d.patch && typeof d.patch === 'object') ? d.patch
                                : null;

                            if (patch) {
                                updatedPost = updatePost(postId, (post) => {
                                    if (!post) return post;
                                    return { ...post, ...patch };
                                });
                            }
                            tmToast(TopToast, 'info', 'Already voted');
                        }
                    }

                    // Fallback: local-only behavior (keeps current UX even if backend vote route isn't deployed yet)
                    if (!updatedPost) {
                        updatedPost = updatePost(postId, (post) => {
                            if (!post || post.type !== 'poll' || !post.poll) return post;
                            if (post.pollMyVote != null) return post;

                            const opts = (post.poll.options || []);
                            if (!Number.isFinite(idx) || idx < 0 || idx >= opts.length) return post;

                            if (!Array.isArray(post.pollVotes) || post.pollVotes.length !== opts.length) {
                                post.pollVotes = new Array(opts.length).fill(0);
                            }
                            post.pollVotes[idx] = (post.pollVotes[idx] || 0) + 1;
                            post.pollMyVote = idx;
                            return post;
                        });
                    }

                    if (updatedPost && updatedPost.type === 'poll') {
                        const card = document.getElementById(`post-${postId}`);
                        const block = card ? card.querySelector('.post-poll-block') : null;
                        if (block) block.outerHTML = renderPollBlock(updatedPost);
                        tmToast(TopToast, 'success', 'Voted');
                    }
                }
                return;
            }


            // Close pickers if clicking outside
            if (!target.closest('.reaction-wrapper') && !target.closest('.comment-reaction-wrapper')) {
                document.querySelectorAll('.reaction-picker.active, .comment-reaction-picker.active').forEach(p => p.classList.remove('active'));
            }

            // --- DELETE POST ---
            if (target.classList.contains('action-delete')) {
                const postCard = target.closest('.post-card');
                const postId = postCard.id.replace('post-', '');
                
                Swal.fire({
                    title: 'Delete Post?', text: "This action cannot be undone.", icon: 'warning',
                    showCancelButton: true, confirmButtonColor: '#ff4757', cancelButtonColor: '#3085d6', confirmButtonText: 'Delete', background: '#0d1423', color: '#fff'
                }).then((result) => {
                    if (result.isConfirmed) {
                        deletePost(postId); 
                        postCard.remove(); 
                        if(TopToast) TopToast.fire({ icon: 'success', title: 'Post deleted' });
                    }
                });
            }

            // --- THREE DOTS TOGGLE ---
            if (target.closest('.post-options-btn')) {
                const btn = target.closest('.post-options-btn');
                const menu = btn.nextElementSibling;
                if (menu) menu.classList.toggle('hidden');
            }


            // --- TOGGLE COMMENTS (open/close) ---
            const toggleCommentBtn = target.closest('.btn-toggle-comment');
            if (toggleCommentBtn) {
                const postCard = toggleCommentBtn.closest('.post-card');
                const section = postCard ? postCard.querySelector('.post-comments-section') : null;
                if (!postCard || !section) return;

                section.classList.toggle('hidden');

                // Lazy-load comments when opening
                if (!section.classList.contains('hidden')) {
                    try { await tmEnsureCommentsLoaded(postCard, TopToast); } catch {}
                    const input = section.querySelector('.comment-input');
                    if (input) setTimeout(() => input.focus(), 0);
                }
                return;
            }

            // --- SEND COMMENT (backend-first, fallback to local) ---
            const sendCommentBtn = target.closest('.btn-send-comment');
            if (sendCommentBtn) {
                const postCard = sendCommentBtn.closest('.post-card');
                const postId = postCard?.dataset?.postId;
                const input = postCard ? postCard.querySelector('.comment-input') : null;
                const rawText = input ? String(input.value || '').trim() : '';
                if (!postId || !input || !rawText) return;

                const me = (typeof tmGetCreatorIdentity === 'function') ? tmGetCreatorIdentity() : {};
                const localComment = {
                    id: tmNowId(),
                    text: rawText,
                    timestamp: Date.now(),
                    authorEmail: me?.email || null,
                    authorName: (me?.name || me?.displayName || me?.creatorName || me?.username || (me?.email ? String(me.email).split('@')[0] : '') || 'Unknown'),
                    authorAvatarUrl: me?.avatarUrl || null,
                };

                // Try server first
                let finalComment = localComment;
                try {
                    const resp = await tmAddPostComment(postId, rawText);
                    if (resp && resp.ok) {
                        // accept server-provided comment shape if present
                        const c = resp.comment || resp.item || resp.data || resp.created || resp.newComment || null;
                        if (c && typeof c === 'object') {
                            finalComment = {
                                ...localComment,
                                ...c,
                                id: c.id || c.commentId || c._id || localComment.id,
                                text: c.text || c.message || localComment.text,
                                timestamp: Number(c.timestamp || c.createdAtMs || c.createdAt || Date.now()) || Date.now(),
                                authorEmail: c.authorEmail || c.creatorEmail || c.email || localComment.authorEmail,
                                authorName: c.authorName || c.creatorName || c.name || localComment.authorName,
                                authorAvatarUrl: c.authorAvatarUrl || c.creatorAvatarUrl || c.avatarUrl || localComment.authorAvatarUrl,
                            };
                        }
                    }
                } catch {}

                // Persist locally (for UI continuity even if server route isn't deployed yet)
                updatePost(postId, (post) => {
                    const p = post || {};
                    p.comments = Array.isArray(p.comments) ? p.comments : [];
                    p.comments.push(finalComment);
                    return p;
                });

                // Update UI
                const list = postCard.querySelector('.comment-list');
                if (list) {
                    const empty = list.querySelector('.no-comments-msg');
                    if (empty) empty.style.display = 'none';
                    list.insertAdjacentHTML('beforeend', generateCommentHTML(finalComment));
                }

                input.value = '';
                tmToast(TopToast, 'success', 'Comment sent');
                return;
            }

            // ===============================================
            // 🔥 POST & COMMENT REACTION PICKER LOGIC 🔥
            // ===============================================
            if (target.classList.contains('react-emoji')) {
                e.stopPropagation();
                const emojiBtn = target;
                const reactionType = emojiBtn.dataset.reaction;
                const context = emojiBtn.dataset.type; // 'post' or 'comment'

                // Hide pickers
                document.querySelectorAll('.reaction-picker.active, .comment-reaction-picker.active').forEach(p => p.classList.remove('active'));

                // POST REACTION (backend-first, fallback to local)
                if (context === 'post') {
                    const postCard = target.closest('.post-card');
                    const postId = postCard?.dataset?.postId;

                    const mainIcon = postCard?.querySelector('.main-like-btn');
                    const likesCount = postCard?.querySelector('.post-likes');

                    if (!postId) return;

                    const posts = getPosts();
                    const p = posts.find(x => String(x.id) === String(postId));
                    const prevReaction = p?.reaction || null;

                    let finalReaction = reactionType || null;
                    let finalCount = null;

                    try {
                        const resp = await tmSetPostReaction(postId, finalReaction);
                        if (resp) {
                            const r = resp?.reaction ?? resp?.myReaction ?? resp?.post?.reaction ?? resp?.post?.myReaction ?? resp?.post?.reactionType;
                            if (r !== undefined) finalReaction = (r === null ? null : String(r));
                            const c = resp?.reactionCount ?? resp?.post?.reactionCount ?? resp?.post?.likes ?? resp?.post?.likeCount;
                            if (c !== undefined) finalCount = Number(c);
                        }
                    } catch {}

                    if (finalCount == null || Number.isNaN(finalCount)) {
                        // Simple fallback: treated as 0/1 per-user like state
                        finalCount = finalReaction ? 1 : 0;
                        if (prevReaction && finalReaction) finalCount = 1;
                    }

                    updatePost(postId, { reaction: finalReaction, reactionCount: finalCount });

                    const ui = tmGetLikeUi(finalReaction);

                    if (mainIcon) {
                        mainIcon.className = `${ui.icon} main-like-btn action-like`;
                        mainIcon.style.color = ui.color || '';
                        mainIcon.style.transform = 'scale(1.4)';
                        setTimeout(() => (mainIcon.style.transform = 'scale(1)'), 200);
                    }
                    if (likesCount) likesCount.innerText = tmLikesText(finalCount);
                }
                // COMMENT REACTION (persisted via backend)
                else if (context === 'comment') {
                    const commentWrapper = target.closest('.comment-reaction-wrapper');
                    const commentLikeBtn = commentWrapper?.querySelector('.action-comment-like');
                    const commentItem = target.closest('.comment-item');
                    const postCard = target.closest('.post-card');
                    const postId = postCard?.dataset?.postId;
                    const commentId = commentItem?.dataset?.commentId;

                    // If we can't resolve ids, fallback to UI-only (keeps old behavior)
                    if (!postId || !commentId) {
                        if (commentLikeBtn) tmApplyCommentReactionButton(commentLikeBtn, reactionType);
                        return;
                    }

                    const prev = (commentLikeBtn?.dataset?.currentReaction || '').trim().toLowerCase();
                    let desired = String(reactionType || '').trim().toLowerCase();

                    // Toggle off if same reaction picked again
                    if (desired && prev && prev === desired) desired = '';

                    // Disable the button briefly to prevent double taps
                    if (commentLikeBtn) commentLikeBtn.style.pointerEvents = 'none';

                    try {
                        const resp = await tmSetCommentReaction(postId, commentId, desired || null);
                        if (!resp || !resp.ok) throw new Error(resp?.message || 'Failed');

                        const finalReaction = (resp.myReaction || '').toString().trim().toLowerCase();
                        if (commentLikeBtn) tmApplyCommentReactionButton(commentLikeBtn, finalReaction);

                        // Best-effort local cache update (if present)
                        try {
                            const posts = getPosts();
                            const p = posts.find(x => String(x.id) === String(postId));
                            if (p && Array.isArray(p.comments)) {
                                const c = p.comments.find(cc => String(cc.id || cc.commentId || '') === String(commentId));
                                if (c) c.myReaction = finalReaction || '';
                                setPosts(posts);
                            }
                        } catch (_) { /* ignore */ }
                    } catch (err) {
                        console.error('Comment reaction failed:', err);
                        tmToast(TopToast, 'error', 'Failed to react');
                    } finally {
                        if (commentLikeBtn) commentLikeBtn.style.pointerEvents = '';
                    }
                }
return;
            }

            // --- MAIN LIKE BUTTON CLICK (Toggle) ---
            if (target.classList.contains('main-like-btn')) {
                const icon = target;
                const postCard = target.closest('.post-card');
                const postId = postCard?.dataset?.postId;
                const likesCount = postCard?.querySelector('.post-likes');

                if (!postId) return;

                const posts = getPosts();
                const p = posts.find(x => String(x.id) === String(postId));
                const hasReaction = !!(p && p.reaction);

                const desiredReaction = hasReaction ? null : 'like';

                let finalReaction = desiredReaction;
                let finalCount = null;

                try {
                    const resp = await tmSetPostReaction(postId, desiredReaction);
                    if (resp) {
                        const r = resp?.reaction ?? resp?.myReaction ?? resp?.post?.reaction ?? resp?.post?.myReaction ?? resp?.post?.reactionType;
                        if (r !== undefined) finalReaction = (r === null ? null : String(r));
                        const c = resp?.reactionCount ?? resp?.post?.reactionCount ?? resp?.post?.likes ?? resp?.post?.likeCount;
                        if (c !== undefined) finalCount = Number(c);
                    }
                } catch {}

                if (finalCount == null || Number.isNaN(finalCount)) {
                    finalCount = finalReaction ? 1 : 0;
                }

                updatePost(postId, { reaction: finalReaction, reactionCount: finalCount });

                const ui = tmGetLikeUi(finalReaction);

                icon.className = `${ui.icon} main-like-btn action-like`;
                icon.style.color = ui.color || '';
                icon.style.transform = 'scale(1.3)';
                setTimeout(() => (icon.style.transform = 'scale(1)'), 200);

                if (likesCount) likesCount.innerText = tmLikesText(finalCount);
                return;
            }

            
// --- COMMENT LIKE CLICK (Persisted) ---
const commentLikeBtn = target.closest('.action-comment-like');
if (commentLikeBtn) {
    const btn = commentLikeBtn;
    const parentComment = btn.closest('.comment-item');
    const postCard = btn.closest('.post-card');
    const postId = postCard?.dataset?.postId;
    const commentId = parentComment?.dataset?.commentId;

    // Fallback to UI-only if IDs are missing
    if (!postId || !commentId) {
        const nowLiked = !btn.classList.contains('liked');
        if (nowLiked) tmApplyCommentReactionButton(btn, 'like');
        else tmApplyCommentReactionButton(btn, '');
        return;
    }

    const prev = (btn.dataset.currentReaction || '').trim().toLowerCase();
    const desired = (prev === 'like') ? '' : 'like';

    btn.style.pointerEvents = 'none';

    try {
        const resp = await tmSetCommentReaction(postId, commentId, desired || null);
        if (!resp || !resp.ok) throw new Error(resp?.message || 'Failed');

        const finalReaction = (resp.myReaction || '').toString().trim().toLowerCase();
        tmApplyCommentReactionButton(btn, finalReaction);

        // Best-effort local cache update (if present)
        try {
            const posts = getPosts();
            const p = posts.find(x => String(x.id) === String(postId));
            if (p && Array.isArray(p.comments)) {
                const c = p.comments.find(cc => String(cc.id || cc.commentId || '') === String(commentId));
                if (c) c.myReaction = finalReaction || '';
                setPosts(posts);
            }
        } catch (_) { /* ignore */ }
    } catch (err) {
        console.error('Comment like failed:', err);
        tmToast(TopToast, 'error', 'Failed to react');
    } finally {
        btn.style.pointerEvents = '';
    }

    return;
}

            // --- REPLY CLICK (SHOW REPLY INPUT) ---
            const replyBtn = target.closest('.action-reply-comment');
            if (replyBtn) {
                const parentComment = replyBtn.closest('.comment-item');
                if (!parentComment) return;

                const commentBody = parentComment.querySelector('.comment-body');
                if (!commentBody) return;

                const postCard = parentComment.closest('.post-card');
                const postId = postCard?.dataset?.postId || '';
                const parentCommentId = parentComment?.dataset?.commentId || '';

                // Toggle close if already open
                const existing = commentBody.querySelector('.reply-input-row');
                if (existing) {
                    existing.remove();
                    return;
                }

                const me = (typeof tmGetCreatorIdentity === 'function') ? tmGetCreatorIdentity() : {};
                const myAvatar = tmEscapeHtml((me && me.avatarUrl) ? me.avatarUrl : 'assets/images/truematch-mark.png');

                const inputRow = document.createElement('div');
                inputRow.className = 'reply-input-row';
                inputRow.dataset.postId = postId;
                inputRow.dataset.parentCommentId = parentCommentId;
                inputRow.innerHTML = `
                    <img src="${myAvatar}" class="comment-avatar" style="width:25px; height:25px;">
                    <input type="text" class="reply-input" placeholder="Write a reply...">
                `;
                commentBody.appendChild(inputRow);

                setTimeout(() => {
                    const inp = inputRow.querySelector('.reply-input');
                    if (inp) inp.focus();
                }, 0);

                return;
            }

            if (target.classList.contains('fa-dollar-sign') && target.closest('.post-actions')) {
                Swal.fire({
                    title: 'Send Tip', input: 'number', inputPlaceholder: '5.00',
                    showCancelButton: true, confirmButtonText: 'Send', confirmButtonColor: '#64E9EE', background: '#0d1423', color: '#fff'
                }).then((result) => {
                    if (result.isConfirmed && result.value) TopToast.fire({ icon: 'success', title: `Sent $${result.value} tip!` });
                });
            }
        });

        // Enter Key Handlers
        feed.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                if (e.target.classList.contains('comment-input')) {
                    e.preventDefault();
                    // Find send button next to it or handle submission directly
                    const postCard = e.target.closest('.post-card');
                    const btn = postCard.querySelector('.btn-send-comment');
                    if(btn) btn.click();
                }
                else if (e.target.classList.contains('reply-input')) {
                    e.preventDefault();
                    const rawText = (e.target.value || '').trim();
                    if (!rawText) return;

                    const row = e.target.closest('.reply-input-row');
                    const postCard = e.target.closest('.post-card');
                    const postId = postCard?.dataset?.postId || row?.dataset?.postId || '';
                    const parentCommentId = row?.dataset?.parentCommentId || '';

                    // If we can't resolve ids, fallback to UI-only (demo mode)
                    if (!postId || !parentCommentId) {
                        const text = tmEscapeHtml(rawText).replace(/\n/g, '<br>');
                        const me = (typeof tmGetCreatorIdentity === 'function') ? tmGetCreatorIdentity() : {};
                        const myNameRaw = (me && me.name) ? String(me.name) : 'You';
                        const myName = tmEscapeHtml((myNameRaw.split('|')[0] || myNameRaw).trim() || 'You');
                        const myAvatar = tmEscapeHtml((me && me.avatarUrl) ? me.avatarUrl : 'assets/images/truematch-mark.png');

                        const replyHTML = `
                            <div class="comment-item" style="margin-top:10px; padding-left:34px; animation:fadeIn 0.2s;">
                                <img src="${myAvatar}" class="comment-avatar" style="width:25px; height:25px;">
                                <div class="comment-body">
                                    <div class="comment-bubble">
                                        <div class="comment-author" style="font-weight:700; font-size:0.8rem;">${myName}</div>
                                        <div class="comment-text">${text}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                        row?.insertAdjacentHTML('beforebegin', replyHTML);
                        row?.remove();
                        return;
                    }

                    // Persisted reply: encode parent in text (server.js does not have a dedicated replies endpoint)
                    const taggedText = `[[replyTo:${parentCommentId}]] ${rawText}`;

                    // prevent double-submits
                    e.target.disabled = true;

                    try {
                        const resp = await tmAddPostComment(postId, taggedText);
                        if (!resp || !resp.ok || !resp.comment) throw new Error(resp?.message || 'Failed to send reply');

                        // Best-effort local cache update
                        try {
                            updatePost(postId, (post) => {
                                if (!post) return post;
                                post.comments = Array.isArray(post.comments) ? post.comments : [];
                                post.comments.push(resp.comment);
                                if (resp.commentCount !== undefined && resp.commentCount !== null) {
                                    post.commentCount = Number(resp.commentCount) || post.commentCount;
                                }
                                return post;
                            });
                        } catch (_) {}

                        // Ensure "No comments yet" is hidden
                        const list = postCard?.querySelector('.comment-list');
                        const noMsg = list?.querySelector('.no-comments-msg');
                        if (noMsg) noMsg.style.display = 'none';

                        // Insert under the parent thread
                        const parentEl = row?.closest('.comment-item');
                        const repliesWrap = parentEl?.querySelector(':scope > .comment-body > .comment-replies') || parentEl?.querySelector('.comment-replies');

                        const replyHTML = generateCommentHTML(resp.comment, undefined, { isReply: true });

                        if (repliesWrap) repliesWrap.insertAdjacentHTML('beforeend', replyHTML);
                        else row?.insertAdjacentHTML('beforebegin', replyHTML);

                        row?.remove();
                    } catch (err) {
                        console.error('Reply send failed:', err);
                        tmToast(TopToast, 'error', 'Failed to send reply');
                        e.target.disabled = false;
                    }
                }
            }
        });

        // Close Dropdown Outside Click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.post-options-btn') && !e.target.closest('.post-menu-dropdown')) {
                document.querySelectorAll('.post-menu-dropdown:not(.hidden)').forEach(menu => menu.classList.add('hidden'));
            }
        });
    }
}

// ==========================================
// 💾 LOCAL STORAGE & EXPIRY LOGIC (MOCK DB)
// ==========================================

function getPosts() {
    const posts = localStorage.getItem(STORAGE_KEY);
    return posts ? JSON.parse(posts) : [];
}

function savePost(post) {
    const posts = getPosts();
    posts.unshift(post);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

async function deletePost(id) {
    let posts = getPosts();
    posts = posts.filter(p => p.id != id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

    // Best-effort backend delete (ignore errors to avoid breaking UX)
    try {
        await fetch(DELETE_POST_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id }),
        });
    } catch (e) {
        // ignore
    }
}


function setPosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// Update a post by id (persisted)
function updatePost(postId, updater) {
    const posts = getPosts();
    const idx = posts.findIndex(p => String(p.id) === String(postId));
    if (idx === -1) return null;

    const current = { ...posts[idx] };

    let updated = null;

    if (typeof updater === 'function') {
        updated = updater(current);
    } else if (updater && typeof updater === 'object') {
        updated = { ...current, ...updater };
    } else {
        return null;
    }

    if (!updated) return null;

    posts[idx] = updated;
    setPosts(posts);
    return updated;
}

function renderPollBlock(post) {
    const poll = post && post.poll;
    if (!poll || !Array.isArray(poll.options) || poll.options.length < 2) return '';

    const opts = poll.options;
    const votes = Array.isArray(post.pollVotes) && post.pollVotes.length === opts.length
        ? post.pollVotes
        : new Array(opts.length).fill(0);

    const total = votes.reduce((a, b) => a + (Number(b) || 0), 0) || 0;
    const myVote = (post.pollMyVote == null) ? null : Number(post.pollMyVote);

    const rows = opts.map((opt, i) => {
        const v = Number(votes[i] || 0);
        const pct = total ? Math.round((v / total) * 100) : 0;
        const isMine = myVote === i;
        const disabled = myVote != null ? 'pointer-events:none; opacity:0.9;' : '';
        const border = isMine ? 'border:1px solid var(--primary-cyan);' : 'border:1px solid var(--border-color);';
        return `
          <div class="poll-option-btn" data-post-id="${tmEscapeHtml(post.id)}" data-option-idx="${i}" style="${disabled} cursor:pointer; ${border} border-radius:12px; padding:10px 12px; margin:8px 0; background: rgba(255,255,255,0.02);">
            <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
              <div style="font-weight:700; font-size:0.92rem;">${tmEscapeHtml(opt)}</div>
              <div style="color:var(--muted); font-size:0.85rem;">${myVote != null ? pct + '%' : ''}</div>
            </div>
            ${myVote != null ? `
            <div style="height:6px; background: rgba(255,255,255,0.06); border-radius:999px; margin-top:8px; overflow:hidden;">
              <div style="height:100%; width:${pct}%; background: var(--primary-cyan);"></div>
            </div>
            ` : ''}
          </div>
        `;
    }).join('');

    const meta = myVote != null ? `${total} vote${total === 1 ? '' : 's'}` : 'Tap to vote';

    return `
      <div class="post-poll-block" style="margin: 6px 0 14px; padding: 12px; border-radius: 14px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-weight:800; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-square-poll-horizontal" style="color: var(--primary-cyan);"></i> Poll
          </div>
          <div style="color: var(--muted); font-size:0.85rem;">${meta}</div>
        </div>
        ${rows}
      </div>
    `;
}

function renderQuizBlock(post) {
    const quiz = post && post.quiz;
    if (!quiz || !Array.isArray(quiz.options) || quiz.options.length < 2) return '';

    const opts = quiz.options;
    const votes = Array.isArray(post.quizVotes) && post.quizVotes.length === opts.length
        ? post.quizVotes
        : new Array(opts.length).fill(0);

    const total = votes.reduce((a, b) => a + (Number(b) || 0), 0) || 0;
    const my = (post.quizMyAnswer == null) ? null : Number(post.quizMyAnswer);

    const rows = opts.map((opt, i) => {
        const v = Number(votes[i] || 0);
        const pct = total ? Math.round((v / total) * 100) : 0;
        const isMine = my === i;
        const isCorrect = quiz.correctIndex === i;
        const answered = my != null;

        const baseBorder = answered
            ? (isCorrect ? 'border:1px solid #46e85e;' : (isMine ? 'border:1px solid #ff4757;' : 'border:1px solid var(--border-color);'))
            : 'border:1px solid var(--border-color);';

        const disabled = answered ? 'pointer-events:none; opacity:0.95;' : '';
        const tag = answered && isCorrect ? '<span style="font-size:0.75rem; font-weight:800; color:#46e85e;">Correct</span>' : (answered && isMine && !isCorrect ? '<span style="font-size:0.75rem; font-weight:800; color:#ff4757;">Your pick</span>' : '');

        return `
          <div class="quiz-option-btn" data-post-id="${tmEscapeHtml(post.id)}" data-option-idx="${i}" style="${disabled} cursor:pointer; ${baseBorder} border-radius:12px; padding:10px 12px; margin:8px 0; background: rgba(255,255,255,0.02);">
            <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
              <div style="font-weight:700; font-size:0.92rem;">${tmEscapeHtml(opt)}</div>
              <div style="display:flex; gap:10px; align-items:center;">
                ${tag}
                <div style="color:var(--muted); font-size:0.85rem;">${answered ? pct + '%' : ''}</div>
              </div>
            </div>
            ${answered ? `
            <div style="height:6px; background: rgba(255,255,255,0.06); border-radius:999px; margin-top:8px; overflow:hidden;">
              <div style="height:100%; width:${pct}%; background: ${isCorrect ? '#46e85e' : (isMine ? '#ff4757' : 'rgba(255,255,255,0.18)')};"></div>
            </div>
            ` : ''}
          </div>
        `;
    }).join('');

    const answered = my != null;
    const meta = answered ? `${total} answer${total === 1 ? '' : 's'}` : 'Tap an answer';
    const exp = (answered && quiz.explanation) ? `<div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border-color); color:var(--muted); font-size:0.9rem; line-height:1.4;">${tmEscapeHtml(quiz.explanation)}</div>` : '';

    return `
      <div class="post-quiz-block" style="margin: 6px 0 14px; padding: 12px; border-radius: 14px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-weight:800; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-clipboard-question" style="color: var(--primary-cyan);"></i> Quiz
          </div>
          <div style="color: var(--muted); font-size:0.85rem;">${meta}</div>
        </div>
        <div style="font-weight:800; font-size:1rem; margin-bottom:8px;">${tmEscapeHtml(quiz.question || '')}</div>
        ${rows}
        ${exp}
      </div>
    `;
}

function tmOpenQuizComposer(TopToast) {
    if (typeof Swal === 'undefined' || !Swal.fire) {
        tmToast(TopToast, 'error', 'Quiz composer unavailable');
        return;
    }

    const html = `
      <div style="text-align:left;">
        <div style="font-weight:800; margin-bottom:8px;">Create a quiz</div>

        <div style="font-size:12px; color: var(--muted); margin-bottom:10px;">Question</div>
        <textarea id="tm-quiz-q" rows="2" style="width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text); outline:none; resize:none;"></textarea>

        <div style="font-size:12px; color: var(--muted); margin:14px 0 8px;">Options (min 2)</div>
        <input id="tm-quiz-o1" placeholder="Option A" style="width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text); outline:none; margin-bottom:8px;">
        <input id="tm-quiz-o2" placeholder="Option B" style="width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text); outline:none; margin-bottom:8px;">
        <input id="tm-quiz-o3" placeholder="Option C (optional)" style="width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text); outline:none; margin-bottom:8px;">
        <input id="tm-quiz-o4" placeholder="Option D (optional)" style="width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text); outline:none; margin-bottom:12px;">

        <div style="display:flex; gap:10px; align-items:center;">
          <div style="font-size:12px; color: var(--muted);">Correct</div>
          <select id="tm-quiz-correct" style="flex:1; padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text); outline:none;">
            <option value="0">Option A</option>
            <option value="1">Option B</option>
            <option value="2">Option C</option>
            <option value="3">Option D</option>
          </select>
        </div>

        <div style="font-size:12px; color: var(--muted); margin:14px 0 8px;">Explanation (optional)</div>
        <textarea id="tm-quiz-exp" rows="2" style="width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text); outline:none; resize:none;"></textarea>
      </div>
    `;

    Swal.fire({
        title: '',
        html,
        showCancelButton: true,
        confirmButtonText: 'Post Quiz',
        cancelButtonText: 'Cancel',
        background: '#0d1423',
        color: '#fff',
        preConfirm: () => {
            const q = (document.getElementById('tm-quiz-q')?.value || '').trim();
            const o1 = (document.getElementById('tm-quiz-o1')?.value || '').trim();
            const o2 = (document.getElementById('tm-quiz-o2')?.value || '').trim();
            const o3 = (document.getElementById('tm-quiz-o3')?.value || '').trim();
            const o4 = (document.getElementById('tm-quiz-o4')?.value || '').trim();
            const exp = (document.getElementById('tm-quiz-exp')?.value || '').trim();
            const correct = Number(document.getElementById('tm-quiz-correct')?.value || 0);

            const options = [o1, o2, o3, o4].filter(Boolean);

            if (!q) {
                Swal.showValidationMessage('Question is required');
                return null;
            }
            if (options.length < 2) {
                Swal.showValidationMessage('Add at least 2 options');
                return null;
            }

            // Map selected correct index to the filtered options
            const rawOpts = [o1, o2, o3, o4];
            let correctText = rawOpts[correct] || '';
            correctText = correctText.trim();
            let correctIndex = options.findIndex(x => x === correctText);
            if (correctIndex === -1) correctIndex = 0;

            return { question: q, options, correctIndex, explanation: exp };
        }
    }).then(async (res) => {
        if (!res.isConfirmed || !res.value) return;
        const v = res.value;
        const draft = {
    type: 'quiz',
    text: v.question,
    quiz: {
        question: v.question,
        options: v.options,
        correctIndex: v.correctIndex,
        explanation: v.explanation,
    },
};

let createdPost = await tmCreateCreatorPost(draft);

if (!createdPost) {
    const meEmail = tmGetMeEmail();
    const myIdentity = tmGetCreatorIdentity();
    createdPost = {
        id: tmNowId(),
        creatorEmail: meEmail || null,
        creatorName: myIdentity.name,
        creatorHandle: myIdentity.handle,
        creatorAvatarUrl: myIdentity.avatarUrl,
        creatorVerified: true,
        type: 'quiz',
        text: v.question,
        timestamp: Date.now(),
        comments: [],
        quiz: { ...draft.quiz },
        quizVotes: new Array((v.options || []).length).fill(0),
        quizMyAnswer: null,
    };
} else {
    createdPost.comments = Array.isArray(createdPost.comments) ? createdPost.comments : [];
    if (createdPost.type === 'quiz' && createdPost.quiz && Array.isArray(createdPost.quiz.options)) {
        createdPost.quizVotes = Array.isArray(createdPost.quizVotes)
            ? createdPost.quizVotes
            : new Array(createdPost.quiz.options.length).fill(0);
        createdPost.quizMyAnswer = null;
    }
}

savePost(createdPost);
renderPost(createdPost, true);
if (DOM.feedEmptyState) DOM.feedEmptyState.style.display = 'none';
tmToast(TopToast, 'success', 'Quiz posted');
    });
}

async function loadPosts() {
    if (!DOM.creatorFeed) return;

    // Clear rendered cards, but keep the empty-state element intact
    try {
        DOM.creatorFeed.querySelectorAll('.post-card').forEach(el => el.remove());
    } catch (e) {
        // ignore
    }

    const remote = await tmFetchCreatorsFeed(50);

    let posts;
    if (Array.isArray(remote) && remote.length) {
        // Merge remote posts with local cached client-only interaction fields
        const local = getPosts();
        const localMap = new Map(local.map(p => [String(p.id), p]));
        posts = remote.map(p => {
            const lp = localMap.get(String(p.id));
            if (!lp) return p;

            const merged = { ...p };

            // Normalize possible server shapes (future-proof)
            if (merged.myReaction != null && merged.reaction == null) merged.reaction = merged.myReaction;

            const clientFields = [
                'comments',
                'reaction',
                'reactionCount',
                'pollVotes',
                'pollMyVote',
                'quizVotes',
                'quizMyAnswer',
                'pinned',
            ];

            for (const f of clientFields) {
                // Only fill missing fields from local cache (server stays authoritative when present)
                if (merged[f] === undefined && lp[f] !== undefined) merged[f] = lp[f];
            }

            if (!Array.isArray(merged.comments) && Array.isArray(lp.comments)) merged.comments = lp.comments;
            return merged;
        });

        setPosts(posts);
    } else {
        posts = getPosts();
    }

    if (posts.length && DOM.feedEmptyState) {
        DOM.feedEmptyState.style.display = 'none';
    }

    posts.forEach(post => renderPost(post, false));
}

// ==========================================
// 🎨 HTML GENERATORS

// ==========================================

function renderPost(post, animate) {
    const timeAgo = getTimeAgo(post.timestamp || Date.now());
    const animationStyle = animate ? 'animation: fadeIn 0.3s ease;' : '';

    const { name, handle, avatarUrl, verified } = tmGetPostIdentity(post);

    const safeText = tmRenderFormattedText(post.text || '');
    const meEmail = tmGetMeEmail();
    const canDelete = !!(meEmail && post.creatorEmail && meEmail === String(post.creatorEmail).toLowerCase());

    const isBookmarked = tmIsBookmarked(post.id);
    const likeCount = (Number(post.reactionCount) || (post.reaction ? 1 : 0)) || 0;
    const likeUI = tmGetLikeUi(post.reaction);
    const likeIconClass = `${likeUI.icon} main-like-btn action-like`;
    const likeColorStyle = likeUI.color ? `color: ${likeUI.color};` : '';

    const comments = Array.isArray(post.comments) ? post.comments : [];
    const commentsHTML = comments.map(c => generateCommentHTML(c)).join('');
    const noCommentsStyle = comments.length ? 'display:none;' : '';

    const extraBlock = (post.type === 'poll') ? renderPollBlock(post)
                    : (post.type === 'quiz') ? renderQuizBlock(post)
                    : '';

    const postHTML = `
        <div class="post-card" id="post-${post.id}" data-post-id="${tmEscapeHtml(post.id)}" style="padding: 20px; border-bottom: var(--border); ${animationStyle}">
            <div class="post-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div style="display: flex; gap: 12px;">
                    <img src="${tmEscapeHtml(avatarUrl)}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-cyan);">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 700; font-size: 1rem;">${tmEscapeHtml(name)} ${verified ? '<i class="fa-solid fa-circle-check" style="color:var(--primary-cyan); font-size:0.8rem;"></i>' : ''}</span>
                        <span style="font-size: 0.85rem; color: var(--muted);">${tmEscapeHtml(handle)} &bull; ${timeAgo}${post?.pinned ? ' &bull; <span style="color:var(--primary-cyan); font-weight:800;">Pinned</span>' : ''}</span>
                    </div>
                </div>

                <div style="position:relative;">
                    <div class="post-options-btn"><i class="fa-solid fa-ellipsis"></i></div>
                    <div class="post-menu-dropdown hidden">
                        <div class="menu-item action-copy-link"><i class="fa-regular fa-copy"></i> Copy Link</div>
                        <div class="menu-item action-pin"><i class="fa-solid fa-thumbtack"></i> ${post?.pinned ? "Unpin from Profile" : "Pin to Profile"}</div>
                        ${canDelete ? `<div class=\"menu-item danger action-delete\"><i class=\"fa-regular fa-trash-can\"></i> Delete Post</div>` : ''}
                    </div>
                </div>
            </div>

            ${safeText ? `<div class="post-content" style="font-size: 0.95rem; line-height: 1.5; margin-bottom: 15px; white-space: normal;">${safeText}</div>` : ''}

            ${extraBlock}

            <div class="post-actions" style="display: flex; justify-content: space-between; align-items: center; color: var(--muted); padding-top: 10px; position: relative;">
                <div style="display: flex; gap: 25px; font-size: 1.3rem; align-items: center;">

                    <div class="reaction-wrapper">
                        <i class="${likeIconClass}" style="cursor: pointer; transition: 0.2s; ${likeColorStyle}"></i>
                        <div class="reaction-picker">
                            <span class="react-emoji" data-type="post" data-reaction="like">👍</span>
                            <span class="react-emoji" data-type="post" data-reaction="love">❤️</span>
                            <span class="react-emoji" data-type="post" data-reaction="haha">😆</span>
                            <span class="react-emoji" data-type="post" data-reaction="wow">😮</span>
                            <span class="react-emoji" data-type="post" data-reaction="sad">😢</span>
                            <span class="react-emoji" data-type="post" data-reaction="angry">😡</span>
                        </div>
                    </div>

                    <i class="fa-regular fa-comment btn-toggle-comment" style="cursor: pointer; transition: 0.2s;"></i>
                    <i class="fa-solid fa-dollar-sign" style="cursor: pointer; transition: 0.2s;"></i>
                </div>
                <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark" style="cursor: pointer; font-size: 1.2rem; transition: 0.2s; ${isBookmarked ? 'color: #64E9EE;' : ''}"></i>
            </div>

            <div class="post-likes" style="font-size: 0.85rem; font-weight: 700; margin-top: 10px; color: var(--text);">${tmLikesText(likeCount)}</div>

            <div class="post-comments-section hidden">
                 <div class="comment-list">
                    <div class="no-comments-msg" style="text-align: center; font-size: 0.85rem; color: var(--muted); ${noCommentsStyle}">No comments yet</div>
                    ${commentsHTML}
                 </div>
                 <div class="comment-input-area">
                    <img src="${tmEscapeHtml(avatarUrl)}" style="width: 30px; height: 30px; border-radius: 50%;">
                    <input type="text" class="comment-input" placeholder="Write a comment...">
                    <button class="btn-send-comment"><i class="fa-solid fa-paper-plane"></i></button>
                 </div>
            </div>
        </div>
    `;

    if (animate) {
        DOM.creatorFeed.insertAdjacentHTML('afterbegin', postHTML);
        if (DOM.feedEmptyState) DOM.feedEmptyState.style.display = 'none';
    } else {
        DOM.creatorFeed.insertAdjacentHTML('beforeend', postHTML);
    }
}

// 🔥 UPDATED GENERATOR TO INCLUDE EMOJIS IN COMMENTS 🔥


// Time-ago helper (was referenced but missing in some builds)
function tmTimeAgo(tsMs) {
  const t = Number(tsMs) || 0;
  if (!t) return '';
  const deltaMs = Date.now() - t;
  if (!isFinite(deltaMs)) return '';
  const s = Math.floor(Math.abs(deltaMs) / 1000);
  const isFuture = deltaMs < 0;

  const fmt = (n, unit) => `${n}${unit}${isFuture ? '' : ' ago'}`;

  if (s < 10 && !isFuture) return 'just now';
  if (s < 60) return fmt(s, 's');
  const m = Math.floor(s / 60);
  if (m < 60) return fmt(m, 'm');
  const h = Math.floor(m / 60);
  if (h < 24) return fmt(h, 'h');
  const d = Math.floor(h / 24);
  if (d < 7) return fmt(d, 'd');
  const w = Math.floor(d / 7);
  if (w < 5) return fmt(w, 'w');
  const mo = Math.floor(d / 30);
  if (mo < 12) return fmt(mo, 'mo');
  const y = Math.floor(d / 365);
  return fmt(y, 'y');
}

function tmParseReplyTag(rawText = '') {
    const raw = String(rawText || '');
    const m = raw.match(/^\s*\[\[replyTo:([^\]]+)\]\]\s*/i);
    if (!m) return { isReply: false, parentId: '', cleanText: raw };
    const parentId = String(m[1] || '').trim();
    const cleanText = raw.slice(m[0].length);
    return { isReply: true, parentId, cleanText };
}

function generateCommentHTML(textOrObj, timestampMaybe, opts = {}) {
    const safeStr = (v) => (v === null || v === undefined) ? '' : String(v);
    const options = (opts && typeof opts === 'object') ? opts : {};

    const c = (textOrObj && typeof textOrObj === 'object')
        ? textOrObj
        : { text: textOrObj, timestamp: timestampMaybe };

    const me = (typeof tmGetCreatorIdentity === 'function') ? tmGetCreatorIdentity() : {};

    const authorEmail = safeStr(c.authorEmail || c.creatorEmail || c.email || '').trim();
    const authorNameRaw = safeStr(c.authorName || c.creatorName || c.name || '').trim();

    const meEmail = safeStr(me.email || '').trim();
    const isMe =
        (authorEmail && meEmail && authorEmail.toLowerCase() === meEmail.toLowerCase()) ||
        (!authorEmail && (authorNameRaw === 'You' || authorNameRaw === 'Me'));

    // Name: keep only the display name (strip " | Bio: ..." etc if present)
    const emailPrefix = authorEmail ? safeStr(String(authorEmail).split('@')[0]).trim() : '';
    const myName = safeStr(me.name || me.displayName || me.creatorName || me.username || '').trim();
    const rawName = (isMe ? (myName || emailPrefix || 'Unknown') : (authorNameRaw || emailPrefix || 'Unknown'));
    const name = (rawName.split('|')[0] || rawName).trim() || 'Unknown';

    // Avatar
    const avatar =
        (isMe ? safeStr(me.avatarUrl || me.creatorAvatarUrl || '').trim()
              : safeStr(c.authorAvatarUrl || c.creatorAvatarUrl || c.avatarUrl || '').trim())
        || 'assets/images/truematch-mark.png';

    const avatarAttr = tmEscapeHtml(avatar);

    // Reply-tag parsing (stored in text as [[replyTo:<id>]] ...)
    const originalText = safeStr(c.text || '').trim();
    const meta = tmParseReplyTag(originalText);

    const displayRaw = safeStr(
        (c.__cleanText !== undefined && c.__cleanText !== null) ? c.__cleanText : meta.cleanText
    ).trim();

    const text = tmEscapeHtml(displayRaw).replace(/\n/g, '<br>');
    const commentId = safeStr(c.id || c.commentId || c._id || '').trim();

    // Optional initial reaction (server-backed via `myReaction`)
    const myReaction = safeStr(c.myReaction || c.reaction || c.reactionType || '').trim();
    const likeHtml = myReaction ? getEmojiIcon(myReaction) : 'Like';
    const likedClass = myReaction ? 'liked' : '';
    const likeColorStyle = myReaction ? `style="color:${getEmojiColor(myReaction)}; font-weight:700;"` : 'style="font-weight:600;"';

    const idAttr = commentId ? ` data-comment-id="${tmEscapeHtml(commentId)}"` : '';

    const isReply = !!options.isReply;
    const itemStyle = isReply ? ' style="margin-top:10px; padding-left:34px; animation:fadeIn 0.2s;"' : '';

    const repliesHtml = safeStr(options.repliesHtml || '').trim();
    const repliesBlock = isReply ? '' : `<div class="comment-replies">${repliesHtml}</div>`;

    const replyBtnHtml = isReply ? '' : '<span class="c-action action-reply-comment">Reply</span>';

    return `
        <div class="comment-item"${idAttr}${itemStyle}>
            <img class="comment-avatar" src="${avatarAttr}" alt="">
            <div class="comment-body">
                <div class="comment-bubble">
                    <div class="comment-author" style="font-weight:700; font-size:0.85rem;">${tmEscapeHtml(name)}</div>
                    <div class="comment-text">${text}</div>
                </div>

                <div class="comment-actions">
                    <div class="comment-reaction-wrapper">
                        <span class="c-action c-like action-comment-like ${likedClass}" data-current-reaction="${tmEscapeHtml(myReaction || '')}" ${likeColorStyle}>${likeHtml}</span>
                        <div class="comment-reaction-picker">
                            <span class="react-emoji" data-type="comment" data-reaction="like">👍</span>
                            <span class="react-emoji" data-type="comment" data-reaction="love">❤️</span>
                            <span class="react-emoji" data-type="comment" data-reaction="haha">😆</span>
                            <span class="react-emoji" data-type="comment" data-reaction="wow">😮</span>
                            <span class="react-emoji" data-type="comment" data-reaction="sad">😢</span>
                            <span class="react-emoji" data-type="comment" data-reaction="angry">😡</span>
                        </div>
                    </div>

                    ${replyBtnHtml}
                </div>

                ${repliesBlock}
            </div>
        </div>
    `;
}

// Helpers for Icons/Colors (Same as Profile.js)
// (Same as Profile.js)
function getEmojiIcon(type) {
    switch(type) {
        case 'like': return '<i class="fa-solid fa-thumbs-up"></i>';
        case 'love': return '<i class="fa-solid fa-heart"></i>';
        case 'haha': return '<i class="fa-solid fa-face-laugh-squint"></i>';
        case 'wow': return '<i class="fa-solid fa-face-surprise"></i>';
        case 'sad': return '<i class="fa-solid fa-face-sad-tear"></i>';
        case 'angry': return '<i class="fa-solid fa-face-angry"></i>';
        default: return 'Like';
    }
}

function getEmojiColor(type) {
    switch(type) {
        case 'like': return '#64E9EE';
        case 'love': return '#ff4757';
        case 'haha': return '#f1c40f';
        case 'wow': return '#f1c40f';
        case 'sad': return '#e67e22';
        case 'angry': return '#e74c3c';
        default: return '';
    }
}

// Apply (and remember) a comment reaction on the "Like" button.
// Keeps visuals consistent across picker clicks and simple like toggles.
function tmApplyCommentReactionButton(btn, reaction) {
    if (!btn) return;
    const r = (reaction === null || reaction === undefined) ? '' : String(reaction).trim().toLowerCase();
    btn.dataset.currentReaction = r;

    if (r) {
        btn.innerHTML = getEmojiIcon(r);
        btn.classList.add('liked');
        btn.style.color = getEmojiColor(r);
        btn.style.fontWeight = '700';
    } else {
        btn.classList.remove('liked');
        btn.innerHTML = 'Like';
        btn.style.color = '';
        btn.style.fontWeight = '600';
    }
}


function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "Just now";
}

  return { initHome };
})();

// ===== notifications.js (bundled) =====
const __CreatorsNotifications = (function() {
  const { DOM } = __CreatorsDOM;
  const { NOTIFICATIONS_DATA, DEFAULT_AVATAR } = __CreatorsData;
  const { apiGet, apiPost } = __CreatorsApi;

let currentFilter = 'All';
let currentSearch = '';
let _allNotifs = [];
let _loaded = false;

let _fetching = false;
let _lastFetchAtMs = 0;
const _STALE_AFTER_MS = 15_000; // refresh when user re-opens tab after this

// Local read tracking (because backend currently only supports mark-all-read)
const _LS_READ_PREFIX = 'tm_notif_read_v1:';

function _getMeEmail() {
  try {
    const me = window.__tmMe || window.tmMeCache || null;
    const e = me && me.email ? String(me.email).trim().toLowerCase() : '';
    return e || '';
  } catch (e) {
    return '';
  }
}

function _lsReadKey() {
  const e = _getMeEmail();
  return `${_LS_READ_PREFIX}${e || 'anon'}`;
}

function _getLocalReadMap() {
  try {
    const raw = window.localStorage ? window.localStorage.getItem(_lsReadKey()) : '';
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function _setLocalReadMap(map) {
  try {
    if (!window.localStorage) return;
    window.localStorage.setItem(_lsReadKey(), JSON.stringify(map || {}));
  } catch {}
}

function _markLocalRead(notifId) {
  const id = String(notifId || '').trim();
  if (!id) return;
  const map = _getLocalReadMap();
  if (map[id]) return;
  map[id] = Date.now();
  _setLocalReadMap(map);
}

function _applyLocalReadState(items) {
  const map = _getLocalReadMap();
  if (!map || typeof map !== 'object') return items;
  return (items || []).map(n => {
    const id = String(n?.id || '').trim();
    const local = id && map[id] ? Number(map[id]) : 0;
    if (!local) return n;
    const readAtMs = Number(n?.readAtMs) || 0;
    if (readAtMs) return n;
    return { ...n, readAtMs: local };
  });
}

 function initNotifications() {
  // 1) Tab switching (pills)
  if (DOM.notifPills && DOM.notifPills.length > 0) {
    DOM.notifPills.forEach(pill => {
      pill.addEventListener('click', () => {
        DOM.notifPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        currentFilter = (pill.dataset && (pill.dataset.filter || pill.dataset.notifFilter || pill.dataset.tab))
          ? String(pill.dataset.filter || pill.dataset.notifFilter || pill.dataset.tab).trim()
          : (pill.innerText || '').trim();

        renderNotifications({ force: false });
      });
    });
  }

  // 2) Settings icon click → open settings popover
  if (DOM.notifGearBtn) {
    DOM.notifGearBtn.addEventListener('click', () => {
      if (DOM.btnSettingsPop) DOM.btnSettingsPop.click();
      else console.warn('Settings navigation button not found.');
    });
  }

  // 3) Search icon click → toggle search bar
  if (DOM.notifSearchBtn && DOM.notifSearchContainer) {
    DOM.notifSearchBtn.addEventListener('click', () => {
      DOM.notifSearchContainer.classList.toggle('hidden');
      if (!DOM.notifSearchContainer.classList.contains('hidden') && DOM.notifSearchInput) {
        setTimeout(() => DOM.notifSearchInput.focus(), 100);
      }
    });
  }

  // ESC closes search (if open)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!DOM.notifSearchContainer) return;
    if (!DOM.notifSearchContainer.classList.contains('hidden')) {
      DOM.notifSearchContainer.classList.add('hidden');
    }
  });

  // 4) Search input
  if (DOM.notifSearchInput) {
    DOM.notifSearchInput.addEventListener('input', () => {
      currentSearch = String(DOM.notifSearchInput.value || '').trim().toLowerCase();
      renderNotifications({ force: false });
    });
  }

  // 5) Mark all read (if the view provides a button)
  const markAllBtn = document.getElementById('notif-btn-markall')
    || document.querySelector('[data-action="notif-mark-all"]')
    || document.querySelector('.notif-mark-all');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      const res = await apiPost('/api/me/notifications/mark-all-read', {});
      if (!res || res.ok !== true) {
        console.warn('mark-all-read failed:', res);
        return;
      }
      const now = Date.now();
      _allNotifs = (_allNotifs || []).map(n => ({ ...n, readAtMs: n.readAtMs || now }));
      // also set local read for ids, so UI stays consistent
      try {
        const map = _getLocalReadMap();
        for (const n of _allNotifs || []) {
          const id = String(n?.id || '').trim();
          if (id && !map[id]) map[id] = now;
        }
        _setLocalReadMap(map);
      } catch {}
      renderNotifications({ force: false });
    });
  }

  // 6) Refresh when user opens Notifications tab
  const nav = DOM.navNotif || document.getElementById('nav-link-notif');
  const mob = DOM.mobNotif || document.getElementById('mob-nav-notif');
  [nav, mob].filter(Boolean).forEach(btn => {
    btn.addEventListener('click', () => {
      // force refresh on open if stale
      refreshNotifications(false);
    });
  });

  // Initial render (safe even if view is hidden)
  renderNotifications({ force: false });
}

 async function refreshNotifications(force = false) {
  // If the view is currently visible, refresh immediately.
  // If hidden, we still allow refresh on nav click to keep data fresh.
  await renderNotifications({ force: !!force, fromRefresh: true });
}

function _fmtRelativeTime(tsMs) {
  const ms = Number(tsMs) || 0;
  if (!ms) return '';
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  const yr = Math.floor(day / 365);
  return `${yr}y`;
}

function _inferKind(n) {
  const raw = String(n?.type || '').toLowerCase().trim();
  const t = raw;

  // normalize common variants so filters + icons work
  if (['tag', 'tags', 'tagged'].includes(t)) return 'tag';
  if (['mention', 'mentions'].includes(t)) return 'mention';
  if (['subscription', 'subscriptions', 'subscribe', 'subscribed', 'subscriber', 'renewal'].includes(t)) return 'subscription';
  if (['promotion', 'promotions', 'promo', 'offer', 'sale'].includes(t)) return 'promotion';
  if (['comment', 'comments', 'reply', 'replies'].includes(t)) return 'comment';
  if (['like', 'likes', 'reaction', 'reactions'].includes(t)) return 'like';
  if (['message', 'messages', 'dm', 'dms'].includes(t)) return 'message';
  if (['match', 'matches'].includes(t)) return 'match';
  if (t) return t;

  const blob = `${n?.title || ''} ${n?.message || ''}`.toLowerCase();

  if (blob.includes('subscribed') || blob.includes('subscription') || blob.includes('renew')) return 'subscription';
  if (blob.includes('mentioned') || blob.includes('mention')) return 'mention';
  if (blob.includes('tagged') || blob.includes('tag')) return 'tag';
  if (blob.includes('comment')) return 'comment';
  if (blob.includes('like')) return 'like';
  if (blob.includes('message')) return 'message';
  if (blob.includes('match')) return 'match';
  if (blob.includes('promo') || blob.includes('promotion') || blob.includes('offer')) return 'promotion';

  return 'system';
}

function _matchesFilter(n, filterLabel) {
  const label = String(filterLabel || 'All').trim().toLowerCase();
  if (!label || label === 'all') return true;

  const kind = _inferKind(n);

  // Exact UI labels from notifications.html
  if (label === 'tags') return kind === 'tag';
  if (label === 'mentions') return kind === 'mention';
  if (label === 'comments') return kind === 'comment';
  if (label === 'subscriptions') return kind === 'subscription';
  if (label === 'promotions') return kind === 'promotion';

  // Support other possible labels
  if (label.includes('system')) return kind === 'system';
  if (label.includes('match')) return kind === 'match';
  if (label.includes('message')) return kind === 'message';
  if (label.includes('like')) return kind === 'like';
  if (label.includes('comment')) return kind === 'comment';
  if (label.includes('tip')) return kind === 'tip';

  return kind === label;
}

async function _loadNotifications({ force = false } = {}) {
  const now = Date.now();
  if (_fetching) return;
  if (!force && _loaded && (now - _lastFetchAtMs) < _STALE_AFTER_MS) return;

  _fetching = true;
  try {
    const res = await apiGet('/api/me/notifications?limit=100');
    if (res && res.ok === true && Array.isArray(res.items)) {
      // Deduplicate by id (defensive)
      const seen = new Set();
      const items = [];
      for (const it of res.items) {
        const id = String(it?.id || '').trim();
        if (!id) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        items.push(it);
      }
      _allNotifs = _applyLocalReadState(items);
      _loaded = true;
      _lastFetchAtMs = now;
      return;
    }

    // Fallback to local placeholder array so UI doesn't break.
    const local = Array.isArray(NOTIFICATIONS_DATA) ? NOTIFICATIONS_DATA : [];
    _allNotifs = _applyLocalReadState(local);
    _loaded = true;
    _lastFetchAtMs = now;
  } catch (e) {
    console.warn('notifications fetch failed:', e);
    const local = Array.isArray(NOTIFICATIONS_DATA) ? NOTIFICATIONS_DATA : [];
    _allNotifs = _applyLocalReadState(local);
    _loaded = true;
    _lastFetchAtMs = now;
  } finally {
    _fetching = false;
  }
}

function _setContainerMode(container, mode) {
  if (!container) return;

  if (mode === 'list') {
    container.style.padding = '0';
    container.style.textAlign = 'left';
    container.style.display = 'block';
    container.style.flexDirection = '';
    container.style.alignItems = '';
    container.style.justifyContent = '';
    container.style.minHeight = '';
    return;
  }

  // empty/loading
  container.style.padding = '40px 20px';
  container.style.textAlign = 'center';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.minHeight = '50vh';
}

async function renderNotifications({ force = false } = {}) {
  const root = DOM.viewNotif || document.getElementById('view-notifications') || document;
  let container = root.querySelector('.notif-list');

  if (!container && root !== document) {
    container = document.createElement('div');
    container.className = 'notif-list';
    root.appendChild(container);
  }
  if (!container) return;

  // First paint: show a quick loading state
  if ((!_loaded || force) && container.childElementCount === 0) {
    _setContainerMode(container, 'empty');
    container.innerHTML = `
      <div style="text-align:center; color: var(--muted); opacity: 0.85;">
        <div class="subs-spinner" aria-hidden="true" style="margin: 0 auto; width: 22px; height: 22px;"></div>
        <div style="margin-top: 10px; font-weight: 700; font-size: 13px;">Loading notifications…</div>
      </div>
    `;
  }

  await _loadNotifications({ force });

  // Filter + search
  let filteredList = (_allNotifs || []).filter(n => _matchesFilter(n, currentFilter));
  if (currentSearch) {
    filteredList = filteredList.filter(n => {
      const blob = `${n?.title || ''} ${n?.message || ''}`.toLowerCase();
      return blob.includes(currentSearch);
    });
  }

  // EMPTY STATE
  if (!filteredList.length) {
    _setContainerMode(container, 'empty');
    container.innerHTML = `
      <i class="fa-regular fa-bell-slash" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.35;"></i>
      <p style="margin:0; color: var(--muted);">No notifications yet</p>
    `;
    return;
  }

  // LIST MODE
  _setContainerMode(container, 'list');
  container.innerHTML = '';

  filteredList.forEach(notif => {
    const div = document.createElement('div');
    div.className = 'notif-item';
    div.style.cssText = `
      display:flex;
      gap:15px;
      padding:14px 16px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      align-items:flex-start;
      cursor:pointer;
    `;

    const kind = _inferKind(notif);

    let icon = '<i class="fa-solid fa-bell" style="color:var(--text);"></i>';
    if (kind === 'like') icon = '<i class="fa-solid fa-heart" style="color:#ff4757;"></i>';
    else if (kind === 'comment') icon = '<i class="fa-solid fa-comment" style="color:#64E9EE;"></i>';
    else if (kind === 'message') icon = '<i class="fa-solid fa-envelope" style="color:var(--text);"></i>';
    else if (kind === 'match') icon = '<i class="fa-solid fa-user-group" style="color:var(--text);"></i>';
    else if (kind === 'tag') icon = '<i class="fa-solid fa-tag" style="color:#64E9EE;"></i>';
    else if (kind === 'mention') icon = '<i class="fa-solid fa-at" style="color:#64E9EE;"></i>';
    else if (kind === 'subscription') icon = '<i class="fa-solid fa-user-plus" style="color:#64E9EE;"></i>';
    else if (kind === 'promotion') icon = '<i class="fa-solid fa-bolt" style="color:gold;"></i>';
    else if (kind === 'tip') icon = '<i class="fa-solid fa-sack-dollar" style="color:gold;"></i>';

    const title = String(notif?.title || '').trim() || 'Notification';
    const message = String(notif?.message || '').trim();
    const when = _fmtRelativeTime(notif?.createdAtMs);
    const id = String(notif?.id || '').trim();
    const isUnread = !Number(notif?.readAtMs);

    div.style.opacity = isUnread ? '1' : '0.78';

    div.innerHTML = `
      <div style="position:relative; flex:0 0 auto;">
        <img src="${DEFAULT_AVATAR}" alt="" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
        <div style="position:absolute; bottom:-6px; right:-6px; background:var(--card-bg); border-radius:50%; padding:4px; border:1px solid rgba(255,255,255,0.08);">
          ${icon}
        </div>
      </div>

      <div style="flex:1; min-width:0;">
        <div style="font-size:0.9rem; color:var(--text); line-height:1.15;">
          <strong>${title}</strong>
        </div>
        ${message ? `<div style="font-size:0.85rem; color:var(--muted); margin-top:6px; line-height:1.25; word-wrap:break-word;">${message}</div>` : ''}
        <div style="font-size:0.8rem; color:var(--muted); margin-top:8px; display:flex; align-items:center; gap:8px;">
          <span>${when}</span>
          ${isUnread ? `<span title="Unread" style="width:7px; height:7px; border-radius:999px; background:#64E9EE; display:inline-block;"></span>` : ''}
        </div>
      </div>
    `;

    div.addEventListener('click', () => {
      if (id) _markLocalRead(id);

      // Update in-memory so it reflects immediately
      try {
        const idx = (_allNotifs || []).findIndex(x => String(x?.id || '') === id);
        if (idx >= 0 && !_allNotifs[idx].readAtMs) {
          _allNotifs[idx] = { ..._allNotifs[idx], readAtMs: Date.now() };
        }
      } catch {}

      const href = notif && notif.href ? String(notif.href) : '';
      if (href) {
        window.location.href = href;
        return;
      }
      // No href: just refresh UI to remove unread dot
      renderNotifications({ force: false });
    });

    container.appendChild(div);
  });
}

  return { initNotifications, refreshNotifications };
})();

// ===== message.js (bundled) =====
const __CreatorsMessages = (function() {
  const { DOM } = __CreatorsDOM;
  const { DEFAULT_AVATAR, getMessageThreads, getMessageThread, sendMessageTo, getMySubscriptions } = __CreatorsData;
  const { apiGet, apiPost } = __CreatorsApi;
  const { getCurrentUserEmail, readJSON, writeJSON } = __CreatorsSession;

// =============================================================
// Messages module (Creators)
// - Removed mock CHAT_DATA / MSG_USERS usage
// - Uses backend endpoints:
//   GET  /api/messages
//   GET  /api/messages/thread/:peer
//   POST /api/messages/send
// - Enriches peer display using /api/me/subscriptions (otherUser)
// =============================================================

let toastInstance = null;
let currentFilter = 'All';
let currentSearch = '';

let activePeerEmail = null;      // string
let activeChatUser = null;       // { id/email/name/handle/avatar/verified/... }

let __msgUsers = [];             // sidebar list
let __suggestUsers = [];         // new message overlay suggestions
let __peerProfileByEmail = new Map();

let __threadsPoll = null;
let __activeChatPoll = null;

const TM_TAGS_KEY = 'tm_chat_tags';
const TM_HIDDEN_KEY = 'tm_hidden_chats';
const TM_NOTES_KEY = 'tm_user_notes';
const TM_LAST_SEEN_KEY = 'tm_msg_last_seen_v1';
const TM_STARRED_KEY = 'tm_starred_chats';

// -------------------------------
// Server-backed Messages Meta (progressive enhancement)
// - Persists: starred, priority ($/$$/$$$), hidden, notes, lastSeenAt
// - Endpoint: GET/POST /api/me/messages/meta
// - Auto-fallback: per-user local cache + legacy localStorage keys
// -------------------------------

const TM_META_PREFIX = 'tm_msg_meta_';

let __tmMsgMeta = {
    loaded: false,
    serverOk: null,
    map: {} // peerEmail -> { starred, priority, hidden, note, lastSeenAt }
};

let __tmMsgMetaPending = new Set();
let __tmMsgMetaSaveTimer = null;

function __tmNormalizeKey(v) {
    return String(v || '').trim().toLowerCase();
}

function __tmMetaStorageKey() {
    const email = (typeof getCurrentUserEmail === 'function' ? getCurrentUserEmail() : '') || '';
    const e = __tmNormalizeKey(email) || 'anon';
    return `${TM_META_PREFIX}${e}`;
}

function __tmReadLegacyJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function __tmWriteLegacyJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore
    }
}

function __tmBuildMetaFromLegacy() {
    const tags = __tmReadLegacyJSON(TM_TAGS_KEY, {}) || {};
    const hidden = __tmReadLegacyJSON(TM_HIDDEN_KEY, []) || [];
    const notes = __tmReadLegacyJSON(TM_NOTES_KEY, {}) || {};
    const lastSeen = __tmReadLegacyJSON(TM_LAST_SEEN_KEY, {}) || {};
    const starred = __tmReadLegacyJSON(TM_STARRED_KEY, {}) || {};

    const peers = new Set([
        ...Object.keys(tags || {}),
        ...Object.keys(notes || {}),
        ...Object.keys(lastSeen || {}),
        ...Object.keys(starred || {}),
        ...(Array.isArray(hidden) ? hidden : [])
    ].map(__tmNormalizeKey).filter(Boolean));

    const map = {};
    peers.forEach((peer) => {
        const t = tags?.[peer];
        let priority = 0;
        if (t === 'paid') priority = 3;
        else if (t === 'priority') priority = 1;

        map[peer] = {
            starred: !!starred?.[peer],
            priority,
            hidden: Array.isArray(hidden) ? hidden.map(__tmNormalizeKey).includes(peer) : false,
            note: typeof notes?.[peer] === 'string' ? notes[peer] : '',
            lastSeenAt: typeof lastSeen?.[peer] === 'string' ? lastSeen[peer] : ''
        };
    });

    return map;
}

function __tmSyncLegacyFromMeta() {
    try {
        const tags = {};
        const notes = {};
        const lastSeen = {};
        const starred = {};
        const hidden = [];

        const map = (__tmMsgMeta.map && typeof __tmMsgMeta.map === 'object') ? __tmMsgMeta.map : {};
        for (const [k, m] of Object.entries(map)) {
            const peer = __tmNormalizeKey(k);
            if (!peer) continue;

            const pr = Number(m?.priority || 0);
            if (pr >= 3) tags[peer] = 'paid';
            else if (pr >= 1) tags[peer] = 'priority';

            if (m?.note) notes[peer] = String(m.note);
            if (m?.lastSeenAt) lastSeen[peer] = String(m.lastSeenAt);
            if (m?.starred) starred[peer] = true;
            if (m?.hidden) hidden.push(peer);
        }

        __tmWriteLegacyJSON(TM_TAGS_KEY, tags);
        __tmWriteLegacyJSON(TM_NOTES_KEY, notes);
        __tmWriteLegacyJSON(TM_LAST_SEEN_KEY, lastSeen);
        __tmWriteLegacyJSON(TM_STARRED_KEY, starred);
        __tmWriteLegacyJSON(TM_HIDDEN_KEY, hidden);
    } catch {
        // ignore
    }
}

async function __tmEnsureMetaLoaded() {
    if (__tmMsgMeta.loaded) return __tmMsgMeta.map;

    // 1) Try server (best)
    try {
        const res = await apiGet('/api/me/messages/meta');
        if (res && res.ok !== false) {
            const items = (res.items && typeof res.items === 'object') ? res.items
                : (res.meta && typeof res.meta === 'object') ? res.meta
                : (res.data && typeof res.data === 'object') ? res.data
                : null;

            if (items && typeof items === 'object') {
                __tmMsgMeta.map = items;
                __tmMsgMeta.serverOk = true;
                __tmMsgMeta.loaded = true;

                // cache locally (per-user)
                try { writeJSON(__tmMetaStorageKey(), __tmMsgMeta.map); } catch {}
                __tmSyncLegacyFromMeta();
                return __tmMsgMeta.map;
            }
        }

        // Missing route or explicit error
        if (res && res.ok === false && (String(res.status) === '404' || /not found/i.test(String(res.error || res.message || '')))) {
            __tmMsgMeta.serverOk = false;
        }
    } catch {
        // ignore
    }

    // 2) Per-user local cache
    try {
        const local = readJSON(__tmMetaStorageKey(), null);
        if (local && typeof local === 'object') {
            __tmMsgMeta.map = local;
            __tmMsgMeta.loaded = true;
            if (__tmMsgMeta.serverOk === null) __tmMsgMeta.serverOk = false;
            __tmSyncLegacyFromMeta();
            return __tmMsgMeta.map;
        }
    } catch {
        // ignore
    }

    // 3) Legacy keys (your current implementation)
    __tmMsgMeta.map = __tmBuildMetaFromLegacy();
    __tmMsgMeta.loaded = true;
    if (__tmMsgMeta.serverOk === null) __tmMsgMeta.serverOk = false;

    try { writeJSON(__tmMetaStorageKey(), __tmMsgMeta.map); } catch {}
    __tmSyncLegacyFromMeta();

    return __tmMsgMeta.map;
}

function __tmGetMeta(peerEmail) {
    const peer = __tmNormalizeKey(peerEmail);
    if (!peer) return {};
    const m = __tmMsgMeta.map?.[peer];
    return (m && typeof m === 'object') ? m : {};
}

function __tmSetMeta(peerEmail, patch) {
    const peer = __tmNormalizeKey(peerEmail);
    if (!peer) return;

    const prev = __tmGetMeta(peer);
    __tmMsgMeta.map[peer] = { ...prev, ...(patch || {}) };

    // keep caches in sync
    try { writeJSON(__tmMetaStorageKey(), __tmMsgMeta.map); } catch {}
    __tmSyncLegacyFromMeta();

    // schedule server write
    __tmSchedulePersistMeta(peer);
}

function __tmSchedulePersistMeta(peerEmail) {
    const peer = __tmNormalizeKey(peerEmail);
    if (!peer) return;

    __tmMsgMetaPending.add(peer);

    if (__tmMsgMetaSaveTimer) return;

    __tmMsgMetaSaveTimer = setTimeout(async () => {
        const keys = Array.from(__tmMsgMetaPending);
        __tmMsgMetaPending.clear();
        __tmMsgMetaSaveTimer = null;

        // Always refresh local cache
        try { writeJSON(__tmMetaStorageKey(), __tmMsgMeta.map); } catch {}

        // Best-effort server writes (per-thread)
        for (const k of keys) {
            try {
                const payload = { threadKey: k, meta: __tmGetMeta(k) };
                const r = await apiPost('/api/me/messages/meta', payload);
                if (r && r.ok !== false) __tmMsgMeta.serverOk = true;
                else __tmMsgMeta.serverOk = false;
            } catch {
                __tmMsgMeta.serverOk = false;
            }
        }
    }, 250);
}


// -------------------------------
// Local-only UX helpers (tags, delete, notes)
// -------------------------------
function getUserTags() {
    // Prefer server-backed meta (if already loaded), else legacy localStorage.
    const out = {};
    try {
        const map = (__tmMsgMeta.map && typeof __tmMsgMeta.map === 'object') ? __tmMsgMeta.map : null;
        if (map) {
            for (const [peerKey, m] of Object.entries(map)) {
                const peer = normalizeEmail(peerKey);
                if (!peer) continue;
                const pr = Number(m?.priority || 0);
                if (pr >= 3) out[peer] = 'paid';
                else if (pr >= 1) out[peer] = 'priority';
            }
            // If meta is loaded, return derived tags (even if empty).
            if (__tmMsgMeta.loaded) return out;
            if (Object.keys(out).length) return out;
        }
    } catch {
        // ignore
    }
    return JSON.parse(localStorage.getItem(TM_TAGS_KEY) || '{}');
}



function getHiddenSet() {
    const set = new Set();
    try {
        const map = (__tmMsgMeta.map && typeof __tmMsgMeta.map === 'object') ? __tmMsgMeta.map : null;
        if (map) {
            for (const [peerKey, m] of Object.entries(map)) {
                const peer = normalizeEmail(peerKey);
                if (!peer) continue;
                if (m?.hidden) set.add(peer);
            }
            // If meta is loaded, trust it (even if empty).
            if (__tmMsgMeta.loaded) return set;
            if (set.size) return set;
        }
    } catch {
        // ignore
    }

    // Legacy fallback
    try {
        const raw = localStorage.getItem(TM_HIDDEN_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr)) {
            arr.map(normalizeEmail).filter(Boolean).forEach(p => set.add(p));
        }
    } catch {
        // ignore
    }
    return set;
}


function getStarredMap() {
    const out = {};
    try {
        const map = (__tmMsgMeta.map && typeof __tmMsgMeta.map === 'object') ? __tmMsgMeta.map : null;
        if (map) {
            for (const [peerKey, m] of Object.entries(map)) {
                const peer = normalizeEmail(peerKey);
                if (!peer) continue;
                if (m?.starred) out[peer] = true;
            }
            if (__tmMsgMeta.loaded) return out;
            if (Object.keys(out).length) return out;
        }
    } catch {
        // ignore
    }
    try {
        const raw = localStorage.getItem(TM_STARRED_KEY);
        const v = raw ? JSON.parse(raw) : {};
        return (v && typeof v === 'object') ? v : {};
    } catch {
        return {};
    }
}


function isStarred(peerEmail) {
    const peer = normalizeEmail(peerEmail);
    if (!peer) return false;

    try {
        const m = __tmGetMeta(peer);
        if (m && typeof m === 'object' && typeof m.starred === 'boolean') return !!m.starred;
        if (m && typeof m === 'object' && m.starred) return true;
    } catch {
        // ignore
    }

    const map = getStarredMap();
    return !!map[peer];
}


function setStarred(peerEmail, starred) {
    const peer = normalizeEmail(peerEmail);
    if (!peer) return;

    // Ensure we have whatever meta exists before we overwrite.
    __tmEnsureMetaLoaded().catch(() => {});

    __tmSetMeta(peer, { starred: !!starred });
}


function syncStarIcon(peerEmail) {
    if (!DOM.btnChatStar) return;
    const starred = !!peerEmail && isStarred(peerEmail);

    DOM.btnChatStar.classList.remove('fa-solid', 'fa-regular');
    DOM.btnChatStar.classList.add(starred ? 'fa-solid' : 'fa-regular');
    DOM.btnChatStar.classList.add('fa-star');
    DOM.btnChatStar.title = starred ? 'Starred' : 'Star';
}

function setUserTag(userId, tag) {
    const peer = normalizeEmail(userId);
    if (!peer) return;

    __tmEnsureMetaLoaded().catch(() => {});

    const m = __tmGetMeta(peer);
    const cur = Number(m?.priority || 0);

    let next = cur;

    if (tag === 'priority') {
        // Toggle: if already priority (1-2), remove; else set to 1
        next = (cur >= 1 && cur < 3) ? 0 : 1;
    } else if (tag === 'paid') {
        // Toggle: if already paid (3), remove; else set to 3
        next = (cur >= 3) ? 0 : 3;
    } else {
        // Unknown tag => clear
        next = 0;
    }

    if (next === 0) {
        toastInstance?.fire?.({ icon: 'success', title: 'Tag removed' });
    } else {
        toastInstance?.fire?.({ icon: 'success', title: `Tagged as ${String(tag).toUpperCase()}` });
    }

    __tmSetMeta(peer, { priority: next });

    renderMessageList();
}


function deleteConversation(userId) {
    // UI-only hide. (Backend delete not implemented yet.)
    const peer = normalizeEmail(userId);
    if (!peer) return;

    __tmEnsureMetaLoaded().catch(() => {});
    __tmSetMeta(peer, { hidden: true });

    // If deleting active chat, reset chat UI.
    if (activePeerEmail && peer === activePeerEmail) {
        activePeerEmail = null;
        activeChatUser = null;
        lockChatInputs();
        if (DOM.chatHistoryContainer) DOM.chatHistoryContainer.innerHTML = '';
        if (DOM.activeChatName) DOM.activeChatName.textContent = 'Messages';
        if (DOM.activeChatAvatar) DOM.activeChatAvatar.src = DEFAULT_AVATAR;
        if (DOM.chatSearchInput) DOM.chatSearchInput.value = '';
        syncStarIcon(null);
    }

    // Refresh list immediately
    renderMessageList();

    // Keep legacy UX feedback
    toastInstance?.fire?.({ icon: 'success', title: 'Conversation deleted' });
}


function getLastSeenMap() {
    const out = {};
    try {
        const map = (__tmMsgMeta.map && typeof __tmMsgMeta.map === 'object') ? __tmMsgMeta.map : null;
        if (map) {
            for (const [peerKey, m] of Object.entries(map)) {
                const peer = normalizeEmail(peerKey);
                if (!peer) continue;
                if (m?.lastSeenAt) out[peer] = String(m.lastSeenAt);
            }
            if (__tmMsgMeta.loaded) return out;
            if (Object.keys(out).length) return out;
        }
    } catch {
        // ignore
    }

    try {
        const raw = localStorage.getItem(TM_LAST_SEEN_KEY);
        const v = raw ? JSON.parse(raw) : {};
        return (v && typeof v === 'object') ? v : {};
    } catch {
        return {};
    }
}


function setLastSeen(peerEmail, iso) {
    const peer = normalizeEmail(peerEmail);
    if (!peer) return;

    __tmEnsureMetaLoaded().catch(() => {});

    __tmSetMeta(peer, { lastSeenAt: String(iso || new Date().toISOString()) });
}


// -------------------------------
// Formatting helpers
// -------------------------------
function safeStr(v) {
    return (v === null || v === undefined) ? '' : String(v);
}

function normalizeEmail(v) {
    return safeStr(v).trim().toLowerCase();
}

function deriveHandle(email) {
    const e = normalizeEmail(email);
    if (!e) return '@user';
    const beforeAt = e.split('@')[0] || 'user';
    return '@' + beforeAt.replace(/[^a-z0-9_\.]/gi, '').slice(0, 24);
}

function deriveName(email) {
    const e = normalizeEmail(email);
    if (!e) return 'User';
    const beforeAt = e.split('@')[0] || 'user';
    // human-ish name: split by dot/underscore
    const parts = beforeAt
        .replace(/[^a-z0-9_\.]/gi, '')
        .split(/[\._]/)
        .filter(Boolean)
        .slice(0, 3)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1));
    return parts.length ? parts.join(' ') : 'User';
}

function formatTimeShort(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    try {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function formatListTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();

    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) return formatTimeShort(iso);

    try {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

// -------------------------------
// Data loading (API)
// -------------------------------
async function buildPeerProfileMap() {
    // Reuse subscriptions endpoint because it already returns otherUser (name, handle, avatar, verified)
    // We will use it to enrich chat list + suggestions.
    const map = new Map();
    try {
        const res = await getMySubscriptions();
        const sub = res?.subscribed?.items || [];
        const fans = res?.subscribers?.items || [];
        const items = [...sub, ...fans];

        for (const it of items) {
            const otherEmail = normalizeEmail(it?.otherEmail);
            if (!otherEmail) continue;
            const u = it?.otherUser || {};
            map.set(otherEmail, {
                email: otherEmail,
                name: safeStr(u.name) || deriveName(otherEmail),
                handle: safeStr(u.handle) || deriveHandle(otherEmail),
                avatarUrl: safeStr(u.avatarUrl) || DEFAULT_AVATAR,
                verified: !!u.verified
            });
        }
    } catch (e) {
        // Non-fatal: message list will fallback to derived names.
    }
    return map;
}

function computeUnread(peerEmail, lastMessage) {
    const peer = normalizeEmail(peerEmail);
    const last = lastMessage || null;
    if (!peer || !last || !last.sentAt) return 0;

    // Only consider unread if last message is from peer.
    const from = normalizeEmail(last.from);
    if (from !== peer) return 0;

    // Prefer server-backed meta lastSeenAt, fallback to legacy map.
    let seenIso = '';
    try {
        const m = __tmGetMeta(peer);
        if (m && typeof m === 'object' && m.lastSeenAt) seenIso = String(m.lastSeenAt);
    } catch {
        // ignore
    }
    if (!seenIso) {
        const seenMap = getLastSeenMap();
        seenIso = seenMap[peer] || '';
    }

    if (!seenIso) return 1;

    const lastMs = new Date(last.sentAt).getTime();
    const seenMs = new Date(seenIso).getTime();
    if (!Number.isFinite(lastMs) || !Number.isFinite(seenMs)) return 1;
    return lastMs > seenMs ? 1 : 0;
}


function peerToUser(peerEmail, threadInfo) {
    const peer = normalizeEmail(peerEmail);
    const prof = __peerProfileByEmail.get(peer) || null;

    const name = safeStr(prof?.name) || deriveName(peer);
    const handle = safeStr(prof?.handle) || deriveHandle(peer);
    const avatar = safeStr(prof?.avatarUrl) || DEFAULT_AVATAR;
    const verified = !!prof?.verified;

    const last = threadInfo?.lastMessage || null;
    const preview = safeStr(last?.text) || 'Say hi…';
    const time = last?.sentAt ? formatListTime(last.sentAt) : '';
    const unread = computeUnread(peer, last);

    return {
        id: peer,
        email: peer,
        name,
        handle,
        avatar,
        verified,
        preview,
        time,
        unread
    };
}

async function refreshThreads({ silent = false } = {}) {
    try {
        // Load server-backed meta first so unread/star/priority/hidden are consistent across devices.
        await __tmEnsureMetaLoaded();
        // Profiles first (best-effort)
        __peerProfileByEmail = await buildPeerProfileMap();

        const res = await getMessageThreads();
        const threads = Array.isArray(res?.threads) ? res.threads : [];

        __msgUsers = threads.map(t => peerToUser(t.peerEmail, t));

        // Build suggestions: union of peers from threads + peers from subscriptions
        const sugMap = new Map();
        for (const u of __msgUsers) sugMap.set(u.email, u);
        for (const [email, prof] of __peerProfileByEmail.entries()) {
            if (!sugMap.has(email)) {
                sugMap.set(email, {
                    id: email,
                    email,
                    name: prof.name,
                    handle: prof.handle,
                    avatar: prof.avatarUrl || DEFAULT_AVATAR,
                    verified: !!prof.verified,
                    preview: '',
                    time: '',
                    unread: 0
                });
            }
        }
        __suggestUsers = Array.from(sugMap.values());

        renderMessageList();

        // Auto-select first thread if none selected.
        if (!activePeerEmail && __msgUsers.length) {
            activePeerEmail = __msgUsers[0].email;
            activeChatUser = __msgUsers[0];
            await openChatWithUser(activePeerEmail);
        } else if (activePeerEmail) {
            // Keep header in sync (if profile data updated)
            const latest = __msgUsers.find(x => x.email === activePeerEmail) || __suggestUsers.find(x => x.email === activePeerEmail) || null;
            if (latest) {
                activeChatUser = latest;
                updateHeaderInfo(activePeerEmail);
            }
        }

        if (!silent) {
            // Optional place to show plan/usage in UI later
        }

        return true;
    } catch (e) {
        if (!silent) {
            toastInstance?.fire?.({ icon: 'error', title: e?.message || 'Unable to load messages' });
        }
        // Still render list (maybe empty)
        renderMessageList();
        return false;
    }
}

// -------------------------------
// UI rendering
// -------------------------------
function renderMessageList() {
    if (!DOM.msgUserList) return;

    const hiddenSet = getHiddenSet();
    const tags = getUserTags();

    let list = Array.isArray(__msgUsers) ? __msgUsers.slice() : [];

    // Remove hidden
    list = list.filter(u => !hiddenSet.has(u.id));

    // Apply tab filter
    if (currentFilter === 'Unread') list = list.filter(u => (u.unread || 0) > 0);
    else if (currentFilter === 'Priority') list = list.filter(u => tags[u.id] === 'priority');
    else if (currentFilter === '$$$') list = list.filter(u => tags[u.id] === 'paid');

    // Apply search
    if (currentSearch) {
        const s = currentSearch.toLowerCase();
        list = list.filter(u => (u.name || '').toLowerCase().includes(s) || (u.handle || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s));
    }

    // Render
    DOM.msgUserList.innerHTML = '';

    if (!list.length) {
        const empty = document.createElement('div');
        empty.className = 'rs-col-empty';
        empty.style.marginTop = '50px';
        empty.innerHTML = `
            <div class="empty-icon-wrap"><i class="fa-regular fa-comments"></i></div>
            <span>No conversations yet</span>
        `;
        DOM.msgUserList.appendChild(empty);
        return;
    }

    list.forEach(user => {
        const tag = tags[user.id];
        const div = document.createElement('div');
        div.className = 'msg-user-item';
        div.dataset.id = user.id;

        if (activePeerEmail && user.id === activePeerEmail) div.classList.add('active');

        div.innerHTML = `
            <img src="${user.avatar || DEFAULT_AVATAR}" class="msg-avatar" alt="Avatar">
            <div class="msg-user-details">
                <div class="msg-user-top">
                    <span class="msg-name">${user.name || 'User'} ${user.verified ? '<i class="fa-solid fa-circle-check verified"></i>' : ''}</span>
                    <span class="msg-time">${user.time || ''}</span>
                </div>
                <div class="msg-preview">${user.preview || ''}</div>
            </div>
            <div class="msg-indicators">
                ${tag === 'priority' ? '<span class="tag priority">Priority</span>' : ''}
                ${tag === 'paid' ? '<span class="tag paid">$$$</span>' : ''}
                ${(user.unread || 0) > 0 ? '<span class="unread-dot"></span>' : ''}
            </div>
        `;

        // Click to open
        div.addEventListener('click', () => {
            openChatWithUser(user.id);
        });

        // Right-click / context menu actions (desktop)
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showChatActionsMenu(user);
        });

        DOM.msgUserList.appendChild(div);
    });
}

function showChatActionsMenu(user) {
    // Use SweetAlert2 as action sheet
    if (typeof Swal === 'undefined') return;

    Swal.fire({
        title: user?.name || 'Conversation',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Priority',
        denyButtonText: '$$$',
        cancelButtonText: 'More',
        background: '#0b1220',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            setUserTag(user.id, 'priority');
        } else if (result.isDenied) {
            setUserTag(user.id, 'paid');
        } else {
            // More actions
            Swal.fire({
                title: 'Actions',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Delete chat',
                denyButtonText: 'View profile',
                cancelButtonText: 'Close',
                background: '#0b1220',
                color: '#fff'
            }).then((r2) => {
                if (r2.isConfirmed) deleteConversation(user.id);
                else if (r2.isDenied) {
                    // IMPORTANT: Do not overwrite Creator's own Profile view.
                    toastInstance?.fire?.({ icon: 'info', title: 'Profile view coming soon' });
                }
            });
        }
    });
}

// -------------------------------
// Chat loading + rendering
// -------------------------------
async function openChatWithUser(peerEmail) {
    const peer = normalizeEmail(peerEmail);
    if (!peer) return;

    activePeerEmail = peer;
    activeChatUser = __msgUsers.find(u => u.email === peer) || __suggestUsers.find(u => u.email === peer) || peerToUser(peer, null);

    // Update active state in list
    renderMessageList();

    updateHeaderInfo(peer);
    loadUserNote(peer);
    unlockChatInputs();

    // Mobile UX: reveal chat panel
    try {
        if (window.innerWidth <= 768) document.body.classList.add('chat-open');
    } catch {}

    await loadChat(peer);

    // Poll active thread for new messages while messages view is open.
    startActiveChatPolling();
}

async function loadChat(peerEmail) {
    const peer = normalizeEmail(peerEmail);
    if (!peer || !DOM.chatHistoryContainer) return;

    try {
        const res = await getMessageThread(peer);
        const messages = Array.isArray(res?.messages) ? res.messages : [];

        DOM.chatHistoryContainer.innerHTML = '';

        for (const m of messages) {
            const from = normalizeEmail(m?.from);
            const isReceived = from === peer;
            createMessageBubble(safeStr(m?.text), isReceived ? 'received' : 'sent', m?.sentAt);
        }

        // mark seen locally
        const lastMsg = messages.length ? messages[messages.length - 1] : null;
        const lastIso = safeStr(lastMsg?.sentAt) || new Date().toISOString();
        setLastSeen(peer, lastIso);

        // clear unread dot locally
        const u = __msgUsers.find(x => x.email === peer);
        if (u) u.unread = 0;
        renderMessageList();

        // Scroll to bottom
        DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
    } catch (e) {
        toastInstance?.fire?.({ icon: 'error', title: e?.message || 'Unable to load chat' });
    }
}

function createMessageBubble(text, type, sentAtIso) {
    if (!DOM.chatHistoryContainer) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;

    const time = sentAtIso ? formatTimeShort(sentAtIso) : formatTimeShort(new Date().toISOString());

    bubble.innerHTML = `
        <div class="bubble-text">${escapeHtml(text)}</div>
        <div class="bubble-meta">${time}</div>
    `;

    DOM.chatHistoryContainer.appendChild(bubble);
}

function escapeHtml(s) {
    return safeStr(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateHeaderInfo(peerEmail) {
    const peer = normalizeEmail(peerEmail);
    const user = activeChatUser || __msgUsers.find(u => u.email === peer) || null;
    if (!user) return;

    if (DOM.activeChatAvatar) DOM.activeChatAvatar.src = user.avatar || DEFAULT_AVATAR;
    if (DOM.activeChatName) DOM.activeChatName.textContent = user.name || 'User';

    // Info panel
    if (DOM.infoNickname) DOM.infoNickname.textContent = user.name || 'User';
    if (DOM.infoHandle) DOM.infoHandle.textContent = user.handle || deriveHandle(peer);

    // Joined / spent placeholders (backend not wired here yet)
    if (DOM.infoJoined) DOM.infoJoined.textContent = DOM.infoJoined.textContent || '—';
    if (DOM.infoSpent) DOM.infoSpent.textContent = DOM.infoSpent.textContent || '—';

    syncStarIcon(peer);
}


function setHeaderActionsEnabled(enabled) {
    const view = DOM.viewMessages || document.getElementById('view-messages');
    const actions = view ? view.querySelector('.ch-actions') : document.querySelector('#view-messages .ch-actions');

    if (actions) {
        actions.style.opacity = enabled ? '1' : '0.3';
        actions.style.pointerEvents = enabled ? 'auto' : 'none';
        actions.querySelectorAll('i').forEach(icon => {
            icon.style.cursor = enabled ? 'pointer' : 'default';
            icon.style.pointerEvents = enabled ? 'auto' : 'none';
        });
    }

    if (DOM.activeChatAvatar) DOM.activeChatAvatar.style.opacity = enabled ? '1' : '0.5';
    if (DOM.activeChatName) DOM.activeChatName.style.color = enabled ? 'var(--text)' : 'var(--muted)';

    // Bottom controls (mobile + desktop)
    ['btn-chat-media-bottom', 'btn-emoji-trigger', 'btn-ppv-trigger', 'btn-send-message'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.opacity = enabled ? '1' : '0.3';
        el.style.pointerEvents = enabled ? 'auto' : 'none';
        el.style.cursor = enabled ? 'pointer' : 'default';
    });
}

function lockChatInputs() {
    if (DOM.chatInput) DOM.chatInput.disabled = true;
    if (DOM.btnSendMsg) DOM.btnSendMsg.disabled = true;
    setHeaderActionsEnabled(false);
}

function unlockChatInputs() {
    if (DOM.chatInput) DOM.chatInput.disabled = false;
    if (DOM.btnSendMsg) DOM.btnSendMsg.disabled = false;
    setHeaderActionsEnabled(true);
}

// -------------------------------
// Notes
// -------------------------------
function loadUserNote(userId) {
    const peer = normalizeEmail(userId);
    if (!peer) return;

    const noteInput = document.getElementById('chat-user-note') || document.getElementById('user-note-input');
    if (!noteInput) return;

    // Prefer meta note, fallback to legacy notes.
    let note = '';
    try {
        const m = __tmGetMeta(peer);
        if (typeof m?.note === 'string') note = m.note;
    } catch {
        // ignore
    }
    if (!note) {
        try {
            const notes = JSON.parse(localStorage.getItem(TM_NOTES_KEY) || '{}');
            note = notes?.[peer] || '';
        } catch {
            note = '';
        }
    }

    noteInput.value = note;

    __tmEnsureMetaLoaded().catch(() => {});

    let t = null;
    noteInput.oninput = () => {
        const val = String(noteInput.value || '');
        if (t) clearTimeout(t);
        t = setTimeout(() => {
            __tmSetMeta(peer, { note: val });
        }, 180);
    };
}


// -------------------------------
// Search UI (left) + chat search
// -------------------------------
function initSearchUI() {
    if (DOM.btnTriggerSearch && DOM.msgSearchBox && DOM.msgSearchInput) {
        DOM.btnTriggerSearch.addEventListener('click', () => {
            DOM.msgSearchBox.classList.remove('hidden');
            DOM.msgSearchInput.focus();
        });
    }

    if (DOM.btnCloseSearch && DOM.msgSearchBox && DOM.msgSearchInput) {
        DOM.btnCloseSearch.addEventListener('click', () => {
            DOM.msgSearchBox.classList.add('hidden');
            DOM.msgSearchInput.value = '';
            currentSearch = '';
            renderMessageList();
        });
    }

    if (DOM.msgSearchInput) {
        DOM.msgSearchInput.addEventListener('input', () => {
            currentSearch = DOM.msgSearchInput.value.trim();
            renderMessageList();
        });
    }


    // Inner chat search (search within rendered bubbles)
    if (DOM.btnChatSearch) {
        DOM.btnChatSearch.addEventListener('click', async () => {
            if (!activePeerEmail) {
                toastInstance?.fire?.({ icon: 'info', title: 'Select a conversation' });
                return;
            }

            // If the HTML provides an inline search bar, use it.
            if (DOM.chatSearchBar && DOM.chatSearchInput) {
                DOM.chatSearchBar.classList.toggle('hidden');
                if (!DOM.chatSearchBar.classList.contains('hidden')) DOM.chatSearchInput.focus();
                return;
            }

            // Fallback: prompt search query.
            let q = '';
            if (typeof Swal !== 'undefined' && Swal?.fire) {
                const r = await Swal.fire({
                    title: 'Search in chat',
                    input: 'text',
                    inputPlaceholder: 'Type a keyword…',
                    showCancelButton: true,
                    confirmButtonText: 'Search',
                    background: '#0b1220',
                    color: '#fff'
                });
                if (!r.isConfirmed) return;
                q = String(r.value || '').trim().toLowerCase();
            } else {
                q = String(window.prompt('Search in chat:') || '').trim().toLowerCase();
            }

            highlightChatSearch(q);
        });
    }

    if (DOM.closeChatSearch && DOM.chatSearchBar && DOM.chatSearchInput) {
        DOM.closeChatSearch.addEventListener('click', () => {
            DOM.chatSearchBar.classList.add('hidden');
            DOM.chatSearchInput.value = '';
            clearChatHighlights();
        });
    }

    if (DOM.chatSearchInput) {
        DOM.chatSearchInput.addEventListener('input', () => {
            const q = DOM.chatSearchInput.value.trim().toLowerCase();
            highlightChatSearch(q);
        });
    }
}

function clearChatHighlights() {
    const bubbles = DOM.chatHistoryContainer ? DOM.chatHistoryContainer.querySelectorAll('.chat-bubble .bubble-text') : [];
    bubbles.forEach(b => {
        const raw = b.getAttribute('data-raw');
        if (raw !== null) b.innerHTML = escapeHtml(raw);
    });
}

function highlightChatSearch(q) {
    if (!DOM.chatHistoryContainer) return;
    const bubbles = DOM.chatHistoryContainer.querySelectorAll('.chat-bubble .bubble-text');

    bubbles.forEach(b => {
        const raw = b.getAttribute('data-raw') ?? b.textContent;
        if (!b.getAttribute('data-raw')) b.setAttribute('data-raw', raw);

        if (!q) {
            b.innerHTML = escapeHtml(raw);
            return;
        }

        const idx = raw.toLowerCase().indexOf(q);
        if (idx === -1) {
            b.innerHTML = escapeHtml(raw);
            return;
        }

        const before = escapeHtml(raw.slice(0, idx));
        const match = escapeHtml(raw.slice(idx, idx + q.length));
        const after = escapeHtml(raw.slice(idx + q.length));
        b.innerHTML = `${before}<mark>${match}</mark>${after}`;
    });
}

// -------------------------------
// Tabs (All / Unread / Priority / $$$)
// -------------------------------
function initTabs() {
    if (!DOM.msgTabs || !DOM.msgTabs.length) return;

    DOM.msgTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            DOM.msgTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.textContent.trim();
            renderMessageList();
        });
    });
}

// -------------------------------
// New message overlay
// -------------------------------
function initNewMessageOverlay() {
    if (DOM.btnNewMsg) {
        DOM.btnNewMsg.addEventListener('click', () => {
            if (!DOM.newMsgOverlay) return;
            DOM.newMsgOverlay.classList.remove('hidden');
            renderNewMessageSuggestions();
            if (DOM.newMsgInput) DOM.newMsgInput.focus();
        });
    }

    if (DOM.btnCloseNewMsg) {
        DOM.btnCloseNewMsg.addEventListener('click', () => {
            if (!DOM.newMsgOverlay) return;
            DOM.newMsgOverlay.classList.add('hidden');
        });
    }

    if (DOM.newMsgInput) {
        DOM.newMsgInput.addEventListener('input', () => {
            renderNewMessageSuggestions(DOM.newMsgInput.value);
        });

        DOM.newMsgInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const raw = (DOM.newMsgInput.value || '').trim();
                if (!raw) return;

                // If user typed @handle, treat as email-like key (we still store as string)
                const candidate = raw.startsWith('@') ? raw.slice(1) : raw;
                const peer = normalizeEmail(candidate.includes('@') ? candidate : `${candidate}@example.com`);

                // Close overlay + open
                DOM.newMsgOverlay.classList.add('hidden');
                openChatWithUser(peer);
                DOM.newMsgInput.value = '';
            }
        });
    }

    function renderNewMessageSuggestions(query = '') {
        if (!DOM.newMsgResults) return;

        const q = String(query || '').trim().toLowerCase();
        const list = Array.isArray(__suggestUsers) ? __suggestUsers.slice() : [];

        const filtered = q
            ? list.filter(u => (u.name || '').toLowerCase().includes(q) || (u.handle || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
            : list;

        DOM.newMsgResults.innerHTML = '';

        if (!filtered.length) {
            const empty = document.createElement('div');
            empty.className = 'rs-col-empty';
            empty.style.marginTop = '10px';
            empty.innerHTML = `
                <div class="empty-icon-wrap"><i class="fa-regular fa-user"></i></div>
                <span>No results</span>
            `;
            DOM.newMsgResults.appendChild(empty);
            return;
        }

        filtered.slice(0, 30).forEach(user => {
            const div = document.createElement('div');
            div.className = 'msg-user-item';
            div.dataset.id = user.id;
            div.innerHTML = `
                <img src="${user.avatar || DEFAULT_AVATAR}" class="msg-avatar" alt="Avatar">
                <div class="msg-user-details">
                    <div class="msg-user-top">
                        <span class="msg-name">${user.name || 'User'} ${user.verified ? '<i class="fa-solid fa-circle-check verified"></i>' : ''}</span>
                    </div>
                    <div class="msg-preview">${user.handle || deriveHandle(user.email)}</div>
                </div>
            `;

            div.addEventListener('click', () => {
                DOM.newMsgOverlay.classList.add('hidden');
                openChatWithUser(user.email);
                if (DOM.newMsgInput) DOM.newMsgInput.value = '';
            });

            DOM.newMsgResults.appendChild(div);
        });
    }
}

// -------------------------------
// Sending messages
// -------------------------------
function initSendMessage() {
    if (DOM.btnSendMsg) {
        DOM.btnSendMsg.addEventListener('click', onSend);
    }

    if (DOM.chatInput) {
        DOM.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
            }
        });
    }

    async function onSend() {
        if (!activePeerEmail) {
            toastInstance?.fire?.({ icon: 'info', title: 'Select a conversation' });
            return;
        }

        const raw = DOM.chatInput ? DOM.chatInput.value : '';
        const text = String(raw || '').trim();
        if (!text) return;

        try {
            // Optimistic: disable briefly
            if (DOM.btnSendMsg) DOM.btnSendMsg.disabled = true;

            const res = await sendMessageTo(activePeerEmail, text);
            const msg = res?.message || { text, sentAt: new Date().toISOString() };

            createMessageBubble(text, 'sent', msg.sentAt);
            if (DOM.chatInput) DOM.chatInput.value = '';
            DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;

            // Update preview/time in list
            const u = __msgUsers.find(x => x.email === activePeerEmail);
            if (u) {
                u.preview = text;
                u.time = formatListTime(msg.sentAt);
            }
            renderMessageList();

        } catch (e) {
            if (String(e?.message || '').includes('daily_message_limit_reached')) {
                toastInstance?.fire?.({ icon: 'error', title: 'Daily message limit reached' });
            } else {
                toastInstance?.fire?.({ icon: 'error', title: e?.message || 'Unable to send message' });
            }
        } finally {
            if (DOM.btnSendMsg) DOM.btnSendMsg.disabled = false;
        }
    }
}

// -------------------------------
// Emoji picker
// -------------------------------
function initEmojiPicker() {
    if (!DOM.btnEmoji || !DOM.emojiContainer || !DOM.chatInput) return;

    let picker = null;
    try {
        if (window?.picmo?.createPicker) {
            picker = window.picmo.createPicker({ rootElement: DOM.emojiContainer });
            picker.addEventListener('emoji:select', (event) => {
                const emoji = event?.emoji || '';
                if (!emoji) return;
                const el = DOM.chatInput;
                const start = el.selectionStart || el.value.length;
                const end = el.selectionEnd || el.value.length;
                el.value = el.value.slice(0, start) + emoji + el.value.slice(end);
                el.focus();
                const pos = start + emoji.length;
                el.setSelectionRange(pos, pos);
            });
        }
    } catch (e) {
        // ignore
    }

    DOM.btnEmoji.addEventListener('click', () => {
        DOM.emojiContainer.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        const inPicker = DOM.emojiContainer.contains(e.target);
        const inBtn = DOM.btnEmoji.contains(e.target);
        if (!inPicker && !inBtn) {
            DOM.emojiContainer.classList.add('hidden');
        }
    });
}

// -------------------------------
// PPV button (stub)
// -------------------------------
function initPPV() {
    if (!DOM.btnPPV) return;
    DOM.btnPPV.addEventListener('click', () => {
        toastInstance?.fire?.({ icon: 'info', title: 'PPV coming soon' });
    });
}

// -------------------------------
// Star conversation (local-only stub)
// -------------------------------
function initStar() {
    if (!DOM.btnChatStar) return;

    // Keep icon correct on load
    syncStarIcon(activePeerEmail);

    DOM.btnChatStar.addEventListener('click', () => {
        if (!activePeerEmail) {
            toastInstance?.fire?.({ icon: 'info', title: 'Select a conversation' });
            return;
        }

        const now = !isStarred(activePeerEmail);
        setStarred(activePeerEmail, now);
        syncStarIcon(activePeerEmail);

        toastInstance?.fire?.({ icon: 'success', title: now ? 'Starred' : 'Unstarred' });
    });
}

function initMediaGallery() {
    const btnTop = document.getElementById('btn-chat-media-top');
    const btnBottom = document.getElementById('btn-chat-media-bottom');

    const open = async () => {
        if (!activePeerEmail) {
            toastInstance?.fire?.({ icon: 'info', title: 'Select a conversation' });
            return;
        }

        const title = (activeChatUser?.name ? `${activeChatUser.name} • Media` : 'Chat media');

        // Backend media threads not implemented yet.
        const html = `
            <div style="text-align:left; line-height:1.4;">
                <div style="font-weight:600; margin-bottom:6px;">No shared media yet</div>
                <div style="color:rgba(255,255,255,0.75); font-size:13px;">
                    When you start sending images, they’ll show up here.
                </div>
            </div>
        `;

        if (typeof Swal !== 'undefined' && Swal?.fire) {
            await Swal.fire({
                title,
                html,
                showCancelButton: false,
                confirmButtonText: 'Close',
                background: '#0b1220',
                color: '#fff'
            });
        } else {
            window.alert('No shared media yet.');
        }
    };

    if (btnTop) btnTop.addEventListener('click', open);
    if (btnBottom) btnBottom.addEventListener('click', open);
}

// -------------------------------
// Mobile input teleport (kept)
// -------------------------------
function teleportInputToBody() {
    const inputWrap = document.getElementById('chat-input-wrapper');
    if (!inputWrap) return;
    if (inputWrap.parentElement === document.body) return;

    inputWrap.dataset.originalParent = 'chat-bottom-wrapper';
    document.body.appendChild(inputWrap);
    inputWrap.classList.add('floating-chat-input');
}

function restoreInputToChat() {
    const inputWrap = document.getElementById('chat-input-wrapper');
    const originalParent = document.getElementById('chat-bottom-wrapper');
    if (!inputWrap || !originalParent) return;
    if (inputWrap.parentElement === originalParent) return;

    inputWrap.classList.remove('floating-chat-input');
    originalParent.appendChild(inputWrap);
}

function initMobileChatObservers() {
    const view = DOM.viewMessages;
    if (!view) return;

    const observer = new MutationObserver(() => {
        const isMobile = window.innerWidth <= 768;
        const viewVisible = getComputedStyle(view).display !== 'none';
        if (!isMobile || !viewVisible) {
            restoreInputToChat();
            return;
        }

        const chatOpen = document.body.classList.contains('chat-open');
        if (chatOpen) teleportInputToBody();
        else restoreInputToChat();
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', () => observer.takeRecords());
}

function initMobileBackBtn() {
    const backBtn = document.getElementById('btn-mobile-chat-back');
    if (!backBtn) return;

    backBtn.addEventListener('click', () => {
        document.body.classList.remove('chat-open');
        restoreInputToChat();
    });
}

// -------------------------------
// Polling
// -------------------------------
function startThreadsPolling() {
    if (__threadsPoll) return;
    __threadsPoll = setInterval(() => {
        // Silent refresh to keep UI in sync
        refreshThreads({ silent: true });
    }, 15000);
}

function stopThreadsPolling() {
    if (__threadsPoll) {
        clearInterval(__threadsPoll);
        __threadsPoll = null;
    }
}

function startActiveChatPolling() {
    // Poll only when active chat exists
    if (!activePeerEmail) return;

    if (__activeChatPoll) return;
    __activeChatPoll = setInterval(async () => {
        // Only if Messages view is visible
        const view = DOM.viewMessages;
        if (!view || getComputedStyle(view).display === 'none') return;
        if (!activePeerEmail) return;

        // Fetch thread and append only new messages
        try {
            const res = await getMessageThread(activePeerEmail);
            const messages = Array.isArray(res?.messages) ? res.messages : [];

            // Determine last rendered sentAt (best-effort)
            const lastBubble = DOM.chatHistoryContainer?.lastElementChild;
            const lastRendered = lastBubble?.querySelector('.bubble-meta')?.textContent || '';

            // If we can't diff reliably, just re-render when count changes
            const currentCount = DOM.chatHistoryContainer ? DOM.chatHistoryContainer.querySelectorAll('.chat-bubble').length : 0;
            if (messages.length !== currentCount) {
                await loadChat(activePeerEmail);

                // Keep scroll near bottom
                if (DOM.chatHistoryContainer) {
                    const atBottom = (DOM.chatHistoryContainer.scrollHeight - DOM.chatHistoryContainer.scrollTop - DOM.chatHistoryContainer.clientHeight) < 120;
                    if (atBottom) DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
                }
            } else {
                // No-op
                void lastRendered;
            }
        } catch {
            // silent
        }
    }, 6000);
}

function stopActiveChatPolling() {
    if (__activeChatPoll) {
        clearInterval(__activeChatPoll);
        __activeChatPoll = null;
    }
}

// -------------------------------
// Exported initializer
// -------------------------------
 function initMessages(TopToast) {
    toastInstance = TopToast;

    // If messages view hasn't been loaded, bail safely.
    if (!DOM.viewMessages) return;

    // Start locked until a chat is chosen
    lockChatInputs();

    // Preload message meta (server-backed if available; local fallback)
    __tmEnsureMetaLoaded().catch(() => {});

    // UI init
    initTabs();
    initSearchUI();
    initNewMessageOverlay();
    initSendMessage();
    initEmojiPicker();
    initPPV();
    initStar();
    initMediaGallery();
    initMobileBackBtn();
    initMobileChatObservers();

    // Initial load
    const __tmAfterInitialLoad = async () => {
        try {
            const pending = localStorage.getItem('tm_open_chat_peer');
            if (pending) {
                localStorage.removeItem('tm_open_chat_peer');
                await openChatWithUser(pending);
            }
        } catch (_) { /* ignore */ }
    };

    refreshThreads({ silent: false })
        .then(() => __tmAfterInitialLoad())
        .catch(() => { /* ignore */ });

    // Bridge: allow other views to open a chat safely.
    // Example: Subscriptions list → Messages view → open peer thread.
    window.__tmMessagesOpenPeer = async (peerEmail) => {
        try {
            const peer = normalizeEmail(peerEmail);
            if (!peer) return false;
            await refreshThreads({ silent: true });
            await openChatWithUser(peer);
            return true;
        } catch (e) {
            toastInstance?.fire?.({ icon: 'error', title: e?.message || 'Unable to open chat' });
            return false;
        }
    };

    // Poll threads in background
    startThreadsPolling();

    // If user navigates away from Messages view, stop active chat polling (but keep thread polling)
    const nav = DOM.navMessages;
    if (nav) {
        nav.addEventListener('click', () => {
            // When opening messages view, refresh immediately
            refreshThreads({ silent: true });
            startThreadsPolling();
        });
    }

    // Global safety: when leaving the page
    window.addEventListener('beforeunload', () => {
        stopThreadsPolling();
        stopActiveChatPolling();
    });
}

  return { initMessages };
})();

// ===== collections.js (bundled) =====
const __CreatorsCollections = (function() {
  const { DOM } = __CreatorsDOM;
  const { COLLECTIONS_DB, BLANK_IMG, DEFAULT_AVATAR, getMySubscriptions, apiGetJson, apiPostJson } = __CreatorsData;

// TODO: Backend Integration - Replace LocalStorage with API Endpoints
let currentColType = 'user'; // 'user' (Lists) or 'post' (Vault)
let currentMediaFilter = 'all'; // 'all', 'image', 'video'

// ===============================
// Backend-first Collections (Lists) cache + API wiring
// - Custom user Lists persist via /api/collections (Firestore when available)
// - System Lists (Fans/Following/Restricted/Blocked) remain derived
// - Falls back to localStorage if API is unavailable
// ===============================
const TM_COL_API_CACHE_KEY = 'tm_collections_api_cache_v1';
const TM_COL_SYS_COUNTS_KEY = 'tm_collections_sys_counts_v1';

let __apiLists = null;          // cached API lists (with items)
let __apiListsLoaded = false;
let __apiListsLoading = false;

function tmLsRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function tmLsWrite(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function tmLocalCount(key) {
  try {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

function tmGetSysCounts() {
  const o = tmLsRead(TM_COL_SYS_COUNTS_KEY, {}) || {};
  return (o && typeof o === 'object') ? o : {};
}

function tmNormalizeApiList(l) {
  if (!l) return null;
  const id = l.id != null ? String(l.id) : '';
  const name = String(l.name || '').trim();
  if (!id || !name) return null;

  const items = Array.isArray(l.items) ? l.items : [];
  const count = (typeof l.count === 'number') ? l.count : items.length;

  return { id, name, type: 'user', count, system: false, items, _source: 'api' };
}

async function tmSyncCollectionsFromApi({ silent = false } = {}) {
  if (__apiListsLoading) return;
  __apiListsLoading = true;

  try {
    const data = await apiGetJson('/api/collections?includeItems=1');
    const apiItems = Array.isArray(data?.items) ? data.items : [];
    __apiLists = apiItems.map(tmNormalizeApiList).filter(Boolean);
    __apiListsLoaded = true;
    tmLsWrite(TM_COL_API_CACHE_KEY, __apiLists);

    // System counts (fans/following from backend; restricted/blocked local)
    const counts = {
      fans: 0,
      following: 0,
      restricted: tmLocalCount('tm_restricted_users'),
      blocked: tmLocalCount('tm_blocked_users')
    };

    const [fansRes, followingRes] = await Promise.allSettled([
      getMySubscriptions({ dir: 'fans' }),
      getMySubscriptions({ dir: 'subscribed' })
    ]);

    if (fansRes.status === 'fulfilled') {
      const pack = fansRes.value?.subscribers || {};
      const c = pack.counts || {};
      counts.fans = Number(c.all || pack.items?.length || 0) || 0;
    }

    if (followingRes.status === 'fulfilled') {
      const pack = followingRes.value?.subscribed || {};
      const c = pack.counts || {};
      counts.following = Number(c.all || pack.items?.length || 0) || 0;
    }

    tmLsWrite(TM_COL_SYS_COUNTS_KEY, counts);
    if (!silent) {
      try { rsToast('success', 'Collections synced'); } catch {}
    }
  } catch (e) {
    // Keep UI working using localStorage; don’t hard-fail.
    if (!silent) {
      try { rsToast('error', 'Collections offline'); } catch {}
    }
  } finally {
    __apiListsLoading = false;
  }
}

function tmInitCollectionsBackendFirst() {
  // Prime from cache then background-sync.
  const cached = tmLsRead(TM_COL_API_CACHE_KEY, null);
  if (Array.isArray(cached)) {
    __apiLists = cached;
    __apiListsLoaded = true;
  }
  tmSyncCollectionsFromApi({ silent: true }).then(() => {
    try { renderCollections(DOM.colSearchInput?.value || ''); } catch (_) {}
  });
}

async function tmCreateUserList(name) {
  const nm = String(name || '').trim().slice(0, 60);
  if (!nm) throw new Error('Missing list name');

  try {
    const out = await apiPostJson('/api/collections/create', { name: nm });
    if (out?.ok) {
      await tmSyncCollectionsFromApi({ silent: true });
      return { ok: true, id: out.id, source: 'api' };
    }
    throw new Error(out?.error || 'Create failed');
  } catch (e) {
    // Fallback: local
    const newCol = { id: Date.now(), name: nm, type: 'user', count: 0, system: false };
    saveCollectionToStorage(newCol);
    return { ok: true, id: newCol.id, source: 'local' };
  }
}

async function tmDeleteUserList(col) {
  const id = String(col?.id || '').trim();
  if (!id) throw new Error('Missing list id');

  // Only delete API lists via API
  if (String(col?._source || '') === 'api') {
    try {
      const out = await apiPostJson('/api/collections/delete', { id });
      if (!out?.ok) throw new Error(out?.error || 'Delete failed');
      await tmSyncCollectionsFromApi({ silent: true });
      return { ok: true, source: 'api' };
    } catch (e) {
      // If API failed, keep it visible from cache rather than corrupt local storage.
      throw e;
    }
  }

  // Local list delete
  deleteCollectionFromStorage(col.id);
  return { ok: true, source: 'local' };
}


// ===============================
// Right Sidebar: Users list logic (Data #5)
// - Drives the chips (All/Active/Expired/Restricted/Blocked)
// - Renders a user list for system lists (Fans / Following)
// - Search + Sort (Recent / Name)
// ===============================
let _TopToast = null;

const RS_USERS = {
  listId: 'fans',   // 'fans' | 'following' | 'restricted' | 'blocked' | 'custom'
  filter: 'all',    // 'all' | 'active' | 'expired' | 'restricted' | 'blocked'
  search: '',
  sort: 'recent',   // 'recent' | 'name'
  items: [],
  counts: { all: 0, active: 0, expired: 0, restricted: 0, blocked: 0 }
};

function rsToast(icon, title) {
  try {
    if (_TopToast) _TopToast.fire({ icon, title });
  } catch (_) {}
}

function rsGetChips() {
  return Array.from(document.querySelectorAll('#rs-view-type-users .filter-chips .chip'));
}

function rsSetChipLabels(counts) {
  const chips = rsGetChips();
  if (!chips.length) return;

  const map = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expired', label: 'Expired' },
    { key: 'restricted', label: 'Restricted' },
    { key: 'blocked', label: 'Blocked' }
  ];

  map.forEach((m, i) => {
    if (!chips[i]) return;
    const n = (counts && typeof counts[m.key] === 'number') ? counts[m.key] : 0;
    chips[i].textContent = `${m.label} ${n}`;
  });
}

function rsSetChipActive(filterKey) {
  const chips = rsGetChips();
  chips.forEach(c => c.classList.remove('active'));
  const map = { all: 0, active: 1, expired: 2, restricted: 3, blocked: 4 };
  const idx = map[String(filterKey || 'all').toLowerCase()] ?? 0;
  if (chips[idx]) chips[idx].classList.add('active');
}

function rsEnsureUsersListContainer() {
  const host = document.getElementById('rs-view-type-users');
  if (!host) return null;

  let list = document.getElementById('rs-users-list');
  if (list) return list;

  list = document.createElement('div');
  list.id = 'rs-users-list';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '0';
  list.style.marginTop = '10px';
  list.style.borderTop = '1px solid var(--border-color)';
  list.style.background = 'transparent';

  const empty = host.querySelector('.rs-col-empty');
  if (empty) empty.insertAdjacentElement('beforebegin', list);
  else host.appendChild(list);

  return list;
}

function rsSetUsersEmptyState(show, text) {
  const host = document.getElementById('rs-view-type-users');
  if (!host) return;

  const empty = host.querySelector('.rs-col-empty');
  if (empty) {
    empty.style.display = show ? '' : 'none';
    if (text) {
      const span = empty.querySelector('span');
      if (span) span.textContent = text;
    }
  }
}

function rsNormalizeSubItem(it) {
  const u = (it && it.otherUser) ? it.otherUser : {};
  const name = (u && u.name) ? String(u.name) : '';
  const handle = (u && u.handle) ? String(u.handle) : '';
  const avatar = (u && u.avatarUrl) ? String(u.avatarUrl) : (DEFAULT_AVATAR || BLANK_IMG);
  const verified = !!(u && u.verified);
  const email = (it && it.otherEmail) ? String(it.otherEmail) : (u && u.email ? String(u.email) : '');
  const ts = (it && (it.updatedAt || it.createdAt)) ? (new Date(it.updatedAt || it.createdAt).getTime() || 0) : 0;
  const isActive = !!(it && it.isActive);
  return { email, name, handle, avatar, verified, isActive, ts };
}

function rsNormalizeSimpleUser(it) {
  const email = it?.email ? String(it.email) : '';
  const name = it?.name ? String(it.name) : '';
  const handle = it?.handle ? String(it.handle) : '';
  const avatar = it?.avatarUrl ? String(it.avatarUrl) : (DEFAULT_AVATAR || BLANK_IMG);
  const verified = !!it?.verified;
  const ts = it?.ts ? Number(it.ts) : 0;
  return { email, name, handle, avatar, verified, isActive: true, ts };
}

function rsNormalizeCollectionItem(it) {
  // Items returned from /api/collections (email/handle/name/avatarUrl/verified/addedAt)
  const email = it?.email ? String(it.email) : '';
  const name = it?.name ? String(it.name) : '';
  const handle = it?.handle ? String(it.handle) : '';
  const avatar = it?.avatarUrl ? String(it.avatarUrl) : (DEFAULT_AVATAR || BLANK_IMG);
  const verified = !!it?.verified;
  const ts = it?.addedAt ? Date.parse(String(it.addedAt)) : 0;
  return { email, name, handle, avatar, verified, isActive: true, ts };
}


function rsApplyFilter(items) {
  let out = Array.isArray(items) ? [...items] : [];

  // filter
  const f = String(RS_USERS.filter || 'all').toLowerCase();
  if (f === 'active') out = out.filter(x => x.isActive);
  if (f === 'expired') out = out.filter(x => !x.isActive);
  // restricted / blocked lists are stored locally (Data #10)
  if (f === 'restricted') out = rsLoadLocalUsers('tm_restricted_users');
  if (f === 'blocked') out = rsLoadLocalUsers('tm_blocked_users');

  // search
  const q = String(RS_USERS.search || '').trim().toLowerCase();
  if (q) {
    out = out.filter(x =>
      (x.name || '').toLowerCase().includes(q) ||
      (x.handle || '').toLowerCase().includes(q) ||
      (x.email || '').toLowerCase().includes(q)
    );
  }

  // sort
  if (RS_USERS.sort === 'name') {
    out.sort((a, b) => {
      const an = (a.name || a.handle || a.email || '').toLowerCase();
      const bn = (b.name || b.handle || b.email || '').toLowerCase();
      return an.localeCompare(bn);
    });
  } else {
    out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  return out;
}

function rsRenderUsers() {
  const list = rsEnsureUsersListContainer();
  if (!list) return;

  const filtered = rsApplyFilter(RS_USERS.items);
  list.innerHTML = '';

  if (!filtered.length) {
    const f = String(RS_USERS.filter || 'all').toLowerCase();
    const msg = RS_USERS.search ? 'No users found'
      : (f === 'restricted' ? 'No restricted users'
      : (f === 'blocked' ? 'No blocked users' : 'No users yet'));
    rsSetUsersEmptyState(true, msg);
    return;
  }

  rsSetUsersEmptyState(false);

  filtered.forEach((u) => {
    const row = document.createElement('div');
    row.className = 'rs-user-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.padding = '10px 4px';
    row.style.borderBottom = '1px solid var(--border-color)';
    row.style.cursor = 'pointer';

    const pill = u.isActive
      ? `<span style="margin-left:auto; font-size:10px; font-weight:900; padding:4px 10px; border-radius:999px; background: rgba(100,233,238,0.14); color: var(--primary-cyan); border: 1px solid rgba(100,233,238,0.25);">ACTIVE</span>`
      : `<span style="margin-left:auto; font-size:10px; font-weight:900; padding:4px 10px; border-radius:999px; background: rgba(255,255,255,0.06); color: var(--muted); border: 1px solid rgba(255,255,255,0.12);">EXPIRED</span>`;

    const check = u.verified ? `<i class="fa-solid fa-circle-check" style="margin-left:6px; font-size:12px; color: var(--primary-cyan);"></i>` : '';

    row.innerHTML = `
      <img src="${u.avatar || BLANK_IMG}" alt="" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color); background:#000;">
      <div style="display:flex; flex-direction:column; gap:2px; min-width:0;">
        <div style="display:flex; align-items:center; gap:0; min-width:0;">
          <span style="font-weight:900; font-size:13px; color: var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 160px;">${u.name || (u.handle ? u.handle : 'User')}</span>
          ${check}
        </div>
        <span style="font-size:12px; color: var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 180px;">${u.handle ? `@${u.handle.replace(/^@/, '')}` : (u.email || '')}</span>
      </div>
      ${pill}
    `;

    row.addEventListener('click', () => {
      rsOpenUserActions(u);
    });

    list.appendChild(row);
  });
}

function rsSetSortLabel() {
  const head = document.querySelector('#rs-view-type-users .filter-head span');
  if (!head) return;
  head.textContent = (RS_USERS.sort === 'name') ? 'NAME A-Z' : 'RECENT';
}

function rsLoadLocalUsers(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr)) return [];
    return arr.map(rsNormalizeSimpleUser);
  } catch {
    return [];
  }
}

// ===============================
// Data #10: Restricted / Blocked lists (local)
// - Persisted in localStorage (tm_restricted_users, tm_blocked_users)
// - Click a user row to manage: Restrict / Block / Unrestrict / Unblock
// ===============================
function rsUserKey(u) {
  const email = String(u?.email || '').trim().toLowerCase();
  if (email) return `e:${email}`;
  const handle = String(u?.handle || '').trim().replace(/^@/, '').toLowerCase();
  if (handle) return `h:${handle}`;
  const name = String(u?.name || '').trim().toLowerCase();
  if (name) return `n:${name}`;
  return '';
}

function rsLoadLocalUsersRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function rsSaveLocalUsersRaw(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
  } catch {}
}

function rsHasLocalUser(key, u) {
  const k = rsUserKey(u);
  if (!k) return false;
  const arr = rsLoadLocalUsersRaw(key);
  return arr.some(x => rsUserKey(x) === k);
}

function rsUpsertLocalUser(key, u) {
  const k = rsUserKey(u);
  if (!k) return;

  const now = Date.now();
  const obj = {
    email: u?.email || '',
    name: u?.name || '',
    handle: u?.handle || '',
    avatarUrl: u?.avatar || u?.avatarUrl || '',
    verified: !!u?.verified,
    ts: now
  };

  const arr = rsLoadLocalUsersRaw(key);
  const kept = arr.filter(x => rsUserKey(x) !== k);
  kept.unshift(obj);
  rsSaveLocalUsersRaw(key, kept.slice(0, 500));
}

function rsRemoveLocalUser(key, u) {
  const k = rsUserKey(u);
  if (!k) return;
  const arr = rsLoadLocalUsersRaw(key);
  rsSaveLocalUsersRaw(key, arr.filter(x => rsUserKey(x) !== k));
}

function rsRefreshRestrictedBlockedCounts() {
  try {
    const restricted = rsLoadLocalUsers('tm_restricted_users');
    const blocked = rsLoadLocalUsers('tm_blocked_users');
    RS_USERS.counts.restricted = restricted.length;
    RS_USERS.counts.blocked = blocked.length;
    rsSetChipLabels(RS_USERS.counts);
  } catch {}
}

function rsOpenUserActions(u) {
  const isRestricted = rsHasLocalUser('tm_restricted_users', u);
  const isBlocked = rsHasLocalUser('tm_blocked_users', u);

  const title = u.name || (u.handle ? `@${String(u.handle).replace(/^@/, '')}` : 'User');
  const sub = u.handle ? `@${String(u.handle).replace(/^@/, '')}` : (u.email || '');
  const check = u.verified ? `<i class="fa-solid fa-circle-check" style="margin-left:6px; font-size:12px; color: var(--primary-cyan);"></i>` : '';

  const badge = isBlocked
    ? `<span style="font-size:10px; font-weight:900; padding:4px 10px; border-radius:999px; background: rgba(255,77,79,0.12); color: #ff4d4f; border: 1px solid rgba(255,77,79,0.25);">BLOCKED</span>`
    : (isRestricted
      ? `<span style="font-size:10px; font-weight:900; padding:4px 10px; border-radius:999px; background: rgba(245,197,66,0.14); color: #f5c542; border: 1px solid rgba(245,197,66,0.25);">RESTRICTED</span>`
      : '');

  Swal.fire({
    title: '',
    html: `
      <div style="display:flex; align-items:center; gap:12px; text-align:left;">
        <img src="${u.avatar || BLANK_IMG}" alt="" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color); background:#000;">
        <div style="min-width:0;">
          <div style="display:flex; align-items:center; gap:0; font-weight:900; font-size:14px; color: var(--text);">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 230px;">${title}</span>${check}
          </div>
          <div style="color: var(--muted); font-size:12px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 240px;">${sub}</div>
          <div style="margin-top:8px;">${badge}</div>
        </div>
      </div>
      <div style="margin-top:14px; color: var(--muted); font-size:12px; line-height:1.45;">
        Manage this user. (Messaging/profile opening can be added next.)
      </div>
    `,
    showCancelButton: true,
    cancelButtonText: 'Close',
    showConfirmButton: true,
    confirmButtonText: isRestricted ? 'UNRESTRICT' : 'RESTRICT',
    confirmButtonColor: '#f5c542',
    showDenyButton: true,
    denyButtonText: isBlocked ? 'UNBLOCK' : 'BLOCK',
    denyButtonColor: '#ff4d4f',
    background: '#0d1423',
    color: '#fff'
  }).then((r) => {
    if (r.isConfirmed) {
      if (isRestricted) {
        rsRemoveLocalUser('tm_restricted_users', u);
        rsToast('success', 'Unrestricted');
      } else {
        rsUpsertLocalUser('tm_restricted_users', u);
        // Block overrides restrict, so remove from blocked if needed
        rsRemoveLocalUser('tm_blocked_users', u);
        rsToast('success', 'Restricted');
      }
      rsRefreshRestrictedBlockedCounts();
      rsRenderUsers();
      return;
    }

    if (r.isDenied) {
      if (isBlocked) {
        rsRemoveLocalUser('tm_blocked_users', u);
        rsToast('success', 'Unblocked');
      } else {
        rsUpsertLocalUser('tm_blocked_users', u);
        // Remove from restricted if blocked
        rsRemoveLocalUser('tm_restricted_users', u);
        rsToast('success', 'Blocked');
      }
      rsRefreshRestrictedBlockedCounts();
      rsRenderUsers();
      return;
    }
  });
}


async function rsLoadUsersForCollection(col) {
  const id = String(col?.id || '').toLowerCase();

  // Default state
  RS_USERS.listId = id || 'custom';
  RS_USERS.filter = 'all';
  RS_USERS.search = '';
  RS_USERS.sort = 'recent';
  RS_USERS.items = [];
  RS_USERS.counts = { all: 0, active: 0, expired: 0, restricted: 0, blocked: 0 };

  rsSetUsersEmptyState(true, 'Loading...');
  rsSetSortLabel();
  rsSetChipActive('all');
  rsSetChipLabels(RS_USERS.counts);
  rsRenderUsers();

  // Restricted / Blocked placeholders from localStorage
  const restricted = rsLoadLocalUsers('tm_restricted_users');
  const blocked = rsLoadLocalUsers('tm_blocked_users');
  RS_USERS.counts.restricted = restricted.length;
  RS_USERS.counts.blocked = blocked.length;

  // Fans / Following from backend
  if (id === 'fans' || id === 'following') {
    try {
      const dir = (id === 'fans') ? 'fans' : 'subscribed';
      const data = await getMySubscriptions({ dir });
      const pack = (id === 'fans') ? (data?.subscribers || {}) : (data?.subscribed || {});
      const items = Array.isArray(pack.items) ? pack.items : [];
      const counts = pack.counts || { all: items.length, active: items.filter(x => !!x.isActive).length, expired: 0 };

      RS_USERS.items = items.map(rsNormalizeSubItem);
      RS_USERS.counts.all = Number(counts.all || RS_USERS.items.length) || 0;
      RS_USERS.counts.active = Number(counts.active || 0) || 0;
      RS_USERS.counts.expired = Number(counts.expired || 0) || Math.max(0, RS_USERS.counts.all - RS_USERS.counts.active);

      rsSetChipLabels(RS_USERS.counts);
      rsSetUsersEmptyState(RS_USERS.counts.all === 0, 'No users yet');
      rsRenderUsers();
      return;
    } catch (e) {
      console.error('rsLoadUsersForCollection error', e);
      rsSetUsersEmptyState(true, 'Failed to load');
      rsSetChipLabels(RS_USERS.counts);
      return;
    }
  }

  // Custom user lists (API-backed): show stored items if available
  try {
    const items = Array.isArray(col?.items) ? col.items : [];
    if (items.length) {
      RS_USERS.items = items.map(rsNormalizeCollectionItem);
      RS_USERS.counts.all = items.length;
      RS_USERS.counts.active = items.length;
      RS_USERS.counts.expired = 0;

      rsSetChipLabels(RS_USERS.counts);
      rsSetUsersEmptyState(false, '');
      rsRenderUsers();
      return;
    }
  } catch (e) {}

// For other lists: show empty (until you add data sources)
  rsSetChipLabels(RS_USERS.counts);
  rsSetUsersEmptyState(true, 'No users yet');
}


// ===============================
// Right Sidebar: Media (Vault) logic (Data #9)
// - Drives the MEDIA mode in the right sidebar (#rs-view-type-media)
// - Search + Sort + Grid toggle + Filter pills
// ===============================
const RS_MEDIA = {
  filter: 'all',
  search: '',
  sort: 'recent', // 'recent' | 'oldest'
  cols: (() => {
    const n = parseInt(localStorage.getItem('tm_rs_media_cols') || '3', 10);
    return (n == 2 || n == 3) ? n : 3;
  })()
};
let _mediaBound = false;

function rsMediaKeyFromText(txt) {
  const t = String(txt || '').trim().toLowerCase();
  if (t == 'all') return 'all';
  if (t.startsWith('photo')) return 'image';
  if (t.startsWith('video')) return 'video';
  if (t.startsWith('audio')) return 'audio';
  if (t.startsWith('other')) return 'other';
  if (t.startsWith('locked')) return 'locked';
  return 'all';
}

function rsMediaSetHeaderLabel() {
  const el = document.querySelector('#rs-view-type-media .media-header-row .section-title');
  if (!el) return;
  el.textContent = (RS_MEDIA.sort === 'oldest') ? 'OLDEST' : 'RECENT';
}

function rsMediaSetActivePill(key) {
  const pills = document.querySelectorAll('#rs-view-type-media .media-filter-chips .n-pill');
  pills.forEach(p => p.classList.remove('active'));
  let want = key;
  // Sidebar uses text labels, not data attributes
  pills.forEach(p => {
    const k = rsMediaKeyFromText(p.textContent);
    if (k === want) p.classList.add('active');
  });
}

function rsSyncMainVaultPills(filterKey) {
  const allowed = ['all','image','video'];
  const k = allowed.includes(filterKey) ? filterKey : 'all';
  const pills = document.querySelectorAll('#vault-sub-tabs .n-pill');
  if (!pills || !pills.length) return;
  pills.forEach(p => {
    p.classList.toggle('active', String(p.dataset.type || '') === k);
  });
  try { currentMediaFilter = k; } catch(e) {}
}

function rsShowMediaView() {
  if (DOM.rsTitle) DOM.rsTitle.innerText = 'VAULT';

  if (DOM.rsCollections) DOM.rsCollections.classList.remove('hidden');
  if (DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');

  if (DOM.rsViewUsers) DOM.rsViewUsers.classList.add('hidden');
  if (DOM.rsViewMedia) DOM.rsViewMedia.classList.remove('hidden');

  // Mobile: ensure open + back button
  if (window.innerWidth <= 1024) {
    const header = document.querySelector('.rs-col-header');
    if (header && !header.querySelector('.settings-mobile-back')) {
      const backBtn = document.createElement('div');
      backBtn.className = 'settings-mobile-back';
      backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> BACK`;
      backBtn.addEventListener('click', () => {
        if (DOM.rightSidebar) DOM.rightSidebar.classList.remove('mobile-active');
      });
      header.insertBefore(backBtn, header.firstChild);
    }

    if (DOM.rightSidebar) {
      DOM.rightSidebar.classList.remove('hidden-sidebar');
      DOM.rightSidebar.classList.add('mobile-active');
    }
  }
}

function rsMediaNormalize(m) {
  const src = m?.src || m?.url || '';
  let type = String(m?.type || '').toLowerCase();
  if (!type) {
    if (String(src).startsWith('data:video')) type = 'video';
    else if (String(src).startsWith('data:audio')) type = 'audio';
    else if (String(src).startsWith('data:image')) type = 'image';
    else type = 'other';
  }
  if (type == 'photo') type = 'image';

  const createdAt = Number(m?.createdAt || m?.ts || m?.id || 0) || 0;
  const name = String(m?.name || '').trim();
  const locked = !!m?.locked || type == 'locked';

  return {
    id: m?.id,
    src,
    type,
    name,
    createdAt,
    date: m?.date || '',
    locked
  };
}

function rsMediaApply(items) {
  let list = Array.isArray(items) ? items.slice() : [];

  // Filter
  const f = RS_MEDIA.filter;
  if (f && f !== 'all') {
    if (f === 'locked') list = list.filter(x => !!x.locked);
    else list = list.filter(x => x.type === f);
  }

  // Search
  const q = String(RS_MEDIA.search || '').trim().toLowerCase();
  if (q) {
    list = list.filter(x => {
      return (
        String(x.name || '').toLowerCase().includes(q) ||
        String(x.type || '').toLowerCase().includes(q) ||
        String(x.date || '').toLowerCase().includes(q)
      );
    });
  }

  // Sort
  if (RS_MEDIA.sort === 'oldest') list.sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
  else list.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

  return list;
}

function rsRenderMedia() {
  const view = document.getElementById('rs-view-type-media');
  if (!view) return;

  const grid = document.getElementById('rs-media-grid-content');
  const empty = document.getElementById('rs-media-empty-state');
  if (!grid || !empty) return;

  rsMediaSetHeaderLabel();

  let raw = []
  try { raw = getMediaFromStorage(); } catch(e) { raw = []; }
  const items = rsMediaApply((raw || []).map(rsMediaNormalize));

  grid.innerHTML = '';
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${RS_MEDIA.cols}, 1fr)`;
  grid.style.gap = '8px';
  grid.style.padding = '10px 0';

  if (!items.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  items.forEach((m) => {
    const cell = document.createElement('div');
    cell.style.position = 'relative';
    cell.style.aspectRatio = '1/1';
    cell.style.borderRadius = '10px';
    cell.style.overflow = 'hidden';
    cell.style.cursor = 'pointer';
    cell.style.border = '1px solid var(--border-color)';
    cell.style.background = '#000';

    if (m.type === 'image' && m.src) {
      const img = document.createElement('img');
      img.src = m.src;
      img.alt = '';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      cell.appendChild(img);
    } else if (m.type === 'video' && m.src) {
      const vid = document.createElement('video');
      vid.src = m.src;
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      vid.style.width = '100%';
      vid.style.height = '100%';
      vid.style.objectFit = 'cover';
      cell.appendChild(vid);
    } else {
      const ph = document.createElement('div');
      ph.style.width = '100%';
      ph.style.height = '100%';
      ph.style.display = 'flex';
      ph.style.alignItems = 'center';
      ph.style.justifyContent = 'center';
      ph.style.color = 'var(--muted)';
      ph.style.fontSize = '18px';
      const icon = (m.type === 'audio') ? 'fa-music' : 'fa-file-lines';
      ph.innerHTML = `<i class="fa-solid ${icon}"></i>`;
      cell.appendChild(ph);
    }

    const badge = document.createElement('div');
    badge.style.position = 'absolute';
    badge.style.left = '8px';
    badge.style.bottom = '8px';
    badge.style.padding = '4px 6px';
    badge.style.borderRadius = '999px';
    badge.style.fontSize = '11px';
    badge.style.background = 'rgba(0,0,0,0.55)';
    badge.style.border = '1px solid rgba(255,255,255,0.12)';
    badge.style.color = '#fff';
    const label = (m.type === 'image') ? 'PHOTO' : (m.type === 'video' ? 'VIDEO' : m.type.toUpperCase());
    badge.textContent = label;
    cell.appendChild(badge);

    if (m.type === 'video') {
      const play = document.createElement('div');
      play.style.position = 'absolute';
      play.style.right = '8px';
      play.style.top = '8px';
      play.style.width = '26px';
      play.style.height = '26px';
      play.style.borderRadius = '999px';
      play.style.display = 'flex';
      play.style.alignItems = 'center';
      play.style.justifyContent = 'center';
      play.style.background = 'rgba(0,0,0,0.55)';
      play.style.border = '1px solid rgba(255,255,255,0.12)';
      play.style.color = '#fff';
      play.innerHTML = '<i class="fa-solid fa-play" style="font-size:12px;"></i>';
      cell.appendChild(play);
    }

    if (m.locked) {
      const lock = document.createElement('div');
      lock.style.position = 'absolute';
      lock.style.inset = '0';
      lock.style.display = 'flex';
      lock.style.alignItems = 'center';
      lock.style.justifyContent = 'center';
      lock.style.background = 'rgba(0,0,0,0.45)';
      lock.style.color = '#fff';
      lock.innerHTML = '<i class="fa-solid fa-lock"></i>';
      cell.appendChild(lock);
    }

    cell.addEventListener('click', () => {
      let title = (m.name || '').trim() || 'Vault item';
      let html = '';
      let imageUrl = null;

      if (m.locked) {
        html = `<div style="padding:10px 0; color:var(--text);">This item is locked.</div>`;
      } else if (m.type === 'image') {
        imageUrl = m.src;
      } else if (m.type === 'video') {
        html = `<video src="${m.src}" controls autoplay style="width:100%; border-radius:12px;"></video>`;
      } else if (m.type === 'audio') {
        html = `<audio src="${m.src}" controls autoplay style="width:100%;"></audio>`;
      } else {
        html = `<div style="padding:10px 0; color:var(--text);">Preview not available for this file type.</div>`;
      }

      Swal.fire({
        title,
        html: html || undefined,
        imageUrl: imageUrl || undefined,
        imageAlt: 'media',
        showConfirmButton: false,
        showDenyButton: true,
        denyButtonText: 'Delete',
        denyButtonColor: '#ff4d6d',
        background: '#0d1423',
        color: '#fff'
      }).then((r) => {
        if (!r.isDenied) return;
        deleteMediaFromStorage(m.id);
        try { rsToast('success', 'Deleted'); } catch(e) {}
        try { renderCollections(); } catch(e) {}
        try { rsRenderMedia(); } catch(e) {}
      });
    });

    grid.appendChild(cell);
  });
}

function rsBindMediaSidebar() {
  if (_mediaBound) return;
  const view = document.getElementById('rs-view-type-media');
  if (!view) return;
  _mediaBound = true;

  // Tool icons
  const iconSearch = view.querySelector('.media-header-row .header-tools .fa-magnifying-glass');
  const iconGrid = view.querySelector('.media-header-row .header-tools .fa-table-cells-large');
  const iconSort = view.querySelector('.media-header-row .header-tools .fa-bars-staggered');

  if (iconSearch) {
    iconSearch.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Swal.fire({
        title: 'Search media',
        input: 'text',
        inputValue: RS_MEDIA.search || '',
        inputPlaceholder: 'Type to filter',
        showCancelButton: true,
        confirmButtonText: 'Apply',
        confirmButtonColor: '#64E9EE',
        background: '#0d1423',
        color: '#fff'
      }).then((r) => {
        if (!r.isConfirmed) return;
        RS_MEDIA.search = String(r.value || '').trim();
        rsRenderMedia();
      });
    });
  }

  if (iconGrid) {
    iconGrid.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      RS_MEDIA.cols = (RS_MEDIA.cols == 3) ? 2 : 3;
      localStorage.setItem('tm_rs_media_cols', String(RS_MEDIA.cols));
      rsRenderMedia();
      try { rsToast('success', `Grid: ${RS_MEDIA.cols} cols`); } catch(err) {}
    });
  }

  if (iconSort) {
    iconSort.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      RS_MEDIA.sort = (RS_MEDIA.sort === 'recent') ? 'oldest' : 'recent';
      rsMediaSetHeaderLabel();
      rsRenderMedia();
      try { rsToast('success', RS_MEDIA.sort === 'oldest' ? 'Sorted: oldest' : 'Sorted: recent'); } catch(err) {}
    });
  }

  // Filter pills
  const chipWrap = view.querySelector('.media-filter-chips');
  if (chipWrap) {
    chipWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.n-pill');
      if (!btn) return;
      const key = rsMediaKeyFromText(btn.textContent);
      RS_MEDIA.filter = key;
      rsMediaSetActivePill(key);

      // Sync main Vault tabs when possible
            // Keep main Vault pills in sync for (all|image|video)
      if (key === 'all' || key === 'image' || key === 'video') {
        rsSyncMainVaultPills(key);
        try { renderCollections(); } catch(err) {}
      }

      rsRenderMedia();
    });
  }

  // Set defaults
  rsMediaSetHeaderLabel();
  rsMediaSetActivePill(RS_MEDIA.filter);
}

 function initCollections(TopToast) {
    _TopToast = TopToast;

    // Backend-first: load cached API lists then sync in background
    try { tmInitCollectionsBackendFirst(); } catch(e) {}

    
    // 1. EVENT LISTENERS FOR SEARCH
    if (DOM.colBtnSearch) DOM.colBtnSearch.addEventListener('click', () => { 
        DOM.colSearchContainer.classList.remove('hidden'); 
        DOM.colSearchInput.focus(); 
    });
    
    if (DOM.colSearchClose) DOM.colSearchClose.addEventListener('click', () => { 
        DOM.colSearchContainer.classList.add('hidden'); 
        DOM.colSearchInput.value = ''; 
        renderCollections(); 
    });
    
    if (DOM.colSearchInput) DOM.colSearchInput.addEventListener('input', (e) => renderCollections(e.target.value));

    // 2. ADD NEW LIST (Only for User Lists)
    if (DOM.colBtnAdd) {
        DOM.colBtnAdd.addEventListener('click', () => {
            Swal.fire({
                title: 'New List',
                input: 'text', 
                inputPlaceholder: 'List Name (e.g. Whales)', 
                showCancelButton: true, 
                confirmButtonText: 'Create', 
                confirmButtonColor: '#64E9EE', 
                background: '#0d1423', 
                color: '#fff'
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    const nm = String(result.value || '').trim();
                    tmCreateUserList(nm)
                      .then((out) => {
                        renderCollections();
                        TopToast.fire({ icon: 'success', title: (out?.source === 'api') ? 'List created' : 'Saved locally' });
                      })
                      .catch((e) => {
                        TopToast.fire({ icon: 'error', title: e?.message || 'Create failed' });
                      });
                }
            });
        });
    }

    // 3. MAIN TAB SWITCHING (LISTS vs VAULT)
    const tabUsers = document.getElementById('tab-col-users');
    const tabVault = document.getElementById('tab-col-vault');
    const subTabsContainer = document.getElementById('vault-sub-tabs');
    const uploadBtn = document.getElementById('col-btn-upload');

    // Sidebar Handling
    const rsCollections = document.getElementById('rs-collections-view');
    const rsSuggestions = document.getElementById('rs-suggestions-view');

    if (tabUsers && tabVault) {
        // --- CLICK LISTS ---
        tabUsers.addEventListener('click', () => {
            tabUsers.classList.add('active');
            tabVault.classList.remove('active');
            currentColType = 'user';
            
            // UI Updates
            if(uploadBtn) uploadBtn.style.display = 'none';
            if(DOM.colBtnAdd) DOM.colBtnAdd.style.display = 'block';
            if(subTabsContainer) subTabsContainer.classList.add('hidden'); 
            
            // Show Sidebar for Lists (Fans/Following details)
            if(rsCollections) rsCollections.classList.remove('hidden');
            if(rsSuggestions) rsSuggestions.classList.add('hidden');

            renderCollections();
        });

        // --- CLICK VAULT ---
        tabVault.addEventListener('click', () => {
            tabVault.classList.add('active');
            tabUsers.classList.remove('active');
            currentColType = 'post';
            
            // UI Updates
            if(uploadBtn) uploadBtn.style.display = 'block';
            if(DOM.colBtnAdd) DOM.colBtnAdd.style.display = 'none';
            if(subTabsContainer) {
                subTabsContainer.classList.remove('hidden'); 
                subTabsContainer.style.display = 'flex';
            }
            
            // Right sidebar: switch to Vault Media mode
            if (rsSuggestions) rsSuggestions.classList.add('hidden');
            if (rsCollections) rsCollections.classList.remove('hidden');
            rsShowMediaView();
            rsRenderMedia();

            renderCollections();
        });
    }

    // 4. SUB-TAB FILTERING (All, Photos, Videos)
    const vaultPills = document.querySelectorAll('#vault-sub-tabs .n-pill');
    if (vaultPills) {
        vaultPills.forEach(pill => {
            pill.addEventListener('click', () => {
                vaultPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentMediaFilter = pill.dataset.type;
                RS_MEDIA.filter = currentMediaFilter;
                rsMediaSetActivePill(RS_MEDIA.filter);
                rsRenderMedia();
                renderCollections();
            });
        });
    }

    // 5. UPLOAD LOGIC
    const fileInput = document.getElementById('col-file-input');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => { fileInput.click(); });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) { 
                Swal.fire({ icon: 'error', title: 'Too large', text: 'File must be under 10MB', background: '#0d1423', color: '#fff' });
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64String = event.target.result;
                const mediaItem = {
                    id: Date.now(),
                    src: base64String,
                    name: file.name || '',
                    type: file.type.startsWith('video') ? 'video' : (file.type.startsWith('image') ? 'image' : (file.type.startsWith('audio') ? 'audio' : 'other')),
                    createdAt: Date.now(),
                    date: new Date().toLocaleDateString()
                };
                saveMediaToStorage(mediaItem);
                TopToast.fire({ icon: 'success', title: 'Saved to Vault!' });
                renderCollections();
            };
            reader.readAsDataURL(file);
            fileInput.value = '';
        });
    }


    // 6. RIGHT SIDEBAR FILTERS (Users)
    const rsUsersView = document.getElementById('rs-view-type-users');
    if (rsUsersView) {
        const iconSearch = rsUsersView.querySelector('.fh-icons .fa-magnifying-glass');
        const iconSort = rsUsersView.querySelector('.fh-icons .fa-arrow-down-short-wide');

        if (iconSearch) {
            iconSearch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                Swal.fire({
                    title: 'Search users',
                    input: 'text',
                    inputValue: RS_USERS.search || '',
                    inputPlaceholder: 'Name, handle, or email',
                    showCancelButton: true,
                    confirmButtonText: 'Search',
                    confirmButtonColor: '#64E9EE',
                    background: '#0d1423',
                    color: '#fff'
                }).then((r) => {
                    if (!r.isConfirmed) return;
                    RS_USERS.search = String(r.value || '').trim();
                    rsRenderUsers();
                });
            });
        }

        if (iconSort) {
            iconSort.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                RS_USERS.sort = (RS_USERS.sort === 'recent') ? 'name' : 'recent';
                rsSetSortLabel();
                rsRenderUsers();
                rsToast('success', RS_USERS.sort === 'name' ? 'Sorted by name' : 'Sorted by recent');
            });
        }

        rsUsersView.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;

            const txt = String(chip.textContent || '').trim().toLowerCase();
            const key =
                txt.startsWith('active') ? 'active' :
                txt.startsWith('expired') ? 'expired' :
                txt.startsWith('restricted') ? 'restricted' :
                txt.startsWith('blocked') ? 'blocked' :
                'all';

            RS_USERS.filter = key;
            rsSetChipActive(key);
            rsRenderUsers();
        });
    }

    // 7. RIGHT SIDEBAR FILTERS (Media - Vault)
    rsBindMediaSidebar();

    // Initial Render
    renderCollections();
    rsRenderMedia();
}

// --- RENDERING LOGIC ---

 function renderCollections(filter = '') {
    const grid = document.querySelector('.collection-list-container');
    if (!grid) return;

    grid.innerHTML = '';
    
    // ==========================================
    // MODE: VAULT (MEDIA GALLERY)
    // ==========================================
    if (currentColType === 'post') {
        // Keep right sidebar in Media mode while in Vault
        try { rsShowMediaView(); } catch(e) {}
        try { rsRenderMedia(); } catch(e) {}
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '5px';
        grid.style.padding = '10px';

        let mediaList = getMediaFromStorage();
        
        if (currentMediaFilter !== 'all') {
            mediaList = mediaList.filter(m => m.type === currentMediaFilter);
        }

        if (mediaList.length === 0) {
            grid.style.display = 'block'; 
            grid.innerHTML = `<div style="text-align:center; padding:50px; color:var(--muted);">
                <i class="fa-regular fa-folder-open" style="font-size:2rem; margin-bottom:10px;"></i>
                <p>No ${currentMediaFilter === 'all' ? 'media' : currentMediaFilter + 's'} found.</p>
                <small>Upload to populate your Vault.</small>
            </div>`;
            return;
        }

        mediaList.forEach(media => {
            const div = document.createElement('div');
            div.style.position = 'relative';
            div.style.paddingBottom = '100%';
            div.style.overflow = 'hidden';
            div.style.borderRadius = '8px';
            div.style.background = '#000';
            div.style.cursor = 'pointer';
            div.style.border = '1px solid var(--border-color)';

            let contentHTML = '';
            if (media.type === 'video') {
                contentHTML = `<video src="${media.src}" style="position:absolute; width:100%; height:100%; object-fit:cover;"></video>
                               <i class="fa-solid fa-play" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; font-size:1.5rem; text-shadow:0 0 5px #000;"></i>`;
            } else {
                contentHTML = `<img src="${media.src}" style="position:absolute; width:100%; height:100%; object-fit:cover;">`;
            }

            div.innerHTML = contentHTML;
            
            div.onclick = () => {
                Swal.fire({
                    imageUrl: media.type === 'image' ? media.src : null,
                    html: media.type === 'video' ? `<video src="${media.src}" controls autoplay style="width:100%"></video>` : '',
                    showDenyButton: true,
                    showConfirmButton: false,
                    denyButtonText: 'Delete from Vault',
                    denyButtonColor: '#ff4757',
                    background: '#0d1423',
                    showCloseButton: true,
                    customClass: { popup: 'swal-media-preview' }
                }).then((result) => {
                    if (result.isDenied) {
                        deleteMediaFromStorage(media.id);
                        renderCollections();
                    }
                });
            };

            grid.appendChild(div);
        });

    } 
    // ==========================================
    // MODE: LISTS (PEOPLE / SUBSCRIPTIONS)
    // ==========================================
    else {
        grid.style.display = 'flex';
        grid.style.flexDirection = 'column';
        grid.style.gap = '0';
        grid.style.padding = '0';

        const collections = getCollectionsFromStorage();
        
        let displayList = collections.filter(c => c.type === 'user');
        if (filter) displayList = displayList.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

        if (displayList.length === 0) {
            grid.innerHTML = `<div style="padding:30px; text-align:center; color:var(--muted);">No lists found.</div>`;
            return;
        }

        displayList.forEach(col => {
            const div = document.createElement('div');
            div.className = 'c-list-item'; 
            
            // Logic to check if this list is active in the sidebar
            if(DOM.rsTitle && DOM.rsTitle.innerText === col.name.toUpperCase()) {
                div.classList.add('active');
            }

            const deleteIcon = !col.system ? '<i class="fa-solid fa-trash del-btn" style="font-size:0.8rem; color:#ff4757; opacity:0.5; cursor:pointer;"></i>' : '';

            div.innerHTML = `
                <div class="c-item-content">
                    <div style="display:flex; justify-content:space-between;">
                        <span class="c-item-name">${col.name}</span>
                        ${deleteIcon}
                    </div>
                    <span class="c-item-status">${col.count} people</span>
                </div>
            `;
            
            const delBtn = div.querySelector('.del-btn');
            if(delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    Swal.fire({
                        title: 'Delete List?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ff4757', confirmButtonText: 'Delete', background: '#0d1423', color: '#fff'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            tmDeleteUserList(col)
                              .then(() => { renderCollections(); })
                              .catch((e) => {
                                Swal.fire({ icon: 'error', title: 'Delete failed', text: e?.message || 'Request failed', background: '#0d1423', color: '#fff' });
                              });
                        }
                    });
                });
            }

            // Click List -> Update Sidebar
            div.onclick = () => {
                document.querySelectorAll('.c-list-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                updateRightSidebarContent(col);
            };

            grid.appendChild(div);
        });
    }
}

// --- STORAGE HELPERS ---

function getCollectionsFromStorage() {
    const defaults = [
        { id: 'fans', name: 'Fans', type: 'user', count: 0, system: true },
        { id: 'following', name: 'Following', type: 'user', count: 0, system: true },
        { id: 'restricted', name: 'Restricted', type: 'user', count: 0, system: true },
        { id: 'blocked', name: 'Blocked', type: 'user', count: 0, system: true },
        { id: 'favorites', name: 'Favorite Posts', type: 'post', count: 0, system: true },
        { id: 'watch_later', name: 'Watch Later', type: 'post', count: 0, system: false }
    ];

    // Local base (keeps Vault + any offline custom lists)
    let local;
    try { local = JSON.parse(localStorage.getItem('tm_collections') || 'null'); } catch { local = null; }
    if (!Array.isArray(local)) local = defaults.map(d => ({ ...d }));

    // Ensure required defaults exist (by id)
    try {
        const has = new Set(local.map(x => String(x?.id || '')));
        let changed = false;
        defaults.forEach(d => {
            if (!has.has(String(d.id))) {
                local.push({ ...d });
                changed = true;
            }
        });
        if (changed) localStorage.setItem('tm_collections', JSON.stringify(local));
    } catch {}

    const localTagged = local.map(c => {
        const o = { ...c };
        o._source = o.system ? 'system' : 'local';
        return o;
    });

    // API lists (custom user lists)
    const apiCached = tmLsRead(TM_COL_API_CACHE_KEY, null);
    const apiBase = Array.isArray(__apiLists) ? __apiLists : (Array.isArray(apiCached) ? apiCached : []);
    const apiTagged = (apiBase || []).map(tmNormalizeApiList).filter(Boolean);

    // Merge: prefer API for same id
    const apiIds = new Set(apiTagged.map(x => String(x.id)));
    let merged = localTagged.filter(x => !(apiIds.has(String(x.id)) && x.type === 'user' && !x.system));
    merged = merged.concat(apiTagged);

    // Apply cached system counts (derived)
    const sc = tmGetSysCounts();
    merged = merged.map(c => {
        const id = String(c.id || '');
        if (id === 'fans' && typeof sc.fans === 'number') return { ...c, count: sc.fans };
        if (id === 'following' && typeof sc.following === 'number') return { ...c, count: sc.following };
        if (id === 'restricted' && typeof sc.restricted === 'number') return { ...c, count: sc.restricted };
        if (id === 'blocked' && typeof sc.blocked === 'number') return { ...c, count: sc.blocked };
        return c;
    });

    return merged;
}


function saveCollectionToStorage(col) {
    const list = getCollectionsFromStorage();
    list.push(col);
    localStorage.setItem('tm_collections', JSON.stringify(list));
}

function deleteCollectionFromStorage(id) {
    let list = getCollectionsFromStorage();
    list = list.filter(c => c.id !== id);
    localStorage.setItem('tm_collections', JSON.stringify(list));
}

function getMediaFromStorage() {
    return JSON.parse(localStorage.getItem('tm_uploaded_media') || '[]');
}

function saveMediaToStorage(media) {
    const list = getMediaFromStorage();
    list.unshift(media);
    localStorage.setItem('tm_uploaded_media', JSON.stringify(list));
}

function deleteMediaFromStorage(id) {
    let list = getMediaFromStorage();
    list = list.filter(m => m.id !== id);
    localStorage.setItem('tm_uploaded_media', JSON.stringify(list));
}

// Update the Right Sidebar (Only used for User Lists)
 function updateRightSidebarContent(col) {
    if (DOM.rsTitle) DOM.rsTitle.innerText = col.name.toUpperCase();
    
    // Ensure Collections Sidebar is visible
    if(DOM.rsCollections) DOM.rsCollections.classList.remove('hidden');
    if(DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');

    if (DOM.rsViewUsers) DOM.rsViewUsers.classList.remove('hidden');
    if (DOM.rsViewMedia) DOM.rsViewMedia.classList.add('hidden');

    // Load user data into the right sidebar (Fans / Following)
    rsLoadUsersForCollection(col);
    rsSetChipActive('all');
    
    // Mobile Back Button Logic
    if (window.innerWidth <= 1024) {
       const header = document.querySelector('.rs-col-header');
       if (header && !header.querySelector('.settings-mobile-back')) {
            const backBtn = document.createElement('div');
            backBtn.className = 'settings-mobile-back';
            backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> BACK`;
            backBtn.addEventListener('click', () => {
               if(DOM.rightSidebar) DOM.rightSidebar.classList.remove('mobile-active');
            });
            header.insertBefore(backBtn, header.firstChild);
       }
        // Force Open Sidebar on Mobile
        if(DOM.rightSidebar) {
            DOM.rightSidebar.classList.remove('hidden-sidebar');
            DOM.rightSidebar.classList.add('mobile-active');
        }
   }
}

  return { initCollections, renderCollections, updateRightSidebarContent };
})();

// ===== settings.js (bundled) =====
const __CreatorsSettings = (function() {
  const { DOM } = __CreatorsDOM;
  const { apiMe, apiPost } = __CreatorsApi;

let __meCache = null;

const KEY_ALIASES = {
  'Display name': ['Display name', 'Name'],
};

function normKey(k) {
  return String(k || '').trim().toLowerCase();
}

function parsePacked(packed) {
  const map = new Map(); // normKey -> { key, value }
  const raw = String(packed || '');
  raw.split('|').forEach((part) => {
    const s = String(part || '').trim();
    if (!s) return;
    const idx = s.indexOf(':');
    if (idx === -1) return;
    const key = s.slice(0, idx).trim();
    const value = s.slice(idx + 1).trim();
    map.set(normKey(key), { key, value });
  });
  return map;
}

function getPacked(map, key) {
  const it = map.get(normKey(key));
  return it ? it.value : '';
}

function getPackedAny(map, key) {
  const aliases = KEY_ALIASES[key] || [key];
  for (const k of aliases) {
    const v = getPacked(map, k);
    if (v) return v;
  }
  return '';
}

function deleteAliases(map, key) {
  const aliases = KEY_ALIASES[key] || [];
  aliases.forEach((k) => {
    if (k === key) return;
    map.delete(normKey(k));
  });
}

function setPacked(map, key, value) {
  const v = String(value ?? '').trim();
  const nk = normKey(key);

  if (!v) {
    map.delete(nk);
    deleteAliases(map, key);
    return;
  }

  const existing = map.get(nk);
  map.set(nk, { key: existing?.key || String(key).trim(), value: v });
  deleteAliases(map, key);
}

function mapToPacked(map) {
  // Keep a stable order for the keys we care about, then append any extras.
  const canonicalOrder = [
    'Display name',
    'Bio',
    'Location',
    'Website URL',
    'Languages',
    'Category',
    'Niche',
    'Posting schedule',
    'Boundaries',
    'Style notes',
  ];

  const used = new Set();
  const parts = [];

  canonicalOrder.forEach((k) => {
    const nk = normKey(k);
    const it = map.get(nk);
    if (it && it.value) {
      parts.push(`${it.key}: ${it.value}`);
      used.add(nk);
    } else {
      // If canonical key missing, allow fallback aliases (e.g., Name -> Display name) once.
      const aliases = KEY_ALIASES[k] || [];
      for (const a of aliases) {
        const ai = map.get(normKey(a));
        if (ai && ai.value) {
          parts.push(`${k}: ${ai.value}`);
          used.add(normKey(a));
          break;
        }
      }
    }
  });

  // Append any remaining keys (don’t lose existing data you might add later).
  for (const [nk, it] of map.entries()) {
    if (used.has(nk)) continue;
    if (!it?.key || !it?.value) continue;
    parts.push(`${it.key}: ${it.value}`);
  }

  return parts.join(' | ');
}

async function ensureMe(force = false) {
  if (!force && __meCache) return __meCache;
  const me = await apiMe().catch(() => null);
  __meCache = me;

  // Keep app-wide caches in sync (app.js reads window.__tmMe)
  try { if (me && me.user) window.__tmMe = me.user; } catch (_) {}
  try { if (me && me.user) window.tmMeCache = me.user; } catch (_) {}

  return me;
}

function isDesktop() {
  return window.innerWidth > 1024;
}

function tmToast(title, icon = 'info') {
  try {
    if (window.Swal && typeof window.Swal.fire === 'function') {
      window.Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true,
        icon,
        title,
      });
      return;
    }
  } catch (_) {}
  // Fallback
  console.log(title);
}

function tmDispatchMeUpdated(detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent('tm:me-updated', { detail }));
  } catch (_) {}
}

async function tmPatchSettings(partialSettings = {}) {
  // Server-backed settings patch (merged server-side)
  const payload = { settings: partialSettings };

  const out = await apiPost('/api/me/settings', payload).catch(() => null);
  if (!out || !out.ok) {
    const msg = (out && (out.message || out.error)) ? (out.message || out.error) : 'Failed to save settings.';
    throw new Error(msg);
  }

  // Update local caches for cross-view consistency
  try {
    if (__meCache && __meCache.user) __meCache.user.settings = out.settings || __meCache.user.settings || {};
  } catch (_) {}

  try {
    if (window.__tmMe) window.__tmMe.settings = out.settings || window.__tmMe.settings || {};
  } catch (_) {}

  tmDispatchMeUpdated({ source: 'settings', reason: 'settings_saved' });

  return out.settings;
}


// ---------------- Profile photos (Avatar + Cover) ----------------
// Goal: allow selecting ANY image size/file-size, then auto-compress + crop client-side
// so we can safely store it in the backend (Firestore/Storage) without hitting limits.

function tmEstimateDataUrlBytes(dataUrl) {
  const s = String(dataUrl || '');
  const idx = s.indexOf(',');
  if (idx === -1) return 0;
  const b64 = s.slice(idx + 1);
  // base64 -> bytes (approx)
  return Math.floor((b64.length * 3) / 4);
}

function tmSetBg(el, dataUrl) {
  if (!el) return;
  const url = String(dataUrl || '').trim();
  if (!url) return;
  el.style.backgroundImage = `url("${url.replace(/"/g, '\"')}")`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
  el.style.backgroundRepeat = 'no-repeat';
}

function tmLoadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try { URL.revokeObjectURL(url); } catch {}
        resolve(img);
      };
      img.onerror = () => {
        try { URL.revokeObjectURL(url); } catch {}
        reject(new Error('Invalid image file'));
      };
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

function tmCropRectToAspect(w, h, aspect) {
  // Center-crop to requested aspect ratio.
  const cur = w / h;
  if (!aspect || aspect <= 0) return { sx: 0, sy: 0, sw: w, sh: h };

  if (cur > aspect) {
    // too wide
    const sh = h;
    const sw = Math.round(h * aspect);
    const sx = Math.round((w - sw) / 2);
    const sy = 0;
    return { sx, sy, sw, sh };
  }
  // too tall
  const sw = w;
  const sh = Math.round(w / aspect);
  const sx = 0;
  const sy = Math.round((h - sh) / 2);
  return { sx, sy, sw, sh };
}

function tmDataUrlFromCanvas(canvas, quality = 0.82) {
  try {
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    // Safari quirks fallback
    return canvas.toDataURL();
  }
}

async function tmCompressCropImageFile(file, opts = {}) {
  const {
    aspect = 1,
    maxW = 512,
    maxH = 512,
    maxBytes = 450 * 1024,
    qualityStart = 0.86
  } = opts;

  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Please select an image file.');
  }

  const img = await tmLoadImageFromFile(file);
  const w0 = img.naturalWidth || img.width || 0;
  const h0 = img.naturalHeight || img.height || 0;
  if (!w0 || !h0) throw new Error('Invalid image file');

  const crop = tmCropRectToAspect(w0, h0, aspect);

  // Fit crop region into maxW/maxH
  const scale = Math.min(1, maxW / crop.sw, maxH / crop.sh);
  let outW = Math.max(1, Math.round(crop.sw * scale));
  let outH = Math.max(1, Math.round(crop.sh * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Try iterative quality + (if needed) dimensional downscale
  let q = qualityStart;
  let tries = 0;

  while (tries < 10) {
    canvas.width = outW;
    canvas.height = outH;
    ctx.clearRect(0, 0, outW, outH);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outW, outH);

    const dataUrl = tmDataUrlFromCanvas(canvas, q);
    const bytes = tmEstimateDataUrlBytes(dataUrl);

    if (bytes && bytes <= maxBytes) return dataUrl;

    // First reduce quality, then reduce dimensions
    if (q > 0.58) q = Math.max(0.58, q - 0.08);
    else {
      outW = Math.max(320, Math.round(outW * 0.85));
      outH = Math.max(320, Math.round(outH * 0.85));
    }

    tries += 1;
  }

  // Final best-effort output
  canvas.width = outW;
  canvas.height = outH;
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outW, outH);
  return tmDataUrlFromCanvas(canvas, q);
}

async function tmUploadProfilePhoto(kind, dataUrl) {
  const payload = kind === 'cover'
    ? { headerDataUrl: dataUrl }
    : { avatarDataUrl: dataUrl };

  const out = await apiPost('/api/me/profile', payload).catch(() => null);
  if (!out?.ok) throw new Error(out?.message || out?.error || 'Upload failed');

  // Force-refresh cached me
  __meCache = null;
  await ensureMe(true);
    tmDispatchMeUpdated({ reason: 'photo', kind });

tmDispatchMeUpdated({ source: 'settings', reason: 'photo', kind });

  return out;
}

function bindCreatorProfilePhotos(container, me) {
  if (!container || container.__tmPhotosBound) return;
  container.__tmPhotosBound = true;

  const coverPreview = container.querySelector('[data-role="profile-cover-preview"]');
  const avatarPreview = container.querySelector('[data-role="profile-avatar-preview"]');

  const coverPick = container.querySelector('[data-action="pick-cover"]');
  const avatarPick = container.querySelector('[data-action="pick-avatar"]');

  const coverInput = container.querySelector('input[type="file"][data-role="profile-cover-input"]');
  const avatarInput = container.querySelector('input[type="file"][data-role="profile-avatar-input"]');

  // Hydrate existing images
  const u = me?.user || {};
  if (avatarPreview && u.avatarUrl) avatarPreview.src = u.avatarUrl;
  if (coverPreview && u.headerUrl) tmSetBg(coverPreview, u.headerUrl);

  const setBusy = (on) => {
    if (coverPick) coverPick.style.opacity = on ? '0.55' : '0.8';
    if (avatarPick) avatarPick.style.opacity = on ? '0.55' : '1';
    if (coverPick) coverPick.style.pointerEvents = on ? 'none' : 'auto';
    if (avatarPick) avatarPick.style.pointerEvents = on ? 'none' : 'auto';
  };

  const openCover = () => coverInput && coverInput.click();
  const openAvatar = () => avatarInput && avatarInput.click();

  if (coverPick) coverPick.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openCover(); });
  if (avatarPick) avatarPick.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openAvatar(); });

  if (coverInput) {
    coverInput.addEventListener('change', async () => {
      const f = coverInput.files && coverInput.files[0];
      coverInput.value = '';
      if (!f) return;

      try {
        setBusy(true);
        tmToast('Uploading cover...', 'info');

        const dataUrl = await tmCompressCropImageFile(f, {
          aspect: 3,        // 3:1 cover
          maxW: 1500,
          maxH: 500,
          maxBytes: 650 * 1024,
          qualityStart: 0.86
        });

        // Instant preview
        if (coverPreview) tmSetBg(coverPreview, dataUrl);

        await tmUploadProfilePhoto('cover', dataUrl);

        // Update shared UI (sidebar + profile header if visible)
        try {
          const me2 = await ensureMe(true);
          const hdr = me2?.user?.headerUrl || dataUrl;
          tmSetBg(document.querySelector('#view-my-profile .profile-header-bg'), hdr);
        } catch {}

        tmToast('Cover photo saved', 'success');
      } catch (e) {
        console.error(e);
        tmToast(e?.message || 'Unable to upload cover photo', 'error');
      } finally {
        setBusy(false);
      }
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', async () => {
      const f = avatarInput.files && avatarInput.files[0];
      avatarInput.value = '';
      if (!f) return;

      try {
        setBusy(true);
        tmToast('Uploading photo...', 'info');

        const dataUrl = await tmCompressCropImageFile(f, {
          aspect: 1,
          maxW: 512,
          maxH: 512,
          maxBytes: 450 * 1024,
          qualityStart: 0.86
        });

        if (avatarPreview) avatarPreview.src = dataUrl;

        await tmUploadProfilePhoto('avatar', dataUrl);

        // Update shared UI (sidebar + profile header if visible)
        try {
          const me2 = await ensureMe(true);
          const av = me2?.user?.avatarUrl || dataUrl;
          const side = document.getElementById('creatorProfileAvatar');
          if (side) side.src = av;
          const big = document.querySelector('#view-my-profile .profile-avatar-main');
          if (big) big.src = av;
        } catch {}

        tmToast('Profile photo saved', 'success');
      } catch (e) {
        console.error(e);
        tmToast(e?.message || 'Unable to upload profile photo', 'error');
      } finally {
        setBusy(false);
      }
    });
  }
}

function tmTimeAgo(ts) {
  const t = parseInt(String(ts || '0'), 10);
  if (!t || !isFinite(t)) return 'just now';
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function tmUserKey(u) {
  const email = String(u?.email || '').trim().toLowerCase();
  if (email) return `e:${email}`;
  const handle = String(u?.handle || '').trim().replace(/^@/, '').toLowerCase();
  if (handle) return `h:${handle}`;
  const name = String(u?.name || '').trim().toLowerCase();
  if (name) return `n:${name}`;
  return '';
}

function tmLoadUsers(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function tmSaveUsers(storageKey, arr) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.isArray(arr) ? arr : []));
  } catch {}
}

function tmRemoveUserByKey(storageKey, userKey) {
  try {
    const arr = tmLoadUsers(storageKey);
    const next = arr.filter(x => tmUserKey(x) !== userKey);
    tmSaveUsers(storageKey, next);
    return { before: arr.length, after: next.length };
  } catch {
    return { before: 0, after: 0 };
  }
}


function bindDisplayControls(container) {
  if (!container) return;

  const themeToggle = container.querySelector('#setting-theme-toggle');
  if (themeToggle && !themeToggle.__tmBound) {
    themeToggle.__tmBound = true;

    // Sync initial state from body class
    themeToggle.checked = document.body.classList.contains('tm-dark');

    themeToggle.addEventListener('change', () => {
      const on = !!themeToggle.checked;

      document.body.classList.toggle('tm-dark', on);
      document.body.classList.toggle('tm-light', !on);

      // Sync any global theme toggle if present
      try {
        if (DOM?.themeToggle) DOM.themeToggle.checked = on;
      } catch (_) {}

      // Persist (optional)
      try { localStorage.setItem('tm_theme', on ? 'dark' : 'light'); } catch (_) {}
    });
  }

  const langSelect = container.querySelector('#settings-lang-select');
  if (langSelect && !langSelect.__tmBound) {
    langSelect.__tmBound = true;

    // Restore saved language (if any)
    try {
      const saved = localStorage.getItem('tm_lang');
      if (saved) langSelect.value = saved;
    } catch (_) {}

    langSelect.addEventListener('change', () => {
      try { localStorage.setItem('tm_lang', langSelect.value); } catch (_) {}
      tmToast('Language saved. Refresh to apply.', 'success');
    });
  }
}

function bindSecurityControls(container) {
  if (!container) return;

  // Password inputs are inside the SECURITY section and appear in this order:
  // 1) current, 2) new, 3) confirm
  const pwdInputs = Array.from(container.querySelectorAll('input[type="password"]'));
  if (pwdInputs.length >= 1) {
    pwdInputs.forEach((input) => {
      const wrap = input.closest('.input-with-icon');
      const icon = wrap ? wrap.querySelector('i.fa-eye, i.fa-eye-slash, i.fa-regular') : null;
      if (!icon || icon.__tmBound) return;
      icon.__tmBound = true;
      icon.style.cursor = 'pointer';
      icon.addEventListener('click', () => {
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        icon.classList.toggle('fa-eye', isPwd);
        icon.classList.toggle('fa-eye-slash', !isPwd);
      });
    });
  }

  const btn = container.querySelector('.btn-submit-card');
  if (btn && !btn.__tmBound) {
    btn.__tmBound = true;
    btn.addEventListener('click', async () => {
      const cur = (pwdInputs[0] ? pwdInputs[0].value : '').toString();
      const nxt = (pwdInputs[1] ? pwdInputs[1].value : '').toString();
      const cnf = (pwdInputs[2] ? pwdInputs[2].value : '').toString();

      if (!nxt || nxt.trim().length < 8) {
        tmToast('New password must be at least 8 characters.', 'error');
        return;
      }
      if (nxt !== cnf) {
        tmToast('New password and confirm password do not match.', 'error');
        return;
      }

      const orig = btn.textContent;
      btn.disabled = true;
      btn.classList.add('loading');
      btn.textContent = 'UPDATING...';

      try {
        const out = await apiPost('/api/me/password', { currentPassword: cur, newPassword: nxt }).catch(() => null);
        if (!out || !out.ok) {
          const msg = (out && (out.message || out.error)) ? (out.message || out.error) : 'Failed to update password.';
          // Map common server codes to readable text
          const pretty = (msg === 'wrong_password') ? 'Current password is wrong.' :
                         (msg === 'password_too_short') ? 'New password must be at least 8 characters.' :
                         msg;
          tmToast(pretty, 'error');
          return;
        }

        // Clear fields
        pwdInputs.forEach((i) => { try { i.value = ''; } catch (_) {} });
        tmToast('Password updated.', 'success');
      } catch (e) {
        console.error(e);
        tmToast('Failed to update password. Please try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.textContent = orig;
      }
    });
  }
  // --- Two-Factor Authentication (server-backed flag; still a "demo" feature UX-wise) ---
  try {
    const hdrs = Array.from(container.querySelectorAll('.set-section-header'));
    const twofaHdr = hdrs.find(h => String(h.textContent || '').toLowerCase().includes('two-factor'));
    if (twofaHdr) {
      const row = twofaHdr.nextElementSibling;
      const cb = row ? row.querySelector('input[type="checkbox"]') : null;
      if (cb && !cb.__tmBound) {
        cb.__tmBound = true;

        const KEY = 'tm_2fa_enabled';

        // hydrate (prefer server)
        const serverVal = (me && me.user && me.user.settings && me.user.settings.security && typeof me.user.settings.security.twoFactorEnabled === 'boolean')
          ? me.user.settings.security.twoFactorEnabled
          : null;

        if (serverVal !== null) {
          cb.checked = !!serverVal;
          try { localStorage.setItem(KEY, cb.checked ? '1' : '0'); } catch (_) {}
        } else {
          let saved = null;
          try { saved = localStorage.getItem(KEY); } catch (_) {}
          cb.checked = (saved === '1' || saved === 'true');
        }

        cb.addEventListener('change', async () => {
          const on = !!cb.checked;
          cb.disabled = true;

          try {
            await tmPatchSettings({ security: { twoFactorEnabled: on } });
            try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (_) {}

            // UX note: this is still demo until you implement OTP / authenticator flow.
            tmToast(on ? 'Two-factor enabled.' : 'Two-factor disabled.', 'success');
          } catch (e) {
            console.error(e);
            cb.checked = !on; // revert
            tmToast(e?.message || 'Failed to save two-factor setting.', 'error');
          } finally {
            cb.disabled = false;
          }
        });
      }
    }
  } catch (_) {}

  // --- Login Activity (client-only display) ---
  try {
    const hdrs = Array.from(container.querySelectorAll('.set-section-header'));
    const loginHdr = hdrs.find(h => String(h.textContent || '').toLowerCase().includes('login activity'));
    if (loginHdr) {
      const row = loginHdr.nextElementSibling;
      const small = row ? row.querySelector('small') : null;
      if (small) {
        const ua = String(navigator.userAgent || '');
        const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
        const device = isMobile ? 'Mobile' : 'Desktop';

        let lastSeen = 0;
        try { lastSeen = parseInt(localStorage.getItem('tm_last_seen') || '0', 10) || 0; } catch (_) {}
        try { localStorage.setItem('tm_last_seen', String(Date.now())); } catch (_) {}

        const lastTxt = lastSeen ? tmTimeAgo(lastSeen) : 'just now';
        small.textContent = `Active now • ${device} • last seen ${lastTxt}`;
      }
    }
  } catch (_) {}

}

function bindPrivacyControls(container, me) {
  if (!container) return;

  const toggles = Array.from(container.querySelectorAll('.toggle-row input[type="checkbox"]'));
  const KEY_ACTIVITY = 'tm_priv_show_activity_status';
  const KEY_OFFERS = 'tm_priv_show_sub_offers';

  function lsGet(key, defVal) {
    try {
      const v = localStorage.getItem(key);
      if (v === null || v === undefined) return defVal;
      return (v === '1' || v === 'true');
    } catch {
      return defVal;
    }
  }

  function lsSet(key, on) {
    try { localStorage.setItem(key, on ? '1' : '0'); } catch {}
  }

  const sPriv = (me && me.user && me.user.settings && me.user.settings.privacy) ? me.user.settings.privacy : {};
  const serverActivity = (typeof sPriv.showActivityStatus === 'boolean') ? sPriv.showActivityStatus : null;
  const serverOffers = (typeof sPriv.showSubscriptionOffers === 'boolean') ? sPriv.showSubscriptionOffers : null;

  // Toggle #1: Activity Status (server-backed)
  if (toggles[0] && !toggles[0].__tmBound) {
    const cb = toggles[0];
    cb.__tmBound = true;

    const initial = (serverActivity !== null) ? !!serverActivity : lsGet(KEY_ACTIVITY, true);
    cb.checked = initial;
    lsSet(KEY_ACTIVITY, initial);

    cb.addEventListener('change', async () => {
      const on = !!cb.checked;
      cb.disabled = true;

      try {
        await tmPatchSettings({ privacy: { showActivityStatus: on } });
        lsSet(KEY_ACTIVITY, on);
        tmToast(on ? 'Activity status is ON.' : 'Activity status is OFF.', 'success');
      } catch (e) {
        console.error(e);
        cb.checked = !on; // revert
        tmToast(e?.message || 'Failed to save privacy setting.', 'error');
      } finally {
        cb.disabled = false;
      }
    });
  }

  // Toggle #2: Subscription Offers (server-backed)
  if (toggles[1] && !toggles[1].__tmBound) {
    const cb = toggles[1];
    cb.__tmBound = true;

    const initial = (serverOffers !== null) ? !!serverOffers : lsGet(KEY_OFFERS, true);
    cb.checked = initial;
    lsSet(KEY_OFFERS, initial);

    cb.addEventListener('change', async () => {
      const on = !!cb.checked;
      cb.disabled = true;

      try {
        await tmPatchSettings({ privacy: { showSubscriptionOffers: on } });
        lsSet(KEY_OFFERS, on);
        tmToast(on ? 'Subscription offers are ON.' : 'Subscription offers are OFF.', 'success');
      } catch (e) {
        console.error(e);
        cb.checked = !on; // revert
        tmToast(e?.message || 'Failed to save privacy setting.', 'error');
      } finally {
        cb.disabled = false;
      }
    });
  }

  // Blocked / Restricted rows -> modal list (localStorage)
  const rows = Array.from(container.querySelectorAll('.set-link-row'));

  function findRow(labelText) {
    const want = String(labelText || '').trim().toLowerCase();
    return rows.find(r => {
      const s = r.querySelector('span');
      const t = String(s ? s.textContent : r.textContent || '').trim().toLowerCase();
      return t == want;
    });
  }

  function buildUserRowHTML(u, actionLabel) {
    const name = String(u?.name || '').trim() || 'User';
    const handle = String(u?.handle || '').trim();
    const email = String(u?.email || '').trim();
    const avatar = String(u?.avatarUrl || u?.avatar || '').trim();
    const ts = u?.ts || 0;
    const key = tmUserKey(u);

    const sub = handle ? `@${handle.replace(/^@/, '')}` : (email || '');
    const when = ts ? tmTimeAgo(ts) : '';

    const av = avatar
      ? `<img src="${avatar}" alt="" style="width:40px;height:40px;border-radius:12px;object-fit:cover;" />`
      : `<div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:var(--muted);font-weight:800;">${name.slice(0,1).toUpperCase()}</div>`;

    return `
      <div class="tm-ul-row" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          ${av}
          <div style="display:flex;flex-direction:column;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;min-width:0;">
              <span style="font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</span>
              ${u?.verified ? '<span style="font-size:0.75rem;color:#46e85e;">✓</span>' : ''}
            </div>
            <small style="color:var(--muted);font-size:0.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}${when ? ' • ' + when : ''}</small>
          </div>
        </div>
        <button data-ul-action="remove" data-ul-key="${key}" style="background:transparent;border:1px solid rgba(255,255,255,0.22);color:var(--text);padding:7px 12px;border-radius:999px;font-weight:800;font-size:0.8rem;cursor:pointer;white-space:nowrap;">${actionLabel}</button>
      </div>
    `;
  }

  function openListModal(title, storageKey, actionLabel) {
    if (!window.Swal || typeof window.Swal.fire !== 'function') {
      alert('Swal (SweetAlert2) is required for this modal.');
      return;
    }

    window.Swal.fire({
      title,
      html: `<div id="tm-ul-wrap" style="text-align:left;"></div>`,
      background: '#0d1423',
      color: '#fff',
      width: 520,
      confirmButtonText: 'Close',
      confirmButtonColor: '#64E9EE',
      showCloseButton: true,
      didOpen: () => {
        const wrap = window.Swal.getHtmlContainer().querySelector('#tm-ul-wrap');

        const rerender = () => {
          const users = tmLoadUsers(storageKey)
            .filter(u => tmUserKey(u))
            .sort((a,b) => (b.ts || 0) - (a.ts || 0));

          if (!users.length) {
            wrap.innerHTML = `
              <div style="padding:14px 6px;color:var(--muted);">
                No users yet.
              </div>
            `;
            return;
          }

          wrap.innerHTML = users.map(u => buildUserRowHTML(u, actionLabel)).join('');

          wrap.querySelectorAll('button[data-ul-action="remove"]').forEach((btn) => {
            if (btn.__tmBound) return;
            btn.__tmBound = true;
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const k = btn.getAttribute('data-ul-key') || '';
              if (!k) return;
              tmRemoveUserByKey(storageKey, k);
              rerender();
              tmToast(`${actionLabel} successful.`, 'success');
            });
          });
        };

        rerender();
      }
    });
  }

  const blockedRow = findRow('Blocked Users');
  if (blockedRow && !blockedRow.__tmBound) {
    blockedRow.__tmBound = true;
    blockedRow.style.cursor = 'pointer';
    blockedRow.addEventListener('click', () => openListModal('Blocked Users', 'tm_blocked_users', 'Unblock'));
  }

  const restrictedRow = findRow('Restricted Users');
  if (restrictedRow && !restrictedRow.__tmBound) {
    restrictedRow.__tmBound = true;
    restrictedRow.style.cursor = 'pointer';
    restrictedRow.addEventListener('click', () => openListModal('Restricted Users', 'tm_restricted_users', 'Unrestrict'));
  }
}





function bindNotificationsControls(container, me) {
  if (!container) return;

  const toggles = Array.from(container.querySelectorAll('.toggle-row input[type="checkbox"]'));
  // Expected order in settings.html:
  // 0 = New Subscriber (Push)
  // 1 = Tips (Push)
  // 2 = Messages (Push)
  // 3 = New Login (Email)
  const KEYS = [
    { lsKey: 'tm_notif_push_new_subscriber', serverKey: 'pushNewSubscriber', labelOn: 'Push: New Subscriber ON.', labelOff: 'Push: New Subscriber OFF.', isPush: true },
    { lsKey: 'tm_notif_push_tips', serverKey: 'pushTips', labelOn: 'Push: Tips ON.', labelOff: 'Push: Tips OFF.', isPush: true },
    { lsKey: 'tm_notif_push_messages', serverKey: 'pushMessages', labelOn: 'Push: Messages ON.', labelOff: 'Push: Messages OFF.', isPush: true },
    { lsKey: 'tm_notif_email_new_login', serverKey: 'emailNewLogin', labelOn: 'Email: New Login ON.', labelOff: 'Email: New Login OFF.', isPush: false },
  ];

  function lsGetBool(key, defVal) {
    try {
      const v = localStorage.getItem(key);
      if (v === null || v === undefined) return defVal;
      return (v === '1' || v === 'true');
    } catch {
      return defVal;
    }
  }

  function lsSetBool(key, on) {
    try { localStorage.setItem(key, on ? '1' : '0'); } catch {}
  }

  function getServerBool(serverKey) {
    const n = (me && me.user && me.user.settings && me.user.settings.notifications) ? me.user.settings.notifications : null;
    const v = n ? n[serverKey] : undefined;
    return (typeof v === 'boolean') ? v : null;
  }

  function syncGlobalCache() {
    const out = {};
    KEYS.forEach((it) => { out[it.lsKey] = lsGetBool(it.lsKey, true); });
    window.__tmNotificationSettings = out;
    try { localStorage.setItem('tm_notification_settings', JSON.stringify(out)); } catch {}
  }

  async function ensurePushPermission() {
    if (!('Notification' in window)) return true;

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    try {
      const p = await Notification.requestPermission();
      return p === 'granted';
    } catch {
      return false;
    }
  }

  KEYS.forEach((meta, idx) => {
    const cb = toggles[idx];
    if (!cb || cb.__tmBound) return;

    cb.__tmBound = true;

    // hydrate (prefer server)
    const serverVal = getServerBool(meta.serverKey);
    const initial = (serverVal !== null) ? !!serverVal : lsGetBool(meta.lsKey, true);
    cb.checked = initial;
    lsSetBool(meta.lsKey, initial);

    cb.addEventListener('change', async () => {
      let on = !!cb.checked;

      cb.disabled = true;

      try {
        if (meta.isPush && on) {
          const ok = await ensurePushPermission();
          if (!ok) {
            cb.checked = false;
            on = false;
            throw new Error('Push notifications are blocked. Enable notifications for this site in your browser settings.');
          }
        }

        await tmPatchSettings({ notifications: { [meta.serverKey]: on } });

        lsSetBool(meta.lsKey, on);
        syncGlobalCache();
        tmToast(on ? meta.labelOn : meta.labelOff, 'success');
      } catch (e) {
        console.error(e);
        cb.checked = !on; // revert
        tmToast(e?.message || 'Failed to save notification setting.', 'error');
      } finally {
        cb.disabled = false;
      }
    });
  });

  syncGlobalCache();
}




function setActiveMenuItem(el) {
  document.querySelectorAll('.set-item.active').forEach((x) => x.classList.remove('active'));
  if (el) el.classList.add('active');
}

function getMenuUsernameEl() {
  return document.querySelector('#view-settings .set-group-title');
}

function getMobileDetailHost() {
  let host = document.getElementById('settings-mobile-detail');
  if (!host) {
    host = document.createElement('div');
    host.id = 'settings-mobile-detail';
    host.className = 'settings-mobile-detail hidden';
    host.setAttribute('aria-hidden', 'true');
    const view = document.getElementById('view-settings');
    if (view) view.appendChild(host);
    else document.body.appendChild(host);
  }
  return host;
}

function closeMobileDetail() {
  const host = document.getElementById('settings-mobile-detail');
  if (!host) return;

  host.classList.remove('is-open');
  host.setAttribute('aria-hidden', 'true');

  // Hide after transition
  window.setTimeout(() => {
    host.classList.add('hidden');
    host.innerHTML = '';
  }, 240);
}

function openMobileDetail(target, me) {
  const host = getMobileDetailHost();
  const src = document.getElementById(`set-content-${target}-source`);
  if (!src) return;

  host.innerHTML = '';
  host.classList.remove('hidden');
  host.setAttribute('aria-hidden', 'false');

  const clone = src.cloneNode(true);
  clone.id = `set-content-${target}-mobile`;

  // Make sure anything that was hidden in the source becomes visible in the clone.
  clone.querySelectorAll('.hidden').forEach((n) => n.classList.remove('hidden'));

  // Inject a back button into the section header on mobile.
  const header = clone.querySelector('.rs-col-header');
  if (header) {
    header.classList.add('tm-mobile-detail-header');
    if (!header.querySelector('.tm-mobile-back')) {
      const back = document.createElement('i');
      back.className = 'fa-solid fa-arrow-left tm-mobile-back';
      back.title = 'Back';
      back.addEventListener('click', closeMobileDetail);
      header.insertBefore(back, header.firstChild);
    }
  }

  host.appendChild(clone);

  // Hydrate
  if (target === 'profile') hydrateCreatorProfileForm(clone, me);
  if (target === 'display') bindDisplayControls(clone, me);
  if (target === 'security') bindSecurityControls(clone, me);
  if (target === 'privacy') bindPrivacyControls(clone, me);
  if (target === 'notifications') bindNotificationsControls(clone, me);
  if (target === 'account') bindAccountControls(clone, me);

  // Slide in
  requestAnimationFrame(() => host.classList.add('is-open'));
}

function renderSettingsTargetDesktop(target, me) {
  if (!DOM?.rsSettingsView) return;

  const src = document.getElementById(`set-content-${target}-source`);
  DOM.rsSettingsView.innerHTML = '';
  if (!src) return;

  const clone = src.cloneNode(true);
  clone.id = `set-content-${target}`;
  clone.classList.remove('hidden');
  clone.querySelectorAll('.hidden').forEach((n) => n.classList.remove('hidden'));
  DOM.rsSettingsView.appendChild(clone);

  if (target === 'profile') hydrateCreatorProfileForm(clone, me);
  if (target === 'display') bindDisplayControls(clone, me);
  if (target === 'security') bindSecurityControls(clone, me);
  if (target === 'privacy') bindPrivacyControls(clone, me);
  if (target === 'notifications') bindNotificationsControls(clone, me);
  if (target === 'account') bindAccountControls(clone, me);
}

function bindMetaCounter(fieldEl) {
  const group = fieldEl?.closest?.('.ac-group');
  if (!group) return;

  // Prefer the plain counter badge used in some fields (e.g., Display Name, Bio)
  const simple = group.querySelector('.char-count');
  // Or the meta row (used in Style Notes)
  const meta = group.querySelector('.field-meta span:last-child');

  const maxAttr = fieldEl.getAttribute('maxlength');
  const max = maxAttr ? (parseInt(maxAttr, 10) || null) : null;

  const update = () => {
    const len = String(fieldEl.value || '').length;
    const txt = max ? `${len}/${max}` : `${len}`;
    if (simple) simple.textContent = txt;
    if (meta) meta.textContent = txt;
  };

  fieldEl.addEventListener('input', update);
  update();
}

function hydrateCreatorProfileForm(container, me) {
  const packed = me?.user?.creatorApplication?.contentStyle || '';
  const map = parsePacked(packed);

  container.querySelectorAll('[data-creator-key]').forEach((el) => {
    const key = el.getAttribute('data-creator-key');
    if (!key) return;

    const val = getPackedAny(map, key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = val || '';
      bindMetaCounter(el);
    }
  });

  const btn = container.querySelector('[data-action="save-profile"]');
  if (btn && !btn.__tmBound) {
    btn.__tmBound = true;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.classList.add('loading');
      try {
        await saveCreatorProfile(container);
        tmToast('Profile saved.', 'success');
        tmDispatchMeUpdated({ source: 'settings', reason: 'creator_profile' });
      } catch (e) {
        console.error(e);
        alert(e?.message || 'Failed to save. Please try again.');
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });
  }

  try { bindCreatorProfilePhotos(container, me); } catch (e) { console.warn('Photo bind error:', e); }
}

async function saveCreatorProfile(container) {
  const me = await ensureMe(true);
  if (!me?.ok) throw new Error('Not logged in');

  const prevPacked = me?.user?.creatorApplication?.contentStyle || '';
  const map = parsePacked(prevPacked);

  container.querySelectorAll('[data-creator-key]').forEach((el) => {
    const key = el.getAttribute('data-creator-key');
    if (!key) return;
    setPacked(map, key, (el.value ?? '').toString());
  });

  const nextPacked = mapToPacked(map);

  const out = await apiPost('/api/me/creator/profile', { contentStyle: nextPacked }).catch(() => null);
  if (!out?.ok) throw new Error(out?.error || 'Save failed');

  __meCache = null;
  await ensureMe(true);  tmDispatchMeUpdated({ reason: 'creator_profile' });

}


function bindAccountControls(container, me) {
  if (!container) return;

  const groups = Array.from(container.querySelectorAll('.ac-group'));

  const getInput = (labelText) => {
    const want = String(labelText || '').trim().toLowerCase();
    const g = groups.find((x) => {
      const lab = x.querySelector('label');
      const t = String(lab ? lab.textContent : '').trim().toLowerCase();
      return t === want;
    });
    return g ? g.querySelector('input') : null;
  };

  const inUsername = getInput('Username');
  const inEmail = getInput('Email');
  const inPhone = getInput('Phone Number');

  const curUsername = String(me?.user?.username || me?.user?.handle || '').replace(/^@/, '');
  const curEmail = String(me?.user?.email || '');
  const curPhone = String(me?.user?.phone || me?.user?.phoneNumber || me?.user?.phone_number || '');

  if (inUsername && !inUsername.__tmHydrated) {
    inUsername.__tmHydrated = true;
    inUsername.value = curUsername || '';
    inUsername.setAttribute('autocomplete', 'username');
    inUsername.addEventListener('input', () => {
      // hard trim spaces only
      inUsername.value = String(inUsername.value || '').replace(/\s+/g, '');
    });
  } else if (inUsername) {
    inUsername.value = curUsername || '';
  }

  if (inEmail && !inEmail.__tmHydrated) {
    inEmail.__tmHydrated = true;
    inEmail.value = curEmail || '';
    inEmail.setAttribute('autocomplete', 'email');
  } else if (inEmail) {
    inEmail.value = curEmail || '';
  }

  if (inPhone && !inPhone.__tmHydrated) {
    inPhone.__tmHydrated = true;
    inPhone.value = curPhone || '';
    inPhone.setAttribute('autocomplete', 'tel');
  } else if (inPhone) {
    inPhone.value = curPhone || '';
  }

  // Insert a SAVE button (settings.html does not include one for Account section)
  const hasSave = !!container.querySelector('[data-action="save-account"]');
  if (!hasSave) {
    const headers = Array.from(container.querySelectorAll('.set-section-header'));
    const deleteHdr = headers.find((h) => String(h.textContent || '').toLowerCase().includes('delete account'));

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'flex-end';
    row.style.marginTop = '16px';
    row.style.marginBottom = '6px';

    const btn = document.createElement('button');
    btn.className = 'btn-submit-card';
    btn.textContent = 'SAVE CHANGES';
    btn.setAttribute('data-action', 'save-account');
    btn.style.width = 'auto';
    btn.style.minWidth = 'auto';
    btn.style.padding = '10px 26px';
    btn.style.fontSize = '0.9rem';

    row.appendChild(btn);

    if (deleteHdr && deleteHdr.parentNode) {
      deleteHdr.parentNode.insertBefore(row, deleteHdr);
    } else {
      container.appendChild(row);
    }
  }

  const saveBtn = container.querySelector('[data-action="save-account"]');
  if (saveBtn && !saveBtn.__tmBound) {
    saveBtn.__tmBound = true;

    saveBtn.addEventListener('click', async () => {
      const nextUsernameRaw = String(inUsername ? inUsername.value : '').trim().replace(/^@/, '');
      const nextEmailRaw = String(inEmail ? inEmail.value : '').trim().toLowerCase();
      const nextPhoneRaw = String(inPhone ? inPhone.value : '').trim();

      // Basic client validation (server validates again)
      if (nextUsernameRaw) {
        const okLen = (nextUsernameRaw.length >= 3 && nextUsernameRaw.length <= 30);
        const okChars = /^[a-zA-Z0-9._]+$/.test(nextUsernameRaw);
        if (!okLen || !okChars) {
          tmToast('Username must be 3–30 chars (letters, numbers, dot, underscore).', 'error');
          return;
        }
      }

      if (nextEmailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmailRaw)) {
        tmToast('Please enter a valid email.', 'error');
        return;
      }

      const payload = {};
      // Update only what user actually typed (avoid overwriting with blanks)
      if (nextUsernameRaw && nextUsernameRaw !== String(curUsername || '')) payload.username = nextUsernameRaw;
      if (nextEmailRaw && nextEmailRaw !== String(curEmail || '').toLowerCase()) payload.email = nextEmailRaw;
      if (nextPhoneRaw && nextPhoneRaw !== String(curPhone || '')) payload.phone = nextPhoneRaw;

      if (!Object.keys(payload).length) {
        tmToast('No changes to save.', 'info');
        return;
      }

      const orig = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.classList.add('loading');
      saveBtn.textContent = 'SAVING...';

      try {
        const out = await apiPost('/api/me/profile', payload).catch(() => null);
        if (!out || !out.ok) {
          const msg = (out && (out.message || out.error)) ? (out.message || out.error) : 'Failed to update account.';
          const pretty =
            (msg === 'invalid email') ? 'Invalid email.' :
            (msg === 'invalid username') ? 'Invalid username.' :
            (msg === 'invalid phone') ? 'Invalid phone number.' :
            msg;
          tmToast(pretty, 'error');
          return;
        }

        __meCache = null;
        const meFresh = await ensureMe(true);

        // Update menu username immediately
        const handle =
          meFresh?.user?.creatorApplication?.handle ||
          meFresh?.user?.username ||
          meFresh?.user?.handle ||
          '';
        const u = getMenuUsernameEl();
        if (u) u.textContent = `@${(handle || 'username').replace(/^@/, '')}`;

        tmToast('Account updated.', 'success');
        tmDispatchMeUpdated({ reason: 'account' });
        tmDispatchMeUpdated({ source: 'settings', reason: 'account' });
      } catch (e) {
        console.error(e);
        tmToast('Failed to update account. Please try again.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.classList.remove('loading');
        saveBtn.textContent = orig;
      }
    });
  }

  
  // Linked Accounts (Google / Twitter)
  const linkRows = Array.from(container.querySelectorAll('.set-link-row'));
  if (linkRows.length) {
    const getProviderFromRow = (row) => {
      const t = (row.textContent || '').toLowerCase();
      if (t.includes('google')) return 'google';
      if (t.includes('twitter')) return 'twitter';
      return '';
    };

    const getActionSpan = (row) => {
      const spans = row.querySelectorAll('span');
      return spans && spans.length ? spans[spans.length - 1] : null;
    };

    const getLinked = () => (me && me.user && (me.user.linkedAccounts || me.user.linked_accounts)) || {};

    const refreshRow = (row) => {
      const provider = getProviderFromRow(row);
      const action = getActionSpan(row);
      if (!provider || !action) return;

      const linked = getLinked() || {};
      const entry = linked[provider] || null;
      const connected = !!entry;

      action.textContent = connected ? 'Disconnect' : 'Connect';

      // Non-invasive UI hint
      row.setAttribute('data-connected', connected ? '1' : '0');
      if (connected && entry && entry.value) {
        row.title = `Connected: ${entry.value}`;
      } else {
        row.title = '';
      }
    };

    // Initialize UI
    linkRows.forEach(refreshRow);

    // Bind actions
    linkRows.forEach((row) => {
      const provider = getProviderFromRow(row);
      const action = getActionSpan(row);
      if (!provider || !action) return;

      if (action.__tmBound) return;
      action.__tmBound = true;

      action.style.cursor = 'pointer';

      action.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const linked = getLinked() || {};
        const entry = linked[provider] || null;
        const connected = !!entry;

        if (!window.Swal || typeof window.Swal.fire !== 'function') {
          // Fallback
          if (connected) {
            if (!confirm(`Disconnect ${provider}?`)) return;
            const r = await apiPost('/api/me/linked-accounts/disconnect', { provider }).catch(() => null);
            if (!r || !r.ok) return tmToast('Failed to disconnect.', 'error');
          } else {
            const v = prompt(provider === 'google' ? 'Enter your Google email' : 'Enter your Twitter handle (@handle)');
            if (v === null) return;
            const r = await apiPost('/api/me/linked-accounts/connect', { provider, value: String(v || '').trim() }).catch(() => null);
            if (!r || !r.ok) return tmToast('Failed to connect.', 'error');
            if (r.linkedAccounts) {
              me.user.linkedAccounts = r.linkedAccounts;
            }
          }
          refreshRow(row);
          return;
        }

        if (connected) {
          const out = await window.Swal.fire({
            icon: 'warning',
            title: `Disconnect ${provider}?`,
            text: 'You can connect again later.',
            showCancelButton: true,
            confirmButtonText: 'Disconnect',
            cancelButtonText: 'Cancel'
          });

          if (!out.isConfirmed) return;

          const r = await apiPost('/api/me/linked-accounts/disconnect', { provider }).catch(() => null);
          if (!r || !r.ok) return tmToast('Failed to disconnect.', 'error');

          // Update local cache
          const next = { ...(me.user.linkedAccounts || {}) };
          delete next[provider];
          me.user.linkedAccounts = next;

          tmToast('Disconnected.', 'success');
          refreshRow(row);
          return;
        }

        // Connect flow (manual value for now)
        const out = await window.Swal.fire({
          icon: 'info',
          title: provider === 'google' ? 'Connect Google' : 'Connect Twitter',
          input: 'text',
          inputLabel: provider === 'google' ? 'Google email' : 'Twitter handle',
          inputPlaceholder: provider === 'google' ? 'you@gmail.com' : '@yourhandle',
          showCancelButton: true,
          confirmButtonText: 'Connect',
          cancelButtonText: 'Cancel',
          inputValidator: (v) => {
            const val = String(v || '').trim();
            if (!val) return 'This field is required.';
            if (provider === 'google') {
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email.';
            } else {
              const h = val.replace(/^@/, '');
              if (!/^[a-zA-Z0-9_]{1,15}$/.test(h)) return 'Invalid handle.';
            }
            return null;
          }
        });

        if (!out.isConfirmed) return;

        const value = String(out.value || '').trim();
        const r = await apiPost('/api/me/linked-accounts/connect', { provider, value }).catch(() => null);
        if (!r || !r.ok) return tmToast('Failed to connect.', 'error');

        if (r.linkedAccounts) {
          me.user.linkedAccounts = r.linkedAccounts;
        } else {
          me.user.linkedAccounts = { ...(me.user.linkedAccounts || {}), [provider]: { value, connectedAt: new Date().toISOString() } };
        }

        tmToast('Connected.', 'success');
        refreshRow(row);
      });
    });
  }

  // Delete account button (REAL DB delete)
  const delBtn = container.querySelector('.btn-delete-account');
  if (delBtn && !delBtn.__tmBound) {
    delBtn.__tmBound = true;
    delBtn.addEventListener('click', async () => {
      if (!window.Swal || typeof window.Swal.fire !== 'function') {
        alert('SweetAlert2 is required for Delete Account confirmation.');
        return;
      }

      const out = await window.Swal.fire({
        icon: 'warning',
        title: 'Delete account?',
        html: `
          <div style="text-align:left">
            <div style="margin-bottom:6px">This will permanently delete your account and sign you out.</div>
            <div style="margin-bottom:6px"><b>Type DELETE</b> to confirm.</div>
          </div>
        `,
        input: 'text',
        inputPlaceholder: 'DELETE',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        inputValidator: (v) => {
          const val = String(v || '').trim().toUpperCase();
          if (val !== 'DELETE') return 'You must type DELETE to confirm.';
          return null;
        }
      });

      if (!out.isConfirmed) return;

      delBtn.disabled = true;

      const r = await apiPost('/api/me/delete-account', { confirm: 'DELETE' }).catch(() => null);
      if (!r || !r.ok) {
        delBtn.disabled = false;
        return tmToast('Delete failed. Try again.', 'error');
      }

      tmToast('Account deleted.', 'success');

      // Redirect to landing (cookie is cleared server-side)
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    });
  }

}

 function initSettings() {
  (async () => {
    const me = await ensureMe(true);

    // Update username placeholder in settings menu
    const handle =
      me?.user?.creatorApplication?.handle ||
      me?.user?.username ||
      me?.user?.handle ||
      me?.user?.creatorHandle ||
      '';
    const u = getMenuUsernameEl();
    if (u) u.textContent = `@${(handle || 'username').replace(/^@/, '')}`;

    // Bind clicks on settings menu items
    document.querySelectorAll('#view-settings .set-item').forEach((el) => {
      el.addEventListener('click', async () => {
        const target = el.getAttribute('data-target');
        if (!target) return;

        setActiveMenuItem(el);
        const meFresh = await ensureMe(true);

        if (isDesktop()) {
          renderSettingsTargetDesktop(target, meFresh);
        } else {
          openMobileDetail(target, meFresh);
        }
      });
    });

    // Default: open Profile in desktop right panel
    const first = document.querySelector('#view-settings .set-item[data-target="profile"]') ||
                  document.querySelector('#view-settings .set-item');
    setActiveMenuItem(first);

    if (isDesktop()) {
      renderSettingsTargetDesktop('profile', me);
    }

    // Expose a global close so app.js can close the detail view when switching views
    window.__tmCloseSettingsMobileDetail = closeMobileDetail;

    // Close detail if viewport becomes desktop
    window.addEventListener('resize', () => {
      if (isDesktop()) closeMobileDetail();
    });
  })().catch((e) => console.error('initSettings error', e));
}

  return { initSettings };
})();

// ===== profile.js (bundled) =====
const __CreatorsProfile = (function() {
  const { DOM } = __CreatorsDOM;
  const { DEFAULT_AVATAR } = __CreatorsData;

// NOTE:
// - Creator posts are backend-first (Firestore) via /api/creator/posts.
// - Comments + reactions are server-first (best-effort) via /api/creator/posts/react|comment|comments,
//   with safe localStorage fallback if the routes are missing (404) or temporarily unavailable.

// Emojis for the input tray
const QUICK_EMOJIS = ["😀", "😂", "😍", "🔥", "😭", "🥰", "👍", "🙏", "👀", "💯", "🍑", "🍆", "💸", "😡", "🤡", "🎉"];

// Backend-first interaction endpoints (best-effort; fallback to local if 404/disabled)
const POST_REACT_ENDPOINT = '/api/creator/posts/react';
const POST_COMMENT_ENDPOINT = '/api/creator/posts/comment';
const POST_COMMENTS_ENDPOINT = '/api/creator/posts/comments';

// ------------------------------
// Helpers (identity for profile posts)
// ------------------------------
function tmNormalizeHandle(h) {
    const s = String(h || '').trim();
    if (!s) return '@username';
    return s.startsWith('@') ? s : '@' + s;
}

function tmGetProfileIdentityFromDOM() {
    const nameEl = document.getElementById('creatorHeaderName') || document.getElementById('creatorProfileName') || document.getElementById('creatorPopoverName');
    const handleEl = document.getElementById('creatorHeaderHandle') || document.getElementById('creatorProfileHandle') || document.getElementById('creatorPopoverHandle');
    const avatarEl = document.querySelector('#view-my-profile .profile-avatar-main') || document.getElementById('creatorProfileAvatar');

    const name = (nameEl?.textContent || '').trim() || 'Your Name';
    const handle = tmNormalizeHandle((handleEl?.textContent || '').trim() || '@username');
    const avatarUrl = (avatarEl?.getAttribute?.('src') || '').trim() || DEFAULT_AVATAR;

    // For now, keep verified aligned with the UI badge (existing design shows check icon)
    return { name, handle, avatarUrl, verified: true };
}

function tmGetProfilePostIdentity(post, fallback) {
    const fb = fallback || tmGetProfileIdentityFromDOM();

    const name = String(post?.creatorName || post?.authorName || post?.name || '').trim() || fb.name || 'Your Name';
    const handleRaw = String(post?.creatorHandle || post?.authorHandle || post?.handle || '').trim() || fb.handle || '@username';
    const handle = tmNormalizeHandle(handleRaw);
    const avatarUrl = String(post?.creatorAvatarUrl || post?.authorAvatarUrl || post?.avatarUrl || post?.avatar || '').trim() || fb.avatarUrl || DEFAULT_AVATAR;
    const verified = (post?.creatorVerified === undefined || post?.creatorVerified === null) ? (fb.verified !== false) : !!post.creatorVerified;

    return { name, handle, avatarUrl, verified };
}

 function initProfilePage() {
    // 1. Setup Listeners
    setupProfileFeedInteractions();
    setupProfileTabs();
    setupProfileHeaderActions();

    setupProfileLiveSync();

    // 2. Load Content
    tmHydrateProfileHeader().catch(() => {});
    tmHydrateProfileAvatar().catch(() => {});
    // async-safe
    renderProfilePosts().catch(() => {});
    renderProfileMedia();
}

function setupProfileLiveSync() {
    const root = document.getElementById('view-my-profile');
    if (!root) return;
    if (root.dataset.liveSyncBound === '1') return;
    root.dataset.liveSyncBound = '1';

    // When Settings (or any other view) updates /api/me, we refresh profile UI instantly.
    const onMeUpdated = () => {
        tmHydrateProfileHeader().catch(() => {});
        tmHydrateProfileAvatar().catch(() => {});
    };
    // tm-session.js dispatches on window; keep document listener too for compatibility.
    window.addEventListener('tm:me-updated', onMeUpdated);
    document.addEventListener('tm:me-updated', onMeUpdated);
}

function tmGuessAvatarFromMe(me) {
    try {
        const direct =
            me?.avatarUrl ||
            me?.avatar ||
            me?.profilePhotoUrl ||
            me?.profilePhoto ||
            me?.photoURL ||
            me?.photoUrl ||
            me?.profilePicture ||
            me?.picture ||
            me?.creatorApplication?.avatarUrl ||
            me?.creatorApplication?.profilePhotoUrl ||
            me?.creatorApplication?.profilePhoto;

        const u = String(direct || '').trim();
        return u || '';
    } catch (_) {
        return '';
    }
}

function tmApplyProfileAvatar(url) {
    const u = String(url || '').trim();
    if (!u) return;

    const els = [
        document.querySelector('#view-my-profile .profile-avatar-main'),
        document.getElementById('creatorProfileAvatar')
    ].filter(Boolean);

    for (const el of els) {
        try {
            if (el.getAttribute && el.getAttribute('src') === u) continue;
            el.setAttribute ? el.setAttribute('src', u) : (el.src = u);
        } catch (_) {}
    }

    try {
        if (DOM?.profileAvatar) DOM.profileAvatar.src = u;
    } catch (_) {}
}

async function tmHydrateProfileAvatar() {
    const me = await tmGetMeSafe();
    const u = tmGuessAvatarFromMe(me);
    if (!u) return;
    tmApplyProfileAvatar(u);
}

async function tmHydrateProfileHeader() {
    const me = await tmGetMeSafe();
    const email = String(me?.email || '').toLowerCase().trim();

    const packed = String(me?.creatorApplication?.contentStyle || tmReadLocalPacked(email) || '').trim();
    const name = (
        tmGetPacked(packed, 'Display name') ||
        tmGetPacked(packed, 'Name') ||
        String(me?.name || '').trim() ||
        (document.getElementById('creatorHeaderName')?.textContent || '').trim() ||
        'Your Name'
    );

    const bio = (
        tmGetPacked(packed, 'Bio') ||
        String(me?.creatorApplication?.bio || '').trim() ||
        ''
    );

    const status = (
        tmGetPacked(packed, 'Status') ||
        tmReadLocalStatus(email) ||
        'Available'
    );

    // Apply
    tmApplyProfileName(name);
    tmApplyProfileBio(bio);
    tmApplyProfileStatus(status);

    // Handle fallback (if blank)
    const handleEl = document.getElementById('creatorHeaderHandle');
    if (handleEl && !(handleEl.textContent || '').trim()) {
        const guess = email ? '@' + email.split('@')[0] : '@username';
        handleEl.textContent = guess;
    }
}

// ------------------------------
// Profile header actions (Edit)
// ------------------------------

function setupProfileHeaderActions() {
    const btnEdit = document.getElementById('btn-edit-profile');
    const editAlreadyBound = !!(btnEdit && btnEdit.dataset.bound === '1');
    if (btnEdit) btnEdit.dataset.bound = '1';

    // Edit Profile → edits Display name + Bio (backend-first, safe local fallback)
    if (btnEdit && !editAlreadyBound) {
        btnEdit.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const me = await tmGetMeSafe();
            const email = String(me?.email || '').toLowerCase().trim();

            // Pull from packed creatorApplication.contentStyle (preferred)
            const packed = String(me?.creatorApplication?.contentStyle || tmReadLocalPacked(email) || '').trim();
            const currentName = (
                tmGetPacked(packed, 'Display name') ||
                tmGetPacked(packed, 'Name') ||
                (document.getElementById('creatorHeaderName')?.textContent || '').trim() ||
                (me?.name || '').trim() ||
                'Your Name'
            );

            const bioFromPacked = tmGetPacked(packed, 'Bio');
            const bioFromUI = (document.querySelector('#view-my-profile .profile-bio-text')?.textContent || '').trim();
            const currentBio = (bioFromPacked || '').trim() || (bioFromUI.includes('No bio yet') ? '' : bioFromUI);

            const { value: form } = await Swal.fire({
                title: 'Edit Profile',
                background: '#0d1423',
                color: '#fff',
                confirmButtonText: 'Save',
                showCancelButton: true,
                focusConfirm: false,
                html: `
                    <div style="text-align:left;">
                      <label style="display:block; margin: 6px 0 6px; font-weight:700;">Display name</label>
                      <input id="tm-edit-display" class="swal2-input" style="width:100%; margin:0;" value="${tmEscapeAttr(currentName)}" placeholder="Your name">

                      <label style="display:block; margin: 12px 0 6px; font-weight:700;">Bio</label>
                      <textarea id="tm-edit-bio" class="swal2-textarea" style="width:100%; min-height: 110px; margin:0;" placeholder="Write a short bio...">${tmEscapeHtml(currentBio)}</textarea>

                      <div style="margin-top:10px; font-size:12px; color: rgba(255,255,255,0.65); line-height:1.4;">
                        Tip: Keep it short and clear. You can update anytime.
                      </div>
                    </div>
                `,
                preConfirm: () => {
                    const nameEl = document.getElementById('tm-edit-display');
                    const bioEl = document.getElementById('tm-edit-bio');
                    const nextName = (nameEl?.value || '').trim();
                    const nextBio = (bioEl?.value || '').trim();
                    if (!nextName) {
                        Swal.showValidationMessage('Display name is required');
                        return null;
                    }
                    return { nextName, nextBio };
                }
            });

            if (!form) return;

            const nextName = String(form.nextName || '').trim();
            const nextBio = String(form.nextBio || '').trim();

            let nextPacked = packed || '';
            nextPacked = tmSetPacked(nextPacked, 'Display name', nextName);
            nextPacked = tmSetPacked(nextPacked, 'Bio', nextBio);

            try {
                // Backend save (preferred)
                const saved = await tmSaveCreatorProfilePacked(nextPacked);
                nextPacked = saved || nextPacked;

                // Sync local cache
                try {
                    if (window.__tmMe) {
                        window.__tmMe.creatorApplication = window.__tmMe.creatorApplication || {};
                        window.__tmMe.creatorApplication.contentStyle = nextPacked;
                    }
                } catch (_) {}

                // Update UI
                tmApplyProfileName(nextName);
                tmApplyProfileBio(nextBio);
                if (email) tmWriteLocalPacked(email, nextPacked);

                tmToastOk('Saved');
            } catch (err) {
                // Safe local fallback (doesn't break UX)
                if (email) tmWriteLocalPacked(email, nextPacked);
                tmApplyProfileName(nextName);
                tmApplyProfileBio(nextBio);
                tmToastErr(err?.message || 'Saved locally (server unavailable)');
            }
        });
    }

    // Share profile (basic)
    const btnShare = document.getElementById('btn-profile-share');
    if (btnShare && btnShare.dataset.bound !== '1') {
        btnShare.dataset.bound = '1';
        btnShare.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const me = await tmGetMeSafe();
            const email = String(me?.email || '').trim();
            const identity = tmGetProfileIdentityFromDOM();

            // Use a shareable URL that doesn't require a dedicated route yet.
            const shareUrl = `${window.location.origin}${window.location.pathname}?creator=${encodeURIComponent(email || identity.handle || '')}`;
            const shareText = `Check my creator profile: ${identity.name} (${identity.handle})`;

            // Native share if available
            if (navigator.share) {
                try {
                    await navigator.share({ title: 'Creator Profile', text: shareText, url: shareUrl });
                    return;
                } catch (_) {
                    // fall through to copy
                }
            }

            const ok = await tmCopyToClipboard(shareUrl);
            if (ok) tmToastOk('Link copied');
            else tmToastErr('Unable to copy');
        });
    }

    // Status dropdown (Available / Busy / Away / Offline)
    const statusTrigger = document.getElementById('profile-status-trigger');
    if (statusTrigger && statusTrigger.dataset.bound !== '1') {
        statusTrigger.dataset.bound = '1';
        statusTrigger.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const me = await tmGetMeSafe();
            const email = String(me?.email || '').toLowerCase().trim();
            const packed = String(me?.creatorApplication?.contentStyle || tmReadLocalPacked(email) || '').trim();
            const current = (tmGetPacked(packed, 'Status') || tmReadLocalStatus(email) || 'Available').trim();

            const { value } = await Swal.fire({
                title: 'Set status',
                background: '#0d1423',
                color: '#fff',
                showCancelButton: true,
                confirmButtonText: 'Save',
                input: 'select',
                inputValue: current,
                inputOptions: {
                    'Available': 'Available',
                    'Busy': 'Busy',
                    'Away': 'Away',
                    'Offline': 'Offline'
                }
            });

            if (!value) return;
            const nextStatus = String(value || '').trim() || 'Available';

            let nextPacked = packed || '';
            nextPacked = tmSetPacked(nextPacked, 'Status', nextStatus);

            try {
                const saved = await tmSaveCreatorProfilePacked(nextPacked);
                nextPacked = saved || nextPacked;
                try {
                    if (window.__tmMe) {
                        window.__tmMe.creatorApplication = window.__tmMe.creatorApplication || {};
                        window.__tmMe.creatorApplication.contentStyle = nextPacked;
                    }
                } catch (_) {}

                tmWriteLocalPacked(email, nextPacked);
                tmWriteLocalStatus(email, nextStatus);
                tmApplyProfileStatus(nextStatus);
                tmToastOk('Saved');
            } catch (err) {
                tmWriteLocalStatus(email, nextStatus);
                tmApplyProfileStatus(nextStatus);
                tmToastErr(err?.message || 'Saved locally (server unavailable)');
            }
        });
    }

    // Back button fallback (if not bound elsewhere)
    const back = document.getElementById('profile-back-btn');
    if (back && back.dataset.bound !== '1') {
        back.dataset.bound = '1';
        back.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('nav-link-home')?.click();
        });
    }
}

// ------------------------------
// Tabs switching (Posts/Media)
// ------------------------------
function setupProfileTabs() {
    const root = document.getElementById('view-my-profile');
    if (root && root.dataset.tabsBound === '1') return;
    if (root) root.dataset.tabsBound = '1';
    const pick = (...candidates) => {
        for (const c of candidates) {
            const el = (c && (c[0] === '#' || c[0] === '.' || c[0] === '['))
                ? document.querySelector(c)
                : document.getElementById(c);
            if (el) return el;
        }
        return null;
    };

    // Support multiple ID conventions to avoid “dead click” when HTML IDs differ.
    const btnPosts = pick('profile-tab-posts', 'tab-profile-posts', '[data-profile-tab="posts"]', '[data-tab="posts"]');
    const btnMedia = pick('profile-tab-media', 'tab-profile-media', '[data-profile-tab="media"]', '[data-tab="media"]');
    const viewPosts = pick('profile-content-posts', 'profile-panel-posts', '[data-profile-panel="posts"]', '[data-panel="posts"]');
    const viewMedia = pick('profile-content-media', 'profile-panel-media', '[data-profile-panel="media"]', '[data-panel="media"]');

    if (!btnPosts || !btnMedia || !viewPosts || !viewMedia) return;

    btnPosts.addEventListener('click', () => {
        btnPosts.classList.add('active');
        btnMedia.classList.remove('active');
        viewPosts.style.display = 'block';
        viewMedia.style.display = 'none';
    });

    btnMedia.addEventListener('click', () => {
        btnMedia.classList.add('active');
        btnPosts.classList.remove('active');
        viewMedia.style.display = 'block';
        viewPosts.style.display = 'none';
    });
}

// ------------------------------
// Render Posts (NOW BACKEND-FIRST)
// ------------------------------
async function renderProfilePosts() {
    const container = document.getElementById('profile-content-posts');
    if (!container) return;

    // Loading state
    container.innerHTML = `
        <div class="rs-col-empty" style="margin-top:40px; text-align:center; color:var(--muted);">
            <div class="empty-icon-wrap" style="margin: 0 auto 14px; width:60px; height:60px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <i class="fa-solid fa-spinner" style="font-size:1.35rem; animation: spin 1s linear infinite;"></i>
            </div>
            <span>Loading your posts…</span>
        </div>
        <style>@keyframes spin{to{transform:rotate(360deg);}}</style>
    `;

    let posts = [];
    try {
        const data = await tmFetchCreatorPostsMine(50);
        posts = Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
        container.innerHTML = `
            <div class="rs-col-empty" style="margin-top:40px; text-align:center; color:var(--muted);">
                <div class="empty-icon-wrap" style="margin: 0 auto 14px; width:60px; height:60px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:1.35rem;"></i>
                </div>
                <span>${tmEscapeHtml(err?.message || 'Unable to load posts')}</span>
            </div>
        `;
        return;
    }

    if (!posts.length) {
        container.innerHTML = `
            <div class="rs-col-empty" style="margin-top:50px; text-align:center; color:var(--muted);">
                 <div class="empty-icon-wrap" style="margin: 0 auto 15px; width:60px; height:60px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-regular fa-folder-open" style="font-size:1.5rem;"></i>
                 </div>
                 <span>No posts yet</span>
            </div>`;
        return;
    }

    container.innerHTML = '';

    const fallbackIdentity = tmGetProfileIdentityFromDOM();

    posts
      .slice()
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .forEach(post => {
        const postId = String(post?.id || '').trim();
        const timeAgo = getTimeAgo(post.timestamp || Date.now());
        const identity = tmGetProfilePostIdentity(post, fallbackIdentity);
        const displayName = tmEscapeHtml(identity.name || 'Your Name');
        const displayHandle = tmEscapeHtml(identity.handle || '@username');
        const avatarUrl = tmEscapeAttr(identity.avatarUrl || DEFAULT_AVATAR);
        const verifiedIcon = identity.verified ? `<i class="fa-solid fa-circle-check" style="color:var(--primary-cyan); font-size:0.8rem; margin-left: 5px;"></i>` : '';
        const safePostText = tmEscapeHtml(post.text || '');
        const localReaction = tmReadLocalReaction(postId);
        const serverReaction = tmGuessServerReaction(post);
        const effectiveReaction = (serverReaction !== undefined) ? (String(serverReaction || '').trim()) : (String(localReaction || '').trim());

        const serverCount = tmGuessServerReactionCount(post);
        const effectiveCount = (serverCount != null) ? serverCount : (effectiveReaction ? 1 : 0);

        const likeCountText = tmLikesText(effectiveCount);
        const mainIconHtml = tmRenderMainReactionIcon(effectiveReaction);

        let commentsHTML = '';
        const savedComments = tmLoadComments(postId);
        if (savedComments.length > 0) {
            savedComments.forEach(c => { commentsHTML += createCommentHTML(c); });
        }

        const html = `
            <div class="post-card" id="profile-post-${tmEscapeAttr(postId)}" data-id="${tmEscapeAttr(postId)}" data-comments-loaded="0" style="margin-bottom: 20px; border: var(--border); border-radius: 16px; background: var(--card-bg); padding: 0; overflow: visible;">
                <div class="post-header" style="padding: 15px 20px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${avatarUrl}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(100,233,238,0.25);" />
                        <div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <div style="font-weight: 800; font-size: 1rem; color: var(--text);">
                                    ${displayName}${verifiedIcon}
                                </div>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--muted);">${displayHandle} · ${timeAgo}</div>
                        </div>
                    </div>
                    <div class="post-menu-wrapper" style="position: relative;">
                        <button class="post-menu-btn action-menu" style="background:none; border:none; color:var(--muted); font-size:1.1rem; cursor:pointer; padding:8px; border-radius:10px;">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                        <div class="post-menu-dropdown" style="display:none; position:absolute; right:0; top:40px; background: rgba(16, 26, 46, 0.98); border: 1px solid rgba(255,255,255,0.10); border-radius: 12px; overflow:hidden; min-width: 180px; z-index: 50; box-shadow: 0 20px 50px rgba(0,0,0,0.55);">
                            <button class="dropdown-item action-delete" style="width:100%; text-align:left; padding:12px 14px; background:none; border:none; color:#ff6b81; cursor:pointer; display:flex; align-items:center; gap:10px;">
                                <i class="fa-regular fa-trash-can"></i> Delete post
                            </button>
                        </div>
                    </div>
                </div>

                <div class="post-body" style="padding: 0 20px 10px;">
                    <div class="post-text" style="font-size: 1rem; line-height: 1.5; color: var(--text); white-space: pre-wrap;">${safePostText}</div>
                </div>

                <div class="post-actions" style="padding: 6px 20px 2px; display:flex; align-items:center; justify-content:space-between; color: var(--muted);">
                    <div style="display:flex; align-items:center; gap:18px;">
                        <div class="reaction-wrapper" style="padding: 5px 0;">
                             ${mainIconHtml}
                        </div>
                        <i class="fa-regular fa-comment action-comment" style="cursor:pointer; transition:0.2s;"></i>
                        <i class="fa-regular fa-paper-plane action-share" style="cursor:pointer; transition:0.2s;"></i>
                    </div>
                    <div class="action-bookmark" style="cursor:pointer;">
                        <i class="fa-regular fa-bookmark"></i>
                    </div>
                </div>
                
                <div class="post-likes-count" style="padding: 0 20px 10px; font-size: 0.9rem; font-weight: 700; color: var(--text);">${likeCountText}</div>

                <div class="post-comments" style="padding: 0 20px 18px;">
                    <div class="comments-list" style="margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px;">
                        ${commentsHTML}
                        <div class="no-comments-msg" style="text-align: center; font-size: 0.85rem; color: var(--muted); ${savedComments.length > 0 ? 'display:none;' : ''}">No comments yet</div>
                    </div>
                    <div class="comment-input-wrapper" style="display:flex; flex-direction:column; gap:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <input class="comment-input" placeholder="Write a comment..." style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 12px; color: var(--text); outline: none;">
                            <button class="comment-submit action-submit-comment" style="background: var(--primary-cyan); color: #001011; border: none; border-radius: 12px; padding: 10px 14px; font-weight: 800; cursor:pointer;">Post</button>
                        </div>
                        <div class="emoji-tray" style="display:flex; flex-wrap:wrap; gap:8px; padding: 2px 2px;">
                            ${QUICK_EMOJIS.map(e => `<button class="emoji-btn" data-emoji="${tmEscapeAttr(e)}" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); color:#fff; border-radius:10px; padding:6px 10px; cursor:pointer; font-size:14px;">${tmEscapeHtml(e)}</button>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="reaction-popup" style="display:none; position:absolute; bottom: 68px; left: 20px; background: rgba(16, 26, 46, 0.98); border:1px solid rgba(255,255,255,0.10); border-radius: 14px; padding: 10px 12px; z-index: 80; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="reaction-option" data-reaction="like" title="Like" style="font-size:18px; cursor:pointer;">👍</span>
                        <span class="reaction-option" data-reaction="love" title="Love" style="font-size:18px; cursor:pointer;">❤️</span>
                        <span class="reaction-option" data-reaction="haha" title="Haha" style="font-size:18px; cursor:pointer;">😂</span>
                        <span class="reaction-option" data-reaction="wow" title="Wow" style="font-size:18px; cursor:pointer;">😮</span>
                        <span class="reaction-option" data-reaction="sad" title="Sad" style="font-size:18px; cursor:pointer;">😢</span>
                        <span class="reaction-option" data-reaction="angry" title="Angry" style="font-size:18px; cursor:pointer;">😡</span>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', html);
    });
}

// ------------------------------
// Interactions: menu, reactions, comments
// ------------------------------
function setupProfileFeedInteractions() {
    const container = document.getElementById('view-my-profile');
    if (!container || container.dataset.bound === '1') return;
    container.dataset.bound = '1';    // Close any open menus/popup if user taps outside (bind once)
    if (!window.__tmProfileDocCloseBound) {
        window.__tmProfileDocCloseBound = true;
        document.addEventListener('click', () => {
            document.querySelectorAll('.post-menu-dropdown').forEach(m => m.style.display = 'none');
            document.querySelectorAll('.reaction-popup').forEach(p => p.style.display = 'none');
        });
    }
container.addEventListener('click', async (e) => {
        const target = e.target;

        const postCard = target.closest('.post-card');
        if (!postCard) return;
        const postId = postCard.dataset.id;

        // Menu toggle
        if (target.closest('.action-menu')) {
            e.preventDefault();
            e.stopPropagation();
            const menu = postCard.querySelector('.post-menu-dropdown');
            if (!menu) return;
            const isOpen = menu.style.display === 'block';
            document.querySelectorAll('.post-menu-dropdown').forEach(m => m.style.display = 'none');
            menu.style.display = isOpen ? 'none' : 'block';
            return;
        }

        // Delete
        if (target.closest('.action-delete')) {
            Swal.fire({
                title: 'Delete Post?', text: "Cannot be undone.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ff4757', confirmButtonText: 'Delete', background: '#0d1423', color: '#fff'
            }).then((result) => {
                if (result.isConfirmed) {
                    tmDeleteCreatorPost(postId)
                      .then(() => {
                        // Cleanup UI-only state
                        tmClearLocalPostState(postId);
                        renderProfilePosts().catch(() => {});
                        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Deleted', showConfirmButton: false, timer: 3000, background: '#0d1423', color: '#fff' });
                      })
                      .catch((err) => {
                        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: err?.message || 'Unable to delete', showConfirmButton: false, timer: 3200, background: '#0d1423', color: '#fff' });
                      });
                }
            });
            return;
        }

        // Toggle comment input focus
        if (target.closest('.action-comment')) {
            const input = postCard.querySelector('.comment-input');
            input?.focus();
            // Best-effort: hydrate comments from server (if route exists)
            await tmEnsureCommentsLoaded(postCard, postId).catch(() => {});
            return;
        }

        // Submit comment
        if (target.closest('.action-submit-comment')) {
            submitComment(postCard, postId);
            return;
        }

        // Emoji insert
        const emojiBtn = target.closest('.emoji-btn');
        if (emojiBtn) {
            const emoji = emojiBtn.dataset.emoji || '';
            const input = postCard.querySelector('.comment-input');
            if (input) {
                const start = input.selectionStart || input.value.length;
                const end = input.selectionEnd || input.value.length;
                input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
                input.focus();
                input.selectionStart = input.selectionEnd = start + emoji.length;
            }
            return;
        }

        // Share (post) - simple copy
        if (target.closest('.action-share')) {
            e.preventDefault();
            e.stopPropagation();
            const url = `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(postId || '')}`;
            tmCopyToClipboard(url).then(ok => ok ? tmToastOk('Post link copied') : tmToastErr('Unable to copy'));
            return;
        }

        // Bookmark (UI-only)
        if (target.closest('.action-bookmark')) {
            e.preventDefault();
            e.stopPropagation();
            const icon = postCard.querySelector('.action-bookmark i');
            if (icon) {
                const isSaved = icon.classList.contains('fa-solid');
                icon.className = isSaved ? 'fa-regular fa-bookmark' : 'fa-solid fa-bookmark';
                tmToastOk(isSaved ? 'Removed' : 'Saved');
            }
            return;
        }

        // Reaction popup show on longpress-like click? Here: click on like icon to show popup (like in your original)
        if (target.closest('.action-like')) {
            e.preventDefault();
            e.stopPropagation();
            const popup = postCard.querySelector('.reaction-popup');
            if (!popup) return;
            const isOpen = popup.style.display === 'block';
            document.querySelectorAll('.reaction-popup').forEach(p => p.style.display = 'none');
            popup.style.display = isOpen ? 'none' : 'block';
            return;
        }

        // Reaction option select (server-first, fallback to local)
        const reactionOption = target.closest('.reaction-option');
        if (reactionOption) {
            const desired = String(reactionOption.dataset.reaction || '').trim() || null;
            const popup = postCard.querySelector('.reaction-popup');
            if (popup) popup.style.display = 'none';

            const mainIcon = postCard.querySelector('.main-like-btn');
            const likesCountDiv = postCard.querySelector('.post-likes-count');

            let finalReaction = desired;
            let finalCount = null;

            try {
                const resp = await tmSetPostReaction(postId, finalReaction);
                if (resp) {
                    const r = resp?.reaction ?? resp?.myReaction ?? resp?.post?.reaction ?? resp?.post?.myReaction ?? resp?.post?.reactionType;
                    if (r !== undefined) finalReaction = (r == null ? null : String(r).trim() || null);
                    const c = resp?.reactionCount ?? resp?.post?.reactionCount ?? resp?.post?.likes ?? resp?.post?.likeCount;
                    if (c !== undefined) {
                        const n = Number(c);
                        if (Number.isFinite(n)) finalCount = n;
                    }
                }
            } catch (_) {}

            if (finalCount == null) finalCount = finalReaction ? 1 : 0;

            // Update UI
            if (mainIcon) {
                if (!finalReaction) {
                    tmApplyReactionIcon(mainIcon, '');
                } else {
                    tmApplyReactionIcon(mainIcon, finalReaction);
                }
                mainIcon.style.transform = 'scale(1.4)';
                setTimeout(() => (mainIcon.style.transform = 'scale(1)'), 200);
            }
            if (likesCountDiv) likesCountDiv.innerText = tmLikesText(finalCount);

            // Cache (local fallback)
            tmWriteLocalReaction(postId, finalReaction || '');

            return;
        }

        // Main like toggle (server-first, fallback to local)
        if (target.closest('.main-like-btn')) {
            const icon = target.closest('.main-like-btn');
            const likesCountDiv = postCard.querySelector('.post-likes-count');

            // Determine current state
            const current = String(tmReadLocalReaction(postId) || '').trim();
            const desired = current ? null : 'like';

            let finalReaction = desired;
            let finalCount = null;

            try {
                const resp = await tmSetPostReaction(postId, finalReaction);
                if (resp) {
                    const r = resp?.reaction ?? resp?.myReaction ?? resp?.post?.reaction ?? resp?.post?.myReaction ?? resp?.post?.reactionType;
                    if (r !== undefined) finalReaction = (r == null ? null : String(r).trim() || null);
                    const c = resp?.reactionCount ?? resp?.post?.reactionCount ?? resp?.post?.likes ?? resp?.post?.likeCount;
                    if (c !== undefined) {
                        const n = Number(c);
                        if (Number.isFinite(n)) finalCount = n;
                    }
                }
            } catch (_) {}

            if (finalCount == null) finalCount = finalReaction ? 1 : 0;

            // Apply UI
            if (icon) {
                tmApplyReactionIcon(icon, finalReaction || '');
                icon.style.transform = 'scale(1.3)';
                setTimeout(() => (icon.style.transform = 'scale(1)'), 200);
            }
            if (likesCountDiv) likesCountDiv.innerText = tmLikesText(finalCount);

            tmWriteLocalReaction(postId, finalReaction || '');
            return;
        }
    });

    // Enter to submit comment
    container.addEventListener('keydown', (e) => {
        const input = e.target.closest('.comment-input');
        if (!input) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const postCard = input.closest('.post-card');
            const postId = postCard?.dataset?.id;
            if (postCard && postId) submitComment(postCard, postId);
        }
    });
}

async function submitComment(postCard, postId) {
    const input = postCard.querySelector('.comment-input');
    const list = postCard.querySelector('.comments-list');
    const empty = postCard.querySelector('.no-comments-msg');
    if (!input || !list) return;

    const text = String(input.value || '').trim();
    if (!text) return;

    if (empty) empty.style.display = 'none';

    const me = await tmGetMeSafe();
    const identity = tmGetProfileIdentityFromDOM();

    const authorName =
        String(identity?.name || '').trim() ||
        String(me?.name || me?.displayName || '').trim() ||
        'User';

    const authorEmail = String(me?.email || '').trim() || null;
    const authorHandle = String(identity?.handle || '').trim() || null;
    const authorAvatarUrl = String(identity?.avatarUrl || '').trim() || null;

    // Optimistic UI
    const clientTs = Date.now();
    const optimistic = {
        id: null,
        text,
        creatorName: authorName,
        creatorEmail: authorEmail,
        creatorHandle: authorHandle,
        creatorAvatarUrl: authorAvatarUrl,
        _local: true,
        timestamp: clientTs
    };

    list.insertAdjacentHTML('beforeend', createCommentHTML(optimistic));
    tmSaveComment(postId, text, optimistic);

    input.value = '';

    // Best-effort server save (if route exists)
    try {
        const resp = await tmAddPostComment(postId, text, {
            clientTs,
            authorName,
            authorEmail,
            authorHandle,
            authorAvatarUrl
        });

        const canonical = resp?.comment || resp?.item || resp?.data?.comment || null;
        if (canonical) tmMarkLocalCommentSynced(postId, clientTs, canonical);

        // Refresh comments once (brings cross-device state)
        if (resp) await tmEnsureCommentsLoaded(postCard, postId, true).catch(() => {});
    } catch (_) {}
}



function createCommentHTML(comment) {
    const obj = (comment && typeof comment === 'object' && !Array.isArray(comment)) ? comment : { text: String(comment || '') };
    const text = String(obj.text || '').trim();
    const safe = tmEscapeHtml(text);

    const email = String(obj.creatorEmail || obj.authorEmail || obj.email || '').trim();
    const handle = String(obj.creatorHandle || obj.authorHandle || obj.handle || '').trim();

    let author = String(obj.creatorName || obj.authorName || obj.name || obj.displayName || '').trim();
    if (!author) {
        if (handle) author = handle.startsWith('@') ? handle : '@' + handle;
        else if (email) author = email.split('@')[0];
        else author = 'Unknown';
    }

    const authorSafe = tmEscapeHtml(author);

    const avatarUrl = String(obj.creatorAvatarUrl || obj.authorAvatarUrl || obj.avatarUrl || obj.avatar || '').trim();
    const avatarBlock = avatarUrl
        ? `<img src="${tmEscapeAttr(avatarUrl)}" alt="" style="width:32px; height:32px; border-radius:50%; object-fit:cover; flex-shrink:0; border:1px solid rgba(255,255,255,0.12);">`
        : `<div style="width:32px; height:32px; border-radius:50%; background: rgba(255,255,255,0.10); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i class="fa-solid fa-user" style="font-size: 0.85rem; color: rgba(255,255,255,0.75);"></i>
           </div>`;

    return `
        <div class="comment-item" style="display:flex; gap:10px; align-items:flex-start;">
            ${avatarBlock}
            <div style="flex:1;">
                <div style="font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height:1.35;">
                    <span style="font-weight:800; color:#fff;">${authorSafe}</span> ${safe}
                </div>
            </div>
        </div>
    `;
}

// ------------------------------
// Media tab (existing prototype logic retained)
// ------------------------------
function renderProfileMedia() {
    const container = document.getElementById('profile-content-media');
    if (!container) return;

    const items = JSON.parse(localStorage.getItem('tm_uploaded_media') || '[]');

    if (!items.length) {
        container.innerHTML = `
            <div class="rs-col-empty" style="margin-top:50px; text-align:center; color:var(--muted);">
                 <div class="empty-icon-wrap" style="margin: 0 auto 15px; width:60px; height:60px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-regular fa-image" style="font-size:1.5rem;"></i>
                 </div>
                 <span>No media yet</span>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            ${items.map(m => `
                <div style="border-radius: 14px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);">
                    <img src="${tmEscapeAttr(m.url || '')}" style="width:100%; height: 110px; object-fit:cover; display:block;">
                </div>
            `).join('')}
        </div>
    `;
}

// ==========================================
// Backend (Creator posts)
// ==========================================

async function tmFetchCreatorPostsMine(limit = 50) {
    const url = `/api/creator/posts?limit=${encodeURIComponent(String(limit || 50))}`;
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.ok) {
        const msg = data?.error || data?.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return data;
}

async function tmDeleteCreatorPost(id) {
    const res = await fetch('/api/creator/posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: String(id || '') })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.ok) {
        const msg = data?.error || data?.message || `Unable to delete (${res.status})`;
        throw new Error(msg);
    }
    return true;
}

// ==========================================
// Backend-first interactions (Reactions + Comments)
// ==========================================

async function tmFetchJson(url, opts = {}) {
    try {
        const res = await fetch(url, { credentials: 'include', ...opts });
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        const data = isJson ? await res.json().catch(() => null) : null;
        return { res, data };
    } catch (_) {
        return { res: null, data: null };
    }
}

async function tmSetPostReaction(postId, reaction) {
    if (!postId) return null;

    const payload = { id: String(postId), reaction: reaction || null };
    const { res, data } = await tmFetchJson(POST_REACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res || res.status === 404) return null;
    if (data && data.ok) return data;
    return null;
}

async function tmAddPostComment(postId, text, meta = {}) {
    if (!postId || !text) return null;

    const payload = { id: String(postId), text: String(text) };
    try {
        const m = (meta && typeof meta === 'object') ? meta : {};
        if (m.clientTs != null) {
            const n = Number(m.clientTs);
            if (Number.isFinite(n)) payload.clientTs = n;
        }
        if (m.authorName) payload.authorName = String(m.authorName);
        if (m.authorEmail) payload.authorEmail = String(m.authorEmail);
        if (m.authorHandle) payload.authorHandle = String(m.authorHandle);
        if (m.authorAvatarUrl) payload.authorAvatarUrl = String(m.authorAvatarUrl);
    } catch (_) {}
    const { res, data } = await tmFetchJson(POST_COMMENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res || res.status === 404) return null;
    if (data && data.ok) return data;
    return null;
}

async function tmFetchPostComments(postId, limit = 50) {
    if (!postId) return null;

    const url = `${POST_COMMENTS_ENDPOINT}?id=${encodeURIComponent(String(postId))}&limit=${encodeURIComponent(String(limit || 50))}`;
    const { res, data } = await tmFetchJson(url, { method: 'GET' });

    if (!res || res.status === 404) return null;
    if (data && data.ok && Array.isArray(data.items)) return data.items;
    if (Array.isArray(data?.comments)) return data.comments;
    return null;
}

function tmNormalizeCommentItem(c) {
    const obj = (c && typeof c === 'object' && !Array.isArray(c)) ? c : { text: String(c || '') };
    return {
        id: obj.id || obj._id || obj.commentId || null,
        text: String(obj.text || '').trim(),
        timestamp: Number(obj.timestamp || obj.createdAtMs || obj.createdAt || Date.now()) || Date.now(),
        creatorEmail: obj.creatorEmail || obj.authorEmail || obj.email || null,
        creatorName: obj.creatorName || obj.authorName || obj.name || obj.displayName || null,
        creatorHandle: obj.creatorHandle || obj.authorHandle || obj.handle || null,
        creatorAvatarUrl: obj.creatorAvatarUrl || obj.authorAvatarUrl || obj.avatarUrl || obj.avatar || null,
        _local: !!obj._local,
    };
}

function tmMergeCommentItems(localComments, remoteComments) {
    const lc = Array.isArray(localComments) ? localComments : [];
    const rc = Array.isArray(remoteComments) ? remoteComments : [];
    if (!rc.length) return lc;

    const seen = new Set();
    const out = [];

    const keyOf = (x) => {
        const n = tmNormalizeCommentItem(x);
        if (!n.text) return null;
        return n.id ? `id:${String(n.id)}` : `t:${String(n.timestamp)}|${n.text}`;
    };

    // Remote first (authoritative)
    for (const c of rc) {
        const k = keyOf(c);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(tmNormalizeCommentItem(c));
    }

    // Keep local-only comments that haven't appeared on remote yet
    for (const c of lc) {
        const k = keyOf(c);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(tmNormalizeCommentItem(c));
    }

    // Oldest -> newest (like a normal thread)
    out.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return out;
}

async function tmEnsureCommentsLoaded(postCard, postId, force = false) {
    if (!postCard || !postId) return;

    const listEl = postCard.querySelector('.comments-list');
    const emptyEl = postCard.querySelector('.no-comments-msg');
    if (!listEl) return;

    if (!force && postCard.dataset.commentsLoaded === '1') return;

    const local = tmLoadComments(postId);

    let remote = null;
    try {
        remote = await tmFetchPostComments(postId, 50);
    } catch (_) {
        remote = null;
    }

    // If route doesn't exist yet (404) or network error, keep local-only for now
    if (remote == null) {
        return;
    }

    const merged = tmMergeCommentItems(local, remote);

    let html = '';
    for (const c of merged) html += createCommentHTML(c);

    listEl.innerHTML = html + (merged.length ? '' : `<div class="no-comments-msg" style="text-align: center; font-size: 0.85rem; color: var(--muted);">No comments yet</div>`);

    // Toggle empty label if it exists in this card layout
    const hasAny = merged.length > 0;
    if (emptyEl) emptyEl.style.display = hasAny ? 'none' : '';

    postCard.dataset.commentsLoaded = '1';
}


// ==========================================
// UI-only local state (comments + reactions)
// ==========================================

function tmCommentsKey(postId) {
    return `tm_creator_comments_${String(postId || '').trim()}`;
}

function tmReactionKey(postId) {
    return `tm_creator_reaction_${String(postId || '').trim()}`;
}

function tmLoadComments(postId) {
    try {
        const raw = localStorage.getItem(tmCommentsKey(postId)) || '[]';
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return [];
        return list
            .map((c) => {
                if (c && typeof c === 'object' && !Array.isArray(c)) {
                    return {
                        id: c.id || c._id || c.commentId || null,
                        text: String(c.text || '').trim(),
                        timestamp: Number(c.timestamp || c.createdAtMs || c.createdAt || Date.now()) || Date.now(),
                        creatorEmail: c.creatorEmail || c.authorEmail || c.email || null,
                        creatorName: c.creatorName || c.authorName || c.name || c.displayName || null,
                        creatorHandle: c.creatorHandle || c.authorHandle || c.handle || null,
                        creatorAvatarUrl: c.creatorAvatarUrl || c.authorAvatarUrl || c.avatarUrl || c.avatar || null,
                        _local: !!c._local,
                    };
                }
                return { text: String(c || '').trim(), timestamp: Date.now(), _local: true };
            })
            .filter((c) => !!c.text);
    } catch (_) {
        return [];
    }
}

function tmSaveComment(postId, text, meta = {}) {
    const t = String(text || '').trim();
    if (!t) return;

    const list = tmLoadComments(postId);

    const item = {
        id: meta?.id || null,
        text: t,
        timestamp: Number(meta?.timestamp || Date.now()) || Date.now(),
        creatorEmail: meta?.creatorEmail || meta?.authorEmail || meta?.email || null,
        creatorName: meta?.creatorName || meta?.authorName || meta?.name || meta?.displayName || null,
        creatorHandle: meta?.creatorHandle || meta?.authorHandle || meta?.handle || null,
        creatorAvatarUrl: meta?.creatorAvatarUrl || meta?.authorAvatarUrl || meta?.avatarUrl || meta?.avatar || null,
        _local: meta?._local !== false,
    };

    list.push(item);

    try { localStorage.setItem(tmCommentsKey(postId), JSON.stringify(list)); } catch (_) {}

function tmMarkLocalCommentSynced(postId, clientTs, canonical) {
    try {
        const ts = Number(clientTs);
        if (!Number.isFinite(ts)) return;

        const c = (canonical && typeof canonical === 'object') ? canonical : null;
        if (!c) return;

        const canonId = c.id || c._id || c.commentId || null;
        const canonTs = Number(c.timestamp || c.createdAtMs || c.createdAt || ts) || ts;
        const canonName = c.creatorName || c.authorName || c.name || c.displayName || null;
        const canonEmail = c.creatorEmail || c.authorEmail || c.email || null;
        const canonHandle = c.creatorHandle || c.authorHandle || c.handle || null;
        const canonAvatar = c.creatorAvatarUrl || c.authorAvatarUrl || c.avatarUrl || c.avatar || null;

        const list = tmLoadComments(postId);
        let changed = false;

        for (const item of list) {
            if (!item || typeof item !== 'object') continue;
            if ((Number(item.timestamp) || 0) !== ts) continue;

            if (canonId && !item.id) item.id = canonId;
            item.timestamp = canonTs;

            if (canonName) item.creatorName = canonName;
            if (canonEmail) item.creatorEmail = canonEmail;
            if (canonHandle) item.creatorHandle = canonHandle;
            if (canonAvatar) item.creatorAvatarUrl = canonAvatar;

            item._local = false;
            changed = true;
            break;
        }

        if (changed) {
            try { localStorage.setItem(tmCommentsKey(postId), JSON.stringify(list)); } catch (_) {}
        }
    } catch (_) {}
}

}

function tmReadLocalReaction(postId) {
    try {
        const v = String(localStorage.getItem(tmReactionKey(postId)) || '').trim();
        return v || '';
    } catch (_) {
        return '';
    }
}

function tmWriteLocalReaction(postId, reactionType) {
    try {
        const v = String(reactionType || '').trim();
        if (!v) localStorage.removeItem(tmReactionKey(postId));
        else localStorage.setItem(tmReactionKey(postId), v);
    } catch (_) {}
}

function tmClearLocalPostState(postId) {
    try { localStorage.removeItem(tmCommentsKey(postId)); } catch (_) {}
    try { localStorage.removeItem(tmReactionKey(postId)); } catch (_) {}
}


function tmLikesText(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num <= 0) return '0 Likes';
    if (num === 1) return '1 Like';
    return `${num} Likes`;
}

function tmGuessServerReaction(post) {
    try {
        if (!post || typeof post !== 'object') return undefined;
        // If any of these props exist, treat server as the source of truth (even if null).
        if ('myReaction' in post) return post.myReaction == null ? '' : String(post.myReaction || '').trim();
        if ('reaction' in post) return post.reaction == null ? '' : String(post.reaction || '').trim();
        if ('reactionType' in post) return post.reactionType == null ? '' : String(post.reactionType || '').trim();
        if ('creatorReaction' in post) return post.creatorReaction == null ? '' : String(post.creatorReaction || '').trim();
        return undefined;
    } catch (_) {
        return undefined;
    }
}

function tmGuessServerReactionCount(post) {
    try {
        const v =
            post?.reactionCount ??
            post?.likeCount ??
            post?.likes ??
            post?.likesCount ??
            post?.reactionsCount ??
            post?.reaction_count ??
            post?.like_count;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    } catch (_) {
        return null;
    }
}

function tmGetLikeUi(reactionType) {
    const rt = String(reactionType || '').trim();
    if (!rt) return { icon: 'fa-regular fa-thumbs-up', color: '' };

    switch (rt) {
        case 'love':
            return { icon: 'fa-solid fa-heart', color: '#ff4757' };
        case 'haha':
            return { icon: 'fa-solid fa-face-laugh-squint', color: '#f1c40f' };
        case 'wow':
            return { icon: 'fa-solid fa-face-surprise', color: '#f1c40f' };
        case 'sad':
            return { icon: 'fa-solid fa-face-sad-tear', color: '#e67e22' };
        case 'angry':
            return { icon: 'fa-solid fa-face-angry', color: '#e74c3c' };
        case 'like':
        default:
            return { icon: 'fa-solid fa-thumbs-up', color: '#64E9EE' };
    }
}

function tmApplyReactionIcon(iconEl, reactionType) {
    if (!iconEl) return;
    const ui = tmGetLikeUi(reactionType);
    iconEl.className = `${ui.icon} main-like-btn action-like`;
    iconEl.style.color = ui.color || '';
}
function tmRenderMainReactionIcon(reactionType) {
    const rt = String(reactionType || '').trim();
    if (!rt) return `<i class="fa-regular fa-thumbs-up action-like main-like-btn" style="cursor: pointer; transition: 0.2s;"></i>`;

    // Match the same icon mapping used in click handler
    switch (rt) {
        case 'love':
            return `<i class="fa-solid fa-heart main-like-btn action-like" style="cursor:pointer; transition:0.2s; color:#ff4757;"></i>`;
        case 'haha':
            return `<i class="fa-solid fa-face-laugh-squint main-like-btn action-like" style="cursor:pointer; transition:0.2s; color:#f1c40f;"></i>`;
        case 'wow':
            return `<i class="fa-solid fa-face-surprise main-like-btn action-like" style="cursor:pointer; transition:0.2s; color:#f1c40f;"></i>`;
        case 'sad':
            return `<i class="fa-solid fa-face-sad-tear main-like-btn action-like" style="cursor:pointer; transition:0.2s; color:#e67e22;"></i>`;
        case 'angry':
            return `<i class="fa-solid fa-face-angry main-like-btn action-like" style="cursor:pointer; transition:0.2s; color:#e74c3c;"></i>`;
        case 'like':
        default:
            return `<i class="fa-solid fa-thumbs-up main-like-btn action-like" style="cursor:pointer; transition:0.2s; color:#64E9EE;"></i>`;
    }
}

// ------------------------------
// Small helpers + packed profile save
// ------------------------------
async function tmGetMeSafe() {
    try {
        if (window.__tmMe) return window.__tmMe;
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (data?.ok) {
            window.__tmMe = data.user || data.me || data;
            return window.__tmMe;
        }
    } catch (_) {}
    return {};
}

async function tmSaveCreatorProfilePacked(contentStyle) {
    const res = await fetch('/api/me/creator/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentStyle })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error || 'Save failed');
    return data?.contentStyle || contentStyle;
}

function tmApplyProfileName(name) {
    const v = String(name || '').trim() || 'Your Name';
    const el = document.getElementById('creatorHeaderName') || document.getElementById('creatorProfileName');
    if (el) el.textContent = v;
}

function tmApplyProfileBio(bio) {
    const v = String(bio || '').trim();
    const el = document.querySelector('#view-my-profile .profile-bio-text');
    if (!el) return;
    if (!v) {
        el.textContent = 'No bio yet';
        el.style.color = 'rgba(255,255,255,0.55)';
    } else {
        el.textContent = v;
        el.style.color = 'rgba(255,255,255,0.85)';
    }
}

function tmStatusKey(email) {
    const e = String(email || '').toLowerCase().trim();
    return e ? `tm_creator_status_${e}` : 'tm_creator_status';
}

function tmReadLocalStatus(email) {
    try {
        return String(localStorage.getItem(tmStatusKey(email)) || '').trim();
    } catch (_) {
        return '';
    }
}

function tmWriteLocalStatus(email, status) {
    try {
        const v = String(status || '').trim();
        if (!v) localStorage.removeItem(tmStatusKey(email));
        else localStorage.setItem(tmStatusKey(email), v);
    } catch (_) {}
}

function tmApplyProfileStatus(status) {
    const s = String(status || '').trim() || 'Available';
    const label = document.getElementById('profile-status-label');
    const dot = document.getElementById('profile-status-dot');
    if (label) label.textContent = s;
    if (dot) {
        // Basic color mapping
        const map = {
            'Available': '#46e85e',
            'Busy': '#ff4757',
            'Away': '#f1c40f',
            'Offline': '#7f8c8d'
        };
        dot.style.background = map[s] || '#46e85e';
    }
}

function tmReadLocalPacked(email) {
    try {
        const key = email ? `tm_creator_packed_${String(email).toLowerCase().trim()}` : 'tm_creator_packed';
        return String(localStorage.getItem(key) || '').trim();
    } catch (_) {
        return '';
    }
}

function tmWriteLocalPacked(email, packed) {
    try {
        const key = email ? `tm_creator_packed_${String(email).toLowerCase().trim()}` : 'tm_creator_packed';
        localStorage.setItem(key, String(packed || ''));
    } catch (_) {}
}

function tmGetPacked(packed, key) {
    const p = String(packed || '');
    const k = String(key || '').trim();
    if (!p || !k) return '';
    const re = new RegExp(`(?:^|\\n)${escapeRegExp(k)}\\s*=\\s*(.*?)(?:\\n|$)`, 'i');
    const m = p.match(re);
    return (m && m[1] != null) ? String(m[1]).trim() : '';
}

function tmSetPacked(packed, key, value) {
    const p = String(packed || '');
    const k = String(key || '').trim();
    const v = String(value || '').trim();
    if (!k) return p;

    const line = `${k}=${v}`;
    const re = new RegExp(`(^|\\n)${escapeRegExp(k)}\\s*=\\s*.*?(\\n|$)`, 'i');

    if (re.test(p)) {
        return p.replace(re, `$1${line}$2`).replace(/\n{3,}/g, '\n\n');
    }
    if (!p.trim()) return line;
    return (p.trimEnd() + '\n' + line).replace(/\n{3,}/g, '\n\n');
}

function escapeRegExp(s) {
    return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tmEscapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
}

function tmEscapeAttr(s) {
    return tmEscapeHtml(s).replace(/`/g, '&#096;');
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = Math.max(0, now - (Number(timestamp) || now));
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function tmToastOk(msg) {
    try {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: msg || 'Done', showConfirmButton: false, timer: 2200, background: '#0d1423', color: '#fff' });
    } catch (_) {}
}
function tmToastErr(msg) {
    try {
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: msg || 'Error', showConfirmButton: false, timer: 2800, background: '#0d1423', color: '#fff' });
    } catch (_) {}
}

async function tmCopyToClipboard(text) {
    const t = String(text || '').trim();
    if (!t) return false;
    try {
        await navigator.clipboard.writeText(t);
        return true;
    } catch (_) {
        // Legacy fallback
        try {
            const ta = document.createElement('textarea');
            ta.value = t;
            ta.style.position = 'fixed';
            ta.style.top = '-1000px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return !!ok;
        } catch (_) {
            return false;
        }
    }
}

  return { initProfilePage };
})();

// ===== wallet.js (bundled) =====
const __CreatorsWallet = (function() {
  const { DOM } = __CreatorsDOM;
  const { tmCardsGetAll, tmCardsAdd, tmCardsRemove, tmCardsSetPrimary, tmCardsMask, tmWalletPrefsGet, tmWalletPrefsSet, tmTransactionsGet, tmTransactionsAdd, getMySubscriptions, getMyPayments, tmPaymentsGet, tmPaymentsSetAll } = __CreatorsData;

// Shared toast ref for module-scope helpers
let TM_WALLET_TOAST = null;

// =============================================================
// Wallet / Cards
// Data #2
// - Save cards (safe fields only, no card number / no cvc)
// - Render saved cards in "Your Cards" tab
// - Works for BOTH:
//    (1) Add Card page (view-add-card)
//    (2) Add Card modal (add-card-modal)
// =============================================================

function tmNowISO() {
  try { return new Date().toISOString(); } catch { return String(Date.now()); }
}

function tmUid(prefix = 'card') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function tmDigits(raw) {
  return String(raw || '').replace(/\D+/g, '');
}

function tmCardBrand(digits) {
  const d = tmDigits(digits);
  if (!d) return 'card';
  if (d.startsWith('4')) return 'visa';
  if (d.startsWith('5')) return 'mastercard';
  if (d.startsWith('34') || d.startsWith('37')) return 'amex';
  if (d.startsWith('6')) return 'discover';
  return 'card';
}

function tmParseExp(raw) {
  const v = String(raw || '').trim();
  if (!v) return { month: '', year: '' };
  const parts = v.replace(/\s+/g, '').split('/');
  if (parts.length < 2) return { month: '', year: '' };
  const m = parts[0].replace(/\D+/g, '').slice(0, 2);
  let y = parts[1].replace(/\D+/g, '');
  if (y.length === 2) y = `20${y}`;
  if (y.length > 4) y = y.slice(0, 4);
  return { month: m, year: y };
}

function tmFormatExpValue(raw) {
  const digits = String(raw || '').replace(/\D+/g, '').slice(0, 6); // MM + (YY|YYYY)
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function tmBindExpAutoFormat(root) {
  if (!root) return;
  const { exp } = tmGetFieldsFromCardForm(root);
  if (!exp) return;

  // Avoid double-binding
  if (exp.dataset.tmExpBound === '1') return;
  exp.dataset.tmExpBound = '1';

  // Helpful hints for mobile keyboards / autofill
  try { exp.setAttribute('inputmode', 'numeric'); } catch {}
  try { exp.setAttribute('autocomplete', 'cc-exp'); } catch {}
  try { exp.setAttribute('maxlength', '7'); } catch {} // MM/YYYY or MM/YY

  const handler = () => {
    const prev = exp.value || '';
    const prevPos = (typeof exp.selectionStart === 'number') ? exp.selectionStart : prev.length;
    const digitsBefore = prev.slice(0, prevPos).replace(/\D+/g, '').length;

    const formatted = tmFormatExpValue(prev);
    exp.value = formatted;

    // Keep caret near the same logical digit position
    if (document.activeElement === exp && typeof exp.setSelectionRange === 'function') {
      let pos = 0;
      let seen = 0;
      while (pos < formatted.length && seen < digitsBefore) {
        if (/\d/.test(formatted[pos])) seen += 1;
        pos += 1;
      }
      try { exp.setSelectionRange(pos, pos); } catch {}
    }
  };

  exp.addEventListener('input', handler, { passive: true });
}

function tmGetFieldsFromCardForm(root) {
  // Map by label text inside .ac-group
  const out = {
    country: null,
    state: null,
    address: null,
    city: null,
    zip: null,
    email: null,
    name: null,
    number: null,
    exp: null,
    cvc: null,
  };

  if (!root) return out;
  const groups = Array.from(root.querySelectorAll('.ac-group'));

  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const setIf = (key, el) => { if (el && !out[key]) out[key] = el; };

  for (const g of groups) {
    const lbl = g.querySelector('label');
    const inp = g.querySelector('input, textarea, select');
    if (!lbl || !inp) continue;
    const k = norm(lbl.textContent);

    if (k === 'country') setIf('country', inp);
    else if (k === 'state province' || k === 'state') setIf('state', inp);
    else if (k === 'address') setIf('address', inp);
    else if (k === 'city') setIf('city', inp);
    else if (k === 'zip postal code' || k === 'zip') setIf('zip', inp);
    else if (k === 'e mail' || k === 'email') setIf('email', inp);
    else if (k === 'name on the card' || k === 'name on card') setIf('name', inp);
    else if (k === 'card number') setIf('number', inp);
    else if (k === 'expiration' || k === 'expiry') setIf('exp', inp);
    else if (k === 'cvc' || k === 'cvv') setIf('cvc', inp);
  }

  return out;
}

function tmValidateCardPayload(payload, needsAgeConfirm) {
  const problems = [];

  const email = String(payload.email || '').trim();
  const name = String(payload.nameOnCard || '').trim();
  const last4 = String(payload.last4 || '').trim();
  const expMonth = String(payload.expMonth || '').trim();
  const expYear = String(payload.expYear || '').trim();

  if (!email || !email.includes('@')) problems.push('Email');
  if (!name) problems.push('Name on the card');
  if (!last4 || last4.length !== 4) problems.push('Card number');
  if (!expMonth || expMonth.length !== 2) problems.push('Expiration');
  if (!expYear || expYear.length !== 4) problems.push('Expiration');
  if (needsAgeConfirm) problems.push('Age confirmation');

  // Month range check
  const m = parseInt(expMonth, 10);
  if (Number.isFinite(m) && (m < 1 || m > 12)) {
    problems.push('Expiration (month)');
  }

  // Expired check (soft)
  const y = parseInt(expYear, 10);
  if (Number.isFinite(m) && Number.isFinite(y)) {
    const now = new Date();
    const exp = new Date(y, m - 1, 1);
    // consider valid through end of month
    exp.setMonth(exp.getMonth() + 1);
    if (exp.getTime() < now.getTime()) {
      problems.push('Card is expired');
    }
  }

  return Array.from(new Set(problems));
}

function tmBrandIconHtml(brand) {
  const b = String(brand || '').toLowerCase();
  if (b === 'visa') return '<i class="fa-brands fa-cc-visa" aria-label="Visa"></i>';
  if (b === 'mastercard') return '<i class="fa-brands fa-cc-mastercard" aria-label="Mastercard"></i>';
  if (b === 'amex') return '<i class="fa-brands fa-cc-amex" aria-label="Amex"></i>';
  if (b === 'discover') return '<i class="fa-brands fa-cc-discover" aria-label="Discover"></i>';
  return '<i class="fa-regular fa-credit-card" aria-label="Card"></i>';
}


// =============================================================
// Wallet Card Verification (Email OTP) - backend-first wiring
// Endpoints (server):
//   POST /api/me/wallet/cards/verify/start
//   POST /api/me/wallet/cards/verify/confirm
// We persist verification state client-side (per cardId) to keep UI consistent
// even if cards are stored locally for now.
// =============================================================

const TM_CARD_VERIFY_KEY = 'tm_card_verify_v1';

function tmSafeJsonParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function tmVerifyMapGet() {
  try {
    const raw = localStorage.getItem(TM_CARD_VERIFY_KEY);
    const v = raw ? tmSafeJsonParse(raw, {}) : {};
    return (v && typeof v === 'object') ? v : {};
  } catch {
    return {};
  }
}

function tmVerifyMapSet(map) {
  try { localStorage.setItem(TM_CARD_VERIFY_KEY, JSON.stringify(map || {})); } catch { /* ignore */ }
}

function tmVerifyGet(cardId) {
  const id = String(cardId || '').trim();
  if (!id) return { verified: false, verifiedAtMs: 0 };
  const map = tmVerifyMapGet();
  const v = map[id];
  if (!v || typeof v !== 'object') return { verified: false, verifiedAtMs: 0 };
  return {
    verified: !!v.verified,
    verifiedAtMs: Number(v.verifiedAtMs || 0) || 0
  };
}

function tmVerifySet(cardId, patch) {
  const id = String(cardId || '').trim();
  if (!id) return;
  const map = tmVerifyMapGet();
  const cur = (map[id] && typeof map[id] === 'object') ? map[id] : {};
  const next = { ...cur, ...(patch || {}) };
  next.verified = !!next.verified;
  next.verifiedAtMs = Number(next.verifiedAtMs || 0) || 0;
  map[id] = next;
  tmVerifyMapSet(map);
}

function tmVerifyDelete(cardId) {
  const id = String(cardId || '').trim();
  if (!id) return;
  const map = tmVerifyMapGet();
  if (map && Object.prototype.hasOwnProperty.call(map, id)) {
    delete map[id];
    tmVerifyMapSet(map);
  }
}

function tmCardsGetAllWithVerify() {
  const cards = tmCardsGetAll();
  if (!Array.isArray(cards) || !cards.length) return [];
  return cards.map((c) => {
    const v = tmVerifyGet(c.id);
    return { ...c, verified: !!v.verified, verifiedAtMs: v.verifiedAtMs };
  });
}
function tmPrimaryCardId() {
  const cards = tmCardsGetAllWithVerify();
  if (!cards.length) return '';
  const primary = cards.find(c => c && c.isPrimary);
  return primary?.id || cards[0]?.id || '';
}

function tmEscapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function tmPostJson(path, body, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-TM-Request': '1'
      },
      body: JSON.stringify(body || {})
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error || data?.message || `Request failed (${res.status})`;
      return { ok: false, status: res.status, ...(data && typeof data === 'object' ? data : {}), error: msg };
    }

    if (!data || typeof data !== 'object') return { ok: true };
    if (typeof data.ok !== 'boolean') return { ok: true, ...data };
    return data;

  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    return { ok: false, error: isAbort ? 'Request timeout' : (err?.message || 'Network error') };
  } finally {
    clearTimeout(timer);
  }
}

async function tmStartCardVerify(cardId) {
  const id = String(cardId || '').trim();
  if (!id) return { ok: false, error: 'Missing card id' };
  // send both keys for backward-compat with potential server payloads
  return tmPostJson('/api/me/wallet/cards/verify/start', { cardId: id, id });
}

async function tmConfirmCardVerify(cardId, code) {
  const id = String(cardId || '').trim();
  const otp = String(code || '').trim();
  if (!id) return { ok: false, error: 'Missing card id' };
  if (!otp) return { ok: false, error: 'Missing code' };
  return tmPostJson('/api/me/wallet/cards/verify/confirm', { cardId: id, id, code: otp, otp });
}

async function tmRunVerifyFlow(cardId, toast) {
  const id = String(cardId || '').trim();
  if (!id) {
    try { toast.fire({ icon: 'error', title: 'Add a card first' }); } catch (_) {}
    return;
  }

  try { toast.fire({ icon: 'info', title: 'Sending verification code…' }); } catch (_) {}

  const start = await tmStartCardVerify(id);
  if (!start || start.ok !== true) {
    try { toast.fire({ icon: 'error', title: start?.error || 'Unable to send code' }); } catch (_) {}
    return;
  }

  const sentTo = start.sentTo || start.email || start.to || 'your email';

  const Swal = window.Swal;
  if (Swal && typeof Swal.fire === 'function') {
    const result = await Swal.fire({
      title: 'Verify card',
      html: `
        <div style="text-align:left; font-size:13px; color: var(--muted); line-height:1.4; margin-bottom:10px;">
          We sent a code to <b style="color: var(--text);">${tmEscapeHtml(sentTo)}</b>.
          Enter the code below to verify this card.
          <div style="margin-top:8px; font-size:12px;">
            <a href="#" id="tm-resend-verify-code" style="color: var(--primary-cyan); text-decoration:none; font-weight:800;">Resend code</a>
          </div>
        </div>
      `,
      input: 'text',
      inputPlaceholder: '6-digit code',
      inputAttributes: {
        inputmode: 'numeric',
        autocomplete: 'one-time-code',
        autocapitalize: 'off',
        maxlength: 8
      },
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      preConfirm: async (v) => {
        const code = tmDigits(v).slice(0, 8);
        if (!code) {
          Swal.showValidationMessage('Enter the code');
          return false;
        }
        const confirm = await tmConfirmCardVerify(id, code);
        if (!confirm || confirm.ok !== true) {
          Swal.showValidationMessage(confirm?.error || 'Invalid code');
          return false;
        }
        return confirm;
      },
      didOpen: () => {
        const a = document.getElementById('tm-resend-verify-code');
        if (a) {
          a.addEventListener('click', async (ev) => {
            ev.preventDefault();
            a.style.pointerEvents = 'none';
            a.style.opacity = '0.6';
            const again = await tmStartCardVerify(id);
            if (again && again.ok === true) {
              try { toast.fire({ icon: 'success', title: 'Code resent' }); } catch (_) {}
            } else {
              try { toast.fire({ icon: 'error', title: again?.error || 'Unable to resend code' }); } catch (_) {}
            }
            setTimeout(() => {
              a.style.pointerEvents = '';
              a.style.opacity = '';
            }, 1200);
          }, { passive: false });
        }
      }
    });

    if (!result.isConfirmed) return;

    const confirm = result.value || {};
    const verifiedAtMs = Number(confirm.verifiedAtMs || confirm.card?.verifiedAtMs || Date.now()) || Date.now();
    tmVerifySet(id, { verified: true, verifiedAtMs });

    // UI refresh
    try { tmRenderCardsList(); } catch (_) {}
    try { tmTransactionsAdd({ type: 'activity', title: 'Card verified', amount: 0 }); } catch (_) {}
    try { tmRenderWalletTransactions(); } catch (_) {}
    try { toast.fire({ icon: 'success', title: 'Card verified' }); } catch (_) {}

    return;
  }

  // Fallback if Swal not present
  const code = window.prompt(`Enter the code sent to ${sentTo}:`);
  if (!code) return;

  const confirm = await tmConfirmCardVerify(id, tmDigits(code).slice(0, 8));
  if (!confirm || confirm.ok !== true) {
    try { toast.fire({ icon: 'error', title: confirm?.error || 'Invalid code' }); } catch (_) {}
    return;
  }

  const verifiedAtMs = Number(confirm.verifiedAtMs || confirm.card?.verifiedAtMs || Date.now()) || Date.now();
  tmVerifySet(id, { verified: true, verifiedAtMs });

  try { tmRenderCardsList(); } catch (_) {}
  try { tmTransactionsAdd({ type: 'activity', title: 'Card verified', amount: 0 }); } catch (_) {}
  try { tmRenderWalletTransactions(); } catch (_) {}
  try { toast.fire({ icon: 'success', title: 'Card verified' }); } catch (_) {}
}

function tmBindVerifyButtons(toast) {
  // Bind once
  if (document.body && document.body.dataset.tmWalletVerifyBound === '1') return;
  if (document.body) document.body.dataset.tmWalletVerifyBound = '1';

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-verify');
    if (!btn) return;

    e.preventDefault();

    // Prefer explicit card id; else verify primary
    const explicitId = btn.getAttribute('data-card-id') || btn.dataset.cardId;
    const id = explicitId || tmPrimaryCardId();
    tmRunVerifyFlow(id, toast);
  });
}
function tmEnsureCardsListContainer() {
  const host = DOM.tabContentCards;
  if (!host) return null;

  let list = document.getElementById('tm-cards-list');
  if (list) return list;

  list = document.createElement('div');
  list.id = 'tm-cards-list';
  list.style.marginTop = '18px';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '10px';

  // Insert above the footer address (keeps existing UI blocks intact)
  const footer = host.querySelector('.of-footer-address');
  if (footer) footer.insertAdjacentElement('beforebegin', list);
  else host.appendChild(list);

  return list;
}

function tmUpdateCardsEmptyState(cards) {
  const host = DOM.tabContentCards;
  if (!host) return;

  const alert = host.querySelector('.of-alert-box');
  if (alert) {
    alert.style.display = (cards && cards.length) ? 'none' : '';
  }
}

function tmRenderCardsList() {
  const cards = tmCardsGetAllWithVerify();
  tmUpdateCardsEmptyState(cards);

  const list = tmEnsureCardsListContainer();
  if (!list) return;

  if (!cards.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = cards.map((c) => {
    const masked = tmCardsMask(c);

    const primaryPill = c.isPrimary
      ? '<span style="font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; background: rgba(100,233,238,0.14); color: var(--primary-cyan); border: 1px solid rgba(100,233,238,0.25);">PRIMARY</span>'
      : '';

    const verifiedPill = c.verified
      ? '<span style="font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; background: rgba(100,233,238,0.14); color: var(--primary-cyan); border: 1px solid rgba(100,233,238,0.25);">VERIFIED</span>'
      : '<span style="font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; background: rgba(255,255,255,0.04); color: var(--muted); border: 1px solid rgba(255,255,255,0.10);">UNVERIFIED</span>';

    const rightPills = `<div style="margin-left:auto; display:flex; gap:8px; align-items:center;">${primaryPill}${verifiedPill}</div>`;

    const exp = (c.expMonth && c.expYear) ? `${c.expMonth}/${String(c.expYear).slice(-2)}` : '';

    return `
      <div class="tm-card-item" data-card-id="${c.id}" style="border: 1px solid var(--border-color); border-radius: 14px; padding: 12px 12px; background: rgba(255,255,255,0.02);">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size: 22px; opacity: 0.95;">${tmBrandIconHtml(c.brand)}</div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <div style="font-weight:800; color: var(--text); letter-spacing:0.2px;">${masked}</div>
            <div style="font-size:12px; color: var(--muted);">Exp: ${exp}${c.country ? ` · ${c.country}` : ''}</div>
          </div>
          ${rightPills}
        </div>
        <div style="display:flex; gap:10px; margin-top: 10px; flex-wrap:wrap;">
          ${c.verified ? '' : `<button type="button" class="btn-verify" data-action="tm-card-verify" data-card-id="${c.id}" style="border: 1px solid rgba(100,233,238,0.28); background: rgba(100,233,238,0.06); color: var(--primary-cyan); padding: 8px 10px; border-radius: 12px; cursor:pointer; font-weight:800; font-size:12px;">VERIFY</button>`}
          ${c.isPrimary ? '' : `<button type="button" data-action="tm-card-primary" data-card-id="${c.id}" style="border: 1px solid rgba(100,233,238,0.28); background: rgba(100,233,238,0.08); color: var(--primary-cyan); padding: 8px 10px; border-radius: 12px; cursor:pointer; font-weight:800; font-size:12px;">MAKE PRIMARY</button>`}
          <button type="button" data-action="tm-card-remove" data-card-id="${c.id}" style="border: 1px solid rgba(255,255,255,0.12); background: transparent; color: var(--text); padding: 8px 10px; border-radius: 12px; cursor:pointer; font-weight:800; font-size:12px;">REMOVE</button>
        </div>
      </div>
    `;
  }).join('');
}

function tmNavigateToYourCards() {
  // Robust: click the popover item associated with data-lang="pop_cards"
  const el = document.querySelector('span[data-lang="pop_cards"]')?.closest('.pop-item');
  if (el) {
    try { el.click(); return true; } catch { /* ignore */ }
  }
  return false;
}

function tmBuildCardFromForm(root) {
  const fields = tmGetFieldsFromCardForm(root);

  const digits = tmDigits(fields.number?.value);
  const { month, year } = tmParseExp(fields.exp?.value);

  const card = {
    id: tmUid('card'),
    brand: tmCardBrand(digits),
    last4: digits.slice(-4),
    expMonth: month,
    expYear: year,
    nameOnCard: String(fields.name?.value || '').trim(),
    email: String(fields.email?.value || '').trim(),
    country: String(fields.country?.value || '').trim(),
    state: String(fields.state?.value || '').trim(),
    address: String(fields.address?.value || '').trim(),
    city: String(fields.city?.value || '').trim(),
    zip: String(fields.zip?.value || '').trim(),
    createdAt: tmNowISO()
  };

  return { card, fields };
}

function tmClearForm(fields) {
  if (!fields) return;
  Object.values(fields).forEach((el) => {
    if (!el) return;
    try { el.value = ''; } catch { /* ignore */ }
  });
}

function tmBindFormSubmit({
  root,
  submitBtn,
  getAgeConfirmed,
  toast,
  onSuccess
}) {
  if (!root || !submitBtn) return;

  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const ageOk = !!(getAgeConfirmed ? getAgeConfirmed() : true);
    const { card, fields } = tmBuildCardFromForm(root);

    const problems = tmValidateCardPayload(card, !ageOk);
    if (problems.length) {
      try {
        toast.fire({
          icon: 'error',
          title: `Missing / invalid: ${problems.join(', ')}`
        });
      } catch (_) {}
      return;
    }

    try {
      tmCardsAdd(card);
      try { tmVerifySet(card.id, { verified: false, verifiedAtMs: 0 }); } catch (_) {}
      tmRenderCardsList();
      tmClearForm(fields);
      if (typeof onSuccess === 'function') onSuccess(card);
      try { toast.fire({ icon: 'success', title: 'Card saved' }); } catch (_) {}
    } catch (err) {
      console.error(err);
      try { toast.fire({ icon: 'error', title: 'Unable to save card' }); } catch (_) {}
    }
  });
}


function tmIsPaymentsTabActive() {
  const wrap = DOM.tabContentPayments;
  if (!wrap) return false;
  return !wrap.classList.contains('hidden');
}

function tmInstallAutoRefresh() {
  const view = DOM.viewYourCards;
  if (!view) return;

  const refreshIfVisible = () => {
    try {
      const cs = window.getComputedStyle(view);
      if (cs && cs.display === 'none') return;
    } catch {
      // ignore
    }

    // If Payments tab is active, refresh Payments history; otherwise refresh cards list.
    if (tmIsPaymentsTabActive()) {
      tmEnterPaymentsTab(false);
    } else {
      tmRenderCardsList();
    }
  };

  // Initial (in case page loads on that view)
  refreshIfVisible();

  const obs = new MutationObserver(() => refreshIfVisible());
  obs.observe(view, { attributes: true, attributeFilter: ['style', 'class'] });

  // Also refresh when tabs toggle inside view-your-cards
  if (DOM.btnTabCards) {
    DOM.btnTabCards.addEventListener('click', () => {
      setTimeout(() => tmRenderCardsList(), 0);
    });
  }

  if (DOM.btnTabPayments) {
    DOM.btnTabPayments.addEventListener('click', () => {
      setTimeout(() => tmEnterPaymentsTab(false), 0);
    });
  }
}



// =============================================================
// Payments History (Data #8)
// - Lives inside view-your-cards > PAYMENTS tab
// - Uses /api/me/payments (server) and falls back to Subscriptions + local cache
// =============================================================
const tmPayState = {
  uiReady: false,
  loading: false,
  data: null,
  fetchedAt: 0
};

let tmPayUI = {
  wrap: null,
  list: null,
  emptyWrap: null,
  emptyText: null
};

function tmPayTsToMs(t) {
  if (!t) return 0;
  if (typeof t === 'number') return t;
  if (typeof t === 'string') {
    const n = Date.parse(t);
    if (!Number.isNaN(n)) return n;
    const p = parseInt(t, 10);
    return Number.isNaN(p) ? 0 : p;
  }
  if (typeof t === 'object') {
    try { if (typeof t.toMillis === 'function') return t.toMillis(); } catch (_) {}
    if (typeof t.seconds === 'number') return t.seconds * 1000;
    if (typeof t._seconds === 'number') return t._seconds * 1000;
  }
  return 0;
}

function tmPayFmtDate(ms) {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function tmPayFmtMoney(amount, currency = 'USD') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '';
  const n = Number(amount);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: String(currency || 'USD') }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency || ''}`.trim();
  }
}

function tmEnsurePaymentsUI() {
  const wrap = DOM.tabContentPayments;
  if (!wrap) return false;

  const emptyWrap = wrap.querySelector('.rs-col-empty-state');
  const emptyText = emptyWrap ? emptyWrap.querySelector('p') : null;

  let list = wrap.querySelector('#tm-payments-list');
  if (!list) {
    list = document.createElement('div');
    list.id = 'tm-payments-list';
    list.style.display = 'none';
    list.style.padding = '6px 0 0';
    // Insert before empty state so empty remains at bottom
    if (emptyWrap) wrap.insertBefore(list, emptyWrap);
    else wrap.appendChild(list);
  }

  tmPayUI = { wrap, list, emptyWrap, emptyText };
  tmPayState.uiReady = true;
  return true;
}

function tmSetPaymentsEmpty(text) {
  if (tmPayUI.emptyText) tmPayUI.emptyText.textContent = text || 'No payments yet.';
  if (tmPayUI.emptyWrap) tmPayUI.emptyWrap.style.display = '';
  if (tmPayUI.list) tmPayUI.list.style.display = 'none';
}

function tmSetPaymentsLoading() {
  if (!tmPayUI.list) return;
  if (tmPayUI.emptyWrap) tmPayUI.emptyWrap.style.display = 'none';
  tmPayUI.list.style.display = 'block';
  tmPayUI.list.innerHTML = `
    <div style="color:var(--muted); text-align:center; padding:22px 0; font-weight:700;">
      Loading payments...
    </div>
  `;
}

function tmBuildPaymentRow(p) {
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.justifyContent = 'space-between';
  row.style.gap = '10px';
  row.style.padding = '12px 12px';
  row.style.border = '1px solid var(--border-color)';
  row.style.borderRadius = '14px';
  row.style.background = 'rgba(255,255,255,0.02)';
  row.style.marginBottom = '10px';

  const left = document.createElement('div');
  left.style.minWidth = '0';

  const title = document.createElement('div');
  title.style.fontWeight = '800';
  title.style.fontSize = '0.95rem';
  title.style.display = 'flex';
  title.style.alignItems = 'center';
  title.style.gap = '8px';

  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-receipt';
  icon.style.color = 'var(--primary-cyan)';

  const titleTxt = document.createElement('span');
  titleTxt.textContent = p.title || 'Payment';

  title.appendChild(icon);
  title.appendChild(titleTxt);

  const meta = document.createElement('div');
  meta.style.color = 'var(--muted)';
  meta.style.fontSize = '0.8rem';
  meta.style.marginTop = '4px';

  const dt = tmPayFmtDate(tmPayTsToMs(p.createdAt));
  const status = (p.status || '').toUpperCase();
  meta.textContent = [dt, status].filter(Boolean).join(' • ');

  if (p.description) {
    const desc = document.createElement('div');
    desc.style.color = 'var(--muted)';
    desc.style.fontSize = '0.8rem';
    desc.style.marginTop = '2px';
    desc.style.whiteSpace = 'nowrap';
    desc.style.overflow = 'hidden';
    desc.style.textOverflow = 'ellipsis';
    desc.textContent = p.description;
    left.appendChild(title);
    left.appendChild(meta);
    left.appendChild(desc);
  } else {
    left.appendChild(title);
    left.appendChild(meta);
  }

  const right = document.createElement('div');
  right.style.textAlign = 'right';
  right.style.whiteSpace = 'nowrap';

  const amt = document.createElement('div');
  amt.style.fontWeight = '900';
  amt.style.fontSize = '0.95rem';
  const money = tmPayFmtMoney(p.amount, p.currency);
  amt.textContent = money || '—';

  right.appendChild(amt);

  row.appendChild(left);
  row.appendChild(right);

  return row;
}

function tmRenderPaymentsList(items) {
  if (!tmPayUI.list) return;

  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) {
    tmSetPaymentsEmpty('No payments yet.');
    return;
  }

  if (tmPayUI.emptyWrap) tmPayUI.emptyWrap.style.display = 'none';
  tmPayUI.list.style.display = 'block';
  tmPayUI.list.innerHTML = '';

  arr.forEach(p => tmPayUI.list.appendChild(tmBuildPaymentRow(p)));
}

function tmBuildPaymentsFromSubs(subItems) {
  const list = Array.isArray(subItems) ? subItems : [];
  const mapped = list.map((it) => {
    const other = it?.otherUser || {};
    const handleRaw = (other.handle || '').trim().replace(/^@/, '');
    const who = handleRaw ? `@${handleRaw}` : (other.name || it.otherEmail || 'creator');
    const startAt = it.startAt || it.createdAt || it.updatedAt || null;
    return {
      id: String(it.id || `${it.subscriberEmail || 'me'}_${it.creatorEmail || 'creator'}_${String(startAt || '')}`),
      type: 'subscription',
      title: 'Subscription',
      description: `Subscribed to ${who}`,
      status: it.isActive ? 'active' : 'expired',
      currency: 'USD',
      amount: null,
      createdAt: startAt || new Date().toISOString()
    };
  });

  mapped.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return mapped;
}

async function tmLoadPayments(force = false) {
  if (!tmPayState.uiReady) return;
  if (tmPayState.loading) return;

  const now = Date.now();
  const fresh = tmPayState.data && (now - (tmPayState.fetchedAt || 0) < 15000);
  if (!force && fresh) {
    tmRenderPaymentsList(tmPayState.data);
    return;
  }

  tmPayState.loading = true;
  tmSetPaymentsLoading();

  try {
    // Try Payments API
    let items = null;
    try {
      const payload = await getMyPayments();
      if (payload && payload.ok === true && Array.isArray(payload.items)) {
        items = payload.items;
      }
    } catch (err) {
      // expected if endpoint not deployed yet
      items = null;
    }

    // Fallback: build from Subscriptions
    if (!items) {
      try {
        const subs = await getMySubscriptions({ dir: 'subscribed' });
        const subItems = subs?.subscribed?.items || subs?.items || [];
        if (Array.isArray(subItems) && subItems.length) {
          items = tmBuildPaymentsFromSubs(subItems);
        }
      } catch (_) {
        // ignore
      }
    }

    // Final fallback: local cache
    if (!items) {
      items = tmPaymentsGet();
    }

    // Cache
    if (Array.isArray(items)) {
      tmPayState.data = items;
      tmPayState.fetchedAt = Date.now();
      try { tmPaymentsSetAll(items); } catch (_) {}
      tmRenderPaymentsList(items);
    } else {
      tmPayState.data = [];
      tmPayState.fetchedAt = Date.now();
      tmSetPaymentsEmpty('No payments yet.');
    }

  } catch (err) {
    console.error('Payments load error:', err);
    tmSetPaymentsEmpty('Unable to load payments.');
    try { if (TM_WALLET_TOAST && typeof TM_WALLET_TOAST.fire === 'function') TM_WALLET_TOAST.fire({ icon: 'error', title: 'Unable to load payments' }); } catch (_) {}
  } finally {
    tmPayState.loading = false;
  }
}

function tmEnterPaymentsTab(force = false) {
  if (!tmEnsurePaymentsUI()) return;
  tmLoadPayments(!!force);
}

// -----------------------------
// Wallet preference + transactions (Data #7)
// -----------------------------
function tmFormatNiceDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || '');
    return d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(iso || '');
  }
}

function tmEnsureWalletTxList() {
  const root = document.getElementById('rs-wallet-view');
  if (!root) return null;

  // The empty state lives inside the second wallet-widget-card > .ww-body
  const body = root.querySelectorAll('.wallet-widget-card .ww-body')[1] || root.querySelector('.wallet-widget-card .ww-body');
  if (!body) return null;

  let list = body.querySelector('#tm-wallet-tx-list');
  if (list) return list;

  list = document.createElement('div');
  list.id = 'tm-wallet-tx-list';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '10px';
  list.style.marginTop = '6px';

  // Insert after the "LATEST TRANSACTIONS" label (the <small>)
  const small = body.querySelector('small');
  if (small) small.insertAdjacentElement('afterend', list);
  else body.appendChild(list);

  return list;
}

function tmRenderWalletTransactions() {
  const root = document.getElementById('rs-wallet-view');
  if (!root) return;

  const body = root.querySelectorAll('.wallet-widget-card .ww-body')[1] || root.querySelector('.wallet-widget-card .ww-body');
  if (!body) return;

  const empty = body.querySelector('.ww-empty');
  const list = tmEnsureWalletTxList();
  if (!list) return;

  const tx = tmTransactionsGet();
  if (!tx.length) {
    list.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }

  if (empty) empty.style.display = 'none';

  list.innerHTML = tx.slice(0, 8).map((t) => {
    const icon = (t.type === 'payment')
      ? '<i class="fa-solid fa-bag-shopping" style="opacity:0.9;"></i>'
      : '<i class="fa-regular fa-clock" style="opacity:0.85;"></i>';

    const amount = (typeof t.amount === 'number' && t.amount !== 0)
      ? `<span style="margin-left:auto; font-weight:900; color: var(--text);">$${Math.abs(t.amount).toFixed(2)}</span>`
      : '<span style="margin-left:auto; font-weight:900; color: var(--muted);">—</span>';

    return `
      <div class="tm-wallet-tx" style="display:flex; align-items:center; gap:10px; padding: 10px 10px; border: 1px solid var(--border-color); border-radius: 14px; background: rgba(255,255,255,0.02);">
        <div style="font-size:16px;">${icon}</div>
        <div style="display:flex; flex-direction:column; gap:3px; min-width:0;">
          <div style="font-weight:850; color: var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${String(t.title || 'Activity')}</div>
          <div style="font-size:12px; color: var(--muted);">${tmFormatNiceDate(t.createdAt)}</div>
        </div>
        ${amount}
      </div>
    `;
  }).join('');
}

function tmBindWalletRebillToggle(toast) {
  const root = document.getElementById('rs-wallet-view');
  if (!root) return;

  const toggle = root.querySelector('.ww-toggle-row input[type="checkbox"]');
  if (!toggle) return;

  // Set initial
  const prefs = tmWalletPrefsGet();
  toggle.checked = !!prefs.rebillPrimary;

  toggle.addEventListener('change', () => {
    const next = tmWalletPrefsSet({ rebillPrimary: !!toggle.checked });
    try { toast.fire({ icon: 'success', title: next.rebillPrimary ? 'Wallet set as primary for rebills' : 'Wallet rebills disabled' }); } catch(_) {}
  }, { passive: true });
}


 function initWallet(TopToast) {
  const toast = TopToast;
  TM_WALLET_TOAST = toast;

  // Wire Wallet Card Verification (Email OTP)
  tmBindVerifyButtons(toast);

  // -----------------------------
  // Add Card MODAL (Right sidebar)
  // -----------------------------
  const modal = document.getElementById('add-card-modal');
  const btnCancel = document.querySelector('.btn-cancel-modal');
  const btnSubmitModal = document.querySelector('.btn-submit-card-modal');

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => modal.classList.add('hidden'), 200);
  };

  // Open modal (event delegation for dynamic content)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-payment-card');
    if (!btn) return;
    e.preventDefault();
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('open'), 10);
  });

  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Save from modal
  tmBindExpAutoFormat(modal);
  if (modal && btnSubmitModal) {
    tmBindFormSubmit({
      root: modal,
      submitBtn: btnSubmitModal,
      getAgeConfirmed: () => !!document.getElementById('ageCheckModal')?.checked,
      toast,
      onSuccess: (card) => {
        try { tmTransactionsAdd({ type: 'activity', title: `Card added • ${tmCardsMask(card)}`, amount: 0 }); } catch(_) {}
        tmRenderWalletTransactions();
        closeModal();
        // Optional: take user to Your Cards view
        setTimeout(() => tmNavigateToYourCards(), 50);
      }
    });
  }

  // -----------------------------
  // Add Card PAGE (view-add-card)
  // -----------------------------
  const viewAddCard = DOM.viewAddCard;
  if (viewAddCard) {
    tmBindExpAutoFormat(viewAddCard);
    const btnSubmitPage = viewAddCard.querySelector('.btn-submit-card');
    tmBindFormSubmit({
      root: viewAddCard,
      submitBtn: btnSubmitPage,
      getAgeConfirmed: () => !!document.getElementById('ageCheck')?.checked,
      toast,
      onSuccess: (card) => {
        try { tmTransactionsAdd({ type: 'activity', title: `Card added • ${tmCardsMask(card)}`, amount: 0 }); } catch(_) {}
        tmRenderWalletTransactions();
        // Navigate to Your Cards so they immediately see saved card(s)
        setTimeout(() => tmNavigateToYourCards(), 50);
      }
    });
  }

  // -----------------------------
  // Actions: Remove / Primary
  // -----------------------------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="tm-card-remove"], [data-action="tm-card-primary"]');
    if (!btn) return;
    e.preventDefault();

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-card-id');
    if (!id) return;

    try {
      if (action === 'tm-card-remove') {
        const before = tmCardsGetAll().find(x => x.id === id);
        tmCardsRemove(id);
        try { tmVerifyDelete(id); } catch (_) {}
        tmRenderCardsList();
        try { tmTransactionsAdd({ type: 'activity', title: `Card removed • ${before ? tmCardsMask(before) : '****'}`, amount: 0 }); } catch(_) {}
        tmRenderWalletTransactions();
        try { toast.fire({ icon: 'success', title: 'Card removed' }); } catch (_) {}
      }
      if (action === 'tm-card-primary') {
        const before = tmCardsGetAll().find(x => x.id === id);
        tmCardsSetPrimary(id);
        tmRenderCardsList();
        try { tmTransactionsAdd({ type: 'activity', title: `Primary card set • ${before ? tmCardsMask(before) : '****'}`, amount: 0 }); } catch(_) {}
        tmRenderWalletTransactions();
        try { toast.fire({ icon: 'success', title: 'Primary card updated' }); } catch (_) {}
      }
    } catch (err) {
      console.error(err);
      try { toast.fire({ icon: 'error', title: 'Action failed' }); } catch (_) {}
    }
  });

  // Auto-refresh list when Your Cards view opens
  tmInstallAutoRefresh();

  // Wallet (Data #7)
  tmBindWalletRebillToggle(toast);
  tmRenderWalletTransactions();
}
 

  return { initWallet };
})();

// ===== app.js (entrypoint, bundled) =====
(function() {
  const { DOM } = __CreatorsDOM;
  const { initHome } = __CreatorsHome;
  const { initNotifications } = __CreatorsNotifications;
  const { initMessages } = __CreatorsMessages;
  const { initCollections, renderCollections, updateRightSidebarContent } = __CreatorsCollections;
  const { initWallet } = __CreatorsWallet;
  const { loadView } = __CreatorsLoader;
  const { initSettings } = __CreatorsSettings;
  const { initProfilePage } = __CreatorsProfile;
  const { COLLECTIONS_DB, DEFAULT_AVATAR, getMySubscriptions } = __CreatorsData;

 



 // Import logic


// ---------------- Creators Sync: hydrate from /api/me ----------------
async function tmApiMe() {
  const res = await fetch('/api/me', { method: 'GET', credentials: 'include' });
  return res.json().catch(() => null);
}

function tmSplitPipes(str) {
  if (!str) return [];
  return String(str).split('|').map(s => s.trim()).filter(Boolean);
}

function tmGetPacked(packed, label) {
  if (!packed || !label) return '';
  const want = String(label).trim().toLowerCase();
  for (const seg of tmSplitPipes(packed)) {
    const idx = seg.indexOf(':');
    if (idx === -1) continue;
    const key = seg.slice(0, idx).trim().toLowerCase();
    if (key === want) return seg.slice(idx + 1).trim();
  }
  return '';
}



function tmSetPacked(packed, label, value) {
  const want = String(label || '').trim().toLowerCase();
  const v = (value === null || value === undefined) ? '' : String(value);
  const segs = tmSplitPipes(packed);
  let found = false;
  const out = segs.map(seg => {
    const idx = seg.indexOf(':');
    if (idx === -1) return seg;
    const key = seg.slice(0, idx).trim().toLowerCase();
    if (key !== want) return seg;
    found = true;
    return `${label}: ${v}`.trim();
  }).filter(Boolean);

  if (!found) {
    out.push(`${label}: ${v}`.trim());
  }

  // Remove empty values
  const cleaned = out.filter(s => {
    const idx = s.indexOf(':');
    if (idx === -1) return true;
    const val = s.slice(idx + 1).trim();
    return val.length > 0;
  });

  return cleaned.join(' | ');
}

let tmMeCache = null;
function tmSetText(selOrEl, text) {
  const el = typeof selOrEl === 'string' ? document.querySelector(selOrEl) : selOrEl;
  if (el) el.textContent = text;
}
function tmSetSrc(selOrEl, src) {
  const el = typeof selOrEl === 'string' ? document.querySelector(selOrEl) : selOrEl;
  if (el && src) el.src = src;
}
function tmSetBgImage(selOrEl, url) {
  const el = typeof selOrEl === 'string' ? document.querySelector(selOrEl) : selOrEl;
  if (!el || !url) return;
  el.style.backgroundImage = `url('${url}')`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
}

function tmUpsertCreatorMetaBlock(meta) {
  const bioEl = document.querySelector('#view-my-profile .profile-bio-text');
  if (!bioEl) return;

  const rows = [
    ['Location', meta.location],
    ['Languages', meta.languages],
    ['Category', meta.category],
    ['Niche', meta.niche],
    ['Posting schedule', meta.postingSchedule],
    ['Boundaries', meta.boundaries],
    ['Style notes', meta.styleNotes]
  ].filter(([, v]) => v && String(v).trim());

  let wrap = document.getElementById('tmCreatorMeta');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'tmCreatorMeta';
    wrap.style.marginTop = '10px';
    wrap.style.padding = '10px 12px';
    wrap.style.border = '1px solid var(--border-color)';
    wrap.style.borderRadius = '12px';
    wrap.style.background = 'rgba(255,255,255,0.02)';
    bioEl.insertAdjacentElement('afterend', wrap);
  }

  if (!rows.length) {
    wrap.remove();
    return;
  }

  wrap.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;">Creator details</div>
    ${rows.map(([k,v]) => `
      <div style="display:flex;gap:10px;margin:4px 0;">
        <div style="min-width:120px;color:var(--muted);font-size:12px;">${k}</div>
        <div style="color:var(--text);font-size:13px;line-height:1.35;">${String(v)}</div>
      </div>
    `).join('')}
  `;
}

async function tmHydrateCreatorsFromMe() {
  const data = await tmApiMe();
  if (!data || !data.ok || !data.user) return;

  const user = data.user;
  const app = user.creatorApplication || null;
  tmMeCache = user;
  try { window.__tmMe = user; } catch {}

  const packed = app?.contentStyle || '';
  const displayName = tmGetPacked(packed, 'Display name') || tmGetPacked(packed, 'Name') || user.name || 'Your Name';
  const handleRaw = (app?.handle || user.username || '').replace(/^@/, '');
  const handle = handleRaw ? `@${handleRaw}` : '@username';

  const bio = tmGetPacked(packed, 'Bio');
  const meta = {
    location: tmGetPacked(packed, 'Location'),
    languages: tmGetPacked(packed, 'Languages'),
    category: tmGetPacked(packed, 'Category'),
    niche: tmGetPacked(packed, 'Niche'),
    postingSchedule: tmGetPacked(packed, 'Posting schedule'),
    boundaries: tmGetPacked(packed, 'Boundaries'),
    styleNotes: tmGetPacked(packed, 'Style notes')
  };

  // Left profile card
  tmSetText('#creatorProfileName', displayName);
  tmSetText('#creatorProfileHandle', handle);
  tmSetSrc('#creatorProfileAvatar', user.avatarUrl);

  // Popover
  tmSetText('#creatorPopoverName', displayName);
  tmSetText('#creatorPopoverHandle', handle);

  // Profile header (view-my-profile)
  tmSetText('#creatorHeaderName', displayName);
  tmSetText('#creatorHeaderHandle', handle);

  // Apply saved creator status
  try { tmApplyCreatorStatus(user?.presenceStatus || user?.status || 'Available'); } catch {}

  if (bio && bio.trim()) tmSetText('#view-my-profile .profile-bio-text', bio);
  tmSetSrc('#view-my-profile .profile-avatar-main', user.avatarUrl);
  tmSetBgImage('#view-my-profile .profile-header-bg', user.headerUrl);
// Local header fallback (client-side)
try {
  const k = `tm_creator_header_${String(user?.email || '').toLowerCase()}`;
  const localHdr = window.localStorage ? (window.localStorage.getItem(k) || '') : '';
  if ((!user.headerUrl || !String(user.headerUrl).trim()) && localHdr) {
    tmSetBgImage('#view-my-profile .profile-header-bg', localHdr);
  }
} catch {}

  // Optional: show the rest of the application details under the bio
  tmUpsertCreatorMetaBlock(meta);
}


// =============================================================
// CREATOR ACCESS PAYWALL (Creator Access plan)
// - If user.hasCreatorAccess is false → show payment modal
// - Proceed to Pay → create Coinbase charge (planKey: creator_access) and redirect
// - Cancel → redirect back to dashboard
// =============================================================
const tmPaywallState = { bound: false };

function tmHasCreatorAccess() { 
  const u = tmMeCache || (typeof window !== 'undefined' ? window.__tmMe : null) || null; 
  return !!(u && u.hasCreatorAccess); 
}

function tmShowCreatorAccessModal() {
  const modal = DOM.paymentModal;
  if (!modal) return;
  modal.classList.add('is-visible');
  modal.setAttribute('aria-hidden', 'false');
}

function tmHideCreatorAccessModal() {
  const modal = DOM.paymentModal;
  if (!modal) return;
  modal.classList.remove('is-visible');
  modal.setAttribute('aria-hidden', 'true');
}

function tmHandleCreatorAccessCancel() {
  // Hard gate: leave creators page
  try { tmHideCreatorAccessModal(); } catch {}
  try { window.location.href = 'dashboard.html'; } catch (_) {}
}

async function tmStartCreatorAccessPayment() {
  const btn = DOM.btnPayConfirm;
  const btnCancel = DOM.btnPayCancel;
  const prevText = btn ? btn.textContent : '';

  try {
    if (btn) { btn.disabled = true; btn.textContent = 'Redirecting...'; }
    if (btnCancel) btnCancel.disabled = true;

    const res = await fetch('/api/coinbase/create-charge', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey: 'creator_access' })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || data.ok !== true || !data.url) {
      throw new Error(data?.message || data?.error || 'Unable to start payment');
    }

    window.location.href = data.url;
  } catch (err) {
    console.error(err);
    try { TopToast.fire({ icon: 'error', title: err?.message || 'Unable to start payment' }); } catch (_) {}
    if (btn) { btn.disabled = false; btn.textContent = prevText || 'Proceed to Pay'; }
    if (btnCancel) btnCancel.disabled = false;
  }
}

function tmBindCreatorAccessPaywall() {
  if (tmPaywallState.bound) return;
  tmPaywallState.bound = true;

  const modal = DOM.paymentModal;
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) tmHandleCreatorAccessCancel();
    });
  }

  if (DOM.btnPayConfirm) DOM.btnPayConfirm.addEventListener('click', (e) => { e.preventDefault(); tmStartCreatorAccessPayment(); });
  if (DOM.btnPayCancel) DOM.btnPayCancel.addEventListener('click', (e) => { e.preventDefault(); tmHandleCreatorAccessCancel(); });

  // Allow any module to request the modal
  window.addEventListener('tm:request-creator-access', () => tmShowCreatorAccessModal());
}

function tmEnforceCreatorAccess() {
  if (tmHasCreatorAccess()) {
    tmHideCreatorAccessModal();
    return;
  }
  tmShowCreatorAccessModal();
}



// =============================================================
// DATA #3 — BANK DETAILS (Become a Creator)
// - Bio text + live char count
// - Header + Avatar image picker (client preview)
// - Save → /api/me/profile (avatar) + /api/me/creator/profile (bio)
// - Header image is stored client-side (until backend field exists)
// =============================================================
const tmBankState = {
  uiReady: false,
  saving: false,
  initialBio: '',
  pendingAvatarDataUrl: '',
  pendingHeaderDataUrl: '',
  lastEmail: ''
};

const tmBankUI = {
  view: null,
  bio: null,
  count: null,
  saveBtn: null,
  header: null,
  headerCam: null,
  avatar: null,
  avatarCam: null,
  avatarSpan: null,
  avatarImg: null,
  inputAvatar: null,
  inputHeader: null
};

function tmBankHeaderKey(email) {
  const e = String(email || '').toLowerCase();
  return e ? `tm_creator_header_${e}` : 'tm_creator_header';
}

function tmGetMeUser() {
  try { return tmMeCache || window.__tmMe || null; } catch { return tmMeCache || null; }
}

function tmGetMeBio() {
  const u = tmGetMeUser();
  const packed = u?.creatorApplication?.contentStyle || '';
  return tmGetPacked(packed, 'Bio') || '';
}

function tmInitials(name) {
  const s = String(name || '').trim();
  if (!s) return 'ME';
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : (parts[0]?.[1] || '');
  return (a + b).toUpperCase() || 'ME';
}

function tmEnsureBankingUI() {
  if (tmBankState.uiReady) return true;

  tmBankUI.view = document.getElementById('view-become-creator');
  if (!tmBankUI.view) return false;

  tmBankUI.bio = document.getElementById('setup-bio');
  tmBankUI.count = tmBankUI.view.querySelector('.char-count');
  tmBankUI.saveBtn = tmBankUI.view.querySelector('.btn-save-setup');

  tmBankUI.header = tmBankUI.view.querySelector('.setup-header-img');
  tmBankUI.headerCam = tmBankUI.header ? tmBankUI.header.querySelector('.cam-circle') : null;

  tmBankUI.avatar = tmBankUI.view.querySelector('.setup-avatar-placeholder');
  tmBankUI.avatarCam = tmBankUI.avatar ? tmBankUI.avatar.querySelector('.avatar-cam-overlay') : null;
  tmBankUI.avatarSpan = tmBankUI.avatar ? tmBankUI.avatar.querySelector('span') : null;

  // Hidden inputs
  const mkInput = (name) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.display = 'none';
    inp.setAttribute('aria-hidden', 'true');
    inp.dataset.tm = name;
    tmBankUI.view.appendChild(inp);
    return inp;
  };
  tmBankUI.inputAvatar = mkInput('avatar');
  tmBankUI.inputHeader = mkInput('header');

  tmBankState.uiReady = true;
  return true;
}

function tmUpdateBioCount() {
  if (!tmBankUI.bio || !tmBankUI.count) return;
  const n = String(tmBankUI.bio.value || '').length;
  tmBankUI.count.textContent = `${n}/1000`;
}

function tmApplyHeaderPreview(dataUrl) {
  if (!tmBankUI.header) return;
  if (dataUrl) {
    tmBankUI.header.style.backgroundImage = `url('${dataUrl}')`;
    tmBankUI.header.style.backgroundSize = 'cover';
    tmBankUI.header.style.backgroundPosition = 'center';
  } else {
    tmBankUI.header.style.backgroundImage = '';
  }
}

function tmApplyAvatarPreview(dataUrl) {
  if (!tmBankUI.avatar) return;

  // Create / reuse <img> inside placeholder
  if (!tmBankUI.avatarImg) {
    const img = document.createElement('img');
    img.alt = 'Avatar';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.style.position = 'absolute';
    img.style.inset = '0';
    img.style.zIndex = '0';
    tmBankUI.avatar.insertBefore(img, tmBankUI.avatar.firstChild);
    tmBankUI.avatarImg = img;
  }

  if (dataUrl) {
    tmBankUI.avatarImg.src = dataUrl;
    if (tmBankUI.avatarSpan) tmBankUI.avatarSpan.style.visibility = 'hidden';
  } else {
    tmBankUI.avatarImg.removeAttribute('src');
    if (tmBankUI.avatarSpan) tmBankUI.avatarSpan.style.visibility = 'visible';
  }
}

function tmHasBankingChanges() {
  const bioNow = String(tmBankUI.bio?.value || '').trim();
  const bioChanged = bioNow !== String(tmBankState.initialBio || '').trim();
  return !!(bioChanged || tmBankState.pendingAvatarDataUrl || tmBankState.pendingHeaderDataUrl);
}

function tmSetBankingSaveEnabled() {
  if (!tmBankUI.saveBtn) return;
  const can = tmHasBankingChanges() && !tmBankState.saving;
  tmBankUI.saveBtn.disabled = !can;
}

function tmReadFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Unable to read image'));
    fr.readAsDataURL(file);
  });
}

function tmDownscaleDataUrl(dataUrl, maxDim = 512, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w0 = img.naturalWidth || img.width || 0;
      const h0 = img.naturalHeight || img.height || 0;
      if (!w0 || !h0) return resolve(String(dataUrl || ''));

      const scale = Math.min(1, maxDim / Math.max(w0, h0));
      const w = Math.max(1, Math.round(w0 * scale));
      const h = Math.max(1, Math.round(h0 * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      // Use JPEG for size
      const out = canvas.toDataURL('image/jpeg', quality);
      resolve(out);
    };
    img.onerror = () => reject(new Error('Invalid image file'));
    img.src = String(dataUrl || '');
  });
}

async function tmCompressImageFile(file, { maxDim = 512, quality = 0.82 } = {}) {
  const raw = await tmReadFileAsDataUrl(file);
  return tmDownscaleDataUrl(raw, maxDim, quality);
}

async function tmPostJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.ok !== true) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ---------------- Support (Email-only) ----------------
// Opens a lightweight support email modal and sends to backend /api/support/email
function tmSupportEnsureEmailModal() {
  const existing = document.getElementById('tm-support-email-modal');
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.id = 'tm-support-email-modal';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '18px';
  overlay.style.background = 'rgba(0,0,0,0.62)';

  overlay.innerHTML = `
    <div style="width: min(560px, 100%); border-radius: 18px; border: 1px solid rgba(255,255,255,0.10); background: rgba(7,11,18,0.98); box-shadow: 0 22px 80px rgba(0,0,0,0.55);">
      <div style="display:flex; align-items:center; justify-content:space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div style="font-weight: 900; letter-spacing: 0.2px;">Support (Email)</div>
        <button type="button" id="tm-support-email-close" style="border: 1px solid rgba(255,255,255,0.14); background: transparent; color: #fff; width: 34px; height: 34px; border-radius: 12px; cursor:pointer;">✕</button>
      </div>
      <div style="padding: 14px 16px; display:flex; flex-direction:column; gap: 10px;">
        <div style="font-size:12px; color: rgba(255,255,255,0.68); line-height: 1.45;">
          Send us a support email. We’ll reply to your account email.
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:12px; color: rgba(255,255,255,0.75); font-weight:800;">Subject</label>
          <input id="tm-support-email-subject" type="text" placeholder="e.g. Billing issue / App bug / Account" 
            style="width:100%; padding: 12px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); color:#fff; outline:none;" />
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:12px; color: rgba(255,255,255,0.75); font-weight:800;">Message</label>
          <textarea id="tm-support-email-message" rows="6" placeholder="Describe the issue clearly. Include what you expected vs what happened."
            style="width:100%; padding: 12px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); color:#fff; outline:none; resize: vertical;"></textarea>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div id="tm-support-email-count" style="font-size:11px; color: rgba(255,255,255,0.55);">0/5000</div>
            <div style="font-size:11px; color: rgba(255,255,255,0.55);">Tip: include screenshots link if any.</div>
          </div>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; padding-top: 4px;">
          <button type="button" id="tm-support-email-cancel"
            style="padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color:#fff; font-weight:900; cursor:pointer;">Cancel</button>
          <button type="button" id="tm-support-email-send"
            style="padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(100,233,238,0.28); background: rgba(100,233,238,0.10); color: var(--primary-cyan, #64E9EE); font-weight: 950; cursor:pointer;">Send</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => tmSupportCloseEmailModal();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const btnX = overlay.querySelector('#tm-support-email-close');
  const btnCancel = overlay.querySelector('#tm-support-email-cancel');
  if (btnX) btnX.addEventListener('click', close);
  if (btnCancel) btnCancel.addEventListener('click', close);

  const msg = overlay.querySelector('#tm-support-email-message');
  const count = overlay.querySelector('#tm-support-email-count');
  if (msg && count) {
    const updateCount = () => {
      const v = String(msg.value || '');
      count.textContent = `${Math.min(v.length, 5000)}/5000`;
    };
    msg.addEventListener('input', updateCount);
    updateCount();
  }

  const btnSend = overlay.querySelector('#tm-support-email-send');
  if (btnSend) {
    btnSend.addEventListener('click', async () => {
      const subjEl = overlay.querySelector('#tm-support-email-subject');
      const msgEl = overlay.querySelector('#tm-support-email-message');
      const subject = String(subjEl?.value || '').trim();
      const message = String(msgEl?.value || '').trim();

      if (!subject || !message) {
        try { TopToast.fire({ icon: 'error', title: 'Please fill subject and message' }); } catch (_) {}
        return;
      }
      if (subject.length > 120) {
        try { TopToast.fire({ icon: 'error', title: 'Subject too long (max 120 chars)' }); } catch (_) {}
        return;
      }
      if (message.length > 5000) {
        try { TopToast.fire({ icon: 'error', title: 'Message too long (max 5000 chars)' }); } catch (_) {}
        return;
      }

      // Disable while sending
      btnSend.disabled = true;
      btnSend.style.opacity = '0.6';
      btnSend.style.cursor = 'not-allowed';

      try {
        await tmPostJson('/api/support/email', {
          subject,
          message,
          page: String(location?.href || ''),
          meta: {
            ua: navigator.userAgent || '',
            tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
            lang: navigator.language || ''
          }
        });

        try { TopToast.fire({ icon: 'success', title: 'Support email sent' }); } catch (_) {}
        try { subjEl.value = ''; msgEl.value = ''; } catch (_) {}
        tmSupportCloseEmailModal();
      } catch (err) {
        console.error(err);
        const msg = String(err?.message || 'Unable to send email');
        try { TopToast.fire({ icon: 'error', title: msg }); } catch (_) {}
      } finally {
        btnSend.disabled = false;
        btnSend.style.opacity = '';
        btnSend.style.cursor = 'pointer';
      }
    });
  }

  return overlay;
}

function tmSupportOpenEmailModal(prefill = {}) {
  const overlay = tmSupportEnsureEmailModal();
  const subjEl = overlay.querySelector('#tm-support-email-subject');
  const msgEl = overlay.querySelector('#tm-support-email-message');
  try {
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');

    if (subjEl && !subjEl.value) {
      subjEl.value = String(prefill.subject || 'Support request');
    }
    if (msgEl && !msgEl.value) {
      const hint = prefill.message ? String(prefill.message) : '';
      msgEl.value = hint;
      msgEl.dispatchEvent(new Event('input'));
    }
    window.setTimeout(() => {
      try { (subjEl || msgEl)?.focus(); } catch (_) {}
    }, 20);
  } catch (_) {}
}

function tmSupportCloseEmailModal() {
  const overlay = document.getElementById('tm-support-email-modal');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
}

function tmLoadBankingFromCache() {
  if (!tmEnsureBankingUI()) return;

  const u = tmGetMeUser();
  const bio = tmGetMeBio();

  // Bio
  if (tmBankUI.bio) tmBankUI.bio.value = bio || '';
  tmBankState.initialBio = bio || '';
  tmUpdateBioCount();

  // Initials
  const nm = (document.getElementById('creatorProfileName')?.textContent || u?.name || 'Me');
  if (tmBankUI.avatarSpan) tmBankUI.avatarSpan.textContent = tmInitials(nm);

  // Avatar preview (from me)
  const av = u?.avatarUrl || '';
  tmApplyAvatarPreview(av);

  // Header preview (backend-first; local fallback only if backend is empty)
  try {
    const hdr = String(u?.headerUrl || '').trim();
    if (hdr) {
      tmApplyHeaderPreview(hdr);
    } else {
      const email = u?.email || '';
      const k = tmBankHeaderKey(email);
      const localHdr = window.localStorage ? (window.localStorage.getItem(k) || '') : '';
      if (localHdr) tmApplyHeaderPreview(localHdr);
    }
  } catch {}

  // Reset pending
  tmBankState.pendingAvatarDataUrl = '';
  tmBankState.pendingHeaderDataUrl = '';
  tmSetBankingSaveEnabled();
}

async function tmSaveBanking() {
  if (!tmEnsureBankingUI()) return;
  if (tmBankState.saving) return;

  const u = tmGetMeUser();
  const email = u?.email || '';

  const bioNow = String(tmBankUI.bio?.value || '').trim();
  const bioChanged = bioNow !== String(tmBankState.initialBio || '').trim();

  const hasPending = !!(bioChanged || tmBankState.pendingAvatarDataUrl || tmBankState.pendingHeaderDataUrl);
  if (!hasPending) {
    tmSetBankingSaveEnabled();
    return;
  }

  tmBankState.saving = true;
  if (tmBankUI.saveBtn) {
    tmBankUI.saveBtn.disabled = true;
    tmBankUI.saveBtn.textContent = 'Saving...';
  }

  try {
    // Avatar → backend
    if (tmBankState.pendingAvatarDataUrl) {
      await tmPostJson('/api/me/profile', { avatarDataUrl: tmBankState.pendingAvatarDataUrl });
      tmBankState.pendingAvatarDataUrl = '';
    }

    // Header → backend (+ local fallback cache)
    if (tmBankState.pendingHeaderDataUrl) {
      const hdr = tmBankState.pendingHeaderDataUrl;
      await tmPostJson('/api/me/profile', { headerDataUrl: hdr });
      try {
        const k = tmBankHeaderKey(email);
        window.localStorage && window.localStorage.setItem(k, hdr);
      } catch {}
      tmBankState.pendingHeaderDataUrl = '';
    }

    // Bio → creator application
    if (bioChanged) {
      const prevPacked = u?.creatorApplication?.contentStyle || '';
      const nextPacked = tmSetPacked(prevPacked, 'Bio', bioNow);
      await tmPostJson('/api/me/creator/profile', { contentStyle: nextPacked });
      tmBankState.initialBio = bioNow;
    }

    // Refresh shared UI
    try { await tmHydrateCreatorsFromMe(); } catch {}
    tmLoadBankingFromCache();

    // Let other modules (profile card, header, etc.) refresh if they listen
    try {
      window.dispatchEvent(new CustomEvent('tm:me-updated', { detail: { reason: 'creator_banking_saved' } }));
    } catch (_) {}

    try { TopToast.fire({ icon: 'success', title: 'Saved' }); } catch {}
  } catch (err) {
    console.error('Bank details save error:', err);
    try { TopToast.fire({ icon: 'error', title: err?.message || 'Unable to save' }); } catch {}
  } finally {
    tmBankState.saving = false;
    if (tmBankUI.saveBtn) tmBankUI.saveBtn.textContent = 'Save changes';
    tmSetBankingSaveEnabled();
  }
}

function tmInitBankingView() {
  if (!tmEnsureBankingUI()) return;

  if (tmBankUI.view.dataset.boundBank === '1') return;
  tmBankUI.view.dataset.boundBank = '1';

  // Bio input
  if (tmBankUI.bio) {
    tmBankUI.bio.addEventListener('input', () => {
      tmUpdateBioCount();
      tmSetBankingSaveEnabled();
    });
  }

  // Avatar picker
  const openAvatar = () => tmBankUI.inputAvatar && tmBankUI.inputAvatar.click();
  if (tmBankUI.avatarCam) tmBankUI.avatarCam.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openAvatar(); });
  if (tmBankUI.avatar) tmBankUI.avatar.addEventListener('click', (e) => { if (e.target === tmBankUI.avatarCam) return; openAvatar(); });

  if (tmBankUI.inputAvatar) {
    tmBankUI.inputAvatar.addEventListener('change', async () => {
      const f = tmBankUI.inputAvatar.files && tmBankUI.inputAvatar.files[0];
      tmBankUI.inputAvatar.value = '';
      if (!f) return;
      try {
        const dataUrl = await tmCompressImageFile(f, { maxDim: 512, quality: 0.82 });
        tmBankState.pendingAvatarDataUrl = dataUrl;
        tmApplyAvatarPreview(dataUrl);
        tmSetBankingSaveEnabled();
      } catch (e) {
        try { TopToast.fire({ icon: 'error', title: e?.message || 'Invalid image' }); } catch {}
      }
    });
  }

  // Header picker
  const openHeader = () => tmBankUI.inputHeader && tmBankUI.inputHeader.click();
  if (tmBankUI.headerCam) tmBankUI.headerCam.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openHeader(); });
  if (tmBankUI.header) tmBankUI.header.addEventListener('click', (e) => { if (e.target === tmBankUI.headerCam) return; openHeader(); });

  if (tmBankUI.inputHeader) {
    tmBankUI.inputHeader.addEventListener('change', async () => {
      const f = tmBankUI.inputHeader.files && tmBankUI.inputHeader.files[0];
      tmBankUI.inputHeader.value = '';
      if (!f) return;
      try {
        const dataUrl = await tmCompressImageFile(f, { maxDim: 1200, quality: 0.82 });
        tmBankState.pendingHeaderDataUrl = dataUrl;
        tmApplyHeaderPreview(dataUrl);
        tmSetBankingSaveEnabled();
      } catch (e) {
        try { TopToast.fire({ icon: 'error', title: e?.message || 'Invalid image' }); } catch {}
      }
    });
  }

  // Save
  if (tmBankUI.saveBtn) tmBankUI.saveBtn.addEventListener('click', (e) => { e.preventDefault(); tmSaveBanking(); });

  // Initial load
  tmLoadBankingFromCache();
}

function tmEnterBankingView() {
  // Ensure listeners + load latest cached values
  tmInitBankingView();
  tmLoadBankingFromCache();
}


// 🔥 TOAST CONFIGURATION 🔥
const TopToast = Swal.mixin({
  toast: true, 
  position: 'top-end', 
  showConfirmButton: false, 
  timer: 3000, 
  timerProgressBar: true, 
  background: '#0d1423', 
  color: '#fff',
  didOpen: (toast) => {
    toast.style.marginTop = '15px';
    toast.style.marginRight = '15px';
  }
});

// =============================================================
// Language (Data #6)
// - Popover Language picker (English / Español / Filipino / Русский)
// - Persist in localStorage (tm_lang)
// - Apply to elements with [data-lang] in creators.html
// =============================================================
const TM_LANG_KEY = 'tm_lang';

const TM_LANGS = {
  en: {
    label: 'English',
    strings: {
      nav_home: 'Home',
      nav_notif: 'Notifications',
      nav_msg: 'Messages',
      nav_col: 'Collections',
      nav_subs: 'Subscriptions',
      nav_card: 'Add card',
      nav_profile: 'My profile',
      nav_more: 'More',
      nav_post: 'NEW POST',

      pop_profile: 'My profile',
      pop_col: 'Collections',
      pop_set: 'Settings',
      pop_cards: 'Your cards',
      pop_cards_sub: '(to subscribe)',
      pop_creator: 'Become a creator',
      pop_creator_sub: '(to earn)',
      pop_help: 'Help and support',
      pop_dark: 'Dark mode',
      pop_logout: 'Log out'
    }
  },
  es: {
    label: 'Español',
    strings: {
      nav_home: 'Inicio',
      nav_notif: 'Notificaciones',
      nav_msg: 'Mensajes',
      nav_col: 'Colecciones',
      nav_subs: 'Suscripciones',
      nav_card: 'Agregar tarjeta',
      nav_profile: 'Mi perfil',
      nav_more: 'Más',
      nav_post: 'NUEVO POST',

      pop_profile: 'Mi perfil',
      pop_col: 'Colecciones',
      pop_set: 'Ajustes',
      pop_cards: 'Tus tarjetas',
      pop_cards_sub: '(para suscribirte)',
      pop_creator: 'Conviértete en creador',
      pop_creator_sub: '(para ganar)',
      pop_help: 'Ayuda y soporte',
      pop_dark: 'Modo oscuro',
      pop_logout: 'Cerrar sesión'
    }
  },
  tl: {
    label: 'Filipino',
    strings: {
      nav_home: 'Home',
      nav_notif: 'Notifications',
      nav_msg: 'Messages',
      nav_col: 'Collections',
      nav_subs: 'Subscriptions',
      nav_card: 'Add card',
      nav_profile: 'My profile',
      nav_more: 'More',
      nav_post: 'NEW POST',

      pop_profile: 'My profile',
      pop_col: 'Collections',
      pop_set: 'Settings',
      pop_cards: 'Your cards',
      pop_cards_sub: '(to subscribe)',
      pop_creator: 'Become a creator',
      pop_creator_sub: '(to earn)',
      pop_help: 'Help and support',
      pop_dark: 'Dark mode',
      pop_logout: 'Log out'
    }
  },
  ru: {
    label: 'Русский',
    strings: {
      nav_home: 'Главная',
      nav_notif: 'Уведомления',
      nav_msg: 'Сообщения',
      nav_col: 'Коллекции',
      nav_subs: 'Подписки',
      nav_card: 'Добавить карту',
      nav_profile: 'Профиль',
      nav_more: 'Ещё',
      nav_post: 'НОВЫЙ ПОСТ',

      pop_profile: 'Профиль',
      pop_col: 'Коллекции',
      pop_set: 'Настройки',
      pop_cards: 'Ваши карты',
      pop_cards_sub: '(для подписки)',
      pop_creator: 'Стать автором',
      pop_creator_sub: '(чтобы заработать)',
      pop_help: 'Помощь и поддержка',
      pop_dark: 'Тёмный режим',
      pop_logout: 'Выйти'
    }
  }
};

function tmGetLang() {
  try {
    const v = localStorage.getItem(TM_LANG_KEY);
    if (v && TM_LANGS[v]) return v;
  } catch (_) {}
  return 'en';
}

function tmUpdateLangLabel(langCode) {
  const el = document.getElementById('popover-lang-label');
  const lang = TM_LANGS[langCode] || TM_LANGS.en;
  if (!el) return;
  el.innerHTML = `<i class="fa-solid fa-globe"></i> ${lang.label}`;
}

function tmApplyLang(langCode) {
  const code = TM_LANGS[langCode] ? langCode : 'en';
  const lang = TM_LANGS[code] || TM_LANGS.en;

  try { document.documentElement.setAttribute('lang', code); } catch (_) {}

  try {
    document.querySelectorAll('[data-lang]').forEach((node) => {
      const key = node.getAttribute('data-lang');
      const v = lang.strings[key];
      if (typeof v === 'string' && v.length) node.textContent = v;
    });
  } catch (_) {}

  tmUpdateLangLabel(code);

  try {
    const sel = document.querySelector('#settings-lang-select');
    if (sel) sel.value = code;
  } catch (_) {}
}

function tmSetLang(langCode) {
  const code = TM_LANGS[langCode] ? langCode : 'en';
  try { localStorage.setItem(TM_LANG_KEY, code); } catch (_) {}
  tmApplyLang(code);
  try { TopToast.fire({ icon: 'success', title: 'Language saved' }); } catch (_) {}
}

async function tmOpenLangPicker() {
  const current = tmGetLang();
  const opts = Object.entries(TM_LANGS).reduce((acc, [k, v]) => {
    acc[k] = v.label;
    return acc;
  }, {});

  if (!window.Swal || typeof window.Swal.fire !== 'function') {
    const keys = Object.keys(TM_LANGS);
    const idx = Math.max(0, keys.indexOf(current));
    const next = keys[(idx + 1) % keys.length] || 'en';
    tmSetLang(next);
    return;
  }

  const res = await window.Swal.fire({
    title: 'Language',
    input: 'select',
    inputOptions: opts,
    inputValue: current,
    showCancelButton: true,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
    heightAuto: false
  });

  if (res && res.isConfirmed) {
    tmSetLang(res.value || 'en');
  }
}


// 🔥 SWEETALERT FIX 🔥
const originalSwalFire = Swal.fire;
Swal.fire = function(args) {
    const isToast = args.toast === true; 

    const config = { ...args };
    if (!isToast) {
        config.heightAuto = false;
        config.scrollbarPadding = false;
    }

    config.didOpen = (popup) => {
        const container = Swal.getContainer();
        if(container) {
            container.style.zIndex = '2147483647'; 
            
            if (isToast) {
                container.style.setProperty('background-color', 'transparent', 'important');
                container.style.setProperty('width', 'auto', 'important');
                container.style.setProperty('height', 'auto', 'important');
                container.style.setProperty('inset', 'auto', 'important'); 
                container.style.setProperty('pointer-events', 'none', 'important'); 
                popup.style.pointerEvents = 'auto'; 
            } else {
                container.style.position = 'fixed';
                container.style.inset = '0';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            }
        }
        if (args.didOpen) args.didOpen(popup);
    };

    return originalSwalFire.call(this, config);
};


/* =========================
   Profile: Share + Status
   ========================= */

let __tmProfileActionsBound = false;
let __tmStatusMenuOpen = false;

function tmNormalizeStatus(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return 'Available';
  if (v === 'available' || v === 'online') return 'Available';
  if (v === 'away') return 'Away';
  if (v === 'busy' || v === 'dnd' || v === 'do not disturb') return 'Busy';
  if (raw === 'Available' || raw === 'Away' || raw === 'Busy') return raw;
  return 'Available';
}

function tmStatusColor(status) {
  const s = tmNormalizeStatus(status);
  if (s === 'Busy') return '#ff4d4f';
  if (s === 'Away') return '#f5c542';
  return '#46e85e';
}

function tmApplyCreatorStatus(status) {
  const s = tmNormalizeStatus(status);
  const color = tmStatusColor(s);

  const label = document.getElementById('profile-status-label');
  if (label) label.textContent = s;

  const dot = document.getElementById('profile-status-dot');
  if (dot) dot.style.background = color;

  const sidebarDot = document.querySelector('.profile-header-card .status-indicator');
  if (sidebarDot) sidebarDot.style.background = color;

  const popDot = document.querySelector('#settings-popover .pop-online');
  if (popDot) popDot.style.background = color;

  const menu = document.getElementById('profile-status-menu');
  if (menu) {
    menu.querySelectorAll('.tm-status-item').forEach(btn => {
      const isActive = tmNormalizeStatus(btn.getAttribute('data-status')) === s;
      btn.style.background = isActive ? 'rgba(255,255,255,0.08)' : 'transparent';
    });
  }
}

async function tmApiSetCreatorStatus(status) {
  const s = tmNormalizeStatus(status);
  const res = await fetch('/api/me/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status: s })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || !data.ok) {
    const msg = (data && data.message) ? data.message : 'Unable to save status';
    throw new Error(msg);
  }
  return tmNormalizeStatus(data.status || s);
}

function tmGetProfileShareUrl() {
  const base = window.location.origin + window.location.pathname;
  return base + '#profile';
}

async function tmCopyToClipboard(text) {
  const t = String(text || '');
  if (!t) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(t);
      return true;
    }
  } catch {}

  try {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {}

  return false;
}

function tmCloseStatusMenu() {
  const menu = document.getElementById('profile-status-menu');
  if (!menu) return;
  menu.style.display = 'none';
  menu.setAttribute('aria-hidden', 'true');
  __tmStatusMenuOpen = false;
}

function tmOpenStatusMenu(anchorEl) {
  const menu = document.getElementById('profile-status-menu');
  if (!menu || !anchorEl) return;

  const rect = anchorEl.getBoundingClientRect();

  const margin = 10;
  const menuW = Math.max(190, menu.offsetWidth || 190);
  const menuH = Math.max(140, menu.offsetHeight || 140);

  let left = rect.left;
  let top = rect.bottom + 8;

  left = Math.min(left, window.innerWidth - menuW - margin);
  left = Math.max(margin, left);

  if (top + menuH + margin > window.innerHeight) {
    top = rect.top - menuH - 8;
    if (top < margin) top = margin;
  }

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.display = 'block';
  menu.setAttribute('aria-hidden', 'false');
  __tmStatusMenuOpen = true;

  const label = document.getElementById('profile-status-label');
  tmApplyCreatorStatus(label ? label.textContent : 'Available');
}

function tmInitProfileShareAndStatus() {
  if (__tmProfileActionsBound) return;
  __tmProfileActionsBound = true;

  const shareBtn = document.getElementById('btn-profile-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      try {
        const url = tmGetProfileShareUrl();
        const name = (document.getElementById('creatorHeaderName')?.textContent || 'My profile').trim();
        const handle = (document.getElementById('creatorHeaderHandle')?.textContent || '').trim();
        const title = handle ? `${name} (${handle})` : name;

        if (navigator.share) {
          try {
            await navigator.share({ title, text: 'View my iTRUEMATCH creator profile', url });
            if (TopToast && TopToast.success) TopToast.success('Shared');
            return;
          } catch {
            // fallback to copy
          }
        }

        const ok = await tmCopyToClipboard(url);
        if (ok) TopToast?.success?.('Link copied');
        else TopToast?.error?.('Copy failed');
      } catch {
        TopToast?.error?.('Share failed');
      }
    });
  }

  const statusTrigger = document.getElementById('profile-status-trigger');
  const menu = document.getElementById('profile-status-menu');

  if (statusTrigger && menu) {
    statusTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (__tmStatusMenuOpen) tmCloseStatusMenu();
      else tmOpenStatusMenu(statusTrigger);
    });

    menu.addEventListener('click', async (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('.tm-status-item') : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const next = btn.getAttribute('data-status') || 'Available';
      try {
        tmApplyCreatorStatus(next);
        tmCloseStatusMenu();

        const saved = await tmApiSetCreatorStatus(next);
        tmApplyCreatorStatus(saved);
        TopToast?.success?.('Status updated');
      } catch (err) {
        TopToast?.error?.(err?.message || 'Unable to save status');
      }
    });

    document.addEventListener('click', () => {
      if (__tmStatusMenuOpen) tmCloseStatusMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && __tmStatusMenuOpen) tmCloseStatusMenu();
    });

    window.addEventListener('resize', () => {
      if (__tmStatusMenuOpen) tmOpenStatusMenu(statusTrigger);
    });
  }
}


async function init() {
  console.log("App Init...");
  
  await Promise.all([
      loadView('container-messages', 'assets/views/message.html'), 
      loadView('container-settings', 'assets/views/settings.html'),
      loadView('container-notifications', 'assets/views/notifications.html'),
      loadView('container-collections', 'assets/views/collections.html')
  ]);
  
  // Apply saved language (before modules render dynamic UI)
  try { tmApplyLang(tmGetLang()); } catch (e) { console.error(e); }

  // Initialize Modules
  initHome(TopToast);
  initNotifications();
  initMessages(TopToast);
  initCollections(TopToast);
  initWallet(TopToast);
  initSettings();
  initCardTabs(); 
  
  // 🔥 RENAMED TO AVOID CONFLICT 🔥
  initProfileTabs(); 
  
  initNewPostButton();
  initSwipeGestures(); 

  // Mobile full-screen composer (Option C)
  ensureComposeSheet();
  
  injectSidebarToggles();
  ensureFooterHTML();
  
  setupGlobalEvents(); 
  
  if (DOM.themeToggle) {
      DOM.themeToggle.checked = document.body.classList.contains('tm-dark');
      DOM.themeToggle.addEventListener('change', function() {
          if (this.checked) {
              document.body.classList.remove('tm-light'); document.body.classList.add('tm-dark');
          } else {
              document.body.classList.remove('tm-dark'); document.body.classList.add('tm-light');
          }
      });
  }

  setupNavigation();
  tmBindProfileBackButton();
  tmBindPopoverCollections();
  tmInitGlobalSearch();
  tmInitSuggestionsSidebar();
  await tmHydrateCreatorsFromMe();
  try { tmBindCreatorAccessPaywall(); } catch (e) { console.error(e); }
  try { tmEnforceCreatorAccess(); } catch (e) { console.error(e); }
  try { tmInitBankingView(); } catch (e) { console.error(e); }

  
  tmInitProfileShareAndStatus();
setTimeout(() => { 
      if(DOM.appLoader) { 
          DOM.appLoader.style.opacity = '0'; DOM.appLoader.style.visibility = 'hidden'; 
          setTimeout(() => { if(DOM.appLoader.parentNode) DOM.appLoader.parentNode.removeChild(DOM.appLoader); }, 500); 
      } 
  }, 500);

  const lastView = localStorage.getItem('tm_last_view') || 'home';
  switchView(lastView);
}

function initSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 80;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        if (touchEndX > touchStartX + minSwipeDistance) {
            // If compose sheet is open, close it first.
            if (isComposeSheetOpen()) {
                closeComposeSheet();
                return;
            }
            if (DOM.popover && DOM.popover.classList.contains('is-open')) {
                DOM.popover.classList.remove('is-open');
                return;
            }
            if (DOM.rightSidebar && DOM.rightSidebar.classList.contains('mobile-active')) {
                DOM.rightSidebar.classList.remove('mobile-active');
                return;
            }
            const msgView = document.getElementById('view-messages');
            if (msgView && msgView.classList.contains('mobile-chat-active')) {
                msgView.classList.remove('mobile-chat-active');
                return;
            }
            const current = localStorage.getItem('tm_last_view');
            if (current && current !== 'home') {
                switchView('home');
                return;
            }
        }
    }
}

// =============================================================
// MOBILE FULL-SCREEN COMPOSER (Option C)
// - Desktop: focus inline composer
// - Mobile (<= 768px): open a full-screen sheet and move the existing
//   .compose-area into it so Home module listeners still work.
// =============================================================
const tmComposeSheet = {
    overlay: null,
    body: null,
    closeBtn: null,
    isOpen: false,
    originParent: null,
    originNextSibling: null,
    composeEl: null
};

function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function isComposeSheetOpen() {
    return !!tmComposeSheet.isOpen;
}

function ensureComposeSheet() {
    if (document.getElementById('tm-compose-sheet')) {
        // If it already exists (e.g., hot reload), re-bind references.
        tmComposeSheet.overlay = document.getElementById('tm-compose-sheet');
        tmComposeSheet.body = document.getElementById('tmComposeSheetBody');
        tmComposeSheet.closeBtn = document.getElementById('tmComposeSheetClose');
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'tm-compose-sheet';
    overlay.className = 'tm-compose-sheet';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="tm-sheet" role="dialog" aria-modal="true" aria-label="New post">
            <div class="tm-sheet-header">
                <button type="button" id="tmComposeSheetClose" class="tm-sheet-close" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="tm-sheet-title">New post</div>
                <div class="tm-sheet-spacer"></div>
            </div>
            <div class="tm-sheet-body" id="tmComposeSheetBody"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    tmComposeSheet.overlay = overlay;
    tmComposeSheet.body = overlay.querySelector('#tmComposeSheetBody');
    tmComposeSheet.closeBtn = overlay.querySelector('#tmComposeSheetClose');

    if (tmComposeSheet.closeBtn) {
        tmComposeSheet.closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeComposeSheet();
        });
    }

    overlay.addEventListener('click', (e) => {
        // Close only when clicking on the dimmed backdrop.
        if (e.target === overlay) closeComposeSheet();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isComposeSheetOpen()) closeComposeSheet();
    });

    window.addEventListener('resize', () => {
        // If user rotates / resizes to desktop while sheet is open, close it.
        if (isComposeSheetOpen() && !isMobileViewport()) closeComposeSheet();
    });
}

function openComposeSheet() {
    ensureComposeSheet();
    if (!tmComposeSheet.overlay || !tmComposeSheet.body) return;

    // Always open over Home view.
    switchView('home');

    const composeEl = document.querySelector('#view-home .compose-area');
    if (!composeEl) return;

    if (!tmComposeSheet.originParent) {
        tmComposeSheet.originParent = composeEl.parentNode;
        tmComposeSheet.originNextSibling = composeEl.nextSibling;
    }
    tmComposeSheet.composeEl = composeEl;

    // Move composer into the sheet (keeps listeners from home.js intact).
    tmComposeSheet.body.innerHTML = '';
    tmComposeSheet.body.appendChild(composeEl);

    document.body.classList.add('compose-sheet-open');
    tmComposeSheet.overlay.classList.add('is-open');
    tmComposeSheet.overlay.setAttribute('aria-hidden', 'false');
    tmComposeSheet.isOpen = true;

    // Focus textarea after paint.
    requestAnimationFrame(() => {
        const ta = document.getElementById('compose-input');
        if (ta) ta.focus();
    });
}

function closeComposeSheet() {
    if (!isComposeSheetOpen()) return;
    ensureComposeSheet();
    if (!tmComposeSheet.overlay) return;

    // Restore composer back to its original place.
    try {
        const el = tmComposeSheet.composeEl;
        if (el && tmComposeSheet.originParent) {
            const parent = tmComposeSheet.originParent;
            const next = tmComposeSheet.originNextSibling;
            if (next && next.parentNode === parent) parent.insertBefore(el, next);
            else parent.appendChild(el);
        }
    } catch (err) {
        console.warn('Compose sheet restore failed:', err);
    }

    tmComposeSheet.overlay.classList.remove('is-open');
    tmComposeSheet.overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('compose-sheet-open');
    tmComposeSheet.isOpen = false;
}

function setupGlobalEvents() {
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.header-toggle-btn');
        if (toggleBtn) {
            e.stopPropagation();
            e.preventDefault();
            const popover = document.getElementById('settings-popover');
            if (popover) popover.classList.add('is-open');
        }
    });

    if (DOM.btnMore) {
        DOM.btnMore.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const popover = document.getElementById('settings-popover');
            if(popover) popover.classList.toggle('is-open');
        });
    }

    const btnClose = document.getElementById('btnClosePopover');
    if(btnClose) {
        btnClose.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const popover = document.getElementById('settings-popover');
            if(popover) popover.classList.remove('is-open');
        });
    }

    document.addEventListener('click', (e) => {
        const popover = document.getElementById('settings-popover');
        const toggleBtn = e.target.closest('.header-toggle-btn');
        const moreBtn = e.target.closest('#trigger-more-btn');
        
        if (popover && popover.classList.contains('is-open')) {
            if (!popover.contains(e.target) && !toggleBtn && !moreBtn) {
                popover.classList.remove('is-open');
            }
        }
    });

    // Refresh derived UI when profile/settings updates /api/me
    if (!window.__tmBoundMeUpdated) {
        window.__tmBoundMeUpdated = true;
        window.addEventListener('tm:me-updated', async () => {
            try { await tmHydrateCreatorsFromMe(); } catch (e) { console.error(e); }
            try { tmLoadBankingFromCache(); } catch (_) {}
            try { tmEnforceCreatorAccess(); } catch (_) {}
        });
    }
}

function initNewPostButton() {
    const btnNewPost = document.querySelector('.btn-new-post');
    if (btnNewPost) {
        btnNewPost.addEventListener('click', () => {
            // Desktop/tablet: focus the inline composer.
            // Mobile: open the full-screen compose sheet (Option C).
            if (isMobileViewport()) {
                openComposeSheet();
                return;
            }

            switchView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const ta = document.getElementById('compose-input');
            if (ta) setTimeout(() => ta.focus(), 250);
        });
    }
}

function initCardTabs() {
    if(DOM.btnTabCards && DOM.btnTabPayments) {
        DOM.btnTabCards.addEventListener('click', () => {
            DOM.btnTabCards.classList.add('active'); DOM.btnTabPayments.classList.remove('active');
            if(DOM.tabContentCards) DOM.tabContentCards.classList.remove('hidden');
            if(DOM.tabContentPayments) DOM.tabContentPayments.classList.add('hidden');
        });
        DOM.btnTabPayments.addEventListener('click', () => {
            DOM.btnTabPayments.classList.add('active'); DOM.btnTabCards.classList.remove('active');
            if(DOM.tabContentPayments) DOM.tabContentPayments.classList.remove('hidden');
            if(DOM.tabContentCards) DOM.tabContentCards.classList.add('hidden');
        });
    }
}

// 🔥 RENAMED FUNCTION TO AVOID CONFLICT 🔥
function initProfileTabs() {
    const tabPosts = document.getElementById('tab-profile-posts');
    const tabMedia = document.getElementById('tab-profile-media');
    const contentPosts = document.getElementById('profile-content-posts');
    const contentMedia = document.getElementById('profile-content-media');
    const btnEdit = document.getElementById('btn-edit-profile');

    if(tabPosts && tabMedia) {
        tabPosts.addEventListener('click', () => {
            tabPosts.style.borderBottomColor = 'var(--text)';
            tabPosts.style.color = 'var(--text)';
            tabMedia.style.borderBottomColor = 'transparent';
            tabMedia.style.color = 'var(--muted)';
            contentPosts.classList.remove('hidden');
            contentMedia.classList.add('hidden');
        });

        tabMedia.addEventListener('click', () => {
            tabMedia.style.borderBottomColor = 'var(--text)';
            tabMedia.style.color = 'var(--text)';
            tabPosts.style.borderBottomColor = 'transparent';
            tabPosts.style.color = 'var(--muted)';
            contentMedia.classList.remove('hidden');
            contentPosts.classList.add('hidden');
        });
    }



    // Language picker (popover)
    const __tmLangLabel = document.getElementById('popover-lang-label');
    if (__tmLangLabel && !__tmLangLabel.__tmBound) {
        __tmLangLabel.__tmBound = true;
        __tmLangLabel.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                const pop = document.getElementById('settings-popover');
                if (pop) pop.classList.remove('is-open');
            } catch (_) {}
            try { tmOpenLangPicker(); } catch (err) { console.error(err); }
        });
    }

    if(btnEdit) {
        btnEdit.addEventListener('click', () => {
            switchView('settings');
        });
    }
}

function setupNavigation() {
    if (DOM.navHome) DOM.navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
    if (DOM.navNotif) DOM.navNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
    if (DOM.navMessages) DOM.navMessages.addEventListener('click', (e) => { e.preventDefault(); switchView('messages'); });
    if (DOM.navCollections) DOM.navCollections.addEventListener('click', (e) => { e.preventDefault(); switchView('collections'); });
    if (DOM.navProfile) DOM.navProfile.addEventListener('click', (e) => { e.preventDefault(); switchView('profile'); });
    if (DOM.navAddCard) DOM.navAddCard.addEventListener('click', (e) => { e.preventDefault(); switchView('add-card'); });

    if (DOM.profileCard) {
        DOM.profileCard.addEventListener('click', (e) => {
            if (e.target.closest('.ph-settings')) {
                switchView('settings');
            } else {
                switchView('profile');
            }
        });
    }


    if (DOM.navSubs) {
        DOM.navSubs.addEventListener('click', (e) => { 
            e.preventDefault(); 
            switchView('subscriptions'); 
        }); 
    }


    // =============================================================
    // Popover routing (robust): use explicit data-action instead of innerText
    // - Prevents breaking when language changes
    // - Prevents accidental popover-close on dark-mode toggle row
    // =============================================================
    const tmPopover = document.getElementById('settings-popover');

    function tmResolvePopoverAction(el) {
        if (!el) return '';
        const existing = (el.dataset && el.dataset.action) ? String(el.dataset.action || '').trim() : '';
        if (existing) return existing;

        // Prefer [data-lang] keys (stable across translations)
        const keyEl = el.querySelector ? el.querySelector('span[data-lang]') : null;
        const key = keyEl ? String(keyEl.getAttribute('data-lang') || '') : '';

        const map = {
            pop_profile: 'profile',
            pop_col: 'collections',
            pop_set: 'settings',
            pop_cards: 'your-cards',
            pop_creator: 'become-creator',
            pop_help: 'support',
            pop_logout: 'logout'
        };

        if (key && map[key]) return map[key];

        // Final fallback (legacy): innerText
        try {
            const text = String(el.innerText || '').trim().toLowerCase();
            if (text.includes('log out') || text.includes('logout')) return 'logout';
            if (text.includes('cards')) return 'your-cards';
            if (text.includes('add card')) return 'add-card';
            if (text.includes('settings')) return 'settings';
            if (text.includes('collections')) return 'collections';
            if (text.includes('profile')) return 'profile';
            if (text.includes('creator') || text.includes('banking')) return 'become-creator';
            if (text.includes('help')) return 'support';
        } catch (_) {}

        return '';
    }

    function tmTagPopoverActions() {
        if (!tmPopover || tmPopover.dataset.tmActionsTagged === '1') return;
        tmPopover.dataset.tmActionsTagged = '1';

        // Tag only navigational anchors + logout; exclude toggle-row and language label.
        tmPopover.querySelectorAll('.pop-item').forEach((node) => {
            try {
                if (node.id === 'popover-lang-label') return;
                if (node.classList && node.classList.contains('toggle-row')) return;
                const action = tmResolvePopoverAction(node);
                if (action) node.dataset.action = action;
            } catch (_) {}
        });
    }

    function tmClosePopover() {
        try {
            const popover = document.getElementById('settings-popover');
            if (popover) popover.classList.remove('is-open');
        } catch (_) {}
    }

    async function tmHandlePopoverAction(action, e) {
        if (e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
        }

        // Close popover for real actions (not for dark-mode toggle)
        tmClosePopover();

        if (action === 'logout') {
            try { await apiPost('/api/auth/logout', {}); } catch (_) { /* ignore */ }
            window.location.href = 'index.html';
            return;
        }

        if (action === 'support') {
            try { tmSupportOpenEmailModal({ subject: 'Support request' }); }
            catch (err) {
                console.error(err);
                try { TopToast.fire({ icon: 'error', title: 'Support unavailable' }); } catch (_) {}
            }
            return;
        }

        // View routing
        switchView(action);
    }

    // Delegate clicks from the popover container (prevents duplicate listeners)
    if (tmPopover && tmPopover.dataset.tmBoundActions !== '1') {
        tmPopover.dataset.tmBoundActions = '1';
        tmTagPopoverActions();

        tmPopover.addEventListener('click', async (e) => {
            const item = e.target && e.target.closest ? e.target.closest('.pop-item') : null;
            if (!item) return;
            if (item.id === 'popover-lang-label') return; // handled by tmOpenLangPicker listener
            if (item.classList && item.classList.contains('toggle-row')) return; // allow toggle without closing

            // Route only if there is a known action
            const action = tmResolvePopoverAction(item);
            if (!action) return;
            item.dataset.action = action;
            await tmHandlePopoverAction(action, e);
        });
    }

    const mobHome = document.getElementById('mob-nav-home');
    const mobAddCard = document.getElementById('mob-nav-add-card');
    const mobAdd = document.getElementById('mob-nav-add');
    const mobCollections = document.getElementById('mob-nav-collections');
    const mobNotif = document.getElementById('mob-nav-notif');

    if (mobHome) mobHome.addEventListener('click', () => switchView('home'));
    if (mobAddCard) mobAddCard.addEventListener('click', () => switchView('add-card'));
    if (mobCollections) mobCollections.addEventListener('click', () => switchView('collections'));
    if (mobNotif) mobNotif.addEventListener('click', () => switchView('notifications'));
    if (mobAdd) mobAdd.addEventListener('click', () => {
        // Mobile: open compose sheet. (Desktop/tablet shouldn't hit this because
        // bottom nav is hidden in CSS.)
        openComposeSheet();
    });
    
    document.addEventListener('click', (e) => {
        if(e.target.classList.contains('tablet-msg-btn')) {
            switchView('messages');
        }
    });
}

function switchView(viewName) {
    
  // Close transient overlays when changing views
  try { tmCloseStatusMenu(); } catch {}
try { localStorage.setItem('tm_last_view', viewName); } catch (_) {}

    // Close mobile settings drill-down (if open)
    if (typeof window.__tmCloseSettingsMobileDetail === 'function') {
        try { window.__tmCloseSettingsMobileDetail(); } catch(_) {}
    }

    // If a full-screen compose sheet is open, close it before navigating.
    if (isComposeSheetOpen()) {
        closeComposeSheet();
    }

    const viewSubscriptions = document.getElementById('view-subscriptions');

    const views = [
        DOM.viewHome, DOM.viewNotif, DOM.viewMessages, DOM.viewCollections, viewSubscriptions,
        DOM.viewAddCard, DOM.viewYourCards, DOM.viewBecomeCreator, 
        DOM.viewMyProfile, DOM.viewSettings
    ];

    views.forEach(el => { 
        if(el) {
            el.style.display = 'none';
            el.classList.remove('view-animate-enter');
        }
    });

    if (DOM.mainFeedColumn) {
        DOM.mainFeedColumn.classList.remove('narrow-view');
        DOM.mainFeedColumn.style.removeProperty('display'); 
    }
    
    if (DOM.rightSidebar) {
        DOM.rightSidebar.classList.remove('mobile-active');
    }

    if (window.innerWidth > 1024 && DOM.rightSidebar) {
        DOM.rightSidebar.style.display = 'flex';
        DOM.rightSidebar.classList.remove('wide-view'); 
        DOM.rightSidebar.classList.remove('hidden-sidebar');
    }

    if(DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');
    if(DOM.rsCollections) DOM.rsCollections.classList.add('hidden');
    if(DOM.rsWalletView) DOM.rsWalletView.classList.add('hidden');
    if(DOM.rsSettingsView) DOM.rsSettingsView.classList.add('hidden');
    if(document.getElementById('rs-banking-view')) document.getElementById('rs-banking-view').classList.add('hidden');

    const msgContainer = document.getElementById('container-messages');
    if(msgContainer) msgContainer.style.display = (viewName === 'messages') ? 'block' : 'none';

    let targetView = null;

    if (viewName === 'home') {
        targetView = DOM.viewHome;
        if(DOM.rsSuggestions && window.innerWidth > 1024) DOM.rsSuggestions.classList.remove('hidden');
        updateActiveNav('nav-link-home', 'mob-nav-home');
    } 
    else if (viewName === 'notifications') {
        targetView = DOM.viewNotif;
        if(DOM.rsSuggestions && window.innerWidth > 1024) DOM.rsSuggestions.classList.remove('hidden');
        updateActiveNav('nav-link-notif', 'mob-nav-notif');
    }
    else if (viewName === 'messages') {
        targetView = DOM.viewMessages;
        if(DOM.rightSidebar) DOM.rightSidebar.classList.add('hidden-sidebar');
        if (DOM.viewMessages) DOM.viewMessages.style.display = 'flex'; 
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.style.display = 'flex';
        updateActiveNav('nav-link-messages', null);
    } 
    else if (viewName === 'profile') {
        targetView = DOM.viewMyProfile;
        if(DOM.rsSuggestions && window.innerWidth > 1024) DOM.rsSuggestions.classList.remove('hidden');
        updateActiveNav('nav-link-profile', null);
        
        // 🔥 SAFE CALL: RELOAD PROFILE CONTENT ON VIEW 🔥
        try {
            initProfilePage(); 
        } catch(err) {
            console.error("Error loading profile content:", err);
        }
    }
    else if (viewName === 'collections') {
        targetView = DOM.viewCollections;
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');
        if (DOM.rsCollections) DOM.rsCollections.classList.remove('hidden');
        updateActiveNav('nav-link-collections', 'mob-nav-collections'); 
        renderCollections(); 
    }

    else if (viewName === 'subscriptions') {
        targetView = viewSubscriptions;
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');
        if (DOM.rsSuggestions && window.innerWidth > 1024) DOM.rsSuggestions.classList.remove('hidden');
        updateActiveNav('nav-link-subs', null);
    }
    else if (viewName === 'settings') {
        targetView = DOM.viewSettings;
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');
        if (DOM.rsSettingsView) DOM.rsSettingsView.classList.remove('hidden'); 
        updateActiveNav(null, null); 
    }
    else if (viewName === 'add-card') {
        targetView = DOM.viewAddCard;
        if(DOM.rsWalletView) DOM.rsWalletView.classList.remove('hidden');
        updateActiveNav('nav-link-add-card', 'mob-nav-add-card');
    }
    else if (viewName === 'your-cards') {
        targetView = DOM.viewYourCards;
        if(DOM.rsWalletView) DOM.rsWalletView.classList.remove('hidden');
    }
    else if (viewName === 'become-creator') {
        targetView = DOM.viewBecomeCreator;
        const bankingSidebar = document.getElementById('rs-banking-view');
        if(bankingSidebar) bankingSidebar.classList.remove('hidden');
    }
    
    if (targetView) {
        if (viewName !== 'messages') targetView.style.display = 'block';
        if (window.innerWidth <= 1024) {
            requestAnimationFrame(() => {
                targetView.classList.add('view-animate-enter');
            });
        }
    }

    // Apply saved post-search filter when returning to Home
    if (viewName === 'home') {
        const _q = localStorage.getItem('tm_post_search_query') || '';
        tmApplyInlinePostFilter(_q);
        const _in = document.getElementById('global-post-search-input');
        if (_in && _in.value !== _q) _in.value = _q;
    }

    // Subscriptions: load & render data when entering the view
    if (viewName === 'subscriptions') {
        try { tmEnterSubscriptionsView(); } catch (e) { console.error(e); }
    }

    // Bank details (Become a Creator): load & render data when entering the view
    if (viewName === 'become-creator') {
        try { tmEnterBankingView(); } catch (e) { console.error(e); }
    }

    injectSidebarToggles();
}

function updateActiveNav(desktopId, mobileId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mob-nav-item').forEach(el => el.classList.remove('active'));

    if(desktopId) {
        const el = document.getElementById(desktopId);
        if(el) el.classList.add('active');
    }
    if(mobileId) {
        const el = document.getElementById(mobileId);
        if(el) el.classList.add('active');
    }
}

function injectSidebarToggles() {
    const headers = document.querySelectorAll('.feed-top-header');
    headers.forEach(header => {
        let iconContainer = header.querySelector('.tablet-header-icons');
        if (iconContainer) {
            let btn = iconContainer.querySelector('.header-toggle-btn');
            if (!btn) {
                btn = document.createElement('i');
                btn.className = 'fa-solid fa-bars header-toggle-btn';
                btn.style.cursor = 'pointer';
                iconContainer.appendChild(btn);
            }
        }
    });
}

function ensureFooterHTML() {
    const nav = document.querySelector('.mobile-bottom-nav');
    if (nav && nav.children.length === 0) {
        nav.innerHTML = `
            <div class="mob-nav-item active" id="mob-nav-home"><i class="fa-solid fa-house"></i></div>
            <div class="mob-nav-item" id="mob-nav-add-card"><i class="fa-regular fa-credit-card"></i></div>
            <div class="mob-nav-item" id="mob-nav-add"><div class="add-circle"><i class="fa-solid fa-plus"></i></div></div>
            <div class="mob-nav-item" id="mob-nav-collections"><i class="fa-regular fa-bookmark"></i></div>
            <div class="mob-nav-item" id="mob-nav-notif"><i class="fa-regular fa-bell"></i></div>
        `;
        setupNavigation();
    }
}

// =============================================================
// GLOBAL SEARCH (Posts + Subscriptions Search Icon)
// - Desktop: typing in right sidebar search filters feed (Home)
// - Mobile/Tablet: opens full-screen search overlay (Option C)
// - Subscriptions search icon opens overlay (mode: subscriptions)
// =============================================================
const tmSearchUI = {
    overlay: null,
    sheet: null,
    input: null,
    body: null,
    closeBtn: null,
    mode: 'posts',
    lastQuery: ''
};

function tmEnsureSearchOverlay() {
    if (document.getElementById('tm-search-overlay')) {
        tmSearchUI.overlay = document.getElementById('tm-search-overlay');
        tmSearchUI.sheet = tmSearchUI.overlay.querySelector('.tm-search-sheet');
        tmSearchUI.input = document.getElementById('tmSearchInput');
        tmSearchUI.body = document.getElementById('tmSearchBody');
        tmSearchUI.closeBtn = document.getElementById('tmSearchClose');
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'tm-search-overlay';
    overlay.className = 'tm-search-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="tm-search-sheet" role="dialog" aria-modal="true" aria-label="Search">
            <div class="tm-search-head">
                <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                <input id="tmSearchInput" class="tm-search-input" type="text" placeholder="Search..." autocomplete="off" />
                <button type="button" id="tmSearchClose" class="tm-search-close" aria-label="Close search">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div id="tmSearchBody" class="tm-search-body"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    tmSearchUI.overlay = overlay;
    tmSearchUI.sheet = overlay.querySelector('.tm-search-sheet');
    tmSearchUI.input = document.getElementById('tmSearchInput');
    tmSearchUI.body = document.getElementById('tmSearchBody');
    tmSearchUI.closeBtn = document.getElementById('tmSearchClose');

    // Close (button)
    tmSearchUI.closeBtn.addEventListener('click', tmCloseSearch);

    // Close (tap outside)
    tmSearchUI.overlay.addEventListener('click', (e) => {
        if (!tmSearchUI.sheet.contains(e.target)) tmCloseSearch();
    });

    // ESC close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tmSearchUI.overlay.classList.contains('is-open')) tmCloseSearch();
    });

    // Search input handler
    tmSearchUI.input.addEventListener('input', () => {
        const q = (tmSearchUI.input.value || '').trim();
        tmSearchUI.lastQuery = q;
        if (tmSearchUI.mode === 'subscriptions') {
            tmRenderSubscriptionsSearch(q);
        } else {
            tmRenderPostSearch(q);
        }
    });

    tmSearchUI.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
}

function tmOpenSearch(mode = 'posts', presetQuery = '') {
    tmEnsureSearchOverlay();
    tmSearchUI.mode = mode;

    const ph = (mode === 'subscriptions') ? 'Search subscriptions...' : 'Search posts...';
    tmSearchUI.input.setAttribute('placeholder', ph);

    const saved = (mode === 'posts') ? (localStorage.getItem('tm_post_search_query') || '') : '';
    const q = (presetQuery != null ? presetQuery : '').trim() || saved;

    tmSearchUI.overlay.classList.add('is-open');
    tmSearchUI.overlay.setAttribute('aria-hidden', 'false');
    tmSearchUI.input.value = q;
    tmSearchUI.lastQuery = q;

    // Initial render
    if (mode === 'subscriptions') {
        tmRenderSubscriptionsSearch(q);
    } else {
        tmRenderPostSearch(q);
    }

    setTimeout(() => tmSearchUI.input.focus(), 50);
}

function tmCloseSearch() {
    if (!tmSearchUI.overlay) return;
    tmSearchUI.overlay.classList.remove('is-open');
    tmSearchUI.overlay.setAttribute('aria-hidden', 'true');
}

function tmReadPostsFromStorage() {
    try {
        const raw = localStorage.getItem('tm_user_posts');
        const posts = raw ? JSON.parse(raw) : [];
        return Array.isArray(posts) ? posts : [];
    } catch (e) {
        return [];
    }
}

function tmRenderPostSearch(query) {
    if (!tmSearchUI.body) return;

    const q = (query || '').trim().toLowerCase();
    const posts = tmReadPostsFromStorage()
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (!q) {
        const recent = posts.slice(0, 10);
        if (!recent.length) {
            tmSearchUI.body.innerHTML = `<div class="tm-search-hint">No posts yet.</div>`;
            return;
        }
        tmSearchUI.body.innerHTML = `
            <div class="tm-search-hint">Recent posts</div>
            ${recent.map(p => tmPostResultHTML(p)).join('')}
        `;
        tmBindResultClicks('posts');
        return;
    }

    const results = posts.filter(p => String(p.text || '').toLowerCase().includes(q)).slice(0, 25);

    if (!results.length) {
        tmSearchUI.body.innerHTML = `<div class="tm-search-hint">No matching posts.</div>`;
        return;
    }

    tmSearchUI.body.innerHTML = `
        <div class="tm-search-hint">${results.length} result${results.length === 1 ? '' : 's'}</div>
        ${results.map(p => tmPostResultHTML(p)).join('')}
    `;
    tmBindResultClicks('posts');
}

function tmPostResultHTML(p) {
    const text = String(p.text || '').trim();
    const snippet = text.length > 140 ? (text.slice(0, 140) + '...') : text;
    const ts = p.timestamp ? new Date(p.timestamp) : null;
    const meta = ts ? ts.toLocaleString() : '';
    const safeSnippet = snippet
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `
        <div class="tm-search-result" data-post-id="${p.id}">
            <div class="title">${safeSnippet || 'Untitled post'}</div>
            <div class="meta">${meta}</div>
        </div>
    `;
}

function tmBindResultClicks(type) {
    if (!tmSearchUI.body) return;
    tmSearchUI.body.querySelectorAll('.tm-search-result').forEach(el => {
        el.addEventListener('click', () => {
            if (type === 'posts') {
                const postId = el.getAttribute('data-post-id');
                tmCloseSearch();
                if (postId) {
                    localStorage.setItem('tm_post_search_query', tmSearchUI.lastQuery || '');
                    const input = document.getElementById('global-post-search-input');
                    if (input) input.value = tmSearchUI.lastQuery || '';
                    switchView('home');
                    setTimeout(() => tmScrollToPost(postId), 180);
                }
            }
        });
    });
}

function tmScrollToPost(postId) {
    const el = document.getElementById(`post-${postId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('tm-search-highlight');
    setTimeout(() => el.classList.remove('tm-search-highlight'), 2000);
}

// Inline filtering for the Home feed (desktop search bar)
function tmApplyInlinePostFilter(query) {
    const feed = document.getElementById('creator-feed');
    if (!feed) return;

    const q = (query || '').trim().toLowerCase();
    const posts = Array.from(feed.querySelectorAll('.post-card'));
    const emptyState = feed.querySelector('.feed-empty-state');

    let visibleCount = 0;
    posts.forEach(card => {
        const txt = (card.innerText || '').toLowerCase();
        const show = !q || txt.includes(q);
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    if (emptyState) {
        // If there are no posts at all, leave the original empty state intact.
        const hasAnyPosts = posts.length > 0;
        if (!hasAnyPosts) {
            emptyState.style.display = '';
            return;
        }
        if (q && visibleCount === 0) {
            emptyState.style.display = '';
            const p = emptyState.querySelector('p');
            if (p) p.textContent = 'No matching posts';
        } else {
            emptyState.style.display = 'none';
            const p = emptyState.querySelector('p');
            if (p) p.textContent = 'No posts to show';
        }
    }
}

function tmRenderSubscriptionsSearch(query) {
    if (!tmSearchUI.body) return;

    // Future-proof: if subscription cards exist, filter them. For now, show a helpful state.
    const subsView = document.getElementById('view-subscriptions');
    const cards = subsView ? Array.from(subsView.querySelectorAll('.subscription-card, .sub-card, .sub-item')) : [];
    const q = (query || '').trim().toLowerCase();

    if (!cards.length) {
        tmSearchUI.body.innerHTML = `
            <div class="tm-search-hint">
                No subscriptions to search yet.
                <br><br>
                Tip: Use the Home search to find creators, then subscribe.
            </div>
        `;
        return;
    }

    let match = 0;
    cards.forEach(c => {
        const txt = (c.innerText || '').toLowerCase();
        const show = !q || txt.includes(q);
        c.style.display = show ? '' : 'none';
        if (show) match++;
    });

    tmSearchUI.body.innerHTML = `<div class="tm-search-hint">${match} result${match === 1 ? '' : 's'}</div>`;
}

function tmInitGlobalSearch() {
    const input = document.getElementById('global-post-search-input');
    const btn = document.getElementById('global-post-search-btn');
    const subsBtn = document.getElementById('subs-btn-search');

    const saved = localStorage.getItem('tm_post_search_query') || '';
    if (input && saved && input.value !== saved) input.value = saved;

    if (input) {
        input.addEventListener('input', () => {
            const q = input.value || '';
            localStorage.setItem('tm_post_search_query', q);
            tmApplyInlinePostFilter(q);
        });

        input.addEventListener('focus', () => {
            // Mobile: open overlay instead of inline filtering UI.
            if (window.innerWidth <= 768) tmOpenSearch('posts', input.value || '');
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (window.innerWidth <= 1024) {
                    e.preventDefault();
                    tmOpenSearch('posts', input.value || '');
                }
            }
        });
    }

    if (btn) {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                tmOpenSearch('posts', input ? (input.value || '') : '');
            } else {
                if (input) input.focus();
            }
        });
    }

    if (subsBtn) {
        subsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tmOpenSearch('subscriptions', '');
        });
    }
}


// =============================================================
// SUBSCRIPTIONS (Data #1)
// - Fetch /api/me/subscriptions (both directions)
// - Render "Subscribed" + "Subscribers" tabs
// - Active/Expired/All pill counts + filtering + inline search
// - Cards include .subscription-card so global overlay search can filter them too
// =============================================================
const tmSubsState = {
    uiReady: false,
    loading: false,
    // Direction: 'subscribed' (you subscribed to creators) | 'subscribers' (your subscribers)
    dir: (localStorage.getItem('tm_subs_dir') || 'subscribed'),
    // Filter: 'all' | 'active' | 'expired'
    filter: (localStorage.getItem('tm_subs_filter') || 'all'),
    // Inline search query for subscriptions view only
    q: (localStorage.getItem('tm_subs_query') || ''),
    data: null,
    fetchedAt: 0,
    mode: 'auto' // 'v2' (current creators.html) | 'v1' (legacy) | 'auto'
};

let tmSubsUI = {
    view: null,

    // v2 (current markup)
    tabTo: null,
    tabFrom: null,
    countTo: null,
    countFrom: null,

    pillAll: null,
    pillActive: null,
    pillExpired: null,
    countAll: null,
    countActive: null,
    countExpired: null,

    input: null,
    btnClear: null,
    list: null,
    empty: null,
    emptyText: null,
    loading: null,

    // v1 (legacy fallbacks)
    pills: [],
    pillsBar: null,
    listWrap: null,
    emptyWrap: null,
    legacyEmptyText: null
};

function tmSubsNormalizeDir(dir) {
    const d = String(dir || '').toLowerCase();
    if (d === 'subscribers' || d === 'fans' || d === 'from') return 'subscribers';
    return 'subscribed';
}

function tmSubsNormalizeFilter(filter) {
    const f = String(filter || '').toLowerCase();
    if (f === 'active' || f === 'expired') return f;
    return 'all';
}

function tmSubsSetMode(mode) {
    tmSubsState.mode = mode || 'auto';
}

function tmSubsShow(el, show) {
    if (!el) return;
    // v2 uses .show, legacy uses display
    if (el.classList && (el.classList.contains('subs-loading') || el.classList.contains('subs-empty'))) {
        el.classList.toggle('show', !!show);
    } else {
        el.style.display = show ? '' : 'none';
    }
}

function tmEnsureSubscriptionsUI() {
    const view = document.getElementById('view-subscriptions');
    if (!view) return false;

    // Detect current markup (v2) by the presence of #subs-list
    const hasV2 = !!view.querySelector('#subs-list');
    const force = tmSubsState.mode !== 'auto' ? tmSubsState.mode : (hasV2 ? 'v2' : 'v1');
    tmSubsSetMode(force);

    // ---------- v2 wiring ----------
    if (force === 'v2') {
        const tabTo = view.querySelector('#subs-tab-to');
        const tabFrom = view.querySelector('#subs-tab-from');
        const countTo = view.querySelector('#subs-count-to');
        const countFrom = view.querySelector('#subs-count-from');

        const pillAll = view.querySelector('.subs-pill[data-subs-filter="all"]');
        const pillActive = view.querySelector('.subs-pill[data-subs-filter="active"]');
        const pillExpired = view.querySelector('.subs-pill[data-subs-filter="expired"]');

        const countAll = view.querySelector('#subs-count-all');
        const countActive = view.querySelector('#subs-count-active');
        const countExpired = view.querySelector('#subs-count-expired');

        const input = view.querySelector('#subs-search');
        const btnClear = view.querySelector('#subs-btn-clear');
        const list = view.querySelector('#subs-list');
        const empty = view.querySelector('#subs-empty');
        const emptyText = view.querySelector('.subs-empty-text');
        const loading = view.querySelector('#subs-loading');

        tmSubsUI = {
            view,
            tabTo, tabFrom, countTo, countFrom,
            pillAll, pillActive, pillExpired,
            countAll, countActive, countExpired,
            input, btnClear, list, empty, emptyText, loading,
            pills: [], pillsBar: null, listWrap: null, emptyWrap: null, legacyEmptyText: null
        };

        // Normalize persisted state
        tmSubsState.dir = tmSubsNormalizeDir(tmSubsState.dir);
        tmSubsState.filter = tmSubsNormalizeFilter(tmSubsState.filter);

        // Bind direction tabs once
        if (tabTo && tabTo.dataset.bound !== '1') {
            tabTo.dataset.bound = '1';
            tabTo.addEventListener('click', () => tmSetSubsDir('subscribed'));
        }
        if (tabFrom && tabFrom.dataset.bound !== '1') {
            tabFrom.dataset.bound = '1';
            tabFrom.addEventListener('click', () => tmSetSubsDir('subscribers'));
        }

        // Bind pills once
        if (pillAll && pillAll.dataset.bound !== '1') {
            pillAll.dataset.bound = '1';
            pillAll.addEventListener('click', () => tmSetSubsFilter('all'));
        }
        if (pillActive && pillActive.dataset.bound !== '1') {
            pillActive.dataset.bound = '1';
            pillActive.addEventListener('click', () => tmSetSubsFilter('active'));
        }
        if (pillExpired && pillExpired.dataset.bound !== '1') {
            pillExpired.dataset.bound = '1';
            pillExpired.addEventListener('click', () => tmSetSubsFilter('expired'));
        }

        // Inline search
        if (input && input.dataset.bound !== '1') {
            input.dataset.bound = '1';
            // Hydrate saved query
            if (tmSubsState.q && input.value !== tmSubsState.q) input.value = tmSubsState.q;

            input.addEventListener('input', () => {
                tmSubsState.q = input.value || '';
                localStorage.setItem('tm_subs_query', tmSubsState.q);
                tmRenderSubscriptionsList();
                tmUpdateSubsClearBtn();
            });
        }

        if (btnClear && btnClear.dataset.bound !== '1') {
            btnClear.dataset.bound = '1';
            btnClear.addEventListener('click', (e) => {
                e.preventDefault();
                tmSubsState.q = '';
                localStorage.setItem('tm_subs_query', '');
                if (input) input.value = '';
                tmRenderSubscriptionsList();
                tmUpdateSubsClearBtn();
                try { input && input.focus(); } catch (_) {}
            });
        }

        tmSubsState.uiReady = true;
        tmApplySubsTabActive();
        tmApplySubsPillActive();
        tmUpdateSubsClearBtn();

        return true;
    }

    // ---------- v1 (legacy) fallback wiring ----------
    const pills = Array.from(view.querySelectorAll('button.n-pill'));
    const pillActive = pills[0] || null;
    const pillExpired = pills[1] || null;
    const pillsBar = pillActive ? pillActive.closest('div') : null;

    const icon = view.querySelector('.empty-icon-wrap');
    const emptyWrap = icon ? icon.parentElement : null;
    const legacyEmptyText = emptyWrap ? emptyWrap.querySelector('p') : null;

    let listWrap = view.querySelector('#subs-list-wrap');
    if (!listWrap && pillsBar) {
        listWrap = document.createElement('div');
        listWrap.id = 'subs-list-wrap';
        listWrap.style.padding = '12px 15px 20px';
        listWrap.style.display = 'none';
        pillsBar.insertAdjacentElement('afterend', listWrap);
    }

    tmSubsUI = {
        view,
        pills,
        pillsBar,
        pillActive,
        pillExpired,
        listWrap,
        emptyWrap,
        legacyEmptyText,
        tabTo: null, tabFrom: null, countTo: null, countFrom: null,
        pillAll: null, countAll: null, countActive: null, countExpired: null,
        input: null, btnClear: null, list: null, empty: null, emptyText: null, loading: null
    };

    // legacy filter only supports active/expired; map 'all' to active in v1
    tmSubsState.filter = (tmSubsState.filter === 'expired') ? 'expired' : 'active';

    if (pillActive && pillActive.dataset.bound !== '1') {
        pillActive.dataset.bound = '1';
        pillActive.addEventListener('click', () => tmSetSubsFilter('active'));
    }
    if (pillExpired && pillExpired.dataset.bound !== '1') {
        pillExpired.dataset.bound = '1';
        pillExpired.addEventListener('click', () => tmSetSubsFilter('expired'));
    }

    tmSubsState.uiReady = true;
    tmApplySubsPillActive();
    return true;
}

function tmApplySubsTabActive() {
    if (tmSubsState.mode !== 'v2') return;
    const { tabTo, tabFrom } = tmSubsUI;
    if (tabTo) tabTo.classList.toggle('active', tmSubsState.dir === 'subscribed');
    if (tabFrom) tabFrom.classList.toggle('active', tmSubsState.dir === 'subscribers');
}

function tmApplySubsPillActive() {
    if (tmSubsState.mode === 'v2') {
        const { pillAll, pillActive, pillExpired } = tmSubsUI;
        if (pillAll) pillAll.classList.toggle('active', tmSubsState.filter === 'all');
        if (pillActive) pillActive.classList.toggle('active', tmSubsState.filter === 'active');
        if (pillExpired) pillExpired.classList.toggle('active', tmSubsState.filter === 'expired');
        return;
    }

    // legacy
    const { pillActive, pillExpired } = tmSubsUI;
    if (pillActive) pillActive.classList.toggle('active', tmSubsState.filter === 'active');
    if (pillExpired) pillExpired.classList.toggle('active', tmSubsState.filter === 'expired');
}

function tmUpdateSubsClearBtn() {
    if (tmSubsState.mode !== 'v2') return;
    const { btnClear } = tmSubsUI;
    if (!btnClear) return;
    const show = !!(tmSubsState.q && String(tmSubsState.q).trim());
    btnClear.style.display = show ? '' : 'none';
}

function tmUpdateSubsCountsTop(payload) {
    if (tmSubsState.mode !== 'v2') return;
    const toAll = Number(payload?.subscribed?.counts?.all || 0);
    const fromAll = Number(payload?.subscribers?.counts?.all || 0);
    if (tmSubsUI.countTo) tmSubsUI.countTo.textContent = String(toAll);
    if (tmSubsUI.countFrom) tmSubsUI.countFrom.textContent = String(fromAll);
}

function tmUpdateSubsPillsCounts(counts) {
    const all = Number(counts?.all || 0);
    const active = Number(counts?.active || 0);
    const expired = Number(counts?.expired || 0);

    if (tmSubsState.mode === 'v2') {
        if (tmSubsUI.countAll) tmSubsUI.countAll.textContent = String(all);
        if (tmSubsUI.countActive) tmSubsUI.countActive.textContent = String(active);
        if (tmSubsUI.countExpired) tmSubsUI.countExpired.textContent = String(expired);
        return;
    }

    // legacy: rewrite button labels
    if (tmSubsUI.pillActive) {
        tmSubsUI.pillActive.innerHTML = `<i class="fa-solid fa-check"></i> Active ${active}`;
    }
    if (tmSubsUI.pillExpired) {
        tmSubsUI.pillExpired.innerHTML = `<i class="fa-regular fa-hourglass-half"></i> Expired ${expired}`;
    }
}

function tmSetSubsEmpty(text) {
    const msg = text || 'No subscriptions yet.';

    if (tmSubsState.mode === 'v2') {
        if (tmSubsUI.emptyText) tmSubsUI.emptyText.textContent = msg;
        tmSubsShow(tmSubsUI.loading, false);
        tmSubsShow(tmSubsUI.empty, true);
        if (tmSubsUI.list) tmSubsUI.list.style.display = 'none';
        return;
    }

    if (tmSubsUI.legacyEmptyText) tmSubsUI.legacyEmptyText.textContent = msg;
    if (tmSubsUI.emptyWrap) tmSubsUI.emptyWrap.style.display = 'flex';
    if (tmSubsUI.listWrap) tmSubsUI.listWrap.style.display = 'none';
}

function tmSetSubsLoading() {
    if (tmSubsState.mode === 'v2') {
        tmSubsShow(tmSubsUI.empty, false);
        tmSubsShow(tmSubsUI.loading, true);
        if (tmSubsUI.list) tmSubsUI.list.style.display = 'none';
        return;
    }

    if (!tmSubsUI.listWrap) return;
    if (tmSubsUI.emptyWrap) tmSubsUI.emptyWrap.style.display = 'none';
    tmSubsUI.listWrap.style.display = 'block';
    tmSubsUI.listWrap.innerHTML = `
        <div style="color:var(--muted); text-align:center; padding:28px 0; font-weight:700;">
            Loading subscriptions...
        </div>
    `;
}


function tmTsToMs(t) {
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') {
        const n = Date.parse(t);
        if (!Number.isNaN(n)) return n;
        const p = parseInt(t, 10);
        return Number.isNaN(p) ? 0 : p;
    }
    if (typeof t === 'object') {
        try {
            if (typeof t.toMillis === 'function') return t.toMillis();
        } catch (_) {}
        if (typeof t.seconds === 'number') return t.seconds * 1000;
        if (typeof t._seconds === 'number') return t._seconds * 1000;
    }
    return 0;
}

function tmFmtDate(ms) {
    if (!ms) return '';
    try {
        return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_) {
        return '';
    }
}

function tmBuildSubCard(it) {
    const other = it?.otherUser || {};
    const name = (other.name || '').trim() || (other.handle ? `@${String(other.handle).replace(/^@/, '')}` : '') || (it.otherEmail || 'Unknown');
    const handleRaw = (other.handle || '').trim().replace(/^@/, '');
    const handle = handleRaw ? `@${handleRaw}` : (it.otherEmail ? it.otherEmail : '');
    const avatar = other.avatarUrl || DEFAULT_AVATAR;
    const verified = !!other.verified;
    const isActive = !!it.isActive;
    const endMs = tmTsToMs(it.endAt);
    const endLabel = endMs ? tmFmtDate(endMs) : '';

    const card = document.createElement('div');
    card.className = 'sugg-card subscription-card';
    card.dataset.subStatus = isActive ? 'active' : 'expired';
    card.style.cursor = 'default';

    const banner = document.createElement('div');
    banner.className = 'sugg-banner';
    // No cover image in API yet; use a nice gradient
    banner.style.backgroundImage = isActive
        ? 'linear-gradient(135deg, rgba(58,175,185,0.45), rgba(100,233,238,0.18))'
        : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))';

    const badge = document.createElement('div');
    badge.className = 'sugg-badge';
    badge.textContent = isActive ? 'ACTIVE' : 'EXPIRED';

    banner.appendChild(badge);
    card.appendChild(banner);

    const details = document.createElement('div');
    details.className = 'sugg-details';

    const avWrap = document.createElement('div');
    avWrap.className = 'sugg-avatar-wrap';

    const img = document.createElement('img');
    img.alt = name;
    img.src = avatar;
    img.loading = 'lazy';
    avWrap.appendChild(img);

    // Active indicator dot (only for active)
    if (isActive) {
        const dot = document.createElement('div');
        dot.className = 'online-dot';
        avWrap.appendChild(dot);
    }

    const text = document.createElement('div');
    text.className = 'sugg-text';

    const nameRow = document.createElement('div');
    nameRow.className = 'sugg-name';
    nameRow.textContent = name;

    if (verified) {
        const v = document.createElement('i');
        v.className = 'fa-solid fa-circle-check';
        v.style.color = 'var(--primary-cyan)';
        v.style.fontSize = '0.9rem';
        nameRow.appendChild(v);
    }

    const handleRow = document.createElement('div');
    handleRow.className = 'sugg-handle';
    handleRow.textContent = handle;

    const meta = document.createElement('div');
    meta.style.marginTop = '8px';
    meta.style.fontSize = '0.8rem';
    meta.style.color = 'var(--muted)';
    meta.textContent = isActive
        ? (endLabel ? `Expires: ${endLabel}` : 'Active')
        : (endLabel ? `Expired: ${endLabel}` : 'Expired');

    text.appendChild(nameRow);
    text.appendChild(handleRow);
    text.appendChild(meta);

    details.appendChild(avWrap);
    details.appendChild(text);

    card.appendChild(details);
    return card;
}

function tmSubsIsActive(it) {
    if (typeof it?.isActive === 'boolean') return it.isActive;
    const endMs = tmTsToMs(it?.endAt);
    if (endMs) return endMs > Date.now();
    return false;
}

function tmBuildSubsUserRow(it) {
    const other = it?.otherUser || {};
    const otherEmail = String(it?.otherEmail || '').trim().toLowerCase();

    const handleRaw = (other.handle || '').trim().replace(/^@/, '');
    const handle = handleRaw ? `@${handleRaw}` : (otherEmail || '');
    const name = (other.name || '').trim() || handle || otherEmail || 'User';
    const avatar = other.avatarUrl || DEFAULT_AVATAR;
    const verified = !!other.verified;

    const isActive = tmSubsIsActive(it);
    const endMs = tmTsToMs(it?.endAt);
    const startMs = tmTsToMs(it?.startAt);
    const endLabel = endMs ? tmFmtDate(endMs) : '';
    const startLabel = startMs ? tmFmtDate(startMs) : '';

    const row = document.createElement('div');
    row.className = 'subs-user subscription-card';
    row.dataset.subStatus = isActive ? 'active' : 'expired';

    row.innerHTML = `
        <div class="left">
            <img src="${avatar}" alt="${tmEscHtml(name)}" loading="lazy">
            <div class="meta">
                <div class="name">${tmEscHtml(name)} ${verified ? '<i class="fa-solid fa-circle-check" style="color:var(--primary-cyan); font-size:0.85rem; margin-left:6px;"></i>' : ''}</div>
                <div class="handle">${tmEscHtml(handle)}</div>
            </div>
        </div>
        <div class="right">
            <div class="subs-badge ${isActive ? 'active' : 'expired'}">${isActive ? 'ACTIVE' : 'EXPIRED'}</div>
            <div class="subs-mini">
                ${isActive
                    ? (endLabel ? `Expires: ${tmEscHtml(endLabel)}` : 'Active')
                    : (endLabel ? `Expired: ${tmEscHtml(endLabel)}` : 'Expired')
                }
            </div>
        </div>
    `;

    // Click → Messages (start / continue chat with this user)
    if (otherEmail) {
        row.addEventListener('click', () => {
            try {
                localStorage.setItem('tm_open_chat_peer', otherEmail);
            } catch (_) {}

            try { switchView('messages'); } catch (_) {}

            // Prefer direct open (if messages module exposes it); else messages init will pick localStorage
            try {
                const fn = window.__tmMessagesOpenPeer;
                if (typeof fn === 'function') {
                    // Small delay ensures layout switch happened
                    setTimeout(() => { try { fn(otherEmail); } catch (_) {} }, 80);
                }
            } catch (_) {}
        });
    }

    // Tooltip style meta (optional)
    row.title = tmSubsState.dir === 'subscribers'
        ? (startLabel ? `Subscriber since ${startLabel}` : 'Subscriber')
        : (startLabel ? `Subscribed since ${startLabel}` : 'Subscription');

    return row;
}

function tmGetCurrentSubsPack() {
    if (!tmSubsState.data || tmSubsState.data?.ok !== true) return { items: [], counts: { all: 0, active: 0, expired: 0 } };
    if (tmSubsState.dir === 'subscribers') return tmSubsState.data.subscribers || { items: [], counts: { all: 0, active: 0, expired: 0 } };
    return tmSubsState.data.subscribed || { items: [], counts: { all: 0, active: 0, expired: 0 } };
}

function tmRenderSubscriptionsList() {
    if (!tmSubsState.uiReady) return;

    // v1 legacy uses injected listWrap; v2 uses #subs-list.
    if (!tmSubsState.data || tmSubsState.data?.ok !== true) {
        tmSetSubsEmpty('No subscriptions yet.');
        return;
    }

    // Update top tab counts (v2)
    tmUpdateSubsCountsTop(tmSubsState.data);

    const pack = tmGetCurrentSubsPack();
    const itemsAll = Array.isArray(pack.items) ? pack.items : [];
    const counts = pack.counts || { all: itemsAll.length, active: 0, expired: 0 };

    // Counts for pills (v2) / legacy pills
    tmUpdateSubsPillsCounts({
        all: Number(counts.all || itemsAll.length),
        active: Number(counts.active || itemsAll.filter(tmSubsIsActive).length),
        expired: Number(counts.expired || (itemsAll.length - itemsAll.filter(tmSubsIsActive).length))
    });

    tmApplySubsTabActive();
    tmApplySubsPillActive();

    // Filter by status
    let items = itemsAll.slice();
    if (tmSubsState.filter === 'active') items = items.filter(it => tmSubsIsActive(it));
    else if (tmSubsState.filter === 'expired') items = items.filter(it => !tmSubsIsActive(it));

    // Filter by inline query
    const q = (tmSubsState.q || '').trim().toLowerCase();
    if (q) {
        items = items.filter(it => {
            const other = it?.otherUser || {};
            const otherEmail = String(it?.otherEmail || '').toLowerCase();
            const name = String(other.name || '').toLowerCase();
            const handle = String(other.handle || '').toLowerCase().replace(/^@/, '');
            return name.includes(q) || handle.includes(q) || otherEmail.includes(q);
        });
    }

    // Empty states
    if (!itemsAll.length) {
        tmSetSubsEmpty(tmSubsState.dir === 'subscribers' ? 'No subscribers yet.' : 'No subscriptions yet.');
        return;
    }
    if (!items.length) {
        if (q) {
            tmSetSubsEmpty('No matching results.');
        } else {
            tmSetSubsEmpty(
                tmSubsState.filter === 'active'
                    ? 'No active subscriptions.'
                    : (tmSubsState.filter === 'expired' ? 'No expired subscriptions.' : 'Nothing to show.')
            );
        }
        return;
    }

    // Render list
    if (tmSubsState.mode === 'v2') {
        tmSubsShow(tmSubsUI.loading, false);
        tmSubsShow(tmSubsUI.empty, false);
        if (tmSubsUI.list) {
            tmSubsUI.list.style.display = 'flex';
            tmSubsUI.list.innerHTML = '';
            items.forEach(it => tmSubsUI.list.appendChild(tmBuildSubsUserRow(it)));
        }
        return;
    }

    // legacy listWrap
    if (tmSubsUI.emptyWrap) tmSubsUI.emptyWrap.style.display = 'none';
    if (!tmSubsUI.listWrap) return;
    tmSubsUI.listWrap.style.display = 'block';
    tmSubsUI.listWrap.innerHTML = '';
    items.forEach(it => tmSubsUI.listWrap.appendChild(tmBuildSubCard(it)));
}

async function tmLoadSubscriptions(force = false) {
    if (!tmSubsState.uiReady) return;
    if (tmSubsState.loading) return;

    const now = Date.now();
    const fresh = tmSubsState.data && (now - (tmSubsState.fetchedAt || 0) < 15000);

    if (!force && fresh) {
        tmRenderSubscriptionsList();
        return;
    }

    tmSubsState.loading = true;
    tmSetSubsLoading();

    try {
        // Fetch both directions in one call (server returns {subscribed, subscribers})
        const payload = await getMySubscriptions();
        if (!payload || payload.ok !== true) {
            tmSubsState.data = { ok: false, subscribed: { items: [], counts: { all: 0, active: 0, expired: 0 } }, subscribers: { items: [], counts: { all: 0, active: 0, expired: 0 } } };
            tmSubsState.fetchedAt = Date.now();
            tmSetSubsEmpty(payload?.message || 'No subscriptions yet.');
            return;
        }

        tmSubsState.data = payload;
        tmSubsState.fetchedAt = Date.now();
        tmRenderSubscriptionsList();
    } catch (err) {
        console.error('Subscriptions load error:', err);
        tmSetSubsEmpty('Unable to load subscriptions.');
        try { TopToast.fire({ icon: 'error', title: 'Unable to load subscriptions' }); } catch (_) {}
    } finally {
        tmSubsState.loading = false;
    }
}

function tmSetSubsFilter(next) {
    const f = tmSubsNormalizeFilter(next);
    tmSubsState.filter = f;
    localStorage.setItem('tm_subs_filter', f);
    tmApplySubsPillActive();
    tmRenderSubscriptionsList();
}

function tmSetSubsDir(next) {
    const d = tmSubsNormalizeDir(next);
    if (tmSubsState.dir === d) return;
    tmSubsState.dir = d;
    localStorage.setItem('tm_subs_dir', d);
    tmApplySubsTabActive();
    tmRenderSubscriptionsList();
}

function tmEnterSubscriptionsView() {
    if (!tmEnsureSubscriptionsUI()) return;

    // Reset pills while loading (prevents stale UI)
    if (tmSubsState.mode === 'v2') {
        tmUpdateSubsCountsTop(tmSubsState.data || {});
        tmUpdateSubsPillsCounts(tmGetCurrentSubsPack()?.counts || { all: 0, active: 0, expired: 0 });
        tmUpdateSubsClearBtn();
    } else {
        // legacy
        tmUpdateSubsPillsCounts(tmSubsState.data?.subscribed?.counts || { active: 0, expired: 0 });
    }

    // Load/refresh
    tmLoadSubscriptions(false);
}

// =============================================================
// MOBILE BACK BUTTON (Profile) + POP-OVER COLLECTIONS FIX
// =============================================================
function tmBindProfileBackButton() {
    const btn = document.getElementById('profile-back-btn');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', () => {
        const prev = localStorage.getItem('tm_prev_view');
        if (prev && prev !== 'profile') switchView(prev);
        else switchView('home');
    });
}

function tmBindPopoverCollections() {
    const btn = document.getElementById('btn-pop-collections');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pop = document.getElementById('settings-popover');
        if (pop) pop.classList.remove('is-open');
        switchView('collections');
    });
}


// =============================================================
// RIGHT SIDEBAR: SUGGESTIONS (Data #4)
// - Uses GET /api/swipe/candidates as a simple source of accounts
// - Renders cards in #rs-suggestions-view .suggestion-list
// - Refresh icon rotates + refetches
// - "Hide suggestion" stored in localStorage
// =============================================================
let __tmSuggestionsBound = false;

function tmEscHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tmGetSuggEls() {
  const root = document.getElementById('rs-suggestions-view');
  if (!root) return {};
  return {
    root,
    list: root.querySelector('.suggestion-list'),
    refresh: root.querySelector('.sugg-actions i.fa-rotate')
  };
}

function tmGetHiddenSuggestions() {
  try { return JSON.parse(localStorage.getItem('tm_hidden_suggestions') || '[]') || []; }
  catch { return []; }
}

function tmSetHiddenSuggestions(arr) {
  try { localStorage.setItem('tm_hidden_suggestions', JSON.stringify(arr || [])); } catch {}
}

function tmSetSuggestionsCache(payload) {
  try { localStorage.setItem('tm_suggestions_cache', JSON.stringify(payload)); } catch {}
}

function tmGetSuggestionsCache() {
  try { return JSON.parse(localStorage.getItem('tm_suggestions_cache') || 'null'); }
  catch { return null; }
}

function tmDeriveHandle(id, name) {
  const raw = String(id || '').trim();
  if (raw.includes('@')) return '@' + raw.split('@')[0].replace(/[^a-zA-Z0-9._]/g, '').slice(0, 18);
  const base = String(name || 'member').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._]/g, '');
  return '@' + (base || 'member').slice(0, 18);
}

function tmRenderSuggestions(items, meta = {}) {
  const { list } = tmGetSuggEls();
  if (!list) return;

  const hidden = new Set(tmGetHiddenSuggestions());
  const rows = (items || []).filter(x => x && !hidden.has(x.id));

  if (!rows.length) {
    const msg = meta?.message || 'No suggestions';
    list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:0.9rem;">${tmEscHtml(msg)}</div>`;
    return;
  }

  list.innerHTML = rows.slice(0, 6).map((u) => {
    const id = tmEscHtml(u.id || '');
    const name = tmEscHtml(u.name || 'Member');
    const city = tmEscHtml(u.city || '');
    const age = (u.age != null) ? Number(u.age) : null;
    const avatar = tmEscHtml(u.photoUrl || u.avatarUrl || 'assets/images/truematch-mark.png');
    const handle = tmEscHtml(tmDeriveHandle(u.id, u.name));
    const badge = tmEscHtml(u.badge || 'MEMBER');
    const dot = (Math.random() < 0.35) ? `<div class="online-dot" title="Online"></div>` : ``;

    // Banner: reuse avatar (safe + consistent). If image fails, CSS bg shows.
    return `
      <div class="sugg-card" data-sugg-id="${id}">
        <div class="sugg-banner" style="background-image:url('${avatar}')">
          <div class="sugg-badge">${badge}</div>
          <div class="sugg-menu" role="button" aria-label="Options"><i class="fa-solid fa-ellipsis"></i></div>
        </div>
        <div class="sugg-details">
          <div class="sugg-avatar-wrap">
            <img src="${avatar}" alt="${name}">
            ${dot}
          </div>
          <div class="sugg-text">
            <div class="sugg-name">${name}${age ? `, ${age}` : ''}</div>
            <div class="sugg-handle">${handle}${city ? ` • ${city}` : ''}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind click handlers (modal + hide)
  list.querySelectorAll('.sugg-card').forEach(card => {
    const id = card.getAttribute('data-sugg-id') || '';

    // Options menu -> hide
    const menu = card.querySelector('.sugg-menu');
    if (menu) {
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
        Swal.fire({
          title: 'Suggestion',
          text: 'Hide this suggestion?',
          showCancelButton: true,
          confirmButtonText: 'Hide',
          confirmButtonColor: '#64E9EE',
          cancelButtonText: 'Cancel',
          background: '#0d1423',
          color: '#fff'
        }).then((r) => {
          if (r.isConfirmed) {
            const hiddenArr = tmGetHiddenSuggestions();
            if (!hiddenArr.includes(id)) hiddenArr.push(id);
            tmSetHiddenSuggestions(hiddenArr);
            // Remove visually
            card.remove();
            if (!list.querySelector('.sugg-card')) {
              list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:0.9rem;">No suggestions</div>`;
            }
            try { TopToast.fire({ icon: 'success', title: 'Hidden' }); } catch {}
          }
        });
      });
    }

    // Click card -> quick view
    card.addEventListener('click', () => {
      const name = card.querySelector('.sugg-name')?.textContent || 'Member';
      const handle = card.querySelector('.sugg-handle')?.textContent || '';
      const avatar = card.querySelector('img')?.getAttribute('src') || 'assets/images/truematch-mark.png';

      Swal.fire({
        title: tmEscHtml(name),
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
            <img src="${tmEscHtml(avatar)}" alt="" style="width:84px; height:84px; border-radius:50%; object-fit:cover; border:2px solid #64E9EE;" />
            <div style="color:var(--muted); font-size:0.9rem;">${tmEscHtml(handle)}</div>
            <div style="color:var(--muted); font-size:0.85rem; margin-top:6px;">Tip: Use Home search to explore posts & creators.</div>
          </div>
        `,
        confirmButtonText: 'Close',
        confirmButtonColor: '#64E9EE',
        background: '#0d1423',
        color: '#fff'
      });
    });
  });
}

async function tmFetchSuggestionsFromApi() {
  const res = await fetch('/api/swipe/candidates', { method: 'GET', credentials: 'include' });
  const data = await res.json().catch(() => null);
  if (!data || data.ok === false) {
    const err = (data && (data.error || data.message)) || (res.status === 401 ? 'Not authenticated' : 'Unable to load suggestions');
    throw new Error(err);
  }
  return data;
}

async function tmRefreshSuggestions(opts = { force: false }) {
  const { list, refresh } = tmGetSuggEls();
  if (!list) return;

  // cache (10 minutes)
  if (!opts.force) {
    const cached = tmGetSuggestionsCache();
    const ts = cached?.ts || 0;
    if (cached && Array.isArray(cached.items) && (Date.now() - ts) < 10 * 60 * 1000) {
      tmRenderSuggestions(cached.items, cached.meta || {});
      return;
    }
  }

  // loading state
  list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:0.9rem;">Loading…</div>`;
  if (refresh) refresh.classList.add('fa-spin');

  try {
    const payload = await tmFetchSuggestionsFromApi();
    const items = Array.isArray(payload.candidates) ? payload.candidates : [];
    const meta = { message: payload.message || '' };

    tmSetSuggestionsCache({ ts: Date.now(), items, meta });
    tmRenderSuggestions(items, meta);
  } catch (e) {
    tmRenderSuggestions([], { message: e?.message || 'Unable to load suggestions' });
    try { TopToast.fire({ icon: 'error', title: e?.message || 'Unable to load suggestions' }); } catch {}
  } finally {
    if (refresh) refresh.classList.remove('fa-spin');
  }
}

function tmInitSuggestionsSidebar() {
  if (__tmSuggestionsBound) return;
  __tmSuggestionsBound = true;

  const { refresh } = tmGetSuggEls();
  if (refresh && refresh.dataset.bound !== '1') {
    refresh.dataset.bound = '1';
    refresh.addEventListener('click', () => tmRefreshSuggestions({ force: true }));
  }

  // initial render (cache-first then fetch)
  tmRefreshSuggestions({ force: false });
}


document.addEventListener('DOMContentLoaded', init);
})();

/* === FINAL HOTFIX: vertical threaded comments + latest-5 collapsers + clean display names/text === */
(function () {
  if (window.__tmVerticalThreadHotfixApplied) return;
  window.__tmVerticalThreadHotfixApplied = true;

  function __tmSafeString2(v) {
    try { return String(v == null ? '' : v); } catch (_) { return ''; }
  }

  function __tmStripReplyTag(rawText) {
    const raw = __tmSafeString2(rawText);
    if (typeof tmParseReplyTag === 'function') {
      try {
        const meta = tmParseReplyTag(raw);
        if (meta && typeof meta.cleanText === 'string') return meta.cleanText.trim();
      } catch (_) {}
    }
    return raw.replace(/^\s*\[\[replyTo:[^\]]+\]\]\s*/i, '').trim();
  }

  function __tmParseReplyTagId(rawText) {
    const raw = __tmSafeString2(rawText);
    if (typeof tmParseReplyTag === 'function') {
      try {
        const meta = tmParseReplyTag(raw);
        if (meta && meta.replyToId) return String(meta.replyToId);
      } catch (_) {}
    }
    const m = raw.match(/^\s*\[\[replyTo:([^\]]+)\]\]/i);
    return m ? String(m[1]).trim() : '';
  }

  function __tmNormalizeThreadCommentV2(raw) {
    const c = (raw && typeof raw === 'object') ? { ...raw } : {};
    const id = __tmSafeString2(c.id || c.commentId || c._id || c.cid || c.ts || ('c_' + Math.random().toString(36).slice(2)));
    const rawContent = __tmSafeString2(c.content || c.text || '');
    const cleanText = __tmStripReplyTag(rawContent);

    // Keep server parentId first. If missing, infer from inline reply tag.
    let parentId = __tmSafeString2(c.parentId || c.parentCommentId || c.replyTo || c.replyToCommentId || '').trim();
    if (!parentId) parentId = __tmParseReplyTagId(rawContent);

    const displayName = __tmSafeString2(
      c.displayName || c.name || c.authorName || c.userDisplayName || c.username || c.handle || 'User'
    ).trim() || 'User';

    const username = __tmSafeString2(c.username || c.handle || c.userName || c.userHandle || '').trim();

    return {
      ...c,
      id,
      parentId: parentId || '',
      content: cleanText,
      text: cleanText,
      __cleanText: cleanText,
      displayName,
      username,
      __children: Array.isArray(c.__children) ? c.__children : []
    };
  }

  // Unlimited nesting support via parentId chain; falls back to inline [[replyTo:...]] tags.
  window.__tmBuildNestedCommentTree = function __tmBuildNestedCommentTree(list) {
    const arr = Array.isArray(list) ? list : [];
    const norm = arr.map(__tmNormalizeThreadCommentV2);

    const byId = new Map();
    norm.forEach(c => {
      c.__children = [];
      byId.set(String(c.id), c);
    });

    const roots = [];
    for (const c of norm) {
      const pid = __tmSafeString2(c.parentId).trim();
      if (pid && byId.has(pid) && pid !== String(c.id)) {
        byId.get(pid).__children.push(c);
      } else {
        roots.push(c);
      }
    }

    // preserve original chronological order as received
    return roots;
  };

  function __tmSanitizedNodeHTML(node) {
    const base = {
      ...node,
      content: __tmStripReplyTag(node && (node.__cleanText || node.content || node.text || '')),
      text: __tmStripReplyTag(node && (node.__cleanText || node.content || node.text || '')),
      __cleanText: __tmStripReplyTag(node && (node.__cleanText || node.content || node.text || '')),
      username: '',
      handle: '',
      userName: '',
      userHandle: '',
      __children: [],
      __depth: 0
    };

    let html = '';
    try {
      if (typeof generateCommentHTML === 'function') {
        html = generateCommentHTML(base, !!base.parentId);
      } else if (typeof createCommentHTML === 'function') {
        html = createCommentHTML(base);
      }
    } catch (e) {
      console.warn('[TM comments hotfix] base renderer failed:', e);
      html = '';
    }

    html = __tmSafeString2(html);

    // Force vertical / no diagonal inline indent from old renderer.
    html = html.replace(/\sstyle=(["'])[^"']*margin-left\s*:\s*[^;"']+;?[^"']*\1/gi, '');
    html = html.replace(/\sstyle=(["'])\s*\1/gi, '');

    // Normalize level class so CSS doesn't inherit staggered margins.
    html = html.replace(/\bcomment-level-\d+\b/g, 'comment-level-0');

    // Defensive cleanup in case renderer still used raw text.
    html = html.replace(/\[\[replyTo:[^\]]+\]\]\s*/gi, '');

    return html;
  }

  function __tmCountAllNodes(list) {
    let total = 0;
    for (const n of (Array.isArray(list) ? list : [])) {
      total += 1;
      if (n && Array.isArray(n.__children) && n.__children.length) total += __tmCountAllNodes(n.__children);
    }
    return total;
  }

  function __tmRenderThreadList(list, kind) {
    const items = Array.isArray(list) ? list : [];
    if (!items.length) return '';

    const initialVisible = 5;
    const hiddenCount = Math.max(0, items.length - initialVisible);
    let html = `<div class="tm-thread-list-wrap" data-kind="${kind}">`;

    if (hiddenCount > 0) {
      const label = hiddenCount === 1
        ? `View 1 more ${kind === 'replies' ? 'reply' : 'comment'}`
        : `View ${hiddenCount} more ${kind === 'replies' ? 'replies' : 'comments'}`;
      html += `<button type="button" class="tm-view-more-thread-btn" data-kind="${kind}">${label}</button>`;
    }

    html += `<div class="tm-thread-list tm-thread-list--${kind}">`;

    items.forEach((node, idx) => {
      const hidden = idx < hiddenCount;
      html += `<div class="tm-thread-item ${hidden ? 'tm-thread-item--hidden' : ''}" data-hidden="${hidden ? '1' : '0'}">`;
      html += __tmSanitizedNodeHTML(node);

      if (node && Array.isArray(node.__children) && node.__children.length) {
        html += `<div class="tm-thread-children-vertical" data-parent-id="${String(node.id || '')}">`;
        html += __tmRenderThreadList(node.__children, 'replies');
        html += `</div>`;
      }

      html += `</div>`;
    });

    html += `</div></div>`;
    return html;
  }

  window.__tmRenderCommentTreeHTML = function __tmRenderCommentTreeHTML(list) {
    const tree = (typeof window.__tmBuildNestedCommentTree === 'function')
      ? window.__tmBuildNestedCommentTree(list)
      : (Array.isArray(list) ? list : []);
    return __tmRenderThreadList(tree, 'comments');
  };
  try { __tmBuildNestedCommentTree = window.__tmBuildNestedCommentTree; } catch (_) {}
  try { __tmRenderCommentTreeHTML = window.__tmRenderCommentTreeHTML; } catch (_) {}

  // Delegated "View more comments/replies" behavior (reveals 5 older each click)
  if (!window.__tmThreadViewMoreBound) {
    window.__tmThreadViewMoreBound = true;
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('.tm-view-more-thread-btn') : null;
      if (!btn) return;
      const wrap = btn.closest('.tm-thread-list-wrap');
      const listEl = wrap ? wrap.querySelector(':scope > .tm-thread-list') : null;
      if (!listEl) return;

      const hiddenItems = Array.from(listEl.querySelectorAll(':scope > .tm-thread-item.tm-thread-item--hidden'));
      if (!hiddenItems.length) return;

      const revealCount = 5;
      hiddenItems.slice(0, revealCount).forEach(el => {
        el.classList.remove('tm-thread-item--hidden');
        el.setAttribute('data-hidden', '0');
      });

      const remaining = Math.max(0, hiddenItems.length - Math.min(revealCount, hiddenItems.length));
      const kind = btn.getAttribute('data-kind') || 'comments';

      if (remaining <= 0) {
        btn.remove();
      } else {
        btn.textContent = remaining === 1
          ? `View 1 more ${kind === 'replies' ? 'reply' : 'comment'}`
          : `View ${remaining} more ${kind === 'replies' ? 'replies' : 'comments'}`;
      }
    });
  }

  // Re-override ensure loader so all callers use latest renderer + cleaned cache
  window.tmEnsureCommentsLoaded = async function tmEnsureCommentsLoaded(postId, force) {
    const key = String(postId || '').trim();
    if (!key) return [];
    if (!force && window.tmCommentsCache && Array.isArray(window.tmCommentsCache[key])) {
      return window.tmCommentsCache[key];
    }

    const wrap = document.querySelector(`[data-post-id="${key}"]`);
    const listEl = wrap && wrap.querySelector ? wrap.querySelector('.comment-list') : null;

    try {
      if (listEl) listEl.innerHTML = '<div class="comment-loading">Loading comments...</div>';

      const items = await apiRequest(`/api/creator/posts/comments?postId=${encodeURIComponent(key)}`, { method: 'GET' });
      const incoming = Array.isArray(items) ? items : [];

      // Merge with local optimistic cache, dedupe by id.
      const localExisting = (window.tmCommentsCache && Array.isArray(window.tmCommentsCache[key])) ? window.tmCommentsCache[key] : [];
      const mergedMap = new Map();

      for (const src of localExisting) {
        const n = __tmNormalizeThreadCommentV2(src);
        mergedMap.set(String(n.id), n);
      }
      for (const src of incoming) {
        const n = __tmNormalizeThreadCommentV2(src);
        const prev = mergedMap.get(String(n.id)) || {};
        mergedMap.set(String(n.id), { ...prev, ...n });
      }

      const merged = Array.from(mergedMap.values());
      if (!window.tmCommentsCache) window.tmCommentsCache = {};
      window.tmCommentsCache[key] = merged;

      if (listEl) {
        const treeHtml = window.__tmRenderCommentTreeHTML(merged);
        listEl.innerHTML = treeHtml || '';
        if (!treeHtml) listEl.innerHTML = '<div class="comment-empty">No comments yet.</div>';
      }
      return merged;
    } catch (err) {
      console.error('[TM comments hotfix] load failed:', err);
      if (listEl) {
        listEl.innerHTML = '<div class="comment-error">Failed to load comments.</div>';
      }
      return [];
    }
  };
  try { tmEnsureCommentsLoaded = window.tmEnsureCommentsLoaded; } catch (_) {}
})();
 /* === /FINAL HOTFIX === */
