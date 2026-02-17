import { DOM } from './dom.js';

// TODO: Backend Integration - Replace STORAGE_KEY with API Endpoints
const STORAGE_KEY = 'tm_user_posts';
const BOOKMARKS_KEY = 'tm_creator_bookmarks';



const FEED_ENDPOINT = '/api/creators/feed';
const CREATE_POST_ENDPOINT = '/api/creator/posts';
const DELETE_POST_ENDPOINT = '/api/creator/posts/delete';

// Backend-first interaction endpoints (best-effort; fallback to local if 404/disabled)
const POST_REACT_ENDPOINT = '/api/creator/posts/react';
const POST_COMMENT_ENDPOINT = '/api/creator/posts/comment';
const POST_PIN_ENDPOINT = '/api/creator/posts/pin';
const POST_COMMENTS_ENDPOINT = '/api/creator/posts/comments';
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
        const re = new RegExp(`(?:^|\n)\s*${escapeRe(label)}\s*:\s*(.+?)(?:\n|$)`, 'i');
        const m = contentStyle.match(re);
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

// Consistent "time ago" helper used by post header + comments.
// Returns compact units: 3m, 2h, 5d, etc.
function tmTimeAgo(timestamp) {
    const t = Number(timestamp || 0);
    if (!t) return '';
    const seconds = Math.floor((Date.now() - t) / 1000);
    if (!Number.isFinite(seconds) || seconds < 0) return '';
    if (seconds < 10) return 'now';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    const years = Math.floor(days / 365);
    return `${years}y`;
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
        list.innerHTML = keepNo + comments.map(c => generateCommentHTML(c)).join('');

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


export function initHome(TopToast) {
    
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
                    const updated = updatePost(postId, (post) => {
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

                    if (updated && updated.type === 'quiz') {
                        const card = document.getElementById(`post-${postId}`);
                        const block = card ? card.querySelector('.post-quiz-block') : null;
                        if (block) block.outerHTML = renderQuizBlock(updated);
                        const isCorrect = updated.quizMyAnswer === updated.quiz.correctIndex;
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
                    const updated = updatePost(postId, (post) => {
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

                    if (updated && updated.type === 'poll') {
                        const card = document.getElementById(`post-${postId}`);
                        const block = card ? card.querySelector('.post-poll-block') : null;
                        if (block) block.outerHTML = renderPollBlock(updated);
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
                // COMMENT REACTION (local-only for now)
                else if (context === 'comment') {
                    const commentWrapper = target.closest('.comment-reaction-wrapper');
                    const commentLikeBtn = commentWrapper?.querySelector('.action-comment-like');

                    if (commentLikeBtn) {
                        commentLikeBtn.innerHTML = getEmojiIcon(reactionType);
                        commentLikeBtn.classList.add('liked');
                        commentLikeBtn.style.color = getEmojiColor(reactionType);
                        commentLikeBtn.style.fontWeight = 'bold';
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

            // --- COMMENT LIKE CLICK (Toggle Default) ---
            if (target.classList.contains('action-comment-like')) {
                const btn = target;
                if (btn.classList.contains('liked')) {
                    btn.classList.remove('liked');
                    btn.innerHTML = 'Like';
                    btn.style.color = '';
                    btn.style.fontWeight = '600';
                } else {
                    btn.classList.add('liked');
                    btn.innerHTML = '<i class="fa-solid fa-heart"></i> 1';
                    btn.style.color = '#ff4757';
                }
            }
            
            // --- COMMENT TOGGLE ---
            if (target.classList.contains('btn-toggle-comment') || target.classList.contains('fa-comment')) {
                const postCard = target.closest('.post-card');
                const commentSection = postCard ? postCard.querySelector('.post-comments-section') : null;
                const input = postCard ? postCard.querySelector('.comment-input') : null;

                if (commentSection) {
                    const willOpen = commentSection.classList.contains('hidden');
                    commentSection.classList.toggle('hidden');

                    if (willOpen) {
                        // Backend-first: try to load comments once from server (fallback to local-only if 404)
                        await tmEnsureCommentsLoaded(postCard, TopToast);

                        if (input) setTimeout(() => input.focus(), 100);
                    }
                }
            }

            // --- SEND COMMENT (Persisted) ---
            if (target.closest('.btn-send-comment')) {
                const postCard = target.closest('.post-card');
                const input = postCard ? postCard.querySelector('.comment-input') : null;
                const list = postCard ? postCard.querySelector('.comment-list') : null;
                const emptyMsg = postCard ? postCard.querySelector('.no-comments-msg') : null;
                const text = input ? input.value.trim() : '';
                if (!postCard || !input || !list) return;

                if (!text) return;

                const postId = postCard.id.replace('post-', '');

                // Optimistic UI
                const meIdentity = tmGetCreatorIdentity();
                const optimistic = {
                    id: tmNowId(),
                    text,
                    timestamp: Date.now(),
                    authorEmail: meIdentity.email || '',
                    authorName: meIdentity.name || '',
                    authorHandle: meIdentity.handle || '',
                    authorAvatarUrl: meIdentity.avatarUrl || ''
                };
                updatePost(postId, (post) => {
                    if (!post) return post;
                    if (!Array.isArray(post.comments)) post.comments = [];
                    post.comments.push({ ...optimistic, creatorEmail: optimistic.authorEmail, creatorName: optimistic.authorName, creatorAvatarUrl: optimistic.authorAvatarUrl });
                    return post;
                });

                if (emptyMsg) emptyMsg.style.display = 'none';
                list.insertAdjacentHTML('beforeend', generateCommentHTML(optimistic));
                input.value = '';

                // Backend-first (best-effort). If endpoint not available yet, comment stays local.
                let persisted = false;
                try {
                    const resp = await tmAddPostComment(postId, text);
                    if (resp && resp.ok) persisted = true;

                    // If server is live, refresh comments once so IDs/timestamps line up across devices
                    const commentSection = postCard.querySelector('.post-comments-section');
                    if (persisted && commentSection) {
                        commentSection.dataset.loaded = '0';
                        await tmEnsureCommentsLoaded(postCard, TopToast);
                    }
                } catch {}

                tmToast(TopToast, 'success', persisted ? 'Comment added' : 'Comment added (local)');
            }

            

            // --- REPLY CLICK ---
            if (target.classList.contains('action-reply-comment')) {
                const commentItem = target.closest('.comment-item');
                const commentBody = commentItem.querySelector('.comment-body');
                let replyBox = commentBody.querySelector('.reply-input-row');
                const commenterName = (commentItem.querySelector('.c-user')?.textContent || '').trim() || 'this comment';
                const me = tmGetCreatorIdentity();
                const meAvatar = (me?.avatarUrl || 'assets/images/truematch-mark.png');
                
                if (!replyBox) {
                    const replyHTML = `
                        <div class="reply-input-row">
                            <img src="${tmEscapeHtml(meAvatar)}" class="comment-avatar" style="width:25px; height:25px; border-radius:50%; object-fit:cover;">
                            <input type="text" class="reply-input" placeholder="Reply to ${tmEscapeHtml(commenterName)}...">
                        </div>
                    `;
                    commentBody.insertAdjacentHTML('beforeend', replyHTML);
                    replyBox = commentBody.querySelector('.reply-input-row');
                }
                replyBox.querySelector('input').focus();
            }

            // Bookmark & Tip
            const bmIcon = target.closest('.fa-bookmark');
            if (bmIcon && bmIcon.closest('.post-actions')) {
                const postCard = bmIcon.closest('.post-card');
                const postId = postCard?.dataset?.postId;

                if (postId) {
                    const saved = tmToggleBookmark(postId);
                    bmIcon.classList.toggle('fa-solid', saved);
                    bmIcon.classList.toggle('fa-regular', !saved);
                    bmIcon.style.color = saved ? '#64E9EE' : '';
                    tmToast(TopToast, saved ? 'success' : 'info', saved ? 'Saved' : 'Removed');
                }
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
        feed.addEventListener('keydown', (e) => {
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
                    const text = e.target.value.trim();
                    if(text) {
                        const me = tmGetCreatorIdentity();
                        const meName = tmEscapeHtml((me?.name || 'You'));
                        const meAvatar = tmEscapeHtml((me?.avatarUrl || 'assets/images/truematch-mark.png'));
                        const safeReply = tmEscapeHtml(text).replace(/\n/g, '<br>');
                        const replyHTML = `
                            <div class="comment-item" style="margin-top:10px; animation:fadeIn 0.2s;">
                                <img src="${meAvatar}" class="comment-avatar" style="width:25px; height:25px; object-fit:cover;">
                                <div class="comment-body">
                                    <div class="comment-bubble">
                                        <div style="font-weight:700; font-size:0.8rem;">${meName}</div>
                                        <div>${safeReply}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                        e.target.closest('.reply-input-row').insertAdjacentHTML('beforebegin', replyHTML);
                        e.target.closest('.reply-input-row').remove();
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
    const meIdentity = tmGetCreatorIdentity();
    const meAvatarUrl = (meIdentity?.avatarUrl || 'assets/images/truematch-mark.png');

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

            <div class="post-actions" style="display: flex; justify-content: space-between; align-items: center; color: var(--muted); padding-top: 10px; position: relative; clear: both;">
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

            <div class="post-likes" style="font-size: 0.85rem; font-weight: 700; margin-top: 10px; color: var(--text); clear: both;">${tmLikesText(likeCount)}</div>

            <div class="post-comments-section hidden" style="clear: both;">
                 <div class="comment-list">
                    <div class="no-comments-msg" style="text-align: center; font-size: 0.85rem; color: var(--muted); ${noCommentsStyle}">No comments yet</div>
                    ${commentsHTML}
                 </div>
                 <div class="comment-input-area">
                    <img src="${tmEscapeHtml(meAvatarUrl)}" class="comment-avatar" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
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

function generateCommentHTML(textOrObj, timestampMaybe) {
    const safeStr = (v) => (v === null || v === undefined) ? '' : String(v).trim();

    const c = (textOrObj && typeof textOrObj === 'object')
        ? textOrObj
        : { text: textOrObj, timestamp: timestampMaybe };

    const me = tmGetCreatorIdentity();

    const authorEmail = safeStr(c.authorEmail || c.creatorEmail || c.email);
    const authorNameRaw = safeStr(c.authorName || c.creatorName || c.name);

    const isMe =
        (authorEmail && me.email && authorEmail.toLowerCase() === me.email.toLowerCase()) ||
        (!authorEmail && (authorNameRaw === 'You' || authorNameRaw === 'Me'));

    const name = isMe ? safeStr(me.name) : (authorNameRaw || 'Unknown');

    const avatar =
        isMe
            ? safeStr(me.avatarUrl)
            : (safeStr(c.authorAvatarUrl || c.creatorAvatarUrl || c.avatarUrl) || 'assets/images/truematch-mark.png');

    const avatarAttr = tmEscapeHtml(avatar);

    const text = tmEscapeHtml(safeStr(c.text)).replace(/\n/g, '<br>');
    const timestamp = Number(c.timestamp || c.createdAtMs || c.createdAt || timestampMaybe || Date.now()) || Date.now();
    const timeAgo = tmTimeAgo(timestamp);
    const commentId = safeStr(c.id || c._id || c.commentId) || `${timestamp}-${Math.random().toString(16).slice(2)}`;

    // NOTE: Keep `.c-user` class for existing reply-handler compatibility.
    return `
        <div class="comment-item" data-comment-id="${tmEscapeHtml(commentId)}">
            <img class="comment-avatar" src="${avatarAttr}" alt="">
            <div class="comment-body">
                <div class="comment-bubble">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <span class="c-user" style="font-weight:800; font-size:0.85rem;">${tmEscapeHtml(name)}</span>
                        <span class="c-time" style="font-size:0.75rem; color: var(--muted);">${tmEscapeHtml(timeAgo)}</span>
                    </div>
                    <div class="c-text">${text}</div>
                </div>

                <div class="comment-actions">
                    <div class="comment-reaction-wrapper">
                        <span class="c-action c-like action-comment-like" style="font-weight:600;">Like</span>
                        <div class="comment-reaction-picker">
                            <span class="react-emoji" data-type="comment" data-reaction="like">👍</span>
                            <span class="react-emoji" data-type="comment" data-reaction="love">❤️</span>
                            <span class="react-emoji" data-type="comment" data-reaction="haha">😆</span>
                            <span class="react-emoji" data-type="comment" data-reaction="wow">😮</span>
                            <span class="react-emoji" data-type="comment" data-reaction="sad">😢</span>
                            <span class="react-emoji" data-type="comment" data-reaction="angry">😡</span>
                        </div>
                    </div>
                    <span class="c-action action-reply-comment">Reply</span>
                </div>
            </div>
        </div>
    `;
}

// Helpers for Icons/Colors (Same as Profile.js)
// (Same as Profile.js)
function getEmojiIcon(type) {
    switch(type) {
        case 'like': return '<i class="fa-solid fa-thumbs-up"></i> 1';
        case 'love': return '<i class="fa-solid fa-heart"></i> 1';
        case 'haha': return '<i class="fa-solid fa-face-laugh-squint"></i> 1';
        case 'sad': return '<i class="fa-solid fa-face-sad-tear"></i> 1';
        case 'angry': return '<i class="fa-solid fa-face-angry"></i> 1';
        default: return 'Like';
    }
}

function getEmojiColor(type) {
    switch(type) {
        case 'like': return '#64E9EE';
        case 'love': return '#ff4757';
        case 'haha': return '#f1c40f';
        case 'sad': return '#e67e22';
        case 'angry': return '#e74c3c';
        default: return '';
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
