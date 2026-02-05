import { getCurrentUser, loadPrefsForUser, savePrefsForUser } from './tm-session.js';
// ---------------------------------------------------------------------
// Premium Society - Secured & Persistent Logic
// ---------------------------------------------------------------------

const PS_DOM = {
    layout: document.getElementById('psMainLayout'),
    loader: document.getElementById('app-loader'),
    tabs: document.querySelectorAll('.ps-nav-btn'),
    panels: document.querySelectorAll('.ps-panel[data-panel]'),
    sidebar: document.getElementById('psMainSidebar'),
    
    // Header
    headerAvatar: document.getElementById('psHeaderAvatar'),
    headerName: document.getElementById('psWelcomeName'),
    
    // Containers
    dailyPickContainer: document.getElementById('psDailyPickContainer'),
    storiesContainer: document.getElementById('psStoriesContainer'),
    admirerContainer: document.getElementById('psAdmirerContainer'),
    admirerCount: document.getElementById('psAdmirerCount'),
    
    // UPDATED MATCHES CONTAINERS
    matchesContainer: document.getElementById('psMatchesContainer'), // List
    newMatchesRail: document.getElementById('psNewMatchesRail'),     // Rail
    newMatchCount: document.getElementById('psNewMatchCount'),

    activeNearbyContainer: document.getElementById('psActiveNearbyContainer'),
    
    // CHAT WINDOW DOM
    chatWindow: document.getElementById('psChatWindow'),
    btnCloseChat: document.getElementById('psBtnCloseChat'),
    chatAvatar: document.getElementById('psChatAvatar'),
    chatName: document.getElementById('psChatName'),
    chatBody: document.getElementById('psChatBody'),
    chatInput: document.getElementById('psChatInput'),
    chatEmojiPicker: document.getElementById('psChatEmojiPicker'),

    // Story Viewer
    storyViewer: document.getElementById('psStoryViewer'),
    btnCloseStory: document.getElementById('psBtnCloseStory'),
    storyFullImg: document.getElementById('psStoryImageDisplay'),
    storyName: document.getElementById('psStoryName'),
    storyAvatar: document.getElementById('psStoryAvatar'),
    storyProgress: document.getElementById('psStoryProgress'),
    storyCommentInput: document.getElementById('psStoryCommentInput'),
    storyEmojiPicker: document.getElementById('psStoryEmojiPicker'),

    // Add Story Modal
    addStoryModal: document.getElementById('psAddStoryModal'),
    storyInput: document.getElementById('psStoryInput'),

    // Mini Profile Elements
    miniAvatar: document.getElementById('psMiniAvatar'),
    miniName: document.getElementById('psMiniName'),
    miniPlan: document.getElementById('psMiniPlan'),
    miniLogout: document.getElementById('ps-btn-logout'),

    
    // Settings Profile
    settingsName: document.getElementById('psSNameDisplay'),
    settingsEmail: document.getElementById('psSEmailDisplay'),
    settingsAvatar: document.getElementById('psSAvatar'),
    settingsPlanBadge: document.getElementById('psSPlanBadge'),

    // Edit Premium Profile modal (Premium Society application details)
    editProfileBtn: document.getElementById('psBtnEditProfile'),
    editProfileModal: document.getElementById('psEditProfileModal'),
    editProfileCard: document.querySelector('#psEditProfileModal .ps-edit-modal-card'),
    inpPremiumName: document.getElementById('psInputName'),
    inpPremiumEmail: document.getElementById('psInputEmail'),
    inpPremiumOccupation: document.getElementById('psInputOccupation'),
    inpPremiumAge: document.getElementById('psInputAge'),
    inpPremiumWealthStatus: document.getElementById('psInputWealthStatus'),
    inpPremiumIncomeRange: document.getElementById('psInputIncomeRange'),
    inpPremiumNetWorthRange: document.getElementById('psInputNetWorthRange'),
    inpPremiumIncomeSource: document.getElementById('psInputIncomeSource'),
    inpPremiumSocialLink: document.getElementById('psInputSocialLink'),
    inpPremiumReason: document.getElementById('psInputReason'),

    // Refresh Popover
    refreshPopover: document.getElementById('psRefreshPopover'),
    btnRefreshDeck: document.getElementById('psBtnRefreshDeck'),

    // Mobile Toggles
    mobileMenuBtn: document.getElementById('psMobileNavToggle'),
    mobileMomentsBtn: document.getElementById('psMobileMomentsToggle'),
    momentsPopup: document.getElementById('psMomentsPopup'),
    
    // Swipe
    swipeStack: document.getElementById('psSwipeStack'),
    swipeControls: document.getElementById('psSwipeControls'),
    btnSwipePass: document.getElementById('psBtnSwipePass'),
    btnSwipeLike: document.getElementById('psBtnSwipeLike'),
    swipeEmptyNotice: document.getElementById('psSwipeEmptyNotice'),
    btnSwipeSuper: document.getElementById('psBtnSwipeSuper'),
    
    // Stats & Toast
    ringCircle: document.getElementById('psStatsRingCircle'),
    countDisplay: document.getElementById('psStatsCountDisplay'),
    toast: document.getElementById('ps-toast'),
    
    // Timer Display
    timerDisplay: document.querySelector('.ps-stats-body p.ps-tiny'),

    // Panels
    panelCreatorsBody: document.getElementById('ps-panel-creators'),
    panelPremiumBody: document.getElementById('ps-panel-premium')
};



/** Settings sliders (Distance + Max Age) **/
function clampNumber(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}
function debounce(fn, waitMs = 250) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}
function initSettingsSliders() {
  const distRange = document.getElementById('psRangeDist');
  const ageRange = document.getElementById('psRangeAge');
  const distVal = document.getElementById('psDistVal');
  const ageVal = document.getElementById('psAgeVal');

  if (!distRange || !ageRange) return;

  // Enforce requested constraints
  ageRange.min = '18';
  ageRange.max = '70';
  ageRange.step = '1';

  // Distance: intentionally wide range (no practical min/max in UI)
  if (!distRange.min) distRange.min = '0';
  if (!distRange.max) distRange.max = '1000';
  distRange.step = distRange.step || '1';

  const me = (() => {
    try { return getCurrentUser(); } catch (e) { return null; }
  })();
  const email = me?.email || me?.userEmail || me?.emailAddress || null;

  // Load saved prefs (local) if available
  if (email) {
    const prefs = loadPrefsForUser(email) || {};
    if (prefs.distanceKm != null && String(prefs.distanceKm).trim() !== '') {
      distRange.value = String(prefs.distanceKm);
    }
    if (prefs.maxAge != null && String(prefs.maxAge).trim() !== '') {
      ageRange.value = String(clampNumber(prefs.maxAge, 18, 70));
    }
  }

  const render = () => {
    if (distVal) distVal.textContent = String(distRange.value);
    if (ageVal) ageVal.textContent = String(ageRange.value);
  };

  const persist = () => {
    if (!email) return;
    const existing = loadPrefsForUser(email) || {};
    const next = {
      ...existing,
      distanceKm: Number(distRange.value),
      maxAge: clampNumber(ageRange.value, 18, 70),
    };
    savePrefsForUser(email, next);
  };

  const persistDebounced = debounce(persist, 300);

  // Make the UI responsive while dragging
  distRange.addEventListener('input', () => {
    render();
    persistDebounced();
  });
  ageRange.addEventListener('input', () => {
    ageRange.value = String(clampNumber(ageRange.value, 18, 70));
    render();
    persistDebounced();
  });

  // Hard save on release
  distRange.addEventListener('change', () => {
    render();
    persist();
  });
  ageRange.addEventListener('change', () => {
    ageRange.value = String(clampNumber(ageRange.value, 18, 70));
    render();
    persist();
  });

  // Initial paint
  render();
}

