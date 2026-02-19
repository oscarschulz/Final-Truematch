import { DOM } from './dom.js';
import {
    DEFAULT_AVATAR,
    getMessageThreads,
    getMessageThread,
    sendMessageTo,
    getMySubscriptions
} from './data.js';
import { apiGet, apiPost } from './tm-api.js';
import { getCurrentUserEmail, readJSON, writeJSON } from './tm-session.js';


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
export function initMessages(TopToast) {
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
