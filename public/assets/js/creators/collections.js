import { DOM } from './dom.js';
import { COLLECTIONS_DB, BLANK_IMG, DEFAULT_AVATAR, getMySubscriptions } from './data.js';

// TODO: Backend Integration - Replace LocalStorage with API Endpoints
let currentColType = 'user'; // 'user' (Lists) or 'post' (Vault)
let currentMediaFilter = 'all'; // 'all', 'image', 'video'


// ===============================
// Right Sidebar: Users list logic (Data #5)
// - Drives the chips (All/Active/Expired/Restricted/Blocked)
// - Renders a user list for system lists (Fans / Following)
// - Search + Sort (Recent / Name)
// ===============================
let _TopToast = null;

const RS_USERS = {
  listId: 'fans',   // 'fans' | 'following' | 'restricted' | 'blocked' | 'custom'
  filter: 'all',    // 'all' | 'active' | 'expired' | 'restricted' | 'blocked'
  search: '',
  sort: 'recent',   // 'recent' | 'name'
  items: [],
  counts: { all: 0, active: 0, expired: 0, restricted: 0, blocked: 0 }
};

function rsToast(icon, title) {
  try {
    if (_TopToast) _TopToast.fire({ icon, title });
  } catch (_) {}
}

function rsGetChips() {
  return Array.from(document.querySelectorAll('#rs-view-type-users .filter-chips .chip'));
}

function rsSetChipLabels(counts) {
  const chips = rsGetChips();
  if (!chips.length) return;

  const map = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expired', label: 'Expired' },
    { key: 'restricted', label: 'Restricted' },
    { key: 'blocked', label: 'Blocked' }
  ];

  map.forEach((m, i) => {
    if (!chips[i]) return;
    const n = (counts && typeof counts[m.key] === 'number') ? counts[m.key] : 0;
    chips[i].textContent = `${m.label} ${n}`;
  });
}

function rsSetChipActive(filterKey) {
  const chips = rsGetChips();
  chips.forEach(c => c.classList.remove('active'));
  const map = { all: 0, active: 1, expired: 2, restricted: 3, blocked: 4 };
  const idx = map[String(filterKey || 'all').toLowerCase()] ?? 0;
  if (chips[idx]) chips[idx].classList.add('active');
}

function rsEnsureUsersListContainer() {
  const host = document.getElementById('rs-view-type-users');
  if (!host) return null;

  let list = document.getElementById('rs-users-list');
  if (list) return list;

  list = document.createElement('div');
  list.id = 'rs-users-list';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '0';
  list.style.marginTop = '10px';
  list.style.borderTop = '1px solid var(--border-color)';
  list.style.background = 'transparent';

  const empty = host.querySelector('.rs-col-empty');
  if (empty) empty.insertAdjacentElement('beforebegin', list);
  else host.appendChild(list);

  return list;
}

function rsSetUsersEmptyState(show, text) {
  const host = document.getElementById('rs-view-type-users');
  if (!host) return;

  const empty = host.querySelector('.rs-col-empty');
  if (empty) {
    empty.style.display = show ? '' : 'none';
    if (text) {
      const span = empty.querySelector('span');
      if (span) span.textContent = text;
    }
  }
}

function rsNormalizeSubItem(it) {
  const u = (it && it.otherUser) ? it.otherUser : {};
  const name = (u && u.name) ? String(u.name) : '';
  const handle = (u && u.handle) ? String(u.handle) : '';
  const avatar = (u && u.avatarUrl) ? String(u.avatarUrl) : (DEFAULT_AVATAR || BLANK_IMG);
  const verified = !!(u && u.verified);
  const email = (it && it.otherEmail) ? String(it.otherEmail) : (u && u.email ? String(u.email) : '');
  const ts = (it && (it.updatedAt || it.createdAt)) ? (new Date(it.updatedAt || it.createdAt).getTime() || 0) : 0;
  const isActive = !!(it && it.isActive);
  return { email, name, handle, avatar, verified, isActive, ts };
}

