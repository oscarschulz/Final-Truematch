import { DOM } from './dom.js';
import { apiMe, apiPost } from '/tm-api.js';

let __meCache = null;

const KEY_ALIASES = {
  'Display name': ['Display name', 'Name'],
};

function normKey(k) {
  return String(k || '').trim().toLowerCase();
}

function parsePacked(packed) {
  const map = new Map(); // normKey -> { key, value }
  const raw = String(packed || '');
  raw.split('|').forEach((part) => {
    const s = String(part || '').trim();
    if (!s) return;
    const idx = s.indexOf(':');
    if (idx === -1) return;
    const key = s.slice(0, idx).trim();
    const value = s.slice(idx + 1).trim();
    map.set(normKey(key), { key, value });
  });
  return map;
}

function getPacked(map, key) {
  const it = map.get(normKey(key));
  return it ? it.value : '';
}

function getPackedAny(map, key) {
  const aliases = KEY_ALIASES[key] || [key];
  for (const k of aliases) {
    const v = getPacked(map, k);
    if (v) return v;
  }
  return '';
}

function deleteAliases(map, key) {
  const aliases = KEY_ALIASES[key] || [];
  aliases.forEach((k) => {
    if (k === key) return;
    map.delete(normKey(k));
  });
}

function setPacked(map, key, value) {
  const v = String(value ?? '').trim();
  const nk = normKey(key);

  if (!v) {
    map.delete(nk);
    deleteAliases(map, key);
    return;
  }

  const existing = map.get(nk);
  map.set(nk, { key: existing?.key || String(key).trim(), value: v });
  deleteAliases(map, key);
}

function mapToPacked(map) {
  // Keep a stable order for the keys we care about, then append any extras.
  const canonicalOrder = [
    'Display name',
    'Bio',
    'Location',
    'Website URL',
    'Languages',
    'Category',
    'Niche',
    'Posting schedule',
    'Boundaries',
    'Style notes',
  ];

  const used = new Set();
  const parts = [];

  canonicalOrder.forEach((k) => {
    const nk = normKey(k);
    const it = map.get(nk);
    if (it && it.value) {
      parts.push(`${it.key}: ${it.value}`);
      used.add(nk);
    } else {
      // If canonical key missing, allow fallback aliases (e.g., Name -> Display name) once.
      const aliases = KEY_ALIASES[k] || [];
      for (const a of aliases) {
        const ai = map.get(normKey(a));
        if (ai && ai.value) {
          parts.push(`${k}: ${ai.value}`);
          used.add(normKey(a));
          break;
        }
      }
    }
  });

  // Append any remaining keys (don’t lose existing data you might add later).
  for (const [nk, it] of map.entries()) {
    if (used.has(nk)) continue;
    if (!it?.key || !it?.value) continue;
    parts.push(`${it.key}: ${it.value}`);
  }

  return parts.join(' | ');
}

async function ensureMe(force = false) {
  if (!force && __meCache) return __meCache;
  const me = await apiMe().catch(() => null);
  __meCache = me;
  return me;
}

function isDesktop() {
  return window.innerWidth > 1024;
}

function tmToast(title, icon = 'info') {
  try {
    if (window.Swal && typeof window.Swal.fire === 'function') {
      window.Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true,
        icon,
        title,
      });
      return;
    }
  } catch (_) {}
  // Fallback
  console.log(title);
}

function tmTimeAgo(ts) {
  const t = parseInt(String(ts || '0'), 10);
  if (!t || !isFinite(t)) return 'just now';
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function tmUserKey(u) {
  const email = String(u?.email || '').trim().toLowerCase();
  if (email) return `e:${email}`;
  const handle = String(u?.handle || '').trim().replace(/^@/, '').toLowerCase();
  if (handle) return `h:${handle}`;
  const name = String(u?.name || '').trim().toLowerCase();
  if (name) return `n:${name}`;
  return '';
}

function tmLoadUsers(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function tmSaveUsers(storageKey, arr) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.isArray(arr) ? arr : []));
  } catch {}
}

function tmRemoveUserByKey(storageKey, userKey) {
  try {
    const arr = tmLoadUsers(storageKey);
    const next = arr.filter(x => tmUserKey(x) !== userKey);
    tmSaveUsers(storageKey, next);
    return { before: arr.length, after: next.length };
  } catch {
    return { before: 0, after: 0 };
  }
}


