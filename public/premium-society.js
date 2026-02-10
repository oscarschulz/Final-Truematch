// mula sa core.js

// assets/js/premium-society/core.js

// ==========================================
// 1. LANDMARKS (DOM SELECTORS)
// ==========================================

export const PS_DOM = {
  layout: document.getElementById("psMainLayout"),
  loader: document.getElementById("app-loader"),
  tabs: document.querySelectorAll(".ps-nav-btn"),
  panels: document.querySelectorAll(".ps-panel[data-panel]"),
  sidebar: document.getElementById("psMainSidebar"),

  // Header
  headerAvatar: document.getElementById("psHeaderAvatar"),
  headerName: document.getElementById("psWelcomeName"),

  // Containers
  dailyPickContainer: document.getElementById("psDailyPickContainer"),
  storiesContainer: document.getElementById("psStoriesContainer"),
  admirerContainer: document.getElementById("psAdmirerContainer"),
  admirerCount: document.getElementById("psAdmirerCount"),

  // Matches Containers
  matchesContainer: document.getElementById("psMatchesContainer"),
  newMatchesRail: document.getElementById("psNewMatchesRail"),
  newMatchCount: document.getElementById("psNewMatchCount"),

  activeNearbyContainer: document.getElementById("psActiveNearbyContainer"),

  // Chat Window
  chatWindow: document.getElementById("psChatWindow"),
  btnCloseChat: document.getElementById("psBtnCloseChat"),
  chatAvatar: document.getElementById("psChatAvatar"),
  chatName: document.getElementById("psChatName"),
  chatBody: document.getElementById("psChatBody"),
  chatInput: document.getElementById("psChatInput"),
  chatEmojiPicker: document.getElementById("psChatEmojiPicker"),

  // Story Viewer
  storyViewer: document.getElementById("psStoryViewer"),
  btnCloseStory: document.getElementById("psBtnCloseStory"),
  storyFullImg: document.getElementById("psStoryImageDisplay"),
  storyName: document.getElementById("psStoryName"),
  storyAvatar: document.getElementById("psStoryAvatar"),
  storyProgress: document.getElementById("psStoryProgress"),
  storyCommentInput: document.getElementById("psStoryCommentInput"),
  storyEmojiPicker: document.getElementById("psStoryEmojiPicker"),

  // Add Story Modal
  addStoryModal: document.getElementById("psAddStoryModal"),
  storyInput: document.getElementById("psStoryInput"),

  // Mini Profile & Settings Identity
  miniAvatar: document.getElementById("psMiniAvatar"),
  miniName: document.getElementById("psMiniName"),
  miniPlan: document.getElementById("psMiniPlan"),
  miniLogout: document.getElementById("ps-btn-logout"),
  settingsName: document.getElementById("psSNameDisplay"),
  settingsEmail: document.getElementById("psSEmailDisplay"),
  settingsAvatar: document.getElementById("psSAvatar"),
  settingsPlanBadge: document.getElementById("psSPlanBadge"),

  // Refresh Popover
  refreshPopover: document.getElementById("psRefreshPopover"),
  btnRefreshDeck: document.getElementById("psBtnRefreshDeck"),

  // Mobile Toggles
  mobileMenuBtn: document.getElementById("psMobileNavToggle"),
  mobileMomentsBtn: document.getElementById("psMobileMomentsToggle"),
  momentsPopup: document.getElementById("psMomentsPopup"),

  // Swipe
  swipeStack: document.getElementById("psSwipeStack"),
  swipeControls: document.getElementById("psSwipeControls"),
  btnSwipePass: document.getElementById("psBtnSwipePass"),
  btnSwipeLike: document.getElementById("psBtnSwipeLike"),
  btnSwipeSuper: document.getElementById("psBtnSwipeSuper"),

  // Stats & Toast
  ringCircle: document.getElementById("psStatsRingCircle"),
  countDisplay: document.getElementById("psStatsCountDisplay"),
  toast: document.getElementById("ps-toast"),

  // Mobile Specific
  mobileSwipeBadge: document.getElementById("psMobileSwipeCount"),
  timerDisplay: document.querySelector(".ps-stats-body p.ps-tiny"),

  // Panels
  panelCreatorsBody: document.getElementById("ps-panel-creators"),
  panelPremiumBody: document.getElementById("ps-panel-premium"),

  // Match & Gift
  matchOverlay: document.getElementById("psMatchOverlay"),
  matchUserImg: document.getElementById("psMatchUserImg"),
  matchTargetImg: document.getElementById("psMatchTargetImg"),
  matchName: document.getElementById("psMatchName"),
  giftModal: document.getElementById("psGiftModal"),
  btnPPV: document.querySelector(".ps-btn-ppv"),
  giftPriceBtn: document.getElementById("psGiftPriceBtn"),
};

// --- API BASE ---
// Production (https://itruematch.com): use same-origin (relative) requests.
// Local file testing (file://): fallback to http://localhost:3000.
// You can also override by setting window.API_BASE in the HTML.
const IS_FILE_PROTOCOL = location.protocol === 'file:';
const API_BASE = (typeof window !== 'undefined' && window.API_BASE)
  ? String(window.API_BASE).replace(/\/$/, '')
  : (IS_FILE_PROTOCOL ? 'http://localhost:3000' : '');

// ==========================================
// 2. GLOBAL STATE
// ==========================================
const PS_STATE = {
  me: null,
  swipeInited: false,
  premiumSociety: {
    eligible: false,
    approved: false,
    status: 'none'
  }
};

function psNormalizePlanKey(rawPlan) {
    const v = String(rawPlan || '').trim().toLowerCase();
    if (v === 'elite' || v === 'tier2' || v === '2') return 'tier2';
    if (v === 'concierge' || v === 'tier3' || v === '3') return 'tier3';
    return 'free';
}

function psPlanLabelFromKey(planKey) {
    const key = psNormalizePlanKey(planKey);
    if (key === 'tier2') return 'Elite Member';
    if (key === 'tier3') return 'Concierge Member';
    return 'Free Account';
}

function psHydratePremiumSocietyState(me) {
    const planKey = psNormalizePlanKey(me?.plan || me?.tier);
    const status = (me?.premiumStatus || 'none').toLowerCase();
    
    PS_STATE.premiumSociety.eligible = (planKey === 'tier2' || planKey === 'tier3');
    PS_STATE.premiumSociety.approved = (PS_STATE.premiumSociety.eligible && status === 'approved');
    PS_STATE.premiumSociety.status = status;
}
// ==========================================
// 3. BACKEND SYNC: IDENTITY
// ==========================================
async function hydrateAccountIdentity() {
    console.log("🔄 Syncing Identity with Server (Port 3000)...");
    try {
        const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' }); 
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok && data.user) {
                const u = data.user;
                PS_STATE.me = u; 
                psHydratePremiumSocietyState(u);

                // --- ROBUST NAME LOGIC MULA SA LUMA ---
                const displayName = (
                    u.name || u.fullName || u.displayName || u.username ||
                    (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : "") ||
                    u.applicantName || "Member"
                ).trim();

                const planKey = psNormalizePlanKey(u.plan || u.tier);
                let planLabel = psPlanLabelFromKey(planKey);
                if (u.planActive === false && planKey !== 'free') planLabel += " (Inactive)";
                const avatarUrl = u.avatarUrl || u.photoUrl || u.avatar || 'assets/images/truematch-mark.png';

                const els = {
                    'psWelcomeName': displayName,
                    'psMiniName': displayName,
                    'psMiniPlan': planLabel,
                    'psSNameDisplay': displayName,
                    'psSEmailDisplay': u.email || '',
                    'psSPlanBadge': planLabel
                };
                for (const [id, val] of Object.entries(els)) {
                    const el = document.getElementById(id);
                    if (el) el.textContent = val;
                }

                // Header status: show active plan + online
                const headerStatus = document.querySelector('.ps-header-status');
                if (headerStatus) {
                    headerStatus.innerHTML = `<span class="ps-dot-green"></span> ${planLabel} • Active Now`;
                }

['psHeaderAvatar', 'psMiniAvatar', 'psSAvatar', 'psMatchUserImg', 'psStoryAvatar'].forEach(id => {
                    const img = document.getElementById(id);
                    if (img) img.src = avatarUrl;
                });

                localStorage.setItem('tm_user', JSON.stringify(u));
                return u; 
            }
        }
    } catch (e) { 
        console.error("❌ Connection failed to server. Checking local cache..."); 
    }

    const localUser = JSON.parse(localStorage.getItem('tm_user'));
    if (localUser) {
        PS_STATE.me = localUser;
        psHydratePremiumSocietyState(localUser);
        return localUser;
    }
    return null;
}

