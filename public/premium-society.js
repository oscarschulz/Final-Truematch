// ---------------------------------------------------------------------
// Premium Society - Secured & Persistent Logic
// ---------------------------------------------------------------------

const PS_DOM = {
    layout: document.getElementById('psMainLayout'),
    loader: document.getElementById('app-loader'),
    tabs: document.querySelectorAll('.ps-nav-btn'),
    panels: document.querySelectorAll('.ps-panel[data-panel]'),
    sidebar: document.getElementById('psMainSidebar'),
    
    // Header
    headerAvatar: document.getElementById('psHeaderAvatar'),
    headerName: document.getElementById('psWelcomeName'),
    
    // Containers
    dailyPickContainer: document.getElementById('psDailyPickContainer'),
    storiesContainer: document.getElementById('psStoriesContainer'),
    admirerContainer: document.getElementById('psAdmirerContainer'),
    admirerCount: document.getElementById('psAdmirerCount'),
    
    // UPDATED MATCHES CONTAINERS
    matchesContainer: document.getElementById('psMatchesContainer'), // List
    newMatchesRail: document.getElementById('psNewMatchesRail'),     // Rail
    newMatchCount: document.getElementById('psNewMatchCount'),

    activeNearbyContainer: document.getElementById('psActiveNearbyContainer'),
    
    // CHAT WINDOW DOM
    chatWindow: document.getElementById('psChatWindow'),
    btnCloseChat: document.getElementById('psBtnCloseChat'),
    chatAvatar: document.getElementById('psChatAvatar'),
    chatName: document.getElementById('psChatName'),
    chatBody: document.getElementById('psChatBody'),
    chatInput: document.getElementById('psChatInput'),
    chatEmojiPicker: document.getElementById('psChatEmojiPicker'),

    // Story Viewer
    storyViewer: document.getElementById('psStoryViewer'),
    btnCloseStory: document.getElementById('psBtnCloseStory'),
    storyFullImg: document.getElementById('psStoryImageDisplay'),
    storyName: document.getElementById('psStoryName'),
    storyAvatar: document.getElementById('psStoryAvatar'),
    storyProgress: document.getElementById('psStoryProgress'),
    storyCommentInput: document.getElementById('psStoryCommentInput'),
    storyEmojiPicker: document.getElementById('psStoryEmojiPicker'),

    // Add Story Modal
    addStoryModal: document.getElementById('psAddStoryModal'),
    storyInput: document.getElementById('psStoryInput'),

    // Mini Profile Elements
    miniAvatar: document.getElementById('psMiniAvatar'),
    miniName: document.getElementById('psMiniName'),
    miniPlan: document.getElementById('psMiniPlan'),
    miniLogout: document.getElementById('ps-btn-logout'),

    
    // Settings Profile
    settingsName: document.getElementById('psSNameDisplay'),
    settingsEmail: document.getElementById('psSEmailDisplay'),
    settingsAvatar: document.getElementById('psSAvatar'),
    settingsPlanBadge: document.getElementById('psSPlanBadge'),

    // Refresh Popover
    refreshPopover: document.getElementById('psRefreshPopover'),
    btnRefreshDeck: document.getElementById('psBtnRefreshDeck'),

    // Mobile Toggles
    mobileMenuBtn: document.getElementById('psMobileNavToggle'),
    mobileMomentsBtn: document.getElementById('psMobileMomentsToggle'),
    momentsPopup: document.getElementById('psMomentsPopup'),
    
    // Swipe
    swipeStack: document.getElementById('psSwipeStack'),
    swipeControls: document.getElementById('psSwipeControls'),
    btnSwipePass: document.getElementById('psBtnSwipePass'),
    btnSwipeLike: document.getElementById('psBtnSwipeLike'),
    btnSwipeSuper: document.getElementById('psBtnSwipeSuper'),
    
    // Stats & Toast
    ringCircle: document.getElementById('psStatsRingCircle'),
    countDisplay: document.getElementById('psStatsCountDisplay'),
    toast: document.getElementById('ps-toast'),
    
    // Timer Display
    timerDisplay: document.querySelector('.ps-stats-body p.ps-tiny'),

    // Panels
    panelCreatorsBody: document.getElementById('ps-panel-creators'),
    panelPremiumBody: document.getElementById('ps-panel-premium')
};

