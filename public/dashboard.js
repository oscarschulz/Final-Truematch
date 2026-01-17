// ---------------------------------------------------------------------
// iTrueMatch Dashboard – Main Controller (FINAL: UI WIDTHS & BG FIXED)
// ---------------------------------------------------------------------

import { getLocalPlan, saveLocalUser, clearSession } from './tm-session.js';
import { apiGet, apiPost, apiUpdateProfile, apiSavePrefs } from './tm-api.js';

// SAFETY: Set this to FALSE before deploying to production.
const DEV_MODE = false; 

const DAILY_SWIPE_LIMIT = 20; 

function getMockUser() {
  return {
    id: 99, name: 'Baudss User', email: 'user@itruematch.com', age: 24, city: 'Manila',
    avatarUrl: 'assets/images/truematch-mark.png', plan: 'free',
    creatorStatus: 'none', premiumStatus: 'none', hasCreatorAccess: false
  };
}

const state = { me: null, prefs: null, plan: 'free', activeTab: 'home', isLoading: false };

// Read the last known user from localStorage
function safeGetLocalUser() {
  try {
    return JSON.parse(localStorage.getItem('tm_user') || 'null');
  } catch (_) {
    return null;
  }
}

const DOM = {};

function cacheDom() {
  DOM.tabs = document.querySelectorAll('.nav-btn');
  DOM.panels = document.querySelectorAll('.panel[data-panel]');
  DOM.btnLogout = document.getElementById('btn-logout');
  DOM.btnMobileLogout = document.getElementById('btn-logout-mobile');
  
  DOM.homeWelcomeName = document.getElementById('welcomeName') || document.getElementById('homeWelcomeName');
  DOM.homePlanPill = document.getElementById('planPill') || document.getElementById('homePlanPill');
  DOM.homePlanSummary = document.getElementById('planName') || document.getElementById('homePlanSummary');
  DOM.storiesContainer = document.getElementById('storiesContainer');
  DOM.admirerContainer = document.getElementById('admirerContainer');
  DOM.admirerCount = document.getElementById('admirerCount');
  
  DOM.newMatchesRail = document.getElementById('newMatchesRail');
  DOM.matchesContainer = document.getElementById('matchesContainer');
  DOM.newMatchCount = document.getElementById('newMatchCount');
  
  // Modals & Dialogs
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
  
  // Panel Bodies
  DOM.panelShortlistBody = document.getElementById('panel-shortlist');
  DOM.panelCreatorsBody = document.getElementById('panel-creators');
  DOM.panelPremiumBody = document.getElementById('panel-premium');

  // Creator & Premium Buttons
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
  DOM.toast.innerHTML = type === 'error' ? `<i class="fa-solid fa-circle-exclamation"></i> ${msg}` : `<i class="fa-solid fa-circle-check"></i> ${msg}`;
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

// ---------------------------------------------------------------------
// CORE INIT
// ---------------------------------------------------------------------

async function initApp() {
  cacheDom();
  await loadMe();
  
  SwipeController.init();
  
  if (DEV_MODE) populateMockContent();
  else renderHomeEmptyStates();
  
  setupEventListeners();
  setupMobileMenu();
  
  updateSwipeStats(DAILY_SWIPE_LIMIT, DAILY_SWIPE_LIMIT); 
  
  // Remove Loader
  setTimeout(() => {
      const loader = document.getElementById('app-loader');
      if(loader) {
          loader.style.opacity = '0';
          setTimeout(() => loader.remove(), 500);
      }
      const layout = document.getElementById('mainLayout');
      if(layout) layout.style.opacity = '1';
  }, 1000);
}

// ---------------------------------------------------------------------
// EVENT LISTENERS
// ---------------------------------------------------------------------

function setupEventListeners() {
  // 1. Tabs
  DOM.tabs.forEach(tab => {
    if (tab.dataset.panel) {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveTab(tab.dataset.panel);
        });
    }
  });
  
  // 2. Notifications
  if (DOM.btnNotifToggle && DOM.notifDropdown) {
      DOM.btnNotifToggle.addEventListener('click', (e) => {
         e.stopPropagation();
         DOM.notifDropdown.classList.toggle('is-visible');
      });
      window.addEventListener('click', () => {
          DOM.notifDropdown.classList.remove('is-visible');
      });
  }

  // 3. Stories Click
  const handleStoryClick = (e) => {
      const item = e.target.closest('.story-item');
      if (item && !item.classList.contains('action')) {
          const name = item.dataset.name;
          const imgColor = item.querySelector('.story-img').style.backgroundColor;
          openStoryModal(name, imgColor);
      }
  };
  if (DOM.storiesContainer) DOM.storiesContainer.addEventListener('click', handleStoryClick);

  // 4. Matches & Chat Click
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
              msg = targetCard.dataset.msg; 
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

  // 5. Modals Close
  if (DOM.btnCloseStory && DOM.dlgStory) DOM.btnCloseStory.addEventListener('click', () => DOM.dlgStory.close());
  if (DOM.btnCloseChat && DOM.dlgChat) DOM.btnCloseChat.addEventListener('click', () => DOM.dlgChat.close());

  // 6. Logout
  const handleLogout = (e) => {
      e.preventDefault();
      clearSession();
      sessionStorage.clear();
      window.location.href = 'index.html'; 
  };
  if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', handleLogout);
  if (DOM.btnMobileLogout) DOM.btnMobileLogout.addEventListener('click', handleLogout);

  // 7. Profile Editing
  if (DOM.btnEditProfile) {
    DOM.btnEditProfile.addEventListener('click', () => {
      syncFormToState();
      DOM.dlgProfile.showModal();
    });
  }
  if (DOM.btnCloseProfile) DOM.btnCloseProfile.addEventListener('click', () => DOM.dlgProfile.close());

  // 8. Change Password
  if (DOM.btnChangePassword) DOM.btnChangePassword.addEventListener('click', () => DOM.dlgPassword.showModal());
  if (DOM.btnCancelPassword) DOM.btnCancelPassword.addEventListener('click', () => DOM.dlgPassword.close());

  // 9. Creators & Premium
  if (DOM.btnOpenCreatorApply) DOM.btnOpenCreatorApply.addEventListener('click', () => DOM.dlgCreatorApply.showModal());
  if (DOM.btnCloseCreatorApply) DOM.btnCloseCreatorApply.addEventListener('click', () => DOM.dlgCreatorApply.close());
  
  const openPremium = (e) => {
      if (e && e.currentTarget && e.currentTarget.id === 'btnSidebarSubscribe') {
          window.location.href = './tier.html?upgrade=1';
          return;
      }
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      if (DOM.dlgPremiumApply) DOM.dlgPremiumApply.showModal();
  };
  if (DOM.btnOpenPremiumApply) DOM.btnOpenPremiumApply.addEventListener('click', openPremium);
  if (DOM.btnPremiumCancel) DOM.btnPremiumCancel.addEventListener('click', () => DOM.dlgPremiumApply.close());
  if (DOM.btnSidebarSubscribe) DOM.btnSidebarSubscribe.addEventListener('click', openPremium);

  // 10. Forms
  if (DOM.frmProfile) {
    DOM.frmProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleProfileSave();
    });
  }

  // 11. Backdrop Closing
  enableBackdropClose(DOM.dlgProfile);
  enableBackdropClose(DOM.dlgPassword);
  enableBackdropClose(DOM.dlgPremiumApply);
  enableBackdropClose(DOM.dlgCreatorApply);
  enableBackdropClose(DOM.dlgStory);
  enableBackdropClose(DOM.dlgChat); 

  // 12. Swipe Controls
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

