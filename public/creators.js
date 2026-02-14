// Remove import if causing issues, assume global context or simple script
const TMAPI = {}; 

// Default avatar constant for better handling
const DEFAULT_AVATAR = 'assets/images/truematch-mark.png';

// Blank Image for Grid
const BLANK_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20fill%3D%22%2311141c%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2280%22%20r%3D%2235%22%20fill%3D%22%2320293a%22%2F%3E%3Cpath%20d%3D%22M35%20180c10-35%2030-55%2065-55s55%2020%2065%2055%22%20fill%3D%22%2320293a%22%2F%3E%3C%2Fsvg%3E";
// ============================================================
// Current user identity (Creator Application -> Name + Handle)
// We read the logged-in user via /api/me (cookie session) and
// hydrate the Creators UI placeholders ("Your Name", "@username").
// ============================================================
async function apiGet(path) {
  try {
    const res = await fetch(path, { method: 'GET', credentials: 'include' });
    const data = await res.json().catch(() => null);
    return data;
  } catch (e) {
    return null;
  }
}

function normalizeHandle(handle) {
  const raw = (handle || '').toString().trim();
  if (!raw) return '';
  return raw.startsWith('@') ? raw : `@${raw}`;
}

function extractPackedField(packed, label) {
  // packed example: "Display name: Aries | Location: ..."
  if (!packed) return '';
  const str = String(packed);
  const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ":\\s*([^|]+)", 'i');
  const m = str.match(re);
  return m ? String(m[1]).trim() : '';
}

function setNameWithCheckIcon(containerEl, name) {
  if (!containerEl) return;
  const icon = containerEl.querySelector('i');
  const iconClone = icon ? icon.cloneNode(true) : null;

  // If markup uses an inner span, prefer updating that.
  const span = containerEl.querySelector('#creatorProfileName, #creatorHeaderName, #creatorPopoverName');
  if (span) {
    span.textContent = name || span.textContent;
    return;
  }

  // Fallback: overwrite text while preserving the check icon.
  containerEl.textContent = (name || '').toString();
  if (iconClone) {
    containerEl.appendChild(document.createTextNode(' '));
    containerEl.appendChild(iconClone);
  }
}

function setText(el, value) {
  if (!el) return;
  el.textContent = value;
}

async function hydrateCreatorIdentity() {
  const me = await apiGet('/api/me');
  if (!me || !me.ok || !me.user) return;

  const user = me.user || {};
  const app = user.creatorApplication || null;

  // Determine name + handle (prefer creator application values)
  const fallbackName = (user.name || '').toString().trim() || 'User';
  const fallbackHandle = normalizeHandle(user.username || user.handle || (user.email ? user.email.split('@')[0] : ''));

  let name = fallbackName;
  let handle = fallbackHandle;

  if (app) {
    // handle is explicit
    if (app.handle) handle = normalizeHandle(app.handle);

    // display name is packed into contentStyle by dashboard.js
    const packedName = extractPackedField(app.contentStyle, 'Display name');
    if (packedName) name = packedName;
  }

  // Targets across the page
  const nameTargets = [
    document.getElementById('creatorProfileName'),
    document.getElementById('creatorHeaderName'),
    document.getElementById('creatorPopoverName'),
    document.querySelector('.ph-name') // fallback for older markup
  ].filter(Boolean);

  const handleTargets = [
    document.getElementById('creatorProfileHandle'),
    document.getElementById('creatorHeaderHandle'),
    document.getElementById('creatorPopoverHandle'),
    document.querySelector('.ph-handle') // fallback for older markup
  ].filter(Boolean);

  nameTargets.forEach(el => {
    // If it's a span, just set text; if it's container with icon, preserve icon.
    if (el.tagName && el.tagName.toLowerCase() === 'span') {
      el.textContent = name;
    } else {
      setNameWithCheckIcon(el, name);
    }
  });

  handleTargets.forEach(el => setText(el, handle));
}


