import { DOM } from './dom.js';
import { apiMe, apiPost } from './tm-api.js';

let __meCache = null;

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

function setPacked(map, key, value) {
  const v = String(value ?? '').trim();
  const nk = normKey(key);
  if (!v) {
    map.delete(nk);
    return;
  }
  const existing = map.get(nk);
  map.set(nk, { key: existing?.key || String(key).trim(), value: v });
}

function mapToPacked(map) {
  // Keep a stable order for the keys we care about, then append any extras.
  const canonicalOrder = [
    'Name',
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
  const me = await apiMe();
  __meCache = me;
  return me;
}

function setActiveNav(el) {
  document.querySelectorAll('.set-nav-item.active').forEach((x) => x.classList.remove('active'));
  if (el) el.classList.add('active');
}

function renderSettingsTarget(target, me) {
  if (!DOM?.rsSettingsView) return;

  const src = document.getElementById(`set-content-${target}-source`);
  DOM.rsSettingsView.innerHTML = '';
  if (!src) return;

  const clone = src.cloneNode(true);
  clone.id = `set-content-${target}`;
  clone.classList.remove('hidden');

  // Ensure any "hidden" on children is removed (some blocks use hidden on the wrapper only, but safe)
  clone.querySelectorAll('.hidden').forEach((n) => n.classList.remove('hidden'));

  DOM.rsSettingsView.appendChild(clone);

  // Header username placeholders (mobile + desktop)
  const handle =
    me?.user?.creatorApplication?.handle ||
    me?.user?.username ||
    me?.user?.handle ||
    me?.user?.creatorHandle ||
    '';
  if (DOM.setHeaderUsername) DOM.setHeaderUsername.textContent = `@${handle || 'username'}`;
  if (DOM.setHeaderUsernameMobile) DOM.setHeaderUsernameMobile.textContent = `@${handle || 'username'}`;

  if (target === 'profile') {
    hydrateCreatorProfileForm(clone, me);
  }
}

function bindMetaCounter(container, fieldEl) {
  const group = fieldEl?.closest?.('.ac-group');
  if (!group) return;
  const meta = group.querySelector('.field-meta span:last-child');
  if (!meta) return;

  const max = parseInt(fieldEl.getAttribute('maxlength') || '0', 10) || null;
  const update = () => {
    const len = String(fieldEl.value || '').length;
    if (max) meta.textContent = `${len}/${max}`;
    else meta.textContent = `${len}`;
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
    const val = getPacked(map, key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = val || '';
      bindMetaCounter(container, el);
    }
  });

  const btn = container.querySelector('[data-action="save-profile"]');
  if (btn) {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.classList.add('loading');
      try {
        await saveCreatorProfile(container);
        // Reload so profile view and nav are instantly consistent everywhere.
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
  const prevPacked = me?.user?.creatorApplication?.contentStyle || '';
  const map = parsePacked(prevPacked);

  container.querySelectorAll('[data-creator-key]').forEach((el) => {
    const key = el.getAttribute('data-creator-key');
    if (!key) return;
    const val = (el.value ?? '').toString();
    setPacked(map, key, val);
  });

  const nextPacked = mapToPacked(map);

  const out = await apiPost('/api/me/creator/profile', {
    contentStyle: nextPacked,
  });

  if (!out?.ok) {
    throw new Error(out?.error || 'Save failed');
  }

  __meCache = null;
  await ensureMe(true);
}

export function initSettings() {
  (async () => {
  const me = await ensureMe(true);

  // Clicking settings left-menu items renders the matching content in the right panel.
  document.querySelectorAll('.set-nav-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const target = el.getAttribute('data-target');
      if (!target) return;
      setActiveNav(el);
      const meFresh = await ensureMe(true);
      renderSettingsTarget(target, meFresh);
    });
  });

  // Default: open Profile edit
  const first = document.querySelector('.set-nav-item[data-target="profile"]') || document.querySelector('.set-nav-item');
  setActiveNav(first);
  renderSettingsTarget('profile', me);
  })().catch((e) => console.error('initSettings error', e));
}
