import { DOM } from './dom.js';
import { NOTIFICATIONS_DATA, DEFAULT_AVATAR } from './data.js';
import { apiGet, apiPost } from './tm-api.js';

let currentFilter = 'All';
let currentSearch = '';
let _allNotifs = [];
let _loaded = false;

let _fetching = false;
let _lastFetchAtMs = 0;
const _STALE_AFTER_MS = 15_000; // refresh when user re-opens tab after this

// Local read tracking (because backend currently only supports mark-all-read)
const _LS_READ_PREFIX = 'tm_notif_read_v1:';

function _getMeEmail() {
  try {
    const me = window.__tmMe || window.tmMeCache || null;
    const e = me && me.email ? String(me.email).trim().toLowerCase() : '';
    return e || '';
  } catch (e) {
    return '';
  }
}

function _lsReadKey() {
  const e = _getMeEmail();
  return `${_LS_READ_PREFIX}${e || 'anon'}`;
}

function _getLocalReadMap() {
  try {
    const raw = window.localStorage ? window.localStorage.getItem(_lsReadKey()) : '';
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function _setLocalReadMap(map) {
  try {
    if (!window.localStorage) return;
    window.localStorage.setItem(_lsReadKey(), JSON.stringify(map || {}));
  } catch {}
}

function _markLocalRead(notifId) {
  const id = String(notifId || '').trim();
  if (!id) return;
  const map = _getLocalReadMap();
  if (map[id]) return;
  map[id] = Date.now();
  _setLocalReadMap(map);
}

function _applyLocalReadState(items) {
  const map = _getLocalReadMap();
  if (!map || typeof map !== 'object') return items;
  return (items || []).map(n => {
    const id = String(n?.id || '').trim();
    const local = id && map[id] ? Number(map[id]) : 0;
    if (!local) return n;
    const readAtMs = Number(n?.readAtMs) || 0;
    if (readAtMs) return n;
    return { ...n, readAtMs: local };
  });
}

export function initNotifications() {
  // 1) Tab switching (pills)
  if (DOM.notifPills && DOM.notifPills.length > 0) {
    DOM.notifPills.forEach(pill => {
      pill.addEventListener('click', () => {
        DOM.notifPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        currentFilter = (pill.dataset && (pill.dataset.filter || pill.dataset.notifFilter || pill.dataset.tab))
          ? String(pill.dataset.filter || pill.dataset.notifFilter || pill.dataset.tab).trim()
          : (pill.innerText || '').trim();

        renderNotifications({ force: false });
      });
    });
  }

  // 2) Settings icon click → open settings popover
  if (DOM.notifGearBtn) {
    DOM.notifGearBtn.addEventListener('click', () => {
      if (DOM.btnSettingsPop) DOM.btnSettingsPop.click();
      else console.warn('Settings navigation button not found.');
    });
  }

  // 3) Search icon click → toggle search bar
  if (DOM.notifSearchBtn && DOM.notifSearchContainer) {
    DOM.notifSearchBtn.addEventListener('click', () => {
      DOM.notifSearchContainer.classList.toggle('hidden');
      if (!DOM.notifSearchContainer.classList.contains('hidden') && DOM.notifSearchInput) {
        setTimeout(() => DOM.notifSearchInput.focus(), 100);
      }
    });
  }

  // ESC closes search (if open)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!DOM.notifSearchContainer) return;
    if (!DOM.notifSearchContainer.classList.contains('hidden')) {
      DOM.notifSearchContainer.classList.add('hidden');
    }
  });

  // 4) Search input
  if (DOM.notifSearchInput) {
    DOM.notifSearchInput.addEventListener('input', () => {
      currentSearch = String(DOM.notifSearchInput.value || '').trim().toLowerCase();
      renderNotifications({ force: false });
    });
  }

  // 5) Mark all read (if the view provides a button)
  const markAllBtn = document.getElementById('notif-btn-markall')
    || document.querySelector('[data-action="notif-mark-all"]')
    || document.querySelector('.notif-mark-all');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      const res = await apiPost('/api/me/notifications/mark-all-read', {});
      if (!res || res.ok !== true) {
        console.warn('mark-all-read failed:', res);
        return;
      }
      const now = Date.now();
      _allNotifs = (_allNotifs || []).map(n => ({ ...n, readAtMs: n.readAtMs || now }));
      // also set local read for ids, so UI stays consistent
      try {
        const map = _getLocalReadMap();
        for (const n of _allNotifs || []) {
          const id = String(n?.id || '').trim();
          if (id && !map[id]) map[id] = now;
        }
        _setLocalReadMap(map);
      } catch {}
      renderNotifications({ force: false });
    });
  }

  // 6) Refresh when user opens Notifications tab
  const nav = DOM.navNotif || document.getElementById('nav-link-notif');
  const mob = DOM.mobNotif || document.getElementById('mob-nav-notif');
  [nav, mob].filter(Boolean).forEach(btn => {
    btn.addEventListener('click', () => {
      // force refresh on open if stale
      refreshNotifications(false);
    });
  });

  // Initial render (safe even if view is hidden)
  renderNotifications({ force: false });
}

