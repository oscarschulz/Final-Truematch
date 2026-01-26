import { DOM } from './dom.js';
import { CHAT_DATA, DEFAULT_AVATAR } from './data.js';

export function initMessages(TopToast) {
    
    // 0. INIT BACK BUTTON FOR MOBILE
    const initMobileBackBtn = () => {
        const chatUserDiv = document.querySelector('.ch-user');
        // Check if button already exists AND if chatUserDiv exists
        if (chatUserDiv && !document.querySelector('.back-to-list-btn')) {
            const backBtn = document.createElement('i');
            backBtn.className = 'fa-solid fa-arrow-left back-to-list-btn';
            chatUserDiv.insertBefore(backBtn, chatUserDiv.firstChild);
            
            backBtn.addEventListener('click', () => {
                if(DOM.viewMessages) DOM.viewMessages.classList.remove('mobile-chat-active');
            });
        }
    };
    initMobileBackBtn();

    // Resize Handler: Remove mobile-chat-active if resizing to Desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && DOM.viewMessages) {
            DOM.viewMessages.classList.remove('mobile-chat-active');
        }
    });

    // 1. Sidebar Tabs
    if(DOM.msgTabs && DOM.msgTabs.length > 0) {
        DOM.msgTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                DOM.msgTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    // 2. User List Click
    const userListContainer = document.querySelector('.msg-user-list') || document.getElementById('msg-user-list');
    if (userListContainer) {
        userListContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.msg-user-item');
            if (!item) return;

            document.querySelectorAll('.msg-user-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const hasVerify = item.querySelector('.fa-circle-check');
            const verifyHtml = hasVerify ? ' <i class="fa-solid fa-circle-check verify-badge" style="color: var(--primary-cyan);"></i>' : '';

            if(DOM.activeChatName) DOM.activeChatName.innerHTML = `${item.dataset.name || 'User'}${verifyHtml}`;
            if(DOM.activeChatAvatar) DOM.activeChatAvatar.src = item.dataset.avatar || DEFAULT_AVATAR;
            
            if(DOM.infoNickname) DOM.infoNickname.value = item.dataset.name || 'User';
            if(DOM.infoHandle) DOM.infoHandle.innerText = item.dataset.handle || '@user';

            loadChat(item.dataset.id || 1);
            initMobileBackBtn(); // Ensure button is there
            
            // Only add class if on mobile
            if (window.innerWidth <= 768 && DOM.viewMessages) {
                DOM.viewMessages.classList.add('mobile-chat-active');
            }
        });
    }

    // 3. DOLLAR ($) & EMOJI BUTTON FIX
    const chatInputBox = document.querySelector('.chat-input-box') || document.querySelector('.msg-chat-area');
    
    if (chatInputBox) {
        chatInputBox.addEventListener('click', (e) => {
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
            if (e.target.classList.contains('fa-face-smile') || e.target.id === 'btn-emoji-trigger') {
                e.stopPropagation();
                const container = document.getElementById('emoji-picker-container');
                if(container) container.classList.toggle('hidden');
            }
        });
    }

    // 4. Picmo
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

    document.addEventListener('click', (e) => {
        const container = document.getElementById('emoji-picker-container');
        if (container && !container.classList.contains('hidden')) {
            const isBtn = e.target.classList.contains('fa-face-smile') || e.target.id === 'btn-emoji-trigger';
            if (!container.contains(e.target) && !isBtn) {
                container.classList.add('hidden');
            }
        }
    });

    // 5. Send Message
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
    }
}

export function loadChat(userId) {
    if (!DOM.chatHistoryContainer) return;
    DOM.chatHistoryContainer.innerHTML = '';
    const messages = CHAT_DATA[userId] || [];
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