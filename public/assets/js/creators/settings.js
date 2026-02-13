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
