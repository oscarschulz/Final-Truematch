// ---------------------------------------------------------------------
// Premium Society - Unique Namespace Controller
// ---------------------------------------------------------------------

const PS_DOM = {
    layout: document.getElementById('psMainLayout'),
    loader: document.getElementById('ps-app-loader'),
    tabs: document.querySelectorAll('.ps-nav-btn'),
    panels: document.querySelectorAll('.ps-panel[data-panel]'),
    sidebar: document.getElementById('psMainSidebar'),
    
    // Containers for Mock Data
    storiesContainer: document.getElementById('psStoriesContainer'),
    admirerContainer: document.getElementById('psAdmirerContainer'),
    admirerCount: document.getElementById('psAdmirerCount'),
    matchesContainer: document.getElementById('psMatchesContainer'),
    newMatchesRail: document.getElementById('psNewMatchesRail'),
    newMatchCount: document.getElementById('psNewMatchCount'),
    activeNearbyContainer: document.getElementById('psActiveNearbyContainer'),
    
    // Mobile Toggles
    mobileMenuBtn: document.getElementById('psMobileNavToggle'),
    mobileMomentsBtn: document.getElementById('psMobileMomentsToggle'),
    momentsPopup: document.getElementById('psMomentsPopup'),
    
    // Swipe
    swipeStack: document.getElementById('psSwipeStack'),
    swipeEmpty: document.getElementById('psSwipeEmpty'),
    swipeControls: document.getElementById('psSwipeControls'),
    btnSwipePass: document.getElementById('psBtnSwipePass'),
    btnSwipeLike: document.getElementById('psBtnSwipeLike'),
    btnSwipeSuper: document.getElementById('psBtnSwipeSuper'),
    btnRefreshSwipe: document.getElementById('psBtnRefreshSwipe'),
    
    // Stats & Toast
    ringCircle: document.getElementById('psStatsRingCircle'),
    countDisplay: document.getElementById('psStatsCountDisplay'),
    toast: document.getElementById('ps-toast'),
    
    // Panels for injection
    panelCreatorsBody: document.getElementById('ps-panel-creators'),
    panelPremiumBody: document.getElementById('ps-panel-premium')
};

function getRandomColor() {
    // BLUE & VIBRANT COLORS NA (Hindi Gold)
    const colors = ['#00aff0', '#ff3366', '#3ad4ff', '#800080', '#00ff88', '#333'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function showToast(msg) {
    if (!PS_DOM.toast) return;
    PS_DOM.toast.innerHTML = `<i class="fa-solid fa-fire"></i> ${msg}`;
    PS_DOM.toast.className = `ps-toast ps-visible`;
    setTimeout(() => PS_DOM.toast.classList.remove('ps-visible'), 3000);
}

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    initCanvasParticles();
    initNavigation();
    initMobileMenu();
    populateMockContent(); // GENERATE FAKE DATA
    
    // Remove Loader
    setTimeout(() => {
        if(PS_DOM.loader) {
            PS_DOM.loader.style.opacity = '0';
            setTimeout(() => PS_DOM.loader.remove(), 500);
        }
        if(PS_DOM.layout) PS_DOM.layout.style.opacity = '1';
        updateStats(20, 20); // Demo stats
    }, 1000);
});

