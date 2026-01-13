// ---------------------------------------------------------------------
// iTrueMatch Dashboard – Main Controller (Fixed: Consistent Chat History)
// ---------------------------------------------------------------------

import { getLocalPlan, saveLocalUser, clearSession } from './tm-session.js';
import { apiGet, apiPost, apiUpdateProfile, apiSavePrefs } from './tm-api.js';

const DEV_MODE = true; 
const DAILY_SWIPE_LIMIT = 20; 

function getMockUser() {
  return {
    id: 1, name: 'Miguel', email: 'miguel@itruematch.com', age: 27, city: 'New York',
    avatarUrl: 'assets/images/truematch-mark.png', plan: 'tier2',
    creatorStatus: 'approved', premiumStatus: 'none', hasCreatorAccess: true
  };
}

const state = { me: null, prefs: null, plan: 'free', activeTab: 'home', isLoading: false };
const DOM = {};

function cacheDom() {
  DOM.tabs = document.querySelectorAll('.nav-btn');
  DOM.panels = document.querySelectorAll('.panel[data-panel]');
  DOM.btnLogout = document.getElementById('btn-logout');
  DOM.homeWelcomeName = document.getElementById('homeWelcomeName');
  DOM.homePlanPill = document.getElementById('homePlanPill');
  DOM.homePlanSummary = document.getElementById('homePlanSummary');
  DOM.storiesContainer = document.getElementById('storiesContainer');
  DOM.admirerContainer = document.getElementById('admirerContainer');
  DOM.admirerCount = document.getElementById('admirerCount');
  
  DOM.newMatchesRail = document.getElementById('newMatchesRail');
  DOM.matchesContainer = document.getElementById('matchesContainer');
  DOM.newMatchCount = document.getElementById('newMatchCount');
  DOM.dlgChat = document.getElementById('dlgChat');
  DOM.chatUserImg = document.getElementById('chatUserImg');
  DOM.chatUserName = document.getElementById('chatUserName');
  DOM.chatBody = document.getElementById('chatBody');
  DOM.btnCloseChat = document.getElementById('btnCloseChat');

  DOM.activeNearbyContainer = document.getElementById('activeNearbyContainer');
  DOM.btnNotifToggle = document.getElementById('btnNotifToggle');
  DOM.notifDropdown = document.getElementById('notifDropdown');
  DOM.dlgStory = document.getElementById('dlgStory');
  DOM.storyMainImg = document.getElementById('storyMainImg');
  DOM.storyUserImg = document.getElementById('storyUserImg');
  DOM.storyUserName = document.getElementById('storyUserName');
  DOM.btnCloseStory = document.getElementById('btnCloseStory');
  DOM.sAvatar = document.getElementById('sAvatar');
  DOM.sNameDisplay = document.getElementById('sNameDisplay');
  DOM.sEmailDisplay = document.getElementById('sEmailDisplay');
  DOM.dispCity = document.getElementById('dispCity');
  DOM.dispAge = document.getElementById('dispAge');
  DOM.dispLooking = document.getElementById('dispLooking');
  DOM.dlgProfile = document.getElementById('dlgProfile');
  DOM.frmProfile = document.getElementById('frmProfile');
  DOM.btnEditProfile = document.getElementById('btnEditProfile');
  DOM.btnCloseProfile = document.getElementById('btnCancelProfile'); 
  DOM.dlgPassword = document.getElementById('dlgPassword');
  DOM.frmPassword = document.getElementById('frmPassword');
  DOM.btnChangePassword = document.getElementById('btnChangePassword');
  DOM.btnCancelPassword = document.getElementById('btnCancelPassword');
  DOM.inpName = document.getElementById('inpName');
  DOM.inpEmail = document.getElementById('inpEmail');
  DOM.inpCity = document.getElementById('inpCity');
  DOM.inpUserAge = document.getElementById('inpUserAge');
  DOM.inpAgeMin = document.getElementById('inpAgeMin');
  DOM.inpAgeMax = document.getElementById('inpAgeMax');
  DOM.inpLooking = document.getElementById('inpLooking');
  DOM.swipeStack = document.getElementById('swipeStack');
  DOM.swipeEmpty = document.getElementById('swipeEmpty');
  DOM.swipeControls = document.getElementById('swipeControls');
  DOM.btnSwipePass = document.getElementById('btnSwipePass');
  DOM.btnSwipeLike = document.getElementById('btnSwipeLike');
  DOM.btnSwipeSuper = document.getElementById('btnSwipeSuper');
  DOM.btnRefreshSwipe = document.getElementById('btnRefreshSwipe');
  DOM.btnSidebarSubscribe = document.getElementById('btnSidebarSubscribe'); 
  DOM.statsRingCircle = document.getElementById('statsRingCircle');
  DOM.statsCountDisplay = document.getElementById('statsCountDisplay');
  DOM.panelShortlistBody = document.getElementById('panel-shortlist');
  DOM.btnOpenCreatorApply = document.getElementById('btnOpenCreatorApply');
  DOM.dlgCreatorApply = document.getElementById('dlgCreatorApply');
  DOM.btnCloseCreatorApply = document.getElementById('btnCloseCreatorApply');
  DOM.btnOpenPremiumApply = document.getElementById('btnOpenPremiumApplyMain');
  DOM.dlgPremiumApply = document.getElementById('dlgPremiumApply');
  DOM.btnPremiumCancel = document.getElementById('btnPremiumCancel');
  DOM.toast = document.getElementById('tm-toast');
}

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
        const percent = current / max; 
        const offset = 251 - (251 * percent);
        DOM.statsRingCircle.style.strokeDashoffset = offset;
    }
}

