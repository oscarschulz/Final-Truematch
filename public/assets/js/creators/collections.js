import { DOM } from './dom.js';
import { COLLECTIONS_DB, BLANK_IMG } from './data.js';

// TODO: Backend Integration - Replace LocalStorage with API Endpoints
let currentColType = 'user'; // 'user' (Lists) or 'post' (Vault)
let currentMediaFilter = 'all'; // 'all', 'image', 'video'

export function initCollections(TopToast) {
    
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