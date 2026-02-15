import { DOM } from './dom.js';
import { DEFAULT_AVATAR } from './data.js';

// TODO: Backend Integration - Replace STORAGE_KEY with API Endpoints
const STORAGE_KEY = 'tm_user_posts'; 

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
    renderProfilePosts();
    renderProfileMedia();
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
// Tabs: Posts / Media (safe)
// ------------------------------

function setupProfileTabs() {
    const tabPosts = document.getElementById('tab-profile-posts');
    const tabMedia = document.getElementById('tab-profile-media');
    const posts = document.getElementById('profile-content-posts');
    const media = document.getElementById('profile-content-media');

    if (!tabPosts || !tabMedia || !posts || !media) return;
    if (tabPosts.dataset.boundTabs === '1') return;
    tabPosts.dataset.boundTabs = '1';

    const setActive = (which) => {
        const isPosts = which === 'posts';
        if (isPosts) {
            posts.classList.remove('hidden');
            media.classList.add('hidden');
            tabPosts.style.borderBottomColor = 'var(--text)';
            tabPosts.style.color = 'var(--text)';
            tabPosts.style.fontWeight = '700';
            tabMedia.style.borderBottomColor = 'transparent';
            tabMedia.style.color = 'var(--muted)';
            tabMedia.style.fontWeight = '600';
        } else {
            posts.classList.add('hidden');
            media.classList.remove('hidden');
            tabMedia.style.borderBottomColor = 'var(--text)';
            tabMedia.style.color = 'var(--text)';
            tabMedia.style.fontWeight = '700';
            tabPosts.style.borderBottomColor = 'transparent';
            tabPosts.style.color = 'var(--muted)';
            tabPosts.style.fontWeight = '600';
        }
    };

    tabPosts.addEventListener('click', (e) => { e.preventDefault(); setActive('posts'); });
    tabMedia.addEventListener('click', (e) => { e.preventDefault(); setActive('media'); });
}