// ==========================================
// 4. UTILITIES
// ==========================================
export function getRandomColor() {
  const colors = ["#00aff0", "#ff3366", "#3ad4ff", "#800080", "#00ff88", "#333"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function showToast(msg) {
  if (!PS_DOM.toast) return;
  PS_DOM.toast.innerHTML = `<i class="fa-solid fa-fire"></i> ${msg}`;
  PS_DOM.toast.classList.add("active");
  setTimeout(() => PS_DOM.toast.classList.remove("active"), 3000);
}

// ==========================================
// 5. SIDEBAR LOGIC
// ==========================================
export function initSidebarLogic() {
  console.log("Sidebar Module Loaded");
  initProfileMenu();
  initRightSidebarInteractions();
  initMobileToggles();
  initOverlayObservers();
}

function initOverlayObservers() {
  const body = document.body;
  const chatWindow = document.getElementById("psChatWindow");
  if (chatWindow) {
    const chatObs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === "class") {
          if (chatWindow.classList.contains("active")) body.classList.add("ps-chat-open");
          else body.classList.remove("ps-chat-open");
        }
      });
    });
    chatObs.observe(chatWindow, { attributes: true });
  }

  const creatorModal = document.getElementById("psCreatorProfileModal");
  if (creatorModal) {
    const creatorObs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === "class") {
          if (creatorModal.classList.contains("active")) body.classList.add("ps-creator-open");
          else body.classList.remove("ps-creator-open");
        }
      });
    });
    creatorObs.observe(creatorModal, { attributes: true });
  }
}

