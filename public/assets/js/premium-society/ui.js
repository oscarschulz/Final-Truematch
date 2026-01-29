// assets/js/premium-society/ui.js
import { PS_DOM, getRandomColor, showToast } from './core.js';

// EXPOSE TOAST GLOBALLY
window.showToast = showToast;

// --- GLOBAL STATE ---
let conversationHistory = JSON.parse(localStorage.getItem('ps_chat_history')) || {};

function saveHistory() {
    localStorage.setItem('ps_chat_history', JSON.stringify(conversationHistory));
}

export function initUI() {
    initCanvasParticles();
    initNavigation();
    
    // --- CONFLICT FIX: DISABLED THIS BECAUSE SIDEBAR.JS HANDLES IT ---
    // initMobileMenu(); 
    // ---------------------------------------------------------------

    initNotifications();
    initChat();         
    initStoryViewer(); 
    initCreatorProfileModal(); 
    initCreatorsLogic();
    initPremiumLogic();
    initProfileEditLogic(); 
    initSettingsLogic(); 
    
    populateMockContent();
    
    const lastTab = localStorage.getItem('ps_last_tab') || 'home';
    switchTab(lastTab);

    if(PS_DOM.btnPPV) {
        PS_DOM.btnPPV.onclick = () => {
            if(PS_DOM.giftModal) PS_DOM.giftModal.classList.add('active');
        };
    }
}

// ---------------------------------------------------------------------
// UPDATED: HELP, SUPPORT & INTERACTIVE SETTINGS
// ---------------------------------------------------------------------
function initSettingsLogic() {
    
    // 1. SLIDERS LOGIC (Distance & Age)
    const distInput = document.getElementById('psRangeDist');
    const distVal = document.getElementById('psDistVal');
    
    if(distInput && distVal) {
        distInput.addEventListener('input', (e) => {
            distVal.textContent = e.target.value;
        });
        distInput.addEventListener('change', () => showToast("Distance preference saved"));
    }

    const ageInput = document.getElementById('psRangeAge');
    const ageVal = document.getElementById('psAgeVal');

    if(ageInput && ageVal) {
        ageInput.addEventListener('input', (e) => {
            ageVal.textContent = e.target.value;
        });
        ageInput.addEventListener('change', () => showToast("Age range updated"));
    }

    // 2. TOGGLES LOGIC (Notifications, Sound, etc.)
    const toggles = document.querySelectorAll('.ps-setting-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const settingName = e.target.dataset.name || "Setting";
            const status = e.target.checked ? "Enabled" : "Disabled";
            showToast(`${settingName} ${status}`);
        });
    });

    // 3. HELP & SUPPORT POPUPS
    window.openSafetyTips = () => {
        Swal.fire({
            title: '<i class="fa-solid fa-shield-cat"></i> Dating Safety',
            html: `
                <div style="text-align: left; font-size: 0.9rem; line-height: 1.6;">
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;">✅ <strong>Meet in Public:</strong> Always meet in a crowded place.</li>
                        <li style="margin-bottom: 10px;">✅ <strong>Tell a Friend:</strong> Share your location.</li>
                        <li style="margin-bottom: 10px;">❌ <strong>Don't Send Money:</strong> Never send money to strangers.</li>
                    </ul>
                </div>
            `,
            background: '#15151e',
            color: '#fff',
            confirmButtonText: 'Got it',
            confirmButtonColor: '#00aff0'
        });
    };

    window.openBillingInfo = () => {
        Swal.fire({
            title: '<i class="fa-solid fa-receipt"></i> Billing & Refunds',
            html: `
                <div style="text-align: left; font-size: 0.9rem; color: #ccc;">
                    <p><strong>Subscription:</strong> Renews monthly.</p>
                    <br>
                    <p><strong>Refunds:</strong> Request within 48 hours via support.</p>
                </div>
            `,
            background: '#15151e',
            color: '#fff',
            confirmButtonText: 'Close',
            confirmButtonColor: '#333'
        });
    };

    window.openContactSupport = () => {
        Swal.fire({
            title: 'Contact Support',
            html: `
                <input id="ticket-subject" class="swal2-input" placeholder="Subject" style="color:#fff; background:#222; border:1px solid #444;">
                <textarea id="ticket-message" class="swal2-textarea" placeholder="Describe your issue..." style="color:#fff; background:#222; border:1px solid #444; height: 100px;"></textarea>
            `,
            background: '#15151e',
            color: '#fff',
            confirmButtonText: 'Send Ticket',
            confirmButtonColor: '#00aff0',
            showCancelButton: true,
            cancelButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Ticket Sent!',
                    background: '#15151e',
                    color: '#fff',
                    confirmButtonColor: '#00aff0'
                });
            }
        });
    };
    
    // Clear Cache Action
    window.clearAppCache = () => {
        showToast("Clearing Cache...");
        setTimeout(() => {
            showToast("Cache Cleared Successfully");
        }, 1000);
    };
}

