import { DOM } from './dom.js';

// TODO: Backend Integration - Replace STORAGE_KEY with API Endpoints
const STORAGE_KEY = 'tm_user_posts';

export function initHome(TopToast) {
    
    // 0. LOAD POSTS FROM STORAGE (With 24h Check)
    loadPosts();

    // 1. ENABLE/DISABLE POST BUTTON (Typing Logic)
    if (DOM.composeInput && DOM.btnPostSubmit) {
        DOM.composeInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val.length > 0) {
                DOM.btnPostSubmit.removeAttribute('disabled');
                DOM.btnPostSubmit.style.opacity = '1';
                DOM.btnPostSubmit.style.cursor = 'pointer';
            } else {
                DOM.btnPostSubmit.setAttribute('disabled', 'true');
                DOM.btnPostSubmit.style.opacity = '0.5';
                DOM.btnPostSubmit.style.cursor = 'not-allowed';
            }
        });

        // 2. POST SUBMIT LOGIC
        DOM.btnPostSubmit.addEventListener('click', () => {
            const text = DOM.composeInput.value.trim();
            if (!text) return;

            // Create and Save
            const newPost = {
                id: Date.now(),
                text: text,
                timestamp: Date.now(),
                comments: []
            };

            savePost(newPost);
            renderPost(newPost, true); // true = animate
            
            // Reset Input
            DOM.composeInput.value = '';
            DOM.btnPostSubmit.setAttribute('disabled', 'true');
            DOM.btnPostSubmit.style.opacity = '0.5';
            DOM.btnPostSubmit.style.cursor = 'not-allowed';
            
            if(TopToast) {
                TopToast.fire({ icon: 'success', title: 'Posted successfully' });
            }
        });
    }

    // 3. Compose Actions (Redirect Image to Bookmarks, Poll, Text)
    if (DOM.composeActions) {
        DOM.composeActions.addEventListener('click', (e) => {
            const target = e.target;
            
            // --- UPDATED: IMAGE ICON -> GO TO COLLECTIONS > BOOKMARKS ---
            if (target.classList.contains('fa-image')) {
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
            else if (target.classList.contains('fa-square-poll-horizontal') || target.id === 'btn-trigger-poll') {
                if(DOM.pollUI) DOM.pollUI.classList.toggle('hidden');
            }
            // Text Tools Toggle
            else if (target.id === 'btn-trigger-text' || target.innerText === 'Aa') {
                if(DOM.textTools) DOM.textTools.classList.toggle('hidden');
            }
        });
    }

    if (DOM.closePollBtn) {
        DOM.closePollBtn.addEventListener('click', () => {
            if(DOM.pollUI) DOM.pollUI.classList.add('hidden');
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
        feed.addEventListener('click', (e) => {
            const target = e.target;

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
                const postCard = target.closest('.post-card');

                // Hide pickers
                document.querySelectorAll('.reaction-picker.active, .comment-reaction-picker.active').forEach(p => p.classList.remove('active'));

                // POST REACTION
                if (context === 'post') {
                    const mainIcon = postCard.querySelector('.main-like-btn');
                    const likesCount = postCard.querySelector('.post-likes'); 
                    
                    if (mainIcon) {
                        mainIcon.className = 'fa-solid main-like-btn action-like';
                        mainIcon.style.color = ''; // Reset
                        
                        // Set Icon & Color
                        switch(reactionType) {
                            case 'like': mainIcon.classList.add('fa-thumbs-up'); mainIcon.style.color = '#64E9EE'; break;
                            case 'love': mainIcon.classList.add('fa-heart'); mainIcon.style.color = '#ff4757'; break;
                            case 'haha': mainIcon.classList.add('fa-face-laugh-squint'); mainIcon.style.color = '#f1c40f'; break;
                            case 'wow': mainIcon.classList.add('fa-face-surprise'); mainIcon.style.color = '#f1c40f'; break;
                            case 'sad': mainIcon.classList.add('fa-face-sad-tear'); mainIcon.style.color = '#e67e22'; break;
                            case 'angry': mainIcon.classList.add('fa-face-angry'); mainIcon.style.color = '#e74c3c'; break;
                        }
                        // Animation
                        mainIcon.style.transform = 'scale(1.4)';
                        setTimeout(() => mainIcon.style.transform = 'scale(1)', 200);
                    }
                    if(likesCount) likesCount.innerText = "1 Like";
                }
                // COMMENT REACTION
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

            // --- MAIN LIKE BUTTON CLICK (Toggle) ---
            if (target.classList.contains('main-like-btn')) {
                const icon = target;
                const postCard = target.closest('.post-card');
                const likesCount = postCard.querySelector('.post-likes');

                if (icon.classList.contains('fa-regular')) {
                    icon.className = 'fa-solid fa-thumbs-up main-like-btn action-like';
                    icon.style.color = '#64E9EE';
                    icon.style.transform = 'scale(1.3)';
                    setTimeout(() => icon.style.transform = 'scale(1)', 200);
                    if(likesCount) likesCount.innerText = "1 Like";
                } else {
                    icon.className = 'fa-regular fa-thumbs-up main-like-btn action-like';
                    icon.style.color = '';
                    if(likesCount) likesCount.innerText = "0 Likes";
                }
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
                const commentSection = postCard.querySelector('.post-comments-section');
                const input = postCard.querySelector('.comment-input');
                if (commentSection) {
                    commentSection.classList.toggle('hidden');
                    if (!commentSection.classList.contains('hidden') && input) setTimeout(() => input.focus(), 100);
                }
            }

            // --- SEND COMMENT ---
            if (target.closest('.btn-send-comment')) {
                const postCard = target.closest('.post-card');
                const input = postCard.querySelector('.comment-input');
                const list = postCard.querySelector('.comment-list');
                const emptyMsg = postCard.querySelector('.no-comments-msg');
                const text = input.value.trim();
                
                if (text) {
                    if (emptyMsg) emptyMsg.style.display = 'none';
                    // 🔥 USE NEW GENERATOR WITH EMOJI SUPPORT 🔥
                    const newCommentHTML = generateCommentHTML(text);
                    list.insertAdjacentHTML('beforeend', newCommentHTML);
                    input.value = ''; 
                    
                    // Save to local storage logic (simplified for home)
                    // (Ideally, update storage here similar to profile.js)
                }
            }

            // --- REPLY CLICK ---
            if (target.classList.contains('action-reply-comment')) {
                const commentItem = target.closest('.comment-item');
                const commentBody = commentItem.querySelector('.comment-body');
                let replyBox = commentBody.querySelector('.reply-input-row');
                
                if (!replyBox) {
                    const replyHTML = `
                        <div class="reply-input-row">
                            <img src="assets/images/truematch-mark.png" style="width:25px; height:25px; border-radius:50%;">
                            <input type="text" class="reply-input" placeholder="Write a reply...">
                        </div>
                    `;
                    commentBody.insertAdjacentHTML('beforeend', replyHTML);
                    replyBox = commentBody.querySelector('.reply-input-row');
                }
                replyBox.querySelector('input').focus();
            }

            // Bookmark & Tip
            if (target.classList.contains('fa-bookmark')) {
                if (target.classList.contains('fa-regular')) {
                    target.classList.replace('fa-regular', 'fa-solid');
                    target.style.color = '#64E9EE';
                    if(TopToast) TopToast.fire({ icon: 'success', title: 'Saved' });
                } else {
                    target.classList.replace('fa-solid', 'fa-regular');
                    target.style.color = '';
                }
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
                        const replyHTML = `
                            <div class="comment-item" style="margin-top:10px; animation:fadeIn 0.2s;">
                                <img src="assets/images/truematch-mark.png" class="comment-avatar" style="width:25px; height:25px;">
                                <div class="comment-body">
                                    <div class="comment-bubble">
                                        <div style="font-weight:700; font-size:0.8rem;">You</div>
                                        <div>${text}</div>
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

function deletePost(id) {
    let posts = getPosts();
    posts = posts.filter(p => p.id != id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function loadPosts() {
    if (!DOM.creatorFeed) return;
    
    let posts = getPosts();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let hasChanges = false;

    const activePosts = posts.filter(post => {
        if (now - post.timestamp > oneDay) {
            hasChanges = true;
            return false;
        }
        return true;
    });

    if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activePosts));
    }

    if (activePosts.length > 0 && DOM.feedEmptyState) {
        DOM.feedEmptyState.style.display = 'none';
    }

    activePosts.forEach(post => {
        renderPost(post, false);
    });
}

// ==========================================
// 🎨 HTML GENERATORS
// ==========================================

function renderPost(post, animate) {
    const timeAgo = getTimeAgo(post.timestamp);
    const animationStyle = animate ? 'animation: fadeIn 0.3s ease;' : '';

    const postHTML = `
        <div class="post-card" id="post-${post.id}" style="padding: 20px; border-bottom: var(--border); ${animationStyle}">
            <div class="post-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div style="display: flex; gap: 12px;">
                    <img src="assets/images/truematch-mark.png" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-cyan);">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 700; font-size: 1rem;">Your Name <i class="fa-solid fa-circle-check" style="color:var(--primary-cyan); font-size:0.8rem;"></i></span>
                        <span style="font-size: 0.85rem; color: var(--muted);">@username &bull; ${timeAgo}</span>
                    </div>
                </div>
                
                <div style="position:relative;">
                    <div class="post-options-btn"><i class="fa-solid fa-ellipsis"></i></div>
                    <div class="post-menu-dropdown hidden">
                        <div class="menu-item"><i class="fa-regular fa-copy"></i> Copy Link</div>
                        <div class="menu-item"><i class="fa-solid fa-thumbtack"></i> Pin to Profile</div>
                        <div class="menu-item danger action-delete"><i class="fa-regular fa-trash-can"></i> Delete Post</div>
                    </div>
                </div>
            </div>

            <div class="post-content" style="font-size: 0.95rem; line-height: 1.5; margin-bottom: 15px; white-space: pre-wrap;">${post.text}</div>

            <div class="post-actions" style="display: flex; justify-content: space-between; align-items: center; color: var(--muted); padding-top: 10px; position: relative;">
                <div style="display: flex; gap: 25px; font-size: 1.3rem; align-items: center;">
                    
                    <div class="reaction-wrapper">
                        <i class="fa-regular fa-thumbs-up main-like-btn" style="cursor: pointer; transition: 0.2s;"></i>
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
                <i class="fa-regular fa-bookmark" style="cursor: pointer; font-size: 1.2rem; transition: 0.2s;"></i>
            </div>
            
            <div class="post-likes" style="font-size: 0.85rem; font-weight: 700; margin-top: 10px; color: var(--text);">0 Likes</div>

            <div class="post-comments-section hidden">
                 <div class="comment-list">
                    <div class="no-comments-msg" style="text-align: center; font-size: 0.85rem; color: var(--muted);">No comments yet</div>
                 </div>
                 <div class="comment-input-area">
                    <img src="assets/images/truematch-mark.png" style="width: 30px; height: 30px; border-radius: 50%;">
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
function generateCommentHTML(text) {
    return `
        <div class="comment-item" style="animation: fadeIn 0.3s; display: flex; gap: 10px; align-items: flex-start;">
            <img src="assets/images/truematch-mark.png" class="comment-avatar" style="width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;">
            <div class="comment-body" style="flex: 1;">
                <div class="comment-bubble" style="background: var(--bg); padding: 8px 12px; border-radius: 12px; border: 1px solid var(--border-color); display: inline-block;">
                    <div style="font-weight:700; font-size:0.8rem; margin-bottom:2px;">You</div>
                    <div>${text}</div>
                </div>
                <div class="comment-actions" style="display: flex; gap: 15px; margin-top: 5px; padding-left: 5px; font-size: 0.75rem; color: var(--muted); font-weight: 600;">
                    
                    <div class="comment-reaction-wrapper">
                        <span class="action-comment-like c-action" style="cursor: pointer;">Like</span>
                        <div class="comment-reaction-picker">
                            <span class="react-emoji" data-type="comment" data-reaction="like">👍</span>
                            <span class="react-emoji" data-type="comment" data-reaction="love">❤️</span>
                            <span class="react-emoji" data-type="comment" data-reaction="haha">😆</span>
                            <span class="react-emoji" data-type="comment" data-reaction="sad">😢</span>
                            <span class="react-emoji" data-type="comment" data-reaction="angry">😡</span>
                        </div>
                    </div>

                    <span class="c-action action-reply-comment" style="cursor: pointer;">Reply</span>
                    <span style="opacity:0.6;">Just now</span>
                </div>
            </div>
        </div>
    `;
}

// Helpers for Icons/Colors (Same as Profile.js)
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