// --- Runtime state (hydrated from /api/me)
const PS_STATE = {
  me: null,
  swipeInited: false,
  premiumSociety: {
    eligible: false,   // active Elite/Concierge plan
    approved: false,   // eligible + premiumStatus === 'approved'
    status: 'none'     // none | pending | rejected | approved
  }
};



function getRandomColor() {
    const colors = ['#00aff0', '#ff3366', '#3ad4ff', '#800080', '#00ff88', '#333'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function showToast(msg) {
    if (!PS_DOM.toast) return;
    PS_DOM.toast.innerHTML = `<i class="fa-solid fa-fire"></i> ${msg}`;
    PS_DOM.toast.className = `ps-toast ps-visible`;
    setTimeout(() => PS_DOM.toast.classList.remove('ps-visible'), 3000);
}

// ---------------------------------------------------------------------
// SWIPE EMPTY-STATE UI HELPERS
// ---------------------------------------------------------------------
function psSetSwipeControlsEmpty(isEmpty) {
    // Requirement: when there are no profiles to swipe, show a clear message
    // and hide the 3 swipe action buttons.
    const notice = PS_DOM.swipeEmptyNotice;
    const btns = [PS_DOM.btnSwipePass, PS_DOM.btnSwipeSuper, PS_DOM.btnSwipeLike].filter(Boolean);

    if (notice) {
        notice.textContent = 'Nothing to swipe for now';
        notice.style.display = isEmpty ? 'block' : 'none';
    }

    // Hide/show controls + buttons explicitly (do NOT rely only on CSS :has)
    if (PS_DOM.swipeControls) {
        PS_DOM.swipeControls.style.display = isEmpty ? 'none' : '';
        PS_DOM.swipeControls.style.opacity = '1';
        PS_DOM.swipeControls.style.pointerEvents = isEmpty ? 'none' : 'auto';
    }

    btns.forEach((b) => {
        b.style.display = isEmpty ? 'none' : '';
        b.disabled = Boolean(isEmpty);
        b.setAttribute('aria-disabled', String(Boolean(isEmpty)));
    });

    // Use the existing popover overlay as the empty-state surface
    if (PS_DOM.refreshPopover) {
        if (isEmpty) {
            PS_DOM.refreshPopover.classList.add('active');

            const h4 = PS_DOM.refreshPopover.querySelector('h4');
            if (h4) h4.textContent = 'Nothing to swipe for now';

            const p = PS_DOM.refreshPopover.querySelector('p');
            if (p) p.textContent = 'Come back later or refresh the deck.';
        } else {
            PS_DOM.refreshPopover.classList.remove('active');
        }
    }
}

// ---------------------------------------------------------------------
// EDIT PREMIUM PROFILE MODAL (Premium Society application details)
// ---------------------------------------------------------------------
let PS_EDIT_SAVING = false;

function psSaveLocalUser(user) {
    try {
        localStorage.setItem('tm_user', JSON.stringify(user));
    } catch (_) { /* ignore */ }
}

function psGetPremiumApplication(user) {
    if (!user || typeof user !== 'object') return null;
    return user.premiumApplication
        || user.premiumSocietyApplication
        || (user.premiumSociety && user.premiumSociety.application)
        || user.premiumApp
        || null;
}

function psSetEditProfileModalOpen(isOpen) {
    if (!PS_DOM.editProfileModal) return;
    PS_DOM.editProfileModal.style.display = isOpen ? 'flex' : 'none';
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

function openEditProfile() {
    const user = PS_STATE.me || psSafeGetLocalUser() || {};
    const app = psGetPremiumApplication(user) || {};

    if (PS_DOM.inpPremiumName) {
        PS_DOM.inpPremiumName.value = String(app.fullName || user.name || user.fullName || '').trim();
    }
    if (PS_DOM.inpPremiumEmail) {
        PS_DOM.inpPremiumEmail.value = String(user.email || '').trim();
    }
    if (PS_DOM.inpPremiumOccupation) {
        PS_DOM.inpPremiumOccupation.value = String(app.occupation || '').trim();
    }
    if (PS_DOM.inpPremiumAge) {
        const age = (app.age ?? user.age ?? '');
        PS_DOM.inpPremiumAge.value = String(age || '').trim();
    }
    if (PS_DOM.inpPremiumWealthStatus) {
        PS_DOM.inpPremiumWealthStatus.value = String(app.wealthStatus || '').trim();
    }
    if (PS_DOM.inpPremiumIncomeRange) {
        PS_DOM.inpPremiumIncomeRange.value = String(app.incomeRange || '').trim();
    }
    if (PS_DOM.inpPremiumNetWorthRange) {
        PS_DOM.inpPremiumNetWorthRange.value = String(app.netWorthRange || '').trim();
    }
    if (PS_DOM.inpPremiumIncomeSource) {
        PS_DOM.inpPremiumIncomeSource.value = String(app.incomeSource || app.finance || '').trim();
    }
    if (PS_DOM.inpPremiumSocialLink) {
        PS_DOM.inpPremiumSocialLink.value = String(app.socialLink || '').trim();
    }
    if (PS_DOM.inpPremiumReason) {
        PS_DOM.inpPremiumReason.value = String(app.reason || '').trim();
    }

    psSetEditProfileModalOpen(true);
}

function closeEditProfile() {
    psSetEditProfileModalOpen(false);
}

async function psTryUpdatePremiumProfile(payload) {
    // Try a small set of likely endpoints. If none exist, we still keep local updates.
    const paths = [
        '/api/me/premium/profile',
        '/api/me/premium/profile/update',
        '/api/me/premium/update-profile'
    ];

    for (const path of paths) {
        try {
            const res = await fetch(path, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // If endpoint doesn't exist on this build, skip quietly.
            if (res.status === 404 || res.status === 405) continue;

            // If backend responded, try to parse JSON (optional).
            let data = null;
            try { data = await res.json(); } catch (_) { /* ignore */ }

            if (!res.ok) {
                const msg = (data && (data.message || data.error)) ? (data.message || data.error) : `Failed to save (HTTP ${res.status})`;
                throw new Error(msg);
            }

            // Some endpoints may not return {ok:true}
            if (data && typeof data === 'object' && data.ok === false) {
                throw new Error(data.message || data.error || 'Failed to save');
            }

            return { ok: true, pathUsed: path, data };
        } catch (e) {
            // If it's a real backend error (not 404/405), surface it.
            throw e;
        }
    }

    return { ok: false, skipped: true };
}

async function saveEditProfile() {
    if (PS_EDIT_SAVING) return;
    PS_EDIT_SAVING = true;

    try {
        const fullName = String(PS_DOM.inpPremiumName ? PS_DOM.inpPremiumName.value : '').trim();
        const occupation = String(PS_DOM.inpPremiumOccupation ? PS_DOM.inpPremiumOccupation.value : '').trim();
        const ageRaw = String(PS_DOM.inpPremiumAge ? PS_DOM.inpPremiumAge.value : '').trim();
        const age = ageRaw ? parseInt(ageRaw, 10) : null;

        const wealthStatus = String(PS_DOM.inpPremiumWealthStatus ? PS_DOM.inpPremiumWealthStatus.value : '').trim();
        const incomeRange = String(PS_DOM.inpPremiumIncomeRange ? PS_DOM.inpPremiumIncomeRange.value : '').trim();
        const netWorthRange = String(PS_DOM.inpPremiumNetWorthRange ? PS_DOM.inpPremiumNetWorthRange.value : '').trim();
        const incomeSource = String(PS_DOM.inpPremiumIncomeSource ? PS_DOM.inpPremiumIncomeSource.value : '').trim();
        const socialLink = String(PS_DOM.inpPremiumSocialLink ? PS_DOM.inpPremiumSocialLink.value : '').trim();
        const reason = String(PS_DOM.inpPremiumReason ? PS_DOM.inpPremiumReason.value : '').trim();

        // Mirror the same minimal validation used in the Premium application form
        if (!fullName || !occupation || !wealthStatus || !incomeRange || !netWorthRange || !incomeSource || !reason) {
            showToast('Please complete the form.');
            return;
        }
        if (age !== null && (!Number.isFinite(age) || age < 18 || age > 99)) {
            showToast('Please enter a valid age (18-99).');
            return;
        }

        const payload = {
            fullName,
            age: (age === null ? '' : String(age)),
            occupation,
            wealthStatus,
            incomeRange,
            netWorthRange,
            incomeSource,
            socialLink,
            reason
        };

        // Update local state (so UI is immediately consistent)
        PS_STATE.me = PS_STATE.me || psSafeGetLocalUser() || {};
        PS_STATE.me.premiumApplication = { ...(psGetPremiumApplication(PS_STATE.me) || {}), ...payload, updatedAt: Date.now() };

        // Also keep top-level identity consistent
        PS_STATE.me.fullName = fullName;
        if (!PS_STATE.me.name) PS_STATE.me.name = fullName;
        if (age !== null) PS_STATE.me.age = age;

        psSaveLocalUser(PS_STATE.me);

        // Best-effort server update (if supported in this build)
        const serverRes = await psTryUpdatePremiumProfile(payload);
        if (serverRes && serverRes.ok) {
            showToast('Saved successfully!');
        } else {
            // No endpoint found in this build; keep local save.
            showToast('Saved successfully!');
        }

        // Refresh visible identity
        const displayName = psResolveDisplayName(PS_STATE.me);
        if (PS_DOM.headerName) PS_DOM.headerName.textContent = displayName;
        if (PS_DOM.settingsName) PS_DOM.settingsName.textContent = displayName;
        if (PS_DOM.miniName) PS_DOM.miniName.textContent = displayName;

        closeEditProfile();
    } catch (e) {
        console.error(e);
        showToast(e?.message || 'Failed to save. Please try again.');
    } finally {
        PS_EDIT_SAVING = false;
    }
}

function initEditProfileModal() {
    // Expose handlers for inline onclick attributes (modal buttons in HTML)
    window.closeEditProfile = closeEditProfile;
    window.saveEditProfile = saveEditProfile;

    if (PS_DOM.editProfileBtn) {
        PS_DOM.editProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openEditProfile();
        });
    }

    if (PS_DOM.editProfileModal) {
        // Close when clicking the overlay
        PS_DOM.editProfileModal.addEventListener('click', (e) => {
            if (e.target === PS_DOM.editProfileModal) closeEditProfile();
        });
    }

    if (PS_DOM.editProfileCard) {
        PS_DOM.editProfileCard.addEventListener('click', (e) => e.stopPropagation());
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && PS_DOM.editProfileModal && PS_DOM.editProfileModal.style.display !== 'none') {
            closeEditProfile();
        }
    });
}


