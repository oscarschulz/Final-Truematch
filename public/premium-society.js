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
  if (!v) return 'free';

  // Tier 3 / Concierge
  if (
    v === '3' ||
    v === 'tier3' || v === 'tier 3' || v === 'tier-3' ||
    v.includes('tier3') || v.includes('tier 3') || v.includes('tier-3') ||
    v.includes('concierge') || v.includes('t3')
  ) return 'tier3';

  // Tier 2 / Elite
  if (
    v === '2' ||
    v === 'tier2' || v === 'tier 2' || v === 'tier-2' ||
    v.includes('tier2') || v.includes('tier 2') || v.includes('tier-2') ||
    v.includes('elite') || v.includes('t2')
  ) return 'tier2';

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
                    'psWelcomeName': displayName.split(' ')[0],
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
  const profileBtn = document.querySelector(".ps-mini-profile");
  const menuPopup = document.getElementById("psUserMenuPopup");
  if (!profileBtn || !menuPopup) return;

  const getCurrent = () => {
    const name = (document.getElementById('psMiniName')?.textContent || PS_STATE.me?.name || 'User').trim();
    const plan = (document.getElementById('psMiniPlan')?.textContent || psPlanLabelFromKey(PS_STATE.me?.plan || PS_STATE.me?.tier) || '').trim();
    const avatar = document.getElementById('psMiniAvatar')?.getAttribute('src') || PS_STATE.me?.avatarUrl || PS_STATE.me?.photoUrl || 'assets/images/truematch-mark.png';
    return { name, plan, avatar };
  };

  const closeMenu = () => {
    menuPopup.classList.remove("active");
    profileBtn.classList.remove("active");
  };

  // Menu actions (global for inline onclick)
  window.handleBackToDashboard = () => {
    closeMenu();
    window.location.href = "dashboard.html";
  };

  window.handleLogout = async () => {
    closeMenu();
    try {
      // Try the canonical endpoint first
      let res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (!res.ok) {
        // Fallback for older backends
        res = await fetch("/api/logout", { method: "POST", credentials: "include" });
      }
    } catch (e) {
      console.warn("[logout] request failed:", e);
    } finally {
      // Clear local UI state (safe)
      try {
        localStorage.removeItem("ps_accounts");
        localStorage.removeItem("ps_current_user");
      } catch (_) {}
      // Option A: always go back to the public landing page
      window.location.href = "index.html";
    }
  };

  const renderAccountMenu = () => {
    const u = getCurrent();
    menuPopup.innerHTML = `
      <div class="ps-menu-item ps-menu-current">
        <img src="${u.avatar}" style="width:35px; height:35px; border-radius:50%; border:2px solid #00aff0;" onerror="this.src='assets/images/truematch-mark.png'">
        <div style="display:flex; flex-direction:column; line-height:1.2;">
          <span style="font-weight:700; font-size:0.9rem; color:#fff;">${u.name}</span>
          <span style="font-size:0.72rem; color:#9be7ff;">${u.plan}</span>
        </div>
        <i class="fa-solid fa-ellipsis" style="margin-left:auto; color:#9be7ff;"></i>
      </div>
      <div class="ps-menu-item" onclick="window.handleBackToDashboard()">
        <i class="fa-solid fa-arrow-left" style="color:#00aff0;"></i> <span>Go back to Dashboard</span>
      </div>
      <div class="ps-menu-item ps-menu-logout" onclick="window.handleLogout()">
        <i class="fa-solid fa-right-from-bracket"></i> <span>Log out</span>
      </div>`;
  };

  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderAccountMenu();
    menuPopup.classList.toggle("active");
    profileBtn.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!menuPopup.contains(e.target) && !profileBtn.contains(e.target)) closeMenu();
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
  let serverLimit = null; // null/undefined => unlimited (server truth)
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
    isSwiping = false;

    // Default: Premium Society is unlimited unless server returns a numeric cap
    serverLimit = null;
    dailySwipes = Infinity;
    resetTime = 0;

    // Optional local cache (ONLY as temporary display if server is slow/offline)
    const savedSwipesRaw = localStorage.getItem("ps_swipes_left");
    const savedTimeRaw = localStorage.getItem("ps_reset_time");
    const savedSwipes = savedSwipesRaw != null ? Number(savedSwipesRaw) : NaN;
    const savedTime = savedTimeRaw != null ? Number(savedTimeRaw) : NaN;
    const now = Date.now();

    if (Number.isFinite(savedSwipes) && Number.isFinite(savedTime) && now < savedTime) {
      // We don't know the serverLimit yet, so treat this as a temporary number
      dailySwipes = savedSwipes;
      resetTime = savedTime;
    }

    startCountdown();

    if (PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove("active");
    if (PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = "flex";

    // Render initial stats (will be corrected after fetchCandidates)
    updateStats(dailySwipes, serverLimit);

    // Fetch live deck + limit from backend
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

        // Server truth:
        // - data.limit === null/undefined  => unlimited
        // - data.remaining can be null when unlimited
        serverLimit = (data.limit === undefined || data.limit === null) ? null : Number(data.limit);

        if (serverLimit === null) {
          dailySwipes = Infinity;
        } else {
          const rem = (data.remaining === undefined || data.remaining === null) ? serverLimit : Number(data.remaining);
          dailySwipes = Number.isFinite(rem) ? rem : serverLimit;
        }

        updateStats(dailySwipes, serverLimit);
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
    
    // Guard: only enforce limits when serverLimit is a finite number
    const isLimited = Number.isFinite(serverLimit) && Number.isFinite(dailySwipes);
    if (isLimited && dailySwipes <= 0 && action !== 'pass') {
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
        // ensure Matches tab refresh reflects this Premium Society match
        _psMatchesLastFetched = 0;
      }
      
      // C. SYNC STATS: Kunin ang "truth" mula sa server (Handle null as unlimited)
      if (data && ('remaining' in data || 'limit' in data)) {
        serverLimit = (data.limit === undefined || data.limit === null) ? null : Number(data.limit);

        if (serverLimit === null) {
          dailySwipes = Infinity;
        } else {
          const rem = (data.remaining === undefined || data.remaining === null) ? serverLimit : Number(data.remaining);
          dailySwipes = Number.isFinite(rem) ? rem : serverLimit;
        }

        updateStats(dailySwipes, serverLimit);
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
    // Only persist numeric limits; Premium Society is typically unlimited.
    if (!Number.isFinite(serverLimit) || !Number.isFinite(dailySwipes) || !Number.isFinite(resetTime)) return;
    localStorage.setItem("ps_swipes_left", String(dailySwipes));
    localStorage.setItem("ps_reset_time", String(resetTime));
  }

function updateStats(curr, max) {
    const unlimited = (max === null || max === undefined || !Number.isFinite(max));
    const displayVal = unlimited ? '∞' : String(Number.isFinite(curr) ? curr : 0);

    if (PS_DOM.countDisplay) PS_DOM.countDisplay.textContent = displayVal;
    if (PS_DOM.mobileSwipeBadge) PS_DOM.mobileSwipeBadge.textContent = displayVal;

    if (PS_DOM.ringCircle) {
      const percent = unlimited ? 1 : Math.max(0, Math.min(1, (Number.isFinite(curr) ? curr : 0) / max));
      PS_DOM.ringCircle.style.strokeDashoffset = 314 - (314 * percent);
    }
}

/**
   * START COUNTDOWN
   * Inayos para maging persistent gamit ang localStorage
   */
  function startCountdown() {
    setInterval(() => {
      // If unlimited, keep UI truthful and do not run local reset logic.
      if (serverLimit === null || serverLimit === undefined || !Number.isFinite(serverLimit)) {
        if (PS_DOM.timerDisplay) PS_DOM.timerDisplay.textContent = 'Unlimited swipes';
        return;
      }

      const now = Date.now();
      const savedResetTimeRaw = localStorage.getItem("ps_reset_time");
      const savedResetTime = savedResetTimeRaw != null ? Number(savedResetTimeRaw) : NaN;

      // If missing or expired, start a new local cycle (fallback UI only)
      if (!Number.isFinite(savedResetTime) || now >= savedResetTime) {
        dailySwipes = serverLimit;
        resetTime = now + 12 * 60 * 60 * 1000; // 12-hour cycle (UI fallback)
        saveData();
        updateStats(dailySwipes, serverLimit);
      } else {
        resetTime = savedResetTime;
      }

      const diff = resetTime - now;
      if (diff > 0 && PS_DOM.timerDisplay) {
        const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        PS_DOM.timerDisplay.textContent = `Resets in ${hrs}h ${mins}m ${secs}s`;
      }
    }, 1000);
  }

  /**
   * FIRE EMPTY ALERT
   * Alert para sa mga Free users na naubusan ng swipes
   */
  function fireEmptyAlert() {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: "Out of Swipes! 🛑",
        text: "Naubos mo na ang daily swipe limit mo. Balik ka ulit bukas.",
        icon: "warning",
        background: "#15151e",
        color: "#fff",
        confirmButtonColor: "#00aff0",
        confirmButtonText: "Upgrade Now"
      }).then((result) => {
        if (result.isConfirmed) {
          if (typeof switchTab === 'function') switchTab('premium');
        }
      });
    } else {
      alert("Out of Swipes! Wait for reset or upgrade to Premium.");
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

function psDisableGiftFeatures() {
  if (PS_DOM.btnPPV) {
    PS_DOM.btnPPV.style.display = 'none';
    PS_DOM.btnPPV.disabled = true;
    PS_DOM.btnPPV.setAttribute('aria-hidden', 'true');
    PS_DOM.btnPPV.setAttribute('aria-disabled', 'true');
    PS_DOM.btnPPV.onclick = null;
  }

  if (PS_DOM.giftModal) {
    PS_DOM.giftModal.classList.remove('active');
    PS_DOM.giftModal.style.display = 'none';
    PS_DOM.giftModal.setAttribute('aria-hidden', 'true');
  }
}


const PS_CHAT_STATE = {
  activePeerEmail: '',
  activePeerLabel: '',
  activeAvatar: 'assets/images/truematch-mark.png',
  peersByLabel: {},
  avatarsByLabel: {},
  lastThread: [],
  matchOverlayTarget: null
};


const PS_MOMENTS_STATE = {
  items: [],
  byId: {},
  activeMomentId: '',
  lastFetchedAt: 0
};

function psMomentAccent(seed) {
  const src = String(seed || 'moment');
  let hash = 0;
  for (let i = 0; i < src.length; i += 1) {
    hash = ((hash << 5) - hash) + src.charCodeAt(i);
    hash |= 0;
  }
  const palette = ['#00aff0', '#ff4d6d', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];
  return palette[Math.abs(hash) % palette.length];
}

function psNormalizeMoment(raw) {
  const id = String(raw?.id || '').trim();
  const ownerEmail = String(raw?.ownerEmail || '').trim().toLowerCase();
  const ownerName = String(raw?.ownerName || raw?.name || 'Member').trim() || 'Member';
  const ownerAvatarUrl = String(raw?.ownerAvatarUrl || raw?.avatar || 'assets/images/truematch-mark.png').trim() || 'assets/images/truematch-mark.png';
  const mediaUrl = String(raw?.mediaUrl || '').trim();
  const mediaType = String(raw?.mediaType || '').trim().toLowerCase();
  const caption = String(raw?.caption || '').trim();
  const createdAtMs = Number(raw?.createdAtMs || 0) || Date.now();
  const expiresAtMs = Number(raw?.expiresAtMs || 0) || (createdAtMs + (24 * 60 * 60 * 1000));
  const ownerKey = ownerEmail || String(raw?.ownerId || '').trim() || ownerName;
  const accent = psMomentAccent(ownerKey || id || ownerName);
  return { id, ownerEmail, ownerName, ownerAvatarUrl, mediaUrl, mediaType, caption, createdAtMs, expiresAtMs, ownerKey, accent };
}

function psSetMomentsState(list) {
  const normalized = (Array.isArray(list) ? list : [])
    .map(psNormalizeMoment)
    .filter((m) => m.id);

  normalized.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));

  PS_MOMENTS_STATE.items = normalized;
  PS_MOMENTS_STATE.byId = {};
  normalized.forEach((m) => {
    PS_MOMENTS_STATE.byId[m.id] = m;
  });

  return normalized;
}

