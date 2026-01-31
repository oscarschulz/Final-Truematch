// ---------------------------------------------------------------------
// iTrueMatch Dashboard – Main Controller (FINAL: UI WIDTHS & BG FIXED)
// ---------------------------------------------------------------------

import { getLocalPlan, saveLocalUser, savePrefsForCurrentUser, clearSession } from './tm-session.js';
import { apiGet, apiPost, apiUpdateProfile, apiSavePrefs } from './tm-api.js';

// Production mode: disable all mock/demo UI population.
const DEV_MODE = false;

const DAILY_SWIPE_LIMIT = 20; 

// --- Image helper (same behavior as Preferences page: crop to square + compress) ---
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataUrl(file);
  });
}

async function fileToOptimizedSquareDataUrl(file, maxSize = 768, quality = 0.85) {
  const dataUrl = await readFileAsDataUrl(file);
  const img = new Image();
  img.src = dataUrl;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

  const s = Math.min(img.width, img.height);
  const sx = (img.width - s) / 2;
  const sy = (img.height - s) / 2;

  const canvas = document.createElement('canvas');
  const out = Math.min(maxSize, s);
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, s, s, 0, 0, out, out);
  return canvas.toDataURL('image/jpeg', quality);
}

function getMockUser() {
  return {
    id: 99, name: 'Baudss User', email: 'user@itruematch.com', age: 24, city: 'Manila',
    avatarUrl: 'assets/images/truematch-mark.png', plan: 'free',
    creatorStatus: 'none', premiumStatus: 'none', hasCreatorAccess: false
  };
}

const state = { me: null, prefs: null, plan: 'free', activeTab: 'home', isLoading: false, selectedAvatarDataUrl: null };

// Read the last known user from localStorage
function safeGetLocalUser() {
  try {
    return JSON.parse(localStorage.getItem('tm_user') || 'null');
  } catch (_) {
    return null;
  }
}

const DOM = {};

