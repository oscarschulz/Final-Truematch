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

  // Hydrate (profile form only)
  if (target === 'profile') hydrateCreatorProfileForm(clone, me);

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