// ---------------------------------------------------------------------
// POPULATE MOCK CONTENT
// ---------------------------------------------------------------------
function populateMockContent() {
    console.log("Generating Premium Society Data...");

    // 1. STORIES (MOMENTS)
    if (PS_DOM.storiesContainer) {
        const stories = ['Elena', 'Marco', 'Sarah', 'James', 'Pia'];
        let html = `
            <div class="ps-story-item">
                <div class="ps-story-ring" style="border-color:#fff; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-plus"></i>
                </div>
                <span class="ps-story-name" style="font-size:0.7rem;">Add</span>
            </div>`;
        stories.forEach(name => {
            html += `
            <div class="ps-story-item">
                <div class="ps-story-ring">
                    <img class="ps-story-img" src="https://via.placeholder.com/50" style="background:${getRandomColor()}">
                </div>
                <span class="ps-story-name" style="font-size:0.7rem;">${name}</span>
            </div>`;
        });
        PS_DOM.storiesContainer.innerHTML = html;
    }

    // 2. ADMIRERS (BLURRED/LOCKED)
    if (PS_DOM.admirerContainer) {
        const admirers = [
            { name: 'Unknown', loc: 'Nearby' },
            { name: 'Unknown', loc: '5km away' },
            { name: 'Unknown', loc: 'City Center' }
        ];
        if(PS_DOM.admirerCount) PS_DOM.admirerCount.textContent = `${admirers.length} New`;
        
        let html = '';
        admirers.forEach(adm => {
            html += `
            <div class="ps-admirer-row" onclick="document.querySelector('[data-panel=premium]').click()">
                <img class="ps-admirer-img" src="https://via.placeholder.com/50" style="background:${getRandomColor()}">
                <div style="flex:1;">
                    <h4 style="margin:0; font-size:0.95rem;">${adm.name}</h4>
                    <p class="ps-tiny ps-muted" style="margin:0;">📍 ${adm.loc}</p>
                </div>
                <div style="color:#00aff0;"><i class="fa-solid fa-lock"></i></div>
            </div>`;
        });
        PS_DOM.admirerContainer.innerHTML = html;
    }

    // 3. MATCHES & MESSAGES
    if (PS_DOM.matchesContainer) {
        const matches = [
            { name: 'Victoria', msg: 'See you later! 👋', unread: true },
            { name: 'Alexander', msg: 'Great connection!', unread: false },
            { name: 'Sophia', msg: 'Sent a photo', unread: false }
        ];
        
        if(PS_DOM.newMatchCount) PS_DOM.newMatchCount.textContent = "2";
        if(PS_DOM.newMatchesRail) {
             PS_DOM.newMatchesRail.innerHTML = `
                <div class="ps-story-item"><div class="ps-story-ring"><img class="ps-story-img" src="https://via.placeholder.com/50" style="background:#00aff0"></div></div>
                <div class="ps-story-item"><div class="ps-story-ring"><img class="ps-story-img" src="https://via.placeholder.com/50" style="background:#800080"></div></div>
             `;
        }

        let html = '';
        matches.forEach(m => {
            const unreadStyle = m.unread ? 'font-weight:bold; color:#fff;' : 'color:#888;';
            const dot = m.unread ? `<span style="width:8px; height:8px; background:#00aff0; border-radius:50%; display:inline-block;"></span>` : '';
            html += `
            <div class="ps-match-card" data-name="${m.name}" data-color="${getRandomColor()}" data-msg="${m.msg}">
                <img src="https://via.placeholder.com/150" class="ps-match-img" style="background:${getRandomColor()}">
                <div class="ps-match-info">
                    <span style="font-weight:800; display:block;">${m.name}</span>
                    <div style="${unreadStyle} font-size:0.85rem; margin-top:4px;">${dot} ${m.msg}</div>
                </div>
            </div>`;
        });
        PS_DOM.matchesContainer.innerHTML = html;
    }

    // 4. ACTIVE NEARBY
    if (PS_DOM.activeNearbyContainer) {
        let html = '';
        for(let i=0; i<6; i++) {
            html += `
            <div class="ps-active-item">
                <img class="ps-active-img" src="https://via.placeholder.com/100" style="background:${getRandomColor()}">
                <div style="position:absolute; bottom:5px; right:5px; width:10px; height:10px; background:#00ff88; border-radius:50; border:2px solid #000;"></div>
            </div>`;
        }
        PS_DOM.activeNearbyContainer.innerHTML = html;
    }

    // 5. CREATORS
    if(PS_DOM.panelCreatorsBody) {
        PS_DOM.panelCreatorsBody.insertAdjacentHTML('beforeend', `
           <div class="ps-matches-grid" style="grid-template-columns: repeat(2, 1fr);">
               <div class="ps-creator-card" style="background: linear-gradient(135deg, #4b0082, #800080);">
                   <h3 style="margin:0; color:#fff;">Sasha <i class="fa-solid fa-circle-check" style="color:#00aff0"></i></h3>
                   <p class="ps-tiny">Elite Model</p>
                   <button class="ps-btn-white" style="margin-top:auto;">View</button>
               </div>
               <div class="ps-creator-card" style="background: linear-gradient(135deg, #1a1a1a, #000); border:1px solid #00aff0;">
                   <div style="position:absolute; top:40%; left:50%; transform:translate(-50%, -50%);"><i class="fa-solid fa-lock" style="color:#fff; font-size:1.5rem;"></i></div>
                   <h3 style="margin:0; color:#fff;">Kim Lee</h3>
                   <p class="ps-tiny">VIP Only</p>
                   <button class="ps-btn-white" style="margin-top:auto; background:#00aff0; color:#fff;">Unlock</button>
               </div>
           </div>
        `);
    }

    // 6. PREMIUM
    if(PS_DOM.panelPremiumBody) {
        PS_DOM.panelPremiumBody.insertAdjacentHTML('beforeend', `
            <div style="text-align:center; padding:30px; border:1px solid #00aff0; border-radius:16px; margin:20px; background:rgba(0, 175, 240, 0.1);">
                <i class="fa-solid fa-gem" style="font-size:3rem; color:#00aff0; margin-bottom:15px;"></i>
                <h2>iTrueMatch GOLD</h2>
                <p>Unlock swipes, see who likes you, and more.</p>
                <button class="ps-btn-white" style="background:#00aff0; color:#fff; margin-top:20px; width:100%;">Subscribe</button>
            </div>
        `);
    }

    // 7. SWIPE CARDS
    SwipeController.init();
}

