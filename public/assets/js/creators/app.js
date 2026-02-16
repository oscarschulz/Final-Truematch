import { DOM } from './dom.js';
import { initHome } from './home.js';
import { initNotifications } from './notifications.js';
import { initMessages } from './message.js';
import { initCollections, renderCollections, updateRightSidebarContent } from './collections.js'; 
import { initWallet } from './wallet.js';
import { loadView } from './loader.js';
import { initSettings } from './settings.js';
import { initProfilePage } from './profile.js'; // Import logic
import { COLLECTIONS_DB, DEFAULT_AVATAR, getMySubscriptions } from './data.js';

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



function tmSetPacked(packed, label, value) {
  const want = String(label || '').trim().toLowerCase();
  const v = (value === null || value === undefined) ? '' : String(value);
  const segs = tmSplitPipes(packed);
  let found = false;
  const out = segs.map(seg => {
    const idx = seg.indexOf(':');
    if (idx === -1) return seg;
    const key = seg.slice(0, idx).trim().toLowerCase();
    if (key !== want) return seg;
    found = true;
    return `${label}: ${v}`.trim();
  }).filter(Boolean);

  if (!found) {
    out.push(`${label}: ${v}`.trim());
  }

  // Remove empty values
  const cleaned = out.filter(s => {
    const idx = s.indexOf(':');
    if (idx === -1) return true;
    const val = s.slice(idx + 1).trim();
    return val.length > 0;
  });

  return cleaned.join(' | ');
}

let tmMeCache = null;
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
  tmMeCache = user;
  try { window.__tmMe = user; } catch {}

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

  // Apply saved creator status
  try { tmApplyCreatorStatus(user?.creatorStatus || user?.status || 'Available'); } catch {}

  if (bio && bio.trim()) tmSetText('#view-my-profile .profile-bio-text', bio);
  tmSetSrc('#view-my-profile .profile-avatar-main', user.avatarUrl);
  tmSetBgImage('#view-my-profile .profile-header-bg', user.headerUrl);
// Local header fallback (client-side)
try {
  const k = `tm_creator_header_${String(user?.email || '').toLowerCase()}`;
  const localHdr = window.localStorage ? (window.localStorage.getItem(k) || '') : '';
  if ((!user.headerUrl || !String(user.headerUrl).trim()) && localHdr) {
    tmSetBgImage('#view-my-profile .profile-header-bg', localHdr);
  }
} catch {}

  // Optional: show the rest of the application details under the bio
  tmUpsertCreatorMetaBlock(meta);
}


// =============================================================
// CREATOR ACCESS PAYWALL (Creator Access plan)
// - If user.hasCreatorAccess is false → show payment modal
// - Proceed to Pay → create Coinbase charge (planKey: creator_access) and redirect
// - Cancel → redirect back to dashboard
// =============================================================
const tmPaywallState = { bound: false };

function tmHasCreatorAccess() {
  const u = tmMeCache || (typeof window !== 'undefined' ? window.__tmMe : null) || null;
  return !!(u && u.hasCreatorAccess);
}

function tmShowCreatorAccessModal() {
  const modal = DOM.paymentModal;
  if (!modal) return;
  modal.classList.add('is-visible');
  modal.setAttribute('aria-hidden', 'false');
}

function tmHideCreatorAccessModal() {
  const modal = DOM.paymentModal;
  if (!modal) return;
  modal.classList.remove('is-visible');
  modal.setAttribute('aria-hidden', 'true');
}

function tmHandleCreatorAccessCancel() {
  // Hard gate: leave creators page
  try { tmHideCreatorAccessModal(); } catch {}
  try { window.location.href = 'dashboard.html'; } catch (_) {}
}

async function tmStartCreatorAccessPayment() {
  const btn = DOM.btnPayConfirm;
  const btnCancel = DOM.btnPayCancel;
  const prevText = btn ? btn.textContent : '';

  try {
    if (btn) { btn.disabled = true; btn.textContent = 'Redirecting...'; }
    if (btnCancel) btnCancel.disabled = true;

    const res = await fetch('/api/coinbase/create-charge', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey: 'creator_access' })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || data.ok !== true || !data.url) {
      throw new Error(data?.message || data?.error || 'Unable to start payment');
    }

    window.location.href = data.url;
  } catch (err) {
    console.error(err);
    try { TopToast.fire({ icon: 'error', title: err?.message || 'Unable to start payment' }); } catch (_) {}
    if (btn) { btn.disabled = false; btn.textContent = prevText || 'Proceed to Pay'; }
    if (btnCancel) btnCancel.disabled = false;
  }
}

function tmBindCreatorAccessPaywall() {
  if (tmPaywallState.bound) return;
  tmPaywallState.bound = true;

  const modal = DOM.paymentModal;
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) tmHandleCreatorAccessCancel();
    });
  }

  if (DOM.btnPayConfirm) DOM.btnPayConfirm.addEventListener('click', (e) => { e.preventDefault(); tmStartCreatorAccessPayment(); });
  if (DOM.btnPayCancel) DOM.btnPayCancel.addEventListener('click', (e) => { e.preventDefault(); tmHandleCreatorAccessCancel(); });

  // Allow any module to request the modal
  window.addEventListener('tm:request-creator-access', () => tmShowCreatorAccessModal());
}

function tmEnforceCreatorAccess() {
  if (tmHasCreatorAccess()) {
    tmHideCreatorAccessModal();
    return;
  }
  tmShowCreatorAccessModal();
}



// =============================================================
// DATA #3 — BANK DETAILS (Become a Creator)
// - Bio text + live char count
// - Header + Avatar image picker (client preview)
// - Save → /api/me/profile (avatar) + /api/me/creator/profile (bio)
// - Header image is stored client-side (until backend field exists)
// =============================================================
const tmBankState = {
  uiReady: false,
  saving: false,
  initialBio: '',
  pendingAvatarDataUrl: '',
  pendingHeaderDataUrl: '',
  lastEmail: ''
};

const tmBankUI = {
  view: null,
  bio: null,
  count: null,
  saveBtn: null,
  header: null,
  headerCam: null,
  avatar: null,
  avatarCam: null,
  avatarSpan: null,
  avatarImg: null,
  inputAvatar: null,
  inputHeader: null
};

function tmBankHeaderKey(email) {
  const e = String(email || '').toLowerCase();
  return e ? `tm_creator_header_${e}` : 'tm_creator_header';
}

function tmGetMeUser() {
  try { return tmMeCache || window.__tmMe || null; } catch { return tmMeCache || null; }
}

function tmGetMeBio() {
  const u = tmGetMeUser();
  const packed = u?.creatorApplication?.contentStyle || '';
  return tmGetPacked(packed, 'Bio') || '';
}

function tmInitials(name) {
  const s = String(name || '').trim();
  if (!s) return 'ME';
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : (parts[0]?.[1] || '');
  return (a + b).toUpperCase() || 'ME';
}

function tmEnsureBankingUI() {
  if (tmBankState.uiReady) return true;

  tmBankUI.view = document.getElementById('view-become-creator');
  if (!tmBankUI.view) return false;

  tmBankUI.bio = document.getElementById('setup-bio');
  tmBankUI.count = tmBankUI.view.querySelector('.char-count');
  tmBankUI.saveBtn = tmBankUI.view.querySelector('.btn-save-setup');

  tmBankUI.header = tmBankUI.view.querySelector('.setup-header-img');
  tmBankUI.headerCam = tmBankUI.header ? tmBankUI.header.querySelector('.cam-circle') : null;

  tmBankUI.avatar = tmBankUI.view.querySelector('.setup-avatar-placeholder');
  tmBankUI.avatarCam = tmBankUI.avatar ? tmBankUI.avatar.querySelector('.avatar-cam-overlay') : null;
  tmBankUI.avatarSpan = tmBankUI.avatar ? tmBankUI.avatar.querySelector('span') : null;

  // Hidden inputs
  const mkInput = (name) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.display = 'none';
    inp.setAttribute('aria-hidden', 'true');
    inp.dataset.tm = name;
    tmBankUI.view.appendChild(inp);
    return inp;
  };
  tmBankUI.inputAvatar = mkInput('avatar');
  tmBankUI.inputHeader = mkInput('header');

  tmBankState.uiReady = true;
  return true;
}

function tmUpdateBioCount() {
  if (!tmBankUI.bio || !tmBankUI.count) return;
  const n = String(tmBankUI.bio.value || '').length;
  tmBankUI.count.textContent = `${n}/1000`;
}

function tmApplyHeaderPreview(dataUrl) {
  if (!tmBankUI.header) return;
  if (dataUrl) {
    tmBankUI.header.style.backgroundImage = `url('${dataUrl}')`;
    tmBankUI.header.style.backgroundSize = 'cover';
    tmBankUI.header.style.backgroundPosition = 'center';
  } else {
    tmBankUI.header.style.backgroundImage = '';
  }
}

function tmApplyAvatarPreview(dataUrl) {
  if (!tmBankUI.avatar) return;

  // Create / reuse <img> inside placeholder
  if (!tmBankUI.avatarImg) {
    const img = document.createElement('img');
    img.alt = 'Avatar';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.style.position = 'absolute';
    img.style.inset = '0';
    img.style.zIndex = '0';
    tmBankUI.avatar.insertBefore(img, tmBankUI.avatar.firstChild);
    tmBankUI.avatarImg = img;
  }

  if (dataUrl) {
    tmBankUI.avatarImg.src = dataUrl;
    if (tmBankUI.avatarSpan) tmBankUI.avatarSpan.style.visibility = 'hidden';
  } else {
    tmBankUI.avatarImg.removeAttribute('src');
    if (tmBankUI.avatarSpan) tmBankUI.avatarSpan.style.visibility = 'visible';
  }
}

function tmHasBankingChanges() {
  const bioNow = String(tmBankUI.bio?.value || '').trim();
  const bioChanged = bioNow !== String(tmBankState.initialBio || '').trim();
  return !!(bioChanged || tmBankState.pendingAvatarDataUrl || tmBankState.pendingHeaderDataUrl);
}

function tmSetBankingSaveEnabled() {
  if (!tmBankUI.saveBtn) return;
  const can = tmHasBankingChanges() && !tmBankState.saving;
  tmBankUI.saveBtn.disabled = !can;
}

function tmReadFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Unable to read image'));
    fr.readAsDataURL(file);
  });
}

