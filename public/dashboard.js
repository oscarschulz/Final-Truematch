// ---------------------------------------------------------------------
// TrueMatch Dashboard – Main Controller (Final Fixed Version)
// ---------------------------------------------------------------------

import { getLocalPlan, saveLocalUser, clearSession } from './tm-session.js';
import { apiGet, apiPost, apiUpdateProfile, apiSavePrefs } from './tm-api.js';

// ---------------------------------------------------------------------
// CONFIG & DEV MODE
// ---------------------------------------------------------------------
const DEV_MODE = true; // Set to FALSE if you have a real backend running.

// Mock User Data (Fallback)
function getMockUser() {
  return {
    id: 1, name: 'Miguel', email: 'miguel@truematch.com', age: 27, city: 'Manila',
    avatarUrl: 'assets/images/truematch-mark.png', plan: 'tier2',
    creatorStatus: 'approved', premiumStatus: 'none', hasCreatorAccess: true
  };
}

// ---------------------------------------------------------------------
// 1. GLOBAL STATE
// ---------------------------------------------------------------------
const state = {
  me: null,
  prefs: null,
  plan: 'free',
  activeTab: 'home',
  isLoading: false,
};

// ---------------------------------------------------------------------
// 2. DOM ELEMENTS CACHE
// ---------------------------------------------------------------------
const DOM = {};

function cacheDom() {
  // Navigation
  DOM.tabs = document.querySelectorAll('.nav-btn');
  DOM.panels = document.querySelectorAll('.panel[data-panel]');
  DOM.btnLogout = document.getElementById('btn-logout');

  // Header & Home
  DOM.brandName = document.querySelector('.brand__name');
  DOM.homeWelcomeName = document.getElementById('homeWelcomeName');
  DOM.homePlanPill = document.getElementById('homePlanPill');
  DOM.homePlanSummary = document.getElementById('homePlanSummary');
  DOM.storiesContainer = document.getElementById('storiesContainer');
  
  // Settings / Profile Display
  DOM.sAvatar = document.getElementById('sAvatar');
  DOM.sNameDisplay = document.getElementById('sNameDisplay');
  DOM.sEmailDisplay = document.getElementById('sEmailDisplay');
  DOM.dispCity = document.getElementById('dispCity');
  DOM.dispAge = document.getElementById('dispAge');
  DOM.dispLooking = document.getElementById('dispLooking');

  // Modals (Dialogs)
  DOM.dlgProfile = document.getElementById('dlgProfile');
  DOM.frmProfile = document.getElementById('frmProfile');
  DOM.btnEditProfile = document.getElementById('btnEditProfile');
  DOM.btnCloseProfile = document.getElementById('btnCancelProfile'); 

  DOM.dlgPassword = document.getElementById('dlgPassword');
  DOM.frmPassword = document.getElementById('frmPassword');
  DOM.btnChangePassword = document.getElementById('btnChangePassword');
  DOM.btnCancelPassword = document.getElementById('btnCancelPassword');

  // Inputs
  DOM.inpName = document.getElementById('inpName');
  DOM.inpEmail = document.getElementById('inpEmail');
  DOM.inpCity = document.getElementById('inpCity');
  DOM.inpUserAge = document.getElementById('inpUserAge');
  DOM.inpAvatarFile = document.getElementById('inpAvatarFile');
  DOM.inpAgeMin = document.getElementById('inpAgeMin');
  DOM.inpAgeMax = document.getElementById('inpAgeMax');
  DOM.inpEthnicity = document.getElementById('inpEthnicity');
  DOM.inpLooking = document.getElementById('inpLooking');

  // Swipe UI (Main)
  DOM.swipeStack = document.getElementById('swipeStack');
  DOM.swipeEmpty = document.getElementById('swipeEmpty');
  DOM.swipeControls = document.getElementById('swipeControls');
  DOM.btnSwipePass = document.getElementById('btnSwipePass');
  DOM.btnSwipeLike = document.getElementById('btnSwipeLike');
  DOM.btnRefreshSwipe = document.getElementById('btnRefreshSwipe');

  // Sidebar Widgets
  DOM.btnSidebarSubscribe = document.getElementById('btnSidebarSubscribe'); 
  DOM.btnQuickPass = document.getElementById('btnQuickPass');
  DOM.btnQuickLike = document.getElementById('btnQuickLike');
  DOM.btnQuickPass2 = document.getElementById('btnQuickPass2');
  DOM.btnQuickLike2 = document.getElementById('btnQuickLike2');
  
  DOM.statsRingCircle = document.getElementById('statsRingCircle');
  DOM.statsCountDisplay = document.getElementById('statsCountDisplay');

  // Panel Containers
  DOM.matchesContainer = document.getElementById('matchesContainer');
  DOM.panelShortlistBody = document.querySelector('[data-panel="shortlist"]');
  DOM.panelApprovedBody = document.getElementById('premiumStateApproved');
  
  // Applications
  DOM.btnOpenCreatorApply = document.getElementById('btnOpenCreatorApply');
  DOM.dlgCreatorApply = document.getElementById('dlgCreatorApply');
  DOM.btnCloseCreatorApply = document.getElementById('btnCloseCreatorApply');
  
  // Premium Application
  DOM.btnOpenPremiumApply = document.getElementById('btnOpenPremiumApplyMain');
  DOM.dlgPremiumApply = document.getElementById('dlgPremiumApply');
  DOM.btnPremiumCancel = document.getElementById('btnPremiumCancel');

  // Utilities
  DOM.toast = document.getElementById('tm-toast');
}