function getRandomColor() {
    const colors = ['#00aff0', '#ff3366', '#3ad4ff', '#800080', '#00ff88', '#333'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function showToast(msg) {
    if (!PS_DOM.toast) return;
    PS_DOM.toast.innerHTML = `<i class="fa-solid fa-fire"></i> ${msg}`;
    PS_DOM.toast.className = `ps-toast ps-visible`;
    setTimeout(() => PS_DOM.toast.classList.remove('ps-visible'), 3000);
}


// ---------------------------------------------------------------------
// ACCOUNT IDENTITY (name/avatar from session)
// ---------------------------------------------------------------------
function psSafeGetLocalUser() {
    try {
        return JSON.parse(localStorage.getItem('tm_user') || 'null');
    } catch (_) {
        return null;
    }
}

function psResolveDisplayName(user) {
    // Prefer explicit name fields first
    let name =
        (user && (user.name || user.displayName || user.fullName || user.username)) ||
        (user && user.profile && (user.profile.name || user.profile.fullName || user.profile.displayName)) ||
        '';

    let out = String(name || '').trim();

    // Fallback: firstName + lastName (common in forms)
    if (!out) {
        const first = (user && (user.firstName || user.firstname || user.first_name)) || '';
        const last = (user && (user.lastName || user.lastname || user.last_name)) || '';
        out = String(`${first} ${last}`).trim();
    }

    // Last-resort fallback: common app-specific fields
    if (!out) {
        out = String((user && (user.applicantName || user.premiumApplicantName || user.creatorApplicantName)) || '').trim();
    }

    return out || 'Member';
}

function psNormalizePlanKey(rawPlan) {
    const v = String(rawPlan || '').trim().toLowerCase();
    if (!v) return 'free';
    if (v === 'free' || v === '0') return 'free';
    if (v === 'plus' || v === 'tier1' || v === '1') return 'tier1';
    if (v === 'elite' || v === 'tier2' || v === '2') return 'tier2';
    if (v === 'concierge' || v === 'tier3' || v === '3') return 'tier3';
    return v;
}

function psPlanLabelFromKey(planKey) {
    const key = psNormalizePlanKey(planKey);
    if (key === 'tier1') return 'Plus';
    if (key === 'tier2') return 'Elite';
    if (key === 'tier3') return 'Concierge';
    return 'Free Account';
}

function psResolvePlanLabel(user) {
    const raw = user?.plan ?? user?.planKey ?? user?.tier ?? user?.tierKey ?? user?.subscriptionPlan ?? user?.accessTier;
    const key = psNormalizePlanKey(raw);
    const base = psPlanLabelFromKey(key);
    const activeFlag = user?.planActive;

    // If planActive exists and is false, show Inactive for paid plans.
    if (activeFlag === false && key !== 'free') return `${base} (Inactive)`;
    return base;
}


function psResolveAvatarUrl(user) {
    const url = (user && (user.avatarUrl || user.photoUrl || user.photoURL || user.profilePhotoUrl || user.avatar)) || '';
    const out = String(url || '').trim();
    return out || '';
}

async function hydrateAccountIdentity() {
    // Start with cached local user to avoid "..." staying on UI if /api/me fails.
    let user = psSafeGetLocalUser();

    // 1) Try server session (recommended)
    try {
        const res = await fetch('/api/me', { credentials: 'same-origin' });
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            const data = await res.json();
            if (data && data.ok && data.user) user = data.user;
        }
    } catch (_) {}

    if (!user) return;

    const displayName = psResolveDisplayName(user);
    const avatarUrl = psResolveAvatarUrl(user);

    const planLabel = psResolvePlanLabel(user);
    const email = user.email || user.userEmail || user.mail || user.contactEmail || '';

    if (PS_DOM.miniPlan) PS_DOM.miniPlan.textContent = planLabel;

    if (PS_DOM.settingsName) PS_DOM.settingsName.textContent = displayName;
    if (PS_DOM.settingsEmail) PS_DOM.settingsEmail.textContent = email;
    if (PS_DOM.settingsPlanBadge) PS_DOM.settingsPlanBadge.textContent = planLabel;

    if (PS_DOM.miniName) PS_DOM.miniName.textContent = displayName;
    if (PS_DOM.headerName) PS_DOM.headerName.textContent = displayName;

    const menuNameEl = document.getElementById('psMenuName');
    if (menuNameEl) menuNameEl.textContent = displayName;

    if (avatarUrl) {
        if (PS_DOM.miniAvatar) PS_DOM.miniAvatar.src = avatarUrl;
        if (PS_DOM.headerAvatar) PS_DOM.headerAvatar.src = avatarUrl;
        if (PS_DOM.settingsAvatar) PS_DOM.settingsAvatar.src = avatarUrl;
        const storyAvatarEl = document.getElementById('psStoryAvatar');
        if (storyAvatarEl) storyAvatarEl.src = avatarUrl;
    }
}

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    initCanvasParticles();
    initNavigation();
    initMobileMenu();
    initStoryViewer();
    initChat(); // Initialize Chat Listeners
    // Hydrate identity first so name/plan updates even if some optional sections were removed.
    hydrateAccountIdentity();
    populateMockContent();
    // Check Local Storage for Last Tab
    const lastTab = localStorage.getItem('ps_last_tab') || 'home';
    switchTab(lastTab);

    // Remove Loader smoothly
    setTimeout(() => {
        if(PS_DOM.loader) {
            PS_DOM.loader.style.opacity = '0';
            setTimeout(() => PS_DOM.loader.remove(), 500);
        }
        if(PS_DOM.layout) PS_DOM.layout.style.opacity = '1';
    }, 1000);
});