// ---------------------------------------------------------------------
// MOBILE MENU CONTROLLER
// ---------------------------------------------------------------------

function setupMobileMenu() {
    const sidebar = document.getElementById('mainSidebar');
    const menuBtn = document.getElementById('mobileNavToggle');
    const momentsBtn = document.getElementById('mobileMomentsToggle');
    const momentsPopup = document.getElementById('momentsPopup');
    
    // Hamburger Menu Logic
    if(menuBtn && sidebar) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close Moments if open
            if(momentsPopup) momentsPopup.classList.remove('is-open'); 
            if(momentsBtn) momentsBtn.querySelector('i').className = 'fa-solid fa-bolt';
            
            // Toggle Sidebar
            sidebar.classList.toggle('is-open');
            
            // Toggle Icon
            const isOpen = sidebar.classList.contains('is-open');
            menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if(sidebar.classList.contains('is-open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('is-open');
                menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });
    }

    // Moments Button Logic
    if(momentsBtn && momentsPopup) {
        momentsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close Sidebar if open
            if(sidebar) sidebar.classList.remove('is-open'); 
            if(menuBtn) menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';

            // Toggle Moments Popup
            momentsPopup.classList.toggle('is-open');
            
            // Toggle Icon
            const icon = momentsBtn.querySelector('i');
            icon.className = momentsPopup.classList.contains('is-open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bolt';
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
             if(momentsPopup.classList.contains('is-open') && !momentsPopup.contains(e.target) && !momentsBtn.contains(e.target)) {
                momentsPopup.classList.remove('is-open');
                momentsBtn.querySelector('i').className = 'fa-solid fa-bolt';
             }
        });
    }
}

