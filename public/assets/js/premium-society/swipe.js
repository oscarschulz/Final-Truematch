// assets/js/premium-society/swipe.js
import { PS_DOM, showToast } from './core.js';

export const SwipeController = (() => {
    // CLEANED: Wala na ang mockCandidates. Magsisimula sa empty array.
    let candidates = []; 
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

    const EDGE_THRESHOLD = 60; 
    const SWIPE_THRESHOLD = 50; 

    function init() {
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
        
        // 2. FETCH DATA FROM BACKEND
        fetchCandidates(); 

        // 3. ACTIVATE AGGRESSIVE SWIPE BACK
        initSmartEdgeSwipe();
    }

    // --- TODO: DITO MO IKOKONEK SA BACKEND ---
    async function fetchCandidates() {
        try {
            // HALIMBAWA: const response = await fetch('/api/get-candidates');
            // const data = await response.json();
            // candidates = data;
            
            // PANSAMANTALA: Empty muna habang wala pang backend endpoint
            candidates = []; 

            renderCards();
        } catch (error) {
            console.error("Failed to fetch candidates:", error);
            showToast("Error loading profiles");
        }
    }

    // --- SMART EDGE SWIPE LOGIC ---
    function initSmartEdgeSwipe() {
        const body = document.body;

        body.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
        }, { passive: false });

        body.addEventListener('touchmove', (e) => {
            let currentX = e.changedTouches[0].clientX;
            let currentY = e.changedTouches[0].clientY;

            if (touchStartX <= EDGE_THRESHOLD) {
                let xDiff = Math.abs(currentX - touchStartX);
                let yDiff = Math.abs(currentY - touchStartY);

                if (xDiff > yDiff && xDiff > 10) {
                    if(e.cancelable) e.preventDefault(); 
                }
            }
        }, { passive: false });

        body.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            handleEdgeSwipe();
        }, { passive: false });
    }

    function handleEdgeSwipe() {
        if (touchStartX > EDGE_THRESHOLD) return;
        const diffX = touchEndX - touchStartX;
        const diffY = Math.abs(touchEndY - touchStartY);

        if (diffX > SWIPE_THRESHOLD && diffX > diffY) {
            triggerHierarchyBack();
        }
    }

    function triggerHierarchyBack() {
        // PRIORITY 1: OVERLAYS
        const chatWindow = document.getElementById('psChatWindow');
        if (chatWindow && chatWindow.classList.contains('active')) {
            if (window.closeChat) window.closeChat();
            return;
        }
        const storyViewer = document.getElementById('psStoryViewer');
        if (storyViewer && storyViewer.classList.contains('active')) {
            if (window.closeStory) window.closeStory();
            return;
        }
        const matchOverlay = document.getElementById('psMatchOverlay');
        if (matchOverlay && matchOverlay.classList.contains('active')) {
            if (window.closeMatchOverlay) window.closeMatchOverlay();
            return;
        }
        const editModal = document.getElementById('psEditProfileModal');
        if (editModal && editModal.classList.contains('active')) {
            if (window.closeEditProfile) window.closeEditProfile();
            return;
        }
        const creatorModal = document.getElementById('psCreatorProfileModal');
        if (creatorModal && creatorModal.classList.contains('active')) {
            if (window.closeCreatorProfile) window.closeCreatorProfile();
            return;
        }
        const giftModal = document.getElementById('psGiftModal');
        if (giftModal && giftModal.classList.contains('active')) {
            if (window.closeGiftModal) window.closeGiftModal();
            return;
        }

        // PRIORITY 2: TABS
        const activeTab = document.querySelector('.ps-nav-btn.ps-is-active');
        if (activeTab && activeTab.dataset.panel !== 'home') {
            const homeBtn = document.querySelector('button[data-panel="home"]');
            if(homeBtn) {
                homeBtn.click();
                showToast("Back to Home"); 
            }
        }
    }

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
        // TODO: Call backend fetchCandidates() here instead of just resetting index
        if (dailySwipes <= 0) {
            fireEmptyAlert();
        } else {
            // fetchCandidates(); // Uncomment pag may backend na
            showToast("No new profiles yet");
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
        card.style.background = `linear-gradient(to bottom, ${person.color || '#333'}, #000)`;
        
        let tagsHtml = `<div class="ps-swipe-tags">`;
        if(person.tags) {
            person.tags.forEach(t => tagsHtml += `<span class="ps-tag">${t}</span>`);
        }
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
        
        // CHECK IF EMPTY
        if(candidates.length === 0 || index >= candidates.length) {
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
            // CLEANED: Inalis ang random match logic. Dito mo lalagay ang API call for like.
            // API.likeUser(currentPerson.id).then(...)
            showToast('Liked!');
        } else if (action === 'super') {
            card.classList.add('anim-super');
            showToast('Super Liked!');
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