// Avatar full-size viewer (used in Settings > Edit)
function openAvatarLightbox(src) {
  if (!DOM.avatarLightbox || !DOM.avatarLightboxImg) return;
  DOM.avatarLightboxImg.src = src || 'assets/images/truematch-mark.png';
  DOM.avatarLightbox.removeAttribute('hidden');
  // Prevent background scroll while the viewer is open
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function closeAvatarLightbox() {
  if (!DOM.avatarLightbox || !DOM.avatarLightboxImg) return;
  DOM.avatarLightbox.setAttribute('hidden', '');
  DOM.avatarLightboxImg.src = '';
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

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
  DOM.storyMainVideo = document.getElementById('storyMainVideo');
  DOM.storyUserImg = document.getElementById('storyUserImg');
  DOM.storyUserName = document.getElementById('storyUserName');
  DOM.btnCloseStory = document.getElementById('btnCloseStory');
  DOM.storyProgressFill = document.getElementById('storyProgressFill');

  // Recent Moments (mobile)
  DOM.mobileMomentsToggle = document.getElementById('mobileMomentsToggle');
  DOM.momentsPopup = document.getElementById('momentsPopup');
  DOM.mobileStoriesContainer = document.getElementById('mobileStoriesContainer');

  // Hidden input for Moment uploads
  DOM.momentFileInput = document.getElementById('momentFileInput');
  
  DOM.sAvatar = document.getElementById('sAvatar');
  DOM.sNameDisplay = document.getElementById('sNameDisplay');
  DOM.sEmailDisplay = document.getElementById('sEmailDisplay');
  // Settings display (should mirror Preferences page fields)
  DOM.dispCity = document.getElementById('dispCity');
    DOM.dispAge = document.getElementById('dispAge'); // profile city
  DOM.dispPrefCity = document.getElementById('dispPrefCity');
  DOM.dispAgeRange = document.getElementById('dispAgeRange');
  DOM.dispEthnicity = document.getElementById('dispEthnicity');
  DOM.dispLooking = document.getElementById('dispLooking');
  DOM.dispIntent = document.getElementById('dispIntent');
  DOM.dispSharedValues = document.getElementById('dispSharedValues');
  DOM.dispDealbreakers = document.getElementById('dispDealbreakers');
  
  DOM.dlgProfile = document.getElementById('dlgProfile');
  DOM.frmProfile = document.getElementById('frmProfile');
  DOM.btnEditProfile = document.getElementById('btnEditProfile');
  DOM.btnCloseProfile = document.getElementById('btnCloseProfile');

  // Profile + preferences modal controls
  DOM.btnAvatarZoom = document.getElementById('btnAvatarZoom');
  DOM.dlgAvatarPreview = document.getElementById('dlgAvatarPreview');
  DOM.btnPickAvatar = document.getElementById('btnPickAvatar');
  DOM.inpAvatarFile = document.getElementById('inpAvatarFile');
  DOM.avatarFilename = document.getElementById('avatarFilename');
  DOM.advancedPrefsSection = document.getElementById('advancedPrefsSection');
  DOM.advLockNote = document.getElementById('advLockNote');

  // Avatar full-size viewer (lightbox)
  DOM.avatarLightbox = document.getElementById('avatarLightbox');
  DOM.avatarLightboxImg = document.getElementById('avatarLightboxImg');
  DOM.btnCloseAvatarLightbox = document.getElementById('btnCloseAvatarLightbox');
  
  DOM.dlgPassword = document.getElementById('dlgPassword');
  DOM.frmPassword = document.getElementById('frmPassword');
  DOM.btnChangePassword = document.getElementById('btnChangePassword');
  DOM.btnCancelPassword = document.getElementById('btnCancelPassword');
  
  DOM.inpName = document.getElementById('inpName');
  DOM.inpEmail = document.getElementById('inpEmail');
  DOM.inpCity = document.getElementById('inpCity');
  DOM.inpUserAge = document.getElementById('inpAge') || document.getElementById('inpUserAge');
  DOM.inpPrefCity = document.getElementById('inpPrefCity');
  DOM.inpAgeMin = document.getElementById('inpAgeMin');
  DOM.inpAgeMax = document.getElementById('inpAgeMax');
  DOM.inpLooking = document.getElementById('inpLookingFor') || document.getElementById('inpLooking');
  DOM.inpEthnicity = document.getElementById('inpEthnicity');
  DOM.inpIntent = document.getElementById('inpIntent');
  DOM.inpDealbreakers = document.getElementById('inpDealbreakers');
  DOM.inpSharedValues = document.getElementById('inpSharedValues');
  
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

  // Application forms
  DOM.frmCreatorApply = document.getElementById('frmCreatorApply');
  DOM.frmPremiumApply = document.getElementById('frmPremiumApply');

  // Creators / Premium Society entry cards
  DOM.creatorEntryCard = document.getElementById('creatorEntryCard');
  DOM.creatorStatusRow = document.getElementById('creatorStatusRow');
  DOM.creatorStatusChip = document.getElementById('creatorStatusChip');
  DOM.creatorStatusHint = document.getElementById('creatorStatusHint');
  DOM.btnGoCreatorsPage = document.getElementById('btnGoCreatorsPage');

  DOM.premiumEntryCard = document.getElementById('premiumEntryCard');
  DOM.premiumStatusRow = document.getElementById('premiumStatusRow');
  DOM.premiumStatusChip = document.getElementById('premiumStatusChip');
  DOM.premiumStatusHint = document.getElementById('premiumStatusHint');
  DOM.btnGoPremiumPage = document.getElementById('btnGoPremiumPage');

  
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

function normalizeStatus(rawStatus) {
  if (!rawStatus) return '';
  const s = String(rawStatus).trim().toLowerCase();
  if (s === 'pending' || s === 'approved' || s === 'rejected') return s;
  return s; // fallback
}

function renderCreatorPremiumEntryCards() {
  renderCreatorEntryCard();
  renderPremiumEntryCard();
}

function renderCreatorEntryCard() {
  if (!DOM.creatorEntryCard) return;

  const status = normalizeStatus(state.me && state.me.creatorStatus);
  const row = DOM.creatorStatusRow;
  const chip = DOM.creatorStatusChip;
  const hint = DOM.creatorStatusHint;
  const btnApply = DOM.btnOpenCreatorApply;
  const btnGo = DOM.btnGoCreatorsPage;

  // Defaults
  if (row) row.style.display = 'none';
  if (btnGo) btnGo.style.display = 'none';
  if (btnApply) {
    btnApply.disabled = false;
    btnApply.textContent = 'Apply';
    btnApply.style.opacity = '1';
  }

  if (status === 'pending') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Pending';
    if (hint) hint.textContent = 'Your application is under review.';
    if (btnApply) {
      btnApply.disabled = true;
      btnApply.textContent = 'Application Pending';
      btnApply.style.opacity = '0.6';
    }
  } else if (status === 'rejected') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Rejected';
    if (hint) hint.textContent = 'You can edit and re-apply anytime.';
    if (btnApply) {
      btnApply.disabled = false;
      btnApply.textContent = 'Re-Apply';
      btnApply.style.opacity = '1';
    }
  } else if (status === 'approved') {
    // In case user lands here (e.g., deep link / back button), show a go button.
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Approved';
    if (hint) hint.textContent = 'You can now access the Creators page.';
    if (btnApply) btnApply.style.display = 'none';
    if (btnGo) btnGo.style.display = 'inline-flex';
  } else {
    // no status yet
    if (btnApply) btnApply.style.display = 'inline-flex';
  }
}

