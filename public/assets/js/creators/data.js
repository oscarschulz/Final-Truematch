export const BLANK_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20fill%3D%22%23222%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3C%2Fsvg%3E';
export const DEFAULT_AVATAR = 'assets/images/truematch-mark.png';

// --- SYSTEM DEFAULTS ---
export let COLLECTIONS_DB = [
    { id: 'fans', name: 'Fans', type: 'user', count: 0, system: true },
    { id: 'following', name: 'Following', type: 'user', count: 0, system: true },
    { id: 'restricted', name: 'Restricted', type: 'user', count: 0, system: true },
    { id: 'blocked', name: 'Blocked', type: 'user', count: 0, system: true },
    { id: 'favorites', name: 'Favorite Posts', type: 'post', count: 0, system: true },
    { id: 'watch_later', name: 'Watch Later', type: 'post', count: 0, system: false }
];

// --- CLEAN: EMPTY USERS LIST ---
export const MSG_USERS = [];

// --- CLEAN: EMPTY CHAT HISTORY ---
export const CHAT_DATA = {};

// --- 🔥 NEW: CLEAN NOTIFICATIONS (Para sa Backend) ---
export const NOTIFICATIONS_DATA = []; 

// --- UI TRANSLATIONS ---
export const TRANSLATIONS = {
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
export function tmApiBase() {
    const raw = (typeof window !== 'undefined' && window.API_BASE) ? String(window.API_BASE) : '';
    return raw.replace(/\/+$/, '');
}

export function tmApiUrl(path) {
    const base = tmApiBase();
    if (!path) return base || '';
    const p = String(path);
    if (!base) return p;
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (p.startsWith('/')) return base + p;
    return base + '/' + p;
}

export async function apiGetJson(path, opts = {}) {
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

export async function getMySubscriptions({ dir } = {}) {
    const q = dir ? `?dir=${encodeURIComponent(dir)}` : '';
    return apiGetJson(`/api/me/subscriptions${q}`);
}

// =============================================================
// LOCAL CARDS STORAGE (Client-only)
// Notes:
// - This is UI-only for now (no payment processing).
// - We DO NOT store full card numbers or CVC.
// =============================================================
const TM_CARDS_KEY = 'tm_cards_v1';

function tmSafeParse(json, fallback) {
    try {
        const v = JSON.parse(json);
        return (v === null || v === undefined) ? fallback : v;
    } catch {
        return fallback;
    }
}

function tmSafeString(v) {
    return (v === null || v === undefined) ? '' : String(v);
}

export function tmCardsGetAll() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(TM_CARDS_KEY);
    const arr = tmSafeParse(raw, []);
    if (!Array.isArray(arr)) return [];

    // Normalize
    return arr
        .filter(Boolean)
        .map((c) => ({
            id: tmSafeString(c.id),
            brand: tmSafeString(c.brand) || 'card',
            last4: tmSafeString(c.last4),
            expMonth: tmSafeString(c.expMonth),
            expYear: tmSafeString(c.expYear),
            nameOnCard: tmSafeString(c.nameOnCard),
            email: tmSafeString(c.email),
            country: tmSafeString(c.country),
            state: tmSafeString(c.state),
            address: tmSafeString(c.address),
            city: tmSafeString(c.city),
            zip: tmSafeString(c.zip),
            createdAt: tmSafeString(c.createdAt),
            isPrimary: !!c.isPrimary
        }))
        .filter(c => !!c.id);
}

function tmCardsSaveAll(cards) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(TM_CARDS_KEY, JSON.stringify(cards || []));
}

export function tmCardsAdd(card) {
    const cards = tmCardsGetAll();
    const c = {
        id: tmSafeString(card?.id),
        brand: tmSafeString(card?.brand) || 'card',
        last4: tmSafeString(card?.last4),
        expMonth: tmSafeString(card?.expMonth),
        expYear: tmSafeString(card?.expYear),
        nameOnCard: tmSafeString(card?.nameOnCard),
        email: tmSafeString(card?.email),
        country: tmSafeString(card?.country),
        state: tmSafeString(card?.state),
        address: tmSafeString(card?.address),
        city: tmSafeString(card?.city),
        zip: tmSafeString(card?.zip),
        createdAt: tmSafeString(card?.createdAt) || (new Date().toISOString()),
        isPrimary: !!card?.isPrimary
    };

    if (!c.id) throw new Error('Missing card id');
    if (!c.last4 || c.last4.length !== 4) throw new Error('Missing last4');

    // If this is the first card, auto primary.
    if (!cards.length) c.isPrimary = true;

    // If setting primary, unset others.
    if (c.isPrimary) {
        cards.forEach(x => { x.isPrimary = false; });
    }

    cards.unshift(c);
    tmCardsSaveAll(cards);
    return c;
}

