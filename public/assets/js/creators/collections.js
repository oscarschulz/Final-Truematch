import { DOM } from './dom.js';
import { COLLECTIONS_DB, BLANK_IMG } from './data.js';

let currentColType = 'user'; 

export function initCollections(TopToast) {
    // 1. Search Logic
    if (DOM.colBtnSearch) DOM.colBtnSearch.addEventListener('click', () => { DOM.colSearchContainer.classList.remove('hidden'); DOM.colSearchInput.focus(); });
    if (DOM.colSearchClose) DOM.colSearchClose.addEventListener('click', () => { DOM.colSearchContainer.classList.add('hidden'); DOM.colSearchInput.value = ''; renderCollections(); });
    if (DOM.colSearchInput) DOM.colSearchInput.addEventListener('input', (e) => renderCollections(e.target.value));

    // 2. Add Button
    if (DOM.colBtnAdd) {
        DOM.colBtnAdd.addEventListener('click', () => {
            Swal.fire({
                title: `New ${currentColType === 'user' ? 'List' : 'Bookmark'}`,
                input: 'text', inputPlaceholder: 'Name', showCancelButton: true, confirmButtonText: 'Create', confirmButtonColor: '#64E9EE', background: '#0d1423', color: '#fff'
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    COLLECTIONS_DB.push({ id: Date.now(), name: result.value, type: currentColType, count: 0, system: false });
                    renderCollections();
                    TopToast.fire({ icon: 'success', title: 'Created!' });
                }
            });
        });
    }

    // 3. Tab Switching (FIXED: Auto-select first item to update Right Sidebar)
    if (DOM.colTabUsers && DOM.colTabBookmarks) {
        DOM.colTabUsers.addEventListener('click', () => {
            DOM.colTabUsers.classList.add('active'); DOM.colTabBookmarks.classList.remove('active');
            currentColType = 'user';
            renderCollections();
            
            // AUTO-CLICK: Pindutin ang unang item para mag-update ang kanan
            const firstItem = DOM.colListWrapper.querySelector('.c-list-item');
            if(firstItem) firstItem.click();
        });
        
        DOM.colTabBookmarks.addEventListener('click', () => {
            DOM.colTabBookmarks.classList.add('active'); DOM.colTabUsers.classList.remove('active');
            currentColType = 'post';
            renderCollections();
            
            // AUTO-CLICK: Ito ang magpapalit sa Vault View agad-agad
            const firstItem = DOM.colListWrapper.querySelector('.c-list-item');
            if(firstItem) firstItem.click();
        });
    }
    
    // Initial Render
    renderCollections();
}

export function renderCollections(filterText = '') {
    if (!DOM.colListWrapper) return;
    DOM.colListWrapper.innerHTML = '';
    const filtered = COLLECTIONS_DB.filter(c => c.type === currentColType && c.name.toLowerCase().includes(filterText.toLowerCase()));

    if (filtered.length === 0) {
        DOM.colListWrapper.innerHTML = `<div style="padding:30px; text-align:center; color:var(--muted);">No collections found.</div>`;
        return;
    }

    filtered.forEach(col => {
        const div = document.createElement('div');
        div.className = 'c-list-item';
        div.onclick = () => {
            document.querySelectorAll('.c-list-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            updateRightSidebarContent(col);
        };
        const deleteIcon = !col.system ? '<i class="fa-solid fa-trash" style="font-size:0.8rem; color:#ff4757; opacity:0.5; cursor:pointer;"></i>' : '';
        div.innerHTML = `
            <div class="c-item-content">
                <div style="display:flex; justify-content:space-between;">
                    <span class="c-item-name">${col.name}</span>
                    ${deleteIcon}
                </div>
                <span class="c-item-status">${col.count} items</span>
            </div>`;
        const delBtn = div.querySelector('.fa-trash');
        if(delBtn) delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteCollection(col.id); });
        DOM.colListWrapper.appendChild(div);
    });
}

function deleteCollection(id) {
    Swal.fire({
        title: 'Delete?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ff4757', confirmButtonText: 'Delete', background: '#0d1423', color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            const idx = COLLECTIONS_DB.findIndex(c => c.id === id);
            if (idx > -1) COLLECTIONS_DB.splice(idx, 1);
            renderCollections();
        }
    });
}