function bindDisplayControls(container) {
  if (!container) return;

  const themeToggle = container.querySelector('#setting-theme-toggle');
  if (themeToggle && !themeToggle.__tmBound) {
    themeToggle.__tmBound = true;

    // Sync initial state from body class
    themeToggle.checked = document.body.classList.contains('tm-dark');

    themeToggle.addEventListener('change', () => {
      const on = !!themeToggle.checked;

      document.body.classList.toggle('tm-dark', on);
      document.body.classList.toggle('tm-light', !on);

      // Sync any global theme toggle if present
      try {
        if (DOM?.themeToggle) DOM.themeToggle.checked = on;
      } catch (_) {}

      // Persist (optional)
      try { localStorage.setItem('tm_theme', on ? 'dark' : 'light'); } catch (_) {}
    });
  }

  const langSelect = container.querySelector('#settings-lang-select');
  if (langSelect && !langSelect.__tmBound) {
    langSelect.__tmBound = true;

    // Restore saved language (if any)
    try {
      const saved = localStorage.getItem('tm_lang');
      if (saved) langSelect.value = saved;
    } catch (_) {}

    langSelect.addEventListener('change', () => {
      try { localStorage.setItem('tm_lang', langSelect.value); } catch (_) {}
      tmToast('Language saved. Refresh to apply.', 'success');
    });
  }
}

