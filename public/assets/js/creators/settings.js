import { DOM } from './dom.js';

export function initSettings() {
    // FIX: Use Event Delegation sa container (view-settings)
    // Ito ay para siguradong gagana ang click kahit late ma-load ang HTML
    const settingsView = DOM.viewSettings;
    const rsContainer = DOM.rsSettingsView;
    const rightSidebar = document.getElementById('right-sidebar');

    if (settingsView) {
        settingsView.addEventListener('click', (e) => {
            // Check kung ang clinic ay .set-item o nasa loob nito
            const item = e.target.closest('.set-item');
            
            if (item) {
                // Remove active from all siblings
                const allItems = settingsView.querySelectorAll('.set-item');
                allItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Load Content sa Right Sidebar
                const target = item.dataset.target;
                loadSettingsContent(target);

                // MOBILE ONLY: Slide in Right Sidebar
                if (window.innerWidth <= 1024 && rightSidebar) {
                    rightSidebar.classList.remove('hidden-sidebar');
                    rightSidebar.classList.add('mobile-active');
                }
            }
        });
    }

    // Default Load (Kung nasa settings view na agad)
    loadSettingsContent('profile');

    function loadSettingsContent(target) {
        if(!rsContainer) return;
        
        // Find content source inside the loaded settings HTML
        const sourceId = `set-content-${target}-source`;
        const sourceEl = document.getElementById(sourceId);

        rsContainer.innerHTML = ''; // Clear previous

        // MOBILE ONLY: Add Back Button Header inside Right Sidebar
        if (window.innerWidth <= 1024) {
            const backBtn = document.createElement('div');
            backBtn.className = 'settings-mobile-back';
            const title = target.charAt(0).toUpperCase() + target.slice(1);
            backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> ${title}`;
            backBtn.style.padding = '15px';
            backBtn.style.cursor = 'pointer';
            backBtn.style.borderBottom = '1px solid var(--border-color)';
            
            backBtn.addEventListener('click', () => {
                if(rightSidebar) {
                    rightSidebar.classList.remove('mobile-active');
                    // Optional: Hide sidebar completely if needed
                    // rightSidebar.classList.add('hidden-sidebar');
                }
            });
            rsContainer.appendChild(backBtn);
        }

        if (sourceEl) {
            const clone = sourceEl.cloneNode(true);
            clone.id = ''; // Remove ID to avoid duplicates
            clone.style.display = 'block'; 
            rsContainer.appendChild(clone);

            // --- RE-INITIALIZE TOGGLES FOR THE NEWLY CLONED CONTENT ---
            if (target === 'security') {
                setupPasswordToggles(rsContainer);
            }
            if (target === 'display') {
                setupSettingsThemeToggle(rsContainer);
            }

        } else {
            rsContainer.innerHTML += `<div style="padding:20px; text-align:center; color:gray;">Content for '${target}' coming soon.</div>`;
        }
    }

    // --- HELPER: PASSWORD TOGGLE LOGIC ---
    function setupPasswordToggles(container) {
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('fa-eye') || e.target.classList.contains('fa-eye-slash')) {
                const icon = e.target;
                const input = icon.previousElementSibling; // Assuming input is right before icon
                if (input && input.tagName === 'INPUT') {
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.replace('fa-eye-slash', 'fa-eye');
                        icon.style.color = 'var(--primary-cyan)';
                    } else {
                        input.type = 'password';
                        icon.classList.replace('fa-eye', 'fa-eye-slash');
                        icon.style.color = 'var(--muted)';
                    }
                }
            }
        });
    }

    // --- HELPER: SETTINGS THEME TOGGLE LOGIC ---
    function setupSettingsThemeToggle(container) {
        const toggle = container.querySelector('#setting-theme-toggle');
        if (toggle) {
            const isDark = document.body.classList.contains('tm-dark');
            toggle.checked = isDark;

            toggle.addEventListener('change', function() {
                if (this.checked) {
                    document.body.classList.remove('tm-light');
                    document.body.classList.add('tm-dark');
                } else {
                    document.body.classList.remove('tm-dark');
                    document.body.classList.add('tm-light');
                }
                
                const popoverToggle = document.getElementById('themeToggle');
                if(popoverToggle) popoverToggle.checked = this.checked;
            });
        }
    }
}