// ---------------------------------------------------------------------
// ACCOUNT IDENTITY (name/avatar from session)
// ---------------------------------------------------------------------
function psSafeGetLocalUser() {
    try {
        return JSON.parse(localStorage.getItem('tm_user') || 'null');
    } catch (_) {
        return null;
    }
}

function psResolveDisplayName(user) {
    // Prefer explicit name fields first
    let name =
        (user && (user.name || user.displayName || user.fullName || user.username)) ||
        (user && user.profile && (user.profile.name || user.profile.fullName || user.profile.displayName)) ||
        '';

    let out = String(name || '').trim();

    // Fallback: firstName + lastName (common in forms)
    if (!out) {
        const first = (user && (user.firstName || user.firstname || user.first_name)) || '';
        const last = (user && (user.lastName || user.lastname || user.last_name)) || '';
        out = String(`${first} ${last}`).trim();
    }

    // Last-resort fallback: common app-specific fields
    if (!out) {
        out = String((user && (user.applicantName || user.premiumApplicantName || user.creatorApplicantName)) || '').trim();
    }

    return out || 'Member';
}

function psNormalizePlanKey(rawPlan) {
    const v = String(rawPlan || '').trim().toLowerCase();
    if (!v) return 'free';
    if (v === 'free' || v === '0') return 'free';
    if (v === 'plus' || v === 'tier1' || v === '1') return 'tier1';
    if (v === 'elite' || v === 'tier2' || v === '2') return 'tier2';
    if (v === 'concierge' || v === 'tier3' || v === '3') return 'tier3';
    return v;
}

function psPlanLabelFromKey(planKey) {
    const key = psNormalizePlanKey(planKey);
    if (key === 'tier1') return 'Plus';
    if (key === 'tier2') return 'Elite';
    if (key === 'tier3') return 'Concierge';
    return 'Free Account';
}


function psTierNumFromPlanKey(planKey) {
  const k = psNormalizePlanKey(planKey || 'free');
  if (k === 'tier3') return 3;
  if (k === 'tier2') return 2;
  if (k === 'tier1') return 1;
  return 0;
}

function psNormalizePremiumStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  if (s === 'approved') return 'approved';
  if (s === 'pending') return 'pending';
  if (s === 'rejected') return 'rejected';
  return 'none';
}

/**
 * Premium Society rules (authoritative):
 * - Eligible: active Elite (tier2) or Concierge (tier3) plan.
 * - Member: eligible + premiumStatus === 'approved'.
 */