function bindSecurityControls(container) {
  if (!container) return;

  // Password inputs are inside the SECURITY section and appear in this order:
  // 1) current, 2) new, 3) confirm
  const pwdInputs = Array.from(container.querySelectorAll('input[type="password"]'));
  if (pwdInputs.length >= 1) {
    pwdInputs.forEach((input) => {
      const wrap = input.closest('.input-with-icon');
      const icon = wrap ? wrap.querySelector('i.fa-eye, i.fa-eye-slash, i.fa-regular') : null;
      if (!icon || icon.__tmBound) return;
      icon.__tmBound = true;
      icon.style.cursor = 'pointer';
      icon.addEventListener('click', () => {
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        icon.classList.toggle('fa-eye', isPwd);
        icon.classList.toggle('fa-eye-slash', !isPwd);
      });
    });
  }

  const btn = container.querySelector('.btn-submit-card');
  if (btn && !btn.__tmBound) {
    btn.__tmBound = true;
    btn.addEventListener('click', async () => {
      const cur = (pwdInputs[0] ? pwdInputs[0].value : '').toString();
      const nxt = (pwdInputs[1] ? pwdInputs[1].value : '').toString();
      const cnf = (pwdInputs[2] ? pwdInputs[2].value : '').toString();

      if (!nxt || nxt.trim().length < 8) {
        tmToast('New password must be at least 8 characters.', 'error');
        return;
      }
      if (nxt !== cnf) {
        tmToast('New password and confirm password do not match.', 'error');
        return;
      }

      const orig = btn.textContent;
      btn.disabled = true;
      btn.classList.add('loading');
      btn.textContent = 'UPDATING...';

      try {
        const out = await apiPost('/api/me/password', { currentPassword: cur, newPassword: nxt }).catch(() => null);
        if (!out || !out.ok) {
          const msg = (out && (out.message || out.error)) ? (out.message || out.error) : 'Failed to update password.';
          // Map common server codes to readable text
          const pretty = (msg === 'wrong_password') ? 'Current password is wrong.' :
                         (msg === 'password_too_short') ? 'New password must be at least 8 characters.' :
                         msg;
          tmToast(pretty, 'error');
          return;
        }

        // Clear fields
        pwdInputs.forEach((i) => { try { i.value = ''; } catch (_) {} });
        tmToast('Password updated.', 'success');
      } catch (e) {
        console.error(e);
        tmToast('Failed to update password. Please try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.textContent = orig;
      }
    });
  }

  // --- Two-Factor Authentication (client-only toggle for now) ---
  try {
    const hdrs = Array.from(container.querySelectorAll('.set-section-header'));
    const twofaHdr = hdrs.find(h => String(h.textContent || '').toLowerCase().includes('two-factor'));
    if (twofaHdr) {
      const row = twofaHdr.nextElementSibling;
      const cb = row ? row.querySelector('input[type="checkbox"]') : null;
      if (cb && !cb.__tmBound) {
        cb.__tmBound = true;
        const KEY = 'tm_2fa_enabled';

        // hydrate
        let saved = null;
        try { saved = localStorage.getItem(KEY); } catch (_) {}
        cb.checked = (saved === '1' || saved === 'true');

        cb.addEventListener('change', () => {
          const on = !!cb.checked;
          try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (_) {}
          tmToast(on ? 'Two-factor enabled (demo).' : 'Two-factor disabled.', 'success');
        });
      }
    }
  } catch (_) {}

  // --- Login Activity (client-only display) ---
  try {
    const hdrs = Array.from(container.querySelectorAll('.set-section-header'));
    const loginHdr = hdrs.find(h => String(h.textContent || '').toLowerCase().includes('login activity'));
    if (loginHdr) {
      const row = loginHdr.nextElementSibling;
      const small = row ? row.querySelector('small') : null;
      if (small) {
        const ua = String(navigator.userAgent || '');
        const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
        const device = isMobile ? 'Mobile' : 'Desktop';

        let lastSeen = 0;
        try { lastSeen = parseInt(localStorage.getItem('tm_last_seen') || '0', 10) || 0; } catch (_) {}
        try { localStorage.setItem('tm_last_seen', String(Date.now())); } catch (_) {}

        const lastTxt = lastSeen ? tmTimeAgo(lastSeen) : 'just now';
        small.textContent = `Active now • ${device} • last seen ${lastTxt}`;
      }
    }
  } catch (_) {}

}

function bindPrivacyControls(container) {
  if (!container) return;

  const toggles = Array.from(container.querySelectorAll('.toggle-row input[type="checkbox"]'));
  const KEY_ACTIVITY = 'tm_priv_show_activity_status';
  const KEY_OFFERS = 'tm_priv_show_sub_offers';

  function lsGet(key, defVal) {
    try {
      const v = localStorage.getItem(key);
      if (v === null || v === undefined) return defVal;
      return (v === '1' || v === 'true');
    } catch {
      return defVal;
    }
  }

  function lsSet(key, on) {
    try { localStorage.setItem(key, on ? '1' : '0'); } catch {}
  }

  // Toggle #1: Activity Status
  if (toggles[0] && !toggles[0].__tmBound) {
    const cb = toggles[0];
    cb.__tmBound = true;
    cb.checked = lsGet(KEY_ACTIVITY, true);
    cb.addEventListener('change', () => {
      const on = !!cb.checked;
      lsSet(KEY_ACTIVITY, on);
      tmToast(on ? 'Activity status is ON.' : 'Activity status is OFF.', 'success');
    });
  }

  // Toggle #2: Subscription Offers
  if (toggles[1] && !toggles[1].__tmBound) {
    const cb = toggles[1];
    cb.__tmBound = true;
    cb.checked = lsGet(KEY_OFFERS, true);
    cb.addEventListener('change', () => {
      const on = !!cb.checked;
      lsSet(KEY_OFFERS, on);
      tmToast(on ? 'Subscription offers are ON.' : 'Subscription offers are OFF.', 'success');
    });
  }

  // Blocked / Restricted rows -> modal list (localStorage)
  const rows = Array.from(container.querySelectorAll('.set-link-row'));

  function findRow(labelText) {
    const want = String(labelText || '').trim().toLowerCase();
    return rows.find(r => {
      const s = r.querySelector('span');
      const t = String(s ? s.textContent : r.textContent || '').trim().toLowerCase();
      return t == want;
    });
  }

  function buildUserRowHTML(u, actionLabel) {
    const name = String(u?.name || '').trim() || 'User';
    const handle = String(u?.handle || '').trim();
    const email = String(u?.email || '').trim();
    const avatar = String(u?.avatarUrl || u?.avatar || '').trim();
    const ts = u?.ts || 0;
    const key = tmUserKey(u);

    const sub = handle ? `@${handle.replace(/^@/, '')}` : (email || '');
    const when = ts ? tmTimeAgo(ts) : '';

    const av = avatar
      ? `<img src="${avatar}" alt="" style="width:40px;height:40px;border-radius:12px;object-fit:cover;" />`
      : `<div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:var(--muted);font-weight:800;">${name.slice(0,1).toUpperCase()}</div>`;

    return `
      <div class="tm-ul-row" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          ${av}
          <div style="display:flex;flex-direction:column;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;min-width:0;">
              <span style="font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</span>
              ${u?.verified ? '<span style="font-size:0.75rem;color:#46e85e;">✓</span>' : ''}
            </div>
            <small style="color:var(--muted);font-size:0.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}${when ? ' • ' + when : ''}</small>
          </div>
        </div>
        <button data-ul-action="remove" data-ul-key="${key}" style="background:transparent;border:1px solid rgba(255,255,255,0.22);color:var(--text);padding:7px 12px;border-radius:999px;font-weight:800;font-size:0.8rem;cursor:pointer;white-space:nowrap;">${actionLabel}</button>
      </div>
    `;
  }

  function openListModal(title, storageKey, actionLabel) {
    if (!window.Swal || typeof window.Swal.fire !== 'function') {
      alert('Swal (SweetAlert2) is required for this modal.');
      return;
    }

    window.Swal.fire({
      title,
      html: `<div id="tm-ul-wrap" style="text-align:left;"></div>`,
      background: '#0d1423',
      color: '#fff',
      width: 520,
      confirmButtonText: 'Close',
      confirmButtonColor: '#64E9EE',
      showCloseButton: true,
      didOpen: () => {
        const wrap = window.Swal.getHtmlContainer().querySelector('#tm-ul-wrap');

        const rerender = () => {
          const users = tmLoadUsers(storageKey)
            .filter(u => tmUserKey(u))
            .sort((a,b) => (b.ts || 0) - (a.ts || 0));

          if (!users.length) {
            wrap.innerHTML = `
              <div style="padding:14px 6px;color:var(--muted);">
                No users yet.
              </div>
            `;
            return;
          }

          wrap.innerHTML = users.map(u => buildUserRowHTML(u, actionLabel)).join('');

          wrap.querySelectorAll('button[data-ul-action="remove"]').forEach((btn) => {
            if (btn.__tmBound) return;
            btn.__tmBound = true;
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const k = btn.getAttribute('data-ul-key') || '';
              if (!k) return;
              tmRemoveUserByKey(storageKey, k);
              rerender();
              tmToast(`${actionLabel} successful.`, 'success');
            });
          });
        };

        rerender();
      }
    });
  }

  const blockedRow = findRow('Blocked Users');
  if (blockedRow && !blockedRow.__tmBound) {
    blockedRow.__tmBound = true;
    blockedRow.style.cursor = 'pointer';
    blockedRow.addEventListener('click', () => openListModal('Blocked Users', 'tm_blocked_users', 'Unblock'));
  }

  const restrictedRow = findRow('Restricted Users');
  if (restrictedRow && !restrictedRow.__tmBound) {
    restrictedRow.__tmBound = true;
    restrictedRow.style.cursor = 'pointer';
    restrictedRow.addEventListener('click', () => openListModal('Restricted Users', 'tm_restricted_users', 'Unrestrict'));
  }
}