// ---------------------------------------------------------------------
// 3. UI HELPERS
// ---------------------------------------------------------------------
function showToast(msg, type = 'success') {
  if (!DOM.toast) return;
  DOM.toast.textContent = msg;
  DOM.toast.className = `toast toast--visible ${type === 'error' ? 'toast--error' : ''}`;
  setTimeout(() => DOM.toast.classList.remove('toast--visible'), 3000);
}

function normalizePlanKey(rawPlan) {
  if (!rawPlan) return 'free';
  const p = String(rawPlan).toLowerCase().replace(/\s+/g, '');
  if (p.includes('plus') || p.includes('tier1')) return 'tier1';
  if (p.includes('elite') || p.includes('tier2')) return 'tier2';
  if (p.includes('concierge') || p.includes('tier3')) return 'tier3';
  return 'free';
}

function getRandomColor() {
  const colors = ['#FF3366', '#3ad4ff', '#00ffbf', '#fcd34d', '#b197fc'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function updateSwipeStats(current, max) {
    if(DOM.statsCountDisplay) DOM.statsCountDisplay.textContent = current;
    if(DOM.statsRingCircle) {
        // Circumference of circle r=40 is approx 251
        const percent = current / max;
        const offset = 251 - (251 * percent);
        DOM.statsRingCircle.style.strokeDashoffset = offset;
    }
}

// ---------------------------------------------------------------------
// 4. MAIN LOGIC: INITIALIZATION
// ---------------------------------------------------------------------

async function initApp() {
  cacheDom();

  // 1. Load User Data
  await loadMe();

  // 2. Initialize Swipe
  SwipeController.init();

  // 3. Populate Mock Data
  populateMockContent();

  // 4. Setup Event Listeners
  setupEventListeners();

  // 5. Initial Stats
  updateSwipeStats(20, 50);
}

function setupEventListeners() {
  // --- Navigation ---
  DOM.tabs.forEach(tab => {
    if (tab.dataset.panel) {
        tab.addEventListener('click', () => {
            setActiveTab(tab.dataset.panel);
        });
    }
  });

  // --- Logout ---
  if (DOM.btnLogout) {
    DOM.btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      sessionStorage.clear();
      window.location.href = 'index.html'; // Adjust if needed
    });
  }

  // --- Profile Editing ---
  if (DOM.btnEditProfile) {
    DOM.btnEditProfile.addEventListener('click', () => {
      syncFormToState();
      DOM.dlgProfile.showModal();
    });
  }
  if (DOM.btnCloseProfile) DOM.btnCloseProfile.addEventListener('click', () => DOM.dlgProfile.close());

  if (DOM.frmProfile) {
    DOM.frmProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleProfileSave();
    });
  }

  // --- Password ---
  if (DOM.btnChangePassword) DOM.btnChangePassword.addEventListener('click', () => DOM.dlgPassword.showModal());
  if (DOM.btnCancelPassword) DOM.btnCancelPassword.addEventListener('click', () => DOM.dlgPassword.close());

  // --- Applications ---
  if (DOM.btnOpenCreatorApply) DOM.btnOpenCreatorApply.addEventListener('click', () => DOM.dlgCreatorApply.showModal());
  if (DOM.btnCloseCreatorApply) DOM.btnCloseCreatorApply.addEventListener('click', () => DOM.dlgCreatorApply.close());
  
  // Premium Modal Logic
  const openPremium = (e) => {
      if(e) e.preventDefault();
      if(DOM.dlgPremiumApply) DOM.dlgPremiumApply.showModal();
  };

  if (DOM.btnOpenPremiumApply) DOM.btnOpenPremiumApply.addEventListener('click', openPremium);
  if (DOM.btnPremiumCancel) DOM.btnPremiumCancel.addEventListener('click', () => DOM.dlgPremiumApply.close());
  if (DOM.btnSidebarSubscribe) DOM.btnSidebarSubscribe.addEventListener('click', openPremium);

  // --- Swipe Actions (Main & Sidebar) ---
  const handlePass = () => SwipeController.pass();
  const handleLike = () => SwipeController.like();

  if (DOM.btnSwipePass) DOM.btnSwipePass.addEventListener('click', handlePass);
  if (DOM.btnSwipeLike) DOM.btnSwipeLike.addEventListener('click', handleLike);
  if (DOM.btnRefreshSwipe) DOM.btnRefreshSwipe.addEventListener('click', () => SwipeController.init());

  if (DOM.btnQuickPass) DOM.btnQuickPass.addEventListener('click', handlePass);
  if (DOM.btnQuickLike) DOM.btnQuickLike.addEventListener('click', handleLike);
  if (DOM.btnQuickPass2) DOM.btnQuickPass2.addEventListener('click', handlePass);
  if (DOM.btnQuickLike2) DOM.btnQuickLike2.addEventListener('click', handleLike);
}