export function updateRightSidebarContent(col) {
    // Sidebar Icon Logic
    if (col.id === 'following') {
        DOM.navCollections.classList.remove('active');
        DOM.navSubs.classList.add('active');
        if(DOM.navCollections.querySelector('i')) DOM.navCollections.querySelector('i').classList.replace('fa-solid', 'fa-regular');
        if(DOM.navSubs.querySelector('i')) {
             DOM.navSubs.querySelector('i').classList.remove('fa-regular');
             DOM.navSubs.querySelector('i').classList.add('fa-solid');
        }
    } else {
        DOM.navSubs.classList.remove('active');
        DOM.navCollections.classList.add('active');
        if(DOM.navCollections.querySelector('i')) DOM.navCollections.querySelector('i').classList.replace('fa-regular', 'fa-solid');
    }

    if(DOM.rsTitle) DOM.rsTitle.innerText = col.name.toUpperCase();

    // Content Injection Logic
    if (col.type === 'user') {
        // Show User Filters
        DOM.rsViewUsers.classList.remove('hidden');
        DOM.rsViewMedia.classList.add('hidden');
        
        const userChipsContainer = DOM.rsViewUsers.querySelector('.filter-chips');
        if(userChipsContainer) {
            userChipsContainer.innerHTML = `
                <span class="chip active">All 0</span>
                <span class="chip">Active 0</span>
                <span class="chip">Expired 0</span>
                <span class="chip">Restricted 0</span>
                <span class="chip">Blocked 0</span>
            `;
            const chips = userChipsContainer.querySelectorAll('.chip');
            chips.forEach(chip => {
                chip.onclick = () => {
                    chips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                };
            });
        }

    } else {
        // Show Media Vault
        DOM.rsViewUsers.classList.add('hidden');
        DOM.rsViewMedia.classList.remove('hidden');

        // Inject Media Filters
        const mediaChipsContainer = document.querySelector('.media-filter-chips');
        if(mediaChipsContainer) {
            mediaChipsContainer.innerHTML = `
                <button class="n-pill active">All</button>
                <button class="n-pill">Photos</button>
                <button class="n-pill">Videos</button>
                <button class="n-pill">Audio</button>
                <button class="n-pill">Other</button>
                <button class="n-pill">Locked</button>
            `;
        }
        setupMediaViewInteractions(); 
        renderMediaGrid(col.count);
    }
}

function setupMediaViewInteractions() {
    const mediaChips = document.querySelectorAll('.media-filter-chips .n-pill');
    mediaChips.forEach(chip => {
        chip.onclick = () => {
            mediaChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            if(DOM.rsMediaGrid) {
                DOM.rsMediaGrid.style.opacity = '0.5';
                setTimeout(() => DOM.rsMediaGrid.style.opacity = '1', 200);
            }
        };
    });

    const icons = document.querySelectorAll('.header-tools i');
    icons.forEach(icon => {
        const newIcon = icon.cloneNode(true);
        icon.parentNode.replaceChild(newIcon, icon);
        newIcon.addEventListener('click', (e) => {
            const title = e.target.getAttribute('title');
            if(title === 'Search') {
                Swal.fire({ title: 'Search Media', input: 'text', background: '#0d1423', color: '#fff', confirmButtonColor: '#64E9EE' });
            } 
            else if(title === 'Grid View') {
                if(DOM.rsMediaGrid) {
                    DOM.rsMediaGrid.classList.toggle('compact-view');
                    e.target.classList.toggle('active');
                }
            }
        });
    });
}

function renderMediaGrid(count) {
    if(!DOM.rsMediaGrid) return;
    DOM.rsMediaGrid.innerHTML = '';
    if (count === 0) {
        DOM.rsMediaEmpty.classList.remove('hidden');
    } else {
        DOM.rsMediaEmpty.classList.add('hidden');
        for(let i=0; i < count; i++) {
            const img = document.createElement('img');
            img.src = BLANK_IMG;
            img.style.width = '100%'; img.style.aspectRatio = '1/1'; img.style.objectFit = 'cover'; img.style.borderRadius = '8px'; img.style.background = '#222'; img.style.cursor = 'pointer';
            DOM.rsMediaGrid.appendChild(img);
        }
    }
}