function tmDownscaleDataUrl(dataUrl, maxDim = 512, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w0 = img.naturalWidth || img.width || 0;
      const h0 = img.naturalHeight || img.height || 0;
      if (!w0 || !h0) return resolve(String(dataUrl || ''));

      const scale = Math.min(1, maxDim / Math.max(w0, h0));
      const w = Math.max(1, Math.round(w0 * scale));
      const h = Math.max(1, Math.round(h0 * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      // Use JPEG for size
      const out = canvas.toDataURL('image/jpeg', quality);
      resolve(out);
    };
    img.onerror = () => reject(new Error('Invalid image file'));
    img.src = String(dataUrl || '');
  });
}

async function tmCompressImageFile(file, { maxDim = 512, quality = 0.82 } = {}) {
  const raw = await tmReadFileAsDataUrl(file);
  return tmDownscaleDataUrl(raw, maxDim, quality);
}

async function tmPostJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.ok !== true) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ---------------- Support (Email-only) ----------------
// Opens a lightweight support email modal and sends to backend /api/support/email
function tmSupportEnsureEmailModal() {
  const existing = document.getElementById('tm-support-email-modal');
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.id = 'tm-support-email-modal';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '18px';
  overlay.style.background = 'rgba(0,0,0,0.62)';

  overlay.innerHTML = `
    <div style="width: min(560px, 100%); border-radius: 18px; border: 1px solid rgba(255,255,255,0.10); background: rgba(7,11,18,0.98); box-shadow: 0 22px 80px rgba(0,0,0,0.55);">
      <div style="display:flex; align-items:center; justify-content:space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div style="font-weight: 900; letter-spacing: 0.2px;">Support (Email)</div>
        <button type="button" id="tm-support-email-close" style="border: 1px solid rgba(255,255,255,0.14); background: transparent; color: #fff; width: 34px; height: 34px; border-radius: 12px; cursor:pointer;">✕</button>
      </div>
      <div style="padding: 14px 16px; display:flex; flex-direction:column; gap: 10px;">
        <div style="font-size:12px; color: rgba(255,255,255,0.68); line-height: 1.45;">
          Send us a support email. We’ll reply to your account email.
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:12px; color: rgba(255,255,255,0.75); font-weight:800;">Subject</label>
          <input id="tm-support-email-subject" type="text" placeholder="e.g. Billing issue / App bug / Account" 
            style="width:100%; padding: 12px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); color:#fff; outline:none;" />
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:12px; color: rgba(255,255,255,0.75); font-weight:800;">Message</label>
          <textarea id="tm-support-email-message" rows="6" placeholder="Describe the issue clearly. Include what you expected vs what happened."
            style="width:100%; padding: 12px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); color:#fff; outline:none; resize: vertical;"></textarea>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div id="tm-support-email-count" style="font-size:11px; color: rgba(255,255,255,0.55);">0/5000</div>
            <div style="font-size:11px; color: rgba(255,255,255,0.55);">Tip: include screenshots link if any.</div>
          </div>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; padding-top: 4px;">
          <button type="button" id="tm-support-email-cancel"
            style="padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color:#fff; font-weight:900; cursor:pointer;">Cancel</button>
          <button type="button" id="tm-support-email-send"
            style="padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(100,233,238,0.28); background: rgba(100,233,238,0.10); color: var(--primary-cyan, #64E9EE); font-weight: 950; cursor:pointer;">Send</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => tmSupportCloseEmailModal();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const btnX = overlay.querySelector('#tm-support-email-close');
  const btnCancel = overlay.querySelector('#tm-support-email-cancel');
  if (btnX) btnX.addEventListener('click', close);
  if (btnCancel) btnCancel.addEventListener('click', close);

  const msg = overlay.querySelector('#tm-support-email-message');
  const count = overlay.querySelector('#tm-support-email-count');
  if (msg && count) {
    const updateCount = () => {
      const v = String(msg.value || '');
      count.textContent = `${Math.min(v.length, 5000)}/5000`;
    };
    msg.addEventListener('input', updateCount);
    updateCount();
  }

  const btnSend = overlay.querySelector('#tm-support-email-send');
  if (btnSend) {
    btnSend.addEventListener('click', async () => {
      const subjEl = overlay.querySelector('#tm-support-email-subject');
      const msgEl = overlay.querySelector('#tm-support-email-message');
      const subject = String(subjEl?.value || '').trim();
      const message = String(msgEl?.value || '').trim();

      if (!subject || !message) {
        try { TopToast.fire({ icon: 'error', title: 'Please fill subject and message' }); } catch (_) {}
        return;
      }
      if (subject.length > 120) {
        try { TopToast.fire({ icon: 'error', title: 'Subject too long (max 120 chars)' }); } catch (_) {}
        return;
      }
      if (message.length > 5000) {
        try { TopToast.fire({ icon: 'error', title: 'Message too long (max 5000 chars)' }); } catch (_) {}
        return;
      }

      // Disable while sending
      btnSend.disabled = true;
      btnSend.style.opacity = '0.6';
      btnSend.style.cursor = 'not-allowed';

      try {
        await tmPostJson('/api/support/email', {
          subject,
          message,
          page: String(location?.href || ''),
          meta: {
            ua: navigator.userAgent || '',
            tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
            lang: navigator.language || ''
          }
        });

        try { TopToast.fire({ icon: 'success', title: 'Support email sent' }); } catch (_) {}
        try { subjEl.value = ''; msgEl.value = ''; } catch (_) {}
        tmSupportCloseEmailModal();
      } catch (err) {
        console.error(err);
        const msg = String(err?.message || 'Unable to send email');
        try { TopToast.fire({ icon: 'error', title: msg }); } catch (_) {}
      } finally {
        btnSend.disabled = false;
        btnSend.style.opacity = '';
        btnSend.style.cursor = 'pointer';
      }
    });
  }

  return overlay;
}

function tmSupportOpenEmailModal(prefill = {}) {
  const overlay = tmSupportEnsureEmailModal();
  const subjEl = overlay.querySelector('#tm-support-email-subject');
  const msgEl = overlay.querySelector('#tm-support-email-message');
  try {
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');

    if (subjEl && !subjEl.value) {
      subjEl.value = String(prefill.subject || 'Support request');
    }
    if (msgEl && !msgEl.value) {
      const hint = prefill.message ? String(prefill.message) : '';
      msgEl.value = hint;
      msgEl.dispatchEvent(new Event('input'));
    }
    window.setTimeout(() => {
      try { (subjEl || msgEl)?.focus(); } catch (_) {}
    }, 20);
  } catch (_) {}
}

function tmSupportCloseEmailModal() {
  const overlay = document.getElementById('tm-support-email-modal');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
}

function tmLoadBankingFromCache() {
  if (!tmEnsureBankingUI()) return;

  const u = tmGetMeUser();
  const bio = tmGetMeBio();

  // Bio
  if (tmBankUI.bio) tmBankUI.bio.value = bio || '';
  tmBankState.initialBio = bio || '';
  tmUpdateBioCount();

  // Initials
  const nm = (document.getElementById('creatorProfileName')?.textContent || u?.name || 'Me');
  if (tmBankUI.avatarSpan) tmBankUI.avatarSpan.textContent = tmInitials(nm);

  // Avatar preview (from me)
  const av = u?.avatarUrl || '';
  tmApplyAvatarPreview(av);

  // Header preview (backend-first; local fallback only if backend is empty)
  try {
    const hdr = String(u?.headerUrl || '').trim();
    if (hdr) {
      tmApplyHeaderPreview(hdr);
    } else {
      const email = u?.email || '';
      const k = tmBankHeaderKey(email);
      const localHdr = window.localStorage ? (window.localStorage.getItem(k) || '') : '';
      if (localHdr) tmApplyHeaderPreview(localHdr);
    }
  } catch {}

  // Reset pending
  tmBankState.pendingAvatarDataUrl = '';
  tmBankState.pendingHeaderDataUrl = '';
  tmSetBankingSaveEnabled();
}

async function tmSaveBanking() {
  if (!tmEnsureBankingUI()) return;
  if (tmBankState.saving) return;

  const u = tmGetMeUser();
  const email = u?.email || '';

  const bioNow = String(tmBankUI.bio?.value || '').trim();
  const bioChanged = bioNow !== String(tmBankState.initialBio || '').trim();

  const hasPending = !!(bioChanged || tmBankState.pendingAvatarDataUrl || tmBankState.pendingHeaderDataUrl);
  if (!hasPending) {
    tmSetBankingSaveEnabled();
    return;
  }

  tmBankState.saving = true;
  if (tmBankUI.saveBtn) {
    tmBankUI.saveBtn.disabled = true;
    tmBankUI.saveBtn.textContent = 'Saving...';
  }

  try {
    // Avatar → backend
    if (tmBankState.pendingAvatarDataUrl) {
      await tmPostJson('/api/me/profile', { avatarDataUrl: tmBankState.pendingAvatarDataUrl });
      tmBankState.pendingAvatarDataUrl = '';
    }

    // Header → backend (+ local fallback cache)
    if (tmBankState.pendingHeaderDataUrl) {
      const hdr = tmBankState.pendingHeaderDataUrl;
      await tmPostJson('/api/me/profile', { headerDataUrl: hdr });
      try {
        const k = tmBankHeaderKey(email);
        window.localStorage && window.localStorage.setItem(k, hdr);
      } catch {}
      tmBankState.pendingHeaderDataUrl = '';
    }

    // Bio → creator application
    if (bioChanged) {
      const prevPacked = u?.creatorApplication?.contentStyle || '';
      const nextPacked = tmSetPacked(prevPacked, 'Bio', bioNow);
      await tmPostJson('/api/me/creator/profile', { contentStyle: nextPacked });
      tmBankState.initialBio = bioNow;
    }

    // Refresh shared UI
    try { await tmHydrateCreatorsFromMe(); } catch {}
    tmLoadBankingFromCache();

    // Let other modules (profile card, header, etc.) refresh if they listen
    try {
      window.dispatchEvent(new CustomEvent('tm:me-updated', { detail: { reason: 'creator_banking_saved' } }));
    } catch (_) {}

    try { TopToast.fire({ icon: 'success', title: 'Saved' }); } catch {}
  } catch (err) {
    console.error('Bank details save error:', err);
    try { TopToast.fire({ icon: 'error', title: err?.message || 'Unable to save' }); } catch {}
  } finally {
    tmBankState.saving = false;
    if (tmBankUI.saveBtn) tmBankUI.saveBtn.textContent = 'Save changes';
    tmSetBankingSaveEnabled();
  }
}

function tmInitBankingView() {
  if (!tmEnsureBankingUI()) return;

  if (tmBankUI.view.dataset.boundBank === '1') return;
  tmBankUI.view.dataset.boundBank = '1';

  // Bio input
  if (tmBankUI.bio) {
    tmBankUI.bio.addEventListener('input', () => {
      tmUpdateBioCount();
      tmSetBankingSaveEnabled();
    });
  }

  // Avatar picker
  const openAvatar = () => tmBankUI.inputAvatar && tmBankUI.inputAvatar.click();
  if (tmBankUI.avatarCam) tmBankUI.avatarCam.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openAvatar(); });
  if (tmBankUI.avatar) tmBankUI.avatar.addEventListener('click', (e) => { if (e.target === tmBankUI.avatarCam) return; openAvatar(); });

  if (tmBankUI.inputAvatar) {
    tmBankUI.inputAvatar.addEventListener('change', async () => {
      const f = tmBankUI.inputAvatar.files && tmBankUI.inputAvatar.files[0];
      tmBankUI.inputAvatar.value = '';
      if (!f) return;
      try {
        const dataUrl = await tmCompressImageFile(f, { maxDim: 512, quality: 0.82 });
        tmBankState.pendingAvatarDataUrl = dataUrl;
        tmApplyAvatarPreview(dataUrl);
        tmSetBankingSaveEnabled();
      } catch (e) {
        try { TopToast.fire({ icon: 'error', title: e?.message || 'Invalid image' }); } catch {}
      }
    });
  }

  // Header picker
  const openHeader = () => tmBankUI.inputHeader && tmBankUI.inputHeader.click();
  if (tmBankUI.headerCam) tmBankUI.headerCam.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openHeader(); });
  if (tmBankUI.header) tmBankUI.header.addEventListener('click', (e) => { if (e.target === tmBankUI.headerCam) return; openHeader(); });

  if (tmBankUI.inputHeader) {
    tmBankUI.inputHeader.addEventListener('change', async () => {
      const f = tmBankUI.inputHeader.files && tmBankUI.inputHeader.files[0];
      tmBankUI.inputHeader.value = '';
      if (!f) return;
      try {
        const dataUrl = await tmCompressImageFile(f, { maxDim: 1200, quality: 0.82 });
        tmBankState.pendingHeaderDataUrl = dataUrl;
        tmApplyHeaderPreview(dataUrl);
        tmSetBankingSaveEnabled();
      } catch (e) {
        try { TopToast.fire({ icon: 'error', title: e?.message || 'Invalid image' }); } catch {}
      }
    });
  }

  // Save
  if (tmBankUI.saveBtn) tmBankUI.saveBtn.addEventListener('click', (e) => { e.preventDefault(); tmSaveBanking(); });

  // Initial load
  tmLoadBankingFromCache();
}

function tmEnterBankingView() {
  // Ensure listeners + load latest cached values
  tmInitBankingView();
  tmLoadBankingFromCache();
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

// =============================================================
// Language (Data #6)
// - Popover Language picker (English / Español / Filipino / Русский)
// - Persist in localStorage (tm_lang)
// - Apply to elements with [data-lang] in creators.html
// =============================================================
const TM_LANG_KEY = 'tm_lang';

const TM_LANGS = {
  en: {
    label: 'English',
    strings: {
      nav_home: 'Home',
      nav_notif: 'Notifications',
      nav_msg: 'Messages',
      nav_col: 'Collections',
      nav_subs: 'Subscriptions',
      nav_card: 'Add card',
      nav_profile: 'My profile',
      nav_more: 'More',
      nav_post: 'NEW POST',

      pop_profile: 'My profile',
      pop_col: 'Collections',
      pop_set: 'Settings',
      pop_cards: 'Your cards',
      pop_cards_sub: '(to subscribe)',
      pop_creator: 'Become a creator',
      pop_creator_sub: '(to earn)',
      pop_help: 'Help and support',
      pop_dark: 'Dark mode',
      pop_logout: 'Log out'
    }
  },
  es: {
    label: 'Español',
    strings: {
      nav_home: 'Inicio',
      nav_notif: 'Notificaciones',
      nav_msg: 'Mensajes',
      nav_col: 'Colecciones',
      nav_subs: 'Suscripciones',
      nav_card: 'Agregar tarjeta',
      nav_profile: 'Mi perfil',
      nav_more: 'Más',
      nav_post: 'NUEVO POST',

      pop_profile: 'Mi perfil',
      pop_col: 'Colecciones',
      pop_set: 'Ajustes',
      pop_cards: 'Tus tarjetas',
      pop_cards_sub: '(para suscribirte)',
      pop_creator: 'Conviértete en creador',
      pop_creator_sub: '(para ganar)',
      pop_help: 'Ayuda y soporte',
      pop_dark: 'Modo oscuro',
      pop_logout: 'Cerrar sesión'
    }
  },
  tl: {
    label: 'Filipino',
    strings: {
      nav_home: 'Home',
      nav_notif: 'Notifications',
      nav_msg: 'Messages',
      nav_col: 'Collections',
      nav_subs: 'Subscriptions',
      nav_card: 'Add card',
      nav_profile: 'My profile',
      nav_more: 'More',
      nav_post: 'NEW POST',

      pop_profile: 'My profile',
      pop_col: 'Collections',
      pop_set: 'Settings',
      pop_cards: 'Your cards',
      pop_cards_sub: '(to subscribe)',
      pop_creator: 'Become a creator',
      pop_creator_sub: '(to earn)',
      pop_help: 'Help and support',
      pop_dark: 'Dark mode',
      pop_logout: 'Log out'
    }
  },
  ru: {
    label: 'Русский',
    strings: {
      nav_home: 'Главная',
      nav_notif: 'Уведомления',
      nav_msg: 'Сообщения',
      nav_col: 'Коллекции',
      nav_subs: 'Подписки',
      nav_card: 'Добавить карту',
      nav_profile: 'Профиль',
      nav_more: 'Ещё',
      nav_post: 'НОВЫЙ ПОСТ',

      pop_profile: 'Профиль',
      pop_col: 'Коллекции',
      pop_set: 'Настройки',
      pop_cards: 'Ваши карты',
      pop_cards_sub: '(для подписки)',
      pop_creator: 'Стать автором',
      pop_creator_sub: '(чтобы заработать)',
      pop_help: 'Помощь и поддержка',
      pop_dark: 'Тёмный режим',
      pop_logout: 'Выйти'
    }
  }
};

function tmGetLang() {
  try {
    const v = localStorage.getItem(TM_LANG_KEY);
    if (v && TM_LANGS[v]) return v;
  } catch (_) {}
  return 'en';
}

function tmUpdateLangLabel(langCode) {
  const el = document.getElementById('popover-lang-label');
  const lang = TM_LANGS[langCode] || TM_LANGS.en;
  if (!el) return;
  el.innerHTML = `<i class="fa-solid fa-globe"></i> ${lang.label}`;
}

function tmApplyLang(langCode) {
  const code = TM_LANGS[langCode] ? langCode : 'en';
  const lang = TM_LANGS[code] || TM_LANGS.en;

  try { document.documentElement.setAttribute('lang', code); } catch (_) {}

  try {
    document.querySelectorAll('[data-lang]').forEach((node) => {
      const key = node.getAttribute('data-lang');
      const v = lang.strings[key];
      if (typeof v === 'string' && v.length) node.textContent = v;
    });
  } catch (_) {}

  tmUpdateLangLabel(code);

  try {
    const sel = document.querySelector('#settings-lang-select');
    if (sel) sel.value = code;
  } catch (_) {}
}

function tmSetLang(langCode) {
  const code = TM_LANGS[langCode] ? langCode : 'en';
  try { localStorage.setItem(TM_LANG_KEY, code); } catch (_) {}
  tmApplyLang(code);
  try { TopToast.fire({ icon: 'success', title: 'Language saved' }); } catch (_) {}
}

async function tmOpenLangPicker() {
  const current = tmGetLang();
  const opts = Object.entries(TM_LANGS).reduce((acc, [k, v]) => {
    acc[k] = v.label;
    return acc;
  }, {});

  if (!window.Swal || typeof window.Swal.fire !== 'function') {
    const keys = Object.keys(TM_LANGS);
    const idx = Math.max(0, keys.indexOf(current));
    const next = keys[(idx + 1) % keys.length] || 'en';
    tmSetLang(next);
    return;
  }

  const res = await window.Swal.fire({
    title: 'Language',
    input: 'select',
    inputOptions: opts,
    inputValue: current,
    showCancelButton: true,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
    heightAuto: false
  });

  if (res && res.isConfirmed) {
    tmSetLang(res.value || 'en');
  }
}


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


/* =========================
   Profile: Share + Status
   ========================= */

let __tmProfileActionsBound = false;
let __tmStatusMenuOpen = false;

function tmNormalizeStatus(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return 'Available';
  if (v === 'available' || v === 'online') return 'Available';
  if (v === 'away') return 'Away';
  if (v === 'busy' || v === 'dnd' || v === 'do not disturb') return 'Busy';
  if (raw === 'Available' || raw === 'Away' || raw === 'Busy') return raw;
  return 'Available';
}

function tmStatusColor(status) {
  const s = tmNormalizeStatus(status);
  if (s === 'Busy') return '#ff4d4f';
  if (s === 'Away') return '#f5c542';
  return '#46e85e';
}

function tmApplyCreatorStatus(status) {
  const s = tmNormalizeStatus(status);
  const color = tmStatusColor(s);

  const label = document.getElementById('profile-status-label');
  if (label) label.textContent = s;

  const dot = document.getElementById('profile-status-dot');
  if (dot) dot.style.background = color;

  const sidebarDot = document.querySelector('.profile-header-card .status-indicator');
  if (sidebarDot) sidebarDot.style.background = color;

  const popDot = document.querySelector('#settings-popover .pop-online');
  if (popDot) popDot.style.background = color;

  const menu = document.getElementById('profile-status-menu');
  if (menu) {
    menu.querySelectorAll('.tm-status-item').forEach(btn => {
      const isActive = tmNormalizeStatus(btn.getAttribute('data-status')) === s;
      btn.style.background = isActive ? 'rgba(255,255,255,0.08)' : 'transparent';
    });
  }
}

async function tmApiSetCreatorStatus(status) {
  const s = tmNormalizeStatus(status);
  const res = await fetch('/api/me/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status: s })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || !data.ok) {
    const msg = (data && data.message) ? data.message : 'Unable to save status';
    throw new Error(msg);
  }
  return tmNormalizeStatus(data.status || s);
}

function tmGetProfileShareUrl() {
  const base = window.location.origin + window.location.pathname;
  return base + '#profile';
}

async function tmCopyToClipboard(text) {
  const t = String(text || '');
  if (!t) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(t);
      return true;
    }
  } catch {}

  try {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {}

  return false;
}

function tmCloseStatusMenu() {
  const menu = document.getElementById('profile-status-menu');
  if (!menu) return;
  menu.style.display = 'none';
  menu.setAttribute('aria-hidden', 'true');
  __tmStatusMenuOpen = false;
}

function tmOpenStatusMenu(anchorEl) {
  const menu = document.getElementById('profile-status-menu');
  if (!menu || !anchorEl) return;

  const rect = anchorEl.getBoundingClientRect();

  const margin = 10;
  const menuW = Math.max(190, menu.offsetWidth || 190);
  const menuH = Math.max(140, menu.offsetHeight || 140);

  let left = rect.left;
  let top = rect.bottom + 8;

  left = Math.min(left, window.innerWidth - menuW - margin);
  left = Math.max(margin, left);

  if (top + menuH + margin > window.innerHeight) {
    top = rect.top - menuH - 8;
    if (top < margin) top = margin;
  }

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.display = 'block';
  menu.setAttribute('aria-hidden', 'false');
  __tmStatusMenuOpen = true;

  const label = document.getElementById('profile-status-label');
  tmApplyCreatorStatus(label ? label.textContent : 'Available');
}

function tmInitProfileShareAndStatus() {
  if (__tmProfileActionsBound) return;
  __tmProfileActionsBound = true;

  const shareBtn = document.getElementById('btn-profile-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      try {
        const url = tmGetProfileShareUrl();
        const name = (document.getElementById('creatorHeaderName')?.textContent || 'My profile').trim();
        const handle = (document.getElementById('creatorHeaderHandle')?.textContent || '').trim();
        const title = handle ? `${name} (${handle})` : name;

        if (navigator.share) {
          try {
            await navigator.share({ title, text: 'View my iTRUEMATCH creator profile', url });
            if (TopToast && TopToast.success) TopToast.success('Shared');
            return;
          } catch {
            // fallback to copy
          }
        }

        const ok = await tmCopyToClipboard(url);
        if (ok) TopToast?.success?.('Link copied');
        else TopToast?.error?.('Copy failed');
      } catch {
        TopToast?.error?.('Share failed');
      }
    });
  }

  const statusTrigger = document.getElementById('profile-status-trigger');
  const menu = document.getElementById('profile-status-menu');

  if (statusTrigger && menu) {
    statusTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (__tmStatusMenuOpen) tmCloseStatusMenu();
      else tmOpenStatusMenu(statusTrigger);
    });

    menu.addEventListener('click', async (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('.tm-status-item') : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const next = btn.getAttribute('data-status') || 'Available';
      try {
        tmApplyCreatorStatus(next);
        tmCloseStatusMenu();

        const saved = await tmApiSetCreatorStatus(next);
        tmApplyCreatorStatus(saved);
        TopToast?.success?.('Status updated');
      } catch (err) {
        TopToast?.error?.(err?.message || 'Unable to save status');
      }
    });

    document.addEventListener('click', () => {
      if (__tmStatusMenuOpen) tmCloseStatusMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && __tmStatusMenuOpen) tmCloseStatusMenu();
    });

    window.addEventListener('resize', () => {
      if (__tmStatusMenuOpen) tmOpenStatusMenu(statusTrigger);
    });
  }
}


async function init() {
  console.log("App Init...");
  
  await Promise.all([
      loadView('container-messages', 'assets/views/message.html'), 
      loadView('container-settings', 'assets/views/settings.html'),
      loadView('container-notifications', 'assets/views/notifications.html'),
      loadView('container-collections', 'assets/views/collections.html')
  ]);
  
  // Apply saved language (before modules render dynamic UI)
  try { tmApplyLang(tmGetLang()); } catch (e) { console.error(e); }

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
  tmBindProfileBackButton();
  tmBindPopoverCollections();
  tmInitGlobalSearch();
  tmInitSuggestionsSidebar();
  await tmHydrateCreatorsFromMe();
  try { tmBindCreatorAccessPaywall(); } catch (e) { console.error(e); }
  try { tmEnforceCreatorAccess(); } catch (e) { console.error(e); }
  try { tmInitBankingView(); } catch (e) { console.error(e); }

  
  tmInitProfileShareAndStatus();
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

    // Refresh derived UI when profile/settings updates /api/me
    if (!window.__tmBoundMeUpdated) {
        window.__tmBoundMeUpdated = true;
        window.addEventListener('tm:me-updated', async () => {
            try { await tmHydrateCreatorsFromMe(); } catch (e) { console.error(e); }
            try { tmLoadBankingFromCache(); } catch (_) {}
            try { tmEnforceCreatorAccess(); } catch (_) {}
        });
    }
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



    // Language picker (popover)
    const __tmLangLabel = document.getElementById('popover-lang-label');
    if (__tmLangLabel && !__tmLangLabel.__tmBound) {
        __tmLangLabel.__tmBound = true;
        __tmLangLabel.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                const pop = document.getElementById('settings-popover');
                if (pop) pop.classList.remove('is-open');
            } catch (_) {}
            try { tmOpenLangPicker(); } catch (err) { console.error(err); }
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


    // =============================================================
    // Popover routing (robust): use explicit data-action instead of innerText
    // - Prevents breaking when language changes
    // - Prevents accidental popover-close on dark-mode toggle row
    // =============================================================
    const tmPopover = document.getElementById('settings-popover');

    function tmResolvePopoverAction(el) {
        if (!el) return '';
        const existing = (el.dataset && el.dataset.action) ? String(el.dataset.action || '').trim() : '';
        if (existing) return existing;

        // Prefer [data-lang] keys (stable across translations)
        const keyEl = el.querySelector ? el.querySelector('span[data-lang]') : null;
        const key = keyEl ? String(keyEl.getAttribute('data-lang') || '') : '';

        const map = {
            pop_profile: 'profile',
            pop_col: 'collections',
            pop_set: 'settings',
            pop_cards: 'your-cards',
            pop_creator: 'become-creator',
            pop_help: 'support',
            pop_logout: 'logout'
        };

        if (key && map[key]) return map[key];

        // Final fallback (legacy): innerText
        try {
            const text = String(el.innerText || '').trim().toLowerCase();
            if (text.includes('log out') || text.includes('logout')) return 'logout';
            if (text.includes('cards')) return 'your-cards';
            if (text.includes('add card')) return 'add-card';
            if (text.includes('settings')) return 'settings';
            if (text.includes('collections')) return 'collections';
            if (text.includes('profile')) return 'profile';
            if (text.includes('creator') || text.includes('banking')) return 'become-creator';
            if (text.includes('help')) return 'support';
        } catch (_) {}

        return '';
    }

    function tmTagPopoverActions() {
        if (!tmPopover || tmPopover.dataset.tmActionsTagged === '1') return;
        tmPopover.dataset.tmActionsTagged = '1';

        // Tag only navigational anchors + logout; exclude toggle-row and language label.
        tmPopover.querySelectorAll('.pop-item').forEach((node) => {
            try {
                if (node.id === 'popover-lang-label') return;
                if (node.classList && node.classList.contains('toggle-row')) return;
                const action = tmResolvePopoverAction(node);
                if (action) node.dataset.action = action;
            } catch (_) {}
        });
    }

    function tmClosePopover() {
        try {
            const popover = document.getElementById('settings-popover');
            if (popover) popover.classList.remove('is-open');
        } catch (_) {}
    }

    async function tmHandlePopoverAction(action, e) {
        if (e) {
            try { e.preventDefault(); } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
        }

        // Close popover for real actions (not for dark-mode toggle)
        tmClosePopover();

        if (action === 'logout') {
            try { await apiPost('/api/auth/logout', {}); } catch (_) { /* ignore */ }
            window.location.href = 'index.html';
            return;
        }

        if (action === 'support') {
            try { tmSupportOpenEmailModal({ subject: 'Support request' }); }
            catch (err) {
                console.error(err);
                try { TopToast.fire({ icon: 'error', title: 'Support unavailable' }); } catch (_) {}
            }
            return;
        }

        // View routing
        switchView(action);
    }

    // Delegate clicks from the popover container (prevents duplicate listeners)
    if (tmPopover && tmPopover.dataset.tmBoundActions !== '1') {
        tmPopover.dataset.tmBoundActions = '1';
        tmTagPopoverActions();

        tmPopover.addEventListener('click', async (e) => {
            const item = e.target && e.target.closest ? e.target.closest('.pop-item') : null;
            if (!item) return;
            if (item.id === 'popover-lang-label') return; // handled by tmOpenLangPicker listener
            if (item.classList && item.classList.contains('toggle-row')) return; // allow toggle without closing

            // Route only if there is a known action
            const action = tmResolvePopoverAction(item);
            if (!action) return;
            item.dataset.action = action;
            await tmHandlePopoverAction(action, e);
        });
    }

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
    
  // Close transient overlays when changing views
  try { tmCloseStatusMenu(); } catch {}
try { localStorage.setItem('tm_last_view', viewName); } catch (_) {}

    // Close mobile settings drill-down (if open)
    if (typeof window.__tmCloseSettingsMobileDetail === 'function') {
        try { window.__tmCloseSettingsMobileDetail(); } catch(_) {}
    }

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

    // Apply saved post-search filter when returning to Home
    if (viewName === 'home') {
        const _q = localStorage.getItem('tm_post_search_query') || '';
        tmApplyInlinePostFilter(_q);
        const _in = document.getElementById('global-post-search-input');
        if (_in && _in.value !== _q) _in.value = _q;
    }

    // Subscriptions: load & render data when entering the view
    if (viewName === 'subscriptions') {
        try { tmEnterSubscriptionsView(); } catch (e) { console.error(e); }
    }

    // Bank details (Become a Creator): load & render data when entering the view
    if (viewName === 'become-creator') {
        try { tmEnterBankingView(); } catch (e) { console.error(e); }
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

// =============================================================
// GLOBAL SEARCH (Posts + Subscriptions Search Icon)
// - Desktop: typing in right sidebar search filters feed (Home)
// - Mobile/Tablet: opens full-screen search overlay (Option C)
// - Subscriptions search icon opens overlay (mode: subscriptions)
// =============================================================
const tmSearchUI = {
    overlay: null,
    sheet: null,
    input: null,
    body: null,
    closeBtn: null,
    mode: 'posts',
    lastQuery: ''
};

function tmEnsureSearchOverlay() {
    if (document.getElementById('tm-search-overlay')) {
        tmSearchUI.overlay = document.getElementById('tm-search-overlay');
        tmSearchUI.sheet = tmSearchUI.overlay.querySelector('.tm-search-sheet');
        tmSearchUI.input = document.getElementById('tmSearchInput');
        tmSearchUI.body = document.getElementById('tmSearchBody');
        tmSearchUI.closeBtn = document.getElementById('tmSearchClose');
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'tm-search-overlay';
    overlay.className = 'tm-search-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="tm-search-sheet" role="dialog" aria-modal="true" aria-label="Search">
            <div class="tm-search-head">
                <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                <input id="tmSearchInput" class="tm-search-input" type="text" placeholder="Search..." autocomplete="off" />
                <button type="button" id="tmSearchClose" class="tm-search-close" aria-label="Close search">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div id="tmSearchBody" class="tm-search-body"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    tmSearchUI.overlay = overlay;
    tmSearchUI.sheet = overlay.querySelector('.tm-search-sheet');
    tmSearchUI.input = document.getElementById('tmSearchInput');
    tmSearchUI.body = document.getElementById('tmSearchBody');
    tmSearchUI.closeBtn = document.getElementById('tmSearchClose');

    // Close (button)
    tmSearchUI.closeBtn.addEventListener('click', tmCloseSearch);

    // Close (tap outside)
    tmSearchUI.overlay.addEventListener('click', (e) => {
        if (!tmSearchUI.sheet.contains(e.target)) tmCloseSearch();
    });

    // ESC close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tmSearchUI.overlay.classList.contains('is-open')) tmCloseSearch();
    });

    // Search input handler
    tmSearchUI.input.addEventListener('input', () => {
        const q = (tmSearchUI.input.value || '').trim();
        tmSearchUI.lastQuery = q;
        if (tmSearchUI.mode === 'subscriptions') {
            tmRenderSubscriptionsSearch(q);
        } else {
            tmRenderPostSearch(q);
        }
    });

    tmSearchUI.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
}

function tmOpenSearch(mode = 'posts', presetQuery = '') {
    tmEnsureSearchOverlay();
    tmSearchUI.mode = mode;

    const ph = (mode === 'subscriptions') ? 'Search subscriptions...' : 'Search posts...';
    tmSearchUI.input.setAttribute('placeholder', ph);

    const saved = (mode === 'posts') ? (localStorage.getItem('tm_post_search_query') || '') : '';
    const q = (presetQuery != null ? presetQuery : '').trim() || saved;

    tmSearchUI.overlay.classList.add('is-open');
    tmSearchUI.overlay.setAttribute('aria-hidden', 'false');
    tmSearchUI.input.value = q;
    tmSearchUI.lastQuery = q;

    // Initial render
    if (mode === 'subscriptions') {
        tmRenderSubscriptionsSearch(q);
    } else {
        tmRenderPostSearch(q);
    }

    setTimeout(() => tmSearchUI.input.focus(), 50);
}

function tmCloseSearch() {
    if (!tmSearchUI.overlay) return;
    tmSearchUI.overlay.classList.remove('is-open');
    tmSearchUI.overlay.setAttribute('aria-hidden', 'true');
}

function tmReadPostsFromStorage() {
    try {
        const raw = localStorage.getItem('tm_user_posts');
        const posts = raw ? JSON.parse(raw) : [];
        return Array.isArray(posts) ? posts : [];
    } catch (e) {
        return [];
    }
}

function tmRenderPostSearch(query) {
    if (!tmSearchUI.body) return;

    const q = (query || '').trim().toLowerCase();
    const posts = tmReadPostsFromStorage()
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (!q) {
        const recent = posts.slice(0, 10);
        if (!recent.length) {
            tmSearchUI.body.innerHTML = `<div class="tm-search-hint">No posts yet.</div>`;
            return;
        }
        tmSearchUI.body.innerHTML = `
            <div class="tm-search-hint">Recent posts</div>
            ${recent.map(p => tmPostResultHTML(p)).join('')}
        `;
        tmBindResultClicks('posts');
        return;
    }

    const results = posts.filter(p => String(p.text || '').toLowerCase().includes(q)).slice(0, 25);

    if (!results.length) {
        tmSearchUI.body.innerHTML = `<div class="tm-search-hint">No matching posts.</div>`;
        return;
    }

    tmSearchUI.body.innerHTML = `
        <div class="tm-search-hint">${results.length} result${results.length === 1 ? '' : 's'}</div>
        ${results.map(p => tmPostResultHTML(p)).join('')}
    `;
    tmBindResultClicks('posts');
}

function tmPostResultHTML(p) {
    const text = String(p.text || '').trim();
    const snippet = text.length > 140 ? (text.slice(0, 140) + '...') : text;
    const ts = p.timestamp ? new Date(p.timestamp) : null;
    const meta = ts ? ts.toLocaleString() : '';
    const safeSnippet = snippet
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `
        <div class="tm-search-result" data-post-id="${p.id}">
            <div class="title">${safeSnippet || 'Untitled post'}</div>
            <div class="meta">${meta}</div>
        </div>
    `;
}

function tmBindResultClicks(type) {
    if (!tmSearchUI.body) return;
    tmSearchUI.body.querySelectorAll('.tm-search-result').forEach(el => {
        el.addEventListener('click', () => {
            if (type === 'posts') {
                const postId = el.getAttribute('data-post-id');
                tmCloseSearch();
                if (postId) {
                    localStorage.setItem('tm_post_search_query', tmSearchUI.lastQuery || '');
                    const input = document.getElementById('global-post-search-input');
                    if (input) input.value = tmSearchUI.lastQuery || '';
                    switchView('home');
                    setTimeout(() => tmScrollToPost(postId), 180);
                }
            }
        });
    });
}

function tmScrollToPost(postId) {
    const el = document.getElementById(`post-${postId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('tm-search-highlight');
    setTimeout(() => el.classList.remove('tm-search-highlight'), 2000);
}

// Inline filtering for the Home feed (desktop search bar)
function tmApplyInlinePostFilter(query) {
    const feed = document.getElementById('creator-feed');
    if (!feed) return;

    const q = (query || '').trim().toLowerCase();
    const posts = Array.from(feed.querySelectorAll('.post-card'));
    const emptyState = feed.querySelector('.feed-empty-state');

    let visibleCount = 0;
    posts.forEach(card => {
        const txt = (card.innerText || '').toLowerCase();
        const show = !q || txt.includes(q);
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    if (emptyState) {
        // If there are no posts at all, leave the original empty state intact.
        const hasAnyPosts = posts.length > 0;
        if (!hasAnyPosts) {
            emptyState.style.display = '';
            return;
        }
        if (q && visibleCount === 0) {
            emptyState.style.display = '';
            const p = emptyState.querySelector('p');
            if (p) p.textContent = 'No matching posts';
        } else {
            emptyState.style.display = 'none';
            const p = emptyState.querySelector('p');
            if (p) p.textContent = 'No posts to show';
        }
    }
}

function tmRenderSubscriptionsSearch(query) {
    if (!tmSearchUI.body) return;

    // Future-proof: if subscription cards exist, filter them. For now, show a helpful state.
    const subsView = document.getElementById('view-subscriptions');
    const cards = subsView ? Array.from(subsView.querySelectorAll('.subscription-card, .sub-card, .sub-item')) : [];
    const q = (query || '').trim().toLowerCase();

    if (!cards.length) {
        tmSearchUI.body.innerHTML = `
            <div class="tm-search-hint">
                No subscriptions to search yet.
                <br><br>
                Tip: Use the Home search to find creators, then subscribe.
            </div>
        `;
        return;
    }

    let match = 0;
    cards.forEach(c => {
        const txt = (c.innerText || '').toLowerCase();
        const show = !q || txt.includes(q);
        c.style.display = show ? '' : 'none';
        if (show) match++;
    });

    tmSearchUI.body.innerHTML = `<div class="tm-search-hint">${match} result${match === 1 ? '' : 's'}</div>`;
}

function tmInitGlobalSearch() {
    const input = document.getElementById('global-post-search-input');
    const btn = document.getElementById('global-post-search-btn');
    const subsBtn = document.getElementById('subs-btn-search');

    const saved = localStorage.getItem('tm_post_search_query') || '';
    if (input && saved && input.value !== saved) input.value = saved;

    if (input) {
        input.addEventListener('input', () => {
            const q = input.value || '';
            localStorage.setItem('tm_post_search_query', q);
            tmApplyInlinePostFilter(q);
        });

        input.addEventListener('focus', () => {
            // Mobile: open overlay instead of inline filtering UI.
            if (window.innerWidth <= 768) tmOpenSearch('posts', input.value || '');
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (window.innerWidth <= 1024) {
                    e.preventDefault();
                    tmOpenSearch('posts', input.value || '');
                }
            }
        });
    }

    if (btn) {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                tmOpenSearch('posts', input ? (input.value || '') : '');
            } else {
                if (input) input.focus();
            }
        });
    }

    if (subsBtn) {
        subsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tmOpenSearch('subscriptions', '');
        });
    }
}