function setActiveTab(tabName) {
  state.activeTab = tabName;

  DOM.tabs.forEach(t => {
    if (t.dataset.panel === tabName) t.classList.add('is-active');
    else t.classList.remove('is-active');
  });

  DOM.panels.forEach(p => {
    if (p.dataset.panel === tabName) {
      p.hidden = false;
      p.classList.add('is-active');
    } else {
      p.hidden = true;
      p.classList.remove('is-active');
    }
  });
}

// ---------------------------------------------------------------------
// 5. MOCK DATA POPULATION
// ---------------------------------------------------------------------

function populateMockContent() {
  console.log("Populating mock data...");

  // A. MATCHES GRID
  const matches = [
    { name: 'Sofia', age: 24, loc: 'Makati', img: 'assets/images/truematch-mark.png' },
    { name: 'Chloe', age: 22, loc: 'BGC', img: 'assets/images/truematch-mark.png' },
    { name: 'Liam', age: 26, loc: 'Ortigas', img: 'assets/images/truematch-mark.png' },
    { name: 'Noah', age: 25, loc: 'QC', img: 'assets/images/truematch-mark.png' },
    { name: 'Ava', age: 23, loc: 'Alabang', img: 'assets/images/truematch-mark.png' }
  ];

  if (DOM.matchesContainer) {
    let html = '';
    matches.forEach(m => {
      html += `
        <div class="match-card">
          <img src="${m.img}" class="match-img" alt="${m.name}" style="background:${getRandomColor()}">
          <div class="match-info">
            <h3 style="margin:0">${m.name}, ${m.age}</h3>
            <p class="muted tiny">${m.loc}</p>
            <div class="match-actions" style="margin-top:10px;">
              <button class="btn btn--sm btn--primary" style="width:100%">Chat</button>
            </div>
          </div>
        </div>
      `;
    });
    if(matches.length > 0) DOM.matchesContainer.innerHTML = html;
  }

  // B. SHORTLIST (Inject into Shortlist Panel)
  if (DOM.panelShortlistBody) {
    // Check if we already populated it to avoid dupes
    const existingGrid = DOM.panelShortlistBody.querySelector('.matches-grid');
    if(!existingGrid) {
        const shortlisted = [
            { name: 'Isabella', age: 24, job: 'Model', loc: 'Rockwell' },
            { name: 'Marcus', age: 29, job: 'CEO', loc: 'Forbes Park' }
        ];
        
        let html = '<div class="matches-grid" style="margin-top:20px;">';
        shortlisted.forEach(s => {
          html += `
            <div class="glass-card" style="border: 1px solid #ffd700; background: rgba(255, 215, 0, 0.05); text-align:center; padding:15px;">
                <div style="width:50px; height:50px; border-radius:50%; background:#333; margin:0 auto 10px; border:2px solid #ffd700;"></div>
                <h3 style="margin:0; color:#ffd700;">${s.name}</h3>
                <p class="tiny muted">${s.job}</p>
                <button class="btn btn--sm btn--ghost" style="width:100%; margin-top:10px; border-color:#ffd700; color:#ffd700;">Connect</button>
            </div>
          `;
        });
        html += '</div>';
        DOM.panelShortlistBody.insertAdjacentHTML('beforeend', html);
    }
  }

  // C. STORIES
  if (DOM.storiesContainer) {
    const stories = ['Bea', 'Kat', 'Pia', 'Coleen', 'Sam'];
    let html = `
        <div class="story-item action" onclick="document.querySelector('[data-panel=swipe]').click()">
          <div class="story-ring ring-add"><i class="fa-solid fa-plus"></i></div>
          <span class="story-name">Add</span>
        </div>`;
    stories.forEach(name => {
      html += `
        <div class="story-item">
          <div class="story-ring">
            <img class="story-img" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
          </div>
          <span class="story-name">${name}</span>
        </div>
      `;
    });
    DOM.storiesContainer.innerHTML = html;
  }
}