// ---------------------------------------------------------------------
// CHAT LOGIC (NEW)
// ---------------------------------------------------------------------
function initChat() {
    if(PS_DOM.btnCloseChat) {
        PS_DOM.btnCloseChat.addEventListener('click', closeChat);
    }
}

window.openChat = function(name) {
    if(!PS_DOM.chatWindow) return;
    
    // Set Header Info
    PS_DOM.chatName.textContent = name;
    PS_DOM.chatAvatar.src = "assets/images/truematch-mark.png";
    
    // Clear previous dummy messages and add some starter ones
    PS_DOM.chatBody.innerHTML = `
        <div class="ps-msg-bubble received">Hey ${name} here! How's it going?</div>
        <div class="ps-msg-bubble received">Saw your profile, pretty cool!</div>
    `;
    
    PS_DOM.chatWindow.classList.add('active');
}

window.closeChat = function() {
    if(PS_DOM.chatWindow) PS_DOM.chatWindow.classList.remove('active');
}

window.toggleChatEmoji = function() {
    if(PS_DOM.chatEmojiPicker) PS_DOM.chatEmojiPicker.classList.toggle('active');
}

window.addChatEmoji = function(emoji) {
    if(PS_DOM.chatInput) {
        PS_DOM.chatInput.value += emoji;
        PS_DOM.chatInput.focus();
    }
}

window.sendChatMessage = function() {
    const text = PS_DOM.chatInput ? PS_DOM.chatInput.value.trim() : "";
    if(!text) return;

    // Append Sent Message
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ps-msg-bubble sent';
    msgDiv.textContent = text;
    PS_DOM.chatBody.appendChild(msgDiv);
    
    // Auto Scroll to bottom
    PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;

    PS_DOM.chatInput.value = "";
    if(PS_DOM.chatEmojiPicker) PS_DOM.chatEmojiPicker.classList.remove('active');
}

// ---------------------------------------------------------------------
// STORY VIEWER LOGIC
// ---------------------------------------------------------------------
function initStoryViewer() {
    if(PS_DOM.btnCloseStory) {
        PS_DOM.btnCloseStory.onclick = closeStory;
    }
}

window.openStory = function(name, color) {
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
}

function closeStory() {
    if(PS_DOM.storyViewer) {
        PS_DOM.storyViewer.classList.remove('active');
        if(PS_DOM.storyProgress) PS_DOM.storyProgress.classList.remove('animating');
    }
}

window.toggleStoryEmoji = function() {
    if(PS_DOM.storyEmojiPicker) {
        PS_DOM.storyEmojiPicker.classList.toggle('active');
    }
}

window.addStoryEmoji = function(emoji) {
    if(PS_DOM.storyCommentInput) {
        PS_DOM.storyCommentInput.value += emoji;
        PS_DOM.storyCommentInput.focus();
    }
}

window.sendStoryComment = function() {
    const text = PS_DOM.storyCommentInput ? PS_DOM.storyCommentInput.value.trim() : "";
    if(!text) return;
    
    showToast("Reply Sent! ✨");
    PS_DOM.storyCommentInput.value = "";
    if(PS_DOM.storyEmojiPicker) PS_DOM.storyEmojiPicker.classList.remove('active');
}