function renderPremiumEntryCard() {
  if (!DOM.premiumEntryCard) return;

  const status = normalizeStatus(state.me && state.me.premiumStatus);
  const row = DOM.premiumStatusRow;
  const chip = DOM.premiumStatusChip;
  const hint = DOM.premiumStatusHint;
  const btnApply = DOM.btnOpenPremiumApply;
  const btnGo = DOM.btnGoPremiumPage;

  // Defaults
  if (row) row.style.display = 'none';
  if (btnGo) btnGo.style.display = 'none';
  if (btnApply) {
    btnApply.disabled = false;
    btnApply.textContent = 'Apply';
    btnApply.style.opacity = '1';
    btnApply.style.display = 'inline-flex';
  }

  if (status === 'pending') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Pending';
    if (hint) hint.textContent = 'Your application is under review.';
    if (btnApply) {
      btnApply.disabled = true;
      btnApply.textContent = 'Application Pending';
      btnApply.style.opacity = '0.6';
    }
  } else if (status === 'rejected') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Rejected';
    if (hint) hint.textContent = 'You can re-apply anytime.';
    if (btnApply) {
      btnApply.disabled = false;
      btnApply.textContent = 'Re-Apply';
      btnApply.style.opacity = '1';
    }
  } else if (status === 'approved') {
    if (row) row.style.display = 'flex';
    if (chip) chip.textContent = 'Approved';
    if (hint) hint.textContent = 'You can now access Premium Society.';
    if (btnApply) btnApply.style.display = 'none';
    if (btnGo) btnGo.style.display = 'inline-flex';
  } else {
    // no status yet
    if (btnApply) btnApply.style.display = 'inline-flex';
  }
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
  
  if (DEV_MODE) {
    populateMockContent();
  } else {
    renderHomeEmptyStates();
    await MomentsController.init();
  }
  
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

  // 3. Recent Moments (Stories) Click
  const handleStoryClick = (e) => MomentsController.handleStoryClick(e);
  if (DOM.storiesContainer) DOM.storiesContainer.addEventListener('click', handleStoryClick);
  if (DOM.mobileStoriesContainer) DOM.mobileStoriesContainer.addEventListener('click', handleStoryClick);

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
  if (DOM.btnCloseStory && DOM.dlgStory) DOM.btnCloseStory.addEventListener('click', () => MomentsController.closeStory());
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
      state.selectedAvatarDataUrl = null;
      syncFormToState();
      applyAdvancedPrefsLock();
      DOM.dlgProfile.showModal();
    });
  }
  if (DOM.btnCloseProfile) DOM.btnCloseProfile.addEventListener('click', () => DOM.dlgProfile.close());

  // Avatar selection (same as Preferences behavior)
  if (DOM.btnPickAvatar && DOM.inpAvatarFile) {
    DOM.btnPickAvatar.addEventListener('click', (e) => {
      e.preventDefault();
      DOM.inpAvatarFile.click();
    });
  }
  // Clicking the avatar preview shows full size (file selection stays on "Change photo")
  const avatarZoomTarget = DOM.btnAvatarZoom || DOM.dlgAvatarPreview;
  if (avatarZoomTarget && DOM.dlgAvatarPreview) {
    avatarZoomTarget.addEventListener('click', (e) => {
      e.preventDefault();
      openAvatarLightbox(DOM.dlgAvatarPreview.src);
    });
  }

  // Lightbox close controls
  if (DOM.btnCloseAvatarLightbox) DOM.btnCloseAvatarLightbox.addEventListener('click', closeAvatarLightbox);
  if (DOM.avatarLightbox) {
    DOM.avatarLightbox.addEventListener('click', (e) => {
      if (e.target === DOM.avatarLightbox) closeAvatarLightbox();
    });
  }
  if (DOM.inpAvatarFile) {
    DOM.inpAvatarFile.addEventListener('change', async () => {
      const file = DOM.inpAvatarFile.files && DOM.inpAvatarFile.files[0];
      if (!file) return;
      if (!file.type || !file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        DOM.inpAvatarFile.value = '';
        return;
      }
      try {
        const optimized = await fileToOptimizedSquareDataUrl(file);
        state.selectedAvatarDataUrl = optimized;
        if (DOM.dlgAvatarPreview) DOM.dlgAvatarPreview.src = optimized;
        if (DOM.avatarFilename) DOM.avatarFilename.textContent = file.name;
      } catch (err) {
        console.error(err);
        showToast('Failed to read that image. Please try another file.', 'error');
      }
    });
  }

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
  if (DOM.frmCreatorApply) {
    DOM.frmCreatorApply.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleCreatorApplicationSubmit();
    });
  }

  if (DOM.frmPremiumApply) {
    DOM.frmPremiumApply.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handlePremiumApplicationSubmit();
    });
  }

  if (DOM.btnGoCreatorsPage) DOM.btnGoCreatorsPage.addEventListener('click', () => {
    window.location.href = 'creators.html';
  });

  if (DOM.btnGoPremiumPage) DOM.btnGoPremiumPage.addEventListener('click', () => {
    window.location.href = 'premium-society.html';
  });


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

  // Access redirect (when approved by admin)
  if (!DEV_MODE && state && state.me) {
    const cst = normalizeStatus(state.me.creatorStatus);
    const pst = normalizeStatus(state.me.premiumStatus);
    if (tabName === 'creators' && cst === 'approved') {
      window.location.href = 'creators.html';
      return;
    }
    if (tabName === 'premium' && pst === 'approved') {
      window.location.href = 'premium-society.html';
      return;
    }
  }
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
// RECENT MOMENTS (STORIES) – LIVE MODE
// - One bubble per user (Option A)
// - Sequential playback per user
// - Upload supports photo/video only (no music)
// ---------------------------------------------------------------------