// ---------------------------------------------------------------------
// 6. USER DATA LOADING
// ---------------------------------------------------------------------

async function loadMe() {
  try {
    let user, prefs;

    if (DEV_MODE) {
      user = getMockUser();
      prefs = { city: 'Manila', ageMin: 21, ageMax: 35, ethnicity: 'any', lookingFor: ['women'] };
    } else {
      const data = await apiGet('/api/me');
      if (!data || !data.ok || !data.user) {
        // window.location.href = 'auth.html?mode=login'; 
        console.warn("User not logged in or API failed.");
        user = getMockUser(); // Fallback for stability
      } else {
          user = data.user;
          prefs = data.prefs || user.preferences || {};
      }
    }

    state.me = user;
    state.prefs = prefs;
    state.plan = normalizePlanKey(user.plan);

    renderHome(user);
    renderSettingsDisplay(user, prefs);
    applyPlanNavGating();

  } catch (err) {
    console.error("Error loading user:", err);
    showToast("Failed to load user data", "error");
  }
}

function renderHome(user) {
  if (DOM.homeWelcomeName) DOM.homeWelcomeName.textContent = user.name;
  if (DOM.homePlanPill) DOM.homePlanPill.textContent = state.plan.toUpperCase();
  
  if (DOM.homePlanSummary) {
    if (state.plan === 'tier3') DOM.homePlanSummary.textContent = "Concierge Service Active.";
    else if (state.plan === 'tier2') DOM.homePlanSummary.textContent = "Elite Member Access.";
    else DOM.homePlanSummary.textContent = "Upgrade for more daily swipes.";
  }
}