function psGetMomentsRailItems() {
  const seen = new Set();
  const rail = [];
  (Array.isArray(PS_MOMENTS_STATE.items) ? PS_MOMENTS_STATE.items : []).forEach((moment) => {
    const key = String(moment.ownerKey || moment.id || '').trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    rail.push(moment);
  });
  return rail;
}

async function psLoadMoments(force = false) {
  const now = Date.now();
  if (!force && (now - Number(PS_MOMENTS_STATE.lastFetchedAt || 0)) < 5000) return PS_MOMENTS_STATE.items;

  try {
    const res = await fetch(`${API_BASE}/api/moments/list`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || data.ok !== true) {
      throw new Error((data && (data.message || data.error)) || 'Failed to load moments.');
    }

    const items = psSetMomentsState(Array.isArray(data.moments) ? data.moments : []);
    PS_MOMENTS_STATE.lastFetchedAt = Date.now();
    renderStories(items);
    return items;
  } catch (err) {
    console.error('psLoadMoments error:', err);
    if (!PS_MOMENTS_STATE.lastFetchedAt) renderStories([]);
    return [];
  }
}

function psEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function psRememberPeer(peerEmail, label, avatar) {
  const peer = String(peerEmail || '').trim().toLowerCase();
  const safeLabel = String(label || '').trim() || 'Member';
  const safeAvatar = String(avatar || 'assets/images/truematch-mark.png').trim() || 'assets/images/truematch-mark.png';

  if (peer) PS_CHAT_STATE.peersByLabel[safeLabel] = peer;
  PS_CHAT_STATE.avatarsByLabel[safeLabel] = safeAvatar;
  return { peerEmail: peer, label: safeLabel, avatar: safeAvatar };
}

function psResolvePeer(target) {
  if (target && typeof target === 'object') {
    const label = String(target.name || target.label || target.username || 'Member').trim() || 'Member';
    const peerEmail = String(target.peerEmail || target.email || target.id || '').trim().toLowerCase();
    const avatar = String(target.avatar || target.photoUrl || PS_CHAT_STATE.avatarsByLabel[label] || 'assets/images/truematch-mark.png').trim() || 'assets/images/truematch-mark.png';
    if (peerEmail || label) return psRememberPeer(peerEmail, label, avatar);
  }

  const label = String(target || '').trim() || 'Member';
  const peerEmail = String(PS_CHAT_STATE.peersByLabel[label] || '').trim().toLowerCase();
  const avatar = String(PS_CHAT_STATE.avatarsByLabel[label] || 'assets/images/truematch-mark.png').trim() || 'assets/images/truematch-mark.png';
  return { peerEmail, label, avatar };
}

function psFormatMessageTime(value) {
  const ts = Number(value || 0);
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return '';
  }
}

function psMapServerThreadToLocalHistory(list) {
  const me = String((PS_STATE.me && PS_STATE.me.email) || '').trim().toLowerCase();
  return (Array.isArray(list) ? list : []).map((m) => {
    const fromMe = String(m && m.from || '').trim().toLowerCase() === me;
    let text = String((m && m.text) || '').trim();

    if (!text) {
      if (Array.isArray(m && m.media) && m.media.length) {
        text = '[Media]';
      } else if (m && m.ppv) {
        text = '[Media]';
      } else {
        text = '';
      }
    }

    return {
      type: fromMe ? 'sent' : 'received',
      text
    };
  });
}

function psRenderChatThread(msgs = []) {
  if (!PS_DOM.chatBody) return;

  const me = String((PS_STATE.me && PS_STATE.me.email) || '').trim().toLowerCase();
  PS_DOM.chatBody.innerHTML = '';

  (Array.isArray(msgs) ? msgs : []).forEach((msg) => {
    const fromMe = String(msg && msg.from || '').trim().toLowerCase() === me;
    const bubble = document.createElement('div');
    bubble.className = `ps-msg-bubble ${fromMe ? 'sent' : 'received'}`;

    const media = Array.isArray(msg && msg.media) ? msg.media : [];

    const text = String((msg && msg.text) || '').trim();
    const safeText = text ? psEscapeHtml(text).replace(/\n/g, '<br>') : '';

    const mediaLine = media.length
      ? `<div class="ps-msg-media-note">[Media]</div>`
      : '';

    const textLine = safeText ? `<div class="ps-msg-text">${safeText}</div>` : '';
    const readLine = fromMe && msg && msg.readAt
      ? `<div class="ps-msg-read" style="margin-top:6px; font-size:0.7rem; opacity:0.7;">Seen</div>`
      : '';
    const timeLine = `<div class="ps-msg-time-mini" style="margin-top:6px; font-size:0.7rem; opacity:0.7;">${psEscapeHtml(psFormatMessageTime(msg && msg.createdAtMs))}</div>`;

    const bodyHtml = `${mediaLine}${textLine}${timeLine}${readLine}`;

    bubble.innerHTML = bodyHtml || '<div class="ps-msg-text"></div>';
    PS_DOM.chatBody.appendChild(bubble);
  });

  PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;
}