function enableBackdropClose(dialog) {
    if (!dialog) return;
    dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            dialog.close();
        }
    });
}

async function initApp() {
  cacheDom();
  await loadMe();
  SwipeController.init();
  populateMockContent();
  setupEventListeners();
  updateSwipeStats(DAILY_SWIPE_LIMIT, DAILY_SWIPE_LIMIT); 
}

function setupEventListeners() {
  DOM.tabs.forEach(tab => {
    if (tab.dataset.panel) {
        tab.addEventListener('click', () => {
            setActiveTab(tab.dataset.panel);
        });
    }
  });
  
  if (DOM.btnNotifToggle && DOM.notifDropdown) {
      DOM.btnNotifToggle.addEventListener('click', (e) => {
         e.stopPropagation();
         DOM.notifDropdown.classList.toggle('is-visible');
      });
      window.addEventListener('click', () => {
          DOM.notifDropdown.classList.remove('is-visible');
      });
  }

  const handleStoryClick = (e) => {
      const item = e.target.closest('.story-item');
      if (item && !item.classList.contains('action')) {
          const name = item.dataset.name;
          const imgColor = item.querySelector('.story-img').style.backgroundColor;
          openStoryModal(name, imgColor);
      }
  };

  if (DOM.storiesContainer) DOM.storiesContainer.addEventListener('click', handleStoryClick);

  // MATCH CLICK HANDLER (Passes specific message now)
  const handleMatchClick = (e) => {
      const btn = e.target.closest('.btn-chat-action');
      const card = e.target.closest('.match-card');
      const item = e.target.closest('.story-item');
      
      let name, imgColor, msg;
      
      if (card || btn) {
          const targetCard = btn ? btn.closest('.match-card') : card;
          if(targetCard) {
              name = targetCard.querySelector('.match-name').textContent.split(',')[0];
              imgColor = targetCard.querySelector('.match-img').style.backgroundColor;
              msg = targetCard.dataset.msg; // GET MESSAGE FROM DATA ATTRIBUTE
              openChatModal(name, imgColor, msg);
          }
      } else if (item) {
          name = item.dataset.name;
          imgColor = item.querySelector('.story-img').style.backgroundColor;
          openChatModal(name, imgColor, "Matched via Stories 🔥");
      }
  };

  if (DOM.matchesContainer) DOM.matchesContainer.addEventListener('click', handleMatchClick);
  if (DOM.newMatchesRail) DOM.newMatchesRail.addEventListener('click', handleMatchClick);

  if (DOM.btnCloseStory && DOM.dlgStory) {
      DOM.btnCloseStory.addEventListener('click', () => DOM.dlgStory.close());
  }
  
  if(DOM.btnCloseChat && DOM.dlgChat) {
      DOM.btnCloseChat.addEventListener('click', () => DOM.dlgChat.close());
  }

  if (DOM.btnLogout) {
    DOM.btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      sessionStorage.clear();
      window.location.href = 'index.html'; 
    });
  }

  if (DOM.btnEditProfile) {
    DOM.btnEditProfile.addEventListener('click', () => {
      syncFormToState();
      DOM.dlgProfile.showModal();
    });
  }
  if (DOM.btnCloseProfile) DOM.btnCloseProfile.addEventListener('click', () => DOM.dlgProfile.close());

  if (DOM.btnChangePassword) DOM.btnChangePassword.addEventListener('click', () => DOM.dlgPassword.showModal());
  if (DOM.btnCancelPassword) DOM.btnCancelPassword.addEventListener('click', () => DOM.dlgPassword.close());

  if (DOM.btnOpenCreatorApply) DOM.btnOpenCreatorApply.addEventListener('click', () => DOM.dlgCreatorApply.showModal());
  if (DOM.btnCloseCreatorApply) DOM.btnCloseCreatorApply.addEventListener('click', () => DOM.dlgCreatorApply.close());
  
  const openPremium = (e) => {
      if(e) e.preventDefault();
      if(DOM.dlgPremiumApply) DOM.dlgPremiumApply.showModal();
  };
  if (DOM.btnOpenPremiumApply) DOM.btnOpenPremiumApply.addEventListener('click', openPremium);
  if (DOM.btnPremiumCancel) DOM.btnPremiumCancel.addEventListener('click', () => DOM.dlgPremiumApply.close());
  if (DOM.btnSidebarSubscribe) DOM.btnSidebarSubscribe.addEventListener('click', openPremium);

  if (DOM.frmProfile) {
    DOM.frmProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleProfileSave();
    });
  }

  enableBackdropClose(DOM.dlgProfile);
  enableBackdropClose(DOM.dlgPassword);
  enableBackdropClose(DOM.dlgPremiumApply);
  enableBackdropClose(DOM.dlgCreatorApply);
  enableBackdropClose(DOM.dlgStory);
  enableBackdropClose(DOM.dlgChat); 

  const handlePass = () => SwipeController.pass();
  const handleLike = () => SwipeController.like();
  const handleSuper = () => SwipeController.superLike();

  if (DOM.btnSwipePass) DOM.btnSwipePass.addEventListener('click', handlePass);
  if (DOM.btnSwipeLike) DOM.btnSwipeLike.addEventListener('click', handleLike);
  if (DOM.btnSwipeSuper) DOM.btnSwipeSuper.addEventListener('click', handleSuper);
  if (DOM.btnRefreshSwipe) DOM.btnRefreshSwipe.addEventListener('click', () => SwipeController.init());
  
  document.addEventListener('keydown', (e) => {
      if(state.activeTab !== 'swipe') return;
      if(e.key === 'ArrowLeft') handlePass();
      if(e.key === 'ArrowRight') handleLike();
      if(e.key === 'ArrowUp') handleSuper();
  });
}