function bindNotificationsControls(container) {
  if (!container) return;

  const toggles = Array.from(container.querySelectorAll('.toggle-row input[type="checkbox"]'));
  // Expected order in settings.html:
  // 0 = New Subscriber (Push)
  // 1 = Tips (Push)
  // 2 = Messages (Push)
  // 3 = New Login (Email)
  const KEYS = [
    { key: 'tm_notif_push_new_subscriber', labelOn: 'Push: New Subscriber ON.', labelOff: 'Push: New Subscriber OFF.', isPush: true },
    { key: 'tm_notif_push_tips', labelOn: 'Push: Tips ON.', labelOff: 'Push: Tips OFF.', isPush: true },
    { key: 'tm_notif_push_messages', labelOn: 'Push: Messages ON.', labelOff: 'Push: Messages OFF.', isPush: true },
    { key: 'tm_notif_email_new_login', labelOn: 'Email: New Login ON.', labelOff: 'Email: New Login OFF.', isPush: false },
  ];

  function lsGetBool(key, defVal) {
    try {
      const v = localStorage.getItem(key);
      if (v === null || v === undefined) return defVal;
      return (v === '1' || v === 'true');
    } catch {
      return defVal;
    }
  }

  function lsSetBool(key, on) {
    try { localStorage.setItem(key, on ? '1' : '0'); } catch {}
  }

  function syncGlobalCache() {
    const out = {};
    KEYS.forEach((it) => {
      out[it.key] = lsGetBool(it.key, true);
    });
    window.__tmNotificationSettings = out;
    try { localStorage.setItem('tm_notification_settings', JSON.stringify(out)); } catch {}
  }

  async function ensurePushPermission() {
    if (!('Notification' in window)) return true;

    // If user already granted, we're good.
    if (Notification.permission === 'granted') return true;

    // If denied, user must change browser/site settings manually.
    if (Notification.permission === 'denied') return false;

    try {
      const p = await Notification.requestPermission();
      return p === 'granted';
    } catch {
      return false;
    }
  }

  KEYS.forEach((meta, idx) => {
    const cb = toggles[idx];
    if (!cb || cb.__tmBound) return;

    cb.__tmBound = true;
    cb.checked = lsGetBool(meta.key, true);

    cb.addEventListener('change', async () => {
      let on = !!cb.checked;

      if (meta.isPush && on) {
        const ok = await ensurePushPermission();
        if (!ok) {
          // Revert toggle
          cb.checked = false;
          on = false;
          tmToast('Push notifications are blocked. Enable notifications for this site in your browser settings.', 'error');
        }
      }

      lsSetBool(meta.key, on);
      syncGlobalCache();
      tmToast(on ? meta.labelOn : meta.labelOff, 'success');
    });
  });

  // Make sure global cache exists even before any toggles are used
  syncGlobalCache();
}


function setActiveMenuItem(el) {
  document.querySelectorAll('.set-item.active').forEach((x) => x.classList.remove('active'));
  if (el) el.classList.add('active');
}

function getMenuUsernameEl() {
  return document.querySelector('#view-settings .set-group-title');
}