function initProfileMenu() {
  const profileBtn = document.querySelector('.ps-mini-profile');
  const menuPopup = document.getElementById('psUserMenuPopup');
  if (!profileBtn || !menuPopup) return;

  // Ensure the whole card is clickable
  profileBtn.style.pointerEvents = 'auto';
  profileBtn.setAttribute('type', 'button');

  const escapeHtml = (val) =>
    String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const DEFAULT_AVATAR =
    'data:image/svg+xml;base64,' +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <rect width="64" height="64" rx="20" fill="#0B1220"/>
        <circle cx="32" cy="26" r="10" fill="#22D3EE"/>
        <path d="M14 54c3-10 13-16 18-16s15 6 18 16" fill="#1E293B"/>
      </svg>`
    );

  const getUiIdentity = () => {
    const me = (window.PS_STATE && window.PS_STATE.me) ? window.PS_STATE.me : null;

    const name =
      (me && (me.name || me.displayName || me.fullName || me.username)) ||
      document.getElementById('psMiniName')?.textContent?.trim() ||
      'User';

    const avatar =
      (me && (me.avatar || me.photoURL || me.photoUrl || me.profilePhoto || me.profilePhotoUrl)) ||
      DEFAULT_AVATAR;

    return { name, avatar };
  };

  const closeMenu = () => {
    profileBtn.setAttribute('aria-expanded', 'false');
    menuPopup.classList.remove('active');
  };

  const renderMenu = () => {
    const ui = getUiIdentity();

    menuPopup.innerHTML = `
      <div class="ps-menu-item ps-menu-current">
        <img src="${ui.avatar}" style="width:35px; height:35px; border-radius:50%; border:2px solid #00aff0;">
        <div style="display:flex; flex-direction:column; line-height:1.2;">
          <span style="font-weight:700; font-size:0.9rem; color:#fff;">${escapeHtml(ui.name)}</span>
          <span style="font-size:0.7rem; color:#00ff88;">● Active</span>
        </div>
        <i class="fa-solid fa-check" style="margin-left:auto; color:#00ff88;"></i>
      </div>

      <div class="ps-menu-item" data-action="dashboard">
        <i class="fa-solid fa-arrow-left" style="color:#00aff0;"></i> <span>Go back to Dashboard</span>
      </div>

      <div class="ps-menu-item ps-menu-logout" data-action="logout">
        <i class="fa-solid fa-right-from-bracket"></i> <span>Log out</span>
      </div>
    `;
  };

  // Toggle menu on click
  profileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = menuPopup.classList.contains('active');
    if (isOpen) {
      closeMenu();
      return;
    }

    renderMenu();
    profileBtn.setAttribute('aria-expanded', 'true');
    menuPopup.classList.add('active');
  });

  // Handle menu actions (event delegation)
  menuPopup.addEventListener('click', async (e) => {
    const item = e.target.closest('.ps-menu-item');
    if (!item) return;

    const action = item.getAttribute('data-action');
    if (!action) return;

    if (action === 'dashboard') {
      closeMenu();
      window.location.href = 'dashboard.html';
      return;
    }

    if (action === 'logout') {
      closeMenu();
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (_) {}

      try {
        localStorage.removeItem('tm_user');
        localStorage.removeItem('tm_session');
        localStorage.removeItem('ps_accounts');
        localStorage.removeItem('ps_current_user');
      } catch (_) {}

      window.location.href = 'auth.html';
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!menuPopup.classList.contains('active')) return;
    if (profileBtn.contains(e.target) || menuPopup.contains(e.target)) return;
    closeMenu();
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}



function initRightSidebarInteractions() {
  const upgradeBtn = document.getElementById("psBtnSidebarSubscribe");
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", () => {
      const premiumTab = document.querySelector('button[data-panel="premium"]');
      if (premiumTab) { premiumTab.click(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
  }
}

function initMobileToggles() {
  if (PS_DOM.mobileMenuBtn) {
    PS_DOM.mobileMenuBtn.onclick = (e) => { e.stopPropagation(); if (PS_DOM.sidebar) PS_DOM.sidebar.classList.toggle("ps-is-open"); };
  }
  document.addEventListener("click", (e) => {
    if (PS_DOM.sidebar && PS_DOM.sidebar.classList.contains("ps-is-open")) {
      if (!PS_DOM.sidebar.contains(e.target) && e.target !== PS_DOM.mobileMenuBtn) PS_DOM.sidebar.classList.remove("ps-is-open");
    }
  });
}
//mula sa swipe.js
// assets/js/premium-society/swipe.js

// ==========================================
// 3. SWIPE LOGIC (FIXED: With Random Refresh)
// ==========================================
// ==========================================
export const SwipeController = (() => {
  let candidates = [];
  let index = 0;
  let dailySwipes = 20;
  let resetTime = 0;
  let isSwiping = false;

  // Touch Handling Variables
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let currentX = 0;

  /**
   * INITIALIZATION
   */
  function init() {
    index = 0;
    
    // Load local cache as backup
    const savedSwipes = localStorage.getItem("ps_swipes_left");
    const savedTime = localStorage.getItem("ps_reset_time");
    const now = Date.now();

    if (savedTime && now < parseInt(savedTime)) {
      dailySwipes = parseInt(savedSwipes);
      resetTime = parseInt(savedTime);
    } else {
      dailySwipes = 20;
      resetTime = now + 12 * 60 * 60 * 1000;
      saveData();
    }

    startCountdown();
    
    if (PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove("active");
    if (PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = "flex";

    // Unahin ang stats local habang nag-fe-fetch
    updateStats(dailySwipes, 20);
    
    // Tawagin ang backend data
    fetchCandidates();

    // Button Listeners
    if (PS_DOM.btnRefreshDeck) PS_DOM.btnRefreshDeck.onclick = refreshDeck;
    if (PS_DOM.btnSwipeLike) PS_DOM.btnSwipeLike.onclick = () => handleSwipe("like");
    if (PS_DOM.btnSwipePass) PS_DOM.btnSwipePass.onclick = () => handleSwipe("pass");
    if (PS_DOM.btnSwipeSuper) PS_DOM.btnSwipeSuper.onclick = () => handleSwipe("super");

    initTouchEvents();
  }

  /**
   * GESTURE LOGIC
   */
// ==========================================
  // START: UNIFIED GESTURE LOGIC (Phase 4)
  // ==========================================
  function initTouchEvents() {
    const stack = PS_DOM.swipeStack;
    if (!stack) return;

    // --- SHARED HANDLERS ---
    const startDrag = (x, y) => {
      if (isSwiping) return;
      startX = x;
      startY = y;
      isDragging = true;

      const card = document.getElementById("activeSwipeCard");
      if (card) card.style.transition = "none";
    };

    const moveDrag = (x, y) => {
      if (!isDragging || isSwiping) return;
      currentX = x - startX;
      let currentY = y - startY;

      const card = document.getElementById("activeSwipeCard");
      if (card) {
        // Ginagamit ang transition logic mula sa current code mo
        card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${currentX / 15}deg)`;
      }
    };

    const endDrag = () => {
      if (!isDragging || isSwiping) return;
      isDragging = false;

      // Threshold check mula sa current code mo
      if (currentX > 100) {
        handleSwipe("like");
      } else if (currentX < -100) {
        handleSwipe("pass");
      } else {
        const card = document.getElementById("activeSwipeCard");
        if (card) {
          card.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
          card.style.transform = "translateX(0) scale(1)";
        }
      }
      currentX = 0;
    };

    // --- MOBILE LISTENERS ---
    stack.addEventListener("touchstart", (e) => {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    stack.addEventListener("touchmove", (e) => {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    stack.addEventListener("touchend", endDrag);

    // --- DESKTOP LISTENERS (Dating wala sa bago mong JS) ---
    stack.addEventListener("mousedown", (e) => {
      startDrag(e.clientX, e.clientY);
    });

    // Sa window ito naka-attach para kahit lumabas ang mouse sa card, tuloy ang drag
    window.addEventListener("mousemove", (e) => {
      if (isDragging) moveDrag(e.clientX, e.clientY);
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) endDrag();
    });
  }
  // ==========================================
  // END: UNIFIED GESTURE LOGIC
  // ==========================================

  /**
   * BACKEND INTEGRATION
   */
  async function fetchCandidates() {
    try {
      const res = await fetch(`${API_BASE}/api/premium-society/candidates`, { credentials: 'include' });
      const data = await res.json();

      if (data && data.ok && data.candidates) {
        candidates = data.candidates;
        dailySwipes = data.remaining;
        updateStats(data.remaining, data.limit || 20);
      } else { 
        throw new Error("No live data"); 
      }
    } catch (err) {
      console.warn("Using fallback profiles.");
      candidates = window.mockCandidatesData || [];
    }
    renderCards();
  }

  /**
   * SWIPE ACTION HANDLER
   */
// ==========================================
  // START: SWIPE RESULT LOGIC (Phase 5)
  // ==========================================
/**
   * SWIPE ACTION HANDLER (PHASE 8 - FULL BACKEND SYNC)
   * Pinagsamang momentum UI at strict backend logic mula sa copy.js
   */
  async function handleSwipe(action) {
    if (isSwiping || index >= candidates.length) return;
    
    // Initial guard: Huwag ituloy kung alam na nating ubos na ang limit
    if (dailySwipes <= 0 && action !== 'pass') {
      fireEmptyAlert();
      return;
    }

    const currentCandidate = candidates[index];
    const card = document.getElementById("activeSwipeCard");
    if (!card) return;

    isSwiping = true;

    // 1. UI ANIMATION: Momentum swipe mula sa bago mong UI
    card.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s";
    if (action === "like") card.classList.add("anim-like");
    else if (action === "super") card.classList.add("anim-super");
    else card.classList.add("anim-pass");

    // 2. BACKEND SYNC (Node.js Port 3000)
    try {
      const res = await fetch(`${API_BASE}/api/premium-society/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          targetEmail: currentCandidate.id || currentCandidate.email, 
          action: action 
        })
      });

      const data = await res.json();

      // A. CHECK SERVER LIMIT: Revert card kung sinabi ng server na bawal na
      if (data.limitReached || (data.ok === false && String(data.message || '').includes('limit'))) {
        showToast("Daily swipe limit reached! 🛑");
        // ERROR REVERT: Ibalik ang card sa gitna
        card.style.transition = "transform 0.3s ease";
        card.classList.remove("anim-like", "anim-super", "anim-pass");
        card.style.transform = "";
        card.style.opacity = "1";
        isSwiping = false;
        return;
      }

      // B. MATCH FEEDBACK: Trigger UI Overlay at Swal alert
      if (data.isMatch) {
        if (window.triggerMatchOverlay) {
          window.triggerMatchOverlay(currentCandidate);
        }
        Swal.fire({
          title: "It's a Match! ✨",
          text: `You and ${currentCandidate.name} liked each other.`,
          icon: 'success',
          background: '#15151e',
          color: '#fff',
          confirmButtonColor: '#00aff0'
        });
      }
      
      // C. SYNC STATS: Kunin ang "truth" mula sa server (Handle null as unlimited)
      if (data.remaining !== undefined) {
        dailySwipes = data.remaining;
        updateStats(data.remaining, data.limit); // data.limit can be null for unlimited
      }

    } catch (err) {
      console.error("❌ Sync failed:", err);
      
      // ERROR REVERSION: Ibalik ang card
      card.style.transition = "transform 0.3s ease";
      card.classList.remove("anim-like", "anim-super", "anim-pass");
      card.style.transform = "";
      card.style.opacity = "1";

      const msg = String(err && err.message ? err.message : err || '');
      
      // Specific Error Messages mula sa lumang logic
      if (msg.includes('not_premium')) {
        showToast("Premium access required for Premium Society swipes.");
      } else {
        showToast("Server Error. Card reverted.");
      }

      isSwiping = false;
      return;
    }

    saveData(); // I-save ang local state

    // 3. MOVE TO NEXT CARD
    setTimeout(() => {
      index++;
      renderCards();
      isSwiping = false;
    }, 350);
  }
  // ==========================================
  // END: SWIPE RESULT LOGIC
  // ==========================================

  /**
   * UI RENDERING
   */
/**
 * RENDER CARDS
 * Inayos para magkaroon ng Button Guard at Empty State handling
 */
function renderCards() {
  if (!PS_DOM.swipeStack) return;
  PS_DOM.swipeStack.innerHTML = "";

  const btns = [PS_DOM.btnSwipePass, PS_DOM.btnSwipeSuper, PS_DOM.btnSwipeLike].filter(Boolean);

  // 1. CHECK KUNG EMPTY NA ANG DECK
  if (index >= candidates.length) {
    showEmptyState();
    
    // BUTTON GUARD: Itago at i-disable ang buttons
    if (PS_DOM.swipeControls) {
      PS_DOM.swipeControls.style.display = "none";
      PS_DOM.swipeControls.style.opacity = "0";
      PS_DOM.swipeControls.style.pointerEvents = "none";
    }
    
    btns.forEach(b => {
      b.style.display = 'none';
      b.disabled = true;
      b.setAttribute('aria-disabled', 'true');
    });
    
    return;
  }

  // 2. KUNG MAY LAMAN: Ipakita ang Controls at Buttons
  if (PS_DOM.swipeControls) {
    PS_DOM.swipeControls.style.display = "flex";
    PS_DOM.swipeControls.style.opacity = "1";
    PS_DOM.swipeControls.style.pointerEvents = "auto";
  }

  btns.forEach(b => {
    b.style.display = 'flex';
    b.disabled = false;
    b.setAttribute('aria-disabled', 'false');
  });

  // 3. RENDER CARDS (Stacking Logic)
  // Card sa ilalim (Next profile)
  if (index + 1 < candidates.length) {
    PS_DOM.swipeStack.appendChild(createCard(candidates[index + 1], "right"));
  }
  
  // Main Card (Active profile)
  const centerPerson = candidates[index];
  PS_DOM.swipeStack.appendChild(createCard(centerPerson, "center"));
}

/**
 * CREATE CARD
 * Optimized for better image rendering and data tracking
 */
function createCard(person, position) {
  const card = document.createElement("div");
  card.className = "ps-swipe-card";
  card.setAttribute("data-pos", position);
  
  // Magdagdag ng email/id for debugging
  card.dataset.id = person.id || person.email || "";

  if (position === "center") card.id = "activeSwipeCard";

  // Image Rendering Logic
  const photo = person.photoUrl || person.avatarUrl || "";
  if (photo && (photo.startsWith('http') || photo.startsWith('assets'))) {
    card.style.backgroundImage = `url('${photo}')`;
    card.style.backgroundSize = "cover";
    card.style.backgroundPosition = "center";
  } else {
    // Fallback Gradient mula sa lumang logic
    const bg = person.color || "#333";
    card.style.background = `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.9) 90%), ${bg}`;
  }

  // Tags rendering
  let tagsHtml = `<div class="ps-swipe-tags">`;
  const tags = Array.isArray(person.tags) ? person.tags : [];
  tags.slice(0, 3).forEach((t) => (tagsHtml += `<span class="ps-tag">${t}</span>`));
  tagsHtml += `</div>`;

  card.innerHTML = `
    <div class="ps-swipe-card-info">
      <h2>${person.name}, ${person.age || person.userAge || '?'}</h2>
      <p><i class="fa-solid fa-location-dot"></i> ${person.loc || person.city || 'Nearby'}</p>
      ${tagsHtml}
    </div>
  `;
  
  return card;
}

  /**
   * UTILITIES
   */
  function refreshDeck() {
    if (PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove("active");
    if (PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = "flex";
    index = 0;
    fetchCandidates();
  }

  function showEmptyState() {
    if (PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = "none";
    if (PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.add("active");
  }

  function saveData() {
    localStorage.setItem("ps_swipes_left", dailySwipes);
    localStorage.setItem("ps_reset_time", resetTime);
  }

function updateStats(curr, max) {
    // Logic mula sa Old JS: limit === null means "unlimited"
    const displayVal = (max === null || max === undefined) ? '∞' : curr;
    
    if (PS_DOM.countDisplay) PS_DOM.countDisplay.textContent = displayVal;
    if (PS_DOM.mobileSwipeBadge) PS_DOM.mobileSwipeBadge.textContent = displayVal;
    
    if (PS_DOM.ringCircle) {
      // Kapag unlimited, gawing full ang ring
      const percent = (max === null || max === undefined) ? 1 : (curr / max);
      PS_DOM.ringCircle.style.strokeDashoffset = 314 - (314 * percent);
    }
}

/**
   * START COUNTDOWN
   * Inayos para maging persistent gamit ang localStorage
   */
  function startCountdown() {
    setInterval(() => {
      const now = Date.now();
      
      // Kunin ang huling reset time mula sa storage (Galing sa lumang backend logic)
      const savedResetTime = parseInt(localStorage.getItem("ps_reset_time"));
      
      // Kung wala pang saved time o tapos na ang 12 hours, mag-set ng bago
      if (!savedResetTime || now >= savedResetTime) {
        dailySwipes = 20;
        resetTime = now + 12 * 60 * 60 * 1000; // 12 Hours reset cycle
        saveData(); // I-save agad ang dailySwipes at resetTime sa localStorage
        updateStats(dailySwipes, 20);
      } else {
        resetTime = savedResetTime;
      }

      const diff = resetTime - now;
      if (diff > 0) {
        const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        
        if (PS_DOM.timerDisplay) {
          // Format: Resets in 11h 59m 59s
          PS_DOM.timerDisplay.textContent = `Resets in ${hrs}h ${mins}m ${secs}s`;
        }
      }
    }, 1000);
  }

  /**
   * FIRE EMPTY ALERT
   * Alert kapag naubos ang daily swipes
   */
  function fireEmptyAlert() {
    const msg = "You’ve hit today’s swipe limit. It will reset automatically.";
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Out of Swipes 🛑",
        text: msg,
        icon: "warning",
        background: "#15151e",
        color: "#fff",
        confirmButtonColor: "#00aff0",
        confirmButtonText: "Okay",
      });
    } else {
      alert(msg);
    }
  }

  // I-expose ang init function para matawag sa core engine
  return { init };
})();

// --- END OF SWIPE CONTROLLER ---
//at mula sa UI.js
// assets/js/premium-society/ui.js

// EXPOSE TOAST GLOBALLY
window.showToast = showToast;

// --- GLOBAL STATE ---
let conversationHistory =
  JSON.parse(localStorage.getItem("ps_chat_history")) || {};

function saveHistory() {
  localStorage.setItem("ps_chat_history", JSON.stringify(conversationHistory));
}


// ==========================================
export async function initUI() {
  console.log("🚀 iTrueMatch Engine: Syncing...");

  // 1. Priority: Identity Sync sa Node.js
  const user = await hydrateAccountIdentity();
  
  // 2. Initialize Components
  initCanvasParticles();
  initNavigation();

  // Remove Stories/Recent Moments rail (not needed on Premium Society)
  const _momentsRail = document.querySelector('.ps-moments-rail-section');
  if (_momentsRail) _momentsRail.remove();
  initNotifications();
  initChat();
  // (Removed) Story viewer for Premium Society
  initCreatorProfileModal();
  initCreatorsLogic();
  initPremiumLogic();
  initProfileEditLogic();
  initSettingsLogic();
  initGlobalSwipeBack();

  // 3. Render Sections (Backend-ready)
  // Papalitan mo ito ng "await fetchFromBackend()" pagkatapos
  // (Removed) Stories rail for Premium Society
  renderMessages([]);
  renderAdmirers([]);

  // 4. Tab Restoration
  const lastTab = localStorage.getItem("ps_last_tab") || "home";
  switchTab(lastTab);

  // PPV/Gift trigger binding
  if (PS_DOM.btnPPV) {
    PS_DOM.btnPPV.onclick = () => {
      if (PS_DOM.giftModal) PS_DOM.giftModal.classList.add("active");
    };
  }
}

// ==========================================
// UI RENDERERS (Clean & Modular)
// ==========================================

// 1. Render Stories
function renderStories(stories = []) {
    if (!PS_DOM.storiesContainer) return;
    
    // Add Button (Static)
    const addBtn = `
    <div class="ps-story-item" onclick="openAddStory()">
        <div class="ps-story-ring" style="border-color: #444; border-style: dashed; padding: 3px;">
            <div style="width:100%; height:100%; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <i class="fa-solid fa-plus" style="color:#00aff0; font-size:1.2rem;"></i>
            </div>
        </div>
        <span class="ps-story-name">Add Story</span>
    </div>`;

    // Dynamic Stories Loop
    const storyHtml = stories.map(s => `
    <div class="ps-story-item" onclick="openStory('${s.name}', '${s.color || '#00aff0'}')">
        <div class="ps-story-ring" style="border-color: ${s.color || '#00aff0'}">
            <img class="ps-story-img" src="${s.avatar || 'assets/images/truematch-mark.png'}" style="background:${s.color || '#333'}">
        </div>
        <span class="ps-story-name">${s.name}</span>
    </div>`).join("");

    PS_DOM.storiesContainer.innerHTML = addBtn + storyHtml;
}

// 2. Render Messages
function renderMessages(messages = []) {
    if (!PS_DOM.matchesContainer) return;

    if (messages.length === 0) {
        PS_DOM.matchesContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">No messages yet. Start swiping!</div>`;
        return;
    }

    PS_DOM.matchesContainer.innerHTML = messages.map(m => `
    <div class="ps-message-item ${m.unread ? "unread" : ""}" onclick="openChat('${m.name}')">
        <div class="ps-msg-avatar-wrapper">
            <img class="ps-msg-avatar" src="${m.avatar || 'assets/images/truematch-mark.png'}">
            <div class="ps-online-badge"></div>
        </div>
        <div class="ps-msg-content">
            <div class="ps-msg-header">
                <span class="ps-msg-name">${m.name}</span>
                <span class="ps-msg-time">${m.time}</span>
            </div>
            <span class="ps-msg-preview">${m.text}</span>
        </div>
    </div>`).join("");
}

// 3. Render Admirers
function renderAdmirers(admirers = []) {
    if (!PS_DOM.admirerContainer) return;
    
    if (admirers.length === 0) {
        PS_DOM.admirerContainer.innerHTML = `<div style="grid-column:span 3; text-align:center; color:#666; font-size:0.8rem;">No admirers yet. Boost your profile!</div>`;
        if (PS_DOM.admirerCount) PS_DOM.admirerCount.innerText = "0";
        return;
    }

    // Update the count badge
    if (PS_DOM.admirerCount) PS_DOM.admirerCount.innerText = `${admirers.length} New`;

    // Render cards with Lock Icon and Click-to-Upgrade interaction
    PS_DOM.admirerContainer.innerHTML = admirers.map(a => `
    <div class="ps-admirer-card" onclick="window.openAdmirersInfo && window.openAdmirersInfo()" style="cursor:pointer;">
        <div class="ps-admirer-icon"><i class="fa-solid fa-lock"></i></div> <img class="ps-admirer-img" src="assets/images/truematch-mark.png" style="background:${a.color || getRandomColor()}">
        <h4 style="margin:5px 0 0; font-size:0.85rem;">${a.name || 'Secret'}</h4>
        <p class="ps-tiny ps-muted" style="margin:0;">${a.loc || 'Nearby'}</p>
    </div>`).join("");
}
// ==========================================
// 1. THE GLOBAL GESTURE ENGINE (Swipe Back)
// ==========================================
export function initGlobalSwipeBack() {
  console.log("Global Swipe Engine: Ready");
  let startX = 0;
  let startY = 0;
  let isChatOpenAtStart = false;

  document.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    // Memory: Check agad kung bukas ang chat sa simula ng swipe
    isChatOpenAtStart = document.body.classList.contains("ps-chat-open");
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;
    let diffX = endX - startX;
    let diffY = endY - startY;

    // Threshold: Swipe right > 80px at horizontal movement lang
    if (diffX > 80 && Math.abs(diffX) > Math.abs(diffY)) {
      if (isChatOpenAtStart) {
        console.log("Closing chat via Swipe...");
        if (window.closeChat) window.closeChat();
        return; 
      }

      // NAVIGATION BACK: Bumalik sa Home kung nasa ibang tab
      const activePanel = document.querySelector(".ps-panel.ps-is-active");
      if (activePanel) {
        const currentTab = activePanel.dataset.panel;
        if (currentTab !== "home" && currentTab !== "swipe") {
          const homeBtn = document.querySelector('button[data-panel="home"]');
          if (homeBtn) {
            homeBtn.click();
            showToast("Back to Home");
          }
        }
      }
    }
  }, { passive: true });
}