// ---------------------------------------------------------------------
// EDIT PROFILE LOGIC
// ---------------------------------------------------------------------
function initProfileEditLogic() {
    const modal = document.getElementById('psEditProfileModal');
    const btnEdit = document.getElementById('psBtnEditProfile');
    
    const inputName = document.getElementById('psInputName');
    const inputEmail = document.getElementById('psInputEmail');
    
    const displayNames = [
        document.getElementById('psSNameDisplay'),
        document.getElementById('psMiniName'),
        document.getElementById('psWelcomeName'),
        document.getElementById('psEditNameDisplay')
    ];
    const displayEmails = [
        document.getElementById('psSEmailDisplay'),
        document.getElementById('psEditEmailDisplay')
    ];

    if(btnEdit) {
        btnEdit.onclick = () => {
            modal.classList.add('active');
        };
    }

    window.closeEditProfile = () => {
        if(modal) modal.classList.remove('active');
    };

    window.saveEditProfile = () => {
        const newName = inputName.value.trim();
        const newEmail = inputEmail.value.trim();

        if(!newName) {
            showToast("Name cannot be empty!");
            return;
        }

        displayNames.forEach(el => { if(el) el.innerText = newName; });
        displayEmails.forEach(el => { if(el) el.innerText = newEmail; });

        showToast("Profile Updated Successfully!");
        window.closeEditProfile();
    };

    window.openChangePassword = () => {
        Swal.fire({
            title: 'Change Password',
            html: `
                <input type="password" id="swal-curr-pass" class="swal2-input" placeholder="Current Password" style="color:#000;">
                <input type="password" id="swal-new-pass" class="swal2-input" placeholder="New Password" style="color:#000;">
                <input type="password" id="swal-conf-pass" class="swal2-input" placeholder="Confirm New Password" style="color:#000;">
            `,
            confirmButtonText: 'Update Password',
            confirmButtonColor: '#00aff0',
            showCancelButton: true,
            background: '#15151e',
            color: '#fff',
            customClass: { container: 'ps-swal-on-top' },
            preConfirm: () => {
                const curr = document.getElementById('swal-curr-pass').value;
                const newP = document.getElementById('swal-new-pass').value;
                const confP = document.getElementById('swal-conf-pass').value;
                
                if (!curr || !newP || !confP) {
                    Swal.showValidationMessage('Please fill all fields');
                    return false;
                }
                if (newP !== confP) {
                    Swal.showValidationMessage('Passwords do not match');
                    return false;
                }
                return true;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Updated',
                    background: '#15151e',
                    color: '#fff',
                    confirmButtonColor: '#00aff0'
                });
            }
        });
    };
}

function initPremiumLogic() {
    window.selectPlan = (element) => {
        const plans = document.querySelectorAll('.ps-plan-card');
        plans.forEach(plan => plan.classList.remove('active'));
        element.classList.add('active');
    };

    window.subscribeGold = () => {
        Swal.fire({
            title: 'Confirm Subscription',
            text: 'Unlock all Premium features now?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#64E9EE', 
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Upgrade Me!',
            background: '#15151e',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Welcome to Premium!',
                    text: 'You are now a Premium Member.',
                    icon: 'success',
                    background: '#15151e',
                    color: '#fff',
                    confirmButtonColor: '#64E9EE'
                });
                if(PS_DOM.miniName) PS_DOM.miniName.innerHTML += ' <i class="fa-solid fa-gem" style="color:#64E9EE"></i>';
            }
        });
    };
}

function initCreatorsLogic() {
    window.subscribeCreator = (name) => {
        window.closeCreatorProfile();
        Swal.fire({
            title: `Subscribe to ${name}?`,
            text: "Unlock exclusive content and direct messaging for $9.99/mo.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00aff0',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Subscribe',
            background: '#15151e',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Subscribed!',
                    text: `You are now a premium member of ${name}'s circle.`,
                    icon: 'success',
                    background: '#15151e',
                    color: '#fff',
                    confirmButtonColor: '#00aff0'
                });
            }
        });
    };

    window.filterCreators = (element, category) => {
        const chips = document.querySelectorAll('.ps-filter-chip');
        chips.forEach(chip => chip.classList.remove('active'));
        element.classList.add('active');

        const grid = document.querySelector('.ps-creators-grid');
        if(grid) {
            grid.style.opacity = '0.5';
            setTimeout(() => {
                for (let i = grid.children.length; i >= 0; i--) {
                    grid.appendChild(grid.children[Math.random() * i | 0]);
                }
                grid.style.opacity = '1';
                showToast(`Showing: ${category}`);
            }, 300);
        }
    };
}