function applyPlanNavGating() {
  if (DEV_MODE) return; 

  const rules = {
    free: ['home', 'matches', 'swipe', 'creators', 'premium', 'settings'],
    tier1: ['home', 'matches', 'swipe', 'creators', 'premium', 'settings'],
    tier2: ['home', 'matches', 'shortlist', 'approved', 'swipe', 'creators', 'premium', 'settings'],
    tier3: ['home', 'matches', 'shortlist', 'approved', 'confirmed', 'swipe', 'creators', 'premium', 'settings']
  };

  const allowed = rules[state.plan] || rules.free;

  DOM.tabs.forEach(tab => {
    const panel = tab.dataset.panel;
    if (allowed.includes(panel)) {
      tab.hidden = false;
      tab.style.display = 'flex';
    } else {
      tab.hidden = true;
      tab.style.display = 'none';
    }
  });
}

// ---------------------------------------------------------------------
// 7. SETTINGS & PROFILE
// ---------------------------------------------------------------------

function renderSettingsDisplay(user, prefs) {
  if (DOM.sNameDisplay) DOM.sNameDisplay.textContent = user.name;
  if (DOM.sEmailDisplay) DOM.sEmailDisplay.textContent = user.email;
  if (DOM.sAvatar && user.avatarUrl) DOM.sAvatar.src = user.avatarUrl;

  if (DOM.dispCity) DOM.dispCity.textContent = user.city || '—';
  if (DOM.dispAge) DOM.dispAge.textContent = prefs && prefs.ageMin ? `${prefs.ageMin} - ${prefs.ageMax}` : '—';
  
  if (prefs) {
      const looking = Array.isArray(prefs.lookingFor) ? prefs.lookingFor.join(', ') : prefs.lookingFor;
      if (DOM.dispLooking) DOM.dispLooking.textContent = looking || '—';
  }
}

function syncFormToState() {
  const { me, prefs } = state;
  if (!me) return;

  if (DOM.inpName) DOM.inpName.value = me.name || '';
  if (DOM.inpEmail) DOM.inpEmail.value = me.email || '';
  if (DOM.inpCity) DOM.inpCity.value = me.city || '';
  if (DOM.inpUserAge) DOM.inpUserAge.value = me.age || '';

  if (prefs) {
    if (DOM.inpAgeMin) DOM.inpAgeMin.value = prefs.ageMin || 18;
    if (DOM.inpAgeMax) DOM.inpAgeMax.value = prefs.ageMax || 50;
    if (DOM.inpEthnicity) DOM.inpEthnicity.value = prefs.ethnicity || 'any';
    if (DOM.inpLooking) DOM.inpLooking.value = Array.isArray(prefs.lookingFor) ? prefs.lookingFor[0] : (prefs.lookingFor || 'both');
  }
}