async function psLoadChatThread(target, opts = {}) {
  const resolved = psResolvePeer(target);
  const peerEmail = String(resolved.peerEmail || '').trim().toLowerCase();
  const label = String(opts.label || resolved.label || 'Member').trim() || 'Member';
  const avatar = String(opts.avatar || resolved.avatar || 'assets/images/truematch-mark.png').trim() || 'assets/images/truematch-mark.png';

  PS_CHAT_STATE.activePeerEmail = peerEmail;
  PS_CHAT_STATE.activePeerLabel = label;
  PS_CHAT_STATE.activeAvatar = avatar;
  psRememberPeer(peerEmail, label, avatar);

  if (PS_DOM.chatName) PS_DOM.chatName.textContent = label;
  if (PS_DOM.chatAvatar) PS_DOM.chatAvatar.src = avatar;

  if (!peerEmail) {
    const localMsgs = conversationHistory[label] || [];
    psRenderChatThread(localMsgs.map((m) => ({
      from: m.type === 'sent' ? (PS_STATE.me && PS_STATE.me.email) || 'me' : label,
      to: m.type === 'sent' ? label : (PS_STATE.me && PS_STATE.me.email) || 'me',
      text: m.text,
      createdAtMs: Date.now()
    })));
    return { ok: false, localOnly: true, messages: localMsgs };
  }

  if (PS_DOM.chatBody) {
    PS_DOM.chatBody.innerHTML = `<div style="text-align:center; color:#555; margin-top:20px;">Loading conversation...</div>`;
  }

  try {
    const res = await fetch(`${API_BASE}/api/messages/thread/${encodeURIComponent(peerEmail)}`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || data.ok !== true) {
      const msg = (data && (data.message || data.error)) ? (data.message || data.error) : 'Failed to load conversation.';
      throw new Error(String(msg || 'Failed to load conversation.'));
    }

    const messages = Array.isArray(data.messages) ? data.messages : [];
    PS_CHAT_STATE.lastThread = messages;
    conversationHistory[label] = psMapServerThreadToLocalHistory(messages);
    saveHistory();
    psRenderChatThread(messages);
    return { ok: true, data };
  } catch (err) {
    console.error('psLoadChatThread error:', err);
    const fallback = conversationHistory[label] || [];
    if (fallback.length) {
      psRenderChatThread(fallback.map((m) => ({
        from: m.type === 'sent' ? (PS_STATE.me && PS_STATE.me.email) || 'me' : label,
        to: m.type === 'sent' ? label : (PS_STATE.me && PS_STATE.me.email) || 'me',
        text: m.text,
        createdAtMs: Date.now()
      })));
      showToast('Using saved chat cache.', 'warning');
      return { ok: false, localOnly: true, messages: fallback };
    }

    if (PS_DOM.chatBody) {
      PS_DOM.chatBody.innerHTML = `<div style="text-align:center; color:#555; margin-top:20px;">Failed to load conversation.</div>`;
    }
    showToast(String(err && err.message ? err.message : 'Failed to load conversation.'), 'error');
    return { ok: false, error: err };
  }
}

