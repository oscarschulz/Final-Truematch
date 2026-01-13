// creators.js — Logic Updated for Icons & Dynamic Visuals + Animations

import { apiGet, apiPost } from './tm-api.js';

const DOM = {
  denied: document.getElementById('access-denied'),
  feed: document.getElementById('creator-feed'),
  feedContainer: document.getElementById('feed-container'),
  leftTrack: document.getElementById('leftScrollTrack'), // Target for icons
  btnBack: document.getElementById('btnBack'),
  btnSubscribe: document.getElementById('btnSubscribe'),
  paymentModal: document.getElementById('payment-modal'),
  btnPayConfirm: document.getElementById('btnPayConfirm'),
  btnPayCancel: document.getElementById('btnPayCancel')
};

const MOCK_POSTS = [
  { id: 1, author: 'Fit_Guru', avatar: 'assets/images/sample1.jpg', time: '2h ago', text: 'Morning stretch routine! 💪✨', image: 'assets/images/sample2.jpg', locked: false },
  { id: 2, author: 'Anna_Yoga', avatar: 'assets/images/sample2.jpg', time: '5h ago', text: 'Full 30-min workout routine (Uncut).', image: 'assets/images/sample3.jpg', locked: true, price: 5.00 },
  { id: 3, author: 'Sarah_K', avatar: 'assets/images/sample3.jpg', time: '1d ago', text: 'Healthy meal prep ideas 🥗', image: 'assets/images/sample4.jpg', locked: false }
];

async function init() {
  if (DOM.btnBack) DOM.btnBack.onclick = () => window.location.href = 'dashboard.html';
  if (DOM.btnSubscribe) DOM.btnSubscribe.onclick = openPaymentModal; 
  if (DOM.btnPayCancel) DOM.btnPayCancel.onclick = closePaymentModal;
  if (DOM.btnPayConfirm) DOM.btnPayConfirm.onclick = processPayment;

  await checkAccess();
}

async function checkAccess() {
  try {
    const res = await apiGet('/api/me');
    if (!res || !res.ok || !res.user || !res.user.email) {
      const next = encodeURIComponent(location.pathname + location.search);
      window.location.replace(`/auth.html?mode=login&next=${next}`);
      return;
    }

    if (res.user.hasCreatorAccess) {
      // IF UNLOCKED:
      if (DOM.feed) DOM.feed.hidden = false;
      if (DOM.denied) DOM.denied.hidden = true;
      
      // Trigger Icon Change on Left Side
      unlockVisuals();
      
      renderFeed(MOCK_POSTS);
    } else {
      // IF LOCKED:
      if (DOM.denied) DOM.denied.hidden = false;
      if (DOM.feed) DOM.feed.hidden = true;
    }
  } catch (err) {
    console.error(err);
    if (DOM.denied) DOM.denied.hidden = false;
  }
}

function unlockVisuals() {
  if (!DOM.leftTrack) return;
  // Find all lock icons
  const icons = DOM.leftTrack.querySelectorAll('.fa-lock');
  icons.forEach(icon => {
    // Replace Lock with Open Lock
    icon.classList.remove('fa-lock');
    icon.classList.add('fa-lock-open');
    
    // Add Glow to the container
    const parentBox = icon.closest('.icon-box');
    if (parentBox) {
      parentBox.classList.add('active');
    }
  });
}

function renderFeed(posts) {
  if (!DOM.feedContainer) return;
  DOM.feedContainer.innerHTML = '';

  posts.forEach((post, index) => {
    const article = document.createElement('article');
    article.className = 'post-card';
    
    // --- ANIMATION INJECTION ---
    // Make posts invisible initially, then fade them up one by one
    article.style.opacity = '0';
    article.style.animation = `contentFadeUp 0.6s ease-out ${index * 0.15}s forwards`;
    // ---------------------------
    
    let mediaContent = '';
    if (post.locked) {
      mediaContent = `
        <div class="locked-container">
          <div class="locked-overlay">
            <span style="font-size:24px; margin-bottom:10px;">🔒</span>
            <button class="btn btn-primary" style="width: auto; padding: 5px 15px; font-size: 0.8rem;" onclick="alert('Unlock feature coming soon!')">Unlock for $${post.price.toFixed(2)}</button>
          </div>
          <img src="${post.image}" class="post-img locked-blur" onerror="this.src='assets/images/truematch-mark.png'">
        </div>
      `;
    } else {
      mediaContent = `<img src="${post.image}" class="post-img" onerror="this.src='assets/images/truematch-mark.png'">`;
    }

    article.innerHTML = `
      <div class="post-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${post.avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" onerror="this.src='assets/images/truematch-mark.png'">
          <div>
            <strong style="display:block; color:#fff;">@${post.author}</strong>
            <div class="tiny muted" style="font-size:0.75rem;">${post.time}</div>
          </div>
        </div>
      </div>
      <p style="margin: 12px 0; color: #eee;">${post.text}</p>
      ${mediaContent}
      <div class="post-actions" style="margin-top:16px; display:flex; gap:16px; font-size:1.2rem; opacity:0.7;">
        <i class="fa-regular fa-heart" style="cursor:pointer;"></i>
        <i class="fa-regular fa-comment" style="cursor:pointer;"></i>
      </div>
    `;
    DOM.feedContainer.appendChild(article);
  });
}

function openPaymentModal() {
  if (DOM.paymentModal) DOM.paymentModal.classList.add('is-visible');
}

function closePaymentModal() {
  if (DOM.paymentModal) DOM.paymentModal.classList.remove('is-visible');
}

async function processPayment() {
  if (!DOM.btnPayConfirm) return;
  DOM.btnPayConfirm.disabled = true;
  DOM.btnPayConfirm.textContent = 'Processing...';

  try {
    const res = await apiPost('/api/coinbase/create-charge', { planKey: 'creator_access' });
    if (res.ok && res.url) {
      window.location.href = res.url;
    } else {
      alert(res.message || "Payment initialization failed.");
      closePaymentModal();
    }
  } catch (e) {
    console.error(e);
    alert("Network error. Please try again.");
    closePaymentModal();
  } finally {
    DOM.btnPayConfirm.disabled = false;
    DOM.btnPayConfirm.textContent = 'Proceed';
  }
}

document.addEventListener('DOMContentLoaded', init);