function initCreatorProfileModal() {
    const modal = document.getElementById('psCreatorProfileModal');
    
    window.closeCreatorProfile = () => {
        if(modal) modal.classList.remove('active');
    };

    window.openCreatorProfile = (name, cat, followers, color) => {
        if(!modal) return;
        document.getElementById('psProfModalName').textContent = name;
        document.getElementById('psProfModalCat').textContent = cat;
        document.getElementById('psProfModalFollowers').textContent = followers;
        document.getElementById('psProfModalLikes').textContent = Math.floor(Math.random() * 500) + 'K'; 
        
        const cover = document.getElementById('psProfModalCover');
        if(cover) {
            cover.style.backgroundColor = color;
            cover.style.backgroundImage = "url('assets/images/truematch-mark.png')";
        }

        const subBtn = modal.querySelector('.ps-btn-subscribe-lg');
        if(subBtn) {
            subBtn.onclick = () => window.subscribeCreator(name);
        }

        modal.classList.add('active');
    };

    if(modal) {
        modal.addEventListener('click', (e) => {
            if(e.target === modal) window.closeCreatorProfile();
        });
    }

    window.messageFromProfile = () => {
        const name = document.getElementById('psProfModalName').textContent;
        window.closeCreatorProfile();
        const matchesBtn = document.querySelector('button[data-panel="matches"]');
        if(matchesBtn) matchesBtn.click();
        setTimeout(() => {
            window.openChat(name);
        }, 300);
    };
}

function initNotifications() {
    const btnNotif = document.getElementById('psBtnNotif');
    const popover = document.getElementById('psNotifPopover');

    if (btnNotif && popover) {
        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation();
            btnNotif.classList.toggle('active');
            popover.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!popover.contains(e.target) && !btnNotif.contains(e.target)) {
                popover.classList.remove('active');
                btnNotif.classList.remove('active');
            }
        });
    }
}

function initChat() {
    const openChatAction = (name) => {
        if(!PS_DOM.chatWindow) return;
        PS_DOM.chatName.textContent = name;
        PS_DOM.chatAvatar.src = "assets/images/truematch-mark.png";
        
        if (!conversationHistory[name]) {
            const defaultMsgs = [
                { type: 'received', text: `Hey ${name} here! How's it going?` },
                { type: 'received', text: 'Saw your profile, pretty cool!' }
            ];
            renderMessages(defaultMsgs);
        } else {
            renderMessages(conversationHistory[name]);
        }
        PS_DOM.chatWindow.classList.add('active');
    };

    const renderMessages = (msgs) => {
        PS_DOM.chatBody.innerHTML = ''; 
        msgs.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `ps-msg-bubble ${msg.type}`; 
            if(msg.text.includes('<i class="fa-solid fa-gift"></i>')) {
                 msgDiv.innerHTML = msg.text;
                 msgDiv.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
                 msgDiv.style.color = '#000';
                 msgDiv.style.fontWeight = 'bold';
            } else {
                 msgDiv.textContent = msg.text;
            }
            PS_DOM.chatBody.appendChild(msgDiv);
        });
        PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;
    };

    const closeChatAction = () => {
        if(PS_DOM.chatWindow) PS_DOM.chatWindow.classList.remove('active');
    };

    window.openChat = openChatAction;
    window.closeChat = closeChatAction;

    window.toggleChatEmoji = function() {
        if(PS_DOM.chatEmojiPicker) PS_DOM.chatEmojiPicker.classList.toggle('active');
    };

    window.addChatEmoji = function(emoji) {
        if(PS_DOM.chatInput) {
            PS_DOM.chatInput.value += emoji;
            PS_DOM.chatInput.focus();
        }
    };

    window.sendChatMessage = function() {
        const text = PS_DOM.chatInput ? PS_DOM.chatInput.value.trim() : "";
        if(!text) return;

        const currentName = PS_DOM.chatName.textContent;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'ps-msg-bubble sent';
        msgDiv.textContent = text;
        PS_DOM.chatBody.appendChild(msgDiv);
        PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;

        if (!conversationHistory[currentName]) {
            conversationHistory[currentName] = [
                { type: 'received', text: `Hey ${currentName} here! How's it going?` },
                { type: 'received', text: 'Saw your profile, pretty cool!' }
            ];
        }
        conversationHistory[currentName].push({ type: 'sent', text: text });
        saveHistory();

        moveMatchToMessages(currentName, text);

        PS_DOM.chatInput.value = "";
        if(PS_DOM.chatEmojiPicker) PS_DOM.chatEmojiPicker.classList.remove('active');
    };

    function moveMatchToMessages(name, lastText) {
        const newMatchesRail = document.getElementById('psNewMatchesRail');
        let isNewMatch = false;

        if (newMatchesRail) {
            const newMatchItems = newMatchesRail.querySelectorAll('.ps-new-match-item');
            newMatchItems.forEach(item => {
                const nameSpan = item.querySelector('.ps-match-name-sm');
                if (nameSpan && nameSpan.textContent === name) {
                    item.remove();
                    isNewMatch = true;
                }
            });
        }

        if (isNewMatch) {
            const countBadge = document.getElementById('psNewMatchCount');
            if (countBadge) {
                let currentCount = parseInt(countBadge.textContent) || 0;
                countBadge.textContent = Math.max(0, currentCount - 1);
            }
        }

        const matchesList = document.getElementById('psMatchesContainer');
        if (matchesList) {
            const existingItems = matchesList.querySelectorAll('.ps-message-item');
            existingItems.forEach(item => {
                const nameEl = item.querySelector('.ps-msg-name');
                if (nameEl && nameEl.textContent === name) item.remove();
            });

            const newItem = `
            <div class="ps-message-item" onclick="openChat('${name}')">
                <div class="ps-msg-avatar-wrapper">
                    <img class="ps-msg-avatar" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
                    <div class="ps-online-badge"></div>
                </div>
                <div class="ps-msg-content">
                    <div class="ps-msg-header">
                        <span class="ps-msg-name">${name}</span>
                        <span class="ps-msg-time">Just now</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="ps-msg-preview" style="color:#fff; font-weight:600;">You: ${lastText}</span>
                    </div>
                </div>
            </div>`;
            matchesList.insertAdjacentHTML('afterbegin', newItem);
        }
    }

    if(PS_DOM.btnCloseChat) PS_DOM.btnCloseChat.onclick = closeChatAction;
}

