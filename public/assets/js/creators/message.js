import { DOM } from './dom.js';
import { CHAT_DATA, DEFAULT_AVATAR } from './data.js';

export function initMessages(TopToast) {
    
    // --- HELPER: TELEPORT INPUT (FIXED POSITION & FORCE FOCUS) ---
    const teleportInputToBody = () => {
        const inputBox = document.querySelector('.chat-input-box');
        
        // Siguraduhing may input box at wala pa sa body
        if (inputBox && inputBox.parentNode !== document.body) {
            
            // 1. Ilipat sa Body para walang makaharang
            document.body.appendChild(inputBox);
            
            // 2. PWERSAHANG STYLE (Super High Z-Index)
            inputBox.style.display = 'flex';
            inputBox.style.position = 'fixed';
            inputBox.style.bottom = '0';
            inputBox.style.left = '0';
            inputBox.style.right = '0';
            inputBox.style.width = '100%';
            inputBox.style.zIndex = '2147483650'; // Mas mataas pa sa SweetAlert
            inputBox.style.backgroundColor = '#0d1423'; // Fallback color
            inputBox.style.backgroundColor = 'var(--card-bg, #0d1423)';
            inputBox.style.borderTop = '1px solid rgba(255,255,255,0.1)';
            inputBox.style.padding = '10px 15px';
            inputBox.style.paddingBottom = 'max(15px, env(safe-area-inset-bottom))'; // iPhone Home Bar padding
            inputBox.style.boxShadow = '0 -5px 20px rgba(0,0,0,0.5)';
            inputBox.style.pointerEvents = 'auto'; // Siguraduhing napipindot
            
            // 3. Magdagdag ng padding sa history para hindi matakpan ang messages
            const history = document.getElementById('chat-history-container');
            if (history) {
                history.style.paddingBottom = '100px'; 
                setTimeout(() => { history.scrollTop = history.scrollHeight; }, 50);
            }

            // 🔥 FORCE KEYBOARD TRIGGER 🔥
            // Kapag tinapik ang box, siguradong fo-focus ang input
            inputBox.onclick = (e) => {
                // Kung hindi button ang pinindot (emoji/send), focus sa input
                if(e.target.tagName !== 'I') {
                    const field = document.getElementById('chat-message-input');
                    if(field) field.focus();
                }
            };
        }
    };

    const restoreInputToChat = () => {
        const inputBox = document.querySelector('.chat-input-box');
        const chatArea = document.querySelector('.msg-chat-area');
        
        // Ibalik lang kung nasa body at mobile mode
        if (inputBox && chatArea && inputBox.parentNode === document.body) {
            chatArea.appendChild(inputBox); // Ibalik sa original na pwesto
            
            // Reset Styles
            inputBox.style.position = '';
            inputBox.style.bottom = '';
            inputBox.style.left = '';
            inputBox.style.right = '';
            inputBox.style.width = '';
            inputBox.style.zIndex = '';
            inputBox.style.boxShadow = '';
            inputBox.style.paddingBottom = '';
            inputBox.onclick = null; // Remove force focus listener
            
            const history = document.getElementById('chat-history-container');
            if (history) history.style.paddingBottom = ''; // Reset padding
        }
    };

    // --- AUTO-CLEANUP: Ibalik ang input pag umalis sa chat view ---
    const viewMessages = document.getElementById('view-messages');
    if (viewMessages) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (!viewMessages.classList.contains('mobile-chat-active')) {
                        restoreInputToChat();
                    }
                }
                if (mutation.attributeName === 'style') {
                    if (viewMessages.style.display === 'none') {
                        restoreInputToChat();
                    }
                }
            });
        });
        observer.observe(viewMessages, { attributes: true });
    }

    // 0. INIT BACK BUTTON FOR MOBILE/TABLET
    const initMobileBackBtn = () => {
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
                        restoreInputToChat();
                    }
                });
            }
        }
    };
    
    initMobileBackBtn();

    // Resize Handler
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && DOM.viewMessages) {
            DOM.viewMessages.classList.remove('mobile-chat-active');
            restoreInputToChat();
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

    // 2. User List Click (OPEN CHAT)
    const userListContainer = document.querySelector('.msg-user-list') || document.getElementById('msg-user-list');
    if (userListContainer) {
        userListContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.msg-user-item');
            if (!item) return;

            document.querySelectorAll('.msg-user-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const userName = item.dataset.name || 'User';
            const userAvatar = item.dataset.avatar || DEFAULT_AVATAR;
            const userHandle = item.dataset.handle || '@user';
            const hasVerify = item.querySelector('.fa-circle-check');
            const verifyHtml = hasVerify ? ' <i class="fa-solid fa-circle-check verify-badge" style="color: var(--primary-cyan);"></i>' : '';

            if(DOM.activeChatName) DOM.activeChatName.innerHTML = `${userName}${verifyHtml}`;
            if(DOM.activeChatAvatar) DOM.activeChatAvatar.src = userAvatar;
            
            if(DOM.infoNickname) DOM.infoNickname.value = userName;
            if(DOM.infoHandle) DOM.infoHandle.innerText = userHandle;

            loadChat(item.dataset.id || 1);
            initMobileBackBtn(); 
            
            // 🔥 TRIGGER MOBILE VIEW
            if (window.innerWidth <= 1024 && DOM.viewMessages) {
                DOM.viewMessages.classList.add('mobile-chat-active');
                
                // 🔥 ILIPAT AGAD ANG INPUT SA BODY
                requestAnimationFrame(() => {
                    teleportInputToBody();
                });
            }
        });
    }

    // 3. DOLLAR ($) & EMOJI BUTTONS
    document.addEventListener('click', (e) => {
        // Emoji Trigger
        if (e.target.classList.contains('fa-face-smile') || e.target.id === 'btn-emoji-trigger') {
            e.stopPropagation();
            const container = document.getElementById('emoji-picker-container');
            if(container) {
                container.classList.toggle('hidden');
            }
        }
        
        // PPV Trigger
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

    // 4. Picmo Emoji Picker
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

    // Hide Emoji on Outside Click
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

    // 5. Send Message Logic
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

        // 🔥 KEYBOARD FIX (SCROLL HISTORY UP WHEN TYPING)
        input.addEventListener('focus', () => {
            setTimeout(() => {
                const history = document.getElementById('chat-history-container');
                if (history) {
                    history.scrollTo({ top: history.scrollHeight, behavior: 'smooth' });
                }
            }, 300); // Delay para maka-akyat ang keyboard
        });
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