// ==========================================
// 2. SETTINGS LOGIC (BACKEND INTEGRATED)
// ==========================================
export function initSettingsLogic() {
  console.log("Settings Logic (Integrated) Initialized");

  // --- A. DOM ELEMENTS ---
  const distInput = document.getElementById("psRangeDist");
  const distVal = document.getElementById("psDistVal");
  const ageInput = document.getElementById("psRangeAge");
  const ageVal = document.getElementById("psAgeVal");
  const toggles = document.querySelectorAll(".ps-setting-toggle, .ps-switch-cyan input, .ps-switch-mini input");

  if (!distInput || !ageInput) return;

  // --- B. BACKEND IDENTITY & LOADING ---
  const me = (() => {
    try { return JSON.parse(localStorage.getItem('tm_user')); } catch (e) { return null; }
  })();
  const email = me?.email || null;

  // LOAD SAVED PREFS: I-load ang settings galing sa session storage/cloud
  if (email && typeof loadPrefsForUser === 'function') {
    const prefs = loadPrefsForUser(email) || {};
    if (prefs.distanceKm != null) {
      distInput.value = prefs.distanceKm;
      if (distVal) distVal.textContent = prefs.distanceKm;
    }
    if (prefs.maxAge != null) {
      ageInput.value = prefs.maxAge;
      if (ageVal) ageVal.textContent = prefs.maxAge;
    }
  }

  // --- C. PERSISTENCE SAVE ACTION ---
// ==========================================
  // START: SETTINGS CLOUD SYNC (Phase 2)
  // ==========================================

  // 1. Debounce Helper (Para hindi flood ang request sa server)
  function debounce(func, wait = 500) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // 2. Updated Persist Action (Async with Cloud Sync)
  const persistSettings = async () => {
    if (!email) return;

    const nextPrefs = {
      distanceKm: Number(distInput.value),
      maxAge: Number(ageInput.value),
    };

    // A. Local Save (Backup)
    if (typeof savePrefsForUser === 'function') {
      savePrefsForUser(email, nextPrefs);
    }

    // B. Cloud Sync (Laravel Backend)
    try {
      const res = await fetch(`${API_BASE}/api/me/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(nextPrefs)
      });

      if (res.ok) {
        showToast("Preferences synced to cloud ☁️✨");
      } else {
        throw new Error("Server Error");
      }
    } catch (e) {
      console.error("Cloud Sync Failed:", e);
      showToast("Saved locally (Sync error)");
    }
  };

  // Gamitin ang debounce para sa 'input' event pero save agad sa 'change'
  const debouncedPersist = debounce(persistSettings, 800);

  // --- D. EVENT LISTENERS (Sliders & Toggles) ---
  distInput.addEventListener("input", (e) => { 
    if (distVal) distVal.textContent = e.target.value; 
    debouncedPersist(); // Sync habang hinihila
  });
  distInput.addEventListener("change", persistSettings); // Siguradong save pagbitaw

  ageInput.addEventListener("input", (e) => { 
    if (ageVal) ageVal.textContent = e.target.value; 
    debouncedPersist(); // Sync habang hinihila
  });
  ageInput.addEventListener("change", persistSettings); // Siguradong save pagbitaw

  toggles.forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const settingName = e.target.dataset.name || "Setting";
      const status = e.target.checked ? "Enabled" : "Disabled";
      
      // Dito mo rin pwedeng i-sync ang toggles sa backend kung may endpoint ka na
      showToast(`${settingName} ${status}`);
    });
  });

  // ==========================================
  // END: SETTINGS CLOUD SYNC
  // ==========================================

  // --- E. SUPPORT & HELP POPUPS ---
  window.openSafetyTips = () => {
    Swal.fire({
      title: '<i class="fa-solid fa-shield-halved" style="color:#00aff0"></i> Safety Guidelines',
      html: `
            <div style="text-align: left; font-size: 0.9rem; line-height: 1.6; color: #ccc;">
                <p>✅ <b>Stay on Platform:</b> Iwas scam, wag lumipat sa ibang apps.</p>
                <p>✅ <b>Verify Profiles:</b> Look for blue checkmarks.</p>
                <p>✅ <b>Meet Publicly:</b> Laging sa mataong lugar makipag-date.</p>
            </div>`,
      background: "#15151e", color: "#fff", confirmButtonColor: "#00aff0",
    });
  };

  window.openPremiumInfo = () => {
    Swal.fire({
      title: '<i class="fa-solid fa-gem" style="color:#FFD700"></i> Premium Society',
      html: `<div style="text-align: left; font-size: 0.85rem; color: #ccc;">
                <p><b>Membership:</b> Auto-renew monthly ang iyong subscription.</p>
                <p><b>Diamonds:</b> Digital gifts are final and non-refundable.</p>
            </div>`,
      background: "#15151e", color: "#fff", confirmButtonColor: "#FFD700",
    });
  };

  window.openBillingInfo = () => {
    Swal.fire({
      title: '<i class="fa-solid fa-receipt"></i> Billing & Refunds',
      html: `<p style="color:#ccc; font-size:0.9rem; text-align:left;">Request refunds within 48 hours via support ticket.</p>`,
      background: "#15151e", color: "#fff", confirmButtonColor: "#333",
    });
  };

  window.openContactSupport = () => {
    Swal.fire({
      title: "Contact Support",
      html: `<input id="ticket-subject" class="swal2-input" placeholder="Subject" style="color:#fff; background:#222; border:1px solid #444;">
             <textarea id="ticket-message" class="swal2-textarea" placeholder="Describe your issue..." style="color:#fff; background:#222; border:1px solid #444; height: 100px;"></textarea>`,
      background: "#15151e", color: "#fff", confirmButtonText: "Send Ticket", confirmButtonColor: "#00aff0", showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) { showToast("Support Ticket Sent! ✨"); }
    });
  };

  // --- F. CACHE ACTION ---
  window.clearAppCache = () => {
    showToast("Clearing Media Cache...");
    setTimeout(() => { showToast("Cache Cleared Successfully ✨"); }, 1200);
  };
}

// ---------------------------------------------------------------------
// EDIT PROFILE LOGIC
// ---------------------------------------------------------------------
/**
 * REFINED PROFILE EDIT LOGIC
 * Para sa lahat ng fields: Name, Email, Occupation, Age, Wealth, etc.
 */
function initProfileEditLogic() {
  const modal = document.getElementById("psEditProfileModal");
  const btnEdit = document.getElementById("psBtnEditProfile");

  // Check kung existing ang elements para iwas error sa console
  if (!modal || !btnEdit) return;

  // 1. MAPPING NG MGA INPUTS (Lahat ng fields sa modal)
  const fields = {
    name: document.getElementById("psInputName"),
    email: document.getElementById("psInputEmail"),
    occupation: document.getElementById("psInputOccupation"),
    age: document.getElementById("psInputAge"),
    wealth: document.getElementById("psInputWealth"),
    income: document.getElementById("psInputIncome"),
    networth: document.getElementById("psInputNetWorth"),
    source: document.getElementById("psInputSource"),
    social: document.getElementById("psInputSocial"),
    reason: document.getElementById("psInputReason"),
  };

  // 2. MAPPING NG DISPLAY ELEMENTS (Yung mga nag-uupdate sa UI dashboard)
  const displayNames = [
    document.getElementById("psSNameDisplay"),
    document.getElementById("psMiniName"),
    document.getElementById("psWelcomeName"),
    document.getElementById("psMenuName"),
  ];
  const displayEmails = [document.getElementById("psSEmailDisplay")];

  // 3. AUTO-LOAD DATA (Kunin ang dating save sa localStorage)
  const savedData = JSON.parse(localStorage.getItem("ps_user_profile"));
  if (savedData) {
    Object.keys(fields).forEach((key) => {
      if (fields[key]) fields[key].value = savedData[key] || "";
    });
    // I-update agad ang UI names at emails base sa saved data
    displayNames.forEach((el) => {
      if (el) el.innerText = savedData.name || "Member";
    });
    displayEmails.forEach((el) => {
      if (el) el.innerText = savedData.email || "user@example.com";
    });
  }

  // 4. OPEN MODAL ACTION
  btnEdit.onclick = (e) => {
    e.preventDefault();
    modal.classList.add("active");
  };

  // 5. GLOBAL CLOSE MODAL FUNCTION
  window.closeEditProfile = () => {
    modal.classList.remove("active");
  };

// ============================================================
  // START: REPLACEMENT CODE (Backend Connected)
  // ============================================================

  // 1. Helper Function: Pang-contact sa Server (Backend)
  async function psTryUpdatePremiumProfile(payload) {
    // Susubukan nito ang mga endpoints na ito para sigurado
    const paths = [
        '/api/me/premium/profile',
        '/api/me/premium/profile/update',
        '/api/me/premium/update-profile'
    ];

    for (const path of paths) {
        try {
            const res = await fetch(path, {
                method: 'POST',
                credentials: 'include', // Importante para sa cookies/session
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 404) continue; // Pag wala sa path na 'to, try sa sunod

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save');
            
            return { ok: true, data };
        } catch (e) {
            console.error("Server save error:", e);
        }
    }
    return { ok: false };
  }

  // 2. Main Save Function (Async na siya ngayon)
  window.saveEditProfile = async () => {
    // Ipunin lahat ng values mula sa fields
    const profileData = {};
    Object.keys(fields).forEach((key) => {
      profileData[key] = fields[key] ? fields[key].value.trim() : "";
    });

    // Validation: Pangalan lang ang required
    if (!profileData.name) {
      if (window.showToast) showToast("Pangalan muna, Jerwin! Bawal empty.");
      return;
    }

    // UPDATE UI DISPLAYS (Real-time update sa dashboard)
    displayNames.forEach((el) => { if (el) el.innerText = profileData.name; });
    displayEmails.forEach((el) => { if (el) el.innerText = profileData.email; });

    // A. SAVE LOCALLY (Backup / Optimistic UI)
    localStorage.setItem("ps_user_profile", JSON.stringify(profileData));

    // B. SAVE TO BACKEND (Laravel Server)
    if (window.showToast) showToast("Saving to server...");

    // I-map ang data para tumugma sa Database columns ng Backend
    const backendPayload = {
        fullName: profileData.name,
        email: profileData.email,
        occupation: profileData.occupation,
        age: profileData.age,
        wealthStatus: profileData.wealth,       // Mapped from 'wealth'
        incomeRange: profileData.income,        // Mapped from 'income'
        netWorthRange: profileData.networth,    // Mapped from 'networth'
        incomeSource: profileData.source,       // Mapped from 'source'
        socialLink: profileData.social,         // Mapped from 'social'
        reason: profileData.reason
    };

    const serverRes = await psTryUpdatePremiumProfile(backendPayload);

    if (serverRes.ok) {
        if (window.showToast) showToast("Profile Saved to Server! ✨");
    } else {
        if (window.showToast) showToast("Saved locally (Server offline).");
    }

    window.closeEditProfile();
    console.log("Jerwin, saved data (Backend & Local):", backendPayload);
  };
} // END of initProfileEditLogic

// CHANGE PASSWORD (Global Function)
window.openChangePassword = () => {
  Swal.fire({
    title: "Change Password",
    html: `
                <input type="password" id="swal-curr-pass" class="swal2-input" placeholder="Current Password" style="color:#000;">
                <input type="password" id="swal-new-pass" class="swal2-input" placeholder="New Password" style="color:#000;">
                <input type="password" id="swal-conf-pass" class="swal2-input" placeholder="Confirm New Password" style="color:#000;">
            `,
    confirmButtonText: "Update Password",
    confirmButtonColor: "#00aff0",
    showCancelButton: true,
    background: "#15151e",
    color: "#fff",
    customClass: { container: "ps-swal-on-top" },
    preConfirm: () => {
      const curr = document.getElementById("swal-curr-pass").value;
      const newP = document.getElementById("swal-new-pass").value;
      const confP = document.getElementById("swal-conf-pass").value;

      if (!curr || !newP || !confP) {
        Swal.showValidationMessage("Fill up mo lahat ng fields.");
        return false;
      }
      if (newP !== confP) {
        Swal.showValidationMessage("Hindi match ang password, paps.");
        return false;
      }
      return true;
    },
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: "success",
        title: "Password Updated",
        background: "#15151e",
        color: "#fff",
        confirmButtonColor: "#00aff0",
      });
    }
  });
};

function initPremiumLogic() {
  // --- PREMIUM TAB POPULATION (UI Structure Only, no mock data needed) ---
  if (PS_DOM.panelPremiumBody) {
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

  window.selectPlan = (element) => {
    const plans = document.querySelectorAll(".ps-plan-card");
    plans.forEach((plan) => plan.classList.remove("active"));
    element.classList.add("active");
  };

  window.subscribeGold = () => {
    Swal.fire({
      title: "Confirm Subscription",
      text: "Unlock all Premium features now?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#64E9EE",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Upgrade Me!",
      background: "#15151e",
      color: "#fff",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Welcome to Premium!",
          text: "You are now a Premium Member.",
          icon: "success",
          background: "#15151e",
          color: "#fff",
          confirmButtonColor: "#64E9EE",
        });
        if (PS_DOM.miniName)
          PS_DOM.miniName.innerHTML +=
            ' <i class="fa-solid fa-gem" style="color:#64E9EE"></i>';
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
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00aff0",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Subscribe",
      background: "#15151e",
      color: "#fff",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Subscribed!",
          text: `You are now a premium member of ${name}'s circle.`,
          icon: "success",
          background: "#15151e",
          color: "#fff",
          confirmButtonColor: "#00aff0",
        });
      }
    });
  };

  window.filterCreators = (element, category) => {
    const chips = document.querySelectorAll(".ps-filter-chip");
    chips.forEach((chip) => chip.classList.remove("active"));
    element.classList.add("active");

    // TODO: Call Backend with Filter
    // fetchCreators(category);
    showToast(`Filtering by: ${category}`);
  };

  // NOTE: Inalis na ang hardcoded creators list dito.
  // Ang 'ps-creators-grid' ay dapat lamanin gamit ang fetch data.
  if (PS_DOM.panelCreatorsBody) {
    PS_DOM.panelCreatorsBody.innerHTML = `
        <div class="ps-creators-filter">
            <div class="ps-filter-chip active" onclick="filterCreators(this, 'All')">All</div>
            <div class="ps-filter-chip" onclick="filterCreators(this, 'Trending')">Trending</div>
            <div class="ps-filter-chip" onclick="filterCreators(this, 'New')">New</div>
            <div class="ps-filter-chip" onclick="filterCreators(this, 'Near You')">Near You</div>
            <div class="ps-filter-chip" onclick="filterCreators(this, 'Cosplay')">Cosplay</div>
        </div>
        <div class="ps-creators-grid">
            <p style="grid-column: span 2; text-align: center; color: #666; margin-top: 50px;">Fetching Creators...</p>
        </div>`;
  }
}

