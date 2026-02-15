import { DOM } from './dom.js';
import { DEFAULT_AVATAR } from './data.js';

// NOTE:
// - Creator posts are backend-first (Firestore) via /api/creator/posts.
// - Comments + reactions are UI-only for now (stored locally per post) until backend supports them.

// Emojis for the input tray
const QUICK_EMOJIS = ["😀", "😂", "😍", "🔥", "😭", "🥰", "👍", "🙏", "👀", "💯", "🍑", "🍆", "💸", "😡", "🤡", "🎉"];

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

export function initProfilePage() {
    // 1. Setup Listeners
    setupProfileFeedInteractions();
    setupProfileTabs();
    setupProfileHeaderActions();

    // 2. Load Content
    tmHydrateProfileHeader().catch(() => {});
    // async-safe
    renderProfilePosts().catch(() => {});
    renderProfileMedia();
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
    if (btnEdit && btnEdit.dataset.bound === '1') return;
    if (btnEdit) btnEdit.dataset.bound = '1';

    // Edit Profile → edits Display name + Bio (backend-first, safe local fallback)
    if (btnEdit) {
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
    const btnPosts = document.getElementById('profile-tab-posts');
    const btnMedia = document.getElementById('profile-tab-media');
    const viewPosts = document.getElementById('profile-content-posts');
    const viewMedia = document.getElementById('profile-content-media');

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
        const storedReaction = tmReadLocalReaction(postId);
        const likeCountText = storedReaction ? '1 Like' : '0 Likes';
        const mainIconHtml = tmRenderMainReactionIcon(storedReaction);

        let commentsHTML = '';
        const savedComments = tmLoadComments(postId);
        if (savedComments.length > 0) {
            savedComments.forEach(c => { commentsHTML += createCommentHTML(c); });
        }

        const html = `
            <div class="post-card" id="profile-post-${tmEscapeAttr(postId)}" data-id="${tmEscapeAttr(postId)}" style="margin-bottom: 20px; border: var(--border); border-radius: 16px; background: var(--card-bg); padding: 0; overflow: visible;">
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
    container.dataset.bound = '1';

    // Close any open menus/popup if user taps outside
    document.addEventListener('click', (e) => {
        const openMenus = document.querySelectorAll('.post-menu-dropdown');
        openMenus.forEach(m => m.style.display = 'none');

        const openReactions = document.querySelectorAll('.reaction-popup');
        openReactions.forEach(p => p.style.display = 'none');
    });

    container.addEventListener('click', (e) => {
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

        // Reaction option select
        const reactionOption = target.closest('.reaction-option');
        if (reactionOption) {
            const reactionType = reactionOption.dataset.reaction;
            const popup = postCard.querySelector('.reaction-popup');
            const context = 'post';

            if (popup) popup.style.display = 'none';

            if (context === 'post') {
                const mainIcon = postCard.querySelector('.main-like-btn');
                const likesCountDiv = postCard.querySelector('.post-likes-count');
                if (mainIcon) {
                    mainIcon.className = 'fa-solid main-like-btn action-like';
                    mainIcon.style.color = '';
                    mainIcon.classList.remove('fa-thumbs-up', 'fa-heart', 'fa-face-laugh-squint', 'fa-face-surprise', 'fa-face-sad-tear', 'fa-face-angry');

                    switch(reactionType) {
                        case 'like': mainIcon.classList.add('fa-thumbs-up'); mainIcon.style.color = '#64E9EE'; break;
                        case 'love': mainIcon.classList.add('fa-heart'); mainIcon.style.color = '#ff4757'; break;
                        case 'haha': mainIcon.classList.add('fa-face-laugh-squint'); mainIcon.style.color = '#f1c40f'; break;
                        case 'wow': mainIcon.classList.add('fa-face-surprise'); mainIcon.style.color = '#f1c40f'; break;
                        case 'sad': mainIcon.classList.add('fa-face-sad-tear'); mainIcon.style.color = '#e67e22'; break;
                        case 'angry': mainIcon.classList.add('fa-face-angry'); mainIcon.style.color = '#e74c3c'; break;
                    }
                    tmWriteLocalReaction(postId, reactionType);
                    // Trigger animation
                    mainIcon.style.transform = 'scale(1.4)';
                    setTimeout(() => mainIcon.style.transform = 'scale(1)', 200);
                }
                if(likesCountDiv) likesCountDiv.innerText = "1 Like";
            }
            return;
        }

        // Main like toggle
        if (target.closest('.main-like-btn')) {
            const icon = target.closest('.main-like-btn');
            const likesCountDiv = postCard.querySelector('.post-likes-count');
            const isLiked = icon.classList.contains('fa-solid') && !icon.classList.contains('fa-regular');
            if (!isLiked) {
                icon.className = 'fa-solid fa-thumbs-up main-like-btn action-like';
                icon.style.color = '#64E9EE';
                icon.style.transform = 'scale(1.3)';
                setTimeout(() => icon.style.transform = 'scale(1)', 200);
                if(likesCountDiv) likesCountDiv.innerText = "1 Like";
                tmWriteLocalReaction(postId, 'like');
            } else {
                // Unlike (only if it's currently a like/emoji)
                icon.className = 'fa-regular fa-thumbs-up main-like-btn action-like';
                icon.style.color = '';
                if(likesCountDiv) likesCountDiv.innerText = "0 Likes";
                tmWriteLocalReaction(postId, '');
            }
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

function submitComment(postCard, postId) {
    const input = postCard.querySelector('.comment-input');
    const list = postCard.querySelector('.comments-list');
    const empty = postCard.querySelector('.no-comments-msg');
    if (!input || !list) return;

    const text = String(input.value || '').trim();
    if (!text) return;

    if (empty) empty.style.display = 'none';

    const newCommentHTML = createCommentHTML(text);
    list.insertAdjacentHTML('beforeend', newCommentHTML);
    tmSaveComment(postId, text);
    input.value = '';
}

function createCommentHTML(text) {
    const safe = tmEscapeHtml(text);
    return `
        <div class="comment-item" style="display:flex; gap:10px; align-items:flex-start;">
            <div style="width:32px; height:32px; border-radius:50%; background: rgba(255,255,255,0.10); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i class="fa-solid fa-user" style="font-size: 0.85rem; color: rgba(255,255,255,0.75);"></i>
            </div>
            <div style="flex:1;">
                <div style="font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height:1.35;">
                    <span style="font-weight:800; color:#fff;">User</span> ${safe}
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
        return Array.isArray(list) ? list.map(s => String(s || '')).filter(Boolean) : [];
    } catch (_) {
        return [];
    }
}

function tmSaveComment(postId, text) {
    const t = String(text || '').trim();
    if (!t) return;
    const list = tmLoadComments(postId);
    list.push(t);
    try { localStorage.setItem(tmCommentsKey(postId), JSON.stringify(list)); } catch (_) {}
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