function psHydratePremiumSocietyState(me) {
  const planKey = psNormalizePlanKey(me && (me.plan || me.tier || me.planKey));
  const tierNum = psTierNumFromPlanKey(planKey);
  const planActive = Boolean(me && me.planActive === true);
  const status = psNormalizePremiumStatus(me && me.premiumStatus);

  const eligible = planActive && tierNum >= 2;
  const approved = eligible && status === 'approved';

  PS_STATE.premiumSociety.eligible = eligible;
  PS_STATE.premiumSociety.approved = approved;
  PS_STATE.premiumSociety.status = status;
}

function psRenderPremiumSocietyLockedDeck() {
  if (!PS_DOM.swipeStack) return;
  if (PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'none';

  const s = PS_STATE.premiumSociety.status;
  const eligible = PS_STATE.premiumSociety.eligible;

  let title = 'Premium Society is locked';
  let body = 'You need an active Elite (Tier 2) or Concierge (Tier 3) plan, plus an approved Premium Society application.';

  if (eligible && s === 'pending') {
    title = 'Application pending';
    body = 'Your Premium Society application is under review. Once approved, you can start swiping here.';
  } else if (eligible && s === 'rejected') {
    title = 'Application rejected';
    body = 'Your application was rejected. You can re-apply from your Dashboard Premium tab.';
  } else if (eligible && s === 'none') {
    title = 'Not a member yet';
    body = 'You have an eligible plan, but you still need an approved Premium Society application.';
  } else if (!eligible) {
    title = 'Upgrade required';
    body = 'Premium Society access requires an active Elite (Tier 2) or Concierge (Tier 3) plan.';
  }

  PS_DOM.swipeStack.innerHTML = `
    <div class="ps-card" style="max-width:520px;margin:24px auto;padding:20px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);">
      <h3 style="margin:0 0 8px 0;font-size:18px;">${title}</h3>
      <p style="margin:0 0 14px 0;opacity:.9;line-height:1.45;">${body}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="psGoDashboardBtn" class="ps-btn ps-btn-primary" style="padding:10px 14px;border-radius:12px;">Back to Dashboard</button>
        <button id="psRefreshMeBtn" class="ps-btn" style="padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);color:#fff;">Refresh</button>
      </div>
    </div>
  `;

  const goBtn = document.getElementById('psGoDashboardBtn');
  if (goBtn) goBtn.addEventListener('click', () => { window.location.href = 'dashboard.html'; });

  const refBtn = document.getElementById('psRefreshMeBtn');
  if (refBtn) refBtn.addEventListener('click', async () => {
    try {
      const me = await hydrateAccountIdentity();
      if (me) PS_STATE.me = me;
      psHydratePremiumSocietyState(PS_STATE.me);
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).get('mock') === '1') {
        populateMockContent();
      }
const lastTab = localStorage.getItem('ps_last_tab') || 'home';
      switchTab(lastTab);
    } catch (e) {}
  });
}

function psRenderPremiumSocietyPanel() {
  if (!PS_DOM.panelPremiumBody) return;

  const s = PS_STATE.premiumSociety.status;
  const eligible = PS_STATE.premiumSociety.eligible;
  const approved = PS_STATE.premiumSociety.approved;

  let headline = 'Premium Society';
  let desc = 'Swipe and match with other Premium Society members.';
  let badge = approved ? 'ACTIVE' : 'LOCKED';

  if (approved) {
    desc = 'You are approved. Enjoy unlimited swipes with Premium Society members.';
  } else if (eligible && s === 'pending') {
    desc = 'Your application is pending review. You will get access after approval.';
  } else if (eligible && s === 'rejected') {
    desc = 'Your application was rejected. You can re-apply from your Dashboard Premium tab.';
  } else if (eligible && s === 'none') {
    desc = 'You have an eligible plan, but you still need an approved Premium Society application.';
  } else if (!eligible) {
    desc = 'Requires an active Elite (Tier 2) or Concierge (Tier 3) plan, plus an approved application.';
  }

  PS_DOM.panelPremiumBody.innerHTML = `
    <div style="padding:22px;background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.10);border-radius:18px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <h3 style="margin:0;font-size:18px;">${headline}</h3>
        <span style="padding:6px 10px;border-radius:999px;font-size:12px;letter-spacing:.06em;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.12);">${badge}</span>
      </div>
      <p style="margin:10px 0 14px 0;opacity:.9;line-height:1.45;">${desc}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="psDashPremiumBtn" class="ps-btn ps-btn-primary" style="padding:10px 14px;border-radius:12px;">Open Dashboard</button>
        <button id="psRefreshPremiumBtn" class="ps-btn" style="padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);color:#fff;">Refresh</button>
      </div>
    </div>
  `;

  const dashBtn = document.getElementById('psDashPremiumBtn');
  if (dashBtn) dashBtn.addEventListener('click', () => { window.location.href = 'dashboard.html'; });

  const refBtn = document.getElementById('psRefreshPremiumBtn');
  if (refBtn) refBtn.addEventListener('click', async () => {
    try {
      const me = await hydrateAccountIdentity();
      if (me) PS_STATE.me = me;
      psHydratePremiumSocietyState(PS_STATE.me);
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).get('mock') === '1') {
        populateMockContent();
      }
const lastTab = localStorage.getItem('ps_last_tab') || 'home';
      switchTab(lastTab);
    } catch (e) {}
  });
}

function psResolvePlanLabel(user) {
    const raw = user?.plan ?? user?.planKey ?? user?.tier ?? user?.tierKey ?? user?.subscriptionPlan ?? user?.accessTier;
    const key = psNormalizePlanKey(raw);
    const base = psPlanLabelFromKey(key);
    const activeFlag = user?.planActive;

    // If planActive exists and is false, show Inactive for paid plans.
    if (activeFlag === false && key !== 'free') return `${base} (Inactive)`;
    return base;
}


function psResolveAvatarUrl(user) {
    const url = (user && (user.avatarUrl || user.photoUrl || user.photoURL || user.profilePhotoUrl || user.avatar)) || '';
    const out = String(url || '').trim();
    return out || '';
}

