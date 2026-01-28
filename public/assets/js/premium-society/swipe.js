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

    function init() {
        candidates = [...mockCandidates]; 
        index = 0;

        // 1. CHECK LOCAL STORAGE
        const savedSwipes = localStorage.getItem('ps_swipes_left');
        const savedTime = localStorage.getItem('ps_reset_time');
        const now = Date.now();

        if (savedTime && now < parseInt(savedTime)) {
            // Timer is active, load saved data
            dailySwipes = parseInt(savedSwipes);
            resetTime = parseInt(savedTime);
        } else {
            // Timer expired or first run: RESET TO 20
            dailySwipes = 20;
            resetTime = now + (12 * 60 * 60 * 1000); // 12 Hours from now
            saveData();
        }

        startCountdown(); // Start the UI timer
        
        if(PS_DOM.refreshPopover) PS_DOM.refreshPopover.classList.remove('active');
        if(PS_DOM.swipeControls) PS_DOM.swipeControls.style.display = 'flex';
        
        updateStats(dailySwipes, 20);
        renderCards();
        
        // Refresh Button Click
        if(PS_DOM.btnRefreshDeck) {
            PS_DOM.btnRefreshDeck.onclick = () => tryRefresh();
        }
    }

    function saveData() {
        localStorage.setItem('ps_swipes_left', dailySwipes);
        localStorage.setItem('ps_reset_time', resetTime);
    }

    function startCountdown() {
        // Update timer every second
        setInterval(() => {
            const now = Date.now();
            const diff = resetTime - now;

            if (diff <= 0) {
                // Time's up! Reset Logic
                if (PS_DOM.timerDisplay) PS_DOM.timerDisplay.textContent = "Ready to reset!";
                // Automatically reset if time passes
                if (dailySwipes < 20) {
                    dailySwipes = 20;
                    resetTime = now + (12 * 60 * 60 * 1000);
                    saveData();
                    updateStats(dailySwipes, 20);
                    // Optional: reload page or notify user
                }
            } else {
                // Format HHh MMm SSs
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
            // Only refresh cards if they have swipes
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

        // BLOCK IF NO SWIPES LEFT
        if (dailySwipes <= 0) {
            fireEmptyAlert();
            return;
        }

        const card = document.getElementById('activeSwipeCard');
        if(!card) return;

        isSwiping = true; 

        // Decrement and Save
        dailySwipes--;
        saveData(); // Save new count to local storage
        updateStats(dailySwipes, 20);

        if(action === 'like') {
            card.classList.add('anim-like');
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