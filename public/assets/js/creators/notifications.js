import { DOM } from './dom.js';

export function initNotifications() {
    if (DOM.notifPills.length > 0) {
        DOM.notifPills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Remove active from all
                DOM.notifPills.forEach(p => p.classList.remove('active'));
                // Add active to clicked
                pill.classList.add('active');
            });
        });
    }
}