async function psSendMessageToActivePeer(payload = {}) {
  const peerEmail = String(PS_CHAT_STATE.activePeerEmail || '').trim().toLowerCase();
  const label = String(PS_CHAT_STATE.activePeerLabel || (PS_DOM.chatName ? PS_DOM.chatName.textContent : '') || 'Member').trim() || 'Member';
  if (!peerEmail) {
    showToast('Unable to resolve this conversation.', 'error');
    return { ok: false, error: 'peer_missing' };
  }

  const body = { to: peerEmail };
  if (payload.text !== undefined) body.text = String(payload.text || '');
  if (payload.media !== undefined) body.media = payload.media;

  try {
    const res = await fetch(`${API_BASE}/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || data.ok !== true) {
      const msg = (data && (data.message || data.error)) ? (data.message || data.error) : 'Failed to send message.';
      throw new Error(String(msg || 'Failed to send message.'));
    }

    await psLoadChatThread({ peerEmail, name: label, avatar: PS_CHAT_STATE.activeAvatar });
    _psMatchesLastFetched = 0;
    try { await psLoadMatches(true); } catch (_) {}
    return { ok: true, data };
  } catch (err) {
    console.error('psSendMessageToActivePeer error:', err);
    showToast(String(err && err.message ? err.message : 'Failed to send message.'), 'error');
    return { ok: false, error: err };
  }
}


// ==========================================
export async function initUI() {
  console.log("🚀 iTrueMatch Engine: Syncing...");

  // 1. Priority: Identity Sync sa Node.js
  const user = await hydrateAccountIdentity();
  
  // 2. Initialize Components
  initCanvasParticles();
  initNavigation();
  initNotifications();
  initChat();
  initStoryViewer();
  initCreatorProfileModal();
  initCreatorsLogic();
  initPremiumLogic();
  initProfileEditLogic();
  initSettingsLogic();
  initGlobalSwipeBack();

  // 3. Render Sections (Backend-ready)
  renderStories([]);
  renderMessages([]);
  renderAdmirers([]);
  renderActiveNearby([]);
  renderDailyPick(null);

  // Load real home widgets and moments from backend
  await Promise.allSettled([
    psLoadHomeWidgets(true),
    psLoadMoments(true)
  ]);

  // 4. Tab Restoration
  const lastTab = localStorage.getItem("ps_last_tab") || "home";
  switchTab(lastTab);

  // Gift / PPV disabled until dedicated purchase or debit logic exists
  psDisableGiftFeatures();
}

// ==========================================
// UI RENDERERS (Clean & Modular)
// ==========================================

// 1. Render Stories
function renderStories(stories = []) {
    if (!PS_DOM.storiesContainer) return;

    const items = psSetMomentsState(stories);
    const railItems = psGetMomentsRailItems();

    const addBtn = `
    <div class="ps-story-item" onclick="openAddStory()">
        <div class="ps-story-ring" style="border-color: #444; border-style: dashed; padding: 3px;">
            <div style="width:100%; height:100%; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <i class="fa-solid fa-plus" style="color:#00aff0; font-size:1.2rem;"></i>
            </div>
        </div>
        <span class="ps-story-name">Add Story</span>
    </div>`;

    if (!railItems.length) {
      PS_DOM.storiesContainer.innerHTML = addBtn;
      return;
    }

    const storyHtml = railItems.map((s) => {
        const safeId = psEscapeHtml(s.id);
        const safeName = psEscapeHtml(s.ownerName || 'Member');
        const safeAvatar = psEscapeHtml(s.ownerAvatarUrl || 'assets/images/truematch-mark.png');
        const accent = psEscapeHtml(s.accent || '#00aff0');
        return `
    <div class="ps-story-item" data-moment-id="${safeId}">
        <div class="ps-story-ring" style="border-color: ${accent}">
            <img class="ps-story-img" src="${safeAvatar}" alt="${safeName}" onerror="this.src='assets/images/truematch-mark.png'" style="background:${accent}">
        </div>
        <span class="ps-story-name">${safeName}</span>
    </div>`;
    }).join("");

    PS_DOM.storiesContainer.innerHTML = addBtn + storyHtml;

    PS_DOM.storiesContainer.querySelectorAll('.ps-story-item[data-moment-id]').forEach((item) => {
      item.addEventListener('click', () => {
        const momentId = item.getAttribute('data-moment-id') || '';
        if (momentId && typeof window.openStory === 'function') {
          window.openStory(momentId);
        }
      });
    });
}

// 2. Render Messages
function renderMessages(messages = []) {
    if (!PS_DOM.matchesContainer) return;

    if (messages.length === 0) {
        PS_DOM.matchesContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">No messages yet. Start swiping!</div>`;
        return;
    }

    PS_DOM.matchesContainer.innerHTML = messages.map((m) => {
        const label = String(m.name || 'Member');
        const avatar = String(m.avatar || 'assets/images/truematch-mark.png');
        const peerEmail = String(m.peerEmail || '').trim().toLowerCase();
        const escapedLabel = psEscapeHtml(label);
        const escapedAvatar = psEscapeHtml(avatar);
        const escapedPeer = psEscapeHtml(peerEmail);
        const escapedText = psEscapeHtml(String(m.text || ''));
        const escapedTime = psEscapeHtml(String(m.time || ''));
        return `
    <div class="ps-message-item ${m.unread ? "unread" : ""}" data-name="${escapedLabel}" data-peer="${escapedPeer}" data-avatar="${escapedAvatar}">
        <div class="ps-msg-avatar-wrapper">
            <img class="ps-msg-avatar" src="${escapedAvatar}">
            <div class="ps-online-badge"></div>
        </div>
        <div class="ps-msg-content">
            <div class="ps-msg-header">
                <span class="ps-msg-name">${escapedLabel}</span>
                <span class="ps-msg-time">${escapedTime}</span>
            </div>
            <span class="ps-msg-preview">${escapedText}</span>
        </div>
    </div>`;
    }).join("");

    PS_DOM.matchesContainer.querySelectorAll('.ps-message-item').forEach((item) => {
        item.addEventListener('click', () => {
            const label = item.getAttribute('data-name') || 'Member';
            const peerEmail = item.getAttribute('data-peer') || '';
            const avatar = item.getAttribute('data-avatar') || 'assets/images/truematch-mark.png';
            if (window.openChat) window.openChat({ name: label, peerEmail, avatar });
        });
    });
}

// 3. Render Admirers
function renderAdmirers(admirers = []) {
    if (!PS_DOM.admirerContainer) return;

    if (!Array.isArray(admirers) || admirers.length === 0) {
        PS_DOM.admirerContainer.innerHTML = `<div style="grid-column:span 3; text-align:center; color:#666; font-size:0.8rem;">No admirers yet. Boost your profile!</div>`;
        if (PS_DOM.admirerCount) PS_DOM.admirerCount.innerText = "0 New";
        return;
    }

    if (PS_DOM.admirerCount) {
        PS_DOM.admirerCount.innerText = `${admirers.length} New`;
    }

    PS_DOM.admirerContainer.innerHTML = admirers.map((a) => {
        const name = psEscapeHtml(_psSafeName(a.name || a.fullName || a.username || 'Member'));
        const city = psEscapeHtml(String(a.city || a.loc || a.location || 'Nearby').trim() || 'Nearby');
        const age = (a.age !== undefined && a.age !== null && String(a.age).trim() !== '') ? `, ${psEscapeHtml(String(a.age))}` : '';
        const avatar = psEscapeHtml(String(a.photoUrl || a.avatarUrl || a.avatar || 'assets/images/truematch-mark.png'));
        return `
    <div class="ps-admirer-card" title="${name}">
        <img class="ps-admirer-img" src="${avatar}" alt="${name}" onerror="this.src='assets/images/truematch-mark.png'" style="background:${a.color || getRandomColor()}">
        <h4 style="margin:8px 0 0; font-size:0.85rem;">${name}</h4>
        <p class="ps-tiny ps-muted" style="margin:0;">${city}${age}</p>
    </div>`;
    }).join("");
}

function renderActiveNearby(items = []) {
  if (!PS_DOM.activeNearbyContainer) return;

  if (!Array.isArray(items) || items.length === 0) {
    PS_DOM.activeNearbyContainer.innerHTML = `<div style="grid-column:span 3; text-align:center; color:#666; font-size:0.82rem; padding:14px 8px;">No active members nearby right now.</div>`;
    return;
  }

  PS_DOM.activeNearbyContainer.innerHTML = items.map((item) => {
    const name = psEscapeHtml(_psSafeName(item.name || item.fullName || item.username || 'Member'));
    const avatar = psEscapeHtml(String(item.photoUrl || item.avatarUrl || item.avatar || 'assets/images/truematch-mark.png'));
    const city = psEscapeHtml(String(item.city || item.location || 'Nearby').trim() || 'Nearby');
    const onlineLabel = item.isOnline ? 'Online now' : 'Recently active';

    return `
      <div class="ps-active-item" title="${name} • ${city}">
        <img class="ps-active-img" src="${avatar}" alt="${name}" onerror="this.src='assets/images/truematch-mark.png'">
        <div style="position:absolute; inset:auto 0 0 0; padding:8px; background:linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,0));">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <strong style="font-size:.8rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</strong>
            <span style="display:inline-flex; align-items:center; gap:5px; font-size:.66rem; color:${item.isOnline ? '#00ff88' : '#9be7ff'}; flex-shrink:0;">
              <i class="fa-solid fa-circle" style="font-size:.45rem;"></i>${onlineLabel}
            </span>
          </div>
          <div style="font-size:.68rem; color:#d4d7dd; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${city}</div>
        </div>
      </div>`;
  }).join('');
}

function renderDailyPick(profile) {
  if (!PS_DOM.dailyPickContainer) return;

  if (!profile) {
    PS_DOM.dailyPickContainer.innerHTML = `
      <div style="padding:18px; border:1px solid rgba(255,255,255,.08); border-radius:18px; background:rgba(255,255,255,.03); text-align:center; color:#9aa0a6;">
        Daily Pick will appear here once we find a strong match for you.
      </div>`;
    return;
  }

  const name = psEscapeHtml(_psSafeName(profile.name || profile.fullName || profile.username || 'Member'));
  const city = psEscapeHtml(String(profile.city || profile.location || 'Nearby').trim() || 'Nearby');
  const avatar = psEscapeHtml(String(profile.photoUrl || profile.avatarUrl || profile.avatar || 'assets/images/truematch-mark.png'));
  const age = (profile.age !== undefined && profile.age !== null && String(profile.age).trim() !== '') ? ` • ${psEscapeHtml(String(profile.age))}` : '';
  const badge = profile.isOnline ? 'Online now' : "Today's Highlight";

  PS_DOM.dailyPickContainer.innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; padding:18px; border:1px solid rgba(255,255,255,.08); border-radius:18px; background:linear-gradient(135deg, rgba(0,175,240,.15), rgba(255,255,255,.02));">
      <img src="${avatar}" alt="${name}" onerror="this.src='assets/images/truematch-mark.png'" style="width:72px; height:72px; border-radius:20px; object-fit:cover; border:1px solid rgba(255,255,255,.12); background:#111; flex-shrink:0;">
      <div style="min-width:0; flex:1;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
          <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; background:rgba(0,175,240,.15); color:#9be7ff; font-size:.7rem; font-weight:700; letter-spacing:.02em;">✨ ${badge}</span>
        </div>
        <h3 style="margin:0; font-size:1.05rem; color:#fff;">${name}</h3>
        <p style="margin:6px 0 0; color:#c9d1d9; font-size:.88rem;">${city}${age}</p>
      </div>
    </div>`;
}


function psApplyMomentToViewer(moment) {
  if (!PS_DOM.storyFullImg) return;

  const mediaUrl = String(moment?.mediaUrl || '').trim();
  const mediaType = String(moment?.mediaType || '').trim().toLowerCase();
  const caption = String(moment?.caption || '').trim();
  const accent = String(moment?.accent || '#00aff0');
  const avatarUrl = String(moment?.ownerAvatarUrl || 'assets/images/truematch-mark.png').trim() || 'assets/images/truematch-mark.png';

  PS_DOM.storyFullImg.innerHTML = '';
  PS_DOM.storyFullImg.style.position = 'relative';
  PS_DOM.storyFullImg.style.backgroundColor = accent;
  PS_DOM.storyFullImg.style.backgroundPosition = 'center';
  PS_DOM.storyFullImg.style.backgroundRepeat = 'no-repeat';
  PS_DOM.storyFullImg.style.backgroundSize = 'cover';

  if (/^image\//.test(mediaType) && mediaUrl) {
    const safeBgUrl = mediaUrl.replace(/"/g, '%22');
    PS_DOM.storyFullImg.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.08)), url("${safeBgUrl}")`;
  } else {
    const safeBgUrl = avatarUrl.replace(/"/g, '%22');
    PS_DOM.storyFullImg.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.55)), url("${safeBgUrl}")`;
    PS_DOM.storyFullImg.style.backgroundSize = mediaUrl && /^video\//.test(mediaType) ? 'cover' : 'contain';
  }

  if (/^video\//.test(mediaType)) {
    const videoBadge = document.createElement('div');
    videoBadge.className = 'ps-story-video-badge';
    videoBadge.innerHTML = '<i class="fa-solid fa-play"></i> Video moment';
    videoBadge.style.cssText = 'position:absolute; top:16px; left:16px; padding:8px 12px; border-radius:999px; background:rgba(0,0,0,.55); color:#fff; font-size:.75rem; font-weight:700; backdrop-filter:blur(8px);';
    PS_DOM.storyFullImg.appendChild(videoBadge);
  }

  if (caption) {
    const captionEl = document.createElement('div');
    captionEl.className = 'ps-story-caption-overlay';
    captionEl.style.cssText = 'position:absolute; left:14px; right:14px; bottom:18px; padding:14px 16px; border-radius:16px; background:linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.68)); color:#fff; font-size:.9rem; line-height:1.45; backdrop-filter:blur(8px); white-space:pre-wrap;';
    captionEl.textContent = caption;
    PS_DOM.storyFullImg.appendChild(captionEl);
  }
}

let _psHomeWidgetsLastFetched = 0;

async function psLoadHomeWidgets(force = false) {
  const now = Date.now();
  if (!force && (now - _psHomeWidgetsLastFetched) < 5000) return;
  _psHomeWidgetsLastFetched = now;

  const admirerPromise = fetch(`${API_BASE}/api/me/admirers?limit=12`, {
    method: 'GET',
    credentials: 'include'
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || data.ok !== true) {
      throw new Error((data && (data.error || data.message)) || 'Failed to load admirers.');
    }
    return {
      items: Array.isArray(data.items) ? data.items : [],
      count: Math.max(0, Number(data.count || 0))
    };
  });

  const activePromise = fetch(`${API_BASE}/api/me/active-nearby?limit=9`, {
    method: 'GET',
    credentials: 'include'
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || data.ok !== true) {
      throw new Error((data && (data.error || data.message)) || 'Failed to load active nearby.');
    }
    return Array.isArray(data.items) ? data.items : [];
  });

  const [admirersResult, activeResult] = await Promise.allSettled([admirerPromise, activePromise]);

  let admirers = [];
  let admirerCount = 0;
  if (admirersResult.status === 'fulfilled') {
    admirers = admirersResult.value.items;
    admirerCount = admirersResult.value.count;
  } else {
    renderAdmirers([]);
  }

  let activeNearby = [];
  if (activeResult.status === 'fulfilled') {
    activeNearby = activeResult.value;
  } else {
    renderActiveNearby([]);
  }

  renderAdmirers(admirers);
  if (PS_DOM.admirerCount) {
    const countToShow = admirerCount || admirers.length;
    PS_DOM.admirerCount.innerText = `${countToShow} New`;
  }
  renderActiveNearby(activeNearby);
  renderDailyPick(admirers[0] || activeNearby[0] || null);
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

  const distInput = document.getElementById("psRangeDist");
  const distVal = document.getElementById("psDistVal");
  const ageInput = document.getElementById("psRangeAge");
  const ageVal = document.getElementById("psAgeVal");

  if (!distInput || !ageInput) return;

  const me = (() => {
    try { return JSON.parse(localStorage.getItem('tm_user')); } catch (e) { return null; }
  })();
  const email = me?.email || null;
  const settingsCacheKey = email ? `ps_settings_cache:${String(email).trim().toLowerCase()}` : 'ps_settings_cache:guest';

  const settingsScope = document.querySelector('.ps-panel[data-panel="settings"]') || document;
  const toggleRows = Array.from(settingsScope.querySelectorAll('.ps-toggle-row, .ps-legal-row'));

  function findToggleByLabel(label) {
    const wanted = String(label || '').trim().toLowerCase();
    for (const row of toggleRows) {
      const textEl = row.querySelector('span');
      const input = row.querySelector('input[type="checkbox"]');
      const rowLabel = String(textEl?.textContent || '').trim().toLowerCase();
      if (input && rowLabel === wanted) return input;
    }
    return null;
  }

  const toggleMap = {
    matches: findToggleByLabel('Matches'),
    messages: findToggleByLabel('Messages'),
    soundEffects: findToggleByLabel('Sound Effects'),
    hapticFeedback: findToggleByLabel('Haptic Feedback'),
  };

  Object.entries(toggleMap).forEach(([key, input]) => {
    if (input) {
      input.dataset.settingKey = key;
      if (!input.dataset.name) {
        const labelMap = {
          matches: 'Matches notifications',
          messages: 'Messages notifications',
          soundEffects: 'Sound Effects',
          hapticFeedback: 'Haptic Feedback',
        };
        input.dataset.name = labelMap[key] || key;
      }
    }
  });

  const defaults = {
    distanceKm: Number(distInput.value) || 15,
    maxAge: Number(ageInput.value) || 26,
    notifications: {
      matches: toggleMap.matches ? !!toggleMap.matches.checked : true,
      messages: toggleMap.messages ? !!toggleMap.messages.checked : true,
    },
    appPreferences: {
      soundEffects: toggleMap.soundEffects ? !!toggleMap.soundEffects.checked : true,
      hapticFeedback: toggleMap.hapticFeedback ? !!toggleMap.hapticFeedback.checked : false,
    },
  };

  function cloneSettings(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function mergeSettings(base, incoming) {
    const next = cloneSettings(base || defaults);
    const src = (incoming && typeof incoming === 'object') ? incoming : {};

    if (src.distanceKm != null && Number.isFinite(Number(src.distanceKm))) next.distanceKm = Number(src.distanceKm);
    if (src.maxAge != null && Number.isFinite(Number(src.maxAge))) next.maxAge = Number(src.maxAge);

    if (src.notifications && typeof src.notifications === 'object') {
      next.notifications = {
        ...next.notifications,
        ...src.notifications,
      };
    }

    const appPrefs = (src.appPreferences && typeof src.appPreferences === 'object')
      ? src.appPreferences
      : ((src.preferences && typeof src.preferences === 'object') ? src.preferences : null);
    if (appPrefs) {
      next.appPreferences = {
        ...next.appPreferences,
        ...appPrefs,
      };
    }

    return next;
  }

  function applySettingsToUi(settings) {
    const safe = mergeSettings(defaults, settings);

    distInput.value = String(Number(safe.distanceKm) || defaults.distanceKm);
    ageInput.value = String(Number(safe.maxAge) || defaults.maxAge);
    if (distVal) distVal.textContent = String(Number(safe.distanceKm) || defaults.distanceKm);
    if (ageVal) ageVal.textContent = String(Number(safe.maxAge) || defaults.maxAge);

    if (toggleMap.matches) toggleMap.matches.checked = !!safe.notifications.matches;
    if (toggleMap.messages) toggleMap.messages.checked = !!safe.notifications.messages;
    if (toggleMap.soundEffects) toggleMap.soundEffects.checked = !!safe.appPreferences.soundEffects;
    if (toggleMap.hapticFeedback) toggleMap.hapticFeedback.checked = !!safe.appPreferences.hapticFeedback;
  }

  function captureSettingsFromUi() {
    return {
      distanceKm: Number(distInput.value),
      maxAge: Number(ageInput.value),
      notifications: {
        matches: toggleMap.matches ? !!toggleMap.matches.checked : defaults.notifications.matches,
        messages: toggleMap.messages ? !!toggleMap.messages.checked : defaults.notifications.messages,
      },
      appPreferences: {
        soundEffects: toggleMap.soundEffects ? !!toggleMap.soundEffects.checked : defaults.appPreferences.soundEffects,
        hapticFeedback: toggleMap.hapticFeedback ? !!toggleMap.hapticFeedback.checked : defaults.appPreferences.hapticFeedback,
      },
    };
  }

  function readLocalSettings() {
    let merged = cloneSettings(defaults);

    try {
      if (email && typeof loadPrefsForUser === 'function') {
        merged = mergeSettings(merged, loadPrefsForUser(email) || {});
      }
    } catch (e) {
      console.warn('Failed to load local prefs cache:', e);
    }

    try {
      const raw = localStorage.getItem(settingsCacheKey);
      if (raw) merged = mergeSettings(merged, JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load premium settings cache:', e);
    }

    return merged;
  }

  function saveLocalSettings(next) {
    const safe = mergeSettings(defaults, next);

    try {
      if (email && typeof savePrefsForUser === 'function') {
        savePrefsForUser(email, {
          distanceKm: safe.distanceKm,
          maxAge: safe.maxAge,
        });
      }
    } catch (e) {
      console.warn('Failed to save legacy prefs cache:', e);
    }

    try {
      localStorage.setItem(settingsCacheKey, JSON.stringify(safe));
    } catch (e) {
      console.warn('Failed to save premium settings cache:', e);
    }
  }

  applySettingsToUi(readLocalSettings());

  async function loadSettingsFromServer() {
    if (!email) return;

    try {
      const res = await fetch(`${API_BASE}/api/me/settings`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || data.ok !== true) return;

      const merged = mergeSettings(readLocalSettings(), data.settings || {});
      applySettingsToUi(merged);
      saveLocalSettings(merged);
    } catch (e) {
      console.warn('Failed to load settings from server:', e);
    }
  }

  function debounce(func, wait = 500) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  async function persistSettings(options = {}) {
    const { silent = false, trigger = '' } = options;
    if (!email) {
      if (!silent) showToast('Session expired. Please sign in again.');
      return { ok: false };
    }

    const nextPrefs = captureSettingsFromUi();
    saveLocalSettings(nextPrefs);

    try {
      const res = await fetch(`${API_BASE}/api/me/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(nextPrefs),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data && (data.message || data.error)) || 'Server Error');
      }

      const merged = mergeSettings(nextPrefs, data.settings || nextPrefs);
      saveLocalSettings(merged);

      if (!silent) {
        if (trigger) {
          showToast(trigger);
        } else {
          showToast('Preferences synced to cloud ☁️✨');
        }
      }

      return { ok: true, settings: merged };
    } catch (e) {
      console.error('Cloud Sync Failed:', e);
      if (!silent) showToast('Saved locally (Sync error)');
      return { ok: false, error: e };
    }
  }

  const debouncedPersist = debounce(() => {
    persistSettings({ silent: true });
  }, 800);

  distInput.addEventListener('input', (e) => {
    if (distVal) distVal.textContent = e.target.value;
    debouncedPersist();
  });
  distInput.addEventListener('change', () => {
    persistSettings({ trigger: 'Discovery distance updated ✨' });
  });

  ageInput.addEventListener('input', (e) => {
    if (ageVal) ageVal.textContent = e.target.value;
    debouncedPersist();
  });
  ageInput.addEventListener('change', () => {
    persistSettings({ trigger: 'Max age preference updated ✨' });
  });

  Object.values(toggleMap).filter(Boolean).forEach((toggle) => {
    toggle.addEventListener('change', (e) => {
      const settingName = e.target.dataset.name || 'Setting';
      const status = e.target.checked ? 'enabled' : 'disabled';
      persistSettings({ trigger: `${settingName} ${status}` });
    });
  });

  loadSettingsFromServer();

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

  window.clearAppCache = async () => {
    showToast('Clearing Media Cache...');
    try {
      localStorage.removeItem('ps_chat_history');
      localStorage.removeItem('ps_reset_time');
      localStorage.removeItem('ps_swipes_left');
      localStorage.removeItem(settingsCacheKey);
      if ('caches' in window && typeof window.caches.keys === 'function') {
        const keys = await window.caches.keys();
        await Promise.all(
          keys
            .filter((key) => /premium|story|moment|msg-media|ps-/i.test(String(key || '')))
            .map((key) => window.caches.delete(key))
        );
      }
    } catch (e) {
      console.warn('Clear cache failed:', e);
    }
    setTimeout(() => { showToast('Cache Cleared Successfully ✨'); }, 700);
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
      if (window.showToast) showToast("Please enter your name first.");
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
    console.log("Saved data (Backend & Local):", backendPayload);
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
                <p style="margin:8px 0 0; font-size:0.8rem; color:#9fb3c8; text-align:left;">Use at least 8 characters with uppercase, lowercase, and a number.</p>
            `,
    confirmButtonText: "Update Password",
    confirmButtonColor: "#00aff0",
    showCancelButton: true,
    background: "#15151e",
    color: "#fff",
    customClass: { container: "ps-swal-on-top" },
    focusConfirm: false,
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      const curr = String(document.getElementById("swal-curr-pass")?.value || '').trim();
      const newP = String(document.getElementById("swal-new-pass")?.value || '').trim();
      const confP = String(document.getElementById("swal-conf-pass")?.value || '').trim();

      if (!curr || !newP || !confP) {
        Swal.showValidationMessage("Fill up mo lahat ng fields.");
        return false;
      }
      if (newP !== confP) {
        Swal.showValidationMessage("Hindi match ang password, paps.");
        return false;
      }
      if (newP.length < 8) {
        Swal.showValidationMessage("Password must be at least 8 characters.");
        return false;
      }
      if (!/[a-z]/.test(newP) || !/[A-Z]/.test(newP) || !/\d/.test(newP)) {
        Swal.showValidationMessage("Use uppercase, lowercase, and at least one number.");
        return false;
      }

      try {
        const res = await fetch(`${API_BASE}/api/me/password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ currentPassword: curr, newPassword: newP })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.ok) {
          return { ok: true };
        }

        const code = String((data && (data.message || data.error || data.code)) || '');
        if (code === 'wrong_password') {
          Swal.showValidationMessage('Current password is incorrect.');
        } else if (code === 'weak_password') {
          Swal.showValidationMessage('Use at least 8 characters with uppercase, lowercase, and a number.');
        } else if (code === 'too_many_requests') {
          Swal.showValidationMessage('Too many attempts. Please try again later.');
        } else if (code === 'not_logged_in') {
          Swal.showValidationMessage('Session expired. Please sign in again.');
        } else if (code === 'auth_backend_misconfigured') {
          Swal.showValidationMessage('Password updates are temporarily unavailable. Please try again later.');
        } else {
          Swal.showValidationMessage('Unable to update password. Please try again.');
        }
        return false;
      } catch (e) {
        console.error('Change password failed:', e);
        Swal.showValidationMessage('Unable to update password. Please try again.');
        return false;
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: "success",
        title: "Password Updated",
        text: "Your password has been changed successfully.",
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

function psEscapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function psFormatNotifTime(ts) {
  const ms = Number(ts || 0);
  if (!Number.isFinite(ms) || ms <= 0) return '—';

  const diff = Date.now() - ms;
  const sec = Math.max(1, Math.floor(diff / 1000));
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;

  try {
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  } catch (_) {
    return '—';
  }
}

function psGetNotifEls() {
  const btn = document.getElementById('psBtnNotif');
  const popover = document.getElementById('psNotifPopover');
  if (!btn || !popover) return null;

  return {
    btn,
    popover,
    badge: document.getElementById('psNotifCount'),
    list: popover.querySelector('.ps-notif-list'),
    markAllBtn: popover.querySelector('.ps-popover-header .ps-btn-text')
  };
}

function psSetNotifBadge(unreadCount) {
  const els = psGetNotifEls();
  if (!els || !els.badge) return;

  const count = Math.max(0, Number(unreadCount || 0));
  els.badge.textContent = String(count);
  els.badge.style.display = count > 0 ? 'inline-flex' : 'none';
  els.btn.setAttribute('aria-label', count > 0 ? `Notifications (${count} unread)` : 'Notifications');
}

function psRenderNotifications(items, unreadCount) {
  const els = psGetNotifEls();
  if (!els || !els.list) return;

  const safeItems = Array.isArray(items) ? items : [];
  psSetNotifBadge(unreadCount);

  if (!safeItems.length) {
    els.list.innerHTML = `
      <div class="ps-notif-item" style="cursor:default; opacity:.85;">
        <div class="ps-notif-icon"><i class="fa-solid fa-bell-slash"></i></div>
        <div class="ps-notif-text">
          <p><strong>No notifications yet</strong><br>You’re all caught up.</p>
          <span>—</span>
        </div>
      </div>`;
    return;
  }

  els.list.innerHTML = safeItems.map((item) => {
    const id = psEscapeHtml(item && item.id ? item.id : '');
    const title = psEscapeHtml(item && item.title ? item.title : 'Notification');
    const message = psEscapeHtml(item && item.message ? item.message : '');
    const href = psEscapeHtml(item && item.href ? item.href : '');
    const when = psEscapeHtml(psFormatNotifTime(item && item.createdAtMs ? item.createdAtMs : 0));
    const isUnread = !(item && item.readAtMs);
    const icon = isUnread ? 'fa-bell' : 'fa-check';

    return `
      <div
        class="ps-notif-item${isUnread ? ' is-unread' : ''}"
        data-notif-id="${id}"
        data-notif-href="${href}"
        style="cursor:pointer; ${isUnread ? 'background:rgba(0,175,240,.08);' : ''}"
      >
        <div class="ps-notif-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="ps-notif-text">
          <p><strong>${title}</strong><br>${message || 'Open notification'}</p>
          <span>${when}</span>
        </div>
      </div>`;
  }).join('');
}

async function psFetchNotifications(limit = 30) {
  const res = await fetch(`${API_BASE}/api/me/notifications?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
    credentials: 'include'
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.ok !== true) {
    throw new Error((data && (data.error || data.message)) || 'Failed to load notifications.');
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    unreadCount: Math.max(0, Number(data.unreadCount || 0))
  };
}

async function psReloadNotifications(limit = 30, { silent = false } = {}) {
  const els = psGetNotifEls();
  if (!els) return;

  try {
    const isPopoverOpen = els.popover.classList.contains('active');
    if (isPopoverOpen && els.list && !silent) {
      els.list.innerHTML = `<div style="padding:16px; text-align:center; color:#8a8a8a;">Loading notifications.</div>`;
    }

    const { items, unreadCount } = await psFetchNotifications(limit);
    psRenderNotifications(items, unreadCount);
  } catch (err) {
    if (!silent) {
      if (els.list) {
        els.list.innerHTML = `<div style="padding:16px; text-align:center; color:#8a8a8a;">Failed to load notifications.</div>`;
      }
      showToast('Failed to load notifications.');
    }
  }
}

async function psMarkNotificationRead(id) {
  const notifId = String(id || '').trim();
  if (!notifId) return false;

  const res = await fetch(`${API_BASE}/api/me/notifications/mark-read`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: notifId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.ok !== true) {
    throw new Error((data && (data.error || data.message)) || 'Failed to mark notification as read.');
  }

  return true;
}

async function psMarkAllNotificationsRead() {
  const res = await fetch(`${API_BASE}/api/me/notifications/mark-all-read`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.ok !== true) {
    throw new Error((data && (data.error || data.message)) || 'Failed to mark all notifications as read.');
  }

  return true;
}

function initNotifications() {
  const btnNotif = document.getElementById('psBtnNotif');
  const popover = document.getElementById('psNotifPopover');
  if (!btnNotif || !popover) return;

  const newBtn = btnNotif.cloneNode(true);
  btnNotif.parentNode.replaceChild(newBtn, btnNotif);

  const markAllBtn = popover.querySelector('.ps-popover-header .ps-btn-text');
  const list = popover.querySelector('.ps-notif-list');

  psSetNotifBadge(Number((newBtn.querySelector('#psNotifCount') || {}).textContent || 0));
  psReloadNotifications(30, { silent: true });

  newBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const willOpen = !popover.classList.contains('active');

    newBtn.classList.toggle('active');
    popover.classList.toggle('active');

    if (willOpen) {
      await psReloadNotifications(30);
    }
  });

  if (markAllBtn) {
    markAllBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        markAllBtn.disabled = true;
        await psMarkAllNotificationsRead();
        await psReloadNotifications(30, { silent: true });
        showToast('All notifications marked as read.');
      } catch (err) {
        showToast('Failed to mark all notifications as read.');
      } finally {
        markAllBtn.disabled = false;
      }
    });
  }

  if (list) {
    list.addEventListener('click', async (e) => {
      const item = e.target.closest('.ps-notif-item[data-notif-id]');
      if (!item) return;
      e.stopPropagation();

      const notifId = String(item.getAttribute('data-notif-id') || '').trim();
      const href = String(item.getAttribute('data-notif-href') || '').trim();
      const wasUnread = item.classList.contains('is-unread');

      try {
        if (wasUnread && notifId) {
          await psMarkNotificationRead(notifId);
          item.classList.remove('is-unread');
          item.style.background = '';
          await psReloadNotifications(30, { silent: true });
        }
      } catch (err) {
        showToast('Failed to mark notification as read.');
        return;
      }

      if (href) {
        window.location.href = href;
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && !newBtn.contains(e.target)) {
      popover.classList.remove('active');
      newBtn.classList.remove('active');
    }
  });
}

function initChat() {
  const openChatAction = async (target) => {
    if (!PS_DOM.chatWindow) return;

    const resolved = psResolvePeer(target);
    const label = String(resolved.label || 'Member').trim() || 'Member';
    const avatar = String(resolved.avatar || 'assets/images/truematch-mark.png').trim() || 'assets/images/truematch-mark.png';

    if (PS_DOM.chatName) PS_DOM.chatName.textContent = label;
    if (PS_DOM.chatAvatar) PS_DOM.chatAvatar.src = avatar;

    // Siguraduhing naka-reset ang position kapag binuksan
    PS_DOM.chatWindow.style.transform = "translateX(0)";
    PS_DOM.chatWindow.style.transition = "transform 0.3s ease";

    PS_DOM.chatWindow.classList.add("active");
    document.body.classList.add("ps-chat-open");

    await psLoadChatThread(resolved, { label, avatar });
  };

  const renderMessages = (msgs) => {
    psRenderChatThread(msgs);
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

  window.sendChatMessage = async function () {
    const text = PS_DOM.chatInput ? PS_DOM.chatInput.value.trim() : "";
    if (!text) return;

    const currentName = String((PS_DOM.chatName && PS_DOM.chatName.textContent) || PS_CHAT_STATE.activePeerLabel || 'Member').trim() || 'Member';

    // optimistic local cache while server request is in flight
    if (!conversationHistory[currentName]) {
      conversationHistory[currentName] = [];
    }
    conversationHistory[currentName].push({ type: "sent", text: text });
    saveHistory();

    if (PS_DOM.chatInput) PS_DOM.chatInput.value = "";
    if (emojiPicker) emojiPicker.classList.remove("active");

    const out = await psSendMessageToActivePeer({ text });
    if (!out.ok) {
      // keep local optimistic cache; thread loader fallback will still use it
      return;
    }
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
    PS_MOMENTS_STATE.activeMomentId = '';
    if (PS_DOM.storyViewer) {
      PS_DOM.storyViewer.classList.remove("active");
      if (PS_DOM.storyProgress)
        PS_DOM.storyProgress.classList.remove("animating");
    }
  };

  const openStoryAction = (target, legacyColor) => {
    if (!PS_DOM.storyViewer) return;

    let moment = null;
    if (typeof target === 'string' && PS_MOMENTS_STATE.byId[target]) {
      moment = PS_MOMENTS_STATE.byId[target];
    } else if (target && typeof target === 'object' && target.momentId && PS_MOMENTS_STATE.byId[target.momentId]) {
      moment = PS_MOMENTS_STATE.byId[target.momentId];
    } else if (target && typeof target === 'object' && target.id) {
      moment = psNormalizeMoment(target);
    } else {
      const name = String(target || 'User').trim() || 'User';
      moment = psNormalizeMoment({
        id: `legacy_${name}`,
        ownerName: name,
        ownerAvatarUrl: 'assets/images/truematch-mark.png',
        caption: '',
        mediaUrl: '',
        mediaType: '',
        createdAtMs: Date.now(),
        expiresAtMs: Date.now() + (24 * 60 * 60 * 1000)
      });
      moment.accent = legacyColor || '#00aff0';
    }

    PS_MOMENTS_STATE.activeMomentId = String(moment.id || '').trim();
    if (PS_MOMENTS_STATE.activeMomentId) {
      PS_MOMENTS_STATE.byId[PS_MOMENTS_STATE.activeMomentId] = moment;
    }

    PS_DOM.storyName.textContent = moment.ownerName || 'User';
    PS_DOM.storyAvatar.src = moment.ownerAvatarUrl || 'assets/images/truematch-mark.png';

    if (PS_DOM.storyCommentInput) PS_DOM.storyCommentInput.value = "";
    if (PS_DOM.storyEmojiPicker)
      PS_DOM.storyEmojiPicker.classList.remove("active");

    psApplyMomentToViewer(moment);
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

    const activeMoment = PS_MOMENTS_STATE.byId[PS_MOMENTS_STATE.activeMomentId] || null;
    const target = activeMoment
      ? {
          name: activeMoment.ownerName || PS_DOM.storyName.textContent,
          peerEmail: activeMoment.ownerEmail || '',
          avatar: activeMoment.ownerAvatarUrl || 'assets/images/truematch-mark.png'
        }
      : { name: PS_DOM.storyName.textContent };

    window.closeStory();
    const matchesBtn = document.querySelector('button[data-panel="matches"]');
    if (matchesBtn) matchesBtn.click();

    setTimeout(() => {
      window.openChat(target);
      if (PS_DOM.chatInput) PS_DOM.chatInput.value = text;
      if (typeof window.sendChatMessage === 'function') {
        window.sendChatMessage();
      }
      showToast("Reply sent!");
    }, 400);

    if (PS_DOM.storyCommentInput) PS_DOM.storyCommentInput.value = "";
    if (PS_DOM.storyEmojiPicker)
      PS_DOM.storyEmojiPicker.classList.remove("active");
  };

  window.postNewStory = async function () {
    const text = PS_DOM.storyInput ? PS_DOM.storyInput.value.trim() : "";
    if (!text) {
      showToast("Please write something!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/moments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ caption: text })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data && (data.message || data.error)) || 'Failed to share moment.');
      }

      if (PS_DOM.storyInput) PS_DOM.storyInput.value = "";
      window.closeAddStory();
      await psLoadMoments(true);
      showToast("Moment Shared!");
    } catch (err) {
      console.error('postNewStory error:', err);
      showToast(String(err && err.message ? err.message : 'Failed to share moment.'), 'error');
    }
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
  let btnText = "Upgrade Now";
  let btnAction = "switchTab('premium')";

  // Pag-check ng detailed status mula sa PS_STATE
// --- ETO ANG AYOS NA PENDING LOGIC (PHASE 7) ---
  if (eligible && status === 'pending') {
    title = "Application Pending";
    msg = "Nire-review na namin ang iyong profile. Balik ka dito mamaya.";
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
// ==========================================
// Premium Society Matches (backend synced)
// Only matches created from Premium Society swipes will appear here.
// ==========================================
let _psMatchesLastFetched = 0;

function _psFormatTime(ts) {
  const t = Number(ts || 0);
  if (!t) return '';
  const d = new Date(t);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString();
}

function _psSafeName(v) {
  const s = String(v || '').trim();
  return s || 'Member';
}

async function psLoadMatches(force = false) {
  if (!PS_DOM.matchesContainer) return;

  if (!force && (Date.now() - _psMatchesLastFetched) < 4000) return;
  _psMatchesLastFetched = Date.now();

  try {
    // lightweight loading state
    PS_DOM.matchesContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">Loading matches...</div>`;

    const res = await fetch(`${API_BASE}/api/premium-society/matches`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || data.ok !== true) {
      const msg = (data && data.message) ? data.message : 'Failed to load matches.';
      PS_DOM.matchesContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">${msg}</div>`;
      if (PS_DOM.newMatchesRail) PS_DOM.newMatchesRail.innerHTML = '';
      if (PS_DOM.newMatchCount) PS_DOM.newMatchCount.textContent = '0';
      return;
    }

    const matches = Array.isArray(data.matches) ? data.matches : [];

    // NEW MATCHES RAIL
    if (PS_DOM.newMatchesRail) {
      PS_DOM.newMatchesRail.innerHTML = '';
      matches.slice(0, 12).forEach((m) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ps-newmatch';
        const img = document.createElement('img');
        img.className = 'ps-newmatch-avatar';
        img.alt = _psSafeName(m.name || m.username);
        img.src = m.photoUrl || 'assets/images/truematch-mark.png';
        btn.appendChild(img);

        btn.addEventListener('click', () => {
          const label = _psSafeName(m.name || (m.username ? '@' + String(m.username).replace(/^@/, '') : 'Member'));
          const peerEmail = String(m.email || m.id || '').trim().toLowerCase();
          const avatar = m.photoUrl || 'assets/images/truematch-mark.png';
          psRememberPeer(peerEmail, label, avatar);
          if (window.openChat) window.openChat({ name: label, peerEmail, avatar });
          // keep tab on matches - chat UI will overlay
        });

        PS_DOM.newMatchesRail.appendChild(btn);
      });
    }

    if (PS_DOM.newMatchCount) PS_DOM.newMatchCount.textContent = String(matches.length);

    let messageMeta = {};
    try {
      const metaRes = await fetch(`${API_BASE}/api/me/messages/meta`, {
        method: 'GET',
        credentials: 'include'
      });
      const metaData = await metaRes.json().catch(() => ({}));
      if (metaRes.ok && metaData && metaData.ok && metaData.items && typeof metaData.items === 'object') {
        messageMeta = metaData.items;
      }
    } catch (_) {}

    // MESSAGES LIST (use existing renderMessages UI)
    const messages = matches.map((m) => {
      const label = _psSafeName(m.name || (m.username ? '@' + String(m.username).replace(/^@/, '') : 'Member'));
      const peerEmail = String(m.email || m.id || '').trim().toLowerCase();
      const avatar = m.photoUrl || 'assets/images/truematch-mark.png';
      psRememberPeer(peerEmail, label, avatar);

      const meta = (peerEmail && messageMeta && typeof messageMeta === 'object') ? (messageMeta[peerEmail] || {}) : {};
      const lastAt = Number(meta.lastMessageAtMs || m.updatedAtMs || m.createdAtMs || 0) || 0;
      const lastRead = Number(meta.lastReadAtMs || 0) || 0;
      const preview = String(meta.lastMessageText || '').trim() || 'Tap to chat';

      return {
        name: label.replace(/'/g, "\'"),
        peerEmail,
        avatar,
        time: _psFormatTime(lastAt),
        text: preview,
        unread: lastAt > 0 && lastAt > lastRead,
        updatedAtMs: lastAt
      };
    });

    renderMessages(messages);
  } catch (err) {
    console.error('psLoadMatches error:', err);
    PS_DOM.matchesContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">Failed to load matches.</div>`;
    if (PS_DOM.newMatchesRail) PS_DOM.newMatchesRail.innerHTML = '';
    if (PS_DOM.newMatchCount) PS_DOM.newMatchCount.textContent = '0';
  }
}

function switchTab(panelName) {
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

  // Load Premium Society matches (isolated from dashboard matches)
  if (panelName === "matches") {
    psLoadMatches();
  }

  if (panelName === "home") {
    psLoadHomeWidgets();
    psLoadMoments();
  }
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

// --- 1. GIFT SYSTEM LOGIC (TEMP DISABLED) ---
window.closeGiftModal = () => {
  if (PS_DOM.giftModal) PS_DOM.giftModal.classList.remove("active");
};

window.selectGift = () => {
  showToast('Gift feature is temporarily unavailable.');
};

window.sendSelectedGift = async () => {
  window.closeGiftModal();
  showToast('Gift feature is temporarily unavailable.');
  return { ok: false, disabled: true };
};

// --- 2. MATCH OVERLAY LOGIC ---
window.triggerMatchOverlay = (person) => {
  if (!PS_DOM.matchOverlay) return;

  PS_CHAT_STATE.matchOverlayTarget = person || null;

  const label = _psSafeName((person && person.name) || 'Member');
  const peerEmail = String((person && (person.email || person.id)) || '').trim().toLowerCase();
  const avatar = (person && (person.photoUrl || person.avatar)) || 'assets/images/truematch-mark.png';
  psRememberPeer(peerEmail, label, avatar);

  if (PS_DOM.matchName) PS_DOM.matchName.textContent = label;

  if (PS_DOM.matchTargetImg) {
    if (person && (person.photoUrl || person.avatar)) {
      PS_DOM.matchTargetImg.src = person.photoUrl || person.avatar;
    } else {
      PS_DOM.matchTargetImg.style.background = (person && person.color) || "#00aff0";
    }
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
  const label = (PS_DOM.matchName && PS_DOM.matchName.textContent) || 'Member';
  const target = PS_CHAT_STATE.matchOverlayTarget || { name: label, peerEmail: PS_CHAT_STATE.peersByLabel[label] || '', avatar: PS_CHAT_STATE.avatarsByLabel[label] || 'assets/images/truematch-mark.png' };
  window.closeMatchOverlay();

  const matchesBtn = document.querySelector('button[data-panel="matches"]');
  if (matchesBtn) matchesBtn.click();

  setTimeout(() => {
    if (window.openChat) window.openChat(target);
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