async function handleProfileSave() {
  // Safe extraction of values
  const payload = {
    name: DOM.inpName ? DOM.inpName.value : '',
    email: DOM.inpEmail ? DOM.inpEmail.value : '',
    city: DOM.inpCity ? DOM.inpCity.value : '',
    age: DOM.inpUserAge ? parseInt(DOM.inpUserAge.value) : 18,
    preferences: {
      ageMin: DOM.inpAgeMin ? parseInt(DOM.inpAgeMin.value) : 18,
      ageMax: DOM.inpAgeMax ? parseInt(DOM.inpAgeMax.value) : 50,
      ethnicity: DOM.inpEthnicity ? DOM.inpEthnicity.value : 'any',
      lookingFor: DOM.inpLooking ? [DOM.inpLooking.value] : ['both']
    }
  };

  try {
    let res;
    if (DEV_MODE) {
      res = { ok: true, user: { ...state.me, ...payload } }; 
    } else {
      res = await apiUpdateProfile(payload); 
    }

    if (res && res.ok) {
      showToast('Profile updated successfully!');
      state.me = { ...state.me, ...payload }; 
      state.prefs = payload.preferences;
      renderSettingsDisplay(state.me, state.prefs); 
      renderHome(state.me);
      DOM.dlgProfile.close();
    } else {
      showToast('Failed to update profile', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('An error occurred', 'error');
  }
}

// ---------------------------------------------------------------------
// 8. SWIPE CONTROLLER
// ---------------------------------------------------------------------

const SwipeController = (() => {
  let profiles = [];
  let currentIndex = 0;
  let isLoading = false;

  async function init() {
    await loadCandidates();
  }

  async function loadCandidates() {
    if (isLoading) return;
    isLoading = true;
    
    if (DOM.swipeStack) DOM.swipeStack.innerHTML = ''; 
    if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = true;

    try {
      let data;
      if (DEV_MODE) {
        // Mock Swipe Candidates
        data = { candidates: [
          { id: 1, name: 'Alice', age: 24, city: 'Makati', photoUrl: 'assets/images/truematch-mark.png' },
          { id: 2, name: 'Bea', age: 22, city: 'BGC', photoUrl: 'assets/images/truematch-mark.png' },
          { id: 3, name: 'Cathy', age: 25, city: 'Pasig', photoUrl: 'assets/images/truematch-mark.png' }
        ]};
      } else {
        data = await apiGet('/api/swipe/candidates');
      }

      if (data && data.candidates && data.candidates.length > 0) {
        profiles = data.candidates;
        currentIndex = 0;
        renderCards();
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'flex';
      } else {
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
      }
    } catch (e) {
      console.error("Swipe Error", e);
    } finally {
      isLoading = false;
    }
  }

  function renderCards() {
    if (!DOM.swipeStack) return;
    DOM.swipeStack.innerHTML = '';

    const cardLimit = 2;
    const cardsToRender = profiles.slice(currentIndex, currentIndex + cardLimit).reverse();

    cardsToRender.forEach((p, idx) => {
      const isTop = idx === cardsToRender.length - 1;
      const card = document.createElement('div');
      card.className = 'swipe-card';
      const img = p.photoUrl || 'assets/images/truematch-mark.png';
      
      card.style.backgroundImage = `url('${img}')`;
      card.style.backgroundColor = getRandomColor(); 
      
      if (isTop) {
        card.id = 'activeSwipeCard';
        card.style.zIndex = 10;
        card.style.opacity = 1;
        card.style.transform = 'scale(1)';
      } else {
        card.style.zIndex = 5;
        card.style.opacity = 0.5;
        card.style.transform = 'scale(0.95) translateY(10px)';
      }

      card.innerHTML = `
        <div class="swipe-card__info">
           <h2>${p.name} <span>${p.age}</span></h2>
           <p>📍 ${p.city}</p>
        </div>
      `;
      DOM.swipeStack.appendChild(card);
    });
  }

  async function handleAction(type) {
    if (currentIndex >= profiles.length) return;
    
    // Animate Main Card
    const card = document.getElementById('activeSwipeCard');
    if (card) {
      card.classList.add(type === 'like' ? 'swipe-out-right' : 'swipe-out-left');
    }

    // Animate Sidebar Teaser (Visual Feedback)
    const teaser = document.querySelector('.teaser-profile');
    if(teaser) {
        teaser.style.transition = "transform 0.2s";
        teaser.style.transform = type === 'like' ? "scale(1.05)" : "scale(0.95)";
        setTimeout(()=> teaser.style.transform = "scale(1)", 200);
    }

    // Call API if not in dev mode
    if (!DEV_MODE) {
       apiPost('/api/swipe/action', { targetId: profiles[currentIndex].id, type });
    }
    
    // Update Stats
    let currentStats = parseInt(DOM.statsCountDisplay ? DOM.statsCountDisplay.textContent : "20");
    if(currentStats > 0) updateSwipeStats(currentStats - 1, 50);

    showToast(type === 'like' ? 'Liked!' : 'Passed');

    setTimeout(() => {
      currentIndex++;
      if (currentIndex >= profiles.length) {
        if (DOM.swipeStack) DOM.swipeStack.innerHTML = '';
        if (DOM.swipeEmpty) DOM.swipeEmpty.hidden = false;
        if (DOM.swipeControls) DOM.swipeControls.style.display = 'none';
      } else {
        renderCards();
      }
    }, 300);
  }

  return {
    init,
    like: () => handleAction('like'),
    pass: () => handleAction('pass')
  };
})();

// Start everything
window.addEventListener('DOMContentLoaded', initApp);