// FIX: Added 'lastMsg' parameter
function openChatModal(name, color, lastMsg) {
    if(DOM.dlgChat) {
        if(DOM.chatUserName) DOM.chatUserName.textContent = name;
        if(DOM.chatUserImg) {
            DOM.chatUserImg.src = 'assets/images/truematch-mark.png';
            DOM.chatUserImg.style.backgroundColor = color || '#333';
        }
        
        // Use the passed 'lastMsg' or a default if empty
        const messageToShow = lastMsg || "Hey there! 👋";

        if(DOM.chatBody) {
            DOM.chatBody.innerHTML = `
                <div class="msg-bubble me">Hi ${name}!</div>
                <div class="msg-bubble them">${messageToShow}</div>
            `;
        }
        
        DOM.dlgChat.showModal();
    }
}

function openStoryModal(name, color) {
    if (DOM.dlgStory) {
        if(DOM.storyUserName) DOM.storyUserName.textContent = name;
        if(DOM.storyUserImg) {
            DOM.storyUserImg.src = 'assets/images/truematch-mark.png'; 
            DOM.storyUserImg.style.backgroundColor = color || '#333';
        }
        if(DOM.storyMainImg) {
            DOM.storyMainImg.src = 'assets/images/truematch-mark.png';
            DOM.storyMainImg.style.backgroundColor = color || '#333';
        }
        DOM.dlgStory.showModal();
    }
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

function populateMockContent() {
  console.log("Populating mock data...");

  // NEW MATCHES RAIL
  if (DOM.newMatchesRail) {
      const newMatches = ['Alexa', 'Sam', 'Mika', 'Joy'];
      if(DOM.newMatchCount) DOM.newMatchCount.textContent = newMatches.length;

      let html = '';
      newMatches.forEach(name => {
          html += `
            <div class="story-item" data-name="${name}">
              <div class="story-ring" style="border: 2px solid #ffd700; padding:2px;">
                <img class="story-img" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
              </div>
              <span class="story-name">${name}</span>
            </div>
          `;
      });
      DOM.newMatchesRail.innerHTML = html;
  }

  // MESSAGES GRID
  const matches = [
    { name: 'Sofia', age: 24, msg: 'Hey! How are you?', time: '2m', img: 'assets/images/truematch-mark.png', unread: true },
    { name: 'Chloe', age: 22, msg: 'See you later! 👋', time: '1h', img: 'assets/images/truematch-mark.png', unread: false },
    { name: 'Liam', age: 26, msg: 'Haha that was funny', time: '3h', img: 'assets/images/truematch-mark.png', unread: false },
    { name: 'Noah', age: 25, msg: 'Sent a photo', time: '1d', img: 'assets/images/truematch-mark.png', unread: false }
  ];

  if (DOM.matchesContainer) {
    let html = '';
    matches.forEach(m => {
      const unreadDot = m.unread ? '<div class="match-unread-dot"></div>' : '';
      const msgStyle = m.unread ? 'color: #fff; font-weight:bold;' : '';
      
      // FIX: Added data-msg attribute to store the message
      html += `
        <div class="match-card" data-msg="${m.msg}">
          <img src="${m.img}" class="match-img" alt="${m.name}" style="background:${getRandomColor()}">
          <div class="match-info">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <span class="match-name">${m.name}, ${m.age}</span>
                    <div class="match-msg" style="${msgStyle}">
                    ${unreadDot} ${m.msg} • ${m.time}
                    </div>
                </div>
            </div>
            <button class="btn btn--sm btn--primary btn-chat-action" style="width:100%; margin-top:10px;">Chat</button>
          </div>
        </div>
      `;
    });
    DOM.matchesContainer.innerHTML = html;
  }

  // SHORTLIST
  if (DOM.panelShortlistBody) {
    const existingGrid = DOM.panelShortlistBody.querySelector('.matches-grid');
    if(!existingGrid) {
        const shortlisted = [
            { name: 'Isabella', age: 24, job: 'Model', loc: 'Manhattan' },
            { name: 'Marcus', age: 29, job: 'CEO', loc: 'Beverly Hills' }
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

  // STORIES
  if (DOM.storiesContainer) {
    const stories = ['Bea', 'Kat', 'Pia', 'Coleen', 'Sam'];
    let html = `
        <div class="story-item action" onclick="document.querySelector('button[data-panel=swipe]').click()">
          <div class="story-ring ring-add"><i class="fa-solid fa-plus"></i></div>
          <span class="story-name">Add</span>
        </div>`;
    stories.forEach(name => {
      html += `
        <div class="story-item" data-name="${name}">
          <div class="story-ring">
            <img class="story-img" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
          </div>
          <span class="story-name">${name}</span>
        </div>
      `;
    });
    DOM.storiesContainer.innerHTML = html;
  }
  
  // ADMIRERS
  if (DOM.admirerContainer) {
    let html = '';
    const admirers = [
        { name: 'Celine', age: 23, city: 'Boston' },
        { name: 'Patricia', age: 25, city: 'Seattle' },
        { name: 'Gab', age: 22, city: 'Austin' },
        { name: 'Yassi', age: 24, city: 'Denver' }
    ];
    
    if (DOM.admirerCount) {
        DOM.admirerCount.textContent = `${admirers.length} New`;
    }
    
    admirers.forEach(adm => {
        html += `
          <div class="admirer-row" onclick="document.querySelector('button[data-panel=premium]').click()">
             <img class="admirer-img-blur" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
             <div class="admirer-info">
                <h4>${adm.name}, ${adm.age}</h4>
                <p>📍 ${adm.city}</p>
             </div>
             <div class="admirer-action"><i class="fa-solid fa-lock"></i></div>
          </div>
        `;
    });
    DOM.admirerContainer.innerHTML = html;
  }

  // ACTIVE NEARBY
  if (DOM.activeNearbyContainer) {
      let html = '';
      for(let i=0; i<6; i++) {
          html += `
            <div class="active-item" onclick="document.querySelector('button[data-panel=swipe]').click()">
                <img class="active-img" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
                <div class="online-dot"></div>
            </div>
          `;
      }
      DOM.activeNearbyContainer.innerHTML = html;
  }
}

async function loadMe() {
  try {
    let user, prefs;

    if (DEV_MODE) {
      user = getMockUser();
      prefs = { city: 'New York', ageMin: 21, ageMax: 35, ethnicity: 'any', lookingFor: ['women'] };
    } else {
      const data = await apiGet('/api/me');
      if (!data || !data.ok || !data.user) {
        user = getMockUser(); 
      } else {
          user = data.user;
          prefs = data.prefs || user.preferences || {};
      }
    }

    state.me = user;
    // Keep local session cache in sync for other pages
    if (state.me) { try { saveLocalUser(state.me); } catch (e) {} }
    state.prefs = prefs;
    state.plan = normalizePlanKey(user.plan);

    renderHome(user);
    renderSettingsDisplay(user, prefs);
    applyPlanNavGating();

  } catch (err) {
    console.error("Error loading user:", err);
  }
}

function renderHome(user) {
  if (DOM.homeWelcomeName) DOM.homeWelcomeName.textContent = (user && (user.name || user.displayName || user.fullName)) || 'Member';
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

function renderSettingsDisplay(user, prefs) {
  if (DOM.sNameDisplay) DOM.sNameDisplay.textContent = user.name;
  if (DOM.sEmailDisplay) DOM.sEmailDisplay.textContent = user.email;
  if (DOM.sAvatar && user.avatarUrl) DOM.sAvatar.src = user.avatarUrl;
  if (DOM.dispCity) DOM.dispCity.textContent = user.city || '—';
  if (DOM.dispAge) DOM.dispAge.textContent = prefs && prefs.ageMin ? `${prefs.ageMin} - ${prefs.ageMax}` : '—';
  if (prefs && DOM.dispLooking) {
      const looking = Array.isArray(prefs.lookingFor) ? prefs.lookingFor.join(', ') : prefs.lookingFor;
      DOM.dispLooking.textContent = looking || '—';
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
    if (DOM.inpLooking) DOM.inpLooking.value = Array.isArray(prefs.lookingFor) ? prefs.lookingFor[0] : (prefs.lookingFor || 'both');
  }
}

async function handleProfileSave() {
  const payload = {
    name: DOM.inpName ? DOM.inpName.value : '',
    email: DOM.inpEmail ? DOM.inpEmail.value : '',
    city: DOM.inpCity ? DOM.inpCity.value : '',
    age: DOM.inpUserAge ? parseInt(DOM.inpUserAge.value) : 18,
    preferences: {
      ageMin: DOM.inpAgeMin ? parseInt(DOM.inpAgeMin.value) : 18,
      ageMax: DOM.inpAgeMax ? parseInt(DOM.inpAgeMax.value) : 50,
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
    }
  } catch (e) {
    console.error(e);
  }
}

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
        data = { candidates: [
          { id: 1, name: 'Alice', age: 24, city: 'New York', photoUrl: 'assets/images/truematch-mark.png', tags: ['Travel', 'Music', 'Pizza'] },
          { id: 2, name: 'Bea', age: 22, city: 'Los Angeles', photoUrl: 'assets/images/truematch-mark.png', tags: ['Gym', 'Movies'] },
          { id: 3, name: 'Cathy', age: 25, city: 'Chicago', photoUrl: 'assets/images/truematch-mark.png', tags: ['Art', 'Coffee', 'Dogs'] }
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

      let tagsHtml = '';
      if(p.tags && p.tags.length > 0) {
          tagsHtml = `<div class="swipe-tags">`;
          p.tags.forEach(t => tagsHtml += `<span class="tag">${t}</span>`);
          tagsHtml += `</div>`;
      }

      card.innerHTML = `
        <div class="swipe-card__info">
           <h2>${p.name} <span>${p.age}</span></h2>
           <p>📍 ${p.city}</p>
           ${tagsHtml}
        </div>
      `;
      DOM.swipeStack.appendChild(card);
    });
  }

  async function handleAction(type) {
    if (currentIndex >= profiles.length) return;
    
    const card = document.getElementById('activeSwipeCard');
    if (card) {
      let animClass = 'swipe-out-right';
      if(type === 'pass') animClass = 'swipe-out-left';
      else if(type === 'superlike') animClass = 'swipe-out-right';
      
      card.classList.add(animClass);
    }

    if (!DEV_MODE) {
       const apiType = (type === 'superlike') ? 'like' : type;
       apiPost('/api/swipe/action', { targetId: profiles[currentIndex].id, type: apiType });
    }
    
    let currentStats = parseInt(DOM.statsCountDisplay ? DOM.statsCountDisplay.textContent : "20");
    if(currentStats > 0) updateSwipeStats(currentStats - 1, DAILY_SWIPE_LIMIT);

    let msg = 'Liked!';
    if(type === 'pass') msg = 'Passed';
    if(type === 'superlike') msg = 'Super Liked! ⭐';
    showToast(msg);

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
    pass: () => handleAction('pass'),
    superLike: () => handleAction('superlike')
  };
})();

window.addEventListener('DOMContentLoaded', initApp);