const DOM = {
  feed: document.getElementById('creator-feed'),
  btnSubscribe: document.getElementById('btnSubscribe'),
  paymentModal: document.getElementById('payment-modal'),
  btnPayConfirm: document.getElementById('btnPayConfirm'),
  btnPayCancel: document.getElementById('btnPayCancel'),
  
  viewHome: document.getElementById('view-home'),
  viewNotif: document.getElementById('view-notifications'),
  viewMessages: document.getElementById('view-messages'),
  viewCollections: document.getElementById('view-collections'),
    viewSubscriptions: document.getElementById('view-subscriptions'),

    subsSearchBtn: document.getElementById('subs-btn-search'),
    subsSearchRow: document.getElementById('subs-search-row'),
    subsSearchInput: document.getElementById('subs-search-input'),
    subsSearchClear: document.getElementById('subs-search-clear'),

    subsTabs: [...document.querySelectorAll('[data-subs-tab]')],
    subsFilterBtns: [...document.querySelectorAll('[data-subs-filter]')],

    subsList: document.getElementById('subs-list'),
    subsEmpty: document.getElementById('subs-empty'),
    subsLoading: document.getElementById('subs-loading'),

    subsCountTo: document.getElementById('subs-count-to'),
    subsCountFrom: document.getElementById('subs-count-from'),
    subsCountActive: document.getElementById('subs-count-active'),
    subsCountExpired: document.getElementById('subs-count-expired'),
    subsCountAll: document.getElementById('subs-count-all'),
  
  // Need to reference Main Column for dynamic resizing
  mainFeedColumn: document.querySelector('.main-feed-column'),

  rightSidebar: document.getElementById('right-sidebar'),
  rsSuggestions: document.getElementById('rs-suggestions-view'),
  rsCollections: document.getElementById('rs-collections-view'),

  navHome: document.getElementById('nav-link-home'),
  navNotif: document.getElementById('nav-link-notif'),
  navMessages: document.getElementById('nav-link-messages'),
  navCollections: document.getElementById('nav-link-collections'),
  navSubs: document.getElementById('nav-link-subs'), // ID for Subscriptions

  mobHome: document.getElementById('mob-nav-home'),
  mobNotif: document.getElementById('mob-nav-notif'),
  mobMessages: document.getElementById('mob-nav-messages'),

  popover: document.getElementById('settings-popover'),
  closePopoverBtn: document.getElementById('btnClosePopover'),
  triggers: [
    document.getElementById('trigger-profile-card'),
    document.getElementById('trigger-more-btn')
  ],
  
  themeToggle: document.getElementById('themeToggle'),
  composeActions: document.querySelector('.compose-actions'),
  mediaUploadInput: document.getElementById('media-upload-input'),
  
  pollUI: document.getElementById('poll-creator-ui'),
  textTools: document.getElementById('text-format-toolbar'),
  closePollBtn: document.querySelector('.close-poll-btn'),

  // MESSAGES SPECIFIC
  btnNewMsg: document.getElementById('btn-new-msg'),
  
  // Sidebar Search
  btnTriggerSearch: document.getElementById('trigger-msg-search'),
  btnCloseSearch: document.getElementById('close-msg-search'),
  msgSearchBox: document.getElementById('msg-search-box'),
  msgSearchInput: document.getElementById('msg-search-input'),
  msgTabs: document.querySelectorAll('#msg-tabs span'),
  msgUserItems: document.querySelectorAll('.msg-user-item'),
  
  // Active Chat Elements
  activeChatAvatar: document.getElementById('active-chat-avatar'),
  activeChatName: document.getElementById('active-chat-name'),
  chatHistoryContainer: document.getElementById('chat-history-container'),
  
  // Info Panel Elements
  infoNickname: document.getElementById('info-nickname'),
  infoHandle: document.getElementById('info-handle'),
  infoJoined: document.getElementById('info-joined'),
  infoSpent: document.getElementById('info-spent'),

  // Chat Area Interactions
  btnEmoji: document.getElementById('btn-emoji-trigger'),
  emojiContainer: document.getElementById('emoji-picker-container'),
  btnPPV: document.getElementById('btn-ppv-trigger'),
  chatInput: document.getElementById('chat-message-input'),
  btnSendMsg: document.getElementById('btn-send-message'),
  
  // Chat Header Icons
  btnChatSearch: document.getElementById('btn-chat-search'),
  chatSearchBar: document.getElementById('chat-inner-search-bar'),
  closeChatSearch: document.getElementById('close-chat-search'),
  chatSearchInput: document.getElementById('chat-history-search'),
  btnChatStar: document.getElementById('btn-chat-star')
};

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

// --- MOCK CHAT DATA ---
const CHAT_DATA = {
    1: [ // User ID 1: Bauds Dev
        { text: "Hello! How is the new design coming along?", type: "received", time: "10:30 AM" },
        { text: "It looks exactly like the reference!", type: "sent", time: "10:32 AM" },
        { text: "Perfect. Can you add the subscriber info panel on the right?", type: "received", time: "10:33 AM" },
        { text: "Working on it right now.", type: "sent", time: "10:34 AM" }
    ],
    2: [ // User ID 2: Sarah Fit
        { text: "Hey! Love the new workout plan.", type: "received", time: "Yesterday" },
        { text: "Thanks Sarah! Let me know if you need tweaks.", type: "sent", time: "Yesterday" },
        { text: "Thanks for subscribing! 😘", type: "received", time: "2h ago" }
    ],
    3: [ // User ID 3: OnlyFans Support
        { text: "Welcome to iTRUEMATCH! Please verify your ID.", type: "received", time: "1d ago" }
    ],
    4: [ // User ID 4: Whale Spender
        { text: "Sent you a $500 tip! 💸", type: "received", time: "5m ago" },
        { text: "OMG Thank you so much!! ❤️", type: "sent", time: "4m ago" }
    ]
};