async function hydrateAccountIdentity() {
    // Start with cached local user to avoid "..." staying on UI if /api/me fails.
    let user = psSafeGetLocalUser();

    // 1) Try server session (recommended)
    try {
        const res = await fetch('/api/me', { credentials: 'same-origin' });
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            const data = await res.json();
            if (data && data.ok && data.user) user = data.user;
        }
    } catch (_) {}

    if (!user) return;

    const displayName = psResolveDisplayName(user);
    const avatarUrl = psResolveAvatarUrl(user);

    const planLabel = psResolvePlanLabel(user);
    const email = user.email || user.userEmail || user.mail || user.contactEmail || '';

    if (PS_DOM.miniPlan) PS_DOM.miniPlan.textContent = planLabel;

    if (PS_DOM.settingsName) PS_DOM.settingsName.textContent = displayName;
    if (PS_DOM.settingsEmail) PS_DOM.settingsEmail.textContent = email;
    if (PS_DOM.settingsPlanBadge) PS_DOM.settingsPlanBadge.textContent = planLabel;

    if (PS_DOM.miniName) PS_DOM.miniName.textContent = displayName;
    if (PS_DOM.headerName) PS_DOM.headerName.textContent = displayName;

    const menuNameEl = document.getElementById('psMenuName');
    if (menuNameEl) menuNameEl.textContent = displayName;

    if (avatarUrl) {
        if (PS_DOM.miniAvatar) PS_DOM.miniAvatar.src = avatarUrl;
        if (PS_DOM.headerAvatar) PS_DOM.headerAvatar.src = avatarUrl;
        if (PS_DOM.settingsAvatar) PS_DOM.settingsAvatar.src = avatarUrl;
        const storyAvatarEl = document.getElementById('psStoryAvatar');
        if (storyAvatarEl) storyAvatarEl.src = avatarUrl;
    }


    return user;
}

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    initCanvasParticles();
    initNavigation();
    initSettingsSliders();
initMobileMenu();
    initStoryViewer();
    initChat(); // Initialize Chat Listeners

    // Hydrate identity first so name/plan updates even if some optional sections were removed.
    try {
        const me = await hydrateAccountIdentity();
        if (me) PS_STATE.me = me;
    } catch (e) {
        // non-fatal — UI will fall back to local storage / placeholders
    }

    psHydratePremiumSocietyState(PS_STATE.me);

    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).get('mock') === '1') {
        populateMockContent();
      }
// Check Local Storage for Last Tab
    const lastTab = localStorage.getItem('ps_last_tab') || 'home';
    switchTab(lastTab);

    // Remove Loader smoothly
    setTimeout(() => {
        if(PS_DOM.loader) {
            PS_DOM.loader.style.opacity = '0';
            setTimeout(() => PS_DOM.loader.remove(), 500);
        }
        if(PS_DOM.layout) PS_DOM.layout.style.opacity = '1';
    }, 1000);
});

// ---------------------------------------------------------------------
// CHAT LOGIC (NEW)
// ---------------------------------------------------------------------
function initChat() {
    if(PS_DOM.btnCloseChat) {
        PS_DOM.btnCloseChat.addEventListener('click', closeChat);
    }
}

window.openChat = function(name) {
    if(!PS_DOM.chatWindow) return;
    
    // Set Header Info
    PS_DOM.chatName.textContent = name;
    PS_DOM.chatAvatar.src = "assets/images/truematch-mark.png";
    
    // Clear previous dummy messages and add some starter ones
    PS_DOM.chatBody.innerHTML = `
        <div class="ps-msg-bubble received">Hey ${name} here! How's it going?</div>
        <div class="ps-msg-bubble received">Saw your profile, pretty cool!</div>
    `;
    
    PS_DOM.chatWindow.classList.add('active');
}

window.closeChat = function() {
    if(PS_DOM.chatWindow) PS_DOM.chatWindow.classList.remove('active');
}

window.toggleChatEmoji = function() {
    if(PS_DOM.chatEmojiPicker) PS_DOM.chatEmojiPicker.classList.toggle('active');
}

window.addChatEmoji = function(emoji) {
    if(PS_DOM.chatInput) {
        PS_DOM.chatInput.value += emoji;
        PS_DOM.chatInput.focus();
    }
}

window.sendChatMessage = function() {
    const text = PS_DOM.chatInput ? PS_DOM.chatInput.value.trim() : "";
    if(!text) return;

    // Append Sent Message
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ps-msg-bubble sent';
    msgDiv.textContent = text;
    PS_DOM.chatBody.appendChild(msgDiv);
    
    // Auto Scroll to bottom
    PS_DOM.chatBody.scrollTop = PS_DOM.chatBody.scrollHeight;

    PS_DOM.chatInput.value = "";
    if(PS_DOM.chatEmojiPicker) PS_DOM.chatEmojiPicker.classList.remove('active');
}

// ---------------------------------------------------------------------
// STORY VIEWER LOGIC
// ---------------------------------------------------------------------
function initStoryViewer() {
    if(PS_DOM.btnCloseStory) {
        PS_DOM.btnCloseStory.onclick = closeStory;
    }
}

window.openStory = function(name, color) {
    if(!PS_DOM.storyViewer) return;
    PS_DOM.storyName.textContent = name;
    PS_DOM.storyAvatar.src = "assets/images/truematch-mark.png"; 
    
    if(PS_DOM.storyCommentInput) PS_DOM.storyCommentInput.value = "";
    if(PS_DOM.storyEmojiPicker) PS_DOM.storyEmojiPicker.classList.remove('active');

    PS_DOM.storyFullImg.style.backgroundColor = color;
    PS_DOM.storyFullImg.style.backgroundImage = "url('assets/images/truematch-mark.png')";
    PS_DOM.storyFullImg.style.backgroundSize = "contain";
    PS_DOM.storyFullImg.style.backgroundRepeat = "no-repeat";

    PS_DOM.storyViewer.classList.add('active');
    
    if(PS_DOM.storyProgress) {
        PS_DOM.storyProgress.classList.remove('animating');
        void PS_DOM.storyProgress.offsetWidth; 
        PS_DOM.storyProgress.classList.add('animating');
    }
}

function closeStory() {
    if(PS_DOM.storyViewer) {
        PS_DOM.storyViewer.classList.remove('active');
        if(PS_DOM.storyProgress) PS_DOM.storyProgress.classList.remove('animating');
    }
}

window.toggleStoryEmoji = function() {
    if(PS_DOM.storyEmojiPicker) {
        PS_DOM.storyEmojiPicker.classList.toggle('active');
    }
}

window.addStoryEmoji = function(emoji) {
    if(PS_DOM.storyCommentInput) {
        PS_DOM.storyCommentInput.value += emoji;
        PS_DOM.storyCommentInput.focus();
    }
}

window.sendStoryComment = function() {
    const text = PS_DOM.storyCommentInput ? PS_DOM.storyCommentInput.value.trim() : "";
    if(!text) return;
    
    showToast("Reply Sent! ✨");
    PS_DOM.storyCommentInput.value = "";
    if(PS_DOM.storyEmojiPicker) PS_DOM.storyEmojiPicker.classList.remove('active');
}

window.openAddStory = function() {
    if(PS_DOM.addStoryModal) PS_DOM.addStoryModal.classList.add('active');
}

window.closeAddStory = function() {
    if(PS_DOM.addStoryModal) PS_DOM.addStoryModal.classList.remove('active');
}

window.appendEmoji = function(emoji) {
    if(PS_DOM.storyInput) {
        PS_DOM.storyInput.value += emoji;
        PS_DOM.storyInput.focus();
    }
}

