import { DOM } from './dom.js';
import { CHAT_DATA, MSG_USERS, DEFAULT_AVATAR } from './data.js';

// TODO: Backend Integration - Replace LocalStorage with API Endpoints
let currentFilter = 'All'; 
let currentSearch = '';    
let activeChatUser = null; 
let toastInstance = null; // Store toast instance

// --- 🆕 HELPER: TAGGING SYSTEM & DELETION ---
function getUserTags() {
    return JSON.parse(localStorage.getItem('tm_chat_tags') || '{}');
}

function setUserTag(userId, tag) {
    const tags = getUserTags();
    
    // Toggle logic: Kung parehas ng current tag, remove it. Kung bago, update it.
    if (tags[userId] === tag) {
        delete tags[userId]; // Remove tag
        if(toastInstance) toastInstance.fire({ icon: 'success', title: 'Tag removed' });
    } else {
        tags[userId] = tag; // Set new tag
        if(toastInstance) toastInstance.fire({ icon: 'success', title: `Tagged as ${tag.toUpperCase()}` });
    }
    
    localStorage.setItem('tm_chat_tags', JSON.stringify(tags));
    renderMessageList(); // Refresh UI
}

function deleteConversation(userId) {
    // Hide user from list locally (Visual delete only for demo)
    let hiddenUsers = JSON.parse(localStorage.getItem('tm_hidden_chats') || '[]');
    hiddenUsers.push(userId);
    localStorage.setItem('tm_hidden_chats', JSON.stringify(hiddenUsers));
    renderMessageList();
    if(toastInstance) toastInstance.fire({ icon: 'success', title: 'Conversation deleted' });
}