// =============================================================
// SUBSCRIPTIONS (Data #1)
// - Fetch /api/me/subscriptions (both directions)
// - Render "Subscribed" + "Subscribers" tabs
// - Active/Expired/All pill counts + filtering + inline search
// - Cards include .subscription-card so global overlay search can filter them too
// =============================================================
const tmSubsState = {
    uiReady: false,
    loading: false,
    // Direction: 'subscribed' (you subscribed to creators) | 'subscribers' (your subscribers)
    dir: (localStorage.getItem('tm_subs_dir') || 'subscribed'),
    // Filter: 'all' | 'active' | 'expired'
    filter: (localStorage.getItem('tm_subs_filter') || 'all'),
    // Inline search query for subscriptions view only
    q: (localStorage.getItem('tm_subs_query') || ''),
    data: null,
    fetchedAt: 0,
    mode: 'auto' // 'v2' (current creators.html) | 'v1' (legacy) | 'auto'
};

let tmSubsUI = {
    view: null,

    // v2 (current markup)
    tabTo: null,
    tabFrom: null,
    countTo: null,
    countFrom: null,

    pillAll: null,
    pillActive: null,
    pillExpired: null,
    countAll: null,
    countActive: null,
    countExpired: null,

    input: null,
    btnClear: null,
    list: null,
    empty: null,
    emptyText: null,
    loading: null,

    // v1 (legacy fallbacks)
    pills: [],
    pillsBar: null,
    listWrap: null,
    emptyWrap: null,
    legacyEmptyText: null
};