window.openAddStory = function() {
    if(PS_DOM.addStoryModal) PS_DOM.addStoryModal.classList.add('active');
}

window.closeAddStory = function() {
    if(PS_DOM.addStoryModal) PS_DOM.addStoryModal.classList.remove('active');
}

window.appendEmoji = function(emoji) {
    if(PS_DOM.storyInput) {
        PS_DOM.storyInput.value += emoji;
        PS_DOM.storyInput.focus();
    }
}

window.postNewStory = function() {
    const text = PS_DOM.storyInput ? PS_DOM.storyInput.value.trim() : "";
    if(!text) {
        showToast("Please write something!");
        return;
    }

    if(PS_DOM.storiesContainer) {
        const newStoryHtml = `
            <div class="ps-story-item" onclick="openStory('You', '#00aff0')">
                <div class="ps-story-ring">
                    <img class="ps-story-img" src="assets/images/truematch-mark.png" style="background:#00aff0">
                </div>
                <span class="ps-story-name" style="font-size:0.7rem;">You</span>
            </div>`;
        
        PS_DOM.storiesContainer.insertAdjacentHTML('afterbegin', newStoryHtml);
    }
    
    showToast("Moment Shared!");
    if(PS_DOM.storyInput) PS_DOM.storyInput.value = ""; 
    closeAddStory();
}