export function initMessages(TopToast) {
    
    toastInstance = TopToast;
    renderMessageList();

    setTimeout(() => {
        // Default Load (User 1) -> WONT RUN if list is empty, Safe.
        const firstUser = MSG_USERS[0];
        if (firstUser) {
            activeChatUser = firstUser;
            loadChat(firstUser.id);
            updateHeaderInfo(firstUser.id);
            loadUserNote(firstUser.id); 
            unlockChatInputs(); 
        }
    }, 100);

    // ==========================================================
    // 🔥 NEW MESSAGE UI LOGIC 🔥
    // ==========================================================
    if (DOM.btnNewMsg) {
        DOM.btnNewMsg.addEventListener('click', () => {
            DOM.newMsgOverlay.classList.remove('hidden');
            renderNewMessageSuggestions();
        });
    }

    if (DOM.btnCloseNewMsg) {
        DOM.btnCloseNewMsg.addEventListener('click', () => {
            DOM.newMsgOverlay.classList.add('hidden');
        });
    }

    // Function to render suggestions in the new message overlay
    function renderNewMessageSuggestions() {
        if (!DOM.newMsgResults) return;
        DOM.newMsgResults.innerHTML = '';
        
        MSG_USERS.forEach(user => {
            const div = document.createElement('div');
            div.className = 'msg-user-item';
            div.innerHTML = `
                <img src="${user.avatar}" class="u-avatar">
                <div class="u-info">
                    <div class="u-name">${user.name} ${user.verified ? '<i class="fa-solid fa-circle-check verify-badge" style="color:var(--primary-cyan);"></i>' : ''}</div>
                    <div class="u-preview">${user.handle}</div>
                </div>
            `;
            // Click to start chat
            div.onclick = () => {
                DOM.newMsgOverlay.classList.add('hidden');
                openChatWithUser(user.id);
            };
            DOM.newMsgResults.appendChild(div);
        });
    }

    // Helper to switch chat
    function openChatWithUser(id) {
        // Find user item in sidebar and click it
        const sidebarItem = document.querySelector(`.msg-user-item[data-id="${id}"]`);
        if (sidebarItem) {
            sidebarItem.click();
        } else {
            // If filtering hid it, reset filters/search
            currentFilter = 'All';
            currentSearch = '';
            renderMessageList();
            setTimeout(() => {
                const item = document.querySelector(`.msg-user-item[data-id="${id}"]`);
                if(item) item.click();
            }, 50);
        }
    }


    // ==========================================================
    // 2. CLICK HEADER TO VISIT PROFILE
    // ==========================================================
    const chatHeaderUser = document.querySelector('.chat-header .ch-user');
    
    if (chatHeaderUser) {
        chatHeaderUser.addEventListener('click', () => {
            if (!activeChatUser) return;

            if (DOM.navProfile) {
                document.querySelectorAll('[id^="view-"]').forEach(el => el.style.display = 'none');
                if(DOM.viewMyProfile) DOM.viewMyProfile.style.display = 'block';
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                if(DOM.navProfile) DOM.navProfile.classList.add('active');
            }

            if (DOM.profileName) DOM.profileName.innerHTML = `${activeChatUser.name} <i class="fa-solid fa-circle-check" style="color:var(--primary-cyan); font-size: 0.9rem;"></i>`;
            if (DOM.profileHandle) DOM.profileHandle.innerHTML = `${activeChatUser.handle} &bull; <span style="cursor: pointer;">Available <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem;"></i></span>`;
            if (DOM.profileBio) DOM.profileBio.innerText = activeChatUser.preview || "No bio available.";
            if (DOM.profileAvatar) DOM.profileAvatar.src = activeChatUser.avatar;

            if (DOM.btnEditProfile) DOM.btnEditProfile.style.display = 'none';

            const backBtn = document.getElementById('profile-back-btn');
            if(backBtn) {
                backBtn.onclick = () => {
                    document.getElementById('nav-link-messages').click();
                };
            }
        });
    }

    // ==========================================================
    // TAB FILTERING LOGIC
    // ==========================================================
    const tabs = document.querySelectorAll('#msg-tabs span');
    if (tabs) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.innerText.trim();
                renderMessageList(); 
            });
        });
    }

    // AUTO-SAVE NOTES
    const noteInput = document.getElementById('chat-user-note');
    if (noteInput) {
        noteInput.addEventListener('input', (e) => {
            let activeUserId = 1; 
            const activeItem = document.querySelector('.msg-user-item.active');
            if (activeItem) activeUserId = activeItem.dataset.id;
            localStorage.setItem(`tm_note_${activeUserId}`, e.target.value);
        });
    }

    // NAV BUTTON LISTENERS
    const btnSearchSidebar = document.getElementById('trigger-msg-search');
    const searchBoxSidebar = document.getElementById('msg-search-box');
    const btnCloseSearch = document.getElementById('close-msg-search');
    const inputSearchSidebar = document.getElementById('msg-search-input');

    if (btnSearchSidebar && searchBoxSidebar) {
        btnSearchSidebar.addEventListener('click', () => {
            searchBoxSidebar.classList.remove('hidden');
            if(inputSearchSidebar) inputSearchSidebar.focus();
        });
    }

    if (btnCloseSearch && searchBoxSidebar) {
        btnCloseSearch.addEventListener('click', () => {
            searchBoxSidebar.classList.add('hidden');
            if(inputSearchSidebar) inputSearchSidebar.value = '';
            currentSearch = '';
            renderMessageList(); 
        });
    }

    if (inputSearchSidebar) {
        inputSearchSidebar.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderMessageList();
        });
    }

    const btnChatSearch = document.getElementById('btn-chat-search');
    const btnChatStar = document.getElementById('btn-chat-star');

    if (btnChatSearch) {
        btnChatSearch.addEventListener('click', () => {
            Swal.fire({
                title: 'Search in Conversation',
                input: 'text',
                inputPlaceholder: 'Find text...',
                confirmButtonColor: '#64E9EE',
                background: '#0d1423',
                color: '#fff'
            });
        });
    }

    if (btnChatStar) {
        btnChatStar.addEventListener('click', function() {
            if (this.classList.contains('fa-regular')) {
                this.classList.replace('fa-regular', 'fa-solid');
                this.style.color = 'gold'; 
                TopToast.fire({ icon: 'success', title: 'Conversation Starred!' });
            } else {
                this.classList.replace('fa-solid', 'fa-regular');
                this.style.color = ''; 
            }
        });
    }

    const btnMediaTop = document.getElementById('btn-chat-media-top');
    const btnMediaBottom = document.getElementById('btn-chat-media-bottom');
    
    const openMediaGallery = () => {
        const navCollections = document.getElementById('nav-link-collections');
        if (navCollections) {
            navCollections.click();
            setTimeout(() => {
                const tabBookmarks = document.getElementById('tab-col-bookmarks');
                if (tabBookmarks) tabBookmarks.click();
            }, 100);
        }
    };

    if (btnMediaTop) btnMediaTop.addEventListener('click', openMediaGallery);
    if (btnMediaBottom) btnMediaBottom.addEventListener('click', openMediaGallery);


    // USER LIST CLICK HANDLER
    setupInputListeners();

    // 🆕 GLOBAL LISTENER: Close Dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.msg-item-actions')) {
            document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));
        }
    });

    // 🔥 FIX: Initialize Mobile Observers HERE (Once HTML is ready)
    initMobileChatObservers();
}

