import { DOM } from './dom.js';
import { COLLECTIONS_DB, BLANK_IMG } from './data.js';

let currentColType = 'user'; 

export function initCollections(TopToast) {
    if (DOM.colBtnSearch) DOM.colBtnSearch.addEventListener('click', () => { DOM.colSearchContainer.classList.remove('hidden'); DOM.colSearchInput.focus(); });
    if (DOM.colSearchClose) DOM.colSearchClose.addEventListener('click', () => { DOM.colSearchContainer.classList.add('hidden'); DOM.colSearchInput.value = ''; renderCollections(); });
    if (DOM.colSearchInput) DOM.colSearchInput.addEventListener('input', (e) => renderCollections(e.target.value));

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

    if (DOM.colTabUsers && DOM.colTabBookmarks) {
        DOM.colTabUsers.addEventListener('click', () => {
            DOM.colTabUsers.classList.add('active'); DOM.colTabBookmarks.classList.remove('active');
            currentColType = 'user';
            renderCollections();
        });
        
        DOM.colTabBookmarks.addEventListener('click', () => {
            DOM.colTabBookmarks.classList.add('active'); DOM.colTabUsers.classList.remove('active');
            currentColType = 'post';
            renderCollections();
        });
    }
    
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

            // 🔥 MOBILE FIX: Force Open Sidebar as Full Page
            if (window.innerWidth <= 1024 && DOM.rightSidebar) {
                DOM.rightSidebar.classList.remove('hidden-sidebar');
                DOM.rightSidebar.classList.add('mobile-active');
            }
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
    if (DOM.rsTitle) DOM.rsTitle.innerText = col.name.toUpperCase();

    // MOBILE FIX: Add Back Button inside Collections view too
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
    }

    if (col.type === 'user') {
        DOM.rsViewUsers.classList.remove('hidden');
        DOM.rsViewMedia.classList.add('hidden');
    } else {
        DOM.rsViewUsers.classList.add('hidden');
        DOM.rsViewMedia.classList.remove('hidden');
        renderMediaGrid(col.count);
    }
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