function rsNormalizeSimpleUser(it) {
  const email = it?.email ? String(it.email) : '';
  const name = it?.name ? String(it.name) : '';
  const handle = it?.handle ? String(it.handle) : '';
  const avatar = it?.avatarUrl ? String(it.avatarUrl) : (DEFAULT_AVATAR || BLANK_IMG);
  const verified = !!it?.verified;
  const ts = it?.ts ? Number(it.ts) : 0;
  return { email, name, handle, avatar, verified, isActive: true, ts };
}

function rsApplyFilter(items) {
  let out = Array.isArray(items) ? [...items] : [];

  // filter
  const f = String(RS_USERS.filter || 'all').toLowerCase();
  if (f === 'active') out = out.filter(x => x.isActive);
  if (f === 'expired') out = out.filter(x => !x.isActive);
  // restricted / blocked filters are placeholders for now (0)
  if (f === 'restricted' || f === 'blocked') out = []; 

  // search
  const q = String(RS_USERS.search || '').trim().toLowerCase();
  if (q) {
    out = out.filter(x =>
      (x.name || '').toLowerCase().includes(q) ||
      (x.handle || '').toLowerCase().includes(q) ||
      (x.email || '').toLowerCase().includes(q)
    );
  }

  // sort
  if (RS_USERS.sort === 'name') {
    out.sort((a, b) => {
      const an = (a.name || a.handle || a.email || '').toLowerCase();
      const bn = (b.name || b.handle || b.email || '').toLowerCase();
      return an.localeCompare(bn);
    });
  } else {
    out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  return out;
}

function rsRenderUsers() {
  const list = rsEnsureUsersListContainer();
  if (!list) return;

  const filtered = rsApplyFilter(RS_USERS.items);
  list.innerHTML = '';

  if (!filtered.length) {
    rsSetUsersEmptyState(true, RS_USERS.search ? 'No users found' : 'No users yet');
    return;
  }

  rsSetUsersEmptyState(false);

  filtered.forEach((u) => {
    const row = document.createElement('div');
    row.className = 'rs-user-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.padding = '10px 4px';
    row.style.borderBottom = '1px solid var(--border-color)';
    row.style.cursor = 'pointer';

    const pill = u.isActive
      ? `<span style="margin-left:auto; font-size:10px; font-weight:900; padding:4px 10px; border-radius:999px; background: rgba(100,233,238,0.14); color: var(--primary-cyan); border: 1px solid rgba(100,233,238,0.25);">ACTIVE</span>`
      : `<span style="margin-left:auto; font-size:10px; font-weight:900; padding:4px 10px; border-radius:999px; background: rgba(255,255,255,0.06); color: var(--muted); border: 1px solid rgba(255,255,255,0.12);">EXPIRED</span>`;

    const check = u.verified ? `<i class="fa-solid fa-circle-check" style="margin-left:6px; font-size:12px; color: var(--primary-cyan);"></i>` : '';

    row.innerHTML = `
      <img src="${u.avatar || BLANK_IMG}" alt="" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color); background:#000;">
      <div style="display:flex; flex-direction:column; gap:2px; min-width:0;">
        <div style="display:flex; align-items:center; gap:0; min-width:0;">
          <span style="font-weight:900; font-size:13px; color: var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 160px;">${u.name || (u.handle ? u.handle : 'User')}</span>
          ${check}
        </div>
        <span style="font-size:12px; color: var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 180px;">${u.handle ? `@${u.handle.replace(/^@/, '')}` : (u.email || '')}</span>
      </div>
      ${pill}
    `;

    row.addEventListener('click', () => {
      // Placeholder: we can later open their profile page / chat.
      rsToast('info', 'Open user profile (next)');
    });

    list.appendChild(row);
  });
}

function rsSetSortLabel() {
  const head = document.querySelector('#rs-view-type-users .filter-head span');
  if (!head) return;
  head.textContent = (RS_USERS.sort === 'name') ? 'NAME A-Z' : 'RECENT';
}

function rsLoadLocalUsers(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr)) return [];
    return arr.map(rsNormalizeSimpleUser);
  } catch {
    return [];
  }
}