// 🔥 FIX: Observer Logic moved inside a function called by initMessages
function initMobileChatObservers() {
    const viewMessages = document.getElementById('view-messages');
    
    if (viewMessages) {
        // Observer to detect View Changes (Hidden/Visible) or Class Changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // If 'mobile-chat-active' class is removed, Restore Input
                if (mutation.attributeName === 'class' && !viewMessages.classList.contains('mobile-chat-active')) {
                    restoreInputToChat();
                }
                // If View becomes hidden (e.g. switch to Home), Restore Input
                if (mutation.attributeName === 'style' && viewMessages.style.display === 'none') {
                    restoreInputToChat();
                }
            });
        });
        
        observer.observe(viewMessages, { attributes: true });
    }

    // Safety: Window Resize Reset
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && DOM.viewMessages) {
            DOM.viewMessages.classList.remove('mobile-chat-active');
            restoreInputToChat();
        }
    });
}

function renderMessageList() {
    const listContainer = document.getElementById('msg-user-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; 

    if (typeof MSG_USERS === 'undefined' || !MSG_USERS) return;

    // Get Data from Storage
    const userTags = getUserTags();
    const hiddenUsers = JSON.parse(localStorage.getItem('tm_hidden_chats') || '[]');

    // 1. FILTERING LOGIC
    let filteredUsers = MSG_USERS.filter(u => !hiddenUsers.includes(u.id)); // Remove deleted

    if (currentFilter === 'Priority') {
        filteredUsers = filteredUsers.filter(u => userTags[u.id] === 'priority');
    } 
    else if (currentFilter === '$$$') {
        filteredUsers = filteredUsers.filter(u => userTags[u.id] === 'whale');
    } 
    else if (currentFilter === 'Unread') {
        filteredUsers = filteredUsers.filter(u => u.unread > 0);
    }

    if (currentSearch) {
        filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(currentSearch.toLowerCase()) || 
            user.handle.toLowerCase().includes(currentSearch.toLowerCase())
        );
    }

    if (filteredUsers.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted); font-size:0.9rem;">No conversations found.</div>`;
        return;
    }

    filteredUsers.forEach(user => {
        const div = document.createElement('div');
        div.className = 'msg-user-item';
        div.dataset.id = user.id;
        
        // Badges Logic
        const isPriority = userTags[user.id] === 'priority';
        const isWhale = userTags[user.id] === 'whale';
        
        let badgesHTML = '';
        if (user.verified) badgesHTML += '<i class="fa-solid fa-circle-check verify-badge" style="color:var(--primary-cyan); margin-left:4px;" title="Verified"></i>';
        if (isPriority) badgesHTML += '<i class="fa-solid fa-star" style="color:var(--primary-cyan); margin-left:4px;" title="Priority"></i>';
        if (isWhale) badgesHTML += '<i class="fa-solid fa-sack-dollar" style="color:gold; margin-left:4px;" title="$$$"></i>';
        
        const unreadBadge = user.unread > 0 ? `<span style="background:var(--primary-cyan); color:#000; font-size:0.7rem; font-weight:bold; padding:2px 8px; border-radius:10px; margin-left:auto; display:inline-block;">${user.unread}</span>` : '';

        // HTML Structure
        div.innerHTML = `
            <img src="${user.avatar}" class="u-avatar">
            <div class="u-info">
                <div class="u-name" style="display:flex; align-items:center; width:100%; padding-right: 10px;">
                    ${user.name} ${badgesHTML} ${unreadBadge}
                </div>
                <div class="u-preview">${user.preview}</div>
            </div>
            
            <div class="msg-item-actions">
                <i class="fa-solid fa-ellipsis-vertical msg-opt-btn"></i>
                <div class="msg-dropdown hidden">
                    <div class="md-item action-tag-priority ${isPriority ? 'active' : ''}">
                        <i class="fa-solid fa-crown" style="${isPriority ? 'color:var(--primary-cyan)' : ''}"></i> 
                        ${isPriority ? 'Remove Priority' : 'Add to Priority'}
                    </div>
                    <div class="md-item action-tag-whale ${isWhale ? 'active' : ''}">
                        <i class="fa-solid fa-money-bill" style="${isWhale ? 'color:gold' : ''}"></i> 
                        ${isWhale ? 'Remove $$$' : 'Add to $$$'}
                    </div>
                    <div class="md-divider"></div>
                    <div class="md-item action-view-profile">
                        <i class="fa-regular fa-user"></i> View Profile
                    </div>
                    <div class="md-item danger action-delete">
                        <i class="fa-regular fa-trash-can"></i> Delete
                    </div>
                </div>
            </div>
            <div class="u-meta">
                <span class="time">${user.time}</span>
            </div>
        `;

        // --- EVENTS ---
        const btnOpt = div.querySelector('.msg-opt-btn');
        const dropdown = div.querySelector('.msg-dropdown');
        btnOpt.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.msg-dropdown').forEach(d => { if(d !== dropdown) d.classList.add('hidden'); });
            dropdown.classList.toggle('hidden');
        });

        div.querySelector('.action-tag-priority').addEventListener('click', (e) => { e.stopPropagation(); setUserTag(user.id, 'priority'); });
        div.querySelector('.action-tag-whale').addEventListener('click', (e) => { e.stopPropagation(); setUserTag(user.id, 'whale'); });
        div.querySelector('.action-view-profile').addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.add('hidden');
            if(DOM.navProfile) DOM.navProfile.click();
            setTimeout(() => {
                if(DOM.profileName) DOM.profileName.innerText = user.name;
                if(DOM.profileHandle) DOM.profileHandle.innerText = user.handle;
                if(DOM.profileAvatar) DOM.profileAvatar.src = user.avatar;
            }, 100);
        });
        div.querySelector('.action-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            Swal.fire({
                title: 'Delete conversation?', text: "This will hide the chat from your list.", icon: 'warning',
                showCancelButton: true, confirmButtonColor: '#ff4757', confirmButtonText: 'Delete', background: '#0d1423', color: '#fff'
            }).then((result) => {
                if (result.isConfirmed) deleteConversation(user.id);
            });
        });

        // Main Click (Open Chat)
        div.addEventListener('click', (e) => {
            if(e.target.closest('.msg-item-actions')) return; 

            document.querySelectorAll('.msg-user-item').forEach(i => i.classList.remove('active'));
            div.classList.add('active');
            
            activeChatUser = user;
            loadUserNote(user.id);
            loadChat(user.id);
            updateHeaderInfo(user.id);
            unlockChatInputs();

            initMobileBackBtn(); 
            
            // Trigger Mobile View
            if (window.innerWidth <= 1024 && DOM.viewMessages) {
                DOM.viewMessages.classList.add('mobile-chat-active');
                requestAnimationFrame(() => { teleportInputToBody(); });
            }
        });

        listContainer.appendChild(div);
    });
}