export function tmCardsRemove(cardId) {
    const id = tmSafeString(cardId);
    const cards = tmCardsGetAll();
    const next = cards.filter(c => c.id !== id);

    // Keep at least one primary if cards remain
    if (next.length && !next.some(c => c.isPrimary)) {
        next[0].isPrimary = true;
    }

    tmCardsSaveAll(next);
    return next;
}

export function tmCardsSetPrimary(cardId) {
    const id = tmSafeString(cardId);
    const cards = tmCardsGetAll();
    let found = false;
    cards.forEach(c => {
        if (c.id === id) {
            c.isPrimary = true;
            found = true;
        } else {
            c.isPrimary = false;
        }
    });
    if (!found) throw new Error('Card not found');
    tmCardsSaveAll(cards);
    return cards;
}

export function tmCardsMask(card) {
    const brand = tmSafeString(card?.brand).toLowerCase();
    const last4 = tmSafeString(card?.last4);
    const label = brand ? brand.toUpperCase() : 'CARD';
    return `${label} •••• ${last4}`;
}

// =============================================================
// Wallet (Data #7)
// - Persist wallet rebill preference
// - Simple local transaction log for Wallet "Latest transactions"
// =============================================================

const TM_WALLET_PREFS_KEY = 'tm_wallet_prefs_v1';
const TM_WALLET_TX_KEY = 'tm_wallet_tx_v1';

function tmSafeJsonParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function tmSafeJsonStringify(obj, fallback = 'null') {
  try { return JSON.stringify(obj); } catch { return fallback; }
}

function tmReadLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v == null) return fallback;
    return v;
  } catch {
    return fallback;
  }
}

function tmWriteLS(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export function tmWalletPrefsGet() {
  const raw = tmReadLS(TM_WALLET_PREFS_KEY, null);
  const prefs = raw ? tmSafeJsonParse(raw, null) : null;
  return prefs && typeof prefs === 'object' ? prefs : { rebillPrimary: false };
}

export function tmWalletPrefsSet(nextPrefs) {
  const cur = tmWalletPrefsGet();
  const merged = { ...cur, ...(nextPrefs || {}) };
  // normalize
  merged.rebillPrimary = !!merged.rebillPrimary;
  tmWriteLS(TM_WALLET_PREFS_KEY, tmSafeJsonStringify(merged, '{"rebillPrimary":false}'));
  return merged;
}

function tmTxNormalize(tx) {
  const nowIso = (() => { try { return new Date().toISOString(); } catch { return String(Date.now()); } })();
  const t = tx && typeof tx === 'object' ? tx : {};
  return {
    id: String(t.id || `tx_${Math.random().toString(16).slice(2)}_${Date.now()}`),
    title: String(t.title || 'Activity'),
    amount: typeof t.amount === 'number' ? t.amount : 0,
    type: String(t.type || 'activity'),
    createdAt: String(t.createdAt || nowIso)
  };
}

export function tmTransactionsGet() {
  const raw = tmReadLS(TM_WALLET_TX_KEY, null);
  const arr = raw ? tmSafeJsonParse(raw, []) : [];
  if (!Array.isArray(arr)) return [];
  const norm = arr.map(tmTxNormalize);
  // sort latest first
  norm.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return norm;
}

export function tmTransactionsAdd(tx) {
  const list = tmTransactionsGet();
  const t = tmTxNormalize(tx);
  const next = [t, ...list].slice(0, 25);
  tmWriteLS(TM_WALLET_TX_KEY, tmSafeJsonStringify(next, '[]'));
  return next;
}

export function tmTransactionsClear() {
  tmWriteLS(TM_WALLET_TX_KEY, '[]');
}
