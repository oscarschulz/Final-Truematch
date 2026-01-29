// assets/js/premium-society/sidebar.js
import { PS_DOM, showToast } from './core.js';

export function initSidebarLogic() {
    console.log("Sidebar Module Loaded");
    
    initProfileMenu();
    initRightSidebarInteractions();
    initMobileToggles();
    initOverlayObservers(); // <-- DITO NATIN IBABANTAI ANG CHAT AT CREATORS
}

// --- NEW: OVERLAY OBSERVERS (Hides Hamburger on Chat & Creator Profile) ---
function initOverlayObservers() {
    const body = document.body;

    // 1. CHAT WINDOW OBSERVER
    const chatWindow = document.getElementById('psChatWindow');
    if (chatWindow) {
        const chatObs = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'class') {
                    if (chatWindow.classList.contains('active')) {
                        body.classList.add('ps-chat-open');
                    } else {
                        body.classList.remove('ps-chat-open');
                    }
                }
            });
        });
        chatObs.observe(chatWindow, { attributes: true });
    }

    // 2. CREATOR PROFILE OBSERVER
    const creatorModal = document.getElementById('psCreatorProfileModal');
    if (creatorModal) {
        const creatorObs = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'class') {
                    if (creatorModal.classList.contains('active')) {
                        body.classList.add('ps-creator-open');
                    } else {
                        body.classList.remove('ps-creator-open');
                    }
                }
            });
        });
        creatorObs.observe(creatorModal, { attributes: true });
    }
}

// --- LEFT SIDEBAR: PROFILE MENU (UPWARD POPUP) ---
function initProfileMenu() {
    const profileBtn = document.querySelector('.ps-mini-profile');
    const menuPopup = document.getElementById('psUserMenuPopup');

    if (profileBtn && menuPopup) {
        // Toggle Menu on Click
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuPopup.classList.toggle('active');
            profileBtn.classList.toggle('active');
        });

        // Close Menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuPopup.contains(e.target) && !profileBtn.contains(e.target)) {
                menuPopup.classList.remove('active');
                profileBtn.classList.remove('active');
            }
        });
    }

    // Logout Logic
    window.handleLogout = () => {
        Swal.fire({
            title: 'Log out?',
            text: "You will be returned to the login screen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4757',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, Log out',
            background: '#15151e',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                showToast("Logging out...");
                setTimeout(() => location.reload(), 1500); // Simulate Logout
            }
        });
    };

    // Add Account Logic
    window.handleAddAccount = () => {
        if(menuPopup) menuPopup.classList.remove('active'); // Close menu
        
        Swal.fire({
            title: 'Add Account',
            html: `
                <p style="font-size:0.9rem; color:#ccc; margin-bottom:15px;">Switch easily between multiple profiles.</p>
                <input type="text" class="swal2-input" placeholder="Username / Email" style="color:#fff; background:#222; border:1px solid #444;">
                <input type="password" class="swal2-input" placeholder="Password" style="color:#fff; background:#222; border:1px solid #444;">
            `,
            confirmButtonText: 'Login & Add',
            confirmButtonColor: '#00aff0',
            showCancelButton: true,
            background: '#15151e',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Account Added',
                    text: 'You can now switch between accounts.',
                    background: '#15151e',
                    color: '#fff',
                    confirmButtonColor: '#00aff0'
                });
            }
        });
    };
}

// --- RIGHT SIDEBAR INTERACTIONS ---
function initRightSidebarInteractions() {
    // Search Bar Focus Effect
    const searchInput = document.querySelector('.ps-search-input');
    const searchBox = document.querySelector('.ps-search-box');
    
    if(searchInput && searchBox) {
        searchInput.addEventListener('focus', () => {
            searchBox.style.borderColor = '#00aff0';
            searchBox.style.background = 'rgba(255,255,255,0.08)';
        });
        searchInput.addEventListener('blur', () => {
            searchBox.style.borderColor = 'rgba(255,255,255,0.1)';
            searchBox.style.background = 'rgba(255,255,255,0.05)';
        });
    }
}

// --- MOBILE TOGGLES ---
function initMobileToggles() {
    if(PS_DOM.mobileMenuBtn) {
        PS_DOM.mobileMenuBtn.onclick = (e) => {
            e.stopPropagation();
            if(PS_DOM.sidebar) PS_DOM.sidebar.classList.toggle('ps-is-open');
        };
    }

    // Close sidebar on outside click
    document.addEventListener('click', (e) => {
        if(PS_DOM.sidebar && PS_DOM.sidebar.classList.contains('ps-is-open')) {
            if(!PS_DOM.sidebar.contains(e.target) && e.target !== PS_DOM.mobileMenuBtn) {
                PS_DOM.sidebar.classList.remove('ps-is-open');
            }
        }
    });
}