async function rsLoadUsersForCollection(col) {
  const id = String(col?.id || '').toLowerCase();

  // Default state
  RS_USERS.listId = id || 'custom';
  RS_USERS.filter = 'all';
  RS_USERS.search = '';
  RS_USERS.sort = 'recent';
  RS_USERS.items = [];
  RS_USERS.counts = { all: 0, active: 0, expired: 0, restricted: 0, blocked: 0 };

  rsSetUsersEmptyState(true, 'Loading...');
  rsSetSortLabel();
  rsSetChipActive('all');
  rsSetChipLabels(RS_USERS.counts);
  rsRenderUsers();

  // Restricted / Blocked placeholders from localStorage
  const restricted = rsLoadLocalUsers('tm_restricted_users');
  const blocked = rsLoadLocalUsers('tm_blocked_users');
  RS_USERS.counts.restricted = restricted.length;
  RS_USERS.counts.blocked = blocked.length;

  // Fans / Following from backend
  if (id === 'fans' || id === 'following') {
    try {
      const dir = (id === 'fans') ? 'fans' : 'subscribed';
      const data = await getMySubscriptions({ dir });
      const pack = (id === 'fans') ? (data?.subscribers || {}) : (data?.subscribed || {});
      const items = Array.isArray(pack.items) ? pack.items : [];
      const counts = pack.counts || { all: items.length, active: items.filter(x => !!x.isActive).length, expired: 0 };

      RS_USERS.items = items.map(rsNormalizeSubItem);
      RS_USERS.counts.all = Number(counts.all || RS_USERS.items.length) || 0;
      RS_USERS.counts.active = Number(counts.active || 0) || 0;
      RS_USERS.counts.expired = Number(counts.expired || 0) || Math.max(0, RS_USERS.counts.all - RS_USERS.counts.active);

      rsSetChipLabels(RS_USERS.counts);
      rsSetUsersEmptyState(RS_USERS.counts.all === 0, 'No users yet');
      rsRenderUsers();
      return;
    } catch (e) {
      console.error('rsLoadUsersForCollection error', e);
      rsSetUsersEmptyState(true, 'Failed to load');
      rsSetChipLabels(RS_USERS.counts);
      return;
    }
  }

  // For other lists: show empty (until you add data sources)
  rsSetChipLabels(RS_USERS.counts);
  rsSetUsersEmptyState(true, 'No users yet');
}