function tmSubsNormalizeDir(dir) {
    const d = String(dir || '').toLowerCase();
    if (d === 'subscribers' || d === 'fans' || d === 'from') return 'subscribers';
    return 'subscribed';
}

function tmSubsNormalizeFilter(filter) {
    const f = String(filter || '').toLowerCase();
    if (f === 'active' || f === 'expired') return f;
    return 'all';
}

function tmSubsSetMode(mode) {
    tmSubsState.mode = mode || 'auto';
}

function tmSubsShow(el, show) {
    if (!el) return;
    // v2 uses .show, legacy uses display
    if (el.classList && (el.classList.contains('subs-loading') || el.classList.contains('subs-empty'))) {
        el.classList.toggle('show', !!show);
    } else {
        el.style.display = show ? '' : 'none';
    }
}

function tmEnsureSubscriptionsUI() {
    const view = document.getElementById('view-subscriptions');
    if (!view) return false;

    // Detect current markup (v2) by the presence of #subs-list
    const hasV2 = !!view.querySelector('#subs-list');
    const force = tmSubsState.mode !== 'auto' ? tmSubsState.mode : (hasV2 ? 'v2' : 'v1');
    tmSubsSetMode(force);

    // ---------- v2 wiring ----------
    if (force === 'v2') {
        const tabTo = view.querySelector('#subs-tab-to');
        const tabFrom = view.querySelector('#subs-tab-from');
        const countTo = view.querySelector('#subs-count-to');
        const countFrom = view.querySelector('#subs-count-from');

        const pillAll = view.querySelector('.subs-pill[data-subs-filter="all"]');
        const pillActive = view.querySelector('.subs-pill[data-subs-filter="active"]');
        const pillExpired = view.querySelector('.subs-pill[data-subs-filter="expired"]');

        const countAll = view.querySelector('#subs-count-all');
        const countActive = view.querySelector('#subs-count-active');
        const countExpired = view.querySelector('#subs-count-expired');

        const input = view.querySelector('#subs-search');
        const btnClear = view.querySelector('#subs-btn-clear');
        const list = view.querySelector('#subs-list');
        const empty = view.querySelector('#subs-empty');
        const emptyText = view.querySelector('.subs-empty-text');
        const loading = view.querySelector('#subs-loading');

        tmSubsUI = {
            view,
            tabTo, tabFrom, countTo, countFrom,
            pillAll, pillActive, pillExpired,
            countAll, countActive, countExpired,
            input, btnClear, list, empty, emptyText, loading,
            pills: [], pillsBar: null, listWrap: null, emptyWrap: null, legacyEmptyText: null
        };

        // Normalize persisted state
        tmSubsState.dir = tmSubsNormalizeDir(tmSubsState.dir);
        tmSubsState.filter = tmSubsNormalizeFilter(tmSubsState.filter);

        // Bind direction tabs once
        if (tabTo && tabTo.dataset.bound !== '1') {
            tabTo.dataset.bound = '1';
            tabTo.addEventListener('click', () => tmSetSubsDir('subscribed'));
        }
        if (tabFrom && tabFrom.dataset.bound !== '1') {
            tabFrom.dataset.bound = '1';
            tabFrom.addEventListener('click', () => tmSetSubsDir('subscribers'));
        }

        // Bind pills once
        if (pillAll && pillAll.dataset.bound !== '1') {
            pillAll.dataset.bound = '1';
            pillAll.addEventListener('click', () => tmSetSubsFilter('all'));
        }
        if (pillActive && pillActive.dataset.bound !== '1') {
            pillActive.dataset.bound = '1';
            pillActive.addEventListener('click', () => tmSetSubsFilter('active'));
        }
        if (pillExpired && pillExpired.dataset.bound !== '1') {
            pillExpired.dataset.bound = '1';
            pillExpired.addEventListener('click', () => tmSetSubsFilter('expired'));
        }

        // Inline search
        if (input && input.dataset.bound !== '1') {
            input.dataset.bound = '1';
            // Hydrate saved query
            if (tmSubsState.q && input.value !== tmSubsState.q) input.value = tmSubsState.q;

            input.addEventListener('input', () => {
                tmSubsState.q = input.value || '';
                localStorage.setItem('tm_subs_query', tmSubsState.q);
                tmRenderSubscriptionsList();
                tmUpdateSubsClearBtn();
            });
        }

        if (btnClear && btnClear.dataset.bound !== '1') {
            btnClear.dataset.bound = '1';
            btnClear.addEventListener('click', (e) => {
                e.preventDefault();
                tmSubsState.q = '';
                localStorage.setItem('tm_subs_query', '');
                if (input) input.value = '';
                tmRenderSubscriptionsList();
                tmUpdateSubsClearBtn();
                try { input && input.focus(); } catch (_) {}
            });
        }

        tmSubsState.uiReady = true;
        tmApplySubsTabActive();
        tmApplySubsPillActive();
        tmUpdateSubsClearBtn();

        return true;
    }

    // ---------- v1 (legacy) fallback wiring ----------
    const pills = Array.from(view.querySelectorAll('button.n-pill'));
    const pillActive = pills[0] || null;
    const pillExpired = pills[1] || null;
    const pillsBar = pillActive ? pillActive.closest('div') : null;

    const icon = view.querySelector('.empty-icon-wrap');
    const emptyWrap = icon ? icon.parentElement : null;
    const legacyEmptyText = emptyWrap ? emptyWrap.querySelector('p') : null;

    let listWrap = view.querySelector('#subs-list-wrap');
    if (!listWrap && pillsBar) {
        listWrap = document.createElement('div');
        listWrap.id = 'subs-list-wrap';
        listWrap.style.padding = '12px 15px 20px';
        listWrap.style.display = 'none';
        pillsBar.insertAdjacentElement('afterend', listWrap);
    }

    tmSubsUI = {
        view,
        pills,
        pillsBar,
        pillActive,
        pillExpired,
        listWrap,
        emptyWrap,
        legacyEmptyText,
        tabTo: null, tabFrom: null, countTo: null, countFrom: null,
        pillAll: null, countAll: null, countActive: null, countExpired: null,
        input: null, btnClear: null, list: null, empty: null, emptyText: null, loading: null
    };

    // legacy filter only supports active/expired; map 'all' to active in v1
    tmSubsState.filter = (tmSubsState.filter === 'expired') ? 'expired' : 'active';

    if (pillActive && pillActive.dataset.bound !== '1') {
        pillActive.dataset.bound = '1';
        pillActive.addEventListener('click', () => tmSetSubsFilter('active'));
    }
    if (pillExpired && pillExpired.dataset.bound !== '1') {
        pillExpired.dataset.bound = '1';
        pillExpired.addEventListener('click', () => tmSetSubsFilter('expired'));
    }

    tmSubsState.uiReady = true;
    tmApplySubsPillActive();
    return true;
}