function initStoryViewer() {
    const closeStoryAction = () => {
        if(PS_DOM.storyViewer) {
            PS_DOM.storyViewer.classList.remove('active');
            if(PS_DOM.storyProgress) PS_DOM.storyProgress.classList.remove('animating');
        }
    };

    const openStoryAction = (name, color) => {
        if(!PS_DOM.storyViewer) return;
        PS_DOM.storyName.textContent = name;
        PS_DOM.storyAvatar.src = "assets/images/truematch-mark.png"; 
        
        if(PS_DOM.storyCommentInput) PS_DOM.storyCommentInput.value = "";
        if(PS_DOM.storyEmojiPicker) PS_DOM.storyEmojiPicker.classList.remove('active');

        PS_DOM.storyFullImg.style.backgroundColor = color;
        PS_DOM.storyFullImg.style.backgroundImage = "url('assets/images/truematch-mark.png')";
        PS_DOM.storyFullImg.style.backgroundSize = "contain";
        PS_DOM.storyFullImg.style.backgroundRepeat = "no-repeat";

        PS_DOM.storyViewer.classList.add('active');
        
        if(PS_DOM.storyProgress) {
            PS_DOM.storyProgress.classList.remove('animating');
            void PS_DOM.storyProgress.offsetWidth; 
            PS_DOM.storyProgress.classList.add('animating');
        }
    };

    window.openStory = openStoryAction;
    window.closeStory = closeStoryAction;

    window.sendStoryComment = function() {
        const text = PS_DOM.storyCommentInput ? PS_DOM.storyCommentInput.value.trim() : "";
        if(!text) return;
        const targetUser = PS_DOM.storyName.textContent;
        window.closeStory();
        const matchesBtn = document.querySelector('button[data-panel="matches"]');
        if(matchesBtn) matchesBtn.click();

        setTimeout(() => {
            window.openChat(targetUser); 
            PS_DOM.chatInput.value = text; 
            window.sendChatMessage(); 
            showToast("Reply sent!");
        }, 400);

        PS_DOM.storyCommentInput.value = "";
        if(PS_DOM.storyEmojiPicker) PS_DOM.storyEmojiPicker.classList.remove('active');
    };

    window.postNewStory = function() {
        const text = PS_DOM.storyInput ? PS_DOM.storyInput.value.trim() : "";
        if(!text) { showToast("Please write something!"); return; }
        const newStoryHtml = `<div class="ps-story-item" onclick="openStory('You', '#00aff0')"><div class="ps-story-ring" style="border-color: #00aff0;"><img class="ps-story-img" src="assets/images/truematch-mark.png" style="background:#00aff0"></div><span class="ps-story-name" style="font-size:0.7rem; font-weight:bold;">You</span></div>`;
        if(PS_DOM.storiesContainer) PS_DOM.storiesContainer.insertAdjacentHTML('afterbegin', newStoryHtml);
        const mobileContainer = document.getElementById('psMobileStoriesContainer');
        if(mobileContainer) mobileContainer.insertAdjacentHTML('afterbegin', newStoryHtml);
        showToast("Moment Shared!");
        if(PS_DOM.storyInput) PS_DOM.storyInput.value = ""; 
        window.closeAddStory();
    };

    window.openAddStory = () => { if(PS_DOM.addStoryModal) PS_DOM.addStoryModal.classList.add('active'); };
    window.closeAddStory = () => { if(PS_DOM.addStoryModal) PS_DOM.addStoryModal.classList.remove('active'); };
    window.toggleStoryEmoji = () => { if(PS_DOM.storyEmojiPicker) PS_DOM.storyEmojiPicker.classList.toggle('active'); };
    window.addStoryEmoji = (emoji) => { if(PS_DOM.storyCommentInput) { PS_DOM.storyCommentInput.value += emoji; PS_DOM.storyCommentInput.focus(); } };
    window.appendEmoji = (emoji) => { if(PS_DOM.storyInput) { PS_DOM.storyInput.value += emoji; PS_DOM.storyInput.focus(); } };

    if(PS_DOM.btnCloseStory) PS_DOM.btnCloseStory.onclick = closeStoryAction;
    if(PS_DOM.storyViewer) { PS_DOM.storyViewer.onclick = (e) => { if(e.target === PS_DOM.storyViewer) closeStoryAction(); }; }
}

