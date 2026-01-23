import { DOM } from './dom.js';
import { CHAT_DATA, DEFAULT_AVATAR } from './data.js';

export function initMessages(TopToast) {
    
    // 1. New Message
    if(DOM.btnNewMsg) {
        DOM.btnNewMsg.addEventListener('click', () => {
            Swal.fire({
                title: 'New Message', input: 'text', inputLabel: 'Enter username', inputPlaceholder: '@username',
                showCancelButton: true, confirmButtonText: 'Start Chat', confirmButtonColor: '#64E9EE', background: '#0d1423', color: '#fff'
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    TopToast.fire({ icon: 'success', title: `Chat started with ${result.value}` });
                }
            });
        });
    }

    // 2. Sidebar Search
    if(DOM.btnTriggerSearch) {
        DOM.btnTriggerSearch.addEventListener('click', () => {
            DOM.msgSearchBox.classList.remove('hidden');
            DOM.msgSearchInput.focus();
        });
    }
    if(DOM.btnCloseSearch) {
        DOM.btnCloseSearch.addEventListener('click', () => {
            DOM.msgSearchBox.classList.add('hidden');
            DOM.msgSearchInput.value = '';
            filterUsers(document.querySelector('#msg-tabs span.active').dataset.filter);
        });
    }
    if(DOM.msgSearchInput) {
        DOM.msgSearchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            DOM.msgUserItems.forEach(user => {
                const name = user.dataset.name.toLowerCase();
                user.style.display = name.includes(val) ? 'flex' : 'none';
            });
        });
    }

    // 3. Sidebar Tabs
    DOM.msgTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            DOM.msgTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterUsers(tab.dataset.filter);
        });
    });

    // 4. User Click
    if (DOM.msgUserItems) {
        DOM.msgUserItems.forEach(item => {
            item.addEventListener('click', () => {
                DOM.msgUserItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                DOM.activeChatName.innerHTML = `${item.dataset.name} <i class="fa-solid fa-circle-check verify-badge"></i>`;
                DOM.activeChatAvatar.src = item.dataset.avatar || DEFAULT_AVATAR;
                
                if(DOM.infoNickname) DOM.infoNickname.value = item.dataset.name;
                if(DOM.infoHandle) DOM.infoHandle.innerText = item.dataset.handle;
                if(DOM.infoJoined) DOM.infoJoined.innerText = item.dataset.joined;
                if(DOM.infoSpent) DOM.infoSpent.innerText = item.dataset.spent;

                loadChat(item.dataset.id);
            });
        });
    }

    // 5. Chat Actions (PPV, Search, Star)
    if(DOM.btnPPV) {
        DOM.btnPPV.addEventListener('click', () => {
            Swal.fire({
                title: 'Send Locked Message (PPV)',
                html: `<input type="number" id="ppv-price" class="swal2-input" placeholder="Price ($)"><textarea id="ppv-desc" class="swal2-textarea" placeholder="Description..."></textarea>`,
                showCancelButton: true, confirmButtonText: 'Attach Price', confirmButtonColor: '#2ecc71', background: '#0d1423', color: '#fff',
                preConfirm: () => document.getElementById('ppv-price').value
            }).then((result) => {
                if(result.isConfirmed) {
                    DOM.chatInput.value = `[LOCKED: $${result.value}] `;
                    DOM.chatInput.focus();
                }
            });
        });
    }

    if(DOM.btnChatSearch) {
        DOM.btnChatSearch.addEventListener('click', () => {
            DOM.chatSearchBar.classList.remove('hidden');
            DOM.chatSearchInput.focus();
        });
    }
    if(DOM.closeChatSearch) {
        DOM.closeChatSearch.addEventListener('click', () => DOM.chatSearchBar.classList.add('hidden'));
    }

    if(DOM.btnChatStar) {
        DOM.btnChatStar.addEventListener('click', function() {
            if(this.classList.contains('fa-regular')) {
                this.classList.replace('fa-regular', 'fa-solid'); 
                this.classList.add('active-star'); 
                TopToast.fire({ icon: 'success', title: 'Added to Favorites' });
            } else {
                this.classList.replace('fa-solid', 'fa-regular');
                this.classList.remove('active-star');
            }
        });
    }

    // 6. Send
    if (DOM.btnSendMsg && DOM.chatInput) {
        const sendMsg = () => {
            const text = DOM.chatInput.value.trim();
            if (text) {
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const msgElement = createMessageBubble(text, 'sent', time);
                DOM.chatHistoryContainer.appendChild(msgElement);
                DOM.chatInput.value = '';
                DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
            }
        };
        DOM.btnSendMsg.addEventListener('click', sendMsg);
        DOM.chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMsg(); });
    }

    // 7. Emoji
    if (DOM.btnEmoji && window.picmo) {
        const picker = picmo.createPicker({
            rootElement: DOM.emojiContainer, theme: 'dark', showPreview: false, autoFocus: 'search', visibleRows: 4
        });
        picker.addEventListener('emoji:select', (selection) => {
            DOM.chatInput.value += selection.emoji;
            DOM.chatInput.focus();
        });
        DOM.btnEmoji.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.emojiContainer.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!DOM.emojiContainer.contains(e.target) && e.target !== DOM.btnEmoji) {
                DOM.emojiContainer.classList.add('hidden');
            }
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

function filterUsers(category) {
    DOM.msgUserItems.forEach(user => {
        if (category === 'all') user.style.display = 'flex';
        else user.style.display = (user.dataset.category === category) ? 'flex' : 'none';
    });
}