function tmApplySubsTabActive() {
    if (tmSubsState.mode !== 'v2') return;
    const { tabTo, tabFrom } = tmSubsUI;
    if (tabTo) tabTo.classList.toggle('active', tmSubsState.dir === 'subscribed');
    if (tabFrom) tabFrom.classList.toggle('active', tmSubsState.dir === 'subscribers');
}

function tmApplySubsPillActive() {
    if (tmSubsState.mode === 'v2') {
        const { pillAll, pillActive, pillExpired } = tmSubsUI;
        if (pillAll) pillAll.classList.toggle('active', tmSubsState.filter === 'all');
        if (pillActive) pillActive.classList.toggle('active', tmSubsState.filter === 'active');
        if (pillExpired) pillExpired.classList.toggle('active', tmSubsState.filter === 'expired');
        return;
    }

    // legacy
    const { pillActive, pillExpired } = tmSubsUI;
    if (pillActive) pillActive.classList.toggle('active', tmSubsState.filter === 'active');
    if (pillExpired) pillExpired.classList.toggle('active', tmSubsState.filter === 'expired');
}

function tmUpdateSubsClearBtn() {
    if (tmSubsState.mode !== 'v2') return;
    const { btnClear } = tmSubsUI;
    if (!btnClear) return;
    const show = !!(tmSubsState.q && String(tmSubsState.q).trim());
    btnClear.style.display = show ? '' : 'none';
}