function getMobileDetailHost() {
  let host = document.getElementById('settings-mobile-detail');
  if (!host) {
    host = document.createElement('div');
    host.id = 'settings-mobile-detail';
    host.className = 'settings-mobile-detail hidden';
    host.setAttribute('aria-hidden', 'true');
    const view = document.getElementById('view-settings');
    if (view) view.appendChild(host);
    else document.body.appendChild(host);
  }
  return host;
}

function closeMobileDetail() {
  const host = document.getElementById('settings-mobile-detail');
  if (!host) return;

  host.classList.remove('is-open');
  host.setAttribute('aria-hidden', 'true');

  // Hide after transition
  window.setTimeout(() => {
    host.classList.add('hidden');
    host.innerHTML = '';
  }, 240);
}

function openMobileDetail(target, me) {
  const host = getMobileDetailHost();
  const src = document.getElementById(`set-content-${target}-source`);
  if (!src) return;

  host.innerHTML = '';
  host.classList.remove('hidden');
  host.setAttribute('aria-hidden', 'false');

  const clone = src.cloneNode(true);
  clone.id = `set-content-${target}-mobile`;

  // Make sure anything that was hidden in the source becomes visible in the clone.
  clone.querySelectorAll('.hidden').forEach((n) => n.classList.remove('hidden'));

  // Inject a back button into the section header on mobile.
  const header = clone.querySelector('.rs-col-header');
  if (header) {
    header.classList.add('tm-mobile-detail-header');
    if (!header.querySelector('.tm-mobile-back')) {
      const back = document.createElement('i');
      back.className = 'fa-solid fa-arrow-left tm-mobile-back';
      back.title = 'Back';
      back.addEventListener('click', closeMobileDetail);
      header.insertBefore(back, header.firstChild);
    }
  }

  host.appendChild(clone);

  // Hydrate
  if (target === 'profile') hydrateCreatorProfileForm(clone, me);
  if (target === 'display') bindDisplayControls(clone, me);
  if (target === 'security') bindSecurityControls(clone, me);
  if (target === 'privacy') bindPrivacyControls(clone, me);
  if (target === 'notifications') bindNotificationsControls(clone, me);
  if (target === 'account') bindAccountControls(clone, me);

  // Slide in
  requestAnimationFrame(() => host.classList.add('is-open'));
}

function renderSettingsTargetDesktop(target, me) {
  if (!DOM?.rsSettingsView) return;

  const src = document.getElementById(`set-content-${target}-source`);
  DOM.rsSettingsView.innerHTML = '';
  if (!src) return;

  const clone = src.cloneNode(true);
  clone.id = `set-content-${target}`;
  clone.classList.remove('hidden');
  clone.querySelectorAll('.hidden').forEach((n) => n.classList.remove('hidden'));
  DOM.rsSettingsView.appendChild(clone);

  if (target === 'profile') hydrateCreatorProfileForm(clone, me);
  if (target === 'display') bindDisplayControls(clone, me);
  if (target === 'security') bindSecurityControls(clone, me);
  if (target === 'privacy') bindPrivacyControls(clone, me);
  if (target === 'notifications') bindNotificationsControls(clone, me);
  if (target === 'account') bindAccountControls(clone, me);
}

function bindMetaCounter(fieldEl) {
  const group = fieldEl?.closest?.('.ac-group');
  if (!group) return;

  // Prefer the plain counter badge used in some fields (e.g., Display Name, Bio)
  const simple = group.querySelector('.char-count');
  // Or the meta row (used in Style Notes)
  const meta = group.querySelector('.field-meta span:last-child');

  const maxAttr = fieldEl.getAttribute('maxlength');
  const max = maxAttr ? (parseInt(maxAttr, 10) || null) : null;

  const update = () => {
    const len = String(fieldEl.value || '').length;
    const txt = max ? `${len}/${max}` : `${len}`;
    if (simple) simple.textContent = txt;
    if (meta) meta.textContent = txt;
  };

  fieldEl.addEventListener('input', update);
  update();
}

function hydrateCreatorProfileForm(container, me) {
  const packed = me?.user?.creatorApplication?.contentStyle || '';
  const map = parsePacked(packed);

  container.querySelectorAll('[data-creator-key]').forEach((el) => {
    const key = el.getAttribute('data-creator-key');
    if (!key) return;

    const val = getPackedAny(map, key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = val || '';
      bindMetaCounter(el);
    }
  });

  const btn = container.querySelector('[data-action="save-profile"]');
  if (btn && !btn.__tmBound) {
    btn.__tmBound = true;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.classList.add('loading');
      try {
        await saveCreatorProfile(container);
        // Keep everything consistent (profile card, popovers, etc.)
        window.location.reload();
      } catch (e) {
        console.error(e);
        alert(e?.message || 'Failed to save. Please try again.');
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });
  }
}