const MomentsController = (() => {
  let momentsByOwner = new Map();
  let activeOwnerId = null;
  let activeList = [];
  let activeIndex = 0;
  let timer = null;

  const IMG_DURATION_MS = 5500;
  const MAX_UPLOAD_BYTES = 7 * 1024 * 1024; // 7MB base file (before base64 overhead)

  function stopPlayback() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (DOM.storyMainVideo) {
      try {
        DOM.storyMainVideo.pause();
        DOM.storyMainVideo.currentTime = 0;
      } catch {}
      DOM.storyMainVideo.onended = null;
    }
    if (DOM.storyProgressFill) {
      DOM.storyProgressFill.style.transition = 'none';
      DOM.storyProgressFill.style.width = '0%';
    }
  }

  function timeAgo(ms) {
    const now = Date.now();
    const d = Math.max(0, now - ms);
    const sec = Math.floor(d / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  }

  function groupMoments(moments = []) {
    const map = new Map();
    moments
      .filter(m => m && m.ownerId)
      .sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0))
      .forEach(m => {
        const key = m.ownerId;
        if (!map.has(key)) {
          map.set(key, {
            ownerId: key,
            ownerName: m.ownerName || 'User',
            ownerAvatarUrl: m.ownerAvatarUrl || 'assets/images/truematch-mark.png',
            moments: []
          });
        }
        map.get(key).moments.push(m);
      });
    momentsByOwner = map;
  }

  function buildStoryItemHTML({ ownerId, ownerName, ownerAvatarUrl, thumbUrl, hasVideo }) {
    const safeName = ownerName || 'User';
    const avatar = ownerAvatarUrl || 'assets/images/truematch-mark.png';
    const thumb = thumbUrl || avatar;
    const playBadge = hasVideo
      ? `<div style="position:absolute; bottom:6px; right:6px; width:18px; height:18px; border-radius:9px; background:rgba(0,0,0,.55); color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px;">▶</div>`
      : '';

    return `
      <div class="story-item" data-owner-id="${ownerId}">
        <div class="story-ring" style="border: 2px solid #ffd700; padding:2px; position:relative;">
          <img class="story-img" src="${thumb}" alt="${safeName}" style="background:transparent">
          ${playBadge}
        </div>
        <span class="story-name">${safeName}</span>
      </div>
    `;
  }

  function render(container) {
    if (!container) return;

    let html = `
      <div class="story-item action" data-action="add-moment">
        <div class="story-ring ring-add" style="border:2px solid rgba(255,255,255,.25); padding:2px;">
          <div class="story-img" style="display:flex; align-items:center; justify-content:center; font-size:22px;">+</div>
        </div>
        <span class="story-name">Add</span>
      </div>
    `;

    const owners = Array.from(momentsByOwner.values())
      // latest activity first
      .sort((a, b) => {
        const al = a.moments[a.moments.length - 1];
        const bl = b.moments[b.moments.length - 1];
        return (bl?.createdAtMs || 0) - (al?.createdAtMs || 0);
      });

    owners.forEach(o => {
      const last = o.moments[o.moments.length - 1];
      const hasVideo = !!last?.mediaType && String(last.mediaType).startsWith('video/');
      // For video moments, use the user's avatar as thumbnail to avoid broken <img src="video">.
      const thumbUrl = hasVideo ? (o.ownerAvatarUrl || 'assets/images/truematch-mark.png') : (last?.mediaUrl || o.ownerAvatarUrl);
      html += buildStoryItemHTML({
        ownerId: o.ownerId,
        ownerName: o.ownerName,
        ownerAvatarUrl: o.ownerAvatarUrl,
        thumbUrl,
        hasVideo
      });
    });

    container.innerHTML = html;
  }

  async function refresh() {
    try {
      // Scope moments to matches + self (no global feed)
      const resp = await apiGet('/api/moments/list?scope=matches');
      if (resp && resp.ok && Array.isArray(resp.moments)) {
        groupMoments(resp.moments);
      } else {
        groupMoments([]);
      }
    } catch {
      groupMoments([]);
    }
    render(DOM.storiesContainer);
    render(DOM.mobileStoriesContainer);
  }

  function startProgress(durationMs) {
    if (!DOM.storyProgressFill) return;
    DOM.storyProgressFill.style.transition = 'none';
    DOM.storyProgressFill.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        DOM.storyProgressFill.style.transition = `width ${durationMs}ms linear`;
        DOM.storyProgressFill.style.width = '100%';
      });
    });
  }

  function setHeader(owner, moment) {
    if (DOM.storyUserName) DOM.storyUserName.textContent = owner?.ownerName || 'User';
    if (DOM.storyUserImg) {
      DOM.storyUserImg.src = owner?.ownerAvatarUrl || 'assets/images/truematch-mark.png';
      DOM.storyUserImg.style.backgroundColor = '#111';
    }
    // Update the small time label if present
    const t = DOM.dlgStory ? DOM.dlgStory.querySelector('.story-header-overlay .time') : null;
    if (t && moment?.createdAtMs) t.textContent = timeAgo(moment.createdAtMs);
  }

  function showMoment(owner, moment) {
    if (!moment) return;
    stopPlayback();
    setHeader(owner, moment);

    const isVideo = !!moment.mediaType && String(moment.mediaType).startsWith('video/');
    const url = moment.mediaUrl;

    if (isVideo && DOM.storyMainVideo) {
      if (DOM.storyMainImg) DOM.storyMainImg.style.display = 'none';
      DOM.storyMainVideo.style.display = 'block';
      DOM.storyMainVideo.src = url;
      DOM.storyMainVideo.muted = true;
      DOM.storyMainVideo.playsInline = true;

      // When metadata loads, start progress for the actual duration (capped).
      const onLoaded = () => {
        const dur = Number.isFinite(DOM.storyMainVideo.duration) ? DOM.storyMainVideo.duration * 1000 : 8000;
        const capped = Math.max(4000, Math.min(dur, 20000));
        startProgress(capped);
        // Attempt autoplay; if blocked, user can tap to continue.
        DOM.storyMainVideo.play().catch(() => {});
      };
      DOM.storyMainVideo.onloadedmetadata = onLoaded;
      DOM.storyMainVideo.onended = () => next();
    } else {
      if (DOM.storyMainVideo) {
        DOM.storyMainVideo.style.display = 'none';
        DOM.storyMainVideo.src = '';
      }
      if (DOM.storyMainImg) {
        DOM.storyMainImg.style.display = 'block';
        DOM.storyMainImg.src = url || 'assets/images/truematch-mark.png';
        DOM.storyMainImg.style.backgroundColor = '#111';
      }
      startProgress(IMG_DURATION_MS);
      timer = setTimeout(() => next(), IMG_DURATION_MS);
    }
  }

  function openOwnerStories(ownerId) {
    const owner = momentsByOwner.get(ownerId);
    if (!owner || !owner.moments || owner.moments.length === 0) return;

    activeOwnerId = ownerId;
    activeList = owner.moments.slice();
    activeIndex = 0;

    if (DOM.dlgStory) {
      DOM.dlgStory.showModal();
    }

    showMoment(owner, activeList[activeIndex]);

    // Tap zones: left = prev, right = next
    const storyView = DOM.dlgStory ? DOM.dlgStory.querySelector('.story-view') : null;
    if (storyView && !storyView._momentsBound) {
      storyView._momentsBound = true;
      storyView.addEventListener('click', (e) => {
        // Ignore clicks on the close button area handled elsewhere
        const rect = storyView.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width * 0.33) prev();
        else next();
      });
    }
  }

  function next() {
    if (!activeOwnerId) return;
    const owner = momentsByOwner.get(activeOwnerId);
    if (!owner) return;
    activeIndex += 1;
    if (activeIndex >= activeList.length) {
      closeStory();
      return;
    }
    showMoment(owner, activeList[activeIndex]);
  }

  function prev() {
    if (!activeOwnerId) return;
    const owner = momentsByOwner.get(activeOwnerId);
    if (!owner) return;
    activeIndex -= 1;
    if (activeIndex < 0) activeIndex = 0;
    showMoment(owner, activeList[activeIndex]);
  }

  async function uploadFile(file) {
    if (!file) return;
    const type = String(file.type || '');
    if (!(type.startsWith('image/') || type.startsWith('video/'))) {
      showToast('Photo or video only for Moments.', 'error');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast('File too large. Use a smaller photo/video (max ~7MB).', 'error');
      return;
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('read failed'));
      r.readAsDataURL(file);
    });

    try {
      showToast('Uploading moment...');
      const resp = await apiPost('/api/moments/create', {
        mediaDataUrl: dataUrl,
        mediaType: type
      });
      if (resp && resp.ok) {
        showToast('Moment posted.');
        await refresh();
      } else {
        showToast(resp?.error || 'Upload failed.', 'error');
      }
    } catch {
      showToast('Upload failed.', 'error');
    }
  }

  function pickAndUpload() {
    if (!DOM.momentFileInput) {
      showToast('Upload input missing.', 'error');
      return;
    }
    DOM.momentFileInput.click();
  }

  function handleStoryClick(e) {
    const item = e.target.closest('.story-item');
    if (!item) return;

    if (item.classList.contains('action') || item.dataset.action === 'add-moment') {
      pickAndUpload();
      return;
    }

    const ownerId = item.dataset.ownerId;
    if (!ownerId) return;
    openOwnerStories(ownerId);
  }

  function closeStory() {
    stopPlayback();
    activeOwnerId = null;
    activeList = [];
    activeIndex = 0;
    if (DOM.dlgStory && DOM.dlgStory.open) DOM.dlgStory.close();
  }

  async function init() {
    // Bind file input once
    if (DOM.momentFileInput && !DOM.momentFileInput._momentsBound) {
      DOM.momentFileInput._momentsBound = true;
      DOM.momentFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        // Reset value so selecting same file again triggers change
        e.target.value = '';
        await uploadFile(file);
      });
    }

    // Ensure closing the dialog stops timers
    if (DOM.dlgStory && !DOM.dlgStory._momentsBound) {
      DOM.dlgStory._momentsBound = true;
      DOM.dlgStory.addEventListener('close', () => stopPlayback());
    }

    await refresh();
  }

  return {
    init,
    handleStoryClick,
    closeStory
  };
})();


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
      prefs = { city: 'New York', ageMin: 21, ageMax: 35, ethnicity: 'caucasian', lookingFor: ['women'], intent: 'long-term', dealbreakers: '', sharedValues: ['fitness'] };
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
    applyAdvancedPrefsLock();

    // Creators & Premium Society entry cards
    if (!DEV_MODE) renderCreatorPremiumEntryCards();

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
    // Premium tab should be hidden for Free users, shown for paid tiers
    free: ['home', 'matches', 'swipe', 'creators', 'settings'],
    tier1: ['home', 'matches', 'swipe', 'creators', 'premium', 'settings'],
    tier2: ['home', 'matches', 'shortlist', 'approved', 'swipe', 'creators', 'premium', 'settings'],
    tier3: ['home', 'matches', 'shortlist', 'approved', 'confirmed', 'swipe', 'creators', 'premium', 'settings']
  };
  const allowed = rules[state.plan] || rules.free;

  DOM.tabs.forEach(tab => {
    const panel = tab.dataset.panel;
    // Non-panel buttons (e.g., Logout) must never be plan-gated.
    if (!panel) {
      tab.hidden = false;
      tab.style.display = 'flex';
      return;
    }
    if (allowed.includes(panel)) {
      tab.hidden = false;
      tab.style.display = 'flex';
    } else {
      tab.hidden = true;
      tab.style.display = 'none';
    }
  });
}