export function initCollections(TopToast) {
    _TopToast = TopToast;

    
    // 1. EVENT LISTENERS FOR SEARCH
    if (DOM.colBtnSearch) DOM.colBtnSearch.addEventListener('click', () => { 
        DOM.colSearchContainer.classList.remove('hidden'); 
        DOM.colSearchInput.focus(); 
    });
    
    if (DOM.colSearchClose) DOM.colSearchClose.addEventListener('click', () => { 
        DOM.colSearchContainer.classList.add('hidden'); 
        DOM.colSearchInput.value = ''; 
        renderCollections(); 
    });
    
    if (DOM.colSearchInput) DOM.colSearchInput.addEventListener('input', (e) => renderCollections(e.target.value));

    // 2. ADD NEW LIST (Only for User Lists)
    if (DOM.colBtnAdd) {
        DOM.colBtnAdd.addEventListener('click', () => {
            Swal.fire({
                title: 'New List',
                input: 'text', 
                inputPlaceholder: 'List Name (e.g. Whales)', 
                showCancelButton: true, 
                confirmButtonText: 'Create', 
                confirmButtonColor: '#64E9EE', 
                background: '#0d1423', 
                color: '#fff'
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    const newCol = { id: Date.now(), name: result.value, type: 'user', count: 0, system: false };
                    saveCollectionToStorage(newCol);
                    renderCollections();
                    TopToast.fire({ icon: 'success', title: 'List created' });
                }
            });
        });
    }

    // 3. MAIN TAB SWITCHING (LISTS vs VAULT)
    const tabUsers = document.getElementById('tab-col-users');
    const tabVault = document.getElementById('tab-col-vault');
    const subTabsContainer = document.getElementById('vault-sub-tabs');
    const uploadBtn = document.getElementById('col-btn-upload');

    // Sidebar Handling
    const rsCollections = document.getElementById('rs-collections-view');
    const rsSuggestions = document.getElementById('rs-suggestions-view');

    if (tabUsers && tabVault) {
        // --- CLICK LISTS ---
        tabUsers.addEventListener('click', () => {
            tabUsers.classList.add('active');
            tabVault.classList.remove('active');
            currentColType = 'user';
            
            // UI Updates
            if(uploadBtn) uploadBtn.style.display = 'none';
            if(DOM.colBtnAdd) DOM.colBtnAdd.style.display = 'block';
            if(subTabsContainer) subTabsContainer.classList.add('hidden'); 
            
            // Show Sidebar for Lists (Fans/Following details)
            if(rsCollections) rsCollections.classList.remove('hidden');
            if(rsSuggestions) rsSuggestions.classList.add('hidden');

            renderCollections();
        });

        // --- CLICK VAULT ---
        tabVault.addEventListener('click', () => {
            tabVault.classList.add('active');
            tabUsers.classList.remove('active');
            currentColType = 'post';
            
            // UI Updates
            if(uploadBtn) uploadBtn.style.display = 'block';
            if(DOM.colBtnAdd) DOM.colBtnAdd.style.display = 'none';
            if(subTabsContainer) {
                subTabsContainer.classList.remove('hidden'); 
                subTabsContainer.style.display = 'flex';
            }
            
            // Hide "Fans" Sidebar, Show Default Suggestions instead
            if(rsCollections) rsCollections.classList.add('hidden');
            if(rsSuggestions) rsSuggestions.classList.remove('hidden');

            renderCollections();
        });
    }

    // 4. SUB-TAB FILTERING (All, Photos, Videos)
    const vaultPills = document.querySelectorAll('#vault-sub-tabs .n-pill');
    if (vaultPills) {
        vaultPills.forEach(pill => {
            pill.addEventListener('click', () => {
                vaultPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentMediaFilter = pill.dataset.type; 
                renderCollections();
            });
        });
    }

    // 5. UPLOAD LOGIC
    const fileInput = document.getElementById('col-file-input');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => { fileInput.click(); });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) { 
                Swal.fire({ icon: 'error', title: 'Too large', text: 'File must be under 10MB', background: '#0d1423', color: '#fff' });
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64String = event.target.result;
                const mediaItem = {
                    id: Date.now(),
                    src: base64String,
                    type: file.type.startsWith('video') ? 'video' : 'image',
                    date: new Date().toLocaleDateString()
                };
                saveMediaToStorage(mediaItem);
                TopToast.fire({ icon: 'success', title: 'Saved to Vault!' });
                renderCollections();
            };
            reader.readAsDataURL(file);
            fileInput.value = '';
        });
    }


    // 6. RIGHT SIDEBAR FILTERS (Users)
    const rsUsersView = document.getElementById('rs-view-type-users');
    if (rsUsersView) {
        const iconSearch = rsUsersView.querySelector('.fh-icons .fa-magnifying-glass');
        const iconSort = rsUsersView.querySelector('.fh-icons .fa-arrow-down-short-wide');

        if (iconSearch) {
            iconSearch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                Swal.fire({
                    title: 'Search users',
                    input: 'text',
                    inputValue: RS_USERS.search || '',
                    inputPlaceholder: 'Name, handle, or email',
                    showCancelButton: true,
                    confirmButtonText: 'Search',
                    confirmButtonColor: '#64E9EE',
                    background: '#0d1423',
                    color: '#fff'
                }).then((r) => {
                    if (!r.isConfirmed) return;
                    RS_USERS.search = String(r.value || '').trim();
                    rsRenderUsers();
                });
            });
        }

        if (iconSort) {
            iconSort.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                RS_USERS.sort = (RS_USERS.sort === 'recent') ? 'name' : 'recent';
                rsSetSortLabel();
                rsRenderUsers();
                rsToast('success', RS_USERS.sort === 'name' ? 'Sorted by name' : 'Sorted by recent');
            });
        }

        rsUsersView.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;

            const txt = String(chip.textContent || '').trim().toLowerCase();
            const key =
                txt.startsWith('active') ? 'active' :
                txt.startsWith('expired') ? 'expired' :
                txt.startsWith('restricted') ? 'restricted' :
                txt.startsWith('blocked') ? 'blocked' :
                'all';

            RS_USERS.filter = key;
            rsSetChipActive(key);
            rsRenderUsers();
        });
    }

    // Initial Render
    renderCollections();
}

