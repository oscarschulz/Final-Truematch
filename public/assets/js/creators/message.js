import { DOM } from './dom.js';
import {
    DEFAULT_AVATAR,
    getMessageThreads,
    getMessageThread,
    sendMessageTo,
    getMySubscriptions
} from './data.js';

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

// -------------------------------
// Local-only UX helpers (tags, delete, notes)
// -------------------------------
function getUserTags() {
    return JSON.parse(localStorage.getItem(TM_TAGS_KEY) || '{}');
}

function setUserTag(userId, tag) {
    const tags = getUserTags();

    // Toggle: if same tag, remove; else set
    if (tags[userId] === tag) {
        delete tags[userId];
        toastInstance?.fire?.({ icon: 'success', title: 'Tag removed' });
    } else {
        tags[userId] = tag;
        toastInstance?.fire?.({ icon: 'success', title: `Tagged as ${String(tag).toUpperCase()}` });
    }

    localStorage.setItem(TM_TAGS_KEY, JSON.stringify(tags));
    renderMessageList();
}

function deleteConversation(userId) {
    // UI-only hide. (Backend delete not implemented yet.)
    const hidden = JSON.parse(localStorage.getItem(TM_HIDDEN_KEY) || '[]');
    if (!hidden.includes(userId)) hidden.push(userId);
    localStorage.setItem(TM_HIDDEN_KEY, JSON.stringify(hidden));

    // If deleting active chat, reset chat UI.
    if (activePeerEmail && userId === activePeerEmail) {
        activePeerEmail = null;
        activeChatUser = null;
        lockChatInputs();
        if (DOM.chatHistoryContainer) DOM.chatHistoryContainer.innerHTML = '';
        if (DOM.activeChatName) DOM.activeChatName.textContent = 'Messages';
        if (DOM.activeChatAvatar) DOM.activeChatAvatar.src = DEFAULT_AVATAR;
    }

    renderMessageList();
    toastInstance?.fire?.({ icon: 'success', title: 'Conversation deleted' });
}

function getLastSeenMap() {
    try {
        const raw = localStorage.getItem(TM_LAST_SEEN_KEY);
        const v = raw ? JSON.parse(raw) : {};
        return (v && typeof v === 'object') ? v : {};
    } catch {
        return {};
    }
}

function setLastSeen(peerEmail, iso) {
    const map = getLastSeenMap();
    map[String(peerEmail || '').toLowerCase()] = String(iso || new Date().toISOString());
    localStorage.setItem(TM_LAST_SEEN_KEY, JSON.stringify(map));
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

    const seenMap = getLastSeenMap();
    const seenIso = seenMap[peer];
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

    const hidden = JSON.parse(localStorage.getItem(TM_HIDDEN_KEY) || '[]');
    const tags = getUserTags();

    let list = Array.isArray(__msgUsers) ? __msgUsers.slice() : [];

    // Remove hidden
    list = list.filter(u => !hidden.includes(u.id));

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
}

function lockChatInputs() {
    if (DOM.chatInput) DOM.chatInput.disabled = true;
    if (DOM.btnSendMsg) DOM.btnSendMsg.disabled = true;
}

function unlockChatInputs() {
    if (DOM.chatInput) DOM.chatInput.disabled = false;
    if (DOM.btnSendMsg) DOM.btnSendMsg.disabled = false;
}

// -------------------------------
// Notes
// -------------------------------
function loadUserNote(userId) {
    const notes = JSON.parse(localStorage.getItem(TM_NOTES_KEY) || '{}');
    const note = notes[userId] || '';

    const noteInput = document.getElementById('user-note-input');
    if (noteInput) {
        noteInput.value = note;
        noteInput.oninput = () => {
            const updated = JSON.parse(localStorage.getItem(TM_NOTES_KEY) || '{}');
            updated[userId] = noteInput.value;
            localStorage.setItem(TM_NOTES_KEY, JSON.stringify(updated));
        };
    }
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

    // Inner chat search bar (search within rendered bubbles)
    if (DOM.btnChatSearch && DOM.chatSearchBar && DOM.chatSearchInput) {
        DOM.btnChatSearch.addEventListener('click', () => {
            DOM.chatSearchBar.classList.toggle('hidden');
            if (!DOM.chatSearchBar.classList.contains('hidden')) DOM.chatSearchInput.focus();
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
    DOM.btnChatStar.addEventListener('click', () => {
        toastInstance?.fire?.({ icon: 'info', title: 'Star saved (UI only)' });
    });
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

    // UI init
    initTabs();
    initSearchUI();
    initNewMessageOverlay();
    initSendMessage();
    initEmojiPicker();
    initPPV();
    initStar();
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