function applyAdvancedPrefsLock() {
  if (!DOM.advancedPrefsSection) return;
  // Keep behavior consistent with Preferences page: advanced section is not editable on Free.
  const locked = !DEV_MODE && state.plan === 'free';
  DOM.advancedPrefsSection.classList.toggle('is-locked', locked);
  if (DOM.advLockNote) DOM.advLockNote.hidden = !locked;

  const fields = DOM.advancedPrefsSection.querySelectorAll('select, textarea, input');
  fields.forEach((el) => {
    el.disabled = locked;
  });
}

function getSharedValuesFromUI() {
  if (!DOM.inpSharedValues) return [];
  return Array.from(DOM.inpSharedValues.querySelectorAll('input[type="checkbox"]'))
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function setSharedValuesInUI(values) {
  if (!DOM.inpSharedValues) return;
  const set = new Set(Array.isArray(values) ? values : []);
  Array.from(DOM.inpSharedValues.querySelectorAll('input[type="checkbox"]')).forEach((cb) => {
    cb.checked = set.has(cb.value);
  });
}

function humanizeEthnicity(val) {
  const map = {
    african: 'African',
    asian: 'Asian',
    caucasian: 'Caucasian',
    hispanic: 'Hispanic',
    'middle-eastern': 'Middle Eastern',
    mixed: 'Mixed',
    other: 'Other'
  };
  return map[val] || val || '';
}

function humanizeIntent(val) {
  const map = {
    'long-term': 'Long-term',
    'short-term': 'Short-term',
    open: 'Open'
  };
  return map[val] || (val ? String(val) : '');
}

function renderSettingsDisplay(user, prefs) {
  if (DOM.sNameDisplay) DOM.sNameDisplay.textContent = user?.name || '—';
  if (DOM.sEmailDisplay) DOM.sEmailDisplay.textContent = user?.email || '—';
  if (DOM.sAvatar) DOM.sAvatar.src = user?.avatarUrl || 'assets/images/truematch-mark.png';

  // Profile fields (matches Preferences "Your profile")
  if (DOM.dispCity) DOM.dispCity.textContent = user?.city || '—';

  
  if (DOM.dispAge) DOM.dispAge.textContent = user?.age ? String(user.age) : '—';
// Preferences fields (matches Preferences page)
  const prefCity = prefs?.city || '';
  const ageMin = Number.isFinite(prefs?.ageMin) ? prefs.ageMin : (prefs?.ageMin ? parseInt(prefs.ageMin, 10) : null);
  const ageMax = Number.isFinite(prefs?.ageMax) ? prefs.ageMax : (prefs?.ageMax ? parseInt(prefs.ageMax, 10) : null);

  if (DOM.dispPrefCity) DOM.dispPrefCity.textContent = prefCity || '—';
  if (DOM.dispAgeRange) {
    DOM.dispAgeRange.textContent = (ageMin && ageMax) ? `${ageMin} - ${ageMax}` : '—';
  }
  if (DOM.dispEthnicity) {
    DOM.dispEthnicity.textContent = prefs?.ethnicity ? humanizeEthnicity(prefs.ethnicity) : 'Any';
  }
  if (DOM.dispLooking) {
    const lookingArr = Array.isArray(prefs?.lookingFor) ? prefs.lookingFor : (prefs?.lookingFor ? [prefs.lookingFor] : []);
    const lookingText = lookingArr.length ? lookingArr.map(v => v ? (v[0].toUpperCase() + v.slice(1)) : '').filter(Boolean).join(', ') : '—';
    DOM.dispLooking.textContent = lookingText;
  }
  if (DOM.dispIntent) {
    DOM.dispIntent.textContent = prefs?.intent ? humanizeIntent(prefs.intent) : 'Any';
  }
  if (DOM.dispSharedValues) {
    const vals = Array.isArray(prefs?.sharedValues) ? prefs.sharedValues : [];
    DOM.dispSharedValues.textContent = vals.length ? vals.map(v => v ? (v[0].toUpperCase() + v.slice(1)) : '').filter(Boolean).join(', ') : '—';
  }
  if (DOM.dispDealbreakers) {
    const d = (prefs?.dealbreakers || '').trim();
    DOM.dispDealbreakers.textContent = d ? (d.length > 70 ? `${d.slice(0, 67)}...` : d) : '—';
  }
}

function syncFormToState() {
  const { me, prefs } = state;
  if (!me) return;

  if (DOM.inpName) DOM.inpName.value = me.name || '';
  if (DOM.inpEmail) DOM.inpEmail.value = me.email || '';
  if (DOM.inpCity) DOM.inpCity.value = me.city || '';
  if (DOM.inpUserAge) DOM.inpUserAge.value = me.age || '';

  // Avatar (preview existing unless user selects a new one)
  if (DOM.inpAvatarFile) DOM.inpAvatarFile.value = '';
  if (DOM.avatarFilename) DOM.avatarFilename.textContent = 'No file chosen';
  if (DOM.dlgAvatarPreview) DOM.dlgAvatarPreview.src = me.avatarUrl || 'assets/images/truematch-mark.png';

  const p = prefs || {};
  if (DOM.inpPrefCity) DOM.inpPrefCity.value = p.city || '';
  if (DOM.inpAgeMin) DOM.inpAgeMin.value = p.ageMin || 18;
  if (DOM.inpAgeMax) DOM.inpAgeMax.value = p.ageMax || 50;
  if (DOM.inpLooking) {
    const lf = Array.isArray(p.lookingFor) ? p.lookingFor[0] : p.lookingFor;
    DOM.inpLooking.value = lf || 'women';
  }
  if (DOM.inpEthnicity) DOM.inpEthnicity.value = p.ethnicity || '';

  // Advanced filters
  if (DOM.inpIntent) DOM.inpIntent.value = p.intent || '';
  if (DOM.inpDealbreakers) DOM.inpDealbreakers.value = p.dealbreakers || '';
  setSharedValuesInUI(p.sharedValues || []);
}


async function handleCreatorApplicationSubmit() {
  if (!state.me || !state.me.email) {
    showToast('Please log in first.', 'error');
    window.location.href = 'auth.html?mode=login';
    return;
  }

  const status = normalizeStatus(state.me.creatorStatus);
  if (status === 'pending') {
    showToast('Creator application is already pending.', 'error');
    return;
  }

  const form = DOM.frmCreatorApply;
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const oldTxt = submitBtn ? submitBtn.textContent : '';
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    const fd = new FormData(form);

    // Respect HTML required fields (so the form feels native and solid).
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

    const handle = String(fd.get('handle') || '').trim();
    const price = String(fd.get('price') || '').trim();

    // New (OnlyFans-style) fields (UI-only, but we still persist them safely)
    const displayName = String(fd.get('creatorDisplayName') || '').trim();
    const country = String(fd.get('creatorCountry') || '').trim();
    const languages = String(fd.get('creatorLanguages') || '').trim();
    const bio = String(fd.get('creatorBio') || '').trim();
    const category = String(fd.get('creatorCategory') || '').trim();
    const niche = String(fd.get('creatorNiche') || '').trim();
    const schedule = String(fd.get('creatorPostingSchedule') || '').trim();
    const boundaries = String(fd.get('creatorContentBoundaries') || '').trim();
    const currency = String(fd.get('creatorCurrency') || 'USD').trim();

    // Links (optional)
    const ig = String(fd.get('creatorInstagram') || '').trim();
    const tt = String(fd.get('creatorTikTok') || '').trim();
    const x = String(fd.get('creatorX') || '').trim();
    const web = String(fd.get('creatorWebsite') || '').trim();

    const contentStyleRaw = String(fd.get('contentStyle') || '').trim();
    const gender = String(fd.get('gender') || '').trim();

    const linksParts = [];
    if (ig) linksParts.push(`Instagram: ${ig}`);
    if (tt) linksParts.push(`TikTok: ${tt}`);
    if (x) linksParts.push(`X: ${x}`);
    if (web) linksParts.push(`Website: ${web}`);
    const linksCompiled = linksParts.join(" | ");

    // NOTE: Current backend stores only {handle, gender, contentStyle, price, links}.
    // To avoid touching server logic, we safely "pack" the new fields into contentStyle/links.
    const packedContentStyle = [
      displayName ? `Display name: ${displayName}` : '',
      country ? `Location: ${country}` : '',
      languages ? `Languages: ${languages}` : '',
      category ? `Category: ${category}` : '',
      niche ? `Niche: ${niche}` : '',
      schedule ? `Posting schedule: ${schedule}` : '',
      bio ? `Bio: ${bio}` : '',
      boundaries ? `Boundaries: ${boundaries}` : '',
      currency ? `Currency: ${currency}` : '',
      contentStyleRaw ? `Style notes: ${contentStyleRaw}` : ''
    ].filter(Boolean).join(" | ");

    const payload = {
      handle,
      price,
      contentStyle: packedContentStyle,
      gender,
      links: linksCompiled
    };

    if (!payload.handle || !payload.price) {
      showToast('Please fill in your handle and monthly price.', 'error');
      return;
    }

    // Extra "OnlyFans-style" required checks (kept lightweight)
    if (!displayName || !country || !languages || !bio || !category || !schedule) {
      showToast('Please complete the required Creator Application fields.', 'error');
      return;
    }

    const res = await apiPost('/api/me/creator/apply', payload);
    if (!res || !res.ok) throw new Error(res && res.error ? res.error : 'Failed to submit application.');

    showToast('Creator application submitted. Status: pending.');
    if (DOM.dlgCreatorApply) DOM.dlgCreatorApply.close();

    // Update local state (so UI reflects pending immediately)
    state.me.creatorStatus = 'pending';
    state.me.creatorApplication = { ...payload, submittedAt: Date.now() };

    renderCreatorPremiumEntryCards();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to submit creator application.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = oldTxt || 'Submit Application';
    }
  }
}