// --- RENDERING LOGIC ---

export function renderCollections(filter = '') {
    const grid = document.querySelector('.collection-list-container');
    if (!grid) return;

    grid.innerHTML = '';
    
    // ==========================================
    // MODE: VAULT (MEDIA GALLERY)
    // ==========================================
    if (currentColType === 'post') {
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '5px';
        grid.style.padding = '10px';

        let mediaList = getMediaFromStorage();
        
        if (currentMediaFilter !== 'all') {
            mediaList = mediaList.filter(m => m.type === currentMediaFilter);
        }

        if (mediaList.length === 0) {
            grid.style.display = 'block'; 
            grid.innerHTML = `<div style="text-align:center; padding:50px; color:var(--muted);">
                <i class="fa-regular fa-folder-open" style="font-size:2rem; margin-bottom:10px;"></i>
                <p>No ${currentMediaFilter === 'all' ? 'media' : currentMediaFilter + 's'} found.</p>
                <small>Upload to populate your Vault.</small>
            </div>`;
            return;
        }

        mediaList.forEach(media => {
            const div = document.createElement('div');
            div.style.position = 'relative';
            div.style.paddingBottom = '100%';
            div.style.overflow = 'hidden';
            div.style.borderRadius = '8px';
            div.style.background = '#000';
            div.style.cursor = 'pointer';
            div.style.border = '1px solid var(--border-color)';

            let contentHTML = '';
            if (media.type === 'video') {
                contentHTML = `<video src="${media.src}" style="position:absolute; width:100%; height:100%; object-fit:cover;"></video>
                               <i class="fa-solid fa-play" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; font-size:1.5rem; text-shadow:0 0 5px #000;"></i>`;
            } else {
                contentHTML = `<img src="${media.src}" style="position:absolute; width:100%; height:100%; object-fit:cover;">`;
            }

            div.innerHTML = contentHTML;
            
            div.onclick = () => {
                Swal.fire({
                    imageUrl: media.type === 'image' ? media.src : null,
                    html: media.type === 'video' ? `<video src="${media.src}" controls autoplay style="width:100%"></video>` : '',
                    showDenyButton: true,
                    showConfirmButton: false,
                    denyButtonText: 'Delete from Vault',
                    denyButtonColor: '#ff4757',
                    background: '#0d1423',
                    showCloseButton: true,
                    customClass: { popup: 'swal-media-preview' }
                }).then((result) => {
                    if (result.isDenied) {
                        deleteMediaFromStorage(media.id);
                        renderCollections();
                    }
                });
            };

            grid.appendChild(div);
        });

    } 
    // ==========================================
    // MODE: LISTS (PEOPLE / SUBSCRIPTIONS)
    // ==========================================
    else {
        grid.style.display = 'flex';
        grid.style.flexDirection = 'column';
        grid.style.gap = '0';
        grid.style.padding = '0';

        const collections = getCollectionsFromStorage();
        
        let displayList = collections.filter(c => c.type === 'user');
        if (filter) displayList = displayList.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

        if (displayList.length === 0) {
            grid.innerHTML = `<div style="padding:30px; text-align:center; color:var(--muted);">No lists found.</div>`;
            return;
        }

        displayList.forEach(col => {
            const div = document.createElement('div');
            div.className = 'c-list-item'; 
            
            // Logic to check if this list is active in the sidebar
            if(DOM.rsTitle && DOM.rsTitle.innerText === col.name.toUpperCase()) {
                div.classList.add('active');
            }

            const deleteIcon = !col.system ? '<i class="fa-solid fa-trash del-btn" style="font-size:0.8rem; color:#ff4757; opacity:0.5; cursor:pointer;"></i>' : '';

            div.innerHTML = `
                <div class="c-item-content">
                    <div style="display:flex; justify-content:space-between;">
                        <span class="c-item-name">${col.name}</span>
                        ${deleteIcon}
                    </div>
                    <span class="c-item-status">${col.count} people</span>
                </div>
            `;
            
            const delBtn = div.querySelector('.del-btn');
            if(delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    Swal.fire({
                        title: 'Delete List?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ff4757', confirmButtonText: 'Delete', background: '#0d1423', color: '#fff'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            deleteCollectionFromStorage(col.id);
                            renderCollections();
                        }
                    });
                });
            }

            // Click List -> Update Sidebar
            div.onclick = () => {
                document.querySelectorAll('.c-list-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                updateRightSidebarContent(col);
            };

            grid.appendChild(div);
        });
    }
}

