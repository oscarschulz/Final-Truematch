import * as TMAPI from './tm-api.js';

const DOM = {
  feed: document.getElementById('creator-feed'),
  btnSubscribe: document.getElementById('btnSubscribe'),
  paymentModal: document.getElementById('payment-modal'),
  btnPayConfirm: document.getElementById('btnPayConfirm'),
  btnPayCancel: document.getElementById('btnPayCancel'),
  
  // Views
  viewHome: document.getElementById('view-home'),
  viewNotif: document.getElementById('view-notifications'),

  // Navigation Links
  navHome: document.getElementById('nav-link-home'),
  navNotif: document.getElementById('nav-link-notif'),
  mobHome: document.getElementById('mob-nav-home'),
  mobNotif: document.getElementById('mob-nav-notif'),

  // Popover
  popover: document.getElementById('settings-popover'),
  closePopoverBtn: document.getElementById('btnClosePopover'),
  triggers: [
    document.getElementById('trigger-profile-card'),
    document.getElementById('trigger-more-btn')
  ],
  
  // Theme Toggle
  themeToggle: document.getElementById('themeToggle')
};

// --- Custom Toast (SweetAlert) ---
const TopToast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#0d1423',
  color: '#fff',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

function removeLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        setTimeout(() => {
            if(loader.parentNode) loader.parentNode.removeChild(loader);
        }, 500);
    }
}

window.addEventListener('load', () => setTimeout(removeLoader, 1000));
if (document.readyState === 'complete') { setTimeout(removeLoader, 500); }
setTimeout(removeLoader, 3000);


async function init() {
  if (DOM.btnSubscribe) DOM.btnSubscribe.onclick = openPaymentModal; 
  if (DOM.btnPayCancel) DOM.btnPayCancel.onclick = closePaymentModal;
  if (DOM.btnPayConfirm) DOM.btnPayConfirm.onclick = processPayment;

  if (DOM.triggers.length > 0) {
    DOM.triggers.forEach(t => {
      if(t) t.addEventListener('click', togglePopover);
    });
  }
  if (DOM.closePopoverBtn) DOM.closePopoverBtn.addEventListener('click', closePopover);
  
  document.addEventListener('click', (e) => {
    if (DOM.popover && DOM.popover.classList.contains('is-open')) {
      const isClickInside = DOM.popover.contains(e.target);
      const isClickTrigger = DOM.triggers.some(t => t && t.contains(e.target));
      if (!isClickInside && !isClickTrigger) {
        closePopover();
      }
    }
  });

  if (DOM.themeToggle) {
    DOM.themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.remove('tm-light');
            document.body.classList.add('tm-dark');
        } else {
            document.body.classList.remove('tm-dark');
            document.body.classList.add('tm-light');
        }
    });
  }

  // --- FIXED SWITCH VIEW LOGIC ---
  function switchView(viewName) {
    if (DOM.viewHome) DOM.viewHome.style.display = 'none';
    if (DOM.viewNotif) DOM.viewNotif.style.display = 'none';

    // Reset icons (Desktop & Mobile)
    [DOM.navHome, DOM.navNotif, DOM.mobHome, DOM.mobNotif].forEach(el => {
        if(el) {
            el.classList.remove('active');
            const icon = el.querySelector('i');
            // FIX: Huwag palitan ang icon kung 'fa-house' ito
            if (icon && !icon.classList.contains('fa-house')) {
                icon.classList.replace('fa-solid', 'fa-regular');
            }
        }
    });

    if (viewName === 'home') {
        if (DOM.viewHome) DOM.viewHome.style.display = 'block';
        if (DOM.navHome) setActive(DOM.navHome);
        if (DOM.mobHome) setActive(DOM.mobHome);
    } 
    else if (viewName === 'notifications') {
        if (DOM.viewNotif) DOM.viewNotif.style.display = 'block';
        if (DOM.navNotif) setActive(DOM.navNotif);
        if (DOM.mobNotif) setActive(DOM.mobNotif);
    }
  }

  function setActive(el) {
      el.classList.add('active');
      const icon = el.querySelector('i');
      if (icon) {
          // Keep fa-house logic safe, otherwise switch to solid
          icon.classList.replace('fa-regular', 'fa-solid');
      }
  }

  if (DOM.navHome) DOM.navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  if (DOM.navNotif) DOM.navNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
  if (DOM.mobHome) DOM.mobHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  if (DOM.mobNotif) DOM.mobNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });

  // Notification Tabs Click
  const notifPills = document.querySelectorAll('.n-pill');
  if (notifPills.length > 0) {
      notifPills.forEach(pill => {
          pill.addEventListener('click', function() {
              notifPills.forEach(p => p.classList.remove('active'));
              this.classList.add('active');
          });
      });
  }

  // Notification Settings Icon Click (Toast)
  const notifSettingsBtn = document.querySelector('.nh-right .fa-gear');
  if (notifSettingsBtn) {
      notifSettingsBtn.addEventListener('click', () => {
          TopToast.fire({
              icon: 'info',
              title: 'Settings available soon!'
          });
      });
  }

  if (DOM.feed) DOM.feed.hidden = false;
  
  try { await checkAccess(); } catch (e) { console.log(e); }
}

function togglePopover(e) {
  if (e) e.stopPropagation();
  if (DOM.popover) DOM.popover.classList.toggle('is-open');
}
function closePopover() {
  if (DOM.popover) DOM.popover.classList.remove('is-open');
}
function openPaymentModal() { if (DOM.paymentModal) DOM.paymentModal.classList.add('is-visible'); }
function closePaymentModal() { if (DOM.paymentModal) DOM.paymentModal.classList.remove('is-visible'); }

async function processPayment() {
  if (!DOM.btnPayConfirm) return;
  DOM.btnPayConfirm.disabled = true;
  DOM.btnPayConfirm.textContent = 'Processing...';
  
  setTimeout(() => {
    TopToast.fire({
      icon: 'success',
      title: 'Subscription Successful!'
    });
    closePaymentModal();
    DOM.btnPayConfirm.disabled = false;
    DOM.btnPayConfirm.textContent = 'Proceed';
  }, 1000);
}

async function checkAccess() {
    return new Promise(resolve => {
        setTimeout(() => { resolve(true); }, 500);
    });
}

document.addEventListener('DOMContentLoaded', init);