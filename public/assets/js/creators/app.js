import { DOM } from './dom.js';
import { initHome } from './home.js';
import { initNotifications } from './notifications.js';
import { initMessages, loadChat } from './message.js';
import { initCollections, renderCollections, updateRightSidebarContent } from './collections.js'; 
import { initWallet } from './wallet.js';
import { loadView } from './loader.js';
import { initSettings } from './settings.js';
import { initProfilePage } from './profile.js'; // Import logic
import { COLLECTIONS_DB } from './data.js';

// ---------------- Creators Sync: hydrate from /api/me ----------------
async function tmApiMe() {
  const res = await fetch('/api/me', { method: 'GET', credentials: 'include' });
  return res.json().catch(() => null);
}

function tmSplitPipes(str) {
  if (!str) return [];
  return String(str).split('|').map(s => s.trim()).filter(Boolean);
}

function tmGetPacked(packed, label) {
  if (!packed || !label) return '';
  const want = String(label).trim().toLowerCase();
  for (const seg of tmSplitPipes(packed)) {
    const idx = seg.indexOf(':');
    if (idx === -1) continue;
    const key = seg.slice(0, idx).trim().toLowerCase();
    if (key === want) return seg.slice(idx + 1).trim();
  }
  return '';
}

function tmSetText(selOrEl, text) {
  const el = typeof selOrEl === 'string' ? document.querySelector(selOrEl) : selOrEl;
  if (el) el.textContent = text;
}
function tmSetSrc(selOrEl, src) {
  const el = typeof selOrEl === 'string' ? document.querySelector(selOrEl) : selOrEl;
  if (el && src) el.src = src;
}
function tmSetBgImage(selOrEl, url) {
  const el = typeof selOrEl === 'string' ? document.querySelector(selOrEl) : selOrEl;
  if (!el || !url) return;
  el.style.backgroundImage = `url('${url}')`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
}