function initNavigation() {
    PS_DOM.tabs.forEach(tab => {
        if(tab.dataset.panel) {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(tab.dataset.panel);
            });
        }
    });
}

// --- UPDATED SWITCH TAB FUNCTION ---
function switchTab(panelName) {
    localStorage.setItem('ps_last_tab', panelName);
    
    // REMOVE OLD TAB CLASSES & ADD CURRENT TAB CLASS TO BODY
    // Ito ang magsasabi sa CSS kung anong tab ang active
    document.body.classList.remove('ps-tab-home', 'ps-tab-swipe', 'ps-tab-matches', 'ps-tab-creators', 'ps-tab-premium', 'ps-tab-settings');
    document.body.classList.add(`ps-tab-${panelName}`);

    PS_DOM.tabs.forEach(t => {
        if(t.dataset.panel === panelName) t.classList.add('ps-is-active');
        else t.classList.remove('ps-is-active');
    });
    PS_DOM.panels.forEach(p => {
        if(p.dataset.panel === panelName) {
            p.classList.add('ps-is-active');
            p.style.display = (panelName === 'home') ? 'flex' : 'block';
            window.scrollTo({top:0, behavior:'smooth'});
        } else {
            p.classList.remove('ps-is-active');
            p.style.display = 'none';
        }
    });
    if(PS_DOM.sidebar && PS_DOM.sidebar.classList.contains('ps-is-open')) PS_DOM.sidebar.classList.remove('ps-is-open');
}

function initMobileMenu() {
    // FIX: Check if buttons exist before adding listeners
    if(PS_DOM.mobileMenuBtn) {
        PS_DOM.mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // FIX: Check if momentsPopup exists before removing class
            if(PS_DOM.momentsPopup) {
                PS_DOM.momentsPopup.classList.remove('ps-is-open');
            }
            
            if(PS_DOM.sidebar) {
                PS_DOM.sidebar.classList.toggle('ps-is-open');
            }
        });
    }

    if(PS_DOM.mobileMomentsBtn) {
        PS_DOM.mobileMomentsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(PS_DOM.sidebar) {
                PS_DOM.sidebar.classList.remove('ps-is-open');
            }
            
            // FIX: Check if momentsPopup exists before toggling
            if(PS_DOM.momentsPopup) {
                PS_DOM.momentsPopup.classList.toggle('ps-is-open');
            }
        });
    }
}