// ---------------------------------------------------------------------
// POPULATE MOCK CONTENT
// ---------------------------------------------------------------------
function populateMockContent(opts = {}) {
    const userName = (opts && opts.userName ? String(opts.userName) : "Member");
    const defaultAvatar = (opts && opts.avatarUrl ? String(opts.avatarUrl) : "assets/images/truematch-mark.png");
    if(PS_DOM.miniAvatar) PS_DOM.miniAvatar.src = defaultAvatar;
    if(PS_DOM.miniName) PS_DOM.miniName.textContent = userName;
    if(PS_DOM.headerAvatar) PS_DOM.headerAvatar.src = defaultAvatar;
    if(PS_DOM.headerName) PS_DOM.headerName.textContent = userName;


    const menuNameEl = document.getElementById('psMenuName');
    if(menuNameEl) menuNameEl.textContent = userName;
    if(PS_DOM.dailyPickContainer) {
        const color = getRandomColor();
        PS_DOM.dailyPickContainer.innerHTML = `
            <div class="ps-hero-card" style="background-image: url('${defaultAvatar}'); background-color: ${color};">
                <div class="ps-hero-content">
                    <span class="ps-hero-badge">Daily Top Pick</span>
                    <h2 style="margin:0; color:#fff; text-shadow:0 2px 5px rgba(0,0,0,0.8);">Anastasia, 23</h2>
                    <p style="margin:0; color:#eee;">Model • 3km away</p>
                </div>
            </div>
        `;
    }

    if (PS_DOM.storiesContainer) {
        const stories = ['Elena', 'Marco', 'Sarah', 'James', 'Pia'];
        let html = '';
        stories.forEach(name => {
            const color = getRandomColor();
            html += `
            <div class="ps-story-item" onclick="openStory('${name}', '${color}')">
                <div class="ps-story-ring">
                    <img class="ps-story-img" src="${defaultAvatar}" style="background:${color}">
                </div>
                <span class="ps-story-name" style="font-size:0.7rem;">${name}</span>
            </div>`;
        });
        PS_DOM.storiesContainer.innerHTML = html;
        if(PS_DOM.momentsPopup) {
            document.getElementById('psMobileStoriesContainer').innerHTML = html;
        }
    }

    if (PS_DOM.admirerContainer) {
        const admirers = [{ name: 'Secret', loc: 'Nearby' }, { name: 'Secret', loc: '5km away' }, { name: 'Secret', loc: 'City Center' }, { name: 'Secret', loc: '10km away' }];
        if(PS_DOM.admirerCount) PS_DOM.admirerCount.textContent = `${admirers.length} New`;
        let html = '';
        admirers.forEach(adm => {
            html += `
            <div class="ps-admirer-card" onclick="document.querySelector('[data-panel=premium]').click()">
                <div class="ps-admirer-icon"><i class="fa-solid fa-lock"></i></div>
                <img class="ps-admirer-img" src="${defaultAvatar}" style="background:${getRandomColor()}">
                <h4 style="margin:0; font-size:0.9rem;">${adm.name}</h4>
                <p class="ps-tiny ps-muted" style="margin:2px 0 0;">${adm.loc}</p>
            </div>`;
        });
        PS_DOM.admirerContainer.innerHTML = html;
    }

    // -----------------------------------------------------------------
    // UPDATED MATCHES & MESSAGES POPULATION WITH ONCLICK
    // -----------------------------------------------------------------
    if (PS_DOM.matchesContainer && PS_DOM.newMatchesRail) {
        // Data
        const newMatches = [
            { name: 'Kyla', imgColor: '#FFD700' },
            { name: 'Chloe', imgColor: '#ff3366' },
            { name: 'Bea', imgColor: '#00aff0' },
            { name: 'Marga', imgColor: '#800080' },
        ];
        
        const messages = [
            { name: 'Victoria', msg: 'See you later! 👋', time: '2m', unread: true },
            { name: 'Alexander', msg: 'That sounds like a great plan.', time: '1h', unread: false },
            { name: 'Sophia', msg: 'Sent a photo', time: '3h', unread: false },
            { name: 'Liam', msg: 'Haha, exactly!', time: '1d', unread: false }
        ];

        // Render New Matches (Horizontal Rail)
        if(PS_DOM.newMatchCount) PS_DOM.newMatchCount.textContent = newMatches.length;
        let railHtml = '';
        newMatches.forEach(m => {
            railHtml += `
            <div class="ps-new-match-item" onclick="openChat('${m.name}')">
                <div class="ps-match-ring">
                    <img class="ps-match-avatar" src="${defaultAvatar}" style="background:${m.imgColor}">
                </div>
                <span class="ps-match-name-sm">${m.name}</span>
            </div>`;
        });
        PS_DOM.newMatchesRail.innerHTML = railHtml;

        // Render Messages (Vertical List)
        let listHtml = '';
        messages.forEach(m => {
            const unreadClass = m.unread ? 'unread' : '';
            const unreadDot = m.unread ? `<div class="ps-msg-unread-dot"></div>` : '';
            
            listHtml += `
            <div class="ps-message-item ${unreadClass}" onclick="openChat('${m.name}')">
                <div class="ps-msg-avatar-wrapper">
                    <img class="ps-msg-avatar" src="${defaultAvatar}" style="background:${getRandomColor()}">
                    <div class="ps-online-badge"></div>
                </div>
                <div class="ps-msg-content">
                    <div class="ps-msg-header">
                        <span class="ps-msg-name">${m.name}</span>
                        <span class="ps-msg-time">${m.time}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="ps-msg-preview">${m.msg}</span>
                        ${unreadDot}
                    </div>
                </div>
            </div>`;
        });
        PS_DOM.matchesContainer.innerHTML = listHtml;
    }

    if (PS_DOM.activeNearbyContainer) {
        let html = '';
        for(let i=0; i<6; i++) {
            const color = getRandomColor();
            html += `
            <div class="ps-active-item">
                <img class="ps-active-img" src="${defaultAvatar}" style="background:${color}">
                <div style="position:absolute; bottom:5px; right:5px; width:10px; height:10px; background:#00ff88; border-radius:50; border:2px solid #000;"></div>
            </div>`;
        }
        PS_DOM.activeNearbyContainer.innerHTML = html;
    }

    if(PS_DOM.panelCreatorsBody) {
        PS_DOM.panelCreatorsBody.innerHTML = `<div class="ps-feed-header">Creators</div><div class="ps-matches-grid" style="grid-template-columns: repeat(2, 1fr); padding:20px;"><div class="ps-creator-card" style="background: linear-gradient(135deg, #4b0082, #800080);"><h3 style="margin:0; color:#fff;">Sasha <i class="fa-solid fa-circle-check" style="color:#00aff0"></i></h3><p class="ps-tiny">Elite Model</p><button class="ps-btn-white" style="margin-top:auto;">View</button></div></div>`;
    }
    if(PS_DOM.panelPremiumBody) {
        PS_DOM.panelPremiumBody.innerHTML = `<div class="ps-feed-header">Premium</div><div style="text-align:center; padding:30px; border:1px solid #00aff0; border-radius:16px; margin:20px; background:rgba(0, 175, 240, 0.1);"><i class="fa-solid fa-gem" style="font-size:3rem; color:#00aff0; margin-bottom:15px;"></i><h2>iTrueMatch GOLD</h2><p>Unlock swipes.</p><button class="ps-btn-white" style="background:#00aff0; color:#fff; margin-top:20px; width:100%;">Subscribe</button></div>`;
    }

    SwipeController.init();
}