function initCreatorProfileModal() {
  const modal = document.getElementById("psCreatorProfileModal");

  window.closeCreatorProfile = () => {
    if (modal) modal.classList.remove("active");
  };

  window.openCreatorProfile = (name, cat, followers, color) => {
    if (!modal) return;
    document.getElementById("psProfModalName").textContent = name;
    document.getElementById("psProfModalCat").textContent = cat;
    document.getElementById("psProfModalFollowers").textContent = followers;
    document.getElementById("psProfModalLikes").textContent = "0K";

    const cover = document.getElementById("psProfModalCover");
    if (cover) {
      cover.style.backgroundColor = color;
      cover.style.backgroundImage = "url('assets/images/truematch-mark.png')";
    }

    const subBtn = modal.querySelector(".ps-btn-subscribe-lg");
    if (subBtn) {
      subBtn.onclick = () => window.subscribeCreator(name);
    }

    modal.classList.add("active");
  };

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) window.closeCreatorProfile();
    });
  }

  window.messageFromProfile = () => {
    const name = document.getElementById("psProfModalName").textContent;
    window.closeCreatorProfile();
    const matchesBtn = document.querySelector('button[data-panel="matches"]');
    if (matchesBtn) matchesBtn.click();
    setTimeout(() => {
      window.openChat(name);
    }, 300);
  };
}