function initCanvasParticles() {
    const canvas = document.getElementById('ps-bg-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, pts = [];

    function resize() { 
        W = canvas.width = window.innerWidth; 
        H = canvas.height = window.innerHeight; 
        pts = []; 
        for(let i=0; i<40; i++) pts.push({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5 }); 
    }
    function loop() { 
        ctx.clearRect(0,0,W,H); ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; 
        pts.forEach(p => { 
            p.x += p.vx; p.y += p.vy; 
            if(p.x<0 || p.x>W) p.vx*=-1; if(p.y<0 || p.y>H) p.vy*=-1; 
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill(); 
        }); 
        requestAnimationFrame(loop); 
    }
    window.addEventListener('resize', resize); resize(); loop();
}

function populateMockContent() {
    const userName = "Member";
    const defaultAvatar = "assets/images/truematch-mark.png";

    if(PS_DOM.miniAvatar) PS_DOM.miniAvatar.src = defaultAvatar;
    if(PS_DOM.miniName) PS_DOM.miniName.textContent = userName;
    if(PS_DOM.headerAvatar) PS_DOM.headerAvatar.src = defaultAvatar;
    if(PS_DOM.headerName) PS_DOM.headerName.textContent = userName;

    if(PS_DOM.dailyPickContainer) {
        const color = getRandomColor();
        PS_DOM.dailyPickContainer.innerHTML = `
            <div class="ps-hero-card" style="background-image: url('${defaultAvatar}'); background-color: ${color};">
                <div class="ps-hero-content">
                    <span class="ps-hero-badge">Daily Top Pick</span>
                    <h2 style="margin:0; color:#fff; text-shadow:0 2px 5px rgba(0,0,0,0.8);">Anastasia, 23</h2>
                    <p style="margin:0; color:#eee;">Model • 3km away</p>
                </div>
            </div>`;
    }

    if (PS_DOM.storiesContainer) {
        const stories = ['Elena', 'Marco', 'Sarah', 'James', 'Pia'];
        let html = '';
        stories.forEach(name => {
            const color = getRandomColor();
            html += `<div class="ps-story-item" onclick="openStory('${name}', '${color}')"><div class="ps-story-ring"><img class="ps-story-img" src="${defaultAvatar}" style="background:${color}"></div><span class="ps-story-name" style="font-size:0.7rem;">${name}</span></div>`;
        });
        PS_DOM.storiesContainer.innerHTML = html;
        if(PS_DOM.momentsPopup) document.getElementById('psMobileStoriesContainer').innerHTML = html;
    }

    if (PS_DOM.admirerContainer) {
        const admirers = [{ name: 'Secret', loc: 'Nearby' }, { name: 'Secret', loc: '5km away' }, { name: 'Secret', loc: 'City Center' }, { name: 'Secret', loc: '10km away' }];
        if(PS_DOM.admirerCount) PS_DOM.admirerCount.textContent = `${admirers.length} New`;
        let html = '';
        admirers.forEach(adm => {
            html += `<div class="ps-admirer-card" onclick="document.querySelector('[data-panel=premium]').click()"><div class="ps-admirer-icon"><i class="fa-solid fa-lock"></i></div><img class="ps-admirer-img" src="${defaultAvatar}" style="background:${getRandomColor()}"><h4 style="margin:0; font-size:0.9rem;">${adm.name}</h4><p class="ps-tiny ps-muted" style="margin:2px 0 0;">${adm.loc}</p></div>`;
        });
        PS_DOM.admirerContainer.innerHTML = html;
    }

    // Matches & Messages
    if (PS_DOM.matchesContainer && PS_DOM.newMatchesRail) {
        let newMatches = [
            { name: 'Kyla', imgColor: '#FFD700' },
            { name: 'Chloe', imgColor: '#ff3366' },
            { name: 'Bea', imgColor: '#00aff0' },
            { name: 'Marga', imgColor: '#800080' },
        ];
        newMatches = newMatches.filter(m => !conversationHistory[m.name]);
        
        if(PS_DOM.newMatchCount) PS_DOM.newMatchCount.textContent = newMatches.length;
        let railHtml = '';
        newMatches.forEach(m => {
            railHtml += `<div class="ps-new-match-item" onclick="openChat('${m.name}')"><div class="ps-match-ring"><img class="ps-match-avatar" src="${defaultAvatar}" style="background:${m.imgColor}"></div><span class="ps-match-name-sm">${m.name}</span></div>`;
        });
        PS_DOM.newMatchesRail.innerHTML = railHtml;

        let messagesHtml = '';
        const historyNames = Object.keys(conversationHistory).reverse();
        historyNames.forEach(name => {
            const msgs = conversationHistory[name];
            const lastMsg = msgs[msgs.length - 1];
            // Fix preview for gift messages
            const preview = lastMsg.type === 'sent' ? 
                (lastMsg.text.includes('fa-gift') ? 'You: Sent a gift' : `You: ${lastMsg.text}`) : 
                lastMsg.text;

            messagesHtml += `<div class="ps-message-item" onclick="openChat('${name}')"><div class="ps-msg-avatar-wrapper"><img class="ps-msg-avatar" src="${defaultAvatar}" style="background:${getRandomColor()}"><div class="ps-online-badge"></div></div><div class="ps-msg-content"><div class="ps-msg-header"><span class="ps-msg-name">${name}</span><span class="ps-msg-time">Active</span></div><div style="display:flex; align-items:center;"><span class="ps-msg-preview" style="color:#fff; font-weight:600;">${preview}</span></div></div></div>`;
        });

        const staticMessages = [
            { name: 'Victoria', msg: 'See you later! 👋', time: '2m', unread: true },
            { name: 'Alexander', msg: 'That sounds like a great plan.', time: '1h', unread: false },
            { name: 'Sophia', msg: 'Sent a photo', time: '3h', unread: false },
            { name: 'Liam', msg: 'Haha, exactly!', time: '1d', unread: false }
        ];
        staticMessages.forEach(m => {
            if (!conversationHistory[m.name]) { 
                const unreadClass = m.unread ? 'unread' : '';
                const unreadDot = m.unread ? `<div class="ps-msg-unread-dot"></div>` : '';
                messagesHtml += `<div class="ps-message-item ${unreadClass}" onclick="openChat('${m.name}')"><div class="ps-msg-avatar-wrapper"><img class="ps-msg-avatar" src="${defaultAvatar}" style="background:${getRandomColor()}"><div class="ps-online-badge"></div></div><div class="ps-msg-content"><div class="ps-msg-header"><span class="ps-msg-name">${m.name}</span><span class="ps-msg-time">${m.time}</span></div><div style="display:flex; align-items:center;"><span class="ps-msg-preview">${m.msg}</span>${unreadDot}</div></div></div>`;
            }
        });
        PS_DOM.matchesContainer.innerHTML = messagesHtml;
    }

    if (PS_DOM.activeNearbyContainer) {
        let html = '';
        for(let i=0; i<6; i++) {
            const color = getRandomColor();
            html += `<div class="ps-active-item"><img class="ps-active-img" src="${defaultAvatar}" style="background:${color}"><div style="position:absolute; bottom:5px; right:5px; width:10px; height:10px; background:#00ff88; border-radius:50; border:2px solid #000;"></div></div>`;
        }
        PS_DOM.activeNearbyContainer.innerHTML = html;
    }

    // --- CREATORS TAB POPULATION ---
    if(PS_DOM.panelCreatorsBody) {
        const creators = [
            { name: 'Sasha Grey', cat: 'Model & Gamer', followers: '5.2M', color: '#8e44ad' },
            { name: 'Bella Fox', cat: 'Cosplay', followers: '2.1M', color: '#ff3366' },
            { name: 'Fit with Jen', cat: 'Fitness', followers: '800K', color: '#00aff0' },
            { name: 'Chef Marco', cat: 'Culinary', followers: '1.5M', color: '#e67e22' },
            { name: 'Tech Rex', cat: 'Tech Reviews', followers: '3.1M', color: '#34495e' },
            { name: 'Luna Art', cat: 'Digital Art', followers: '950K', color: '#16a085' }
        ];

        let creatorsHtml = `
        <div class="ps-creators-filter">
            <div class="ps-filter-chip active" onclick="filterCreators(this, 'All')">All</div>
            <div class="ps-filter-chip" onclick="filterCreators(this, 'Trending')">Trending</div>
            <div class="ps-filter-chip" onclick="filterCreators(this, 'New')">New</div>
            <div class="ps-filter-chip" onclick="filterCreators(this, 'Near You')">Near You</div>
            <div class="ps-filter-chip" onclick="filterCreators(this, 'Cosplay')">Cosplay</div>
        </div>
        <div class="ps-creators-grid">`;

        creators.forEach(c => {
            creatorsHtml += `
            <div class="ps-creator-card-premium" onclick="openCreatorProfile('${c.name}', '${c.cat}', '${c.followers}', '${c.color}')">
                <div class="ps-creator-cover" style="background-color: ${c.color}; background-image: url('assets/images/truematch-mark.png'); opacity: 0.8;"></div>
                <div class="ps-creator-body">
                    <div>
                        <h3 class="ps-creator-name">${c.name} <i class="fa-solid fa-circle-check" style="color:#00aff0; font-size:0.8rem;"></i></h3>
                        <span class="ps-creator-category">${c.cat}</span>
                    </div>
                    <div class="ps-creator-stats">
                        <span><i class="fa-solid fa-users"></i> ${c.followers}</span>
                        <span><i class="fa-solid fa-star"></i> 4.9</span>
                    </div>
                    <button class="ps-btn-view-profile">View Profile</button>
                </div>
            </div>`;
        });

        creatorsHtml += `</div>`;
        PS_DOM.panelCreatorsBody.innerHTML = creatorsHtml;
    }

    // --- PREMIUM TAB POPULATION (NEW DESIGN) ---
    if(PS_DOM.panelPremiumBody) {
        PS_DOM.panelPremiumBody.innerHTML = `
            <div class="ps-premium-hero">
                <div style="font-size:3rem; margin-bottom:10px; color:#ffd700;"><i class="fa-solid fa-crown"></i></div>
                <h1 class="ps-premium-title">iTrueMatch<br><span class="ps-premium-brand-accent">PREMIUM</span></h1>
                <p class="ps-premium-subtitle">Unlock exclusive features and find your match faster.</p>
            </div>

            <div class="ps-premium-benefits">
                <div class="ps-benefit-item">
                    <div class="ps-benefit-icon"><i class="fa-solid fa-heart"></i></div>
                    <div class="ps-benefit-text">
                        <h4>See Who Likes You</h4>
                        <p>View your secret admirers immediately.</p>
                    </div>
                </div>
                <div class="ps-benefit-item">
                    <div class="ps-benefit-icon"><i class="fa-solid fa-bolt"></i></div>
                    <div class="ps-benefit-text">
                        <h4>Unlimited Swipes</h4>
                        <p>No more daily limits. Swipe all day.</p>
                    </div>
                </div>
                <div class="ps-benefit-item">
                    <div class="ps-benefit-icon"><i class="fa-solid fa-earth-americas"></i></div>
                    <div class="ps-benefit-text">
                        <h4>Passport Mode</h4>
                        <p>Match with people anywhere in the world.</p>
                    </div>
                </div>
            </div>

            <div class="ps-plan-selector">
                <div class="ps-plan-card" onclick="selectPlan(this)" data-price="$14.99">
                    <span class="ps-plan-duration">1 <small>Month</small></span>
                    <div class="ps-plan-monthly">$14.99/mo</div>
                    <span class="ps-plan-price">$14.99</span>
                </div>
                
                <div class="ps-plan-card active" onclick="selectPlan(this)" data-price="$44.99">
                    <span class="ps-plan-badge">Most Popular</span>
                    <span class="ps-plan-duration">6 <small>Months</small></span>
                    <div class="ps-plan-monthly">$7.50/mo</div>
                    <span class="ps-plan-price">$44.99</span>
                    <span class="ps-plan-savings">Save 50%</span>
                </div>
                
                <div class="ps-plan-card" onclick="selectPlan(this)" data-price="$59.99">
                    <span class="ps-plan-badge">Best Value</span>
                    <span class="ps-plan-duration">12 <small>Months</small></span>
                    <div class="ps-plan-monthly">$5.00/mo</div>
                    <span class="ps-plan-price">$59.99</span>
                    <span class="ps-plan-savings">Save 60%</span>
                </div>
            </div>

            <div class="ps-premium-action">
                <button class="ps-btn-gold" onclick="subscribeGold()">CONTINUE</button>
                <p style="font-size:0.7rem; color:#666; margin-top:15px;">Recurring billing, cancel anytime.</p>
            </div>
        `;
    }
}

// ==========================================
// NEW FEATURES: MATCH & GIFT LOGIC
// ==========================================

// --- 1. GIFT SYSTEM LOGIC ---
let selectedGiftPrice = 500;
let selectedGiftName = "Diamond";

window.closeGiftModal = () => {
    if(PS_DOM.giftModal) PS_DOM.giftModal.classList.remove('active');
};

window.selectGift = (el, name, price) => {
    // Remove active class from others
    document.querySelectorAll('.ps-gift-item').forEach(i => i.classList.remove('active'));
    // Add active to clicked
    el.classList.add('active');
    
    selectedGiftPrice = price;
    selectedGiftName = name;
    
    // Update button text
    if(PS_DOM.giftPriceBtn) PS_DOM.giftPriceBtn.textContent = price;
};

window.sendSelectedGift = () => {
    window.closeGiftModal();
    
    // Magpanggap na nag send sa chat
    const targetUser = PS_DOM.chatName ? PS_DOM.chatName.textContent : "User";
    
    // 1. Show Toast
    showToast(`Sent ${selectedGiftName} to ${targetUser}! (-${selectedGiftPrice}c)`);
    
    // 2. Add to Chat Bubble (Visual trick)
    // Add logic to save this to history later if needed
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ps-msg-bubble sent';
    msgDiv.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
    msgDiv.style.color = '#000';
    msgDiv.style.fontWeight = 'bold';
    msgDiv.innerHTML = `<i class="fa-solid fa-gift"></i> Sent a ${selectedGiftName}`;
    
    if(PS_DOM.chatBody) {
        PS_DOM.chatBody.appendChild(msgDiv);
        PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;
    }
    
    // Also save to history for persistence
    if (!conversationHistory[targetUser]) conversationHistory[targetUser] = [];
    conversationHistory[targetUser].push({ type: 'sent', text: `<i class="fa-solid fa-gift"></i> Sent a ${selectedGiftName}` });
    saveHistory();
};

// --- 2. MATCH OVERLAY LOGIC ---
window.triggerMatchOverlay = (person) => {
    if(!PS_DOM.matchOverlay) return;
    
    // Set Data
    if(PS_DOM.matchName) PS_DOM.matchName.textContent = person.name;
    
    // Set Colors/Images (Random color for demo)
    if(PS_DOM.matchTargetImg) {
        PS_DOM.matchTargetImg.style.background = person.color;
    }
    if(PS_DOM.matchUserImg) {
        // Mock user image color
        PS_DOM.matchUserImg.style.background = '#00aff0'; 
    }

    // Show Overlay
    PS_DOM.matchOverlay.classList.add('active');
};

window.closeMatchOverlay = () => {
    if(PS_DOM.matchOverlay) PS_DOM.matchOverlay.classList.remove('active');
};

window.openChatFromMatch = () => {
    const name = PS_DOM.matchName.textContent;
    window.closeMatchOverlay();
    
    // Switch to Matches Tab
    const matchesBtn = document.querySelector('button[data-panel="matches"]');
    if(matchesBtn) matchesBtn.click();

    // Open Chat
    setTimeout(() => {
        if(window.openChat) window.openChat(name);
    }, 300);
};