// ---------------------------------------------------------------------
// TAB SWITCHING
// ---------------------------------------------------------------------

function setActiveTab(tabName) {
  state.activeTab = tabName;
  
  // 1. Update Navigation State
  DOM.tabs.forEach(t => {
    if (t.dataset.panel === tabName) t.classList.add('is-active');
    else t.classList.remove('is-active');
  });

  // 2. Show Correct Panel & Fix Layout
  DOM.panels.forEach(p => {
    if (p.dataset.panel === tabName) {
      p.hidden = false;
      p.classList.add('is-active');

      // SPECIAL FIX FOR HOME PANEL: Push footer to bottom
      if (tabName === 'home') {
          p.style.display = 'flex';
          p.style.flexDirection = 'column';
          p.style.justifyContent = 'space-between';
          p.style.minHeight = '100%'; 
      } else if (tabName === 'premium') {
          // SPECIAL FIX FOR PREMIUM PANEL: Center content
          p.style.display = 'flex';
          p.style.flexDirection = 'column';
          p.style.alignItems = 'center';
          p.style.justifyContent = 'center';
          p.style.height = '100%';
      } else {
          p.style.display = 'block';
          p.style.height = 'auto';
          p.style.minHeight = '0';
      }

      // Mobile: Scroll to top
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
      p.hidden = true;
      p.classList.remove('is-active');
      p.style.display = 'none';
    }
  });

  // 3. Auto-Close Mobile Menu
  const sidebar = document.getElementById('mainSidebar');
  const menuBtn = document.getElementById('mobileNavToggle');
  if(sidebar && sidebar.classList.contains('is-open')) {
      sidebar.classList.remove('is-open');
      if(menuBtn) menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }
}

// ---------------------------------------------------------------------
// MODAL HELPERS
// ---------------------------------------------------------------------