// --- NEW HELPER FUNCTION FOR RENDERING MESSAGES (XSS SAFE) ---
function renderMessage(text, type, time) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${type}`; // 'sent' or 'received'
    
    // Create text element using textContent to prevent XSS
    const p = document.createElement('p');
    p.textContent = text;
    
    const span = document.createElement('span');
    span.className = 'time';
    span.textContent = time;
    
    div.appendChild(p);
    div.appendChild(span);
    
    return div;
}

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
  // Hydrate name/username from Creator Application
  hydrateCreatorIdentity();

  // Global Event Listeners
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

  // ============================================
  // VIEW SWITCHING LOGIC (UPDATED FOR ADAPTIVE LAYOUT)
  // ============================================
  function switchView(viewName) {
    // 1. Reset Main Views
    if (DOM.viewHome) DOM.viewHome.style.display = 'none';
    if (DOM.viewNotif) DOM.viewNotif.style.display = 'none';
    if (DOM.viewMessages) DOM.viewMessages.style.display = 'none';
    if (DOM.viewCollections) DOM.viewCollections.style.display = 'none';
    if (DOM.viewSubscriptions) DOM.viewSubscriptions.style.display = 'none';

    // 2. Reset Layout Classes (Standardize first)
    if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.remove('narrow-view');
    if (DOM.rightSidebar) DOM.rightSidebar.classList.remove('wide-view');
    if (DOM.rightSidebar) DOM.rightSidebar.classList.remove('hidden-sidebar');

    // 3. Reset Nav Active States
    [DOM.navHome, DOM.navNotif, DOM.navMessages, DOM.navCollections, DOM.navSubs, DOM.mobHome, DOM.mobNotif, DOM.mobMessages].forEach(el => {
        if(el) {
            el.classList.remove('active');
            const icon = el.querySelector('i');
            
            // FIX: Added !icon.classList.contains('fa-user-group') to prevent Subscriptions icon from breaking
            if (icon && !icon.classList.contains('fa-house') && !icon.classList.contains('fa-user-group')) {
                icon.classList.replace('fa-solid', 'fa-regular');
            }
        }
    });

    // 4. Handle Specific Views
    if (viewName === 'messages') {
        if(DOM.rightSidebar) DOM.rightSidebar.classList.add('hidden-sidebar');
        if (DOM.viewMessages) DOM.viewMessages.style.display = 'block';
        if (DOM.navMessages) setActive(DOM.navMessages);
        if (DOM.mobMessages) setActive(DOM.mobMessages);
        
        if(DOM.chatHistoryContainer && DOM.chatHistoryContainer.innerHTML.trim() === "") {
             loadChat(1); 
        }
    } 
    else if (viewName === 'collections') {
        // *** APPLY ADAPTIVE LAYOUT FOR COLLECTIONS ***
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');

        // Swap Content
        if(DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');
        if(DOM.rsCollections) DOM.rsCollections.classList.remove('hidden');

        if (DOM.viewCollections) DOM.viewCollections.style.display = 'block';
        if (DOM.navCollections) setActive(DOM.navCollections);
        
        // Initial Render
        renderCollections();
    }
    else if (viewName === 'subscriptions') {
        // *** APPLY ADAPTIVE LAYOUT FOR SUBSCRIPTIONS ***
        if (DOM.mainFeedColumn) DOM.mainFeedColumn.classList.add('narrow-view');
        if (DOM.rightSidebar) DOM.rightSidebar.classList.add('wide-view');

        // Sidebar: keep suggestions
        if(DOM.rsSuggestions) DOM.rsSuggestions.classList.remove('hidden');
        if(DOM.rsCollections) DOM.rsCollections.classList.add('hidden');

        if (DOM.viewSubscriptions) DOM.viewSubscriptions.style.display = 'block';
        if (DOM.navSubs) setActive(DOM.navSubs);

        loadSubscriptionsView(true);
    }
    else if (viewName === 'home') {
        // Reset Right Sidebar to Suggestions
        if(DOM.rsSuggestions) DOM.rsSuggestions.classList.remove('hidden');
        if(DOM.rsCollections) DOM.rsCollections.classList.add('hidden');

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
          icon.classList.replace('fa-regular', 'fa-solid');
      }
  }

  // --- NAV LISTENERS ---
  if (DOM.navHome) DOM.navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  if (DOM.navNotif) DOM.navNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
  if (DOM.navMessages) DOM.navMessages.addEventListener('click', (e) => { e.preventDefault(); switchView('messages'); });
  if (DOM.navCollections) DOM.navCollections.addEventListener('click', (e) => { e.preventDefault(); switchView('collections'); });
  
  // Subscriptions Link Behavior (Option 2)
  if (DOM.navSubs) {
      DOM.navSubs.addEventListener('click', () => {
          switchView('subscriptions');
          loadSubscriptionsView(true);
      });
  }

  if (DOM.mobHome) DOM.mobHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  if (DOM.mobNotif) DOM.mobNotif.addEventListener('click', (e) => { e.preventDefault(); switchView('notifications'); });
  if (DOM.mobMessages) DOM.mobMessages.addEventListener('click', (e) => { e.preventDefault(); switchView('messages'); });


  // -------------
  // Subscriptions logic (Option 2: Subscribed To + Subscribers) — real data only
  const SUBS_STATE = {
    tab: 'subscribed',   // 'subscribed' | 'subscribers'
    filter: 'active',    // 'active' | 'expired' | 'all'
    q: '',
    loaded: false,
    loading: false,
    data: { subscribed: [], subscribers: [] }
  };

  function setSubsTab(tab) {
    SUBS_STATE.tab = tab;
    (DOM.subsTabs || []).forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subs-tab') === tab);
    });
    renderSubscriptions();
  }

  function setSubsFilter(filter) {
    SUBS_STATE.filter = filter;
    (DOM.subsFilterBtns || []).forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subs-filter') === filter);
    });
    renderSubscriptions();
  }

  function showSubsLoading(show) {
    SUBS_STATE.loading = !!show;
    if (DOM.subsLoading) DOM.subsLoading.classList.toggle('show', !!show);
  }

  function showSubsEmpty(show) {
    if (DOM.subsEmpty) DOM.subsEmpty.classList.toggle('show', !!show);
  }

  function toggleSubsSearch(forceOpen = null) {
    if (!DOM.subsSearchRow) return;
    const willOpen = (forceOpen === null) ? DOM.subsSearchRow.classList.contains('hidden') : !!forceOpen;
    DOM.subsSearchRow.classList.toggle('hidden', !willOpen);
    if (willOpen && DOM.subsSearchInput) DOM.subsSearchInput.focus();
    if (!willOpen) {
      SUBS_STATE.q = '';
      if (DOM.subsSearchInput) DOM.subsSearchInput.value = '';
      renderSubscriptions();
    }
  }

  function parseDateMaybe(v) {
    if (!v) return null;
    try {
      if (typeof v === 'number') {
        const ms = (v < 2_000_000_000) ? v * 1000 : v;
        return new Date(ms);
      }
      if (typeof v === 'string') {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof v === 'object' && v.seconds) return new Date(v.seconds * 1000);
      return null;
    } catch { return null; }
  }

  function normalizeSubItem(item) {
    if (!item) return null;

    if (typeof item === 'string') {
      const raw = item.trim();
      const handle = raw.startsWith('@') ? raw : ('@' + raw.replace(/^@/, ''));
      return {
        id: raw,
        name: raw.replace(/^@/, ''),
        handle,
        avatar: '',
        status: 'active',
        startedAt: null,
        endsAt: null,
        plan: ''
      };
    }

    const other = (item.otherUser && typeof item.otherUser === 'object') ? item.otherUser : null;

    const name =
      item.name ||
      item.displayName ||
      item.fullName ||
      (other && (other.name || other.displayName || other.fullName)) ||
      item.username ||
      item.handle ||
      (other && (other.username || other.handle)) ||
      'Unknown';

    const handleRaw =
      item.handle ||
      item.username ||
      item.userHandle ||
      item.slug ||
      (other && (other.handle || other.username || other.userHandle || other.slug)) ||
      '';

    const handle = handleRaw ? (handleRaw.startsWith('@') ? handleRaw : ('@' + handleRaw)) : '';

    const avatar =
      item.avatar ||
      item.photoURL ||
      item.photo ||
      item.profilePhoto ||
      item.profilePicture ||
      item.image ||
      (other && (other.avatar || other.photoURL || other.photo || other.profilePhoto || other.profilePicture || other.image)) ||
      '';

    const plan = item.plan || item.tier || item.package || item.subscriptionPlan || (other && (other.plan || other.tier || other.package)) || '';

    const startedAt = parseDateMaybe(item.startedAt || item.startAt || item.subscribedAt || item.createdAt || item.startDate);
    const endsAt = parseDateMaybe(item.endsAt || item.endAt || item.expiresAt || item.expiry || item.endDate);

    let statusRaw = (item.status || item.state || item.subscriptionStatus || '').toString().toLowerCase();
    if (!statusRaw) statusRaw = (item.active === false ? 'expired' : 'active');

    let status = (statusRaw.includes('exp') || statusRaw.includes('end')) ? 'expired' : 'active';
    if (endsAt && endsAt.getTime() < Date.now()) status = 'expired';

    return {
      id: item.id || item.uid || item.userId || item.email || item.handle || name,
      name,
      handle,
      avatar,
      status,
      startedAt,
      endsAt,
      plan
    };
  }

  function fmtDate(d) {
    if (!d) return '';
    try {
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    } catch { return ''; }
  }

  function buildMetaLine(sub) {
    const parts = [];
    if (sub.plan) parts.push(sub.plan);
    if (sub.startedAt) parts.push('Since ' + fmtDate(sub.startedAt));
    if (sub.endsAt) parts.push((sub.status === 'active' ? 'Ends ' : 'Ended ') + fmtDate(sub.endsAt));
    return parts.join(' • ');
  }

  async function apiGetJson(url) {
    const res = await fetch(url, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' } });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { ok: res.ok, status: res.status, json };
  }

  async function fetchSubscriptions() {
    const r1 = await apiGetJson('/api/me/subscriptions');
    if (r1.ok && r1.json) {
      const j = r1.json;

      // server.js returns objects like:
      // { subscribed: { items: [...], counts: {...} }, subscribers: { items: [...], counts: {...} } }
      const subscribedRaw = j.subscribed || j.subscribedTo || j.to || j.following || [];
      const subscribersRaw = j.subscribers || j.from || j.fans || [];

      const subscribedArr = Array.isArray(subscribedRaw)
        ? subscribedRaw
        : (subscribedRaw && Array.isArray(subscribedRaw.items) ? subscribedRaw.items : []);

      const subscribersArr = Array.isArray(subscribersRaw)
        ? subscribersRaw
        : (subscribersRaw && Array.isArray(subscribersRaw.items) ? subscribersRaw.items : []);

      return {
        subscribed: subscribedArr.map(normalizeSubItem).filter(Boolean),
        subscribers: subscribersArr.map(normalizeSubItem).filter(Boolean)
      };
    }

    const r2 = await apiGetJson('/api/me');
    if (r2.ok && r2.json) {
      const u = r2.json.user || r2.json.me || r2.json;
      const s = u.subscriptions || u.subs || {};

      const subscribedRaw = s.subscribed || s.subscribedTo || u.subscribed || u.subscribedTo || [];
      const subscribersRaw = s.subscribers || u.subscribers || [];

      const subscribedArr = Array.isArray(subscribedRaw)
        ? subscribedRaw
        : (subscribedRaw && Array.isArray(subscribedRaw.items) ? subscribedRaw.items : []);

      const subscribersArr = Array.isArray(subscribersRaw)
        ? subscribersRaw
        : (subscribersRaw && Array.isArray(subscribersRaw.items) ? subscribersRaw.items : []);

      return {
        subscribed: subscribedArr.map(normalizeSubItem).filter(Boolean),
        subscribers: subscribersArr.map(normalizeSubItem).filter(Boolean)
      };
    }

    return { subscribed: [], subscribers: [] };
  }

  function renderSubscriptions() {
    if (!DOM.viewSubscriptions || !DOM.subsList) return;

    const listAll = (SUBS_STATE.tab === 'subscribers') ? SUBS_STATE.data.subscribers : SUBS_STATE.data.subscribed;

    const activeCount = listAll.filter(x => x.status === 'active').length;
    const expiredCount = listAll.filter(x => x.status === 'expired').length;

    if (DOM.subsCountTo) DOM.subsCountTo.textContent = SUBS_STATE.data.subscribed.length;
    if (DOM.subsCountFrom) DOM.subsCountFrom.textContent = SUBS_STATE.data.subscribers.length;

    if (DOM.subsCountActive) DOM.subsCountActive.textContent = activeCount;
    if (DOM.subsCountExpired) DOM.subsCountExpired.textContent = expiredCount;
    if (DOM.subsCountAll) DOM.subsCountAll.textContent = listAll.length;

    const q = (SUBS_STATE.q || '').trim().toLowerCase();
    let list = listAll.slice();

    if (SUBS_STATE.filter !== 'all') list = list.filter(x => x.status === SUBS_STATE.filter);
    if (q) {
      list = list.filter(x =>
        (x.name || '').toLowerCase().includes(q) ||
        (x.handle || '').toLowerCase().includes(q) ||
        (x.id || '').toLowerCase().includes(q)
      );
    }

    DOM.subsList.innerHTML = '';

    if (SUBS_STATE.loading) {
      showSubsEmpty(false);
      return;
    }

    if (!list.length) {
      showSubsEmpty(true);
      return;
    }

    showSubsEmpty(false);

    list.forEach(sub => {
      const row = document.createElement('div');
      row.className = 'subs-user';

      const left = document.createElement('div');
      left.className = 'left';

      const img = document.createElement('img');
      img.alt = sub.name || 'User';
      img.src = sub.avatar || DEFAULT_AVATAR;
      img.onerror = () => { img.src = DEFAULT_AVATAR; };

      const meta = document.createElement('div');
      meta.className = 'meta';

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = sub.name || 'Unknown';

      const handle = document.createElement('div');
      handle.className = 'handle';
      handle.textContent = sub.handle || '';

      meta.appendChild(name);
      meta.appendChild(handle);

      left.appendChild(img);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.className = 'right';

      const mini = document.createElement('div');
      mini.className = 'subs-mini';
      mini.textContent = buildMetaLine(sub);

      const badge = document.createElement('div');
      badge.className = 'subs-badge ' + (sub.status === 'active' ? 'active' : 'expired');
      badge.textContent = sub.status === 'active' ? 'ACTIVE' : 'EXPIRED';

      right.appendChild(mini);
      right.appendChild(badge);

      row.appendChild(left);
      row.appendChild(right);

      row.addEventListener('click', () => {
        const metaLine = buildMetaLine(sub);
        Swal.fire({
          title: sub.name || 'Subscription',
          html: `<div style="color:#b9c1c6; font-size:13px; margin-top:6px;">
                  <div>${sub.handle ? sub.handle : ''}</div>
                  <div style="margin-top:8px;">${metaLine ? metaLine : ''}</div>
                  <div style="margin-top:10px; font-weight:800; color:${sub.status === 'active' ? 'var(--accent)' : '#ff6384'};">
                    ${sub.status.toUpperCase()}
                  </div>
                </div>`,
          background: '#0b0f14',
          color: '#fff',
          showCancelButton: true,
          confirmButtonText: 'Copy handle',
          cancelButtonText: 'Close'
        }).then(r => {
          if (r.isConfirmed && sub.handle) {
            navigator.clipboard.writeText(sub.handle).then(() => toast('Copied!')).catch(() => toast('Copy failed'));
          }
        });
      });

      DOM.subsList.appendChild(row);
    });
  }

  async function loadSubscriptionsView(force = false) {
    if (!DOM.viewSubscriptions) return;

    if (SUBS_STATE.loaded && !force) {
      renderSubscriptions();
      return;
    }

    showSubsLoading(true);
    showSubsEmpty(false);

    try {
      const data = await fetchSubscriptions();
      SUBS_STATE.data = data;
      SUBS_STATE.loaded = true;

      // UX: if default filter is "active" but there are only expired items, show "All"
      try {
        const baseList = (SUBS_STATE.tab === 'subscribers') ? (data.subscribers || []) : (data.subscribed || []);
        const active = baseList.filter(x => x && x.status === 'active').length;
        const expired = baseList.filter(x => x && x.status === 'expired').length;
        if (SUBS_STATE.filter === 'active' && active === 0 && (active + expired) > 0) {
          setSubsFilter('all');
          return; // setSubsFilter() already renders
        }
      } catch {}
      renderSubscriptions();
    } catch (e) {
      console.error('Subscriptions load failed:', e);
      SUBS_STATE.data = { subscribed: [], subscribers: [] };
      SUBS_STATE.loaded = true;
      renderSubscriptions();
    } finally {
      showSubsLoading(false);
    }
  }

  // Subscriptions UI events
  (DOM.subsTabs || []).forEach(btn => {
    btn.addEventListener('click', () => setSubsTab(btn.getAttribute('data-subs-tab')));
  });

  (DOM.subsFilterBtns || []).forEach(btn => {
    btn.addEventListener('click', () => setSubsFilter(btn.getAttribute('data-subs-filter')));
  });

  if (DOM.subsSearchBtn) DOM.subsSearchBtn.addEventListener('click', () => toggleSubsSearch());
  if (DOM.subsSearchClear) DOM.subsSearchClear.addEventListener('click', () => {
    SUBS_STATE.q = '';
    if (DOM.subsSearchInput) DOM.subsSearchInput.value = '';
    renderSubscriptions();
    if (DOM.subsSearchInput) DOM.subsSearchInput.focus();
  });

  if (DOM.subsSearchInput) {
    DOM.subsSearchInput.addEventListener('input', (e) => {
      SUBS_STATE.q = e.target.value || '';
      renderSubscriptions();
    });
    DOM.subsSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleSubsSearch(false);
    });
  }

  // ============================================
  // GLOBAL INTERACTIONS
  // ============================================
  document.addEventListener('click', (e) => {
      
      // 1. Handle Like Button
      if (e.target.classList.contains('fa-heart')) {
          if (e.target.classList.contains('fa-regular')) {
              e.target.classList.replace('fa-regular', 'fa-solid');
              e.target.style.color = '#ff4757'; // Red heart
              e.target.style.transform = 'scale(1.2)';
              setTimeout(() => e.target.style.transform = 'scale(1)', 200);
          } else {
              e.target.classList.replace('fa-solid', 'fa-regular');
              e.target.style.color = ''; // Reset color
          }
      }

      // 2. Handle Comment Toggle
      if (e.target.classList.contains('btn-toggle-comment') || e.target.classList.contains('fa-comment')) {
          const postCard = e.target.closest('.post-card');
          if (postCard) {
              const commentSection = postCard.querySelector('.post-comments-section');
              if (commentSection) {
                  commentSection.classList.toggle('hidden');
              }
          }
      }

      // 3. Handle Bookmark Button
      if (e.target.classList.contains('fa-bookmark')) {
          if (e.target.classList.contains('fa-regular')) {
              e.target.classList.replace('fa-regular', 'fa-solid');
              e.target.style.color = '#64E9EE'; // Cyan bookmark
              TopToast.fire({ icon: 'success', title: 'Saved to Collections' });
          } else {
              e.target.classList.replace('fa-solid', 'fa-regular');
              e.target.style.color = '';
          }
      }

      // 4. Handle FEED TIP BUTTON ($)
      if (e.target.classList.contains('fa-dollar-sign') && e.target.closest('.post-actions')) {
          Swal.fire({
              title: 'Send Tip',
              text: 'Support this creator!',
              input: 'number',
              inputLabel: 'Amount ($)',
              inputPlaceholder: '5.00',
              showCancelButton: true,
              confirmButtonText: 'Send Tip',
              confirmButtonColor: '#64E9EE',
              background: '#0d1423',
              color: '#fff'
          }).then((result) => {
              if (result.isConfirmed && result.value) {
                  TopToast.fire({ icon: 'success', title: `Sent $${result.value} tip!` });
              }
          });
      }
  });

  // Notif Tabs
  const notifPills = document.querySelectorAll('.notif-tabs-bar .n-pill');
  if (notifPills.length > 0) {
      notifPills.forEach(pill => {
          pill.addEventListener('click', () => {
              notifPills.forEach(p => p.classList.remove('active'));
              pill.classList.add('active');
          });
      });
  }

  // Compose Area
  if (DOM.composeActions) {
      DOM.composeActions.addEventListener('click', (e) => {
          const target = e.target;
          if (target.classList.contains('fa-image')) {
              if (DOM.mediaUploadInput) DOM.mediaUploadInput.click();
          }
          else if (target.classList.contains('fa-square-poll-horizontal') || target.id === 'btn-trigger-poll') {
              if(DOM.pollUI) DOM.pollUI.classList.toggle('hidden');
          }
          else if (target.id === 'btn-trigger-text' || target.innerText === 'Aa') {
              if(DOM.textTools) DOM.textTools.classList.toggle('hidden');
          }
      });
  }
  if (DOM.closePollBtn) {
      DOM.closePollBtn.addEventListener('click', () => {
          if(DOM.pollUI) DOM.pollUI.classList.add('hidden');
      });
  }

  // --- MESSAGING LOGIC ---
  if(DOM.btnNewMsg) {
      DOM.btnNewMsg.addEventListener('click', () => {
          Swal.fire({
              title: 'New Message',
              input: 'text',
              inputLabel: 'Enter username to chat with',
              inputPlaceholder: '@username',
              showCancelButton: true,
              confirmButtonText: 'Start Chat',
              confirmButtonColor: '#64E9EE',
              background: '#0d1423',
              color: '#fff'
          }).then((result) => {
              if (result.isConfirmed && result.value) {
                  Swal.fire({
                       icon: 'success',
                       title: 'Chat Started',
                       text: `Starting conversation with ${result.value}`,
                       background: '#0d1423',
                       color: '#fff',
                       timer: 1500,
                       showConfirmButton: false
                  });
              }
          });
      });
  }

  if(DOM.btnTriggerSearch) {
      DOM.btnTriggerSearch.addEventListener('click', () => {
          DOM.msgSearchBox.classList.remove('hidden');
          DOM.msgSearchInput.focus();
      });
  }
  if(DOM.btnCloseSearch) {
      DOM.btnCloseSearch.addEventListener('click', () => {
          DOM.msgSearchBox.classList.add('hidden');
          DOM.msgSearchInput.value = '';
          filterUsers(document.querySelector('#msg-tabs span.active').dataset.filter); // Reset to current filter
      });
  }
  if(DOM.msgSearchInput) {
      DOM.msgSearchInput.addEventListener('input', (e) => {
          const val = e.target.value.toLowerCase();
          DOM.msgUserItems.forEach(user => {
              const name = user.dataset.name.toLowerCase();
              user.style.display = name.includes(val) ? 'flex' : 'none';
          });
      });
  }

  DOM.msgTabs.forEach(tab => {
      tab.addEventListener('click', () => {
          DOM.msgTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          filterUsers(tab.dataset.filter);
      });
  });

  function filterUsers(category) {
      DOM.msgUserItems.forEach(user => {
          if (category === 'all') {
              user.style.display = 'flex';
          } else {
              user.style.display = (user.dataset.category === category) ? 'flex' : 'none';
          }
      });
  }

  if (DOM.msgUserItems) {
      DOM.msgUserItems.forEach(item => {
          item.addEventListener('click', () => {
              DOM.msgUserItems.forEach(i => i.classList.remove('active'));
              item.classList.add('active');

              const userId = item.dataset.id;
              const userName = item.dataset.name;
              const userAvatar = item.dataset.avatar;
              const userHandle = item.dataset.handle;
              const userJoined = item.dataset.joined;
              const userSpent = item.dataset.spent;

              DOM.activeChatName.innerHTML = `${userName} <i class="fa-solid fa-circle-check verify-badge"></i>`;
              // Use default avatar if empty or error
              DOM.activeChatAvatar.src = userAvatar || DEFAULT_AVATAR;
              
              DOM.infoNickname.value = userName;
              DOM.infoHandle.innerText = userHandle;
              DOM.infoJoined.innerText = userJoined;
              DOM.infoSpent.innerText = userSpent;

              loadChat(userId);
          });
      });
  }

  function loadChat(userId) {
      DOM.chatHistoryContainer.innerHTML = '';
      const messages = CHAT_DATA[userId] || [];
      messages.forEach(msg => {
          const msgElement = renderMessage(msg.text, msg.type, msg.time);
          DOM.chatHistoryContainer.appendChild(msgElement);
      });
      scrollToBottom();
  }

  function scrollToBottom() {
      if(DOM.chatHistoryContainer) {
          DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
      }
  }

  if (DOM.btnEmoji) {
      const picker = picmo.createPicker({
          rootElement: DOM.emojiContainer,
          theme: 'dark',
          showPreview: false,
          autoFocus: 'search',
          visibleRows: 4
      });

      picker.addEventListener('emoji:select', (selection) => {
          DOM.chatInput.value += selection.emoji;
          DOM.chatInput.focus();
      });

      DOM.btnEmoji.addEventListener('click', (e) => {
          e.stopPropagation();
          DOM.emojiContainer.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
          if (!DOM.emojiContainer.contains(e.target) && e.target !== DOM.btnEmoji) {
              DOM.emojiContainer.classList.add('hidden');
          }
      });
  }

  if(DOM.btnPPV) {
      DOM.btnPPV.addEventListener('click', () => {
          Swal.fire({
              title: 'Send Locked Message (PPV)',
              html: `
                  <p style="font-size:0.9rem; color:#aaa;">Set a price for this message content.</p>
                  <input type="number" id="ppv-price" class="swal2-input" placeholder="Price ($)">
                  <textarea id="ppv-desc" class="swal2-textarea" placeholder="Message description..."></textarea>
              `,
              showCancelButton: true,
              confirmButtonText: 'Attach Price',
              confirmButtonColor: '#2ecc71',
              background: '#0d1423',
              color: '#fff',
              preConfirm: () => {
                  const price = document.getElementById('ppv-price').value;
                  if (!price) Swal.showValidationMessage('Please enter a price');
                  return { price: price };
              }
          }).then((result) => {
              if(result.isConfirmed) {
                  DOM.chatInput.value = `[LOCKED MESSAGE: $${result.value.price}] `;
                  DOM.chatInput.focus();
              }
          });
      });
  }

  if(DOM.btnChatSearch) {
      DOM.btnChatSearch.addEventListener('click', () => {
          DOM.chatSearchBar.classList.remove('hidden');
          DOM.chatSearchInput.focus();
      });
  }
  if(DOM.closeChatSearch) {
      DOM.closeChatSearch.addEventListener('click', () => {
          DOM.chatSearchBar.classList.add('hidden');
          DOM.chatSearchInput.value = '';
      });
  }

  if(DOM.btnChatStar) {
      DOM.btnChatStar.addEventListener('click', function() {
          if(this.classList.contains('fa-regular')) {
              this.classList.replace('fa-regular', 'fa-solid'); 
              this.classList.add('active-star'); 
              
              const TopToast = Swal.mixin({
                  toast: true, position: 'top', showConfirmButton: false, timer: 1500,
                  background: '#0d1423', color: '#fff'
              });
              TopToast.fire({ icon: 'success', title: 'Added to Favorites' });
          } else {
              this.classList.replace('fa-solid', 'fa-regular');
              this.classList.remove('active-star');
          }
      });
  }

  if (DOM.btnSendMsg && DOM.chatInput) {
      const sendMsg = () => {
          const text = DOM.chatInput.value.trim();
          if (text) {
              const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const msgElement = renderMessage(text, 'sent', time);
              DOM.chatHistoryContainer.appendChild(msgElement);
              DOM.chatInput.value = '';
              scrollToBottom();
          }
      };

      DOM.btnSendMsg.addEventListener('click', sendMsg);
      DOM.chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') sendMsg();
      });
  }

  // ============================================
  // COLLECTIONS LOGIC (UPDATED WITH 3-COL LAYOUT)
  // ============================================
  
  // 1. Initial Data (Mock Database)
  let COLLECTIONS_DB = [
      { id: 'fans', name: 'Fans', type: 'user', count: 120, system: true },
      { id: 'following', name: 'Following', type: 'user', count: 45, system: true },
      { id: 'restricted', name: 'Restricted', type: 'user', count: 2, system: true },
      { id: 'blocked', name: 'Blocked', type: 'user', count: 5, system: true },
      { id: 'favorites', name: 'Favorite Posts', type: 'post', count: 10, system: true },
      { id: 'watch_later', name: 'Watch Later', type: 'post', count: 3, system: false }
  ];

  let currentColType = 'user'; // 'user' or 'post'

  // 2. DOM Elements for Collections
  const colDOM = {
      listWrapper: document.getElementById('collection-list-wrapper'),
      btnSearch: document.getElementById('col-btn-search'),
      btnAdd: document.getElementById('col-btn-add'),
      searchContainer: document.getElementById('col-search-container'),
      searchInput: document.getElementById('col-search-input'),
      searchClose: document.getElementById('col-search-close'),
      tabUsers: document.getElementById('tab-col-users'),
      tabBookmarks: document.getElementById('tab-col-bookmarks'),
      
      // Right Sidebar Elements
      rsTitle: document.getElementById('rs-col-title'),
      rsViewUsers: document.getElementById('rs-view-type-users'),
      rsViewMedia: document.getElementById('rs-view-type-media'),
      rsMediaGrid: document.getElementById('rs-media-grid-content'),
      rsMediaEmpty: document.getElementById('rs-media-empty-state')
  };

  // 3. Render Function
  function renderCollections(filterText = '') {
      if (!colDOM.listWrapper) return;
      colDOM.listWrapper.innerHTML = '';

      const filtered = COLLECTIONS_DB.filter(c => 
          c.type === currentColType && 
          c.name.toLowerCase().includes(filterText.toLowerCase())
      );

      if (filtered.length === 0) {
          colDOM.listWrapper.innerHTML = `<div style="padding:30px; text-align:center; color:var(--muted);">No collections found.</div>`;
          return;
      }

      filtered.forEach(col => {
          const div = document.createElement('div');
          div.className = 'c-list-item';
          
          // CLICK LOGIC: Update Right Sidebar directly
          div.onclick = () => {
              document.querySelectorAll('.c-list-item').forEach(el => el.classList.remove('active'));
              div.classList.add('active');
              updateRightSidebarContent(col);
          };

          div.innerHTML = `
              <div class="c-item-content">
                  <div style="display:flex; justify-content:space-between;">
                      <span class="c-item-name">${col.name}</span>
                      ${!col.system ? '<i class="fa-solid fa-trash" style="font-size:0.8rem; color:#ff4757; opacity:0.5; cursor:pointer;"></i>' : ''}
                  </div>
                  <span class="c-item-status">${col.count} items</span>
              </div>
          `;
          
          const delBtn = div.querySelector('.fa-trash');
          if(delBtn) {
              delBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  deleteCollection(col.id);
              });
          }

          colDOM.listWrapper.appendChild(div);
      });
  }

  // 4. Update Right Sidebar (3-Column View)
  function updateRightSidebarContent(col) {
      // HANDLE THE "TWIST": If 'following' is clicked, sidebar highlights Subscriptions
      if (col.id === 'following') {
          DOM.navCollections.classList.remove('active');
          if(DOM.navCollections.querySelector('i')) DOM.navCollections.querySelector('i').classList.replace('fa-solid', 'fa-regular');
          setActive(DOM.navSubs);
      } else {
          // Revert to Collections highlighting
          DOM.navSubs.classList.remove('active');
          // FIX: REMOVED THE LINE THAT FORCED ICON CHANGE
          setActive(DOM.navCollections);
      }

      if(colDOM.rsTitle) colDOM.rsTitle.innerText = col.name.toUpperCase();

      if (col.type === 'user') {
          // Show User Filters, Hide Media
          colDOM.rsViewUsers.classList.remove('hidden');
          colDOM.rsViewMedia.classList.add('hidden');
          
          // RE-ATTACH CLICK EVENTS TO CHIPS (Fix for non-clickable chips)
          const chips = colDOM.rsViewUsers.querySelectorAll('.chip');
          chips.forEach(chip => {
              chip.onclick = () => {
                  chips.forEach(c => c.classList.remove('active'));
                  chip.classList.add('active');
              };
          });

      } else {
          // Show Media Grid, Hide Users
          colDOM.rsViewUsers.classList.add('hidden');
          colDOM.rsViewMedia.classList.remove('hidden');
          
          renderMediaGrid(col.count);
      }
  }

  function renderMediaGrid(count) {
      if(!colDOM.rsMediaGrid) return;
      colDOM.rsMediaGrid.innerHTML = '';

      if (count === 0) {
          colDOM.rsMediaEmpty.classList.remove('hidden');
      } else {
          colDOM.rsMediaEmpty.classList.add('hidden');
          // Inject Blank Images
          for(let i=0; i < count; i++) {
              const img = document.createElement('img');
              img.src = BLANK_IMG;
              img.style.width = '100%';
              img.style.aspectRatio = '1/1';
              img.style.objectFit = 'cover';
              img.style.borderRadius = '8px';
              img.style.background = '#222';
              img.style.cursor = 'pointer';
              colDOM.rsMediaGrid.appendChild(img);
          }
      }
  }

  // Add Collection
  if (colDOM.btnAdd) {
      colDOM.btnAdd.addEventListener('click', () => {
          Swal.fire({
              title: `New ${currentColType === 'user' ? 'List' : 'Bookmark'}`,
              input: 'text',
              inputPlaceholder: 'Collection Name',
              showCancelButton: true,
              confirmButtonText: 'Create',
              confirmButtonColor: '#64E9EE',
              background: '#0d1423',
              color: '#fff'
          }).then((result) => {
              if (result.isConfirmed && result.value) {
                  const newId = result.value.toLowerCase().replace(/\s/g, '_');
                  const newCol = {
                      id: newId,
                      name: result.value,
                      type: currentColType,
                      count: 0,
                      system: false
                  };
                  COLLECTIONS_DB.push(newCol);
                  renderCollections(colDOM.searchInput ? colDOM.searchInput.value : '');
                  TopToast.fire({ icon: 'success', title: 'Collection created!' });
              }
          });
      });
  }

  function deleteCollection(id) {
      Swal.fire({
          title: 'Delete this list?',
          text: "You cannot undo this.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ff4757',
          confirmButtonText: 'Yes, delete',
          background: '#0d1423',
          color: '#fff'
      }).then((result) => {
          if (result.isConfirmed) {
              COLLECTIONS_DB = COLLECTIONS_DB.filter(c => c.id !== id);
              renderCollections(colDOM.searchInput ? colDOM.searchInput.value : '');
              TopToast.fire({ icon: 'success', title: 'Deleted' });
          }
      });
  }

  // Search
  if (colDOM.btnSearch) {
      colDOM.btnSearch.addEventListener('click', () => {
          colDOM.searchContainer.classList.remove('hidden');
          colDOM.searchInput.focus();
      });
  }
  if (colDOM.searchClose) {
      colDOM.searchClose.addEventListener('click', () => {
          colDOM.searchContainer.classList.add('hidden');
          colDOM.searchInput.value = '';
          renderCollections(); 
      });
  }
  if (colDOM.searchInput) {
      colDOM.searchInput.addEventListener('input', (e) => {
          renderCollections(e.target.value);
      });
  }

  // Tab Switch
  if (colDOM.tabUsers && colDOM.tabBookmarks) {
      colDOM.tabUsers.addEventListener('click', () => {
          colDOM.tabUsers.classList.add('active');
          colDOM.tabBookmarks.classList.remove('active');
          currentColType = 'user';
          renderCollections(colDOM.searchInput ? colDOM.searchInput.value : '');
      });

      colDOM.tabBookmarks.addEventListener('click', () => {
          colDOM.tabBookmarks.classList.add('active');
          colDOM.tabUsers.classList.remove('active');
          currentColType = 'post';
          renderCollections(colDOM.searchInput ? colDOM.searchInput.value : '');
      });
  }

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
      title: 'Success!'
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