function tmUpdateSubsCountsTop(payload) {
    if (tmSubsState.mode !== 'v2') return;
    const toAll = Number(payload?.subscribed?.counts?.all || 0);
    const fromAll = Number(payload?.subscribers?.counts?.all || 0);
    if (tmSubsUI.countTo) tmSubsUI.countTo.textContent = String(toAll);
    if (tmSubsUI.countFrom) tmSubsUI.countFrom.textContent = String(fromAll);
}

function tmUpdateSubsPillsCounts(counts) {
    const all = Number(counts?.all || 0);
    const active = Number(counts?.active || 0);
    const expired = Number(counts?.expired || 0);

    if (tmSubsState.mode === 'v2') {
        if (tmSubsUI.countAll) tmSubsUI.countAll.textContent = String(all);
        if (tmSubsUI.countActive) tmSubsUI.countActive.textContent = String(active);
        if (tmSubsUI.countExpired) tmSubsUI.countExpired.textContent = String(expired);
        return;
    }

    // legacy: rewrite button labels
    if (tmSubsUI.pillActive) {
        tmSubsUI.pillActive.innerHTML = `<i class="fa-solid fa-check"></i> Active ${active}`;
    }
    if (tmSubsUI.pillExpired) {
        tmSubsUI.pillExpired.innerHTML = `<i class="fa-regular fa-hourglass-half"></i> Expired ${expired}`;
    }
}

function tmSetSubsEmpty(text) {
    const msg = text || 'No subscriptions yet.';

    if (tmSubsState.mode === 'v2') {
        if (tmSubsUI.emptyText) tmSubsUI.emptyText.textContent = msg;
        tmSubsShow(tmSubsUI.loading, false);
        tmSubsShow(tmSubsUI.empty, true);
        if (tmSubsUI.list) tmSubsUI.list.style.display = 'none';
        return;
    }

    if (tmSubsUI.legacyEmptyText) tmSubsUI.legacyEmptyText.textContent = msg;
    if (tmSubsUI.emptyWrap) tmSubsUI.emptyWrap.style.display = 'flex';
    if (tmSubsUI.listWrap) tmSubsUI.listWrap.style.display = 'none';
}

function tmSetSubsLoading() {
    if (tmSubsState.mode === 'v2') {
        tmSubsShow(tmSubsUI.empty, false);
        tmSubsShow(tmSubsUI.loading, true);
        if (tmSubsUI.list) tmSubsUI.list.style.display = 'none';
        return;
    }

    if (!tmSubsUI.listWrap) return;
    if (tmSubsUI.emptyWrap) tmSubsUI.emptyWrap.style.display = 'none';
    tmSubsUI.listWrap.style.display = 'block';
    tmSubsUI.listWrap.innerHTML = `
        <div style="color:var(--muted); text-align:center; padding:28px 0; font-weight:700;">
            Loading subscriptions...
        </div>
    `;
}