window.postNewStory = function() {
    const text = PS_DOM.storyInput ? PS_DOM.storyInput.value.trim() : "";
    if(!text) {
        showToast("Please write something!");
        return;
    }

    if(PS_DOM.storiesContainer) {
        const newStoryHtml = `
            <div class="ps-story-item" onclick="openStory('You', '#00aff0')">
                <div class="ps-story-ring">
                    <img class="ps-story-img" src="assets/images/truematch-mark.png" style="background:#00aff0">
                </div>
                <span class="ps-story-name" style="font-size:0.7rem;">You</span>
            </div>`;
        
        PS_DOM.storiesContainer.insertAdjacentHTML('afterbegin', newStoryHtml);
    }
    
    showToast("Moment Shared!");
    if(PS_DOM.storyInput) PS_DOM.storyInput.value = ""; 
    closeAddStory();
}

// ---------------------------------------------------------------------
// POPULATE MOCK CONTENT
// ---------------------------------------------------------------------
function populateMockContent(opts = {}) {
    const userName = (opts && opts.userName ? String(opts.userName) : "Member");
    const defaultAvatar = (opts && opts.avatarUrl ? String(opts.avatarUrl) : "assets/images/truematch-mark.png");
    if(PS_DOM.miniAvatar) PS_DOM.miniAvatar.src = defaultAvatar;
    if(PS_DOM.miniName) PS_DOM.miniName.textContent = userName;
    if(PS_DOM.headerAvatar) PS_DOM.headerAvatar.src = defaultAvatar;
    if(PS_DOM.headerName) PS_DOM.headerName.textContent = userName;


    const menuNameEl = document.getElementById('psMenuName');
    if(menuNameEl) menuNameEl.textContent = userName;
    if(PS_DOM.dailyPickContainer) {
        const color = getRandomColor();
        PS_DOM.dailyPickContainer.innerHTML = `
            <div class="ps-hero-card" style="background-image: url('${defaultAvatar}'); background-color: ${color};">
                <div class="ps-hero-content">
                    <span class="ps-hero-badge">Daily Top Pick</span>
                    <h2 style="margin:0; color:#fff; text-shadow:0 2px 5px rgba(0,0,0,0.8);">Anastasia, 23</h2>
                    <p style="margin:0; color:#eee;">Model • 3km away</p>
                </div>
            </div>
        `;
    }

    if (PS_DOM.storiesContainer) {
        const stories = ['Elena', 'Marco', 'Sarah', 'James', 'Pia'];
        let html = '';
        stories.forEach(name => {
            const color = getRandomColor();
            html += `
            <div class="ps-story-item" onclick="openStory('${name}', '${color}')">
                <div class="ps-story-ring">
                    <img class="ps-story-img" src="${defaultAvatar}" style="background:${color}">
                </div>
                <span class="ps-story-name" style="font-size:0.7rem;">${name}</span>
            </div>`;
        });
        PS_DOM.storiesContainer.innerHTML = html;
        if(PS_DOM.momentsPopup) {
            document.getElementById('psMobileStoriesContainer').innerHTML = html;
        }
    }

    if (PS_DOM.admirerContainer) {
        const admirers = [{ name: 'Secret', loc: 'Nearby' }, { name: 'Secret', loc: '5km away' }, { name: 'Secret', loc: 'City Center' }, { name: 'Secret', loc: '10km away' }];
        if(PS_DOM.admirerCount) PS_DOM.admirerCount.textContent = `${admirers.length} New`;
        let html = '';
        admirers.forEach(adm => {
            html += `
            <div class="ps-admirer-card" onclick="document.querySelector('[data-panel=premium]').click()">
                <div class="ps-admirer-icon"><i class="fa-solid fa-lock"></i></div>
                <img class="ps-admirer-img" src="${defaultAvatar}" style="background:${getRandomColor()}">
                <h4 style="margin:0; font-size:0.9rem;">${adm.name}</h4>
                <p class="ps-tiny ps-muted" style="margin:2px 0 0;">${adm.loc}</p>
            </div>`;
        });
        PS_DOM.admirerContainer.innerHTML = html;
    }

    // -----------------------------------------------------------------
    // UPDATED MATCHES & MESSAGES POPULATION WITH ONCLICK
    // -----------------------------------------------------------------
    if (PS_DOM.matchesContainer && PS_DOM.newMatchesRail) {
        // Data
        const newMatches = [
            { name: 'Kyla', imgColor: '#FFD700' },
            { name: 'Chloe', imgColor: '#ff3366' },
            { name: 'Bea', imgColor: '#00aff0' },
            { name: 'Marga', imgColor: '#800080' },
        ];
        
        const messages = [
            { name: 'Victoria', msg: 'See you later! 👋', time: '2m', unread: true },
            { name: 'Alexander', msg: 'That sounds like a great plan.', time: '1h', unread: false },
            { name: 'Sophia', msg: 'Sent a photo', time: '3h', unread: false },
            { name: 'Liam', msg: 'Haha, exactly!', time: '1d', unread: false }
        ];

        // Render New Matches (Horizontal Rail)
        if(PS_DOM.newMatchCount) PS_DOM.newMatchCount.textContent = newMatches.length;
        let railHtml = '';
        newMatches.forEach(m => {
            railHtml += `
            <div class="ps-new-match-item" onclick="openChat('${m.name}')">
                <div class="ps-match-ring">
                    <img class="ps-match-avatar" src="${defaultAvatar}" style="background:${m.imgColor}">
                </div>
                <span class="ps-match-name-sm">${m.name}</span>
            </div>`;
        });
        PS_DOM.newMatchesRail.innerHTML = railHtml;

        // Render Messages (Vertical List)
        let listHtml = '';
        messages.forEach(m => {
            const unreadClass = m.unread ? 'unread' : '';
            const unreadDot = m.unread ? `<div class="ps-msg-unread-dot"></div>` : '';
            
            listHtml += `
            <div class="ps-message-item ${unreadClass}" onclick="openChat('${m.name}')">
                <div class="ps-msg-avatar-wrapper">
                    <img class="ps-msg-avatar" src="${defaultAvatar}" style="background:${getRandomColor()}">
                    <div class="ps-online-badge"></div>
                </div>
                <div class="ps-msg-content">
                    <div class="ps-msg-header">
                        <span class="ps-msg-name">${m.name}</span>
                        <span class="ps-msg-time">${m.time}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="ps-msg-preview">${m.msg}</span>
                        ${unreadDot}
                    </div>
                </div>
            </div>`;
        });
        PS_DOM.matchesContainer.innerHTML = listHtml;
    }

    if (PS_DOM.activeNearbyContainer) {
        let html = '';
        for(let i=0; i<6; i++) {
            const color = getRandomColor();
            html += `
            <div class="ps-active-item">
                <img class="ps-active-img" src="${defaultAvatar}" style="background:${color}">
                <div style="position:absolute; bottom:5px; right:5px; width:10px; height:10px; background:#00ff88; border-radius:50; border:2px solid #000;"></div>
            </div>`;
        }
        PS_DOM.activeNearbyContainer.innerHTML = html;
    }

    if(PS_DOM.panelCreatorsBody) {
        PS_DOM.panelCreatorsBody.innerHTML = `<div class="ps-feed-header">Creators</div><div class="ps-matches-grid" style="grid-template-columns: repeat(2, 1fr); padding:20px;"><div class="ps-creator-card" style="background: linear-gradient(135deg, #4b0082, #800080);"><h3 style="margin:0; color:#fff;">Sasha <i class="fa-solid fa-circle-check" style="color:#00aff0"></i></h3><p class="ps-tiny">Elite Model</p><button class="ps-btn-white" style="margin-top:auto;">View</button></div></div>`;
    }
    if(PS_DOM.panelPremiumBody) {
    psRenderPremiumSocietyPanel();
}

// Premium Society swiping is ONLY available to approved members (active Elite/Concierge + approved application).
if (PS_STATE.premiumSociety.approved) {
    if (PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = '';
    if (!PS_STATE.swipeInited) {
        PS_STATE.swipeInited = true;
        SwipeController.init();
    }
} else {
    psRenderPremiumSocietyLockedDeck();
}
}

// ---------------------------------------------------------------------
// SWIPE CONTROLLER (PERSISTENT LOGIC & TIMER)
// ---------------------------------------------------------------------
const SwipeController = (() => {
    // NOTE:
    // - Unlimited swipes for Premium members (paid plan + active).
    // - Free / inactive users are capped server-side (STRICT_DAILY_LIMIT in server.js).
    // - This page pulls real candidates from /api/premium-society/candidates and saves swipes to /api/premium-society/action.

    const IS_DEV_MOCK = ['localhost', '127.0.0.1'].includes(window.location.hostname) || new URLSearchParams(window.location.search).get('mock') === '1';

    const fallbackCandidates = [
        { id: 'fallback1@example.com', name: 'Isabella', age: 24, city: 'Manila', photoUrl: '', tags: ['Travel', 'Music'] },
        { id: 'fallback2@example.com', name: 'Christian', age: 29, city: 'Cebu', photoUrl: '', tags: ['Tech', 'Coffee'] },
        { id: 'fallback3@example.com', name: 'Natalia', age: 26, city: 'Davao', photoUrl: '', tags: ['Art', 'Movies'] },
        { id: 'fallback4@example.com', name: 'Sophia', age: 22, city: 'Baguio', photoUrl: '', tags: ['Nature', 'Hiking'] },
        { id: 'fallback5@example.com', name: 'Marco', age: 27, city: 'Makati', photoUrl: '', tags: ['Fitness', 'Gaming'] }
    ];

    let candidates = [];
    let currentIndex = 0;
    let isSwiping = false;

    // Server-provided counters (null = unlimited)
    let remaining = null;
    let limit = null;
    let limitReached = false;

    function normalizeCandidate(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const id = String(raw.id || raw.email || raw.targetEmail || '').trim();
        const name = String(raw.name || raw.fullName || 'Unknown').trim();
        const age = Number(raw.age || raw.userAge || 0) || '';
        const city = String(raw.city || raw.location || '').trim();
        const photoUrl = String(raw.photoUrl || raw.photoURL || raw.avatarUrl || raw.avatar || raw.photo || '').trim();
        const tags = Array.isArray(raw.tags) ? raw.tags : [];
        return { id, name, age, city, photoUrl, tags };
    }

    async function fetchDeck() {
        // Hide empty deck popover while loading a fresh deck
        if (PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove('active');

        try {
            const res = await fetch('/api/premium-society/candidates', { credentials: 'same-origin' });
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            const data = ct.includes('application/json') ? await res.json() : null;

            if (!data || data.ok !== true) {
                throw new Error((data && (data.error || data.message)) || 'Failed to load candidates');
            }

            const list = Array.isArray(data.candidates) ? data.candidates : [];
            candidates = list.map(normalizeCandidate).filter(Boolean);

            currentIndex = 0;

            remaining = (data.remaining === null || data.remaining === undefined) ? null : Number(data.remaining);
            limit = (data.limit === null || data.limit === undefined) ? null : Number(data.limit);
            limitReached = Boolean(data.limitReached);

            // Update UI counters
            updateStats(remaining, limit);

            if (limitReached) {
                // Free user hit the cap (server-side)
                showToast('You’ve hit your daily swipe limit.');
                candidates = [];
            }

            renderCards();
            return;
        } catch (err) {
            console.warn('[premium-society] fetchDeck failed:', err);
            if (!PS_STATE.premiumSociety.approved) {
                showToast('Premium Society is locked.');
                candidates = [];
                psRenderPremiumSocietyLockedDeck();
                return;
            }

            if (IS_DEV_MOCK) {
                showToast('Could not load live deck. Using fallback profiles (mock).');
                candidates = fallbackCandidates.map(normalizeCandidate).filter(Boolean);
            } else {
                showToast('Could not load live deck. Please refresh.');
                candidates = [];
            }
            currentIndex = 0;
            remaining = null;
            limit = null;
            limitReached = false;
            updateStats(remaining, limit);
            renderCards();
        }
    }

    function createCard(person, position, index) {
        const card = document.createElement('div');
        card.className = 'ps-swipe-card';
        card.dataset.pos = position;

        // Prefer real profile photo if present, otherwise fallback to gradient
        if (person.photoUrl) {
            card.style.backgroundImage = `url('${person.photoUrl.replace(/'/g, "\\'")}')`;
        } else {
            card.style.backgroundImage = `linear-gradient(135deg, ${getRandomColor()}, #000)`;
        }

        const tags = Array.isArray(person.tags) ? person.tags : [];
        const tagHtml = tags.slice(0, 3).map(t => `<span class="ps-tag">${t}</span>`).join('');

        card.innerHTML = `
            <div class="ps-swipe-card-info">
                <h2>${person.name}${person.age ? `, ${person.age}` : ''}</h2>
                <p>${person.city || '—'}</p>
                ${tagHtml ? `<div class="ps-tags">${tagHtml}</div>` : ``}
            </div>
        `;

        // For debugging / future profile modal
        card.dataset.email = person.id || '';
        card.dataset.index = String(index);

        return card;
    }

    function renderCards() {
        if (!PS_DOM.swipeStack) return;

        PS_DOM.swipeStack.innerHTML = '';

        const remainingCards = candidates.slice(currentIndex, currentIndex + 3);
        if (remainingCards.length === 0) {
            psSetSwipeControlsEmpty(true);
            return;
        }
        psSetSwipeControlsEmpty(false);
// Order: left, center, right
        remainingCards.forEach((person, i) => {
            const position = ['left', 'center', 'right'][i] || 'center';
            const card = createCard(person, position, currentIndex + i);
            if (position === 'center') card.id = 'activeSwipeCard';
            PS_DOM.swipeStack.appendChild(card);
        });
    }

    async function sendSwipe(targetEmail, action) {
        const payload = {
            targetEmail: String(targetEmail || '').trim().toLowerCase(),
            action: action
        };

        const res = await fetch('/api/premium-society/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        const data = ct.includes('application/json') ? await res.json() : null;

        if (!data || data.ok !== true) {
            const reason = (data && (data.error || data.message)) || 'Swipe failed';
            throw new Error(reason);
        }

        // Update counters (server source of truth)
        remaining = (data.remaining === null || data.remaining === undefined) ? null : Number(data.remaining);
        limit = (data.limit === null || data.limit === undefined) ? null : Number(data.limit);
        limitReached = Boolean(data.limitReached);

        updateStats(remaining, limit);

        return data;
    }

    async function handleSwipe(action) {
        if (isSwiping) return;
        if (limitReached) {
            showToast('Daily limit reached.');
            return;
        }

        const person = candidates[currentIndex];
        if (!person) return;

        const card = document.getElementById('activeSwipeCard');
        if (!card) return;

        isSwiping = true;

        // Animate card
        const direction = action === 'pass' ? -1 : 1;
        card.style.transform = `translateX(${direction * 400}px) rotate(${direction * 15}deg)`;
        card.style.opacity = '0';

        try {
            const resp = await sendSwipe(person.id, action);

            // Match feedback
            if (resp.isMatch) {
                // Keep it simple: show an alert with their name
                try {
                    Swal.fire({
                        title: "It's a Match! ✨",
                        text: `You and ${person.name} liked each other.`,
                        icon: 'success',
                        background: '#0b0b0f',
                        color: '#fff',
                        confirmButtonColor: '#ffd700'
                    });
                } catch (_) {}
            }

            if (resp.limitReached) {
                showToast('You’ve hit your daily swipe limit.');
            }
        } catch (err) {
            console.warn('[premium-society] swipe failed:', err);

            // Revert animation if the server rejected the swipe
            card.style.transform = '';
            card.style.opacity = '1';

            const msg = String(err && err.message ? err.message : err || 'Swipe failed');

            // If server says you are not allowed (not premium), redirect to dashboard
            if (msg.includes('not_premium') || msg.includes('target_not_premium')) {
                showToast('Premium access required for Premium Society swipes.');
            } else if (msg.includes('limit')) {
                showToast('Daily swipe limit reached.');
            } else {
                showToast('Could not save swipe. Try again.');
            }

            isSwiping = false;
            return;
        }

        // Move to next candidate
        setTimeout(() => {
            currentIndex += 1;
            renderCards();
            isSwiping = false;
        }, 250);
    }

    function bindControls() {
        if (PS_DOM.btnSwipeLike) PS_DOM.btnSwipeLike.addEventListener('click', () => handleSwipe('like'));
        if (PS_DOM.btnSwipePass) PS_DOM.btnSwipePass.addEventListener('click', () => handleSwipe('pass'));
        if (PS_DOM.btnSwipeSuper) PS_DOM.btnSwipeSuper.addEventListener('click', () => handleSwipe('super'));

        if (PS_DOM.btnRefreshDeck) PS_DOM.btnRefreshDeck.addEventListener('click', () => fetchDeck());
    }

    async function init() {
        bindControls();
        await fetchDeck();
    }

    return { init };
})();

// ---------------------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------------------
function initNavigation() {
    PS_DOM.tabs.forEach(tab => {
        if(tab.dataset.panel) {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(tab.dataset.panel);
            });
        }
    });
}

function switchTab(panelName) {
    localStorage.setItem('ps_last_tab', panelName);

    PS_DOM.tabs.forEach(t => {
        if(t.dataset.panel === panelName) t.classList.add('ps-is-active');
        else t.classList.remove('ps-is-active');
    });

    PS_DOM.panels.forEach(p => {
        if(p.dataset.panel === panelName) {
            p.classList.add('ps-is-active');
            p.style.display = (panelName === 'home') ? 'flex' : 'block';
            window.scrollTo({top:0, behavior:'smooth'});
        } else {
            p.classList.remove('ps-is-active');
            p.style.display = 'none';
        }
    });

    if(PS_DOM.sidebar.classList.contains('ps-is-open')) {
        PS_DOM.sidebar.classList.remove('ps-is-open');
    }
}

function initMobileMenu() {
    if(PS_DOM.mobileMenuBtn) {
        PS_DOM.mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (PS_DOM.momentsPopup) PS_DOM.momentsPopup.classList.remove('ps-is-open');
            if (PS_DOM.sidebar) PS_DOM.sidebar.classList.toggle('ps-is-open');
        });
    }
    if(PS_DOM.mobileMomentsBtn) {
        PS_DOM.mobileMomentsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (PS_DOM.sidebar) PS_DOM.sidebar.classList.remove('ps-is-open');
            if (PS_DOM.momentsPopup) PS_DOM.momentsPopup.classList.toggle('ps-is-open');
        });
    }
}