async function handlePremiumApplicationSubmit() {
  if (!state.me || !state.me.email) {
    showToast('Please log in first.', 'error');
    window.location.href = 'auth.html?mode=login';
    return;
  }

  const status = normalizeStatus(state.me.premiumStatus);
  if (status === 'pending') {
    showToast('Premium Society application is already pending.', 'error');
    return;
  }

  const form = DOM.frmPremiumApply;
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const oldTxt = submitBtn ? submitBtn.textContent : '';
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    const fd = new FormData(form);
    const payload = {
      fullName: String(fd.get('fullName') || '').trim(),
      age: String(fd.get('age') || '').trim(),
      occupation: String(fd.get('occupation') || '').trim(),
      finance: String(fd.get('finance') || '').trim()
    };

    if (!payload.fullName || !payload.occupation) {
      showToast('Please fill in your full name and occupation.', 'error');
      return;
    }

    const res = await apiPost('/api/me/premium/apply', payload);
    if (!res || !res.ok) throw new Error(res && res.error ? res.error : 'Failed to submit application.');

    showToast('Premium Society application submitted. Status: pending.');
    if (DOM.dlgPremiumApply) DOM.dlgPremiumApply.close();

    state.me.premiumStatus = 'pending';
    state.me.premiumApplication = { ...payload, submittedAt: Date.now() };

    renderCreatorPremiumEntryCards();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to submit Premium Society application.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = oldTxt || 'Submit Application';
    }
  }
}