// ---------------------------------------------------------------------
// SWIPE CONTROLLER
// ---------------------------------------------------------------------
const SwipeController = (() => {
    const candidates = [
        { name: 'Isabella', age: 24, loc: 'Manila', color: '#8e44ad' },
        { name: 'Christian', age: 29, loc: 'Cebu', color: '#2c3e50' },
        { name: 'Natalia', age: 26, loc: 'Davao', color: '#c0392b' }
    ];
    let index = 0;

    function init() {
        index = 0;
        renderCards();
    }

    function renderCards() {
        if (!PS_DOM.swipeStack) return;
        PS_DOM.swipeStack.innerHTML = '';
        
        if(index >= candidates.length) {
            PS_DOM.swipeEmpty.hidden = false;
            PS_DOM.swipeControls.style.display = 'none';
            return;
        } else {
            PS_DOM.swipeEmpty.hidden = true;
            PS_DOM.swipeControls.style.display = 'flex';
        }

        const person = candidates[index];
        const card = document.createElement('div');
        card.className = 'ps-swipe-card';
        card.id = 'psActiveCard';
        card.style.background = `linear-gradient(to bottom, ${person.color}, #000)`;
        
        card.innerHTML = `
            <div class="ps-swipe-card-info">
                <h2 style="margin:0; text-shadow:0 2px 4px #000;">${person.name}, ${person.age}</h2>
                <p style="margin:0; color:#ccc;">📍 ${person.loc}</p>
            </div>
        `;
        PS_DOM.swipeStack.appendChild(card);
    }

    function handleSwipe(action) {
        const card = document.getElementById('psActiveCard');
        if(!card) return;

        if(action === 'like') {
            card.style.transform = 'translateX(150%) rotate(20deg)';
            showToast('Liked!');
        } else if (action === 'super') {
            card.style.transform = 'translateY(-150%)';
            showToast('Super Liked!');
        } else {
            card.style.transform = 'translateX(-150%) rotate(-20deg)';
            showToast('Passed');
        }
        card.style.opacity = '0';

        setTimeout(() => {
            index++;
            renderCards();
        }, 300);
    }

    if(PS_DOM.btnSwipeLike) PS_DOM.btnSwipeLike.addEventListener('click', () => handleSwipe('like'));
    if(PS_DOM.btnSwipePass) PS_DOM.btnSwipePass.addEventListener('click', () => handleSwipe('pass'));
    if(PS_DOM.btnSwipeSuper) PS_DOM.btnSwipeSuper.addEventListener('click', () => handleSwipe('super'));
    if(PS_DOM.btnRefreshSwipe) PS_DOM.btnRefreshSwipe.addEventListener('click', () => init());

    return { init };
})();

// ---------------------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------------------
function initNavigation() {
    PS_DOM.tabs.forEach(tab => {
        if(tab.dataset.panel) {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(tab.dataset.panel);
            });
        }
    });
}

function switchTab(panelName) {
    PS_DOM.tabs.forEach(t => {
        if(t.dataset.panel === panelName) t.classList.add('ps-is-active');
        else t.classList.remove('ps-is-active');
    });

    PS_DOM.panels.forEach(p => {
        if(p.dataset.panel === panelName) {
            p.classList.add('ps-is-active');
            p.style.display = (panelName === 'home') ? 'flex' : 'block';
            window.scrollTo({top:0, behavior:'smooth'});
        } else {
            p.classList.remove('ps-is-active');
            p.style.display = 'none';
        }
    });

    if(PS_DOM.sidebar.classList.contains('ps-is-open')) {
        PS_DOM.sidebar.classList.remove('ps-is-open');
    }
}

// ---------------------------------------------------------------------
// MOBILE MENU
// ---------------------------------------------------------------------
function initMobileMenu() {
    if(PS_DOM.mobileMenuBtn) {
        PS_DOM.mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            PS_DOM.momentsPopup.classList.remove('ps-is-open');
            PS_DOM.sidebar.classList.toggle('ps-is-open');
        });
    }

    if(PS_DOM.mobileMomentsBtn) {
        PS_DOM.mobileMomentsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            PS_DOM.sidebar.classList.remove('ps-is-open');
            PS_DOM.momentsPopup.classList.toggle('ps-is-open');
        });
    }
}

// ---------------------------------------------------------------------
// PARTICLES & STATS
// ---------------------------------------------------------------------
function initCanvasParticles() {
    const canvas = document.getElementById('ps-bg-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, pts = [];

    function resize() { 
        W = canvas.width = window.innerWidth; 
        H = canvas.height = window.innerHeight; 
        pts = []; 
        for(let i=0; i<40; i++) pts.push({
            x:Math.random()*W, y:Math.random()*H, 
            vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5
        }); 
    }

    function loop() { 
        ctx.clearRect(0,0,W,H); 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // White dust, not gold
        pts.forEach(p => { 
            p.x += p.vx; p.y += p.vy; 
            if(p.x<0 || p.x>W) p.vx*=-1; 
            if(p.y<0 || p.y>H) p.vy*=-1; 
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill(); 
        }); 
        requestAnimationFrame(loop); 
    }
    window.addEventListener('resize', resize); 
    resize(); loop();
}

function updateStats(curr, max) {
    if(PS_DOM.countDisplay) PS_DOM.countDisplay.textContent = curr;
    if(PS_DOM.ringCircle) {
        const percent = curr / max;
        PS_DOM.ringCircle.style.strokeDasharray = 251; 
        PS_DOM.ringCircle.style.strokeDashoffset = 251 - (251 * percent);
    }
}