function initNotifications() {
  const btnNotif = document.getElementById("psBtnNotif");
  const popover = document.getElementById("psNotifPopover");

  if (btnNotif && popover) {
    // Alisin muna ang lumang listener para iwas "double-trigger"
    const newBtn = btnNotif.cloneNode(true);
    btnNotif.parentNode.replaceChild(newBtn, btnNotif);

    newBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // I-toggle ang active classes
      newBtn.classList.toggle("active");
      popover.classList.toggle("active");

      console.log(
        "Notification toggled:",
        popover.classList.contains("active"),
      );
    });

    // Isara ang popover kapag nag-click kahit saan sa labas
    document.addEventListener("click", (e) => {
      if (!popover.contains(e.target) && !newBtn.contains(e.target)) {
        popover.classList.remove("active");
        newBtn.classList.remove("active");
      }
    });
  }
}

function initChat() {
  const openChatAction = (name) => {
    if (!PS_DOM.chatWindow) return;
    PS_DOM.chatName.textContent = name;
    PS_DOM.chatAvatar.src = "assets/images/truematch-mark.png";

    // Siguraduhing naka-reset ang position kapag binuksan
    PS_DOM.chatWindow.style.transform = "translateX(0)";
    PS_DOM.chatWindow.style.transition = "transform 0.3s ease";

    if (conversationHistory[name]) {
      renderMessages(conversationHistory[name]);
    } else {
      PS_DOM.chatBody.innerHTML = `<div style="text-align:center; color:#555; margin-top:20px;">Start a conversation with ${name}</div>`;
    }
    PS_DOM.chatWindow.classList.add("active");
    document.body.classList.add("ps-chat-open");
  };

  const renderMessages = (msgs) => {
    PS_DOM.chatBody.innerHTML = "";
    msgs.forEach((msg) => {
      const msgDiv = document.createElement("div");
      msgDiv.className = `ps-msg-bubble ${msg.type}`;
      if (msg.text.includes('<i class="fa-solid fa-gift"></i>')) {
        msgDiv.innerHTML = msg.text;
        msgDiv.style.background = "linear-gradient(135deg, #FFD700, #FFA500)";
        msgDiv.style.color = "#000";
        msgDiv.style.fontWeight = "bold";
      } else {
        msgDiv.textContent = msg.text;
      }
      PS_DOM.chatBody.appendChild(msgDiv);
    });
    PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;
  };

  const closeChatAction = () => {
    if (PS_DOM.chatWindow) {
      PS_DOM.chatWindow.classList.remove("active");
      // I-clear ang inline transform para sa susunod na open
      setTimeout(() => {
        PS_DOM.chatWindow.style.transform = "";
      }, 300);
      document.body.classList.remove("ps-chat-open");
    }
  };

  window.openChat = openChatAction;
  window.closeChat = closeChatAction;

  // --- SWIPE RIGHT TO CLOSE LOGIC ---
  if (PS_DOM.chatWindow) {
    let chatStartX = 0;
    let isDraggingChat = false;

    PS_DOM.chatWindow.addEventListener(
      "touchstart",
      (e) => {
        chatStartX = e.touches[0].clientX;
        isDraggingChat = true;
        PS_DOM.chatWindow.style.transition = "none"; // Alisin ang transition para real-time drag
      },
      { passive: true },
    );

    PS_DOM.chatWindow.addEventListener(
      "touchmove",
      (e) => {
        if (!isDraggingChat) return;
        let currentX = e.touches[0].clientX;
        let diff = currentX - chatStartX;

        // Pakanan lang ang swipe na papayagan (diff > 0)
        if (diff > 0) {
          PS_DOM.chatWindow.style.transform = `translateX(${diff}px)`;
        }
      },
      { passive: true },
    );

    PS_DOM.chatWindow.addEventListener("touchend", (e) => {
      if (!isDraggingChat) return;
      isDraggingChat = false;
      let currentX = e.changedTouches[0].clientX;
      let diff = currentX - chatStartX;

      PS_DOM.chatWindow.style.transition = "transform 0.3s ease-out";

      // Threshold: 100px para ituloy ang pagsara
      if (diff > 100) {
        PS_DOM.chatWindow.style.transform = "translateX(100%)";
        setTimeout(closeChatAction, 200);
      } else {
        // Snap back kapag hindi umabot sa 100px
        PS_DOM.chatWindow.style.transform = "translateX(0)";
      }
    });
  }

  // --- EMOJI PICKER LOGIC ---
  const emojiPicker = document.getElementById("psEmojiPicker");
  const btnEmoji = document.getElementById("psBtnToggleEmoji");
  const chatInput = document.getElementById("psChatInput");

  if (btnEmoji && emojiPicker) {
    btnEmoji.onclick = (e) => {
      e.stopPropagation();
      emojiPicker.classList.toggle("active");
    };
    document.addEventListener("click", (e) => {
      if (!emojiPicker.contains(e.target) && e.target !== btnEmoji) {
        emojiPicker.classList.remove("active");
      }
    });
  }

  if (emojiPicker && chatInput) {
    emojiPicker.addEventListener("emoji-click", (event) => {
      const emoji = event.detail.unicode;
      chatInput.value += emoji;
      chatInput.focus();
    });
  }

  window.sendChatMessage = function () {
    const text = PS_DOM.chatInput ? PS_DOM.chatInput.value.trim() : "";
    if (!text) return;

    const currentName = PS_DOM.chatName.textContent;
    const msgDiv = document.createElement("div");
    msgDiv.className = "ps-msg-bubble sent";
    msgDiv.textContent = text;
    PS_DOM.chatBody.appendChild(msgDiv);
    PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;

    if (!conversationHistory[currentName]) {
      conversationHistory[currentName] = [];
    }
    conversationHistory[currentName].push({ type: "sent", text: text });
    saveHistory();

    moveMatchToMessages(currentName, text);

    PS_DOM.chatInput.value = "";
    if (emojiPicker) emojiPicker.classList.remove("active");
  };

  function moveMatchToMessages(name, lastText) {
    const newMatchesRail = document.getElementById("psNewMatchesRail");
    let isNewMatch = false;

    if (newMatchesRail) {
      const newMatchItems =
        newMatchesRail.querySelectorAll(".ps-new-match-item");
      newMatchItems.forEach((item) => {
        const nameSpan = item.querySelector(".ps-match-name-sm");
        if (nameSpan && nameSpan.textContent === name) {
          item.remove();
          isNewMatch = true;
        }
      });
    }

    if (isNewMatch) {
      const countBadge = document.getElementById("psNewMatchCount");
      if (countBadge) {
        let currentCount = parseInt(countBadge.textContent) || 0;
        countBadge.textContent = Math.max(0, currentCount - 1);
      }
    }

    const matchesList = document.getElementById("psMatchesContainer");
    if (matchesList) {
      const existingItems = matchesList.querySelectorAll(".ps-message-item");
      existingItems.forEach((item) => {
        const nameEl = item.querySelector(".ps-msg-name");
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
      matchesList.insertAdjacentHTML("afterbegin", newItem);
    }
  }

  if (PS_DOM.btnCloseChat) PS_DOM.btnCloseChat.onclick = closeChatAction;
}

function initStoryViewer() {
  const closeStoryAction = () => {
    if (PS_DOM.storyViewer) {
      PS_DOM.storyViewer.classList.remove("active");
      if (PS_DOM.storyProgress)
        PS_DOM.storyProgress.classList.remove("animating");
    }
  };

  const openStoryAction = (name, color) => {
    if (!PS_DOM.storyViewer) return;
    PS_DOM.storyName.textContent = name;
    PS_DOM.storyAvatar.src = "assets/images/truematch-mark.png";

    if (PS_DOM.storyCommentInput) PS_DOM.storyCommentInput.value = "";
    if (PS_DOM.storyEmojiPicker)
      PS_DOM.storyEmojiPicker.classList.remove("active");

    PS_DOM.storyFullImg.style.backgroundColor = color;
    PS_DOM.storyFullImg.style.backgroundImage =
      "url('assets/images/truematch-mark.png')";
    PS_DOM.storyFullImg.style.backgroundSize = "contain";
    PS_DOM.storyFullImg.style.backgroundRepeat = "no-repeat";

    PS_DOM.storyViewer.classList.add("active");

    if (PS_DOM.storyProgress) {
      PS_DOM.storyProgress.classList.remove("animating");
      void PS_DOM.storyProgress.offsetWidth;
      PS_DOM.storyProgress.classList.add("animating");
    }
  };

  window.openStory = openStoryAction;
  window.closeStory = closeStoryAction;

  window.sendStoryComment = function () {
    const text = PS_DOM.storyCommentInput
      ? PS_DOM.storyCommentInput.value.trim()
      : "";
    if (!text) return;
    const targetUser = PS_DOM.storyName.textContent;
    window.closeStory();
    const matchesBtn = document.querySelector('button[data-panel="matches"]');
    if (matchesBtn) matchesBtn.click();

    setTimeout(() => {
      window.openChat(targetUser);
      PS_DOM.chatInput.value = text;
      window.sendChatMessage();
      showToast("Reply sent!");
    }, 400);

    PS_DOM.storyCommentInput.value = "";
    if (PS_DOM.storyEmojiPicker)
      PS_DOM.storyEmojiPicker.classList.remove("active");
  };

  window.postNewStory = function () {
    const text = PS_DOM.storyInput ? PS_DOM.storyInput.value.trim() : "";
    if (!text) {
      showToast("Please write something!");
      return;
    }

    // HTML ng bagong story
    const newStoryHtml = `
    <div class="ps-story-item" onclick="openStory('You', '#00aff0')">
        <div class="ps-story-ring" style="border-color: #00aff0;">
            <img class="ps-story-img" src="assets/images/truematch-mark.png" style="background:#00aff0">
        </div>
        <span class="ps-story-name" style="font-size:0.7rem; font-weight:bold;">You</span>
    </div>`;

    if (PS_DOM.storiesContainer) {
      // Kunin ang unang element (ang "+" button)
      const addBtn = PS_DOM.storiesContainer.firstElementChild;

      if (addBtn) {
        // I-insert PAGKATAPOS ng "+" button para laging nasa kanan niya ang bagong stories
        addBtn.insertAdjacentHTML("afterend", newStoryHtml);
      } else {
        // Fallback kung sakaling wala pang elements
        PS_DOM.storiesContainer.insertAdjacentHTML("afterbegin", newStoryHtml);
      }
    }

    // Mobile fallback update
    const mobileContainer = document.getElementById("psMobileStoriesContainer");
    if (mobileContainer)
      mobileContainer.insertAdjacentHTML("afterbegin", newStoryHtml);

    showToast("Moment Shared!");
    if (PS_DOM.storyInput) PS_DOM.storyInput.value = "";
    window.closeAddStory();
  };

  window.openAddStory = () => {
    if (PS_DOM.addStoryModal) PS_DOM.addStoryModal.classList.add("active");
  };
  window.closeAddStory = () => {
    if (PS_DOM.addStoryModal) PS_DOM.addStoryModal.classList.remove("active");
  };
  window.toggleStoryEmoji = () => {
    if (PS_DOM.storyEmojiPicker)
      PS_DOM.storyEmojiPicker.classList.toggle("active");
  };
  window.addStoryEmoji = (emoji) => {
    if (PS_DOM.storyCommentInput) {
      PS_DOM.storyCommentInput.value += emoji;
      PS_DOM.storyCommentInput.focus();
    }
  };
  window.appendEmoji = (emoji) => {
    if (PS_DOM.storyInput) {
      PS_DOM.storyInput.value += emoji;
      PS_DOM.storyInput.focus();
    }
  };

  if (PS_DOM.btnCloseStory) PS_DOM.btnCloseStory.onclick = closeStoryAction;
  if (PS_DOM.storyViewer) {
    PS_DOM.storyViewer.onclick = (e) => {
      if (e.target === PS_DOM.storyViewer) closeStoryAction();
    };
  }
}

// ==========================================
// START: DETAILED GATING (Phase 3)
// ==========================================
function psEnforceSwipeAccess() {
  if (!PS_DOM.swipeStack) return;

  const { approved, status, eligible } = PS_STATE.premiumSociety;

  // 1. KUNG APPROVED: Buksan ang Swipe Deck (Galing sa current logic)
  if (approved) {
    if (PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = '';
    if (!PS_STATE.swipeInited) {
      PS_STATE.swipeInited = true;
      SwipeController.init();
    }
    return;
  }

  // 2. KUNG HINDI APPROVED: Ipakita ang tamang status (Mula sa Backend logic ng luma)
  if (PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'none';
  
  let title = "Premium Society Locked";
  let msg = "Exclusive access for Elite & Concierge members.";
  let icon = "fa-lock";
  let btnText = "Back to Dashboard";
  let btnAction = "window.location.href='dashboard.html'";

  // Pag-check ng detailed status mula sa PS_STATE
// --- ETO ANG AYOS NA PENDING LOGIC (PHASE 7) ---
  if (eligible && status === 'pending') {
    title = "Application Pending";
    msg = "Nire-review na namin ang iyong profile, Jerwin. Balik ka dito mamaya.";
    icon = "fa-hourglass-half";
    btnText = "Refresh Status";
    
    // Background sync lang para i-update ang PS_STATE nang hindi nag-re-reload ang page
    btnAction = "hydrateAccountIdentity().then(() => psEnforceSwipeAccess())"; 
  }
  else if (eligible && status === 'rejected') {
    title = "Application Declined";
    msg = "Pasensya na, hindi muna namin ma-approve ang iyong application sa ngayon.";
    icon = "fa-circle-xmark";
    btnText = "Contact Support";
    btnAction = "window.openContactSupport()"; // Tatawag sa Swal support modal
  } 
  else if (eligible && status === 'none') {
    title = "Action Required";
    msg = "Eligible ka na sa Premium Society! Mag-apply ka na para makapag-swipe.";
    icon = "fa-file-signature";
    btnText = "Apply Now";
    btnAction = "document.getElementById('psBtnEditProfile').click()"; // Buksan ang Edit Profile modal
  }

  // Render ang "Locked Card" sa loob ng swipe stack gamit ang iyong glass UI
  PS_DOM.swipeStack.innerHTML = `
    <div class="ps-glass-card" style="text-align:center; padding:40px; margin-top:20px;">
      <div style="font-size:3.5rem; color:#ffd700; margin-bottom:20px;">
        <i class="fa-solid ${icon}"></i>
      </div>
      <h3 style="color:#fff; margin-bottom:10px;">${title}</h3>
      <p style="color:#ccc; margin-bottom:25px; line-height:1.5;">${msg}</p>
      <button class="ps-btn-gold" onclick="${btnAction}">${btnText}</button>
    </div>`;
}
// ==========================================
// END: DETAILED GATING
// ==========================================
function initNavigation() {
  PS_DOM.tabs.forEach((tab) => {
    if (tab.dataset.panel) {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(tab.dataset.panel);
      });
    }
  });
}

// --- UPDATED SWITCH TAB FUNCTION ---
function switchTab(panelName) {
  const panelExists = Array.from(PS_DOM.panels || []).some(p => p.dataset.panel === panelName);
  if (!panelExists) panelName = "home";
  localStorage.setItem("ps_last_tab", panelName);

  // REMOVE OLD TAB CLASSES & ADD CURRENT TAB CLASS TO BODY
  // Ito ang magsasabi sa CSS kung anong tab ang active
  document.body.classList.remove(
    "ps-tab-home",
    "ps-tab-swipe",
    "ps-tab-matches",
    "ps-tab-creators",
    "ps-tab-premium",
    "ps-tab-settings",
  );
  document.body.classList.add(`ps-tab-${panelName}`);

  PS_DOM.tabs.forEach((t) => {
    if (t.dataset.panel === panelName) t.classList.add("ps-is-active");
    else t.classList.remove("ps-is-active");
  });
  PS_DOM.panels.forEach((p) => {
    if (p.dataset.panel === panelName) {
      p.classList.add("ps-is-active");
      p.style.display = panelName === "home" ? "flex" : "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      p.classList.remove("ps-is-active");
      p.style.display = "none";
    }
  });
  if (PS_DOM.sidebar && PS_DOM.sidebar.classList.contains("ps-is-open"))
    PS_DOM.sidebar.classList.remove("ps-is-open");
}

function initMobileMenu() {
  // FIX: Check if buttons exist before adding listeners
  if (PS_DOM.mobileMenuBtn) {
    PS_DOM.mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // FIX: Check if momentsPopup exists before removing class
      if (PS_DOM.momentsPopup) {
        PS_DOM.momentsPopup.classList.remove("ps-is-open");
      }

      if (PS_DOM.sidebar) {
        PS_DOM.sidebar.classList.toggle("ps-is-open");
      }
    });
  }

  if (PS_DOM.mobileMomentsBtn) {
    PS_DOM.mobileMomentsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (PS_DOM.sidebar) {
        PS_DOM.sidebar.classList.remove("ps-is-open");
      }

      // FIX: Check if momentsPopup exists before toggling
      if (PS_DOM.momentsPopup) {
        PS_DOM.momentsPopup.classList.toggle("ps-is-open");
      }
    });
  }
}