export async function refreshNotifications(force = false) {
  // If the view is currently visible, refresh immediately.
  // If hidden, we still allow refresh on nav click to keep data fresh.
  await renderNotifications({ force: !!force, fromRefresh: true });
}

function _fmtRelativeTime(tsMs) {
  const ms = Number(tsMs) || 0;
  if (!ms) return '';
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  const yr = Math.floor(day / 365);
  return `${yr}y`;
}

function _inferKind(n) {
  const raw = String(n?.type || '').toLowerCase().trim();
  const t = raw;

  // normalize common variants so filters + icons work
  if (['tag', 'tags', 'tagged'].includes(t)) return 'tag';
  if (['mention', 'mentions'].includes(t)) return 'mention';
  if (['subscription', 'subscriptions', 'subscribe', 'subscribed', 'subscriber', 'renewal'].includes(t)) return 'subscription';
  if (['promotion', 'promotions', 'promo', 'offer', 'sale'].includes(t)) return 'promotion';
  if (['comment', 'comments', 'reply', 'replies'].includes(t)) return 'comment';
  if (['like', 'likes', 'reaction', 'reactions'].includes(t)) return 'like';
  if (['message', 'messages', 'dm', 'dms'].includes(t)) return 'message';
  if (['match', 'matches'].includes(t)) return 'match';
  if (t) return t;

  const blob = `${n?.title || ''} ${n?.message || ''}`.toLowerCase();

  if (blob.includes('subscribed') || blob.includes('subscription') || blob.includes('renew')) return 'subscription';
  if (blob.includes('mentioned') || blob.includes('mention')) return 'mention';
  if (blob.includes('tagged') || blob.includes('tag')) return 'tag';
  if (blob.includes('comment')) return 'comment';
  if (blob.includes('like')) return 'like';
  if (blob.includes('message')) return 'message';
  if (blob.includes('match')) return 'match';
  if (blob.includes('promo') || blob.includes('promotion') || blob.includes('offer')) return 'promotion';

  return 'system';
}

function _matchesFilter(n, filterLabel) {
  const label = String(filterLabel || 'All').trim().toLowerCase();
  if (!label || label === 'all') return true;

  const kind = _inferKind(n);

  // Exact UI labels from notifications.html
  if (label === 'tags') return kind === 'tag';
  if (label === 'mentions') return kind === 'mention';
  if (label === 'comments') return kind === 'comment';
  if (label === 'subscriptions') return kind === 'subscription';
  if (label === 'promotions') return kind === 'promotion';

  // Support other possible labels
  if (label.includes('system')) return kind === 'system';
  if (label.includes('match')) return kind === 'match';
  if (label.includes('message')) return kind === 'message';
  if (label.includes('like')) return kind === 'like';
  if (label.includes('comment')) return kind === 'comment';
  if (label.includes('tip')) return kind === 'tip';

  return kind === label;
}

async function _loadNotifications({ force = false } = {}) {
  const now = Date.now();
  if (_fetching) return;
  if (!force && _loaded && (now - _lastFetchAtMs) < _STALE_AFTER_MS) return;

  _fetching = true;
  try {
    const res = await apiGet('/api/me/notifications?limit=100');
    if (res && res.ok === true && Array.isArray(res.items)) {
      // Deduplicate by id (defensive)
      const seen = new Set();
      const items = [];
      for (const it of res.items) {
        const id = String(it?.id || '').trim();
        if (!id) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        items.push(it);
      }
      _allNotifs = _applyLocalReadState(items);
      _loaded = true;
      _lastFetchAtMs = now;
      return;
    }

    // Fallback to local placeholder array so UI doesn't break.
    const local = Array.isArray(NOTIFICATIONS_DATA) ? NOTIFICATIONS_DATA : [];
    _allNotifs = _applyLocalReadState(local);
    _loaded = true;
    _lastFetchAtMs = now;
  } catch (e) {
    console.warn('notifications fetch failed:', e);
    const local = Array.isArray(NOTIFICATIONS_DATA) ? NOTIFICATIONS_DATA : [];
    _allNotifs = _applyLocalReadState(local);
    _loaded = true;
    _lastFetchAtMs = now;
  } finally {
    _fetching = false;
  }
}

function _setContainerMode(container, mode) {
  if (!container) return;

  if (mode === 'list') {
    container.style.padding = '0';
    container.style.textAlign = 'left';
    container.style.display = 'block';
    container.style.flexDirection = '';
    container.style.alignItems = '';
    container.style.justifyContent = '';
    container.style.minHeight = '';
    return;
  }

  // empty/loading
  container.style.padding = '40px 20px';
  container.style.textAlign = 'center';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.minHeight = '50vh';
}