function tmUpsertCreatorMetaBlock(meta) {
  const bioEl = document.querySelector('#view-my-profile .profile-bio-text');
  if (!bioEl) return;

  const rows = [
    ['Location', meta.location],
    ['Languages', meta.languages],
    ['Category', meta.category],
    ['Niche', meta.niche],
    ['Posting schedule', meta.postingSchedule],
    ['Boundaries', meta.boundaries],
    ['Style notes', meta.styleNotes]
  ].filter(([, v]) => v && String(v).trim());

  let wrap = document.getElementById('tmCreatorMeta');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'tmCreatorMeta';
    wrap.style.marginTop = '10px';
    wrap.style.padding = '10px 12px';
    wrap.style.border = '1px solid var(--border-color)';
    wrap.style.borderRadius = '12px';
    wrap.style.background = 'rgba(255,255,255,0.02)';
    bioEl.insertAdjacentElement('afterend', wrap);
  }

  if (!rows.length) {
    wrap.remove();
    return;
  }

  wrap.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;">Creator details</div>
    ${rows.map(([k,v]) => `
      <div style="display:flex;gap:10px;margin:4px 0;">
        <div style="min-width:120px;color:var(--muted);font-size:12px;">${k}</div>
        <div style="color:var(--text);font-size:13px;line-height:1.35;">${String(v)}</div>
      </div>
    `).join('')}
  `;
}

async function tmHydrateCreatorsFromMe() {
  const data = await tmApiMe();
  if (!data || !data.ok || !data.user) return;

  const user = data.user;
  const app = user.creatorApplication || null;

  const packed = app?.contentStyle || '';
  const displayName = tmGetPacked(packed, 'Display name') || tmGetPacked(packed, 'Name') || user.name || 'Your Name';
  const handleRaw = (app?.handle || user.username || '').replace(/^@/, '');
  const handle = handleRaw ? `@${handleRaw}` : '@username';

  const bio = tmGetPacked(packed, 'Bio');
  const meta = {
    location: tmGetPacked(packed, 'Location'),
    languages: tmGetPacked(packed, 'Languages'),
    category: tmGetPacked(packed, 'Category'),
    niche: tmGetPacked(packed, 'Niche'),
    postingSchedule: tmGetPacked(packed, 'Posting schedule'),
    boundaries: tmGetPacked(packed, 'Boundaries'),
    styleNotes: tmGetPacked(packed, 'Style notes')
  };

  // Left profile card
  tmSetText('#creatorProfileName', displayName);
  tmSetText('#creatorProfileHandle', handle);
  tmSetSrc('#creatorProfileAvatar', user.avatarUrl);

  // Popover
  tmSetText('#creatorPopoverName', displayName);
  tmSetText('#creatorPopoverHandle', handle);

  // Profile header (view-my-profile)
  tmSetText('#creatorHeaderName', displayName);
  tmSetText('#creatorHeaderHandle', handle);

  if (bio && bio.trim()) tmSetText('#view-my-profile .profile-bio-text', bio);
  tmSetSrc('#view-my-profile .profile-avatar-main', user.avatarUrl);
  tmSetBgImage('#view-my-profile .profile-header-bg', user.headerUrl);

  // Optional: show the rest of the application details under the bio
  tmUpsertCreatorMetaBlock(meta);
}

// 🔥 TOAST CONFIGURATION 🔥
const TopToast = Swal.mixin({
  toast: true, 
  position: 'top-end', 
  showConfirmButton: false, 
  timer: 3000, 
  timerProgressBar: true, 
  background: '#0d1423', 
  color: '#fff',
  didOpen: (toast) => {
    toast.style.marginTop = '15px';
    toast.style.marginRight = '15px';
  }
});

// 🔥 SWEETALERT FIX 🔥
const originalSwalFire = Swal.fire;
Swal.fire = function(args) {
    const isToast = args.toast === true; 

    const config = { ...args };
    if (!isToast) {
        config.heightAuto = false;
        config.scrollbarPadding = false;
    }

    config.didOpen = (popup) => {
        const container = Swal.getContainer();
        if(container) {
            container.style.zIndex = '2147483647'; 
            
            if (isToast) {
                container.style.setProperty('background-color', 'transparent', 'important');
                container.style.setProperty('width', 'auto', 'important');
                container.style.setProperty('height', 'auto', 'important');
                container.style.setProperty('inset', 'auto', 'important'); 
                container.style.setProperty('pointer-events', 'none', 'important'); 
                popup.style.pointerEvents = 'auto'; 
            } else {
                container.style.position = 'fixed';
                container.style.inset = '0';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            }
        }
        if (args.didOpen) args.didOpen(popup);
    };

    return originalSwalFire.call(this, config);
};

async function init() {
  console.log("App Init...");
  
  await Promise.all([
      loadView('container-messages', 'assets/views/message.html'), 
      loadView('container-settings', 'assets/views/settings.html'),
      loadView('container-notifications', 'assets/views/notifications.html'),
      loadView('container-collections', 'assets/views/collections.html')
  ]);
  
  // Initialize Modules
  initHome(TopToast);
  initNotifications();
  initMessages(TopToast);
  initCollections(TopToast);
  initWallet(TopToast);
  initSettings();
  initCardTabs(); 
  
  // 🔥 RENAMED TO AVOID CONFLICT 🔥
  initProfileTabs(); 
  
  initNewPostButton();
  initSwipeGestures(); 

  // Mobile full-screen composer (Option C)
  ensureComposeSheet();
  
  injectSidebarToggles();
  ensureFooterHTML();
  
  setupGlobalEvents(); 
  
  if (DOM.themeToggle) {
      DOM.themeToggle.checked = document.body.classList.contains('tm-dark');
      DOM.themeToggle.addEventListener('change', function() {
          if (this.checked) {
              document.body.classList.remove('tm-light'); document.body.classList.add('tm-dark');
          } else {
              document.body.classList.remove('tm-dark'); document.body.classList.add('tm-light');
          }
      });
  }

  setupNavigation();
  await tmHydrateCreatorsFromMe();

  setTimeout(() => { 
      if(DOM.appLoader) { 
          DOM.appLoader.style.opacity = '0'; DOM.appLoader.style.visibility = 'hidden'; 
          setTimeout(() => { if(DOM.appLoader.parentNode) DOM.appLoader.parentNode.removeChild(DOM.appLoader); }, 500); 
      } 
  }, 500);

  const lastView = localStorage.getItem('tm_last_view') || 'home';
  switchView(lastView);
}

function initSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 80;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        if (touchEndX > touchStartX + minSwipeDistance) {
            // If compose sheet is open, close it first.
            if (isComposeSheetOpen()) {
                closeComposeSheet();
                return;
            }
            if (DOM.popover && DOM.popover.classList.contains('is-open')) {
                DOM.popover.classList.remove('is-open');
                return;
            }
            if (DOM.rightSidebar && DOM.rightSidebar.classList.contains('mobile-active')) {
                DOM.rightSidebar.classList.remove('mobile-active');
                return;
            }
            const msgView = document.getElementById('view-messages');
            if (msgView && msgView.classList.contains('mobile-chat-active')) {
                msgView.classList.remove('mobile-chat-active');
                return;
            }
            const current = localStorage.getItem('tm_last_view');
            if (current && current !== 'home') {
                switchView('home');
                return;
            }
        }
    }
}

// =============================================================
// MOBILE FULL-SCREEN COMPOSER (Option C)
// - Desktop: focus inline composer
// - Mobile (<= 768px): open a full-screen sheet and move the existing
//   .compose-area into it so Home module listeners still work.
// =============================================================
const tmComposeSheet = {
    overlay: null,
    body: null,
    closeBtn: null,
    isOpen: false,
    originParent: null,
    originNextSibling: null,
    composeEl: null
};

function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function isComposeSheetOpen() {
    return !!tmComposeSheet.isOpen;
}

function ensureComposeSheet() {
    if (document.getElementById('tm-compose-sheet')) {
        // If it already exists (e.g., hot reload), re-bind references.
        tmComposeSheet.overlay = document.getElementById('tm-compose-sheet');
        tmComposeSheet.body = document.getElementById('tmComposeSheetBody');
        tmComposeSheet.closeBtn = document.getElementById('tmComposeSheetClose');
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'tm-compose-sheet';
    overlay.className = 'tm-compose-sheet';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="tm-sheet" role="dialog" aria-modal="true" aria-label="New post">
            <div class="tm-sheet-header">
                <button type="button" id="tmComposeSheetClose" class="tm-sheet-close" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="tm-sheet-title">New post</div>
                <div class="tm-sheet-spacer"></div>
            </div>
            <div class="tm-sheet-body" id="tmComposeSheetBody"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    tmComposeSheet.overlay = overlay;
    tmComposeSheet.body = overlay.querySelector('#tmComposeSheetBody');
    tmComposeSheet.closeBtn = overlay.querySelector('#tmComposeSheetClose');

    if (tmComposeSheet.closeBtn) {
        tmComposeSheet.closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeComposeSheet();
        });
    }

    overlay.addEventListener('click', (e) => {
        // Close only when clicking on the dimmed backdrop.
        if (e.target === overlay) closeComposeSheet();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isComposeSheetOpen()) closeComposeSheet();
    });

    window.addEventListener('resize', () => {
        // If user rotates / resizes to desktop while sheet is open, close it.
        if (isComposeSheetOpen() && !isMobileViewport()) closeComposeSheet();
    });
}

function openComposeSheet() {
    ensureComposeSheet();
    if (!tmComposeSheet.overlay || !tmComposeSheet.body) return;

    // Always open over Home view.
    switchView('home');

    const composeEl = document.querySelector('#view-home .compose-area');
    if (!composeEl) return;

    if (!tmComposeSheet.originParent) {
        tmComposeSheet.originParent = composeEl.parentNode;
        tmComposeSheet.originNextSibling = composeEl.nextSibling;
    }
    tmComposeSheet.composeEl = composeEl;

    // Move composer into the sheet (keeps listeners from home.js intact).
    tmComposeSheet.body.innerHTML = '';
    tmComposeSheet.body.appendChild(composeEl);

    document.body.classList.add('compose-sheet-open');
    tmComposeSheet.overlay.classList.add('is-open');
    tmComposeSheet.overlay.setAttribute('aria-hidden', 'false');
    tmComposeSheet.isOpen = true;

    // Focus textarea after paint.
    requestAnimationFrame(() => {
        const ta = document.getElementById('compose-input');
        if (ta) ta.focus();
    });
}

function closeComposeSheet() {
    if (!isComposeSheetOpen()) return;
    ensureComposeSheet();
    if (!tmComposeSheet.overlay) return;

    // Restore composer back to its original place.
    try {
        const el = tmComposeSheet.composeEl;
        if (el && tmComposeSheet.originParent) {
            const parent = tmComposeSheet.originParent;
            const next = tmComposeSheet.originNextSibling;
            if (next && next.parentNode === parent) parent.insertBefore(el, next);
            else parent.appendChild(el);
        }
    } catch (err) {
        console.warn('Compose sheet restore failed:', err);
    }

    tmComposeSheet.overlay.classList.remove('is-open');
    tmComposeSheet.overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('compose-sheet-open');
    tmComposeSheet.isOpen = false;
}

function setupGlobalEvents() {
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.header-toggle-btn');
        if (toggleBtn) {
            e.stopPropagation();
            e.preventDefault();
            const popover = document.getElementById('settings-popover');
            if (popover) popover.classList.add('is-open');
        }
    });

    if (DOM.btnMore) {
        DOM.btnMore.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const popover = document.getElementById('settings-popover');
            if(popover) popover.classList.toggle('is-open');
        });
    }

    const btnClose = document.getElementById('btnClosePopover');
    if(btnClose) {
        btnClose.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const popover = document.getElementById('settings-popover');
            if(popover) popover.classList.remove('is-open');
        });
    }

    document.addEventListener('click', (e) => {
        const popover = document.getElementById('settings-popover');
        const toggleBtn = e.target.closest('.header-toggle-btn');
        const moreBtn = e.target.closest('#trigger-more-btn');
        
        if (popover && popover.classList.contains('is-open')) {
            if (!popover.contains(e.target) && !toggleBtn && !moreBtn) {
                popover.classList.remove('is-open');
            }
        }
    });
}

function initNewPostButton() {
    const btnNewPost = document.querySelector('.btn-new-post');
    if (btnNewPost) {
        btnNewPost.addEventListener('click', () => {
            // Desktop/tablet: focus the inline composer.
            // Mobile: open the full-screen compose sheet (Option C).
            if (isMobileViewport()) {
                openComposeSheet();
                return;
            }

            switchView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const ta = document.getElementById('compose-input');
            if (ta) setTimeout(() => ta.focus(), 250);
        });
    }
}

function initCardTabs() {
    if(DOM.btnTabCards && DOM.btnTabPayments) {
        DOM.btnTabCards.addEventListener('click', () => {
            DOM.btnTabCards.classList.add('active'); DOM.btnTabPayments.classList.remove('active');
            if(DOM.tabContentCards) DOM.tabContentCards.classList.remove('hidden');
            if(DOM.tabContentPayments) DOM.tabContentPayments.classList.add('hidden');
        });
        DOM.btnTabPayments.addEventListener('click', () => {
            DOM.btnTabPayments.classList.add('active'); DOM.btnTabCards.classList.remove('active');
            if(DOM.tabContentPayments) DOM.tabContentPayments.classList.remove('hidden');
            if(DOM.tabContentCards) DOM.tabContentCards.classList.add('hidden');
        });
    }
}

// 🔥 RENAMED FUNCTION TO AVOID CONFLICT 🔥
function initProfileTabs() {
    const tabPosts = document.getElementById('tab-profile-posts');
    const tabMedia = document.getElementById('tab-profile-media');
    const contentPosts = document.getElementById('profile-content-posts');
    const contentMedia = document.getElementById('profile-content-media');
    const btnEdit = document.getElementById('btn-edit-profile');

    if(tabPosts && tabMedia) {
        tabPosts.addEventListener('click', () => {
            tabPosts.style.borderBottomColor = 'var(--text)';
            tabPosts.style.color = 'var(--text)';
            tabMedia.style.borderBottomColor = 'transparent';
            tabMedia.style.color = 'var(--muted)';
            contentPosts.classList.remove('hidden');
            contentMedia.classList.add('hidden');
        });

        tabMedia.addEventListener('click', () => {
            tabMedia.style.borderBottomColor = 'var(--text)';
            tabMedia.style.color = 'var(--text)';
            tabPosts.style.borderBottomColor = 'transparent';
            tabPosts.style.color = 'var(--muted)';
            contentMedia.classList.remove('hidden');
            contentPosts.classList.add('hidden');
        });
    }

    if(btnEdit) {
        btnEdit.addEventListener('click', () => {
            switchView('settings');
        });
    }
}

function setupNavigation() {
    if (DOM.navHome) DOM.navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
    if (DOM.navNotif) DOM.navNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
    if (DOM.navMessages) DOM.navMessages.addEventListener('click', (e) => { e.preventDefault(); switchView('messages'); });
    if (DOM.navCollections) DOM.navCollections.addEventListener('click', (e) => { e.preventDefault(); switchView('collections'); });
    if (DOM.navProfile) DOM.navProfile.addEventListener('click', (e) => { e.preventDefault(); switchView('profile'); });
    if (DOM.navAddCard) DOM.navAddCard.addEventListener('click', (e) => { e.preventDefault(); switchView('add-card'); });

    if (DOM.profileCard) {
        DOM.profileCard.addEventListener('click', (e) => {
            if (e.target.closest('.ph-settings')) {
                switchView('settings');
            } else {
                switchView('profile');
            }
        });
    }


    if (DOM.navSubs) {
        DOM.navSubs.addEventListener('click', (e) => { 
            e.preventDefault(); 
            switchView('subscriptions'); 
        }); 
    }


    document.querySelectorAll('.pop-item').forEach(link => {
        link.addEventListener('click', (e) => {
            const text = link.innerText.trim().toLowerCase();
            const popover = document.getElementById('settings-popover');
            if(popover) popover.classList.remove('is-open');

            if (text.includes('cards')) { e.preventDefault(); switchView('your-cards'); }
            else if (text.includes('add card')) { e.preventDefault(); switchView('add-card'); }
            else if (text.includes('settings')) { e.preventDefault(); switchView('settings'); }
            else if (text.includes('profile')) { e.preventDefault(); switchView('profile'); }
            else if (text.includes('creator') || text.includes('banking')) { e.preventDefault(); switchView('become-creator'); }
        });
    });

    const mobHome = document.getElementById('mob-nav-home');
    const mobAddCard = document.getElementById('mob-nav-add-card');
    const mobAdd = document.getElementById('mob-nav-add');
    const mobCollections = document.getElementById('mob-nav-collections');
    const mobNotif = document.getElementById('mob-nav-notif');

    if (mobHome) mobHome.addEventListener('click', () => switchView('home'));
    if (mobAddCard) mobAddCard.addEventListener('click', () => switchView('add-card'));
    if (mobCollections) mobCollections.addEventListener('click', () => switchView('collections'));
    if (mobNotif) mobNotif.addEventListener('click', () => switchView('notifications'));
    if (mobAdd) mobAdd.addEventListener('click', () => {
        // Mobile: open compose sheet. (Desktop/tablet shouldn't hit this because
        // bottom nav is hidden in CSS.)
        openComposeSheet();
    });
    
    document.addEventListener('click', (e) => {
        if(e.target.classList.contains('tablet-msg-btn')) {
            switchView('messages');
        }
    });
}

function switchView(viewName) {
    localStorage.setItem('tm_last_view', viewName);

    // If a full-screen compose sheet is open, close it before navigating.
    if (isComposeSheetOpen()) {
        closeComposeSheet();
    }

    const viewSubscriptions = document.getElementById('view-subscriptions');

    const views = [
        DOM.viewHome, DOM.viewNotif, DOM.viewMessages, DOM.viewCollections, viewSubscriptions,
        DOM.viewAddCard, DOM.viewYourCards, DOM.viewBecomeCreator, 
        DOM.viewMyProfile, DOM.viewSettings
    ];

    views.forEach(el => { 
        if(el) {
            el.style.display = 'none';
            el.classList.remove('view-animate-enter');
        }
    });

    if (DOM.mainFeedColumn) {
        DOM.mainFeedColumn.classList.remove('narrow-view');
        DOM.mainFeedColumn.style.removeProperty('display'); 
    }
    
    if (DOM.rightSidebar) {
        DOM.rightSidebar.classList.remove('mobile-active');
    }

    if (window.innerWidth > 1024 && DOM.rightSidebar) {
        DOM.rightSidebar.style.display = 'flex';
        DOM.rightSidebar.classList.remove('wide-view'); 
        DOM.rightSidebar.classList.remove('hidden-sidebar');
    }

    if(DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');
    if(DOM.rsCollections) DOM.rsCollections.classList.add('hidden');
    if(DOM.rsWalletView) DOM.rsWalletView.classList.add('hidden');
    if(DOM.rsSettingsView) DOM.rsSettingsView.classList.add('hidden');
    if(document.getElementById('rs-banking-view')) document.getElementById('rs-banking-view').classList.add('hidden');

    const msgContainer = document.getElementById('container-messages');
    if(msgContainer) msgContainer.style.display = (viewName === 'messages') ? 'block' : 'none';

    let targetView = null;

    if (viewName === 'home') {
        targetView = DOM.viewHome;
        if(DOM.rsSuggestions && window.innerWidth > 1024) DOM.rsSuggestions.classList.remove('hidden');
        updateActiveNav('nav-link-home', 'mob-nav-home');
    } 
    else if (viewName === 'notifications') {
        targetView = DOM.viewNotif;
        if(DOM.rsSuggestions && window.innerWidth > 1024) DOM.rsSuggestions.classList.remove('hidden');
        updateActiveNav('nav-link-notif', 'mob-nav-notif');
    }
    else if (viewName === 'messages') {
        targetView = DOM.viewMessages;
        if(DOM.rightSidebar) DOM.rightSidebar.classList.add('hidden-sidebar');
        if (DOM.viewMessages) DOM.viewMessages.style.display = 'flex'; 
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.style.display = 'flex';
        updateActiveNav('nav-link-messages', null);
        if(DOM.chatHistoryContainer && DOM.chatHistoryContainer.innerHTML.trim() === "") loadChat(1); 
    } 
    else if (viewName === 'profile') {
        targetView = DOM.viewMyProfile;
        if(DOM.rsSuggestions && window.innerWidth > 1024) DOM.rsSuggestions.classList.remove('hidden');
        updateActiveNav('nav-link-profile', null);
        
        // 🔥 SAFE CALL: RELOAD PROFILE CONTENT ON VIEW 🔥
        try {
            initProfilePage(); 
        } catch(err) {
            console.error("Error loading profile content:", err);
        }
    }
    else if (viewName === 'collections') {
        targetView = DOM.viewCollections;
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');
        if (DOM.rsCollections) DOM.rsCollections.classList.remove('hidden');
        updateActiveNav('nav-link-collections', 'mob-nav-collections'); 
        renderCollections(); 
    }

    else if (viewName === 'subscriptions') {
        targetView = viewSubscriptions;
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');
        if (DOM.rsSuggestions && window.innerWidth > 1024) DOM.rsSuggestions.classList.remove('hidden');
        updateActiveNav('nav-link-subs', null);
    }
    else if (viewName === 'settings') {
        targetView = DOM.viewSettings;
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');
        if (DOM.rsSettingsView) DOM.rsSettingsView.classList.remove('hidden'); 
        updateActiveNav(null, null); 
    }
    else if (viewName === 'add-card') {
        targetView = DOM.viewAddCard;
        if(DOM.rsWalletView) DOM.rsWalletView.classList.remove('hidden');
        updateActiveNav('nav-link-add-card', 'mob-nav-add-card');
    }
    else if (viewName === 'your-cards') {
        targetView = DOM.viewYourCards;
        if(DOM.rsWalletView) DOM.rsWalletView.classList.remove('hidden');
    }
    else if (viewName === 'become-creator') {
        targetView = DOM.viewBecomeCreator;
        const bankingSidebar = document.getElementById('rs-banking-view');
        if(bankingSidebar) bankingSidebar.classList.remove('hidden');
    }
    
    if (targetView) {
        if (viewName !== 'messages') targetView.style.display = 'block';
        if (window.innerWidth <= 1024) {
            requestAnimationFrame(() => {
                targetView.classList.add('view-animate-enter');
            });
        }
    }

    injectSidebarToggles();
}

function updateActiveNav(desktopId, mobileId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mob-nav-item').forEach(el => el.classList.remove('active'));

    if(desktopId) {
        const el = document.getElementById(desktopId);
        if(el) el.classList.add('active');
    }
    if(mobileId) {
        const el = document.getElementById(mobileId);
        if(el) el.classList.add('active');
    }
}

function injectSidebarToggles() {
    const headers = document.querySelectorAll('.feed-top-header');
    headers.forEach(header => {
        let iconContainer = header.querySelector('.tablet-header-icons');
        if (iconContainer) {
            let btn = iconContainer.querySelector('.header-toggle-btn');
            if (!btn) {
                btn = document.createElement('i');
                btn.className = 'fa-solid fa-bars header-toggle-btn';
                btn.style.cursor = 'pointer';
                iconContainer.appendChild(btn);
            }
        }
    });
}

function ensureFooterHTML() {
    const nav = document.querySelector('.mobile-bottom-nav');
    if (nav && nav.children.length === 0) {
        nav.innerHTML = `
            <div class="mob-nav-item active" id="mob-nav-home"><i class="fa-solid fa-house"></i></div>
            <div class="mob-nav-item" id="mob-nav-add-card"><i class="fa-regular fa-credit-card"></i></div>
            <div class="mob-nav-item" id="mob-nav-add"><div class="add-circle"><i class="fa-solid fa-plus"></i></div></div>
            <div class="mob-nav-item" id="mob-nav-collections"><i class="fa-regular fa-bookmark"></i></div>
            <div class="mob-nav-item" id="mob-nav-notif"><i class="fa-regular fa-bell"></i></div>
        `;
        setupNavigation();
    }
}

document.addEventListener('DOMContentLoaded', init);