function tmTsToMs(t) {
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') {
        const n = Date.parse(t);
        if (!Number.isNaN(n)) return n;
        const p = parseInt(t, 10);
        return Number.isNaN(p) ? 0 : p;
    }
    if (typeof t === 'object') {
        try {
            if (typeof t.toMillis === 'function') return t.toMillis();
        } catch (_) {}
        if (typeof t.seconds === 'number') return t.seconds * 1000;
        if (typeof t._seconds === 'number') return t._seconds * 1000;
    }
    return 0;
}

function tmFmtDate(ms) {
    if (!ms) return '';
    try {
        return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_) {
        return '';
    }
}

function tmBuildSubCard(it) {
    const other = it?.otherUser || {};
    const name = (other.name || '').trim() || (other.handle ? `@${String(other.handle).replace(/^@/, '')}` : '') || (it.otherEmail || 'Unknown');
    const handleRaw = (other.handle || '').trim().replace(/^@/, '');
    const handle = handleRaw ? `@${handleRaw}` : (it.otherEmail ? it.otherEmail : '');
    const avatar = other.avatarUrl || DEFAULT_AVATAR;
    const verified = !!other.verified;
    const isActive = !!it.isActive;
    const endMs = tmTsToMs(it.endAt);
    const endLabel = endMs ? tmFmtDate(endMs) : '';

    const card = document.createElement('div');
    card.className = 'sugg-card subscription-card';
    card.dataset.subStatus = isActive ? 'active' : 'expired';
    card.style.cursor = 'default';

    const banner = document.createElement('div');
    banner.className = 'sugg-banner';
    // No cover image in API yet; use a nice gradient
    banner.style.backgroundImage = isActive
        ? 'linear-gradient(135deg, rgba(58,175,185,0.45), rgba(100,233,238,0.18))'
        : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))';

    const badge = document.createElement('div');
    badge.className = 'sugg-badge';
    badge.textContent = isActive ? 'ACTIVE' : 'EXPIRED';

    banner.appendChild(badge);
    card.appendChild(banner);

    const details = document.createElement('div');
    details.className = 'sugg-details';

    const avWrap = document.createElement('div');
    avWrap.className = 'sugg-avatar-wrap';

    const img = document.createElement('img');
    img.alt = name;
    img.src = avatar;
    img.loading = 'lazy';
    avWrap.appendChild(img);

    // Active indicator dot (only for active)
    if (isActive) {
        const dot = document.createElement('div');
        dot.className = 'online-dot';
        avWrap.appendChild(dot);
    }

    const text = document.createElement('div');
    text.className = 'sugg-text';

    const nameRow = document.createElement('div');
    nameRow.className = 'sugg-name';
    nameRow.textContent = name;

    if (verified) {
        const v = document.createElement('i');
        v.className = 'fa-solid fa-circle-check';
        v.style.color = 'var(--primary-cyan)';
        v.style.fontSize = '0.9rem';
        nameRow.appendChild(v);
    }

    const handleRow = document.createElement('div');
    handleRow.className = 'sugg-handle';
    handleRow.textContent = handle;

    const meta = document.createElement('div');
    meta.style.marginTop = '8px';
    meta.style.fontSize = '0.8rem';
    meta.style.color = 'var(--muted)';
    meta.textContent = isActive
        ? (endLabel ? `Expires: ${endLabel}` : 'Active')
        : (endLabel ? `Expired: ${endLabel}` : 'Expired');

    text.appendChild(nameRow);
    text.appendChild(handleRow);
    text.appendChild(meta);

    details.appendChild(avWrap);
    details.appendChild(text);

    card.appendChild(details);
    return card;
}

function tmSubsIsActive(it) {
    if (typeof it?.isActive === 'boolean') return it.isActive;
    const endMs = tmTsToMs(it?.endAt);
    if (endMs) return endMs > Date.now();
    return false;
}

function tmBuildSubsUserRow(it) {
    const other = it?.otherUser || {};
    const otherEmail = String(it?.otherEmail || '').trim().toLowerCase();

    const handleRaw = (other.handle || '').trim().replace(/^@/, '');
    const handle = handleRaw ? `@${handleRaw}` : (otherEmail || '');
    const name = (other.name || '').trim() || handle || otherEmail || 'User';
    const avatar = other.avatarUrl || DEFAULT_AVATAR;
    const verified = !!other.verified;

    const isActive = tmSubsIsActive(it);
    const endMs = tmTsToMs(it?.endAt);
    const startMs = tmTsToMs(it?.startAt);
    const endLabel = endMs ? tmFmtDate(endMs) : '';
    const startLabel = startMs ? tmFmtDate(startMs) : '';

    const row = document.createElement('div');
    row.className = 'subs-user subscription-card';
    row.dataset.subStatus = isActive ? 'active' : 'expired';

    row.innerHTML = `
        <div class="left">
            <img src="${avatar}" alt="${tmEscHtml(name)}" loading="lazy">
            <div class="meta">
                <div class="name">${tmEscHtml(name)} ${verified ? '<i class="fa-solid fa-circle-check" style="color:var(--primary-cyan); font-size:0.85rem; margin-left:6px;"></i>' : ''}</div>
                <div class="handle">${tmEscHtml(handle)}</div>
            </div>
        </div>
        <div class="right">
            <div class="subs-badge ${isActive ? 'active' : 'expired'}">${isActive ? 'ACTIVE' : 'EXPIRED'}</div>
            <div class="subs-mini">
                ${isActive
                    ? (endLabel ? `Expires: ${tmEscHtml(endLabel)}` : 'Active')
                    : (endLabel ? `Expired: ${tmEscHtml(endLabel)}` : 'Expired')
                }
            </div>
        </div>
    `;

    // Click → Messages (start / continue chat with this user)
    if (otherEmail) {
        row.addEventListener('click', () => {
            try {
                localStorage.setItem('tm_open_chat_peer', otherEmail);
            } catch (_) {}

            try { switchView('messages'); } catch (_) {}

            // Prefer direct open (if messages module exposes it); else messages init will pick localStorage
            try {
                const fn = window.__tmMessagesOpenPeer;
                if (typeof fn === 'function') {
                    // Small delay ensures layout switch happened
                    setTimeout(() => { try { fn(otherEmail); } catch (_) {} }, 80);
                }
            } catch (_) {}
        });
    }

    // Tooltip style meta (optional)
    row.title = tmSubsState.dir === 'subscribers'
        ? (startLabel ? `Subscriber since ${startLabel}` : 'Subscriber')
        : (startLabel ? `Subscribed since ${startLabel}` : 'Subscription');

    return row;
}

function tmGetCurrentSubsPack() {
    if (!tmSubsState.data || tmSubsState.data?.ok !== true) return { items: [], counts: { all: 0, active: 0, expired: 0 } };
    if (tmSubsState.dir === 'subscribers') return tmSubsState.data.subscribers || { items: [], counts: { all: 0, active: 0, expired: 0 } };
    return tmSubsState.data.subscribed || { items: [], counts: { all: 0, active: 0, expired: 0 } };
}

function tmRenderSubscriptionsList() {
    if (!tmSubsState.uiReady) return;

    // v1 legacy uses injected listWrap; v2 uses #subs-list.
    if (!tmSubsState.data || tmSubsState.data?.ok !== true) {
        tmSetSubsEmpty('No subscriptions yet.');
        return;
    }

    // Update top tab counts (v2)
    tmUpdateSubsCountsTop(tmSubsState.data);

    const pack = tmGetCurrentSubsPack();
    const itemsAll = Array.isArray(pack.items) ? pack.items : [];
    const counts = pack.counts || { all: itemsAll.length, active: 0, expired: 0 };

    // Counts for pills (v2) / legacy pills
    tmUpdateSubsPillsCounts({
        all: Number(counts.all || itemsAll.length),
        active: Number(counts.active || itemsAll.filter(tmSubsIsActive).length),
        expired: Number(counts.expired || (itemsAll.length - itemsAll.filter(tmSubsIsActive).length))
    });

    tmApplySubsTabActive();
    tmApplySubsPillActive();

    // Filter by status
    let items = itemsAll.slice();
    if (tmSubsState.filter === 'active') items = items.filter(it => tmSubsIsActive(it));
    else if (tmSubsState.filter === 'expired') items = items.filter(it => !tmSubsIsActive(it));

    // Filter by inline query
    const q = (tmSubsState.q || '').trim().toLowerCase();
    if (q) {
        items = items.filter(it => {
            const other = it?.otherUser || {};
            const otherEmail = String(it?.otherEmail || '').toLowerCase();
            const name = String(other.name || '').toLowerCase();
            const handle = String(other.handle || '').toLowerCase().replace(/^@/, '');
            return name.includes(q) || handle.includes(q) || otherEmail.includes(q);
        });
    }

    // Empty states
    if (!itemsAll.length) {
        tmSetSubsEmpty(tmSubsState.dir === 'subscribers' ? 'No subscribers yet.' : 'No subscriptions yet.');
        return;
    }
    if (!items.length) {
        if (q) {
            tmSetSubsEmpty('No matching results.');
        } else {
            tmSetSubsEmpty(
                tmSubsState.filter === 'active'
                    ? 'No active subscriptions.'
                    : (tmSubsState.filter === 'expired' ? 'No expired subscriptions.' : 'Nothing to show.')
            );
        }
        return;
    }

    // Render list
    if (tmSubsState.mode === 'v2') {
        tmSubsShow(tmSubsUI.loading, false);
        tmSubsShow(tmSubsUI.empty, false);
        if (tmSubsUI.list) {
            tmSubsUI.list.style.display = 'flex';
            tmSubsUI.list.innerHTML = '';
            items.forEach(it => tmSubsUI.list.appendChild(tmBuildSubsUserRow(it)));
        }
        return;
    }

    // legacy listWrap
    if (tmSubsUI.emptyWrap) tmSubsUI.emptyWrap.style.display = 'none';
    if (!tmSubsUI.listWrap) return;
    tmSubsUI.listWrap.style.display = 'block';
    tmSubsUI.listWrap.innerHTML = '';
    items.forEach(it => tmSubsUI.listWrap.appendChild(tmBuildSubCard(it)));
}