function initCanvasParticles() {
  const canvas = document.getElementById("ps-bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W,
    H,
    pts = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    pts = [];
    for (let i = 0; i < 40; i++)
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
  }
  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    pts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", resize);
  resize();
  loop();
}

// ==========================================
// NEW FEATURES: MATCH & GIFT LOGIC
// ==========================================

// --- 1. GIFT SYSTEM LOGIC ---
let selectedGiftPrice = 500;
let selectedGiftName = "Diamond";

window.closeGiftModal = () => {
  if (PS_DOM.giftModal) PS_DOM.giftModal.classList.remove("active");
};

window.selectGift = (el, name, price) => {
  // Remove active class from others
  document
    .querySelectorAll(".ps-gift-item")
    .forEach((i) => i.classList.remove("active"));
  // Add active to clicked
  el.classList.add("active");

  selectedGiftPrice = price;
  selectedGiftName = name;

  // Update button text
  if (PS_DOM.giftPriceBtn) PS_DOM.giftPriceBtn.textContent = price;
};

window.sendSelectedGift = () => {
  window.closeGiftModal();

  const targetUser = PS_DOM.chatName ? PS_DOM.chatName.textContent : "User";

  showToast(
    `Sent ${selectedGiftName} to ${targetUser}! (-${selectedGiftPrice}c)`,
  );

  const msgDiv = document.createElement("div");
  msgDiv.className = "ps-msg-bubble sent";
  msgDiv.style.background = "linear-gradient(135deg, #FFD700, #FFA500)";
  msgDiv.style.color = "#000";
  msgDiv.style.fontWeight = "bold";
  msgDiv.innerHTML = `<i class="fa-solid fa-gift"></i> Sent a ${selectedGiftName}`;

  if (PS_DOM.chatBody) {
    PS_DOM.chatBody.appendChild(msgDiv);
    PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;
  }

  if (!conversationHistory[targetUser]) conversationHistory[targetUser] = [];
  conversationHistory[targetUser].push({
    type: "sent",
    text: `<i class="fa-solid fa-gift"></i> Sent a ${selectedGiftName}`,
  });
  saveHistory();
};