async function renderNotifications({ force = false } = {}) {
  const root = DOM.viewNotif || document.getElementById('view-notifications') || document;
  let container = root.querySelector('.notif-list');

  if (!container && root !== document) {
    container = document.createElement('div');
    container.className = 'notif-list';
    root.appendChild(container);
  }
  if (!container) return;

  // First paint: show a quick loading state
  if ((!_loaded || force) && container.childElementCount === 0) {
    _setContainerMode(container, 'empty');
    container.innerHTML = `
      <div style="text-align:center; color: var(--muted); opacity: 0.85;">
        <div class="subs-spinner" aria-hidden="true" style="margin: 0 auto; width: 22px; height: 22px;"></div>
        <div style="margin-top: 10px; font-weight: 700; font-size: 13px;">Loading notifications…</div>
      </div>
    `;
  }

  await _loadNotifications({ force });

  // Filter + search
  let filteredList = (_allNotifs || []).filter(n => _matchesFilter(n, currentFilter));
  if (currentSearch) {
    filteredList = filteredList.filter(n => {
      const blob = `${n?.title || ''} ${n?.message || ''}`.toLowerCase();
      return blob.includes(currentSearch);
    });
  }

  // EMPTY STATE
  if (!filteredList.length) {
    _setContainerMode(container, 'empty');
    container.innerHTML = `
      <i class="fa-regular fa-bell-slash" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.35;"></i>
      <p style="margin:0; color: var(--muted);">No notifications yet</p>
    `;
    return;
  }

  // LIST MODE
  _setContainerMode(container, 'list');
  container.innerHTML = '';

  filteredList.forEach(notif => {
    const div = document.createElement('div');
    div.className = 'notif-item';
    div.style.cssText = `
      display:flex;
      gap:15px;
      padding:14px 16px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      align-items:flex-start;
      cursor:pointer;
    `;

    const kind = _inferKind(notif);

    let icon = '<i class="fa-solid fa-bell" style="color:var(--text);"></i>';
    if (kind === 'like') icon = '<i class="fa-solid fa-heart" style="color:#ff4757;"></i>';
    else if (kind === 'comment') icon = '<i class="fa-solid fa-comment" style="color:#64E9EE;"></i>';
    else if (kind === 'message') icon = '<i class="fa-solid fa-envelope" style="color:var(--text);"></i>';
    else if (kind === 'match') icon = '<i class="fa-solid fa-user-group" style="color:var(--text);"></i>';
    else if (kind === 'tag') icon = '<i class="fa-solid fa-tag" style="color:#64E9EE;"></i>';
    else if (kind === 'mention') icon = '<i class="fa-solid fa-at" style="color:#64E9EE;"></i>';
    else if (kind === 'subscription') icon = '<i class="fa-solid fa-user-plus" style="color:#64E9EE;"></i>';
    else if (kind === 'promotion') icon = '<i class="fa-solid fa-bolt" style="color:gold;"></i>';
    else if (kind === 'tip') icon = '<i class="fa-solid fa-sack-dollar" style="color:gold;"></i>';

    const title = String(notif?.title || '').trim() || 'Notification';
    const message = String(notif?.message || '').trim();
    const when = _fmtRelativeTime(notif?.createdAtMs);
    const id = String(notif?.id || '').trim();
    const isUnread = !Number(notif?.readAtMs);

    div.style.opacity = isUnread ? '1' : '0.78';

    div.innerHTML = `
      <div style="position:relative; flex:0 0 auto;">
        <img src="${DEFAULT_AVATAR}" alt="" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
        <div style="position:absolute; bottom:-6px; right:-6px; background:var(--card-bg); border-radius:50%; padding:4px; border:1px solid rgba(255,255,255,0.08);">
          ${icon}
        </div>
      </div>

      <div style="flex:1; min-width:0;">
        <div style="font-size:0.9rem; color:var(--text); line-height:1.15;">
          <strong>${title}</strong>
        </div>
        ${message ? `<div style="font-size:0.85rem; color:var(--muted); margin-top:6px; line-height:1.25; word-wrap:break-word;">${message}</div>` : ''}
        <div style="font-size:0.8rem; color:var(--muted); margin-top:8px; display:flex; align-items:center; gap:8px;">
          <span>${when}</span>
          ${isUnread ? `<span title="Unread" style="width:7px; height:7px; border-radius:999px; background:#64E9EE; display:inline-block;"></span>` : ''}
        </div>
      </div>
    `;

    div.addEventListener('click', () => {
      if (id) _markLocalRead(id);

      // Update in-memory so it reflects immediately
      try {
        const idx = (_allNotifs || []).findIndex(x => String(x?.id || '') === id);
        if (idx >= 0 && !_allNotifs[idx].readAtMs) {
          _allNotifs[idx] = { ..._allNotifs[idx], readAtMs: Date.now() };
        }
      } catch {}

      const href = notif && notif.href ? String(notif.href) : '';
      if (href) {
        window.location.href = href;
        return;
      }
      // No href: just refresh UI to remove unread dot
      renderNotifications({ force: false });
    });

    container.appendChild(div);
  });
}
