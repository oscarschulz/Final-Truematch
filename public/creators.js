// Remove import if causing issues, assume global context or simple script
const TMAPI = {}; 

// Default avatar constant for better handling
const DEFAULT_AVATAR = 'assets/images/truematch-mark.png';

const DOM = {
  feed: document.getElementById('creator-feed'),
  btnSubscribe: document.getElementById('btnSubscribe'),
  paymentModal: document.getElementById('payment-modal'),
  btnPayConfirm: document.getElementById('btnPayConfirm'),
  btnPayCancel: document.getElementById('btnPayCancel'),
  
  viewHome: document.getElementById('view-home'),
  viewNotif: document.getElementById('view-notifications'),
  viewMessages: document.getElementById('view-messages'),
  viewCollections: document.getElementById('view-collections'),
  
  rightSidebar: document.getElementById('right-sidebar'),
  rsSuggestions: document.getElementById('rs-suggestions-view'),
  rsCollections: document.getElementById('rs-collections-view'),

  navHome: document.getElementById('nav-link-home'),
  navNotif: document.getElementById('nav-link-notif'),
  navMessages: document.getElementById('nav-link-messages'),
  navCollections: document.getElementById('nav-link-collections'),

  mobHome: document.getElementById('mob-nav-home'),
  mobNotif: document.getElementById('mob-nav-notif'),
  mobMessages: document.getElementById('mob-nav-messages'),

  popover: document.getElementById('settings-popover'),
  closePopoverBtn: document.getElementById('btnClosePopover'),
  triggers: [
    document.getElementById('trigger-profile-card'),
    document.getElementById('trigger-more-btn')
  ],
  
  themeToggle: document.getElementById('themeToggle'),
  composeActions: document.querySelector('.compose-actions'),
  mediaUploadInput: document.getElementById('media-upload-input'),
  
  pollUI: document.getElementById('poll-creator-ui'),
  textTools: document.getElementById('text-format-toolbar'),
  closePollBtn: document.querySelector('.close-poll-btn'),

  // MESSAGES SPECIFIC
  btnNewMsg: document.getElementById('btn-new-msg'),
  
  // Sidebar Search
  btnTriggerSearch: document.getElementById('trigger-msg-search'),
  btnCloseSearch: document.getElementById('close-msg-search'),
  msgSearchBox: document.getElementById('msg-search-box'),
  msgSearchInput: document.getElementById('msg-search-input'),
  msgTabs: document.querySelectorAll('#msg-tabs span'),
  msgUserItems: document.querySelectorAll('.msg-user-item'),
  
  // Active Chat Elements
  activeChatAvatar: document.getElementById('active-chat-avatar'),
  activeChatName: document.getElementById('active-chat-name'),
  chatHistoryContainer: document.getElementById('chat-history-container'),
  
  // Info Panel Elements
  infoNickname: document.getElementById('info-nickname'),
  infoHandle: document.getElementById('info-handle'),
  infoJoined: document.getElementById('info-joined'),
  infoSpent: document.getElementById('info-spent'),

  // Chat Area Interactions
  btnEmoji: document.getElementById('btn-emoji-trigger'),
  emojiContainer: document.getElementById('emoji-picker-container'),
  btnPPV: document.getElementById('btn-ppv-trigger'),
  chatInput: document.getElementById('chat-message-input'),
  btnSendMsg: document.getElementById('btn-send-message'),
  
  // Chat Header Icons
  btnChatSearch: document.getElementById('btn-chat-search'),
  chatSearchBar: document.getElementById('chat-inner-search-bar'),
  closeChatSearch: document.getElementById('close-chat-search'),
  chatSearchInput: document.getElementById('chat-history-search'),
  btnChatStar: document.getElementById('btn-chat-star')
};

const TopToast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#0d1423',
  color: '#fff',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

// --- MOCK CHAT DATA ---
const CHAT_DATA = {
    1: [ // User ID 1: Bauds Dev
        { text: "Hello! How is the new design coming along?", type: "received", time: "10:30 AM" },
        { text: "It looks exactly like the reference!", type: "sent", time: "10:32 AM" },
        { text: "Perfect. Can you add the subscriber info panel on the right?", type: "received", time: "10:33 AM" },
        { text: "Working on it right now.", type: "sent", time: "10:34 AM" }
    ],
    2: [ // User ID 2: Sarah Fit
        { text: "Hey! Love the new workout plan.", type: "received", time: "Yesterday" },
        { text: "Thanks Sarah! Let me know if you need tweaks.", type: "sent", time: "Yesterday" },
        { text: "Thanks for subscribing! 😘", type: "received", time: "2h ago" }
    ],
    3: [ // User ID 3: OnlyFans Support
        { text: "Welcome to iTRUEMATCH! Please verify your ID.", type: "received", time: "1d ago" }
    ],
    4: [ // User ID 4: Whale Spender
        { text: "Sent you a $500 tip! 💸", type: "received", time: "5m ago" },
        { text: "OMG Thank you so much!! ❤️", type: "sent", time: "4m ago" }
    ]
};

