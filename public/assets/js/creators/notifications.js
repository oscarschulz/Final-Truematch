import { DOM } from './dom.js';
import { NOTIFICATIONS_DATA, DEFAULT_AVATAR } from './data.js';
import { apiGet, apiPost } from './tm-api.js';

let currentFilter = 'All';
let currentSearch = '';
let _allNotifs = [];
let _loaded = false;

export function initNotifications() {
    
    // 1. Tab Switching Logic
    if (DOM.notifPills.length > 0) {
        DOM.notifPills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Remove active from all
                DOM.notifPills.forEach(p => p.classList.remove('active'));
                // Add active to clicked
                pill.classList.add('active');

                // Prefer explicit label from dataset if present.
                currentFilter = (pill.dataset && (pill.dataset.filter || pill.dataset.notifFilter || pill.dataset.tab))
                    ? String(pill.dataset.filter || pill.dataset.notifFilter || pill.dataset.tab).trim()
                    : pill.innerText.trim();
                renderNotifications();
            });
        });
    }

    // 2. Settings Icon Click
    if (DOM.notifGearBtn) {
        DOM.notifGearBtn.addEventListener('click', () => {
            if(DOM.btnSettingsPop) {
                DOM.btnSettingsPop.click();
            } else {
                console.warn("Settings navigation button not found.");
            }
        });
    }

    // 3. Search Icon Click
    if (DOM.notifSearchBtn && DOM.notifSearchContainer) {
        DOM.notifSearchBtn.addEventListener('click', () => {
            DOM.notifSearchContainer.classList.toggle('hidden');
            if (!DOM.notifSearchContainer.classList.contains('hidden') && DOM.notifSearchInput) {
                setTimeout(() => DOM.notifSearchInput.focus(), 100);
            }
        });
    }

    // 4. Search input
    if (DOM.notifSearchInput) {
        DOM.notifSearchInput.addEventListener('input', () => {
            currentSearch = String(DOM.notifSearchInput.value || '').trim().toLowerCase();
            renderNotifications();
        });
    }

    // 5. Mark all read (if the view provides a button)
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
            renderNotifications();
        });
    }

    // 🔥 RENDER ON LOAD
    renderNotifications();
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
    const t = String(n?.type || '').toLowerCase();
    if (t) return t;
    const blob = `${n?.title || ''} ${n?.message || ''}`.toLowerCase();
    if (blob.includes('match')) return 'match';
    if (blob.includes('message')) return 'message';
    if (blob.includes('like')) return 'like';
    if (blob.includes('comment')) return 'comment';
    if (blob.includes('tip')) return 'tip';
    return 'system';
}

function _matchesFilter(n, filterLabel) {
    const label = String(filterLabel || 'All').trim().toLowerCase();
    if (!label || label === 'all') return true;
    const kind = _inferKind(n);

    // Support common UI labels.
    if (label.includes('system')) return kind === 'system';
    if (label.includes('match')) return kind === 'match';
    if (label.includes('message')) return kind === 'message';
    if (label.includes('like')) return kind === 'like';
    if (label.includes('comment')) return kind === 'comment';
    if (label.includes('tip')) return kind === 'tip';

    // Fallback: direct match vs type
    return kind === label;
}

async function _loadNotificationsOnce() {
    if (_loaded) return;
    _loaded = true;

    const res = await apiGet('/api/me/notifications?limit=100');
    if (res && res.ok === true && Array.isArray(res.items)) {
        _allNotifs = res.items;
        return;
    }

    // Fallback to local placeholder array so UI doesn't break.
    _allNotifs = Array.isArray(NOTIFICATIONS_DATA) ? NOTIFICATIONS_DATA : [];
}

async function renderNotifications() {
    const root = DOM.viewNotif || document.getElementById('view-notifications') || document;
    let container = root.querySelector('.notif-list');
    if (!container && root !== document) {
        // Defensive: if the view template changed, create a list container so the module still works.
        container = document.createElement('div');
        container.className = 'notif-list';
        root.appendChild(container);
    }
    if (!container) return;

    // First paint: show a quick loading state.
    if (!_loaded && container.childElementCount === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 32px 16px; color: var(--muted); opacity: 0.85;">
                <div class="subs-spinner" aria-hidden="true" style="margin: 0 auto; width: 22px; height: 22px;"></div>
                <div style="margin-top: 10px; font-weight: 700; font-size: 13px;">Loading notifications…</div>
            </div>
        `;
    }

    await _loadNotificationsOnce();

    container.innerHTML = '';

    // Filter + search
    let filteredList = (_allNotifs || []).filter(n => _matchesFilter(n, currentFilter));
    if (currentSearch) {
        filteredList = filteredList.filter(n => {
            const blob = `${n?.title || ''} ${n?.message || ''}`.toLowerCase();
            return blob.includes(currentSearch);
        });
    }

    // 🔥 EMPTY STATE CHECK
    if (filteredList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding-top: 50px; color: var(--muted); opacity: 0.7;">
                <i class="fa-regular fa-bell-slash" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    // Render Items
    filteredList.forEach(notif => {
        const div = document.createElement('div');
        div.className = 'notif-item'; // Ensure CSS exists for this or use inline styles
        div.style.cssText = "display:flex; gap:15px; padding:15px; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;";

        const kind = _inferKind(notif);
        let icon = '';
        switch(kind) {
            case 'like': icon = '<i class="fa-solid fa-heart" style="color:#ff4757;"></i>'; break;
            case 'comment': icon = '<i class="fa-solid fa-comment" style="color:#64E9EE;"></i>'; break;
            case 'tip': icon = '<i class="fa-solid fa-sack-dollar" style="color:gold;"></i>'; break;
            case 'message': icon = '<i class="fa-solid fa-envelope" style="color:var(--text);"></i>'; break;
            case 'match': icon = '<i class="fa-solid fa-user-group" style="color:var(--text);"></i>'; break;
            default: icon = '<i class="fa-solid fa-bell" style="color:var(--text);"></i>';
        }

        const title = String(notif.title || '').trim();
        const message = String(notif.message || '').trim();
        const when = _fmtRelativeTime(notif.createdAtMs);
        const isUnread = !Number(notif.readAtMs);

        div.style.opacity = isUnread ? '1' : '0.78';

        div.innerHTML = `
            <div style="position:relative;">
                <img src="${DEFAULT_AVATAR}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                <div style="position:absolute; bottom:-5px; right:-5px; background:var(--card-bg); border-radius:50%; padding:2px;">${icon}</div>
            </div>
            <div style="flex:1;">
                <div style="font-size:0.9rem; color:var(--text);">
                    ${title ? `<strong>${title}</strong>` : `<strong>Notification</strong>`}
                </div>
                ${message ? `<div style="font-size:0.85rem; color:var(--muted); margin-top:4px; line-height:1.25;">${message}</div>` : ''}
                <div style="font-size:0.8rem; color:var(--muted); margin-top:6px; display:flex; align-items:center; gap:8px;">
                    <span>${when}</span>
                    ${isUnread ? `<span style="width:7px; height:7px; border-radius:999px; background:#64E9EE; display:inline-block;"></span>` : ''}
                </div>
            </div>
        `;

        // Click-through behavior (optional)
        const href = (notif && notif.href) ? String(notif.href) : '';
        if (href) {
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                window.location.href = href;
            });
        }
        container.appendChild(div);
    });
}