async function saveCreatorProfile(container) {
  const me = await ensureMe(true);
  if (!me?.ok) throw new Error('Not logged in');

  const prevPacked = me?.user?.creatorApplication?.contentStyle || '';
  const map = parsePacked(prevPacked);

  container.querySelectorAll('[data-creator-key]').forEach((el) => {
    const key = el.getAttribute('data-creator-key');
    if (!key) return;
    setPacked(map, key, (el.value ?? '').toString());
  });

  const nextPacked = mapToPacked(map);

  const out = await apiPost('/api/me/creator/profile', { contentStyle: nextPacked }).catch(() => null);
  if (!out?.ok) throw new Error(out?.error || 'Save failed');

  __meCache = null;
  await ensureMe(true);
}


function bindAccountControls(container, me) {
  if (!container) return;

  const groups = Array.from(container.querySelectorAll('.ac-group'));

  const getInput = (labelText) => {
    const want = String(labelText || '').trim().toLowerCase();
    const g = groups.find((x) => {
      const lab = x.querySelector('label');
      const t = String(lab ? lab.textContent : '').trim().toLowerCase();
      return t === want;
    });
    return g ? g.querySelector('input') : null;
  };

  const inUsername = getInput('Username');
  const inEmail = getInput('Email');
  const inPhone = getInput('Phone Number');

  const curUsername = String(me?.user?.username || me?.user?.handle || '').replace(/^@/, '');
  const curEmail = String(me?.user?.email || '');
  const curPhone = String(me?.user?.phone || me?.user?.phoneNumber || me?.user?.phone_number || '');

  if (inUsername && !inUsername.__tmHydrated) {
    inUsername.__tmHydrated = true;
    inUsername.value = curUsername || '';
    inUsername.setAttribute('autocomplete', 'username');
    inUsername.addEventListener('input', () => {
      // hard trim spaces only
      inUsername.value = String(inUsername.value || '').replace(/\s+/g, '');
    });
  } else if (inUsername) {
    inUsername.value = curUsername || '';
  }

  if (inEmail && !inEmail.__tmHydrated) {
    inEmail.__tmHydrated = true;
    inEmail.value = curEmail || '';
    inEmail.setAttribute('autocomplete', 'email');
  } else if (inEmail) {
    inEmail.value = curEmail || '';
  }

  if (inPhone && !inPhone.__tmHydrated) {
    inPhone.__tmHydrated = true;
    inPhone.value = curPhone || '';
    inPhone.setAttribute('autocomplete', 'tel');
  } else if (inPhone) {
    inPhone.value = curPhone || '';
  }

  // Insert a SAVE button (settings.html does not include one for Account section)
  const hasSave = !!container.querySelector('[data-action="save-account"]');
  if (!hasSave) {
    const headers = Array.from(container.querySelectorAll('.set-section-header'));
    const deleteHdr = headers.find((h) => String(h.textContent || '').toLowerCase().includes('delete account'));

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'flex-end';
    row.style.marginTop = '16px';
    row.style.marginBottom = '6px';

    const btn = document.createElement('button');
    btn.className = 'btn-submit-card';
    btn.textContent = 'SAVE CHANGES';
    btn.setAttribute('data-action', 'save-account');
    btn.style.width = 'auto';
    btn.style.minWidth = 'auto';
    btn.style.padding = '10px 26px';
    btn.style.fontSize = '0.9rem';

    row.appendChild(btn);

    if (deleteHdr && deleteHdr.parentNode) {
      deleteHdr.parentNode.insertBefore(row, deleteHdr);
    } else {
      container.appendChild(row);
    }
  }

  const saveBtn = container.querySelector('[data-action="save-account"]');
  if (saveBtn && !saveBtn.__tmBound) {
    saveBtn.__tmBound = true;

    saveBtn.addEventListener('click', async () => {
      const nextUsernameRaw = String(inUsername ? inUsername.value : '').trim().replace(/^@/, '');
      const nextEmailRaw = String(inEmail ? inEmail.value : '').trim().toLowerCase();
      const nextPhoneRaw = String(inPhone ? inPhone.value : '').trim();

      // Basic client validation (server validates again)
      if (nextUsernameRaw) {
        const okLen = (nextUsernameRaw.length >= 3 && nextUsernameRaw.length <= 30);
        const okChars = /^[a-zA-Z0-9._]+$/.test(nextUsernameRaw);
        if (!okLen || !okChars) {
          tmToast('Username must be 3–30 chars (letters, numbers, dot, underscore).', 'error');
          return;
        }
      }

      if (nextEmailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmailRaw)) {
        tmToast('Please enter a valid email.', 'error');
        return;
      }

      const payload = {};
      // Update only what user actually typed (avoid overwriting with blanks)
      if (nextUsernameRaw && nextUsernameRaw !== String(curUsername || '')) payload.username = nextUsernameRaw;
      if (nextEmailRaw && nextEmailRaw !== String(curEmail || '').toLowerCase()) payload.email = nextEmailRaw;
      if (nextPhoneRaw && nextPhoneRaw !== String(curPhone || '')) payload.phone = nextPhoneRaw;

      if (!Object.keys(payload).length) {
        tmToast('No changes to save.', 'info');
        return;
      }

      const orig = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.classList.add('loading');
      saveBtn.textContent = 'SAVING...';

      try {
        const out = await apiPost('/api/me/profile', payload).catch(() => null);
        if (!out || !out.ok) {
          const msg = (out && (out.message || out.error)) ? (out.message || out.error) : 'Failed to update account.';
          const pretty =
            (msg === 'invalid email') ? 'Invalid email.' :
            (msg === 'invalid username') ? 'Invalid username.' :
            (msg === 'invalid phone') ? 'Invalid phone number.' :
            msg;
          tmToast(pretty, 'error');
          return;
        }

        __meCache = null;
        const meFresh = await ensureMe(true);

        // Update menu username immediately
        const handle =
          meFresh?.user?.creatorApplication?.handle ||
          meFresh?.user?.username ||
          meFresh?.user?.handle ||
          '';
        const u = getMenuUsernameEl();
        if (u) u.textContent = `@${(handle || 'username').replace(/^@/, '')}`;

        tmToast('Account updated.', 'success');
      } catch (e) {
        console.error(e);
        tmToast('Failed to update account. Please try again.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.classList.remove('loading');
        saveBtn.textContent = orig;
      }
    });
  }

  
  // Linked Accounts (Google / Twitter)
  const linkRows = Array.from(container.querySelectorAll('.set-link-row'));
  if (linkRows.length) {
    const getProviderFromRow = (row) => {
      const t = (row.textContent || '').toLowerCase();
      if (t.includes('google')) return 'google';
      if (t.includes('twitter')) return 'twitter';
      return '';
    };

    const getActionSpan = (row) => {
      const spans = row.querySelectorAll('span');
      return spans && spans.length ? spans[spans.length - 1] : null;
    };

    const getLinked = () => (me && me.user && (me.user.linkedAccounts || me.user.linked_accounts)) || {};

    const refreshRow = (row) => {
      const provider = getProviderFromRow(row);
      const action = getActionSpan(row);
      if (!provider || !action) return;

      const linked = getLinked() || {};
      const entry = linked[provider] || null;
      const connected = !!entry;

      action.textContent = connected ? 'Disconnect' : 'Connect';

      // Non-invasive UI hint
      row.setAttribute('data-connected', connected ? '1' : '0');
      if (connected && entry && entry.value) {
        row.title = `Connected: ${entry.value}`;
      } else {
        row.title = '';
      }
    };

    // Initialize UI
    linkRows.forEach(refreshRow);

    // Bind actions
    linkRows.forEach((row) => {
      const provider = getProviderFromRow(row);
      const action = getActionSpan(row);
      if (!provider || !action) return;

      if (action.__tmBound) return;
      action.__tmBound = true;

      action.style.cursor = 'pointer';

      action.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const linked = getLinked() || {};
        const entry = linked[provider] || null;
        const connected = !!entry;

        if (!window.Swal || typeof window.Swal.fire !== 'function') {
          // Fallback
          if (connected) {
            if (!confirm(`Disconnect ${provider}?`)) return;
            const r = await apiPost('/api/me/linked-accounts/disconnect', { provider }).catch(() => null);
            if (!r || !r.ok) return tmToast('Failed to disconnect.', 'error');
          } else {
            const v = prompt(provider === 'google' ? 'Enter your Google email' : 'Enter your Twitter handle (@handle)');
            if (v === null) return;
            const r = await apiPost('/api/me/linked-accounts/connect', { provider, value: String(v || '').trim() }).catch(() => null);
            if (!r || !r.ok) return tmToast('Failed to connect.', 'error');
            if (r.linkedAccounts) {
              me.user.linkedAccounts = r.linkedAccounts;
            }
          }
          refreshRow(row);
          return;
        }

        if (connected) {
          const out = await window.Swal.fire({
            icon: 'warning',
            title: `Disconnect ${provider}?`,
            text: 'You can connect again later.',
            showCancelButton: true,
            confirmButtonText: 'Disconnect',
            cancelButtonText: 'Cancel'
          });

          if (!out.isConfirmed) return;

          const r = await apiPost('/api/me/linked-accounts/disconnect', { provider }).catch(() => null);
          if (!r || !r.ok) return tmToast('Failed to disconnect.', 'error');

          // Update local cache
          const next = { ...(me.user.linkedAccounts || {}) };
          delete next[provider];
          me.user.linkedAccounts = next;

          tmToast('Disconnected.', 'success');
          refreshRow(row);
          return;
        }

        // Connect flow (manual value for now)
        const out = await window.Swal.fire({
          icon: 'info',
          title: provider === 'google' ? 'Connect Google' : 'Connect Twitter',
          input: 'text',
          inputLabel: provider === 'google' ? 'Google email' : 'Twitter handle',
          inputPlaceholder: provider === 'google' ? 'you@gmail.com' : '@yourhandle',
          showCancelButton: true,
          confirmButtonText: 'Connect',
          cancelButtonText: 'Cancel',
          inputValidator: (v) => {
            const val = String(v || '').trim();
            if (!val) return 'This field is required.';
            if (provider === 'google') {
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email.';
            } else {
              const h = val.replace(/^@/, '');
              if (!/^[a-zA-Z0-9_]{1,15}$/.test(h)) return 'Invalid handle.';
            }
            return null;
          }
        });

        if (!out.isConfirmed) return;

        const value = String(out.value || '').trim();
        const r = await apiPost('/api/me/linked-accounts/connect', { provider, value }).catch(() => null);
        if (!r || !r.ok) return tmToast('Failed to connect.', 'error');

        if (r.linkedAccounts) {
          me.user.linkedAccounts = r.linkedAccounts;
        } else {
          me.user.linkedAccounts = { ...(me.user.linkedAccounts || {}), [provider]: { value, connectedAt: new Date().toISOString() } };
        }

        tmToast('Connected.', 'success');
        refreshRow(row);
      });
    });
  }

  // Delete account button (REAL DB delete)
  const delBtn = container.querySelector('.btn-delete-account');
  if (delBtn && !delBtn.__tmBound) {
    delBtn.__tmBound = true;
    delBtn.addEventListener('click', async () => {
      if (!window.Swal || typeof window.Swal.fire !== 'function') {
        alert('SweetAlert2 is required for Delete Account confirmation.');
        return;
      }

      const out = await window.Swal.fire({
        icon: 'warning',
        title: 'Delete account?',
        html: `
          <div style="text-align:left">
            <div style="margin-bottom:6px">This will permanently delete your account and sign you out.</div>
            <div style="margin-bottom:6px"><b>Type DELETE</b> to confirm.</div>
          </div>
        `,
        input: 'text',
        inputPlaceholder: 'DELETE',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        inputValidator: (v) => {
          const val = String(v || '').trim().toUpperCase();
          if (val !== 'DELETE') return 'You must type DELETE to confirm.';
          return null;
        }
      });

      if (!out.isConfirmed) return;

      delBtn.disabled = true;

      const r = await apiPost('/api/me/delete-account', { confirm: 'DELETE' }).catch(() => null);
      if (!r || !r.ok) {
        delBtn.disabled = false;
        return tmToast('Delete failed. Try again.', 'error');
      }

      tmToast('Account deleted.', 'success');

      // Redirect to landing (cookie is cleared server-side)
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    });
  }

}