async function tmLoadSubscriptions(force = false) {
    if (!tmSubsState.uiReady) return;
    if (tmSubsState.loading) return;

    const now = Date.now();
    const fresh = tmSubsState.data && (now - (tmSubsState.fetchedAt || 0) < 15000);

    if (!force && fresh) {
        tmRenderSubscriptionsList();
        return;
    }

    tmSubsState.loading = true;
    tmSetSubsLoading();

    try {
        // Fetch both directions in one call (server returns {subscribed, subscribers})
        const payload = await getMySubscriptions();
        if (!payload || payload.ok !== true) {
            tmSubsState.data = { ok: false, subscribed: { items: [], counts: { all: 0, active: 0, expired: 0 } }, subscribers: { items: [], counts: { all: 0, active: 0, expired: 0 } } };
            tmSubsState.fetchedAt = Date.now();
            tmSetSubsEmpty(payload?.message || 'No subscriptions yet.');
            return;
        }

        tmSubsState.data = payload;
        tmSubsState.fetchedAt = Date.now();
        tmRenderSubscriptionsList();
    } catch (err) {
        console.error('Subscriptions load error:', err);
        tmSetSubsEmpty('Unable to load subscriptions.');
        try { TopToast.fire({ icon: 'error', title: 'Unable to load subscriptions' }); } catch (_) {}
    } finally {
        tmSubsState.loading = false;
    }
}

function tmSetSubsFilter(next) {
    const f = tmSubsNormalizeFilter(next);
    tmSubsState.filter = f;
    localStorage.setItem('tm_subs_filter', f);
    tmApplySubsPillActive();
    tmRenderSubscriptionsList();
}

function tmSetSubsDir(next) {
    const d = tmSubsNormalizeDir(next);
    if (tmSubsState.dir === d) return;
    tmSubsState.dir = d;
    localStorage.setItem('tm_subs_dir', d);
    tmApplySubsTabActive();
    tmRenderSubscriptionsList();
}

function tmEnterSubscriptionsView() {
    if (!tmEnsureSubscriptionsUI()) return;

    // Reset pills while loading (prevents stale UI)
    if (tmSubsState.mode === 'v2') {
        tmUpdateSubsCountsTop(tmSubsState.data || {});
        tmUpdateSubsPillsCounts(tmGetCurrentSubsPack()?.counts || { all: 0, active: 0, expired: 0 });
        tmUpdateSubsClearBtn();
    } else {
        // legacy
        tmUpdateSubsPillsCounts(tmSubsState.data?.subscribed?.counts || { active: 0, expired: 0 });
    }

    // Load/refresh
    tmLoadSubscriptions(false);
}

// =============================================================
// MOBILE BACK BUTTON (Profile) + POP-OVER COLLECTIONS FIX
// =============================================================
function tmBindProfileBackButton() {
    const btn = document.getElementById('profile-back-btn');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', () => {
        const prev = localStorage.getItem('tm_prev_view');
        if (prev && prev !== 'profile') switchView(prev);
        else switchView('home');
    });
}

function tmBindPopoverCollections() {
    const btn = document.getElementById('btn-pop-collections');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pop = document.getElementById('settings-popover');
        if (pop) pop.classList.remove('is-open');
        switchView('collections');
    });
}


// =============================================================
// RIGHT SIDEBAR: SUGGESTIONS (Data #4)
// - Uses GET /api/swipe/candidates as a simple source of accounts
// - Renders cards in #rs-suggestions-view .suggestion-list
// - Refresh icon rotates + refetches
// - "Hide suggestion" stored in localStorage
// =============================================================
let __tmSuggestionsBound = false;

function tmEscHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tmGetSuggEls() {
  const root = document.getElementById('rs-suggestions-view');
  if (!root) return {};
  return {
    root,
    list: root.querySelector('.suggestion-list'),
    refresh: root.querySelector('.sugg-actions i.fa-rotate')
  };
}

function tmGetHiddenSuggestions() {
  try { return JSON.parse(localStorage.getItem('tm_hidden_suggestions') || '[]') || []; }
  catch { return []; }
}

function tmSetHiddenSuggestions(arr) {
  try { localStorage.setItem('tm_hidden_suggestions', JSON.stringify(arr || [])); } catch {}
}

function tmSetSuggestionsCache(payload) {
  try { localStorage.setItem('tm_suggestions_cache', JSON.stringify(payload)); } catch {}
}

function tmGetSuggestionsCache() {
  try { return JSON.parse(localStorage.getItem('tm_suggestions_cache') || 'null'); }
  catch { return null; }
}

function tmDeriveHandle(id, name) {
  const raw = String(id || '').trim();
  if (raw.includes('@')) return '@' + raw.split('@')[0].replace(/[^a-zA-Z0-9._]/g, '').slice(0, 18);
  const base = String(name || 'member').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._]/g, '');
  return '@' + (base || 'member').slice(0, 18);
}

function tmRenderSuggestions(items, meta = {}) {
  const { list } = tmGetSuggEls();
  if (!list) return;

  const hidden = new Set(tmGetHiddenSuggestions());
  const rows = (items || []).filter(x => x && !hidden.has(x.id));

  if (!rows.length) {
    const msg = meta?.message || 'No suggestions';
    list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:0.9rem;">${tmEscHtml(msg)}</div>`;
    return;
  }

  list.innerHTML = rows.slice(0, 6).map((u) => {
    const id = tmEscHtml(u.id || '');
    const name = tmEscHtml(u.name || 'Member');
    const city = tmEscHtml(u.city || '');
    const age = (u.age != null) ? Number(u.age) : null;
    const avatar = tmEscHtml(u.photoUrl || u.avatarUrl || 'assets/images/truematch-mark.png');
    const handle = tmEscHtml(tmDeriveHandle(u.id, u.name));
    const badge = tmEscHtml(u.badge || 'MEMBER');
    const dot = (Math.random() < 0.35) ? `<div class="online-dot" title="Online"></div>` : ``;

    // Banner: reuse avatar (safe + consistent). If image fails, CSS bg shows.
    return `
      <div class="sugg-card" data-sugg-id="${id}">
        <div class="sugg-banner" style="background-image:url('${avatar}')">
          <div class="sugg-badge">${badge}</div>
          <div class="sugg-menu" role="button" aria-label="Options"><i class="fa-solid fa-ellipsis"></i></div>
        </div>
        <div class="sugg-details">
          <div class="sugg-avatar-wrap">
            <img src="${avatar}" alt="${name}">
            ${dot}
          </div>
          <div class="sugg-text">
            <div class="sugg-name">${name}${age ? `, ${age}` : ''}</div>
            <div class="sugg-handle">${handle}${city ? ` • ${city}` : ''}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind click handlers (modal + hide)
  list.querySelectorAll('.sugg-card').forEach(card => {
    const id = card.getAttribute('data-sugg-id') || '';

    // Options menu -> hide
    const menu = card.querySelector('.sugg-menu');
    if (menu) {
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
        Swal.fire({
          title: 'Suggestion',
          text: 'Hide this suggestion?',
          showCancelButton: true,
          confirmButtonText: 'Hide',
          confirmButtonColor: '#64E9EE',
          cancelButtonText: 'Cancel',
          background: '#0d1423',
          color: '#fff'
        }).then((r) => {
          if (r.isConfirmed) {
            const hiddenArr = tmGetHiddenSuggestions();
            if (!hiddenArr.includes(id)) hiddenArr.push(id);
            tmSetHiddenSuggestions(hiddenArr);
            // Remove visually
            card.remove();
            if (!list.querySelector('.sugg-card')) {
              list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:0.9rem;">No suggestions</div>`;
            }
            try { TopToast.fire({ icon: 'success', title: 'Hidden' }); } catch {}
          }
        });
      });
    }

    // Click card -> quick view
    card.addEventListener('click', () => {
      const name = card.querySelector('.sugg-name')?.textContent || 'Member';
      const handle = card.querySelector('.sugg-handle')?.textContent || '';
      const avatar = card.querySelector('img')?.getAttribute('src') || 'assets/images/truematch-mark.png';

      Swal.fire({
        title: tmEscHtml(name),
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
            <img src="${tmEscHtml(avatar)}" alt="" style="width:84px; height:84px; border-radius:50%; object-fit:cover; border:2px solid #64E9EE;" />
            <div style="color:var(--muted); font-size:0.9rem;">${tmEscHtml(handle)}</div>
            <div style="color:var(--muted); font-size:0.85rem; margin-top:6px;">Tip: Use Home search to explore posts & creators.</div>
          </div>
        `,
        confirmButtonText: 'Close',
        confirmButtonColor: '#64E9EE',
        background: '#0d1423',
        color: '#fff'
      });
    });
  });
}

async function tmFetchSuggestionsFromApi() {
  const res = await fetch('/api/swipe/candidates', { method: 'GET', credentials: 'include' });
  const data = await res.json().catch(() => null);
  if (!data || data.ok === false) {
    const err = (data && (data.error || data.message)) || (res.status === 401 ? 'Not authenticated' : 'Unable to load suggestions');
    throw new Error(err);
  }
  return data;
}

async function tmRefreshSuggestions(opts = { force: false }) {
  const { list, refresh } = tmGetSuggEls();
  if (!list) return;

  // cache (10 minutes)
  if (!opts.force) {
    const cached = tmGetSuggestionsCache();
    const ts = cached?.ts || 0;
    if (cached && Array.isArray(cached.items) && (Date.now() - ts) < 10 * 60 * 1000) {
      tmRenderSuggestions(cached.items, cached.meta || {});
      return;
    }
  }

  // loading state
  list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:0.9rem;">Loading…</div>`;
  if (refresh) refresh.classList.add('fa-spin');

  try {
    const payload = await tmFetchSuggestionsFromApi();
    const items = Array.isArray(payload.candidates) ? payload.candidates : [];
    const meta = { message: payload.message || '' };

    tmSetSuggestionsCache({ ts: Date.now(), items, meta });
    tmRenderSuggestions(items, meta);
  } catch (e) {
    tmRenderSuggestions([], { message: e?.message || 'Unable to load suggestions' });
    try { TopToast.fire({ icon: 'error', title: e?.message || 'Unable to load suggestions' }); } catch {}
  } finally {
    if (refresh) refresh.classList.remove('fa-spin');
  }
}

function tmInitSuggestionsSidebar() {
  if (__tmSuggestionsBound) return;
  __tmSuggestionsBound = true;

  const { refresh } = tmGetSuggEls();
  if (refresh && refresh.dataset.bound !== '1') {
    refresh.dataset.bound = '1';
    refresh.addEventListener('click', () => tmRefreshSuggestions({ force: true }));
  }

  // initial render (cache-first then fetch)
  tmRefreshSuggestions({ force: false });
}


document.addEventListener('DOMContentLoaded', init);