function renderProfilePosts() {
    const container = document.getElementById('profile-content-posts');
    if (!container) return;

    const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (posts.length === 0) {
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

    posts.sort((a, b) => b.timestamp - a.timestamp).forEach(post => {
        const timeAgo = getTimeAgo(post.timestamp);
        const identity = tmGetProfilePostIdentity(post, fallbackIdentity);
        const displayName = tmEscapeHtml(identity.name || 'Your Name');
        const displayHandle = tmEscapeHtml(identity.handle || '@username');
        const avatarUrl = tmEscapeAttr(identity.avatarUrl || DEFAULT_AVATAR);
        const verifiedIcon = identity.verified ? `<i class="fa-solid fa-circle-check" style="color:var(--primary-cyan); font-size:0.8rem; margin-left: 5px;"></i>` : '';
        const safePostText = tmEscapeHtml(post.text || '');
        
        let commentsHTML = '';
        if (post.comments && post.comments.length > 0) {
            post.comments.forEach(c => {
                commentsHTML += createCommentHTML(c);
            });
        }

        const emojiGridHTML = QUICK_EMOJIS.map(e => `<span class="emoji-btn" style="cursor:pointer; padding:5px; font-size:1.2rem;">${e}</span>`).join('');

        const html = `
            <div class="post-card" id="profile-post-${post.id}" data-id="${post.id}" style="margin-bottom: 20px; border: var(--border); border-radius: 16px; background: var(--card-bg); padding: 0; overflow: visible;">
                
                <div class="post-header" style="padding: 15px 20px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div class="ph-left" style="display: flex; gap: 12px;">
                        <img src="${avatarUrl}" class="ph-avatar" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-cyan);">
                        <div class="ph-info" style="display: flex; flex-direction: column; justify-content: center;">
                            <div class="ph-name" style="font-weight: 700; font-size: 1rem; color: var(--text);">
                                ${displayName} ${verifiedIcon}
                            </div>
                            <span style="font-size: 0.85rem; color: var(--muted);">${displayHandle} &bull; ${timeAgo}</span>
                        </div>
                    </div>
                    
                    <div style="position:relative;">
                        <div class="post-options-btn" style="cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">
                            <i class="fa-solid fa-ellipsis" style="color: var(--muted);"></i>
                        </div>
                        <div class="post-menu-dropdown hidden" style="position: absolute; top: 30px; right: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; width: 150px; z-index: 10; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
                            <div class="menu-item danger action-delete" style="padding: 12px 15px; color: #ff4757; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; transition: background 0.2s;">
                                <i class="fa-regular fa-trash-can"></i> Delete
                            </div>
                        </div>
                    </div>
                </div>

                <div class="post-body" style="padding: 0 20px 15px 20px; font-size: 1rem; line-height: 1.5; color: var(--text); white-space: pre-wrap;">${safePostText}</div>

                <div class="post-actions" style="padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); color: var(--muted); font-size: 1.3rem;">
                    <div style="display: flex; gap: 25px; align-items: center;">
                        
                        <div class="reaction-wrapper" style="padding: 5px 0;">
                             <i class="fa-regular fa-thumbs-up action-like main-like-btn" style="cursor: pointer; transition: 0.2s;"></i>
                             
                             <div class="reaction-picker">
                                <span class="react-emoji" data-type="post" data-reaction="like">👍</span>
                                <span class="react-emoji" data-type="post" data-reaction="love">❤️</span>
                                <span class="react-emoji" data-type="post" data-reaction="haha">😆</span>
                                <span class="react-emoji" data-type="post" data-reaction="wow">😮</span>
                                <span class="react-emoji" data-type="post" data-reaction="sad">😢</span>
                                <span class="react-emoji" data-type="post" data-reaction="angry">😡</span>
                             </div>
                        </div>

                        <i class="fa-regular fa-comment action-comment-trigger" style="cursor: pointer; transition: 0.2s;"></i>
                        <i class="fa-solid fa-dollar-sign" style="cursor: pointer; transition: 0.2s;"></i>
                    </div>
                    <i class="fa-regular fa-bookmark" style="cursor: pointer;"></i>
                </div>
                
                <div class="post-likes-count" style="padding: 0 20px 10px; font-size: 0.9rem; font-weight: 700; color: var(--text);">0 Likes</div>

                <div class="post-comments-area hidden" style="background: rgba(0,0,0,0.2); padding: 15px 20px;">
                    <div class="comments-list" style="margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px;">
                        ${commentsHTML}
                        <div class="no-comments-msg" style="text-align: center; font-size: 0.85rem; color: var(--muted); ${post.comments && post.comments.length > 0 ? 'display:none;' : ''}">No comments yet</div>
                    </div>
                    
                    <div class="comment-input-wrapper" style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.1); position: relative;">
                        <i class="fa-regular fa-face-smile action-emoji-toggle" style="cursor: pointer; color: var(--muted); font-size: 1.1rem;"></i>
                        <input type="text" class="comment-input" placeholder="Write a comment..." style="flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 0.95rem;">
                        <i class="fa-solid fa-paper-plane action-send-comment" style="cursor: pointer; color: var(--primary-cyan); font-size: 1.1rem;"></i>
                    </div>

                    <div class="emoji-tray hidden" style="margin-top: 10px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px; display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px;">
                        ${emojiGridHTML}
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function setupProfileFeedInteractions() {
    const feed = document.getElementById('profile-content-posts');
    if (!feed || feed.dataset.listenersAttached === 'true') return; 

    feed.dataset.listenersAttached = 'true';

    // 🆕 LONG PRESS LOGIC FOR MOBILE REACTIONS
    let pressTimer;
    feed.addEventListener('touchstart', (e) => {
        if (e.target.closest('.main-like-btn') || e.target.closest('.action-comment-like')) {
            pressTimer = setTimeout(() => {
                const wrapper = e.target.closest('.reaction-wrapper') || e.target.closest('.comment-reaction-wrapper');
                if(wrapper) {
                    const picker = wrapper.querySelector('.reaction-picker, .comment-reaction-picker');
                    if(picker) {
                        // Close other pickers
                        document.querySelectorAll('.reaction-picker.active, .comment-reaction-picker.active').forEach(p => p.classList.remove('active'));
                        picker.classList.add('active');
                    }
                }
            }, 500); // 500ms Long press triggers emoji
        }
    });

    feed.addEventListener('touchend', () => clearTimeout(pressTimer));
    feed.addEventListener('touchmove', () => clearTimeout(pressTimer));

    // CLICK LISTENER
    feed.addEventListener('click', (e) => {
        const target = e.target;
        const postCard = target.closest('.post-card');
        
        // Close all open pickers on click anywhere else
        if (!target.closest('.reaction-wrapper') && !target.closest('.comment-reaction-wrapper')) {
            document.querySelectorAll('.reaction-picker.active, .comment-reaction-picker.active').forEach(el => el.classList.remove('active'));
        }

        if(!postCard) return;

        const postId = postCard.dataset.id;
        const input = postCard.querySelector('.comment-input');
        const emojiTray = postCard.querySelector('.emoji-tray');
        const commentSection = postCard.querySelector('.post-comments-area');

        // --- MENU DROPDOWN ---
        if (target.closest('.post-options-btn')) {
            e.stopPropagation();
            const btn = target.closest('.post-options-btn');
            const menu = btn.nextElementSibling; 
            if (menu) menu.classList.toggle('hidden');
        } else {
            document.querySelectorAll('.post-menu-dropdown').forEach(m => m.classList.add('hidden'));
        }
        
        // --- DELETE POST ---
        if (target.closest('.action-delete')) {
            Swal.fire({
                title: 'Delete Post?', text: "Cannot be undone.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ff4757', confirmButtonText: 'Delete', background: '#0d1423', color: '#fff'
            }).then((result) => {
                if (result.isConfirmed) {
                    deletePostFromStorage(postId);
                    renderProfilePosts(); 
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Deleted', showConfirmButton: false, timer: 3000, background: '#0d1423', color: '#fff' });
                }
            });
        }

        // --- SELECTING AN EMOJI REACTION ---
        if (target.closest('.react-emoji')) {
            e.stopPropagation();
            const emojiBtn = target.closest('.react-emoji');
            const reactionType = emojiBtn.dataset.reaction;
            const context = emojiBtn.dataset.type; // 'post' or 'comment'

            // Hide picker after selection
            document.querySelectorAll('.reaction-picker.active, .comment-reaction-picker.active').forEach(el => el.classList.remove('active'));

            if (context === 'post') {
                const mainIcon = postCard.querySelector('.main-like-btn');
                const likesCountDiv = postCard.querySelector('.post-likes-count');

                if (mainIcon) {
                    mainIcon.className = 'fa-solid main-like-btn action-like'; 
                    // Reset colors
                    mainIcon.style.color = '';
                    
                    switch(reactionType) {
                        case 'like': mainIcon.classList.add('fa-thumbs-up'); mainIcon.style.color = '#64E9EE'; break;
                        case 'love': mainIcon.classList.add('fa-heart'); mainIcon.style.color = '#ff4757'; break;
                        case 'haha': mainIcon.classList.add('fa-face-laugh-squint'); mainIcon.style.color = '#f1c40f'; break;
                        case 'wow': mainIcon.classList.add('fa-face-surprise'); mainIcon.style.color = '#f1c40f'; break;
                        case 'sad': mainIcon.classList.add('fa-face-sad-tear'); mainIcon.style.color = '#e67e22'; break;
                        case 'angry': mainIcon.classList.add('fa-face-angry'); mainIcon.style.color = '#e74c3c'; break;
                    }
                    // Trigger animation
                    mainIcon.style.transform = 'scale(1.4)';
                    setTimeout(() => mainIcon.style.transform = 'scale(1)', 200);
                }
                if(likesCountDiv) likesCountDiv.innerText = "1 Like"; 
            }
            else if (context === 'comment') {
                const commentWrapper = target.closest('.comment-reaction-wrapper');
                const commentLikeBtn = commentWrapper.querySelector('.action-comment-like');
                
                if(commentLikeBtn) {
                    commentLikeBtn.innerHTML = getEmojiIcon(reactionType);
                    commentLikeBtn.classList.add('liked');
                    commentLikeBtn.style.color = getEmojiColor(reactionType);
                    commentLikeBtn.style.fontWeight = 'bold';
                }
            }
            return;
        }

        // --- TOGGLE POST LIKE (Simple Click) ---
        if (target.closest('.main-like-btn')) {
            const icon = target.closest('.main-like-btn');
            const likesCountDiv = postCard.querySelector('.post-likes-count');

            if (icon.classList.contains('fa-regular')) {
                // Like
                icon.className = 'fa-solid fa-thumbs-up main-like-btn action-like';
                icon.style.color = '#64E9EE';
                icon.style.transform = 'scale(1.3)';
                setTimeout(() => icon.style.transform = 'scale(1)', 200);
                if(likesCountDiv) likesCountDiv.innerText = "1 Like";
            } else {
                // Unlike (only if it's currently a like/emoji)
                icon.className = 'fa-regular fa-thumbs-up main-like-btn action-like';
                icon.style.color = ''; 
                if(likesCountDiv) likesCountDiv.innerText = "0 Likes";
            }
        }

        // --- TOGGLE COMMENT LIKE ---
        if (target.closest('.action-comment-like')) {
            const btn = target.closest('.action-comment-like');
            if (btn.classList.contains('liked')) {
                btn.classList.remove('liked');
                btn.innerHTML = 'Like';
                btn.style.color = '';
            } else {
                btn.classList.add('liked');
                btn.innerHTML = '<i class="fa-solid fa-heart"></i> 1';
                btn.style.color = '#ff4757';
            }
        }

        // --- TOGGLE COMMENT SECTION ---
        if (target.closest('.action-comment-trigger')) {
            if (commentSection) {
                commentSection.classList.toggle('hidden');
                if (!commentSection.classList.contains('hidden') && input) {
                    setTimeout(() => input.focus(), 100);
                }
            }
        }

        // --- EMOJI TRAY TOGGLE (Fix for clicking the icon) ---
        if (target.closest('.action-emoji-toggle')) {
            if(emojiTray) emojiTray.classList.toggle('hidden');
        }

        // --- ADD EMOJI TO INPUT ---
        if (target.closest('.emoji-btn')) {
            const btn = target.closest('.emoji-btn');
            const emoji = btn.innerText;
            if(input) {
                input.value += emoji;
                input.focus();
            }
        }

        // --- SEND COMMENT ---
        if (target.closest('.action-send-comment')) {
            submitComment(postCard, postId);
            if(emojiTray) emojiTray.classList.add('hidden'); 
        }

        // --- REPLY TO COMMENT ---
        if (target.closest('.action-reply-comment')) {
            const btn = target.closest('.action-reply-comment');
            const commentItem = btn.closest('.comment-item');
            const nameEl = commentItem.querySelector('.comment-author-name');
            const name = (nameEl && nameEl.innerText === 'You') ? 'User' : (nameEl ? nameEl.innerText : 'User');
            
            if (commentSection && commentSection.classList.contains('hidden')) {
                commentSection.classList.remove('hidden');
            }
            if(input) {
                if (!input.value.includes(`@${name}`)) {
                    input.value = `@${name} ` + input.value;
                }
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    feed.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && e.target.classList.contains('comment-input')) {
            e.preventDefault();
            const postCard = e.target.closest('.post-card');
            const postId = postCard.dataset.id;
            submitComment(postCard, postId);
            const emojiTray = postCard.querySelector('.emoji-tray');
            if(emojiTray) emojiTray.classList.add('hidden');
        }
    });
}

function submitComment(postCard, postId) {
    const input = postCard.querySelector('.comment-input');
    const text = input.value.trim();
    if (!text) return;

    const list = postCard.querySelector('.comments-list');
    const emptyMsg = postCard.querySelector('.no-comments-msg');
    if(emptyMsg) emptyMsg.style.display = 'none';

    const newCommentHTML = createCommentHTML(text);
    list.insertAdjacentHTML('beforeend', newCommentHTML);
    addCommentToStorage(postId, text);
    input.value = '';
}

function createCommentHTML(text) {
    let formattedText = text.replace(/(@\w+)/g, '<span style="color:var(--primary-cyan); font-weight:bold;">$1</span>');

    return `
        <div class="comment-item" style="display: flex; gap: 10px; align-items: flex-start; animation: fadeIn 0.3s;">
            <img src="${DEFAULT_AVATAR}" class="comment-avatar" style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;">
            <div class="comment-body" style="flex: 1;">
                <div class="comment-bubble" style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 12px; border-top-left-radius: 2px;">
                    <div class="comment-author-name" style="font-weight:700; font-size:0.85rem; color:var(--text); margin-bottom:2px;">You</div>
                    <div style="font-size: 0.9rem; color: #eee; line-height: 1.4;">${formattedText}</div>
                </div>
                <div class="comment-meta" style="font-size: 0.75rem; color: var(--muted); margin-top: 4px; margin-left: 5px; display:flex; gap:10px; align-items:center;">
                    
                    <div class="comment-reaction-wrapper">
                        <span class="action-comment-like" style="cursor: pointer; font-weight:600;">Like</span>
                        <div class="comment-reaction-picker">
                            <span class="react-emoji" data-type="comment" data-reaction="like">👍</span>
                            <span class="react-emoji" data-type="comment" data-reaction="love">❤️</span>
                            <span class="react-emoji" data-type="comment" data-reaction="haha">😆</span>
                            <span class="react-emoji" data-type="comment" data-reaction="sad">😢</span>
                            <span class="react-emoji" data-type="comment" data-reaction="angry">😡</span>
                        </div>
                    </div>

                    <span class="action-reply-comment" style="cursor: pointer; font-weight:600; color:var(--text);">Reply</span>
                    <span>Just now</span>
                </div>
            </div>
        </div>
    `;
}

// Helpers for Icons/Colors
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

function deletePostFromStorage(id) {
    let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    posts = posts.filter(p => p.id != id); 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function addCommentToStorage(postId, text) {
    let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = posts.findIndex(p => p.id == postId);
    if (index !== -1) {
        if (!posts[index].comments) posts[index].comments = [];
        posts[index].comments.push(text);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
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

function renderProfileMedia() {
    const container = document.getElementById('profile-content-media');
    if (!container) return;

    const uploadedMedia = JSON.parse(localStorage.getItem('tm_uploaded_media') || '[]');

    if (uploadedMedia.length === 0) {
        container.innerHTML = `
            <div class="rs-col-empty" style="margin-top:50px; text-align:center; color:var(--muted);">
                 <div class="empty-icon-wrap" style="margin: 0 auto 15px; width:60px; height:60px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-regular fa-images" style="font-size:1.5rem;"></i>
                 </div>
                 <span>No media found</span>
            </div>`;
        return;
    }

    container.innerHTML = `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:2px;"></div>`;
    const grid = container.querySelector('div');

    uploadedMedia.forEach(media => {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.paddingBottom = '100%';
        div.style.background = '#000';
        div.style.cursor = 'pointer';

        if(media.type === 'image') {
            div.innerHTML = `<img src="${media.src}" style="position:absolute; width:100%; height:100%; object-fit:cover;">`;
        } else {
            div.innerHTML = `<video src="${media.src}" style="position:absolute; width:100%; height:100%; object-fit:cover;"></video>
                             <i class="fa-solid fa-play" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff;"></i>`;
        }
        grid.appendChild(div);
    });
}

// ==========================================
// Helpers (Profile Edit)
// ==========================================

function tmEscapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function tmEscapeAttr(str = '') {
    // Same as escapeHtml, kept separate for readability
    return tmEscapeHtml(str);
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

    if (!found) out.push(`${label}: ${v}`.trim());

    // Remove empty values
    const cleaned = out.filter(s => {
        const idx = s.indexOf(':');
        if (idx === -1) return true;
        const val = s.slice(idx + 1).trim();
        return val.length > 0;
    });

    return cleaned.join(' | ');
}

async function tmGetMeSafe() {
    try {
        if (window.__tmMe) return window.__tmMe;
    } catch (_) {}

    try {
        const res = await fetch('/api/me', { method: 'GET', credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (data && data.ok && data.user) {
            try { window.__tmMe = data.user; } catch (_) {}
            return data.user;
        }
    } catch (_) {}

    // Fallback: minimal local
    try {
        return JSON.parse(localStorage.getItem('tm_user') || 'null');
    } catch (_) {
        return null;
    }
}

function tmLocalPackedKey(email) {
    const e = String(email || '').toLowerCase().trim();
    return e ? `tm_creator_packed_${e}` : 'tm_creator_packed';
}

function tmReadLocalPacked(email) {
    try {
        return localStorage.getItem(tmLocalPackedKey(email)) || '';
    } catch (_) {
        return '';
    }
}

function tmWriteLocalPacked(email, packed) {
    try {
        localStorage.setItem(tmLocalPackedKey(email), String(packed || ''));
    } catch (_) {}
}

async function tmSaveCreatorProfilePacked(packed) {
    const res = await fetch('/api/me/creator/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentStyle: String(packed || '') })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || !data.ok) {
        const msg = (data && data.message) ? data.message : 'Unable to save profile';
        throw new Error(msg);
    }

    // Some backends echo saved contentStyle
    return String(data.contentStyle || packed || '');
}

function tmApplyProfileName(name) {
    const n = String(name || '').trim();
    if (!n) return;
    const els = [
        document.getElementById('creatorHeaderName'),
        document.getElementById('creatorProfileName'),
        document.getElementById('creatorPopoverName')
    ].filter(Boolean);
    els.forEach(el => { el.textContent = n; });
}

function tmApplyProfileBio(bio) {
    const el = document.querySelector('#view-my-profile .profile-bio-text');
    if (!el) return;
    const b = String(bio || '').trim();
    el.textContent = b ? b : 'No bio yet. Tap "Edit Profile" to add one.';
}

function tmToastOk(title) {
    try {
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: String(title || 'Done'),
            showConfirmButton: false,
            timer: 1800,
            timerProgressBar: true
        });
    } catch (_) {}
}

function tmToastErr(title) {
    try {
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'error',
            title: String(title || 'Error'),
            showConfirmButton: false,
            timer: 2400,
            timerProgressBar: true
        });
    } catch (_) {}
}