function openChatModal(name, color, lastMsg) {
    if(DOM.dlgChat) {
        if(DOM.chatUserName) DOM.chatUserName.textContent = name;
        if(DOM.chatUserImg) {
            DOM.chatUserImg.src = 'assets/images/truematch-mark.png';
            DOM.chatUserImg.style.backgroundColor = color || '#333';
        }
        
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


// ---------------------------------------------------------------------
// UI POPULATION LOGIC (FIXED: Card Widths & Backgrounds)
// ---------------------------------------------------------------------

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

  // MESSAGES GRID (UI FIX: Buttons aligned to bottom)
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
      // INLINE STYLES APPLIED HERE:
      html += `
        <div class="match-card" data-msg="${m.msg}" style="display: flex; flex-direction: column; height: 100%;">
          <img src="${m.img}" class="match-img" alt="${m.name}" style="background:${getRandomColor()}">
          <div class="match-info" style="flex: 1; display: flex; flex-direction: column; padding: 12px;">
            <div style="flex: 1; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                    <span class="match-name">${m.name}, ${m.age}</span>
                    <div class="match-msg" style="${msgStyle}">
                    ${unreadDot} ${m.msg} • ${m.time}
                    </div>
                </div>
            </div>
            <button class="btn btn--sm btn--primary btn-chat-action" style="width:100%; margin-top: auto;">Chat</button>
          </div>
        </div>
      `;
    });
    DOM.matchesContainer.innerHTML = html;
  }

  // SHORTLIST (FIXED: Uniform Colors & Clean UI)
  if (DOM.panelShortlistBody) {
    if(!DOM.panelShortlistBody.querySelector('.matches-grid')) {
        const shortlisted = [
            { name: 'Isabella', age: 24, job: 'Fashion Model' },
            { name: 'Marcus', age: 29, job: 'Tech CEO & Founder' },
            { name: 'Sarah', age: 26, job: 'Artist' }
        ];
        
        let html = '<div class="matches-grid" style="margin-top:20px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); justify-content: center; gap: 15px;">';
        
        shortlisted.forEach((s) => {
          html += `
            <div class="glass-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); text-align:center; padding: 25px 20px !important; display:flex; flex-direction:column; justify-content:space-between; height:100%; transition: transform 0.2s;">
                
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="width:80px; height:80px; border-radius:50%; border: 2px solid #00aff0; padding: 3px; margin-bottom: 15px;">
                        <img src="assets/images/truematch-mark.png" style="width:100%; height:100%; border-radius:50%; object-fit:cover; background: #1a1a1a;">
                    </div>
                    
                    <h3 style="margin:0; color:#fff; font-size:1.1rem; font-weight:700;">${s.name}, ${s.age}</h3>
                    <p class="tiny muted" style="margin:5px 0 0; font-size:0.85rem; color:#8899a6;">${s.job}</p>
                </div>

                <button class="btn btn--sm btn--primary btn-shortlist-connect" data-name="${s.name}" style="width:100%; margin-top:20px; border-radius:99px; background: rgba(0, 175, 240, 0.15); color: #00aff0; border: 1px solid rgba(0, 175, 240, 0.3);">
                    Connect
                </button>
            </div>
          `;
        });
        html += '</div>';
        
        // Add Header if missing
        if(!DOM.panelShortlistBody.innerHTML.trim()) {
             DOM.panelShortlistBody.insertAdjacentHTML('beforeend', '<div class="feed-header">Daily Shortlist</div>');
        }
        DOM.panelShortlistBody.insertAdjacentHTML('beforeend', html);

        // SWEETALERT EVENT LISTENER
        const btns = DOM.panelShortlistBody.querySelectorAll('.btn-shortlist-connect');
        btns.forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.getAttribute('data-name');
                if (typeof Swal !== 'undefined') {
                    const Toast = Swal.mixin({
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 3000,
                      timerProgressBar: false,
                      background: '#1a1a20',
                      color: '#fff',
                      iconColor: '#00aff0',
                      didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                      }
                    });
                    Toast.fire({
                      icon: 'success',
                      title: `Request sent to ${name}`
                    });
                } else {
                    alert(`Request sent to ${name}!`);
                }
                this.textContent = 'Pending';
                this.style.background = 'transparent';
                this.style.color = '#888';
                this.style.borderColor = '#444';
                this.disabled = true;
            });
        });
    }
  }

  // CREATORS (FIXED: Reduced Banner Width)
  if (DOM.panelCreatorsBody) {
    if(!DOM.panelCreatorsBody.querySelector('.creators-grid')) {
        const creators = [
            { name: 'Sasha Grey', followers: '1.2M', price: 'FREE', locked: false, handle: 'Follow' },
            { name: 'Kim Lee', followers: '850k', price: 'Unlock 💎 50', locked: true, handle: 'Unlock' },
            { name: 'Tyler', followers: '500k', price: 'Unlock 💎 100', locked: true, handle: 'Unlock' },
            { name: 'Eva Art', followers: '200k', price: 'Unlock 💎 20', locked: true, handle: 'Unlock' }
        ];

        // ADDED: max-width: 500px and margin: 0 auto
        let html = `
            <div style="background: linear-gradient(90deg, #00c6ff, #0072ff); border-radius: 20px; padding: 30px; text-align: center; margin: 0 auto 25px; max-width: 500px; position: relative; overflow: hidden;">
                <h2 style="margin:0; font-size:1.5rem; color:#fff;">Become a Creator</h2>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 15px;">Monetize your fanbase today.</p>
                <button class="btn btn--white" id="btnOpenCreatorApplyInjected" style="border-radius:99px; padding: 8px 30px; color:#0072ff; font-weight:800;">Apply</button>
                <i class="fa-solid fa-fire" style="position: absolute; right: -10px; bottom: -20px; font-size: 8rem; color: rgba(255,255,255,0.1); transform: rotate(-15deg);"></i>
            </div>

            <div class="category-scroll" id="creatorFilters">
                <div class="cat-pill active">All</div>
                <div class="cat-pill">Popular</div>
                <div class="cat-pill">New</div>
                <div class="cat-pill">Nearby</div>
                <div class="cat-pill">VIP</div>
            </div>

            <div class="creators-grid">
        `;

        creators.forEach(c => {
            const lockedClass = c.locked ? 'locked' : '';
            const bgGradient = c.locked ? 'linear-gradient(135deg, #1a1a1a, #000)' : 'linear-gradient(135deg, #4b0082, #800080)';
            const btnStyle = c.locked ? 'background:#ffd700; color:#000;' : 'background:rgba(255,255,255,0.2); color:#fff;';
            const badge = c.locked ? 'PREMIUM' : 'FREE';
            const badgeColor = c.locked ? '#ffd700' : '#fff';
            
            html += `
                <div class="creator-card" style="background: ${bgGradient}; border: 1px solid rgba(255,255,255,0.1); height: 240px; position: relative; border-radius: 16px; padding: 15px; display:flex; flex-direction:column; justify-content:flex-end;">
                    <span style="position:absolute; top:15px; right:15px; background:${badgeColor}; color:#000; font-size:0.7rem; font-weight:800; padding:2px 6px; border-radius:4px;">${badge}</span>
                    
                    ${c.locked ? '<div style="position:absolute; top:40%; left:50%; transform:translate(-50%, -50%); width:50px; height:50px; background:rgba(255,255,255,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);"><i class="fa-solid fa-lock" style="color:#fff;"></i></div>' : ''}
                    
                    <h3 style="margin:0; font-size:1.1rem;">${c.name} <i class="fa-solid fa-circle-check" style="color:#00aff0; font-size:0.8rem;"></i></h3>
                    <p style="margin:2px 0 10px; font-size:0.8rem; color:rgba(255,255,255,0.7);"><i class="fa-solid fa-users"></i> ${c.followers}</p>
                    <button class="btn-unlock-action" style="width:100%; border:none; padding:10px; border-radius:8px; font-weight:700; cursor:pointer; ${btnStyle}">${c.price}</button>
                </div>
            `;
        });
        html += `</div>`;
        
        DOM.panelCreatorsBody.innerHTML = ''; 
        DOM.panelCreatorsBody.insertAdjacentHTML('beforeend', '<div class="feed-header">Creators</div>' + html);
        
        // Listeners for Creators
        const newApplyBtn = DOM.panelCreatorsBody.querySelector('#btnOpenCreatorApplyInjected');
        if(newApplyBtn && DOM.dlgCreatorApply) {
            newApplyBtn.addEventListener('click', () => DOM.dlgCreatorApply.showModal());
        }

        // Filter Interactivity (Clickable)
        const pills = DOM.panelCreatorsBody.querySelectorAll('.cat-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => { 
                    p.classList.remove('active'); 
                    p.style.background = 'rgba(255,255,255,0.1)'; 
                    p.style.borderColor = 'rgba(255,255,255,0.1)';
                });
                pill.classList.add('active');
                pill.style.background = '#00aff0';
                pill.style.borderColor = '#00aff0';
            });
        });

        // Unlock Buttons Interactivity
        DOM.panelCreatorsBody.querySelectorAll('.btn-unlock-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(btn.textContent.includes('FREE')) showToast('Followed successfully!');
                else showToast('Insufficient gems!', 'error');
            });
        });
    }
  }

  // PREMIUM (FIXED: Increased Width 600px, Restored Glass BG)
  if (DOM.panelPremiumBody) {
     if(!DOM.panelPremiumBody.querySelector('.premium-plans')) {
         const html = `
            <div class="premium-plans" style="padding-top: 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%;">
                
                <div class="glass-card" style="width:100%; max-width:600px; padding: 40px 30px; text-align:center; border: 1px solid #ffd700; position:relative; overflow:hidden; background: rgba(20, 20, 20, 0.2); backdrop-filter: blur(20px);">
                    
                    <div style="position:absolute; top:0; left:0; right:0; height:4px; background: linear-gradient(90deg, #FFD700, #FDB931);"></div>
                    
                    <i class="fa-solid fa-crown" style="color:#ffd700; font-size:3.5rem; margin-bottom:20px; filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));"></i>
                    
                    <h2 style="font-size: 2rem; margin:0; font-weight:800;">iTrueMatch <span style="color:#ffd700;">GOLD</span></h2>
                    <p style="color:#aaa; margin: 10px 0 30px;">Upgrade to the ultimate experience.</p>
                    
                    <ul style="list-style:none; padding:0; text-align:left; margin-bottom:40px; display:flex; flex-direction:column; gap:20px; width:100%; max-width:400px; margin-left:auto; margin-right:auto;">
                        <li style="display:flex; align-items:center; gap:15px; font-size:1rem; color:#fff;">
                            <div style="width:30px; height:30px; background:rgba(255,215,0,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#ffd700;"><i class="fa-solid fa-eye"></i></div>
                            See who liked you
                        </li>
                        <li style="display:flex; align-items:center; gap:15px; font-size:1rem; color:#fff;">
                            <div style="width:30px; height:30px; background:rgba(255,215,0,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#ffd700;"><i class="fa-solid fa-infinity"></i></div>
                            Unlimited Swipes
                        </li>
                        <li style="display:flex; align-items:center; gap:15px; font-size:1rem; color:#fff;">
                            <div style="width:30px; height:30px; background:rgba(255,215,0,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#ffd700;"><i class="fa-solid fa-bolt"></i></div>
                            1 Free Boost / month
                        </li>
                         <li style="display:flex; align-items:center; gap:15px; font-size:1rem; color:#fff;">
                            <div style="width:30px; height:30px; background:rgba(255,215,0,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#ffd700;"><i class="fa-solid fa-earth-americas"></i></div>
                            Passport to any location
                        </li>
                    </ul>

                    <button id="btnPremiumUpgradeInternal" style="width:100%; max-width:400px; padding:15px; font-size:1.1rem; font-weight:800; border-radius:99px; border:none; background: linear-gradient(90deg, #FFD700, #FDB931); color:#000; box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); cursor:pointer; transition: transform 0.2s;">Get Premium Access</button>
                    <p style="margin-top:15px; font-size:0.8rem; color:#666;">Recurring billing. Cancel anytime.</p>
                </div>
            </div>`;
         DOM.panelPremiumBody.innerHTML = html;
         
         const btnUpgrade = DOM.panelPremiumBody.querySelector('#btnPremiumUpgradeInternal');
         if(btnUpgrade && DOM.dlgPremiumApply) {
             btnUpgrade.addEventListener('click', () => DOM.dlgPremiumApply.showModal());
         }
     }
  }

  // STORIES (Centered + Icon)
  if (DOM.storiesContainer) {
    const stories = ['Bea', 'Kat', 'Pia', 'Coleen', 'Sam'];
    // INLINE STYLES APPLIED: display: flex; align-items: center; justify-content: center;
    let html = `
        <div class="story-item action" onclick="document.querySelector('button[data-panel=swipe]').click()">
          <div class="story-ring ring-add" style="display: flex; align-items: center; justify-content: center;">
             <i class="fa-solid fa-plus"></i>
          </div>
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
  
  // ADMIRERS (UI FIX: Forced Left Align)
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
        // INLINE STYLES APPLIED: justify-content: flex-start; gap: 15px; text-align: left;
        html += `
          <div class="admirer-row" onclick="document.querySelector('button[data-panel=premium]').click()" style="justify-content: flex-start; gap: 15px;">
             <img class="admirer-img-blur" src="assets/images/truematch-mark.png" style="background:${getRandomColor()}">
             <div class="admirer-info" style="flex: 1; text-align: left;">
                <h4 style="margin:0;">${adm.name}, ${adm.age}</h4>
                <p style="margin:0;">📍 ${adm.city}</p>
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

function renderHomeEmptyStates() {
  if (DOM.admirerCount) DOM.admirerCount.textContent = '0 New';
  if (DOM.admirerContainer) {
    const hasRows = DOM.admirerContainer.querySelector('.admirer-row');
    if (!hasRows) {
      DOM.admirerContainer.innerHTML = "<div class='tiny muted' style='padding:12px 2px;'>No likes yet. When someone likes you, they’ll appear here.</div>";
    }
  }
  if (DOM.activeNearbyContainer) {
    const hasActive = DOM.activeNearbyContainer.querySelector('.active-item');
    if (!hasActive) {
      DOM.activeNearbyContainer.innerHTML = "<div class='active-empty tiny muted'>No active users nearby yet.</div>";
    }
  }
  if (DOM.storiesContainer) {
    const hasStories = DOM.storiesContainer.querySelector('.story-item');
    if (!hasStories) {
      DOM.storiesContainer.innerHTML = "<div class='story-item action'><div class='story-ring ring-add'><i class='fa-solid fa-plus'></i></div><span class='story-name'>Add</span></div>";
    }
  }
}

// ---------------------------------------------------------------------
// BACKEND SYNC
// ---------------------------------------------------------------------

async function loadMe() {
  try {
    let user, prefs;

    if (DEV_MODE) {
      user = getMockUser();
      prefs = { city: 'New York', ageMin: 21, ageMax: 35, ethnicity: 'any', lookingFor: ['women'] };
    } else {
      const data = await apiGet('/api/me');
      const local = safeGetLocalUser();

      if (!data || !data.ok || !data.user) {
        if (local && (local.email || local.name)) {
          user = local;
          prefs = {};
        } else {
          window.location.href = 'auth.html?mode=login';
          return;
        }
      } else {
        user = data.user;
        prefs = data.prefs || user.preferences || {};
        if (local) {
          if (!user.name && local.name) user.name = local.name;
          if (!user.email && local.email) user.email = local.email;
        }
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
  }
}

function renderHome(user) {
  if (DOM.homeWelcomeName) {
    const displayName = user?.name || user?.displayName || user?.fullName || 'Member';
    DOM.homeWelcomeName.textContent = displayName.trim();
  }
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
    // Premium tab should be hidden for Free users, but visible for paid tiers.
    free: ['home', 'matches', 'swipe', 'creators', 'settings'],
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

// ---------------------------------------------------------------------
// SWIPE CONTROLLER
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

// ONE SINGLE ENTRY POINT
window.addEventListener('DOMContentLoaded', initApp);