// --- 2. MATCH OVERLAY LOGIC ---
window.triggerMatchOverlay = (person) => {
  if (!PS_DOM.matchOverlay) return;

  if (PS_DOM.matchName) PS_DOM.matchName.textContent = person.name;

  if (PS_DOM.matchTargetImg) {
    PS_DOM.matchTargetImg.style.background = person.color || "#00aff0";
  }
  if (PS_DOM.matchUserImg) {
    PS_DOM.matchUserImg.style.background = "#00aff0";
  }

  PS_DOM.matchOverlay.classList.add("active");
};

window.closeMatchOverlay = () => {
  if (PS_DOM.matchOverlay) PS_DOM.matchOverlay.classList.remove("active");
};

window.openChatFromMatch = () => {
  const name = PS_DOM.matchName.textContent;
  window.closeMatchOverlay();

  const matchesBtn = document.querySelector('button[data-panel="matches"]');
  if (matchesBtn) matchesBtn.click();

  setTimeout(() => {
    if (window.openChat) window.openChat(name);
  }, 300);
};
document.addEventListener("DOMContentLoaded", () => {
  console.log("iTrueMatch Global Init starting...");

  try {
    // 1. Patakbuhin ang Modules
    if (typeof initSidebarLogic === 'function') initSidebarLogic();
    if (SwipeController && typeof SwipeController.init === 'function') SwipeController.init();
    
    // 2. Patakbuhin ang UI Engine (Ito na ang bahala sa MockData, SwipeBack, at Settings)
    if (typeof initUI === 'function') {
        initUI(); 
    }

    console.log("All modules loaded successfully.");
  } catch (err) {
    console.error("Initialization Error:", err);
  }

  // 3. Itago ang Loader
  const loader = document.getElementById("app-loader");
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = "0";
      setTimeout(() => { loader.style.display = "none"; }, 500);
    }, 1500);
  }
});
/**
 * UPDATE STATS RING
 * Inayos ang math para sa SVG Ring (314 dashoffset) mula sa lumang logic
 */
function updateStats(remaining, limit) {
    const rem = Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
    const lim = Number.isFinite(limit) ? Math.max(1, limit) : 20;

    // 1. Update Text Displays
    if (PS_DOM.countDisplay) PS_DOM.countDisplay.textContent = rem;
    if (PS_DOM.timerDisplay && limit === null) {
        PS_DOM.timerDisplay.textContent = "Unlimited Swipes ✨";
    }

    // 2. RING ANIMATION (Ito yung galing sa luma)
    if (PS_DOM.ringCircle) {
        const percent = Math.min(1, rem / lim);
        const offset = 314 - (314 * percent); // 314 is the circumference
        
        PS_DOM.ringCircle.style.transition = "stroke-dashoffset 0.5s ease";
        PS_DOM.ringCircle.style.strokeDasharray = "314";
        PS_DOM.ringCircle.style.strokeDashoffset = offset;
    }

    // 3. Mobile Badge Update
    const countEl = document.getElementById('psMobileSwipeCount');
    if (countEl) countEl.textContent = limit === null ? '∞' : rem;
}