function initCanvasParticles() {
    const canvas = document.getElementById('ps-bg-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, pts = [];

    function resize() { 
        W = canvas.width = window.innerWidth; 
        H = canvas.height = window.innerHeight; 
        pts = []; 
        for(let i=0; i<40; i++) pts.push({
            x:Math.random()*W, y:Math.random()*H, 
            vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5
        }); 
    }

    function loop() { 
        ctx.clearRect(0,0,W,H); 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; 
        pts.forEach(p => { 
            p.x += p.vx; p.y += p.vy; 
            if(p.x<0 || p.x>W) p.vx*=-1; 
            if(p.y<0 || p.y>H) p.vy*=-1; 
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill(); 
        }); 
        requestAnimationFrame(loop); 
    }
    window.addEventListener('resize', resize); 
    resize(); loop();
}

function updateStats(remaining, limit) {
    // Remaining/limit are server truth. limit === null means "unlimited".
    const countEl = document.getElementById('psMobileSwipeCount');
    const labelEl = document.getElementById('psMobileSwipeLabel');

    if (limit === null) {
        if (countEl) countEl.textContent = '∞';
        if (labelEl) labelEl.textContent = 'Unlimited';
        if (PS_DOM.countDisplay) PS_DOM.countDisplay.textContent = '∞';
        if (PS_DOM.timerDisplay) PS_DOM.timerDisplay.textContent = 'Unlimited swipes';
        if (PS_DOM.ringCircle) {
            PS_DOM.ringCircle.style.strokeDasharray = 314;
            PS_DOM.ringCircle.style.strokeDashoffset = 0; // full ring
        }
        return;
    }

    const rem = Number.isFinite(remaining) ? Math.max(0, Math.floor(remaining)) : 0;
    const lim = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 20;

    if (countEl) countEl.textContent = String(rem);
    if (labelEl) labelEl.textContent = 'Left';

    if (PS_DOM.countDisplay) PS_DOM.countDisplay.textContent = String(rem);
    if (PS_DOM.timerDisplay) PS_DOM.timerDisplay.textContent = `Daily limit: ${lim}`;

    if (PS_DOM.ringCircle) {
        const percent = Math.min(1, rem / lim);
        PS_DOM.ringCircle.style.strokeDasharray = 314;
        PS_DOM.ringCircle.style.strokeDashoffset = 314 - (314 * percent);
    }
}