// ---------------------------------------------------------------------
// SWIPE CONTROLLER (PERSISTENT LOGIC & TIMER)
// ---------------------------------------------------------------------
const SwipeController = (() => {
    const mockCandidates = [
        { name: 'Isabella', age: 24, loc: 'Manila', color: '#8e44ad', tags: ['Travel', 'Music'] },
        { name: 'Christian', age: 29, loc: 'Cebu', color: '#2c3e50', tags: ['Tech', 'Coffee'] },
        { name: 'Natalia', age: 26, loc: 'Davao', color: '#c0392b', tags: ['Art', 'Movies'] },
        { name: 'Sophia', age: 22, loc: 'Baguio', color: '#16a085', tags: ['Nature', 'Hiking'] },
        { name: 'Marco', age: 27, loc: 'Makati', color: '#e67e22', tags: ['Food', 'Gym'] }
    ];
    
    let candidates = [...mockCandidates]; 
    let index = 0;
    
    // Persistent Variables
    let dailySwipes = 20;
    let resetTime = 0;
    let isSwiping = false; 

    function init() {
        candidates = [...mockCandidates]; 
        index = 0;

        // 1. CHECK LOCAL STORAGE
        const savedSwipes = localStorage.getItem('ps_swipes_left');
        const savedTime = localStorage.getItem('ps_reset_time');
        const now = Date.now();

        if (savedTime && now < parseInt(savedTime)) {
            // Timer is active, load saved data
            dailySwipes = parseInt(savedSwipes);
            resetTime = parseInt(savedTime);
        } else {
            // Timer expired or first run: RESET TO 20
            dailySwipes = 20;
            resetTime = now + (12 * 60 * 60 * 1000); // 12 Hours from now
            saveData();
        }

        startCountdown(); // Start the UI timer
        
        if(PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove('active');
        if(PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'flex';
        
        updateStats(dailySwipes, 20);
        renderCards();
        
        // Refresh Button Click
        if(PS_DOM.btnRefreshDeck) {
            PS_DOM.btnRefreshDeck.onclick = () => tryRefresh();
        }
    }

    function saveData() {
        localStorage.setItem('ps_swipes_left', dailySwipes);
        localStorage.setItem('ps_reset_time', resetTime);
    }

    function startCountdown() {
        // Update timer every second
        setInterval(() => {
            const now = Date.now();
            const diff = resetTime - now;

            if (diff <= 0) {
                // Time's up! Reset Logic
                if (PS_DOM.timerDisplay) PS_DOM.timerDisplay.textContent = "Ready to reset!";
                // Automatically reset if time passes
                if (dailySwipes < 20) {
                    dailySwipes = 20;
                    resetTime = now + (12 * 60 * 60 * 1000);
                    saveData();
                    updateStats(dailySwipes, 20);
                    // Optional: reload page or notify user
                }
            } else {
                // Format HHh MMm SSs
                const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                
                if (PS_DOM.timerDisplay) {
                    PS_DOM.timerDisplay.textContent = `Resets in ${hrs}h ${mins}m ${secs}s`;
                }
            }
        }, 1000);
    }

    function tryRefresh() {
        if (dailySwipes <= 0) {
            fireEmptyAlert();
        } else {
            // Only refresh cards if they have swipes
            index = 0;
            if(PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove('active');
            if(PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'flex';
            renderCards();
            showToast("Deck Refreshed");
        }
    }

    function fireEmptyAlert() {
        Swal.fire({
            title: 'Out of Swipes!',
            text: 'Please wait for the timer to reset or upgrade to Gold.',
            icon: 'warning',
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#00aff0',
            confirmButtonText: 'Okay, I\'ll wait',
            backdrop: `rgba(0,0,0,0.8)`
        });
    }

    function createCard(person, position) {
        const card = document.createElement('div');
        card.className = 'ps-swipe-card';
        card.setAttribute('data-pos', position);
        if (position === 'center') card.id = 'activeSwipeCard';
        card.style.background = `linear-gradient(to bottom, ${person.color}, #000)`;
        
        let tagsHtml = `<div class="ps-swipe-tags">`;
        person.tags.forEach(t => tagsHtml += `<span class="ps-tag">${t}</span>`);
        tagsHtml += `</div>`;

        card.innerHTML = `
            <div class="ps-swipe-card-info">
                <h2>${person.name} <span>${person.age}</span></h2>
                <p>📍 ${person.loc}</p>
                ${tagsHtml}
            </div>
        `;
        return card;
    }

    function renderCards() {
        if (!PS_DOM.swipeStack) return;
        PS_DOM.swipeStack.innerHTML = '';
        
        if(index >= candidates.length) {
            showEmptyState();
            return;
        }

        if (index > 0) {
            const prevPerson = candidates[index - 1];
            PS_DOM.swipeStack.appendChild(createCard(prevPerson, 'left'));
        }

        const centerPerson = candidates[index];
        PS_DOM.swipeStack.appendChild(createCard(centerPerson, 'center'));

        if (index + 1 < candidates.length) {
            const rightPerson = candidates[index + 1];
            PS_DOM.swipeStack.appendChild(createCard(rightPerson, 'right'));
        }
    }

    function showEmptyState() {
        if(PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'none';
        if(PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.add('active');
    }

    function handleSwipe(action) {
        if(isSwiping) return;

        // BLOCK IF NO SWIPES LEFT
        if (dailySwipes <= 0) {
            fireEmptyAlert();
            return;
        }

        const card = document.getElementById('activeSwipeCard');
        if(!card) return;

        isSwiping = true; 

        // Decrement and Save
        dailySwipes--;
        saveData(); // Save new count to local storage
        updateStats(dailySwipes, 20);

        if(action === 'like') {
            card.classList.add('anim-like');
            showToast('Liked!');
        } else if (action === 'super') {
            card.classList.add('anim-super');
            showToast('Super Liked!');
        } else {
            card.classList.add('anim-pass');
            showToast('Passed');
        }

        setTimeout(() => {
            index++;
            renderCards();
            isSwiping = false; 
        }, 300);
    }

    if(PS_DOM.btnSwipeLike) PS_DOM.btnSwipeLike.addEventListener('click', () => handleSwipe('like'));
    if(PS_DOM.btnSwipePass) PS_DOM.btnSwipePass.addEventListener('click', () => handleSwipe('pass'));
    if(PS_DOM.btnSwipeSuper) PS_DOM.btnSwipeSuper.addEventListener('click', () => handleSwipe('super'));

    return { init };
})();

// ---------------------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------------------
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

function switchTab(panelName) {
    localStorage.setItem('ps_last_tab', panelName);

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

    if(PS_DOM.sidebar.classList.contains('ps-is-open')) {
        PS_DOM.sidebar.classList.remove('ps-is-open');
    }
}

function initMobileMenu() {
    if(PS_DOM.mobileMenuBtn) {
        PS_DOM.mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (PS_DOM.momentsPopup) PS_DOM.momentsPopup.classList.remove('ps-is-open');
            if (PS_DOM.sidebar) PS_DOM.sidebar.classList.toggle('ps-is-open');
        });
    }
    if(PS_DOM.mobileMomentsBtn) {
        PS_DOM.mobileMomentsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (PS_DOM.sidebar) PS_DOM.sidebar.classList.remove('ps-is-open');
            if (PS_DOM.momentsPopup) PS_DOM.momentsPopup.classList.toggle('ps-is-open');
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
        for(let i=0; i<40; i++) pts.push({
            x:Math.random()*W, y:Math.random()*H, 
            vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5
        }); 
    }

    function loop() { 
        ctx.clearRect(0,0,W,H); 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; 
        pts.forEach(p => { 
            p.x += p.vx; p.y += p.vy; 
            if(p.x<0 || p.x>W) p.vx*=-1; 
            if(p.y<0 || p.y>H) p.vy*=-1; 
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill(); 
        }); 
        requestAnimationFrame(loop); 
    }
    window.addEventListener('resize', resize); 
    resize(); loop();
}

function updateStats(curr, max) {
    if(PS_DOM.countDisplay) PS_DOM.countDisplay.textContent = curr;
    if(PS_DOM.ringCircle) {
        const percent = curr / max;
        PS_DOM.ringCircle.style.strokeDasharray = 314; 
        PS_DOM.ringCircle.style.strokeDashoffset = 314 - (314 * percent);
    }
}