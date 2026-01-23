import { DOM } from './dom.js';
import { COLLECTIONS_DB } from './data.js';
import { initHome } from './home.js';
import { initNotifications } from './notifications.js';
import { initMessages, loadChat } from './message.js';
import { initCollections, renderCollections, updateRightSidebarContent } from './collections.js';
import { initWallet } from './wallet.js';

const TopToast = Swal.mixin({
  toast: true, position: 'top', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#0d1423', color: '#fff',
  didOpen: (toast) => { toast.addEventListener('mouseenter', Swal.stopTimer); toast.addEventListener('mouseleave', Swal.resumeTimer); }
});

// --- INIT ---
async function init() {
  console.log("App Init...");
  
  // 1. CALL ALL INIT FUNCTIONS
  initHome(TopToast);
  initNotifications();
  initMessages(TopToast);
  initCollections(TopToast);
  initWallet(TopToast);

  // 2. Global Listeners (Popovers & Payments)
  if (DOM.btnSubscribe) DOM.btnSubscribe.onclick = () => DOM.paymentModal.classList.add('is-visible');
  if (DOM.btnPayCancel) DOM.btnPayCancel.onclick = () => DOM.paymentModal.classList.remove('is-visible');
  if (DOM.btnPayConfirm) DOM.btnPayConfirm.onclick = () => {
      DOM.btnPayConfirm.disabled = true; DOM.btnPayConfirm.textContent = 'Processing...';
      setTimeout(() => { TopToast.fire({ icon: 'success', title: 'Success!' }); DOM.paymentModal.classList.remove('is-visible'); DOM.btnPayConfirm.disabled = false; DOM.btnPayConfirm.textContent = 'Proceed'; }, 1000);
  };
  
  if (DOM.triggers.length > 0) DOM.triggers.forEach(t => { if(t) t.addEventListener('click', (e) => { e.stopPropagation(); DOM.popover.classList.toggle('is-open'); }); });
  if (DOM.closePopoverBtn) DOM.closePopoverBtn.addEventListener('click', () => DOM.popover.classList.remove('is-open'));
  document.addEventListener('click', (e) => {
    if (DOM.popover && DOM.popover.classList.contains('is-open') && !DOM.popover.contains(e.target) && !DOM.triggers.some(t => t && t.contains(e.target))) {
        DOM.popover.classList.remove('is-open');
    }
  });

  if (DOM.themeToggle) DOM.themeToggle.addEventListener('change', (e) => {
      if (e.target.checked) { document.body.classList.remove('tm-light'); document.body.classList.add('tm-dark'); }
      else { document.body.classList.remove('tm-dark'); document.body.classList.add('tm-light'); }
  });

  // --- PROFILE TABS LOGIC (NEW) ---
  if(DOM.profileTabPosts && DOM.profileTabMedia) {
      DOM.profileTabPosts.addEventListener('click', () => {
          DOM.profileTabPosts.style.borderBottomColor = 'var(--text)';
          DOM.profileTabPosts.style.color = 'var(--text)';
          DOM.profileTabMedia.style.borderBottomColor = 'transparent';
          DOM.profileTabMedia.style.color = 'var(--muted)';
          
          DOM.profileContentPosts.classList.remove('hidden');
          DOM.profileContentMedia.classList.add('hidden');
      });

      DOM.profileTabMedia.addEventListener('click', () => {
          DOM.profileTabMedia.style.borderBottomColor = 'var(--text)';
          DOM.profileTabMedia.style.color = 'var(--text)';
          DOM.profileTabPosts.style.borderBottomColor = 'transparent';
          DOM.profileTabPosts.style.color = 'var(--muted)';
          
          DOM.profileContentMedia.classList.remove('hidden');
          DOM.profileContentPosts.classList.add('hidden');
      });
  }

  // --- VIEW ROUTER (Handles Navigation) ---
  function switchView(viewName) {
    if (DOM.viewHome) DOM.viewHome.style.display = 'none';
    if (DOM.viewNotif) DOM.viewNotif.style.display = 'none';
    if (DOM.viewMessages) DOM.viewMessages.style.display = 'none';
    if (DOM.viewCollections) DOM.viewCollections.style.display = 'none';
    if (DOM.viewAddCard) DOM.viewAddCard.style.display = 'none';
    if (DOM.viewMyProfile) DOM.viewMyProfile.style.display = 'none'; // Reset Profile

    // Reset Active Classes
    [DOM.navHome, DOM.navNotif, DOM.navMessages, DOM.navCollections, DOM.navSubs, DOM.navAddCard, DOM.navProfile, DOM.mobHome, DOM.mobNotif, DOM.mobMessages].forEach(el => {
        if(el) { el.classList.remove('active'); const i = el.querySelector('i'); if(i && !i.classList.contains('fa-house') && !i.classList.contains('fa-user-group')) i.classList.replace('fa-solid', 'fa-regular'); }
    });

    // Reset Sidebars
    if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.remove('narrow-view');
    if (DOM.rightSidebar) { DOM.rightSidebar.classList.remove('wide-view'); DOM.rightSidebar.classList.remove('hidden-sidebar'); }

    if (viewName === 'messages') {
        if(DOM.rightSidebar) DOM.rightSidebar.classList.add('hidden-sidebar');
        if (DOM.viewMessages) DOM.viewMessages.style.display = 'block';
        setActive(DOM.navMessages); setActive(DOM.mobMessages);
        if(DOM.chatHistoryContainer && DOM.chatHistoryContainer.innerHTML.trim() === "") loadChat(1); 
    } 
    else if (viewName === 'collections') {
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');
        if(DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');
        if(DOM.rsWalletView) DOM.rsWalletView.classList.add('hidden');
        if(DOM.rsCollections) DOM.rsCollections.classList.remove('hidden');
        if (DOM.viewCollections) DOM.viewCollections.style.display = 'block';
        setActive(DOM.navCollections);
        renderCollections(); 
    }
    else if (viewName === 'home') {
        if(DOM.rsSuggestions) DOM.rsSuggestions.classList.remove('hidden');
        if(DOM.rsCollections) DOM.rsCollections.classList.add('hidden');
        if(DOM.rsWalletView) DOM.rsWalletView.classList.add('hidden');
        if (DOM.viewHome) DOM.viewHome.style.display = 'block';
        setActive(DOM.navHome); setActive(DOM.mobHome);
    } 
    else if (viewName === 'notifications') {
        if (DOM.viewNotif) DOM.viewNotif.style.display = 'block';
        setActive(DOM.navNotif); setActive(DOM.mobNotif);
    }
    else if (viewName === 'add-card') {
        if (DOM.viewAddCard) DOM.viewAddCard.style.display = 'block';
        setActive(DOM.navAddCard);
        if(DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');
        if(DOM.rsCollections) DOM.rsCollections.classList.add('hidden');
        if(DOM.rsWalletView) DOM.rsWalletView.classList.remove('hidden');
    }
    else if (viewName === 'profile') {
        if (DOM.viewMyProfile) DOM.viewMyProfile.style.display = 'block';
        setActive(DOM.navProfile);
        if(DOM.rsSuggestions) DOM.rsSuggestions.classList.remove('hidden'); // Show Standard Sidebar
        if(DOM.rsCollections) DOM.rsCollections.classList.add('hidden');
        if(DOM.rsWalletView) DOM.rsWalletView.classList.add('hidden');
    }
  }

  function setActive(el) { if(!el) return; el.classList.add('active'); const i = el.querySelector('i'); if(i) i.classList.replace('fa-regular', 'fa-solid'); }

  // --- NAVIGATION LISTENERS ---
  if (DOM.navHome) DOM.navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  if (DOM.navNotif) DOM.navNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
  if (DOM.navMessages) DOM.navMessages.addEventListener('click', (e) => { e.preventDefault(); switchView('messages'); });
  if (DOM.navCollections) DOM.navCollections.addEventListener('click', (e) => { e.preventDefault(); switchView('collections'); });
  if (DOM.navAddCard) DOM.navAddCard.addEventListener('click', (e) => { e.preventDefault(); switchView('add-card'); });
  if (DOM.navProfile) DOM.navProfile.addEventListener('click', (e) => { e.preventDefault(); switchView('profile'); });

  if (DOM.navSubs) {
      DOM.navSubs.addEventListener('click', (e) => {
          e.preventDefault(); switchView('collections'); 
          if(DOM.navCollections) { DOM.navCollections.classList.remove('active'); if(DOM.navCollections.querySelector('i')) DOM.navCollections.querySelector('i').classList.replace('fa-solid', 'fa-regular'); }
          setActive(DOM.navSubs);
          if(DOM.colTabUsers) DOM.colTabUsers.click();
          const followingCol = COLLECTIONS_DB.find(c => c.id === 'following');
          if(followingCol) updateRightSidebarContent(followingCol);
      });
  }
  
  if (DOM.mobHome) DOM.mobHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  if (DOM.mobNotif) DOM.mobNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
  if (DOM.mobMessages) DOM.mobMessages.addEventListener('click', (e) => { e.preventDefault(); switchView('messages'); });

  window.addEventListener('load', () => { if(DOM.appLoader) { DOM.appLoader.style.opacity = '0'; DOM.appLoader.style.visibility = 'hidden'; setTimeout(() => { if(DOM.appLoader.parentNode) DOM.appLoader.parentNode.removeChild(DOM.appLoader); }, 500); } });
}

document.addEventListener('DOMContentLoaded', init);