// --- STORAGE HELPERS ---

function getCollectionsFromStorage() {
    const defaults = [
        { id: 'fans', name: 'Fans', type: 'user', count: 0, system: true },
        { id: 'following', name: 'Following', type: 'user', count: 0, system: true },
        { id: 'restricted', name: 'Restricted', type: 'user', count: 0, system: true },
        { id: 'blocked', name: 'Blocked', type: 'user', count: 0, system: true },
        { id: 'favorites', name: 'Favorite Posts', type: 'post', count: 0, system: true },
        { id: 'watch_later', name: 'Watch Later', type: 'post', count: 0, system: false }
    ];
    return JSON.parse(localStorage.getItem('tm_collections') || JSON.stringify(defaults));
}

function saveCollectionToStorage(col) {
    const list = getCollectionsFromStorage();
    list.push(col);
    localStorage.setItem('tm_collections', JSON.stringify(list));
}

function deleteCollectionFromStorage(id) {
    let list = getCollectionsFromStorage();
    list = list.filter(c => c.id !== id);
    localStorage.setItem('tm_collections', JSON.stringify(list));
}

function getMediaFromStorage() {
    return JSON.parse(localStorage.getItem('tm_uploaded_media') || '[]');
}

function saveMediaToStorage(media) {
    const list = getMediaFromStorage();
    list.unshift(media);
    localStorage.setItem('tm_uploaded_media', JSON.stringify(list));
}

function deleteMediaFromStorage(id) {
    let list = getMediaFromStorage();
    list = list.filter(m => m.id !== id);
    localStorage.setItem('tm_uploaded_media', JSON.stringify(list));
}

// Update the Right Sidebar (Only used for User Lists)
export function updateRightSidebarContent(col) {
    if (DOM.rsTitle) DOM.rsTitle.innerText = col.name.toUpperCase();
    
    // Ensure Collections Sidebar is visible
    if(DOM.rsCollections) DOM.rsCollections.classList.remove('hidden');
    if(DOM.rsSuggestions) DOM.rsSuggestions.classList.add('hidden');

    if (DOM.rsViewUsers) DOM.rsViewUsers.classList.remove('hidden');
    if (DOM.rsViewMedia) DOM.rsViewMedia.classList.add('hidden');

    // Load user data into the right sidebar (Fans / Following)
    rsLoadUsersForCollection(col);
    rsSetChipActive('all');
    
    // Mobile Back Button Logic
    if (window.innerWidth <= 1024) {
       const header = document.querySelector('.rs-col-header');
       if (header && !header.querySelector('.settings-mobile-back')) {
            const backBtn = document.createElement('div');
            backBtn.className = 'settings-mobile-back';
            backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> BACK`;
            backBtn.addEventListener('click', () => {
               if(DOM.rightSidebar) DOM.rightSidebar.classList.remove('mobile-active');
            });
            header.insertBefore(backBtn, header.firstChild);
       }
        // Force Open Sidebar on Mobile
        if(DOM.rightSidebar) {
            DOM.rightSidebar.classList.remove('hidden-sidebar');
            DOM.rightSidebar.classList.add('mobile-active');
        }
   }
}