// --- NEW HELPER FUNCTION FOR RENDERING MESSAGES (XSS SAFE) ---
function renderMessage(text, type, time) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${type}`; // 'sent' or 'received'
    
    // Create text element using textContent to prevent XSS
    const p = document.createElement('p');
    p.textContent = text;
    
    const span = document.createElement('span');
    span.className = 'time';
    span.textContent = time;
    
    div.appendChild(p);
    div.appendChild(span);
    
    return div;
}

function removeLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        setTimeout(() => {
            if(loader.parentNode) loader.parentNode.removeChild(loader);
        }, 500);
    }
}

window.addEventListener('load', () => setTimeout(removeLoader, 1000));
if (document.readyState === 'complete') { setTimeout(removeLoader, 500); }
setTimeout(removeLoader, 3000);

async function init() {
  // Global Event Listeners
  if (DOM.btnSubscribe) DOM.btnSubscribe.onclick = openPaymentModal; 
  if (DOM.btnPayCancel) DOM.btnPayCancel.onclick = closePaymentModal;
  if (DOM.btnPayConfirm) DOM.btnPayConfirm.onclick = processPayment;

  if (DOM.triggers.length > 0) {
    DOM.triggers.forEach(t => {
      if(t) t.addEventListener('click', togglePopover);
    });
  }
  if (DOM.closePopoverBtn) DOM.closePopoverBtn.addEventListener('click', closePopover);
  
  document.addEventListener('click', (e) => {
    if (DOM.popover && DOM.popover.classList.contains('is-open')) {
      const isClickInside = DOM.popover.contains(e.target);
      const isClickTrigger = DOM.triggers.some(t => t && t.contains(e.target));
      if (!isClickInside && !isClickTrigger) {
        closePopover();
      }
    }
  });

  if (DOM.themeToggle) {
    DOM.themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.remove('tm-light');
            document.body.classList.add('tm-dark');
        } else {
            document.body.classList.remove('tm-dark');
            document.body.classList.add('tm-light');
        }
    });
  }

  // ============================================
  // VIEW SWITCHING LOGIC
  // ============================================
  function switchView(viewName) {
    // 1. Reset Main Views
    if (DOM.viewHome) DOM.viewHome.style.display = 'none';
    if (DOM.viewNotif) DOM.viewNotif.style.display = 'none';
    if (DOM.viewMessages) DOM.viewMessages.style.display = 'none';
    if (DOM.viewCollections) DOM.viewCollections.style.display = 'none';

    // 2. Reset Nav Active States
    [DOM.navHome, DOM.navNotif, DOM.navMessages, DOM.navCollections, DOM.mobHome, DOM.mobNotif, DOM.mobMessages].forEach(el => {
        if(el) {
            el.classList.remove('active');
            const icon = el.querySelector('i');
            if (icon && !icon.classList.contains('fa-house')) {
                icon.classList.replace('fa-solid', 'fa-regular');
            }
        }
    });

    // 3. Right Sidebar Logic (Safe Checks)
    if(DOM.rightSidebar) DOM.rightSidebar.classList.remove('hidden-sidebar');
    if(DOM.rsSuggestions) DOM.rsSuggestions.classList.remove('hidden');
    if(DOM.rsCollections) DOM.rsCollections.classList.add('hidden');

    // 4. Handle Specific Views
    if (viewName === 'messages') {
        if(DOM.rightSidebar) DOM.rightSidebar.classList.add('hidden-sidebar');
        if (DOM.viewMessages) DOM.viewMessages.style.display = 'block';
        if (DOM.navMessages) setActive(DOM.navMessages);
        if (DOM.mobMessages) setActive(DOM.mobMessages);
        
        if(DOM.chatHistoryContainer && DOM.chatHistoryContainer.innerHTML.trim() === "") {
             loadChat(1); 
        }
    } 
    else if (viewName === 'collections') {
        if (DOM.viewCollections) DOM.viewCollections.style.display = 'block';
        if (DOM.navCollections) setActive(DOM.navCollections);
        
        // Swap Right Sidebar Content
        if(DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');
        if(DOM.rsCollections) DOM.rsCollections.classList.remove('hidden');
    }
    else if (viewName === 'home') {
        if (DOM.viewHome) DOM.viewHome.style.display = 'block';
        if (DOM.navHome) setActive(DOM.navHome);
        if (DOM.mobHome) setActive(DOM.mobHome);
    } 
    else if (viewName === 'notifications') {
        if (DOM.viewNotif) DOM.viewNotif.style.display = 'block';
        if (DOM.navNotif) setActive(DOM.navNotif);
        if (DOM.mobNotif) setActive(DOM.mobNotif);
    }
  }

  function setActive(el) {
      el.classList.add('active');
      const icon = el.querySelector('i');
      if (icon) {
          icon.classList.replace('fa-regular', 'fa-solid');
      }
  }

  // --- NAV LISTENERS ---
  if (DOM.navHome) DOM.navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  if (DOM.navNotif) DOM.navNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
  if (DOM.navMessages) DOM.navMessages.addEventListener('click', (e) => { e.preventDefault(); switchView('messages'); });
  if (DOM.navCollections) DOM.navCollections.addEventListener('click', (e) => { e.preventDefault(); switchView('collections'); });
  
  if (DOM.mobHome) DOM.mobHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  if (DOM.mobNotif) DOM.mobNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
  if (DOM.mobMessages) DOM.mobMessages.addEventListener('click', (e) => { e.preventDefault(); switchView('messages'); });

  // ============================================
  // GLOBAL INTERACTIONS (Feed Tip, Comments, etc.)
  // ============================================
  document.addEventListener('click', (e) => {
      
      // 1. Handle Like Button
      if (e.target.classList.contains('fa-heart')) {
          if (e.target.classList.contains('fa-regular')) {
              e.target.classList.replace('fa-regular', 'fa-solid');
              e.target.style.color = '#ff4757'; // Red heart
              e.target.style.transform = 'scale(1.2)';
              setTimeout(() => e.target.style.transform = 'scale(1)', 200);
          } else {
              e.target.classList.replace('fa-solid', 'fa-regular');
              e.target.style.color = ''; // Reset color
          }
      }

      // 2. Handle Comment Toggle
      if (e.target.classList.contains('btn-toggle-comment') || e.target.classList.contains('fa-comment')) {
          const postCard = e.target.closest('.post-card');
          if (postCard) {
              const commentSection = postCard.querySelector('.post-comments-section');
              if (commentSection) {
                  commentSection.classList.toggle('hidden');
              }
          }
      }

      // 3. Handle Bookmark Button
      if (e.target.classList.contains('fa-bookmark')) {
          if (e.target.classList.contains('fa-regular')) {
              e.target.classList.replace('fa-regular', 'fa-solid');
              e.target.style.color = '#64E9EE'; // Cyan bookmark
              TopToast.fire({ icon: 'success', title: 'Saved to Collections' });
          } else {
              e.target.classList.replace('fa-solid', 'fa-regular');
              e.target.style.color = '';
          }
      }

      // 4. Handle FEED TIP BUTTON ($)
      // Check if target is dollar sign AND inside a post (feed), NOT chat
      if (e.target.classList.contains('fa-dollar-sign') && e.target.closest('.post-actions')) {
          Swal.fire({
              title: 'Send Tip',
              text: 'Support this creator!',
              input: 'number',
              inputLabel: 'Amount ($)',
              inputPlaceholder: '5.00',
              showCancelButton: true,
              confirmButtonText: 'Send Tip',
              confirmButtonColor: '#64E9EE',
              background: '#0d1423',
              color: '#fff'
          }).then((result) => {
              if (result.isConfirmed && result.value) {
                  TopToast.fire({ icon: 'success', title: `Sent $${result.value} tip!` });
              }
          });
      }
  });

  // ============================================
  // NOTIFICATION TABS LOGIC (FIX)
  // ============================================
  const notifPills = document.querySelectorAll('.notif-tabs-bar .n-pill');
  if (notifPills.length > 0) {
      notifPills.forEach(pill => {
          pill.addEventListener('click', () => {
              // Remove active from all
              notifPills.forEach(p => p.classList.remove('active'));
              // Add active to clicked
              pill.classList.add('active');
              
              // Optional: You can add logic here to filter the list later
              console.log('Filtered by:', pill.innerText);
          });
      });
  }

  // --- COMPOSE AREA LOGIC (Polls & Text) ---
  if (DOM.composeActions) {
      DOM.composeActions.addEventListener('click', (e) => {
          const target = e.target;
          
          // Media
          if (target.classList.contains('fa-image')) {
              if (DOM.mediaUploadInput) DOM.mediaUploadInput.click();
          }
          // Poll
          else if (target.classList.contains('fa-square-poll-horizontal') || target.id === 'btn-trigger-poll') {
              if(DOM.pollUI) DOM.pollUI.classList.toggle('hidden');
          }
          // Text Format (Aa) - FIXED
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

  // --- MESSAGING LOGIC ---

  // 1. PLUS ICON (New Message)
  if(DOM.btnNewMsg) {
      DOM.btnNewMsg.addEventListener('click', () => {
          Swal.fire({
              title: 'New Message',
              input: 'text',
              inputLabel: 'Enter username to chat with',
              inputPlaceholder: '@username',
              showCancelButton: true,
              confirmButtonText: 'Start Chat',
              confirmButtonColor: '#64E9EE',
              background: '#0d1423',
              color: '#fff'
          }).then((result) => {
              if (result.isConfirmed && result.value) {
                  Swal.fire({
                       icon: 'success',
                       title: 'Chat Started',
                       text: `Starting conversation with ${result.value}`,
                       background: '#0d1423',
                       color: '#fff',
                       timer: 1500,
                       showConfirmButton: false
                  });
              }
          });
      });
  }

  // 2. SIDEBAR SEARCH UI
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
          filterUsers(document.querySelector('#msg-tabs span.active').dataset.filter); // Reset to current filter
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

  // 3. FILTER TABS
  DOM.msgTabs.forEach(tab => {
      tab.addEventListener('click', () => {
          DOM.msgTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          filterUsers(tab.dataset.filter);
      });
  });

  function filterUsers(category) {
      DOM.msgUserItems.forEach(user => {
          if (category === 'all') {
              user.style.display = 'flex';
          } else {
              user.style.display = (user.dataset.category === category) ? 'flex' : 'none';
          }
      });
  }

  // 4. USER SWITCHING
  if (DOM.msgUserItems) {
      DOM.msgUserItems.forEach(item => {
          item.addEventListener('click', () => {
              DOM.msgUserItems.forEach(i => i.classList.remove('active'));
              item.classList.add('active');

              const userId = item.dataset.id;
              const userName = item.dataset.name;
              const userAvatar = item.dataset.avatar;
              const userHandle = item.dataset.handle;
              const userJoined = item.dataset.joined;
              const userSpent = item.dataset.spent;

              DOM.activeChatName.innerHTML = `${userName} <i class="fa-solid fa-circle-check verify-badge"></i>`;
              // Use default avatar if empty or error
              DOM.activeChatAvatar.src = userAvatar || DEFAULT_AVATAR;
              
              DOM.infoNickname.value = userName;
              DOM.infoHandle.innerText = userHandle;
              DOM.infoJoined.innerText = userJoined;
              DOM.infoSpent.innerText = userSpent;

              loadChat(userId);
          });
      });
  }

  function loadChat(userId) {
      DOM.chatHistoryContainer.innerHTML = '';
      const messages = CHAT_DATA[userId] || [];
      messages.forEach(msg => {
          // Use the new secure renderMessage function
          const msgElement = renderMessage(msg.text, msg.type, msg.time);
          DOM.chatHistoryContainer.appendChild(msgElement);
      });
      scrollToBottom();
  }

  function scrollToBottom() {
      if(DOM.chatHistoryContainer) {
          DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
      }
  }

  // 5. EMOJI FUNCTIONALITY (USING PICMO LIBRARY)
  if (DOM.btnEmoji) {
      // Initialize Picker
      const picker = picmo.createPicker({
          rootElement: DOM.emojiContainer,
          theme: 'dark', // Auto dark mode
          showPreview: false,
          autoFocus: 'search',
          visibleRows: 4
      });

      // Handle Emoji Selection
      picker.addEventListener('emoji:select', (selection) => {
          DOM.chatInput.value += selection.emoji;
          DOM.chatInput.focus();
          // Optional: Keep picker open or close it
          // DOM.emojiContainer.classList.add('hidden'); 
      });

      // Toggle Picker Visibility
      DOM.btnEmoji.addEventListener('click', (e) => {
          e.stopPropagation();
          DOM.emojiContainer.classList.toggle('hidden');
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
          // Check if click is outside container AND not on the toggle button
          if (!DOM.emojiContainer.contains(e.target) && e.target !== DOM.btnEmoji) {
              DOM.emojiContainer.classList.add('hidden');
          }
      });
  }

  // 6. PPV / DOLLAR ICON (CHAT)
  if(DOM.btnPPV) {
      DOM.btnPPV.addEventListener('click', () => {
          Swal.fire({
              title: 'Send Locked Message (PPV)',
              html: `
                  <p style="font-size:0.9rem; color:#aaa;">Set a price for this message content.</p>
                  <input type="number" id="ppv-price" class="swal2-input" placeholder="Price ($)">
                  <textarea id="ppv-desc" class="swal2-textarea" placeholder="Message description..."></textarea>
              `,
              showCancelButton: true,
              confirmButtonText: 'Attach Price',
              confirmButtonColor: '#2ecc71',
              background: '#0d1423',
              color: '#fff',
              preConfirm: () => {
                  const price = document.getElementById('ppv-price').value;
                  if (!price) Swal.showValidationMessage('Please enter a price');
                  return { price: price };
              }
          }).then((result) => {
              if(result.isConfirmed) {
                  DOM.chatInput.value = `[LOCKED MESSAGE: $${result.value.price}] `;
                  DOM.chatInput.focus();
              }
          });
      });
  }

  // 7. CHAT HEADER: SEARCH
  if(DOM.btnChatSearch) {
      DOM.btnChatSearch.addEventListener('click', () => {
          DOM.chatSearchBar.classList.remove('hidden');
          DOM.chatSearchInput.focus();
      });
  }
  if(DOM.closeChatSearch) {
      DOM.closeChatSearch.addEventListener('click', () => {
          DOM.chatSearchBar.classList.add('hidden');
          DOM.chatSearchInput.value = '';
      });
  }

  // 8. CHAT HEADER: STAR (Favorite)
  if(DOM.btnChatStar) {
      DOM.btnChatStar.addEventListener('click', function() {
          if(this.classList.contains('fa-regular')) {
              this.classList.replace('fa-regular', 'fa-solid'); // Solid star
              this.classList.add('active-star'); // Gold color via CSS
              
              const TopToast = Swal.mixin({
                  toast: true, position: 'top', showConfirmButton: false, timer: 1500,
                  background: '#0d1423', color: '#fff'
              });
              TopToast.fire({ icon: 'success', title: 'Added to Favorites' });
          } else {
              this.classList.replace('fa-solid', 'fa-regular');
              this.classList.remove('active-star');
          }
      });
  }

  // 9. Send Message Logic
  if (DOM.btnSendMsg && DOM.chatInput) {
      const sendMsg = () => {
          const text = DOM.chatInput.value.trim();
          if (text) {
              const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // Use secure renderMessage function
              const msgElement = renderMessage(text, 'sent', time);
              DOM.chatHistoryContainer.appendChild(msgElement);
              
              DOM.chatInput.value = '';
              scrollToBottom();
          }
      };

      DOM.btnSendMsg.addEventListener('click', sendMsg);
      DOM.chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') sendMsg();
      });
  }

  // Common UI Logic (Polls, etc)
  if (DOM.composeActions) {
      DOM.composeActions.addEventListener('click', (e) => {
          const target = e.target;
          if (target.classList.contains('fa-image')) {
              if (DOM.mediaUploadInput) DOM.mediaUploadInput.click();
          }
          // Logic for Poll Button click is handled above, but here's a fallback or specific check if needed
      });
  }

  if (DOM.closePollBtn) {
      DOM.closePollBtn.addEventListener('click', () => {
          if(DOM.pollUI) DOM.pollUI.classList.add('hidden');
      });
  }

  try { await checkAccess(); } catch (e) { console.log(e); }
}

function togglePopover(e) {
  if (e) e.stopPropagation();
  if (DOM.popover) DOM.popover.classList.toggle('is-open');
}
function closePopover() {
  if (DOM.popover) DOM.popover.classList.remove('is-open');
}
function openPaymentModal() { if (DOM.paymentModal) DOM.paymentModal.classList.add('is-visible'); }
function closePaymentModal() { if (DOM.paymentModal) DOM.paymentModal.classList.remove('is-visible'); }

async function processPayment() {
  if (!DOM.btnPayConfirm) return;
  DOM.btnPayConfirm.disabled = true;
  DOM.btnPayConfirm.textContent = 'Processing...';
  
  setTimeout(() => {
    TopToast.fire({
      icon: 'success',
      title: 'Success!'
    });
    closePaymentModal();
    DOM.btnPayConfirm.disabled = false;
    DOM.btnPayConfirm.textContent = 'Proceed';
  }, 1000);
}

async function checkAccess() {
    return new Promise(resolve => {
        setTimeout(() => { resolve(true); }, 500);
    });
}

document.addEventListener('DOMContentLoaded', init);