export function initSettings() {
  (async () => {
    const me = await ensureMe(true);

    // Update username placeholder in settings menu
    const handle =
      me?.user?.creatorApplication?.handle ||
      me?.user?.username ||
      me?.user?.handle ||
      me?.user?.creatorHandle ||
      '';
    const u = getMenuUsernameEl();
    if (u) u.textContent = `@${(handle || 'username').replace(/^@/, '')}`;

    // Bind clicks on settings menu items
    document.querySelectorAll('#view-settings .set-item').forEach((el) => {
      el.addEventListener('click', async () => {
        const target = el.getAttribute('data-target');
        if (!target) return;

        setActiveMenuItem(el);
        const meFresh = await ensureMe(true);

        if (isDesktop()) {
          renderSettingsTargetDesktop(target, meFresh);
        } else {
          openMobileDetail(target, meFresh);
        }
      });
    });

    // Default: open Profile in desktop right panel
    const first = document.querySelector('#view-settings .set-item[data-target="profile"]') ||
                  document.querySelector('#view-settings .set-item');
    setActiveMenuItem(first);

    if (isDesktop()) {
      renderSettingsTargetDesktop('profile', me);
    }

    // Expose a global close so app.js can close the detail view when switching views
    window.__tmCloseSettingsMobileDetail = closeMobileDetail;

    // Close detail if viewport becomes desktop
    window.addEventListener('resize', () => {
      if (isDesktop()) closeMobileDetail();
    });
  })().catch((e) => console.error('initSettings error', e));
}
