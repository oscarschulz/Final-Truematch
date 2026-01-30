import { DOM } from './dom.js';
import { NOTIFICATIONS_DATA, DEFAULT_AVATAR } from './data.js';

let currentFilter = 'All';

export function initNotifications() {
    
    // 1. Tab Switching Logic
    if (DOM.notifPills.length > 0) {
        DOM.notifPills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Remove active from all
                DOM.notifPills.forEach(p => p.classList.remove('active'));
                // Add active to clicked
                pill.classList.add('active');
                
                currentFilter = pill.innerText.trim();
                renderNotifications();
            });
        });
    }

    // 2. Settings Icon Click
    if (DOM.notifGearBtn) {
        DOM.notifGearBtn.addEventListener('click', () => {
            if(DOM.btnSettingsPop) {
                DOM.btnSettingsPop.click();
            } else {
                console.warn("Settings navigation button not found.");
            }
        });
    }

    // 3. Search Icon Click
    if (DOM.notifSearchBtn && DOM.notifSearchContainer) {
        DOM.notifSearchBtn.addEventListener('click', () => {
            DOM.notifSearchContainer.classList.toggle('hidden');
            if (!DOM.notifSearchContainer.classList.contains('hidden') && DOM.notifSearchInput) {
                setTimeout(() => DOM.notifSearchInput.focus(), 100);
            }
        });
    }

    // 🔥 RENDER ON LOAD
    renderNotifications();
}

function renderNotifications() {
    const container = document.querySelector('.notif-list');
    if (!container) return;

    container.innerHTML = '';

    // Filter Logic (Currently mostly mocking filter behavior since list is empty)
    let filteredList = NOTIFICATIONS_DATA;
    if (currentFilter !== 'All') {
        filteredList = NOTIFICATIONS_DATA.filter(n => n.type === currentFilter);
    }

    // 🔥 EMPTY STATE CHECK
    if (filteredList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding-top: 50px; color: var(--muted); opacity: 0.7;">
                <i class="fa-regular fa-bell-slash" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    // Render Items (If data exists from backend)
    filteredList.forEach(notif => {
        const div = document.createElement('div');
        div.className = 'notif-item'; // Ensure CSS exists for this or use inline styles
        div.style.cssText = "display:flex; gap:15px; padding:15px; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;";
        
        let icon = '';
        switch(notif.type) {
            case 'Like': icon = '<i class="fa-solid fa-heart" style="color:#ff4757;"></i>'; break;
            case 'Comment': icon = '<i class="fa-solid fa-comment" style="color:#64E9EE;"></i>'; break;
            case 'Tip': icon = '<i class="fa-solid fa-sack-dollar" style="color:gold;"></i>'; break;
            default: icon = '<i class="fa-solid fa-bell" style="color:var(--text);"></i>';
        }

        div.innerHTML = `
            <div style="position:relative;">
                <img src="${notif.avatar || DEFAULT_AVATAR}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                <div style="position:absolute; bottom:-5px; right:-5px; background:var(--card-bg); border-radius:50%; padding:2px;">${icon}</div>
            </div>
            <div style="flex:1;">
                <div style="font-size:0.9rem; color:var(--text);">
                    <strong>${notif.user}</strong> ${notif.text}
                </div>
                <div style="font-size:0.8rem; color:var(--muted); margin-top:3px;">${notif.time}</div>
            </div>
        `;
        container.appendChild(div);
    });
}