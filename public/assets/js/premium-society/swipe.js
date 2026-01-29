// assets/js/premium-society/swipe.js
import { PS_DOM, showToast } from './core.js';

export const SwipeController = (() => {
    const mockCandidates = [
        { name: 'Isabella', age: 24, loc: 'Manila', color: '#8e44ad', tags: ['Travel', 'Music'] },
        { name: 'Christian', age: 29, loc: 'Cebu', color: '#2c3e50', tags: ['Tech', 'Coffee'] },
        { name: 'Natalia', age: 26, loc: 'Davao', color: '#c0392b', tags: ['Art', 'Movies'] },
        { name: 'Sophia', age: 22, loc: 'Baguio', color: '#16a085', tags: ['Nature', 'Hiking'] },
        { name: 'Marco', age: 27, loc: 'Makati', color: '#e67e22', tags: ['Food', 'Gym'] }
    ];
    
    let candidates = [...mockCandidates]; 
    let index = 0;
    
    // Persistent Variables
    let dailySwipes = 20;
    let resetTime = 0;
    let isSwiping = false; 

    // --- VARIABLES PARA SA SWIPE BACK ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    // Mas pinalawak na detection area (0px to 60px galing kaliwa)
    const EDGE_THRESHOLD = 60; 
    // Mas maikling hila lang kailangan para gumana (50px)
    const SWIPE_THRESHOLD = 50; 

    function init() {
        candidates = [...mockCandidates]; 
        index = 0;

        // 1. CHECK LOCAL STORAGE
        const savedSwipes = localStorage.getItem('ps_swipes_left');
        const savedTime = localStorage.getItem('ps_reset_time');
        const now = Date.now();

        if (savedTime && now < parseInt(savedTime)) {
            dailySwipes = parseInt(savedSwipes);
            resetTime = parseInt(savedTime);
        } else {
            dailySwipes = 20;
            resetTime = now + (12 * 60 * 60 * 1000); 
            saveData();
        }

        startCountdown(); 
        
        if(PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove('active');
        if(PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'flex';
        
        updateStats(dailySwipes, 20);
        renderCards();
        
        if(PS_DOM.btnRefreshDeck) {
            PS_DOM.btnRefreshDeck.onclick = () => tryRefresh();
        }

        // 2. ACTIVATE AGGRESSIVE SWIPE BACK
        initSmartEdgeSwipe();
    }

    // --- SMART EDGE SWIPE LOGIC (UPDATED FIXED) ---
    function initSmartEdgeSwipe() {
        const body = document.body;

        // A. START TOUCH (Fixed: Use clientX)
        body.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
        }, { passive: false });

        // B. MOVING (Prevent Native Browser Back if swiping from edge)
        body.addEventListener('touchmove', (e) => {
            let currentX = e.changedTouches[0].clientX;
            let currentY = e.changedTouches[0].clientY;

            // Check if galing sa gilid
            if (touchStartX <= EDGE_THRESHOLD) {
                let xDiff = Math.abs(currentX - touchStartX);
                let yDiff = Math.abs(currentY - touchStartY);

                // Check kung horizontal swipe (at mas malakas sa vertical)
                if (xDiff > yDiff && xDiff > 10) {
                     // ITO ANG FIX: Pigilan ang browser native gesture
                    if(e.cancelable) e.preventDefault(); 
                }
            }
        }, { passive: false });

        // C. END TOUCH (Check if swipe is valid)
        body.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            handleEdgeSwipe();
        }, { passive: false });
    }

    function handleEdgeSwipe() {
        // 1. Dapat galing sa kaliwang gilid
        if (touchStartX > EDGE_THRESHOLD) return;

        // 2. Kalkulahin ang layo
        const diffX = touchEndX - touchStartX;
        const diffY = Math.abs(touchEndY - touchStartY);

        // 3. Dapat Horizontal swipe (pakanan) at lagpas sa threshold
        if (diffX > SWIPE_THRESHOLD && diffX > diffY) {
            triggerHierarchyBack();
        }
    }

    function triggerHierarchyBack() {
        // --- PRIORITY 1: OVERLAYS & MODALS (Pinaka-ibabaw) ---
        
        // A. CHAT WINDOW (Chat -> Matches)
        const chatWindow = document.getElementById('psChatWindow');
        if (chatWindow && chatWindow.classList.contains('active')) {
            if (window.closeChat) window.closeChat();
            return; // STOP! Wag na tumuloy sa baba.
        }

        // B. STORY VIEWER
        const storyViewer = document.getElementById('psStoryViewer');
        if (storyViewer && storyViewer.classList.contains('active')) {
            if (window.closeStory) window.closeStory();
            return;
        }

        // C. MATCH OVERLAY (Confetti)
        const matchOverlay = document.getElementById('psMatchOverlay');
        if (matchOverlay && matchOverlay.classList.contains('active')) {
            if (window.closeMatchOverlay) window.closeMatchOverlay();
            return;
        }

        // D. EDIT PROFILE MODAL
        const editModal = document.getElementById('psEditProfileModal');
        if (editModal && editModal.classList.contains('active')) {
            if (window.closeEditProfile) window.closeEditProfile();
            return;
        }

        // E. CREATOR PROFILE
        const creatorModal = document.getElementById('psCreatorProfileModal');
        if (creatorModal && creatorModal.classList.contains('active')) {
            if (window.closeCreatorProfile) window.closeCreatorProfile();
            return;
        }

        // F. GIFT MODAL
        const giftModal = document.getElementById('psGiftModal');
        if (giftModal && giftModal.classList.contains('active')) {
            if (window.closeGiftModal) window.closeGiftModal();
            return;
        }

        // --- PRIORITY 2: TABS (Kung walang naka-open na modal) ---
        
        const activeTab = document.querySelector('.ps-nav-btn.ps-is-active');
        
        // Kung hindi ka nasa Home, balik sa Home
        if (activeTab && activeTab.dataset.panel !== 'home') {
            const homeBtn = document.querySelector('button[data-panel="home"]');
            if(homeBtn) {
                homeBtn.click();
                showToast("Back to Home"); 
            }
        }
    }

    // --- EXISTING SWIPE LOGIC (CARDS) ---

    function saveData() {
        localStorage.setItem('ps_swipes_left', dailySwipes);
        localStorage.setItem('ps_reset_time', resetTime);
    }

    function startCountdown() {
        setInterval(() => {
            const now = Date.now();
            const diff = resetTime - now;

            if (diff <= 0) {
                if (PS_DOM.timerDisplay) PS_DOM.timerDisplay.textContent = "Ready to reset!";
                if (dailySwipes < 20) {
                    dailySwipes = 20;
                    resetTime = now + (12 * 60 * 60 * 1000);
                    saveData();
                    updateStats(dailySwipes, 20);
                }
            } else {
                const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                
                if (PS_DOM.timerDisplay) {
                    PS_DOM.timerDisplay.textContent = `Resets in ${hrs}h ${mins}m ${secs}s`;
                }
            }
        }, 1000);
    }

    function tryRefresh() {
        if (dailySwipes <= 0) {
            fireEmptyAlert();
        } else {
            index = 0;
            if(PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove('active');
            if(PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'flex';
            renderCards();
            showToast("Deck Refreshed");
        }
    }

    function fireEmptyAlert() {
        Swal.fire({
            title: 'Out of Swipes!',
            text: 'Please wait for the timer to reset or upgrade to Gold.',
            icon: 'warning',
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#00aff0',
            confirmButtonText: 'Okay, I\'ll wait',
            backdrop: `rgba(0,0,0,0.8)`
        });
    }

    function createCard(person, position) {
        const card = document.createElement('div');
        card.className = 'ps-swipe-card';
        card.setAttribute('data-pos', position);
        if (position === 'center') card.id = 'activeSwipeCard';
        card.style.background = `linear-gradient(to bottom, ${person.color}, #000)`;
        
        let tagsHtml = `<div class="ps-swipe-tags">`;
        person.tags.forEach(t => tagsHtml += `<span class="ps-tag">${t}</span>`);
        tagsHtml += `</div>`;

        card.innerHTML = `
            <div class="ps-swipe-card-info">
                <h2>${person.name} <span>${person.age}</span></h2>
                <p>📍 ${person.loc}</p>
                ${tagsHtml}
            </div>
        `;
        return card;
    }

    function renderCards() {
        if (!PS_DOM.swipeStack) return;
        PS_DOM.swipeStack.innerHTML = '';
        
        if(index >= candidates.length) {
            showEmptyState();
            return;
        }

        if (index > 0) {
            const prevPerson = candidates[index - 1];
            PS_DOM.swipeStack.appendChild(createCard(prevPerson, 'left'));
        }

        const centerPerson = candidates[index];
        PS_DOM.swipeStack.appendChild(createCard(centerPerson, 'center'));

        if (index + 1 < candidates.length) {
            const rightPerson = candidates[index + 1];
            PS_DOM.swipeStack.appendChild(createCard(rightPerson, 'right'));
        }
    }

    function showEmptyState() {
        if(PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'none';
        if(PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.add('active');
    }

    function handleSwipe(action) {
        if(isSwiping) return;

        if (dailySwipes <= 0) {
            fireEmptyAlert();
            return;
        }

        const card = document.getElementById('activeSwipeCard');
        if(!card) return;

        isSwiping = true; 

        dailySwipes--;
        saveData(); 
        updateStats(dailySwipes, 20);

        const currentPerson = candidates[index];

        if(action === 'like') {
            card.classList.add('anim-like');
            if(Math.random() < 0.5) {
                setTimeout(() => {
                    if(window.triggerMatchOverlay) window.triggerMatchOverlay(currentPerson);
                }, 500);
            } else {
                showToast('Liked!');
            }
        } else if (action === 'super') {
            card.classList.add('anim-super');
            showToast('Super Liked!');
            setTimeout(() => {
                if(window.triggerMatchOverlay) window.triggerMatchOverlay(currentPerson);
            }, 500);
        } else {
            card.classList.add('anim-pass');
            showToast('Passed');
        }

        setTimeout(() => {
            index++;
            renderCards();
            isSwiping = false; 
        }, 300);
    }

    function updateStats(curr, max) {
        if(PS_DOM.countDisplay) PS_DOM.countDisplay.textContent = curr;
        if(PS_DOM.mobileSwipeBadge) PS_DOM.mobileSwipeBadge.textContent = curr;

        if(PS_DOM.ringCircle) {
            const percent = curr / max;
            PS_DOM.ringCircle.style.strokeDasharray = 314; 
            PS_DOM.ringCircle.style.strokeDashoffset = 314 - (314 * percent);
        }
    }

    if(PS_DOM.btnSwipeLike) PS_DOM.btnSwipeLike.addEventListener('click', () => handleSwipe('like'));
    if(PS_DOM.btnSwipePass) PS_DOM.btnSwipePass.addEventListener('click', () => handleSwipe('pass'));
    if(PS_DOM.btnSwipeSuper) PS_DOM.btnSwipeSuper.addEventListener('click', () => handleSwipe('super'));

    return { init };
})();