async function handleProfileSave() {
  const name = (DOM.inpName ? DOM.inpName.value : '').trim();
  const profileCity = (DOM.inpCity ? DOM.inpCity.value : '').trim();
  const age = DOM.inpUserAge ? parseInt(DOM.inpUserAge.value, 10) : null;

  const preferredCity = (DOM.inpPrefCity ? DOM.inpPrefCity.value : '').trim();
  const ageMin = DOM.inpAgeMin ? parseInt(DOM.inpAgeMin.value, 10) : 18;
  const ageMax = DOM.inpAgeMax ? parseInt(DOM.inpAgeMax.value, 10) : 50;
  const lookingFor = DOM.inpLooking ? DOM.inpLooking.value : 'women';
  const ethnicity = DOM.inpEthnicity ? DOM.inpEthnicity.value : '';

  const intent = DOM.inpIntent ? DOM.inpIntent.value : '';
  const dealbreakers = (DOM.inpDealbreakers ? DOM.inpDealbreakers.value : '').trim();
  const sharedValues = getSharedValuesFromUI();

  // Validation (mirrors Preferences page requirements)
  if (!name) {
    showToast('Name is required.', 'error');
    return;
  }
  if (!preferredCity) {
    showToast('Preferred city is required.', 'error');
    return;
  }
  if (!Number.isFinite(age) || age < 18 || age > 99) {
    showToast('Please enter a valid age (18-99).', 'error');
    return;
  }
  if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax) || ageMin < 18 || ageMax > 99 || ageMin > ageMax) {
    showToast('Please enter a valid age range.', 'error');
    return;
  }

  const profilePayload = {
    name,
    city: profileCity,
    age
  };
  if (state.selectedAvatarDataUrl) profilePayload.avatarDataUrl = state.selectedAvatarDataUrl;

  const prefsPayload = {
    city: preferredCity,
    ageMin,
    ageMax,
    lookingFor: [lookingFor]
  };
  if (ethnicity) prefsPayload.ethnicity = ethnicity;
  if (intent) prefsPayload.intent = intent;
  if (dealbreakers) prefsPayload.dealbreakers = dealbreakers;
  prefsPayload.sharedValues = Array.isArray(sharedValues) ? sharedValues : [];

  try {
    let profileRes;
    if (DEV_MODE) profileRes = { ok: true, user: { ...state.me, ...profilePayload } };
    else profileRes = await apiUpdateProfile(profilePayload);

    if (!profileRes || !profileRes.ok) {
      throw new Error('Failed to update profile.');
    }

    let prefsRes;
    if (DEV_MODE) prefsRes = { ok: true, prefs: { ...state.prefs, ...prefsPayload } };
    else prefsRes = await apiSavePrefs(prefsPayload);

    if (!prefsRes || !prefsRes.ok) {
      throw new Error('Failed to update preferences.');
    }

    const updatedUser = profileRes.user || { ...state.me, ...profilePayload };
    const updatedPrefs = prefsRes.prefs || { ...state.prefs, ...prefsPayload };

    state.me = updatedUser;
    state.prefs = updatedPrefs;

    saveLocalUser(state.me);
    savePrefsForCurrentUser(state.prefs);

    showToast('Saved successfully!');
    renderSettingsDisplay(state.me, state.prefs);
    renderHome(state.me);
    DOM.dlgProfile.close();
  } catch (e) {
    console.error(e);
    showToast(e?.message || 'Failed to save. Please try again.', 'error');
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
       const apiType = (type === 'superlike') ? 'star' : type;
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