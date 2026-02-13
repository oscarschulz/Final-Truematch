import { DOM } from './dom.js';

// TODO: Backend Integration - Replace STORAGE_KEY with API Endpoints
const STORAGE_KEY = 'tm_user_posts';


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
    const nameEl = document.getElementById('creatorProfileName') || document.getElementById('creatorPopoverName');
    const handleEl = document.getElementById('creatorProfileHandle') || document.getElementById('creatorPopoverHandle');
    const avatarEl = document.getElementById('creatorProfileAvatar') || document.querySelector('#view-my-profile .profile-avatar-main');

    const name = (nameEl && nameEl.textContent && nameEl.textContent.trim()) ? nameEl.textContent.trim() : 'Your Name';
    const handle = (handleEl && handleEl.textContent && handleEl.textContent.trim()) ? handleEl.textContent.trim() : '@username';
    const avatarUrl = (avatarEl && avatarEl.getAttribute) ? (avatarEl.getAttribute('src') || 'assets/images/truematch-mark.png') : 'assets/images/truematch-mark.png';

    return { name, handle, avatarUrl };
}

function tmToast(TopToast, icon, title) {
    try {
        if (TopToast && TopToast.fire) return TopToast.fire({ icon, title });
    } catch {}
}

function tmNowId() {
    return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
}

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

            // If poll UI is open and user typed poll options, turn this into a poll-post
            const pollIsOpen = DOM.pollUI && !DOM.pollUI.classList.contains('hidden');
            const pollInputs = pollIsOpen ? Array.from(DOM.pollUI.querySelectorAll('input[type=\"text\"]')) : [];
            const pollOptions = pollInputs
                .map(i => (i.value || '').trim())
                .filter(Boolean);

            const isPollPost = pollIsOpen && pollOptions.length > 0;
            if (isPollPost && pollOptions.length < 2) {
                tmToast(TopToast, 'warning', 'Add at least 2 poll options');
                return;
            }

            const newPost = {
                id: tmNowId(),
                type: isPollPost ? 'poll' : 'text',
                text: text,
                timestamp: Date.now(),
                comments: [],
            };

            if (isPollPost) {
                newPost.poll = { options: pollOptions.slice(0, 6) };
                newPost.pollVotes = new Array(newPost.poll.options.length).fill(0);
                newPost.pollMyVote = null;
            }

            savePost(newPost);
            renderPost(newPost, true);

            // Reset composer
            DOM.composeInput.value = '';
            DOM.btnPostSubmit.setAttribute('disabled', 'true');
            DOM.btnPostSubmit.style.opacity = '0.5';
            DOM.btnPostSubmit.style.cursor = 'not-allowed';

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
            // Quiz Composer
            else if (target.classList.contains('fa-clipboard-question')) {
                tmOpenQuizComposer(TopToast);
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
        feed.addEventListener('click', (e) => {
            const target = e.target;

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

            // --- SEND COMMENT (Persisted) ---
            if (target.closest('.btn-send-comment')) {
                const postCard = target.closest('.post-card');
                const input = postCard ? postCard.querySelector('.comment-input') : null;
                const list = postCard ? postCard.querySelector('.comment-list') : null;
                const emptyMsg = postCard ? postCard.querySelector('.no-comments-msg') : null;
                const text = input ? input.value.trim() : '';
                if (!postCard || !input || !list) return;

                if (text) {
                    const postId = postCard.id.replace('post-', '');
                    const comment = { id: tmNowId(), text, timestamp: Date.now() };

                    const updated = updatePost(postId, (post) => {
                        if (!post) return post;
                        if (!Array.isArray(post.comments)) post.comments = [];
                        post.comments.push(comment);
                        return post;
                    });

                    if (emptyMsg) emptyMsg.style.display = 'none';
                    list.insertAdjacentHTML('beforeend', generateCommentHTML(comment.text, comment.timestamp));
                    input.value = '';

                    tmToast(TopToast, 'success', 'Comment added');
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


function setPosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// Update a post by id (persisted)
function updatePost(postId, updater) {
    const posts = getPosts();
    const idx = posts.findIndex(p => String(p.id) === String(postId));
    if (idx === -1) return null;
    const updated = updater({ ...posts[idx] });
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
    }).then((res) => {
        if (!res.isConfirmed || !res.value) return;
        const v = res.value;
        const newPost = {
            id: tmNowId(),
            type: 'quiz',
            text: v.question,
            timestamp: Date.now(),
            comments: [],
            quiz: {
                question: v.question,
                options: v.options,
                correctIndex: v.correctIndex,
                explanation: v.explanation || ''
            },
            quizVotes: new Array(v.options.length).fill(0),
            quizMyAnswer: null
        };

        savePost(newPost);
        renderPost(newPost, true);
        if (DOM.feedEmptyState) DOM.feedEmptyState.style.display = 'none';
        tmToast(TopToast, 'success', 'Quiz posted');
    });
}

function loadPosts() {
    if (!DOM.creatorFeed) return;

    const posts = getPosts();

    if (posts.length > 0 && DOM.feedEmptyState) {
        DOM.feedEmptyState.style.display = 'none';
    }

    posts
        .slice()
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .forEach(post => {
            renderPost(post, false);
        });
}

// ==========================================
// 🎨 HTML GENERATORS

// ==========================================

function renderPost(post, animate) {
    const timeAgo = getTimeAgo(post.timestamp || Date.now());
    const animationStyle = animate ? 'animation: fadeIn 0.3s ease;' : '';

    const { name, handle, avatarUrl } = tmGetCreatorIdentity();

    const safeText = tmEscapeHtml(post.text || '').replace(/\n/g, '<br>');

    const comments = Array.isArray(post.comments) ? post.comments : [];
    const commentsHTML = comments.map(c => generateCommentHTML(c.text, c.timestamp)).join('');
    const noCommentsStyle = comments.length ? 'display:none;' : '';

    const extraBlock = (post.type === 'poll') ? renderPollBlock(post)
                    : (post.type === 'quiz') ? renderQuizBlock(post)
                    : '';

    const postHTML = `
        <div class="post-card" id="post-${post.id}" style="padding: 20px; border-bottom: var(--border); ${animationStyle}">
            <div class="post-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div style="display: flex; gap: 12px;">
                    <img src="${tmEscapeHtml(avatarUrl)}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-cyan);">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 700; font-size: 1rem;">${tmEscapeHtml(name)} <i class="fa-solid fa-circle-check" style="color:var(--primary-cyan); font-size:0.8rem;"></i></span>
                        <span style="font-size: 0.85rem; color: var(--muted);">${tmEscapeHtml(handle)} &bull; ${timeAgo}</span>
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

            ${safeText ? `<div class="post-content" style="font-size: 0.95rem; line-height: 1.5; margin-bottom: 15px; white-space: normal;">${safeText}</div>` : ''}

            ${extraBlock}

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

function generateCommentHTML(text, timestamp = Date.now()) {
    const safe = tmEscapeHtml(text || '').replace(/\n/g, '<br>');
    const ago = getTimeAgo(timestamp);

    return `
        <div class="comment-item" style="animation: fadeIn 0.3s; display: flex; gap: 10px; align-items: flex-start;">
            <img src="assets/images/truematch-mark.png" class="comment-avatar" style="width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;">
            <div class="comment-body" style="flex: 1;">
                <div class="comment-bubble" style="background: var(--bg); padding: 8px 12px; border-radius: 12px; border: 1px solid var(--border-color); display: inline-block;">
                    <div style="font-weight:700; font-size:0.8rem; margin-bottom:2px;">You</div>
                    <div>${safe}</div>
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
                    <span style="opacity:0.6;">${ago}</span>
                </div>
            </div>
        </div>
    `;
}

// Helpers for Icons/Colors (Same as Profile.js)
 (Same as Profile.js)
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