function loadUserNote(userId) {
    const noteInput = document.getElementById('chat-user-note');
    if (noteInput) {
        const savedNote = localStorage.getItem(`tm_note_${userId}`) || '';
        noteInput.value = savedNote;
    }
}

export function loadChat(userId) {
    if (!DOM.chatHistoryContainer) return;
    DOM.chatHistoryContainer.innerHTML = '';
    
    if (typeof CHAT_DATA === 'undefined') return;

    const id = parseInt(userId);
    const messages = CHAT_DATA[id] || [];
    
    messages.forEach(msg => {
        DOM.chatHistoryContainer.appendChild(createMessageBubble(msg.text, msg.type, msg.time));
    });
    
    DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
}

function createMessageBubble(text, type, time) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${type}`;
    div.innerHTML = `${text} <span class="time">${time}</span>`;
    return div;
}

function updateHeaderInfo(userId) {
    const user = MSG_USERS.find(u => u.id === userId);
    if(user && DOM.activeChatName) {
         DOM.activeChatName.innerHTML = `${user.name} <i class="fa-solid fa-circle-check verify-badge" style="color: var(--primary-cyan); margin-left:5px;"></i>`;
         if(DOM.activeChatAvatar) DOM.activeChatAvatar.src = user.avatar;
    }
}

function unlockChatInputs() {
    const chatInput = document.getElementById('chat-message-input');
    const chatBox = document.querySelector('.chat-input-box');
    const headerActions = document.querySelector('.ch-actions');

    if(chatInput) {
        chatInput.disabled = false; 
        chatInput.placeholder = "Type a message...";
    }
    if(chatBox) {
        chatBox.style.opacity = '1';
        chatBox.style.pointerEvents = 'auto';
    }
    if(headerActions) {
        headerActions.style.opacity = '1';
        headerActions.style.pointerEvents = 'auto';
    }
}

function setupInputListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('fa-face-smile') || e.target.id === 'btn-emoji-trigger') {
            e.stopPropagation();
            const container = document.getElementById('emoji-picker-container');
            if(container) container.classList.toggle('hidden');
        }
        if (e.target.classList.contains('fa-dollar-sign') || e.target.id === 'btn-ppv-trigger') {
            Swal.fire({
                title: 'Send Locked Message (PPV)',
                html: `<input type="number" id="ppv-price" class="swal2-input" placeholder="Price ($)"><textarea id="ppv-desc" class="swal2-textarea" placeholder="Description..."></textarea>`,
                showCancelButton: true, confirmButtonText: 'Attach Price', confirmButtonColor: '#2ecc71', background: '#0d1423', color: '#fff',
                preConfirm: () => document.getElementById('ppv-price').value
            }).then((result) => {
                if(result.isConfirmed) {
                    const input = document.getElementById('chat-message-input');
                    if(input) {
                        input.value = `[LOCKED: $${result.value}] `;
                        input.focus();
                    }
                }
            });
        }
    });

    // Close Emoji Picker on Outside Click
    document.addEventListener('click', (e) => {
        const container = document.getElementById('emoji-picker-container');
        if (container && !container.classList.contains('hidden')) {
            const isBtn = e.target.classList.contains('fa-face-smile') || e.target.id === 'btn-emoji-trigger';
            const isInsidePicker = container.contains(e.target);
            if (!isInsidePicker && !isBtn) {
                container.classList.add('hidden');
            }
        }
    });

    const btnSend = document.getElementById('btn-send-message');
    const input = document.getElementById('chat-message-input');
    
    if (btnSend && input) {
        const sendMsg = () => {
            const text = input.value.trim();
            const history = document.getElementById('chat-history-container');
            if (text && history) {
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const msgElement = createMessageBubble(text, 'sent', time);
                history.appendChild(msgElement);
                history.scrollTop = history.scrollHeight;
                input.value = '';
            }
        };
        btnSend.addEventListener('click', sendMsg);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMsg(); });
        
        input.addEventListener('focus', () => {
            setTimeout(() => {
                const history = document.getElementById('chat-history-container');
                if (history) history.scrollTo({ top: history.scrollHeight, behavior: 'smooth' });
            }, 300);
        });
    }

    const emojiContainer = document.getElementById('emoji-picker-container');
    if (window.picmo && emojiContainer) {
        try {
            const picker = picmo.createPicker({
                rootElement: emojiContainer, theme: 'dark', showPreview: false, autoFocus: 'search', visibleRows: 4
            });
            picker.addEventListener('emoji:select', (selection) => {
                const input = document.getElementById('chat-message-input');
                if(input) {
                    input.value += selection.emoji;
                    input.focus();
                }
            });
        } catch (err) { console.log('Picmo init warning:', err); }
    }
}

function initMobileBackBtn() {
    const chatUserDiv = document.querySelector('.ch-user');
    if (chatUserDiv) {
        const existingBtn = chatUserDiv.querySelector('.back-to-list-btn');
        if (!existingBtn) {
            const backBtn = document.createElement('i');
            backBtn.className = 'fa-solid fa-arrow-left back-to-list-btn';
            backBtn.style.cursor = 'pointer';
            backBtn.style.marginRight = '10px';
            chatUserDiv.prepend(backBtn);
            
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(DOM.viewMessages) {
                    DOM.viewMessages.classList.remove('mobile-chat-active');
                    // restoreInputToChat is handled by MutationObserver automatically now
                }
            });
        }
    }
}

// --- INPUT TELEPORTATION LOGIC ---

const restoreInputToChat = () => {
    const inputBox = document.querySelector('.chat-input-box');
    const chatArea = document.querySelector('.msg-chat-area');
    
    // Check if input is attached to Body
    if (inputBox && chatArea && inputBox.parentNode === document.body) {
        chatArea.appendChild(inputBox); // Move back to Chat Area
        inputBox.style = ''; // Reset Fixed Styles
        inputBox.onclick = null; 
        
        const history = document.getElementById('chat-history-container');
        if (history) history.style.paddingBottom = ''; 
    }
};

const teleportInputToBody = () => {
    const inputBox = document.querySelector('.chat-input-box');
    
    // Only move if not already on body
    if (inputBox && inputBox.parentNode !== document.body) {
        document.body.appendChild(inputBox);
        inputBox.style.display = 'flex';
        inputBox.style.position = 'fixed';
        inputBox.style.bottom = '0';
        inputBox.style.left = '0';
        inputBox.style.right = '0';
        inputBox.style.width = '100%';
        inputBox.style.zIndex = '2147483650'; 
        inputBox.style.backgroundColor = 'var(--card-bg, #0d1423)';
        inputBox.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        inputBox.style.padding = '10px 15px';
        inputBox.style.paddingBottom = 'max(15px, env(safe-area-inset-bottom))';
        inputBox.style.boxShadow = '0 -5px 20px rgba(0,0,0,0.5)';
        inputBox.style.pointerEvents = 'auto'; 
        
        const history = document.getElementById('chat-history-container');
        if (history) {
            history.style.paddingBottom = '100px'; 
            setTimeout(() => { history.scrollTop = history.scrollHeight; }, 50);
        }

        // Prevent body clicks from stealing focus
        inputBox.onclick = (e) => {
            if(e.target.tagName !== 'I') {
                const field = document.getElementById('chat-message-input');
                if(field) field.focus();
            }
        };
    }
};